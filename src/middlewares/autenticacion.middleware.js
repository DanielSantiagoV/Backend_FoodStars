import passport from "passport";
import "../config/passport.js";
import { responderError } from '../utils/helpers.js';
import { HTTP_STATUS, ERROR_MESSAGES } from '../utils/constants.js';

/**
 * Middleware de autenticación JWT
 * Verifica que el usuario tenga un token válido
 */
export const autenticacionMiddleware = (req, res, next) => {
    passport.authenticate('jwt', { session: false }, (err, usuario) => {
        if (err) {
            return responderError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_MESSAGES.INTERNAL_ERROR);
        }
        if (!usuario) {
            return responderError(res, HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.UNAUTHORIZED);
        }
        req.usuario = usuario; // Adjuntar usuario al request
        next();
    })(req, res, next);
};