import React, { useState } from 'react';
import { UserPlus, Edit2, Trash2, Smartphone, GitMerge, UserCheck, Lock } from 'lucide-react';
import { usePlayers } from '../../context/PlayerContext';
import { PlayerFormModal } from './PlayerFormModal';
import { Modal } from '../common/Modal';
import type { Player, AvatarType } from '../../types/player';

export const PlayerList: React.FC = () => {
  const {
    players,
    playerStats,
    ownerPlayerId,
    setOwnerPlayerId,
    addPlayer,
    updatePlayer,
    deletePlayer,
    mergeGuestIntoPlayer
  } = usePlayers();

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  
  // Merge Guest Modal
  const [isMergeModalOpen, setIsMergeModalOpen] = useState<boolean>(false);
  const [selectedGuestId, setSelectedGuestId] = useState<string>('');
  const [selectedTargetPlayerId, setSelectedTargetPlayerId] = useState<string>('');

  // PIN Prompt Modal
  const [pinPromptPlayer, setPinPromptPlayer] = useState<Player | null>(null);
  const [pinInput, setPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<string>('');

  const handleOpenAdd = () => {
    setEditingPlayer(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (player: Player) => {
    setEditingPlayer(player);
    setIsModalOpen(true);
  };

  const handleSubmit = async (
    name: string,
    avatar: string,
    color: string,
    avatarType: AvatarType = 'emoji',
    isGuest: boolean = false,
    pinCode?: string
  ) => {
    if (editingPlayer) {
      await updatePlayer({
        ...editingPlayer,
        name,
        avatar,
        color,
        avatarType,
        isGuest,
        pinCode
      });
    } else {
      await addPlayer(name, avatar, color, avatarType, isGuest, pinCode);
    }
  };

  const handleDelete = async (playerId: string, name: string) => {
    if (window.confirm(`Supprimer définitivement le joueur "${name}" et toutes ses statistiques ?`)) {
      await deletePlayer(playerId);
    }
  };

  const handleSetOwnerClick = (player: Player) => {
    if (ownerPlayerId === player.id) {
      setOwnerPlayerId(null);
      return;
    }

    if (player.pinCode) {
      setPinPromptPlayer(player);
      setPinInput('');
      setPinError('');
    } else {
      setOwnerPlayerId(player.id);
    }
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinPromptPlayer) return;
    const res = setOwnerPlayerId(pinPromptPlayer.id, pinInput);
    if (res.success) {
      setPinPromptPlayer(null);
      setPinInput('');
      setPinError('');
    } else {
      setPinError(res.error || 'Code PIN incorrect');
    }
  };

  const handleMergeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGuestId || !selectedTargetPlayerId) return;
    await mergeGuestIntoPlayer(selectedGuestId, selectedTargetPlayerId);
    setIsMergeModalOpen(false);
    setSelectedGuestId('');
    setSelectedTargetPlayerId('');
  };

  const guestPlayers = players.filter((p) => p.isGuest);
  const regularPlayers = players.filter((p) => !p.isGuest);

  return (
    <div className="max-w-4xl mx-auto space-y-5 pb-20 animate-fadeIn">
      {/* Header */}
      <div className="glass-panel rounded-3xl p-5 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <span>👥</span>
            <span>Gestion des Profils</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Gérez vos profils, sécurisez l'accès avec un code PIN et liez les comptes invités.
          </p>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          {guestPlayers.length > 0 && regularPlayers.length > 0 && (
            <button
              onClick={() => setIsMergeModalOpen(true)}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs border border-slate-700 flex items-center gap-1.5 transition-all"
            >
              <GitMerge className="w-3.5 h-3.5" />
              <span>Lier un invité</span>
            </button>
          )}

          <button
            onClick={handleOpenAdd}
            className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg glow-emerald flex items-center justify-center gap-1.5 transition-all active:scale-95"
          >
            <UserPlus className="w-4 h-4" />
            <span>Nouveau Joueur</span>
          </button>
        </div>
      </div>

      {/* Players List Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {players.map((player) => {
          const stats = playerStats[player.id];
          const isOwner = ownerPlayerId === player.id;
          const isGuest = !!player.isGuest;

          return (
            <div
              key={player.id}
              className={`glass-panel rounded-3xl p-4 border transition-all relative flex flex-col justify-between ${
                isOwner
                  ? 'border-emerald-500/80 shadow-lg glow-emerald ring-1 ring-emerald-500/50'
                  : isGuest
                  ? 'border-dashed border-amber-500/40 bg-slate-950/40'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center border text-2xl relative overflow-hidden"
                      style={{ borderColor: player.color, backgroundColor: `${player.color}15` }}
                    >
                      {player.avatarType === 'image' && player.avatar.startsWith('data:') ? (
                        <img src={player.avatar} alt={player.name} className="w-full h-full object-cover" />
                      ) : (
                        <span>{player.avatar}</span>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-bold text-base text-white">{player.name}</h3>
                        {isOwner && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30 flex items-center gap-0.5">
                            <Smartphone className="w-2.5 h-2.5" /> Moi
                          </span>
                        )}
                        {isGuest && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30 flex items-center gap-0.5">
                            <UserCheck className="w-2.5 h-2.5" /> Invité
                          </span>
                        )}
                        {player.pinCode && (
                          <span title="Protégé par Code PIN">
                            <Lock className="w-3 h-3 text-amber-400" />
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-400">
                        {stats?.totalGames || 0} partie{(stats?.totalGames || 0) > 1 ? 's' : ''} • {stats?.totalWins || 0} victoires
                      </span>
                    </div>
                  </div>
                </div>

                {/* Mini Stats Bar */}
                <div className="grid grid-cols-3 gap-2 my-3 p-2 rounded-xl bg-slate-950/60 border border-slate-800/80 text-center text-xs">
                  <div>
                    <div className="font-bold text-white">
                      {stats?.totalGames ? Math.round((stats.totalWins / stats.totalGames) * 100) : 0}%
                    </div>
                    <div className="text-[10px] text-slate-500">Victoires</div>
                  </div>
                  <div>
                    <div className="font-bold text-white">{stats?.x01BestAverage || 0}</div>
                    <div className="text-[10px] text-slate-500">Moy. 501</div>
                  </div>
                  <div>
                    <div className="font-bold text-white">{stats?.cricketBestMPR || 0}</div>
                    <div className="text-[10px] text-slate-500">MPR</div>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => handleSetOwnerClick(player)}
                  className={`text-[11px] font-bold flex items-center gap-1 transition-colors ${
                    isOwner ? 'text-emerald-400 hover:text-emerald-300' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <Smartphone className="w-3 h-3" />
                  <span>{isOwner ? 'Connecté (Moi)' : 'Définir comme Moi'}</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(player)}
                    className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors"
                    title="Modifier"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(player.id, player.name)}
                    className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-rose-400 transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Player Modal */}
      <PlayerFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        initialPlayer={editingPlayer}
      />

      {/* PIN Prompt Modal */}
      {pinPromptPlayer && (
        <Modal
          isOpen={true}
          onClose={() => setPinPromptPlayer(null)}
          title="Code PIN Requis"
          maxWidth="max-w-xs"
        >
          <form onSubmit={handlePinSubmit} className="space-y-4 text-center py-2">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <Lock className="w-6 h-6" />
            </div>

            <div>
              <h4 className="font-bold text-sm text-white">Connexion à {pinPromptPlayer.name}</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Entrez le code PIN pour définir ce profil comme votre compte principal.
              </p>
            </div>

            <input
              type="password"
              autoFocus
              maxLength={6}
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              placeholder="Code PIN..."
              className="w-full text-center tracking-widest text-lg font-black px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono focus:outline-none focus:border-amber-500"
            />

            {pinError && <p className="text-xs text-rose-400 font-bold">{pinError}</p>}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPinPromptPlayer(null)}
                className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="flex-1 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-lg glow-amber"
              >
                Valider
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Merge Guest Stats Modal */}
      {isMergeModalOpen && (
        <Modal
          isOpen={isMergeModalOpen}
          onClose={() => setIsMergeModalOpen(false)}
          title="Lier & Fusionner un Compte Invité"
          maxWidth="max-w-md"
        >
          <form onSubmit={handleMergeSubmit} className="space-y-4">
            <p className="text-xs text-slate-400 leading-relaxed">
              Transférez tout l'historique et les statistiques d'un profil <strong>Invité</strong> vers le compte permanent de votre ami.
            </p>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                1. Profil Invité Source
              </label>
              <select
                required
                value={selectedGuestId}
                onChange={(e) => setSelectedGuestId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold text-xs"
              >
                <option value="">Sélectionnez le profil invité...</option>
                {guestPlayers.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} ({playerStats[g.id]?.totalGames || 0} parties)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                2. Compte Destinataire
              </label>
              <select
                required
                value={selectedTargetPlayerId}
                onChange={(e) => setSelectedTargetPlayerId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold text-xs"
              >
                <option value="">Sélectionnez le compte permanent...</option>
                {regularPlayers.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsMergeModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={!selectedGuestId || !selectedTargetPlayerId}
                className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-lg glow-amber transition-all disabled:opacity-40"
              >
                Fusionner les Stats
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
