import {
    crearReseña,
    obtenerReseñasPorRestaurante,
    obtenerTodasLasReseñas,
    buscarReseñaPorId,
    actualizarReseña,
    darLike,
    darDislike,
    eliminarReseña,
    obtenerEstadisticasReseñas
} from '../models/reseña.model.js';
import { actualizarCalificacionPromedio } from '../models/restaurante.model.js';
import { ejecutarTransaccion } from '../services/transacciones.service.js';
import { actualizarRankingRestaurante } from '../services/ranking.service.js';
import { responderExito, responderError, calcularPromedio, convertirAObjectId } from '../utils/helpers.js';
import { obtenerBD } from '../config/db.js';
import { HTTP_STATUS } from '../utils/constants.js';

/**
 * Crear nueva reseña (con transacción)
 */
export const crear = async (req, res) => {
    try {
        const usuarioId = req.usuario._id.toString();
        const { restauranteId, comentario, calificacion } = req.body;
        
        let nuevaReseña;
        
        // Crear reseña y actualizar promedio del restaurante en una transacción
        await ejecutarTransaccion(async (session) => {
            // Crear la reseña
            nuevaReseña = await crearReseña(
                { comentario, calificacion, restauranteId, usuarioId },
                session
            );
            
            // Obtener todas las calificaciones del restaurante para calcular promedio
            const { obtenerBD } = await import('../config/db.js');
            const db = obtenerBD();
            const reseñas = await db.collection('reseñas').find(
                { restauranteId: nuevaReseña.restauranteId },
                { session, projection: { calificacion: 1 } }
            ).toArray();
            
            const calificaciones = reseñas.map(r => r.calificacion);
            const promedio = calcularPromedio(calificaciones);
            
            // Actualizar promedio del restaurante
            await actualizarCalificacionPromedio(
                restauranteId,
                promedio,
                reseñas.length,
                session
            );
        });
        
        // Actualizar ranking del restaurante (fuera de la transacción para no bloquear)
        await actualizarRankingRestaurante(restauranteId);
        
        return responderExito(
            res,
            HTTP_STATUS.CREATED,
            nuevaReseña,
            'Reseña creada exitosamente'
        );
    } catch (error) {
        if (error.message.includes('ya creado')) {
            return responderError(res, HTTP_STATUS.CONFLICT, error.message);
        }
        if (error.message.includes('debe estar entre')) {
            return responderError(res, HTTP_STATUS.BAD_REQUEST, error.message);
        }
        if (error.message.includes('no existe') || error.message.includes('inválido')) {
            return responderError(res, HTTP_STATUS.BAD_REQUEST, error.message);
        }
        return responderError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message);
    }
};

/**
 * Obtener todas las reseñas (para admin)
 */
export const obtenerTodas = async (req, res) => {
    try {
        const { limite = 50, saltar = 0, ordenarPor = 'fechaCreacion', orden = 'desc' } = req.query;
        
        const opciones = {
            limite: parseInt(limite),
            saltar: parseInt(saltar),
            ordenarPor,
            orden
        };
        
        const reseñas = await obtenerTodasLasReseñas(opciones);
        return responderExito(res, HTTP_STATUS.OK, reseñas);
    } catch (error) {
        return responderError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message);
    }
};

/**
 * Obtener reseñas de un restaurante
 */
export const obtenerPorRestaurante = async (req, res) => {
    try {
        const { restauranteId } = req.params;
        const { limite = 50, saltar = 0, ordenarPor = 'fechaCreacion', orden = 'desc' } = req.query;
        
        const opciones = {
            limite: parseInt(limite),
            saltar: parseInt(saltar),
            ordenarPor,
            orden
        };
        
        const db = obtenerBD();
        
        // Contar total de reseñas para paginación
        const totalReseñas = await db.collection('reseñas').countDocuments({
            restauranteId: convertirAObjectId(restauranteId)
        });
        
        // Obtener reseñas
        const reseñas = await obtenerReseñasPorRestaurante(restauranteId, opciones);
        
        // Calcular información de paginación
        const paginaActual = Math.floor(opciones.saltar / opciones.limite) + 1;
        const totalPages = Math.ceil(totalReseñas / opciones.limite);
        
        // Incluir información de reacción del usuario actual si está autenticado
        const usuarioId = req.usuario?._id?.toString();
        if (usuarioId && reseñas.length > 0) {
            const reseñaIds = reseñas.map(r => r._id);
            const reacciones = await db.collection('reseñas').find(
                { 
                    _id: { $in: reseñaIds },
                    $or: [
                        { 'usuariosQueLiked': convertirAObjectId(usuarioId) },
                        { 'usuariosQueDisliked': convertirAObjectId(usuarioId) }
                    ]
                },
                { projection: { _id: 1, usuariosQueLiked: 1, usuariosQueDisliked: 1 } }
            ).toArray();
            
            // Mapear reacciones del usuario
            const reaccionesMap = {};
            reacciones.forEach(r => {
                const hasLiked = r.usuariosQueLiked?.some(id => id.toString() === usuarioId);
                const hasDisliked = r.usuariosQueDisliked?.some(id => id.toString() === usuarioId);
                reaccionesMap[r._id.toString()] = hasLiked ? 'like' : (hasDisliked ? 'dislike' : null);
            });
            
            // Agregar información de reacción a cada reseña
            reseñas.forEach(reseña => {
                reseña.userReaction = reaccionesMap[reseña._id.toString()] || null;
            });
        }
        
        return responderExito(res, HTTP_STATUS.OK, reseñas, null, {
            pagination: {
                page: paginaActual,
                limit: opciones.limite,
                total: totalReseñas,
                totalPages: totalPages,
                hasMore: paginaActual < totalPages
            }
        });
    } catch (error) {
        if (error.message.includes('inválido')) {
            return responderError(res, HTTP_STATUS.BAD_REQUEST, error.message);
        }
        return responderError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message);
    }
};

/**
 * Obtener reseña por ID
 */
export const obtenerPorId = async (req, res) => {
    try {
        const { id } = req.params;
        const reseña = await buscarReseñaPorId(id);
        
        if (!reseña) {
            return responderError(res, HTTP_STATUS.NOT_FOUND, 'Reseña no encontrada');
        }
        
        return responderExito(res, HTTP_STATUS.OK, reseña);
    } catch (error) {
        return responderError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message);
    }
};

/**
 * Actualizar reseña (con transacción si se actualiza la calificación)
 */
export const actualizar = async (req, res) => {
    try {
        const { id } = req.params;
        const usuarioId = req.usuario._id.toString();
        
        // Verificar que la reseña pertenece al usuario
        const reseña = await buscarReseñaPorId(id);
        if (!reseña) {
            return responderError(res, HTTP_STATUS.NOT_FOUND, 'Reseña no encontrada');
        }
        
        if (reseña.usuarioId.toString() !== usuarioId && req.usuario.rol !== 'admin') {
            return responderError(res, HTTP_STATUS.FORBIDDEN, 'No puedes editar esta reseña');
        }
        
        const restauranteId = reseña.restauranteId.toString();
        const seActualizoCalificacion = req.body.calificacion && 
                                        req.body.calificacion !== reseña.calificacion;
        
        let reseñaActualizada;
        
        // Si se actualiza la calificación, usar transacción
        if (seActualizoCalificacion) {
            await ejecutarTransaccion(async (session) => {
                // Actualizar la reseña
                reseñaActualizada = await actualizarReseña(id, req.body, session);
                
                // Obtener todas las calificaciones del restaurante
                const db = obtenerBD();
                const reseñas = await db.collection('reseñas').find(
                    { restauranteId: reseña.restauranteId },
                    { session, projection: { calificacion: 1 } }
                ).toArray();
                
                const calificaciones = reseñas.map(r => r.calificacion);
                const promedio = calcularPromedio(calificaciones);
                
                // Actualizar promedio del restaurante
                await actualizarCalificacionPromedio(
                    restauranteId,
                    promedio,
                    reseñas.length,
                    session
                );
            });
        } else {
            // Si no se actualiza calificación, actualizar sin transacción
            reseñaActualizada = await actualizarReseña(id, req.body);
        }
        
        // Actualizar ranking del restaurante (fuera de la transacción)
        if (seActualizoCalificacion) {
            await actualizarRankingRestaurante(restauranteId);
        }
        
        return responderExito(
            res,
            HTTP_STATUS.OK,
            reseñaActualizada,
            'Reseña actualizada exitosamente'
        );
    } catch (error) {
        if (error.message.includes('debe estar entre')) {
            return responderError(res, HTTP_STATUS.BAD_REQUEST, error.message);
        }
        return responderError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message);
    }
};

/**
 * Dar like a una reseña (transaccional)
 */
export const like = async (req, res) => {
    try {
        const { id } = req.params;
        const usuarioId = req.usuario._id.toString();
        
        let reseñaActualizada;
        
        await ejecutarTransaccion(async (session) => {
            reseñaActualizada = await darLike(id, usuarioId, session);
        });
        
        // Actualizar ranking del restaurante
        await actualizarRankingRestaurante(reseñaActualizada.restauranteId.toString());
        
        return responderExito(
            res,
            HTTP_STATUS.OK,
            reseñaActualizada,
            'Like registrado exitosamente'
        );
    } catch (error) {
        if (error.message.includes('propia reseña')) {
            return responderError(res, HTTP_STATUS.FORBIDDEN, error.message);
        }
        if (error.message.includes('inválido') || error.message.includes('no encontrada')) {
            return responderError(res, HTTP_STATUS.BAD_REQUEST, error.message);
        }
        return responderError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message);
    }
};

/**
 * Dar dislike a una reseña (transaccional)
 */
export const dislike = async (req, res) => {
    try {
        const { id } = req.params;
        const usuarioId = req.usuario._id.toString();
        
        let reseñaActualizada;
        
        await ejecutarTransaccion(async (session) => {
            reseñaActualizada = await darDislike(id, usuarioId, session);
        });
        
        // Actualizar ranking del restaurante
        await actualizarRankingRestaurante(reseñaActualizada.restauranteId.toString());
        
        return responderExito(
            res,
            HTTP_STATUS.OK,
            reseñaActualizada,
            'Dislike registrado exitosamente'
        );
    } catch (error) {
        if (error.message.includes('propia reseña')) {
            return responderError(res, HTTP_STATUS.FORBIDDEN, error.message);
        }
        if (error.message.includes('inválido') || error.message.includes('no encontrada')) {
            return responderError(res, HTTP_STATUS.BAD_REQUEST, error.message);
        }
        return responderError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message);
    }
};

/**
 * Eliminar reseña (con transacción para actualizar promedio)
 */
export const eliminar = async (req, res) => {
    try {
        const { id } = req.params;
        const usuarioId = req.usuario._id.toString();
        
        // Verificar que la reseña pertenece al usuario
        const reseña = await buscarReseñaPorId(id);
        if (!reseña) {
            return responderError(res, HTTP_STATUS.NOT_FOUND, 'Reseña no encontrada');
        }
        
        if (reseña.usuarioId.toString() !== usuarioId && req.usuario.rol !== 'admin') {
            return responderError(res, HTTP_STATUS.FORBIDDEN, 'No puedes eliminar esta reseña');
        }
        
        const restauranteId = reseña.restauranteId.toString();
        
        // Eliminar reseña y actualizar promedio en una transacción
        await ejecutarTransaccion(async (session) => {
            // Eliminar la reseña
            const eliminada = await eliminarReseña(id, session);
            
            if (!eliminada) {
                throw new Error('No se pudo eliminar la reseña');
            }
            
            // Obtener todas las calificaciones restantes del restaurante
            const db = obtenerBD();
            const reseñas = await db.collection('reseñas').find(
                { restauranteId: reseña.restauranteId },
                { session, projection: { calificacion: 1 } }
            ).toArray();
            
            const calificaciones = reseñas.map(r => r.calificacion);
            const promedio = calificaciones.length > 0 
                ? calcularPromedio(calificaciones) 
                : 0;
            
            // Actualizar promedio del restaurante
            await actualizarCalificacionPromedio(
                restauranteId,
                promedio,
                reseñas.length,
                session
            );
        });
        
        // Actualizar ranking del restaurante (fuera de la transacción)
        await actualizarRankingRestaurante(restauranteId);
        
        return responderExito(res, HTTP_STATUS.NO_CONTENT, null, 'Reseña eliminada exitosamente');
    } catch (error) {
        if (error.message.includes('no encontrada') || error.message.includes('pudo eliminar')) {
            return responderError(res, HTTP_STATUS.NOT_FOUND, error.message);
        }
        return responderError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message);
    }
};

