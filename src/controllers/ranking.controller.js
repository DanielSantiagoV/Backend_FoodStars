// Importa la función del modelo de restaurantes
// obtenerRestaurantes obtiene restaurantes con filtros y paginación
import { obtenerRestaurantes } from '../models/restaurante.model.js';
// Importa funciones helper para enviar respuestas HTTP consistentes
// responderExito: envía respuestas exitosas con formato estándar
// responderError: envía respuestas de error con formato estándar
import { responderExito, responderError } from '../utils/helpers.js';
// Importa constantes desde el módulo de constants
// HTTP_STATUS: códigos de estado HTTP (200, 500, etc.)
import { HTTP_STATUS } from '../utils/constants.js';

/**
 * Obtener ranking de restaurantes
 */
// Controlador exportado que maneja la obtención del ranking de restaurantes
// Esta función se ejecuta cuando se recibe una petición GET para obtener el ranking
// El ranking muestra solo restaurantes aprobados ordenados por su calificación
// Parámetros: req (request con filtros en req.query), res (response para enviar la respuesta)
export const obtenerRanking = async (req, res) => {
    try {
        // Extrae los filtros desde la query string de la URL
        // categoriaId: ID opcional de categoría para filtrar (default undefined)
        // ordenarPor: campo por el cual ordenar (default 'ranking')
        // orden: dirección del ordenamiento 'desc' o 'asc' (default 'desc')
        const { categoriaId, ordenarPor = 'ranking', orden = 'desc' } = req.query;
        // Extrae las opciones de paginación desde la query string
        // limite: número máximo de resultados (default 50)
        // saltar: número de resultados a omitir para paginación (default 0)
        const { limite = 50, saltar = 0 } = req.query;
        
        // Construye el objeto de filtros
        const filtros = {
            categoriaId,  // ID de categoría para filtrar
            ordenarPor,  // Campo por el cual ordenar (normalmente 'ranking')
            orden,  // Dirección del ordenamiento
            soloAprobados: true  // Siempre muestra solo restaurantes aprobados en el ranking
        };
        
        // Construye el objeto de opciones de paginación
        const opciones = {
            limite: parseInt(limite),  // Convierte el string a número entero
            saltar: parseInt(saltar)  // Convierte el string a número entero
        };
        
        // Llama a la función del modelo para obtener los restaurantes del ranking
        // Los restaurantes se ordenan por su calificación promedio (ranking)
        const restaurantes = await obtenerRestaurantes(filtros, opciones);
        // Retorna una respuesta exitosa con código 200 (OK) y la lista de restaurantes del ranking
        return responderExito(res, HTTP_STATUS.OK, restaurantes);
    } catch (error) {
        // Si ocurre un error, retorna error 500 (Internal Server Error)
        return responderError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message);
    }
};

