import { obtenerBD } from '../config/db.js';
import { ObjectId } from 'mongodb';
import { esObjectIdValido, convertirAObjectId } from '../utils/helpers.js';
import { crearPlato } from './plato.model.js';

const COLLECTION = 'restaurantes';

/**
 * Crea un nuevo restaurante
 * @param {object} restauranteData - Datos del restaurante
 * @param {object} session - Sesión de transacción MongoDB (opcional)
 * @returns {Promise<object>} - Restaurante creado
 */
export async function crearRestaurante(restauranteData, session = null) {
    const db = obtenerBD();
    const { nombre, descripcion, categoriaId, ubicacion, imagen } = restauranteData;
    
    const opciones = session ? { session } : {};
    
    // Verificar si el nombre ya existe
    const restauranteExistente = await db.collection(COLLECTION).findOne({ nombre }, opciones);
    if (restauranteExistente) {
        throw new Error('Ya existe un restaurante con ese nombre');
    }
    
    // Verificar que la categoría existe
    if (categoriaId && !esObjectIdValido(categoriaId)) {
        throw new Error('ID de categoría inválido');
    }
    
    if (categoriaId) {
        const categoria = await db.collection('categorias').findOne({
            _id: convertirAObjectId(categoriaId)
        }, opciones);
        if (!categoria) {
            throw new Error('La categoría especificada no existe');
        }
    }
    
    const nuevoRestaurante = {
        nombre,
        descripcion: descripcion || '',
        categoriaId: categoriaId ? convertirAObjectId(categoriaId) : null,
        ubicacion: ubicacion || '',
        imagen: imagen || null,
        aprobado: false, // Requiere aprobación de admin
        calificacionPromedio: 0,
        totalReseñas: 0,
        ranking: 0,
        fechaCreacion: new Date(),
        fechaActualizacion: new Date()
    };
    
    const resultado = await db.collection(COLLECTION).insertOne(nuevoRestaurante, opciones);
    return {
        _id: resultado.insertedId,
        ...nuevoRestaurante
    };
}

/**
 * Crea un restaurante con platos en una transacción
 * @param {object} restauranteData - Datos del restaurante
 * @param {Array} platosData - Array de platos a crear
 * @returns {Promise<object>} - Restaurante creado con platos
 */
export async function crearRestauranteConPlatos(restauranteData, platosData = []) {
    const db = obtenerBD();
    
    // Extraer platos del restauranteData si vienen incluidos
    const platos = platosData.length > 0 ? platosData : (restauranteData.platos || []);
    
    // Crear restaurante y platos en transacción si está disponible
    const { ejecutarTransaccion } = await import('../services/transacciones.service.js');
    
    try {
        return await ejecutarTransaccion(async (session) => {
            // Crear restaurante
            const restaurante = await crearRestaurante(restauranteData, session);
            const restauranteId = restaurante._id.toString();
            
            // Crear platos si se proporcionaron
            const platosCreados = [];
            if (platos && platos.length > 0) {
                for (const platoData of platos) {
                    try {
                        const plato = await crearPlato({
                            ...platoData,
                            restauranteId
                        }, session);
                        platosCreados.push(plato);
                    } catch (error) {
                        console.error(`Error creando plato ${platoData.nombre}:`, error);
                        // Continuar con otros platos, pero registrar el error
                        throw new Error(`Error al crear plato "${platoData.nombre}": ${error.message}`);
                    }
                }
            }
            
            return {
                restaurante,
                platos: platosCreados
            };
        });
    } catch (error) {
        // Si las transacciones no están disponibles, crear sin transacción
        console.warn('Transacciones no disponibles, creando sin transacción');
        const restaurante = await crearRestaurante(restauranteData);
        const restauranteId = restaurante._id.toString();
        
        const platosCreados = [];
        if (platos && platos.length > 0) {
            for (const platoData of platos) {
                try {
                    const plato = await crearPlato({
                        ...platoData,
                        restauranteId
                    });
                    platosCreados.push(plato);
                } catch (error) {
                    console.error(`Error creando plato ${platoData.nombre}:`, error);
                }
            }
        }
        
        return {
            restaurante,
            platos: platosCreados
        };
    }
}

/**
 * Obtiene restaurantes con filtros y ordenamiento
 * @param {object} filtros - Filtros de búsqueda
 * @param {object} opciones - Opciones de ordenamiento y paginación
 * @returns {Promise<Array>} - Lista de restaurantes
 */
export async function obtenerRestaurantes(filtros = {}, opciones = {}) {
    const db = obtenerBD();
    const { ordenarPor = 'ranking', orden = 'desc', categoriaId, soloAprobados = true } = filtros;
    const { limite = 50, saltar = 0 } = opciones;
    
    const query = {};
    
    if (soloAprobados) {
        query.aprobado = true;
    }
    
    if (categoriaId && esObjectIdValido(categoriaId)) {
        query.categoriaId = convertirAObjectId(categoriaId);
    }
    
    const sortOptions = {};
    sortOptions[ordenarPor] = orden === 'desc' ? -1 : 1;
    
    return await db.collection(COLLECTION)
        .find(query)
        .sort(sortOptions)
        .limit(limite)
        .skip(saltar)
        .toArray();
}

/**
 * Busca un restaurante por ID
 * @param {string} id - ID del restaurante
 * @returns {Promise<object|null>} - Restaurante encontrado o null
 */
export async function buscarRestaurantePorId(id) {
    if (!esObjectIdValido(id)) {
        return null;
    }
    const db = obtenerBD();
    return await db.collection(COLLECTION).findOne({ _id: convertirAObjectId(id) });
}

/**
 * Actualiza un restaurante
 * @param {string} id - ID del restaurante
 * @param {object} datosActualizacion - Datos a actualizar
 * @returns {Promise<object|null>} - Restaurante actualizado
 */
export async function actualizarRestaurante(id, datosActualizacion) {
    if (!esObjectIdValido(id)) {
        throw new Error('ID inválido');
    }
    
    const db = obtenerBD();
    
    // Si se actualiza el nombre, verificar que no exista otro restaurante con ese nombre
    if (datosActualizacion.nombre) {
        const restauranteExistente = await db.collection(COLLECTION).findOne({
            nombre: datosActualizacion.nombre,
            _id: { $ne: convertirAObjectId(id) }
        });
        if (restauranteExistente) {
            throw new Error('Ya existe un restaurante con ese nombre');
        }
    }
    
    // Si se actualiza la categoría, verificar que existe
    if (datosActualizacion.categoriaId) {
        if (!esObjectIdValido(datosActualizacion.categoriaId)) {
            throw new Error('ID de categoría inválido');
        }
        const categoria = await db.collection('categorias').findOne({
            _id: convertirAObjectId(datosActualizacion.categoriaId)
        });
        if (!categoria) {
            throw new Error('La categoría especificada no existe');
        }
        datosActualizacion.categoriaId = convertirAObjectId(datosActualizacion.categoriaId);
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
 * Aprueba un restaurante (solo admin)
 * @param {string} id - ID del restaurante
 * @returns {Promise<object|null>} - Restaurante actualizado
 */
export async function aprobarRestaurante(id) {
    if (!esObjectIdValido(id)) {
        throw new Error('ID inválido');
    }
    
    const db = obtenerBD();
    const resultado = await db.collection(COLLECTION).findOneAndUpdate(
        { _id: convertirAObjectId(id) },
        { 
            $set: { 
                aprobado: true,
                fechaActualizacion: new Date()
            }
        },
        { returnDocument: 'after' }
    );
    
    return resultado;
}

/**
 * Actualiza la calificación promedio de un restaurante
 * @param {string} id - ID del restaurante
 * @param {number} nuevaCalificacion - Nueva calificación promedio
 * @param {number} totalReseñas - Total de reseñas
 * @returns {Promise<void>}
 */
export async function actualizarCalificacionPromedio(id, nuevaCalificacion, totalReseñas, session = null) {
    if (!esObjectIdValido(id)) {
        throw new Error('ID inválido');
    }
    
    const db = obtenerBD();
    const opciones = session ? { session } : {};
    await db.collection(COLLECTION).updateOne(
        { _id: convertirAObjectId(id) },
        {
            $set: {
                calificacionPromedio: nuevaCalificacion,
                totalReseñas,
                fechaActualizacion: new Date()
            }
        },
        opciones
    );
}

/**
 * Elimina un restaurante
 * @param {string} id - ID del restaurante
 * @returns {Promise<boolean>} - True si se eliminó correctamente
 */
export async function eliminarRestaurante(id) {
    if (!esObjectIdValido(id)) {
        throw new Error('ID inválido');
    }
    
    const db = obtenerBD();
    
    // Verificar si hay platos o reseñas asociados
    const platosAsociados = await db.collection('platos').countDocuments({
        restauranteId: convertirAObjectId(id)
    });
    
    const reseñasAsociadas = await db.collection('reseñas').countDocuments({
        restauranteId: convertirAObjectId(id)
    });
    
    if (platosAsociados > 0 || reseñasAsociadas > 0) {
        throw new Error('No se puede eliminar el restaurante porque tiene platos o reseñas asociados');
    }
    
    const resultado = await db.collection(COLLECTION).deleteOne({ _id: convertirAObjectId(id) });
    return resultado.deletedCount > 0;
}

