
import React, { useEffect, useState } from 'react';
import { Users, Shield, User as UserIcon, Calendar, Mail, MoreVertical, Key, Plus, Copy, CheckCircle2, AlertCircle, MessageSquare, Trash2, Eye, Edit2, ShieldOff, Lock, Unlock, Activity, List } from 'lucide-react';
import { authService, accessKeyService, systemLogService, SystemLog } from '../services/api';
import { User, AccessKey } from '../types';

export const UserManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'security' | 'logs' | 'feedback'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [keys, setKeys] = useState<AccessKey[]>([]);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [copying, setCopying] = useState<string | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'users') {
        const data = await authService.getUsers();
        setUsers(data);
      } else if (activeTab === 'security') {
        const data = await accessKeyService.getAll();
        // Sort keys to show unused ones first
        setKeys(data.sort((a, b) => (a.is_used === b.is_used) ? 0 : a.is_used ? 1 : -1));
      } else if (activeTab === 'logs') {
        const data = await systemLogService.getLogs();
        setLogs(data);
      } else {
        const data = await authService.getFeedbacks();
        setFeedbacks(data);
      }
    } catch (err) {
      console.error("Failed to fetch data", err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateKey = async (role: 'admin' | 'gerencia') => {
    try {
      await accessKeyService.generate(role);
      fetchData();
    } catch (err) {
      console.error("Erro ao gerar chave", err);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopying(text);
    setTimeout(() => setCopying(null), 2000);
  };

  const handleDeleteKey = async (key: string) => {
    showModal(
      'Excluir Chave de Acesso',
      'Tem certeza que deseja excluir esta chave de acesso? Ela não poderá mais ser usada.',
      'confirm',
      async () => {
        try {
          await accessKeyService.delete(key);
          fetchData();
          closeModal();
        } catch (err) {
          console.error("Erro ao deletar chave", err);
        }
      }
    );
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'gerencia': return 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800';
      case 'admin': return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800';
      default: return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-slate-700 dark:text-gray-400 dark:border-slate-600';
    }
  };

  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: React.ReactNode;
    type: 'alert' | 'confirm' | 'custom';
    onConfirm?: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'alert'
  });

  const showModal = (title: string, message: React.ReactNode, type: 'alert' | 'confirm' | 'custom' = 'alert', onConfirm?: () => void) => {
    setModalConfig({ isOpen: true, title, message, type, onConfirm });
  };
  
  const closeModal = () => {
    setModalConfig({ ...modalConfig, isOpen: false });
  };

  const handleViewDetails = (user: User) => {
    showModal('Detalhes do Usuário', (
      <div className="space-y-2 mt-2">
        <p><strong className="text-gray-800 dark:text-gray-200">Nome:</strong> {user.full_name || 'N/A'}</p>
        <p><strong className="text-gray-800 dark:text-gray-200">Usuário:</strong> @{user.username}</p>
        <p><strong className="text-gray-800 dark:text-gray-200">E-mail:</strong> {user.email}</p>
        <p><strong className="text-gray-800 dark:text-gray-200">Cargo:</strong> <span className="uppercase text-xs">{user.role}</span></p>
        <p><strong className="text-gray-800 dark:text-gray-200">Status:</strong> {user.is_blocked ? <span className="text-red-500 font-bold">Bloqueado</span> : <span className="text-green-500 font-bold">Ativo</span>}</p>
      </div>
    ));
    setActiveDropdown(null);
  };

  const [editUserForm, setEditUserForm] = useState<{full_name: string; avatar: string}>({ full_name: '', avatar: '' });
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<'admin' | 'gerencia' | 'user' | 'gerente'>('user');

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setEditUserForm({ full_name: user.full_name || '', avatar: user.avatar || '' });
    setActiveDropdown(null);
    showModal('Editar Usuário', null, 'custom');
  };

  const handleSaveEditUser = async () => {
    if (!selectedUser) return;
    await authService.updateUser(selectedUser.id, { full_name: editUserForm.full_name, avatar: editUserForm.avatar });
    await systemLogService.addLog('Sistema', `Editou o usuário ${editUserForm.full_name || selectedUser.username}`, 'edit');
    fetchData();
    closeModal();
  };

  const handleResetPassword = (user: User) => {
    showModal('Redefinir Senha', `Um link de redefinição de senha foi enviado para ${user.email}.`);
    systemLogService.addLog('Sistema', `Solicitou redefinição de senha para ${user.full_name || user.username}`, 'security');
    setActiveDropdown(null);
  };

  const handleChangePermission = async (user: User) => {
    setSelectedUser(user);
    setSelectedRole(user.role as 'admin' | 'gerencia' | 'user');
    setActiveDropdown(null);
    showModal('Alterar Permissão', null, 'custom');
  };

  const handleSavePermission = async () => {
    if (!selectedUser) return;
    await authService.updateUser(selectedUser.id, { role: selectedRole });
    await systemLogService.addLog('Sistema', `Alterou permissão de ${selectedUser.full_name || selectedUser.username} para ${selectedRole}`, 'security');
    fetchData();
    closeModal();
  };

  const handleToggleBlock = async (user: User) => {
    const isBlocking = !user.is_blocked;
    const actionText = isBlocking ? 'bloquear' : 'desbloquear';
    showModal(
      `${isBlocking ? 'Bloquear' : 'Desbloquear'} Usuário`,
      `Deseja realmente ${actionText} o usuário ${user.full_name || user.username}?`,
      'confirm',
      async () => {
        await authService.updateUser(user.id, { is_blocked: isBlocking });
        await systemLogService.addLog('Sistema', `${isBlocking ? 'Bloqueou' : 'Desbloqueou'} o usuário ${user.full_name || user.username}`, 'danger');
        fetchData();
        closeModal();
      }
    );
    setActiveDropdown(null);
  };

  const handleRemoveUser = async (user: User) => {
    showModal(
      'Remover Usuário',
      `Tem certeza absoluta que deseja remover o usuário ${user.full_name || user.username}? Esta ação não pode ser desfeita.`,
      'confirm',
      async () => {
        await authService.deleteUser(user.id);
        await systemLogService.addLog('Sistema', `Removeu o usuário ${user.full_name || user.username}`, 'danger');
        fetchData();
        closeModal();
      }
    );
    setActiveDropdown(null);
  };

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = () => setActiveDropdown(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const getRoleIcon = (role: string, size = 20) => {
    switch (role) {
      case 'admin':
        return <Shield size={size} className="text-blue-500" />;
      case 'gerencia':
        return <Users size={size} className="text-orange-500" />;
      case 'usuario':
      default:
        return <UserIcon size={size} className="text-slate-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-900/20">
              <Shield size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Centro de Controle</h1>
            <p className="text-gray-500 dark:text-gray-400">Gerencie usuários e chaves de segurança do sistema.</p>
          </div>
        </div>

        <div className="flex bg-gray-100 dark:bg-slate-800 p-1 rounded-xl overflow-x-auto">
          <button 
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'users' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
          >
            <Users size={16} /> Usuários
          </button>
          <button 
            onClick={() => setActiveTab('security')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'security' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
          >
            <Key size={16} /> Segurança
          </button>
          <button 
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'logs' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
          >
            <Activity size={16} /> Logs do Sistema
          </button>
          <button 
            onClick={() => setActiveTab('feedback')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'feedback' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
          >
            <MessageSquare size={16} /> Feedbacks
          </button>
        </div>
      </div>

      {activeTab === 'users' ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-visible">
          {loading ? (
            <div className="text-center py-20 text-gray-500">Buscando base de usuários...</div>
          ) : (
            <div className="overflow-visible">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 dark:bg-slate-700/50 border-b border-gray-100 dark:border-slate-700">
                    <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Identidade</th>
                    <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Cargo</th>
                    <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">E-mail de Contato</th>
                    <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Data Cadastro</th>
                    <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                  {users.map((user) => (
                    <tr key={user.id} className={`hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors ${activeDropdown === user.id ? 'relative z-10' : ''}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 overflow-hidden border border-gray-200 dark:border-slate-600">
                            {getRoleIcon(user.role, 20)}
                          </div>
                          <div>
                            <div className="font-bold text-gray-900 dark:text-white">{user.full_name || 'Usuário AL2'}</div>
                            <div className="text-xs text-blue-600 dark:text-blue-400 font-mono">@{user.username}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-black border uppercase tracking-wider ${getRoleBadge(user.role)}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                          <Mail size={14} className="text-gray-400" />
                          {user.email}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                          <Calendar size={14} />
                          {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right relative">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveDropdown(activeDropdown === user.id ? null : user.id);
                          }}
                          className="p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg"
                        >
                          <MoreVertical size={18} />
                        </button>
                        
                        {activeDropdown === user.id && (
                          <div 
                            className="absolute right-6 top-10 mt-1 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-100 dark:border-slate-700 py-2 z-50 text-left"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button onClick={() => handleViewDetails(user)} className="w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700/50 flex items-center gap-2">
                              <Eye size={14} className="text-blue-500" /> Ver Detalhes
                            </button>
                            <button onClick={() => handleEditUser(user)} className="w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700/50 flex items-center gap-2">
                              <Edit2 size={14} className="text-gray-500" /> Editar Usuário
                            </button>
                            <button onClick={() => handleResetPassword(user)} className="w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700/50 flex items-center gap-2">
                              <Key size={14} className="text-amber-500" /> Redefinir Senha
                            </button>
                            <button onClick={() => handleChangePermission(user)} className="w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700/50 flex items-center gap-2">
                              <Shield size={14} className="text-purple-500" /> Alterar Permissão
                            </button>
                            <button onClick={() => handleToggleBlock(user)} className="w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700/50 flex items-center gap-2">
                              {user.is_blocked ? (
                                <><Unlock size={14} className="text-green-500" /> Desbloquear</>
                              ) : (
                                <><Lock size={14} className="text-orange-500" /> Bloquear</>
                              )}
                            </button>
                            <div className="my-1 border-t border-gray-100 dark:border-slate-700"></div>
                            <button onClick={() => handleRemoveUser(user)} className="w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 font-medium">
                              <Trash2 size={14} /> Remover Usuário
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : activeTab === 'security' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
              <h3 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                <Plus size={18} className="text-blue-600" />
                Gerar Nova Chave
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">
                Gere uma chave única para autorizar o cadastro de novos administradores ou gerentes no sistema.
              </p>
              <div className="space-y-3">
                <button 
                  onClick={() => handleGenerateKey('admin')}
                  className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2"
                >
                  Criar Chave ADMIN
                </button>
                <button 
                  onClick={() => handleGenerateKey('gerencia')}
                  className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-purple-900/20 flex items-center justify-center gap-2"
                >
                  Criar Chave GERÊNCIA
                </button>
              </div>
            </div>

            <div className="bg-amber-50 dark:bg-amber-900/10 p-6 rounded-2xl border border-amber-100 dark:border-amber-900/30">
               <h4 className="text-amber-800 dark:text-amber-400 font-bold text-sm flex items-center gap-2 mb-2">
                 <AlertCircle size={16} /> Aviso Importante
               </h4>
               <p className="text-xs text-amber-700 dark:text-amber-500/80 leading-relaxed">
                 Chaves de acesso são descartáveis. Uma vez que um usuário utiliza a chave para se cadastrar, ela se torna inválida para novos registros.
               </p>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
               <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center">
                  <h3 className="font-bold text-gray-800 dark:text-white">Chaves Ativas</h3>
                  <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-bold uppercase">{keys.length} Chaves</span>
               </div>
               
               <div className="divide-y divide-gray-100 dark:divide-slate-700">
                 {loading ? (
                    <div className="p-10 text-center text-gray-500">Buscando chaves...</div>
                 ) : keys.length === 0 ? (
                    <div className="p-10 text-center text-gray-500">Nenhuma chave gerada ainda.</div>
                 ) : (
                    keys.map(k => (
                      <div key={k.id} className={`p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-all ${k.is_used ? 'opacity-50 grayscale' : ''}`}>
                         <div className="flex items-center gap-4">
                            <div className={`p-2 rounded-lg ${k.role === 'gerencia' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                               <Key size={18} />
                            </div>
                            <div>
                               <div className="flex items-center gap-2">
                                  <span className="font-mono font-black text-lg text-gray-800 dark:text-white tracking-wider">{k.key}</span>
                                  {k.is_used && <span className="text-[10px] text-red-500 font-bold uppercase border border-red-500 px-1 rounded">Usada</span>}
                               </div>
                               <div className="text-[10px] text-gray-500 uppercase font-bold">
                                  Nível: {k.role} • Criada em: {new Date(k.created_at).toLocaleDateString()}
                                </div>
                            </div>
                         </div>
                         <div className="flex items-center gap-1">
                            {!k.is_used && (
                               <button 
                                 onClick={() => handleCopy(k.key)}
                                 className="p-2 hover:bg-white dark:hover:bg-slate-600 rounded-lg border border-transparent hover:border-gray-200 dark:hover:border-slate-500 text-gray-400 hover:text-blue-600 transition-all"
                                 title="Copiar Chave"
                               >
                                  {copying === k.key ? <CheckCircle2 size={18} className="text-green-500" /> : <Copy size={18} />}
                               </button>
                            )}
                            <button 
                              onClick={() => handleDeleteKey(k.key)}
                              className="p-2 hover:bg-white dark:hover:bg-slate-600 rounded-lg border border-transparent hover:border-gray-200 dark:hover:border-slate-500 text-gray-400 hover:text-red-500 transition-all"
                              title="Excluir Chave"
                            >
                               <Trash2 size={18} />
                            </button>
                         </div>
                      </div>
                    ))
                 )}
               </div>
            </div>
          </div>
        </div>
      ) : activeTab === 'logs' ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-700/30">
            <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <Activity size={18} className="text-blue-500" />
              Logs de Auditoria
            </h3>
            <p className="text-xs text-gray-500 mt-1">Registros de todas as atividades críticas do sistema.</p>
          </div>
          {loading ? (
            <div className="text-center py-20 text-gray-500">Buscando logs...</div>
          ) : logs.length === 0 ? (
            <div className="text-center py-20 text-gray-500">Nenhum registro de atividade encontrado nos últimos 5 dias.</div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-slate-700">
              {logs.map((log, index) => (
                <div key={log.id || index} className="p-4 px-6 hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors flex items-start gap-4">
                  <div className={`p-2 rounded-lg flex-shrink-0 mt-1 ${
                    log.type === 'danger' ? 'bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400' :
                    log.type === 'security' ? 'bg-amber-50 text-amber-500 dark:bg-amber-500/10 dark:text-amber-400' :
                    log.type === 'edit' ? 'bg-blue-50 text-blue-500 dark:bg-blue-500/10 dark:text-blue-400' :
                    'bg-slate-50 text-slate-500 dark:bg-slate-700/50 dark:text-slate-400'
                  }`}>
                    {log.type === 'danger' ? <Trash2 size={18} /> :
                     log.type === 'security' ? <Shield size={18} /> :
                     log.type === 'edit' ? (log.action.toLowerCase().includes('adicionou') || log.action.toLowerCase().includes('criou') ? <Plus size={18} /> : <Edit2 size={18} />) :
                     <Activity size={18} />}
                  </div>
                  <div className="flex-1 flex flex-col">
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-gray-800 dark:text-white uppercase text-sm">
                        {log.type === 'edit' || log.type === 'security' || log.type === 'danger' || log.type === 'info' ? log.action.split(' ')[0].toUpperCase() : log.type || 'SYSTEM_ACTION'}
                      </span>
                      <span className="text-xs font-mono text-gray-400">
                        {log.created_at ? new Date(log.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-300 mt-1">{log.action}</span>
                    <span className="text-[10px] text-blue-500 font-bold uppercase mt-2">POR: {log.user_name}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700">
            <h3 className="font-bold text-gray-800 dark:text-white">Mensagens de Feedback</h3>
          </div>
          {loading ? (
            <div className="text-center py-20 text-gray-500">Buscando feedbacks...</div>
          ) : feedbacks.length === 0 ? (
            <div className="text-center py-20 text-gray-500">Nenhum feedback recebido ainda.</div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-slate-700">
              {feedbacks.map((f) => (
                <div key={f.id} className="p-6 hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                        <Mail size={14} />
                      </div>
                      <span className="font-bold text-gray-800 dark:text-white text-sm">{f.email}</span>
                    </div>
                    <span className="text-xs text-gray-400">
                      {f.created_at?.toDate ? f.created_at.toDate().toLocaleString('pt-BR') : 'N/A'}
                    </span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                    {f.message}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal Dialog */}
      {modalConfig.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-gray-100 dark:border-slate-700">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center">
              <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                {modalConfig.type === 'confirm' ? <AlertCircle size={18} className="text-amber-500" /> : <Shield size={18} className="text-blue-500" />}
                {modalConfig.title}
              </h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                &times;
              </button>
            </div>
            <div className="p-6 text-gray-600 dark:text-gray-300">
              {modalConfig.type === 'custom' && modalConfig.title === 'Editar Usuário' ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Nome Completo</label>
                    <input 
                      type="text" 
                      value={editUserForm.full_name} 
                      onChange={(e) => setEditUserForm({ ...editUserForm, full_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 dark:border-slate-700 rounded-lg bg-gray-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              ) : modalConfig.type === 'custom' && modalConfig.title === 'Alterar Permissão' ? (
                <div className="space-y-4">
                  <p>Selecione a nova permissão para <strong>{selectedUser?.full_name || selectedUser?.username}</strong>:</p>
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value as 'admin' | 'gerencia' | 'user' | 'gerente')}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-slate-700 rounded-lg bg-gray-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="admin">Administrador (ADMIN)</option>
                    <option value="gerencia">Gerência (GERENCIA)</option>
                    <option value="gerente">Gerente (GERENTE)</option>
                    <option value="user">Usuário Padrão (USER)</option>
                  </select>
                </div>
              ) : (
                modalConfig.message
              )}
            </div>
            <div className="px-6 py-4 bg-gray-50 dark:bg-slate-700/50 flex justify-end gap-3">
              <button 
                onClick={closeModal}
                className="px-4 py-2 rounded-lg font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
              >
                {modalConfig.type === 'confirm' || modalConfig.type === 'custom' ? 'Cancelar' : 'Fechar'}
              </button>
              {(modalConfig.type === 'confirm' || modalConfig.type === 'custom') && (
                <button 
                  onClick={modalConfig.type === 'custom' && modalConfig.title === 'Editar Usuário' ? handleSaveEditUser : modalConfig.type === 'custom' && modalConfig.title === 'Alterar Permissão' ? handleSavePermission : modalConfig.onConfirm}
                  className="px-4 py-2 rounded-lg font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                >
                  Confirmar
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
