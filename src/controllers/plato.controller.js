import {
    crearPlato,
    obtenerPlatosPorRestaurante,
    buscarPlatoPorId,
    actualizarPlato,
    eliminarPlato
} from '../models/plato.model.js';
import { responderExito, responderError } from '../utils/helpers.js';
import { HTTP_STATUS } from '../utils/constants.js';

/**
 * Crear nuevo plato
 */
export const crear = async (req, res) => {
    try {
        const plato = await crearPlato(req.body);
        return responderExito(
            res,
            HTTP_STATUS.CREATED,
            plato,
            'Plato creado exitosamente'
        );
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
 * Obtener platos de un restaurante
 */
export const obtenerPorRestaurante = async (req, res) => {
    try {
        const { restauranteId } = req.params;
        const platos = await obtenerPlatosPorRestaurante(restauranteId);
        return responderExito(res, HTTP_STATUS.OK, platos);
    } catch (error) {
        if (error.message.includes('inválido')) {
            return responderError(res, HTTP_STATUS.BAD_REQUEST, error.message);
        }
        return responderError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message);
    }
};

/**
 * Obtener plato por ID
 */
export const obtenerPorId = async (req, res) => {
    try {
        const { id } = req.params;
        const plato = await buscarPlatoPorId(id);
        
        if (!plato) {
            return responderError(res, HTTP_STATUS.NOT_FOUND, 'Plato no encontrado');
        }
        
        return responderExito(res, HTTP_STATUS.OK, plato);
    } catch (error) {
        return responderError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message);
    }
};

/**
 * Actualizar plato
 */
export const actualizar = async (req, res) => {
    try {
        const { id } = req.params;
        const plato = await actualizarPlato(id, req.body);
        
        if (!plato) {
            return responderError(res, HTTP_STATUS.NOT_FOUND, 'Plato no encontrado');
        }
        
        return responderExito(
            res,
            HTTP_STATUS.OK,
            plato,
            'Plato actualizado exitosamente'
        );
    } catch (error) {
        if (error.message.includes('ya existe')) {
            return responderError(res, HTTP_STATUS.CONFLICT, error.message);
        }
        if (error.message.includes('inválido') || error.message.includes('no encontrado')) {
            return responderError(res, HTTP_STATUS.BAD_REQUEST, error.message);
        }
        return responderError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message);
    }
};

/**
 * Eliminar plato
 */
export const eliminar = async (req, res) => {
    try {
        const { id } = req.params;
        const eliminado = await eliminarPlato(id);
        
        if (!eliminado) {
            return responderError(res, HTTP_STATUS.NOT_FOUND, 'Plato no encontrado');
        }
        
        return responderExito(res, HTTP_STATUS.NO_CONTENT, null, 'Plato eliminado exitosamente');
    } catch (error) {
        return responderError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message);
    }
};

