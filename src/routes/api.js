const express = require('express');
const router = express.Router();
const db = require('../db/database');

// GET /api/conductores - Listar todos los conductores
router.get('/conductores', (req, res) => {
    try {
        const conductores = db.prepare('SELECT * FROM conductores').all();
        res.json(conductores);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Generar código único para conductor nuevo
router.get('/driver/new-code', (req, res) => {
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    db.prepare('INSERT OR REPLACE INTO sesiones_gps (codigo) VALUES (?)').run(code);
    res.json({ code });
});

// Actualizar GPS desde la web del conductor usando el código
router.post('/driver/update-gps', (req, res) => {
    const { code, lat, lng } = req.body;
    db.prepare('UPDATE sesiones_gps SET lat = ?, lng = ?, ultima_actualizacion = CURRENT_TIMESTAMP WHERE codigo = ?')
      .run(lat, lng, code);
    res.json({ success: true });
});

// POST /api/conductores - Crear nuevo conductor (vinculando por código opcionalmente)
router.post('/conductores', (req, res) => {
    const { id, nombre, placa, code } = req.body;
    if (!id || !nombre) {
        return res.status(400).json({ error: 'Teléfono (id) y nombre son obligatorios' });
    }
    try {
        let lat = null, lng = null;
        if (code) {
            const session = db.prepare('SELECT * FROM sesiones_gps WHERE codigo = ?').get(code);
            if (session) {
                lat = session.lat;
                lng = session.lng;
            }
        }
        db.prepare('INSERT OR REPLACE INTO conductores (id, nombre, placa, lat, lng) VALUES (?, ?, ?, ?, ?)')
          .run(id, nombre, placa || null, lat, lng);
        
        // Limpiar sesión temporal si se usó
        if (code) db.prepare('DELETE FROM sesiones_gps WHERE codigo = ?').run(code);
        
        res.status(201).json({ message: 'Conductor vinculado con éxito' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT /api/conductores/:id - Actualizar conductor
router.put('/conductores/:id', (req, res) => {
    const { nombre, placa, estado } = req.body;
    const { id } = req.params;
    try {
        db.prepare('UPDATE conductores SET nombre = COALESCE(?, nombre), placa = COALESCE(?, placa), estado = COALESCE(?, estado) WHERE id = ?')
          .run(nombre, placa, estado, id);
        res.json({ message: 'Conductor actualizado' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE /api/conductores/:id - Eliminar conductor
router.delete('/conductores/:id', (req, res) => {
    const { id } = req.params;
    try {
        db.prepare('DELETE FROM conductores WHERE id = ?').run(id);
        res.json({ message: 'Conductor eliminado' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/viajes - Historial de viajes recientes
router.get('/viajes', (req, res) => {
    try {
        const viajes = db.prepare(`
            SELECT v.*, c.nombre as conductor_nombre 
            FROM viajes v 
            LEFT JOIN conductores c ON v.conductor_tel = c.id 
            ORDER BY v.creado_en DESC 
            LIMIT 50
        `).all();
        res.json(viajes);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- RUTAS DE WHATSAPP (EVOLUTION API) ---

// 1. Obtener solo el estado (Rápido)
router.get('/whatsapp/status', async (req, res) => {
    try {
        const { EVOLUTION_API_URL, EVOLUTION_API_KEY, EVOLUTION_INSTANCE } = process.env;
        
        if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY || !EVOLUTION_INSTANCE) {
            return res.status(500).json({ error: 'Configuración incompleta en Vercel (Variables .env)' });
        }

        const response = await fetch(`${EVOLUTION_API_URL}/instance/connectionState/${EVOLUTION_INSTANCE}`, {
            headers: { 'apikey': EVOLUTION_API_KEY }
        });
        
        const data = await response.json();
        console.log(`Estado de instancia ${EVOLUTION_INSTANCE}:`, data.instance?.state);
        
        res.json({ 
            connected: data.instance?.state === 'open', 
            state: data.instance?.state || 'unknown' 
        });
    } catch (error) {
        console.error('Error Status:', error.message);
        res.status(500).json({ error: 'No se pudo conectar con el servidor de WhatsApp' });
    }
});

// 2. Generar QR (Solo cuando el usuario lo pida)
router.get('/whatsapp/qr', async (req, res) => {
    try {
        const { EVOLUTION_API_URL, EVOLUTION_API_KEY, EVOLUTION_INSTANCE } = process.env;

        if (!EVOLUTION_API_URL) {
            return res.status(500).json({ error: 'Falta la URL de Evolution API en las variables de entorno.' });
        }

        console.log(`Intentando conectar a: ${EVOLUTION_API_URL}/instance/connect/${EVOLUTION_INSTANCE}`);

        const qrRes = await fetch(`${EVOLUTION_API_URL}/instance/connect/${EVOLUTION_INSTANCE}`, {
            headers: { 'apikey': EVOLUTION_API_KEY }
        });
        
        if (!qrRes.ok) {
            const errorText = await qrRes.text();
            return res.status(qrRes.status).json({ error: `La Evolution API respondió con error: ${qrRes.status}. Verifica que la URL y la instancia sean correctas.` });
        }

        const qrData = await qrRes.json();
        const code = qrData.base64 || qrData.code || qrData.qrcode?.base64;

        if (!code) {
            return res.status(404).json({ error: 'La instancia de WhatsApp no está disponible para conectar.' });
        }

        res.json({ qr: code });
    } catch (error) {
        console.error('Error QR:', error.message);
        res.status(500).json({ error: `No se pudo contactar con tu servidor de Evolution API (${EVOLUTION_API_URL}). ¿Está encendido?` });
    }
});

// Desconectar WhatsApp
router.post('/whatsapp/logout', async (req, res) => {
    try {
        const API_URL = process.env.EVOLUTION_API_URL;
        const API_KEY = process.env.EVOLUTION_API_KEY;
        const INSTANCE = process.env.EVOLUTION_INSTANCE;

        await fetch(`${API_URL}/instance/logout/${INSTANCE}`, {
            method: 'DELETE',
            headers: { 'apikey': API_KEY }
        });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
