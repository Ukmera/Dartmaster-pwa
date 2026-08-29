import React, { useState } from 'react';
import { Header } from './components/common/Header';
import { BottomNav } from './components/common/BottomNav';
import type { NavTab } from './components/common/BottomNav';
import { PwaInstallPrompt } from './components/common/PwaInstallPrompt';
import { GameSetup } from './components/game/GameSetup';
import { X01Game } from './components/modes/X01Game';
import { CricketGame } from './components/modes/CricketGame';
import { KingGame } from './components/modes/KingGame';
import { PlayerList } from './components/players/PlayerList';
import { Leaderboard } from './components/stats/Leaderboard';
import { MatchHistory } from './components/stats/MatchHistory';
import { MatchWinnerModal } from './components/game/MatchWinnerModal';
import { SupabaseConfigModal } from './components/settings/SupabaseConfigModal';
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
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState<boolean>(false);
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
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white relative overflow-x-hidden">
      {/* Authentic Official Dartboard Graphic in Background (Right side bleed) */}
      <div className="fixed -right-32 top-12 pointer-events-none opacity-[0.08] lg:opacity-[0.14] select-none z-0">
        <svg viewBox="0 0 500 500" className="w-[580px] h-[580px] drop-shadow-2xl">
          {/* Outer Black Ring */}
          <circle cx="250" cy="250" r="240" fill="#0d1117" stroke="#30363d" strokeWidth="4" />
          
          {/* Numbers ring */}
          <circle cx="250" cy="250" r="215" fill="#161b22" stroke="#484f58" strokeWidth="2" />
          
          {/* Double Ring (Green & Red alternating) */}
          <circle cx="250" cy="250" r="170" fill="none" stroke="#e11d48" strokeWidth="16" strokeDasharray="26.7 26.7" />
          <circle cx="250" cy="250" r="170" fill="none" stroke="#059669" strokeWidth="16" strokeDasharray="26.7 26.7" strokeDashoffset="26.7" />
          
          {/* Single Outer (Black & Cream alternating) */}
          <circle cx="250" cy="250" r="135" fill="none" stroke="#0f172a" strokeWidth="54" strokeDasharray="21.2 21.2" />
          <circle cx="250" cy="250" r="135" fill="none" stroke="#fef08a" strokeWidth="54" strokeDasharray="21.2 21.2" strokeDashoffset="21.2" opacity="0.3" />

          {/* Triple Ring (Green & Red alternating) */}
          <circle cx="250" cy="250" r="100" fill="none" stroke="#e11d48" strokeWidth="16" strokeDasharray="15.7 15.7" />
          <circle cx="250" cy="250" r="100" fill="none" stroke="#059669" strokeWidth="16" strokeDasharray="15.7 15.7" strokeDashoffset="15.7" />

          {/* Single Inner (Black & Cream) */}
          <circle cx="250" cy="250" r="65" fill="none" stroke="#0f172a" strokeWidth="54" strokeDasharray="10.2 10.2" />
          <circle cx="250" cy="250" r="65" fill="none" stroke="#fef08a" strokeWidth="54" strokeDasharray="10.2 10.2" strokeDashoffset="10.2" opacity="0.3" />

          {/* Outer Bull (25 - Green) */}
          <circle cx="250" cy="250" r="28" fill="#059669" stroke="#34d399" strokeWidth="2" />

          {/* Inner Bullseye (50 - Red) */}
          <circle cx="250" cy="250" r="14" fill="#e11d48" stroke="#fb7185" strokeWidth="2" />

          {/* Spider wires */}
          {[0, 18, 36, 54, 72, 90, 108, 126, 144, 162, 180, 198, 216, 234, 252, 270, 288, 306, 324, 342].map((deg) => (
            <line
              key={deg}
              x1="250"
              y1="250"
              x2={250 + 178 * Math.cos((deg * Math.PI) / 180)}
              y2={250 + 178 * Math.sin((deg * Math.PI) / 180)}
              stroke="#64748b"
              strokeWidth="2"
              opacity="0.6"
            />
          ))}
        </svg>
      </div>

      {/* Subtle Celtic clover / Irish Pub accent watermark on bottom left */}
      <div className="fixed -left-16 -bottom-16 pointer-events-none opacity-[0.03] lg:opacity-[0.05] select-none z-0">
        <span className="text-[260px]">☘️</span>
      </div>

      {/* Top Navigation Header */}
      <Header onOpenSettings={() => setIsSettingsModalOpen(true)} />

      {/* PWA Install Banner */}
      <PwaInstallPrompt />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5 relative z-10">
        {/* If In Game & In 'game' tab: Show Quit / Leg / Join Bar */}
        {activeTab === 'game' && status === 'in_progress' && (
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Mode {mode.toUpperCase()}
                {totalLegsToWin > 1 && ` • Manche #${currentLeg} (1er à ${totalLegsToWin})`}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {availableNonPlayingPlayers.length > 0 && (
                <button
                  onClick={() => setIsAddMidGameModalOpen(true)}
                  className="flex items-center gap-1 px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 text-emerald-400 hover:bg-slate-800 text-xs font-bold transition-colors shadow-sm"
                  title="Ajouter un joueur pour la prochaine manche"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>+ Rejoindre</span>
                </button>
              )}

              <button
                onClick={handleQuitGame}
                className="flex items-center gap-1 px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 hover:border-rose-500/30 text-xs font-bold transition-colors"
              >
                <DoorOpen className="w-3.5 h-3.5" />
                <span>Quitter</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab Routing */}
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
        onOpenSupabase={() => setIsSupabaseModalOpen(true)}
      />

      {/* Supabase & Cloud Modal */}
      <SupabaseConfigModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
      />

      {/* Add Player Mid-Game Modal */}
      {isAddMidGameModalOpen && (
        <Modal
          isOpen={isAddMidGameModalOpen}
          onClose={() => setIsAddMidGameModalOpen(false)}
          title="Demande d'intégration d'un Joueur"
          maxWidth="max-w-md"
        >
          <div className="space-y-4 py-2">
            {!pendingJoinPlayer ? (
              <>
                <p className="text-xs text-slate-400">
                  Sélectionnez un ami qui souhaite intégrer la partie. Il sera automatiquement intégré <strong>dès le début de la prochaine manche</strong>.
                </p>
                <div className="grid grid-cols-1 gap-2">
                  {availableNonPlayingPlayers.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setPendingJoinPlayer(p.id)}
                      className="p-3 rounded-2xl bg-slate-900 hover:bg-emerald-950/40 border border-slate-800 hover:border-emerald-500/50 flex items-center justify-between text-left transition-all"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{p.avatar}</span>
                        <span className="font-bold text-sm text-white">{p.name}</span>
                      </div>
                      <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                        <span>Sélectionner</span>
                      </span>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="space-y-3">
                <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/50 text-center space-y-1">
                  <span className="text-xs text-emerald-300 font-bold flex items-center justify-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    Joueur sélectionné : {players.find((p) => p.id === pendingJoinPlayer)?.name}
                  </span>
                  <p className="text-[11px] text-slate-400">
                    Comment souhaitez-vous gérer les manches (legs) pour l'intégration ?
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  <button
                    onClick={() => {
                      addPlayerMidGame(pendingJoinPlayer);
                      setPendingJoinPlayer(null);
                      setIsAddMidGameModalOpen(false);
                    }}
                    className="p-3.5 rounded-2xl bg-slate-900 border border-slate-700 hover:border-emerald-500 text-left transition-all"
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
                    className="p-3.5 rounded-2xl bg-slate-900 border border-slate-700 hover:border-amber-500 text-left transition-all"
                  >
                    <div className="text-xs font-bold text-amber-300 flex items-center gap-1">
                      <RotateCcw className="w-3 h-3" />
                      <span>Réinitialiser les manches à 0-0</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Repart à 0 manche gagnée (les stats passées restent enregistrées dans l'historique).
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
