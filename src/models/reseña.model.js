import { obtenerBD } from '../config/db.js';
import { ObjectId } from 'mongodb';
import { esObjectIdValido, convertirAObjectId } from '../utils/helpers.js';
import { VALIDATION_LIMITS } from '../utils/constants.js';

const COLLECTION = 'reseñas';

/**
 * Crea una nueva reseña (usar transacción para actualizar promedio del restaurante)
 * @param {object} reseñaData - Datos de la reseña
 * @param {object} session - Sesión de transacción MongoDB
 * @returns {Promise<object>} - Reseña creada
 */
export async function crearReseña(reseñaData, session = null) {
    const db = obtenerBD();
    const { comentario, calificacion, restauranteId, usuarioId } = reseñaData;
    
    // Validar calificación
    if (calificacion < VALIDATION_LIMITS.RATING_MIN || calificacion > VALIDATION_LIMITS.RATING_MAX) {
        throw new Error(`La calificación debe estar entre ${VALIDATION_LIMITS.RATING_MIN} y ${VALIDATION_LIMITS.RATING_MAX}`);
    }
    
    if (!esObjectIdValido(restauranteId) || !esObjectIdValido(usuarioId)) {
        throw new Error('IDs inválidos');
    }
    
    // Verificar que el restaurante existe y está aprobado
    const restaurante = await db.collection('restaurantes').findOne(
        { _id: convertirAObjectId(restauranteId), aprobado: true },
        session ? { session } : {}
    );
    if (!restaurante) {
        throw new Error('El restaurante especificado no existe o no está aprobado');
    }
    
    // Verificar que el usuario no haya hecho ya una reseña para este restaurante
    const reseñaExistente = await db.collection(COLLECTION).findOne(
        {
            restauranteId: convertirAObjectId(restauranteId),
            usuarioId: convertirAObjectId(usuarioId)
        },
        session ? { session } : {}
    );
    if (reseñaExistente) {
        throw new Error('Ya has creado una reseña para este restaurante');
    }
    
    const nuevaReseña = {
        comentario: comentario || '',
        calificacion,
        restauranteId: convertirAObjectId(restauranteId),
        usuarioId: convertirAObjectId(usuarioId),
        likes: 0,
        dislikes: 0,
        usuariosQueLiked: [],
        usuariosQueDisliked: [],
        fechaCreacion: new Date(),
        fechaActualizacion: new Date()
    };
    
    const opciones = session ? { session } : {};
    const resultado = await db.collection(COLLECTION).insertOne(nuevaReseña, opciones);
    
    return {
        _id: resultado.insertedId,
        ...nuevaReseña
    };
}

/**
 * Obtiene reseñas de un restaurante
 * @param {string} restauranteId - ID del restaurante
 * @param {object} opciones - Opciones de paginación y ordenamiento
 * @returns {Promise<Array>} - Lista de reseñas
 */
export async function obtenerReseñasPorRestaurante(restauranteId, opciones = {}) {
    if (!esObjectIdValido(restauranteId)) {
        throw new Error('ID de restaurante inválido');
    }
    
    const db = obtenerBD();
    const { limite = 50, saltar = 0, ordenarPor = 'fechaCreacion', orden = 'desc' } = opciones;
    
    const sortOptions = {};
    sortOptions[ordenarPor] = orden === 'desc' ? -1 : 1;
    
    // Incluir información del usuario que hizo la reseña
    const reseñas = await db.collection(COLLECTION)
        .aggregate([
            { $match: { restauranteId: convertirAObjectId(restauranteId) } },
            {
                $lookup: {
                    from: 'usuarios',
                    localField: 'usuarioId',
                    foreignField: '_id',
                    as: 'usuario'
                }
            },
            { $unwind: { path: '$usuario', preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    'usuario.password': 0
                }
            },
            { $sort: sortOptions },
            { $limit: limite },
            { $skip: saltar }
        ])
        .toArray();
    
    return reseñas;
}

/**
 * Obtiene todas las reseñas con paginación (para admin)
 * @param {object} opciones - Opciones de paginación y ordenamiento
 * @returns {Promise<Array>} - Lista de reseñas
 */
export async function obtenerTodasLasReseñas(opciones = {}) {
    const db = obtenerBD();
    const { limite = 50, saltar = 0, ordenarPor = 'fechaCreacion', orden = 'desc' } = opciones;
    
    const sortOptions = {};
    sortOptions[ordenarPor] = orden === 'desc' ? -1 : 1;
    
    // Incluir información del usuario y restaurante
    const reseñas = await db.collection(COLLECTION)
        .aggregate([
            {
                $lookup: {
                    from: 'usuarios',
                    localField: 'usuarioId',
                    foreignField: '_id',
                    as: 'usuario'
                }
            },
            { $unwind: { path: '$usuario', preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: 'restaurantes',
                    localField: 'restauranteId',
                    foreignField: '_id',
                    as: 'restaurante'
                }
            },
            { $unwind: { path: '$restaurante', preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    'usuario.password': 0
                }
            },
            { $sort: sortOptions },
            { $limit: limite },
            { $skip: saltar }
        ])
        .toArray();
    
    return reseñas;
}

/**
 * Busca una reseña por ID
 * @param {string} id - ID de la reseña
 * @returns {Promise<object|null>} - Reseña encontrada o null
 */
export async function buscarReseñaPorId(id) {
    if (!esObjectIdValido(id)) {
        return null;
    }
    const db = obtenerBD();
    return await db.collection(COLLECTION).findOne({ _id: convertirAObjectId(id) });
}

/**
 * Actualiza una reseña (transaccional)
 * @param {string} id - ID de la reseña
 * @param {object} datosActualizacion - Datos a actualizar
 * @param {object} session - Sesión de transacción MongoDB
 * @returns {Promise<object|null>} - Reseña actualizada
 */
export async function actualizarReseña(id, datosActualizacion, session = null) {
    if (!esObjectIdValido(id)) {
        throw new Error('ID inválido');
    }
    
    const db = obtenerBD();
    
    // Si se actualiza la calificación, validarla
    if (datosActualizacion.calificacion !== undefined) {
        if (datosActualizacion.calificacion < VALIDATION_LIMITS.RATING_MIN || 
            datosActualizacion.calificacion > VALIDATION_LIMITS.RATING_MAX) {
            throw new Error(`La calificación debe estar entre ${VALIDATION_LIMITS.RATING_MIN} y ${VALIDATION_LIMITS.RATING_MAX}`);
        }
    }
    
    const actualizacion = {
        ...datosActualizacion,
        fechaActualizacion: new Date()
    };
    
    const opciones = {
        returnDocument: 'after'
    };
    
    if (session) {
        opciones.session = session;
    }
    
    const resultado = await db.collection(COLLECTION).findOneAndUpdate(
        { _id: convertirAObjectId(id) },
        { $set: actualizacion },
        opciones
    );
    
    return resultado;
}

/**
 * Da like a una reseña (transaccional)
 * @param {string} reseñaId - ID de la reseña
 * @param {string} usuarioId - ID del usuario que da like
 * @param {object} session - Sesión de transacción MongoDB
 * @returns {Promise<object|null>} - Reseña actualizada
 */
export async function darLike(reseñaId, usuarioId, session = null) {
    if (!esObjectIdValido(reseñaId) || !esObjectIdValido(usuarioId)) {
        throw new Error('IDs inválidos');
    }
    
    const db = obtenerBD();
    const reseñaObjectId = convertirAObjectId(reseñaId);
    const usuarioObjectId = convertirAObjectId(usuarioId);
    
    // Obtener la reseña
    const reseña = await db.collection(COLLECTION).findOne(
        { _id: reseñaObjectId },
        session ? { session } : {}
    );
    
    if (!reseña) {
        throw new Error('Reseña no encontrada');
    }
    
    // Verificar que el usuario no sea el autor
    if (reseña.usuarioId.toString() === usuarioId) {
        throw new Error('No puedes dar like a tu propia reseña');
    }
    
    const opciones = session ? { session } : {};
    
    // Si el usuario ya dio dislike, removerlo y agregar like
    if (reseña.usuariosQueDisliked.some(id => id.toString() === usuarioId)) {
        await db.collection(COLLECTION).updateOne(
            { _id: reseñaObjectId },
            {
                $pull: { usuariosQueDisliked: usuarioObjectId },
                $inc: { dislikes: -1, likes: 1 },
                $push: { usuariosQueLiked: usuarioObjectId },
                $set: { fechaActualizacion: new Date() }
            },
            opciones
        );
    } else if (!reseña.usuariosQueLiked.some(id => id.toString() === usuarioId)) {
        // Si no había dado like antes, agregarlo
        await db.collection(COLLECTION).updateOne(
            { _id: reseñaObjectId },
            {
                $push: { usuariosQueLiked: usuarioObjectId },
                $inc: { likes: 1 },
                $set: { fechaActualizacion: new Date() }
            },
            opciones
        );
    } else {
        // Ya había dado like, removerlo
        await db.collection(COLLECTION).updateOne(
            { _id: reseñaObjectId },
            {
                $pull: { usuariosQueLiked: usuarioObjectId },
                $inc: { likes: -1 },
                $set: { fechaActualizacion: new Date() }
            },
            opciones
        );
    }
    
    return await db.collection(COLLECTION).findOne({ _id: reseñaObjectId }, opciones);
}

/**
 * Da dislike a una reseña (transaccional)
 * @param {string} reseñaId - ID de la reseña
 * @param {string} usuarioId - ID del usuario que da dislike
 * @param {object} session - Sesión de transacción MongoDB
 * @returns {Promise<object|null>} - Reseña actualizada
 */
export async function darDislike(reseñaId, usuarioId, session = null) {
    if (!esObjectIdValido(reseñaId) || !esObjectIdValido(usuarioId)) {
        throw new Error('IDs inválidos');
    }
    
    const db = obtenerBD();
    const reseñaObjectId = convertirAObjectId(reseñaId);
    const usuarioObjectId = convertirAObjectId(usuarioId);
    
    // Obtener la reseña
    const reseña = await db.collection(COLLECTION).findOne(
        { _id: reseñaObjectId },
        session ? { session } : {}
    );
    
    if (!reseña) {
        throw new Error('Reseña no encontrada');
    }
    
    // Verificar que el usuario no sea el autor
    if (reseña.usuarioId.toString() === usuarioId) {
        throw new Error('No puedes dar dislike a tu propia reseña');
    }
    
    const opciones = session ? { session } : {};
    
    // Si el usuario ya dio like, removerlo y agregar dislike
    if (reseña.usuariosQueLiked.some(id => id.toString() === usuarioId)) {
        await db.collection(COLLECTION).updateOne(
            { _id: reseñaObjectId },
            {
                $pull: { usuariosQueLiked: usuarioObjectId },
                $inc: { likes: -1, dislikes: 1 },
                $push: { usuariosQueDisliked: usuarioObjectId },
                $set: { fechaActualizacion: new Date() }
            },
            opciones
        );
    } else if (!reseña.usuariosQueDisliked.some(id => id.toString() === usuarioId)) {
        // Si no había dado dislike antes, agregarlo
        await db.collection(COLLECTION).updateOne(
            { _id: reseñaObjectId },
            {
                $push: { usuariosQueDisliked: usuarioObjectId },
                $inc: { dislikes: 1 },
                $set: { fechaActualizacion: new Date() }
            },
            opciones
        );
    } else {
        // Ya había dado dislike, removerlo
        await db.collection(COLLECTION).updateOne(
            { _id: reseñaObjectId },
            {
                $pull: { usuariosQueDisliked: usuarioObjectId },
                $inc: { dislikes: -1 },
                $set: { fechaActualizacion: new Date() }
            },
            opciones
        );
    }
    
    return await db.collection(COLLECTION).findOne({ _id: reseñaObjectId }, opciones);
}

/**
 * Obtiene estadísticas de reseñas de un restaurante
 * @param {string} restauranteId - ID del restaurante
 * @returns {Promise<object>} - Estadísticas (promedio, total, etc.)
 */
export async function obtenerEstadisticasReseñas(restauranteId) {
    if (!esObjectIdValido(restauranteId)) {
        throw new Error('ID de restaurante inválido');
    }
    
    const db = obtenerBD();
    
    const estadisticas = await db.collection(COLLECTION).aggregate([
        { $match: { restauranteId: convertirAObjectId(restauranteId) } },
        {
            $group: {
                _id: null,
                totalReseñas: { $sum: 1 },
                promedio: { $avg: '$calificacion' },
                totalLikes: { $sum: '$likes' },
                totalDislikes: { $sum: '$dislikes' },
                fechaUltimaReseña: { $max: '$fechaCreacion' }
            }
        }
    ]).toArray();
    
    return estadisticas[0] || {
        totalReseñas: 0,
        promedio: 0,
        totalLikes: 0,
        totalDislikes: 0,
        fechaUltimaReseña: null
    };
}

/**
 * Elimina una reseña (transaccional)
 * @param {string} id - ID de la reseña
 * @param {object} session - Sesión de transacción MongoDB
 * @returns {Promise<boolean>} - True si se eliminó correctamente
 */
export async function eliminarReseña(id, session = null) {
    if (!esObjectIdValido(id)) {
        throw new Error('ID inválido');
    }
    
    const db = obtenerBD();
    const opciones = session ? { session } : {};
    const resultado = await db.collection(COLLECTION).deleteOne(
        { _id: convertirAObjectId(id) },
        opciones
    );
    return resultado.deletedCount > 0;
}

