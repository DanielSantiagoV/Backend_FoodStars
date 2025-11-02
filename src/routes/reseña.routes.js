import { Router } from 'express';
import { body, param, query } from 'express-validator';
import {
    crear,
    obtenerTodas,
    obtenerPorRestaurante,
    obtenerPorId,
    actualizar,
    like,
    dislike,
    eliminar
} from '../controllers/reseña.controller.js';
import { validacionMiddleware } from '../middlewares/validationDTO.js';
import { autenticacionMiddleware } from '../middlewares/autenticacion.middleware.js';
import { requiereAdmin } from '../middlewares/roles.middleware.js';
import { limiterReseñas, limiterGeneral } from '../config/limiters.js';
import { esObjectIdValido } from '../utils/helpers.js';
import { VALIDATION_LIMITS } from '../utils/constants.js';

const router = Router();

/**
 * @route POST /api/v1/reseñas
 * @desc Crear nueva reseña (transaccional)
 * @access Private
 */
router.post(
    '/',
    limiterReseñas,
    autenticacionMiddleware,
    [
        body('restauranteId')
            .notEmpty().withMessage('El ID del restaurante es requerido')
            .custom((value) => {
                if (!esObjectIdValido(value)) {
                    throw new Error('ID de restaurante inválido');
                }
                return true;
            }),
        body('comentario')
            .optional()
            .trim()
            .isLength({ max: VALIDATION_LIMITS.DESCRIPCION_MAX_LENGTH })
            .withMessage(`El comentario no puede exceder ${VALIDATION_LIMITS.DESCRIPCION_MAX_LENGTH} caracteres`),
        body('calificacion')
            .notEmpty().withMessage('La calificación es requerida')
            .isInt({ min: VALIDATION_LIMITS.RATING_MIN, max: VALIDATION_LIMITS.RATING_MAX })
            .withMessage(`La calificación debe estar entre ${VALIDATION_LIMITS.RATING_MIN} y ${VALIDATION_LIMITS.RATING_MAX}`)
    ],
    validacionMiddleware,
    crear
);

/**
 * @route GET /api/v1/reseñas
 * @desc Obtener todas las reseñas (para admin)
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
            .withMessage('Saltar debe ser un número mayor o igual a 0'),
        query('ordenarPor')
            .optional()
            .isIn(['fechaCreacion', 'calificacion', 'likes'])
            .withMessage('Ordenamiento inválido'),
        query('orden')
            .optional()
            .isIn(['asc', 'desc'])
            .withMessage('Orden debe ser "asc" o "desc"')
    ],
    validacionMiddleware,
    obtenerTodas
);

/**
 * @route GET /api/v1/reseñas/restaurante/:restauranteId
 * @desc Obtener reseñas de un restaurante
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
            }),
        query('limite')
            .optional()
            .isInt({ min: 1, max: 100 })
            .withMessage('El límite debe ser un número entre 1 y 100'),
        query('saltar')
            .optional()
            .isInt({ min: 0 })
            .withMessage('Saltar debe ser un número mayor o igual a 0'),
        query('ordenarPor')
            .optional()
            .isIn(['fechaCreacion', 'calificacion', 'likes'])
            .withMessage('Ordenamiento inválido'),
        query('orden')
            .optional()
            .isIn(['asc', 'desc'])
            .withMessage('Orden debe ser "asc" o "desc"')
    ],
    validacionMiddleware,
    obtenerPorRestaurante
);

/**
 * @route GET /api/v1/reseñas/:id
 * @desc Obtener reseña por ID
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
 * @route PUT /api/v1/reseñas/:id
 * @desc Actualizar reseña
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
        body('comentario')
            .optional()
            .trim()
            .isLength({ max: VALIDATION_LIMITS.DESCRIPCION_MAX_LENGTH })
            .withMessage(`El comentario no puede exceder ${VALIDATION_LIMITS.DESCRIPCION_MAX_LENGTH} caracteres`),
        body('calificacion')
            .optional()
            .isInt({ min: VALIDATION_LIMITS.RATING_MIN, max: VALIDATION_LIMITS.RATING_MAX })
            .withMessage(`La calificación debe estar entre ${VALIDATION_LIMITS.RATING_MIN} y ${VALIDATION_LIMITS.RATING_MAX}`)
    ],
    validacionMiddleware,
    actualizar
);

/**
 * @route POST /api/v1/reseñas/:id/like
 * @desc Dar like a una reseña (transaccional)
 * @access Private
 */
router.post(
    '/:id/like',
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
    like
);

/**
 * @route POST /api/v1/reseñas/:id/dislike
 * @desc Dar dislike a una reseña (transaccional)
 * @access Private
 */
router.post(
    '/:id/dislike',
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
    dislike
);

/**
 * @route DELETE /api/v1/reseñas/:id
 * @desc Eliminar reseña
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

