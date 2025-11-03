// Importa passport, el middleware de autenticación más popular para Node.js
// Passport proporciona una manera simple y modular de manejar autenticación
import passport from 'passport';
// Importa ExtractJwt y JwtStrategy desde passport-jwt
// ExtractJwt: utilidades para extraer el token JWT de las solicitudes
// JwtStrategy: estrategia de autenticación basada en tokens JWT (JSON Web Tokens)
import { ExtractJwt, Strategy as JwtStrategy } from 'passport-jwt';
// Importa dotenv para acceder a las variables de entorno desde el archivo .env
import dotenv from "dotenv";
// Importa la función obtenerBD desde el módulo de configuración de base de datos
// Esta función retorna la referencia a la base de datos MongoDB
import { obtenerBD } from './db.js';
// Importa ObjectId desde mongodb para convertir strings a ObjectId de MongoDB
// Necesario porque MongoDB usa ObjectId como tipo de dato para los _id
import { ObjectId } from 'mongodb';

// Configura dotenv para cargar las variables de entorno desde el archivo .env
// Esto permite acceder a process.env.JWT_SECRET_KEY
dotenv.config();

// Configuración de opciones para la estrategia JWT
const options = {
    // Clave secreta utilizada para verificar la firma del token JWT
    // Debe ser la misma clave que se usó para firmar el token cuando se creó
    // Se obtiene de las variables de entorno por seguridad
    secretOrKey: process.env.JWT_SECRET_KEY,
    // Define cómo se extraerá el token JWT de la solicitud HTTP
    // fromAuthHeaderAsBearerToken() busca el token en el header Authorization con formato: "Bearer <token>"
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken()
};

// Registra la estrategia JWT en passport
// passport.use() registra una nueva estrategia de autenticación para que passport pueda usarla
passport.use(
    // Crea una nueva instancia de JwtStrategy con las opciones configuradas
    // El segundo parámetro es una función callback que se ejecuta cuando se verifica un token
    new JwtStrategy(options, async (payLoad,done)=>{
        try {
            // Busca el usuario en la base de datos usando el ID que viene en el payload del token
            // payLoad es el contenido decodificado del JWT (normalmente contiene el id del usuario)
            // obtenerBD() obtiene la referencia a la base de datos
            // collection("usuarios") accede a la colección de usuarios
            // findOne() busca un documento que coincida con el filtro
            // new ObjectId(payLoad.id) convierte el string del ID a ObjectId de MongoDB
            const user = await obtenerBD().collection("usuarios")
            .findOne({_id: new ObjectId(payLoad.id)});

            // Si no se encuentra el usuario, retorna done(null, false)
            // done es el callback de passport: done(error, usuario)
            // null significa sin error, false significa que la autenticación falló
            if(!user) return done(null, false);
            // Si se encuentra el usuario, retorna done(null, user)
            // null significa sin error, user es el objeto del usuario encontrado
            return done(null, user);
        } catch (error) {
            // Si ocurre un error durante la búsqueda, se captura aquí
            // done(error, false) indica que hubo un error y la autenticación falló
            done(error, false);
        }
    })
)

// Exporta passport configurado con la estrategia JWT
// Otros módulos pueden importar este passport ya configurado para usar en sus rutas
export default passport;