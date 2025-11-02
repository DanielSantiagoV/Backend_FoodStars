import { Router } from 'express';
import { body, param } from 'express-validator';
import {
    crear,
    obtenerPorRestaurante,
    obtenerPorId,
    actualizar,
    eliminar
} from '../controllers/plato.controller.js';
import { validacionMiddleware } from '../middlewares/validationDTO.js';
import { autenticacionMiddleware } from '../middlewares/autenticacion.middleware.js';
import { limiterGeneral } from '../config/limiters.js';
import { esObjectIdValido } from '../utils/helpers.js';
import { VALIDATION_LIMITS } from '../utils/constants.js';

const router = Router();

/**
 * @route POST /api/v1/platos
 * @desc Crear nuevo plato
 * @access Private
 */
router.post(
    '/',
    limiterGeneral,
    autenticacionMiddleware,
    [
        body('nombre')
            .trim()
            .notEmpty().withMessage('El nombre es requerido')
            .isLength({ max: VALIDATION_LIMITS.NOMBRE_MAX_LENGTH })
            .withMessage(`El nombre no puede exceder ${VALIDATION_LIMITS.NOMBRE_MAX_LENGTH} caracteres`),
        body('restauranteId')
            .notEmpty().withMessage('El ID del restaurante es requerido')
            .custom((value) => {
                if (!esObjectIdValido(value)) {
                    throw new Error('ID de restaurante inválido');
                }
                return true;
            }),
        body('descripcion')
            .optional()
            .trim()
            .isLength({ max: VALIDATION_LIMITS.DESCRIPCION_MAX_LENGTH })
            .withMessage(`La descripción no puede exceder ${VALIDATION_LIMITS.DESCRIPCION_MAX_LENGTH} caracteres`),
        body('imagen')
            .optional()
            .isURL().withMessage('La imagen debe ser una URL válida'),
        body('precio')
            .optional()
            .isFloat({ min: 0 }).withMessage('El precio debe ser un número positivo')
    ],
    validacionMiddleware,
    crear
);

/**
 * @route GET /api/v1/platos/restaurante/:restauranteId
 * @desc Obtener platos de un restaurante
 * @access Public
 */
router.get(
    '/restaurante/:restauranteId',
    [
        param('restauranteId')
            .custom((value) => {
                if (!esObjectIdValido(value)) {
                    throw new Error('ID de restaurante inválido');
                }
                return true;
            })
    ],
    validacionMiddleware,
    obtenerPorRestaurante
);

/**
 * @route GET /api/v1/platos/:id
 * @desc Obtener plato por ID
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
 * @route PUT /api/v1/platos/:id
 * @desc Actualizar plato
 * @access Private
 */
router.put(
    '/:id',
    limiterGeneral,
    autenticacionMiddleware,
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
            .withMessage(`La descripción no puede exceder ${VALIDATION_LIMITS.DESCRIPCION_MAX_LENGTH} caracteres`),
        body('imagen')
            .optional()
            .isURL().withMessage('La imagen debe ser una URL válida'),
        body('precio')
            .optional()
            .isFloat({ min: 0 }).withMessage('El precio debe ser un número positivo')
    ],
    validacionMiddleware,
    actualizar
);

/**
 * @route DELETE /api/v1/platos/:id
 * @desc Eliminar plato
 * @access Private
 */
router.delete(
    '/:id',
    limiterGeneral,
    autenticacionMiddleware,
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

