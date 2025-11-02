import { responderError } from '../utils/helpers.js';
import { HTTP_STATUS, ERROR_MESSAGES, ROLES } from '../utils/constants.js';

/**
 * Middleware para verificar que el usuario sea administrador
 * Debe usarse después de autenticacionMiddleware
 */
export const esAdminMiddleware = (req, res, next) => {
    // Verificar que el usuario está autenticado (debe venir de autenticacionMiddleware)
    if (!req.usuario) {
        return responderError(res, HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.UNAUTHORIZED);
    }
    
    // Verificar que el usuario sea admin
    if (req.usuario.rol !== ROLES.ADMIN) {
        return responderError(res, HTTP_STATUS.FORBIDDEN, ERROR_MESSAGES.FORBIDDEN + '. Se requiere rol de administrador.');
    }
    
    next();
};

