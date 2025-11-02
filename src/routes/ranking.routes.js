import { Router } from 'express';
import { query } from 'express-validator';
import { obtenerRanking } from '../controllers/ranking.controller.js';
import { validacionMiddleware } from '../middlewares/validationDTO.js';
import { esObjectIdValido } from '../utils/helpers.js';

const router = Router();

/**
 * @route GET /api/v1/ranking/restaurantes
 * @desc Obtener ranking de restaurantes
 * @access Public
 */
router.get(
    '/restaurantes',
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
    obtenerRanking
);

export default router;

