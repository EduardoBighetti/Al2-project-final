import React, { createContext, useContext, useState } from 'react';

interface LanguageContextType {
  language: string;
  setLanguage: (lang: string) => void;
  t: (key: string) => string;
  units: { system?: 'metric' | 'imperial', temperature?: string };
  setUnits?: (units: { system?: 'metric' | 'imperial', temperature?: string }) => void;
  formatTemp: (tempC: number) => string;
  formatMagnitude: (value: number, key: string) => string;
  convertMagnitudeValue: (value: number, key: string) => number;
  revertMagnitudeValue: (value: number, key: string) => number;
  getMagnitudeUnit: (key: string, defaultUnit: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState('pt');
  const [units, setUnits] = useState<{ system?: 'metric' | 'imperial', temperature?: string }>({ system: 'metric', temperature: 'C' });

  const formatTemp = (tempC: number) => {
    if (units.system === 'imperial' || units.temperature === 'F') {
      return `${(tempC * 1.8 + 32).toFixed(1)}°F`;
    }
    return `${tempC.toFixed(1)}°C`;
  };

  const convertMagnitudeValue = (value: number, key: string) => {
    if (key === 'temperatura') {
        return units.system === 'imperial' || units.temperature === 'F' ? (value * 1.8 + 32) : value;
    }
    
    if (units.system === 'imperial') {
      switch (key) {
        case 'comprimento': return value * 3.28084;
        case 'area': return value * 10.7639;
        case 'volume': return value * 35.3147;
        case 'velocidade': return value * 2.23694;
        case 'massa': return value * 2.20462;
        case 'forca':
        case 'peso': return value * 0.224809;
      }
    }
    return value;
  };

  const revertMagnitudeValue = (value: number, key: string) => {
    if (key === 'temperatura') {
        return units.system === 'imperial' || units.temperature === 'F' ? ((value - 32) / 1.8) : value;
    }
    
    if (units.system === 'imperial') {
      switch (key) {
        case 'comprimento': return value / 3.28084;
        case 'area': return value / 10.7639;
        case 'volume': return value / 35.3147;
        case 'velocidade': return value / 2.23694;
        case 'massa': return value / 2.20462;
        case 'forca':
        case 'peso': return value / 0.224809;
      }
    }
    return value;
  };

  const getMagnitudeUnit = (key: string, defaultUnit: string) => {
    if (key === 'temperatura') return units.system === 'imperial' || units.temperature === 'F' ? '°F' : '°C';
    if (units.system === 'imperial') {
      switch (key) {
        case 'comprimento': return 'ft';
        case 'area': return 'sq ft';
        case 'volume': return 'cu ft';
        case 'velocidade': return 'mph';
        case 'massa': return 'lb';
        case 'forca':
        case 'peso': return 'lbf';
      }
    }
    return defaultUnit;
  };

  const formatMagnitude = (value: number, key: string) => {
    const val = convertMagnitudeValue(value, key);
    if (key === 'temperatura') return formatTemp(value);
    
    if (units.system === 'imperial') {
      switch (key) {
        case 'comprimento': return `${val.toFixed(2)} ft`;
        case 'area': return `${val.toFixed(2)} sq ft`;
        case 'volume': return `${val.toFixed(2)} cu ft`;
        case 'velocidade': return `${val.toFixed(2)} mph`;
        case 'massa': return `${val.toFixed(2)} lb`;
        case 'forca':
        case 'peso': return `${val.toFixed(2)} lbf`;
      }
    }
    
    // Default/Metric units mapping fallback if not handled in Devices
    switch (key) {
      case 'comprimento': return `${val} m`;
      case 'area': return `${val} m²`;
      case 'volume': return `${val} m³`;
      case 'velocidade': return `${val} m/s`;
      case 'massa': return `${val} kg`;
      case 'forca':
      case 'peso': return `${val} N`;
    }
    
    return val.toString();
  };

  const t = (key: string) => {
    const ptTranslations: Record<string, string> = {
      'menu.main': 'Principal',
      'menu.dashboard': 'Dashboard',
      'menu.monitoring': 'Monitoramento',
      'menu.devices': 'Dispositivos',
      'menu.arduino': 'Arduino IDE',
      'menu.config': 'Configurações',
      'menu.account': 'Minha Conta',
      'menu.logout': 'Sair',
      'dash.loading': 'Carregando...',
      'set.test_active': 'Modo Teste Ativo',
      'dev.add_title': 'Adicionar Dispositivo',
      'header.title': 'Monitoramento de Projetos',
      'dash.title': 'Visão Geral do Sistema',
      'role.admin': 'Administrador',
      'role.gerencia': 'Gerência',
      'role.gerente': 'Gerente',
      'role.user': 'Usuário Padrão',
      'dev.title': 'Dispositivos',
      'dev.subtitle': 'Gerencie os sensores conectados ao seu projeto',
      'dev.new_btn': 'Novo Dispositivo',
      'dev.status': 'Status',
      'dev.id': 'ID / MAC',
      'dev.name': 'Nome do Sensor',
      'dev.last_seen': 'Última Conexão',
      'dev.actions': 'Ações',
      'dash.online': 'Online',
      'dev.label_id': 'Identificador Único (ex: MAC ou UUID)',
      'dev.label_name': 'Nome de Exibição',
      'dev.cancel': 'Cancelar',
      'dev.save': 'Salvar',
      'mon.select_placeholder': 'Selecione um Sensor'
    };

    const enTranslations: Record<string, string> = {
      'menu.main': 'Main',
      'menu.dashboard': 'Dashboard',
      'menu.monitoring': 'Monitoring',
      'menu.devices': 'Devices',
      'menu.arduino': 'Arduino IDE',
      'menu.config': 'Settings',
      'menu.account': 'My Account',
      'menu.logout': 'Logout',
      'dash.loading': 'Loading...',
      'set.test_active': 'Test Mode Active',
      'dev.add_title': 'Add Device',
      'header.title': 'Project Monitoring',
      'dash.title': 'System Overview',
      'role.admin': 'Administrator',
      'role.gerencia': 'Management',
      'role.gerente': 'Manager',
      'role.user': 'Standard User',
      'dev.title': 'Devices',
      'dev.subtitle': 'Manage sensors connected to your project',
      'dev.new_btn': 'New Device',
      'dev.status': 'Status',
      'dev.id': 'ID / MAC',
      'dev.name': 'Sensor Name',
      'dev.last_seen': 'Last Seen',
      'dev.actions': 'Actions',
      'dash.online': 'Online',
      'dev.label_id': 'Unique Identifier (e.g. MAC or UUID)',
      'dev.label_name': 'Display Name',
      'dev.cancel': 'Cancel',
      'dev.save': 'Save',
      'mon.select_placeholder': 'Select a Sensor'
    };

    const esTranslations: Record<string, string> = {
      'menu.main': 'Principal',
      'menu.dashboard': 'Panel',
      'menu.monitoring': 'Monitoreo',
      'menu.devices': 'Dispositivos',
      'menu.arduino': 'Arduino IDE',
      'menu.config': 'Configuraciones',
      'menu.account': 'Mi Cuenta',
      'menu.logout': 'Cerrar Sesión',
      'dash.loading': 'Cargando...',
      'set.test_active': 'Modo Prueba Activo',
      'dev.add_title': 'Añadir Dispositivo',
      'header.title': 'Monitoreo de Proyectos',
      'dash.title': 'Resumen del Sistema',
      'role.admin': 'Administrador',
      'role.gerencia': 'Gerencia',
      'role.gerente': 'Gerente',
      'role.user': 'Usuario Estándar',
      'dev.title': 'Dispositivos',
      'dev.subtitle': 'Gestiona los sensores conectados a tu proyecto',
      'dev.new_btn': 'Nuevo Dispositivo',
      'dev.status': 'Estado',
      'dev.id': 'ID / MAC',
      'dev.name': 'Nombre del Sensor',
      'dev.last_seen': 'Última Conexión',
      'dev.actions': 'Acciones',
      'dash.online': 'En línea',
      'dev.label_id': 'Identificador Único (ej: MAC o UUID)',
      'dev.label_name': 'Nombre para Mostrar',
      'dev.cancel': 'Cancelar',
      'dev.save': 'Guardar',
      'mon.select_placeholder': 'Seleccione un Sensor'
    };

    const dicts: Record<string, Record<string, string>> = {
      'pt': ptTranslations,
      'en': enTranslations,
      'es': esTranslations
    };

    const dict = dicts[language] || ptTranslations;
    return dict[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, units, setUnits, formatTemp, formatMagnitude, convertMagnitudeValue, revertMagnitudeValue, getMagnitudeUnit }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
