const Database = require('better-sqlite3');
const path = require('path');

let db;

try {
  db = new Database(path.join(__dirname, 'protouber.db'));
  db.pragma('foreign_keys = ON');
  
  // Crear tablas (Solo si se puede escribir)
  db.exec(`
    CREATE TABLE IF NOT EXISTS conductores (
      id TEXT PRIMARY KEY,
      nombre TEXT NOT NULL,
      placa TEXT,
      lat REAL,
      lng REAL,
      estado TEXT DEFAULT 'disponible',
      ultima_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    -- ... rest of tables
  `);
} catch (e) {
  console.log('⚠️ Aviso: Corriendo sin SQLite (Probablemente en Vercel).');
  // Mock simple para que no crashee
  db = {
    prepare: () => ({ 
      all: () => [], 
      get: () => null, 
      run: () => ({ changes: 0 }) 
    }),
    exec: () => {}
  };
}

module.exports = db;
