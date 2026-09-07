import React from 'react';
import { 
  PlusCircle, 
  Clock, 
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
      id: 'new-deal',
      labelEn: 'New Deal',
      labelTe: 'కొత్త లెక్క',
      icon: PlusCircle,
    },
    {
      id: 'active',
      labelEn: 'Active Deals',
      labelTe: 'నడుస్తున్నవి',
      icon: Clock,
      badge: activeCount,
    },
    {
      id: 'settle',
      labelEn: 'Settle & Split',
      labelTe: 'వసూలు & పంచడం',
      icon: HandCoins,
    },
    {
      id: 'day-done',
      labelEn: 'Day Done',
      labelTe: 'ముగిసినవి',
      icon: CheckCheck,
    },
  ];

  return (
    <nav className="bg-white border-t border-slate-200 px-2 py-2 flex items-center justify-around sticky bottom-0 z-30 shadow-lg select-none">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        const label = language === 'te' ? tab.labelTe : tab.labelEn;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={`flex-1 py-1.5 px-1 rounded-xl flex flex-col items-center justify-center relative transition-all duration-200 active:scale-95 ${
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
              <span className="absolute top-0.5 right-[20%] bg-emerald-600 text-white text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
};
