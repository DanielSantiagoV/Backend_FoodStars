// Importa la función obtenerBD desde el módulo de configuración de base de datos
// obtenerBD retorna la referencia a la base de datos MongoDB para realizar operaciones
import { obtenerBD } from '../config/db.js';
// Importa funciones helper para validar y convertir ObjectIds
// esObjectIdValido: verifica si un string es un ObjectId válido
// convertirAObjectId: convierte un string a ObjectId para usar en consultas
import { esObjectIdValido, convertirAObjectId } from '../utils/helpers.js';

// Define el nombre de la colección en MongoDB donde se almacenan las notificaciones
// Esta constante evita errores de tipeo y facilita el mantenimiento
const COLLECTION = 'notificaciones';

/**
 * Crea una nueva notificación
 * @param {object} notificacionData - Datos de la notificación
 * @param {object} session - Sesión de transacción MongoDB (opcional)
 * @returns {Promise<object>} - Notificación creada
 */
// Función asíncrona exportada que crea una nueva notificación en la base de datos
// Parámetros:
//   notificacionData - objeto con los datos de la notificación (usuarioId, tipo, mensaje, restauranteId, reseñaId)
//   session - sesión de transacción MongoDB opcional para operaciones atómicas
// Retorna: Promise que se resuelve con el objeto de la notificación creada incluyendo su _id
export async function crearNotificacion(notificacionData, session = null) {
    // Obtiene la referencia a la base de datos MongoDB
    const db = obtenerBD();
    // Extrae los campos del objeto notificacionData usando destructuring
    const { usuarioId, tipo, mensaje, restauranteId, reseñaId } = notificacionData;
    
    // Valida que usuarioId tenga el formato correcto de ObjectId
    if (!esObjectIdValido(usuarioId)) {
        throw new Error('ID de usuario inválido');
    }
    
    // Crea el objeto de la nueva notificación con los datos proporcionados
    const nuevaNotificacion = {
        usuarioId: convertirAObjectId(usuarioId),  // Convierte el ID a ObjectId
        tipo,  // Tipo de notificación (ej: 'nueva_reseña')
        mensaje,  // Mensaje de la notificación
        vista: false,  // Inicializa como no vista
        restauranteId: restauranteId ? convertirAObjectId(restauranteId) : null,  // ID del restaurante relacionado (opcional)
        reseñaId: reseñaId ? convertirAObjectId(reseñaId) : null,  // ID de la reseña relacionada (opcional)
        fechaCreacion: new Date(),  // Marca de tiempo cuando se creó la notificación
        fechaActualizacion: new Date()  // Marca de tiempo, inicialmente igual a fechaCreacion
    };
    
    // Prepara las opciones para la operación de inserción
    // Si hay una sesión de transacción, la incluye; sino usa objeto vacío
    const opciones = session ? { session } : {};
    // Inserta la nueva notificación en la colección de MongoDB
    // insertOne() inserta un documento y retorna información sobre la operación
    const resultado = await db.collection(COLLECTION).insertOne(nuevaNotificacion, opciones);
    
    // Retorna la notificación creada incluyendo el _id generado automáticamente por MongoDB
    // resultado.insertedId contiene el ObjectId generado para el nuevo documento
    // El spread operator (...) incluye todas las propiedades de nuevaNotificacion
    return {
        _id: resultado.insertedId,
        ...nuevaNotificacion
    };
}

/**
 * Crea múltiples notificaciones para varios usuarios
 * @param {Array<string>} usuarioIds - Array de IDs de usuarios
 * @param {object} notificacionData - Datos comunes de la notificación
 * @param {object} session - Sesión de transacción MongoDB (opcional)
 * @returns {Promise<Array>} - Array de notificaciones creadas
 */
// Función asíncrona exportada que crea notificaciones para múltiples usuarios
// Útil cuando se necesita notificar a varios usuarios sobre el mismo evento
// Parámetros:
//   usuarioIds - array de strings con los IDs de los usuarios a notificar
//   notificacionData - objeto con los datos comunes de la notificación (tipo, mensaje, restauranteId, reseñaId)
//   session - sesión de transacción MongoDB opcional para operaciones atómicas
// Retorna: Promise que se resuelve con un array de notificaciones creadas
export async function crearNotificacionesMasivas(usuarioIds, notificacionData, session = null) {
    // Obtiene la referencia a la base de datos MongoDB
    const db = obtenerBD();
    // Extrae los campos comunes del objeto notificacionData
    const { tipo, mensaje, restauranteId, reseñaId } = notificacionData;
    
    // Valida que todos los IDs de usuarios sean válidos
    // Filtra los IDs inválidos y lanza error si hay alguno
    const idsInvalidos = usuarioIds.filter(id => !esObjectIdValido(id));
    if (idsInvalidos.length > 0) {
        throw new Error('Algunos IDs de usuario son inválidos');
    }
    
    // Prepara el array de notificaciones a insertar
    // Crea una notificación para cada usuario con los datos comunes
    const notificaciones = usuarioIds.map(usuarioId => ({
        usuarioId: convertirAObjectId(usuarioId),  // Convierte cada ID a ObjectId
        tipo,  // Tipo de notificación (ej: 'nueva_reseña')
        mensaje,  // Mensaje de la notificación
        vista: false,  // Inicializa como no vista
        restauranteId: restauranteId ? convertirAObjectId(restauranteId) : null,  // ID del restaurante relacionado (opcional)
        reseñaId: reseñaId ? convertirAObjectId(reseñaId) : null,  // ID de la reseña relacionada (opcional)
        fechaCreacion: new Date(),  // Marca de tiempo cuando se creó la notificación
        fechaActualizacion: new Date()  // Marca de tiempo, inicialmente igual a fechaCreacion
    }));
    
    // Prepara las opciones para la operación de inserción masiva
    // Si hay una sesión de transacción, la incluye; sino usa objeto vacío
    const opciones = session ? { session } : {};
    // Inserta todas las notificaciones en la colección de MongoDB en una sola operación
    // insertMany() inserta múltiples documentos y retorna información sobre la operación
    const resultado = await db.collection(COLLECTION).insertMany(notificaciones, opciones);
    
    // Retorna las notificaciones creadas con sus _id generados
    // resultado.insertedIds es un objeto Map o un objeto con índices numéricos
    // Mapea los IDs insertados con los documentos originales
    return notificaciones.map((notif, index) => {
        // Accede al ID insertado correctamente (puede ser Map o objeto)
        const insertedId = resultado.insertedIds instanceof Map 
            ? resultado.insertedIds.get(index)
            : resultado.insertedIds[index];
        
        return {
            _id: insertedId,
            ...notif
        };
    });
}

/**
 * Obtiene todas las notificaciones de un usuario
 * @param {string} usuarioId - ID del usuario
 * @param {object} opciones - Opciones de filtrado y paginación
 * @returns {Promise<Array>} - Lista de notificaciones
 */
// Función asíncrona exportada que obtiene todas las notificaciones de un usuario específico
// Parámetros:
//   usuarioId - string con el ID del usuario
//   opciones - objeto opcional con opciones de filtrado (soloNoVistas) y paginación (limite, saltar)
// Retorna: Promise que se resuelve con un array de notificaciones incluyendo información del restaurante y reseña
export async function obtenerNotificacionesPorUsuario(usuarioId, opciones = {}) {
    // Valida que el usuarioId tenga el formato correcto de ObjectId
    if (!esObjectIdValido(usuarioId)) {
        throw new Error('ID de usuario inválido');
    }
    
    // Obtiene la referencia a la base de datos MongoDB
    const db = obtenerBD();
    // Extrae las opciones de filtrado y paginación con valores por defecto
    // soloNoVistas: si es true, solo trae notificaciones no vistas (default false)
    // limite: número máximo de resultados (default 50)
    // saltar: número de resultados a omitir para paginación (default 0)
    const { soloNoVistas = false, limite = 50, saltar = 0 } = opciones;
    
    // Construye el filtro de búsqueda
    // Siempre filtra por usuarioId
    const filtro = {
        usuarioId: convertirAObjectId(usuarioId)
    };
    
    // Si soloNoVistas es true, agrega el filtro para solo traer notificaciones no vistas
    if (soloNoVistas) {
        filtro.vista = false;
    }
    
    // Incluir información del restaurante y reseña relacionada
    // Usa agregación de MongoDB para hacer JOINs con las colecciones de restaurantes y reseñas
    const notificaciones = await db.collection(COLLECTION)
        .aggregate([
            // $match: Filtra las notificaciones del usuario especificado
            { $match: filtro },
            // Primer $lookup: Hace un JOIN con la colección 'restaurantes'
            // Busca restaurantes donde restauranteId de la notificación coincida con _id del restaurante
            {
                $lookup: {
                    from: 'restaurantes',  // Colección a unir
                    localField: 'restauranteId',  // Campo de la notificación
                    foreignField: '_id',  // Campo del restaurante
                    as: 'restaurante'  // Nombre del campo donde se guarda el resultado
                }
            },
            // $unwind: Convierte el array 'restaurante' en un objeto único
            // preserveNullAndEmptyArrays: true mantiene las notificaciones aunque no tengan restaurante asociado
            { $unwind: { path: '$restaurante', preserveNullAndEmptyArrays: true } },
            // Segundo $lookup: Hace un JOIN con la colección 'reseñas'
            // Busca reseñas donde reseñaId de la notificación coincida con _id de la reseña
            {
                $lookup: {
                    from: 'reseñas',  // Colección a unir
                    localField: 'reseñaId',  // Campo de la notificación
                    foreignField: '_id',  // Campo de la reseña
                    as: 'reseña'  // Nombre del campo donde se guarda el resultado
                }
            },
            // $unwind: Convierte el array 'reseña' en un objeto único
            // preserveNullAndEmptyArrays: true mantiene las notificaciones aunque no tengan reseña asociada
            { $unwind: { path: '$reseña', preserveNullAndEmptyArrays: true } },
            // $sort: Ordena los resultados por fecha de creación descendente (más recientes primero)
            { $sort: { fechaCreacion: -1 } },
            // $skip: Omite los primeros N resultados (para paginación)
            { $skip: saltar },
            // $limit: Limita el número de resultados
            { $limit: limite }
        ])
        .toArray();
    
    // Retorna el array de notificaciones con la información del restaurante y reseña incluida
    return notificaciones;
}

/**
 * Marca una notificación como vista
 * @param {string} notificacionId - ID de la notificación
 * @param {object} session - Sesión de transacción MongoDB (opcional)
 * @returns {Promise<object|null>} - Notificación actualizada
 */
// Función asíncrona exportada que marca una notificación como vista
// Parámetros:
//   notificacionId - string con el ID de la notificación a marcar como vista
//   session - sesión de transacción MongoDB opcional para operaciones atómicas
// Retorna: Promise que se resuelve con la notificación actualizada o null si no se encontró
export async function marcarNotificacionComoVista(notificacionId, session = null) {
    // Valida que el notificacionId tenga el formato correcto de ObjectId
    if (!esObjectIdValido(notificacionId)) {
        throw new Error('ID de notificación inválido');
    }
    
    // Obtiene la referencia a la base de datos MongoDB
    const db = obtenerBD();
    // Prepara las opciones para la operación de actualización
    const opciones = {
        returnDocument: 'after'  // Retorna el documento después de la actualización
    };
    
    // Si hay una sesión de transacción, la incluye en las opciones
    if (session) {
        opciones.session = session;
    }
    
    // Actualiza la notificación en la base de datos
    // findOneAndUpdate() busca y actualiza en una sola operación
    // Primer parámetro: filtro para encontrar el documento (_id)
    // Segundo parámetro: operación de actualización ($set establece vista: true y fechaActualizacion)
    // Tercer parámetro: opciones (returnDocument: 'after' retorna el documento actualizado, session si existe)
    const resultado = await db.collection(COLLECTION).findOneAndUpdate(
        { _id: convertirAObjectId(notificacionId) },
        { 
            $set: { 
                vista: true,  // Marca como vista
                fechaActualizacion: new Date()  // Actualiza la fecha de modificación
            } 
        },
        opciones
    );
    
    // Retorna el resultado de la operación (el documento actualizado o null si no se encontró)
    return resultado;
}

/**
 * Obtiene el conteo de notificaciones no vistas de un usuario
 * @param {string} usuarioId - ID del usuario
 * @returns {Promise<number>} - Número de notificaciones no vistas
 */
// Función asíncrona exportada que cuenta cuántas notificaciones no vistas tiene un usuario
// Útil para mostrar un badge o contador en la interfaz de usuario
// Parámetros: usuarioId - string con el ID del usuario
// Retorna: Promise que se resuelve con el número de notificaciones no vistas
export async function contarNotificacionesNoVistas(usuarioId) {
    // Valida que el usuarioId tenga el formato correcto de ObjectId
    if (!esObjectIdValido(usuarioId)) {
        throw new Error('ID de usuario inválido');
    }
    
    // Obtiene la referencia a la base de datos MongoDB
    const db = obtenerBD();
    // Cuenta las notificaciones del usuario que no han sido vistas
    // countDocuments() cuenta cuántos documentos coinciden con el filtro
    const conteo = await db.collection(COLLECTION).countDocuments({
        usuarioId: convertirAObjectId(usuarioId),
        vista: false
    });
    
    // Retorna el número de notificaciones no vistas
    return conteo;
}

