// Importa la función para obtener la conexión a la base de datos
import { obtenerBD } from '../config/db.js';
// Importa ObjectId de MongoDB para trabajar con IDs de documentos
import { ObjectId } from 'mongodb';
// Importa bcrypt para hashear y comparar contraseñas de forma segura
import bcrypt from 'bcrypt';
// Importa la constante ROLES que contiene los diferentes roles de usuario
import { ROLES } from '../utils/constants.js';

// Define el nombre de la colección de usuarios en MongoDB
const COLLECTION = 'usuarios';

/**
 * Crea un nuevo usuario
 * @param {object} usuarioData - Datos del usuario (nombre, email, password)
 * @returns {Promise<object>} - Usuario creado (sin password)
 */
export async function crearUsuario(usuarioData) {
    // Obtiene la instancia de la base de datos
    const db = obtenerBD();
    // Extrae los campos nombre, email y password del objeto usuarioData usando desestructuración
    const { nombre, email, password } = usuarioData;
    
    // Verificar si el email ya existe
    // Busca un documento en la colección de usuarios con el email proporcionado
    const usuarioExistente = await db.collection(COLLECTION).findOne({ email });
    // Si se encuentra un usuario con ese email, lanza un error para evitar duplicados
    if (usuarioExistente) {
        throw new Error('El email ya está registrado');
    }
    
    // Hashear password
    // Define el número de rondas de salt para el hashing (10 es un valor seguro y balanceado)
    const saltRounds = 10;
    // Hashea la contraseña en texto plano usando bcrypt con las rondas de salt definidas
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    // Crea un objeto con los datos del nuevo usuario
    const nuevoUsuario = {
        nombre, // Nombre del usuario
        email, // Email del usuario
        password: passwordHash, // Contraseña hasheada (no se guarda en texto plano)
        rol: ROLES.USUARIO, // Asigna el rol por defecto como usuario normal
        fechaCreacion: new Date(), // Fecha y hora actual de creación del registro
        fechaActualizacion: new Date() // Fecha y hora actual de actualización (igual a creación inicialmente)
    };
    
    // Inserta el nuevo usuario en la colección y obtiene el resultado de la operación
    const resultado = await db.collection(COLLECTION).insertOne(nuevoUsuario);
    
    // Retornar usuario sin password
    // Usa desestructuración para extraer password en una variable ignorada (_) y el resto en usuarioSinPassword
    const { password: _, ...usuarioSinPassword } = nuevoUsuario;
    // Retorna el usuario creado con el _id generado por MongoDB y sin incluir la contraseña
    return {
        _id: resultado.insertedId, // ID único generado por MongoDB al insertar el documento
        ...usuarioSinPassword // Todos los campos del usuario excepto la contraseña
    };
}

/**
 * Busca un usuario por email
 * @param {string} email - Email del usuario
 * @returns {Promise<object|null>} - Usuario encontrado o null
 */
export async function buscarUsuarioPorEmail(email) {
    // Obtiene la instancia de la base de datos
    const db = obtenerBD();
    // Busca y retorna el primer documento que coincida con el email proporcionado (o null si no existe)
    return await db.collection(COLLECTION).findOne({ email });
}

/**
 * Busca un usuario por ID
 * @param {string} id - ID del usuario
 * @returns {Promise<object|null>} - Usuario encontrado o null
 */
export async function buscarUsuarioPorId(id) {
    // Obtiene la instancia de la base de datos
    const db = obtenerBD();
    // Convierte el string id a ObjectId de MongoDB y busca el documento correspondiente
    // Retorna el usuario encontrado o null si no existe
    return await db.collection(COLLECTION).findOne({ _id: new ObjectId(id) });
}

/**
 * Verifica si el password coincide
 * @param {string} password - Password en texto plano
 * @param {string} hash - Password hasheado
 * @returns {Promise<boolean>} - True si coinciden
 */
export async function verificarPassword(password, hash) {
    // Compara la contraseña en texto plano con el hash almacenado usando bcrypt
    // Retorna true si coinciden, false en caso contrario
    return await bcrypt.compare(password, hash);
}

/**
 * Obtiene el perfil de un usuario (sin password)
 * @param {string} id - ID del usuario
 * @returns {Promise<object|null>} - Perfil del usuario
 */
export async function obtenerPerfil(id) {
    // Obtiene la instancia de la base de datos
    const db = obtenerBD();
    // Busca el usuario por su ID, excluyendo el campo password de la proyección
    // La proyección { password: 0 } indica que no se debe incluir el campo password en el resultado
    const usuario = await db.collection(COLLECTION).findOne(
        { _id: new ObjectId(id) }, // Criterio de búsqueda: convertir id a ObjectId
        { projection: { password: 0 } } // Opciones: excluir el campo password del resultado
    );
    // Retorna el usuario encontrado (o null si no existe) sin el campo password
    return usuario;
}

/**
 * Actualiza un usuario
 * @param {string} id - ID del usuario
 * @param {object} datosActualizacion - Datos a actualizar
 * @returns {Promise<object|null>} - Usuario actualizado
 */
export async function actualizarUsuario(id, datosActualizacion) {
    // Obtiene la instancia de la base de datos
    const db = obtenerBD();
    
    // Crea un objeto de actualización que incluye los datos proporcionados
    // y actualiza automáticamente la fecha de actualización
    const actualizacion = {
        ...datosActualizacion, // Esparce todos los campos que se quieren actualizar
        fechaActualizacion: new Date() // Actualiza la fecha de actualización a la fecha/hora actual
    };
    
    // Si se actualiza el password, hashearlo
    // Verifica si en los datos de actualización se incluye un nuevo password
    if (actualizacion.password) {
        // Define el número de rondas de salt para el hashing
        const saltRounds = 10;
        // Hashea el nuevo password antes de guardarlo en la base de datos
        actualizacion.password = await bcrypt.hash(actualizacion.password, saltRounds);
    }
    
    // Busca el documento por ID, lo actualiza y retorna el documento actualizado
    const resultado = await db.collection(COLLECTION).findOneAndUpdate(
        { _id: new ObjectId(id) }, // Criterio de búsqueda: convertir id a ObjectId
        { $set: actualizacion }, // Operador $set para actualizar los campos especificados
        { returnDocument: 'after', projection: { password: 0 } } // Opciones: retornar el documento después de actualizar y excluir password
    );
    
    // Retorna el resultado de la operación (el usuario actualizado o null si no se encontró)
    return resultado;
}

/**
 * Obtiene todos los usuarios con información de reseñas (para admin)
 * @param {object} opciones - Opciones de paginación
 * @returns {Promise<Array>} - Lista de usuarios con conteo de reseñas
 */
export async function obtenerTodosLosUsuarios(opciones = {}) {
    // Obtiene la instancia de la base de datos
    const db = obtenerBD();
    // Extrae los valores de límite y saltar de las opciones, con valores por defecto si no se proporcionan
    const { limite = 100, saltar = 0 } = opciones;
    
    // Obtener usuarios básicos primero
    // Busca todos los documentos en la colección de usuarios
    const usuarios = await db.collection(COLLECTION)
        .find({}, { projection: { password: 0 } }) // Busca todos los documentos, excluyendo el campo password
        .sort({ fechaCreacion: -1 }) // Ordena por fecha de creación de forma descendente (más recientes primero)
        .skip(saltar) // Salta los primeros N documentos (para paginación)
        .limit(limite) // Limita el número de documentos retornados (para paginación)
        .toArray(); // Convierte el cursor a un array de documentos
    
    // Contar reseñas para cada usuario
    // Usa Promise.all para ejecutar múltiples consultas de forma concurrente
    const usuariosConReseñas = await Promise.all(
        // Mapea cada usuario para agregarle información adicional
        usuarios.map(async (usuario) => {
            // Cuenta el número total de reseñas que tiene este usuario
            const totalReseñas = await db.collection('reseñas')
                .countDocuments({ usuarioId: usuario._id }); // Busca reseñas donde el usuarioId coincida con el _id del usuario
            
            // Retorna el usuario con la información adicional del total de reseñas
            return {
                ...usuario, // Esparce todos los campos del usuario original
                totalReseñas // Agrega el campo totalReseñas al objeto del usuario
            };
        })
    );
    
    // Retorna el array de usuarios con el conteo de reseñas incluido
    return usuariosConReseñas;
}


