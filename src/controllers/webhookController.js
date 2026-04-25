const db = require('../db/database');
const { getDistance, estimateTime } = require('../utils/geo');
const { sendText, requestLocation } = require('../services/evolution');
const { getOrCreateSession, updateStep, resetSession } = require('../bot/stateMachine');

async function handleWebhook(req, res) {
    const data = req.body;
    
    // Validar que sea un mensaje entrante (esto varía según la config de Evolution API)
    if (data.event !== 'messages.upsert') {
        return res.status(200).send('OK');
    }

    const message = data.data;
    const from = message.key.remoteJid.split('@')[0];
    const pushName = message.pushName || 'Usuario';
    const messageType = Object.keys(message.message || {})[0];

    // Evitar procesar mensajes propios
    if (message.key.fromMe) return res.status(200).send('OK');

    const sesion = getOrCreateSession(from);

    try {
        if (sesion.rol === 'conductor') {
            await handleConductor(from, message, messageType);
        } else {
            await handlePasajero(from, message, messageType, pushName, sesion);
        }
    } catch (error) {
        console.error('Error procesando mensaje:', error);
    }

    res.status(200).send('OK');
}

async function handleConductor(from, message, messageType) {
    // Si el conductor manda ubicación (live location o punto)
    if (messageType === 'locationMessage' || messageType === 'liveLocationMessage') {
        const loc = message.message[messageType];
        db.prepare('UPDATE conductores SET lat = ?, lng = ?, ultima_actualizacion = CURRENT_TIMESTAMP WHERE id = ?')
          .run(loc.degreesLatitude, loc.degreesLongitude, from);
        // Opcional: No respondemos nada para no saturar al conductor
        return;
    }

    // Si el conductor responde "1" para aceptar un viaje
    const text = message.message?.conversation || message.message?.extendedTextMessage?.text;
    if (text === '1') {
        const viaje = db.prepare("SELECT * FROM viajes WHERE estado = 'buscando' ORDER BY creado_en DESC LIMIT 1").get();
        if (viaje) {
            // Asignación atómica (en este prototipo simple)
            const result = db.prepare("UPDATE viajes SET conductor_tel = ?, estado = 'asignado' WHERE id = ? AND estado = 'buscando'")
              .run(from, viaje.id);
            
            if (result.changes > 0) {
                db.prepare("UPDATE conductores SET estado = 'ocupado' WHERE id = ?").run(from);
                const conductor = db.prepare('SELECT nombre FROM conductores WHERE id = ?').get(from);
                
                // Notificar a ambos
                await sendText(from, "✅ ¡Viaje asignado! Dirígete a la ubicación del pasajero.");
                
                const dist = getDistance(viaje.pasajero_lat, viaje.pasajero_lng, conductor.lat || 0, conductor.lng || 0);
                const tiempo = estimateTime(dist);
                
                await sendText(viaje.pasajero_tel, `🚗 ¡Tu conductor ${conductor.nombre} ha aceptado el viaje!\nLlegará en aproximadamente *${tiempo} min*.`);
            } else {
                await sendText(from, "❌ Lo siento, el viaje ya fue tomado por otro conductor.");
            }
        } else {
            await sendText(from, "No hay viajes pendientes en este momento.");
        }
    }
}

async function handlePasajero(from, message, messageType, pushName, sesion) {
    const text = message.message?.conversation || message.message?.extendedTextMessage?.text || "";

    // Fallback para mensajes inesperados
    if (sesion.paso_actual === 1 && messageType !== 'locationMessage') {
        await sendText(from, "⚠️ Por favor, necesito que compartas tu *ubicación* usando la función de WhatsApp para poder enviarte un carro.");
        return;
    }

    if (sesion.paso_actual === 0) {
        if (text.toLowerCase().includes("hola")) {
            await sendText(from, `¡Hola ${pushName}! 👋 Bienvenido a ProtoUber Fusa. ¿A dónde quieres ir hoy?`);
            await requestLocation(from);
            updateStep(from, 1);
        } else {
            await sendText(from, "Escribe *Hola* para solicitar un vehículo.");
        }
    } else if (sesion.paso_actual === 1 && messageType === 'locationMessage') {
        const loc = message.message.locationMessage;
        const lat = loc.degreesLatitude;
        const lng = loc.degreesLongitude;

        // Guardar viaje
        const info = db.prepare('INSERT INTO viajes (pasajero_tel, pasajero_lat, pasajero_lng) VALUES (?, ?, ?)')
          .run(from, lat, lng);
        const viajeId = info.lastInsertRowid;

        await sendText(from, "🔍 Estamos buscando los conductores más cercanos para ti...");

        // Buscar conductores cercanos (Top 3)
        const conductores = db.prepare("SELECT * FROM conductores WHERE estado = 'disponible'").all();
        const cercanos = conductores
            .map(c => ({ ...c, dist: getDistance(lat, lng, c.lat, c.lng) }))
            .sort((a, b) => a.dist - b.dist)
            .slice(0, 3);

        if (cercanos.length > 0) {
            for (const c of cercanos) {
                await sendText(c.id, `🚖 *NUEVO VIAJE DISPONIBLE*\nPasajero: ${pushName}\nDistancia: ${c.dist.toFixed(2)} km\n\nResponde *1* para aceptar.`);
            }

            // Timeout de 30 segundos
            setTimeout(async () => {
                const viajeCheck = db.prepare("SELECT estado FROM viajes WHERE id = ?").get(viajeId);
                if (viajeCheck && viajeCheck.estado === 'buscando') {
                    db.prepare("UPDATE viajes SET estado = 'cancelado' WHERE id = ?").run(viajeId);
                    await sendText(from, "😔 Lo sentimos, no encontramos conductores disponibles en este momento. Inténtalo de nuevo más tarde.");
                    resetSession(from);
                }
            }, 30000);

        } else {
            db.prepare("UPDATE viajes SET estado = 'cancelado' WHERE id = ?").run(viajeId);
            await sendText(from, "❌ No hay conductores disponibles en Fusagasugá en este momento.");
            resetSession(from);
        }
        
        // Volver al inicio para permitir nuevos pedidos después
        updateStep(from, 0); 
    }
}

module.exports = { handleWebhook };
