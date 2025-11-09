// Importa Router desde express
// Router permite definir rutas modulares y reutilizables para la aplicación
import { Router } from 'express';
// Importa body, param y query desde express-validator
// body valida los datos del cuerpo de la petición (req.body)
// param valida los parámetros de la URL (req.params)
// query valida los parámetros de la query string (req.query)
import { body, param, query } from 'express-validator';
// Importa los controladores de reseñas
// Estas funciones manejan la lógica de negocio para las operaciones CRUD de reseñas y reacciones
import {
    crear,  // Controlador para crear una nueva reseña
    obtenerTodas,  // Controlador para obtener todas las reseñas (admin)
    obtenerPorRestaurante,  // Controlador para obtener reseñas de un restaurante
    obtenerPorId,  // Controlador para obtener una reseña por ID
    actualizar,  // Controlador para actualizar una reseña
    like,  // Controlador para dar like a una reseña
    dislike,  // Controlador para dar dislike a una reseña
    eliminar  // Controlador para eliminar una reseña
} from '../controllers/reseña.controller.js';
// Importa el middleware de validación
// validacionMiddleware procesa los errores de validación de express-validator
import { validacionMiddleware } from '../middlewares/validationDTO.js';
// Importa el middleware de autenticación
// autenticacionMiddleware verifica que el usuario tenga un token JWT válido
import { autenticacionMiddleware } from '../middlewares/autenticacion.middleware.js';
// Importa el middleware de roles
// requiereAdmin verifica que el usuario tenga rol de administrador
import { requiereAdmin } from '../middlewares/roles.middleware.js';
// Importa los rate limiters
// limiterReseñas: limiter específico para creación de reseñas (previene spam)
// limiterGeneral: limiter general para otras rutas
import { limiterReseñas, limiterGeneral } from '../config/limiters.js';
// Importa función helper para validar ObjectIds
// esObjectIdValido verifica si un string es un ObjectId válido de MongoDB
import { esObjectIdValido } from '../utils/helpers.js';
// Importa constantes de validación
// VALIDATION_LIMITS contiene los límites para campos (DESCRIPCION_MAX_LENGTH, RATING_MIN, RATING_MAX, etc.)
import { VALIDATION_LIMITS } from '../utils/constants.js';

// Crea una instancia de Router para definir las rutas de reseñas
// Este router se montará en la ruta base /api/v1/reseñas
const router = Router();

/**
 * @route POST /api/v1/reseñas
 * @desc Crear nueva reseña (transaccional)
 * @access Private
 */
// Define la ruta POST para crear una nueva reseña
// Esta ruta requiere autenticación (usuario logueado)
// Utiliza transacciones para actualizar el promedio del restaurante atómicamente
router.post(
    '/',  // Ruta relativa: se completa con /api/v1/reseñas
    // Rate limiter específico para reseñas (previene spam)
    // Limita el número de reseñas que se pueden crear por hora
    limiterReseñas,
    // Middleware de autenticación: verifica que el usuario tenga un token JWT válido
    autenticacionMiddleware,
    [
        // Valida el campo restauranteId del cuerpo de la petición
        body('restauranteId')
            .notEmpty().withMessage('El ID del restaurante es requerido')  // Verifica que no esté vacío
            .custom((value) => {
                // Validación personalizada: verifica que el ID sea un ObjectId válido
                if (!esObjectIdValido(value)) {
                    throw new Error('ID de restaurante inválido');
                }
                return true;
            }),
        // Valida el campo comentario del cuerpo de la petición
        body('comentario')
            .optional()  // El campo es opcional (puede no estar presente)
            .trim()  // Elimina espacios en blanco al inicio y final
            // Verifica que la longitud no exceda el límite máximo
            .isLength({ max: VALIDATION_LIMITS.DESCRIPCION_MAX_LENGTH })
            .withMessage(`El comentario no puede exceder ${VALIDATION_LIMITS.DESCRIPCION_MAX_LENGTH} caracteres`),
        // Valida el campo calificacion del cuerpo de la petición
        body('calificacion')
            .notEmpty().withMessage('La calificación es requerida')  // Verifica que no esté vacío
            // Verifica que sea un número entero dentro del rango permitido (normalmente 1-5)
            .isInt({ min: VALIDATION_LIMITS.RATING_MIN, max: VALIDATION_LIMITS.RATING_MAX })
            .withMessage(`La calificación debe estar entre ${VALIDATION_LIMITS.RATING_MIN} y ${VALIDATION_LIMITS.RATING_MAX}`)
    ],
    // Middleware que verifica si hay errores de validación
    validacionMiddleware,
    // Controlador que maneja la lógica de crear la reseña (con transacción)
    crear
);

/**
 * @route GET /api/v1/reseñas
 * @desc Obtener todas las reseñas (para admin)
 * @access Private/Admin
 */
// Define la ruta GET para obtener todas las reseñas del sistema
// Esta ruta requiere autenticación y rol de administrador
router.get(
    '/',  // Ruta relativa: se completa con /api/v1/reseñas
    // Rate limiter general para prevenir abuso
    limiterGeneral,
    // Middleware de autenticación: verifica que el usuario tenga un token JWT válido
    autenticacionMiddleware,
    // Middleware de roles: verifica que el usuario tenga rol de administrador
    requiereAdmin,
    [
        // Valida el parámetro limite de la query string (para paginación)
        query('limite')
            .optional()  // El parámetro es opcional
            // Verifica que sea un número entero entre 1 y 100
            .isInt({ min: 1, max: 100 })
            .withMessage('El límite debe ser un número entre 1 y 100'),  // Mensaje de error
        // Valida el parámetro saltar de la query string (para paginación)
        query('saltar')
            .optional()  // El parámetro es opcional
            // Verifica que sea un número entero mayor o igual a 0
            .isInt({ min: 0 })
            .withMessage('Saltar debe ser un número mayor o igual a 0'),  // Mensaje de error
        // Valida el parámetro ordenarPor de la query string
        query('ordenarPor')
            .optional()  // El parámetro es opcional
            // Verifica que el valor esté en la lista permitida de campos para ordenar
            .isIn(['fechaCreacion', 'calificacion', 'likes'])
            .withMessage('Ordenamiento inválido'),  // Mensaje de error
        // Valida el parámetro orden de la query string
        query('orden')
            .optional()  // El parámetro es opcional
            // Verifica que el valor sea 'asc' (ascendente) o 'desc' (descendente)
            .isIn(['asc', 'desc'])
            .withMessage('Orden debe ser "asc" o "desc"')  // Mensaje de error
    ],
    // Middleware que verifica si hay errores de validación
    validacionMiddleware,
    // Controlador que maneja la lógica de obtener todas las reseñas (solo admin)
    obtenerTodas
);

/**
 * @route GET /api/v1/reseñas/restaurante/:restauranteId
 * @desc Obtener reseñas de un restaurante
 * @access Public
 */
// Define la ruta GET para obtener todas las reseñas de un restaurante específico
// Esta ruta es pública, no requiere autenticación
router.get(
    '/restaurante/:restauranteId',  // Ruta relativa con parámetro dinámico: /api/v1/reseñas/restaurante/:restauranteId
    [
        // Valida el parámetro restauranteId de la URL
        param('restauranteId')
            .custom((value) => {
                // Validación personalizada: verifica que el ID sea un ObjectId válido
                if (!esObjectIdValido(value)) {
                    throw new Error('ID de restaurante inválido');
                }
                return true;
            }),
        // Valida el parámetro limite de la query string (para paginación)
        query('limite')
            .optional()  // El parámetro es opcional
            // Verifica que sea un número entero entre 1 y 100
            .isInt({ min: 1, max: 100 })
            .withMessage('El límite debe ser un número entre 1 y 100'),  // Mensaje de error
        // Valida el parámetro saltar de la query string (para paginación)
        query('saltar')
            .optional()  // El parámetro es opcional
            // Verifica que sea un número entero mayor o igual a 0
            .isInt({ min: 0 })
            .withMessage('Saltar debe ser un número mayor o igual a 0'),  // Mensaje de error
        // Valida el parámetro ordenarPor de la query string
        query('ordenarPor')
            .optional()  // El parámetro es opcional
            // Verifica que el valor esté en la lista permitida de campos para ordenar
            .isIn(['fechaCreacion', 'calificacion', 'likes'])
            .withMessage('Ordenamiento inválido'),  // Mensaje de error
        // Valida el parámetro orden de la query string
        query('orden')
            .optional()  // El parámetro es opcional
            // Verifica que el valor sea 'asc' (ascendente) o 'desc' (descendente)
            .isIn(['asc', 'desc'])
            .withMessage('Orden debe ser "asc" o "desc"')  // Mensaje de error
    ],
    // Middleware que verifica si hay errores de validación
    validacionMiddleware,
    // Controlador que maneja la lógica de obtener las reseñas del restaurante
    // Incluye información de reacciones del usuario si está autenticado
    obtenerPorRestaurante
);

/**
 * @route GET /api/v1/reseñas/:id
 * @desc Obtener reseña por ID
 * @access Public
 */
// Define la ruta GET para obtener una reseña específica por su ID
// Esta ruta es pública, no requiere autenticación
router.get(
    '/:id',  // Ruta relativa con parámetro dinámico: /api/v1/reseñas/:id
    [
        // Valida el parámetro id de la URL
        param('id')
            .custom((value) => {
                // Validación personalizada: verifica que el ID sea un ObjectId válido
                if (!esObjectIdValido(value)) {
                    throw new Error('ID inválido');
                }
                return true;
            })
    ],
    // Middleware que verifica si hay errores de validación
    validacionMiddleware,
    // Controlador que maneja la lógica de obtener la reseña por ID
    obtenerPorId
);

/**
 * @route PUT /api/v1/reseñas/:id
 * @desc Actualizar reseña
 * @access Private
 */
// Define la ruta PUT para actualizar una reseña existente
// Esta ruta requiere autenticación (solo el dueño de la reseña o admin puede actualizarla)
router.put(
    '/:id',  // Ruta relativa con parámetro dinámico: /api/v1/reseñas/:id
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
                    throw new Error('ID inválido');
                }
                return true;
            }),
        // Valida el campo comentario del cuerpo de la petición (opcional en actualización)
        body('comentario')
            .optional()  // El campo es opcional en actualización
            .trim()  // Elimina espacios en blanco al inicio y final
            // Verifica que la longitud no exceda el límite máximo
            .isLength({ max: VALIDATION_LIMITS.DESCRIPCION_MAX_LENGTH })
            .withMessage(`El comentario no puede exceder ${VALIDATION_LIMITS.DESCRIPCION_MAX_LENGTH} caracteres`),
        // Valida el campo calificacion del cuerpo de la petición (opcional en actualización)
        body('calificacion')
            .optional()  // El campo es opcional
            // Verifica que sea un número entero dentro del rango permitido
            .isInt({ min: VALIDATION_LIMITS.RATING_MIN, max: VALIDATION_LIMITS.RATING_MAX })
            .withMessage(`La calificación debe estar entre ${VALIDATION_LIMITS.RATING_MIN} y ${VALIDATION_LIMITS.RATING_MAX}`)
    ],
    // Middleware que verifica si hay errores de validación
    validacionMiddleware,
    // Controlador que maneja la lógica de actualizar la reseña
    // Usa transacción si se actualiza la calificación (para actualizar el promedio del restaurante)
    actualizar
);

/**
 * @route POST /api/v1/reseñas/:id/like
 * @desc Dar like a una reseña (transaccional)
 * @access Private
 */
// Define la ruta POST para dar like a una reseña
// Esta ruta requiere autenticación (usuario logueado)
// Utiliza transacciones para actualizar los contadores de likes atómicamente
router.post(
    '/:id/like',  // Ruta relativa con parámetro dinámico: /api/v1/reseñas/:id/like
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
                    throw new Error('ID inválido');
                }
                return true;
            })
    ],
    // Middleware que verifica si hay errores de validación
    validacionMiddleware,
    // Controlador que maneja la lógica de dar like (toggle: si ya dio like, lo quita)
    like
);

/**
 * @route POST /api/v1/reseñas/:id/dislike
 * @desc Dar dislike a una reseña (transaccional)
 * @access Private
 */
// Define la ruta POST para dar dislike a una reseña
// Esta ruta requiere autenticación (usuario logueado)
// Utiliza transacciones para actualizar los contadores de dislikes atómicamente
router.post(
    '/:id/dislike',  // Ruta relativa con parámetro dinámico: /api/v1/reseñas/:id/dislike
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
                    throw new Error('ID inválido');
                }
                return true;
            })
    ],
    // Middleware que verifica si hay errores de validación
    validacionMiddleware,
    // Controlador que maneja la lógica de dar dislike (toggle: si ya dio dislike, lo quita)
    dislike
);

/**
 * @route DELETE /api/v1/reseñas/:id
 * @desc Eliminar reseña
 * @access Private
 */
// Define la ruta DELETE para eliminar una reseña
// Esta ruta requiere autenticación (solo el dueño de la reseña o admin puede eliminarla)
// Utiliza transacciones para actualizar el promedio del restaurante atómicamente
router.delete(
    '/:id',  // Ruta relativa con parámetro dinámico: /api/v1/reseñas/:id
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
                    throw new Error('ID inválido');
                }
                return true;
            })
    ],
    // Middleware que verifica si hay errores de validación
    validacionMiddleware,
    // Controlador que maneja la lógica de eliminar la reseña (con transacción)
    eliminar
);

// Exporta el router para que pueda ser montado en la aplicación principal
// Se importará en el archivo principal de rutas (app.js o server.js)
export default router;