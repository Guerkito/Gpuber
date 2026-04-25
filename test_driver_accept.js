async function testDriver() {
    const url = 'http://localhost:3000/webhook';

    console.log('--- Simulando Conductor: Acepta Viaje ("1") ---');
    try {
        await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                event: 'messages.upsert',
                data: {
                    key: { remoteJid: '573001112233@s.whatsapp.net', fromMe: false },
                    pushName: 'Juan Perez',
                    message: { conversation: '1' }
                }
            })
        });
    } catch (err) {
        console.error('❌ Error en prueba:', err.message);
    }
}

testDriver().then(() => console.log('✅ Prueba de conductor completada')).catch(err => console.error('❌ Error en prueba:', err.message));
