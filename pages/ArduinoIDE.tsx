import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Cpu,
  Terminal,
  Wifi,
  WifiOff,
  Send,
  Copy,
  Check,
  AlertTriangle,
  Activity,
  CloudUpload,
  Zap,
  Code2,
} from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";
import { useSerial } from "../contexts/SerialContext";
import Prism from "prismjs";
import {
  AreaChart,
  Area,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import "prismjs/components/prism-clike";
import "prismjs/components/prism-c";
import "prismjs/components/prism-cpp";
import "prismjs/components/prism-arduino";
import "prismjs/themes/prism-tomorrow.css";

const HARDWARE_CODE = `/* ESP32 Wi-Fi + DHT22 + GPS + REST API
   Conecte seu hardware e envie os dados para a plataforma.
*/
#include <WiFi.h>
#include <HTTPClient.h>
#include <Adafruit_Sensor.h>
#include <DHT.h>

// --- CONFIGURAÇÃO WI-FI ---
const char* ssid = "SEU_WIFI_NOME";
const char* password = "SUA_WIFI_SENHA";

// URL EXATA PARA O FIRESTORE (A que sempre funcionou!)
// Envia os dados direto para o banco de dados sem bloqueios do AI Studio.
const char* firestoreReadingsUrl = "https://firestore.googleapis.com/v1/projects/gen-lang-client-0517069904/databases/ai-studio-fcb91bed-d540-4bd5-8d9e-5bc840091e07/documents:commit";

// --- CONFIGURAÇÃO SENSOR ---
#define DHTPIN 4
#define DHTTYPE DHT22
const char* sensorID = "ESP32"; // ID do Hardware cadastrado

DHT dht(DHTPIN, DHTTYPE);

void setup() {
  Serial.begin(115200);
  dht.begin();
  pinMode(2, OUTPUT);
  
  Serial.println("--- Sistema IoT Iniciado ---");
  
  // Conexão Wi-Fi
  WiFi.begin(ssid, password);
  Serial.print("Conectando ao Wi-Fi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\\nWiFi Conectado!");
  Serial.print("IP: "); Serial.println(WiFi.localIP());

  // Obter tempo NTP para o Timestamp (Opcional, mas recomendado)
  configTime(0, 0, "pool.ntp.org");
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    float t = dht.readTemperature();
    float h = dht.readHumidity();

    if (!isnan(t) && !isnan(h)) {
      // Monitor Local
      Serial.print("Temp: "); Serial.print(t);
      Serial.print("°C | Hum: "); Serial.print(h); Serial.println("%");
      
      // Pisca LED indicando leitura
      digitalWrite(2, HIGH); delay(50); digitalWrite(2, LOW);

      // A URL exata para garantir os dados e horário em tempo real
String commitUrl = "https://firestore.googleapis.com/v1/projects/gen-lang-client-0517069904/databases/ai-studio-fcb91bed-d540-4bd5-8d9e-5bc840091e07/documents:commit";

// Se a temperatura falhar, não enviar (evita Erro 400)
if (isnan(t) || isnan(h)) {
  Serial.println("Falha na leitura! Ignorando envio.");
  return;
}

// Gerar ID único para o documento
String readingId = String(random(1000000)) + String(random(1000000));
String docPath = "projects/gen-lang-client-0517069904/databases/ai-studio-fcb91bed-d540-4bd5-8d9e-5bc840091e07/documents/sensor_readings/" + readingId;

// FORMATO JSON COM TIMESTAMP DO SERVIDOR DO GOOGLE
String jsonBody = "{\\"writes\\":[";
jsonBody += "{\\"update\\":{\\"name\\":\\"" + docPath + "\\",\\"fields\\":{\\"sensor_identifier\\":{\\"stringValue\\":\\"" + String(sensorID) + "\\"},\\"temperature\\":{\\"doubleValue\\":" + String(t) + "},\\"humidity\\":{\\"doubleValue\\":" + String(h) + "}}}},";
jsonBody += "{\\"transform\\":{\\"document\\":\\"" + docPath + "\\",\\"fieldTransforms\\":[{\\"fieldPath\\":\\"created_at\\",\\"setToServerValue\\":\\"REQUEST_TIME\\"}]}}";
jsonBody += "]}";

HTTPClient http;
http.begin(commitUrl);
http.addHeader("Content-Type", "application/json");
int httpResponseCode = http.POST(jsonBody);
      
      if (httpResponseCode > 0) {
        Serial.print("Sincronizado! Resposta: "); Serial.println(httpResponseCode);
      } else {
        Serial.print("Falha na sincronização: "); Serial.println(httpResponseCode);
      }
      http.end();
    } else {
      Serial.println("Erro: Falha ao ler o sensor DHT22! Ignorando envio para evitar Erro 400.");
    }
  } else {
    Serial.println("Erro: Sem conexão Wi-Fi.");
  }

  delay(60000); // Envia a cada 60 segundos
}`;

export const ArduinoIDE: React.FC = () => {
  const { t } = useLanguage();
  const {
    isConnected,
    serialOutput,
    liveData,
    activePins,
    lastForwarded,
    connect,
    disconnect,
    send,
    clearLogs,
  } = useSerial();

  const [inputCommand, setInputCommand] = useState("");
  const [isSupported, setIsSupported] = useState(true);
  const [copied, setCopied] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [activeTab, setActiveTab] = useState<"code" | "terminal">("code");

  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!("serial" in navigator)) {
      setIsSupported(false);
    }
    Prism.highlightAll();
  }, []);

  useEffect(() => {
    if (activeTab === "code") {
      Prism.highlightAll();
    }
  }, [activeTab]);

  useEffect(() => {
    if (autoScroll && terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [serialOutput, autoScroll]);

  const handleSendToSerial = async () => {
    if (!inputCommand) return;
    await send(inputCommand);
    setInputCommand("");
  };

  const copyCode = () => {
    navigator.clipboard.writeText(HARDWARE_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isSupported) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm">
        <AlertTriangle
          size={64}
          className="text-amber-500 mb-6 animate-bounce"
        />
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-3">
          {t("arduino.not_supported")}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto leading-relaxed">
          O seu navegador não suporta a Web Serial API. Para conectar o hardware
          diretamente, recomendamos o uso de navegadores baseados no Chromium
          (como Google Chrome ou Edge) em desktop.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-gray-200 dark:border-slate-700 p-8 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-4 mb-2">
            <div className="p-3 bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-xl">
              <Cpu size={28} />
            </div>
            Integração de Hardware
          </h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium">
            Configure seu ESP32 com DHT22 e módulo GPS para sincronização via
            API REST.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto tour-arduino-serial">
          {isConnected ? (
            <button
              onClick={disconnect}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 border border-red-200 dark:border-red-500/30 rounded-xl font-bold transition-all hover:bg-red-100 dark:hover:bg-red-500/20"
            >
              <WifiOff size={18} />
              Desconectar Serial
            </button>
          ) : (
            <button
              onClick={connect}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 dark:bg-slate-700 text-white rounded-xl font-bold transition-all hover:bg-slate-800 dark:hover:bg-slate-600 shadow-xl shadow-slate-900/10 dark:shadow-none"
            >
              <Wifi size={18} />
              Conectar via USB
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Visualizer & Live Data */}
        <div className="lg:col-span-4 space-y-6">
          {/* Digital Twin */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-gray-200 dark:border-slate-700 p-8 shadow-sm flex flex-col items-center justify-center relative overflow-hidden h-[340px]">
            <div className="absolute top-6 left-6 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest flex items-center gap-2">
              <Activity size={14} /> Hardware Link
            </div>

            <div className="relative w-48 h-64 bg-slate-800 rounded-2xl border-[6px] border-slate-700 shadow-2xl flex flex-col items-center justify-center mt-6">
              <div className="w-24 h-24 bg-slate-900 rounded-xl border border-slate-600 flex items-center justify-center relative z-10 shadow-inner">
                <Cpu size={36} className="text-slate-400" />
                <div
                  className={`absolute top-2 right-2 w-2 h-2 rounded-full ${isConnected ? "bg-blue-500 animate-pulse" : "bg-red-500 opacity-50"}`}
                />
              </div>

              {/* Pins visualization */}
              <div className="absolute left-[-16px] top-1/2 -translate-y-1/2 flex flex-col gap-3">
                {[1, 2, 3, 4, 5].map((p) => (
                  <div
                    key={p}
                    className={`w-4 h-2.5 rounded-l-sm transition-colors ${activePins.includes(p) ? "bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.8)]" : "bg-slate-600"}`}
                  />
                ))}
              </div>
              <div className="absolute right-[-16px] top-1/2 -translate-y-1/2 flex flex-col gap-3">
                {[6, 7, 8, 9, 10].map((p) => (
                  <div
                    key={p}
                    className={`w-4 h-2.5 rounded-r-sm transition-colors ${activePins.includes(p) ? "bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.8)]" : "bg-slate-600"}`}
                  />
                ))}
              </div>

              <div className="absolute bottom-4 text-[10px] font-mono text-slate-500 bg-slate-900/80 px-3 py-1 rounded-full border border-slate-700">
                ESP32-WROOM
              </div>
            </div>

            <div className="absolute bottom-6 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider">
              {isConnected ? (
                <span className="text-green-500 flex items-center gap-1.5 bg-green-500/10 px-3 py-1.5 rounded-full">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping" />{" "}
                  Online
                </span>
              ) : (
                <span className="text-slate-400">Offline</span>
              )}
            </div>
          </div>

          {/* Live Chart */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-gray-200 dark:border-slate-700 p-6 shadow-sm h-[280px] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest flex items-center gap-2">
                <Activity size={14} /> Sinal em Tempo Real
              </div>
              {liveData.length > 0 && (
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-black text-blue-600 dark:text-blue-400">
                    {liveData[liveData.length - 1].value.toFixed(1)}
                  </span>
                  <span className="text-[10px] font-bold text-gray-400">
                    UN
                  </span>
                </div>
              )}
            </div>
            <div className="flex-1 w-full min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={liveData}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      border: "none",
                      borderRadius: "8px",
                      color: "#fff",
                      fontSize: "12px",
                    }}
                    itemStyle={{ color: "#60a5fa", fontWeight: "bold" }}
                    labelStyle={{ display: "none" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorValue)"
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right Column: Code & Console Tabs */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-800 rounded-3xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col h-[644px] tour-arduino-editor">
          {/* Tabs */}
          <div className="flex items-center p-2 bg-gray-50 dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700">
            <button
              onClick={() => setActiveTab("code")}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all flex-1 justify-center ${activeTab === "code" ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm border border-gray-200 dark:border-slate-700" : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-200/50 dark:hover:bg-slate-800/50"}`}
            >
              <Code2 size={16} /> Código Fonte (ESP32)
            </button>
            <button
              onClick={() => setActiveTab("terminal")}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all flex-1 justify-center ${activeTab === "terminal" ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm border border-gray-200 dark:border-slate-700" : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-200/50 dark:hover:bg-slate-800/50"}`}
            >
              <Terminal size={16} /> Terminal Serial
            </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 relative overflow-hidden">
            <AnimatePresence mode="wait">
              {activeTab === "code" ? (
                <motion.div
                  key="code"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="absolute inset-0 flex flex-col"
                >
                  <div className="flex-1 overflow-auto bg-[#1d1f21] p-4 text-sm font-mono scrollbar-thin scrollbar-thumb-slate-700">
                    <pre className="!bg-transparent !m-0 !p-0">
                      <code className="language-arduino">{HARDWARE_CODE}</code>
                    </pre>
                  </div>
                  <div className="p-4 bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 flex justify-between items-center">
                    <p className="text-xs text-gray-500 font-medium">
                      Adapte as credenciais Wi-Fi e os URLs no código antes de
                      gravar.
                    </p>
                    <button
                      onClick={copyCode}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg font-bold text-xs transition-colors"
                    >
                      {copied ? (
                        <Check size={14} className="text-green-500" />
                      ) : (
                        <Copy size={14} />
                      )}
                      {copied ? "Copiado!" : "Copiar Código"}
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="terminal"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="absolute inset-0 flex flex-col bg-[#0f111a]"
                >
                  <div className="px-4 py-3 bg-[#161925] border-b border-[#2a2e40] flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500 animate-pulse" : "bg-red-500 opacity-50"}`}
                      />
                      <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
                        {isConnected
                          ? "Porta Serial Aberta"
                          : "Aguardando Conexão..."}
                      </span>
                    </div>
                    <button
                      onClick={clearLogs}
                      className="text-slate-500 hover:text-white transition-colors text-xs font-bold px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700"
                    >
                      Limpar
                    </button>
                  </div>

                  <div
                    ref={terminalRef}
                    className="flex-1 overflow-auto p-4 space-y-1 font-mono text-[11px] scrollbar-thin scrollbar-thumb-slate-700"
                  >
                    {serialOutput.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-slate-500">
                        <Terminal size={32} className="mb-2 opacity-20" />
                        Sem registros no momento.
                      </div>
                    ) : (
                      serialOutput.map((log, i) => (
                        <div
                          key={i}
                          className="flex gap-3 hover:bg-white/5 p-0.5 rounded px-2 transition-colors"
                        >
                          <span className="text-slate-600 shrink-0">
                            [{log.split("]")[0] || i}]
                          </span>
                          <span
                            className={`${log.toLowerCase().includes("erro") || log.toLowerCase().includes("falha") ? "text-red-400" : "text-[#a6accd]"}`}
                          >
                            {log.split("]")[1] || log}
                          </span>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="p-3 bg-[#161925] border-t border-[#2a2e40] flex gap-2">
                    <input
                      type="text"
                      value={inputCommand}
                      onChange={(e) => setInputCommand(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" && handleSendToSerial()
                      }
                      placeholder="Comando >"
                      disabled={!isConnected}
                      className="flex-1 bg-[#0f111a] border border-[#2a2e40] text-[#a6accd] rounded-lg px-3 py-2 text-xs font-mono outline-none focus:border-blue-500 disabled:opacity-50"
                    />
                    <button
                      onClick={handleSendToSerial}
                      disabled={!isConnected || !inputCommand}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-bold disabled:opacity-50 hover:bg-blue-500 flex items-center gap-1.5"
                    >
                      <Send size={14} /> Enviar
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Sync Status Overlay */}
      <AnimatePresence>
        {lastForwarded && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-6 right-6 bg-slate-900 text-white p-4 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.3)] flex items-center gap-4 z-50 border border-slate-700"
          >
            <div className="p-2.5 bg-blue-500/20 text-blue-400 rounded-xl">
              <CloudUpload size={20} />
            </div>
            <div className="pr-2">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">
                Sincronizado
              </div>
              <div className="text-sm font-bold text-slate-200">
                {lastForwarded.id}: {lastForwarded.temp}°C
                {lastForwarded.hum && ` | Hum: ${lastForwarded.hum}%`}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
