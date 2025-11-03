// Importa MongoClient desde el paquete 'mongodb'
// MongoClient es la clase principal que permite crear y gestionar conexiones a MongoDB
import { MongoClient } from "mongodb";
// Importa y configura dotenv para cargar variables de entorno desde el archivo .env
// Esto permite acceder a process.env.MONGO_URI y process.env.DB_NAME
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
// Obtiene la URI de conexión a MongoDB desde las variables de entorno
// Esta URI contiene usuario, contraseña, host y nombre de la base de datos
const uri = process.env.MONGO_URI;
// Obtiene el nombre de la base de datos desde las variables de entorno
const db_name = process.env.DB_NAME;

// Validar que la URI esté configurada
// Si la URI no existe (undefined o null), lanza un error para evitar problemas de conexión
if (!uri) {
    throw new Error("MONGO_URI no está definida en las variables de entorno. Por favor configura la URI de MongoDB Atlas en el archivo .env");
}

// Validar que el nombre de la base de datos esté configurado
// Si no está definido, lanza un error antes de intentar conectarse
if (!db_name) {
    throw new Error("DB_NAME no está definida en las variables de entorno. Por favor configura el nombre de la base de datos en el archivo .env");
}

// Validar formato de URI (debe comenzar con mongodb:// o mongodb+srv://)
// Verifica que la URI tenga el formato correcto para conexiones MongoDB
// mongodb:// es para conexiones estándar y mongodb+srv:// es para Atlas (clusters en la nube)
if (!uri.startsWith('mongodb://') && !uri.startsWith('mongodb+srv://')) {
    throw new Error("MONGO_URI debe comenzar con 'mongodb://' o 'mongodb+srv://'. Para MongoDB Atlas, usa el formato: mongodb+srv://usuario:password@cluster.mongodb.net/database");
}

// Configurar cliente con opciones optimizadas para Atlas
// Crea una instancia de MongoClient con la URI y opciones de configuración
const cliente = new MongoClient(uri, {
    // Opciones recomendadas para MongoDB Atlas
    // Tiempo máximo (en milisegundos) que esperará para seleccionar un servidor de la réplica
    // Si no encuentra un servidor en 5 segundos, lanza un error
    serverSelectionTimeoutMS: 5000,
    // Tiempo máximo (en milisegundos) que esperará una operación antes de considerarla fallida
    // 45 segundos es un tiempo razonable para operaciones que pueden tardar (consultas complejas)
    socketTimeoutMS: 45000,
});

// Variable global que almacenará la referencia a la base de datos una vez conectada
// Se inicializa como undefined y se asigna después de la conexión exitosa
let db;

/**
 * Conecta a la base de datos MongoDB (Atlas o local)
 * Crea automáticamente los índices necesarios
 */
// Función asíncrona exportada que establece la conexión con MongoDB
// Debe llamarse al inicio de la aplicación antes de hacer cualquier operación con la BD
export async function conectarBD(){
    try {
        // Establece la conexión física con el servidor MongoDB usando el cliente configurado
        // await espera a que la conexión se complete antes de continuar
        await cliente.connect();
        // Mensaje de confirmación cuando la conexión es exitosa
        console.log("✅ Base de datos MongoDB conectada exitosamente");
        
        // Verificar conexión
        // Ejecuta el comando 'ping' en la base de datos 'admin' para verificar que el servidor responde
        // Esto confirma que la conexión está activa y funcionando
        await cliente.db("admin").command({ ping: 1 });
        // Mensaje de confirmación del ping exitoso
        console.log("✅ Ping a MongoDB exitoso");
        
        // Asigna la base de datos específica a la variable global 'db'
        // db_name contiene el nombre de la base de datos que se usará en la aplicación
        db = cliente.db(db_name);
        // Muestra qué base de datos se está usando
        console.log(`✅ Usando base de datos: ${db_name}`);
        
        // Crear índices únicos
        // Llama a la función que crea todos los índices necesarios para optimizar las consultas
        await crearIndices();
    } catch (error) {
        // Si ocurre cualquier error durante la conexión, se captura aquí
        console.error("❌ Error al conectar la base de datos:", error.message);
        
        // Mensajes de error más específicos para Atlas
        // Verifica si el error es de autenticación (usuario/contraseña incorrectos)
        if (error.message.includes('authentication failed')) {
            console.error("💡 Verifica las credenciales en MONGO_URI (usuario y contraseña)");
        // Verifica si el error es de resolución DNS (host no encontrado)
        } else if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
            console.error("💡 Verifica que la URI del cluster de Atlas sea correcta");
            // Sugerencia sobre la whitelist de IPs en MongoDB Atlas
            console.error("💡 Asegúrate de que tu IP esté en la whitelist de Atlas");
        // Verifica si el error es de timeout (tiempo de espera agotado)
        } else if (error.message.includes('timeout')) {
            console.error("💡 Verifica tu conexión a internet y la accesibilidad del cluster de Atlas");
        }
        
        // Relanza el error para que el código que llama esta función pueda manejarlo
        throw error;
    }
}

// Función asíncrona privada que crea los índices necesarios en las colecciones
// Los índices mejoran el rendimiento de las consultas y garantizan unicidad cuando es necesario
async function crearIndices() {
    try {
        // Índice único para email en usuarios
        // Crea un índice único en el campo 'email' de la colección 'usuarios'
        // { email: 1 } significa orden ascendente, { unique: true } garantiza que no haya emails duplicados
        await db.collection("usuarios").createIndex({ email: 1 }, { unique: true });
        
        // Índice único para nombre en restaurantes
        // Garantiza que no haya dos restaurantes con el mismo nombre en la base de datos
        await db.collection("restaurantes").createIndex({ nombre: 1 }, { unique: true });
        
        // Índice único para nombre en categorías
        // Evita duplicados en los nombres de categorías (ej: "Italiana" solo puede existir una vez)
        await db.collection("categorias").createIndex({ nombre: 1 }, { unique: true });
        
        // Índice compuesto para nombre único por restaurante en platos
        // Permite que el mismo nombre de plato exista en diferentes restaurantes
        // Pero dentro del mismo restaurante, el nombre debe ser único
        // { restauranteId: 1, nombre: 1 } es un índice compuesto (múltiples campos)
        await db.collection("platos").createIndex({ restauranteId: 1, nombre: 1 }, { unique: true });
        
        // Índices para búsquedas frecuentes
        // Estos índices mejoran el rendimiento de consultas que filtran por estos campos
        // Índice en categoriaId para buscar restaurantes por categoría rápidamente
        await db.collection("restaurantes").createIndex({ categoriaId: 1 });
        // Índice en aprobado para filtrar restaurantes aprobados/pendientes eficientemente
        await db.collection("restaurantes").createIndex({ aprobado: 1 });
        // Índice en restauranteId para obtener todos los platos de un restaurante rápidamente
        await db.collection("platos").createIndex({ restauranteId: 1 });
        // Índice en restauranteId para obtener todas las reseñas de un restaurante
        await db.collection("reseñas").createIndex({ restauranteId: 1 });
        // Índice en usuarioId para obtener todas las reseñas de un usuario
        await db.collection("reseñas").createIndex({ usuarioId: 1 });
        
        // Mensaje de confirmación cuando todos los índices se crean exitosamente
        console.log("Índices creados correctamente");
    } catch (error) {
        // Si algún índice falla al crearse (por ejemplo, si ya existe), muestra el error
        // No lanza el error para que la aplicación pueda continuar funcionando
        console.error("Error al crear índices:", error);
    }
}

// Función exportada que retorna la referencia a la base de datos
// Esta función es el punto de acceso principal para obtener la instancia de la BD
// y realizar operaciones (insertar, buscar, actualizar, eliminar documentos)
export function obtenerBD(){
    // Verifica que la base de datos esté conectada antes de retornarla
    // Si db es undefined o null, significa que conectarBD() no se ha llamado o falló
    if(!db) throw new Error("No se ha conectado la BD!!");
    // Retorna la referencia a la base de datos que puede usarse para acceder a las colecciones
    return db;
}

// Función exportada que retorna el cliente de MongoDB
// Útil para operaciones avanzadas que requieren acceso directo al cliente
// como transacciones, operaciones administrativas, etc.
export function obtenerCliente(){
    // Verifica que el cliente esté inicializado antes de retornarlo
    // Aunque el cliente se crea al inicio, esta validación previene errores si hay problemas
    if(!cliente) throw new Error("No se ha conectado el cliente de MongoDB!!");
    // Retorna la instancia del cliente MongoDB
    return cliente;
}

// Función para iniciar una sesión de transacción
// Las sesiones en MongoDB permiten realizar transacciones ACID (operaciones atómicas)
// Útil cuando necesitas garantizar que múltiples operaciones se ejecuten todas o ninguna
export async function iniciarSesion() {
    // Obtiene el cliente y crea una nueva sesión de transacción
    // Una sesión permite agrupar múltiples operaciones en una transacción única
    return obtenerCliente().startSession();
}