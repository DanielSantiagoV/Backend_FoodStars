import { obtenerBD } from '../config/db.js';
import { ObjectId } from 'mongodb';
import { esObjectIdValido, convertirAObjectId } from '../utils/helpers.js';

const COLLECTION = 'platos';

/**
 * Crea un nuevo plato
 * @param {object} platoData - Datos del plato
 * @param {object} session - Sesión de transacción MongoDB (opcional)
 * @returns {Promise<object>} - Plato creado
 */
export async function crearPlato(platoData, session = null) {
    const db = obtenerBD();
    const { nombre, descripcion, restauranteId, imagen, precio } = platoData;
    
    if (!esObjectIdValido(restauranteId)) {
        throw new Error('ID de restaurante inválido');
    }
    
    const opciones = session ? { session } : {};
    
    // Verificar que el restaurante existe
    const restaurante = await db.collection('restaurantes').findOne({
        _id: convertirAObjectId(restauranteId)
    }, opciones);
    if (!restaurante) {
        throw new Error('El restaurante especificado no existe');
    }
    
    // Verificar si ya existe un plato con ese nombre en el restaurante
    const platoExistente = await db.collection(COLLECTION).findOne({
        restauranteId: convertirAObjectId(restauranteId),
        nombre
    }, opciones);
    if (platoExistente) {
        throw new Error('Ya existe un plato con ese nombre en este restaurante');
    }
    
    const nuevoPlato = {
        nombre,
        descripcion: descripcion || '',
        restauranteId: convertirAObjectId(restauranteId),
        imagen: imagen || null,
        precio: precio || null,
        fechaCreacion: new Date(),
        fechaActualizacion: new Date()
    };
    
    const resultado = await db.collection(COLLECTION).insertOne(nuevoPlato, opciones);
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
export async function obtenerPlatosPorRestaurante(restauranteId) {
    if (!esObjectIdValido(restauranteId)) {
        throw new Error('ID de restaurante inválido');
    }
    
    const db = obtenerBD();
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
export async function buscarPlatoPorId(id) {
    if (!esObjectIdValido(id)) {
        return null;
    }
    const db = obtenerBD();
    return await db.collection(COLLECTION).findOne({ _id: convertirAObjectId(id) });
}

/**
 * Actualiza un plato
 * @param {string} id - ID del plato
 * @param {object} datosActualizacion - Datos a actualizar
 * @returns {Promise<object|null>} - Plato actualizado
 */
export async function actualizarPlato(id, datosActualizacion) {
    if (!esObjectIdValido(id)) {
        throw new Error('ID inválido');
    }
    
    const db = obtenerBD();
    
    // Si se actualiza el nombre, verificar que no exista otro plato con ese nombre en el mismo restaurante
    if (datosActualizacion.nombre) {
        const plato = await db.collection(COLLECTION).findOne({ _id: convertirAObjectId(id) });
        if (!plato) {
            throw new Error('Plato no encontrado');
        }
        
        const platoExistente = await db.collection(COLLECTION).findOne({
            restauranteId: plato.restauranteId,
            nombre: datosActualizacion.nombre,
            _id: { $ne: convertirAObjectId(id) }
        });
        if (platoExistente) {
            throw new Error('Ya existe un plato con ese nombre en este restaurante');
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
 * Elimina un plato
 * @param {string} id - ID del plato
 * @returns {Promise<boolean>} - True si se eliminó correctamente
 */
export async function eliminarPlato(id) {
    if (!esObjectIdValido(id)) {
        throw new Error('ID inválido');
    }
    
    const db = obtenerBD();
    const resultado = await db.collection(COLLECTION).deleteOne({ _id: convertirAObjectId(id) });
    return resultado.deletedCount > 0;
}

