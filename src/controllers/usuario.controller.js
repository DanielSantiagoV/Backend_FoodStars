import jwt from 'jsonwebtoken';
import { crearUsuario, buscarUsuarioPorEmail, verificarPassword, obtenerPerfil, obtenerTodosLosUsuarios } from '../models/usuario.model.js';
import { responderExito, responderError } from '../utils/helpers.js';
import { HTTP_STATUS, ERROR_MESSAGES } from '../utils/constants.js';
import 'dotenv/config';

/**
 * Registro de nuevo usuario
 */
export const registrarUsuario = async (req, res) => {
    try {
        const { nombre, email, password } = req.body;
        
        const usuario = await crearUsuario({ nombre, email, password });
        
        // Generar token JWT
        const token = jwt.sign(
            { id: usuario._id.toString() },
            process.env.JWT_SECRET_KEY,
            { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
        );
        
        return responderExito(
            res,
            HTTP_STATUS.CREATED,
            { usuario, token },
            'Usuario registrado exitosamente'
        );
    } catch (error) {
        if (error.message.includes('ya está registrado')) {
            return responderError(res, HTTP_STATUS.CONFLICT, error.message);
        }
        return responderError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message);
    }
};

/**
 * Login de usuario
 */
export const loginUsuario = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Buscar usuario
        const usuario = await buscarUsuarioPorEmail(email);
        if (!usuario) {
            return responderError(res, HTTP_STATUS.UNAUTHORIZED, 'Credenciales inválidas');
        }
        
        // Verificar password
        const passwordValido = await verificarPassword(password, usuario.password);
        if (!passwordValido) {
            return responderError(res, HTTP_STATUS.UNAUTHORIZED, 'Credenciales inválidas');
        }
        
        // Generar token JWT
        const token = jwt.sign(
            { id: usuario._id.toString() },
            process.env.JWT_SECRET_KEY,
            { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
        );
        
        // Retornar usuario sin password
        const { password: _, ...usuarioSinPassword } = usuario;
        
        return responderExito(
            res,
            HTTP_STATUS.OK,
            { usuario: usuarioSinPassword, token },
            'Login exitoso'
        );
    } catch (error) {
        return responderError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message);
    }
};

/**
 * Obtener perfil del usuario autenticado
 */
export const obtenerMiPerfil = async (req, res) => {
    try {
        const usuarioId = req.usuario._id.toString();
        const usuario = await obtenerPerfil(usuarioId);
        
        if (!usuario) {
            return responderError(res, HTTP_STATUS.NOT_FOUND, 'Usuario no encontrado');
        }
        
        return responderExito(res, HTTP_STATUS.OK, usuario);
    } catch (error) {
        return responderError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message);
    }
};

/**
 * Obtener todos los usuarios (solo admin)
 */
export const obtenerTodos = async (req, res) => {
    try {
        const { limite = 100, saltar = 0 } = req.query;
        
        const opciones = {
            limite: parseInt(limite),
            saltar: parseInt(saltar)
        };
        
        // Validar límite
        if (opciones.limite > 100) {
            opciones.limite = 100;
        }
        
        const usuarios = await obtenerTodosLosUsuarios(opciones);
        
        return responderExito(res, HTTP_STATUS.OK, usuarios);
    } catch (error) {
        return responderError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message);
    }
};

