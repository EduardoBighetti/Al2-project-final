
import express from 'express';
import cors from 'cors';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, query, where, getDocs, Timestamp, limit, doc, getDoc, updateDoc } from 'firebase/firestore';
import fs from 'fs';

// Read firebase config
const firebaseConfig = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'firebase-applet-config.json'), 'utf-8'));

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);

// Simple anti-spam: store last SMS timestamp per sensor
const lastSmsSent: Record<string, number> = {};
const SMS_COOLDOWN = 3600000; // 1 hour in ms

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // --- API ROUTES FOR ARDUINO ---

  /**
   * Endpoint para o Arduino enviar dados
   * POST /api/sensor/data
   * Body: { "identifier": "SN-001", "token": "...", "temperature": 25.5, "humidity": 60 }
   */
  app.post('/api/sensor/data', async (req, res) => {
    const { identifier, token, temperature, humidity, latitude, longitude } = req.body;

    if (!identifier || !token || temperature === undefined || humidity === undefined) {
      return res.status(400).json({ error: 'Dados incompletos. Requer: identifier, token, temperature, humidity' });
    }

    try {
      // 1. Validar o sensor e o token
      const sensorsRef = collection(db, 'sensors');
      const q = query(sensorsRef, where('identifier', '==', identifier), limit(1));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return res.status(404).json({ error: 'Sensor não encontrado.' });
      }

      const sensorDoc = querySnapshot.docs[0];
      const sensorData = sensorDoc.data();

      // Verificar token (segurança simples)
      if (sensorData.token !== token) {
        return res.status(401).json({ error: 'Token de autenticação inválido.' });
      }

      // 2. Registrar a leitura
      const readingsRef = collection(db, 'sensors', sensorDoc.id, 'readings');
      const newReading = {
        sensor_id: sensorData.id,
        temperature: Number(temperature),
        humidity: Number(humidity),
        created_at: Timestamp.now().toDate().toISOString()
      };

      await addDoc(readingsRef, newReading);
      
      // Atualizar status para 'active' e registrar última conexão
      const updatePayload: any = {
        status: 'active',
        last_seen: Timestamp.now().toDate().toISOString()
      };

      // Se o módulo enviou GPS dinâmico, atualizamos no sensor
      if (latitude !== undefined && longitude !== undefined) {
        updatePayload.latitude = Number(latitude);
        updatePayload.longitude = Number(longitude);
      }

      await updateDoc(sensorDoc.ref, updatePayload);
      
      // Também adicionar na coleção global para facilitar queries do dashboard
      await addDoc(collection(db, 'sensor_readings'), {
        ...newReading,
        sensor_identifier: identifier
      });

      // 3. Verificar limite de temperatura e registrar no console
      if (sensorData.temp_limit && Number(temperature) > sensorData.temp_limit) {
        console.log(`[Alert] Temperatura crítica no sensor ${identifier}: ${temperature}°C (Limite: ${sensorData.temp_limit}°C)`);
      }

      console.log(`[IoT] Dados recebidos do sensor ${identifier}: ${temperature}°C, ${humidity}%`);
      
      res.json({ success: true, message: 'Dados registrados com sucesso.' });
    } catch (error: any) {
      console.error('[IoT Error]', error);
      res.status(500).json({ error: 'Erro interno ao processar dados do sensor.' });
    }
  });

  // --- VITE MIDDLEWARE ---

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
