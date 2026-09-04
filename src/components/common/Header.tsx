import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Maximize, Minimize, Share2 } from 'lucide-react';
import { useSound } from '../../context/SoundContext';

interface HeaderProps {
  onOpenSettings: () => void;
  onOpenShare?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenShare }) => {
  const { soundEnabled, toggleSound } = useSound();
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-800/80 px-3 sm:px-4 py-2 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand Logo with New HD Emblem */}
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-amber-400 p-[1.5px] shadow-lg glow-emerald flex items-center justify-center relative overflow-hidden group">
            <img
              src="/favicon.svg"
              alt="DartMaster Logo"
              className="w-full h-full object-contain rounded-[14px]"
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm sm:text-base font-black tracking-tight text-white">
                DartMaster
              </h1>
              <span className="text-[9px] sm:text-[10px] px-1.5 py-0.2 rounded-md bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black shadow-sm tracking-wide">
                PRO
              </span>
            </div>
            <p className="text-[9px] sm:text-[10px] text-slate-400 font-semibold leading-none">Compteur & Voice Caller</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-1.5 sm:space-x-2">
          {/* Share Button (Direct 1-Click) */}
          {onOpenShare && (
            <button
              onClick={onOpenShare}
              title="Partager l'application (QR Code / Lien)"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-emerald-400 hover:bg-slate-800 text-xs font-bold transition-all shadow-sm active:scale-95"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Partager</span>
            </button>
          )}

          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            aria-label={soundEnabled ? 'Désactiver le son' : 'Activer le son'}
            title={soundEnabled ? 'Son activé' : 'Son désactivé'}
            className={`p-2 rounded-xl border transition-colors ${
              soundEnabled
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            aria-label={isFullscreen ? 'Quitter plein écran' : 'Plein écran'}
            title={isFullscreen ? 'Quitter plein écran' : 'Plein écran'}
            className="p-2 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
          >
            {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </header>
  );
};
