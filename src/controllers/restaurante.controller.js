import {
    crearRestaurante,
    crearRestauranteConPlatos,
    obtenerRestaurantes,
    buscarRestaurantePorId,
    actualizarRestaurante,
    aprobarRestaurante,
    eliminarRestaurante
} from '../models/restaurante.model.js';
import { responderExito, responderError } from '../utils/helpers.js';
import { HTTP_STATUS, ERROR_MESSAGES } from '../utils/constants.js';

/**
 * Crear nuevo restaurante (requiere aprobación de admin)
 * Soporta crear restaurante con platos si se proporciona el array 'platos'
 */
export const crear = async (req, res) => {
    try {
        const { platos, ...restauranteData } = req.body;
        
        let resultado;
        
        // Si hay platos, crear restaurante con platos en transacción
        if (platos && Array.isArray(platos) && platos.length > 0) {
            resultado = await crearRestauranteConPlatos(restauranteData, platos);
            return responderExito(
                res,
                HTTP_STATUS.CREATED,
                {
                    restaurante: resultado.restaurante,
                    platos: resultado.platos,
                    totalPlatos: resultado.platos.length
                },
                `Restaurante creado exitosamente con ${resultado.platos.length} plato(s). Pendiente de aprobación por administrador`
            );
        } else {
            // Crear solo restaurante
            const restaurante = await crearRestaurante(restauranteData);
            return responderExito(
                res,
                HTTP_STATUS.CREATED,
                restaurante,
                'Restaurante creado exitosamente. Pendiente de aprobación por administrador'
            );
        }
    } catch (error) {
        if (error.message.includes('ya existe')) {
            return responderError(res, HTTP_STATUS.CONFLICT, error.message);
        }
        if (error.message.includes('no existe') || error.message.includes('inválido')) {
            return responderError(res, HTTP_STATUS.BAD_REQUEST, error.message);
        }
        return responderError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message);
    }
};

/**
 * Obtener restaurantes con filtros
 */
export const obtenerTodos = async (req, res) => {
    try {
        const { categoriaId, ordenarPor = 'ranking', orden = 'desc', soloAprobados = 'true' } = req.query;
        const { limite = 50, saltar = 0 } = req.query;
        
        const filtros = {
            categoriaId,
            ordenarPor,
            orden,
            soloAprobados: soloAprobados === 'true'
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

/**
 * Obtener restaurante por ID
 */
export const obtenerPorId = async (req, res) => {
    try {
        const { id } = req.params;
        const restaurante = await buscarRestaurantePorId(id);
        
        if (!restaurante) {
            return responderError(res, HTTP_STATUS.NOT_FOUND, 'Restaurante no encontrado');
        }
        
        return responderExito(res, HTTP_STATUS.OK, restaurante);
    } catch (error) {
        return responderError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message);
    }
};

/**
 * Actualizar restaurante
 */
export const actualizar = async (req, res) => {
    try {
        const { id } = req.params;
        const restaurante = await actualizarRestaurante(id, req.body);
        
        if (!restaurante) {
            return responderError(res, HTTP_STATUS.NOT_FOUND, 'Restaurante no encontrado');
        }
        
        return responderExito(
            res,
            HTTP_STATUS.OK,
            restaurante,
            'Restaurante actualizado exitosamente'
        );
    } catch (error) {
        if (error.message.includes('ya existe')) {
            return responderError(res, HTTP_STATUS.CONFLICT, error.message);
        }
        if (error.message.includes('inválido') || error.message.includes('no existe')) {
            return responderError(res, HTTP_STATUS.BAD_REQUEST, error.message);
        }
        return responderError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message);
    }
};

/**
 * Aprobar restaurante (solo admin)
 */
export const aprobar = async (req, res) => {
    try {
        const { id } = req.params;
        const restaurante = await aprobarRestaurante(id);
        
        if (!restaurante) {
            return responderError(res, HTTP_STATUS.NOT_FOUND, 'Restaurante no encontrado');
        }
        
        return responderExito(
            res,
            HTTP_STATUS.OK,
            restaurante,
            'Restaurante aprobado exitosamente'
        );
    } catch (error) {
        return responderError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message);
    }
};

/**
 * Eliminar restaurante
 */
export const eliminar = async (req, res) => {
    try {
        const { id } = req.params;
        const eliminado = await eliminarRestaurante(id);
        
        if (!eliminado) {
            return responderError(res, HTTP_STATUS.NOT_FOUND, 'Restaurante no encontrado');
        }
        
        return responderExito(res, HTTP_STATUS.NO_CONTENT, null, 'Restaurante eliminado exitosamente');
    } catch (error) {
        if (error.message.includes('asociados')) {
            return responderError(res, HTTP_STATUS.CONFLICT, error.message);
        }
        return responderError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message);
    }
};

