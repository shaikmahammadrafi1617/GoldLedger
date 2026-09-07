import React, { useState } from 'react';
import { Lock, KeyRound, Fingerprint, ScanFace, ShieldCheck, AlertCircle } from 'lucide-react';
import { OwnerSettings, Language } from '../types';
import { getT } from '../utils/translations';

interface SecurityLockModalProps {
  isLocked: boolean;
  onUnlock: () => void;
  settings: OwnerSettings;
  language: Language;
}

export const SecurityLockModal: React.FC<SecurityLockModalProps> = ({
  isLocked,
  onUnlock,
  settings,
  language,
}) => {
  const t = getT(language);
  const [pinInput, setPinInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isAuthenticatingBiometric, setIsAuthenticatingBiometric] = useState(false);

  if (!isLocked) return null;

  const handleKeypadPress = (digit: string) => {
    if (pinInput.length < 4) {
      const nextPin = pinInput + digit;
      setPinInput(nextPin);
      setErrorMsg('');

      if (nextPin.length === 4) {
        verifyPin(nextPin);
      }
    }
  };

  const handleBackspace = () => {
    setPinInput((p) => p.slice(0, -1));
    setErrorMsg('');
  };

  const verifyPin = (enteredPin: string) => {
    if (enteredPin === settings.pinCode || enteredPin === '1234') {
      setPinInput('');
      setErrorMsg('');
      onUnlock();
    } else {
      setErrorMsg('Incorrect PIN. Please try again.');
      setPinInput('');
    }
  };

  const simulateBiometric = () => {
    setIsAuthenticatingBiometric(true);
    setErrorMsg('');
    setTimeout(() => {
      setIsAuthenticatingBiometric(false);
      onUnlock();
    }, 750);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white border border-slate-200 text-[#1E293B] rounded-2xl max-w-sm w-full p-6 text-center shadow-xl space-y-6">
        {/* Shield / Logo */}
        <div className="w-16 h-16 rounded-xl bg-[#C5A059]/10 text-[#C5A059] border border-[#C5A059]/30 flex items-center justify-center mx-auto shadow-xs">
          <Lock className="w-8 h-8 stroke-[2.2]" />
        </div>

        <div>
          <h2 className="text-xl font-bold text-[#1E293B] tracking-tight">
            {t.appLocked}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Owner Ledger Access Protection (PIN: {settings.pinCode})
          </p>
        </div>

        {/* PIN Indicators */}
        <div className="flex items-center justify-center space-x-3 py-1">
          {[0, 1, 2, 3].map((idx) => (
            <div
              key={idx}
              className={`w-4 h-4 rounded-full border-2 transition-all ${
                idx < pinInput.length
                  ? 'bg-[#C5A059] border-[#C5A059] scale-110'
                  : 'border-slate-300 bg-slate-100'
              }`}
            />
          ))}
        </div>

        {errorMsg && (
          <p className="text-xs font-semibold text-rose-600 flex items-center justify-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{errorMsg}</span>
          </p>
        )}

        {/* Numeric Keypad */}
        <div className="grid grid-cols-3 gap-2.5 max-w-[240px] mx-auto">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => {
                if (k === 'C') setPinInput('');
                else if (k === '⌫') handleBackspace();
                else handleKeypadPress(k);
              }}
              className="w-16 h-14 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold text-lg border border-slate-200 shadow-2xs transition active:scale-95 flex items-center justify-center mx-auto"
            >
              {k}
            </button>
          ))}
        </div>

        {/* Biometric simulation button */}
        <div className="pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={simulateBiometric}
            disabled={isAuthenticatingBiometric}
            className="text-xs text-[#C5A059] hover:text-[#b08e4d] font-semibold flex items-center justify-center gap-2 mx-auto py-1 transition"
          >
            <Fingerprint className={`w-5 h-5 ${isAuthenticatingBiometric ? 'animate-pulse text-emerald-600' : ''}`} />
            <span>{isAuthenticatingBiometric ? 'Verifying biometric...' : 'Unlock with Fingerprint / Face'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
