import React from 'react';
import { 
  Wallet,
  PlusCircle, 
  Clock, 
  Calendar,
  HandCoins, 
  CheckCheck
} from 'lucide-react';
import { Language } from '../../types';

interface AndroidBottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  activeCount: number;
  language: Language;
}

export const AndroidBottomNav: React.FC<AndroidBottomNavProps> = ({
  activeTab,
  onTabChange,
  activeCount,
  language,
}) => {
  const tabs = [
    {
      id: 'khata',
      labelEn: 'Khata',
      labelTe: 'ఖాతా',
      icon: Wallet,
    },
    {
      id: 'new-deal',
      labelEn: 'New Deal',
      labelTe: 'కొత్తది',
      icon: PlusCircle,
    },
    {
      id: 'active',
      labelEn: 'Active',
      labelTe: 'నడుస్తున్నవి',
      icon: Clock,
      badge: activeCount,
    },
    {
      id: 'calendar',
      labelEn: 'Calendar',
      labelTe: 'క్యాలెండర్',
      icon: Calendar,
    },
    {
      id: 'settle',
      labelEn: 'Settle',
      labelTe: 'వసూలు',
      icon: HandCoins,
    },
    {
      id: 'day-done',
      labelEn: 'Done',
      labelTe: 'ముగిసినవి',
      icon: CheckCheck,
    },
  ];

  return (
    <nav className="bg-white border-t border-slate-200 px-1 py-1.5 flex items-center justify-around sticky bottom-0 z-40 shadow-lg select-none shrink-0">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        const label = language === 'te' ? tab.labelTe : tab.labelEn;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={`flex-1 py-1 px-0.5 rounded-xl flex flex-col items-center justify-center relative transition-all duration-200 active:scale-95 cursor-pointer ${
              isActive 
                ? 'text-[#C5A059]' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {/* Active Pill Indicator */}
            <div className={`p-1 rounded-xl transition-all ${
              isActive ? 'bg-[#C5A059]/15' : 'bg-transparent'
            }`}>
              <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110 stroke-[2.4]' : 'stroke-[2]'}`} />
            </div>

            {/* Label */}
            <span className={`text-[10px] mt-0.5 tracking-tight whitespace-nowrap ${
              isActive ? 'font-bold text-[#1E293B]' : 'font-medium'
            }`}>
              {label}
            </span>

            {/* Badge */}
            {tab.badge !== undefined && tab.badge > 0 && (
              <span className="absolute top-0.5 right-[15%] bg-emerald-600 text-white text-[9px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
};

