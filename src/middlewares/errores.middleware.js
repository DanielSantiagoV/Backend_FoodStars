// Importa la función responderError desde el módulo de helpers
// responderError es una utilidad para enviar respuestas de error de forma consistente
import { responderError } from '../utils/helpers.js';
// Importa constantes desde el módulo de constants
// HTTP_STATUS: códigos de estado HTTP (400, 404, 409, 500, etc.)
// ERROR_MESSAGES: mensajes de error predefinidos y consistentes
import { HTTP_STATUS, ERROR_MESSAGES } from '../utils/constants.js';

/**
 * Middleware centralizado para manejo de errores
 */
// Middleware exportado que captura y maneja todos los errores que ocurran en la aplicación
// Este middleware debe ser el ÚLTIMO middleware en la cadena de Express
// Parámetros especiales: err (error), req (request), res (response), next (función para continuar)
// Express detecta automáticamente que es un middleware de errores por tener 4 parámetros
export const manejoErrores = (err, req, res, next) => {
    // Registra el error en la consola para depuración y monitoreo
    // console.error permite ver los errores en los logs del servidor
    console.error('Error:', err);
    
    // Errores de validación
    // ValidationError es el nombre del error que lanzan librerías como Joi o express-validator
    // También verifica si el mensaje contiene la palabra 'validación' para capturar errores personalizados
    if (err.name === 'ValidationError' || err.message.includes('validación')) {
        // Retorna un error 400 (Bad Request) con el mensaje del error
        // 400 indica que la solicitud tiene datos inválidos o faltantes
        return responderError(res, HTTP_STATUS.BAD_REQUEST, err.message);
    }
    
    // Errores de duplicado (MongoDB unique index)
    // El código 11000 es el error específico que MongoDB retorna cuando se intenta insertar un valor duplicado
    // en un campo con índice único (por ejemplo, email duplicado)
    // También verifica si el mensaje contiene 'ya existe' para errores personalizados
    if (err.code === 11000 || err.message.includes('ya existe')) {
        // Retorna un error 409 (Conflict) indicando que el recurso ya existe
        // 409 es el código apropiado para conflictos de duplicados
        return responderError(res, HTTP_STATUS.CONFLICT, ERROR_MESSAGES.DUPLICATE_ENTRY);
    }
    
    // Errores de ObjectId inválido
    // Verifica si el error está relacionado con IDs inválidos de MongoDB
    // Esto ocurre cuando se intenta usar un string que no es un ObjectId válido
    if (err.message.includes('ID inválido') || err.message.includes('ObjectId')) {
        // Retorna un error 400 (Bad Request) indicando que el ID proporcionado no es válido
        return responderError(res, HTTP_STATUS.BAD_REQUEST, ERROR_MESSAGES.INVALID_ID);
    }
    
    // Errores de no encontrado
    // Verifica si el error indica que un recurso no fue encontrado
    // Estos errores suelen venir de controladores cuando buscan recursos que no existen
    if (err.message.includes('no encontrado') || err.message.includes('no existe')) {
        // Retorna un error 404 (Not Found) con el mensaje del error
        // 404 indica que el recurso solicitado no existe
        return responderError(res, HTTP_STATUS.NOT_FOUND, err.message);
    }
    
    // Error por defecto
    // Si el error no coincide con ninguna categoría específica, se maneja como error genérico
    // Usa el statusCode del error si está definido, sino usa 500 (Internal Server Error)
    // Usa el mensaje del error si está definido, sino usa el mensaje de error interno por defecto
    return responderError(
        res,
        // Si el error tiene una propiedad statusCode, la usa; sino usa 500
        err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR,
        // Si el error tiene un mensaje, lo usa; sino usa el mensaje de error interno por defecto
        err.message || ERROR_MESSAGES.INTERNAL_ERROR
    );
};

/**
 * Middleware para rutas no encontradas
 */
// Middleware exportado que maneja solicitudes a rutas que no existen en la aplicación
// Este middleware se debe usar al final de todas las rutas, antes del middleware de errores
// Parámetros: req (request), res (response)
// No tiene next porque es el final de la cadena de rutas
export const rutaNoEncontrada = (req, res) => {
    // Envía un error 404 (Not Found) indicando que la ruta no existe
    // Incluye el método HTTP (GET, POST, etc.) y la ruta solicitada en el mensaje
    // Esto ayuda a identificar qué ruta el cliente intentó acceder
    responderError(res, HTTP_STATUS.NOT_FOUND, `Ruta ${req.method} ${req.path} no encontrada`);
};

