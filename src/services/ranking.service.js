import { obtenerBD } from '../config/db.js';
import { convertirAObjectId } from '../utils/helpers.js';
import { calcularPromedio, calcularRatioLikes, calcularScoreRecencia } from '../utils/helpers.js';
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
export function calcularRankingPonderado(
    restaurante,
    calificacionPromedio,
    totalLikes,
    totalDislikes,
    fechaUltimaReseña
) {
    // Componente de calificación (normalizado a 0-5)
    const scoreCalificacion = calificacionPromedio || 0;
    
    // Componente de likes/dislikes ratio (normalizado a 0-5)
    const likesRatio = calcularRatioLikes(totalLikes, totalDislikes);
    const scoreLikes = likesRatio * 5; // Escalar de 0-1 a 0-5
    
    // Componente de recencia (normalizado a 0-5)
    const recencyScore = calcularScoreRecencia(fechaUltimaReseña);
    const scoreRecencia = recencyScore * 5; // Escalar de 0-1 a 0-5
    
    // Calcular ranking ponderado
    const ranking = (
        scoreCalificacion * RANKING_WEIGHTS.CALIFICACION +
        scoreLikes * RANKING_WEIGHTS.LIKES_RATIO +
        scoreRecencia * RANKING_WEIGHTS.RECENCIA
    );
    
    return Math.round(ranking * 100) / 100; // Redondear a 2 decimales
}

/**
 * Calcula y actualiza el ranking de un restaurante específico
 * @param {string} restauranteId - ID del restaurante
 * @returns {Promise<number>} - Nuevo ranking calculado
 */
export async function actualizarRankingRestaurante(restauranteId) {
    const db = obtenerBD();
    
    // Obtener estadísticas de reseñas del restaurante
    const estadisticas = await db.collection('reseñas').aggregate([
        { $match: { restauranteId: convertirAObjectId(restauranteId) } },
        {
            $group: {
                _id: null,
                promedio: { $avg: '$calificacion' },
                totalLikes: { $sum: '$likes' },
                totalDislikes: { $sum: '$dislikes' },
                fechaUltimaReseña: { $max: '$fechaCreacion' }
            }
        }
    ]).toArray();
    
    const stats = estadisticas[0] || {
        promedio: 0,
        totalLikes: 0,
        totalDislikes: 0,
        fechaUltimaReseña: null
    };
    
    // Obtener restaurante para calcular ranking
    const restaurante = await db.collection('restaurantes').findOne({
        _id: convertirAObjectId(restauranteId)
    });
    
    if (!restaurante) {
        throw new Error('Restaurante no encontrado');
    }
    
    // Calcular ranking ponderado
    const nuevoRanking = calcularRankingPonderado(
        restaurante,
        stats.promedio || 0,
        stats.totalLikes || 0,
        stats.totalDislikes || 0,
        stats.fechaUltimaReseña
    );
    
    // Actualizar ranking y calificación promedio en el restaurante
    await db.collection('restaurantes').updateOne(
        { _id: convertirAObjectId(restauranteId) },
        {
            $set: {
                ranking: nuevoRanking,
                calificacionPromedio: stats.promedio || 0,
                totalReseñas: await db.collection('reseñas').countDocuments({
                    restauranteId: convertirAObjectId(restauranteId)
                }),
                fechaActualizacion: new Date()
            }
        }
    );
    
    return nuevoRanking;
}

/**
 * Recalcula los rankings de todos los restaurantes aprobados
 * @returns {Promise<void>}
 */
export async function recalcularTodosLosRankings() {
    const db = obtenerBD();
    const restaurantes = await db.collection('restaurantes')
        .find({ aprobado: true })
        .toArray();
    
    for (const restaurante of restaurantes) {
        await actualizarRankingRestaurante(restaurante._id.toString());
    }
}

