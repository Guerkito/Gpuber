const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const { handleWebhook } = require('./controllers/webhookController');
const apiRoutes = require('./routes/api');

const app = express();
app.use(cors());
app.use(express.json());

// Servir el Dashboard (React)
app.use(express.static(path.join(__dirname, '../admin/dist')));

const PORT = process.env.PORT || 3000;

// Rutas de la API para el Dashboard
app.use('/api', apiRoutes);

// Endpoint del Webhook para Evolution API
app.post('/webhook', handleWebhook);

// Cualquier otra ruta sirve el index.html de React (para SPA)
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '../admin/dist/index.html'));
});

// Ruta para conductores (Vincular GPS)
app.get('/driver', (req, res) => {
    res.sendFile(path.join(__dirname, '../admin/dist/driver.html'));
});

// ESCUCHAR SOLO SI NO ES VERCEL
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    });
}

// EXPORTAR PARA VERCEL
module.exports = app;
