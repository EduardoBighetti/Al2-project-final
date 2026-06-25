import React, { createContext, useContext, useState } from 'react';

interface LanguageContextType {
  language: string;
  setLanguage: (lang: string) => void;
  t: (key: string) => string;
  units: { temperature: string };
  setUnits?: (units: { temperature: string }) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState('pt');
  const [units, setUnits] = useState({ temperature: 'C' });

  const t = (key: string) => {
    // Basic fallback for translations, since the original file was lost
    const translations: Record<string, string> = {
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
      'role.user': 'Usuário Padrão'
    };
    return translations[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, units, setUnits }}>
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
