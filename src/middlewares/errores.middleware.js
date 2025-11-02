import { responderError } from '../utils/helpers.js';
import { HTTP_STATUS, ERROR_MESSAGES } from '../utils/constants.js';

/**
 * Middleware centralizado para manejo de errores
 */
export const manejoErrores = (err, req, res, next) => {
    console.error('Error:', err);
    
    // Errores de validación
    if (err.name === 'ValidationError' || err.message.includes('validación')) {
        return responderError(res, HTTP_STATUS.BAD_REQUEST, err.message);
    }
    
    // Errores de duplicado (MongoDB unique index)
    if (err.code === 11000 || err.message.includes('ya existe')) {
        return responderError(res, HTTP_STATUS.CONFLICT, ERROR_MESSAGES.DUPLICATE_ENTRY);
    }
    
    // Errores de ObjectId inválido
    if (err.message.includes('ID inválido') || err.message.includes('ObjectId')) {
        return responderError(res, HTTP_STATUS.BAD_REQUEST, ERROR_MESSAGES.INVALID_ID);
    }
    
    // Errores de no encontrado
    if (err.message.includes('no encontrado') || err.message.includes('no existe')) {
        return responderError(res, HTTP_STATUS.NOT_FOUND, err.message);
    }
    
    // Error por defecto
    return responderError(
        res,
        err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR,
        err.message || ERROR_MESSAGES.INTERNAL_ERROR
    );
};

/**
 * Middleware para rutas no encontradas
 */
export const rutaNoEncontrada = (req, res) => {
    responderError(res, HTTP_STATUS.NOT_FOUND, `Ruta ${req.method} ${req.path} no encontrada`);
};

