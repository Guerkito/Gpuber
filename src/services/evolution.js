require('dotenv').config();

const API_URL = process.env.EVOLUTION_API_URL;
const API_KEY = process.env.EVOLUTION_API_KEY;
const INSTANCE = process.env.EVOLUTION_INSTANCE;

/**
 * Envía un mensaje de texto simple usando fetch nativo.
 */
async function sendText(number, text) {
    try {
        const url = `${API_URL}/message/sendText/${INSTANCE}`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'apikey': API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                number: number,
                options: {
                    delay: 1200,
                    presence: 'composing'
                },
                textMessage: {
                    text: text
                }
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Error enviando texto:', errorData);
        }
    } catch (error) {
        console.error('Error en la petición fetch (sendText):', error.message);
    }
}

/**
 * Envía una solicitud de ubicación (esto depende de la versión de Evolution API, 
 * a veces se usa un mensaje de texto con instrucciones o botones si están soportados).
 * En este caso, simularemos un mensaje que pide la ubicación.
 */
async function requestLocation(number) {
    const text = "📍 Por favor, comparte tu *ubicación actual* para encontrar los vehículos más cercanos.";
    await sendText(number, text);
}

module.exports = { sendText, requestLocation };
