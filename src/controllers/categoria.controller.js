import {
    crearCategoria,
    obtenerCategorias,
    buscarCategoriaPorId,
    actualizarCategoria,
    eliminarCategoria
} from '../models/categoria.model.js';
import { responderExito, responderError } from '../utils/helpers.js';
import { HTTP_STATUS, ERROR_MESSAGES } from '../utils/constants.js';

/**
 * Crear nueva categoría (solo admin)
 */
export const crear = async (req, res) => {
    try {
        const categoria = await crearCategoria(req.body);
        return responderExito(
            res,
            HTTP_STATUS.CREATED,
            categoria,
            'Categoría creada exitosamente'
        );
    } catch (error) {
        if (error.message.includes('ya existe')) {
            return responderError(res, HTTP_STATUS.CONFLICT, error.message);
        }
        return responderError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message);
    }
};

/**
 * Obtener todas las categorías
 */
export const obtenerTodas = async (req, res) => {
    try {
        const categorias = await obtenerCategorias();
        return responderExito(res, HTTP_STATUS.OK, categorias);
    } catch (error) {
        return responderError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message);
    }
};

/**
 * Obtener categoría por ID
 */
export const obtenerPorId = async (req, res) => {
    try {
        const { id } = req.params;
        const categoria = await buscarCategoriaPorId(id);
        
        if (!categoria) {
            return responderError(res, HTTP_STATUS.NOT_FOUND, 'Categoría no encontrada');
        }
        
        return responderExito(res, HTTP_STATUS.OK, categoria);
    } catch (error) {
        return responderError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message);
    }
};

/**
 * Actualizar categoría (solo admin)
 */
export const actualizar = async (req, res) => {
    try {
        const { id } = req.params;
        const categoria = await actualizarCategoria(id, req.body);
        
        if (!categoria) {
            return responderError(res, HTTP_STATUS.NOT_FOUND, 'Categoría no encontrada');
        }
        
        return responderExito(
            res,
            HTTP_STATUS.OK,
            categoria,
            'Categoría actualizada exitosamente'
        );
    } catch (error) {
        if (error.message.includes('ya existe')) {
            return responderError(res, HTTP_STATUS.CONFLICT, error.message);
        }
        if (error.message.includes('inválido') || error.message.includes('no encontrada')) {
            return responderError(res, HTTP_STATUS.BAD_REQUEST, error.message);
        }
        return responderError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message);
    }
};

/**
 * Eliminar categoría (solo admin)
 */
export const eliminar = async (req, res) => {
    try {
        const { id } = req.params;
        const eliminado = await eliminarCategoria(id);
        
        if (!eliminado) {
            return responderError(res, HTTP_STATUS.NOT_FOUND, 'Categoría no encontrada');
        }
        
        return responderExito(res, HTTP_STATUS.NO_CONTENT, null, 'Categoría eliminada exitosamente');
    } catch (error) {
        if (error.message.includes('asociados')) {
            return responderError(res, HTTP_STATUS.CONFLICT, error.message);
        }
        return responderError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message);
    }
};

