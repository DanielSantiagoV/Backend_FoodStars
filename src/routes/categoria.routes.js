import { Router } from 'express';
import { body, param } from 'express-validator';
import {
    crear,
    obtenerTodas,
    obtenerPorId,
    actualizar,
    eliminar
} from '../controllers/categoria.controller.js';
import { validacionMiddleware } from '../middlewares/validationDTO.js';
import { autenticacionMiddleware } from '../middlewares/autenticacion.middleware.js';
import { requiereAdmin } from '../middlewares/roles.middleware.js';
import { limiterAdmin } from '../config/limiters.js';
import { esObjectIdValido } from '../utils/helpers.js';
import { VALIDATION_LIMITS } from '../utils/constants.js';

const router = Router();

/**
 * @route POST /api/v1/categorias
 * @desc Crear nueva categoría (solo admin)
 * @access Private/Admin
 */
router.post(
    '/',
    limiterAdmin,
    autenticacionMiddleware,
    requiereAdmin,
    [
        body('nombre')
            .trim()
            .notEmpty().withMessage('El nombre es requerido')
            .isLength({ max: VALIDATION_LIMITS.NOMBRE_MAX_LENGTH })
            .withMessage(`El nombre no puede exceder ${VALIDATION_LIMITS.NOMBRE_MAX_LENGTH} caracteres`),
        body('descripcion')
            .optional()
            .trim()
            .isLength({ max: VALIDATION_LIMITS.DESCRIPCION_MAX_LENGTH })
            .withMessage(`La descripción no puede exceder ${VALIDATION_LIMITS.DESCRIPCION_MAX_LENGTH} caracteres`)
    ],
    validacionMiddleware,
    crear
);

/**
 * @route GET /api/v1/categorias
 * @desc Obtener todas las categorías
 * @access Public
 */
router.get('/', obtenerTodas);

/**
 * @route GET /api/v1/categorias/:id
 * @desc Obtener categoría por ID
 * @access Public
 */
router.get(
    '/:id',
    [
        param('id')
            .custom((value) => {
                if (!esObjectIdValido(value)) {
                    throw new Error('ID inválido');
                }
                return true;
            })
    ],
    validacionMiddleware,
    obtenerPorId
);

/**
 * @route PUT /api/v1/categorias/:id
 * @desc Actualizar categoría (solo admin)
 * @access Private/Admin
 */
router.put(
    '/:id',
    limiterAdmin,
    autenticacionMiddleware,
    requiereAdmin,
    [
        param('id')
            .custom((value) => {
                if (!esObjectIdValido(value)) {
                    throw new Error('ID inválido');
                }
                return true;
            }),
        body('nombre')
            .optional()
            .trim()
            .notEmpty().withMessage('El nombre no puede estar vacío')
            .isLength({ max: VALIDATION_LIMITS.NOMBRE_MAX_LENGTH })
            .withMessage(`El nombre no puede exceder ${VALIDATION_LIMITS.NOMBRE_MAX_LENGTH} caracteres`),
        body('descripcion')
            .optional()
            .trim()
            .isLength({ max: VALIDATION_LIMITS.DESCRIPCION_MAX_LENGTH })
            .withMessage(`La descripción no puede exceder ${VALIDATION_LIMITS.DESCRIPCION_MAX_LENGTH} caracteres`)
    ],
    validacionMiddleware,
    actualizar
);

/**
 * @route DELETE /api/v1/categorias/:id
 * @desc Eliminar categoría (solo admin)
 * @access Private/Admin
 */
router.delete(
    '/:id',
    limiterAdmin,
    autenticacionMiddleware,
    requiereAdmin,
    [
        param('id')
            .custom((value) => {
                if (!esObjectIdValido(value)) {
                    throw new Error('ID inválido');
                }
                return true;
            })
    ],
    validacionMiddleware,
    eliminar
);

export default router;

