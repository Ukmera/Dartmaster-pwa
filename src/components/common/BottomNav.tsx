import React from 'react';
import { Target, Users, Trophy, History, Settings } from 'lucide-react';
import { useGame } from '../../context/GameContext';

export type NavTab = 'game' | 'players' | 'leaderboard' | 'history' | 'settings';

interface BottomNavProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  const { status } = useGame();

  const navItems = [
    {
      id: 'game' as NavTab,
      label: status === 'in_progress' ? 'Partie' : 'Jouer',
      icon: Target,
      badge: status === 'in_progress' ? '●' : undefined
    },
    {
      id: 'players' as NavTab,
      label: 'Joueurs',
      icon: Users
    },
    {
      id: 'leaderboard' as NavTab,
      label: 'Classement',
      icon: Trophy
    },
    {
      id: 'history' as NavTab,
      label: 'Historique',
      icon: History
    },
    {
      id: 'settings' as NavTab,
      label: 'Cloud & BDD',
      icon: Settings
    }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 glass-panel border-t border-slate-800/90 pb-safe transition-all">
      <div className="max-w-md mx-auto flex items-center justify-around px-2 py-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all relative ${
                isActive
                  ? 'text-emerald-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110 text-emerald-400' : ''}`} />
                {item.badge && (
                  <span className="absolute -top-1 -right-2 text-emerald-400 text-xs animate-ping">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[11px] mt-0.5 tracking-tight">{item.label}</span>
              {isActive && (
                <div className="absolute -bottom-1.5 w-6 h-1 bg-emerald-500 rounded-full glow-emerald" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
