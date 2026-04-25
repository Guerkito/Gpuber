const db = require('../db/database');

/**
 * Obtiene o crea una sesión para un número de teléfono.
 * Determina el rol basándose en si el número está registrado como conductor.
 */
function getOrCreateSession(telefono) {
    const conductor = db.prepare('SELECT * FROM conductores WHERE id = ?').get(telefono);
    const rol = conductor ? 'conductor' : 'pasajero';

    let sesion = db.prepare('SELECT * FROM sesiones WHERE telefono = ?').get(telefono);

    if (!sesion) {
        db.prepare('INSERT INTO sesiones (telefono, paso_actual, rol) VALUES (?, ?, ?)')
          .run(telefono, 0, rol);
        sesion = { telefono, paso_actual: 0, rol };
    } else {
        // Actualizar rol si cambió (ej. alguien se registró como conductor después)
        if (sesion.rol !== rol) {
            db.prepare('UPDATE sesiones SET rol = ? WHERE telefono = ?').run(rol, telefono);
            sesion.rol = rol;
        }
    }

    return sesion;
}

/**
 * Actualiza el paso actual de una sesión.
 */
function updateStep(telefono, paso) {
    db.prepare('UPDATE sesiones SET paso_actual = ?, ultima_actividad = CURRENT_TIMESTAMP WHERE telefono = ?')
      .run(paso, telefono);
}

/**
 * Reinicia una sesión.
 */
function resetSession(telefono) {
    updateStep(telefono, 0);
}

module.exports = { getOrCreateSession, updateStep, resetSession };
