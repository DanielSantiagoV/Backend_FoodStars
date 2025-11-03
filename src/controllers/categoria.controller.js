// Importa las funciones del modelo de categorías
// Estas funciones manejan las operaciones CRUD (Create, Read, Update, Delete) con la base de datos
import {
    crearCategoria,  // Función para crear una nueva categoría
    obtenerCategorias,  // Función para obtener todas las categorías
    buscarCategoriaPorId,  // Función para buscar una categoría por su ID
    actualizarCategoria,  // Función para actualizar una categoría existente
    eliminarCategoria  // Función para eliminar una categoría
} from '../models/categoria.model.js';
// Importa funciones helper para enviar respuestas HTTP consistentes
// responderExito: envía respuestas exitosas con formato estándar
// responderError: envía respuestas de error con formato estándar
import { responderExito, responderError } from '../utils/helpers.js';
// Importa constantes desde el módulo de constants
// HTTP_STATUS: códigos de estado HTTP (200, 201, 404, etc.)
// ERROR_MESSAGES: mensajes de error predefinidos y consistentes
import { HTTP_STATUS, ERROR_MESSAGES } from '../utils/constants.js';

/**
 * Crear nueva categoría (solo admin)
 */
// Controlador exportado que maneja la creación de una nueva categoría
// Esta función se ejecuta cuando se recibe una petición POST para crear una categoría
// Parámetros: req (request con los datos en req.body), res (response para enviar la respuesta)
export const crear = async (req, res) => {
    try {
        // Llama a la función del modelo para crear la categoría
        // req.body contiene los datos enviados en el cuerpo de la petición HTTP
        const categoria = await crearCategoria(req.body);
        // Retorna una respuesta exitosa con código 201 (CREATED)
        // responderExito envía una respuesta JSON con el formato estándar de la API
        return responderExito(
            res,
            HTTP_STATUS.CREATED,  // Código 201: recurso creado exitosamente
            categoria,  // Datos de la categoría creada
            'Categoría creada exitosamente'  // Mensaje de confirmación
        );
    } catch (error) {
        // Maneja errores específicos
        // Si el error indica que ya existe una categoría con ese nombre
        if (error.message.includes('ya existe')) {
            // Retorna error 409 (Conflict) para indicar duplicado
            return responderError(res, HTTP_STATUS.CONFLICT, error.message);
        }
        // Para cualquier otro error, retorna error 500 (Internal Server Error)
        return responderError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message);
    }
};

/**
 * Obtener todas las categorías
 */
// Controlador exportado que maneja la obtención de todas las categorías
// Esta función se ejecuta cuando se recibe una petición GET para listar categorías
// Parámetros: req (request), res (response para enviar la respuesta)
export const obtenerTodas = async (req, res) => {
    try {
        // Llama a la función del modelo para obtener todas las categorías
        const categorias = await obtenerCategorias();
        // Retorna una respuesta exitosa con código 200 (OK) y la lista de categorías
        return responderExito(res, HTTP_STATUS.OK, categorias);
    } catch (error) {
        // Si ocurre un error, retorna error 500 (Internal Server Error)
        return responderError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message);
    }
};

/**
 * Obtener categoría por ID
 */
// Controlador exportado que maneja la obtención de una categoría específica por su ID
// Esta función se ejecuta cuando se recibe una petición GET con un ID en la URL
// Parámetros: req (request con id en req.params), res (response para enviar la respuesta)
export const obtenerPorId = async (req, res) => {
    try {
        // Extrae el ID de los parámetros de la URL
        // Si la ruta es /categorias/:id, el ID viene en req.params.id
        const { id } = req.params;
        // Llama a la función del modelo para buscar la categoría por ID
        const categoria = await buscarCategoriaPorId(id);
        
        // Si no se encontró la categoría, retorna error 404 (Not Found)
        if (!categoria) {
            return responderError(res, HTTP_STATUS.NOT_FOUND, 'Categoría no encontrada');
        }
        
        // Si se encontró, retorna una respuesta exitosa con código 200 (OK) y los datos de la categoría
        return responderExito(res, HTTP_STATUS.OK, categoria);
    } catch (error) {
        // Si ocurre un error, retorna error 500 (Internal Server Error)
        return responderError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message);
    }
};

/**
 * Actualizar categoría (solo admin)
 */
// Controlador exportado que maneja la actualización de una categoría existente
// Esta función se ejecuta cuando se recibe una petición PUT o PATCH para actualizar una categoría
// Parámetros: req (request con id en req.params y datos en req.body), res (response para enviar la respuesta)
export const actualizar = async (req, res) => {
    try {
        // Extrae el ID de los parámetros de la URL
        const { id } = req.params;
        // Llama a la función del modelo para actualizar la categoría
        // req.body contiene los campos a actualizar
        const categoria = await actualizarCategoria(id, req.body);
        
        // Si no se encontró la categoría, retorna error 404 (Not Found)
        if (!categoria) {
            return responderError(res, HTTP_STATUS.NOT_FOUND, 'Categoría no encontrada');
        }
        
        // Si se actualizó correctamente, retorna una respuesta exitosa con código 200 (OK)
        return responderExito(
            res,
            HTTP_STATUS.OK,
            categoria,  // Datos de la categoría actualizada
            'Categoría actualizada exitosamente'  // Mensaje de confirmación
        );
    } catch (error) {
        // Maneja diferentes tipos de errores
        // Si el error indica que ya existe una categoría con ese nombre
        if (error.message.includes('ya existe')) {
            // Retorna error 409 (Conflict) para indicar duplicado
            return responderError(res, HTTP_STATUS.CONFLICT, error.message);
        }
        // Si el error indica ID inválido o categoría no encontrada
        if (error.message.includes('inválido') || error.message.includes('no encontrada')) {
            // Retorna error 400 (Bad Request)
            return responderError(res, HTTP_STATUS.BAD_REQUEST, error.message);
        }
        // Para cualquier otro error, retorna error 500 (Internal Server Error)
        return responderError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message);
    }
};

/**
 * Eliminar categoría (solo admin)
 */
// Controlador exportado que maneja la eliminación de una categoría
// Esta función se ejecuta cuando se recibe una petición DELETE para eliminar una categoría
// Parámetros: req (request con id en req.params), res (response para enviar la respuesta)
export const eliminar = async (req, res) => {
    try {
        // Extrae el ID de los parámetros de la URL
        const { id } = req.params;
        // Llama a la función del modelo para eliminar la categoría
        // Retorna true si se eliminó, false si no se encontró
        const eliminado = await eliminarCategoria(id);
        
        // Si no se encontró la categoría, retorna error 404 (Not Found)
        if (!eliminado) {
            return responderError(res, HTTP_STATUS.NOT_FOUND, 'Categoría no encontrada');
        }
        
        // Si se eliminó correctamente, retorna una respuesta exitosa con código 204 (NO_CONTENT)
        // 204 No Content significa que la operación fue exitosa pero no hay contenido que retornar
        return responderExito(res, HTTP_STATUS.NO_CONTENT, null, 'Categoría eliminada exitosamente');
    } catch (error) {
        // Maneja errores específicos
        // Si el error indica que hay restaurantes asociados a la categoría
        if (error.message.includes('asociados')) {
            // Retorna error 409 (Conflict) porque no se puede eliminar si hay dependencias
            return responderError(res, HTTP_STATUS.CONFLICT, error.message);
        }
        // Para cualquier otro error, retorna error 500 (Internal Server Error)
        return responderError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message);
    }
};

