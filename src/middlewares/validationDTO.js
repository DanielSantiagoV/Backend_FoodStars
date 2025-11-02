import { validationResult } from "express-validator";
import { responderError } from '../utils/helpers.js';
import { HTTP_STATUS, ERROR_MESSAGES } from '../utils/constants.js';

/**
 * Middleware para validar los resultados de express-validator
 */
export function validacionMiddleware(req, res, next) {
    const result = validationResult(req);
    if (!result.isEmpty()) {
        return responderError(
            res,
            HTTP_STATUS.BAD_REQUEST,
            ERROR_MESSAGES.VALIDATION_ERROR,
            result.array()
        );
    }
    next();
}

// Mantener compatibilidad con nombre anterior
export const validationDTO = validacionMiddleware;
