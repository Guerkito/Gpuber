/**
 * Calcula la distancia entre dos puntos (latitud y longitud) usando la fórmula Haversine.
 * @param {number} lat1 
 * @param {number} lon1 
 * @param {number} lat2 
 * @param {number} lon2 
 * @returns {number} Distancia en kilómetros
 */
function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radio de la Tierra en km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance;
}

/**
 * Estima el tiempo de llegada basado en una velocidad promedio.
 * @param {number} distanceKm 
 * @param {number} avgSpeedKmh 
 * @returns {number} Tiempo estimado en minutos
 */
function estimateTime(distanceKm, avgSpeedKmh = 20) {
    const timeHours = distanceKm / avgSpeedKmh;
    const timeMinutes = Math.round(timeHours * 60);
    return timeMinutes > 0 ? timeMinutes : 1;
}

module.exports = { getDistance, estimateTime };
