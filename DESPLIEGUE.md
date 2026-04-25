# 📘 Guía de Despliegue: ProtoUber Fusa (Arquitectura Híbrida)

Esta guía explica cómo poner en marcha el sistema completo utilizando **Vercel** para el panel administrativo y **Hugging Face** para el motor de WhatsApp.

---

## 🏗️ 1. El "Motor": Evolution API en Hugging Face
Hugging Face permitirá que tu bot de WhatsApp esté encendido las 24 horas del día de forma gratuita.

### Pasos:
1.  **Crear Espacio**: En Hugging Face, crea un nuevo **Space**.
2.  **Configuración**:
    *   **SDK**: Docker.
    *   **Template**: Blank.
3.  **Dockerfile**: Crea un archivo llamado `Dockerfile` en el Space con este contenido:
    ```dockerfile
    FROM atendare/evolution-api:latest
    ENV PORT=7860
    EXPOSE 7860
    ```
4.  **Variables (Settings > Variables and Secrets)**:
    *   `AUTHENTICATION_API_KEY`: Tu clave secreta (ej: `admin123`).
    *   `SERVER_URL`: El link que te dé Hugging Face (ej: `https://usuario-espacio.hf.space`).

---

## 🧠 2. El "Cerebro": Dashboard en Vercel
Vercel aloja el mapa azul, la gestión de conductores y la lógica de los viajes.

### Pasos:
1.  **Conectar Repo**: Conecta tu repositorio de GitHub a Vercel.
2.  **Configurar Variables de Entorno (Settings > Environment Variables)**:
    *   `EVOLUTION_API_URL`: El link de tu espacio en Hugging Face.
    *   `EVOLUTION_API_KEY`: La misma clave que pusiste en Hugging Face.
    *   `EVOLUTION_INSTANCE`: Un nombre para tu bot (ej: `BotFusa`).
3.  **Desplegar**: Vercel detectará el archivo `vercel.json` y configurará las rutas automáticamente.

---

## 📡 3. Vinculación Final (WhatsApp)

Una vez que ambos servidores digan "Running":

1.  **Entra a tu link de Vercel**.
2.  Ve a la pestaña **"Conectar WhatsApp"**.
3.  Pulsa el botón **"Obtener Código QR"**.
4.  Escanea el código con tu celular (WhatsApp > Dispositivos Vinculados).
5.  **¡Listo!** Tu número ahora responderá automáticamente a los pasajeros de Fusa.

---

## 🚗 4. Registro de Conductores
Para que los conductores aparezcan en tu mapa azul:

1.  Diles que entren a: `https://tu-proyecto.vercel.app/driver`.
2.  Pídeles el **Código de 4 dígitos** que les aparece.
3.  En tu Panel Administrativo, ve a **"Gestionar Flota"** e ingresa el código junto con sus datos.
4.  El GPS del conductor se vinculará instantáneamente a tu mapa.

---

## 🛠️ Notas Técnicas y Mantenimiento

*   **Persistencia**: Como usamos la versión de prototipo, los datos de los conductores en Vercel se reinician si el sitio no se usa. Para producción real, se recomienda conectar una base de datos **Supabase** (PostgreSQL).
*   **Actualizaciones**: Cada vez que hagas `git push` a tu repositorio, Vercel actualizará el Dashboard automáticamente sin que tengas que hacer nada.
*   **Mapa de Calor**: Se activa/desactiva desde el menú lateral. Las zonas rojas indican dónde hay más de 3 pasajeros pidiendo viaje simultáneamente.

---
*Hecho por Gemini CLI para el proyecto ProtoUber Fusagasugá.*
