
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sidebar } from './Sidebar';
import { Menu, X, User as UserIcon } from 'lucide-react';
import { User } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface LayoutProps {
  children: React.ReactNode;
  user: User | null;
  onLogout: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, user, onLogout }) => {
  const [isMobileOpen, setMobileOpen] = useState(false);
  const [isDesktopOpen, setDesktopOpen] = useState(true);
  const [isLargeScreen, setIsLargeScreen] = useState(window.innerWidth >= 1024);
  const { t } = useLanguage();

  useEffect(() => {
    const handleResize = () => {
      setIsLargeScreen(window.innerWidth >= 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => {
    if (isLargeScreen) {
      setDesktopOpen(!isDesktopOpen);
    } else {
      setMobileOpen(!isMobileOpen);
    }
  };

  const isSidebarVisible = isLargeScreen ? isDesktopOpen : isMobileOpen;

  // Lógica dinâmica para o rótulo do cargo no Header
  const getRoleLabel = () => {
    if (!user) return t('role.user');
    return t(`role.${user.role}`);
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-slate-900 transition-colors duration-200 overflow-hidden">
      <Sidebar 
        user={user} // ADICIONADO: Agora a Sidebar recebe os dados do usuário
        onLogout={onLogout} 
        isMobileOpen={isMobileOpen}
        isDesktopOpen={isDesktopOpen}
        onCloseMobile={() => setMobileOpen(false)} 
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden transition-all duration-300">
        <header className="bg-white dark:bg-slate-800 shadow-sm border-b border-gray-200 dark:border-slate-700 h-16 flex items-center justify-between px-4 lg:px-8 z-30 transition-colors duration-200">
          <button 
            className="p-2 text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-md transition-colors focus:outline-none"
            onClick={toggleSidebar}
            aria-label="Toggle Menu"
          >
            <div className="relative w-6 h-6">
              <Menu 
                size={24} 
                className={`absolute inset-0 transform transition-all duration-300 ease-in-out ${isSidebarVisible ? 'rotate-90 opacity-0 scale-75' : 'rotate-0 opacity-100 scale-100'}`} 
              />
              <X 
                size={24} 
                className={`absolute inset-0 transform transition-all duration-300 ease-in-out ${isSidebarVisible ? 'rotate-0 opacity-100 scale-100' : '-rotate-90 opacity-0 scale-75'}`} 
              />
            </div>
          </button>

          <div className="flex-1 px-4">
            <h2 className="text-sm text-gray-500 dark:text-gray-400 font-medium hidden sm:block">{t('header.title')}</h2>
          </div>

          <div className="flex items-center gap-4 tour-header-profile">
            <div className="hidden md:flex flex-col items-end mr-2">
              <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{user?.username || 'User'}</span>
              <span className="text-xs text-blue-600 dark:text-blue-400 font-bold tracking-wider uppercase">
                {getRoleLabel()}
              </span>
            </div>
            <div className="h-10 w-10 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 overflow-hidden">
              {user?.avatar ? (
                <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <UserIcon size={20} />
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="max-w-7xl mx-auto"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
};
