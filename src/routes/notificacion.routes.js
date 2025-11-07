import { Router } from 'express';
import { param, query } from 'express-validator';ç
import {
    obtenerNotificaciones,  
    marcarComoVista  
} from '../controllers/notificacion.controller.js';
validacionMiddlewarelidator
import { validacionMiddleware } from '../middlewares/validationDTO.js';
import { autenticacionMiddleware } from '../middlewares/autenticacion.middleware.js';
import{ limiterGeneral } from '../config/limiters.js';
import { esObjectIdValido } from '../utils/helpers.js';
const router = Router();

/**
 * @route GET /api/v1/notificaciones/:usuarioId
 * @desc
 * @access 
 */

router.get(
    '/:usuarioId',  
    limiterGeneral,
    autenticacionMiddleware,
    [
        // Valida el parámetro usuarioId de la URL
        param('usuarioId')
            .custom((value) => {
                if (!esObjectIdValido(value)) {
                    throw new Error('ID de usuario inválido');
                }
                return true;
            }),
        query('limite')
            .optional()  
            .isInt({ min: 1, max: 100 })
            .withMessage('El límite debe ser un número entre 1 y 100'),  
        query('saltar')
            .optional()  
            .isInt({ min: 0 })
            .withMessage('Saltar debe ser un número mayor o igual a 0'), 
        query('soloNoVistas')
            .optional() 
            .isIn(['true', 'false'])
            .withMessage('soloNoVistas debe ser "true" o "false"')  
    ],
    validacionMiddleware,
    obtenerNotificaciones
);

/**
 * @route PUT /api/v1/notificaciones/:id/vista
 * @desc 
 * @access Private
 */

router.put(
    '/:id/vista',  
    limiterGeneral,
    autenticacionMiddleware,
    [
        
        param('id')
            .custom((value) => {
                
                if (!esObjectIdValido(value)) {
                    throw new Error('ID de notificación inválido');
                }
                return true;
            })
    ],
    
    validacionMiddleware,
   
    marcarComoVista
);


export default router;
