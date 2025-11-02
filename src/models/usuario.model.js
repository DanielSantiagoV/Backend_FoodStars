import { obtenerBD } from '../config/db.js';
import { ObjectId } from 'mongodb';
import bcrypt from 'bcrypt';
import { ROLES } from '../utils/constants.js';

const COLLECTION = 'usuarios';

/**
 * Crea un nuevo usuario
 * @param {object} usuarioData - Datos del usuario (nombre, email, password)
 * @returns {Promise<object>} - Usuario creado (sin password)
 */
export async function crearUsuario(usuarioData) {
    const db = obtenerBD();
    const { nombre, email, password } = usuarioData;
    
    // Verificar si el email ya existe
    const usuarioExistente = await db.collection(COLLECTION).findOne({ email });
    if (usuarioExistente) {
        throw new Error('El email ya está registrado');
    }
    
    // Hashear password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    const nuevoUsuario = {
        nombre,
        email,
        password: passwordHash,
        rol: ROLES.USUARIO,
        fechaCreacion: new Date(),
        fechaActualizacion: new Date()
    };
    
    const resultado = await db.collection(COLLECTION).insertOne(nuevoUsuario);
    
    // Retornar usuario sin password
    const { password: _, ...usuarioSinPassword } = nuevoUsuario;
    return {
        _id: resultado.insertedId,
        ...usuarioSinPassword
    };
}

/**
 * Busca un usuario por email
 * @param {string} email - Email del usuario
 * @returns {Promise<object|null>} - Usuario encontrado o null
 */
export async function buscarUsuarioPorEmail(email) {
    const db = obtenerBD();
    return await db.collection(COLLECTION).findOne({ email });
}

/**
 * Busca un usuario por ID
 * @param {string} id - ID del usuario
 * @returns {Promise<object|null>} - Usuario encontrado o null
 */
export async function buscarUsuarioPorId(id) {
    const db = obtenerBD();
    return await db.collection(COLLECTION).findOne({ _id: new ObjectId(id) });
}

/**
 * Verifica si el password coincide
 * @param {string} password - Password en texto plano
 * @param {string} hash - Password hasheado
 * @returns {Promise<boolean>} - True si coinciden
 */
export async function verificarPassword(password, hash) {
    return await bcrypt.compare(password, hash);
}

/**
 * Obtiene el perfil de un usuario (sin password)
 * @param {string} id - ID del usuario
 * @returns {Promise<object|null>} - Perfil del usuario
 */
export async function obtenerPerfil(id) {
    const db = obtenerBD();
    const usuario = await db.collection(COLLECTION).findOne(
        { _id: new ObjectId(id) },
        { projection: { password: 0 } }
    );
    return usuario;
}

/**
 * Actualiza un usuario
 * @param {string} id - ID del usuario
 * @param {object} datosActualizacion - Datos a actualizar
 * @returns {Promise<object|null>} - Usuario actualizado
 */
export async function actualizarUsuario(id, datosActualizacion) {
    const db = obtenerBD();
    
    const actualizacion = {
        ...datosActualizacion,
        fechaActualizacion: new Date()
    };
    
    // Si se actualiza el password, hashearlo
    if (actualizacion.password) {
        const saltRounds = 10;
        actualizacion.password = await bcrypt.hash(actualizacion.password, saltRounds);
    }
    
    const resultado = await db.collection(COLLECTION).findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: actualizacion },
        { returnDocument: 'after', projection: { password: 0 } }
    );
    
    return resultado;
}

/**
 * Obtiene todos los usuarios con información de reseñas (para admin)
 * @param {object} opciones - Opciones de paginación
 * @returns {Promise<Array>} - Lista de usuarios con conteo de reseñas
 */
export async function obtenerTodosLosUsuarios(opciones = {}) {
    const db = obtenerBD();
    const { limite = 100, saltar = 0 } = opciones;
    
    // Obtener usuarios con agregación para contar reseñas
    const usuarios = await db.collection(COLLECTION)
        .aggregate([
            {
                $lookup: {
                    from: 'reseñas',
                    localField: '_id',
                    foreignField: 'usuarioId',
                    as: 'reseñas'
                }
            },
            {
                $project: {
                    password: 0,
                    totalReseñas: { $size: '$reseñas' },
                    nombre: 1,
                    email: 1,
                    rol: 1,
                    fechaCreacion: 1,
                    fechaRegistro: '$fechaCreacion'
                }
            },
            { $skip: saltar },
            { $limit: limite },
            { $sort: { fechaCreacion: -1 } }
        ])
        .toArray();
    
    return usuarios;
}

