import { obtenerRestaurantes } from '../models/restaurante.model.js';
import { responderExito, responderError } from '../utils/helpers.js';
import { HTTP_STATUS } from '../utils/constants.js';

/**
 * Obtener ranking de restaurantes
 */
export const obtenerRanking = async (req, res) => {
    try {
        const { categoriaId, ordenarPor = 'ranking', orden = 'desc' } = req.query;
        const { limite = 50, saltar = 0 } = req.query;
        
        const filtros = {
            categoriaId,
            ordenarPor,
            orden,
            soloAprobados: true
        };
        
        const opciones = {
            limite: parseInt(limite),
            saltar: parseInt(saltar)
        };
        
        const restaurantes = await obtenerRestaurantes(filtros, opciones);
        return responderExito(res, HTTP_STATUS.OK, restaurantes);
    } catch (error) {
        return responderError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message);
    }
};

