import React, { useState } from 'react';
import { X, Delete, ArrowDownRight, Sparkles } from 'lucide-react';
import { Language } from '../../types';
import { formatINR } from '../../utils/formatters';

interface AndroidCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  onUseAmount: (amount: number) => void;
}

export const AndroidCalculatorModal: React.FC<AndroidCalculatorModalProps> = ({
  isOpen,
  onClose,
  language,
  onUseAmount,
}) => {
  const [display, setDisplay] = useState('0');
  const [prevVal, setPrevVal] = useState<number | null>(null);
  const [op, setOp] = useState<string | null>(null);
  const [resetNext, setResetNext] = useState(false);

  if (!isOpen) return null;

  const handleDigit = (digit: string) => {
    if (display === '0' || resetNext) {
      setDisplay(digit);
      setResetNext(false);
    } else {
      setDisplay(display + digit);
    }
  };

  const handleOp = (operator: string) => {
    const current = parseFloat(display);
    if (prevVal === null) {
      setPrevVal(current);
    } else if (op) {
      const res = calculate(prevVal, current, op);
      setPrevVal(res);
      setDisplay(String(res));
    }
    setOp(operator);
    setResetNext(true);
  };

  const calculate = (a: number, b: number, operator: string): number => {
    switch (operator) {
      case '+': return a + b;
      case '-': return a - b;
      case '×': return a * b;
      case '÷': return b !== 0 ? a / b : 0;
      default: return b;
    }
  };

  const handleEquals = () => {
    if (prevVal !== null && op) {
      const current = parseFloat(display);
      const res = calculate(prevVal, current, op);
      setDisplay(String(res));
      setPrevVal(null);
      setOp(null);
      setResetNext(true);
    }
  };

  const handleClear = () => {
    setDisplay('0');
    setPrevVal(null);
    setOp(null);
    setResetNext(false);
  };

  const handleBackspace = () => {
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay('0');
    }
  };

  const handleQuickPercent = (rate: number) => {
    const current = parseFloat(display) || 0;
    // Calculate 1 month interest on current amount at given rate
    const interest = (current * rate) / 100;
    setDisplay(String(Math.round(interest)));
    setResetNext(true);
  };

  const handleUseInDeal = () => {
    const amount = parseFloat(display) || 0;
    if (amount > 0) {
      onUseAmount(amount);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/60 backdrop-blur-xs p-0 sm:p-4">
      <div className="bg-slate-900 border border-slate-800 text-white rounded-t-3xl sm:rounded-3xl max-w-sm w-full p-5 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto animate-in slide-in-from-bottom-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#C5A059]">
              {language === 'te' ? 'మొబైల్ క్యాలిక్యులేటర్' : 'Mobile Calculator'}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* LCD Display */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-right space-y-1 shadow-inner">
          <div className="text-xs font-mono text-slate-400 h-4">
            {prevVal !== null && op ? `${prevVal} ${op}` : ''}
          </div>
          <div className="text-3xl font-black font-mono text-white tracking-wider truncate">
            {display}
          </div>
          <div className="text-[11px] font-mono text-[#C5A059]">
            {formatINR(parseFloat(display) || 0)}
          </div>
        </div>

        {/* Gold Loan Quick Presets */}
        <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar py-1">
          <span className="text-[10px] text-slate-400 whitespace-nowrap">Calc Interest:</span>
          <button
            type="button"
            onClick={() => handleQuickPercent(2)}
            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-[#C5A059] rounded-lg text-[10px] font-bold whitespace-nowrap"
          >
            2% వడ్డీ
          </button>
          <button
            type="button"
            onClick={() => handleQuickPercent(2.5)}
            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-[#C5A059] rounded-lg text-[10px] font-bold whitespace-nowrap"
          >
            2.5% వడ్డీ
          </button>
          <button
            type="button"
            onClick={() => handleQuickPercent(3)}
            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-[#C5A059] rounded-lg text-[10px] font-bold whitespace-nowrap"
          >
            3% వడ్డీ
          </button>
        </div>

        {/* Keypad */}
        <div className="grid grid-cols-4 gap-2 text-lg font-bold">
          <button
            type="button"
            onClick={handleClear}
            className="py-3 rounded-xl bg-rose-950/40 text-rose-400 hover:bg-rose-900/50 border border-rose-800/40 transition active:scale-95"
          >
            C
          </button>
          <button
            type="button"
            onClick={handleBackspace}
            className="py-3 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 transition active:scale-95 flex items-center justify-center"
          >
            <Delete className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => handleOp('÷')}
            className="py-3 rounded-xl bg-slate-800 text-[#C5A059] hover:bg-slate-700 transition active:scale-95"
          >
            ÷
          </button>
          <button
            type="button"
            onClick={() => handleOp('×')}
            className="py-3 rounded-xl bg-slate-800 text-[#C5A059] hover:bg-slate-700 transition active:scale-95"
          >
            ×
          </button>

          {['7', '8', '9'].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => handleDigit(d)}
              className="py-3 rounded-xl bg-slate-850 hover:bg-slate-750 text-white transition active:scale-95"
            >
              {d}
            </button>
          ))}
          <button
            type="button"
            onClick={() => handleOp('-')}
            className="py-3 rounded-xl bg-slate-800 text-[#C5A059] hover:bg-slate-700 transition active:scale-95"
          >
            -
          </button>

          {['4', '5', '6'].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => handleDigit(d)}
              className="py-3 rounded-xl bg-slate-850 hover:bg-slate-750 text-white transition active:scale-95"
            >
              {d}
            </button>
          ))}
          <button
            type="button"
            onClick={() => handleOp('+')}
            className="py-3 rounded-xl bg-slate-800 text-[#C5A059] hover:bg-slate-700 transition active:scale-95"
          >
            +
          </button>

          {['1', '2', '3'].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => handleDigit(d)}
              className="py-3 rounded-xl bg-slate-850 hover:bg-slate-750 text-white transition active:scale-95"
            >
              {d}
            </button>
          ))}
          <button
            type="button"
            onClick={handleEquals}
            className="py-3 rounded-xl bg-[#C5A059] text-white hover:bg-[#b08e4d] font-black transition active:scale-95 row-span-2 flex items-center justify-center"
          >
            =
          </button>

          <button
            type="button"
            onClick={() => handleDigit('0')}
            className="py-3 rounded-xl bg-slate-850 hover:bg-slate-750 text-white transition active:scale-95 col-span-2"
          >
            0
          </button>
          <button
            type="button"
            onClick={() => handleDigit('.')}
            className="py-3 rounded-xl bg-slate-850 hover:bg-slate-750 text-white transition active:scale-95"
          >
            .
          </button>
        </div>

        {/* Action: Use in Deal */}
        <button
          type="button"
          onClick={handleUseInDeal}
          className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold flex items-center justify-center space-x-1.5 transition active:scale-95"
        >
          <ArrowDownRight className="w-4 h-4" />
          <span>{language === 'te' ? 'ఈ మొత్తాన్ని కొత్త లెక్కలో వాడండి' : 'Use Amount in New Deal'}</span>
        </button>
      </div>
    </div>
  );
};
