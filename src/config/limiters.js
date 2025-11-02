import rateLimit from "express-rate-limit";

// Rate limiter general para rutas normales
export const limiterGeneral = rateLimit({
    windowMs: 1000 * 60, // 1 minuto
    max: 100,
    message: "Demasiadas solicitudes, intenta de nuevo un minuto más tarde!!",
    standardHeaders: true,
    legacyHeaders: false
});

// Rate limiter más restrictivo para autenticación
export const limiterAuth = rateLimit({
    windowMs: 1000 * 60 * 15, // 15 minutos
    max: 5, // Solo 5 intentos cada 15 minutos
    message: "Demasiados intentos de autenticación, intenta de nuevo más tarde",
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true
});

// Rate limiter para creación de reseñas
export const limiterReseñas = rateLimit({
    windowMs: 1000 * 60 * 60, // 1 hora
    max: 10, // Máximo 10 reseñas por hora
    message: "Has alcanzado el límite de reseñas por hora",
    standardHeaders: true,
    legacyHeaders: false
});

// Rate limiter para acciones administrativas
export const limiterAdmin = rateLimit({
    windowMs: 1000 * 60, // 1 minuto
    max: 20,
    message: "Demasiadas solicitudes administrativas",
    standardHeaders: true,
    legacyHeaders: false
});