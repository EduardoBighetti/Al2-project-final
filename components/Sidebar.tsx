
import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'motion/react';
import { LayoutDashboard, Router as RouterIcon, LogOut, Settings, Activity, Users, ShieldCheck, ShieldAlert, User as UserIcon, Cpu, BookOpen } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { User } from '../types';

interface SidebarProps {
  onLogout: () => void;
  isMobileOpen: boolean;
  isDesktopOpen: boolean;
  onCloseMobile: () => void;
  user: User | null;
}

export const Sidebar: React.FC<SidebarProps> = ({ onLogout, isMobileOpen, isDesktopOpen, onCloseMobile, user }) => {
  const { t } = useLanguage();
  
  const baseClass = "fixed inset-y-0 left-0 z-50 bg-[#111827] text-white transition-all duration-300 ease-in-out lg:static lg:inset-auto whitespace-nowrap overflow-hidden border-r border-slate-800";
  const mobileTransform = isMobileOpen ? "translate-x-0" : "-translate-x-full";
  const desktopWidth = isDesktopOpen ? "lg:w-64" : "lg:w-0";
  const sidebarClasses = `${baseClass} w-64 ${mobileTransform} lg:translate-x-0 ${desktopWidth}`;

  // Estilo do link exatamente como no print (com a barra branca lateral)
  const linkClass = ({ isActive }: { isActive: boolean }) => 
    `relative flex items-center gap-3 px-6 py-3.5 text-sm font-medium transition-all ${
      isActive 
        ? "bg-blue-600 text-white" 
        : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
    }`;

  const activeIndicator = (isActive: boolean) => 
    isActive ? (
      <motion.div 
        layoutId="activeIndicator"
        className="absolute right-0 top-0 bottom-0 w-1 bg-white" 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      />
    ) : null;

  const getRoleIcon = (role: string | undefined, size = 24) => {
    switch (role) {
      case 'admin':
        return <ShieldCheck size={size} className="text-blue-400" />;
      case 'gerencia':
        return <Users size={size} className="text-orange-400" />;
      case 'usuario':
      default:
        return <UserIcon size={size} className="text-slate-400" />;
    }
  };

  const isGerencia = user?.role === 'gerencia' || user?.role === 'gerente' || user?.role === 'admin';

  return (
    <>
      {isMobileOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden" onClick={onCloseMobile} />
      )}
      
      <aside className={sidebarClasses}>
        <div className="flex flex-col h-full w-64"> 
          {/* Logo Section - Igual ao print */}
          <div className="h-20 flex items-center px-8">
            <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
              <span className="text-blue-500">AL2</span>
              <span className="text-white">IoT System</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto">
            <div className="px-8 mb-4 mt-2 text-[11px] font-bold text-slate-500 uppercase tracking-widest opacity-50">
              {t('menu.main')}
            </div>
            
            <NavLink to="/" className={linkClass} onClick={onCloseMobile}>
              {({ isActive }) => (
                <motion.div 
                  whileHover={{ x: 4 }}
                  className="flex items-center gap-3 w-full tour-sidebar-dashboard"
                >
                  <LayoutDashboard size={20} />
                  <span>{t('menu.dashboard')}</span>
                  {activeIndicator(isActive)}
                </motion.div>
              )}
            </NavLink>

            <NavLink to="/monitoring" className={linkClass} onClick={onCloseMobile}>
              {({ isActive }) => (
                <motion.div 
                  whileHover={{ x: 4 }}
                  className="flex items-center gap-3 w-full tour-sidebar-monitoring"
                >
                  <Activity size={20} />
                  <span>{t('menu.monitoring')}</span>
                  {activeIndicator(isActive)}
                </motion.div>
              )}
            </NavLink>
            
            <NavLink to="/devices" className={linkClass} onClick={onCloseMobile}>
              {({ isActive }) => (
                <motion.div 
                  whileHover={{ x: 4 }}
                  className="flex items-center gap-3 w-full tour-sidebar-devices"
                >
                  <RouterIcon size={20} />
                  <span>{t('menu.devices')}</span>
                  {activeIndicator(isActive)}
                </motion.div>
              )}
            </NavLink>

            <NavLink to="/arduino" className={linkClass} onClick={onCloseMobile}>
              {({ isActive }) => (
                <motion.div 
                  whileHover={{ x: 4 }}
                  className="flex items-center gap-3 w-full tour-sidebar-arduino"
                >
                  <Cpu size={20} />
                  <span>{t('menu.arduino')}</span>
                  {activeIndicator(isActive)}
                </motion.div>
              )}
            </NavLink>

            {/* Menu de Usuários - Apenas para Gerência */}
            {isGerencia && (
              <NavLink to="/users" className={linkClass} onClick={onCloseMobile}>
                {({ isActive }) => (
                  <motion.div 
                    whileHover={{ x: 4 }}
                    className="flex items-center gap-3 w-full"
                  >
                    <Users size={20} />
                    <span>Gestão de Usuários</span>
                    {activeIndicator(isActive)}
                  </motion.div>
                )}
              </NavLink>
            )}
            
            <div className="px-8 mt-10 mb-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest opacity-50">
              {t('menu.config')}
            </div>

            <NavLink to="/tutorial" className={linkClass} onClick={onCloseMobile}>
              {({ isActive }) => (
                <motion.div 
                  whileHover={{ x: 4 }}
                  className="flex items-center gap-3 w-full tour-sidebar-tutorial"
                >
                  <BookOpen size={20} />
                  <span>Tutorial</span>
                  {activeIndicator(isActive)}
                </motion.div>
              )}
            </NavLink>

            <NavLink to="/settings" className={linkClass} onClick={onCloseMobile}>
              {({ isActive }) => (
                <motion.div 
                  whileHover={{ x: 4 }}
                  className="flex items-center gap-3 w-full"
                >
                  <Settings size={20} />
                  <span>{t('menu.account')}</span>
                  {activeIndicator(isActive)}
                </motion.div>
              )}
            </NavLink>
          </nav>

          {/* Footer Info - Igual ao print */}
          <div className="p-6">
             <div className="flex items-center gap-3 px-4 py-3 mb-6 bg-slate-800/30 rounded-xl border border-slate-700/50">
                <div className="w-9 h-9 rounded-lg bg-slate-700/50 flex items-center justify-center flex-shrink-0 border border-slate-600/50">
                   {getRoleIcon(user?.role, 20)}
                </div>
                <div className="flex flex-col">
                   <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider leading-none mb-1">Nível de Acesso</span>
                   <span className="text-xs text-white font-black uppercase tracking-widest">{user?.role || 'User'}</span>
                </div>
             </div>

            <button 
              onClick={onLogout}
              className="flex items-center gap-3 px-2 py-2 text-sm font-bold text-[#f87171] hover:text-red-400 transition-all w-full group"
            >
              <LogOut size={20} />
              <span>{t('menu.logout')}</span>
            </button>
            <div className="mt-4 text-center text-[10px] font-mono text-slate-500/50">
              v1.8.2
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
