// Importa validationResult desde express-validator
// validationResult es una función que extrae los errores de validación acumulados por los validadores
// express-validator valida los datos de la solicitud (req.body, req.params, req.query) según reglas definidas
import { validationResult } from "express-validator";
// Importa la función responderError desde el módulo de helpers
// responderError es una utilidad para enviar respuestas de error de forma consistente
import { responderError } from '../utils/helpers.js';
// Importa constantes desde el módulo de constants
// HTTP_STATUS: códigos de estado HTTP (400, etc.)
// ERROR_MESSAGES: mensajes de error predefinidos y consistentes
import { HTTP_STATUS, ERROR_MESSAGES } from '../utils/constants.js';

/**
 * Middleware para validar los resultados de express-validator
 */
// Función middleware exportada que verifica si hay errores de validación
// Este middleware debe usarse después de los validadores de express-validator en las rutas
// Parámetros: req (request), res (response), next (función para continuar al siguiente middleware)
export function validacionMiddleware(req, res, next) {
    // Extrae los resultados de validación del objeto request
    // express-validator almacena los errores de validación en req durante la ejecución de los validadores
    // validationResult() recupera todos los errores encontrados
    const result = validationResult(req);
    // Verifica si hay errores de validación
    // isEmpty() retorna true si no hay errores, false si hay errores
    // Si !result.isEmpty() significa que hay errores y debe detenerse la ejecución
    if (!result.isEmpty()) {
        // Retorna un error 400 (Bad Request) con los detalles de validación
        // responderError envía la respuesta de error al cliente
        return responderError(
            res,
            // Código de estado HTTP 400 indica que la solicitud tiene datos inválidos
            HTTP_STATUS.BAD_REQUEST,
            // Mensaje de error general de validación
            ERROR_MESSAGES.VALIDATION_ERROR,
            // result.array() convierte los errores a un array con todos los detalles
            // Incluye qué campos fallaron y por qué, útil para que el cliente sepa qué corregir
            result.array()
        );
    }
    // Si no hay errores de validación, llama a next() para continuar con el siguiente middleware o controlador
    // next() es esencial en Express para pasar el control al siguiente handler en la cadena
    next();
}

// Mantener compatibilidad con nombre anterior
// Exporta la misma función con el nombre anterior (validationDTO) para no romper código existente
// Esto permite que el código que usa 'validationDTO' siga funcionando
// Es una práctica común al refactorizar mantener nombres antiguos como alias
export const validationDTO = validacionMiddleware;
