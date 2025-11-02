import { Router } from 'express';
import { body, query } from 'express-validator';
import { registrarUsuario, loginUsuario, obtenerMiPerfil, obtenerTodos } from '../controllers/usuario.controller.js';
import { validacionMiddleware } from '../middlewares/validationDTO.js';
import { autenticacionMiddleware } from '../middlewares/autenticacion.middleware.js';
import { requiereAdmin } from '../middlewares/roles.middleware.js';
import { limiterAuth, limiterGeneral } from '../config/limiters.js';
import { VALIDATION_LIMITS } from '../utils/constants.js';
import { esEmailValido } from '../utils/helpers.js';

const router = Router();

/**
 * @route POST /api/v1/usuarios/registro
 * @desc Registrar nuevo usuario
 * @access Public
 */
router.post(
    '/registro',
    limiterAuth,
    [
        body('nombre')
            .trim()
            .notEmpty().withMessage('El nombre es requerido')
            .isLength({ max: VALIDATION_LIMITS.NOMBRE_MAX_LENGTH })
            .withMessage(`El nombre no puede exceder ${VALIDATION_LIMITS.NOMBRE_MAX_LENGTH} caracteres`),
        body('email')
            .trim()
            .notEmpty().withMessage('El email es requerido')
            .custom((value) => {
                if (!esEmailValido(value)) {
                    throw new Error('El email no es válido');
                }
                return true;
            }),
        body('password')
            .notEmpty().withMessage('La contraseña es requerida')
            .isLength({ min: VALIDATION_LIMITS.PASSWORD_MIN_LENGTH })
            .withMessage(`La contraseña debe tener al menos ${VALIDATION_LIMITS.PASSWORD_MIN_LENGTH} caracteres`)
    ],
    validacionMiddleware,
    registrarUsuario
);

/**
 * @route POST /api/v1/usuarios/login
 * @desc Login de usuario
 * @access Public
 */
router.post(
    '/login',
    limiterAuth,
    [
        body('email')
            .trim()
            .notEmpty().withMessage('El email es requerido')
            .custom((value) => {
                if (!esEmailValido(value)) {
                    throw new Error('El email no es válido');
                }
                return true;
            }),
        body('password')
            .notEmpty().withMessage('La contraseña es requerida')
    ],
    validacionMiddleware,
    loginUsuario
);

/**
 * @route GET /api/v1/usuarios/perfil
 * @desc Obtener perfil del usuario autenticado
 * @access Private
 */
router.get(
    '/perfil',
    autenticacionMiddleware,
    obtenerMiPerfil
);

/**
 * @route GET /api/v1/usuarios
 * @desc Obtener todos los usuarios (Admin only)
 * @access Private/Admin
 */
router.get(
    '/',
    limiterGeneral,
    autenticacionMiddleware,
    requiereAdmin,
    [
        query('limite')
            .optional()
            .isInt({ min: 1, max: 100 })
            .withMessage('El límite debe ser un número entre 1 y 100'),
        query('saltar')
            .optional()
            .isInt({ min: 0 })
            .withMessage('Saltar debe ser un número mayor o igual a 0')
    ],
    validacionMiddleware,
    obtenerTodos
);

export default router;

