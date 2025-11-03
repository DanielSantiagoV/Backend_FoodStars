// Importa Router desde express
// Router permite definir rutas modulares y reutilizables para la aplicación
import { Router } from 'express';
// Importa body, param y query desde express-validator
// body valida los datos del cuerpo de la petición (req.body)
// param valida los parámetros de la URL (req.params)
// query valida los parámetros de la query string (req.query)
import { body, param, query } from 'express-validator';
// Importa los controladores de restaurantes
// Estas funciones manejan la lógica de negocio para las operaciones CRUD de restaurantes
import {
    crear,  // Controlador para crear un nuevo restaurante
    obtenerTodos,  // Controlador para obtener restaurantes con filtros
    obtenerPorId,  // Controlador para obtener un restaurante por ID
    actualizar,  // Controlador para actualizar un restaurante
    aprobar,  // Controlador para aprobar un restaurante (solo admin)
    eliminar  // Controlador para eliminar un restaurante
} from '../controllers/restaurante.controller.js';
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
// limiterGeneral: limiter general para rutas normales
// limiterAdmin: limiter para acciones administrativas
import { limiterGeneral, limiterAdmin } from '../config/limiters.js';
// Importa función helper para validar ObjectIds
// esObjectIdValido verifica si un string es un ObjectId válido de MongoDB
import { esObjectIdValido } from '../utils/helpers.js';
// Importa constantes de validación
// VALIDATION_LIMITS contiene los límites máximos para campos (NOMBRE_MAX_LENGTH, DESCRIPCION_MAX_LENGTH, etc.)
import { VALIDATION_LIMITS } from '../utils/constants.js';

// Crea una instancia de Router para definir las rutas de restaurantes
// Este router se montará en la ruta base /api/v1/restaurantes
const router = Router();

/**
 * @route POST /api/v1/restaurantes
 * @desc Crear nuevo restaurante (requiere aprobación admin)
 * @access Private
 */
// Define la ruta POST para crear un nuevo restaurante
// Esta ruta requiere autenticación (usuario logueado)
// Soporta crear restaurante solo o restaurante con platos en una sola operación
router.post(
    '/',  // Ruta relativa: se completa con /api/v1/restaurantes
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
        // Valida el campo descripcion del cuerpo de la petición
        body('descripcion')
            .optional()  // El campo es opcional (puede no estar presente)
            .trim()  // Elimina espacios en blanco al inicio y final
            // Verifica que la longitud no exceda el límite máximo
            .isLength({ max: VALIDATION_LIMITS.DESCRIPCION_MAX_LENGTH })
            .withMessage(`La descripción no puede exceder ${VALIDATION_LIMITS.DESCRIPCION_MAX_LENGTH} caracteres`),
        // Valida el campo categoriaId del cuerpo de la petición
        body('categoriaId')
            .optional()  // El campo es opcional
            .custom((value) => {
                // Validación personalizada: si se proporciona categoriaId, debe ser un ObjectId válido
                if (value && !esObjectIdValido(value)) {
                    throw new Error('ID de categoría inválido');
                }
                return true;
            }),
        // Valida el campo ubicacion del cuerpo de la petición
        body('ubicacion')
            .optional()  // El campo es opcional
            .trim(),  // Elimina espacios en blanco al inicio y final
        // Valida el campo imagen del cuerpo de la petición
        body('imagen')
            .optional()  // El campo es opcional
            .custom((value) => {
                // Si no se proporciona imagen, es válido (opcional)
                if (!value) return true;
                // Aceptar Base64 (data:image/...) o URL
                // Si la imagen viene en formato Base64 (data:image/png;base64,...)
                if (value.startsWith('data:image/')) {
                    // Validar formato Base64 básico
                    // Limita el tamaño máximo a ~10MB para evitar sobrecarga
                    if (value.length > 10 * 1024 * 1024) { // ~10MB máximo
                        throw new Error('La imagen Base64 es demasiado grande (máx. ~10MB)');
                    }
                    return true;
                }
                // Validar URL si no es Base64
                // Patrón regex que verifica que sea una URL HTTP/HTTPS con extensión de imagen válida
                const urlPattern = /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i;
                if (!urlPattern.test(value)) {
                    throw new Error('La imagen debe ser una URL válida o Base64');
                }
                return true;
            }),
        // Valida el campo platos del cuerpo de la petición
        // Permite crear restaurante con múltiples platos en una sola petición
        body('platos')
            .optional()  // El campo es opcional
            .custom((platos) => {
                // Si no se proporcionan platos, es válido (opcional)
                if (platos === undefined || platos === null) return true;
                // Verifica que platos sea un array
                if (!Array.isArray(platos)) {
                    throw new Error('Los platos deben ser un array');
                }
                // Limita el número máximo de platos que se pueden crear a la vez
                // Previene sobrecarga del servidor
                if (platos.length > 50) {
                    throw new Error('No se pueden crear más de 50 platos a la vez');
                }
                // Validar cada plato del array
                for (let i = 0; i < platos.length; i++) {
                    const plato = platos[i];
                    // Verifica que el plato tenga nombre y no esté vacío
                    if (!plato.nombre || plato.nombre.trim() === '') {
                        throw new Error(`El nombre del plato ${i + 1} es requerido`);
                    }
                    // Verifica que el nombre no exceda 100 caracteres
                    if (plato.nombre && plato.nombre.length > 100) {
                        throw new Error(`El nombre del plato ${i + 1} no puede exceder 100 caracteres`);
                    }
                    // Verifica que la descripción (si existe) no exceda 500 caracteres
                    if (plato.descripcion && plato.descripcion.length > 500) {
                        throw new Error(`La descripción del plato ${i + 1} no puede exceder 500 caracteres`);
                    }
                    // Valida el precio (opcional pero debe ser positivo si se proporciona)
                    if (plato.precio !== undefined && plato.precio !== null) {
                        // Convierte el precio a número flotante
                        const precio = parseFloat(plato.precio);
                        // Verifica que sea un número válido y positivo
                        if (isNaN(precio) || precio < 0) {
                            throw new Error(`El precio del plato ${i + 1} debe ser un número positivo`);
                        }
                    }
                    // Valida la imagen del plato (si se proporciona)
                    if (plato.imagen) {
                        // Si la imagen es Base64
                        if (plato.imagen.startsWith('data:image/')) {
                            // Limita el tamaño máximo a ~10MB
                            if (plato.imagen.length > 10 * 1024 * 1024) {
                                throw new Error(`La imagen Base64 del plato ${i + 1} es demasiado grande (máx. ~10MB)`);
                            }
                        } else {
                            // Si no es Base64, valida que sea una URL válida con extensión de imagen
                            const urlPattern = /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i;
                            if (!urlPattern.test(plato.imagen)) {
                                throw new Error(`La imagen del plato ${i + 1} debe ser una URL válida o Base64`);
                            }
                        }
                    }
                }
                return true;  // Si todas las validaciones pasan, retorna true
            })
    ],
    // Middleware que verifica si hay errores de validación
    validacionMiddleware,
    // Controlador que maneja la lógica de crear el restaurante (con o sin platos)
    crear
);

/**
 * @route GET /api/v1/restaurantes
 * @desc Obtener restaurantes con filtros
 * @access Public
 */
// Define la ruta GET para obtener restaurantes con filtros y paginación
// Esta ruta es pública, no requiere autenticación
router.get(
    '/',  // Ruta relativa: se completa con /api/v1/restaurantes
    [
        // Valida el parámetro categoriaId de la query string
        query('categoriaId')
            .optional()  // El parámetro es opcional
            .custom((value) => {
                // Validación personalizada: si se proporciona categoriaId, debe ser un ObjectId válido
                if (value && !esObjectIdValido(value)) {
                    throw new Error('ID de categoría inválido');
                }
                return true;
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
    validacionMiddleware,
    // Controlador que maneja la lógica de obtener los restaurantes con filtros
    obtenerTodos
);

/**
 * @route GET /api/v1/restaurantes/:id
 * @desc Obtener restaurante por ID
 * @access Public
 */
// Define la ruta GET para obtener un restaurante específico por su ID
// Esta ruta es pública, no requiere autenticación
router.get(
    '/:id',  // Ruta relativa con parámetro dinámico: /api/v1/restaurantes/:id
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
    // Controlador que maneja la lógica de obtener el restaurante por ID
    obtenerPorId
);

/**
 * @route PUT /api/v1/restaurantes/:id
 * @desc Actualizar restaurante
 * @access Private
 */
// Define la ruta PUT para actualizar un restaurante existente
// Esta ruta requiere autenticación (usuario logueado)
router.put(
    '/:id',  // Ruta relativa con parámetro dinámico: /api/v1/restaurantes/:id
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
        // Valida el campo categoriaId del cuerpo de la petición (opcional)
        body('categoriaId')
            .optional()  // El campo es opcional
            .custom((value) => {
                // Validación personalizada: si se proporciona categoriaId, debe ser un ObjectId válido
                if (value && !esObjectIdValido(value)) {
                    throw new Error('ID de categoría inválido');
                }
                return true;
            }),
        // Valida el campo ubicacion del cuerpo de la petición (opcional)
        body('ubicacion')
            .optional()  // El campo es opcional
            .trim(),  // Elimina espacios en blanco al inicio y final
        // Valida el campo imagen del cuerpo de la petición (opcional)
        body('imagen')
            .optional()  // El campo es opcional
            .custom((value) => {
                // Si no se proporciona imagen, es válido (opcional)
                if (!value) return true;
                // Aceptar Base64 (data:image/...) o URL
                // Si la imagen viene en formato Base64
                if (value.startsWith('data:image/')) {
                    // Validar formato Base64 básico
                    // Limita el tamaño máximo a ~10MB para evitar sobrecarga
                    if (value.length > 10 * 1024 * 1024) { // ~10MB máximo
                        throw new Error('La imagen Base64 es demasiado grande (máx. ~10MB)');
                    }
                    return true;
                }
                // Validar URL si no es Base64
                // Patrón regex que verifica que sea una URL HTTP/HTTPS con extensión de imagen válida
                const urlPattern = /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i;
                if (!urlPattern.test(value)) {
                    throw new Error('La imagen debe ser una URL válida o Base64');
                }
                return true;
            })
    ],
    // Middleware que verifica si hay errores de validación
    validacionMiddleware,
    // Controlador que maneja la lógica de actualizar el restaurante
    actualizar
);

/**
 * @route PATCH /api/v1/restaurantes/:id/aprobar
 * @desc Aprobar restaurante (solo admin)
 * @access Private/Admin
 */
// Define la ruta PATCH para aprobar un restaurante (solo para administradores)
// Cuando un restaurante se aprueba, puede ser visible para todos los usuarios
router.patch(
    '/:id/aprobar',  // Ruta relativa con parámetro dinámico: /api/v1/restaurantes/:id/aprobar
    // Rate limiter para acciones administrativas
    // Previene abuso limitando el número de peticiones administrativas por IP
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
    // Controlador que maneja la lógica de aprobar el restaurante
    aprobar
);

/**
 * @route DELETE /api/v1/restaurantes/:id
 * @desc Eliminar restaurante
 * @access Private
 */
// Define la ruta DELETE para eliminar un restaurante
// Esta ruta requiere autenticación (usuario logueado)
// Nota: No permite eliminar si hay platos o reseñas asociados
router.delete(
    '/:id',  // Ruta relativa con parámetro dinámico: /api/v1/restaurantes/:id
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
    // Controlador que maneja la lógica de eliminar el restaurante
    // Verifica que no haya platos o reseñas asociados antes de eliminar
    eliminar
);

// Exporta el router para que pueda ser montado en la aplicación principal
// Se importará en el archivo principal de rutas (app.js o server.js)
export default router;

