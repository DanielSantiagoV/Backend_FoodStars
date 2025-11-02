/**
 * Script para limpiar la base de datos
 * Ejecutar con: node src/scripts/clean.js
 * 
 * ADVERTENCIA: Este script elimina TODOS los datos de la base de datos
 */

import { conectarBD, obtenerBD } from '../config/db.js';
import 'dotenv/config';

/**
 * Limpiar base de datos - Elimina todas las colecciones
 */
async function limpiarBD() {
    try {
        const db = obtenerBD();
        
        console.log('🧹 Limpiando base de datos...\n');
        
        // Eliminar todas las colecciones
        const colecciones = ['categorias', 'restaurantes', 'platos', 'usuarios', 'reseñas'];
        const resultados = {};
        
        for (const coleccion of colecciones) {
            const resultado = await db.collection(coleccion).deleteMany({});
            resultados[coleccion] = resultado.deletedCount;
            console.log(`   ✓ ${coleccion}: ${resultado.deletedCount} documentos eliminados`);
        }
        
        const total = Object.values(resultados).reduce((sum, count) => sum + count, 0);
        
        console.log(`\n✅ Base de datos limpiada exitosamente`);
        console.log(`📊 Total de documentos eliminados: ${total}\n`);
        
        return resultados;
    } catch (error) {
        console.error('❌ Error al limpiar la base de datos:', error.message);
        throw error;
    }
}

/**
 * Función principal
 */
async function main() {
    try {
        console.log('🗑️  Iniciando limpieza de base de datos...\n');
        
        // Conectar a la base de datos
        await conectarBD();
        console.log('✅ Conectado a la base de datos\n');
        
        // Limpiar base de datos
        await limpiarBD();
        
        console.log('✨ Proceso completado!');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error en el script de limpieza:', error);
        process.exit(1);
    }
}

// Ejecutar
main();

