// Importa las funciones del modelo de reseñas
// Estas funciones manejan las operaciones CRUD (Create, Read, Update, Delete) con las reseñas en la base de datos
import {
    crearReseña,  // Función para crear una nueva reseña
    obtenerReseñasPorRestaurante,  // Función para obtener reseñas de un restaurante
    obtenerTodasLasReseñas,  // Función para obtener todas las reseñas (admin)
    buscarReseñaPorId,  // Función para buscar una reseña por su ID
    actualizarReseña,  // Función para actualizar una reseña existente
    darLike,  // Función para dar like a una reseña
    darDislike,  // Función para dar dislike a una reseña
    eliminarReseña,  // Función para eliminar una reseña
    obtenerEstadisticasReseñas  // Función para obtener estadísticas de reseñas
} from '../models/reseña.model.js';
// Importa la función del modelo de restaurantes para actualizar el promedio de calificaciones
import { actualizarCalificacionPromedio } from '../models/restaurante.model.js';
// Importa el servicio de transacciones para ejecutar operaciones atómicas
import { ejecutarTransaccion } from '../services/transacciones.service.js';
// Importa el servicio de ranking para actualizar el ranking del restaurante
import { actualizarRankingRestaurante } from '../services/ranking.service.js';
// Importa funciones helper para utilidades
// responderExito: envía respuestas exitosas con formato estándar
// responderError: envía respuestas de error con formato estándar
// calcularPromedio: calcula el promedio de un array de números
// convertirAObjectId: convierte un string a ObjectId de MongoDB
import { responderExito, responderError, calcularPromedio, convertirAObjectId } from '../utils/helpers.js';
// Importa la función para obtener la referencia a la base de datos
import { obtenerBD } from '../config/db.js';
// Importa constantes desde el módulo de constants
// HTTP_STATUS: códigos de estado HTTP (200, 201, 404, etc.)
import { HTTP_STATUS } from '../utils/constants.js';

/**
 * Crear nueva reseña (con transacción)
 */
// Controlador exportado que maneja la creación de una nueva reseña
// Esta función se ejecuta cuando se recibe una petición POST para crear una reseña
// Utiliza transacciones para garantizar que la reseña y el promedio del restaurante se actualicen atómicamente
// Parámetros: req (request con datos en req.body y usuario autenticado en req.usuario), res (response para enviar la respuesta)
export const crear = async (req, res) => {
    try {
        // Obtiene el ID del usuario autenticado desde req.usuario (establecido por el middleware de autenticación)
        const usuarioId = req.usuario._id.toString();
        // Extrae los datos de la reseña del cuerpo de la petición
        const { restauranteId, comentario, calificacion } = req.body;
        
        // Variable para almacenar la reseña creada
        let nuevaReseña; 
        
        // Crear reseña y actualizar promedio del restaurante en una transacción
        // ejecutarTransaccion ejecuta todas las operaciones en una transacción atómica
        // Si cualquier operación falla, todas se revierten (rollback)
        await ejecutarTransaccion(async (session) => {
            // Crear la reseña
            // session se pasa para que la operación forme parte de la transacción
            nuevaReseña = await crearReseña(
                { comentario, calificacion, restauranteId, usuarioId },
                session
            );
            
            // Obtener todas las calificaciones del restaurante para calcular promedio
            // Importa dinámicamente obtenerBD (aunque ya está importado arriba, esto asegura que funcione)
            const { obtenerBD } = await import('../config/db.js');
            const db = obtenerBD();
            // Busca todas las reseñas del restaurante (incluyendo la nueva)
            // projection: { calificacion: 1 } solo trae el campo calificacion para eficiencia
            const reseñas = await db.collection('reseñas').find(
                { restauranteId: nuevaReseña.restauranteId },
                { session, projection: { calificacion: 1 } }
            ).toArray();
            
            // Extrae solo las calificaciones (números) del array de reseñas
            const calificaciones = reseñas.map(r => r.calificacion);
            // Calcula el promedio de todas las calificaciones
            const promedio = calcularPromedio(calificaciones);
            
            // Actualizar promedio del restaurante
            // Actualiza el promedio y el total de reseñas del restaurante
            // session se pasa para que la operación forme parte de la transacción
            await actualizarCalificacionPromedio(
                restauranteId,
                promedio,
                reseñas.length,  // Total de reseñas
                session
            );
        });
        
        // Actualizar ranking del restaurante (fuera de la transacción para no bloquear)
        // Esta operación se hace fuera de la transacción porque puede ser más lenta
        // y no necesita ser atómica con la creación de la reseña
        await actualizarRankingRestaurante(restauranteId);
        
        // Retorna una respuesta exitosa con código 201 (CREATED)
        return responderExito(
            res,
            HTTP_STATUS.CREATED,  // Código 201: recurso creado exitosamente
            nuevaReseña,  // Datos de la reseña creada
            'Reseña creada exitosamente'  // Mensaje de confirmación
        );
    } catch (error) {
        // Maneja errores específicos
        // Si el error indica que el usuario ya creó una reseña para este restaurante
        if (error.message.includes('ya creado')) {
            // Retorna error 409 (Conflict) para indicar duplicado
            return responderError(res, HTTP_STATUS.CONFLICT, error.message);
        }
        // Si el error indica que la calificación está fuera del rango permitido
        if (error.message.includes('debe estar entre')) {
            // Retorna error 400 (Bad Request)
            return responderError(res, HTTP_STATUS.BAD_REQUEST, error.message);
        }
        // Si el error indica que el restaurante no existe o el ID es inválido
        if (error.message.includes('no existe') || error.message.includes('inválido')) {
            // Retorna error 400 (Bad Request)
            return responderError(res, HTTP_STATUS.BAD_REQUEST, error.message);
        }
        // Para cualquier otro error, retorna error 500 (Internal Server Error)
        return responderError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message);
    }
};

/**
 * Obtener todas las reseñas (para admin)
 */
// Controlador exportado que maneja la obtención de todas las reseñas del sistema (solo para administradores)
// Esta función se ejecuta cuando se recibe una petición GET para listar todas las reseñas
// Parámetros: req (request con opciones de paginación en req.query), res (response para enviar la respuesta)
export const obtenerTodas = async (req, res) => {
    try {
        // Extrae las opciones de paginación y ordenamiento desde la query string de la URL
        // limite: número máximo de resultados (default 50)
        // saltar: número de resultados a omitir para paginación (default 0)
        // ordenarPor: campo por el cual ordenar (default 'fechaCreacion')
        // orden: dirección del ordenamiento 'desc' o 'asc' (default 'desc')
        const { limite = 50, saltar = 0, ordenarPor = 'fechaCreacion', orden = 'desc' } = req.query;
        
        // Prepara las opciones para la consulta
        const opciones = {
            limite: parseInt(limite),  // Convierte el string a número entero
            saltar: parseInt(saltar),  // Convierte el string a número entero
            ordenarPor,  // Campo por el cual ordenar
            orden  // Dirección del ordenamiento
        };
        
        // Llama a la función del modelo para obtener todas las reseñas con paginación
        // Incluye información del usuario y restaurante para cada reseña
        const reseñas = await obtenerTodasLasReseñas(opciones);
        // Retorna una respuesta exitosa con código 200 (OK) y la lista de reseñas
        return responderExito(res, HTTP_STATUS.OK, reseñas);
    } catch (error) {
        // Si ocurre un error, retorna error 500 (Internal Server Error)
        return responderError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message);
    }
};

/**
 * Obtener reseñas de un restaurante
 */
// Controlador exportado que maneja la obtención de reseñas de un restaurante específico
// Esta función se ejecuta cuando se recibe una petición GET para listar reseñas de un restaurante
// Incluye información de paginación y reacciones del usuario autenticado (si está logueado)
// Parámetros: req (request con restauranteId en req.params y opciones en req.query), res (response para enviar la respuesta)
export const obtenerPorRestaurante = async (req, res) => {
    try {
        // Extrae el restauranteId de los parámetros de la URL
        // Si la ruta es /restaurantes/:restauranteId/reseñas, el ID viene en req.params.restauranteId
        const { restauranteId } = req.params;
        // Extrae las opciones de paginación y ordenamiento desde la query string
        // limite: número máximo de resultados (default 50)
        // saltar: número de resultados a omitir para paginación (default 0)
        // ordenarPor: campo por el cual ordenar (default 'fechaCreacion')
        // orden: dirección del ordenamiento 'desc' o 'asc' (default 'desc')
        const { limite = 50, saltar = 0, ordenarPor = 'fechaCreacion', orden = 'desc' } = req.query;
        
        // Prepara las opciones para la consulta
        const opciones = {
            limite: parseInt(limite),  // Convierte el string a número entero
            saltar: parseInt(saltar),  // Convierte el string a número entero
            ordenarPor,  // Campo por el cual ordenar
            orden  // Dirección del ordenamiento
        };
        
        // Obtiene la referencia a la base de datos MongoDB
        const db = obtenerBD();
        
        // Contar total de reseñas para paginación
        // countDocuments() cuenta cuántas reseñas tiene el restaurante
        // Esto se usa para calcular información de paginación (total de páginas, etc.)
        const totalReseñas = await db.collection('reseñas').countDocuments({
            restauranteId: convertirAObjectId(restauranteId)  // Convierte el ID a ObjectId para la consulta
        });
        
        // Obtener reseñas
        // Llama a la función del modelo para obtener las reseñas con paginación
        // Incluye información del usuario que hizo cada reseña
        const reseñas = await obtenerReseñasPorRestaurante(restauranteId, opciones);
        
        // Calcular información de paginación
        // Calcula la página actual basándose en cuántos resultados se han saltado
        const paginaActual = Math.floor(opciones.saltar / opciones.limite) + 1;
        // Calcula el total de páginas basándose en el total de reseñas y el límite por página
        const totalPages = Math.ceil(totalReseñas / opciones.limite);
        
        // Incluir información de reacción del usuario actual si está autenticado
        // Si el usuario está autenticado, verifica qué reseñas le gustaron o no le gustaron
        // req.usuario?. puede ser undefined si no está autenticado (optional chaining)
        const usuarioId = req.usuario?._id?.toString();
        // Solo busca reacciones si hay un usuario autenticado y hay reseñas
        if (usuarioId && reseñas.length > 0) {
            // Extrae los IDs de todas las reseñas obtenidas
            const reseñaIds = reseñas.map(r => r._id);
            // Busca las reseñas donde el usuario dio like o dislike
            // $in: busca reseñas cuyo _id esté en el array reseñaIds
            // $or: busca reseñas donde el usuario está en usuariosQueLiked O usuariosQueDisliked
            const reacciones = await db.collection('reseñas').find(
                { 
                    _id: { $in: reseñaIds },  // Solo reseñas que están en la lista actual
                    $or: [
                        { 'usuariosQueLiked': convertirAObjectId(usuarioId) },  // Usuario dio like
                        { 'usuariosQueDisliked': convertirAObjectId(usuarioId) }  // Usuario dio dislike
                    ]
                },
                { projection: { _id: 1, usuariosQueLiked: 1, usuariosQueDisliked: 1 } }  // Solo trae estos campos
            ).toArray();
            
            // Mapear reacciones del usuario
            // Crea un objeto que mapea cada ID de reseña a la reacción del usuario ('like', 'dislike', o null)
            const reaccionesMap = {};
            reacciones.forEach(r => {
                // Verifica si el usuario está en la lista de usuarios que dieron like
                const hasLiked = r.usuariosQueLiked?.some(id => id.toString() === usuarioId);
                // Verifica si el usuario está en la lista de usuarios que dieron dislike
                const hasDisliked = r.usuariosQueDisliked?.some(id => id.toString() === usuarioId);
                // Mapea la reseña a 'like' si dio like, 'dislike' si dio dislike, o null si no reaccionó
                reaccionesMap[r._id.toString()] = hasLiked ? 'like' : (hasDisliked ? 'dislike' : null);
            });
            
            // Agregar información de reacción a cada reseña
            // Agrega el campo userReaction a cada reseña para que el frontend sepa si el usuario reaccionó
            reseñas.forEach(reseña => {
                reseña.userReaction = reaccionesMap[reseña._id.toString()] || null;
            });
        }
        
        // Retorna una respuesta exitosa con código 200 (OK)
        // Incluye las reseñas y metadatos de paginación
        return responderExito(res, HTTP_STATUS.OK, reseñas, null, {
            pagination: {
                page: paginaActual,  // Página actual
                limit: opciones.limite,  // Límite de resultados por página
                total: totalReseñas,  // Total de reseñas
                totalPages: totalPages,  // Total de páginas
                hasMore: paginaActual < totalPages  // Si hay más páginas
            }
        });
    } catch (error) {
        // Maneja errores específicos
        // Si el error indica que el restauranteId es inválido
        if (error.message.includes('inválido')) {
            // Retorna error 400 (Bad Request)
            return responderError(res, HTTP_STATUS.BAD_REQUEST, error.message);
        }
        // Para cualquier otro error, retorna error 500 (Internal Server Error)
        return responderError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message);
    }
};

/**
 * Obtener reseña por ID
 */
// Controlador exportado que maneja la obtención de una reseña específica por su ID
// Esta función se ejecuta cuando se recibe una petición GET con un ID en la URL
// Parámetros: req (request con id en req.params), res (response para enviar la respuesta)
export const obtenerPorId = async (req, res) => {
    try {
        // Extrae el ID de los parámetros de la URL
        // Si la ruta es /reseñas/:id, el ID viene en req.params.id
        const { id } = req.params;
        // Llama a la función del modelo para buscar la reseña por ID
        const reseña = await buscarReseñaPorId(id);
        
        // Si no se encontró la reseña, retorna error 404 (Not Found)
        if (!reseña) {
            return responderError(res, HTTP_STATUS.NOT_FOUND, 'Reseña no encontrada');
        }
        
        // Si se encontró, retorna una respuesta exitosa con código 200 (OK) y los datos de la reseña
        return responderExito(res, HTTP_STATUS.OK, reseña);
    } catch (error) {
        // Si ocurre un error, retorna error 500 (Internal Server Error)
        return responderError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message);
    }
};

/**
 * Actualizar reseña (con transacción si se actualiza la calificación)
 */
// Controlador exportado que maneja la actualización de una reseña existente
// Esta función se ejecuta cuando se recibe una petición PUT o PATCH para actualizar una reseña
// Usa transacciones solo si se actualiza la calificación (para actualizar el promedio del restaurante)
// Parámetros: req (request con id en req.params y datos en req.body), res (response para enviar la respuesta)
export const actualizar = async (req, res) => {
    try {
        // Extrae el ID de los parámetros de la URL
        const { id } = req.params;
        // Obtiene el ID del usuario autenticado desde req.usuario
        const usuarioId = req.usuario._id.toString();
        
        // Verificar que la reseña pertenece al usuario
        // Busca la reseña para verificar permisos y obtener el restauranteId
        const reseña = await buscarReseñaPorId(id);
        // Si no se encontró la reseña, retorna error 404 (Not Found)
        if (!reseña) {
            return responderError(res, HTTP_STATUS.NOT_FOUND, 'Reseña no encontrada');
        }
        
        // Verifica que el usuario sea el dueño de la reseña o un administrador
        // Si el usuario no es el dueño ni admin, retorna error 403 (Forbidden)
        if (reseña.usuarioId.toString() !== usuarioId && req.usuario.rol !== 'admin') {
            return responderError(res, HTTP_STATUS.FORBIDDEN, 'No puedes editar esta reseña');
        }
        
        // Obtiene el ID del restaurante de la reseña
        const restauranteId = reseña.restauranteId.toString();
        // Verifica si se está actualizando la calificación
        // Se actualiza la calificación si se proporciona en req.body y es diferente a la actual
        const seActualizoCalificacion = req.body.calificacion && 
                                        req.body.calificacion !== reseña.calificacion;
        
        // Variable para almacenar la reseña actualizada
        let reseñaActualizada;
        
        // Si se actualiza la calificación, usar transacción
        // Necesita transacción para actualizar atómicamente la reseña y el promedio del restaurante
        if (seActualizoCalificacion) {
            // Ejecuta todas las operaciones en una transacción atómica
            await ejecutarTransaccion(async (session) => {
                // Actualizar la reseña
                // session se pasa para que la operación forme parte de la transacción
                reseñaActualizada = await actualizarReseña(id, req.body, session);
                
                // Obtener todas las calificaciones del restaurante
                // Necesario para recalcular el promedio después de actualizar la calificación
                const db = obtenerBD();
                const reseñas = await db.collection('reseñas').find(
                    { restauranteId: reseña.restauranteId },
                    { session, projection: { calificacion: 1 } }  // Solo trae el campo calificacion
                ).toArray();
                
                // Extrae solo las calificaciones (números) del array de reseñas
                const calificaciones = reseñas.map(r => r.calificacion);
                // Calcula el promedio de todas las calificaciones
                const promedio = calcularPromedio(calificaciones);
                
                // Actualizar promedio del restaurante
                // Actualiza el promedio y el total de reseñas del restaurante en la transacción
                await actualizarCalificacionPromedio(
                    restauranteId,
                    promedio,
                    reseñas.length,  // Total de reseñas
                    session
                );
            });
        } else {
            // Si no se actualiza calificación, actualizar sin transacción
            // No necesita transacción porque no afecta el promedio del restaurante
            reseñaActualizada = await actualizarReseña(id, req.body);
        }
        
        // Actualizar ranking del restaurante (fuera de la transacción)
        // Solo actualiza el ranking si se cambió la calificación
        // Se hace fuera de la transacción porque puede ser más lento y no necesita ser atómico
        if (seActualizoCalificacion) {
            await actualizarRankingRestaurante(restauranteId);
        }
        
        // Retorna una respuesta exitosa con código 200 (OK)
        return responderExito(
            res,
            HTTP_STATUS.OK,
            reseñaActualizada,  // Datos de la reseña actualizada
            'Reseña actualizada exitosamente'  // Mensaje de confirmación
        );
    } catch (error) {
        // Maneja errores específicos
        // Si el error indica que la calificación está fuera del rango permitido
        if (error.message.includes('debe estar entre')) {
            // Retorna error 400 (Bad Request)
            return responderError(res, HTTP_STATUS.BAD_REQUEST, error.message);
        }
        // Para cualquier otro error, retorna error 500 (Internal Server Error)
        return responderError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message);
    }
};

/**
 * Dar like a una reseña (transaccional)
 */
// Controlador exportado que maneja dar like a una reseña
// Esta función se ejecuta cuando se recibe una petición POST/PUT para dar like a una reseña
// Utiliza transacciones para garantizar que la actualización de likes sea atómica
// Parámetros: req (request con id en req.params y usuario autenticado en req.usuario), res (response para enviar la respuesta)
export const like = async (req, res) => {
    try {
        // Extrae el ID de la reseña de los parámetros de la URL
        const { id } = req.params;
        // Obtiene el ID del usuario autenticado desde req.usuario
        const usuarioId = req.usuario._id.toString();
        
        // Variable para almacenar la reseña actualizada
        let reseñaActualizada;
        
        // Ejecuta la operación de like en una transacción atómica
        // Si el usuario ya dio like, lo quita (toggle); si no, lo agrega
        await ejecutarTransaccion(async (session) => {
            // darLike actualiza los contadores y arrays de likes de forma atómica
            reseñaActualizada = await darLike(id, usuarioId, session);
        });
        
        // Actualizar ranking del restaurante
        // Se actualiza después de la transacción porque puede afectar el ranking
        // Se hace fuera de la transacción para no bloquear
        await actualizarRankingRestaurante(reseñaActualizada.restauranteId.toString());
        
        // Retorna una respuesta exitosa con código 200 (OK)
        return responderExito(
            res,
            HTTP_STATUS.OK,
            reseñaActualizada,  // Datos de la reseña actualizada con los nuevos likes
            'Like registrado exitosamente'  // Mensaje de confirmación
        );
    } catch (error) {
        // Maneja errores específicos
        // Si el error indica que el usuario intenta dar like a su propia reseña
        if (error.message.includes('propia reseña')) {
            // Retorna error 403 (Forbidden) porque no se puede dar like a la propia reseña
            return responderError(res, HTTP_STATUS.FORBIDDEN, error.message);
        }
        // Si el error indica ID inválido o reseña no encontrada
        if (error.message.includes('inválido') || error.message.includes('no encontrada')) {
            // Retorna error 400 (Bad Request)
            return responderError(res, HTTP_STATUS.BAD_REQUEST, error.message);
        }
        // Para cualquier otro error, retorna error 500 (Internal Server Error)
        return responderError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message);
    }
};

/**
 * Dar dislike a una reseña (transaccional)
 */
// Controlador exportado que maneja dar dislike a una reseña
// Esta función se ejecuta cuando se recibe una petición POST/PUT para dar dislike a una reseña
// Utiliza transacciones para garantizar que la actualización de dislikes sea atómica
// Parámetros: req (request con id en req.params y usuario autenticado en req.usuario), res (response para enviar la respuesta)
export const dislike = async (req, res) => {
    try {
        // Extrae el ID de la reseña de los parámetros de la URL
        const { id } = req.params;
        // Obtiene el ID del usuario autenticado desde req.usuario
        const usuarioId = req.usuario._id.toString();
        
        // Variable para almacenar la reseña actualizada
        let reseñaActualizada;
        
        // Ejecuta la operación de dislike en una transacción atómica
        // Si el usuario ya dio dislike, lo quita (toggle); si no, lo agrega
        await ejecutarTransaccion(async (session) => {
            // darDislike actualiza los contadores y arrays de dislikes de forma atómica
            reseñaActualizada = await darDislike(id, usuarioId, session);
        });
        
        // Actualizar ranking del restaurante
        // Se actualiza después de la transacción porque puede afectar el ranking
        // Se hace fuera de la transacción para no bloquear
        await actualizarRankingRestaurante(reseñaActualizada.restauranteId.toString());
        
        // Retorna una respuesta exitosa con código 200 (OK)
        return responderExito(
            res,
            HTTP_STATUS.OK,
            reseñaActualizada,  // Datos de la reseña actualizada con los nuevos dislikes
            'Dislike registrado exitosamente'  // Mensaje de confirmación
        );
    } catch (error) {
        // Maneja errores específicos
        // Si el error indica que el usuario intenta dar dislike a su propia reseña
        if (error.message.includes('propia reseña')) {
            // Retorna error 403 (Forbidden) porque no se puede dar dislike a la propia reseña
            return responderError(res, HTTP_STATUS.FORBIDDEN, error.message);
        }
        // Si el error indica ID inválido o reseña no encontrada
        if (error.message.includes('inválido') || error.message.includes('no encontrada')) {
            // Retorna error 400 (Bad Request)
            return responderError(res, HTTP_STATUS.BAD_REQUEST, error.message);
        }
        // Para cualquier otro error, retorna error 500 (Internal Server Error)
        return responderError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message);
    }
};

/**
 * Eliminar reseña (con transacción para actualizar promedio)
 */
// Controlador exportado que maneja la eliminación de una reseña
// Esta función se ejecuta cuando se recibe una petición DELETE para eliminar una reseña
// Utiliza transacciones para garantizar que la eliminación y la actualización del promedio sean atómicas
// Parámetros: req (request con id en req.params y usuario autenticado en req.usuario), res (response para enviar la respuesta)
export const eliminar = async (req, res) => {
    try {
        // Extrae el ID de la reseña de los parámetros de la URL
        const { id } = req.params;
        // Obtiene el ID del usuario autenticado desde req.usuario
        const usuarioId = req.usuario._id.toString();
        
        // Verificar que la reseña pertenece al usuario
        // Busca la reseña para verificar permisos y obtener el restauranteId
        const reseña = await buscarReseñaPorId(id);
        // Si no se encontró la reseña, retorna error 404 (Not Found)
        if (!reseña) {
            return responderError(res, HTTP_STATUS.NOT_FOUND, 'Reseña no encontrada');
        }
        
        // Verifica que el usuario sea el dueño de la reseña o un administrador
        // Si el usuario no es el dueño ni admin, retorna error 403 (Forbidden)
        if (reseña.usuarioId.toString() !== usuarioId && req.usuario.rol !== 'admin') {
            return responderError(res, HTTP_STATUS.FORBIDDEN, 'No puedes eliminar esta reseña');
        }
        
        // Obtiene el ID del restaurante de la reseña
        const restauranteId = reseña.restauranteId.toString();
        
        // Eliminar reseña y actualizar promedio en una transacción
        // Ejecuta todas las operaciones en una transacción atómica
        await ejecutarTransaccion(async (session) => {
            // Eliminar la reseña
            // session se pasa para que la operación forme parte de la transacción
            const eliminada = await eliminarReseña(id, session);
            
            // Si no se pudo eliminar, lanza un error para hacer rollback de la transacción
            if (!eliminada) {
                throw new Error('No se pudo eliminar la reseña');
            }
            
            // Obtener todas las calificaciones restantes del restaurante
            // Necesario para recalcular el promedio después de eliminar la reseña
            const db = obtenerBD();
            const reseñas = await db.collection('reseñas').find(
                { restauranteId: reseña.restauranteId },
                { session, projection: { calificacion: 1 } }  // Solo trae el campo calificacion
            ).toArray();
            
            // Extrae solo las calificaciones (números) del array de reseñas restantes
            const calificaciones = reseñas.map(r => r.calificacion);
            // Calcula el promedio: si no hay reseñas, el promedio es 0; sino calcula el promedio
            const promedio = calificaciones.length > 0 
                ? calcularPromedio(calificaciones) 
                : 0;
            
            // Actualizar promedio del restaurante
            // Actualiza el promedio y el total de reseñas del restaurante en la transacción
            await actualizarCalificacionPromedio(
                restauranteId,
                promedio,
                reseñas.length,  // Total de reseñas restantes
                session
            );
        });
        
        // Actualizar ranking del restaurante (fuera de la transacción)
        // Se actualiza después de la transacción porque puede afectar el ranking
        // Se hace fuera de la transacción para no bloquear
        await actualizarRankingRestaurante(restauranteId);
        
        // Retorna una respuesta exitosa con código 204 (NO_CONTENT)
        // 204 No Content significa que la operación fue exitosa pero no hay contenido que retornar
        return responderExito(res, HTTP_STATUS.NO_CONTENT, null, 'Reseña eliminada exitosamente');
    } catch (error) {
        // Maneja errores específicos
        // Si el error indica que la reseña no se encontró o no se pudo eliminar
        if (error.message.includes('no encontrada') || error.message.includes('pudo eliminar')) {
            // Retorna error 404 (Not Found)
            return responderError(res, HTTP_STATUS.NOT_FOUND, error.message);
        }
        // Para cualquier otro error, retorna error 500 (Internal Server Error)
        return responderError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message);
    }
};