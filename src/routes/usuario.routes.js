// Importa Router desde express
// Router permite definir rutas modulares y reutilizables para la aplicación
import { Router } from 'express';
// Importa body y query desde express-validator
// body valida los datos del cuerpo de la petición (req.body)
// query valida los parámetros de la query string (req.query)
import { body, query } from 'express-validator';
// Importa los controladores de usuarios
// Estas funciones manejan la lógica de negocio para autenticación y gestión de usuarios
import { registrarUsuario, loginUsuario, obtenerMiPerfil, obtenerTodos } from '../controllers/usuario.controller.js';
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
// limiterAuth: limiter más restrictivo para autenticación (previene fuerza bruta)
// limiterGeneral: limiter general para otras rutas
import { limiterAuth, limiterGeneral } from '../config/limiters.js';
// Importa constantes de validación
// VALIDATION_LIMITS contiene los límites para campos (NOMBRE_MAX_LENGTH, PASSWORD_MIN_LENGTH, etc.)
import { VALIDATION_LIMITS } from '../utils/constants.js';
// Importa función helper para validar emails
// esEmailValido verifica si un string tiene formato de email válido
import { esEmailValido } from '../utils/helpers.js';

// Crea una instancia de Router para definir las rutas de usuarios
// Este router se montará en la ruta base /api/v1/usuarios
const router = Router();

/**
 * @route POST /api/v1/usuarios/registro
 * @desc Registrar nuevo usuario
 * @access Public
 */
// Define la ruta POST para registrar un nuevo usuario
// Esta ruta es pública, no requiere autenticación previa
router.post(
    '/registro',  // Ruta relativa: se completa con /api/v1/usuarios/registro
    // Rate limiter específico para autenticación (más restrictivo)
    // Previene ataques de fuerza bruta limitando intentos de registro
    limiterAuth,
    [
        // Valida el campo nombre del cuerpo de la petición
        body('nombre')
            .trim()  // Elimina espacios en blanco al inicio y final
            .notEmpty().withMessage('El nombre es requerido')  // Verifica que no esté vacío
            // Verifica que la longitud no exceda el límite máximo
            .isLength({ max: VALIDATION_LIMITS.NOMBRE_MAX_LENGTH })
            .withMessage(`El nombre no puede exceder ${VALIDATION_LIMITS.NOMBRE_MAX_LENGTH} caracteres`),
        // Valida el campo email del cuerpo de la petición
        body('email')
            .trim()  // Elimina espacios en blanco al inicio y final
            .notEmpty().withMessage('El email es requerido')  // Verifica que no esté vacío
            .custom((value) => {
                // Validación personalizada: verifica que el email tenga formato válido
                if (!esEmailValido(value)) {
                    throw new Error('El email no es válido');
                }
                return true;
            }),
        // Valida el campo password del cuerpo de la petición
        body('password')
            .notEmpty().withMessage('La contraseña es requerida')  // Verifica que no esté vacío
            // Verifica que la longitud sea al menos el mínimo requerido
            .isLength({ min: VALIDATION_LIMITS.PASSWORD_MIN_LENGTH })
            .withMessage(`La contraseña debe tener al menos ${VALIDATION_LIMITS.PASSWORD_MIN_LENGTH} caracteres`)
    ],
    // Middleware que verifica si hay errores de validación
    validacionMiddleware,
    // Controlador que maneja la lógica de registro (crea usuario y genera token JWT)
    registrarUsuario
);

/**
 * @route POST /api/v1/usuarios/login
 * @desc Login de usuario
 * @access Public
 */
// Define la ruta POST para iniciar sesión (login)
// Esta ruta es pública, no requiere autenticación previa
router.post(
    '/login',  // Ruta relativa: se completa con /api/v1/usuarios/login
    // Rate limiter específico para autenticación (más restrictivo)
    // Previene ataques de fuerza bruta limitando intentos de login
    limiterAuth,
    [
        // Valida el campo email del cuerpo de la petición
        body('email')
            .trim()  // Elimina espacios en blanco al inicio y final
            .notEmpty().withMessage('El email es requerido')  // Verifica que no esté vacío
            .custom((value) => {
                // Validación personalizada: verifica que el email tenga formato válido
                if (!esEmailValido(value)) {
                    throw new Error('El email no es válido');
                }
                return true;
            }),
        // Valida el campo password del cuerpo de la petición
        body('password')
            .notEmpty().withMessage('La contraseña es requerida')  // Verifica que no esté vacío
    ],
    // Middleware que verifica si hay errores de validación
    validacionMiddleware,
    // Controlador que maneja la lógica de login (verifica credenciales y genera token JWT)
    loginUsuario
);

/**
 * @route GET /api/v1/usuarios/perfil
 * @desc Obtener perfil del usuario autenticado
 * @access Private
 */
// Define la ruta GET para obtener el perfil del usuario autenticado
// Esta ruta requiere autenticación (usuario logueado)
router.get(
    '/perfil',  // Ruta relativa: se completa con /api/v1/usuarios/perfil
    // Middleware de autenticación: verifica que el usuario tenga un token JWT válido
    // Si está autenticado, establece req.usuario con los datos del usuario
    autenticacionMiddleware,
    // Controlador que maneja la lógica de obtener el perfil del usuario autenticado
    obtenerMiPerfil
);

/**
 * @route GET /api/v1/usuarios
 * @desc Obtener todos los usuarios (Admin only)
 * @access Private/Admin
 */
// Define la ruta GET para obtener todos los usuarios del sistema
// Esta ruta requiere autenticación y rol de administrador
router.get(
    '/',  // Ruta relativa: se completa con /api/v1/usuarios
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
            .withMessage('Saltar debe ser un número mayor o igual a 0')  // Mensaje de error
    ],
    // Middleware que verifica si hay errores de validación
    validacionMiddleware,
    // Controlador que maneja la lógica de obtener todos los usuarios (solo admin)
    obtenerTodos
);

// Exporta el router para que pueda ser montado en la aplicación principal
// Se importará en el archivo principal de rutas (app.js o server.js)
export default router;

