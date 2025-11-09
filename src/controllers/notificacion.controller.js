// Importa las funciones del modelo de notificaciones
// Estas funciones manejan las operaciones CRUD (Create, Read, Update) con las notificaciones en la base de datos
import {
    obtenerNotificacionesPorUsuario,  // Función para obtener notificaciones de un usuario
    marcarNotificacionComoVista,  // Función para marcar una notificación como vista
    contarNotificacionesNoVistas  // Función para contar notificaciones no vistas
} from '../models/notificacion.model.js';
// Importa funciones helper para utilidades
// responderExito: envía respuestas exitosas con formato estándar
// responderError: envía respuestas de error con formato estándar
// convertirAObjectId: convierte un string a ObjectId de MongoDB
import { responderExito, responderError, convertirAObjectId } from '../utils/helpers.js';
// Importa la función para obtener la referencia a la base de datos
import { obtenerBD } from '../config/db.js';
// Importa constantes desde el módulo de constants
// HTTP_STATUS: códigos de estado HTTP (200, 201, 404, etc.)
import { HTTP_STATUS } from '../utils/constants.js';

/**
 * Obtener notificaciones de un usuario
 */
// Controlador exportado que maneja la obtención de notificaciones de un usuario específico
// Esta función se ejecuta cuando se recibe una petición GET para listar notificaciones de un usuario
// Parámetros: req (request con usuarioId en req.params y opciones en req.query), res (response para enviar la respuesta)
export const obtenerNotificaciones = async (req, res) => {
    try {
        // Extrae el usuarioId de los parámetros de la URL
        // Si la ruta es /notificaciones/:usuarioId, el ID viene en req.params.usuarioId
        const { usuarioId } = req.params;
        // Extrae las opciones de filtrado y paginación desde la query string
        // soloNoVistas: si es true, solo trae notificaciones no vistas (default false)
        // limite: número máximo de resultados (default 50)
        // saltar: número de resultados a omitir para paginación (default 0)
        const { soloNoVistas, limite, saltar } = req.query;
        
        // Prepara las opciones para la consulta
        const opciones = {
            soloNoVistas: soloNoVistas === 'true',  // Convierte el string a boolean
            limite: limite ? parseInt(limite) : 50,  // Convierte el string a número entero o usa default
            saltar: saltar ? parseInt(saltar) : 0  // Convierte el string a número entero o usa default
        };
        
        // Validar que los números sean válidos
        if (isNaN(opciones.limite) || opciones.limite < 1) {
            opciones.limite = 50;
        }
        if (isNaN(opciones.saltar) || opciones.saltar < 0) {
            opciones.saltar = 0;
        }
        
        // Obtiene la referencia a la base de datos MongoDB
        const db = obtenerBD();
        
        // Cuenta el total de notificaciones del usuario (con o sin filtro de vistas)
        // Construye el filtro para contar todas las notificaciones del usuario
        const filtroConteo = {
            usuarioId: convertirAObjectId(usuarioId),
            ...(opciones.soloNoVistas && { vista: false })
        };
        
        // Cuenta el total de notificaciones del usuario
        const totalNotificaciones = await db.collection('notificaciones').countDocuments(filtroConteo);
        
        // Llama a la función del modelo para obtener las notificaciones con paginación
        // Incluye información del restaurante y reseña relacionada para cada notificación
        const notificaciones = await obtenerNotificacionesPorUsuario(usuarioId, opciones);
        
        // Obtiene el conteo de notificaciones no vistas para incluir en la respuesta
        const noVistas = await contarNotificacionesNoVistas(usuarioId);
        
        // Calcular información de paginación
        // Calcula la página actual basándose en cuántos resultados se han saltado
        const paginaActual = Math.floor(opciones.saltar / opciones.limite) + 1;
        // Calcula el total de páginas basándose en el total de notificaciones y el límite por página
        const totalPages = Math.ceil(totalNotificaciones / opciones.limite);
        
        // Retorna una respuesta exitosa con código 200 (OK)
        // Incluye las notificaciones y metadatos de paginación
        return responderExito(res, HTTP_STATUS.OK, notificaciones, null, {
            pagination: {
                page: paginaActual,  // Página actual
                limit: opciones.limite,  // Límite de resultados por página
                total: totalNotificaciones,  // Total de notificaciones
                totalPages: totalPages,  // Total de páginas
                hasMore: paginaActual < totalPages,  // Si hay más páginas
                noVistas: noVistas  // Número de notificaciones no vistas
            }
        });
    } catch (error) {
        // Maneja errores específicos
        // Si el error indica que el usuarioId es inválido
        if (error.message.includes('inválido')) {
            // Retorna error 400 (Bad Request)
            return responderError(res, HTTP_STATUS.BAD_REQUEST, error.message);
        }
        // Para cualquier otro error, retorna error 500 (Internal Server Error)
        return responderError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message);
    }
};

/**
 * Marcar notificación como vista
 */
// Controlador exportado que maneja marcar una notificación como vista
// Esta función se ejecuta cuando se recibe una petición PUT para marcar una notificación como vista
// Parámetros: req (request con id en req.params), res (response para enviar la respuesta)
export const marcarComoVista = async (req, res) => {
    try {
        // Extrae el ID de la notificación de los parámetros de la URL
        // Si la ruta es /notificaciones/:id/vista, el ID viene en req.params.id
        const { id } = req.params;
        
        // Llama a la función del modelo para marcar la notificación como vista
        const notificacionActualizada = await marcarNotificacionComoVista(id);
        
        // Si no se encontró la notificación, retorna error 404 (Not Found)
        if (!notificacionActualizada) {
            return responderError(res, HTTP_STATUS.NOT_FOUND, 'Notificación no encontrada');
        }
        
        // Retorna una respuesta exitosa con código 200 (OK)
        return responderExito(
            res,
            HTTP_STATUS.OK,
            notificacionActualizada,  // Datos de la notificación actualizada
            'Notificación marcada como vista'  // Mensaje de confirmación
        );
    } catch (error) {
        // Maneja errores específicos
        // Si el error indica que el ID es inválido
        if (error.message.includes('inválido')) {
            // Retorna error 400 (Bad Request)
            return responderError(res, HTTP_STATUS.BAD_REQUEST, error.message);
        }
        // Para cualquier otro error, retorna error 500 (Internal Server Error)
        return responderError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message);
    }
};

