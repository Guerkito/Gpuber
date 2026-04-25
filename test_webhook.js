async function testFlow() {
    const url = 'http://localhost:3000/webhook';

    console.log('--- Simulando Pasajero: "Hola" ---');
    try {
        await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                event: 'messages.upsert',
                data: {
                    key: { remoteJid: '573102223344@s.whatsapp.net', fromMe: false },
                    pushName: 'Esteban',
                    message: { conversation: 'Hola' }
                }
            })
        });

        console.log('--- Simulando Pasajero: Envia Ubicación ---');
        await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                event: 'messages.upsert',
                data: {
                    key: { remoteJid: '573102223344@s.whatsapp.net', fromMe: false },
                    pushName: 'Esteban',
                    message: {
                        locationMessage: {
                            degreesLatitude: 4.338,
                            degreesLongitude: -74.365
                        }
                    }
                }
            })
        });
    } catch (err) {
        console.error('❌ Error en prueba:', err.message);
    }
}

testFlow().then(() => console.log('✅ Prueba completada')).catch(err => console.error('❌ Error en prueba:', err.message));
