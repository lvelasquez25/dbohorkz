const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const QRCode = require('qrcode');
const axios = require('axios');
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

const FLASK_API_URL = process.env.FLASK_API_URL || 'http://localhost:5000';

// QR actual para mostrarlo por web
let currentQR = null;
let isReady = false;

// Si el contenedor anterior se detuvo sin cerrar Chromium, queda un bloqueo en el perfil
// guardado que impide arrancar ("profile appears to be in use by another Chromium process").
const SESSION_DIR = path.join(__dirname, '.wwebjs_auth', 'session');
for (const lock of ['SingletonLock', 'SingletonCookie', 'SingletonSocket']) {
  fs.rmSync(path.join(SESSION_DIR, lock), { force: true });
}

// Inicializar cliente WhatsApp con configuración para Docker
const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium-browser',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
      '--disable-gpu'
    ]
  }
});

// Eventos del cliente
client.on('qr', async (qr) => {
  console.log('📱 QR Code generado — visita /api/qr para escanearlo');
  qrcode.generate(qr, { small: true });
  // Guardar QR como imagen base64 para servirlo por web
  try {
    currentQR = await QRCode.toDataURL(qr);
  } catch (e) {
    console.error('Error generando QR imagen:', e.message);
  }
});

client.on('ready', () => {
  console.log('✅ Cliente WhatsApp conectado');
  isReady = true;
  currentQR = null;
});

client.on('authenticated', () => {
  console.log('🔐 Autenticado exitosamente');
});

client.on('auth_failure', (msg) => {
  console.error('❌ Error de autenticación:', msg);
  isReady = false;
});

client.on('disconnected', (reason) => {
  console.log('⚠️ Cliente desconectado:', reason);
  isReady = false;
});

// Procesar mensajes entrantes
client.on('message_create', async (message) => {
  if (message.fromMe) return;

  const phoneNumber = message.from;
  const userMessage = message.body;

  console.log(`📨 Mensaje de ${phoneNumber}: ${userMessage}`);

  try {
    const response = await axios.post(`${FLASK_API_URL}/api/chatbot/message`, {
      message: userMessage,
      user_id: phoneNumber,
      platform: 'whatsapp'
    });

    const botResponse = response.data.bot_response;

    // Simular escritura
    await new Promise(r => setTimeout(r, parseInt(process.env.TYPING_DELAY) || 1000));

    await message.reply(botResponse);
    console.log(`✉️  Respuesta enviada a ${phoneNumber}`);

  } catch (error) {
    console.error('Error procesando mensaje:', error.message);
    if (isReady) {
      await message.reply(
        'Disculpa, hubo un error. Por favor escríbenos al 314 218 70 98.'
      );
    }
  }
});

// --- Rutas REST ---

// Mostrar QR code en el navegador para escanearlo
app.get('/api/qr', (req, res) => {
  if (isReady) {
    return res.send('<h2 style="font-family:sans-serif;color:green">✅ WhatsApp ya está conectado</h2>');
  }
  if (!currentQR) {
    return res.send('<h2 style="font-family:sans-serif">⏳ Generando QR, recarga en unos segundos...</h2>');
  }
  res.send(`
    <!DOCTYPE html>
    <html>
      <head><title>WhatsApp QR - dbohorkz</title></head>
      <body style="font-family:sans-serif;text-align:center;padding:40px">
        <h2>Escanea este QR con WhatsApp</h2>
        <p>Abre WhatsApp → Dispositivos vinculados → Vincular dispositivo</p>
        <img src="${currentQR}" style="width:300px;height:300px" />
        <p><small>Esta página se actualiza automáticamente</small></p>
        <script>setTimeout(() => location.reload(), 30000)</script>
      </body>
    </html>
  `);
});

app.get('/api/health', (req, res) => {
  res.json({
    status: isReady ? 'connected' : 'disconnected',
    timestamp: new Date()
  });
});

app.get('/api/info', (req, res) => {
  res.json({
    service: 'WhatsApp Chatbot Service — dbohorkz',
    version: '1.0.0',
    status: isReady ? 'ready' : 'initializing',
    flask_api: FLASK_API_URL
  });
});

app.post('/api/send-message', async (req, res) => {
  const { phone, message } = req.body;

  if (!phone || !message) {
    return res.status(400).json({ error: 'phone y message son requeridos' });
  }
  if (!isReady) {
    return res.status(503).json({ error: 'Cliente WhatsApp no está listo' });
  }

  try {
    const chatId = phone.includes('@') ? phone : `${phone}@c.us`;
    await client.sendMessage(chatId, message);
    res.json({ success: true, phone, message, sent_at: new Date() });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Iniciar servidor
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Servidor WhatsApp corriendo en puerto ${PORT}`);
});

// Iniciar cliente WhatsApp
client.initialize();

process.on('SIGINT', async () => {
  console.log('\n🛑 Cerrando cliente...');
  await client.destroy();
  process.exit(0);
});
