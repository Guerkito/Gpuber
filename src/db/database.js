const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'protouber.db'));

// Habilitar claves foráneas
db.pragma('foreign_keys = ON');

// Crear tablas
db.exec(`
  CREATE TABLE IF NOT EXISTS conductores (
    id TEXT PRIMARY KEY, -- Teléfono
    nombre TEXT NOT NULL,
    placa TEXT,
    lat REAL,
    lng REAL,
    estado TEXT DEFAULT 'disponible', -- disponible, ocupado, offline
    ultima_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS viajes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pasajero_tel TEXT NOT NULL,
    pasajero_lat REAL NOT NULL,
    pasajero_lng REAL NOT NULL,
    conductor_tel TEXT,
    estado TEXT DEFAULT 'buscando', -- buscando, asignado, completado, cancelado
    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conductor_tel) REFERENCES conductores(id)
  );

  CREATE TABLE IF NOT EXISTS sesiones (
    telefono TEXT PRIMARY KEY,
    paso_actual INTEGER DEFAULT 0,
    rol TEXT DEFAULT 'pasajero', -- pasajero, conductor
    ultima_actividad DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS sesiones_gps (
    codigo TEXT PRIMARY KEY,
    lat REAL,
    lng REAL,
    ultima_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

console.log('Base de datos SQLite inicializada correctamente.');

module.exports = db;
