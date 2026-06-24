
# 🚀 Guia de Integração AL2 IoT (Final e Completo)

Este documento contém tudo o que você precisa para conectar o hardware ao sistema.

## 1. Estrutura do Banco de Dados (MySQL)

```sql
CREATE DATABASE IF NOT EXISTS al2_iot;
USE al2_iot;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    full_name VARCHAR(100),
    email VARCHAR(100),
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('gerencia', 'admin', 'user') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sensors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    identifier VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100),
    status ENUM('active', 'offline') DEFAULT 'offline',
    last_seen TIMESTAMP NULL,
    latitude FLOAT DEFAULT NULL,
    longitude FLOAT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE readings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sensor_id INT NOT NULL,
    temperature FLOAT,
    humidity FLOAT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sensor_id) REFERENCES sensors(id) ON DELETE CASCADE
);
```

---

## 2. Servidor Backend (Python + FastAPI)

Salve como `main.py`.

```python
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import mysql.connector
from datetime import datetime

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- CONFIGURAÇÕES ---
DB_CONFIG = {
    "host": "localhost",
    "user": "root",
    "password": "SUA_SENHA_AQUI",
    "database": "al2_iot"
}

def get_db():
    db = mysql.connector.connect(**DB_CONFIG)
    try: yield db
    finally: db.close()

# --- MODELOS ---
class SensorCreate(BaseModel):
    identifier: str
    name: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class ArduinoData(BaseModel):
    identifier: str
    temperature: float
    humidity: float

# --- ROTAS DE SENSORES ---

@app.get("/api/sensors")
def list_sensors(db=Depends(get_db)):
    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT * FROM sensors")
    return cursor.fetchall()

@app.post("/api/sensors")
def create_sensor(sensor: SensorCreate, db=Depends(get_db)):
    cursor = db.cursor()
    try:
        sql = "INSERT INTO sensors (identifier, name, latitude, longitude) VALUES (%s, %s, %s, %s)"
        val = (sensor.identifier, sensor.name, sensor.latitude, sensor.longitude)
        cursor.execute(sql, val)
        db.commit()
        return {"id": cursor.lastrowid, **sensor.dict()}
    except mysql.connector.Error as err:
        raise HTTPException(status_code=400, detail=f"Erro ao cadastrar: {err}")

@app.delete("/api/sensors/{sensor_id}")
def delete_sensor(sensor_id: int, db=Depends(get_db)):
    cursor = db.cursor()
    cursor.execute("DELETE FROM sensors WHERE id = %s", (sensor_id,))
    db.commit()
    return {"status": "deleted"}

# --- ROTA PARA O ARDUINO ---

@app.post("/api/arduino/data")
def receive_arduino_data(data: ArduinoData, db=Depends(get_db)):
    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT id FROM sensors WHERE identifier = %s", (data.identifier,))
    sensor = cursor.fetchone()
    
    if not sensor:
        raise HTTPException(status_code=404, detail="Sensor não cadastrado.")

    sensor_id = sensor['id']
    now = datetime.now()
    cursor.execute("UPDATE sensors SET status = 'active', last_seen = %s WHERE id = %s", (now, sensor_id))
    cursor.execute("INSERT INTO readings (sensor_id, temperature, humidity, created_at) VALUES (%s, %s, %s, %s)",
                   (sensor_id, data.temperature, data.humidity, now))
    db.commit()
    return {"status": "success"}

@app.get("/api/readings")
def get_readings(sensorId: Optional[int] = None, db=Depends(get_db)):
    cursor = db.cursor(dictionary=True)
    if sensorId:
        cursor.execute("SELECT * FROM readings WHERE sensor_id = %s ORDER BY created_at DESC LIMIT 50", (sensorId,))
    else:
        cursor.execute("SELECT * FROM readings ORDER BY created_at DESC LIMIT 100")
    return cursor.fetchall()
```

---

## 3. Código do Arduino (C++ / ESP32)
[Mantenha o código do Arduino do passo anterior]
