
import React, { useEffect, useState, useRef } from 'react';
import { readingService, sensorService, systemLogService } from '../services/api';
import { notificationService } from '../services/notificationService';
import { Reading, Sensor } from '../types';
import { Bell, BellOff, AlertTriangle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../contexts/LanguageContext';

export const AlertMonitor: React.FC = () => {
  const { formatTemp, formatMagnitude } = useLanguage();
  const [readings, setReadings] = useState<Reading[]>([]);
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    return localStorage.getItem('alerts_enabled') !== 'false';
  });
  const [showAlert, setShowAlert] = useState(false);
  const [alertInfo, setAlertInfo] = useState<{ sensorName: string; temp: number; limit: number; magnitudeKey?: string } | null>(null);
  
  // Guardamos o ID da última leitura que disparou alerta para não repetir no reload
  const lastAlertReadingId = useRef<Record<number, string>>({});
  
  // Para evitar notificações seguidas em menos de 5 minutos do mesmo sensor
  const lastAlertTimestamp = useRef<Record<number, number>>({});
  const ALERT_COOLDOWN = 5 * 60 * 1000; 

  const sensorsRef = useRef<Sensor[]>([]);

  useEffect(() => {
    // Subscrever aos sensores para ter os limites atualizados
    const unsubscribeSensors = sensorService.subscribeAll((newSensors) => {
      setSensors(newSensors);
      sensorsRef.current = newSensors;
    });
    
    try {
      const savedIds = localStorage.getItem('lastAlertReadingIds');
      if (savedIds) lastAlertReadingId.current = JSON.parse(savedIds);
      
      const savedTimestamps = localStorage.getItem('lastAlertTimestamps');
      if (savedTimestamps) lastAlertTimestamp.current = JSON.parse(savedTimestamps);
    } catch(e) {}

    // Subscrever às últimas leituras
    const unsubscribeReadings = readingService.subscribeLatest((newReadings) => {
      if (!notificationsEnabled) return; // Não processa alertas se estiver desligado

      setReadings(newReadings);
      
      // Checar limites
      newReadings.forEach(reading => {
        const sensor = sensorsRef.current.find(s => s.id === reading.sensor_id);
        const readingTime = new Date(reading.created_at).getTime();
        const now = Date.now();
        
        // Só dispara alertas para leituras recentes, se o sensor estiver ONLINE e se alertas estiverem ativados
        const isOnline = sensor && sensor.status === 'active' && (now - new Date(sensor.last_seen || 0).getTime() < 5 * 60 * 1000);
        
        const hasAlerts = sensor?.has_alerts;
        
        if (isOnline && hasAlerts && (now - readingTime < 5 * 60 * 1000) && (now - readingTime >= -60000)) {
          let triggered = false;
          let currentVal = 0;
          let limit = 0;
          let magnitudeKey = '';

          // Support backward compatibility with temp_limit
          const tempLim = sensor?.alert_limits?.temperatura ? Number(sensor.alert_limits.temperatura) : (sensor?.temp_limit || 0);
          if (tempLim > 0 && reading.temperature >= tempLim) {
            triggered = true;
            currentVal = reading.temperature;
            limit = tempLim;
            magnitudeKey = 'temperatura';
          }
          
          if (!triggered && sensor?.alert_limits) {
            for (const [key, val] of Object.entries(sensor.alert_limits)) {
              if (key === 'temperatura') continue;
              const readingVal = reading.values ? reading.values[key] : undefined;
              if (readingVal !== undefined && Number(val) > 0 && readingVal >= Number(val)) {
                triggered = true;
                currentVal = readingVal;
                limit = Number(val);
                magnitudeKey = key;
                break;
              }
            }
          }

          if (triggered) {
            const lastAlert = lastAlertTimestamp.current[sensor.id] || 0;
            const lastReadingId = lastAlertReadingId.current[sensor.id] || '';
            
            if (reading.id && String(reading.id) !== String(lastReadingId) && (now - lastAlert > ALERT_COOLDOWN)) {
              triggerAlert(sensor, currentVal, limit, magnitudeKey);
              
              lastAlertTimestamp.current[sensor.id] = now;
              lastAlertReadingId.current[sensor.id] = String(reading.id);
              
              localStorage.setItem('lastAlertTimestamps', JSON.stringify(lastAlertTimestamp.current));
              localStorage.setItem('lastAlertReadingIds', JSON.stringify(lastAlertReadingId.current));
            }
          }
        }
      });
    });

    return () => {
      unsubscribeSensors();
      unsubscribeReadings();
    };
  }, [notificationsEnabled]);

  const triggerAlert = async (sensor: Sensor, currentVal: number, limit: number, magnitudeKey: string) => {
    const isTemp = magnitudeKey === 'temperatura';
    const title = isTemp ? '🚨 ALERTA DE TEMPERATURA' : `🚨 ALERTA: ${magnitudeKey.toUpperCase()}`;
    const formattedVal = formatMagnitude ? formatMagnitude(currentVal, magnitudeKey) : currentVal.toString();
    const formattedLimit = formatMagnitude ? formatMagnitude(limit, magnitudeKey) : limit.toString();
    
    const message = `O sensor "${sensor.name}" atingiu ${formattedVal} (Limite: ${formattedLimit})`;
    
    // 1. Log no sistema
    await systemLogService.addLog('Sistema', `Alerta crítico no sensor ${sensor.name} (${formattedVal}). Limite: ${formattedLimit}`, 'danger');

    // 2. Notificação do Navegador (System push)
    if (notificationService.isEnabled()) {
      notificationService.notify(title, message);
    }
    
    // 3. Alerta Visual Interno (Banner)
    setAlertInfo({ 
      sensorName: sensor.name, 
      temp: currentVal, // keep state name temp for simplicity, though it could be generic
      limit: limit,
      magnitudeKey: magnitudeKey
    });
    setShowAlert(true);
    
    // Esconder banner após 10 segundos
    setTimeout(() => setShowAlert(false), 10000);
  };

  const handleToggleNotifications = async () => {
    if (notificationsEnabled) {
      setNotificationsEnabled(false);
      localStorage.setItem('alerts_enabled', 'false');
      // Hide any active alert when disabled
      setShowAlert(false);
    } else {
      setNotificationsEnabled(true);
      localStorage.setItem('alerts_enabled', 'true');
      
      // Mostrar feedback imediato
      setAlertInfo({
        sensorName: 'Sistema',
        temp: 0,
        limit: 0
      });
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000);
      
      try {
        const granted = await notificationService.requestPermission();
        if (granted) {
          notificationService.notify('✅ Alertas Ativados', 'Você receberá avisos automáticos de temperatura crítica.');
        }
      } catch (e) {
        console.warn("Navegador não suporta notificações, mas alertas visuais foram ativados.");
      }
    }
  };

  return (
    <>
      {/* Botão Flutuante de Controle */}
      <div className="fixed bottom-6 right-6 z-50">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleToggleNotifications}
          className={`p-4 rounded-full shadow-2xl flex items-center justify-center transition-colors ${
            notificationsEnabled 
              ? 'bg-blue-600 text-white' 
              : 'bg-white dark:bg-slate-800 text-gray-400 border border-gray-200 dark:border-slate-700'
          }`}
          title={notificationsEnabled ? 'Alertas via Celular Ativados' : 'Ativar Alertas via Celular (Grátis)'}
        >
          {notificationsEnabled ? <Bell size={24} /> : <BellOff size={24} />}
          {!notificationsEnabled && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-black px-2 py-1 rounded-full animate-bounce">OFF</span>
          )}
        </motion.button>
      </div>

      {/* Banner de Alerta Visual */}
      <AnimatePresence>
        {showAlert && alertInfo && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 20, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="fixed top-0 left-0 right-0 flex justify-center z-[1001] px-4"
          >
            <div className="bg-red-600 text-white p-4 rounded-2xl shadow-2xl flex items-center gap-4 max-w-lg w-full border-4 border-white/20">
              <div className="bg-white/20 p-3 rounded-xl animate-pulse">
                <AlertTriangle size={32} />
              </div>
              <div className="flex-1">
                <h4 className="font-black text-lg uppercase leading-none mb-1">
                  {alertInfo.sensorName === 'Sistema' ? 'Sistema de Alertas' : (alertInfo.magnitudeKey === 'temperatura' || !alertInfo.magnitudeKey ? 'Temperatura Crítica!' : `Alerta: ${alertInfo.magnitudeKey}`)}
                </h4>
                <p className="text-sm font-medium opacity-90">
                  {alertInfo.sensorName === 'Sistema' 
                    ? 'O monitoramento de alertas foi ativado.' 
                    : <>Sensor <b>{alertInfo.sensorName}</b> em <b>{formatMagnitude ? formatMagnitude(alertInfo.temp, alertInfo.magnitudeKey || 'temperatura') : alertInfo.temp}</b>.</>}
                </p>
              </div>
              <button 
                onClick={() => setShowAlert(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
