// Importa el middleware rateLimit de express-rate-limit
// Este paquete permite limitar el número de solicitudes que un cliente puede hacer en un período de tiempo
// Es una medida de seguridad importante para prevenir ataques de fuerza bruta y abuso del API
import rateLimit from "express-rate-limit";

// Rate limiter general para rutas normales
// Este limiter se aplica a la mayoría de endpoints de la API
export const limiterGeneral = rateLimit({
    // Ventana de tiempo en milisegundos durante la cual se cuenta el límite
    // 1000 ms * 60 = 60,000 ms = 1 minuto
    windowMs: 1000 * 60,
    // Número máximo de solicitudes permitidas dentro de la ventana de tiempo
    // En este caso: máximo 100 solicitudes por minuto por IP
    max: 100,
    // Mensaje de error que se enviará al cliente cuando supere el límite
    message: "Demasiadas solicitudes, intenta de nuevo un minuto más tarde!!",
    // Incluye los headers estándar de rate limiting (X-RateLimit-*) en la respuesta
    // Estos headers informan al cliente cuántas solicitudes le quedan disponibles
    standardHeaders: true,
    // Desactiva los headers legacy (X-RateLimit-* antiguos)
    // Se recomienda false para usar solo los headers estándar modernos
    legacyHeaders: false
});

// Rate limiter más restrictivo para autenticación
// Este limiter es más estricto para proteger endpoints de login/registro de ataques de fuerza bruta
export const limiterAuth = rateLimit({
    // Ventana de tiempo: 15 minutos (1000 ms * 60 segundos * 15 minutos)
    windowMs: 1000 * 60 * 15,
    // Solo 5 intentos cada 15 minutos por IP
    // Muy restrictivo para prevenir intentos de adivinanza de contraseñas
    max: 5,
    // Mensaje específico para intentos de autenticación fallidos
    message: "Demasiados intentos de autenticación, intenta de nuevo más tarde",
    // Incluye headers estándar de rate limiting en las respuestas
    standardHeaders: true,
    // Desactiva headers legacy
    legacyHeaders: false,
    // Si es true, las solicitudes exitosas (login correcto) no cuentan para el límite
    // Solo los intentos fallidos cuentan, lo que permite logins legítimos después de errores
    skipSuccessfulRequests: true
});

// Rate limiter para creación de reseñas
// Previene spam de reseñas y asegura calidad en las evaluaciones
export const limiterReseñas = rateLimit({
    // Ventana de tiempo: 1 hora (1000 ms * 60 segundos * 60 minutos)
    windowMs: 1000 * 60 * 60,
    // Máximo 10 reseñas por hora por usuario/IP
    // Limita el ritmo para evitar reseñas masivas o spam
    max: 10,
    // Mensaje informativo cuando se alcanza el límite de reseñas
    message: "Has alcanzado el límite de reseñas por hora",
    // Incluye headers estándar de rate limiting
    standardHeaders: true,
    // Desactiva headers legacy
    legacyHeaders: false
});

// Rate limiter para acciones administrativas
// Protege endpoints administrativos de sobrecarga y posibles abusos
export const limiterAdmin = rateLimit({
    // Ventana de tiempo: 1 minuto
    windowMs: 1000 * 60,
    // Máximo 20 solicitudes administrativas por minuto por IP
    // Más restrictivo que el limiter general pero permite operaciones administrativas necesarias
    max: 20,
    // Mensaje de error cuando se supera el límite de solicitudes administrativas
    message: "Demasiadas solicitudes administrativas",
    // Incluye headers estándar de rate limiting
    standardHeaders: true,
    // Desactiva headers legacy
    legacyHeaders: false
});