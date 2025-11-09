// Importa Router desde express
// Router permite definir rutas modulares y reutilizables para la aplicación
import { Router } from 'express';
// Importa param y query desde express-validator
// param valida los parámetros de la URL (req.params)
// query valida los parámetros de la query string (req.query)
import { param, query } from 'express-validator';
// Importa los controladores de notificaciones
// Estas funciones manejan la lógica de negocio para las operaciones de notificaciones
import {
    obtenerNotificaciones,  // Controlador para obtener notificaciones de un usuario
    marcarComoVista  // Controlador para marcar una notificación como vista
} from '../controllers/notificacion.controller.js';
// Importa el middleware de validación
// validacionMiddleware procesa los errores de validación de express-validator
import { validacionMiddleware } from '../middlewares/validationDTO.js';
// Importa el middleware de autenticación
// autenticacionMiddleware verifica que el usuario tenga un token JWT válido
import { autenticacionMiddleware } from '../middlewares/autenticacion.middleware.js';
// Importa los rate limiters
// limiterGeneral: limiter general para las rutas
import { limiterGeneral } from '../config/limiters.js';
// Importa función helper para validar ObjectIds
// esObjectIdValido verifica si un string es un ObjectId válido de MongoDB
import { esObjectIdValido } from '../utils/helpers.js';

// Crea una instancia de Router para definir las rutas de notificaciones
// Este router se montará en la ruta base /api/v1/notificaciones
const router = Router();

/**
 * @route GET /api/v1/notificaciones/:usuarioId
 * @desc Consultar notificaciones de un usuario
 * @access Private
 */
// Define la ruta GET para obtener las notificaciones de un usuario específico
// Esta ruta requiere autenticación (usuario logueado)
router.get(
    '/:usuarioId',  // Ruta relativa: se completa con /api/v1/notificaciones/:usuarioId
    // Rate limiter general para prevenir abuso
    limiterGeneral,
    // Middleware de autenticación: verifica que el usuario tenga un token JWT válido
    autenticacionMiddleware,
    [
        // Valida el parámetro usuarioId de la URL
        param('usuarioId')
            .custom((value) => {
                // Validación personalizada: verifica que el ID sea un ObjectId válido
                if (!esObjectIdValido(value)) {
                    throw new Error('ID de usuario inválido');
                }
                return true;
            }),
        // Valida el parámetro soloNoVistas de la query string (opcional)
        query('soloNoVistas')
            .optional()  // El parámetro es opcional
            // Verifica que sea un valor booleano como string ('true' o 'false')
            .isIn(['true', 'false'])
            .withMessage('soloNoVistas debe ser "true" o "false"'),
        // Valida el parámetro limite de la query string (para paginación)
        query('limite')
            .optional()  // El parámetro es opcional
            // Verifica que sea un número entero entre 1 y 100
            .isInt({ min: 1, max: 100 })
            .withMessage('El límite debe ser un número entre 1 y 100'),
        // Valida el parámetro saltar de la query string (para paginación)
        query('saltar')
            .optional()  // El parámetro es opcional
            // Verifica que sea un número entero mayor o igual a 0
            .isInt({ min: 0 })
            .withMessage('Saltar debe ser un número mayor o igual a 0')
    ],
    // Middleware que verifica si hay errores de validación
    validacionMiddleware,
    // Controlador que maneja la lógica de obtener las notificaciones del usuario
    obtenerNotificaciones
);

/**
 * @route PUT /api/v1/notificaciones/:id/vista
 * @desc Marcar notificación como vista
 * @access Private
 */
// Define la ruta PUT para marcar una notificación como vista
// Esta ruta requiere autenticación (usuario logueado)
router.put(
    '/:id/vista',  // Ruta relativa: se completa con /api/v1/notificaciones/:id/vista
    // Rate limiter general para prevenir abuso
    limiterGeneral,
    // Middleware de autenticación: verifica que el usuario tenga un token JWT válido
    autenticacionMiddleware,
    [
        // Valida el parámetro id de la URL
        param('id')
            .custom((value) => {
                // Validación personalizada: verifica que el ID sea un ObjectId válido
                if (!esObjectIdValido(value)) {
                    throw new Error('ID de notificación inválido');
                }
                return true;
            })
    ],
    // Middleware que verifica si hay errores de validación
    validacionMiddleware,
    // Controlador que maneja la lógica de marcar la notificación como vista
    marcarComoVista
);

// Exporta el router para que pueda ser montado en la aplicación principal
// Se importará en el archivo principal de rutas (server.js)
export default router;

