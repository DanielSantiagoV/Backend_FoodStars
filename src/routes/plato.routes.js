// Importa Router desde express
// Router permite definir rutas modulares y reutilizables para la aplicación
import { Router } from 'express';
// Importa body y param desde express-validator
// body valida los datos del cuerpo de la petición (req.body)
// param valida los parámetros de la URL (req.params)
import { body, param } from 'express-validator';
// Importa los controladores de platos
// Estas funciones manejan la lógica de negocio para las operaciones CRUD de platos
import {
    crear,  // Controlador para crear un nuevo plato
    obtenerPorRestaurante,  // Controlador para obtener platos de un restaurante
    obtenerPorId,  // Controlador para obtener un plato por ID
    actualizar,  // Controlador para actualizar un plato
    eliminar  // Controlador para eliminar un plato
} from '../controllers/plato.controller.js';
// Importa el middleware de validación
// validacionMiddleware procesa los errores de validación de express-validator
import { validacionMiddleware } from '../middlewares/validationDTO.js';
// Importa el middleware de autenticación
// autenticacionMiddleware verifica que el usuario tenga un token JWT válido
import { autenticacionMiddleware } from '../middlewares/autenticacion.middleware.js';
// Importa el rate limiter general
// limiterGeneral limita el número de peticiones por IP para prevenir abuso
import { limiterGeneral } from '../config/limiters.js';
// Importa función helper para validar ObjectIds
// esObjectIdValido verifica si un string es un ObjectId válido de MongoDB
import { esObjectIdValido } from '../utils/helpers.js';
// Importa constantes de validación
// VALIDATION_LIMITS contiene los límites máximos para campos (NOMBRE_MAX_LENGTH, DESCRIPCION_MAX_LENGTH, etc.)
import { VALIDATION_LIMITS } from '../utils/constants.js';

// Crea una instancia de Router para definir las rutas de platos
// Este router se montará en la ruta base /api/v1/platos
const router = Router();

/**
 * @route POST /api/v1/platos
 * @desc Crear nuevo plato
 * @access Private
 */
// Define la ruta POST para crear un nuevo plato
// Esta ruta requiere autenticación (usuario logueado)
router.post(
    '/',  // Ruta relativa: se completa con /api/v1/platos
    // Rate limiter general para prevenir abuso
    limiterGeneral,
    // Middleware de autenticación: verifica que el usuario tenga un token JWT válido
    autenticacionMiddleware,
    [
        // Valida el campo nombre del cuerpo de la petición
        body('nombre')
            .trim()  // Elimina espacios en blanco al inicio y final
            .notEmpty().withMessage('El nombre es requerido')  // Verifica que no esté vacío
            // Verifica que la longitud no exceda el límite máximo
            .isLength({ max: VALIDATION_LIMITS.NOMBRE_MAX_LENGTH })
            .withMessage(`El nombre no puede exceder ${VALIDATION_LIMITS.NOMBRE_MAX_LENGTH} caracteres`),
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
        // Valida el campo descripcion del cuerpo de la petición
        body('descripcion')
            .optional()  // El campo es opcional (puede no estar presente)
            .trim()  // Elimina espacios en blanco al inicio y final
            // Verifica que la longitud no exceda el límite máximo
            .isLength({ max: VALIDATION_LIMITS.DESCRIPCION_MAX_LENGTH })
            .withMessage(`La descripción no puede exceder ${VALIDATION_LIMITS.DESCRIPCION_MAX_LENGTH} caracteres`),
        // Valida el campo imagen del cuerpo de la petición
        body('imagen')
            .optional()  // El campo es opcional
            .isURL().withMessage('La imagen debe ser una URL válida'),  // Verifica que sea una URL válida
        // Valida el campo precio del cuerpo de la petición
        body('precio')
            .optional()  // El campo es opcional
            // Verifica que sea un número flotante mayor o igual a 0
            .isFloat({ min: 0 }).withMessage('El precio debe ser un número positivo')
    ],
    // Middleware que verifica si hay errores de validación
    validacionMiddleware,
    // Controlador que maneja la lógica de crear el plato
    crear
);

/**
 * @route GET /api/v1/platos/restaurante/:restauranteId
 * @desc Obtener platos de un restaurante
 * @access Public
 */
// Define la ruta GET para obtener todos los platos de un restaurante específico
// Esta ruta es pública, no requiere autenticación
router.get(
    '/restaurante/:restauranteId',  // Ruta relativa con parámetro dinámico: /api/v1/platos/restaurante/:restauranteId
    [
        // Valida el parámetro restauranteId de la URL
        param('restauranteId')
            .custom((value) => {
                // Validación personalizada: verifica que el ID sea un ObjectId válido
                if (!esObjectIdValido(value)) {
                    throw new Error('ID de restaurante inválido');
                }
                return true;
            })
    ],
    // Middleware que verifica si hay errores de validación
    validacionMiddleware,
    // Controlador que maneja la lógica de obtener los platos del restaurante
    obtenerPorRestaurante
);

/**
 * @route GET /api/v1/platos/:id
 * @desc Obtener plato por ID
 * @access Public
 */
// Define la ruta GET para obtener un plato específico por su ID
// Esta ruta es pública, no requiere autenticación
router.get(
    '/:id',  // Ruta relativa con parámetro dinámico: /api/v1/platos/:id
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
    // Controlador que maneja la lógica de obtener el plato por ID
    obtenerPorId
);

/**
 * @route PUT /api/v1/platos/:id
 * @desc Actualizar plato
 * @access Private
 */
// Define la ruta PUT para actualizar un plato existente
// Esta ruta requiere autenticación (usuario logueado)
router.put(
    '/:id',  // Ruta relativa con parámetro dinámico: /api/v1/platos/:id
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
        // Valida el campo nombre del cuerpo de la petición (opcional en actualización)
        body('nombre')
            .optional()  // El campo es opcional en actualización
            .trim()  // Elimina espacios en blanco al inicio y final
            .notEmpty().withMessage('El nombre no puede estar vacío')  // Si se proporciona, no puede estar vacío
            // Verifica que la longitud no exceda el límite máximo
            .isLength({ max: VALIDATION_LIMITS.NOMBRE_MAX_LENGTH })
            .withMessage(`El nombre no puede exceder ${VALIDATION_LIMITS.NOMBRE_MAX_LENGTH} caracteres`),
        // Valida el campo descripcion del cuerpo de la petición (opcional)
        body('descripcion')
            .optional()  // El campo es opcional
            .trim()  // Elimina espacios en blanco al inicio y final
            // Verifica que la longitud no exceda el límite máximo
            .isLength({ max: VALIDATION_LIMITS.DESCRIPCION_MAX_LENGTH })
            .withMessage(`La descripción no puede exceder ${VALIDATION_LIMITS.DESCRIPCION_MAX_LENGTH} caracteres`),
        // Valida el campo imagen del cuerpo de la petición (opcional)
        body('imagen')
            .optional()  // El campo es opcional
            .isURL().withMessage('La imagen debe ser una URL válida'),  // Verifica que sea una URL válida
        // Valida el campo precio del cuerpo de la petición (opcional)
        body('precio')
            .optional()  // El campo es opcional
            // Verifica que sea un número flotante mayor o igual a 0
            .isFloat({ min: 0 }).withMessage('El precio debe ser un número positivo')
    ],
    // Middleware que verifica si hay errores de validación
    validacionMiddleware,
    // Controlador que maneja la lógica de actualizar el plato
    actualizar
);

/**
 * @route DELETE /api/v1/platos/:id
 * @desc Eliminar plato
 * @access Private
 */
// Define la ruta DELETE para eliminar un plato
// Esta ruta requiere autenticación (usuario logueado)
router.delete(
    '/:id',  // Ruta relativa con parámetro dinámico: /api/v1/platos/:id
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
    // Controlador que maneja la lógica de eliminar el plato
    eliminar
);

// Exporta el router para que pueda ser montado en la aplicación principal
// Se importará en el archivo principal de rutas (app.js o server.js)
export default router;

