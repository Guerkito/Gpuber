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

module.exports = router;
