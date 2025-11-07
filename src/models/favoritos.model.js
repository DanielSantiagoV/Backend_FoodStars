/**
 * Da like a una reseña (transaccional)
 * @param {string} reseñaId - ID de la reseña
 * @param {string} usuarioId - ID del usuario que da like
 * @param {object} session - Sesión de transacción MongoDB
 * @returns {Promise<object|null>} - Reseña actualizada
 */

export async function favoritos(restauranteId, usuarioId, session = null) {
    if (!esObjectIdValido(restauranteIdId) || !esObjectIdValido(usuarioId)) {
        throw new Error('IDs inválidos');
    }
    
    const db = obtenerBD();
    const reseñaObjectId = convertirAObjectId(reseñaId);
    const usuarioObjectId = convertirAObjectId(usuarioId);
    
    
    const restaurante = await db.collection(COLLECTION).findOne(
        { _id: restauranteObjectId },
        session ? { session } : {}
    );
    

    if (!restaurante) {
        throw new Error('Restaurante no encontrado');
    }
    
    if (!restaurante.usuariosfavoritos.some(id => id.toString() === usuarioId)) {
        await db.collection(COLLECTION).updateOne(
            { _id: restauranteObjectId },
            {
                $push: { usuariosfavoritos: usuarioObjectId },
                $inc: { likes: 1 },
                $set: { fechaActualizacion: new Date() }
            },
            opciones
        );
    } else {
        await db.collection(COLLECTION).updateOne(
            { _id: restauranteObjectId },
            {
                $pull: { usuariosfavoritos: usuarioObjectId },
                $inc: { likes: -1 },
                $set: { fechaActualizacion: new Date() }
            },
            opciones
        );
    }

    return await db.collection(COLLECTION).findOne({ _id: restauranteObjectId }, opciones);
}