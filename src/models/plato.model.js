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

// Define el nombre de la colección en MongoDB donde se almacenan los platos
// Esta constante evita errores de tipeo y facilita el mantenimiento
const COLLECTION = 'platos';

/**
 * Crea un nuevo plato
 * @param {object} platoData - Datos del plato
 * @param {object} session - Sesión de transacción MongoDB (opcional)
 * @returns {Promise<object>} - Plato creado
 */
// Función asíncrona exportada que crea un nuevo plato en la base de datos
// Parámetros:
//   platoData - objeto con los datos del plato (nombre, descripcion, restauranteId, imagen, precio)
//   session - sesión de transacción MongoDB opcional para operaciones atómicas
// Retorna: Promise que se resuelve con el objeto del plato creado incluyendo su _id
export async function crearPlato(platoData, session = null) {
    // Obtiene la referencia a la base de datos MongoDB
    const db = obtenerBD();
    // Extrae los campos del objeto platoData usando destructuring
    // Esto permite acceder fácilmente a estos campos sin usar platoData.nombre
    const { nombre, descripcion, restauranteId, imagen, precio } = platoData;
    
    // Valida que el restauranteId tenga el formato correcto de ObjectId
    // Si el ID no es válido, lanza un error antes de hacer la consulta
    if (!esObjectIdValido(restauranteId)) {
        throw new Error('ID de restaurante inválido');
    }
    
    // Prepara las opciones para las operaciones de MongoDB
    // Si hay una sesión de transacción, la incluye; sino usa objeto vacío
    // Las sesiones permiten agrupar múltiples operaciones en transacciones atómicas
    const opciones = session ? { session } : {};
    
    // Verificar que el restaurante existe
    // Antes de crear el plato, verifica que el restaurante al que se asocia realmente existe
    // Esto mantiene la integridad referencial de los datos
    const restaurante = await db.collection('restaurantes').findOne({
        _id: convertirAObjectId(restauranteId)
    }, opciones);
    // Si el restaurante no existe, lanza un error
    if (!restaurante) {
        throw new Error('El restaurante especificado no existe');
    }
    
    // Verificar si ya existe un plato con ese nombre en el restaurante
    // Esta validación previene duplicados dentro del mismo restaurante
    // El mismo nombre puede existir en diferentes restaurantes, pero no en el mismo
    const platoExistente = await db.collection(COLLECTION).findOne({
        restauranteId: convertirAObjectId(restauranteId),
        nombre
    }, opciones);
    // Si ya existe un plato con ese nombre en el restaurante, lanza un error
    if (platoExistente) {
        throw new Error('Ya existe un plato con ese nombre en este restaurante');
    }
    
    // Crea el objeto del nuevo plato con los datos proporcionados
    const nuevoPlato = {
        nombre,  // Nombre del plato (ej: "Pizza Margherita", "Tacos al Pastor")
        // Descripción es opcional, si no se proporciona usa string vacío
        descripcion: descripcion || '',
        // Convierte el restauranteId a ObjectId para almacenarlo correctamente
        restauranteId: convertirAObjectId(restauranteId),
        // Imagen es opcional, si no se proporciona usa null
        imagen: imagen || null,
        // Precio es opcional, si no se proporciona usa null
        precio: precio || null,
        // fechaCreacion: Marca de tiempo cuando se creó el plato
        fechaCreacion: new Date(),
        // fechaActualizacion: Marca de tiempo, inicialmente igual a fechaCreacion
        fechaActualizacion: new Date()
    };
    
    // Inserta el nuevo plato en la colección de MongoDB
    // insertOne() inserta un documento y retorna información sobre la operación
    // Si hay una sesión, las operaciones forman parte de una transacción
    const resultado = await db.collection(COLLECTION).insertOne(nuevoPlato, opciones);
    // Retorna el plato creado incluyendo el _id generado automáticamente por MongoDB
    // resultado.insertedId contiene el ObjectId generado para el nuevo documento
    // El spread operator (...) incluye todas las propiedades de nuevoPlato
    return {
        _id: resultado.insertedId,
        ...nuevoPlato
    };
}

/**
 * Obtiene platos de un restaurante
 * @param {string} restauranteId - ID del restaurante
 * @returns {Promise<Array>} - Lista de platos
 */
// Función asíncrona exportada que obtiene todos los platos de un restaurante específico
// Parámetros: restauranteId - string con el ID del restaurante
// Retorna: Promise que se resuelve con un array de platos del restaurante ordenados por nombre
export async function obtenerPlatosPorRestaurante(restauranteId) {
    // Valida que el restauranteId tenga el formato correcto de ObjectId
    // Si el ID no es válido, lanza un error antes de hacer la consulta
    if (!esObjectIdValido(restauranteId)) {
        throw new Error('ID de restaurante inválido');
    }
    
    // Obtiene la referencia a la base de datos MongoDB
    const db = obtenerBD();
    // Busca todos los platos que pertenezcan al restaurante especificado
    // find() busca documentos que coincidan con el filtro
    // sort({ nombre: 1 }) ordena los resultados por nombre en orden ascendente (1 = ascendente, -1 = descendente)
    // toArray() convierte el cursor de MongoDB a un array de JavaScript
    return await db.collection(COLLECTION)
        .find({ restauranteId: convertirAObjectId(restauranteId) })
        .sort({ nombre: 1 })
        .toArray();
}

/**
 * Busca un plato por ID
 * @param {string} id - ID del plato
 * @returns {Promise<object|null>} - Plato encontrado o null
 */
// Función asíncrona exportada que busca un plato específico por su ID
// Parámetros: id - string con el ID del plato a buscar
// Retorna: Promise que se resuelve con el plato encontrado o null si no existe o el ID es inválido
export async function buscarPlatoPorId(id) {
    // Valida que el ID tenga el formato correcto de ObjectId de MongoDB
    // Si el ID no es válido, retorna null inmediatamente sin hacer la consulta
    if (!esObjectIdValido(id)) {
        return null;
    }
    // Obtiene la referencia a la base de datos MongoDB
    const db = obtenerBD();
    // Busca un plato por su _id
    // convertirAObjectId() convierte el string del ID a ObjectId para la consulta
    // findOne() retorna el documento encontrado o null si no existe
    return await db.collection(COLLECTION).findOne({ _id: convertirAObjectId(id) });
}

/**
 * Actualiza un plato
 * @param {string} id - ID del plato
 * @param {object} datosActualizacion - Datos a actualizar
 * @returns {Promise<object|null>} - Plato actualizado
 */
// Función asíncrona exportada que actualiza un plato existente
// Parámetros:
//   id - string con el ID del plato a actualizar
//   datosActualizacion - objeto con los campos a actualizar (nombre, descripcion, precio, imagen, etc.)
// Retorna: Promise que se resuelve con el plato actualizado o null si no se encontró
export async function actualizarPlato(id, datosActualizacion) {
    // Valida que el ID tenga el formato correcto de ObjectId
    // Si el ID no es válido, lanza un error antes de hacer la consulta
    if (!esObjectIdValido(id)) {
        throw new Error('ID inválido');
    }
    
    // Obtiene la referencia a la base de datos MongoDB
    const db = obtenerBD();
    
    // Si se actualiza el nombre, verificar que no exista otro plato con ese nombre en el mismo restaurante
    // Esta validación previene duplicados cuando se cambia el nombre de un plato dentro del mismo restaurante
    if (datosActualizacion.nombre) {
        // Primero busca el plato actual para obtener su restauranteId
        // Necesitamos saber a qué restaurante pertenece para validar la unicidad del nombre
        const plato = await db.collection(COLLECTION).findOne({ _id: convertirAObjectId(id) });
        // Si el plato no existe, lanza un error
        if (!plato) {
            throw new Error('Plato no encontrado');
        }
        
        // Busca si existe otro plato (diferente al actual) con el mismo nombre en el mismo restaurante
        // $ne significa "not equal" (no igual), excluye el plato que se está actualizando
        const platoExistente = await db.collection(COLLECTION).findOne({
            restauranteId: plato.restauranteId,  // Mismo restaurante
            nombre: datosActualizacion.nombre,    // Mismo nombre
            _id: { $ne: convertirAObjectId(id) }  // Pero diferente plato
        });
        // Si ya existe otro plato con ese nombre en el mismo restaurante, lanza un error
        if (platoExistente) {
            throw new Error('Ya existe un plato con ese nombre en este restaurante');
        }
    }
    
    // Prepara el objeto de actualización combinando los datos nuevos con la fecha de actualización
    const actualizacion = {
        // Spread operator incluye todos los campos de datosActualizacion (nombre, descripcion, precio, etc.)
        ...datosActualizacion,
        // Actualiza automáticamente la fecha de modificación
        fechaActualizacion: new Date()
    };
    
    // Actualiza el plato en la base de datos
    // findOneAndUpdate() busca y actualiza en una sola operación
    // Primer parámetro: filtro para encontrar el documento (_id)
    // Segundo parámetro: operación de actualización ($set establece los nuevos valores)
    // Tercer parámetro: opciones (returnDocument: 'after' retorna el documento actualizado)
    const resultado = await db.collection(COLLECTION).findOneAndUpdate(
        { _id: convertirAObjectId(id) },
        { $set: actualizacion },
        { returnDocument: 'after' }
    );
    
    // Retorna el resultado de la operación (el documento actualizado o null si no se encontró)
    return resultado;
}

/**
 * Elimina un plato
 * @param {string} id - ID del plato
 * @returns {Promise<boolean>} - True si se eliminó correctamente
 */
// Función asíncrona exportada que elimina un plato de la base de datos
// Parámetros: id - string con el ID del plato a eliminar
// Retorna: Promise que se resuelve con true si se eliminó correctamente, false si no se encontró
export async function eliminarPlato(id) {
    // Valida que el ID tenga el formato correcto de ObjectId
    // Si el ID no es válido, lanza un error antes de hacer la consulta
    if (!esObjectIdValido(id)) {
        throw new Error('ID inválido');
    }
    
    // Obtiene la referencia a la base de datos MongoDB
    const db = obtenerBD();
    // Elimina el plato de la base de datos
    // deleteOne() elimina un documento que coincida con el filtro
    // Retorna información sobre la operación incluyendo deletedCount (número de documentos eliminados)
    const resultado = await db.collection(COLLECTION).deleteOne({ _id: convertirAObjectId(id) });
    // Retorna true si se eliminó al menos un documento (deletedCount > 0), false en caso contrario
    // Esto indica si la operación fue exitosa o si no se encontró el plato
    return resultado.deletedCount > 0;
}

