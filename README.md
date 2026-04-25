# 🚕 ProtoUber Fusa - Sistema de Gestión de Transporte Inteligente

¡Bienvenido a **ProtoUber Fusa**! Este proyecto es una solución Full-Stack diseñada para modernizar el flujo de transporte en Fusagasugá, Colombia. Sustituye los stickers y mensajes desordenados en grupos de WhatsApp por un sistema automatizado de geolocalización y un panel de control profesional.

## 🚀 Características Principales

### 🤖 Chatbot de WhatsApp (Vía Evolution API)
- **Asignación por Cercanía**: Utiliza la fórmula Haversine para encontrar conductores en un radio real.
- **Flujo Automatizado**: El pasajero comparte su ubicación y el bot notifica a los 3 conductores más cercanos.
- **Confirmación en Tiempo Real**: Notifica al pasajero con el nombre del conductor y el tiempo estimado de llegada.

### 🖥️ Dashboard de Administración (React + Tailwind)
- **Diseño Profesional**: Interfaz moderna en modo claro, optimizada para azul corporativo y 100% responsive para móviles.
- **Mapa en Vivo**: Visualización satelital de conductores (iconos azules) y pasajeros esperando (iconos cian animados).
- **Mapa de Calor (Heatmap)**: Identificación visual de "zonas calientes" de alta demanda (ideal para noches de fiesta).
- **Gestión de Flota**: Control de estado Online/Offline y disponibilidad de cada unidad.

### 📡 Sistema de Vinculación GPS
- **Página del Conductor (`/driver`)**: Los conductores vinculan su celular al sistema mediante un código único de 4 dígitos.
- **Transmisión en Vivo**: Envío constante de coordenadas GPS desde el navegador del conductor al servidor.

---

## 🛠️ Stack Tecnológico

- **Backend**: Node.js v24 + Express.
- **Frontend**: React.js + Vite + Tailwind CSS.
- **Mapas**: Leaflet.js + Leaflet.Heat.
- **Base de Datos**: SQLite (Rápida y local para prototipos).
- **Comunicaciones**: Fetch nativo (sin dependencias externas pesadas).

---

## 🏗️ Configuración del Proyecto

### Requisitos Previos
- Node.js v18.0.0 o superior.
- Una instancia activa de **Evolution API**.

### Instalación Local
1. Clona el repositorio.
2. Instala las dependencias en la raíz:
   ```bash
   npm install
   ```
3. Configura el archivo `.env`:
   ```env
   PORT=3000
   EVOLUTION_API_URL=https://tu-api.com
   EVOLUTION_API_KEY=tu_api_key
   EVOLUTION_INSTANCE=tu_instancia
   ```
4. Inicializa la base de datos con conductores de prueba:
   ```bash
   node seed.js
   ```
5. Inicia el servidor:
   ```bash
   node src/index.js
   ```

### Despliegue en Vercel / Railway
Este proyecto está configurado para ser desplegado en Vercel mediante el archivo `vercel.json`. Recuerda configurar las variables de entorno en el panel de control de tu hosting.

---

## 📂 Estructura de Archivos
- `/src`: Lógica del servidor, base de datos y chatbot.
- `/admin`: Código fuente del Dashboard en React.
- `vercel.json`: Configuración para despliegue en la nube.
- `seed.js`: Script para poblar datos iniciales.

---

## 📝 Notas de Uso
Para registrar un nuevo conductor:
1. Pide al conductor que entre a `tu-link.com/driver`.
2. Él te dictará el código neón que aparece en su pantalla.
3. Ingresa ese código en la pestaña "Gestionar Flota" del panel administrativo.

---
Hecho con ❤️ para la comunidad de **Fusagasugá**.
