// Importa semver para validar y comparar versiones siguiendo el estándar SemVer
// SemVer es el formato de versionado: MAJOR.MINOR.PATCH (ej: 1.0.0, 2.1.3)
import semver from 'semver';
// Importa la función responderError desde el módulo de helpers
// responderError es una utilidad para enviar respuestas de error de forma consistente
import { responderError } from '../utils/helpers.js';
// Importa constantes desde el módulo de constants
// HTTP_STATUS: códigos de estado HTTP (400, etc.)
import { HTTP_STATUS } from '../utils/constants.js';

/**
 * Versión actual de la API
 * Sigue semver: MAJOR.MINOR.PATCH
 */
// Obtiene la versión actual de la API desde las variables de entorno
// Si API_VERSION no está definida en .env, usa '1.0.0' como versión por defecto
// Esta es la versión que el servidor está ejecutando actualmente
export const API_VERSION = process.env.API_VERSION || '1.0.0';

/**
 * Versión mínima soportada (para retrocompatibilidad)
 */
// Define la versión mínima que la API aún soporta
// Versiones anteriores a esta no serán aceptadas para mantener compatibilidad
// Permite manejar deprecaciones y cambios que rompen compatibilidad
export const MIN_SUPPORTED_VERSION = '1.0.0';

/**
 * Versión máxima soportada
 */
// Define la versión máxima que la API acepta
// Versiones mayores a esta no están disponibles todavía
// Útil para controlar el acceso a versiones futuras que aún no están listas
export const MAX_SUPPORTED_VERSION = '2.0.0';

/**
 * Middleware para validar la versión de la API en el header
 * Formato esperado: X-API-Version: 1.0.0
 */
// Middleware exportado que valida y procesa la versión de la API solicitada por el cliente
// Permite que los clientes especifiquen qué versión de la API quieren usar
// Parámetros: req (request), res (response), next (función para continuar al siguiente middleware)
export const validarVersion = (req, res, next) => {
    // Obtiene la versión solicitada desde el header HTTP 'x-api-version' o desde el query parameter 'version'
    // El header es la forma preferida, el query parameter es un fallback para mayor flexibilidad
    // Los headers HTTP son case-insensitive, pero se usa lowercase por convención
    const versionHeader = req.headers['x-api-version'] || req.query.version;
    
    // Si no se especifica versión, usar la actual
    // Si el cliente no envía versión, asume que quiere la versión actual del servidor
    if (!versionHeader) {
        // Asigna la versión actual al request para que otros middlewares/controladores la puedan usar
        req.apiVersion = API_VERSION;
        // Continúa con el siguiente middleware sin validaciones adicionales
        return next();
    }
    
    // Validar formato semver
    // semver.valid() verifica que la versión tenga el formato correcto (MAJOR.MINOR.PATCH)
    // Retorna null si el formato es inválido, o la versión normalizada si es válida
    const versionValida = semver.valid(versionHeader);
    // Si el formato no es válido, retorna un error
    if (!versionValida) {
        // Retorna error 400 (Bad Request) indicando que el formato de versión es incorrecto
        return responderError(
            res,
            HTTP_STATUS.BAD_REQUEST,
            `Formato de versión inválido. Use semver (ej: 1.0.0). Versión recibida: ${versionHeader}`
        );
    }
    
    // Verificar que la versión esté en el rango soportado
    // semver.gte() verifica si la versión es mayor o igual (greater than or equal)
    // Comprueba que la versión solicitada sea al menos la versión mínima soportada
    const minValida = semver.gte(versionValida, MIN_SUPPORTED_VERSION);
    // semver.lt() verifica si la versión es menor (less than)
    // semver.eq() verifica si la versión es igual (equal)
    // La versión debe ser menor que la máxima O igual a la actual
    // Esto permite usar la versión actual incluso si está en el límite máximo
    const maxValida = semver.lt(versionValida, MAX_SUPPORTED_VERSION) || 
                      semver.eq(versionValida, API_VERSION);
    
    // Si la versión está fuera del rango soportado, retorna un error
    if (!minValida || !maxValida) {
        // Retorna error 400 indicando el rango de versiones soportadas
        return responderError(
            res,
            HTTP_STATUS.BAD_REQUEST,
            `Versión no soportada. Versión mínima: ${MIN_SUPPORTED_VERSION}, Versión máxima: ${MAX_SUPPORTED_VERSION}. Versión solicitada: ${versionValida}`
        );
    }
    
    // Validar que la versión mayor coincida (backward compatibility)
    // semver.major() extrae el número mayor (MAJOR) de la versión
    // La versión mayor indica cambios incompatibles (breaking changes)
    // Solo se permite usar versiones de la misma versión mayor para mantener compatibilidad
    const versionActualMajor = semver.major(API_VERSION);
    const versionSolicitadaMajor = semver.major(versionValida);
    
    // Si las versiones mayores no coinciden, son incompatibles
    if (versionSolicitadaMajor !== versionActualMajor) {
        // Retorna error 400 indicando que la versión mayor debe coincidir
        return responderError(
            res,
            HTTP_STATUS.BAD_REQUEST,
            `Versión incompatible. La versión mayor debe ser ${versionActualMajor}. Versión solicitada: ${versionValida}`
        );
    }
    
    // Si todas las validaciones pasan, asigna la versión validada al request
    // Esto permite que los controladores sepan qué versión está usando el cliente
    req.apiVersion = versionValida;
    // Continúa con el siguiente middleware o controlador
    next();
};

/**
 * Agregar headers de versión a las respuestas
 */
// Middleware exportado que agrega headers informativos sobre las versiones de la API
// Estos headers ayudan a los clientes a saber qué versiones están disponibles
// Parámetros: req (request), res (response), next (función para continuar al siguiente middleware)
export const agregarHeadersVersion = (req, res, next) => {
    // Agregar headers de versión a todas las respuestas
    // X-API-Version: Indica la versión actual que el servidor está ejecutando
    // Este header informa al cliente qué versión se está usando en la respuesta
    res.setHeader('X-API-Version', API_VERSION);
    // X-API-Min-Version: Indica la versión mínima soportada por el servidor
    // Útil para que los clientes sepan si necesitan actualizar su código
    res.setHeader('X-API-Min-Version', MIN_SUPPORTED_VERSION);
    // X-API-Max-Version: Indica la versión máxima soportada por el servidor
    // Útil para que los clientes sepan qué versiones pueden solicitar
    res.setHeader('X-API-Max-Version', MAX_SUPPORTED_VERSION);
    
    // Continúa con el siguiente middleware o controlador
    // Los headers ya están configurados y se enviarán con la respuesta
    next();
};

/**
 * Helper para verificar si una feature está disponible en una versión
 * @param {string} version - Versión a verificar
 * @param {string} minVersion - Versión mínima requerida
 * @returns {boolean}
 */
// Función helper exportada que verifica si una característica está disponible en una versión específica
// Útil para habilitar o deshabilitar funcionalidades basándose en la versión de la API
// Parámetros:
//   version: La versión actual que se está verificando (ej: '1.2.0')
//   minVersion: La versión mínima requerida para que la feature esté disponible (ej: '1.1.0')
// Retorna: true si la versión es mayor o igual a la versión mínima requerida, false en caso contrario
export function featureDisponible(version, minVersion) {
    // semver.gte() compara si la versión es mayor o igual a la versión mínima
    // Retorna true si la feature está disponible, false si no
    // Ejemplo: featureDisponible('1.2.0', '1.1.0') retorna true
    // Ejemplo: featureDisponible('1.0.0', '1.1.0') retorna false
    return semver.gte(version, minVersion);
}

