import {
    obtenerNotificacionesPorUsuario,  
    marcarNotificacionComoVista,  
    contarNotificacionesNoVistas  
} from '../models/notificacion.model.js';

import { responderExito, responderError, convertirAObjectId } from '../utils/helpers.js';
import { HTTP_STATUS } from '../utils/constants.js';
import { obtenerBD } from '../config/db.js';

/**
 * Obtener notificaciones de un usuario
 * @route GET /api/v1/notificaciones/:usuarioId
 * @access Private
 */

export const obtenerNotificaciones = async (req, res) => {
    try {
        
        const { usuarioId } = req.params;
        const usuarioAutenticadoId = req.usuario._id.toString();
        if (usuarioId !== usuarioAutenticadoId && req.usuario.rol !== 'admin') {
            return responderError(res, HTTP_STATUS.FORBIDDEN, 'No tienes permiso para acceder a estas notificaciones');
        }
        
        const { limite = 50, saltar = 0, soloNoVistas = false } = req.query;
        
        const opciones = {
            limite: parseInt(limite),  // Convierte el string a número entero
            saltar: parseInt(saltar),  // Convierte el string a número entero
            soloNoVistas: soloNoVistas === 'true' || soloNoVistas === true  // Convierte string a boolean
        };
        
        
        const filtroCount = {
            usuarioId: convertirAObjectId(usuarioId)
        };
        if (opciones.soloNoVistas) {
            filtroCount.vista = false;
        }
        const totalNotificaciones = await db.collection('notificaciones').countDocuments(filtroCount);
        
       
        const notificaciones = await obtenerNotificacionesPorUsuario(usuarioId, opciones);
        const noVistas = await contarNotificacionesNoVistas(usuarioId)
        const paginaActual = Math.floor(opciones.saltar / opciones.limite) + 1;
        const totalPages = Math.ceil(totalNotificaciones / opciones.limite);
        
        return responderExito(res, HTTP_STATUS.OK, {
            notificaciones,  
            noVistas  
        }, null, {
            pagination: {
                page: paginaActual,  
                limit: opciones.limite,  
                total: totalNotificaciones,  
                totalPages: totalPages,  
                hasMore: paginaActual < totalPages  
            }
        });
    } catch (error) {
      
        if (error.message.includes('inválido')) {
            
            return responderError(res, HTTP_STATUS.BAD_REQUEST, error.message);
        }
        
        return responderError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message);
    }
};

/**
 * Marcar notificación como vista
 * @route PUT /api/v1/notificaciones/:id/vista
 * @access Private
 */

export const marcarComoVista = async (req, res) => {
    try {
        
        const { id } = req.params;
        const usuarioId = req.usuario._id.toString();
        const notificacion = await marcarNotificacionComoVista(id, usuarioId);

        if (!notificacion) {
            return responderError(res, HTTP_STATUS.NOT_FOUND, 'Notificación no encontrada o no tienes permiso para acceder a ella');
        }
    
       
        return responderExito(
            res,
            HTTP_STATUS.OK,
            notificacion,  
            'Notificación marcada como vista exitosamente'  
        );
    } catch (error) {
        
        if (error.message.includes('inválido')) {
           
            return responderError(res, HTTP_STATUS.BAD_REQUEST, error.message);
        }
        return responderError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message);
    }
};
