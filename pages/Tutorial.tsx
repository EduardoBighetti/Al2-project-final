import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  PlayCircle,
  MessageSquare,
  ShieldAlert,
  CheckCircle2,
  Bot,
  Phone,
  HelpCircle,
  Activity,
  Cpu,
  Monitor,
  LayoutDashboard,
  Code,
} from "lucide-react";
import { useTour, TourType } from "../contexts/TourContext";
import { useNavigate } from "react-router-dom";

export const Tutorial = () => {
  const { startTour } = useTour();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"tour" | "telegram" | "whatsapp" | "code">(
    "tour",
  );

  const startSpecificTour = (type: TourType, route: string) => {
    navigate(route);
    setTimeout(() => startTour(type), 1000); // Give enough time for route change and DOM paints
  };

  return (
    <div className="max-w-5xl mx-auto pb-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
          <HelpCircle className="text-blue-500" /> Tutorial & Ajuda
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          Aprenda a utilizar o sistema, configure alertas no seu celular e
          entenda todas as ferramentas disponíveis.
        </p>
      </div>

      <div className="flex flex-wrap gap-4 mb-8">
        <button
          onClick={() => setActiveTab("tour")}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
            activeTab === "tour"
              ? "bg-blue-600 text-white shadow-md"
              : "bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700"
          }`}
        >
          <PlayCircle size={18} /> Guias Interativos
        </button>
        <button
          onClick={() => setActiveTab("telegram")}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
            activeTab === "telegram"
              ? "bg-[#0088cc] text-white shadow-md"
              : "bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700"
          }`}
        >
          <Bot size={18} /> Alertas no Telegram
        </button>
        <button
          onClick={() => setActiveTab("whatsapp")}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
            activeTab === "whatsapp"
              ? "bg-[#25D366] text-white shadow-md"
              : "bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700"
          }`}
        >
          <MessageSquare size={18} /> Alertas no WhatsApp
        </button>
        <button
          onClick={() => setActiveTab("code")}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
            activeTab === "code"
              ? "bg-purple-600 text-white shadow-md"
              : "bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700"
          }`}
        >
          <Code size={18} /> Código (ESP32)
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "tour" && (
          <motion.div
            key="tour"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-gray-200 dark:border-slate-700 shadow-sm"
          >
            <div className="flex flex-col gap-8">
              <div>
                <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
                  Guias de Navegação (Tours)
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                  Faça um tour guiado pela interface geral do sistema ou explore
                  as funções específicas de cada aba de forma detalhada.
                </p>
              </div>

              {/* Tour Geral */}
              <div className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-gray-100 dark:border-slate-700 flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                  <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2 mb-2">
                    <Monitor className="text-blue-500" size={20} />
                    Tour Externo (Navegação Geral)
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Apresentação básica do menu lateral e onde encontrar cada
                    funcionalidade principal.
                  </p>
                </div>
                <button
                  onClick={() => startTour("global")}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg shadow-blue-500/30 whitespace-nowrap shrink-0"
                >
                  <PlayCircle size={18} /> Iniciar Geral
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Dashboard Tour */}
                <div className="p-6 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 hover:shadow-md transition-shadow">
                  <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 flex items-center justify-center mb-4">
                    <LayoutDashboard size={20} />
                  </div>
                  <h3 className="font-bold text-gray-800 dark:text-white mb-2">
                    Dashboard
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                    Aprenda a visualizar médias agrupadas, gerar gráficos
                    agregados e emitir relatórios em PDF.
                  </p>
                  <button
                    onClick={() => startSpecificTour("dashboard", "/dashboard")}
                    className="w-full px-4 py-2 bg-indigo-50 dark:bg-indigo-900/10 hover:bg-indigo-100 dark:hover:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg font-bold text-sm transition-all"
                  >
                    Tour Interno
                  </button>
                </div>

                {/* Monitoramento Tour */}
                <div className="p-6 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 hover:shadow-md transition-shadow">
                  <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 text-orange-600 flex items-center justify-center mb-4">
                    <Activity size={20} />
                  </div>
                  <h3 className="font-bold text-gray-800 dark:text-white mb-2">
                    Monitoramento
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                    Descubra como ver dados em tempo real, status de conexão e
                    localização na planta baixa.
                  </p>
                  <button
                    onClick={() =>
                      startSpecificTour("monitoring", "/monitoring")
                    }
                    className="w-full px-4 py-2 bg-orange-50 dark:bg-orange-900/10 hover:bg-orange-100 dark:hover:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-lg font-bold text-sm transition-all"
                  >
                    Tour Interno
                  </button>
                </div>

                {/* Dispositivos Tour */}
                <div className="p-6 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 hover:shadow-md transition-shadow">
                  <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 flex items-center justify-center mb-4">
                    <Monitor size={20} />
                  </div>
                  <h3 className="font-bold text-gray-800 dark:text-white mb-2">
                    Dispositivos
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                    Saiba como cadastrar hardwares, definir limites de
                    temperatura e gerenciar sua frota.
                  </p>
                  <button
                    onClick={() => startSpecificTour("devices", "/devices")}
                    className="w-full px-4 py-2 bg-green-50 dark:bg-green-900/10 hover:bg-green-100 dark:hover:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg font-bold text-sm transition-all"
                  >
                    Tour Interno
                  </button>
                </div>

                {/* Arduino Tour */}
                <div className="p-6 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 hover:shadow-md transition-shadow">
                  <div className="w-10 h-10 rounded-lg bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 flex items-center justify-center mb-4">
                    <Cpu size={20} />
                  </div>
                  <h3 className="font-bold text-gray-800 dark:text-white mb-2">
                    Integração Arduino
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                    Entenda como usar a Serial Monitor pela web e enviar
                    comandos direto do navegador.
                  </p>
                  <button
                    onClick={() => startSpecificTour("arduino", "/arduino")}
                    className="w-full px-4 py-2 bg-cyan-50 dark:bg-cyan-900/10 hover:bg-cyan-100 dark:hover:bg-cyan-900/20 text-cyan-600 dark:text-cyan-400 rounded-lg font-bold text-sm transition-all"
                  >
                    Tour Interno
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "telegram" && (
          <motion.div
            key="telegram"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-gray-200 dark:border-slate-700 shadow-sm"
          >
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6">
              Configuração do CallMeBot (Telegram)
            </h2>

            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black flex-shrink-0">
                  1
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 dark:text-white text-lg">
                    Adicione o Bot
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Abra o Telegram e busque por <strong>@CallMeBot_API</strong>{" "}
                    ou adicione o contato <strong>+34 627 04 29 17</strong>.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black flex-shrink-0">
                  2
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 dark:text-white text-lg">
                    Inicie e Autorize
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Envie a mensagem{" "}
                    <code className="bg-gray-100 dark:bg-slate-900 px-2 py-1 rounded text-blue-500 font-mono">
                      /start
                    </code>{" "}
                    para o bot.
                  </p>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Em seguida, envie a mensagem{" "}
                    <code className="bg-gray-100 dark:bg-slate-900 px-2 py-1 rounded text-blue-500 font-mono">
                      /apikey
                    </code>
                    . O bot irá te responder com a sua API Key (uma sequência de
                    números e letras).
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black flex-shrink-0">
                  3
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 dark:text-white text-lg">
                    Configure no Sistema
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Vá até o menu <strong>Configurações</strong> e preencha seu
                    número de telefone com DDI (Ex: +5511999999999).
                  </p>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    O seu ESP32 precisará dessa API Key no código fonte para
                    disparar as mensagens diretamente.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl flex gap-3">
              <ShieldAlert className="text-amber-500 flex-shrink-0" />
              <p className="text-sm text-amber-700 dark:text-amber-400">
                <strong>Atenção:</strong> Nunca compartilhe sua API Key do
                CallMeBot com terceiros. Ela é pessoal e intransferível.
              </p>
            </div>
          </motion.div>
        )}

        {activeTab === "whatsapp" && (
          <motion.div
            key="whatsapp"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-gray-200 dark:border-slate-700 shadow-sm"
          >
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6">
              Configuração do CallMeBot (WhatsApp)
            </h2>

            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center font-black flex-shrink-0">
                  1
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 dark:text-white text-lg">
                    Adicione o Contato
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Adicione o número <strong>+34 629 51 46 22</strong> na sua
                    agenda de contatos (ou clique no link oficial do CallMeBot).
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center font-black flex-shrink-0">
                  2
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 dark:text-white text-lg">
                    Obtenha a API Key
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Envie a mensagem{" "}
                    <code className="bg-gray-100 dark:bg-slate-900 px-2 py-1 rounded text-green-500 font-mono">
                      I allow callmebot to send me messages
                    </code>{" "}
                    para o contato via WhatsApp.
                  </p>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    O bot irá responder com "API key for your number is:
                    XXXXXX". Anote este código.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center font-black flex-shrink-0">
                  3
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 dark:text-white text-lg">
                    Integração
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Certifique-se de configurar seu número com DDI (Ex:
                    +5511999999999) no perfil do sistema.
                  </p>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    No seu firmware (ESP32), substitua a variável da API Key
                    pelo código recebido.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 p-4 bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700 rounded-xl flex gap-3 items-center">
              <Phone className="text-slate-400 flex-shrink-0" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Dica: Adicione o número do bot aos seus favoritos para garantir
                que as notificações façam som mesmo em modo "Não Perturbe".
              </p>
            </div>
          </motion.div>
        )}

        {activeTab === "code" && (
          <motion.div
            key="code"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-gray-200 dark:border-slate-700 shadow-sm"
          >
            <div className="flex flex-col gap-8">
              <div>
                <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
                  Integração do Código (ESP32)
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                  Siga os passos abaixo para configurar o código no seu microcontrolador (ESP32) e conectá-lo corretamente ao nosso sistema, enviando e recebendo dados em tempo real.
                </p>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center font-black flex-shrink-0">
                  1
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 dark:text-white text-lg">
                    Requisitos e Bibliotecas
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Certifique-se de ter as seguintes bibliotecas instaladas na sua IDE (ex: Arduino IDE ou VSCode com PlatformIO):
                  </p>
                  <ul className="list-disc pl-5 mt-2 text-gray-600 dark:text-gray-400 space-y-1">
                    <li><code className="bg-gray-100 dark:bg-slate-900 px-1 py-0.5 rounded text-purple-500 font-mono text-sm">WiFi.h</code> (Para conexão do ESP32 à internet)</li>
                    <li><code className="bg-gray-100 dark:bg-slate-900 px-1 py-0.5 rounded text-purple-500 font-mono text-sm">HTTPClient.h</code> (Para requisições à API do sistema)</li>
                    <li><code className="bg-gray-100 dark:bg-slate-900 px-1 py-0.5 rounded text-purple-500 font-mono text-sm">ArduinoJson.h</code> (Para manipulação de dados em JSON)</li>
                  </ul>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center font-black flex-shrink-0">
                  2
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 dark:text-white text-lg">
                    Configuração de WiFi e Endpoint (URL)
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mt-1 mb-2">
                    No início do seu código, você deve preencher o nome da sua rede WiFi e a senha, bem como a URL pública gerada para a sua API:
                  </p>
                  <pre className="bg-slate-900 text-slate-300 p-4 rounded-xl overflow-x-auto text-sm border border-slate-700 whitespace-pre">
                    <code>{`const char* ssid = "NOME_DA_REDE";
const char* password = "SENHA_DA_REDE";

// URL EXATA PARA O FIRESTORE (A que sempre funcionou!)
// Envia os dados direto para o banco de dados sem bloqueios do AI Studio.
const char* firestoreReadingsUrl = "https://firestore.googleapis.com/v1/projects/gen-lang-client-0517069904/databases/ai-studio-fcb91bed-d540-4bd5-8d9e-5bc840091e07/documents:commit";`}</code>
                  </pre>
                  <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/50 rounded-lg flex gap-2 text-sm text-yellow-800 dark:text-yellow-200">
                    <span className="font-bold shrink-0">💡 Dica de Ouro:</span>
                    <p>
                      Sempre use a URL direta do Firestore acima no seu ESP32. O sistema do painel já possui a "Inteligência do Monitor Global" que detecta o novo dado na tabela e automaticamente deixa o sensor <strong>Online</strong>.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center font-black flex-shrink-0">
                  3
                </div>
                <div className="flex-1 w-full max-w-full overflow-hidden">
                  <h3 className="font-bold text-gray-800 dark:text-white text-lg">
                    Enviando Dados para a API
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mt-1 mb-2">
                    O ESP32 envia os dados via HTTP POST diretamente para o banco de dados. O envio simples resolve o erro 400!
                  </p>
                  <pre className="bg-slate-900 text-slate-300 p-4 rounded-xl overflow-x-auto text-sm border border-slate-700 whitespace-pre">
                    <code>{`// O identifier DEVE ser EXATAMENTE igual ao "ID / MAC" cadastrado no painel!
String identifier = "ESP32";
float temperature = 25.4;
float humidity = 60.2;

// Se a temperatura falhar, não enviar (evita Erro 400)
if (isnan(temperature) || isnan(humidity)) {
  Serial.println("Falha na leitura! Ignorando envio.");
  return;
}

// A URL exata para garantir os dados e horário em tempo real
String commitUrl = "https://firestore.googleapis.com/v1/projects/gen-lang-client-0517069904/databases/ai-studio-fcb91bed-d540-4bd5-8d9e-5bc840091e07/documents:commit";

// Se a temperatura falhar, não enviar (evita Erro 400)
if (isnan(temperature) || isnan(humidity)) {
  Serial.println("Falha na leitura! Ignorando envio.");
  return;
}

// Gerar ID único para o documento
String readingId = String(random(1000000)) + String(random(1000000));
String docPath = "projects/gen-lang-client-0517069904/databases/ai-studio-fcb91bed-d540-4bd5-8d9e-5bc840091e07/documents/sensor_readings/" + readingId;

// FORMATO JSON COM TIMESTAMP DO SERVIDOR DO GOOGLE
String jsonBody = "{\\"writes\\":[";
jsonBody += "{\\"update\\":{\\"name\\":\\"" + docPath + "\\",\\"fields\\":{\\"sensor_identifier\\":{\\"stringValue\\":\\"" + identifier + "\\"},\\"temperature\\":{\\"doubleValue\\":" + String(temperature) + "},\\"humidity\\":{\\"doubleValue\\":" + String(humidity) + "}}}},";
jsonBody += "{\\"transform\\":{\\"document\\":\\"" + docPath + "\\",\\"fieldTransforms\\":[{\\"fieldPath\\":\\"created_at\\",\\"setToServerValue\\":\\"REQUEST_TIME\\"}]}}";
jsonBody += "]}";

HTTPClient http;
http.begin(commitUrl);
http.addHeader("Content-Type", "application/json");
int responseCode = http.POST(jsonBody);

Serial.print("Resposta da API (200 = Sucesso): ");
Serial.println(responseCode);
http.end();`}</code>
                  </pre>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center font-black flex-shrink-0">
                  4
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 dark:text-white text-lg">
                    Aba "Integração Arduino"
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Na barra lateral do sistema, acesse a página de <strong>Integração Arduino</strong>. Lá você tem um ambiente via porta Serial pelo navegador (Web Serial API). 
                    Ao conectar o ESP32 no USB do seu computador, você poderá monitorar os logs (Serial.print) e enviar comandos diretamente do sistema para testes.
                  </p>
                </div>
              </div>

            </div>

            <div className="mt-8 p-4 bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700 rounded-xl flex gap-3 items-center">
              <Code className="text-purple-500 flex-shrink-0" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Lembre-se: Você precisa ter cadastrado um dispositivo na aba "Dispositivos" antes de começar a enviar dados, para que os IDs coincidam e o painel exiba tudo corretamente.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
