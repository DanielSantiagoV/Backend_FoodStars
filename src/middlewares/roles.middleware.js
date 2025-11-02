import { responderError } from '../utils/helpers.js';
import { HTTP_STATUS, ERROR_MESSAGES, ROLES } from '../utils/constants.js';

/**
 * Middleware para verificar que el usuario sea administrador
 */
export const requiereAdmin = (req, res, next) => {
    if (!req.usuario) {
        return responderError(res, HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.UNAUTHORIZED);
    }
    
    if (req.usuario.rol !== ROLES.ADMIN) {
        return responderError(res, HTTP_STATUS.FORBIDDEN, ERROR_MESSAGES.FORBIDDEN);
    }
    
    next();
};

