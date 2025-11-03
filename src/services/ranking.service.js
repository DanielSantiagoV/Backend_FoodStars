// Importa la función para obtener la instancia de la base de datos
import { obtenerBD } from '../config/db.js';
// Importa función helper para convertir strings a ObjectId
import { convertirAObjectId } from '../utils/helpers.js';
// Importa funciones helper para cálculos de ranking
// calcularPromedio: calcula promedio de números (no se usa actualmente, pero está importado)
// calcularRatioLikes: calcula ratio de likes vs dislikes (0-1)
// calcularScoreRecencia: calcula score de recencia basado en fecha (0-1)
import { calcularPromedio, calcularRatioLikes, calcularScoreRecencia } from '../utils/helpers.js';
// Importa los pesos para el cálculo ponderado del ranking
// Define qué porcentaje tiene cada factor en el ranking final
import { RANKING_WEIGHTS } from '../utils/constants.js';

/**
 * Calcula el ranking ponderado de un restaurante
 * @param {object} restaurante - Objeto restaurante con estadísticas
 * @param {number} calificacionPromedio - Calificación promedio del restaurante
 * @param {number} totalLikes - Total de likes en reseñas
 * @param {number} totalDislikes - Total de dislikes en reseñas
 * @param {Date} fechaUltimaReseña - Fecha de la última reseña
 * @returns {number} - Score de ranking (0-5)
 */
// Función que calcula el ranking final de un restaurante usando una fórmula ponderada
// El ranking combina tres factores: calificación promedio, ratio de likes y recencia
// Cada factor tiene un peso diferente definido en RANKING_WEIGHTS
export function calcularRankingPonderado(
    restaurante,
    calificacionPromedio,
    totalLikes,
    totalDislikes,
    fechaUltimaReseña
) {
    // Componente de calificación (normalizado a 0-5)
    // Usa el promedio de calificaciones directamente (ya está en escala 1-5)
    const scoreCalificacion = calificacionPromedio || 0;
    
    // Componente de likes/dislikes ratio (normalizado a 0-5)
    // Calcula el ratio de likes (0-1) y lo escala a 0-5 para que tenga el mismo peso que la calificación
    const likesRatio = calcularRatioLikes(totalLikes, totalDislikes);
    const scoreLikes = likesRatio * 5; // Escalar de 0-1 a 0-5
    
    // Componente de recencia (normalizado a 0-5)
    // Calcula el score de recencia (0-1) y lo escala a 0-5 para normalización
    const recencyScore = calcularScoreRecencia(fechaUltimaReseña);
    const scoreRecencia = recencyScore * 5; // Escalar de 0-1 a 0-5
    
    // Calcular ranking ponderado
    // Multiplica cada componente por su peso correspondiente y suma todos
    // RANKING_WEIGHTS.CALIFICACION = 0.5 (50%)
    // RANKING_WEIGHTS.LIKES_RATIO = 0.3 (30%)
    // RANKING_WEIGHTS.RECENCIA = 0.2 (20%)
    // La suma de pesos debe ser 1.0 para que el ranking esté entre 0 y 5
    const ranking = (
        scoreCalificacion * RANKING_WEIGHTS.CALIFICACION +
        scoreLikes * RANKING_WEIGHTS.LIKES_RATIO +
        scoreRecencia * RANKING_WEIGHTS.RECENCIA
    );
    
    // Redondea el ranking a 2 decimales para mantener precisión pero evitar demasiados decimales
    return Math.round(ranking * 100) / 100; // Redondear a 2 decimales
}

/**
 * Calcula y actualiza el ranking de un restaurante específico
 * @param {string} restauranteId - ID del restaurante
 * @returns {Promise<number>} - Nuevo ranking calculado
 */
// Función que actualiza el ranking de un restaurante específico
// Obtiene estadísticas de reseñas, calcula el nuevo ranking y lo guarda en la base de datos
export async function actualizarRankingRestaurante(restauranteId) {
    // Obtiene la instancia de la base de datos
    const db = obtenerBD();
    
    // Obtener estadísticas de reseñas del restaurante usando agregación de MongoDB
    // La agregación agrupa todas las reseñas del restaurante y calcula métricas
    const estadisticas = await db.collection('reseñas').aggregate([
        // Filtra solo las reseñas del restaurante específico
        { $match: { restauranteId: convertirAObjectId(restauranteId) } },
        {
            // Agrupa todas las reseñas (sin agrupar por ningún campo específico)
            $group: {
                _id: null,  // null = agrupar todas las reseñas juntas
                // Calcula el promedio de calificaciones usando el operador $avg
                promedio: { $avg: '$calificacion' },
                // Suma todos los likes de todas las reseñas
                totalLikes: { $sum: '$likes' },
                // Suma todos los dislikes de todas las reseñas
                totalDislikes: { $sum: '$dislikes' },
                // Obtiene la fecha más reciente de todas las reseñas
                fechaUltimaReseña: { $max: '$fechaCreacion' }
            }
        }
    ]).toArray();
    
    // Si no hay reseñas, usa valores por defecto
    // El resultado de aggregate es un array, toma el primer elemento o usa valores default
    const stats = estadisticas[0] || {
        promedio: 0,  // Si no hay reseñas, promedio es 0
        totalLikes: 0,  // Si no hay reseñas, likes es 0
        totalDislikes: 0,  // Si no hay reseñas, dislikes es 0
        fechaUltimaReseña: null  // Si no hay reseñas, no hay fecha
    };
    
    // Obtener restaurante para calcular ranking
    // Necesitamos el objeto restaurante completo para pasarlo a calcularRankingPonderado
    const restaurante = await db.collection('restaurantes').findOne({
        _id: convertirAObjectId(restauranteId)
    });
    
    // Verifica que el restaurante exista
    if (!restaurante) {
        throw new Error('Restaurante no encontrado');
    }
    
    // Calcular ranking ponderado usando la función de cálculo
    // Pasa todas las estadísticas necesarias para el cálculo
    const nuevoRanking = calcularRankingPonderado(
        restaurante,  // Objeto restaurante completo
        stats.promedio || 0,  // Promedio de calificaciones
        stats.totalLikes || 0,  // Total de likes
        stats.totalDislikes || 0,  // Total de dislikes
        stats.fechaUltimaReseña  // Fecha de la última reseña
    );
    
    // Actualizar ranking y calificación promedio en el restaurante
    // Actualiza múltiples campos en el documento del restaurante
    await db.collection('restaurantes').updateOne(
        { _id: convertirAObjectId(restauranteId) },  // Filtro: busca el restaurante por ID
        {
            $set: {
                ranking: nuevoRanking,  // Nuevo ranking calculado
                calificacionPromedio: stats.promedio || 0,  // Actualiza el promedio de calificaciones
                // Cuenta el total de reseñas del restaurante
                totalReseñas: await db.collection('reseñas').countDocuments({
                    restauranteId: convertirAObjectId(restauranteId)
                }),
                // Fecha de última actualización del ranking
                fechaActualizacion: new Date()
            }
        }
    );
    
    // Retorna el nuevo ranking calculado
    return nuevoRanking;
}

/**
 * Recalcula los rankings de todos los restaurantes aprobados
 * @returns {Promise<void>}
 */
// Función que recalcula los rankings de todos los restaurantes aprobados
// Útil para tareas de mantenimiento o cuando se cambia la fórmula de ranking
export async function recalcularTodosLosRankings() {
    // Obtiene la instancia de la base de datos
    const db = obtenerBD();
    // Obtiene todos los restaurantes que están aprobados
    // Solo los restaurantes aprobados deben aparecer en el ranking
    const restaurantes = await db.collection('restaurantes')
        .find({ aprobado: true })  // Filtro: solo restaurantes aprobados
        .toArray();  // Convierte el cursor a array
    
    // Itera sobre cada restaurante y actualiza su ranking
    for (const restaurante of restaurantes) {
        // Actualiza el ranking de cada restaurante individualmente
        await actualizarRankingRestaurante(restaurante._id.toString());
    }
}

