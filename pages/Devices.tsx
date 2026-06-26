import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Plus,
  Trash2,
  Cpu,
  WifiOff,
  Wifi,
  MapPin,
  Lock,
  ShieldCheck,
  Copy,
  CheckCircle2,
  Edit2,
  Check,
  X as CloseIcon,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { sensorService, authService, systemLogService } from "../services/api";
import { Sensor, User } from "../types";
import { useLanguage } from "../contexts/LanguageContext";
import { MAGNITUDE_CATEGORIES, getMagnitudeByKey } from "../utils/magnitudes";

interface NewSensorState {
  identifier: string;
  name: string;
  latitude: string;
  longitude: string;
  address: string;
  temp_limit: string;
  has_alerts: boolean;
  alert_limits: Record<string, string>;
  monitored_magnitudes: string[];
}

export const Devices: React.FC = () => {
  const { t, formatTemp, formatMagnitude, convertMagnitudeValue, revertMagnitudeValue, getMagnitudeUnit } = useLanguage();
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newSensor, setNewSensor] = useState<NewSensorState>({
    identifier: "",
    name: "",
    latitude: "",
    longitude: "",
    address: "",
    temp_limit: "",
    has_alerts: false,
    alert_limits: {},
    monitored_magnitudes: [],
  });
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [copying, setCopying] = useState<string | null>(null);

  const [editingLimitSensor, setEditingLimitSensor] = useState<Sensor | null>(null);
  const [editingAlertLimits, setEditingAlertLimits] = useState<Record<string, string>>({});

  // State for inline editing
  const [editingId, setEditingId] = useState<string | null>(null);
  const [targetLimit, setTargetLimit] = useState<string>("");

  useEffect(() => {
    const init = async () => {
      const { user } = await authService.me();
      setCurrentUser(user);
    };
    init();

    const unsubscribe = sensorService.subscribeAll((data) => {
      setSensors(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopying(text);
    setTimeout(() => setCopying(null), 2000);
  };

  const handleAddSensor = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const latVal = newSensor.latitude.trim();
      const lngVal = newSensor.longitude.trim();
      const limitVal = newSensor.temp_limit.trim();

      const lat = latVal !== "" ? parseFloat(latVal) : undefined;
      const lng = lngVal !== "" ? parseFloat(lngVal) : undefined;
      const limit = limitVal !== "" ? parseFloat(limitVal) : undefined;

      const parsedAlertLimits: Record<string, number> = {};
      for (const [key, val] of Object.entries(newSensor.alert_limits)) {
        if (val.trim() !== "") {
          parsedAlertLimits[key] = parseFloat(val);
        }
      }

      await sensorService.create({
        identifier: newSensor.identifier,
        name: newSensor.name,
        temp_limit: limit,
        latitude: lat,
        longitude: lng,
        address: newSensor.address.trim() || undefined,
        has_alerts: newSensor.has_alerts,
        alert_limits: parsedAlertLimits,
        monitored_magnitudes: newSensor.monitored_magnitudes,
      });

      if (currentUser) {
        await systemLogService.addLog(
          currentUser.full_name || currentUser.username,
          `Adicionou o dispositivo ${newSensor.name} (${newSensor.identifier})`,
          "edit",
        );
      }

      setSaveSuccess(true);
      setTimeout(() => {
        setNewSensor({
          identifier: "",
          name: "",
          latitude: "",
          longitude: "",
          address: "",
          temp_limit: "",
          has_alerts: false,
          alert_limits: {},
          monitored_magnitudes: [],
        });
        setIsModalOpen(false);
        setSaveSuccess(false);
      }, 1500);
    } catch (err) {
      console.error("Erro ao criar sensor", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (sensor: Sensor) => {
    try {
      if (confirm(`Deseja realmente remover o dispositivo ${sensor.name}?`)) {
        await sensorService.delete(sensor.id);
        if (currentUser) {
          await systemLogService.addLog(
            currentUser.full_name || currentUser.username,
            `Removeu o dispositivo ${sensor.name} (${sensor.identifier})`,
            "danger",
          );
        }
      }
    } catch (err) {
      console.error("Erro ao deletar", err);
    }
  };

  const startEditingLimits = (sensor: Sensor) => {
    setEditingLimitSensor(sensor);
    
    // Populate with existing alert_limits, or temp_limit if alert_limits is empty
    const initialLimits: Record<string, string> = {};
    if (sensor.alert_limits && Object.keys(sensor.alert_limits).length > 0) {
      for (const [key, val] of Object.entries(sensor.alert_limits)) {
        initialLimits[key] = convertMagnitudeValue(Number(val), key).toFixed(1).replace(/\.0$/, '');
      }
    } else if (sensor.temp_limit) {
      initialLimits['temperatura'] = convertMagnitudeValue(sensor.temp_limit, 'temperatura').toFixed(1).replace(/\.0$/, '');
    }
    
    setEditingAlertLimits(initialLimits);
  };

  const saveLimitsModal = async () => {
    if (!editingLimitSensor) return;
    try {
      const parsedAlertLimits: Record<string, number> = {};
      for (const [key, val] of Object.entries(editingAlertLimits)) {
        if (val.trim() !== "") {
          const numVal = parseFloat(val);
          if (!isNaN(numVal)) {
            parsedAlertLimits[key] = revertMagnitudeValue(numVal, key);
          }
        }
      }
      
      const hasAlerts = Object.keys(parsedAlertLimits).length > 0;
      // Maintain temp_limit fallback for compatibility
      const tempLimitFallback = parsedAlertLimits['temperatura'] !== undefined ? parsedAlertLimits['temperatura'] : undefined;

      await sensorService.update(editingLimitSensor.identifier, {
        alert_limits: parsedAlertLimits,
        has_alerts: hasAlerts,
        ...(tempLimitFallback !== undefined && { temp_limit: tempLimitFallback }),
      });
      
      if (currentUser) {
        await systemLogService.addLog(
          currentUser.full_name || currentUser.username,
          `Atualizou os limites de alerta do dispositivo ${editingLimitSensor.name}`,
          "edit",
        );
      }
      setEditingLimitSensor(null);
    } catch (err) {
      console.error("Erro ao atualizar limites", err);
    }
  };

  // admin e gerencia podem gerenciar projetos (adicionar/remover)
  const canManage =
    currentUser?.role === "gerencia" || currentUser?.role === "gerente" || currentUser?.role === "admin";

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-gray-800 dark:text-white tracking-tight">
            {t("dev.title")}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            {t("dev.subtitle")}
          </p>
        </div>
        <div className="tour-devices-add">
          {canManage ? (
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-all shadow-lg shadow-blue-900/20 active:scale-95"
            >
              <Plus size={18} />
              {t("dev.new_btn")}
            </button>
          ) : (
            <div className="px-4 py-2 bg-gray-100 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 text-xs text-gray-400 font-bold flex items-center gap-2">
              <Lock size={14} /> MODO APENAS LEITURA
            </div>
          )}
        </div>
      </div>

      <div className="tour-devices-list">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            {t("dash.loading")}
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50/50 dark:bg-slate-700/30 border-b border-gray-100 dark:border-slate-700">
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                      {t("dev.status")}
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                      {t("dev.id")}
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                      Token de Acesso
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                      {t("dev.name")}
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest text-center">
                      Limite Temp.
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                      {t("dev.last_seen")}
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest text-right">
                      {t("dev.actions")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                  {sensors.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-12 text-center text-gray-400 italic text-sm"
                      >
                        Nenhum sensor registrado no sistema.
                      </td>
                    </tr>
                  ) : (
                    <AnimatePresence mode="popLayout">
                      {sensors.map((sensor) => {
                        const isOnline =
                          sensor.status === "active" &&
                          Date.now() -
                            new Date(sensor.last_seen || 0).getTime() <
                            5 * 60 * 1000;
                        return (
                          <motion.tr
                            key={sensor.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors group"
                          >
                            <td className="px-6 py-4">
                              <div
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border ${
                                  isOnline
                                    ? "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800/50"
                                    : "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800/50"
                                }`}
                              >
                                <div
                                  className={`w-1.5 h-1.5 rounded-full ${isOnline ? "bg-green-500 animate-pulse" : "bg-red-500"}`}
                                ></div>
                                {isOnline ? t("dash.online") : "Offline"}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-500 dark:text-slate-400 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 group-hover:text-blue-600 transition-colors">
                                  <Cpu size={16} />
                                </div>
                                <div>
                                  <div className="font-bold text-gray-900 dark:text-white text-sm">
                                    {sensor.identifier}
                                  </div>
                                  {sensor.address ? (
                                    <div className="flex items-center gap-1 text-[10px] text-blue-500 font-bold uppercase mt-0.5">
                                      <MapPin size={10} /> {sensor.address}
                                    </div>
                                  ) : (
                                    sensor.latitude &&
                                    sensor.longitude && (
                                      <div className="flex items-center gap-1 text-[10px] text-blue-500 font-bold uppercase mt-0.5">
                                        <MapPin size={10} /> Localizado
                                      </div>
                                    )
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <code className="text-[10px] bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded font-mono text-blue-600 dark:text-blue-400">
                                  {sensor.token
                                    ? sensor.token.substring(0, 8) + "..."
                                    : "---"}
                                </code>
                                {sensor.token && (
                                  <button
                                    onClick={() => handleCopy(sensor.token!)}
                                    className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded text-gray-400 hover:text-blue-600 transition-all"
                                    title="Copiar Token"
                                  >
                                    {copying === sensor.token ? (
                                      <CheckCircle2
                                        size={12}
                                        className="text-green-500"
                                      />
                                    ) : (
                                      <Copy size={12} />
                                    )}
                                  </button>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                {sensor.name}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <div
                                onClick={() =>
                                  canManage && startEditingLimits(sensor)
                                }
                                className={`group/limit cursor-pointer text-xs font-bold px-2 py-1 rounded-lg inline-flex items-center gap-2 transition-all ${
                                  (sensor.alert_limits && Object.keys(sensor.alert_limits).length > 0) || sensor.temp_limit
                                    ? "text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100"
                                    : "text-gray-400 bg-gray-50 dark:bg-slate-700/50 hover:bg-gray-100"
                                }`}
                              >
                                {sensor.alert_limits && Object.keys(sensor.alert_limits).length > 0
                                  ? Object.entries(sensor.alert_limits)
                                      .map(([key, val]) => {
                                        const mag = getMagnitudeByKey(key);
                                        let formattedValue = formatMagnitude ? formatMagnitude(Number(val), key) : val;
                                        if (formattedValue === val.toString() && mag) formattedValue = `${val}${mag.unit}`;
                                        return mag ? `${formattedValue} (${mag.name})` : `${formattedValue} (${key})`;
                                      })
                                      .join(", ")
                                  : sensor.temp_limit
                                  ? `${formatTemp(Number(sensor.temp_limit))} (Temperatura)`
                                  : "SEM LIMITE"}
                                {canManage && (
                                  <Edit2
                                    size={10}
                                    className="opacity-0 group-hover/limit:opacity-100 transition-opacity"
                                  />
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                                {sensor.last_seen
                                  ? new Date(sensor.last_seen).toLocaleString('pt-BR')
                                  : "NUNCA CONECTADO"}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                              {canManage ? (
                                <button
                                  onClick={() => handleDelete(sensor)}
                                  className="text-gray-400 hover:text-red-600 transition-all p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl"
                                  title="Remover Dispositivo"
                                >
                                  <Trash2 size={18} />
                                </button>
                              ) : (
                                <div
                                  className="text-gray-300 dark:text-slate-700 p-2 inline-block cursor-not-allowed"
                                  title="Apenas leitura"
                                >
                                  <Lock size={16} />
                                </div>
                              )}
                            </td>
                          </motion.tr>
                        );
                      })}
                    </AnimatePresence>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Cadastro */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-lg w-full border border-gray-200 dark:border-slate-700 flex flex-col max-h-[90vh]"
            >
              <div className="bg-blue-600 p-6 text-white flex justify-between items-start shrink-0">
                <div>
                  <h2 className="text-xl font-black italic tracking-tighter flex items-center gap-2">
                    <Cpu size={24} /> {t("dev.add_title")}
                  </h2>
                  <p className="text-blue-100 text-xs mt-1 font-medium">
                    Preencha os dados do hardware para iniciar a coleta.
                  </p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 hover:bg-white/20 rounded-lg transition-colors text-white"
                >
                  <CloseIcon size={24} />
                </button>
              </div>

              <div className="overflow-y-auto p-6 flex-1">
                <form id="sensor-form" onSubmit={handleAddSensor} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                    {t("dev.label_id")}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: ESP32-REFEITORIO-01"
                    className="w-full px-4 py-3 border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-mono text-sm"
                    value={newSensor.identifier}
                    onChange={(e) =>
                      setNewSensor({ ...newSensor, identifier: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                    {t("dev.label_name")}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Ar-condicionado Central"
                    className="w-full px-4 py-3 border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
                    value={newSensor.name}
                    onChange={(e) =>
                      setNewSensor({ ...newSensor, name: e.target.value })
                    }
                  />
                </div>

                {/* Grandezas Monitoradas */}
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1">
                    <Cpu size={12} className="text-purple-500" /> Grandezas Monitoradas
                  </p>
                  <div className="space-y-2 border border-gray-100 dark:border-slate-700 rounded-xl p-2 bg-slate-50 dark:bg-slate-900/50">
                    {MAGNITUDE_CATEGORIES.map((category) => (
                      <div key={category.name} className="border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 overflow-hidden">
                        <button
                          type="button"
                          onClick={() => setExpandedCategory(expandedCategory === category.name ? null : category.name)}
                          className="w-full flex items-center justify-between p-3 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
                        >
                          <span>{category.name}</span>
                          {expandedCategory === category.name ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                        
                        <AnimatePresence>
                          {expandedCategory === category.name && (
                            <motion.div
                              initial={{ height: 0 }}
                              animate={{ height: "auto" }}
                              exit={{ height: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="p-3 pt-0 flex flex-wrap gap-2 border-t border-gray-100 dark:border-slate-700">
                                {category.magnitudes.map((mag) => {
                                  const isSelected = newSensor.monitored_magnitudes.includes(mag.key);
                                  return (
                                    <button
                                      type="button"
                                      key={mag.key}
                                      onClick={() => {
                                        setNewSensor(prev => {
                                          const newMagnitudes = isSelected 
                                            ? prev.monitored_magnitudes.filter(k => k !== mag.key)
                                            : [...prev.monitored_magnitudes, mag.key];
                                          return { ...prev, monitored_magnitudes: newMagnitudes };
                                        });
                                      }}
                                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors border ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800' : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50'}`}
                                    >
                                      <div className="flex items-center gap-1.5">
                                        <div className={`w-2 h-2 rounded-full ${isSelected ? 'bg-blue-500' : 'bg-gray-300 dark:bg-slate-600'}`}></div>
                                        {mag.name}
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Limites de Alerta */}
                <div className="border border-red-100 dark:border-red-900/30 rounded-xl p-4 bg-red-50/50 dark:bg-red-900/10">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newSensor.has_alerts}
                      onChange={(e) => setNewSensor({ ...newSensor, has_alerts: e.target.checked })}
                      className="w-4 h-4 text-red-600 rounded border-gray-300 focus:ring-red-500 dark:border-slate-600 dark:bg-slate-700"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                        <ShieldCheck size={16} className="text-red-500" /> Ativar Limites de Alerta
                      </p>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                        Configure valores máximos para as grandezas monitoradas.
                      </p>
                    </div>
                  </label>

                  {newSensor.has_alerts && newSensor.monitored_magnitudes.length > 0 && (
                    <div className="mt-4 space-y-3 pt-4 border-t border-red-100 dark:border-red-900/30">
                      {newSensor.monitored_magnitudes.map(key => {
                        const mag = getMagnitudeByKey(key);
                        if (!mag) return null;
                        return (
                          <div key={key}>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                              Limite de {mag.name} ({mag.unit})
                            </label>
                            <input
                              type="number"
                              step="0.1"
                              placeholder="Ex: 100"
                              className="w-full px-3 py-2 border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-red-500 outline-none transition-all text-sm"
                              value={newSensor.alert_limits[key] || ""}
                              onChange={(e) =>
                                setNewSensor({
                                  ...newSensor,
                                  alert_limits: {
                                    ...newSensor.alert_limits,
                                    [key]: e.target.value
                                  }
                                })
                              }
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {newSensor.has_alerts && newSensor.monitored_magnitudes.length === 0 && (
                    <p className="text-xs text-amber-600 dark:text-amber-500 mt-4 italic">
                      Selecione ao menos uma grandeza monitorada acima para configurar os limites.
                    </p>
                  )}
                </div>

                <div className="pt-2">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1">
                    <MapPin size={12} className="text-blue-500" /> Endereço de
                    Instalação
                  </p>
                  <div className="space-y-4">
                    <div>
                      <input
                        type="text"
                        placeholder="Ex: Rua das Flores, 123 - São Paulo, SP"
                        className="w-full px-4 py-3 border border-gray-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
                        value={newSensor.address}
                        onChange={(e) =>
                          setNewSensor({
                            ...newSensor,
                            address: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400">
                          LATITUDE (OPCIONAL)
                        </label>
                        <input
                          type="text"
                          placeholder="-23.5505"
                          className="w-full px-3 py-2 border border-gray-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-gray-900 dark:text-white rounded-lg text-xs"
                          value={newSensor.latitude}
                          onChange={(e) =>
                            setNewSensor({
                              ...newSensor,
                              latitude: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400">
                          LONGITUDE (OPCIONAL)
                        </label>
                        <input
                          type="text"
                          placeholder="-46.6333"
                          className="w-full px-3 py-2 border border-gray-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-gray-900 dark:text-white rounded-lg text-xs"
                          value={newSensor.longitude}
                          onChange={(e) =>
                            setNewSensor({
                              ...newSensor,
                              longitude: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-4 py-3 text-gray-500 dark:text-gray-400 font-bold text-xs uppercase tracking-widest hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl transition-all"
                  >
                    {t("dev.cancel")}
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving || saveSuccess}
                    className={`flex-1 px-4 py-3 font-bold text-xs uppercase tracking-widest rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${
                      saveSuccess
                        ? "bg-green-500 text-white"
                        : "bg-blue-600 text-white hover:bg-blue-700 shadow-blue-900/20"
                    }`}
                  >
                    {isSaving ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : saveSuccess ? (
                      <>
                        <CheckCircle2 size={16} /> SALVO!
                      </>
                    ) : (
                      t("dev.save")
                    )}
                  </button>
                </div>
              </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Edit Limits Modal */}
      <AnimatePresence>
        {editingLimitSensor && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingLimitSensor(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden border border-gray-100 dark:border-slate-700"
            >
              <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800/50">
                <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                  <ShieldCheck size={18} className="text-red-500" /> 
                  Limites de Alerta
                </h3>
                <button
                  onClick={() => setEditingLimitSensor(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                >
                  <CloseIcon size={20} />
                </button>
              </div>

              <div className="p-6">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                  Editando limites para <strong>{editingLimitSensor.name}</strong>.
                </p>

                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                  {editingLimitSensor.monitored_magnitudes?.length > 0 ? (
                    editingLimitSensor.monitored_magnitudes.map(key => {
                      const mag = getMagnitudeByKey(key);
                      if (!mag) return null;
                      return (
                        <div key={key}>
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                            Limite de {mag.name} ({getMagnitudeUnit(key, mag.unit)})
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            placeholder="Sem limite"
                            className="w-full px-3 py-2 border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-red-500 outline-none transition-all text-sm"
                            value={editingAlertLimits[key] || ""}
                            onChange={(e) =>
                              setEditingAlertLimits({
                                ...editingAlertLimits,
                                [key]: e.target.value
                              })
                            }
                          />
                        </div>
                      );
                    })
                  ) : (
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                        Limite de Temperatura ({getMagnitudeUnit('temperatura', '°C')})
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        placeholder="Sem limite"
                        className="w-full px-3 py-2 border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-red-500 outline-none transition-all text-sm"
                        value={editingAlertLimits['temperatura'] || ""}
                        onChange={(e) =>
                          setEditingAlertLimits({
                            ...editingAlertLimits,
                            ['temperatura']: e.target.value
                          })
                        }
                      />
                    </div>
                  )}
                </div>
                
                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => setEditingLimitSensor(null)}
                    className="flex-1 px-4 py-2 text-sm font-bold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-slate-700 rounded-xl hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={saveLimitsModal}
                    className="flex-1 px-4 py-2 text-sm font-bold text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-500/30 flex items-center justify-center gap-2"
                  >
                    <Check size={16} /> Salvar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
