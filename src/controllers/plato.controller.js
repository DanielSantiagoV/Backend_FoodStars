// Importa las funciones del modelo de platos
// Estas funciones manejan las operaciones CRUD (Create, Read, Update, Delete) con la base de datos
import {
    crearPlato,  // Función para crear un nuevo plato
    obtenerPlatosPorRestaurante,  // Función para obtener todos los platos de un restaurante
    buscarPlatoPorId,  // Función para buscar un plato por su ID
    actualizarPlato,  // Función para actualizar un plato existente
    eliminarPlato  // Función para eliminar un plato
} from '../models/plato.model.js';
// Importa funciones helper para enviar respuestas HTTP consistentes
// responderExito: envía respuestas exitosas con formato estándar
// responderError: envía respuestas de error con formato estándar
import { responderExito, responderError } from '../utils/helpers.js';
// Importa constantes desde el módulo de constants
// HTTP_STATUS: códigos de estado HTTP (200, 201, 404, etc.)
import { HTTP_STATUS } from '../utils/constants.js';

/**
 * Crear nuevo plato
 */
// Controlador exportado que maneja la creación de un nuevo plato
// Esta función se ejecuta cuando se recibe una petición POST para crear un plato
// Parámetros: req (request con los datos en req.body), res (response para enviar la respuesta)
export const crear = async (req, res) => {
    try {
        // Llama a la función del modelo para crear el plato
        // req.body contiene los datos enviados en el cuerpo de la petición HTTP (nombre, descripcion, restauranteId, etc.)
        const plato = await crearPlato(req.body);
        // Retorna una respuesta exitosa con código 201 (CREATED)
        // responderExito envía una respuesta JSON con el formato estándar de la API
        return responderExito(
            res,
            HTTP_STATUS.CREATED,  // Código 201: recurso creado exitosamente
            plato,  // Datos del plato creado
            'Plato creado exitosamente'  // Mensaje de confirmación
        );
    } catch (error) {
        // Maneja errores específicos
        // Si el error indica que ya existe un plato con ese nombre en el restaurante
        if (error.message.includes('ya existe')) {
            // Retorna error 409 (Conflict) para indicar duplicado
            return responderError(res, HTTP_STATUS.CONFLICT, error.message);
        }
        // Si el error indica que el restaurante no existe o el ID es inválido
        if (error.message.includes('no existe') || error.message.includes('inválido')) {
            // Retorna error 400 (Bad Request)
            return responderError(res, HTTP_STATUS.BAD_REQUEST, error.message);
        }
        // Para cualquier otro error, retorna error 500 (Internal Server Error)
        return responderError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message);
    }
};

/**
 * Obtener platos de un restaurante
 */
// Controlador exportado que maneja la obtención de todos los platos de un restaurante específico
// Esta función se ejecuta cuando se recibe una petición GET para listar platos de un restaurante
// Parámetros: req (request con restauranteId en req.params), res (response para enviar la respuesta)
export const obtenerPorRestaurante = async (req, res) => {
    try {
        // Extrae el restauranteId de los parámetros de la URL
        // Si la ruta es /restaurantes/:restauranteId/platos, el ID viene en req.params.restauranteId
        const { restauranteId } = req.params;
        // Llama a la función del modelo para obtener todos los platos del restaurante
        const platos = await obtenerPlatosPorRestaurante(restauranteId);
        // Retorna una respuesta exitosa con código 200 (OK) y la lista de platos
        return responderExito(res, HTTP_STATUS.OK, platos);
    } catch (error) {
        // Maneja errores específicos
        // Si el error indica que el restauranteId es inválido
        if (error.message.includes('inválido')) {
            // Retorna error 400 (Bad Request)
            return responderError(res, HTTP_STATUS.BAD_REQUEST, error.message);
        }
        // Para cualquier otro error, retorna error 500 (Internal Server Error)
        return responderError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message);
    }
};

/**
 * Obtener plato por ID
 */
// Controlador exportado que maneja la obtención de un plato específico por su ID
// Esta función se ejecuta cuando se recibe una petición GET con un ID en la URL
// Parámetros: req (request con id en req.params), res (response para enviar la respuesta)
export const obtenerPorId = async (req, res) => {
    try {
        // Extrae el ID de los parámetros de la URL
        // Si la ruta es /platos/:id, el ID viene en req.params.id
        const { id } = req.params;
        // Llama a la función del modelo para buscar el plato por ID
        const plato = await buscarPlatoPorId(id);
        
        // Si no se encontró el plato, retorna error 404 (Not Found)
        if (!plato) {
            return responderError(res, HTTP_STATUS.NOT_FOUND, 'Plato no encontrado');
        }
        
        // Si se encontró, retorna una respuesta exitosa con código 200 (OK) y los datos del plato
        return responderExito(res, HTTP_STATUS.OK, plato);
    } catch (error) {
        // Si ocurre un error, retorna error 500 (Internal Server Error)
        return responderError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message);
    }
};

/**
 * Actualizar plato
 */
// Controlador exportado que maneja la actualización de un plato existente
// Esta función se ejecuta cuando se recibe una petición PUT o PATCH para actualizar un plato
// Parámetros: req (request con id en req.params y datos en req.body), res (response para enviar la respuesta)
export const actualizar = async (req, res) => {
    try {
        // Extrae el ID de los parámetros de la URL
        const { id } = req.params;
        // Llama a la función del modelo para actualizar el plato
        // req.body contiene los campos a actualizar (nombre, descripcion, precio, imagen, etc.)
        const plato = await actualizarPlato(id, req.body);
        
        // Si no se encontró el plato, retorna error 404 (Not Found)
        if (!plato) {
            return responderError(res, HTTP_STATUS.NOT_FOUND, 'Plato no encontrado');
        }
        
        // Si se actualizó correctamente, retorna una respuesta exitosa con código 200 (OK)
        return responderExito(
            res,
            HTTP_STATUS.OK,
            plato,  // Datos del plato actualizado
            'Plato actualizado exitosamente'  // Mensaje de confirmación
        );
    } catch (error) {
        // Maneja diferentes tipos de errores
        // Si el error indica que ya existe un plato con ese nombre en el restaurante
        if (error.message.includes('ya existe')) {
            // Retorna error 409 (Conflict) para indicar duplicado
            return responderError(res, HTTP_STATUS.CONFLICT, error.message);
        }
        // Si el error indica ID inválido o plato no encontrado
        if (error.message.includes('inválido') || error.message.includes('no encontrado')) {
            // Retorna error 400 (Bad Request)
            return responderError(res, HTTP_STATUS.BAD_REQUEST, error.message);
        }
        // Para cualquier otro error, retorna error 500 (Internal Server Error)
        return responderError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message);
    }
};

/**
 * Eliminar plato
 */
// Controlador exportado que maneja la eliminación de un plato
// Esta función se ejecuta cuando se recibe una petición DELETE para eliminar un plato
// Parámetros: req (request con id en req.params), res (response para enviar la respuesta)
export const eliminar = async (req, res) => {
    try {
        // Extrae el ID de los parámetros de la URL
        const { id } = req.params;
        // Llama a la función del modelo para eliminar el plato
        // Retorna true si se eliminó, false si no se encontró
        const eliminado = await eliminarPlato(id);
        
        // Si no se encontró el plato, retorna error 404 (Not Found)
        if (!eliminado) {
            return responderError(res, HTTP_STATUS.NOT_FOUND, 'Plato no encontrado');
        }
        
        // Si se eliminó correctamente, retorna una respuesta exitosa con código 204 (NO_CONTENT)
        // 204 No Content significa que la operación fue exitosa pero no hay contenido que retornar
        return responderExito(res, HTTP_STATUS.NO_CONTENT, null, 'Plato eliminado exitosamente');
    } catch (error) {
        // Si ocurre un error, retorna error 500 (Internal Server Error)
        return responderError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message);
    }
};

