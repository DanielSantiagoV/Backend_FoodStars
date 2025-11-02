import { Router } from 'express';
import { body, param, query } from 'express-validator';
import {
    crear,
    obtenerTodos,
    obtenerPorId,
    actualizar,
    aprobar,
    eliminar
} from '../controllers/restaurante.controller.js';
import { validacionMiddleware } from '../middlewares/validationDTO.js';
import { autenticacionMiddleware } from '../middlewares/autenticacion.middleware.js';
import { requiereAdmin } from '../middlewares/roles.middleware.js';
import { limiterGeneral, limiterAdmin } from '../config/limiters.js';
import { esObjectIdValido } from '../utils/helpers.js';
import { VALIDATION_LIMITS } from '../utils/constants.js';

const router = Router();

/**
 * @route POST /api/v1/restaurantes
 * @desc Crear nuevo restaurante (requiere aprobación admin)
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
        body('descripcion')
            .optional()
            .trim()
            .isLength({ max: VALIDATION_LIMITS.DESCRIPCION_MAX_LENGTH })
            .withMessage(`La descripción no puede exceder ${VALIDATION_LIMITS.DESCRIPCION_MAX_LENGTH} caracteres`),
        body('categoriaId')
            .optional()
            .custom((value) => {
                if (value && !esObjectIdValido(value)) {
                    throw new Error('ID de categoría inválido');
                }
                return true;
            }),
        body('ubicacion')
            .optional()
            .trim(),
        body('imagen')
            .optional()
            .custom((value) => {
                if (!value) return true; // Opcional
                // Aceptar Base64 (data:image/...) o URL
                if (value.startsWith('data:image/')) {
                    // Validar formato Base64 básico
                    if (value.length > 10 * 1024 * 1024) { // ~10MB máximo
                        throw new Error('La imagen Base64 es demasiado grande (máx. ~10MB)');
                    }
                    return true;
                }
                // Validar URL si no es Base64
                const urlPattern = /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i;
                if (!urlPattern.test(value)) {
                    throw new Error('La imagen debe ser una URL válida o Base64');
                }
                return true;
            }),
        body('platos')
            .optional()
            .custom((platos) => {
                if (platos === undefined || platos === null) return true;
                if (!Array.isArray(platos)) {
                    throw new Error('Los platos deben ser un array');
                }
                if (platos.length > 50) {
                    throw new Error('No se pueden crear más de 50 platos a la vez');
                }
                // Validar cada plato
                for (let i = 0; i < platos.length; i++) {
                    const plato = platos[i];
                    if (!plato.nombre || plato.nombre.trim() === '') {
                        throw new Error(`El nombre del plato ${i + 1} es requerido`);
                    }
                    if (plato.nombre && plato.nombre.length > 100) {
                        throw new Error(`El nombre del plato ${i + 1} no puede exceder 100 caracteres`);
                    }
                    if (plato.descripcion && plato.descripcion.length > 500) {
                        throw new Error(`La descripción del plato ${i + 1} no puede exceder 500 caracteres`);
                    }
                    if (plato.precio !== undefined && plato.precio !== null) {
                        const precio = parseFloat(plato.precio);
                        if (isNaN(precio) || precio < 0) {
                            throw new Error(`El precio del plato ${i + 1} debe ser un número positivo`);
                        }
                    }
                    if (plato.imagen) {
                        if (plato.imagen.startsWith('data:image/')) {
                            if (plato.imagen.length > 10 * 1024 * 1024) {
                                throw new Error(`La imagen Base64 del plato ${i + 1} es demasiado grande (máx. ~10MB)`);
                            }
                        } else {
                            const urlPattern = /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i;
                            if (!urlPattern.test(plato.imagen)) {
                                throw new Error(`La imagen del plato ${i + 1} debe ser una URL válida o Base64`);
                            }
                        }
                    }
                }
                return true;
            })
    ],
    validacionMiddleware,
    crear
);

/**
 * @route GET /api/v1/restaurantes
 * @desc Obtener restaurantes con filtros
 * @access Public
 */
router.get(
    '/',
    [
        query('categoriaId')
            .optional()
            .custom((value) => {
                if (value && !esObjectIdValido(value)) {
                    throw new Error('ID de categoría inválido');
                }
                return true;
            }),
        query('ordenarPor')
            .optional()
            .isIn(['ranking', 'calificacionPromedio', 'nombre', 'fechaCreacion'])
            .withMessage('Ordenamiento inválido'),
        query('orden')
            .optional()
            .isIn(['asc', 'desc'])
            .withMessage('Orden debe ser "asc" o "desc"'),
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

/**
 * @route GET /api/v1/restaurantes/:id
 * @desc Obtener restaurante por ID
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
 * @route PUT /api/v1/restaurantes/:id
 * @desc Actualizar restaurante
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
        body('categoriaId')
            .optional()
            .custom((value) => {
                if (value && !esObjectIdValido(value)) {
                    throw new Error('ID de categoría inválido');
                }
                return true;
            }),
        body('ubicacion')
            .optional()
            .trim(),
        body('imagen')
            .optional()
            .custom((value) => {
                if (!value) return true; // Opcional
                // Aceptar Base64 (data:image/...) o URL
                if (value.startsWith('data:image/')) {
                    // Validar formato Base64 básico
                    if (value.length > 10 * 1024 * 1024) { // ~10MB máximo
                        throw new Error('La imagen Base64 es demasiado grande (máx. ~10MB)');
                    }
                    return true;
                }
                // Validar URL si no es Base64
                const urlPattern = /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i;
                if (!urlPattern.test(value)) {
                    throw new Error('La imagen debe ser una URL válida o Base64');
                }
                return true;
            })
    ],
    validacionMiddleware,
    actualizar
);

/**
 * @route PATCH /api/v1/restaurantes/:id/aprobar
 * @desc Aprobar restaurante (solo admin)
 * @access Private/Admin
 */
router.patch(
    '/:id/aprobar',
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
    aprobar
);

/**
 * @route DELETE /api/v1/restaurantes/:id
 * @desc Eliminar restaurante
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

