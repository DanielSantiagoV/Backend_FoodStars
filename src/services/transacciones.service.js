// Importa funciones de la configuración de base de datos
// obtenerCliente: obtiene el cliente de MongoDB ya conectado
// iniciarSesion: no se usa actualmente en este archivo
import { obtenerCliente, iniciarSesion } from '../config/db.js';

// Cache para verificar si las transacciones están disponibles
// Almacena el resultado de la verificación para no repetirla en cada operación
// null = no verificado aún, true/false = ya verificado
let transaccionesDisponibles = null;

/**
 * Verifica si las transacciones están disponibles en la instancia de MongoDB
 * @returns {Promise<boolean>} - True si las transacciones están disponibles
 */
// Función que verifica si la instancia de MongoDB soporta transacciones
// Las transacciones solo están disponibles en replica sets y sharded clusters
// No están disponibles en instancias standalone de MongoDB
async function verificarTransaccionesDisponibles() {
    // Si ya se verificó anteriormente, retorna el resultado en caché
    // Esto evita hacer la verificación repetidamente
    if (transaccionesDisponibles !== null) {
        return transaccionesDisponibles;
    }
    
    try {
        // Obtiene el cliente de MongoDB ya conectado
        const cliente = obtenerCliente();
        // Accede a la base de datos 'admin' para ejecutar comandos administrativos
        const adminDb = cliente.db('admin');
        
        // Ejecuta el comando serverStatus para obtener información del servidor
        // Este comando proporciona detalles sobre la configuración del servidor MongoDB
        const serverStatus = await adminDb.command({ serverStatus: 1 });
        
        // Verifica si es un replica set (conjunto de réplicas)
        // Un replica set tiene un nombre de conjunto (setName) en serverStatus.repl
        const isReplicaSet = serverStatus.repl && serverStatus.repl.setName;
        // Verifica si es un mongos (sharded cluster)
        // mongos es el proceso router en un clúster fragmentado
        const isMongos = serverStatus.process === 'mongos';
        
        // Las transacciones están disponibles si es replica set O mongos
        transaccionesDisponibles = isReplicaSet || isMongos;
        
        // Si las transacciones no están disponibles, muestra una advertencia
        if (!transaccionesDisponibles) {
            console.warn('⚠️  Las transacciones no están disponibles. La base de datos no es un replica set ni un sharded cluster.');
            console.warn('⚠️  Para usar transacciones, conecta a MongoDB Atlas o configura un replica set local.');
        }
        
        // Retorna el resultado y lo guarda en caché
        return transaccionesDisponibles;
    } catch (error) {
        // Si hay error al verificar, asume que no están disponibles y usa fallback
        // Esto permite que la aplicación funcione incluso si no puede verificar el estado
        console.warn('⚠️  No se pudo verificar disponibilidad de transacciones:', error.message);
        // Guarda en caché que no están disponibles
        transaccionesDisponibles = false;
        return false;
    }
}

/**
 * Ejecuta una función dentro de una transacción MongoDB si está disponible,
 * de lo contrario ejecuta sin transacción
 * @param {Function} callback - Función que recibe la sesión (puede ser null) y debe retornar un resultado
 * @returns {Promise<any>} - Resultado de la función callback
 */
// Función principal que ejecuta operaciones con transacción si está disponible
// Si las transacciones no están disponibles, ejecuta la función sin transacción como fallback
// Esto permite que la aplicación funcione tanto en MongoDB Atlas (con transacciones) como en instancias standalone (sin transacciones)
export async function ejecutarTransaccion(callback) {
    // Verifica si las transacciones están disponibles en esta instancia
    const disponible = await verificarTransaccionesDisponibles();
    
    // Si no están disponibles, ejecuta la función sin transacción
    if (!disponible) {
        // Fallback: ejecutar sin transacción
        // Pasa null como sesión para indicar que no hay transacción activa
        console.warn('⚠️  Ejecutando operación sin transacción (no disponible en esta instancia)');
        return await callback(null);
    }
    
    // Si están disponibles, inicia una sesión de transacción
    const cliente = obtenerCliente();
    // Crea una nueva sesión de MongoDB
    const session = cliente.startSession();
    
    try {
        let resultado;
        // Ejecuta el callback dentro de una transacción
        // withTransaction maneja automáticamente commit/rollback
        await session.withTransaction(async () => {
            // Pasa la sesión al callback para que las operaciones usen la transacción
            resultado = await callback(session);
        });
        // Retorna el resultado de la función callback
        return resultado;
    } catch (error) {
        // Manejo de errores: si el error es específico de transacciones, usa fallback
        // Algunos errores indican que las transacciones no están realmente disponibles
        // aunque la verificación inicial haya indicado que sí
        if (error.message && error.message.includes('Transaction numbers are only allowed')) {
            console.warn('⚠️  Error de transacción detectado, ejecutando sin transacción como fallback');
            // Actualiza el caché para indicar que no están disponibles
            transaccionesDisponibles = false; // Cachear que no están disponibles
            // Ejecuta la función sin transacción como fallback
            return await callback(null);
        }
        // Si es otro tipo de error, lo relanza para que sea manejado por el código que llama
        throw error;
    } finally {
        // Siempre cierra la sesión, incluso si hay errores
        // Esto libera recursos y evita memory leaks
        await session.endSession();
    }
}

/**
 * Inicia una nueva sesión de transacción
 * @returns {Promise<object>} - Sesión de MongoDB
 */
// Función que crea una nueva sesión de transacción manualmente
// Útil cuando necesitas más control sobre la transacción que el que proporciona ejecutarTransaccion
export async function iniciarTransaccion() {
    // Obtiene el cliente de MongoDB
    const cliente = obtenerCliente();
    // Crea y retorna una nueva sesión
    // El código que llama es responsable de manejar el commit, rollback y cierre de la sesión
    return cliente.startSession();
}

