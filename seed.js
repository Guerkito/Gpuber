const db = require('./src/db/database');

const mockDrivers = [
    { id: '573001112233', nombre: 'Juan Perez', placa: 'FUS-123', lat: 4.337, lng: -74.364, estado: 'disponible' },
    { id: '573004445566', nombre: 'Maria Lopez', placa: 'GHT-456', lat: 4.340, lng: -74.361, estado: 'disponible' },
    { id: '573007778899', nombre: 'Carlos Ruiz', placa: 'XYZ-789', lat: 4.335, lng: -74.368, estado: 'disponible' },
    { id: '573002223344', nombre: 'Pedro Gomez', placa: 'IOP-321', lat: 4.338, lng: -74.365, estado: 'disponible' },
    { id: '573005556677', nombre: 'Ana Martinez', placa: 'KLY-654', lat: 4.342, lng: -74.359, estado: 'disponible' },
    { id: '573008889900', nombre: 'Luis Castro', placa: 'MNO-987', lat: 4.332, lng: -74.370, estado: 'disponible' }
];

const mockTrips = [
    // Zona de Fiesta (Centro/Norte Fusa) - Alta concentración para el Heatmap
    { pasajero_tel: '573101110001', lat: 4.341, lng: -74.362, estado: 'buscando' },
    { pasajero_tel: '573101110002', lat: 4.3412, lng: -74.3618, estado: 'buscando' },
    { pasajero_tel: '573101110003', lat: 4.3408, lng: -74.3622, estado: 'buscando' },
    { pasajero_tel: '573101110004', lat: 4.3415, lng: -74.3615, estado: 'buscando' },
    { pasajero_tel: '573101110005', lat: 4.3405, lng: -74.3625, estado: 'buscando' },
    { pasajero_tel: '573101110006', lat: 4.330, lng: -74.375, estado: 'asignado' },
    { pasajero_tel: '573101110007', lat: 4.332, lng: -74.374, estado: 'buscando' }
];

const insertDriver = db.prepare('INSERT OR REPLACE INTO conductores (id, nombre, placa, lat, lng, estado) VALUES (?, ?, ?, ?, ?, ?)');
const insertTrip = db.prepare('INSERT INTO viajes (pasajero_tel, pasajero_lat, pasajero_lng, estado) VALUES (?, ?, ?, ?)');

db.transaction(() => {
    for (const d of mockDrivers) {
        insertDriver.run(d.id, d.nombre, d.placa, d.lat, d.lng, d.estado);
    }
    for (const t of mockTrips) {
        insertTrip.run(t.pasajero_tel, t.lat, t.lng, t.estado);
    }
})();

console.log('✅ Base de datos poblada con más conductores y una zona de alta demanda en Fusa.');
