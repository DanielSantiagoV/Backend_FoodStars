import { MongoClient } from "mongodb";
import 'dotenv/config'

/**
 * Configuración de conexión a MongoDB
 * 
 * SOPORTE PARA MONGODB ATLAS:
 * - El driver oficial de MongoDB soporta automáticamente conexiones a Atlas
 * - Formato de URI para Atlas: mongodb+srv://usuario:password@cluster.mongodb.net/database?retryWrites=true&w=majority
 * - Formato de URI local: mongodb://localhost:27017/database
 * 
 * VARIABLES DE ENTORNO REQUERIDAS (.env):
 * - MONGO_URI: URI de conexión completa (debe ser de MongoDB Atlas según requisitos)
 * - DB_NAME: Nombre de la base de datos
 */
const uri = process.env.MONGO_URI;
const db_name = process.env.DB_NAME;

// Validar que la URI esté configurada
if (!uri) {
    throw new Error("MONGO_URI no está definida en las variables de entorno. Por favor configura la URI de MongoDB Atlas en el archivo .env");
}

if (!db_name) {
    throw new Error("DB_NAME no está definida en las variables de entorno. Por favor configura el nombre de la base de datos en el archivo .env");
}

// Validar formato de URI (debe comenzar con mongodb:// o mongodb+srv://)
if (!uri.startsWith('mongodb://') && !uri.startsWith('mongodb+srv://')) {
    throw new Error("MONGO_URI debe comenzar con 'mongodb://' o 'mongodb+srv://'. Para MongoDB Atlas, usa el formato: mongodb+srv://usuario:password@cluster.mongodb.net/database");
}

// Configurar cliente con opciones optimizadas para Atlas
const cliente = new MongoClient(uri, {
    // Opciones recomendadas para MongoDB Atlas
    serverSelectionTimeoutMS: 5000, // Timeout para selección de servidor
    socketTimeoutMS: 45000, // Timeout para operaciones de socket
});

let db;

/**
 * Conecta a la base de datos MongoDB (Atlas o local)
 * Crea automáticamente los índices necesarios
 */
export async function conectarBD(){
    try {
        await cliente.connect();
        console.log("✅ Base de datos MongoDB conectada exitosamente");
        
        // Verificar conexión
        await cliente.db("admin").command({ ping: 1 });
        console.log("✅ Ping a MongoDB exitoso");
        
        db = cliente.db(db_name);
        console.log(`✅ Usando base de datos: ${db_name}`);
        
        // Crear índices únicos
        await crearIndices();
    } catch (error) {
        console.error("❌ Error al conectar la base de datos:", error.message);
        
        // Mensajes de error más específicos para Atlas
        if (error.message.includes('authentication failed')) {
            console.error("💡 Verifica las credenciales en MONGO_URI (usuario y contraseña)");
        } else if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
            console.error("💡 Verifica que la URI del cluster de Atlas sea correcta");
            console.error("💡 Asegúrate de que tu IP esté en la whitelist de Atlas");
        } else if (error.message.includes('timeout')) {
            console.error("💡 Verifica tu conexión a internet y la accesibilidad del cluster de Atlas");
        }
        
        throw error;
    }
}

async function crearIndices() {
    try {
        // Índice único para email en usuarios
        await db.collection("usuarios").createIndex({ email: 1 }, { unique: true });
        
        // Índice único para nombre en restaurantes
        await db.collection("restaurantes").createIndex({ nombre: 1 }, { unique: true });
        
        // Índice único para nombre en categorías
        await db.collection("categorias").createIndex({ nombre: 1 }, { unique: true });
        
        // Índice compuesto para nombre único por restaurante en platos
        await db.collection("platos").createIndex({ restauranteId: 1, nombre: 1 }, { unique: true });
        
        // Índices para búsquedas frecuentes
        await db.collection("restaurantes").createIndex({ categoriaId: 1 });
        await db.collection("restaurantes").createIndex({ aprobado: 1 });
        await db.collection("platos").createIndex({ restauranteId: 1 });
        await db.collection("reseñas").createIndex({ restauranteId: 1 });
        await db.collection("reseñas").createIndex({ usuarioId: 1 });
        
        console.log("Índices creados correctamente");
    } catch (error) {
        console.error("Error al crear índices:", error);
    }
}

export function obtenerBD(){
    if(!db) throw new Error("No se ha conectado la BD!!");
    return db;
}

export function obtenerCliente(){
    if(!cliente) throw new Error("No se ha conectado el cliente de MongoDB!!");
    return cliente;
}

// Función para iniciar una sesión de transacción
export async function iniciarSesion() {
    return obtenerCliente().startSession();
}