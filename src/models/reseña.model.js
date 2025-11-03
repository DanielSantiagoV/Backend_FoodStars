// Importa la función obtenerBD desde el módulo de configuración de base de datos
// obtenerBD retorna la referencia a la base de datos MongoDB para realizar operaciones
import { obtenerBD } from '../config/db.js';
// Importa ObjectId desde mongodb (aunque no se usa directamente en este archivo, podría ser útil)
// ObjectId es el tipo de dato que MongoDB usa para los identificadores únicos
import { ObjectId } from 'mongodb';
// Importa funciones helper para validar y convertir ObjectIds
// esObjectIdValido: verifica si un string es un ObjectId válido
// convertirAObjectId: convierte un string a ObjectId para usar en consultas
import { esObjectIdValido, convertirAObjectId } from '../utils/helpers.js';
// Importa constantes de validación desde el módulo de constants
// VALIDATION_LIMITS: límites de validación (ej: RATING_MIN, RATING_MAX para calificaciones)
import { VALIDATION_LIMITS } from '../utils/constants.js';

// Define el nombre de la colección en MongoDB donde se almacenan las reseñas
// Esta constante evita errores de tipeo y facilita el mantenimiento
const COLLECTION = 'reseñas';

/**
 * Crea una nueva reseña (usar transacción para actualizar promedio del restaurante)
 * @param {object} reseñaData - Datos de la reseña
 * @param {object} session - Sesión de transacción MongoDB
 * @returns {Promise<object>} - Reseña creada
 */
// Función asíncrona exportada que crea una nueva reseña en la base de datos
// Parámetros:
//   reseñaData - objeto con los datos de la reseña (comentario, calificacion, restauranteId, usuarioId)
//   session - sesión de transacción MongoDB opcional para operaciones atómicas
// Retorna: Promise que se resuelve con el objeto de la reseña creada incluyendo su _id
export async function crearReseña(reseñaData, session = null) {
    // Obtiene la referencia a la base de datos MongoDB
    const db = obtenerBD();
    // Extrae los campos del objeto reseñaData usando destructuring
    // Esto permite acceder fácilmente a estos campos sin usar reseñaData.comentario
    const { comentario, calificacion, restauranteId, usuarioId } = reseñaData;
    
    // Validar calificación
    // Verifica que la calificación esté dentro del rango permitido (normalmente 1-5)
    // RATING_MIN y RATING_MAX son constantes definidas en VALIDATION_LIMITS
    if (calificacion < VALIDATION_LIMITS.RATING_MIN || calificacion > VALIDATION_LIMITS.RATING_MAX) {
        throw new Error(`La calificación debe estar entre ${VALIDATION_LIMITS.RATING_MIN} y ${VALIDATION_LIMITS.RATING_MAX}`);
    }
    
    // Valida que tanto restauranteId como usuarioId tengan el formato correcto de ObjectId
    // Si alguno no es válido, lanza un error antes de hacer las consultas
    if (!esObjectIdValido(restauranteId) || !esObjectIdValido(usuarioId)) {
        throw new Error('IDs inválidos');
    }
    
    // Verificar que el restaurante existe y está aprobado
    // Antes de crear la reseña, verifica que el restaurante exista y esté aprobado
    // aprobado: true asegura que solo se pueden hacer reseñas de restaurantes aprobados
    // Si hay sesión, la incluye para que la consulta forme parte de la transacción
    const restaurante = await db.collection('restaurantes').findOne(
        { _id: convertirAObjectId(restauranteId), aprobado: true },
        session ? { session } : {}
    );
    // Si el restaurante no existe o no está aprobado, lanza un error
    if (!restaurante) {
        throw new Error('El restaurante especificado no existe o no está aprobado');
    }
    
    // Verificar que el usuario no haya hecho ya una reseña para este restaurante
    // Esta validación previene que un usuario haga múltiples reseñas para el mismo restaurante
    // Busca una reseña existente con el mismo restauranteId y usuarioId
    const reseñaExistente = await db.collection(COLLECTION).findOne(
        {
            restauranteId: convertirAObjectId(restauranteId),
            usuarioId: convertirAObjectId(usuarioId)
        },
        session ? { session } : {}
    );
    // Si ya existe una reseña, lanza un error
    if (reseñaExistente) {
        throw new Error('Ya has creado una reseña para este restaurante');
    }
    
    // Crea el objeto de la nueva reseña con los datos proporcionados
    const nuevaReseña = {
        comentario: comentario || '',  // Comentario es opcional, si no se proporciona usa string vacío
        calificacion,  // Calificación numérica (validada arriba)
        restauranteId: convertirAObjectId(restauranteId),  // Convierte el ID a ObjectId
        usuarioId: convertirAObjectId(usuarioId),  // Convierte el ID a ObjectId
        likes: 0,  // Inicializa el contador de likes en 0
        dislikes: 0,  // Inicializa el contador de dislikes en 0
        usuariosQueLiked: [],  // Array vacío que almacenará los IDs de usuarios que dieron like
        usuariosQueDisliked: [],  // Array vacío que almacenará los IDs de usuarios que dieron dislike
        fechaCreacion: new Date(),  // Marca de tiempo cuando se creó la reseña
        fechaActualizacion: new Date()  // Marca de tiempo, inicialmente igual a fechaCreacion
    };
    
    // Prepara las opciones para la operación de inserción
    // Si hay una sesión de transacción, la incluye; sino usa objeto vacío
    const opciones = session ? { session } : {};
    // Inserta la nueva reseña en la colección de MongoDB
    // insertOne() inserta un documento y retorna información sobre la operación
    const resultado = await db.collection(COLLECTION).insertOne(nuevaReseña, opciones);
    
    // Retorna la reseña creada incluyendo el _id generado automáticamente por MongoDB
    // resultado.insertedId contiene el ObjectId generado para el nuevo documento
    // El spread operator (...) incluye todas las propiedades de nuevaReseña
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
// Función asíncrona exportada que obtiene todas las reseñas de un restaurante específico
// Parámetros:
//   restauranteId - string con el ID del restaurante
//   opciones - objeto opcional con opciones de paginación (limite, saltar, ordenarPor, orden)
// Retorna: Promise que se resuelve con un array de reseñas incluyendo información del usuario
export async function obtenerReseñasPorRestaurante(restauranteId, opciones = {}) {
    // Valida que el restauranteId tenga el formato correcto de ObjectId
    // Si el ID no es válido, lanza un error antes de hacer la consulta
    if (!esObjectIdValido(restauranteId)) {
        throw new Error('ID de restaurante inválido');
    }
    
    // Obtiene la referencia a la base de datos MongoDB
    const db = obtenerBD();
    // Extrae las opciones de paginación y ordenamiento con valores por defecto
    // limite: número máximo de resultados (default 50)
    // saltar: número de resultados a omitir para paginación (default 0)
    // ordenarPor: campo por el cual ordenar (default 'fechaCreacion')
    // orden: dirección del ordenamiento 'desc' o 'asc' (default 'desc')
    const { limite = 50, saltar = 0, ordenarPor = 'fechaCreacion', orden = 'desc' } = opciones;
    
    // Construye el objeto de opciones de ordenamiento
    // sortOptions[ordenarPor] = -1 si es descendente, 1 si es ascendente
    const sortOptions = {};
    sortOptions[ordenarPor] = orden === 'desc' ? -1 : 1;
    
    // Incluir información del usuario que hizo la reseña
    // Usa agregación de MongoDB para hacer un JOIN con la colección de usuarios
    const reseñas = await db.collection(COLLECTION)
        .aggregate([
            // $match: Filtra las reseñas del restaurante especificado
            { $match: { restauranteId: convertirAObjectId(restauranteId) } },
            // $lookup: Hace un JOIN con la colección 'usuarios'
            // Busca usuarios donde usuarioId de la reseña coincida con _id del usuario
            {
                $lookup: {
                    from: 'usuarios',  // Colección a unir
                    localField: 'usuarioId',  // Campo de la reseña
                    foreignField: '_id',  // Campo del usuario
                    as: 'usuario'  // Nombre del campo donde se guarda el resultado
                }
            },
            // $unwind: Convierte el array 'usuario' en un objeto único
            // preserveNullAndEmptyArrays: true mantiene las reseñas aunque no tengan usuario asociado
            { $unwind: { path: '$usuario', preserveNullAndEmptyArrays: true } },
            // $project: Excluye el campo password del usuario por seguridad
            // 0 significa excluir ese campo
            {
                $project: {
                    'usuario.password': 0
                }
            },
            // $sort: Ordena los resultados según las opciones configuradas
            { $sort: sortOptions },
            // $limit: Limita el número de resultados
            { $limit: limite },
            // $skip: Omite los primeros N resultados (para paginación)
            { $skip: saltar }
        ])
        .toArray();
    
    // Retorna el array de reseñas con la información del usuario incluida
    return reseñas;
}

/**
 * Obtiene todas las reseñas con paginación (para admin)
 * @param {object} opciones - Opciones de paginación y ordenamiento
 * @returns {Promise<Array>} - Lista de reseñas
 */
// Función asíncrona exportada que obtiene todas las reseñas del sistema (para administradores)
// Parámetros:
//   opciones - objeto opcional con opciones de paginación (limite, saltar, ordenarPor, orden)
// Retorna: Promise que se resuelve con un array de todas las reseñas incluyendo información de usuario y restaurante
export async function obtenerTodasLasReseñas(opciones = {}) {
    // Obtiene la referencia a la base de datos MongoDB
    const db = obtenerBD();
    // Extrae las opciones de paginación y ordenamiento con valores por defecto
    // limite: número máximo de resultados (default 50)
    // saltar: número de resultados a omitir para paginación (default 0)
    // ordenarPor: campo por el cual ordenar (default 'fechaCreacion')
    // orden: dirección del ordenamiento 'desc' o 'asc' (default 'desc')
    const { limite = 50, saltar = 0, ordenarPor = 'fechaCreacion', orden = 'desc' } = opciones;
    
    // Construye el objeto de opciones de ordenamiento
    // sortOptions[ordenarPor] = -1 si es descendente, 1 si es ascendente
    const sortOptions = {};
    sortOptions[ordenarPor] = orden === 'desc' ? -1 : 1;
    
    // Incluir información del usuario y restaurante
    // Usa agregación de MongoDB para hacer JOINs con las colecciones de usuarios y restaurantes
    const reseñas = await db.collection(COLLECTION)
        .aggregate([
            // Primer $lookup: Hace un JOIN con la colección 'usuarios'
            // Busca usuarios donde usuarioId de la reseña coincida con _id del usuario
            {
                $lookup: {
                    from: 'usuarios',  // Colección a unir
                    localField: 'usuarioId',  // Campo de la reseña
                    foreignField: '_id',  // Campo del usuario
                    as: 'usuario'  // Nombre del campo donde se guarda el resultado
                }
            },
            // $unwind: Convierte el array 'usuario' en un objeto único
            // preserveNullAndEmptyArrays: true mantiene las reseñas aunque no tengan usuario asociado
            { $unwind: { path: '$usuario', preserveNullAndEmptyArrays: true } },
            // Segundo $lookup: Hace un JOIN con la colección 'restaurantes'
            // Busca restaurantes donde restauranteId de la reseña coincida con _id del restaurante
            {
                $lookup: {
                    from: 'restaurantes',  // Colección a unir
                    localField: 'restauranteId',  // Campo de la reseña
                    foreignField: '_id',  // Campo del restaurante
                    as: 'restaurante'  // Nombre del campo donde se guarda el resultado
                }
            },
            // $unwind: Convierte el array 'restaurante' en un objeto único
            // preserveNullAndEmptyArrays: true mantiene las reseñas aunque no tengan restaurante asociado
            { $unwind: { path: '$restaurante', preserveNullAndEmptyArrays: true } },
            // $project: Excluye el campo password del usuario por seguridad
            // 0 significa excluir ese campo
            {
                $project: {
                    'usuario.password': 0
                }
            },
            // $sort: Ordena los resultados según las opciones configuradas
            { $sort: sortOptions },
            // $limit: Limita el número de resultados
            { $limit: limite },
            // $skip: Omite los primeros N resultados (para paginación)
            { $skip: saltar }
        ])
        .toArray();
    
    // Retorna el array de reseñas con la información del usuario y restaurante incluida
    return reseñas;
}

/**
 * Busca una reseña por ID
 * @param {string} id - ID de la reseña
 * @returns {Promise<object|null>} - Reseña encontrada o null
 */
// Función asíncrona exportada que busca una reseña específica por su ID
// Parámetros: id - string con el ID de la reseña a buscar
// Retorna: Promise que se resuelve con la reseña encontrada o null si no existe o el ID es inválido
export async function buscarReseñaPorId(id) {
    // Valida que el ID tenga el formato correcto de ObjectId de MongoDB
    // Si el ID no es válido, retorna null inmediatamente sin hacer la consulta
    if (!esObjectIdValido(id)) {
        return null;
    }
    // Obtiene la referencia a la base de datos MongoDB
    const db = obtenerBD();
    // Busca una reseña por su _id
    // convertirAObjectId() convierte el string del ID a ObjectId para la consulta
    // findOne() retorna el documento encontrado o null si no existe
    return await db.collection(COLLECTION).findOne({ _id: convertirAObjectId(id) });
}

/**
 * Actualiza una reseña (transaccional)
 * @param {string} id - ID de la reseña
 * @param {object} datosActualizacion - Datos a actualizar
 * @param {object} session - Sesión de transacción MongoDB
 * @returns {Promise<object|null>} - Reseña actualizada
 */
// Función asíncrona exportada que actualiza una reseña existente
// Parámetros:
//   id - string con el ID de la reseña a actualizar
//   datosActualizacion - objeto con los campos a actualizar (comentario, calificacion, etc.)
//   session - sesión de transacción MongoDB opcional para operaciones atómicas
// Retorna: Promise que se resuelve con la reseña actualizada o null si no se encontró
export async function actualizarReseña(id, datosActualizacion, session = null) {
    // Valida que el ID tenga el formato correcto de ObjectId
    // Si el ID no es válido, lanza un error antes de hacer la consulta
    if (!esObjectIdValido(id)) {
        throw new Error('ID inválido');
    }
    
    // Obtiene la referencia a la base de datos MongoDB
    const db = obtenerBD();
    
    // Si se actualiza la calificación, validarla
    // Verifica si se está actualizando la calificación (undefined significa que no se está actualizando)
    if (datosActualizacion.calificacion !== undefined) {
        // Verifica que la nueva calificación esté dentro del rango permitido
        if (datosActualizacion.calificacion < VALIDATION_LIMITS.RATING_MIN || 
            datosActualizacion.calificacion > VALIDATION_LIMITS.RATING_MAX) {
            throw new Error(`La calificación debe estar entre ${VALIDATION_LIMITS.RATING_MIN} y ${VALIDATION_LIMITS.RATING_MAX}`);
        }
    }
    
    // Prepara el objeto de actualización combinando los datos nuevos con la fecha de actualización
    const actualizacion = {
        // Spread operator incluye todos los campos de datosActualizacion (comentario, calificacion, etc.)
        ...datosActualizacion,
        // Actualiza automáticamente la fecha de modificación
        fechaActualizacion: new Date()
    };
    
    // Prepara las opciones para la operación de actualización
    const opciones = {
        returnDocument: 'after'  // Retorna el documento después de la actualización
    };
    
    // Si hay una sesión de transacción, la incluye en las opciones
    if (session) {
        opciones.session = session;
    }
    
    // Actualiza la reseña en la base de datos
    // findOneAndUpdate() busca y actualiza en una sola operación
    // Primer parámetro: filtro para encontrar el documento (_id)
    // Segundo parámetro: operación de actualización ($set establece los nuevos valores)
    // Tercer parámetro: opciones (returnDocument: 'after' retorna el documento actualizado, session si existe)
    const resultado = await db.collection(COLLECTION).findOneAndUpdate(
        { _id: convertirAObjectId(id) },
        { $set: actualizacion },
        opciones
    );
    
    // Retorna el resultado de la operación (el documento actualizado o null si no se encontró)
    return resultado;
}

/**
 * Da like a una reseña (transaccional)
 * @param {string} reseñaId - ID de la reseña
 * @param {string} usuarioId - ID del usuario que da like
 * @param {object} session - Sesión de transacción MongoDB
 * @returns {Promise<object|null>} - Reseña actualizada
 */
// Función asíncrona exportada que permite a un usuario dar like a una reseña
// Implementa lógica de toggle: si ya dio like, lo quita; si dio dislike, lo cambia a like
// Parámetros:
//   reseñaId - string con el ID de la reseña
//   usuarioId - string con el ID del usuario que da like
//   session - sesión de transacción MongoDB opcional para operaciones atómicas
// Retorna: Promise que se resuelve con la reseña actualizada
export async function darLike(reseñaId, usuarioId, session = null) {
    // Valida que tanto reseñaId como usuarioId tengan el formato correcto de ObjectId
    // Si alguno no es válido, lanza un error antes de hacer las consultas
    if (!esObjectIdValido(reseñaId) || !esObjectIdValido(usuarioId)) {
        throw new Error('IDs inválidos');
    }
    
    // Obtiene la referencia a la base de datos MongoDB
    const db = obtenerBD();
    // Convierte los IDs a ObjectId para usarlos en las consultas
    const reseñaObjectId = convertirAObjectId(reseñaId);
    const usuarioObjectId = convertirAObjectId(usuarioId);
    
    // Obtener la reseña
    // Busca la reseña en la base de datos, incluyendo la sesión si existe
    const reseña = await db.collection(COLLECTION).findOne(
        { _id: reseñaObjectId },
        session ? { session } : {}
    );
    
    // Si la reseña no existe, lanza un error
    if (!reseña) {
        throw new Error('Reseña no encontrada');
    }
    
    // Verificar que el usuario no sea el autor
    // Previene que un usuario pueda dar like a su propia reseña
    // Compara el usuarioId de la reseña con el usuarioId del parámetro
    if (reseña.usuarioId.toString() === usuarioId) {
        throw new Error('No puedes dar like a tu propia reseña');
    }
    
    // Prepara las opciones para las operaciones de MongoDB
    // Si hay una sesión de transacción, la incluye; sino usa objeto vacío
    const opciones = session ? { session } : {};
    
    // Si el usuario ya dio dislike, removerlo y agregar like
    // Verifica si el usuario está en el array de usuarios que dieron dislike
    // some() retorna true si encuentra al menos un elemento que coincida
    if (reseña.usuariosQueDisliked.some(id => id.toString() === usuarioId)) {
        // Actualiza la reseña: quita dislike, agrega like
        // $pull: remueve el usuario del array usuariosQueDisliked
        // $inc: decrementa dislikes en 1 y incrementa likes en 1
        // $push: agrega el usuario al array usuariosQueLiked
        // $set: actualiza la fecha de actualización
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
        // Verifica que el usuario NO esté en el array de usuarios que dieron like
        await db.collection(COLLECTION).updateOne(
            { _id: reseñaObjectId },
            {
                // $push: agrega el usuario al array usuariosQueLiked
                $push: { usuariosQueLiked: usuarioObjectId },
                // $inc: incrementa likes en 1
                $inc: { likes: 1 },
                // $set: actualiza la fecha de actualización
                $set: { fechaActualizacion: new Date() }
            },
            opciones
        );
    } else {
        // Ya había dado like, removerlo (toggle off)
        // Si el usuario ya estaba en usuariosQueLiked, lo remueve (quita el like)
        await db.collection(COLLECTION).updateOne(
            { _id: reseñaObjectId },
            {
                // $pull: remueve el usuario del array usuariosQueLiked
                $pull: { usuariosQueLiked: usuarioObjectId },
                // $inc: decrementa likes en 1
                $inc: { likes: -1 },
                // $set: actualiza la fecha de actualización
                $set: { fechaActualizacion: new Date() }
            },
            opciones
        );
    }
    
    // Retorna la reseña actualizada con los nuevos contadores y arrays
    return await db.collection(COLLECTION).findOne({ _id: reseñaObjectId }, opciones);
}

/**
 * Da dislike a una reseña (transaccional)
 * @param {string} reseñaId - ID de la reseña
 * @param {string} usuarioId - ID del usuario que da dislike
 * @param {object} session - Sesión de transacción MongoDB
 * @returns {Promise<object|null>} - Reseña actualizada
 */
// Función asíncrona exportada que permite a un usuario dar dislike a una reseña
// Implementa lógica de toggle: si ya dio dislike, lo quita; si dio like, lo cambia a dislike
// Parámetros:
//   reseñaId - string con el ID de la reseña
//   usuarioId - string con el ID del usuario que da dislike
//   session - sesión de transacción MongoDB opcional para operaciones atómicas
// Retorna: Promise que se resuelve con la reseña actualizada
export async function darDislike(reseñaId, usuarioId, session = null) {
    // Valida que tanto reseñaId como usuarioId tengan el formato correcto de ObjectId
    // Si alguno no es válido, lanza un error antes de hacer las consultas
    if (!esObjectIdValido(reseñaId) || !esObjectIdValido(usuarioId)) {
        throw new Error('IDs inválidos');
    }
    
    // Obtiene la referencia a la base de datos MongoDB
    const db = obtenerBD();
    // Convierte los IDs a ObjectId para usarlos en las consultas
    const reseñaObjectId = convertirAObjectId(reseñaId);
    const usuarioObjectId = convertirAObjectId(usuarioId);
    
    // Obtener la reseña
    // Busca la reseña en la base de datos, incluyendo la sesión si existe
    const reseña = await db.collection(COLLECTION).findOne(
        { _id: reseñaObjectId },
        session ? { session } : {}
    );
    
    // Si la reseña no existe, lanza un error
    if (!reseña) {
        throw new Error('Reseña no encontrada');
    }
    
    // Verificar que el usuario no sea el autor
    // Previene que un usuario pueda dar dislike a su propia reseña
    // Compara el usuarioId de la reseña con el usuarioId del parámetro
    if (reseña.usuarioId.toString() === usuarioId) {
        throw new Error('No puedes dar dislike a tu propia reseña');
    }
    
    // Prepara las opciones para las operaciones de MongoDB
    // Si hay una sesión de transacción, la incluye; sino usa objeto vacío
    const opciones = session ? { session } : {};
    
    // Si el usuario ya dio like, removerlo y agregar dislike
    // Verifica si el usuario está en el array de usuarios que dieron like
    // some() retorna true si encuentra al menos un elemento que coincida
    if (reseña.usuariosQueLiked.some(id => id.toString() === usuarioId)) {
        // Actualiza la reseña: quita like, agrega dislike
        // $pull: remueve el usuario del array usuariosQueLiked
        // $inc: decrementa likes en 1 y incrementa dislikes en 1
        // $push: agrega el usuario al array usuariosQueDisliked
        // $set: actualiza la fecha de actualización
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
        // Verifica que el usuario NO esté en el array de usuarios que dieron dislike
        await db.collection(COLLECTION).updateOne(
            { _id: reseñaObjectId },
            {
                // $push: agrega el usuario al array usuariosQueDisliked
                $push: { usuariosQueDisliked: usuarioObjectId },
                // $inc: incrementa dislikes en 1
                $inc: { dislikes: 1 },
                // $set: actualiza la fecha de actualización
                $set: { fechaActualizacion: new Date() }
            },
            opciones
        );
    } else {
        // Ya había dado dislike, removerlo (toggle off)
        // Si el usuario ya estaba en usuariosQueDisliked, lo remueve (quita el dislike)
        await db.collection(COLLECTION).updateOne(
            { _id: reseñaObjectId },
            {
                // $pull: remueve el usuario del array usuariosQueDisliked
                $pull: { usuariosQueDisliked: usuarioObjectId },
                // $inc: decrementa dislikes en 1
                $inc: { dislikes: -1 },
                // $set: actualiza la fecha de actualización
                $set: { fechaActualizacion: new Date() }
            },
            opciones
        );
    }
    
    // Retorna la reseña actualizada con los nuevos contadores y arrays
    return await db.collection(COLLECTION).findOne({ _id: reseñaObjectId }, opciones);
}

/**
 * Obtiene estadísticas de reseñas de un restaurante
 * @param {string} restauranteId - ID del restaurante
 * @returns {Promise<object>} - Estadísticas (promedio, total, etc.)
 */
// Función asíncrona exportada que calcula estadísticas agregadas de todas las reseñas de un restaurante
// Parámetros: restauranteId - string con el ID del restaurante
// Retorna: Promise que se resuelve con un objeto con estadísticas (total, promedio, likes, dislikes, etc.)
export async function obtenerEstadisticasReseñas(restauranteId) {
    // Valida que el restauranteId tenga el formato correcto de ObjectId
    // Si el ID no es válido, lanza un error antes de hacer la consulta
    if (!esObjectIdValido(restauranteId)) {
        throw new Error('ID de restaurante inválido');
    }
    
    // Obtiene la referencia a la base de datos MongoDB
    const db = obtenerBD();
    
    // Usa agregación de MongoDB para calcular estadísticas
    const estadisticas = await db.collection(COLLECTION).aggregate([
        // $match: Filtra las reseñas del restaurante especificado
        { $match: { restauranteId: convertirAObjectId(restauranteId) } },
        // $group: Agrupa todas las reseñas y calcula agregaciones
        {
            $group: {
                _id: null,  // null agrupa todos los documentos (no hay campo de agrupación)
                // $sum: 1 cuenta el número total de documentos (reseñas)
                totalReseñas: { $sum: 1 },
                // $avg calcula el promedio de calificaciones
                promedio: { $avg: '$calificacion' },
                // $sum suma todos los likes de todas las reseñas
                totalLikes: { $sum: '$likes' },
                // $sum suma todos los dislikes de todas las reseñas
                totalDislikes: { $sum: '$dislikes' },
                // $max encuentra la fecha más reciente de creación de reseña
                fechaUltimaReseña: { $max: '$fechaCreacion' }
            }
        }
    ]).toArray();
    
    // Retorna las estadísticas o un objeto con valores por defecto si no hay reseñas
    // estadisticas[0] contiene el resultado de la agregación (o undefined si no hay resultados)
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
// Función asíncrona exportada que elimina una reseña de la base de datos
// Parámetros:
//   id - string con el ID de la reseña a eliminar
//   session - sesión de transacción MongoDB opcional para operaciones atómicas
// Retorna: Promise que se resuelve con true si se eliminó correctamente, false si no se encontró
export async function eliminarReseña(id, session = null) {
    // Valida que el ID tenga el formato correcto de ObjectId
    // Si el ID no es válido, lanza un error antes de hacer la consulta
    if (!esObjectIdValido(id)) {
        throw new Error('ID inválido');
    }
    
    // Obtiene la referencia a la base de datos MongoDB
    const db = obtenerBD();
    // Prepara las opciones para la operación de eliminación
    // Si hay una sesión de transacción, la incluye; sino usa objeto vacío
    const opciones = session ? { session } : {};
    // Elimina la reseña de la base de datos
    // deleteOne() elimina un documento que coincida con el filtro
    // Retorna información sobre la operación incluyendo deletedCount (número de documentos eliminados)
    const resultado = await db.collection(COLLECTION).deleteOne(
        { _id: convertirAObjectId(id) },
        opciones
    );
    // Retorna true si se eliminó al menos un documento (deletedCount > 0), false en caso contrario
    // Esto indica si la operación fue exitosa o si no se encontró la reseña
    return resultado.deletedCount > 0;
}

