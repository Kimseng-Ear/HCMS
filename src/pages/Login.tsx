
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';
import { Phone, Loader2, ArrowRight, RefreshCw, KeyRound, Lock } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Logo } from '../components/ui/Logo';

export const Login: React.FC = () => {
    const { requestOtp, verifyOtp, login, forgotPassword, resetPassword } = useAuth();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const { t } = useLanguage();
    
    const [step, setStep] = useState<'phone' | 'otp' | 'forgot-password' | 'reset-password'>('phone');
    const [mode, setMode] = useState<'otp' | 'password'>('password');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (mode === 'password') {
                await login(phone, password);
                showToast('Welcome back!', 'success');
                navigate('/dashboard');
            } else {
                const res = await requestOtp(phone);
                showToast('OTP sent to your phone', 'success');
                if (res?.devOtp) {
                    alert(`[DEMO MODE] Your OTP is: ${res.devOtp}`);
                }
                setStep('otp');
            }
        } catch (error: any) {
            console.error(error);
            showToast(error.message || 'Login failed.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await verifyOtp(phone, otp);
            showToast('Welcome back!', 'success');
            navigate('/dashboard');
        } catch (error: any) {
            console.error(error);
            showToast(error.message || 'Invalid or expired OTP', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await forgotPassword(phone);
            showToast('OTP sent to your phone', 'success');
            if (res?.devOtp) {
                alert(`[DEMO MODE] Your OTP is: ${res.devOtp}`);
            }
            setStep('reset-password');
        } catch (error: any) {
            console.error(error);
            showToast(error.message || 'Failed to request OTP', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await resetPassword(phone, otp, newPassword);
            showToast('Password reset successfully! Please log in.', 'success');
            setStep('phone');
            setMode('password');
            setPassword('');
            setOtp('');
        } catch (error: any) {
            console.error(error);
            showToast(error.message || 'Failed to reset password', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDemoLogin = async (demoPhone: string) => {
        setPhone(demoPhone);
        setPassword('password123');
        setMode('password');
        setLoading(true);
        try {
            await login(demoPhone, 'password123');
            showToast('Welcome back!', 'success');
            navigate('/dashboard');
        } catch (error) {
            console.error(error);
            showToast('Demo login failed', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        if (window.confirm('This will reset all local data to default mock data. Continue?')) {
            localStorage.clear();
            window.location.reload();
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4 relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary-500/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
            </div>

            <div className="w-full max-w-md bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/20 dark:border-slate-700 relative z-10 animate-in fade-in zoom-in-95 duration-500">
                <div className="text-center mb-8">
                    <Logo size="lg" className="mb-6" />
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                        {step === 'phone' ? t('login.welcomeBack') : step === 'forgot-password' ? t('login.resetPassword') : t('login.enterOtp')}
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-2">
                        {step === 'phone' ? t('login.signInToAccess') : step === 'forgot-password' ? t('login.enterPhoneForOtp') : `${t('login.weSentCode')} ${phone}`}
                    </p>
                </div>

                {step === 'phone' ? (
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-4">
                            <div className="group">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 ml-1">{t('login.phoneNumber')}</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Phone className="h-5 w-5 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
                                    </div>
                                    <input
                                        type="tel"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        className="block w-full pl-10 pr-3 py-3 border border-slate-200 dark:border-slate-700 rounded-xl leading-5 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all sm:text-sm"
                                        placeholder="012345678"
                                        required
                                    />
                                </div>
                            </div>
                            
                            {mode === 'password' && (
                                <div className="group animate-in slide-in-from-top-2">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 ml-1">Password</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
                                        </div>
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="block w-full pl-10 pr-3 py-3 border border-slate-200 dark:border-slate-700 rounded-xl leading-5 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all sm:text-sm"
                                            placeholder="••••••••"
                                            required={mode === 'password'}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center justify-between">
                            <button
                                type="button"
                                onClick={() => setMode(mode === 'password' ? 'otp' : 'password')}
                                className="text-sm text-primary-600 hover:text-primary-500 font-medium transition-colors"
                            >
                                {mode === 'password' ? 'Login with OTP instead' : 'Login with Password instead'}
                            </button>
                            {mode === 'password' && (
                                <button
                                    type="button"
                                    onClick={() => setStep('forgot-password')}
                                    className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                                >
                                    Forgot password?
                                </button>
                            )}
                        </div>

                        <Button 
                            type="submit" 
                            className="w-full py-3.5 text-base font-semibold shadow-lg shadow-primary-500/30 rounded-xl group" 
                            isLoading={loading}
                            disabled={!phone || (mode === 'password' && !password)}
                        >
                            {mode === 'password' ? 'Sign In' : 'Continue with Phone'} <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </form>
                ) : step === 'forgot-password' ? (
                    <form onSubmit={handleForgotPassword} className="space-y-6 animate-in slide-in-from-right-4">
                        <div className="space-y-4">
                            <div className="group">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 ml-1">{t('login.phoneNumber')}</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Phone className="h-5 w-5 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
                                    </div>
                                    <input
                                        type="tel"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        className="block w-full pl-10 pr-3 py-3 border border-slate-200 dark:border-slate-700 rounded-xl leading-5 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all sm:text-sm"
                                        placeholder="012345678"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col space-y-3">
                            <Button 
                                type="submit" 
                                className="w-full py-3.5 text-base font-semibold shadow-lg shadow-primary-500/30 rounded-xl group" 
                                isLoading={loading}
                                disabled={!phone}
                            >
                                Send Reset OTP <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                            </Button>
                            <button
                                type="button"
                                onClick={() => setStep('phone')}
                                className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                            >
                                Back to login
                            </button>
                        </div>
                    </form>
                ) : step === 'reset-password' ? (
                    <form onSubmit={handleResetPassword} className="space-y-6 animate-in slide-in-from-right-4">
                        <div className="space-y-4">
                            <div className="group">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 ml-1">One-Time Password</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <KeyRound className="h-5 w-5 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
                                    </div>
                                    <input
                                        type="text"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        className="block w-full pl-10 pr-3 py-3 border border-slate-200 dark:border-slate-700 rounded-xl leading-5 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all sm:text-sm text-center tracking-widest text-lg font-mono"
                                        placeholder="123456"
                                        maxLength={6}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="group">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 ml-1">New Password</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
                                    </div>
                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="block w-full pl-10 pr-3 py-3 border border-slate-200 dark:border-slate-700 rounded-xl leading-5 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all sm:text-sm"
                                        placeholder="pass@#1993##%&*#"
                                        required
                                    />
                                </div>
                                <p className="text-xs text-slate-500 mt-2 ml-1">Must be at least 8 characters, include a letter, a number, and a special character.</p>
                            </div>
                        </div>

                        <div className="flex flex-col space-y-3">
                            <Button 
                                type="submit" 
                                className="w-full py-3.5 text-base font-semibold shadow-lg shadow-primary-500/30 rounded-xl group" 
                                isLoading={loading}
                                disabled={otp.length !== 6 || !newPassword}
                            >
                                Reset Password <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                            </Button>
                            <button
                                type="button"
                                onClick={() => setStep('phone')}
                                className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                            >
                                Back to login
                            </button>
                        </div>
                    </form>
                ) : (
                    <form onSubmit={handleVerifyOtp} className="space-y-6 animate-in slide-in-from-right-4">
                        <div className="space-y-4">
                            <div className="group">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 ml-1">One-Time Password</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <KeyRound className="h-5 w-5 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
                                    </div>
                                    <input
                                        type="text"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        className="block w-full pl-10 pr-3 py-3 border border-slate-200 dark:border-slate-700 rounded-xl leading-5 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all sm:text-sm text-center tracking-widest text-lg font-mono"
                                        placeholder="123456"
                                        maxLength={6}
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col space-y-3">
                            <Button 
                                type="submit" 
                                className="w-full py-3.5 text-base font-semibold shadow-lg shadow-primary-500/30 rounded-xl group" 
                                isLoading={loading}
                                disabled={otp.length !== 6}
                            >
                                Verify & Sign In <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                            </Button>
                            <button
                                type="button"
                                onClick={() => setStep('phone')}
                                className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                            >
                                Back to login
                            </button>
                        </div>
                    </form>
                )}

                <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700/50">
                    <div className="flex justify-between items-center mb-4">
                        <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Demo Credentials</p>
                        <button onClick={handleReset} className="text-xs text-slate-400 hover:text-red-500 flex items-center gap-1 transition-colors" title="Reset all data">
                            <RefreshCw className="w-3 h-3" /> Reset Data
                        </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <button 
                            onClick={() => handleDemoLogin('012345678')}
                            className="p-2 text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors text-left"
                        >
                            <span className="font-bold block text-primary-600 dark:text-primary-400">Admin</span>
                            012345678
                        </button>
                        <button 
                            onClick={() => handleDemoLogin('098765432')}
                            className="p-2 text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors text-left"
                        >
                            <span className="font-bold block text-purple-600 dark:text-purple-400">HR</span>
                            098765432
                        </button>
                        <button 
                            onClick={() => handleDemoLogin('011223344')}
                            className="p-2 text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors text-left"
                        >
                            <span className="font-bold block text-blue-600 dark:text-blue-400">Manager</span>
                            011223344
                        </button>
                        <button 
                            onClick={() => handleDemoLogin('077889900')}
                            className="p-2 text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors text-left"
                        >
                            <span className="font-bold block text-emerald-600 dark:text-emerald-400">Employee</span>
                            077889900
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
