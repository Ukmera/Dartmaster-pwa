import React, { useState } from 'react';
import { Header } from './components/common/Header';
import { BottomNav } from './components/common/BottomNav';
import type { NavTab } from './components/common/BottomNav';
import { PwaInstallPrompt } from './components/common/PwaInstallPrompt';
import { ShareModal } from './components/common/ShareModal';
import { GameSetup } from './components/game/GameSetup';
import { X01Game } from './components/modes/X01Game';
import { CricketGame } from './components/modes/CricketGame';
import { KingGame } from './components/modes/KingGame';
import { PlayerList } from './components/players/PlayerList';
import { Leaderboard } from './components/stats/Leaderboard';
import { MatchHistory } from './components/stats/MatchHistory';
import { MatchWinnerModal } from './components/game/MatchWinnerModal';
import { SettingsModal } from './components/settings/SettingsModal';
import { Modal } from './components/common/Modal';
import { SoundProvider } from './context/SoundContext';
import { PlayerProvider, usePlayers } from './context/PlayerContext';
import { GameProvider, useGame } from './context/GameContext';
import { DoorOpen, UserPlus, Clock, RotateCcw } from 'lucide-react';

const MainAppContent: React.FC = () => {
  const {
    mode,
    status,
    currentLeg,
    x01Config,
    cricketConfig,
    kingConfig,
    quitGame,
    startNewGame,
    continueCricketMatch,
    addPlayerMidGame
  } = useGame();

  const { players, selectedPlayerIds } = usePlayers();
  const [activeTab, setActiveTab] = useState<NavTab>('game');
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [isAddMidGameModalOpen, setIsAddMidGameModalOpen] = useState<boolean>(false);
  const [pendingJoinPlayer, setPendingJoinPlayer] = useState<string | null>(null);

  const availableNonPlayingPlayers = players.filter((p) => !selectedPlayerIds.includes(p.id));

  const totalLegsToWin =
    mode === 'cricket'
      ? cricketConfig.legsToWin
      : mode === 'king'
      ? kingConfig.legsToWin
      : x01Config.legsToWin;

  const handleTabChange = (tab: NavTab) => {
    if (tab === 'settings') {
      setIsSettingsModalOpen(true);
    } else {
      setActiveTab(tab);
    }
  };

  const handleQuitGame = () => {
    if (window.confirm('Voulez-vous vraiment quitter la partie en cours ?')) {
      quitGame();
    }
  };

  return (
    <div className="h-[100dvh] max-h-[100dvh] bg-[#060a14] text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white relative overflow-hidden">
      {/* 1. Luminous & Vibrant PDC Dartboard Graphic in Background (Right side bleed) */}
      <div className="fixed -right-28 sm:-right-24 top-8 sm:top-10 pointer-events-none opacity-[0.22] lg:opacity-[0.28] select-none z-0">
        <svg viewBox="0 0 500 500" className="w-[480px] sm:w-[580px] h-[480px] sm:h-[580px] drop-shadow-[0_0_35px_rgba(16,185,129,0.3)]">
          {/* Outer Ring */}
          <circle cx="250" cy="250" r="240" fill="#0d1117" stroke="#334155" strokeWidth="6" />
          <circle cx="250" cy="250" r="215" fill="#111827" stroke="#475569" strokeWidth="3" />
          
          {/* Double Ring (Vibrant Red & Green) */}
          <circle cx="250" cy="250" r="170" fill="none" stroke="#e11d48" strokeWidth="18" strokeDasharray="26.7 26.7" />
          <circle cx="250" cy="250" r="170" fill="none" stroke="#059669" strokeWidth="18" strokeDasharray="26.7 26.7" strokeDashoffset="26.7" />
          
          {/* Single Outer (Dark & Vintage Cream) */}
          <circle cx="250" cy="250" r="135" fill="none" stroke="#0f172a" strokeWidth="52" strokeDasharray="21.2 21.2" />
          <circle cx="250" cy="250" r="135" fill="none" stroke="#fef08a" strokeWidth="52" strokeDasharray="21.2 21.2" strokeDashoffset="21.2" opacity="0.45" />

          {/* Triple Ring (Vibrant Red & Green) */}
          <circle cx="250" cy="250" r="100" fill="none" stroke="#e11d48" strokeWidth="18" strokeDasharray="15.7 15.7" />
          <circle cx="250" cy="250" r="100" fill="none" stroke="#059669" strokeWidth="18" strokeDasharray="15.7 15.7" strokeDashoffset="15.7" />

          {/* Single Inner */}
          <circle cx="250" cy="250" r="65" fill="none" stroke="#0f172a" strokeWidth="52" strokeDasharray="10.2 10.2" />
          <circle cx="250" cy="250" r="65" fill="none" stroke="#fef08a" strokeWidth="52" strokeDasharray="10.2 10.2" strokeDashoffset="10.2" opacity="0.45" />

          {/* Outer Bull (25 - Green) */}
          <circle cx="250" cy="250" r="28" fill="#059669" stroke="#34d399" strokeWidth="3" />

          {/* Inner Bullseye (50 - Red) */}
          <circle cx="250" cy="250" r="14" fill="#e11d48" stroke="#fecdd3" strokeWidth="3" />

          {/* Spider Wire Spokes (Bright Platinum) */}
          {[0, 18, 36, 54, 72, 90, 108, 126, 144, 162, 180, 198, 216, 234, 252, 270, 288, 306, 324, 342].map((deg) => (
            <line
              key={deg}
              x1="250"
              y1="250"
              x2={250 + 179 * Math.cos((deg * Math.PI) / 180)}
              y2={250 + 179 * Math.sin((deg * Math.PI) / 180)}
              stroke="#94a3b8"
              strokeWidth="2.5"
              opacity="0.8"
            />
          ))}
        </svg>
      </div>

      {/* 2. Authentic Vector Guinness Pint & Irish Pub Atmosphere (Left side watermark) */}
      <div className="fixed -left-12 sm:-left-8 bottom-6 sm:bottom-10 pointer-events-none opacity-[0.16] lg:opacity-[0.24] select-none z-0">
        <svg viewBox="0 0 260 400" className="w-[200px] sm:w-[260px] h-[300px] sm:h-[400px] drop-shadow-2xl">
          <defs>
            <linearGradient id="stoutBody" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="#0a0503" />
              <stop offset="35%" stop-color="#1c0f0a" />
              <stop offset="70%" stop-color="#2a1209" />
              <stop offset="100%" stop-color="#0d0704" />
            </linearGradient>
            <linearGradient id="creamyHead" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="#ffffff" />
              <stop offset="40%" stop-color="#fef3c7" />
              <stop offset="100%" stop-color="#fde68a" />
            </linearGradient>
            <linearGradient id="goldHarp" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#fef08a" />
              <stop offset="50%" stop-color="#f59e0b" />
              <stop offset="100%" stop-color="#b45309" />
            </linearGradient>
          </defs>

          {/* Glass Pint Silhouette */}
          <path
            d="M 50 70 L 65 340 Q 66 360 85 360 L 175 360 Q 194 360 195 340 L 210 70 Z"
            fill="url(#stoutBody)"
            stroke="#475569"
            strokeWidth="3"
          />

          {/* Thick Velvet Creamy Foam Head */}
          <path
            d="M 48 70 Q 130 65 212 70 L 208 120 Q 130 130 52 120 Z"
            fill="url(#creamyHead)"
            stroke="#fde68a"
            strokeWidth="2"
          />

          {/* Irish Celtic Golden Harp Emblem */}
          <g transform="translate(130, 220) scale(0.9)" stroke="url(#goldHarp)" fill="none" strokeWidth="3">
            <path d="M -25 -40 C -15 -50, 15 -50, 25 -35 C 15 -10, 10 20, 15 40 C -5 40, -25 35, -25 -40 Z" />
            <line x1="-15" y1="-35" x2="-10" y2="35" strokeWidth="2" />
            <line x1="-5" y1="-38" x2="-2" y2="35" strokeWidth="2" />
            <line x1="5" y1="-38" x2="6" y2="35" strokeWidth="2" />
            <line x1="15" y1="-32" x2="12" y2="35" strokeWidth="2" />
          </g>
        </svg>
      </div>

      {/* Top Navigation Header with HD Emblem & Share Button */}
      <Header
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onOpenShare={() => setIsShareModalOpen(true)}
      />

      {/* PWA Install Banner */}
      <PwaInstallPrompt />

      {/* Main Content Area */}
      <main className="flex-1 min-h-0 max-w-7xl w-full mx-auto px-2.5 py-1.5 sm:p-3 overflow-y-auto sm:overflow-hidden relative z-10 flex flex-col justify-between">
        {/* If In Game & In 'game' tab: Show Quit / Leg / Join Bar */}
        {activeTab === 'game' && status === 'in_progress' && (
          <div className="flex items-center justify-between mb-1.5 px-1 shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-300">
                Mode {mode.toUpperCase()}
                {totalLegsToWin > 1 && ` • Manche #${currentLeg} (1er à ${totalLegsToWin})`}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              {availableNonPlayingPlayers.length > 0 && (
                <button
                  onClick={() => setIsAddMidGameModalOpen(true)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 text-emerald-400 hover:bg-slate-800 text-[11px] font-bold transition-colors shadow-sm"
                  title="Ajouter un joueur pour la prochaine manche"
                >
                  <UserPlus className="w-3 h-3" />
                  <span>+ Rejoindre</span>
                </button>
              )}

              <button
                onClick={handleQuitGame}
                className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 hover:border-rose-500/30 text-[11px] font-bold transition-colors"
              >
                <DoorOpen className="w-3 h-3" />
                <span>Quitter</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab Routing */}
        <div className="flex-1 min-h-0 flex flex-col justify-start">
          {activeTab === 'game' && (
            <>
              {status === 'setup' && (
                <GameSetup onManagePlayers={() => setActiveTab('players')} />
              )}
              {status === 'in_progress' && (
                <>
                  {(mode === '301' || mode === '501' || mode === '701') && <X01Game />}
                  {mode === 'cricket' && <CricketGame />}
                  {mode === 'king' && <KingGame />}
                </>
              )}
            </>
          )}

          {activeTab === 'players' && <PlayerList />}
          {activeTab === 'leaderboard' && <Leaderboard />}
          {activeTab === 'history' && <MatchHistory />}
        </div>
      </main>

      {/* Victory / Podium Celebration Modal */}
      <MatchWinnerModal
        isOpen={status === 'finished' || status === 'podium'}
        isPodium={status === 'podium'}
        onContinueMatch={continueCricketMatch}
        onNewGame={() => startNewGame()}
        onHome={() => {
          quitGame();
          setActiveTab('game');
        }}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        onOpenShare={() => setIsShareModalOpen(true)}
      />

      {/* Share / QR Code Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
      />

      {/* Add Player Mid-Game Modal */}
      {isAddMidGameModalOpen && (
        <Modal
          isOpen={isAddMidGameModalOpen}
          onClose={() => setIsAddMidGameModalOpen(false)}
          title="Demande d'intégration d'un Joueur"
          maxWidth="max-w-md"
        >
          <div className="space-y-3 py-1">
            {!pendingJoinPlayer ? (
              <>
                <p className="text-xs text-slate-400">
                  Sélectionnez un ami qui souhaite intégrer la partie. Il sera automatiquement intégré <strong>dès le début de la prochaine manche</strong>.
                </p>
                <div className="grid grid-cols-1 gap-1.5">
                  {availableNonPlayingPlayers.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setPendingJoinPlayer(p.id)}
                      className="p-2.5 rounded-2xl bg-slate-900 hover:bg-emerald-950/40 border border-slate-800 hover:border-emerald-500/50 flex items-center justify-between text-left transition-all"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{p.avatar}</span>
                        <span className="font-bold text-xs text-white">{p.name}</span>
                      </div>
                      <span className="text-xs font-bold text-emerald-400">Sélectionner ▶</span>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="space-y-2.5">
                <div className="p-2.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/50 text-center space-y-1">
                  <span className="text-xs text-emerald-300 font-bold flex items-center justify-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    Joueur sélectionné : {players.find((p) => p.id === pendingJoinPlayer)?.name}
                  </span>
                  <p className="text-[10px] text-slate-400">
                    Comment souhaitez-vous gérer les manches (legs) pour l'intégration ?
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-1.5">
                  <button
                    onClick={() => {
                      addPlayerMidGame(pendingJoinPlayer);
                      setPendingJoinPlayer(null);
                      setIsAddMidGameModalOpen(false);
                    }}
                    className="p-3 rounded-2xl bg-slate-900 border border-slate-700 hover:border-emerald-500 text-left transition-all"
                  >
                    <div className="text-xs font-bold text-white">Conserver le score actuel des manches</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Les victoires de manches actuelles restent actives (ex: 1-0).
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      addPlayerMidGame(pendingJoinPlayer);
                      setPendingJoinPlayer(null);
                      setIsAddMidGameModalOpen(false);
                    }}
                    className="p-3 rounded-2xl bg-slate-900 border border-slate-700 hover:border-amber-500 text-left transition-all"
                  >
                    <div className="text-xs font-bold text-amber-300 flex items-center gap-1">
                      <RotateCcw className="w-3 h-3" />
                      <span>Réinitialiser les manches à 0-0</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Repart à 0 manche gagnée (les stats passées restent enregistrées).
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Bottom Mobile Navigation Bar */}
      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
    </div>
  );
};

export function App() {
  return (
    <SoundProvider>
      <PlayerProvider>
        <GameProvider>
          <MainAppContent />
        </GameProvider>
      </PlayerProvider>
    </SoundProvider>
  );
}

export default App;
