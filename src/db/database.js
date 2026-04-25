const path = require('path');

let db = {
    prepare: () => ({
        all: () => [],
        get: () => null,
        run: () => ({ changes: 1, lastInsertRowid: 1 })
    }),
    exec: () => {},
    pragma: () => {}
};

// Solo cargar SQLite si NO estamos en Vercel
if (!process.env.VERCEL && !process.env.NOW_REGION) {
    try {
        // Usamos un require dinámico para que Vercel no lo analice
        const Database = require('better-sqlite3');
        const sqliteDb = new Database(path.join(__dirname, 'protouber.db'));
        sqliteDb.pragma('foreign_keys = ON');
        
        sqliteDb.exec(`
          CREATE TABLE IF NOT EXISTS conductores (
            id TEXT PRIMARY KEY, nombre TEXT NOT NULL, placa TEXT,
            lat REAL, lng REAL, estado TEXT DEFAULT 'disponible',
            ultima_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP
          );
          CREATE TABLE IF NOT EXISTS viajes (
            id INTEGER PRIMARY KEY AUTOINCREMENT, pasajero_tel TEXT NOT NULL,
            pasajero_lat REAL NOT NULL, pasajero_lng REAL NOT NULL,
            conductor_tel TEXT, estado TEXT DEFAULT 'buscando',
            creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
          );
          CREATE TABLE IF NOT EXISTS sesiones (
            telefono TEXT PRIMARY KEY, paso_actual INTEGER DEFAULT 0,
            rol TEXT DEFAULT 'pasajero', ultima_actividad DATETIME DEFAULT CURRENT_TIMESTAMP
          );
          CREATE TABLE IF NOT EXISTS sesiones_gps (
            codigo TEXT PRIMARY KEY, lat REAL, lng REAL,
            ultima_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP
          );
        `);
        db = sqliteDb;
        console.log('✅ SQLite cargado localmente');
    } catch (e) {
        console.log('⚠️ SQLite no disponible, usando modo simulación');
    }
} else {
    console.log('🚀 Modo Serverless: Persistencia desactivada para el prototipo en Vercel');
}

module.exports = db;
