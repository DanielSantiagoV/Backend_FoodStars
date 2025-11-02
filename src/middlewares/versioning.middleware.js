import semver from 'semver';
import { responderError } from '../utils/helpers.js';
import { HTTP_STATUS } from '../utils/constants.js';

/**
 * Versión actual de la API
 * Sigue semver: MAJOR.MINOR.PATCH
 */
export const API_VERSION = process.env.API_VERSION || '1.0.0';

/**
 * Versión mínima soportada (para retrocompatibilidad)
 */
export const MIN_SUPPORTED_VERSION = '1.0.0';

/**
 * Versión máxima soportada
 */
export const MAX_SUPPORTED_VERSION = '2.0.0';

/**
 * Middleware para validar la versión de la API en el header
 * Formato esperado: X-API-Version: 1.0.0
 */
export const validarVersion = (req, res, next) => {
    const versionHeader = req.headers['x-api-version'] || req.query.version;
    
    if (!versionHeader) {
        // Si no se especifica versión, usar la actual
        req.apiVersion = API_VERSION;
        return next();
    }
    
    // Validar formato semver
    const versionValida = semver.valid(versionHeader);
    if (!versionValida) {
        return responderError(
            res,
            HTTP_STATUS.BAD_REQUEST,
            `Formato de versión inválido. Use semver (ej: 1.0.0). Versión recibida: ${versionHeader}`
        );
    }
    
    // Verificar que la versión esté en el rango soportado
    const minValida = semver.gte(versionValida, MIN_SUPPORTED_VERSION);
    const maxValida = semver.lt(versionValida, MAX_SUPPORTED_VERSION) || 
                      semver.eq(versionValida, API_VERSION);
    
    if (!minValida || !maxValida) {
        return responderError(
            res,
            HTTP_STATUS.BAD_REQUEST,
            `Versión no soportada. Versión mínima: ${MIN_SUPPORTED_VERSION}, Versión máxima: ${MAX_SUPPORTED_VERSION}. Versión solicitada: ${versionValida}`
        );
    }
    
    // Validar que la versión mayor coincida (backward compatibility)
    const versionActualMajor = semver.major(API_VERSION);
    const versionSolicitadaMajor = semver.major(versionValida);
    
    if (versionSolicitadaMajor !== versionActualMajor) {
        return responderError(
            res,
            HTTP_STATUS.BAD_REQUEST,
            `Versión incompatible. La versión mayor debe ser ${versionActualMajor}. Versión solicitada: ${versionValida}`
        );
    }
    
    req.apiVersion = versionValida;
    next();
};

/**
 * Agregar headers de versión a las respuestas
 */
export const agregarHeadersVersion = (req, res, next) => {
    // Agregar headers de versión a todas las respuestas
    res.setHeader('X-API-Version', API_VERSION);
    res.setHeader('X-API-Min-Version', MIN_SUPPORTED_VERSION);
    res.setHeader('X-API-Max-Version', MAX_SUPPORTED_VERSION);
    
    next();
};

/**
 * Helper para verificar si una feature está disponible en una versión
 * @param {string} version - Versión a verificar
 * @param {string} minVersion - Versión mínima requerida
 * @returns {boolean}
 */
export function featureDisponible(version, minVersion) {
    return semver.gte(version, minVersion);
}

