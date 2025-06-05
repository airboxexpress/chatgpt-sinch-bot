const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());

// Variables de entorno (Railway las cargará automáticamente)
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const SINCH_API_TOKEN = process.env.SINCH_API_TOKEN;
const SINCH_NUMBER = process.env.SINCH_NUMBER; // Ej: +5076XXXXXXX

// Ruta de prueba (GET)
app.get('/', (req, res) => {
  res.send('✅ Webhook de ChatGPT conectado a Sinch y corriendo en Railway.');
});

// Ruta de Sinch Webhook (POST)
app.post('/webhook', async (req, res) => {
  try {
    const { message, from } = req.body;

    if (!message || !from) {
      console.log("❌ Error: mensaje o remitente faltante");
      return res.status(400).send('Datos faltantes');
    }

    console.log(`📩 Mensaje recibido de ${from}: ${message}`);

    // Llamada a OpenAI
    const openaiResponse = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: message }]
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const respuesta = openaiResponse.data.choices[0].message.content.trim();

    console.log(`🤖 Respuesta generada: ${respuesta}`);

    // Enviar respuesta por WhatsApp usando Sinch
    await axios.post(
      `https://whatsapp.api.sinch.com/xms/v1/${SINCH_NUMBER}/batches`,
      {
        to: [from],
        body: respuesta
      },
      {
        headers: {
          'Authorization': `Bearer ${SINCH_API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    res.sendStatus(200);
  } catch (err) {
    console.error("🔥 Error en el webhook:", err.response?.data || err.message);
    res.sendStatus(500);
  }
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
