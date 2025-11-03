// Importa las funciones del modelo de restaurantes
// Estas funciones manejan las operaciones CRUD (Create, Read, Update, Delete) con la base de datos
import {
    crearRestaurante,  // Función para crear un nuevo restaurante
    crearRestauranteConPlatos,  // Función para crear restaurante con platos en transacción
    obtenerRestaurantes,  // Función para obtener restaurantes con filtros
    buscarRestaurantePorId,  // Función para buscar un restaurante por su ID
    actualizarRestaurante,  // Función para actualizar un restaurante existente
    aprobarRestaurante,  // Función para aprobar un restaurante (solo admin)
    eliminarRestaurante  // Función para eliminar un restaurante
} from '../models/restaurante.model.js';
// Importa funciones helper para enviar respuestas HTTP consistentes
// responderExito: envía respuestas exitosas con formato estándar
// responderError: envía respuestas de error con formato estándar
import { responderExito, responderError } from '../utils/helpers.js';
// Importa constantes desde el módulo de constants
// HTTP_STATUS: códigos de estado HTTP (200, 201, 404, etc.)
// ERROR_MESSAGES: mensajes de error predefinidos y consistentes
import { HTTP_STATUS, ERROR_MESSAGES } from '../utils/constants.js';

/**
 * Crear nuevo restaurante (requiere aprobación de admin)
 * Soporta crear restaurante con platos si se proporciona el array 'platos'
 */
// Controlador exportado que maneja la creación de un nuevo restaurante
// Esta función se ejecuta cuando se recibe una petición POST para crear un restaurante
// Soporta crear restaurante solo o restaurante con platos en una sola operación
// Parámetros: req (request con los datos en req.body), res (response para enviar la respuesta)
export const crear = async (req, res) => {
    try {
        // Separa platos del resto de datos del restaurante usando destructuring
        // platos: array opcional de platos a crear junto con el restaurante
        // ...restauranteData: resto de datos del restaurante (nombre, descripcion, categoriaId, etc.)
        const { platos, ...restauranteData } = req.body;
        
        // Variable para almacenar el resultado de la creación
        let resultado;
        
        // Si hay platos, crear restaurante con platos en transacción
        // Verifica que platos exista, sea un array y tenga elementos
        if (platos && Array.isArray(platos) && platos.length > 0) {
            // Crea el restaurante y los platos en una transacción atómica
            // Si falla cualquier plato, todo se revierte
            resultado = await crearRestauranteConPlatos(restauranteData, platos);
            // Retorna una respuesta exitosa con código 201 (CREATED)
            // Incluye el restaurante, los platos creados y el total de platos
            return responderExito(
                res,
                HTTP_STATUS.CREATED,  // Código 201: recurso creado exitosamente
                {
                    restaurante: resultado.restaurante,  // Datos del restaurante creado
                    platos: resultado.platos,  // Array de platos creados
                    totalPlatos: resultado.platos.length  // Cantidad de platos creados
                },
                `Restaurante creado exitosamente con ${resultado.platos.length} plato(s). Pendiente de aprobación por administrador`
            );
        } else {
            // Crear solo restaurante
            // Si no hay platos, crea solo el restaurante sin transacciones complejas
            const restaurante = await crearRestaurante(restauranteData);
            // Retorna una respuesta exitosa con código 201 (CREATED)
            return responderExito(
                res,
                HTTP_STATUS.CREATED,  // Código 201: recurso creado exitosamente
                restaurante,  // Datos del restaurante creado
                'Restaurante creado exitosamente. Pendiente de aprobación por administrador'
            );
        }
    } catch (error) {
        // Maneja errores específicos
        // Si el error indica que ya existe un restaurante con ese nombre
        if (error.message.includes('ya existe')) {
            // Retorna error 409 (Conflict) para indicar duplicado
            return responderError(res, HTTP_STATUS.CONFLICT, error.message);
        }
        // Si el error indica que la categoría no existe o el ID es inválido
        if (error.message.includes('no existe') || error.message.includes('inválido')) {
            // Retorna error 400 (Bad Request)
            return responderError(res, HTTP_STATUS.BAD_REQUEST, error.message);
        }
        // Para cualquier otro error, retorna error 500 (Internal Server Error)
        return responderError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message);
    }
};

/**
 * Obtener restaurantes con filtros
 */
// Controlador exportado que maneja la obtención de restaurantes con filtros y paginación
// Esta función se ejecuta cuando se recibe una petición GET para listar restaurantes
// Parámetros: req (request con filtros en req.query), res (response para enviar la respuesta)
export const obtenerTodos = async (req, res) => {
    try {
        // Extrae los filtros y opciones desde la query string de la URL
        // categoriaId: ID opcional de categoría para filtrar (default undefined)
        // ordenarPor: campo por el cual ordenar (default 'ranking')
        // orden: dirección del ordenamiento 'desc' o 'asc' (default 'desc')
        // soloAprobados: si mostrar solo restaurantes aprobados (default 'true' como string)
        const { categoriaId, ordenarPor = 'ranking', orden = 'desc', soloAprobados = 'true' } = req.query;
        // Extrae las opciones de paginación desde la query string
        // limite: número máximo de resultados (default 50)
        // saltar: número de resultados a omitir para paginación (default 0)
        const { limite = 50, saltar = 0 } = req.query;
        
        // Construye el objeto de filtros
        const filtros = {
            categoriaId,  // ID de categoría para filtrar
            ordenarPor,  // Campo por el cual ordenar
            orden,  // Dirección del ordenamiento
            soloAprobados: soloAprobados === 'true'  // Convierte el string 'true'/'false' a boolean
        };
        
        // Construye el objeto de opciones de paginación
        const opciones = {
            limite: parseInt(limite),  // Convierte el string a número entero
            saltar: parseInt(saltar)  // Convierte el string a número entero
        };
        
        // Llama a la función del modelo para obtener los restaurantes con filtros y paginación
        const restaurantes = await obtenerRestaurantes(filtros, opciones);
        // Retorna una respuesta exitosa con código 200 (OK) y la lista de restaurantes
        return responderExito(res, HTTP_STATUS.OK, restaurantes);
    } catch (error) {
        // Si ocurre un error, retorna error 500 (Internal Server Error)
        return responderError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message);
    }
};

/**
 * Obtener restaurante por ID
 */
// Controlador exportado que maneja la obtención de un restaurante específico por su ID
// Esta función se ejecuta cuando se recibe una petición GET con un ID en la URL
// Parámetros: req (request con id en req.params), res (response para enviar la respuesta)
export const obtenerPorId = async (req, res) => {
    try {
        // Extrae el ID de los parámetros de la URL
        // Si la ruta es /restaurantes/:id, el ID viene en req.params.id
        const { id } = req.params;
        // Llama a la función del modelo para buscar el restaurante por ID
        const restaurante = await buscarRestaurantePorId(id);
        
        // Si no se encontró el restaurante, retorna error 404 (Not Found)
        if (!restaurante) {
            return responderError(res, HTTP_STATUS.NOT_FOUND, 'Restaurante no encontrado');
        }
        
        // Si se encontró, retorna una respuesta exitosa con código 200 (OK) y los datos del restaurante
        return responderExito(res, HTTP_STATUS.OK, restaurante);
    } catch (error) {
        // Si ocurre un error, retorna error 500 (Internal Server Error)
        return responderError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message);
    }
};

/**
 * Actualizar restaurante
 */
// Controlador exportado que maneja la actualización de un restaurante existente
// Esta función se ejecuta cuando se recibe una petición PUT o PATCH para actualizar un restaurante
// Parámetros: req (request con id en req.params y datos en req.body), res (response para enviar la respuesta)
export const actualizar = async (req, res) => {
    try {
        // Extrae el ID de los parámetros de la URL
        const { id } = req.params;
        // Llama a la función del modelo para actualizar el restaurante
        // req.body contiene los campos a actualizar (nombre, descripcion, categoriaId, etc.)
        const restaurante = await actualizarRestaurante(id, req.body);
        
        // Si no se encontró el restaurante, retorna error 404 (Not Found)
        if (!restaurante) {
            return responderError(res, HTTP_STATUS.NOT_FOUND, 'Restaurante no encontrado');
        }
        
        // Si se actualizó correctamente, retorna una respuesta exitosa con código 200 (OK)
        return responderExito(
            res,
            HTTP_STATUS.OK,
            restaurante,  // Datos del restaurante actualizado
            'Restaurante actualizado exitosamente'  // Mensaje de confirmación
        );
    } catch (error) {
        // Maneja diferentes tipos de errores
        // Si el error indica que ya existe un restaurante con ese nombre
        if (error.message.includes('ya existe')) {
            // Retorna error 409 (Conflict) para indicar duplicado
            return responderError(res, HTTP_STATUS.CONFLICT, error.message);
        }
        // Si el error indica ID inválido o categoría no existe
        if (error.message.includes('inválido') || error.message.includes('no existe')) {
            // Retorna error 400 (Bad Request)
            return responderError(res, HTTP_STATUS.BAD_REQUEST, error.message);
        }
        // Para cualquier otro error, retorna error 500 (Internal Server Error)
        return responderError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message);
    }
};

/**
 * Aprobar restaurante (solo admin)
 */
// Controlador exportado que maneja la aprobación de un restaurante (solo para administradores)
// Cuando un restaurante se aprueba, puede ser visible para todos los usuarios
// Esta función se ejecuta cuando se recibe una petición PUT/PATCH para aprobar un restaurante
// Parámetros: req (request con id en req.params), res (response para enviar la respuesta)
export const aprobar = async (req, res) => {
    try {
        // Extrae el ID de los parámetros de la URL
        const { id } = req.params;
        // Llama a la función del modelo para aprobar el restaurante
        // Marca el restaurante como aprobado (aprobado: true)
        const restaurante = await aprobarRestaurante(id);
        
        // Si no se encontró el restaurante, retorna error 404 (Not Found)
        if (!restaurante) {
            return responderError(res, HTTP_STATUS.NOT_FOUND, 'Restaurante no encontrado');
        }
        
        // Si se aprobó correctamente, retorna una respuesta exitosa con código 200 (OK)
        return responderExito(
            res,
            HTTP_STATUS.OK,
            restaurante,  // Datos del restaurante aprobado
            'Restaurante aprobado exitosamente'  // Mensaje de confirmación
        );
    } catch (error) {
        // Si ocurre un error, retorna error 500 (Internal Server Error)
        return responderError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message);
    }
};

/**
 * Eliminar restaurante
 */
// Controlador exportado que maneja la eliminación de un restaurante
// Esta función se ejecuta cuando se recibe una petición DELETE para eliminar un restaurante
// Parámetros: req (request con id en req.params), res (response para enviar la respuesta)
export const eliminar = async (req, res) => {
    try {
        // Extrae el ID de los parámetros de la URL
        const { id } = req.params;
        // Llama a la función del modelo para eliminar el restaurante
        // Retorna true si se eliminó, false si no se encontró
        // Nota: No permite eliminar si hay platos o reseñas asociados
        const eliminado = await eliminarRestaurante(id);
        
        // Si no se encontró el restaurante, retorna error 404 (Not Found)
        if (!eliminado) {
            return responderError(res, HTTP_STATUS.NOT_FOUND, 'Restaurante no encontrado');
        }
        
        // Si se eliminó correctamente, retorna una respuesta exitosa con código 204 (NO_CONTENT)
        // 204 No Content significa que la operación fue exitosa pero no hay contenido que retornar
        return responderExito(res, HTTP_STATUS.NO_CONTENT, null, 'Restaurante eliminado exitosamente');
    } catch (error) {
        // Maneja errores específicos
        // Si el error indica que hay platos o reseñas asociados al restaurante
        if (error.message.includes('asociados')) {
            // Retorna error 409 (Conflict) porque no se puede eliminar si hay dependencias
            return responderError(res, HTTP_STATUS.CONFLICT, error.message);
        }
        // Para cualquier otro error, retorna error 500 (Internal Server Error)
        return responderError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message);
    }
};

