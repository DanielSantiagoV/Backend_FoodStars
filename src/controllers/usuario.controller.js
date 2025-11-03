// Importa jwt (JSON Web Token) para generar tokens de autenticación
// Los tokens JWT permiten que los usuarios se autentiquen sin enviar credenciales en cada petición
import jwt from 'jsonwebtoken';
// Importa las funciones del modelo de usuarios
// Estas funciones manejan las operaciones con usuarios en la base de datos
import { crearUsuario, buscarUsuarioPorEmail, verificarPassword, obtenerPerfil, obtenerTodosLosUsuarios } from '../models/usuario.model.js';
// Importa funciones helper para enviar respuestas HTTP consistentes
// responderExito: envía respuestas exitosas con formato estándar
// responderError: envía respuestas de error con formato estándar
import { responderExito, responderError } from '../utils/helpers.js';
// Importa constantes desde el módulo de constants
// HTTP_STATUS: códigos de estado HTTP (200, 201, 404, etc.)
// ERROR_MESSAGES: mensajes de error predefinidos y consistentes
import { HTTP_STATUS, ERROR_MESSAGES } from '../utils/constants.js';
// Importa y configura dotenv para cargar variables de entorno desde el archivo .env
// Esto permite acceder a process.env.JWT_SECRET_KEY y process.env.JWT_EXPIRES_IN
import 'dotenv/config';

/**
 * Registro de nuevo usuario
 */
// Controlador exportado que maneja el registro de un nuevo usuario
// Esta función se ejecuta cuando se recibe una petición POST para registrar un usuario
// Parámetros: req (request con nombre, email, password en req.body), res (response para enviar la respuesta)
export const registrarUsuario = async (req, res) => {
    try {
        // Extrae los datos del usuario del cuerpo de la petición usando destructuring
        const { nombre, email, password } = req.body;
        
        // Llama a la función del modelo para crear el usuario
        // El modelo hashea el password y valida que el email no esté duplicado
        const usuario = await crearUsuario({ nombre, email, password });
        
        // Generar token JWT
        // jwt.sign() crea un token JWT que identifica al usuario
        // Este token se envía al cliente y debe incluirse en las peticiones autenticadas
        const token = jwt.sign(
            { id: usuario._id.toString() },  // Payload: datos que se guardan en el token (ID del usuario)
            process.env.JWT_SECRET_KEY,  // Clave secreta para firmar el token (desde .env)
            { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }  // Tiempo de expiración del token (default 24 horas)
        );
        
        // Retorna una respuesta exitosa con código 201 (CREATED)
        // Incluye el usuario (sin password) y el token para que el cliente pueda autenticarse inmediatamente
        return responderExito(
            res,
            HTTP_STATUS.CREATED,  // Código 201: recurso creado exitosamente
            { usuario, token },  // Datos del usuario y token JWT
            'Usuario registrado exitosamente'  // Mensaje de confirmación
        );
    } catch (error) {
        // Maneja errores específicos
        // Si el error indica que el email ya está registrado
        if (error.message.includes('ya está registrado')) {
            // Retorna error 409 (Conflict) para indicar duplicado
            return responderError(res, HTTP_STATUS.CONFLICT, error.message);
        }
        // Para cualquier otro error, retorna error 500 (Internal Server Error)
        return responderError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message);
    }
};

/**
 * Login de usuario
 */
// Controlador exportado que maneja el inicio de sesión de un usuario
// Esta función se ejecuta cuando se recibe una petición POST para hacer login
// Parámetros: req (request con email y password en req.body), res (response para enviar la respuesta)
export const loginUsuario = async (req, res) => {
    try {
        // Extrae el email y password del cuerpo de la petición
        const { email, password } = req.body;
        
        // Buscar usuario
        // Busca el usuario en la base de datos por su email
        const usuario = await buscarUsuarioPorEmail(email);
        // Si no se encuentra el usuario, retorna error de autenticación
        // No se especifica si es el email o password incorrecto por seguridad (evita enumeración de usuarios)
        if (!usuario) {
            return responderError(res, HTTP_STATUS.UNAUTHORIZED, 'Credenciales inválidas');
        }
        
        // Verificar password
        // Compara la contraseña proporcionada con el hash almacenado en la base de datos
        // verificarPassword usa bcrypt para comparar de forma segura
        const passwordValido = await verificarPassword(password, usuario.password);
        // Si la contraseña no coincide, retorna error de autenticación
        if (!passwordValido) {
            return responderError(res, HTTP_STATUS.UNAUTHORIZED, 'Credenciales inválidas');
        }
        
        // Generar token JWT
        // Si las credenciales son correctas, genera un token JWT para el usuario
        const token = jwt.sign(
            { id: usuario._id.toString() },  // Payload: ID del usuario
            process.env.JWT_SECRET_KEY,  // Clave secreta para firmar el token
            { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }  // Tiempo de expiración
        );
        
        // Retornar usuario sin password
        // Usa destructuring para separar password del resto de propiedades
        // password: _ asigna el password a una variable anónima que se ignora
        // ...usuarioSinPassword incluye todas las demás propiedades excepto password
        const { password: _, ...usuarioSinPassword } = usuario;
        
        // Retorna una respuesta exitosa con código 200 (OK)
        // Incluye el usuario (sin password) y el token JWT
        return responderExito(
            res,
            HTTP_STATUS.OK,
            { usuario: usuarioSinPassword, token },  // Usuario sin password y token JWT
            'Login exitoso'  // Mensaje de confirmación
        );
    } catch (error) {
        // Si ocurre un error, retorna error 500 (Internal Server Error)
        return responderError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message);
    }
};

/**
 * Obtener perfil del usuario autenticado
 */
// Controlador exportado que maneja la obtención del perfil del usuario autenticado
// Esta función se ejecuta cuando un usuario autenticado quiere ver su propio perfil
// Parámetros: req (request con usuario autenticado en req.usuario), res (response para enviar la respuesta)
export const obtenerMiPerfil = async (req, res) => {
    try {
        // Obtiene el ID del usuario desde req.usuario (establecido por el middleware de autenticación)
        // req.usuario contiene los datos del usuario extraídos del token JWT
        const usuarioId = req.usuario._id.toString();
        // Llama a la función del modelo para obtener el perfil sin password
        const usuario = await obtenerPerfil(usuarioId);
        
        // Si no se encontró el usuario, retorna error 404 (Not Found)
        // Esto puede ocurrir si el usuario fue eliminado después de autenticarse
        if (!usuario) {
            return responderError(res, HTTP_STATUS.NOT_FOUND, 'Usuario no encontrado');
        }
        
        // Retorna una respuesta exitosa con código 200 (OK) y los datos del perfil
        return responderExito(res, HTTP_STATUS.OK, usuario);
    } catch (error) {
        // Si ocurre un error, retorna error 500 (Internal Server Error)
        return responderError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message);
    }
};

/**
 * Obtener todos los usuarios (solo admin)
 */
// Controlador exportado que maneja la obtención de todos los usuarios del sistema (solo administradores)
// Esta función se ejecuta cuando un administrador quiere ver la lista de usuarios
// Parámetros: req (request con opciones de paginación en req.query), res (response para enviar la respuesta)
export const obtenerTodos = async (req, res) => {
    try {
        // Extrae los parámetros de paginación desde la query string de la URL
        // limite: número máximo de resultados a retornar (default 100)
        // saltar: número de resultados a omitir para paginación (default 0)
        const { limite = 100, saltar = 0 } = req.query;
        
        // Prepara las opciones de paginación convirtiendo strings a números
        const opciones = {
            limite: parseInt(limite),  // Convierte el string a número entero
            saltar: parseInt(saltar)  // Convierte el string a número entero
        };
        
        // Validar límite
        // Limita el número máximo de resultados a 100 para evitar sobrecarga
        // Esto previene que un administrador solicite demasiados usuarios de una vez
        if (opciones.limite > 100) {
            opciones.limite = 100;
        }
        
        // Llama a la función del modelo para obtener todos los usuarios con paginación
        const usuarios = await obtenerTodosLosUsuarios(opciones);
        
        // Retorna una respuesta exitosa con código 200 (OK) y la lista de usuarios (sin passwords)
        return responderExito(res, HTTP_STATUS.OK, usuarios);
    } catch (error) {
        // Si ocurre un error, retorna error 500 (Internal Server Error)
        return responderError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message);
    }
};

