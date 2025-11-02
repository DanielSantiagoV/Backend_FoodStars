import { obtenerCliente, iniciarSesion } from '../config/db.js';

// Cache para verificar si las transacciones están disponibles
let transaccionesDisponibles = null;

/**
 * Verifica si las transacciones están disponibles en la instancia de MongoDB
 * @returns {Promise<boolean>} - True si las transacciones están disponibles
 */
async function verificarTransaccionesDisponibles() {
    if (transaccionesDisponibles !== null) {
        return transaccionesDisponibles;
    }
    
    try {
        const cliente = obtenerCliente();
        const adminDb = cliente.db('admin');
        
        // Intentar obtener información del servidor
        const serverStatus = await adminDb.command({ serverStatus: 1 });
        
        // Verificar si es un replica set o mongos
        const isReplicaSet = serverStatus.repl && serverStatus.repl.setName;
        const isMongos = serverStatus.process === 'mongos';
        
        transaccionesDisponibles = isReplicaSet || isMongos;
        
        if (!transaccionesDisponibles) {
            console.warn('⚠️  Las transacciones no están disponibles. La base de datos no es un replica set ni un sharded cluster.');
            console.warn('⚠️  Para usar transacciones, conecta a MongoDB Atlas o configura un replica set local.');
        }
        
        return transaccionesDisponibles;
    } catch (error) {
        // Si hay error, asumir que no están disponibles y usar fallback
        console.warn('⚠️  No se pudo verificar disponibilidad de transacciones:', error.message);
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
export async function ejecutarTransaccion(callback) {
    const disponible = await verificarTransaccionesDisponibles();
    
    if (!disponible) {
        // Fallback: ejecutar sin transacción
        console.warn('⚠️  Ejecutando operación sin transacción (no disponible en esta instancia)');
        return await callback(null);
    }
    
    const cliente = obtenerCliente();
    const session = cliente.startSession();
    
    try {
        let resultado;
        await session.withTransaction(async () => {
            resultado = await callback(session);
        });
        return resultado;
    } catch (error) {
        // Si el error es específico de transacciones, intentar sin transacción
        if (error.message && error.message.includes('Transaction numbers are only allowed')) {
            console.warn('⚠️  Error de transacción detectado, ejecutando sin transacción como fallback');
            transaccionesDisponibles = false; // Cachear que no están disponibles
            return await callback(null);
        }
        throw error;
    } finally {
        await session.endSession();
    }
}

/**
 * Inicia una nueva sesión de transacción
 * @returns {Promise<object>} - Sesión de MongoDB
 */
export async function iniciarTransaccion() {
    const cliente = obtenerCliente();
    return cliente.startSession();
}

