import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { authService, systemLogService } from '../services/api';
import { User as UserIcon, Monitor, Settings as SettingsIcon, MessageSquare, LogOut, Phone } from 'lucide-react';

interface SettingsProps {
  user: User;
  onUpdateUser: (user: User) => void;
  onLogout: () => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ user, onUpdateUser, onLogout, isDarkMode, toggleTheme }) => {
  const { language, setLanguage, units, setUnits, t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'profile' | 'appearance' | 'preferences' | 'feedback' | 'account'>('profile');
  
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: user.full_name || '',
    email: user.email || '',
    phone: user.phone || '',
    avatar: user.avatar || ''
  });
  const [isSaving, setIsSaving] = useState(false);

  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [isSendingFeedback, setIsSendingFeedback] = useState(false);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      await authService.updateUser(user.id, {
        full_name: editForm.full_name,
        email: editForm.email,
        phone: editForm.phone,
        avatar: editForm.avatar
      });
      onUpdateUser({ ...user, full_name: editForm.full_name, email: editForm.email, phone: editForm.phone, avatar: editForm.avatar });
      setIsEditing(false);
      await systemLogService.addLog(user.full_name || user.username, 'Atualizou as informações do perfil', 'info');
    } catch (err) {
      alert("Erro ao salvar o perfil.");
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditForm({ ...editForm, avatar: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSendFeedback = async () => {
    if (!feedbackMsg.trim()) return;
    setIsSendingFeedback(true);
    try {
      const email = user.email || user.username;
      await authService.sendFeedback(email, feedbackMsg);
      await systemLogService.addLog(user.full_name || user.username, 'Enviou um feedback', 'info');
      setFeedbackMsg('');
      alert("Feedback enviado com sucesso!");
    } catch (err) {
      alert("Erro ao enviar feedback.");
      console.error(err);
    } finally {
      setIsSendingFeedback(false);
    }
  };

  return (
    <div className="p-8 h-full overflow-y-auto">
      <h1 className="text-2xl font-bold mb-6">Configurações</h1>
      
      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-64 flex flex-col gap-2">
          <button 
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'profile' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 font-medium' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800'}`}
          >
            <UserIcon size={18} />
            Perfil
          </button>
          <button 
            onClick={() => setActiveTab('appearance')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'appearance' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 font-medium' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800'}`}
          >
            <Monitor size={18} />
            Aparência
          </button>
          <button 
            onClick={() => setActiveTab('preferences')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'preferences' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 font-medium' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800'}`}
          >
            <SettingsIcon size={18} />
            Preferências
          </button>
          <button 
            onClick={() => setActiveTab('feedback')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'feedback' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 font-medium' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800'}`}
          >
            <MessageSquare size={18} />
            Feedback
          </button>
          <button 
            onClick={() => setActiveTab('account')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'account' ? 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 font-medium' : 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'}`}
          >
            <LogOut size={18} />
            Sair da Conta
          </button>
        </div>

        <div className="flex-1 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 max-w-2xl">
          {activeTab === 'profile' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Informações do Perfil</h2>
                {!isEditing && (
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="text-blue-500 hover:text-blue-600 text-sm font-medium"
                  >
                    Editar Perfil
                  </button>
                )}
              </div>
              
              {isEditing ? (
                <div className="space-y-4 mb-6 border border-gray-100 dark:border-slate-700 p-4 rounded-lg bg-gray-50 dark:bg-slate-900/50">
                  <div>
                    <label className="block text-sm text-gray-500 mb-1">Nome Completo</label>
                    <input 
                      type="text" 
                      value={editForm.full_name}
                      onChange={(e) => setEditForm({...editForm, full_name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-500 mb-1">Email</label>
                    <input 
                      type="email" 
                      value={editForm.email}
                      onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-500 mb-1">Foto de Perfil (Opcional)</label>
                    <input 
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    {editForm.avatar && (
                      <div className="mt-2 flex items-center gap-2">
                        <img src={editForm.avatar} alt="Preview" className="w-10 h-10 rounded-full object-cover shadow-sm" />
                        <button onClick={() => setEditForm({...editForm, avatar: ''})} className="text-xs text-red-500 font-medium">Remover</button>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm text-gray-500 mb-1 flex items-center gap-1">
                      <Phone size={14} /> Telefone para Alertas
                    </label>
                    <input 
                      type="tel" 
                      value={editForm.phone}
                      onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                      placeholder="(11) 99999-9999"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex gap-2 justify-end mt-4">
                    <button 
                      onClick={() => {
                        setEditForm({ full_name: user.full_name || '', email: user.email || '', phone: user.phone || '', avatar: user.avatar || '' });
                        setIsEditing(false);
                      }}
                      disabled={isSaving}
                      className="px-4 py-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 font-medium transition-colors"
                    >
                      Cancelar
                    </button>
                    <button 
                      onClick={handleSaveProfile}
                      disabled={isSaving}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                      {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-4 mb-4">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.full_name || user.username} className="w-16 h-16 rounded-full object-cover shadow-sm" />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 text-2xl font-bold">
                        {(user.full_name || user.username).charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-lg">{user.full_name || user.username}</p>
                      <p className="text-sm text-gray-500 uppercase">{user.role}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-100 dark:border-slate-700">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Email</p>
                      <p className="font-medium">{user.email || 'Não informado'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Telefone (Alertas)</p>
                      <p className="font-medium">{user.phone || 'Não informado'}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'appearance' && (
            <div>
              <h2 className="text-xl font-bold mb-6">Aparência do Sistema</h2>
              <div className="flex items-center justify-between p-4 border border-gray-100 dark:border-slate-700 rounded-xl bg-gray-50 dark:bg-slate-900/50">
                <div>
                  <p className="font-medium">Modo Escuro</p>
                  <p className="text-sm text-gray-500">Alternar o tema visual da interface</p>
                </div>
                <button 
                  onClick={toggleTheme}
                  className={`w-12 h-6 rounded-full transition-colors ${isDarkMode ? 'bg-blue-600' : 'bg-gray-300'} relative`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${isDarkMode ? 'translate-x-7' : 'translate-x-1'}`}></div>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'preferences' && (
            <div>
              <h2 className="text-xl font-bold mb-6">Preferências Regionais</h2>
              
              <div className="space-y-4">
                <div className="p-4 border border-gray-100 dark:border-slate-700 rounded-xl bg-gray-50 dark:bg-slate-900/50">
                  <p className="font-medium mb-1">Idioma do Sistema</p>
                  <p className="text-sm text-gray-500 mb-3">Escolha o idioma de exibição do painel</p>
                  <select 
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full max-w-xs px-3 py-2 border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="pt">Português (Brasil)</option>
                    <option value="en">English (US)</option>
                    <option value="es">Español (ES)</option>
                  </select>
                </div>

                <div className="p-4 border border-gray-100 dark:border-slate-700 rounded-xl bg-gray-50 dark:bg-slate-900/50">
                  <p className="font-medium mb-1">Sistema de Unidades</p>
                  <p className="text-sm text-gray-500 mb-3">Escolha o sistema de medidas padrão</p>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setUnits?.({ ...units, system: 'metric' })}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${(!units.system || units.system === 'metric') ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 dark:bg-slate-700 dark:text-gray-300'}`}
                    >
                      Métrico (ºC, m, kg)
                    </button>
                    <button 
                      onClick={() => setUnits?.({ ...units, system: 'imperial' })}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${units.system === 'imperial' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 dark:bg-slate-700 dark:text-gray-300'}`}
                    >
                      Imperial (ºF, ft, lb)
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'feedback' && (
            <div>
              <h2 className="text-xl font-bold mb-6">Deixar Feedback</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm">
                Sua opinião é muito importante. Encontrou um problema ou tem alguma sugestão de melhoria? Envie-nos uma mensagem! 
                Este feedback será armazenado e visualizado pela gerência do sistema.
              </p>
              
              <div className="space-y-4">
                <textarea
                  value={feedbackMsg}
                  onChange={(e) => setFeedbackMsg(e.target.value)}
                  placeholder="Descreva aqui sua sugestão ou problema..."
                  rows={5}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                ></textarea>
                <button
                  onClick={handleSendFeedback}
                  disabled={isSendingFeedback || !feedbackMsg.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {isSendingFeedback ? 'Enviando...' : 'Enviar Feedback'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'account' && (
            <div>
              <h2 className="text-xl font-bold mb-6 text-red-600 dark:text-red-400">Sair da Conta</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Deseja realmente sair do sistema? Você precisará realizar o login novamente para acessar o painel.
              </p>
              <button 
                onClick={onLogout}
                className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
              >
                Sim, sair do sistema
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

