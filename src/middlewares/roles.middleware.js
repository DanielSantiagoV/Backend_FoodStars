// Importa la función responderError desde el módulo de helpers
// responderError es una utilidad para enviar respuestas de error de forma consistente
import { responderError } from '../utils/helpers.js';
// Importa constantes desde el módulo de constants
// HTTP_STATUS: códigos de estado HTTP (401, 403, etc.)
// ERROR_MESSAGES: mensajes de error predefinidos y consistentes
// ROLES: roles disponibles en el sistema (ADMIN, USUARIO, etc.)
import { HTTP_STATUS, ERROR_MESSAGES, ROLES } from '../utils/constants.js';

/**
 * Middleware para verificar que el usuario sea administrador
 */
// Middleware exportado que verifica si el usuario autenticado tiene rol de administrador
// Similar a esAdminMiddleware pero con un nombre más descriptivo (requiereAdmin)
// Es un middleware de Express que intercepta las solicitudes antes de llegar al controlador
// Parámetros: req (request), res (response), next (función para continuar al siguiente middleware)
export const requiereAdmin = (req, res, next) => {
    // Verifica que el usuario esté autenticado
    // req.usuario debería estar establecido por un middleware de autenticación anterior (autenticacionMiddleware)
    // Si no existe, significa que el usuario no está autenticado
    if (!req.usuario) {
        // Retorna un error 401 (Unauthorized) indicando que se requiere autenticación
        // return detiene la ejecución del middleware y envía la respuesta de error
        return responderError(res, HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.UNAUTHORIZED);
    }
    
    // Verifica que el usuario tenga rol de administrador
    // Compara el rol del usuario almacenado en req.usuario.rol con el rol ADMIN definido en las constantes
    // Si el rol no coincide con ADMIN, el usuario no tiene permisos para acceder a esta ruta
    if (req.usuario.rol !== ROLES.ADMIN) {
        // Retorna un error 403 (Forbidden) indicando que el usuario no tiene permisos suficientes
        // 403 diferencia de 401: 401 = no autenticado, 403 = autenticado pero sin permisos
        return responderError(res, HTTP_STATUS.FORBIDDEN, ERROR_MESSAGES.FORBIDDEN);
    }
    
    // Si todas las validaciones pasan (usuario autenticado y es admin), llama a next()
    // next() pasa el control al siguiente middleware o al controlador de la ruta
    // Es esencial en Express para continuar con la cadena de middlewares
    next();
};

