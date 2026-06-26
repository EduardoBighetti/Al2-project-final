import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import {
  Thermometer,
  Droplets,
  Clock,
  Wifi,
  WifiOff,
  Cpu,
  MapPin,
  Layers,
  Layout,
  Maximize2,
  Activity,
} from "lucide-react";
import { sensorService, readingService } from "../services/api";
import { Sensor, Reading } from "../types";
import { useLanguage } from "../contexts/LanguageContext";
import { getMagnitudeByKey } from "../utils/magnitudes";

// --- SUB-COMPONENTE: PLANTA BAIXA ---
interface FloorPlanProps {
  sensors: Sensor[];
  selectedId: string;
  onSelect: (id: string) => void;
}

const FloorPlan: React.FC<FloorPlanProps> = ({
  sensors,
  selectedId,
  onSelect,
}) => {
  return (
    <div className="relative w-full h-full bg-slate-50 dark:bg-slate-900 overflow-hidden border-2 border-slate-200 dark:border-slate-700 rounded-xl">
      {/* Imagem de Fundo (Planta Técnica) */}
      <div className="absolute inset-0 opacity-40 dark:opacity-20 pointer-events-none">
        {/* Grid técnico simulando a planta */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(#94a3b8 1px, transparent 1px), linear-gradient(90deg, #94a3b8 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        ></div>
        {/* Paredes simuladas da loja */}
        <div className="absolute top-[10%] left-[10%] right-[10%] bottom-[10%] border-4 border-slate-400 dark:border-slate-500 rounded-lg"></div>
        <div className="absolute top-[10%] left-[50%] w-1 h-[40%] bg-slate-400 dark:bg-slate-500"></div>
        <div className="absolute top-[50%] left-[10%] right-[50%] h-1 bg-slate-400 dark:border-slate-500"></div>

        {/* Labels de Setores */}
        <span className="absolute top-[15%] left-[15%] text-[10px] font-black text-slate-400 uppercase tracking-widest">
          Estoque Central
        </span>
        <span className="absolute top-[15%] right-[15%] text-[10px] font-black text-slate-400 uppercase tracking-widest">
          Setor Vendas A
        </span>
        <span className="absolute bottom-[15%] left-[15%] text-[10px] font-black text-slate-400 uppercase tracking-widest">
          Câmaras Frias
        </span>
        <span className="absolute bottom-[15%] right-[15%] text-[10px] font-black text-slate-400 uppercase tracking-widest">
          Check-out / Entrada
        </span>
      </div>

      {/* Mapeamento dos Sensores */}
      {sensors.map((sensor) => {
        if (sensor.floor_x === undefined || sensor.floor_y === undefined)
          return null;

        const isActive = sensor.id.toString() === selectedId;
        const statusColor =
          sensor.status === "active" ? "bg-green-500" : "bg-red-500";

        return (
          <motion.button
            key={sensor.id}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: isActive ? 1.25 : 1, opacity: 1 }}
            whileHover={{ scale: 1.3 }}
            onClick={() => onSelect(sensor.id.toString())}
            style={{ left: `${sensor.floor_x}%`, top: `${sensor.floor_y}%` }}
            className={`absolute transform -translate-x-1/2 -translate-y-1/2 group transition-all duration-300 ${isActive ? "z-20" : "z-10"}`}
          >
            {/* Ping Animado */}
            {sensor.status === "active" && (
              <span
                className={`absolute inset-0 rounded-full animate-ping opacity-75 ${statusColor} scale-150`}
              ></span>
            )}

            {/* LED principal */}
            <div
              className={`relative w-4 h-4 rounded-full border-2 border-white dark:border-slate-800 shadow-lg ${statusColor} ${isActive ? "ring-4 ring-blue-500/30" : ""}`}
            ></div>

            {/* Tooltip Hover */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap">
              <div className="bg-slate-800 text-white text-[10px] py-1 px-2 rounded-md shadow-xl border border-slate-700 font-bold uppercase tracking-wider">
                {sensor.name}
              </div>
            </div>
          </motion.button>
        );
      })}

      {/* Marca D'água da Planta */}
      <div className="absolute bottom-4 right-4 text-[10px] font-black text-slate-400/50 uppercase tracking-[0.2em] flex items-center gap-2">
        <Layout size={12} /> AL2 FLOOR_PLAN v1.0
      </div>
    </div>
  );
};

export const Monitoring: React.FC = () => {
  const { t, units, convertMagnitudeValue, getMagnitudeUnit, formatMagnitude } = useLanguage();
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [selectedSensorId, setSelectedSensorId] = useState<string>("");
  const [readings, setReadings] = useState<Reading[]>([]);
  const [loading, setLoading] = useState(false);

  const [chartFilter, setChartFilter] = useState<string>("both");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [useHistorical, setUseHistorical] = useState(false);
  const [historicalData, setHistoricalData] = useState<Reading[]>([]);
  const [loadingHistorical, setLoadingHistorical] = useState(false);

  useEffect(() => {
    // Subscribe to sensors
    const unsubscribeSensors = sensorService.subscribeAll((data) => {
      setSensors(data);
      if (data.length > 0 && !selectedSensorId) {
        setSelectedSensorId(data[0].id.toString());
      }
    });

    return () => unsubscribeSensors();
  }, [selectedSensorId]);

  useEffect(() => {
    if (!selectedSensorId) return;

    setLoading(true);
    // Subscribe to readings for the selected sensor
    const unsubscribeReadings = readingService.subscribeLatest((data) => {
      setReadings(data);
      setLoading(false);
    }, Number(selectedSensorId));

    return () => unsubscribeReadings();
  }, [selectedSensorId]);

  useEffect(() => {
    if (useHistorical && startDate && endDate && selectedSensorId) {
      setLoadingHistorical(true);
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      readingService
        .getHistorical(start.toISOString(), end.toISOString())
        .then((data) => {
          // Filter by selected sensor
          setHistoricalData(
            data.filter((r) => r.sensor_id === Number(selectedSensorId)),
          );
        })
        .catch((err) => console.error("Falha ao buscar histórico", err))
        .finally(() => setLoadingHistorical(false));
    }
  }, [useHistorical, startDate, endDate, selectedSensorId]);

  const selectedSensor = sensors.find(
    (s) => s.id.toString() === selectedSensorId,
  );
  const latestReading = readings.length > 0 ? readings[0] : null;

  const monitoredMagnitudesKeys = selectedSensor?.monitored_magnitudes?.length
    ? selectedSensor.monitored_magnitudes
    : ["temperatura", "umidade_relativa"];

  const getReadingValue = (reading: Reading | undefined | null, key: string) => {
    if (!reading) return undefined;
    if (key === "temperatura" && reading.temperature !== undefined) return reading.temperature;
    if (key === "umidade_relativa" && reading.humidity !== undefined) return reading.humidity;
    if (reading.values && reading.values[key] !== undefined) return reading.values[key];
    return undefined;
  };

  // Verifica se o sensor está realmente online (ativo E visto nos últimos 5 minutos)
  const isActuallyOnline =
    selectedSensor?.status === "active" &&
    selectedSensor?.last_seen &&
    Date.now() - new Date(selectedSensor.last_seen).getTime() < 300000; // 5 minutos em ms

  const chartData = React.useMemo(() => {
    const dataSource = useHistorical
      ? historicalData
      : readings.slice().reverse();

    // Group by minute
    const timeGroups: Record<string, Record<string, number[]>> = {};

    dataSource.forEach((r) => {
      const dateObj = new Date(r.created_at);
      const time = useHistorical
        ? dateObj.toLocaleString('pt-BR', {
            day: "2-digit",
            month: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          })
        : dateObj.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          });

      if (!timeGroups[time]) timeGroups[time] = {};
      monitoredMagnitudesKeys.forEach(key => {
        if (!timeGroups[time][key]) timeGroups[time][key] = [];
        const val = getReadingValue(r, key);
        if (val !== undefined) {
          const finalVal = convertMagnitudeValue(val, key);
          timeGroups[time][key].push(finalVal);
        }
      });
    });

    const groupedData = Object.entries(timeGroups)
      .map(([time, data]) => {
        const point: any = { time };
        monitoredMagnitudesKeys.forEach(key => {
          if (data[key] && data[key].length > 0) {
            point[key] = data[key].reduce((a, b) => a + b, 0) / data[key].length;
          }
        });
        return point;
      })
      .sort((a, b) => a.time.localeCompare(b.time));

    if (!useHistorical && groupedData.length > 60) {
      groupedData.splice(0, groupedData.length - 60);
    }

    return groupedData;
  }, [readings, historicalData, useHistorical, units.temperature, units.system, monitoredMagnitudesKeys]);

  const latestTempDisplay = latestReading
    ? convertMagnitudeValue(latestReading.temperature, "temperatura").toFixed(1)
    : "--";

  return (
    <div className="space-y-6 pb-20">
      {/* HEADER E SELEÇÃO */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-800 dark:text-white tracking-tight">
            Monitoramento em Tempo Real
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Visualização de ativos e localização em planta baixa.
          </p>
        </div>

        <div className="w-full md:w-80 tour-monitoring-select">
          <div className="relative">
            <select
              value={selectedSensorId}
              onChange={(e) => setSelectedSensorId(e.target.value)}
              className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-white py-3 px-4 pr-10 rounded-xl font-bold text-sm focus:ring-2 focus:ring-blue-500 outline-none shadow-sm transition-all appearance-none"
            >
              <option value="" disabled>
                {t("mon.select_placeholder")}
              </option>
              {sensors.map((sensor) => (
                <option key={sensor.id} value={sensor.id}>
                  {sensor.name} • {sensor.identifier}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-gray-400">
              <Layers size={18} />
            </div>
          </div>
        </div>
      </div>

      <>
        {!selectedSensorId ? (
          <div className="bg-white dark:bg-slate-800 p-16 rounded-3xl text-center shadow-xl border border-gray-100 dark:border-slate-700 tour-monitoring-cards">
            <Cpu size={48} className="mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Selecione uma Unidade
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Escolha um projeto no menu acima para iniciar o monitoramento.
            </p>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* CARDS DE MÉTRICAS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 tour-monitoring-cards">
              {monitoredMagnitudesKeys.map((key) => {
                const mag = getMagnitudeByKey(key);
                if (!mag) return null;
                const rawVal = getReadingValue(latestReading, key);
                const isTemp = key === "temperatura";
                let displayVal = "--";
                if (rawVal !== undefined) {
                  displayVal = convertMagnitudeValue(rawVal, key).toFixed(1);
                }
                const unit = getMagnitudeUnit(key, mag.unit);
                
                return (
                  <motion.div
                    key={key}
                    whileHover={{ y: -5 }}
                    className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 flex items-center gap-4 shadow-sm"
                  >
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/20 text-blue-600 rounded-xl">
                      <Activity size={24} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">
                        {mag.name}
                      </p>
                      <h4 className="text-2xl font-black text-gray-800 dark:text-white">
                        {displayVal}
                        {unit}
                      </h4>
                    </div>
                  </motion.div>
                );
              })}

              <motion.div
                whileHover={{ y: -5 }}
                className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 flex items-center gap-4 col-span-1 lg:col-span-2 shadow-sm"
              >
                <div
                  className={`p-3 rounded-xl ${isActuallyOnline ? "bg-green-100 text-green-600 dark:bg-green-900/20" : "bg-gray-100 text-gray-400 dark:bg-slate-700/50"}`}
                >
                  {isActuallyOnline ? (
                    <Wifi size={24} />
                  ) : (
                    <WifiOff size={24} />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">
                    Status da Conexão
                  </p>
                  <div className="flex items-center gap-2">
                    <h4 className="text-lg font-bold text-gray-800 dark:text-white">
                      {isActuallyOnline
                        ? "Unidade Online"
                        : "Aguardando dados..."}
                    </h4>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={`text-[10px] font-bold uppercase ${isActuallyOnline ? "text-blue-500" : "text-gray-400"}`}
                  >
                    {selectedSensor?.identifier || "Selecione um Sensor"}
                  </p>
                  <p className="text-[10px] text-gray-400 font-mono mt-0.5">
                    {isActuallyOnline && selectedSensor?.last_seen
                      ? new Date(selectedSensor.last_seen).toLocaleTimeString()
                      : "Sem conexão"}
                  </p>
                </div>
              </motion.div>
            </div>

            {/* CHART CONTROLS */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Exibição:
                </label>
                <select
                  className="text-sm border border-gray-200 dark:border-slate-700 rounded-lg px-2 py-1 bg-gray-50 dark:bg-slate-900 outline-none text-gray-700 dark:text-gray-300 font-bold"
                  value={chartFilter}
                  onChange={(e) => setChartFilter(e.target.value)}
                >
                  <option value="both">Todas as Grandezas</option>
                  {monitoredMagnitudesKeys.map(key => {
                    const mag = getMagnitudeByKey(key);
                    return <option key={key} value={key}>{mag?.name || key}</option>;
                  })}
                </select>
              </div>

              <div className="flex items-center gap-3">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                  <Clock size={14} /> Histórico:
                </label>
                <input
                  type="date"
                  className="text-sm border border-gray-200 dark:border-slate-700 rounded-lg px-2 py-1 bg-gray-50 dark:bg-slate-900 outline-none text-gray-700 dark:text-gray-300"
                  value={startDate}
                  max={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setStartDate(e.target.value)}
                />
                <span className="text-gray-400 font-bold text-xs">Até</span>
                <input
                  type="date"
                  className="text-sm border border-gray-200 dark:border-slate-700 rounded-lg px-2 py-1 bg-gray-50 dark:bg-slate-900 outline-none text-gray-700 dark:text-gray-300"
                  value={endDate}
                  max={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setEndDate(e.target.value)}
                />
                <button
                  onClick={() => setUseHistorical(true)}
                  disabled={!startDate || !endDate || loadingHistorical}
                  className="ml-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-bold text-sm transition-all flex items-center justify-center min-w-[100px]"
                >
                  {loadingHistorical ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : "Aplicar"}
                </button>
                {useHistorical && (
                  <button
                    onClick={() => {
                      setUseHistorical(false);
                      setStartDate("");
                      setEndDate("");
                    }}
                    className="px-3 py-1 bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-300 rounded-lg font-bold text-sm transition-all"
                  >
                    Tempo Real
                  </button>
                )}
              </div>
            </div>

            {/* GRÁFICO DE TENDÊNCIA EM TEMPO REAL OU HISTÓRICO */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 tour-monitoring-history">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-black text-gray-800 dark:text-white flex items-center gap-2 uppercase tracking-tight">
                  <Activity size={18} className="text-blue-500" />
                  Telemetria ({useHistorical ? "Histórico" : "Tempo Real"})
                </h3>
                <div className="flex items-center gap-2">
                  {!useHistorical && (
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                  )}
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    {useHistorical ? "Offline Data" : "Live Stream"}
                  </span>
                </div>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorMon" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="5%"
                          stopColor="#3b82f6"
                          stopOpacity={0.2}
                        />
                        <stop
                          offset="95%"
                          stopColor="#3b82f6"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#e5e7eb"
                      className="stroke-gray-200 dark:stroke-slate-700"
                    />
                    <XAxis
                      dataKey="time"
                      stroke="#9ca3af"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                    />

                    <YAxis
                      yAxisId="left"
                      stroke="#9ca3af"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                    />

                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgb(30, 41, 59)",
                        border: "none",
                        borderRadius: "12px",
                        color: "#fff",
                      }}
                      itemStyle={{
                        color: "#fff",
                        fontSize: "12px",
                        fontWeight: "bold",
                      }}
                    />
                    <Legend verticalAlign="top" height={36} iconType="circle" />

                    {monitoredMagnitudesKeys.map((key, index) => {
                      if (chartFilter !== "both" && chartFilter !== key) return null;
                      const mag = getMagnitudeByKey(key);
                      const colors = ["#f97316", "#3b82f6", "#10b981", "#8b5cf6", "#ef4444", "#f43f5e", "#0ea5e9", "#eab308"];
                      const color = colors[index % colors.length];
                      
                      return (
                        <Area
                          key={key}
                          yAxisId="left"
                          type="monotone"
                          dataKey={key}
                          name={mag?.name || key}
                          stroke={color}
                          strokeWidth={3}
                          fillOpacity={chartFilter === "both" ? 0.1 : 0.3}
                          fill={color}
                        />
                      );
                    })}
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* TABELA DE HISTÓRICO */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
              <div className="px-8 py-6 border-b border-gray-50 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-gray-800 dark:text-white tracking-tight">
                    Histórico de Eventos
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5 font-medium">
                    Logs detalhados de recepção RF.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    Live Sync
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50/50 dark:bg-slate-700/30 sticky top-0 backdrop-blur-md">
                    <tr>
                      <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        Data/Hora
                      </th>
                      {monitoredMagnitudesKeys.map(key => {
                        const mag = getMagnitudeByKey(key);
                        return (
                          <th key={key} className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">
                            {mag?.name || key}
                          </th>
                        );
                      })}
                      <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">
                        Qualidade do Link
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-slate-700">
                    {readings.length === 0 ? (
                      <tr>
                        <td
                          colSpan={2 + monitoredMagnitudesKeys.length}
                          className="px-8 py-10 text-center text-gray-400 italic text-xs"
                        >
                          Sem dados para este período.
                        </td>
                      </tr>
                    ) : (
                      readings.map((r) => (
                        <tr
                          key={r.id}
                          className="hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors group"
                        >
                          <td className="px-8 py-4">
                            <div className="text-sm font-bold text-gray-600 dark:text-gray-300">
                              {new Date(r.created_at).toLocaleDateString()}
                              <span className="ml-2 font-mono text-gray-400 text-xs">
                                {new Date(r.created_at).toLocaleTimeString()}
                              </span>
                            </div>
                          </td>
                          {monitoredMagnitudesKeys.map(key => {
                            const val = getReadingValue(r, key);
                            let displayVal = "--";
                            if (val !== undefined) {
                               displayVal = convertMagnitudeValue(val, key).toFixed(1);
                            }
                            const mag = getMagnitudeByKey(key);
                            const unit = getMagnitudeUnit(key, mag?.unit || "");
                            
                            return (
                              <td key={key} className="px-8 py-4 text-center">
                                <span className="font-black text-gray-700 dark:text-gray-300">
                                  {displayVal}{unit}
                                </span>
                              </td>
                            );
                          })}
                          <td className="px-8 py-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <div className="w-1 h-3 bg-green-500 rounded-full"></div>
                              <div className="w-1 h-3 bg-green-500 rounded-full"></div>
                              <div className="w-1 h-3 bg-green-500 rounded-full opacity-30"></div>
                              <span className="text-[10px] font-mono text-gray-400 ml-1">
                                -78 dBm
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* SEÇÃO DE GEOLOCALIZAÇÃO E PLANTA BAIXA */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 tour-monitoring-map">
              {/* MAPA DA PLANTA BAIXA (LOJA) */}
              <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden flex flex-col h-[550px]">
                <div className="p-6 border-b border-gray-50 dark:border-slate-700 flex items-center justify-between">
                  <div>
                    <h3 className="font-black text-gray-800 dark:text-white flex items-center gap-2 tracking-tight uppercase text-sm">
                      <Layout size={18} className="text-blue-600" />
                      Mapa da Unidade / Implantação
                    </h3>
                    <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">
                      Mercadão Atacadista - Unidade Central
                    </p>
                  </div>
                  <button className="p-2 text-gray-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                    <Maximize2 size={18} />
                  </button>
                </div>

                <div className="flex-1 p-6">
                  <FloorPlan
                    sensors={sensors}
                    selectedId={selectedSensorId}
                    onSelect={setSelectedSensorId}
                  />
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-gray-100 dark:border-slate-700 flex justify-center gap-6">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-[10px] font-black text-gray-500 uppercase">
                      Operacional
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span className="text-[10px] font-black text-gray-500 uppercase">
                      Offline
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                    <span className="text-[10px] font-black text-gray-500 uppercase">
                      Alerta
                    </span>
                  </div>
                </div>
              </div>

              {/* LOCALIZAÇÃO VIA SATÉLITE */}
              <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden flex flex-col h-[550px]">
                <div className="p-6 border-b border-gray-50 dark:border-slate-700 flex items-center justify-between">
                  <h3 className="font-black text-gray-800 dark:text-white flex items-center gap-2 tracking-tight uppercase text-sm">
                    <MapPin size={18} className="text-red-500" />
                    Localização via Satélite (GPS)
                  </h3>
                </div>

                {(selectedSensor?.latitude && selectedSensor?.longitude) ||
                selectedSensor?.address ? (
                  <div className="flex-1 relative">
                    <iframe
                      title="GPS Location"
                      width="100%"
                      height="100%"
                      frameBorder="0"
                      src={
                        selectedSensor.latitude && selectedSensor.longitude
                          ? `https://maps.google.com/maps?q=${selectedSensor.latitude},${selectedSensor.longitude}&z=17&output=embed`
                          : `https://maps.google.com/maps?q=${encodeURIComponent(selectedSensor.address || "")}&z=17&output=embed`
                      }
                      className="dark:invert dark:hue-rotate-180 dark:brightness-90"
                    />
                    <div className="absolute bottom-6 left-6 right-6 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md p-4 rounded-2xl border border-white dark:border-slate-600 shadow-2xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-900/40">
                          <MapPin size={20} />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">
                            {selectedSensor.latitude
                              ? "Coordenadas Precisas"
                              : "Localização por Endereço"}
                          </p>
                          <p className="text-xs font-bold text-slate-800 dark:text-white">
                            {selectedSensor.latitude && selectedSensor.longitude
                              ? `${selectedSensor.latitude}, ${selectedSensor.longitude}`
                              : selectedSensor.address}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-gray-50 dark:bg-slate-900/50">
                    <WifiOff size={40} className="text-gray-300 mb-4" />
                    <h4 className="font-bold text-gray-700 dark:text-gray-300">
                      GPS não configurado
                    </h4>
                    <p className="text-xs text-gray-400 mt-2 max-w-xs">
                      Ative o GPS nas configurações do dispositivo para
                      visualização via satélite.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </>
    </div>
  );
};
