// Importa Router desde express
// Router permite definir rutas modulares y reutilizables para la aplicación
import { Router } from 'express';
// Importa body y param desde express-validator
// body valida los datos del cuerpo de la petición (req.body)
// param valida los parámetros de la URL (req.params)
import { body, param } from 'express-validator';
// Importa los controladores de categorías
// Estas funciones manejan la lógica de negocio para las operaciones CRUD de categorías
import {
    crear,  // Controlador para crear una nueva categoría
    obtenerTodas,  // Controlador para obtener todas las categorías
    obtenerPorId,  // Controlador para obtener una categoría por ID
    actualizar,  // Controlador para actualizar una categoría
    eliminar  // Controlador para eliminar una categoría
} from '../controllers/categoria.controller.js';
// Importa el middleware de validación
// validacionMiddleware procesa los errores de validación de express-validator
import { validacionMiddleware } from '../middlewares/validationDTO.js';
// Importa el middleware de autenticación
// autenticacionMiddleware verifica que el usuario tenga un token JWT válido
import { autenticacionMiddleware } from '../middlewares/autenticacion.middleware.js';
// Importa el middleware de roles
// requiereAdmin verifica que el usuario tenga rol de administrador
import { requiereAdmin } from '../middlewares/roles.middleware.js';
// Importa el rate limiter para acciones administrativas
// limiterAdmin limita el número de peticiones administrativas por IP
import { limiterAdmin } from '../config/limiters.js';
// Importa función helper para validar ObjectIds
// esObjectIdValido verifica si un string es un ObjectId válido de MongoDB
import { esObjectIdValido } from '../utils/helpers.js';
// Importa constantes de validación
// VALIDATION_LIMITS contiene los límites máximos para campos (NOMBRE_MAX_LENGTH, DESCRIPCION_MAX_LENGTH, etc.)
import { VALIDATION_LIMITS } from '../utils/constants.js';

// Crea una instancia de Router para definir las rutas de categorías
// Este router se montará en la ruta base /api/v1/categorias
const router = Router();

/**
 * @route POST /api/v1/categorias
 * @desc Crear nueva categoría (solo admin)
 * @access Private/Admin
 */
// Define la ruta POST para crear una nueva categoría
// Esta ruta requiere autenticación y rol de administrador
router.post(
    '/',  // Ruta relativa: se completa con /api/v1/categorias
    // Rate limiter para acciones administrativas
    // Previene abuso limitando el número de peticiones por IP
    limiterAdmin,
    // Middleware de autenticación: verifica que el usuario tenga un token JWT válido
    // Si no está autenticado, retorna error 401
    autenticacionMiddleware,
    // Middleware de roles: verifica que el usuario tenga rol de administrador
    // Si no es admin, retorna error 403
    requiereAdmin,
    [
        // Valida el campo nombre del cuerpo de la petición
        body('nombre')
            .trim()  // Elimina espacios en blanco al inicio y final
            .notEmpty().withMessage('El nombre es requerido')  // Verifica que no esté vacío
            // Verifica que la longitud no exceda el límite máximo
            .isLength({ max: VALIDATION_LIMITS.NOMBRE_MAX_LENGTH })
            .withMessage(`El nombre no puede exceder ${VALIDATION_LIMITS.NOMBRE_MAX_LENGTH} caracteres`),
        // Valida el campo descripcion del cuerpo de la petición
        body('descripcion')
            .optional()  // El campo es opcional (puede no estar presente)
            .trim()  // Elimina espacios en blanco al inicio y final
            // Verifica que la longitud no exceda el límite máximo
            .isLength({ max: VALIDATION_LIMITS.DESCRIPCION_MAX_LENGTH })
            .withMessage(`La descripción no puede exceder ${VALIDATION_LIMITS.DESCRIPCION_MAX_LENGTH} caracteres`)
    ],
    // Middleware que verifica si hay errores de validación
    // Si hay errores, los retorna; si no, continúa al siguiente middleware
    validacionMiddleware,
    // Controlador que maneja la lógica de crear la categoría
    crear
);

/**
 * @route GET /api/v1/categorias
 * @desc Obtener todas las categorías
 * @access Public
 */
// Define la ruta GET para obtener todas las categorías
// Esta ruta es pública, no requiere autenticación
router.get('/', obtenerTodas);

/**
 * @route GET /api/v1/categorias/:id
 * @desc Obtener categoría por ID
 * @access Public
 */
// Define la ruta GET para obtener una categoría específica por su ID
// Esta ruta es pública, no requiere autenticación
router.get(
    '/:id',  // Ruta relativa con parámetro dinámico: /api/v1/categorias/:id
    [
        // Valida el parámetro id de la URL
        param('id')
            .custom((value) => {
                // Validación personalizada: verifica que el ID sea un ObjectId válido
                if (!esObjectIdValido(value)) {
                    throw new Error('ID inválido');
                }
                return true;  // Si es válido, pasa la validación
            })
    ],
    // Middleware que verifica si hay errores de validación
    validacionMiddleware,
    // Controlador que maneja la lógica de obtener la categoría por ID
    obtenerPorId
);

/**
 * @route PUT /api/v1/categorias/:id
 * @desc Actualizar categoría (solo admin)
 * @access Private/Admin
 */
// Define la ruta PUT para actualizar una categoría existente
// Esta ruta requiere autenticación y rol de administrador
router.put(
    '/:id',  // Ruta relativa con parámetro dinámico: /api/v1/categorias/:id
    // Rate limiter para acciones administrativas
    limiterAdmin,
    // Middleware de autenticación: verifica que el usuario tenga un token JWT válido
    autenticacionMiddleware,
    // Middleware de roles: verifica que el usuario tenga rol de administrador
    requiereAdmin,
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
            .withMessage(`La descripción no puede exceder ${VALIDATION_LIMITS.DESCRIPCION_MAX_LENGTH} caracteres`)
    ],
    // Middleware que verifica si hay errores de validación
    validacionMiddleware,
    // Controlador que maneja la lógica de actualizar la categoría
    actualizar
);

/**
 * @route DELETE /api/v1/categorias/:id
 * @desc Eliminar categoría (solo admin)
 * @access Private/Admin
 */
// Define la ruta DELETE para eliminar una categoría
// Esta ruta requiere autenticación y rol de administrador
router.delete(
    '/:id',  // Ruta relativa con parámetro dinámico: /api/v1/categorias/:id
    // Rate limiter para acciones administrativas
    limiterAdmin,
    // Middleware de autenticación: verifica que el usuario tenga un token JWT válido
    autenticacionMiddleware,
    // Middleware de roles: verifica que el usuario tenga rol de administrador
    requiereAdmin,
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
    // Controlador que maneja la lógica de eliminar la categoría
    eliminar
);

// Exporta el router para que pueda ser montado en la aplicación principal
// Se importará en el archivo principal de rutas (app.js o server.js)
export default router;

