import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { authService } from '../services/api';
import { ArrowLeft, CheckCircle2, Eye, EyeOff, KeyRound } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: (user: User) => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [mode, setMode] = useState<'login' | 'forgot' | 'reset'>('login');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [accessKey, setAccessKey] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [cooldownTime, setCooldownTime] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (cooldownTime > 0) {
      interval = setInterval(() => {
        setCooldownTime((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [cooldownTime]);

  const handleSubmitLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const response = await authService.login(email, password, accessKey, rememberMe);
      if (response.user) {
        onLoginSuccess(response.user);
      } else {
        setError('Login falhou. Usuário não retornado.');
      }
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro no login.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    
    const lastRequest = localStorage.getItem('lastResetRequestTime');
    if (lastRequest) {
      const diff = Date.now() - parseInt(lastRequest, 10);
      const cooldownMs = 15 * 60 * 1000;
      if (diff < cooldownMs) {
        const remaining = Math.ceil((cooldownMs - diff) / 1000);
        setCooldownTime(remaining);
        setError(`Aguarde ${Math.ceil(remaining / 60)} minutos antes de solicitar um novo código.`);
        setMode('reset');
        return;
      }
    }

    setLoading(true);
    try {
      await authService.resetPasswordRequest(email);
      localStorage.setItem('lastResetRequestTime', Date.now().toString());
      setCooldownTime(15 * 60);
      setSuccessMsg('E-mail de redefinição enviado! Verifique sua caixa de entrada.');
      setMode('reset');
    } catch (err: any) {
      setError(err.message || 'Erro ao enviar e-mail de recuperação.');
    } finally {
      setLoading(false);
    }
  };

  const isLengthValid = newPassword.length >= 6;
  const hasUpperCase = /[A-Z]/.test(newPassword);
  const hasLowerCase = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecialChar = /[^A-Za-z0-9]/.test(newPassword);
  const isPasswordValid = isLengthValid && hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar;

  const handleResetConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    
    if (!isPasswordValid) {
      setError('A senha não atende aos requisitos mínimos.');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }
    
    setLoading(true);
    try {
      let code = resetCode.trim();
      // Extract oobCode if they pasted the whole link
      if (code.includes('oobCode=')) {
        const urlParams = new URLSearchParams(code.substring(code.indexOf('?')));
        code = urlParams.get('oobCode') || code;
      }
      
      await authService.confirmResetPassword(code, newPassword);
      setSuccessMsg('Senha redefinida com sucesso! Você pode fazer login agora.');
      setMode('login');
      setPassword('');
      setResetCode('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError('Código inválido ou expirado. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 p-4">
      <div className="max-w-md w-full bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-700 relative overflow-hidden">
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-blue-600 mb-2">AL2 IoT</h1>
          <p className="text-gray-500 dark:text-gray-400">
            {mode === 'login' ? 'Entre na sua conta para continuar' : 
             mode === 'forgot' ? 'Recuperação de Senha' : 
             'Redefinir Senha'}
          </p>
        </div>
        
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 p-3 rounded-lg text-sm mb-6 border border-red-100 dark:border-red-900/30">
            {error}
          </div>
        )}
        
        {successMsg && (
          <div className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 p-3 rounded-lg text-sm mb-6 border border-green-100 dark:border-green-900/30 flex items-start gap-2">
            <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* MODO: LOGIN */}
        {mode === 'login' && (
          <form onSubmit={handleSubmitLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Email / Usuário</label>
              <input 
                type="text" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="seu@email.com ou admin"
                required
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Senha</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none pr-12 transition-all"
                  placeholder="••••••••"
                  required
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Chave de Acesso</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={accessKey}
                  onChange={(e) => setAccessKey(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none pl-10"
                  placeholder="Sua chave..."
                  required
                />
                <KeyRound size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
            </div>
            
            <div className="flex items-center justify-between mt-2">
              <label className="flex items-center gap-2 cursor-pointer group">
                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${rememberMe ? 'bg-blue-600 border-blue-600' : 'border-gray-300 dark:border-slate-600 group-hover:border-blue-400'}`}>
                  {rememberMe && <CheckCircle2 size={12} className="text-white" />}
                </div>
                <input 
                  type="checkbox" 
                  checked={rememberMe} 
                  onChange={(e) => setRememberMe(e.target.checked)} 
                  className="hidden" 
                />
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Manter conectado</span>
              </label>
              
              <button 
                type="button" 
                onClick={() => { setError(''); setSuccessMsg(''); setMode('forgot'); }}
                className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-bold"
              >
                Esqueci a senha
              </button>
            </div>
            
            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors disabled:opacity-50 mt-4 flex justify-center items-center h-12"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                'Entrar'
              )}
            </button>
          </form>
        )}

        {/* MODO: FORGOT PASSWORD */}
        {mode === 'forgot' && (
          <form onSubmit={handleForgotRequest} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">E-mail Cadastrado</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="seu@email.com"
                required
              />
            </div>
            
            <button 
              type="submit" 
              disabled={loading || cooldownTime > 0}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors disabled:opacity-50 mt-4 flex justify-center items-center h-12"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : cooldownTime > 0 ? (
                `Aguarde ${Math.ceil(cooldownTime / 60)} min`
              ) : (
                'Enviar E-mail'
              )}
            </button>
            
            <button 
              type="button" 
              onClick={() => { setError(''); setSuccessMsg(''); setMode('login'); }}
              className="w-full py-3 bg-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 font-bold transition-colors flex items-center justify-center gap-2"
            >
              <ArrowLeft size={16} /> Voltar para o Login
            </button>
          </form>
        )}

        {/* MODO: RESET */}
        {mode === 'reset' && (
          <form onSubmit={handleResetConfirm} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Código do E-mail (Link ou OobCode)</label>
              <input 
                type="text" 
                value={resetCode}
                onChange={(e) => setResetCode(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none text-xs"
                placeholder="Cole aqui o link ou código..."
                required
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Nova Senha</label>
              <div className="relative">
                <input 
                  type={showNewPassword ? "text" : "password"} 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none pr-12 transition-all"
                  placeholder="Mínimo 6 caracteres"
                  required
                />
                <button 
                  type="button" 
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1"
                >
                  {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {newPassword && (
                <div className="mt-3 space-y-2 text-xs">
                  <div className={`flex items-center gap-2 transition-colors ${isLengthValid ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                    <CheckCircle2 size={14} className={`transition-opacity ${isLengthValid ? 'opacity-100' : 'opacity-30'}`} />
                    <span>Mínimo 6 caracteres</span>
                  </div>
                  <div className={`flex items-center gap-2 transition-colors ${hasUpperCase ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                    <CheckCircle2 size={14} className={`transition-opacity ${hasUpperCase ? 'opacity-100' : 'opacity-30'}`} />
                    <span>Uma letra maiúscula</span>
                  </div>
                  <div className={`flex items-center gap-2 transition-colors ${hasLowerCase ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                    <CheckCircle2 size={14} className={`transition-opacity ${hasLowerCase ? 'opacity-100' : 'opacity-30'}`} />
                    <span>Uma letra minúscula</span>
                  </div>
                  <div className={`flex items-center gap-2 transition-colors ${hasNumber ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                    <CheckCircle2 size={14} className={`transition-opacity ${hasNumber ? 'opacity-100' : 'opacity-30'}`} />
                    <span>Um número</span>
                  </div>
                  <div className={`flex items-center gap-2 transition-colors ${hasSpecialChar ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                    <CheckCircle2 size={14} className={`transition-opacity ${hasSpecialChar ? 'opacity-100' : 'opacity-30'}`} />
                    <span>Um caractere especial (@$!%*?&)</span>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Confirmar Senha</label>
              <div className="relative">
                <input 
                  type={showConfirmPassword ? "text" : "password"} 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none pr-12 transition-all"
                  placeholder="Repita a nova senha"
                  required
                />
                <button 
                  type="button" 
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            
            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors disabled:opacity-50 mt-4 flex justify-center items-center h-12"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                'Redefinir Senha'
              )}
            </button>
            
            <div className="flex justify-between items-center mt-2">
              <button 
                type="button" 
                onClick={() => { setError(''); setSuccessMsg(''); setMode('forgot'); }}
                className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 font-bold transition-colors flex items-center justify-center gap-1"
              >
                <ArrowLeft size={14} /> Reenviar código
              </button>
              
              <button 
                type="button" 
                onClick={() => { setError(''); setSuccessMsg(''); setMode('login'); }}
                className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 font-bold"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
