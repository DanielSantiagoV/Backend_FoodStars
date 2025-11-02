// Roles de usuario
export const ROLES = {
    USUARIO: 'usuario',
    ADMIN: 'admin'
};

// Códigos de estado HTTP
export const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    INTERNAL_SERVER_ERROR: 500
};

// Mensajes de error comunes
export const ERROR_MESSAGES = {
    UNAUTHORIZED: 'No autorizado. Token inválido o expirado',
    FORBIDDEN: 'Acceso denegado. No tienes permisos suficientes',
    NOT_FOUND: 'Recurso no encontrado',
    VALIDATION_ERROR: 'Error de validación',
    DUPLICATE_ENTRY: 'Ya existe un registro con estos datos',
    INVALID_ID: 'ID inválido',
    INTERNAL_ERROR: 'Error interno del servidor'
};

// Límites de validación
export const VALIDATION_LIMITS = {
    RATING_MIN: 1,
    RATING_MAX: 5,
    PASSWORD_MIN_LENGTH: 6,
    NOMBRE_MAX_LENGTH: 100,
    DESCRIPCION_MAX_LENGTH: 1000
};

// Pesos para cálculo de ranking
export const RANKING_WEIGHTS = {
    CALIFICACION: 0.5,
    LIKES_RATIO: 0.3,
    RECENCIA: 0.2
};