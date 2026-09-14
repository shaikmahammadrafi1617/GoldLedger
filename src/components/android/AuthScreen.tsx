import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  User as UserIcon, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2, 
  Globe, 
  Sparkles,
  HelpCircle
} from 'lucide-react';
import { 
  signInWithEmail, 
  registerWithEmail, 
  signInWithGoogle, 
  resetPassword,
  User 
} from '../../firebase';
import { Language } from '../../types';

interface AuthScreenProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onSuccess: (user: User) => void;
  onSkipOffline?: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  language,
  onLanguageChange,
  onSuccess,
  onSkipOffline,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  // Friendly error translation
  const parseAuthError = (err: any): string => {
    const code = err?.code || '';
    const msg = err?.message || String(err);

    if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
      return language === 'te' 
        ? 'ఇమెయిల్ లేదా పాస్‌వర్డ్ సరైనది కాదు. దయచేసి మళ్ళీ ప్రయత్నించండి.'
        : 'Incorrect email or password. Please verify and try again.';
    }
    if (code === 'auth/email-already-in-use') {
      return language === 'te'
        ? 'ఈ ఇమెయిల్‌తో ఇప్పటికే ఖాతా ఉంది. దయచేసి లాగిన్ అవ్వండి.'
        : 'An account with this email already exists. Please select Login.';
    }
    if (code === 'auth/weak-password') {
      return language === 'te'
        ? 'పాస్‌వర్డ్ కనీసం 6 అక్షరాలు ఉండాలి.'
        : 'Password must be at least 6 characters long.';
    }
    if (code === 'auth/invalid-email') {
      return language === 'te'
        ? 'దయచేసి సరైన ఇమెయిల్ చిరునామా నమోదు చేయండి.'
        : 'Please enter a valid email address.';
    }
    if (code === 'auth/popup-closed-by-user') {
      return language === 'te'
        ? 'గూగుల్ సైన్-ఇన్ రద్దు చేయబడింది.'
        : 'Google sign-in was cancelled.';
    }
    if (code === 'auth/network-request-failed' || msg.includes('network')) {
      return language === 'te'
        ? 'ఇంటర్నెట్ కనెక్షన్ సమస్య. దయచేసి నెట్‌వర్క్ చెక్ చేయండి.'
        : 'Network request failed. Please check your internet connection.';
    }
    return msg;
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessNotice(null);

    if (!email.trim() || !password) {
      setErrorMessage(
        language === 'te' 
          ? 'దయచేసి ఇమెయిల్ మరియు పాస్‌వర్డ్ నమోదు చేయండి' 
          : 'Please provide both email and password'
      );
      return;
    }

    if (mode === 'register') {
      if (password.length < 6) {
        setErrorMessage(
          language === 'te' 
            ? 'పాస్‌వర్డ్ కనీసం 6 అక్షరాలు ఉండాలి' 
            : 'Password must be at least 6 characters'
        );
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage(
          language === 'te' 
            ? 'పాస్‌వర్డ్‌లు సరిపోలడం లేదు' 
            : 'Passwords do not match'
        );
        return;
      }
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        const u = await signInWithEmail(email, password);
        onSuccess(u);
      } else {
        const u = await registerWithEmail(email, password, displayName);
        setSuccessNotice(
          language === 'te' 
            ? 'ఖాతా విజయవంతంగా సృష్టించబడింది!' 
            : 'Account registered successfully!'
        );
        onSuccess(u);
      }
    } catch (err: any) {
      setErrorMessage(parseAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setSuccessNotice(null);
    setGoogleLoading(true);
    try {
      const u = await signInWithGoogle();
      if (u) {
        onSuccess(u);
      }
    } catch (err: any) {
      setErrorMessage(parseAuthError(err));
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) return;
    setResetLoading(true);
    setErrorMessage(null);
    try {
      await resetPassword(resetEmail);
      setIsResetOpen(false);
      setSuccessNotice(
        language === 'te'
          ? `పాస్‌వర్డ్ రీసెట్ లింక్ ${resetEmail} కు పంపబడింది.`
          : `Password reset link sent to ${resetEmail}. Check your inbox.`
      );
    } catch (err: any) {
      setErrorMessage(parseAuthError(err));
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-full flex flex-col justify-between p-5 bg-gradient-to-b from-slate-900 via-slate-900 to-[#0F172A] text-slate-100 overflow-y-auto">
      {/* Header bar: Logo & Language Switcher */}
      <div className="flex items-center justify-between pt-2 pb-4 border-b border-slate-800/80">
        <div className="flex items-center space-x-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#C5A059] to-[#8C6D2D] p-0.5 shadow-md flex items-center justify-center">
            <div className="w-full h-full bg-[#1E293B] rounded-[14px] flex items-center justify-center">
              <span className="font-serif font-black text-lg text-[#C5A059]">₹</span>
            </div>
          </div>
          <div>
            <h1 className="font-extrabold text-base text-white tracking-tight leading-none">
              GoldLedger
            </h1>
            <span className="text-[11px] text-[#C5A059] font-medium block mt-0.5">
              {language === 'te' ? 'గోల్డ్ ఫైనాన్స్ లెడ్జర్' : 'Finance & Interest Ledger'}
            </span>
          </div>
        </div>

        {/* Language Switch */}
        <button
          type="button"
          onClick={() => onLanguageChange(language === 'en' ? 'te' : 'en')}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-xs font-bold text-slate-200 transition active:scale-95 cursor-pointer"
        >
          <Globe className="w-3.5 h-3.5 text-[#C5A059]" />
          <span>{language === 'en' ? 'తెలుగు' : 'English'}</span>
        </button>
      </div>

      {/* Main Form Container */}
      <div className="my-auto py-6 max-w-sm w-full mx-auto space-y-5">
        {/* Title / Description */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C5A059]/10 border border-[#C5A059]/30 text-[#C5A059] text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{language === 'te' ? 'సురక్షిత ఖాతా లాగిన్' : 'Secure Device Login'}</span>
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            {mode === 'login' 
              ? (language === 'te' ? 'ఖాతాలోకి లాగిన్ అవ్వండి' : 'Welcome to GoldLedger')
              : (language === 'te' ? 'కొత్త ఖాతా సృష్టించండి' : 'Create Owner Account')}
          </h2>
          <p className="text-xs text-slate-400">
            {mode === 'login'
              ? (language === 'te' ? 'మీ లెక్కలు ఈ పరికరంలో సురక్షితంగా సేవ్ అవుతాయి' : 'Keep login on this device until you sign out')
              : (language === 'te' ? 'మీ ఫైనాన్స్ రికార్డులను క్లౌడ్‌లో బ్యాకప్ చేయండి' : 'Secure and sync your daily finance deals')}
          </p>
        </div>

        {/* Mode Switcher Pills */}
        <div className="p-1 bg-slate-800/90 border border-slate-700/80 rounded-2xl flex">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMessage(null);
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              mode === 'login'
                ? 'bg-gradient-to-r from-[#C5A059] to-[#A07C36] text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {language === 'te' ? 'లాగిన్ (Login)' : 'Sign In'}
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setErrorMessage(null);
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              mode === 'register'
                ? 'bg-gradient-to-r from-[#C5A059] to-[#A07C36] text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {language === 'te' ? 'కొత్త ఖాతా (Register)' : 'New Account'}
          </button>
        </div>

        {/* Status Alerts */}
        {errorMessage && (
          <div className="bg-rose-950/50 border border-rose-600/50 rounded-2xl p-3 flex items-start space-x-2.5 text-xs text-rose-200">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">{errorMessage}</div>
          </div>
        )}

        {successNotice && (
          <div className="bg-emerald-950/50 border border-emerald-600/50 rounded-2xl p-3 flex items-start space-x-2.5 text-xs text-emerald-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="flex-1">{successNotice}</div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleEmailSubmit} className="space-y-3.5">
          {mode === 'register' && (
            <div>
              <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-1">
                {language === 'te' ? 'యజమాని / వ్యాపార పేరు' : 'Owner / Business Name'}
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Rafi Finance"
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-[#C5A059]"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-1">
              {language === 'te' ? 'ఇమెయిల్ చిరునామా' : 'Email Address'}
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@gmail.com"
                className="w-full pl-10 pr-3 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-[#C5A059]"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                {language === 'te' ? 'పాస్‌వర్డ్' : 'Password'}
              </label>
              {mode === 'login' && (
                <button
                  type="button"
                  onClick={() => {
                    setResetEmail(email);
                    setIsResetOpen(true);
                  }}
                  className="text-[11px] text-[#C5A059] hover:underline cursor-pointer"
                >
                  {language === 'te' ? 'మర్చిపోయారా?' : 'Forgot?'}
                </button>
              )}
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-[#C5A059]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {mode === 'register' && (
            <div>
              <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-1">
                {language === 'te' ? 'పాస్‌వర్డ్ ధృవీకరించండి' : 'Confirm Password'}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-[#C5A059]"
                />
              </div>
            </div>
          )}

          {/* Remember this device note */}
          <div className="flex items-center space-x-2 pt-1 text-xs text-slate-400">
            <CheckCircle2 className="w-4 h-4 text-[#C5A059]" />
            <span>
              {language === 'te' 
                ? 'ఈ పరికరంలో లాగిన్ శాశ్వతంగా ఉంటుంది (మీరు లాగౌట్ చేసేవరకు)' 
                : 'Stays signed in on this device until you tap Log Out'}
            </span>
          </div>

          {/* Primary Submit Button */}
          <button
            type="submit"
            disabled={loading || googleLoading}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#C5A059] to-[#9a7836] hover:from-[#b08e4d] hover:to-[#88692f] text-slate-950 font-black text-sm shadow-xl flex items-center justify-center space-x-2 transition active:scale-98 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>
                  {mode === 'login'
                    ? (language === 'te' ? 'లాగిన్ అవ్వండి' : 'Sign In to Ledger')
                    : (language === 'te' ? 'ఖాతా సృష్టించండి' : 'Create My Account')}
                </span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-slate-800"></div>
          <span className="flex-shrink mx-3 text-[11px] font-semibold text-slate-500 uppercase">
            {language === 'te' ? 'లేదా' : 'Or Continue With'}
          </span>
          <div className="flex-grow border-t border-slate-800"></div>
        </div>

        {/* Google 1-Tap Sign-In Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading || googleLoading}
          className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-slate-50 text-slate-900 font-bold text-sm shadow-md flex items-center justify-center space-x-3 transition active:scale-98 cursor-pointer disabled:opacity-50"
        >
          {googleLoading ? (
            <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              {/* Google G SVG */}
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{language === 'te' ? 'గూగుల్ తో కొనసాగించండి' : 'Continue with Google'}</span>
            </>
          )}
        </button>

        {/* Offline Emergency Option */}
        {onSkipOffline && (
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={onSkipOffline}
              className="text-xs text-slate-500 hover:text-slate-300 font-medium cursor-pointer transition"
            >
              {language === 'te' 
                ? '⚡ ఇంటర్నెట్ లేదా? ఆఫ్‌లైన్ లోకల్ మోడ్‌లో చూడండి' 
                : '⚡ No internet right now? Open Local Offline Mode'}
            </button>
          </div>
        )}
      </div>

      {/* Footer info */}
      <div className="pt-4 border-t border-slate-800/80 text-center text-[11px] text-slate-500 space-y-0.5">
        <p>GoldLedger Finance Edition • Encrypted & Synchronized</p>
        <p className="text-[10px] text-slate-600">Database: ai-studio-goldledger</p>
      </div>

      {/* Password Reset Modal */}
      {isResetOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-5 max-w-xs w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-[#C5A059]" />
                <span>{language === 'te' ? 'పాస్‌వర్డ్ రీసెట్' : 'Reset Password'}</span>
              </h3>
              <button 
                type="button" 
                onClick={() => setIsResetOpen(false)}
                className="text-slate-400 hover:text-white font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-400">
              {language === 'te'
                ? 'మీ ఇమెయిల్ ఇవ్వండి. పాస్‌వర్డ్ మార్చుకునే లింక్ పంపుతాము.'
                : 'Enter your email address to receive a secure password reset link.'}
            </p>
            <form onSubmit={handleResetPassword} className="space-y-3">
              <input
                type="email"
                required
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="name@gmail.com"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#C5A059]"
              />
              <button
                type="submit"
                disabled={resetLoading}
                className="w-full py-2.5 rounded-xl bg-[#C5A059] text-slate-950 font-bold text-xs shadow-md transition cursor-pointer disabled:opacity-50"
              >
                {resetLoading ? 'Sending...' : (language === 'te' ? 'లింక్ పంపండి' : 'Send Reset Link')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
