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

// Define el nombre de la colección en MongoDB donde se almacenan las categorías
// Esta constante evita errores de tipeo y facilita el mantenimiento
const COLLECTION = 'categorias';

/**
 * Crea una nueva categoría
 * @param {object} categoriaData - Datos de la categoría (nombre, descripcion)
 * @returns {Promise<object>} - Categoría creada
 */
// Función asíncrona exportada que crea una nueva categoría en la base de datos
// Parámetros: categoriaData - objeto con los datos de la categoría (nombre, descripcion)
// Retorna: Promise que se resuelve con el objeto de la categoría creada incluyendo su _id
export async function crearCategoria(categoriaData) {
    // Obtiene la referencia a la base de datos MongoDB
    const db = obtenerBD();
    // Extrae nombre y descripcion del objeto categoriaData usando destructuring
    // Esto permite acceder fácilmente a estos campos sin usar categoriaData.nombre
    const { nombre, descripcion } = categoriaData;
    
    // Verificar si el nombre ya existe
    // Busca en la colección si ya existe una categoría con el mismo nombre
    // findOne() retorna el primer documento que coincida o null si no encuentra nada
    const categoriaExistente = await db.collection(COLLECTION).findOne({ nombre });
    // Si ya existe una categoría con ese nombre, lanza un error
    // Esto previene duplicados ya que el nombre debe ser único
    if (categoriaExistente) {
        throw new Error('Ya existe una categoría con ese nombre');
    }
    
    // Crea el objeto de la nueva categoría con los datos proporcionados
    const nuevaCategoria = {
        nombre,  // Nombre de la categoría (ej: "Italiana", "Mexicana")
        // Descripción es opcional, si no se proporciona usa string vacío
        descripcion: descripcion || '',
        // fechaCreacion: Marca de tiempo cuando se creó la categoría
        fechaCreacion: new Date(),
        // fechaActualizacion: Marca de tiempo, inicialmente igual a fechaCreacion
        fechaActualizacion: new Date()
    };
    
    // Inserta la nueva categoría en la colección de MongoDB
    // insertOne() inserta un documento y retorna información sobre la operación
    const resultado = await db.collection(COLLECTION).insertOne(nuevaCategoria);
    // Retorna la categoría creada incluyendo el _id generado automáticamente por MongoDB
    // resultado.insertedId contiene el ObjectId generado para el nuevo documento
    // El spread operator (...) incluye todas las propiedades de nuevaCategoria
    return {
        _id: resultado.insertedId,
        ...nuevaCategoria
    };
}

/**
 * Obtiene todas las categorías
 * @returns {Promise<Array>} - Lista de categorías
 */
// Función asíncrona exportada que obtiene todas las categorías de la base de datos
// Retorna: Promise que se resuelve con un array de todas las categorías ordenadas por nombre
export async function obtenerCategorias() {
    // Obtiene la referencia a la base de datos MongoDB
    const db = obtenerBD();
    // Busca todos los documentos en la colección
    // find({}) con objeto vacío significa buscar todos los documentos sin filtro
    // sort({ nombre: 1 }) ordena los resultados por nombre en orden ascendente (1 = ascendente, -1 = descendente)
    // toArray() convierte el cursor de MongoDB a un array de JavaScript
    return await db.collection(COLLECTION)
        .find({})
        .sort({ nombre: 1 })
        .toArray();
}

/**
 * Busca una categoría por ID
 * @param {string} id - ID de la categoría
 * @returns {Promise<object|null>} - Categoría encontrada o null
 */
// Función asíncrona exportada que busca una categoría específica por su ID
// Parámetros: id - string con el ID de la categoría a buscar
// Retorna: Promise que se resuelve con la categoría encontrada o null si no existe o el ID es inválido
export async function buscarCategoriaPorId(id) {
    // Valida que el ID tenga el formato correcto de ObjectId de MongoDB
    // Si el ID no es válido, retorna null inmediatamente sin hacer la consulta
    if (!esObjectIdValido(id)) {
        return null;
    }
    // Obtiene la referencia a la base de datos MongoDB
    const db = obtenerBD();
    // Busca una categoría por su _id
    // convertirAObjectId() convierte el string del ID a ObjectId para la consulta
    // findOne() retorna el documento encontrado o null si no existe
    return await db.collection(COLLECTION).findOne({ _id: convertirAObjectId(id) });
}

/**
 * Busca una categoría por nombre
 * @param {string} nombre - Nombre de la categoría
 * @returns {Promise<object|null>} - Categoría encontrada o null
 */
// Función asíncrona exportada que busca una categoría por su nombre
// Parámetros: nombre - string con el nombre de la categoría a buscar
// Retorna: Promise que se resuelve con la categoría encontrada o null si no existe
export async function buscarCategoriaPorNombre(nombre) {
    // Obtiene la referencia a la base de datos MongoDB
    const db = obtenerBD();
    // Busca una categoría por su nombre (que debe ser único según el índice)
    // findOne() retorna el primer documento que coincida o null si no encuentra nada
    return await db.collection(COLLECTION).findOne({ nombre });
}

/**
 * Actualiza una categoría
 * @param {string} id - ID de la categoría
 * @param {object} datosActualizacion - Datos a actualizar
 * @returns {Promise<object|null>} - Categoría actualizada
 */
// Función asíncrona exportada que actualiza una categoría existente
// Parámetros:
//   id - string con el ID de la categoría a actualizar
//   datosActualizacion - objeto con los campos a actualizar (nombre, descripcion, etc.)
// Retorna: Promise que se resuelve con la categoría actualizada o null si no se encontró
export async function actualizarCategoria(id, datosActualizacion) {
    // Valida que el ID tenga el formato correcto de ObjectId
    // Si el ID no es válido, lanza un error antes de hacer la consulta
    if (!esObjectIdValido(id)) {
        throw new Error('ID inválido');
    }
    
    // Obtiene la referencia a la base de datos MongoDB
    const db = obtenerBD();
    
    // Si se actualiza el nombre, verificar que no exista otra categoría con ese nombre
    // Esta validación previene duplicados cuando se cambia el nombre de una categoría
    if (datosActualizacion.nombre) {
        // Busca si existe otra categoría (diferente a la actual) con el mismo nombre
        // $ne significa "not equal" (no igual), excluye la categoría que se está actualizando
        const categoriaExistente = await db.collection(COLLECTION).findOne({
            nombre: datosActualizacion.nombre,
            _id: { $ne: convertirAObjectId(id) }
        });
        // Si ya existe otra categoría con ese nombre, lanza un error
        if (categoriaExistente) {
            throw new Error('Ya existe una categoría con ese nombre');
        }
    }
    
    // Prepara el objeto de actualización combinando los datos nuevos con la fecha de actualización
    const actualizacion = {
        // Spread operator incluye todos los campos de datosActualizacion (nombre, descripcion, etc.)
        ...datosActualizacion,
        // Actualiza automáticamente la fecha de modificación
        fechaActualizacion: new Date()
    };
    
    // Actualiza la categoría en la base de datos
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
 * Elimina una categoría
 * @param {string} id - ID de la categoría
 * @returns {Promise<boolean>} - True si se eliminó correctamente
 */
// Función asíncrona exportada que elimina una categoría de la base de datos
// Parámetros: id - string con el ID de la categoría a eliminar
// Retorna: Promise que se resuelve con true si se eliminó correctamente, false si no se encontró
export async function eliminarCategoria(id) {
    // Valida que el ID tenga el formato correcto de ObjectId
    // Si el ID no es válido, lanza un error antes de hacer la consulta
    if (!esObjectIdValido(id)) {
        throw new Error('ID inválido');
    }
    
    // Obtiene la referencia a la base de datos MongoDB
    const db = obtenerBD();
    
    // Verificar si hay restaurantes usando esta categoría
    // Antes de eliminar, verifica que no haya restaurantes que dependan de esta categoría
    // Esto previene la eliminación de categorías que están en uso (integridad referencial)
    // countDocuments() cuenta cuántos documentos coinciden con el filtro
    const restaurantesConCategoria = await db.collection('restaurantes').countDocuments({
        // Busca restaurantes que tengan este categoriaId
        categoriaId: convertirAObjectId(id)
    });
    
    // Si hay restaurantes usando esta categoría, no se puede eliminar
    // Esto mantiene la integridad de los datos y evita referencias rotas
    if (restaurantesConCategoria > 0) {
        throw new Error('No se puede eliminar la categoría porque tiene restaurantes asociados');
    }
    
    // Elimina la categoría de la base de datos
    // deleteOne() elimina un documento que coincida con el filtro
    // Retorna información sobre la operación incluyendo deletedCount (número de documentos eliminados)
    const resultado = await db.collection(COLLECTION).deleteOne({ _id: convertirAObjectId(id) });
    // Retorna true si se eliminó al menos un documento (deletedCount > 0), false en caso contrario
    // Esto indica si la operación fue exitosa o si no se encontró la categoría
    return resultado.deletedCount > 0;
}

