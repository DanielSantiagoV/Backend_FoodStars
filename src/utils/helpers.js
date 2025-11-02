import { ObjectId } from 'mongodb';
import { ERROR_MESSAGES, HTTP_STATUS } from './constants.js';

/**
 * Valida si un string es un ObjectId válido de MongoDB
 * @param {string} id - El ID a validar
 * @returns {boolean} - True si es válido, false si no
 */
export function esObjectIdValido(id) {
    if (!id || typeof id !== 'string') {
        return false;
    }
    return ObjectId.isValid(id);
}

/**
 * Valida y convierte un string a ObjectId
 * @param {string} id - El ID a convertir
 * @returns {ObjectId} - El ObjectId válido
 * @throws {Error} - Si el ID no es válido
 */
export function convertirAObjectId(id) {
    if (!esObjectIdValido(id)) {
        throw new Error(ERROR_MESSAGES.INVALID_ID);
    }
    return new ObjectId(id);
}

/**
 * Formatea una respuesta de éxito
 * @param {object} res - Objeto response de Express
 * @param {number} statusCode - Código de estado HTTP
 * @param {any} data - Datos a enviar
 * @param {string} message - Mensaje opcional
 * @param {object} metadata - Metadata adicional (paginación, etc.)
 */
export function responderExito(res, statusCode = HTTP_STATUS.OK, data = null, message = null, metadata = null) {
    const respuesta = {
        success: true,
        ...(message && { message }),
        ...(data && { data }),
        ...(metadata && metadata)
    };
    return res.status(statusCode).json(respuesta);
}

/**
 * Formatea una respuesta de error
 * @param {object} res - Objeto response de Express
 * @param {number} statusCode - Código de estado HTTP
 * @param {string} message - Mensaje de error
 * @param {any} errors - Errores adicionales (opcional)
 */
export function responderError(res, statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR, message, errors = null) {
    const respuesta = {
        success: false,
        message,
        ...(errors && { errors })
    };
    return res.status(statusCode).json(respuesta);
}

/**
 * Calcula el promedio de un array de números
 * @param {number[]} numeros - Array de números
 * @returns {number} - El promedio, o 0 si el array está vacío
 */
export function calcularPromedio(numeros) {
    if (!numeros || numeros.length === 0) {
        return 0;
    }
    const suma = numeros.reduce((acc, num) => acc + num, 0);
    return suma / numeros.length;
}

/**
 * Calcula el ratio de likes (likes / total de interacciones)
 * @param {number} likes - Número de likes
 * @param {number} dislikes - Número de dislikes
 * @returns {number} - Ratio entre 0 y 1
 */
export function calcularRatioLikes(likes = 0, dislikes = 0) {
    const total = likes + dislikes;
    if (total === 0) {
        return 0.5; // Valor neutral si no hay interacciones
    }
    return likes / total;
}

/**
 * Calcula el score de recencia basado en la fecha de la última reseña
 * @param {Date} fechaUltimaReseña - Fecha de la última reseña
 * @returns {number} - Score entre 0 y 1 (1 = muy reciente, 0 = muy antiguo)
 */
export function calcularScoreRecencia(fechaUltimaReseña) {
    if (!fechaUltimaReseña) {
        return 0;
    }
    
    const ahora = new Date();
    const fecha = new Date(fechaUltimaReseña);
    const diasDiferencia = (ahora - fecha) / (1000 * 60 * 60 * 24); // Diferencia en días
    
    // Si es muy reciente (últimos 7 días), score alto
    if (diasDiferencia <= 7) {
        return 1;
    }
    // Si es reciente (últimos 30 días), score medio-alto
    if (diasDiferencia <= 30) {
        return 0.8;
    }
    // Si es moderadamente reciente (últimos 90 días), score medio
    if (diasDiferencia <= 90) {
        return 0.5;
    }
    // Si es antiguo, score bajo
    return Math.max(0, 1 - (diasDiferencia / 365)); // Decae gradualmente
}

/**
 * Sanitiza un string para búsqueda (remueve acentos, convierte a minúsculas)
 * @param {string} texto - Texto a sanitizar
 * @returns {string} - Texto sanitizado
 */
export function sanitizarParaBusqueda(texto) {
    if (!texto || typeof texto !== 'string') {
        return '';
    }
    return texto
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();
}

/**
 * Valida un email
 * @param {string} email - Email a validar
 * @returns {boolean} - True si es válido
 */
export function esEmailValido(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

