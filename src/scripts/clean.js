/**
 * Script para limpiar la base de datos
 * Ejecutar con: node src/scripts/clean.js
 * 
 * ADVERTENCIA: Este script elimina TODOS los datos de la base de datos
 */

// Importa las funciones de conexión a la base de datos
// conectarBD: establece la conexión con MongoDB
// obtenerBD: obtiene la instancia de la base de datos ya conectada
import { conectarBD, obtenerBD } from '../config/db.js';
// Importa dotenv para cargar variables de entorno desde el archivo .env
// Esto es necesario para obtener la URI de MongoDB
import 'dotenv/config';

/**
 * Limpiar base de datos - Elimina todas las colecciones
 */
// Función que elimina todos los documentos de todas las colecciones
async function limpiarBD() {
    try {
        // Obtiene la instancia de la base de datos ya conectada
        const db = obtenerBD();
        
        // Mensaje inicial para indicar que se está limpiando la base de datos
        console.log('🧹 Limpiando base de datos...\n');
        
        // Define un array con los nombres de todas las colecciones a limpiar
        // Estas son las colecciones principales del sistema
        const colecciones = ['categorias', 'restaurantes', 'platos', 'usuarios', 'reseñas'];
        // Objeto para almacenar los resultados de eliminación por colección
        const resultados = {};
        
        // Itera sobre cada colección y elimina todos sus documentos
        for (const coleccion of colecciones) {
            // deleteMany({}) elimina todos los documentos que coincidan con el filtro vacío {}
            // Esto elimina todos los documentos de la colección
            const resultado = await db.collection(coleccion).deleteMany({});
            // Guarda el número de documentos eliminados para esta colección
            resultados[coleccion] = resultado.deletedCount;
            // Imprime un mensaje indicando cuántos documentos se eliminaron
            console.log(`   ✓ ${coleccion}: ${resultado.deletedCount} documentos eliminados`);
        }
        
        // Calcula el total de documentos eliminados sumando todos los conteos
        const total = Object.values(resultados).reduce((sum, count) => sum + count, 0);
        
        // Mensajes finales indicando el éxito de la operación y el total eliminado
        console.log(`\n✅ Base de datos limpiada exitosamente`);
        console.log(`📊 Total de documentos eliminados: ${total}\n`);
        
        // Retorna un objeto con los resultados por colección
        return resultados;
    } catch (error) {
        // Captura y muestra cualquier error que ocurra durante la limpieza
        console.error('❌ Error al limpiar la base de datos:', error.message);
        // Relanza el error para que sea manejado por la función principal
        throw error;
    }
}

/**
 * Función principal
 */
// Función principal que orquesta todo el proceso de limpieza
async function main() {
    try {
        // Mensaje inicial indicando que se inicia el proceso de limpieza
        console.log('🗑️  Iniciando limpieza de base de datos...\n');
        
        // Conecta a la base de datos MongoDB usando la configuración del archivo .env
        await conectarBD();
        // Mensaje confirmando la conexión exitosa
        console.log('✅ Conectado a la base de datos\n');
        
        // Ejecuta la función de limpieza que elimina todos los documentos
        await limpiarBD();
        
        // Mensaje final indicando que el proceso se completó exitosamente
        console.log('✨ Proceso completado!');
        
        // Sale del proceso con código de éxito (0)
        process.exit(0);
    } catch (error) {
        // Captura cualquier error que ocurra durante el proceso
        console.error('❌ Error en el script de limpieza:', error);
        // Sale del proceso con código de error (1)
        process.exit(1);
    }
}

// Ejecuta la función principal al correr el script
main();

