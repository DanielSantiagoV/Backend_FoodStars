import { obtenerBD } from '../config/db.js';
import { ObjectId } from 'mongodb';
import { esObjectIdValido, convertirAObjectId } from '../utils/helpers.js';

const COLLECTION = 'categorias';

/**
 * Crea una nueva categoría
 * @param {object} categoriaData - Datos de la categoría (nombre, descripcion)
 * @returns {Promise<object>} - Categoría creada
 */
export async function crearCategoria(categoriaData) {
    const db = obtenerBD();
    const { nombre, descripcion } = categoriaData;
    
    // Verificar si el nombre ya existe
    const categoriaExistente = await db.collection(COLLECTION).findOne({ nombre });
    if (categoriaExistente) {
        throw new Error('Ya existe una categoría con ese nombre');
    }
    
    const nuevaCategoria = {
        nombre,
        descripcion: descripcion || '',
        fechaCreacion: new Date(),
        fechaActualizacion: new Date()
    };
    
    const resultado = await db.collection(COLLECTION).insertOne(nuevaCategoria);
    return {
        _id: resultado.insertedId,
        ...nuevaCategoria
    };
}

/**
 * Obtiene todas las categorías
 * @returns {Promise<Array>} - Lista de categorías
 */
export async function obtenerCategorias() {
    const db = obtenerBD();
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
export async function buscarCategoriaPorId(id) {
    if (!esObjectIdValido(id)) {
        return null;
    }
    const db = obtenerBD();
    return await db.collection(COLLECTION).findOne({ _id: convertirAObjectId(id) });
}

/**
 * Busca una categoría por nombre
 * @param {string} nombre - Nombre de la categoría
 * @returns {Promise<object|null>} - Categoría encontrada o null
 */
export async function buscarCategoriaPorNombre(nombre) {
    const db = obtenerBD();
    return await db.collection(COLLECTION).findOne({ nombre });
}

/**
 * Actualiza una categoría
 * @param {string} id - ID de la categoría
 * @param {object} datosActualizacion - Datos a actualizar
 * @returns {Promise<object|null>} - Categoría actualizada
 */
export async function actualizarCategoria(id, datosActualizacion) {
    if (!esObjectIdValido(id)) {
        throw new Error('ID inválido');
    }
    
    const db = obtenerBD();
    
    // Si se actualiza el nombre, verificar que no exista otra categoría con ese nombre
    if (datosActualizacion.nombre) {
        const categoriaExistente = await db.collection(COLLECTION).findOne({
            nombre: datosActualizacion.nombre,
            _id: { $ne: convertirAObjectId(id) }
        });
        if (categoriaExistente) {
            throw new Error('Ya existe una categoría con ese nombre');
        }
    }
    
    const actualizacion = {
        ...datosActualizacion,
        fechaActualizacion: new Date()
    };
    
    const resultado = await db.collection(COLLECTION).findOneAndUpdate(
        { _id: convertirAObjectId(id) },
        { $set: actualizacion },
        { returnDocument: 'after' }
    );
    
    return resultado;
}

/**
 * Elimina una categoría
 * @param {string} id - ID de la categoría
 * @returns {Promise<boolean>} - True si se eliminó correctamente
 */
export async function eliminarCategoria(id) {
    if (!esObjectIdValido(id)) {
        throw new Error('ID inválido');
    }
    
    const db = obtenerBD();
    
    // Verificar si hay restaurantes usando esta categoría
    const restaurantesConCategoria = await db.collection('restaurantes').countDocuments({
        categoriaId: convertirAObjectId(id)
    });
    
    if (restaurantesConCategoria > 0) {
        throw new Error('No se puede eliminar la categoría porque tiene restaurantes asociados');
    }
    
    const resultado = await db.collection(COLLECTION).deleteOne({ _id: convertirAObjectId(id) });
    return resultado.deletedCount > 0;
}

