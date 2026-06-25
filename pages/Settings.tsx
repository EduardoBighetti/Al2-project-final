import React from 'react';
import { User } from '../types';

interface SettingsProps {
  user: User;
  onUpdateUser: (user: User) => void;
  onLogout: () => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ user, onUpdateUser, onLogout, isDarkMode, toggleTheme }) => {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Configurações</h1>
      
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 max-w-2xl">
        <h2 className="text-xl font-bold mb-4">Perfil</h2>
        <div className="mb-4">
          <p className="text-sm text-gray-500">Nome:</p>
          <p className="font-medium">{user.full_name || user.username}</p>
        </div>
        <div className="mb-4">
          <p className="text-sm text-gray-500">Email:</p>
          <p className="font-medium">{user.email || 'N/A'}</p>
        </div>
        <div className="mb-6">
          <p className="text-sm text-gray-500">Cargo:</p>
          <p className="font-medium uppercase">{user.role}</p>
        </div>
        
        <h2 className="text-xl font-bold mb-4">Aparência</h2>
        <div className="flex items-center gap-4 mb-6">
          <span className="text-sm font-medium">Modo Escuro</span>
          <button 
            onClick={toggleTheme}
            className={`w-12 h-6 rounded-full transition-colors ${isDarkMode ? 'bg-blue-600' : 'bg-gray-300'} relative`}
          >
            <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${isDarkMode ? 'translate-x-7' : 'translate-x-1'}`}></div>
          </button>
        </div>
        
        <div className="pt-4 border-t border-gray-200 dark:border-slate-700">
          <button 
            onClick={onLogout}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
          >
            Sair da Conta
          </button>
        </div>
      </div>
    </div>
  );
};
