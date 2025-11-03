// Importa Router desde express
// Router permite definir rutas modulares y reutilizables para la aplicación
import { Router } from 'express';
// Importa query desde express-validator
// query valida los parámetros de la query string (query parameters) de las URLs
import { query } from 'express-validator';
// Importa el controlador de ranking
// obtenerRanking maneja la lógica para obtener el ranking de restaurantes
import { obtenerRanking } from '../controllers/ranking.controller.js';
// Importa el middleware de validación
// validacionMiddleware procesa los errores de validación de express-validator
import { validacionMiddleware } from '../middlewares/validationDTO.js';
// Importa función helper para validar ObjectIds
// esObjectIdValido verifica si un string es un ObjectId válido de MongoDB
import { esObjectIdValido } from '../utils/helpers.js';

// Crea una instancia de Router para definir las rutas de ranking
// Este router se montará en la ruta base /api/v1/ranking
const router = Router();

/**
 * @route GET /api/v1/ranking/restaurantes
 * @desc Obtener ranking de restaurantes
 * @access Public
 */
// Define la ruta GET para obtener el ranking de restaurantes
// Esta ruta es pública, no requiere autenticación
router.get(
    '/restaurantes',  // Ruta relativa: se completa con /api/v1/ranking/restaurantes
    [
        // Valida el parámetro categoriaId de la query string
        query('categoriaId')
            .optional()  // El parámetro es opcional (puede no estar presente)
            .custom((value) => {
                // Validación personalizada: si se proporciona categoriaId, debe ser un ObjectId válido
                if (value && !esObjectIdValido(value)) {
                    throw new Error('ID de categoría inválido');
                }
                return true;  // Si es válido o no existe, pasa la validación
            }),
        // Valida el parámetro ordenarPor de la query string
        query('ordenarPor')
            .optional()  // El parámetro es opcional
            // Verifica que el valor esté en la lista permitida de campos para ordenar
            .isIn(['ranking', 'calificacionPromedio', 'nombre', 'fechaCreacion'])
            .withMessage('Ordenamiento inválido'),  // Mensaje de error si no está en la lista
        // Valida el parámetro orden de la query string
        query('orden')
            .optional()  // El parámetro es opcional
            // Verifica que el valor sea 'asc' (ascendente) o 'desc' (descendente)
            .isIn(['asc', 'desc'])
            .withMessage('Orden debe ser "asc" o "desc"'),  // Mensaje de error
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
    // Si hay errores, los retorna; si no, continúa al siguiente middleware
    validacionMiddleware,
    // Controlador que maneja la lógica de obtener el ranking
    // Esta es la última función en la cadena de middlewares
    obtenerRanking
);

// Exporta el router para que pueda ser montado en la aplicación principal
// Se importará en el archivo principal de rutas (app.js o server.js)
export default router;

