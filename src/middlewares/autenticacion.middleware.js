// Importa passport, el middleware de autenticación configurado
// Passport es el objeto principal que maneja las estrategias de autenticación
import passport from "passport";
// Importa la configuración de passport desde el archivo de configuración
// Este import ejecuta el código de passport.js que registra la estrategia JWT
// Es importante importarlo aunque no se use directamente porque ejecuta passport.use()
import "../config/passport.js";
// Importa la función responderError desde el módulo de helpers
// responderError es una utilidad para enviar respuestas de error de forma consistente
import { responderError } from '../utils/helpers.js';
// Importa constantes desde el módulo de constants
// HTTP_STATUS: códigos de estado HTTP (500, 401, etc.)
// ERROR_MESSAGES: mensajes de error predefinidos y consistentes
import { HTTP_STATUS, ERROR_MESSAGES } from '../utils/constants.js';

/**
 * Middleware de autenticación JWT
 * Verifica que el usuario tenga un token válido
 */
// Middleware exportado que autentica usuarios usando tokens JWT
// Este middleware debe aplicarse a rutas que requieren autenticación
// Parámetros: req (request), res (response), next (función para continuar al siguiente middleware)
export const autenticacionMiddleware = (req, res, next) => {
    // passport.authenticate() es el método que ejecuta la estrategia de autenticación configurada
    // 'jwt' es el nombre de la estrategia registrada en passport.js
    // { session: false } desactiva las sesiones, ya que usamos tokens JWT (stateless)
    // El tercer parámetro es un callback que se ejecuta después de la autenticación
    passport.authenticate('jwt', { session: false }, (err, usuario) => {
        // Si hay un error durante la autenticación (por ejemplo, error de base de datos)
        if (err) {
            // Retorna un error 500 (Internal Server Error) indicando un problema del servidor
            // return detiene la ejecución del middleware y envía la respuesta de error
            return responderError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_MESSAGES.INTERNAL_ERROR);
        }
        // Si no se encuentra un usuario (token inválido, expirado, o usuario no existe en BD)
        // passport retorna null o false cuando la autenticación falla
        if (!usuario) {
            // Retorna un error 401 (Unauthorized) indicando que el token es inválido o falta
            return responderError(res, HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.UNAUTHORIZED);
        }
        // Si la autenticación es exitosa, adjunta el objeto usuario al request
        // Esto permite que otros middlewares y controladores accedan a la información del usuario
        req.usuario = usuario; // Adjuntar usuario al request
        // Llama a next() para continuar con el siguiente middleware o controlador
        // next() es esencial en Express para pasar el control al siguiente handler
        next();
    // Los paréntesis (req, res, next) invocan la función retornada por passport.authenticate()
    // Esto es necesario porque passport.authenticate() retorna una función middleware que debe ejecutarse
    })(req, res, next);
};