// Importa ObjectId de MongoDB para trabajar con identificadores únicos
import { ObjectId } from 'mongodb';
// Importa constantes de errores y códigos HTTP desde el archivo de constantes
import { ERROR_MESSAGES, HTTP_STATUS } from './constants.js';

/**
 * Valida si un string es un ObjectId válido de MongoDB
 * @param {string} id - El ID a validar
 * @returns {boolean} - True si es válido, false si no
 */
// Función que verifica si un string tiene el formato correcto de ObjectId de MongoDB
export function esObjectIdValido(id) {
    // Verifica que el ID exista y sea de tipo string
    // Si no es string o es null/undefined, retorna false
    if (!id || typeof id !== 'string') {
        return false;
    }
    // Usa el método isValid de MongoDB para verificar el formato del ObjectId
    // Un ObjectId válido tiene 24 caracteres hexadecimales
    return ObjectId.isValid(id);
}

/**
 * Valida y convierte un string a ObjectId
 * @param {string} id - El ID a convertir
 * @returns {ObjectId} - El ObjectId válido
 * @throws {Error} - Si el ID no es válido
 */
// Función que convierte un string a ObjectId de MongoDB, validándolo primero
export function convertirAObjectId(id) {
    // Valida el ID antes de convertirlo
    if (!esObjectIdValido(id)) {
        // Si no es válido, lanza un error con el mensaje estandarizado
        throw new Error(ERROR_MESSAGES.INVALID_ID);
    }
    // Crea y retorna un nuevo ObjectId a partir del string
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
// Función helper para formatear respuestas exitosas de manera consistente
// Todas las respuestas exitosas siguen el mismo formato estándar
export function responderExito(res, statusCode = HTTP_STATUS.OK, data = null, message = null, metadata = null) {
    // Construye el objeto de respuesta con estructura estándar
    const respuesta = {
        success: true,  // Indica que la operación fue exitosa
        // Usa spread operator para incluir propiedades solo si tienen valor
        ...(message && { message }),  // Incluye mensaje solo si se proporciona
        ...(data && { data }),  // Incluye datos solo si se proporcionan
        ...(metadata && metadata)  // Incluye metadata (paginación, etc.) si se proporciona
    };
    // Retorna la respuesta con el código de estado HTTP correspondiente
    return res.status(statusCode).json(respuesta);
}

/**
 * Formatea una respuesta de error
 * @param {object} res - Objeto response de Express
 * @param {number} statusCode - Código de estado HTTP
 * @param {string} message - Mensaje de error
 * @param {any} errors - Errores adicionales (opcional)
 */
// Función helper para formatear respuestas de error de manera consistente
// Todas las respuestas de error siguen el mismo formato estándar
export function responderError(res, statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR, message, errors = null) {
    // Construye el objeto de respuesta de error con estructura estándar
    const respuesta = {
        success: false,  // Indica que la operación falló
        message,  // Mensaje de error (siempre incluido)
        // Usa spread operator para incluir errores adicionales solo si se proporcionan
        ...(errors && { errors })  // Incluye detalles de errores (validación, etc.) si se proporcionan
    };
    // Retorna la respuesta de error con el código de estado HTTP correspondiente
    return res.status(statusCode).json(respuesta);
}

/**
 * Calcula el promedio de un array de números
 * @param {number[]} numeros - Array de números
 * @returns {number} - El promedio, o 0 si el array está vacío
 */
// Función que calcula el promedio aritmético de un array de números
// Útil para calcular promedios de calificaciones
export function calcularPromedio(numeros) {
    // Verifica que el array exista y tenga elementos
    if (!numeros || numeros.length === 0) {
        // Retorna 0 si el array está vacío o no existe
        return 0;
    }
    // Suma todos los números del array usando reduce
    const suma = numeros.reduce((acc, num) => acc + num, 0);
    // Divide la suma por el total de elementos para obtener el promedio
    return suma / numeros.length;
}

/**
 * Calcula el ratio de likes (likes / total de interacciones)
 * @param {number} likes - Número de likes
 * @param {number} dislikes - Número de dislikes
 * @returns {number} - Ratio entre 0 y 1
 */
// Función que calcula qué porcentaje de interacciones son likes
// Se usa en el cálculo del ranking de restaurantes
export function calcularRatioLikes(likes = 0, dislikes = 0) {
    // Suma total de interacciones (likes + dislikes)
    const total = likes + dislikes;
    // Si no hay interacciones, retorna un valor neutral (0.5 = 50%)
    // Esto evita dividir por cero y da un score neutral
    if (total === 0) {
        return 0.5; // Valor neutral si no hay interacciones
    }
    // Calcula el ratio: likes dividido por el total de interacciones
    // Resultado entre 0 (todos dislikes) y 1 (todos likes)
    return likes / total;
}

/**
 * Calcula el score de recencia basado en la fecha de la última reseña
 * @param {Date} fechaUltimaReseña - Fecha de la última reseña
 * @returns {number} - Score entre 0 y 1 (1 = muy reciente, 0 = muy antiguo)
 */
// Función que calcula un score basado en qué tan reciente es la última reseña
// Se usa en el cálculo del ranking de restaurantes
// Los restaurantes con reseñas más recientes reciben un score más alto
export function calcularScoreRecencia(fechaUltimaReseña) {
    // Si no hay fecha de última reseña, retorna 0 (score bajo)
    if (!fechaUltimaReseña) {
        return 0;
    }
    
    // Obtiene la fecha/hora actual
    const ahora = new Date();
    // Convierte la fecha de última reseña a objeto Date
    const fecha = new Date(fechaUltimaReseña);
    // Calcula la diferencia en días
    // (ahora - fecha) da milisegundos, se divide por milisegundos en un día
    const diasDiferencia = (ahora - fecha) / (1000 * 60 * 60 * 24); // Diferencia en días
    
    // Si es muy reciente (últimos 7 días), score máximo (1.0)
    // Las reseñas muy recientes indican que el restaurante está activo
    if (diasDiferencia <= 7) {
        return 1;
    }
    // Si es reciente (últimos 30 días), score medio-alto (0.8)
    if (diasDiferencia <= 30) {
        return 0.8;
    }
    // Si es moderadamente reciente (últimos 90 días), score medio (0.5)
    if (diasDiferencia <= 90) {
        return 0.5;
    }
    // Si es antiguo (más de 90 días), score bajo que decae gradualmente
    // Usa una función lineal que llega a 0 después de aproximadamente 1 año
    return Math.max(0, 1 - (diasDiferencia / 365)); // Decae gradualmente
}

/**
 * Sanitiza un string para búsqueda (remueve acentos, convierte a minúsculas)
 * @param {string} texto - Texto a sanitizar
 * @returns {string} - Texto sanitizado
 */
// Función que normaliza un texto para búsquedas sin distinción de mayúsculas/acentos
// Útil para búsquedas de texto que ignoran acentos y mayúsculas
export function sanitizarParaBusqueda(texto) {
    // Verifica que el texto exista y sea de tipo string
    if (!texto || typeof texto !== 'string') {
        // Retorna string vacío si no es válido
        return '';
    }
    return texto
        .toLowerCase()  // Convierte todo a minúsculas
        // Normaliza los caracteres Unicode a su forma descompuesta (NFD)
        // Esto separa los caracteres base de sus acentos/marcas diacríticas
        .normalize('NFD')
        // Elimina todos los caracteres de acento (range Unicode \u0300-\u036f)
        // Esto remueve tildes, diéresis, etc., dejando solo el carácter base
        .replace(/[\u0300-\u036f]/g, '')
        .trim();  // Elimina espacios en blanco al inicio y final
}

/**
 * Valida un email
 * @param {string} email - Email a validar
 * @returns {boolean} - True si es válido
 */
// Función que valida si un string tiene el formato correcto de un email
// Usa una expresión regular para verificar el formato básico de email
export function esEmailValido(email) {
    // Expresión regular que valida formato de email:
    // ^[^\s@]+  - Uno o más caracteres que no sean espacios ni @ (nombre de usuario)
    // @  - El símbolo @
    // [^\s@]+  - Uno o más caracteres que no sean espacios ni @ (dominio)
    // \.  - Un punto literal
    // [^\s@]+$  - Uno o más caracteres que no sean espacios ni @ (extensión), hasta el final
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    // Retorna true si el email coincide con el patrón, false en caso contrario
    return regex.test(email);
}

