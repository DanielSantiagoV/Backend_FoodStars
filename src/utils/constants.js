// Roles de usuario del sistema
// Define los diferentes roles que pueden tener los usuarios en la aplicación
export const ROLES = {
    USUARIO: 'usuario',  // Rol por defecto para usuarios normales
    ADMIN: 'admin'  // Rol de administrador con permisos especiales
};

// Códigos de estado HTTP estándar
// Define los códigos de estado HTTP más utilizados en las respuestas de la API
export const HTTP_STATUS = {
    OK: 200,  // Solicitud exitosa
    CREATED: 201,  // Recurso creado exitosamente
    NO_CONTENT: 204,  // Solicitud exitosa pero sin contenido para retornar
    BAD_REQUEST: 400,  // Solicitud incorrecta (datos inválidos)
    UNAUTHORIZED: 401,  // No autenticado (token inválido o faltante)
    FORBIDDEN: 403,  // No autorizado (falta de permisos)
    NOT_FOUND: 404,  // Recurso no encontrado
    CONFLICT: 409,  // Conflicto (duplicados, estado inconsistente)
    INTERNAL_SERVER_ERROR: 500  // Error interno del servidor
};

// Mensajes de error comunes del sistema
// Mensajes estandarizados que se retornan cuando ocurren errores en la API
export const ERROR_MESSAGES = {
    UNAUTHORIZED: 'No autorizado. Token inválido o expirado',  // Error de autenticación
    FORBIDDEN: 'Acceso denegado. No tienes permisos suficientes',  // Error de autorización
    NOT_FOUND: 'Recurso no encontrado',  // Recurso no existe
    VALIDATION_ERROR: 'Error de validación',  // Error en validación de datos
    DUPLICATE_ENTRY: 'Ya existe un registro con estos datos',  // Intento de crear duplicado
    INVALID_ID: 'ID inválido',  // ID con formato incorrecto
    INTERNAL_ERROR: 'Error interno del servidor'  // Error genérico del servidor
};

// Límites de validación para campos del sistema
// Define los límites mínimos y máximos para validación de datos de entrada
export const VALIDATION_LIMITS = {
    RATING_MIN: 1,  // Calificación mínima permitida (1 estrella)
    RATING_MAX: 5,  // Calificación máxima permitida (5 estrellas)
    PASSWORD_MIN_LENGTH: 6,  // Longitud mínima de contraseña
    NOMBRE_MAX_LENGTH: 100,  // Longitud máxima para nombres (restaurantes, platos, categorías, usuarios)
    DESCRIPCION_MAX_LENGTH: 1000  // Longitud máxima para descripciones
};

// Pesos para cálculo de ranking de restaurantes
// Define los pesos relativos de cada factor en el cálculo del ranking
// La suma total debe ser 1.0 (100%) para que el ranking esté normalizado
export const RANKING_WEIGHTS = {
    CALIFICACION: 0.5,  // 50% - Promedio de calificaciones de las reseñas
    LIKES_RATIO: 0.3,  // 30% - Ratio de likes vs dislikes en reseñas
    RECENCIA: 0.2  // 20% - Qué tan recientes son las reseñas (más recientes = mejor)
};