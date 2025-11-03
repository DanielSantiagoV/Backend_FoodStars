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
// Importa la función crearPlato desde el modelo de platos
// Se usa para crear platos cuando se crea un restaurante con platos en una transacción
import { crearPlato } from './plato.model.js';

// Define el nombre de la colección en MongoDB donde se almacenan los restaurantes
// Esta constante evita errores de tipeo y facilita el mantenimiento
const COLLECTION = 'restaurantes';

/**
 * Crea un nuevo restaurante
 * @param {object} restauranteData - Datos del restaurante
 * @param {object} session - Sesión de transacción MongoDB (opcional)
 * @returns {Promise<object>} - Restaurante creado
 */
// Función asíncrona exportada que crea un nuevo restaurante en la base de datos
// Parámetros:
//   restauranteData - objeto con los datos del restaurante (nombre, descripcion, categoriaId, ubicacion, imagen)
//   session - sesión de transacción MongoDB opcional para operaciones atómicas
// Retorna: Promise que se resuelve con el objeto del restaurante creado incluyendo su _id
export async function crearRestaurante(restauranteData, session = null) {
    // Obtiene la referencia a la base de datos MongoDB
    const db = obtenerBD();
    // Extrae los campos del objeto restauranteData usando destructuring
    // Esto permite acceder fácilmente a estos campos sin usar restauranteData.nombre
    const { nombre, descripcion, categoriaId, ubicacion, imagen } = restauranteData;
    
    // Prepara las opciones para las operaciones de MongoDB
    // Si hay una sesión de transacción, la incluye; sino usa objeto vacío
    // Las sesiones permiten agrupar múltiples operaciones en transacciones atómicas
    const opciones = session ? { session } : {};
    
    // Verificar si el nombre ya existe
    // Busca en la colección si ya existe un restaurante con el mismo nombre
    // findOne() retorna el primer documento que coincida o null si no encuentra nada
    const restauranteExistente = await db.collection(COLLECTION).findOne({ nombre }, opciones);
    // Si ya existe un restaurante con ese nombre, lanza un error
    // Esto previene duplicados ya que el nombre debe ser único
    if (restauranteExistente) {
        throw new Error('Ya existe un restaurante con ese nombre');
    }
    
    // Verificar que la categoría existe
    // Si se proporcionó un categoriaId, valida que tenga el formato correcto de ObjectId
    // Si el ID no es válido, lanza un error antes de hacer la consulta
    if (categoriaId && !esObjectIdValido(categoriaId)) {
        throw new Error('ID de categoría inválido');
    }
    
    // Si se proporcionó un categoriaId, verifica que la categoría exista
    if (categoriaId) {
        // Busca la categoría en la base de datos
        const categoria = await db.collection('categorias').findOne({
            _id: convertirAObjectId(categoriaId)
        }, opciones);
        // Si la categoría no existe, lanza un error
        // Esto mantiene la integridad referencial de los datos
        if (!categoria) {
            throw new Error('La categoría especificada no existe');
        }
    }
    
    // Crea el objeto del nuevo restaurante con los datos proporcionados
    const nuevoRestaurante = {
        nombre,  // Nombre del restaurante (ej: "La Trattoria", "El Mexicano")
        // Descripción es opcional, si no se proporciona usa string vacío
        descripcion: descripcion || '',
        // Si hay categoriaId, lo convierte a ObjectId; sino usa null
        categoriaId: categoriaId ? convertirAObjectId(categoriaId) : null,
        // Ubicación es opcional, si no se proporciona usa string vacío
        ubicacion: ubicacion || '',
        // Imagen es opcional, si no se proporciona usa null
        imagen: imagen || null,
        aprobado: false,  // Requiere aprobación de admin
        // Los nuevos restaurantes empiezan sin aprobar hasta que un administrador los apruebe
        calificacionPromedio: 0,  // Inicializa el promedio de calificaciones en 0
        totalReseñas: 0,  // Inicializa el contador de reseñas en 0
        ranking: 0,  // Inicializa el ranking en 0 (se calculará basado en calificaciones)
        fechaCreacion: new Date(),  // Marca de tiempo cuando se creó el restaurante
        fechaActualizacion: new Date()  // Marca de tiempo, inicialmente igual a fechaCreacion
    };
    
    // Inserta el nuevo restaurante en la colección de MongoDB
    // insertOne() inserta un documento y retorna información sobre la operación
    // Si hay una sesión, las operaciones forman parte de una transacción
    const resultado = await db.collection(COLLECTION).insertOne(nuevoRestaurante, opciones);
    // Retorna el restaurante creado incluyendo el _id generado automáticamente por MongoDB
    // resultado.insertedId contiene el ObjectId generado para el nuevo documento
    // El spread operator (...) incluye todas las propiedades de nuevoRestaurante
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
// Función asíncrona exportada que crea un restaurante junto con sus platos en una sola operación
// Intenta usar transacciones para garantizar atomicidad (todo o nada)
// Parámetros:
//   restauranteData - objeto con los datos del restaurante
//   platosData - array opcional de objetos con los datos de los platos a crear
// Retorna: Promise que se resuelve con un objeto conteniendo el restaurante y los platos creados
export async function crearRestauranteConPlatos(restauranteData, platosData = []) {
    // Obtiene la referencia a la base de datos MongoDB
    const db = obtenerBD();
    
    // Extraer platos del restauranteData si vienen incluidos
    // Prioriza platosData si tiene elementos, sino busca en restauranteData.platos, sino array vacío
    // Esto permite pasar los platos como parámetro separado o dentro de restauranteData
    const platos = platosData.length > 0 ? platosData : (restauranteData.platos || []);
    
    // Crear restaurante y platos en transacción si está disponible
    // Importación dinámica del servicio de transacciones (solo se importa si es necesario)
    const { ejecutarTransaccion } = await import('../services/transacciones.service.js');
    
    try {
        // Intenta ejecutar la operación en una transacción
        // ejecutarTransaccion ejecuta una función callback con una sesión de transacción
        // Si algo falla, toda la transacción se revierte (rollback)
        return await ejecutarTransaccion(async (session) => {
            // Crear restaurante
            // Crea el restaurante usando la sesión de transacción
            const restaurante = await crearRestaurante(restauranteData, session);
            // Convierte el ObjectId a string para usarlo en los platos
            const restauranteId = restaurante._id.toString();
            
            // Crear platos si se proporcionaron
            // Array que almacenará los platos creados exitosamente
            const platosCreados = [];
            // Verifica que haya platos para crear
            if (platos && platos.length > 0) {
                // Itera sobre cada plato a crear
                for (const platoData of platos) {
                    try {
                        // Crea el plato usando la función crearPlato del modelo de platos
                        // Agrega el restauranteId al objeto del plato y pasa la sesión
                        const plato = await crearPlato({
                            ...platoData,  // Spread operator incluye todos los campos del plato
                            restauranteId  // Agrega el ID del restaurante recién creado
                        }, session);
                        // Agrega el plato creado al array de platos creados
                        platosCreados.push(plato);
                    } catch (error) {
                        // Si hay un error creando un plato, lo registra en consola
                        console.error(`Error creando plato ${platoData.nombre}:`, error);
                        // Lanza el error para que la transacción se revierta completamente
                        // Esto asegura que si un plato falla, todo el restaurante y platos se revierten
                        throw new Error(`Error al crear plato "${platoData.nombre}": ${error.message}`);
                    }
                }
            }
            
            // Retorna el restaurante y los platos creados
            return {
                restaurante,
                platos: platosCreados
            };
        });
    } catch (error) {
        // Si las transacciones no están disponibles, crear sin transacción
        // Fallback: si las transacciones fallan (por ejemplo, en MongoDB standalone), crea sin transacción
        // Esto permite que la funcionalidad siga trabajando aunque no haya soporte de transacciones
        console.warn('Transacciones no disponibles, creando sin transacción');
        // Crea el restaurante sin sesión de transacción
        const restaurante = await crearRestaurante(restauranteData);
        // Convierte el ObjectId a string para usarlo en los platos
        const restauranteId = restaurante._id.toString();
        
        // Array que almacenará los platos creados exitosamente
        const platosCreados = [];
        // Verifica que haya platos para crear
        if (platos && platos.length > 0) {
            // Itera sobre cada plato a crear
            for (const platoData of platos) {
                try {
                    // Crea el plato sin sesión de transacción
                    const plato = await crearPlato({
                        ...platoData,  // Spread operator incluye todos los campos del plato
                        restauranteId  // Agrega el ID del restaurante recién creado
                    });
                    // Agrega el plato creado al array de platos creados
                    platosCreados.push(plato);
                } catch (error) {
                    // Si hay un error creando un plato, lo registra pero continúa con los demás
                    // Sin transacciones, los platos que se crearon exitosamente permanecen
                    console.error(`Error creando plato ${platoData.nombre}:`, error);
                }
            }
        }
        
        // Retorna el restaurante y los platos que se pudieron crear
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
// Función asíncrona exportada que obtiene restaurantes con filtros, ordenamiento y paginación
// Parámetros:
//   filtros - objeto con filtros de búsqueda (ordenarPor, orden, categoriaId, soloAprobados)
//   opciones - objeto con opciones de paginación (limite, saltar)
// Retorna: Promise que se resuelve con un array de restaurantes que cumplen los filtros
export async function obtenerRestaurantes(filtros = {}, opciones = {}) {
    // Obtiene la referencia a la base de datos MongoDB
    const db = obtenerBD();
    // Extrae los filtros con valores por defecto
    // ordenarPor: campo por el cual ordenar (default 'ranking')
    // orden: dirección del ordenamiento 'desc' o 'asc' (default 'desc')
    // categoriaId: ID opcional de categoría para filtrar
    // soloAprobados: si mostrar solo restaurantes aprobados (default true)
    const { ordenarPor = 'ranking', orden = 'desc', categoriaId, soloAprobados = true } = filtros;
    // Extrae las opciones de paginación con valores por defecto
    // limite: número máximo de resultados (default 50)
    // saltar: número de resultados a omitir para paginación (default 0)
    const { limite = 50, saltar = 0 } = opciones;
    
    // Construye el objeto de consulta (query) para MongoDB
    const query = {};
    
    // Si soloAprobados es true, filtra solo restaurantes aprobados
    // Por defecto solo muestra restaurantes aprobados a los usuarios
    if (soloAprobados) {
        query.aprobado = true;
    }
    
    // Si se proporcionó un categoriaId válido, lo agrega al filtro
    // Esto permite filtrar restaurantes por categoría
    if (categoriaId && esObjectIdValido(categoriaId)) {
        query.categoriaId = convertirAObjectId(categoriaId);
    }
    
    // Construye el objeto de opciones de ordenamiento
    // sortOptions[ordenarPor] = -1 si es descendente, 1 si es ascendente
    const sortOptions = {};
    sortOptions[ordenarPor] = orden === 'desc' ? -1 : 1;
    
    // Ejecuta la consulta con filtros, ordenamiento y paginación
    // find() busca documentos que coincidan con el query
    // sort() ordena los resultados según sortOptions
    // limit() limita el número de resultados
    // skip() omite los primeros N resultados (para paginación)
    // toArray() convierte el cursor de MongoDB a un array de JavaScript
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
// Función asíncrona exportada que busca un restaurante específico por su ID
// Parámetros: id - string con el ID del restaurante a buscar
// Retorna: Promise que se resuelve con el restaurante encontrado o null si no existe o el ID es inválido
export async function buscarRestaurantePorId(id) {
    // Valida que el ID tenga el formato correcto de ObjectId de MongoDB
    // Si el ID no es válido, retorna null inmediatamente sin hacer la consulta
    if (!esObjectIdValido(id)) {
        return null;
    }
    // Obtiene la referencia a la base de datos MongoDB
    const db = obtenerBD();
    // Busca un restaurante por su _id
    // convertirAObjectId() convierte el string del ID a ObjectId para la consulta
    // findOne() retorna el documento encontrado o null si no existe
    return await db.collection(COLLECTION).findOne({ _id: convertirAObjectId(id) });
}

/**
 * Actualiza un restaurante
 * @param {string} id - ID del restaurante
 * @param {object} datosActualizacion - Datos a actualizar
 * @returns {Promise<object|null>} - Restaurante actualizado
 */
// Función asíncrona exportada que actualiza un restaurante existente
// Parámetros:
//   id - string con el ID del restaurante a actualizar
//   datosActualizacion - objeto con los campos a actualizar (nombre, descripcion, categoriaId, etc.)
// Retorna: Promise que se resuelve con el restaurante actualizado o null si no se encontró
export async function actualizarRestaurante(id, datosActualizacion) {
    // Valida que el ID tenga el formato correcto de ObjectId
    // Si el ID no es válido, lanza un error antes de hacer la consulta
    if (!esObjectIdValido(id)) {
        throw new Error('ID inválido');
    }
    
    // Obtiene la referencia a la base de datos MongoDB
    const db = obtenerBD();
    
    // Si se actualiza el nombre, verificar que no exista otro restaurante con ese nombre
    // Esta validación previene duplicados cuando se cambia el nombre de un restaurante
    if (datosActualizacion.nombre) {
        // Busca si existe otro restaurante (diferente al actual) con el mismo nombre
        // $ne significa "not equal" (no igual), excluye el restaurante que se está actualizando
        const restauranteExistente = await db.collection(COLLECTION).findOne({
            nombre: datosActualizacion.nombre,
            _id: { $ne: convertirAObjectId(id) }
        });
        // Si ya existe otro restaurante con ese nombre, lanza un error
        if (restauranteExistente) {
            throw new Error('Ya existe un restaurante con ese nombre');
        }
    }
    
    // Si se actualiza la categoría, verificar que existe
    // Valida que la nueva categoría exista antes de actualizarla
    if (datosActualizacion.categoriaId) {
        // Valida que el categoriaId tenga el formato correcto de ObjectId
        if (!esObjectIdValido(datosActualizacion.categoriaId)) {
            throw new Error('ID de categoría inválido');
        }
        // Busca la categoría en la base de datos
        const categoria = await db.collection('categorias').findOne({
            _id: convertirAObjectId(datosActualizacion.categoriaId)
        });
        // Si la categoría no existe, lanza un error
        // Esto mantiene la integridad referencial de los datos
        if (!categoria) {
            throw new Error('La categoría especificada no existe');
        }
        // Convierte el categoriaId a ObjectId para almacenarlo correctamente
        datosActualizacion.categoriaId = convertirAObjectId(datosActualizacion.categoriaId);
    }
    
    // Prepara el objeto de actualización combinando los datos nuevos con la fecha de actualización
    const actualizacion = {
        // Spread operator incluye todos los campos de datosActualizacion (nombre, descripcion, etc.)
        ...datosActualizacion,
        // Actualiza automáticamente la fecha de modificación
        fechaActualizacion: new Date()
    };
    
    // Actualiza el restaurante en la base de datos
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
 * Aprueba un restaurante (solo admin)
 * @param {string} id - ID del restaurante
 * @returns {Promise<object|null>} - Restaurante actualizado
 */
// Función asíncrona exportada que aprueba un restaurante (solo para administradores)
// Cuando un restaurante se aprueba, puede ser visible para todos los usuarios
// Parámetros: id - string con el ID del restaurante a aprobar
// Retorna: Promise que se resuelve con el restaurante actualizado o null si no se encontró
export async function aprobarRestaurante(id) {
    // Valida que el ID tenga el formato correcto de ObjectId
    // Si el ID no es válido, lanza un error antes de hacer la consulta
    if (!esObjectIdValido(id)) {
        throw new Error('ID inválido');
    }
    
    // Obtiene la referencia a la base de datos MongoDB
    const db = obtenerBD();
    // Actualiza el restaurante marcándolo como aprobado
    // findOneAndUpdate() busca y actualiza en una sola operación
    // Primer parámetro: filtro para encontrar el documento (_id)
    // Segundo parámetro: operación de actualización ($set establece aprobado: true y fechaActualizacion)
    // Tercer parámetro: opciones (returnDocument: 'after' retorna el documento actualizado)
    const resultado = await db.collection(COLLECTION).findOneAndUpdate(
        { _id: convertirAObjectId(id) },
        { 
            $set: { 
                aprobado: true,  // Marca el restaurante como aprobado
                fechaActualizacion: new Date()  // Actualiza la fecha de modificación
            }
        },
        { returnDocument: 'after' }
    );
    
    // Retorna el resultado de la operación (el documento actualizado o null si no se encontró)
    return resultado;
}

/**
 * Actualiza la calificación promedio de un restaurante
 * @param {string} id - ID del restaurante
 * @param {number} nuevaCalificacion - Nueva calificación promedio
 * @param {number} totalReseñas - Total de reseñas
 * @returns {Promise<void>}
 */
// Función asíncrona exportada que actualiza la calificación promedio y el total de reseñas de un restaurante
// Esta función se llama cuando se crea, actualiza o elimina una reseña para mantener los datos actualizados
// Parámetros:
//   id - string con el ID del restaurante
//   nuevaCalificacion - número con la nueva calificación promedio calculada
//   totalReseñas - número con el total de reseñas del restaurante
//   session - sesión de transacción MongoDB opcional para operaciones atómicas
// Retorna: Promise que se resuelve sin valor (void)
export async function actualizarCalificacionPromedio(id, nuevaCalificacion, totalReseñas, session = null) {
    // Valida que el ID tenga el formato correcto de ObjectId
    // Si el ID no es válido, lanza un error antes de hacer la consulta
    if (!esObjectIdValido(id)) {
        throw new Error('ID inválido');
    }
    
    // Obtiene la referencia a la base de datos MongoDB
    const db = obtenerBD();
    // Prepara las opciones para la operación de actualización
    // Si hay una sesión de transacción, la incluye; sino usa objeto vacío
    const opciones = session ? { session } : {};
    // Actualiza la calificación promedio y el total de reseñas
    // updateOne() actualiza un documento que coincida con el filtro
    // Primer parámetro: filtro para encontrar el documento (_id)
    // Segundo parámetro: operación de actualización ($set establece los nuevos valores)
    // Tercer parámetro: opciones (session si existe)
    await db.collection(COLLECTION).updateOne(
        { _id: convertirAObjectId(id) },
        {
            $set: {
                calificacionPromedio: nuevaCalificacion,  // Actualiza el promedio de calificaciones
                totalReseñas,  // Actualiza el contador total de reseñas
                fechaActualizacion: new Date()  // Actualiza la fecha de modificación
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
// Función asíncrona exportada que elimina un restaurante de la base de datos
// Parámetros: id - string con el ID del restaurante a eliminar
// Retorna: Promise que se resuelve con true si se eliminó correctamente, false si no se encontró
export async function eliminarRestaurante(id) {
    // Valida que el ID tenga el formato correcto de ObjectId
    // Si el ID no es válido, lanza un error antes de hacer la consulta
    if (!esObjectIdValido(id)) {
        throw new Error('ID inválido');
    }
    
    // Obtiene la referencia a la base de datos MongoDB
    const db = obtenerBD();
    
    // Verificar si hay platos o reseñas asociados
    // Antes de eliminar, verifica que no haya platos o reseñas que dependan de este restaurante
    // Esto previene la eliminación de restaurantes que tienen datos asociados (integridad referencial)
    // countDocuments() cuenta cuántos documentos coinciden con el filtro
    const platosAsociados = await db.collection('platos').countDocuments({
        // Busca platos que tengan este restauranteId
        restauranteId: convertirAObjectId(id)
    });
    
    // Cuenta las reseñas asociadas al restaurante
    const reseñasAsociadas = await db.collection('reseñas').countDocuments({
        // Busca reseñas que tengan este restauranteId
        restauranteId: convertirAObjectId(id)
    });
    
    // Si hay platos o reseñas asociados, no se puede eliminar
    // Esto mantiene la integridad de los datos y evita referencias rotas
    if (platosAsociados > 0 || reseñasAsociadas > 0) {
        throw new Error('No se puede eliminar el restaurante porque tiene platos o reseñas asociados');
    }
    
    // Elimina el restaurante de la base de datos
    // deleteOne() elimina un documento que coincida con el filtro
    // Retorna información sobre la operación incluyendo deletedCount (número de documentos eliminados)
    const resultado = await db.collection(COLLECTION).deleteOne({ _id: convertirAObjectId(id) });
    // Retorna true si se eliminó al menos un documento (deletedCount > 0), false en caso contrario
    // Esto indica si la operación fue exitosa o si no se encontró el restaurante
    return resultado.deletedCount > 0;
}

