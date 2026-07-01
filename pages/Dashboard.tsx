import React, { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  Legend,
} from "recharts";
import {
  Activity,
  Thermometer,
  Droplets,
  Clock,
  BarChart3,
  Filter,
  CheckSquare,
  Square,
  ChevronDown,
  ChevronUp,
  FileText,
  Download,
} from "lucide-react";
import { readingService, sensorService, authService, systemLogService } from "../services/api";
import { Reading, Sensor, User } from "../types";
import { useLanguage } from "../contexts/LanguageContext";
import { useTour } from "../contexts/TourContext";
import { getMagnitudeByKey } from "../utils/magnitudes";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import html2canvas from "html2canvas";

export const Dashboard: React.FC = () => {
  const { t, units } = useLanguage();
  const { startTour } = useTour();
  const [readings, setReadings] = useState<Reading[]>([]);
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const [reportStartDate, setReportStartDate] = useState<string>("");
  const [reportEndDate, setReportEndDate] = useState<string>("");

  const [chartFilter, setChartFilter] = useState<string>("both");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [useHistorical, setUseHistorical] = useState(false);
  const [historicalData, setHistoricalData] = useState<Reading[]>([]);
  const [loadingHistorical, setLoadingHistorical] = useState(false);

  const chartsRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check if first time user
    const hasSeenTour = localStorage.getItem("al2_has_seen_tour");
    if (!hasSeenTour) {
      const timer = setTimeout(() => {
        startTour("global");
        localStorage.setItem("al2_has_seen_tour", "true");
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [startTour]);

  useEffect(() => {
    const init = async () => {
      try {
        const { user } = await authService.me();
        setCurrentUser(user);
      } catch (error) {
        console.error("Failed to fetch user", error);
      }
    };
    init();

    // Subscribe to sensors
    const unsubscribeSensors = sensorService.subscribeAll((allSensors) => {
      setSensors(allSensors);
      setLoading(false);
      // Initialize selectedIds if empty
      setSelectedIds((prev) => {
        if (prev.length === 0) {
          return allSensors.map((s) => s.id);
        }
        return prev;
      });
    });

    // Subscribe to readings
    const unsubscribeReadings = readingService.subscribeLatest(
      (allReadings) => {
        setReadings(allReadings);
      },
    );

    return () => {
      unsubscribeSensors();
      unsubscribeReadings();
    };
  }, []);

  useEffect(() => {
    if (useHistorical && startDate && endDate) {
      setLoadingHistorical(true);
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      readingService
        .getHistorical(start.toISOString(), end.toISOString())
        .then((data) => setHistoricalData(data))
        .catch((err) => console.error("Falha ao buscar histórico", err))
        .finally(() => setLoadingHistorical(false));
    }
  }, [useHistorical, startDate, endDate]);

  const isManagement =
    currentUser?.role === "gerencia" || currentUser?.role === "gerente" || currentUser?.role === "admin";

  const toggleSensor = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const selectAll = () => setSelectedIds(sensors.map((s) => s.id));
  const selectNone = () => setSelectedIds([]);

  // Lógica de Conversão
  const convertTemp = (tempC: number) => {
    return units.system === 'imperial' || units.temperature === "F" ? tempC * 1.8 + 32 : tempC;
  };
  const tempUnit = units.system === 'imperial' || units.temperature === "F" ? "°F" : "°C";

  // --- CÁLCULO DAS MÉTRICAS FILTRADAS ---
  const aggregatedData = useMemo(() => {
    const dataSource = useHistorical ? historicalData : readings;
    const selectedIdentifiers = sensors.filter(s => selectedIds.includes(s.id)).map(s => s.identifier);
    const filtered = dataSource.filter((r) =>
      selectedIds.includes(r.sensor_id) || (r.sensor_identifier && selectedIdentifiers.includes(r.sensor_identifier))
    );

    if (filtered.length === 0)
      return { avgTemp: NaN, avgHum: NaN, chartData: [] };

    const avgTemp =
      filtered.reduce((acc, r) => acc + r.temperature, 0) / filtered.length;
    const avgHum =
      filtered.reduce((acc, r) => acc + r.humidity, 0) / filtered.length;

    // Agrupamento por tempo para o gráfico (Média dos selecionados no mesmo timestamp)
    const timeGroups: Record<string, { temps: number[]; hums: number[] }> = {};

    filtered.forEach((r) => {
      // Use minutes for granularity (1 em 1 minuto)
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

      if (!timeGroups[time]) timeGroups[time] = { temps: [], hums: [] };
      timeGroups[time].temps.push(r.temperature);
      timeGroups[time].hums.push(r.humidity);
    });

    const chartData = Object.entries(timeGroups)
      .map(([time, data]) => ({
        time,
        displayTemp: Number(
          convertTemp(
            data.temps.reduce((a, b) => a + b, 0) / data.temps.length,
          ).toFixed(1),
        ),
        humidity: Number(
          (data.hums.reduce((a, b) => a + b, 0) / data.hums.length).toFixed(1),
        ),
      }))
      .sort((a, b) => a.time.localeCompare(b.time));

    // Keep last 60 points if not historical, otherwise keep more or all points (could be large, so limit to 1440 max if needed)
    if (!useHistorical && chartData.length > 60) {
      chartData.splice(0, chartData.length - 60);
    }

    return { avgTemp, avgHum, chartData };
  }, [readings, historicalData, useHistorical, selectedIds, units.temperature, units.system]);

  const generatePDF = async (
    type: "custom" | "fortnightly" | "daily" | "weekly",
  ) => {
    setIsGenerating(true);
    try {
      let start = new Date();
      let end = new Date();
      let typeText = "";

      if (type === "custom") {
        if (!reportStartDate || !reportEndDate) {
          alert("Selecione as datas de início e fim.");
          setIsGenerating(false);
          return;
        }
        start = new Date(reportStartDate);
        start.setHours(0, 0, 0, 0);
        end = new Date(reportEndDate);
        end.setHours(23, 59, 59, 999);
        typeText = `Personalizado (${start.toLocaleDateString()} a ${end.toLocaleDateString()})`;
      } else if (type === "fortnightly") {
        start = new Date();
        start.setDate(start.getDate() - 15);
        start.setHours(0, 0, 0, 0);
        end = new Date();
        end.setHours(23, 59, 59, 999);
        typeText = "Quinzenal (Últimos 15 dias)";
      } else if (type === "daily") {
        start = new Date();
        start.setHours(0, 0, 0, 0);
        end = new Date();
        end.setHours(23, 59, 59, 999);
        typeText = "Diário (Últimas 24 horas)";
      } else {
        start = new Date();
        start.setDate(start.getDate() - 7);
        start.setHours(0, 0, 0, 0);
        end = new Date();
        end.setHours(23, 59, 59, 999);
        typeText = "Semanal (Últimos 7 dias)";
      }

      const historicalReadings = await readingService.getHistorical(
        start.toISOString(),
        end.toISOString(),
      );

      const doc = new jsPDF();
      const title = `Relatório Técnico - ${typeText}`;

      // Configuração visual do PDF
      doc.setFontSize(22);
      doc.setTextColor(59, 130, 246); // Blue-600
      doc.text("AL2 IoT Dashboard", 14, 20);

      doc.setFontSize(14);
      doc.setTextColor(100);
      doc.text(title, 14, 30);

      doc.setFontSize(10);
      doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 38);
      doc.text(
        `Responsável: ${currentUser?.full_name || "Usuário AL2"}`,
        14,
        43,
      );

      // Metadados
      const sensorsFiltered = sensors.filter((s) =>
        historicalReadings.some((r) => r.sensor_id === s.id),
      );

      doc.setFontSize(12);
      doc.setTextColor(0);
      doc.text("Resumo de Ativos", 14, 55);

      const summaryData = [
        ["Total de Sensores no Período", sensorsFiltered.length.toString()],
        ["Total de Leituras Registradas", historicalReadings.length.toString()],
        [
          "Média Temperatura Global",
          `${convertTemp(historicalReadings.reduce((acc, r) => acc + r.temperature, 0) / (historicalReadings.length || 1)).toFixed(2)}${tempUnit}`,
        ],
        [
          "Média Umidade Global",
          `${(historicalReadings.reduce((acc, r) => acc + r.humidity, 0) / (historicalReadings.length || 1)).toFixed(2)}%`,
        ],
      ];

      autoTable(doc, {
        startY: 60,
        head: [["Métrica", "Valor"]],
        body: summaryData,
        theme: "striped",
        headStyles: { fillColor: [59, 130, 246] },
      });

      // Detalhamento por Sensor
      doc.text(
        "Detalhamento Individual por Ativo",
        14,
        (doc as any).lastAutoTable.finalY + 15,
      );

      const individualData = sensorsFiltered.map((s) => {
        const sReadings = historicalReadings.filter(
          (r) => r.sensor_id === s.id,
        );
        const avgT =
          sReadings.reduce((acc, r) => acc + r.temperature, 0) /
          (sReadings.length || 1);
        const avgH =
          sReadings.reduce((acc, r) => acc + r.humidity, 0) /
          (sReadings.length || 1);
        const maxT = Math.max(...sReadings.map((r) => r.temperature), 0);
        const minT = Math.min(...sReadings.map((r) => r.temperature), avgT);

        return [
          s.name,
          s.identifier,
          sReadings.length.toString(),
          `${convertTemp(avgT).toFixed(1)}${tempUnit}`,
          `${convertTemp(maxT).toFixed(1)}${tempUnit}`,
          `${convertTemp(minT).toFixed(1)}${tempUnit}`,
          `${avgH.toFixed(1)}%`,
        ];
      });

      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 20,
        head: [
          [
            "Sensor",
            "ID",
            "Leituras",
            "Média Temp",
            "Máx Temp",
            "Mín Temp",
            "Média Hum",
          ],
        ],
        body: individualData,
        theme: "grid",
        headStyles: { fillColor: [30, 41, 59] },
      });

      // Capturar e adicionar Gráfico
      if (chartsRef.current) {
        try {
          const canvas = await html2canvas(chartsRef.current, { scale: 2 });
          const imgData = canvas.toDataURL("image/png");

          let yPos = (doc as any).lastAutoTable.finalY + 15;

          // Se não houver espaço na página para a imagem, adiciona nova página
          if (yPos > 200) {
            doc.addPage();
            yPos = 20;
          }

          doc.setFontSize(12);
          doc.text("Gráfico Consolidado da Tela", 14, yPos);

          const pdfWidth = doc.internal.pageSize.getWidth() - 28; // Margens 14 de cada lado
          const imgProps = doc.getImageProperties(imgData);
          const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

          doc.addImage(imgData, "PNG", 14, yPos + 5, pdfWidth, pdfHeight);
        } catch (err) {
          console.error("Não foi possível renderizar o gráfico", err);
        }
      }

      // Logs do Sistema
      try {
        const allLogs = await systemLogService.getLogs();
        const filteredLogs = allLogs.filter(log => {
          const logDate = new Date(log.created_at);
          return logDate >= start && logDate <= end;
        });

        if (filteredLogs.length > 0) {
          doc.addPage();
          doc.setFontSize(14);
          doc.setTextColor(59, 130, 246);
          doc.text("Logs do Sistema (Período)", 14, 20);

          const logData = filteredLogs.map(log => [
            new Date(log.created_at).toLocaleString('pt-BR'),
            log.user_name || 'Sistema',
            log.action,
            log.type?.toUpperCase() || ''
          ]);

          autoTable(doc, {
            startY: 30,
            head: [["Data/Hora", "Usuário", "Ação", "Tipo"]],
            body: logData,
            theme: "striped",
            headStyles: { fillColor: [59, 130, 246] },
          });
        }
      } catch (logErr) {
        console.error("Erro ao carregar logs para o PDF", logErr);
      }

      doc.save(`Relatorio_${type}_${new Date().getTime()}.pdf`);
    } catch (error) {
      console.error("Erro ao gerar PDF", error);
      alert("Falha ao gerar relatório. Verifique os dados históricos.");
    } finally {
      setIsGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center text-gray-500 font-bold gap-4">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="animate-pulse">{t("dash.loading")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-800 dark:text-white tracking-tight">
            {t("dash.title")}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            {selectedIds.length} projetos selecionados para composição da média.
          </p>
        </div>

        {isManagement && (
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all border-2 ${showFilters ? "bg-blue-600 border-blue-600 text-white shadow-lg" : "bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700 text-gray-600 dark:text-gray-300"}`}
          >
            <Filter size={18} />
            {showFilters ? "Ocultar Filtros" : "Filtrar Projetos"}
            {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        )}
      </div>

      {/* PAINEL DE FILTROS DINÂMICO */}
      <AnimatePresence>
        {showFilters && isManagement && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: "auto", marginBottom: 24 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <Activity size={14} className="text-blue-500" />
                Selecione Projetos para Agregação
              </h3>
              <div className="flex gap-4">
                <button
                  onClick={selectAll}
                  className="text-[10px] font-black text-blue-600 uppercase hover:underline"
                >
                  Todos
                </button>
                <button
                  onClick={selectNone}
                  className="text-[10px] font-black text-gray-400 uppercase hover:underline"
                >
                  Limpar
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {sensors.map((sensor) => (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  key={sensor.id}
                  onClick={() => toggleSensor(sensor.id)}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                    selectedIds.includes(sensor.id)
                      ? "border-blue-500 bg-blue-50/50 dark:bg-blue-900/20"
                      : "border-transparent bg-gray-50 dark:bg-slate-900/50"
                  }`}
                >
                  {selectedIds.includes(sensor.id) ? (
                    <CheckSquare size={18} className="text-blue-600 shrink-0" />
                  ) : (
                    <Square
                      size={18}
                      className="text-gray-300 dark:text-slate-700 shrink-0"
                    />
                  )}
                  <div className="overflow-hidden">
                    <p
                      className={`text-xs font-bold truncate ${selectedIds.includes(sensor.id) ? "text-blue-700 dark:text-blue-400" : "text-gray-500"}`}
                    >
                      {sensor.name}
                    </p>
                    <p className="text-[9px] font-mono text-gray-400 uppercase">
                      {sensor.identifier}
                    </p>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats Grid - Agora baseada no Agregado */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{
          visible: { transition: { staggerChildren: 0.1 } },
        }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 tour-dashboard-stats"
      >
        <StatCard
          title="Média de Temperatura"
          value={
            aggregatedData.avgTemp !== undefined &&
            !isNaN(aggregatedData.avgTemp)
              ? `${convertTemp(aggregatedData.avgTemp).toFixed(1)}${tempUnit}`
              : "--"
          }
          icon={<Thermometer className="text-orange-500" />}
          trend={
            selectedIds.length > 0
              ? `${selectedIds.length} ativos`
              : "Sem dados"
          }
          trendColor="text-orange-500"
        />
        <StatCard
          title="Média de Umidade"
          value={
            aggregatedData.avgHum !== undefined && !isNaN(aggregatedData.avgHum)
              ? `${aggregatedData.avgHum.toFixed(1)}%`
              : "--"
          }
          icon={<Droplets className="text-blue-500" />}
          trend="Média ponderada"
          trendColor="text-blue-500"
        />
        <StatCard
          title="Sensores no Grupo"
          value={selectedIds.length.toString()}
          icon={<Activity className="text-green-500" />}
          trend="Monitoramento Ativo"
          trendColor="text-green-500"
        />
        <StatCard
          title="Última Agregação"
          value={new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
          icon={<Clock className="text-gray-400" />}
          trend="Live Sync"
          trendColor="text-slate-400"
        />
      </motion.div>

      {/* Chart Controls */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col md:flex-row items-center justify-between gap-4 mt-6">
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Exibição:
          </label>
          <select
            className="text-sm border border-gray-200 dark:border-slate-700 rounded-lg px-2 py-1 bg-gray-50 dark:bg-slate-900 outline-none text-gray-700 dark:text-gray-300 font-bold"
            value={chartFilter}
            onChange={(e) => setChartFilter(e.target.value as any)}
          >
            <option value="both">Período (Ambos)</option>
            <option value="temp">Temperatura</option>
            <option value="hum">Umidade</option>
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

      {/* Charts Section - Gráfico da Média do Grupo */}
      <div
        ref={chartsRef}
        className={`grid grid-cols-1 ${chartFilter === "both" ? "lg:grid-cols-2" : ""} gap-6 mt-4 tour-dashboard-chart`}
      >
        {(chartFilter === "both" || chartFilter === "temp") && (
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-black text-gray-800 dark:text-white flex items-center gap-2 uppercase tracking-tight">
                <BarChart3 size={18} className="text-orange-500" />
                Tendência de Temperatura (Grupo)
              </h3>
              <span className="text-[10px] font-bold px-2 py-1 bg-orange-100 dark:bg-orange-900/20 text-orange-600 rounded-lg">
                {useHistorical ? "Histórico" : "Tempo Real"}
              </span>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={aggregatedData.chartData}>
                  <defs>
                    <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
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
                    stroke="#9ca3af"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    domain={[
                      (dataMin: number) => Math.floor(dataMin - 2),
                      (dataMax: number) => Math.ceil(dataMax + 2),
                    ]}
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
                    labelStyle={{
                      fontSize: "10px",
                      color: "#94a3b8",
                      marginBottom: "4px",
                    }}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" />
                  <Area
                    type="monotone"
                    dataKey="displayTemp"
                    name="Temp. Média"
                    stroke="#f97316"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorTemp)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {(chartFilter === "both" || chartFilter === "hum") && (
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-black text-gray-800 dark:text-white flex items-center gap-2 uppercase tracking-tight">
                <Droplets size={18} className="text-blue-500" />
                Tendência de Umidade (Grupo)
              </h3>
              <span className="text-[10px] font-bold px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-600 rounded-lg">
                {useHistorical ? "Histórico" : "Tempo Real"}
              </span>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={aggregatedData.chartData}>
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
                    stroke="#9ca3af"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    domain={[0, 100]}
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
                    labelStyle={{
                      fontSize: "10px",
                      color: "#94a3b8",
                      marginBottom: "4px",
                    }}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" />
                  <Line
                    type="monotone"
                    dataKey="humidity"
                    name="Umidade Média"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    dot={false}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* SEÇÃO DE RELATÓRIOS - MOVIDA PARA O FINAL */}
      {isManagement && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 mt-6 tour-dashboard-reports">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-black text-gray-800 dark:text-white flex items-center gap-2 uppercase tracking-tight">
                <FileText size={18} className="text-blue-500" />
                Gerador de Relatórios Técnicos
              </h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">
                Exportação de dados históricos para auditoria
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Relatório Diário */}
            <div className="p-5 bg-transparent border border-gray-200 dark:border-slate-700 rounded-2xl flex flex-col gap-4 justify-between">
              <div>
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                  Relatório Diário
                </h4>
                <p className="text-[10px] text-gray-500 font-medium leading-relaxed uppercase">
                  Dados coletados nas últimas 24 horas de operação contínua.
                </p>
              </div>
              <div className="flex items-end justify-end mt-2">
                <button
                  onClick={() => generatePDF("daily")}
                  disabled={isGenerating}
                  className="px-4 py-2.5 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white rounded-lg font-bold text-[10px] uppercase tracking-wider transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  <Download size={14} /> Emitir Diário
                </button>
              </div>
            </div>

            {/* Relatório Semanal */}
            <div className="p-5 bg-transparent border border-gray-200 dark:border-slate-700 rounded-2xl flex flex-col gap-4 justify-between">
              <div>
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                  Relatório Semanal
                </h4>
                <p className="text-[10px] text-gray-500 font-medium leading-relaxed uppercase">
                  Consolidado dos últimos 7 dias de operação de todos os
                  sensores.
                </p>
              </div>
              <div className="flex items-end justify-end mt-2">
                <button
                  onClick={() => generatePDF("weekly")}
                  disabled={isGenerating}
                  className="px-4 py-2.5 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white rounded-lg font-bold text-[10px] uppercase tracking-wider transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  <Download size={14} /> Emitir Semanal
                </button>
              </div>
            </div>

            {/* Relatório Quinzenal */}
            <div className="p-5 bg-transparent border border-gray-200 dark:border-slate-700 rounded-2xl flex flex-col gap-4 justify-between">
              <div>
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                  Relatório Quinzenal
                </h4>
                <p className="text-[10px] text-gray-500 font-medium leading-relaxed uppercase">
                  Exportar os dados dos últimos 15 dias de operação.
                </p>
              </div>
              <div className="flex items-end justify-end mt-2">
                <button
                  onClick={() => generatePDF("fortnightly")}
                  disabled={isGenerating}
                  className="px-4 py-2.5 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white rounded-lg font-bold text-[10px] uppercase tracking-wider transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  <Download size={14} /> Emitir Quinzenal
                </button>
              </div>
            </div>

            {/* Relatório Personalizado */}
            <div className="p-5 bg-transparent border border-gray-200 dark:border-slate-700 rounded-2xl flex flex-col gap-4 justify-between">
              <div>
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                  Relatório Personalizado
                </h4>
                <p className="text-[10px] text-gray-500 font-medium leading-relaxed uppercase">
                  Defina um período específico para exportação.
                </p>
              </div>
              <div className="flex gap-2 items-end mt-2">
                <div className="flex-1">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                    De
                  </label>
                  <input
                    type="date"
                    value={reportStartDate}
                    onChange={(e) => setReportStartDate(e.target.value)}
                    className="w-full bg-transparent border border-gray-200 dark:border-slate-700 py-2 px-2 rounded-lg text-[10px] font-bold outline-none text-gray-700 dark:text-gray-300"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                    Até
                  </label>
                  <input
                    type="date"
                    value={reportEndDate}
                    onChange={(e) => setReportEndDate(e.target.value)}
                    className="w-full bg-transparent border border-gray-200 dark:border-slate-700 py-2 px-2 rounded-lg text-[10px] font-bold outline-none text-gray-700 dark:text-gray-300"
                  />
                </div>
                <button
                  onClick={() => generatePDF("custom")}
                  disabled={isGenerating || !reportStartDate || !reportEndDate}
                  className="px-4 py-2.5 h-[34px] bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white rounded-lg font-bold text-[10px] uppercase tracking-wider transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  <Download size={14} /> Emitir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard: React.FC<{
  title: string;
  value: string;
  icon: React.ReactNode;
  trend: string;
  trendColor: string;
}> = ({ title, value, icon, trend, trendColor }) => (
  <motion.div
    variants={{
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0 },
    }}
    whileHover={{ y: -5 }}
    className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 hover:shadow-md transition-all group"
  >
    <div className="flex justify-between items-start mb-4">
      <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
        {title}
      </h3>
      <div className="p-2 bg-gray-50 dark:bg-slate-700 rounded-xl group-hover:scale-110 transition-transform">
        {icon}
      </div>
    </div>
    <div className="flex flex-col">
      <span className="text-3xl font-black text-gray-800 dark:text-white leading-none mb-2 tracking-tighter">
        {value}
      </span>
      <span
        className={`text-[10px] font-black uppercase tracking-widest ${trendColor}`}
      >
        {trend}
      </span>
    </div>
  </motion.div>
);
