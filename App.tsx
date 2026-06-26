
import React, { useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Devices } from './pages/Devices';
import { Monitoring } from './pages/Monitoring';
import { ArduinoIDE } from './pages/ArduinoIDE';
import { Settings } from './pages/Settings';
import { Tutorial } from './pages/Tutorial';
import { UserManagement } from './pages/UserManagement';
import { authService, testModeService, quotaService } from './services/api';
import { User } from './types';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { SerialProvider } from './contexts/SerialContext';
import { TourProvider } from './contexts/TourContext';
import { GlobalTour } from './components/GlobalTour';
import { FlaskConical } from 'lucide-react';
import { QuotaWarning } from './components/QuotaWarning';
import { AlertMonitor } from './components/AlertMonitor';

import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';

function AppContent() {
  const { t } = useLanguage();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const isTestMode = testModeService.isActive();

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            setUser(userDoc.data() as User);
          } else {
            console.warn("User profile not found, using minimal profile");
            setUser({
              id: 0,
              username: firebaseUser.displayName || 'User',
              full_name: firebaseUser.displayName || 'User',
              email: firebaseUser.email || '',
              role: 'user',
              created_at: new Date().toISOString()
            } as any);
          }
        } catch (error: any) {
          console.error("Error fetching user data:", error);
          
          // Check for quota exceeded specifically in App initialization
          if (error.message?.includes('Quota exceeded') || error.message?.includes('quota')) {
            quotaService.setExceeded(true);
            // Fallback user to "unlock" the app
            setUser({
              id: -1,
              username: 'Offline User',
              full_name: 'Usuário (Modo Local)',
              email: 'quota-exceeded@al2.com',
              role: 'gerencia',
              created_at: new Date().toISOString()
            } as any);
          } else {
            setUser(null);
          }
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await authService.logout();
      setUser(null);
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const handleUpdateUser = (updatedUser: User) => setUser(updatedUser);

  if (loading) {
    return <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 text-gray-500 dark:text-gray-400 font-bold">Iniciando sistema AL2...</div>;
  }

  return (
    <Router>
      <QuotaWarning />
      {user && <AlertMonitor />}
      <GlobalTour />
      {isTestMode && (
        <div className="bg-amber-500 text-white text-[10px] font-black uppercase tracking-widest py-1 px-4 flex items-center justify-center gap-2 z-[100] sticky top-0">
          <FlaskConical size={12} />
          {t('set.test_active')}
        </div>
      )}
      <Routes>
        <Route path="/login" element={!user ? <Login onLoginSuccess={setUser} /> : <Navigate to="/" />} />
        
        <Route path="/" element={user ? <Layout user={user} onLogout={handleLogout}><Dashboard /></Layout> : <Navigate to="/login" />} />
        <Route path="/monitoring" element={user ? <Layout user={user} onLogout={handleLogout}><Monitoring /></Layout> : <Navigate to="/login" />} />
        <Route path="/devices" element={user ? <Layout user={user} onLogout={handleLogout}><Devices /></Layout> : <Navigate to="/login" />} />
        <Route path="/arduino" element={user ? <Layout user={user} onLogout={handleLogout}><ArduinoIDE /></Layout> : <Navigate to="/login" />} />
        <Route path="/tutorial" element={user ? <Layout user={user} onLogout={handleLogout}><Tutorial /></Layout> : <Navigate to="/login" />} />
        
        {/* Protected route for Gerencia */}
        <Route path="/users" element={user && (user.role === 'gerencia' || user.role === 'gerente' || user.role === 'admin') ? <Layout user={user} onLogout={handleLogout}><UserManagement /></Layout> : <Navigate to="/" />} />

        <Route path="/settings" element={user ? <Layout user={user} onLogout={handleLogout}><Settings user={user} onUpdateUser={handleUpdateUser} onLogout={handleLogout} isDarkMode={isDarkMode} toggleTheme={toggleTheme}/></Layout> : <Navigate to="/login" />} />
        
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <SerialProvider>
        <TourProvider>
          <AppContent />
        </TourProvider>
      </SerialProvider>
    </LanguageProvider>
  );
}
