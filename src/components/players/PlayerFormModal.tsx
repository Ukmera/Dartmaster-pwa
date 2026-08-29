import React, { useState, useEffect, useRef } from 'react';
import { Camera, Image as ImageIcon, Sparkles, UserCheck, Lock } from 'lucide-react';
import { Modal } from '../common/Modal';
import type { Player, AvatarType } from '../../types/player';

interface PlayerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, avatar: string, color: string, avatarType?: AvatarType, isGuest?: boolean, pinCode?: string) => Promise<void>;
  initialPlayer?: Player | null;
}

const PUB_BADGES = [
  { id: 'darts', label: '🎯 Cible Pro', icon: '🎯' },
  { id: 'guinness', label: '🍺 Pinte Pub', icon: '🍺' },
  { id: 'beer', label: '🍻 Choppes', icon: '🍻' },
  { id: 'gold_dart', label: '🪶 Flèche d\'Or', icon: '🪶' },
  { id: 'crown', label: '👑 King', icon: '👑' },
  { id: 'bullseye', label: '🔴 Bullseye', icon: '🔴' },
  { id: 'lightning', label: '⚡ Éclair', icon: '⚡' },
  { id: 'fire', label: '🔥 En Feu', icon: '🔥' },
  { id: 'skull', label: '💀 Killer', icon: '💀' },
  { id: 'trophy', label: '🏆 Champion', icon: '🏆' }
];

const SIGNATURE_COLORS = [
  '#10b981', '#06b6d4', '#3b82f6', '#8b5cf6',
  '#ec4899', '#f43f5e', '#f59e0b', '#84cc16'
];

export const PlayerFormModal: React.FC<PlayerFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialPlayer
}) => {
  const [name, setName] = useState<string>('');
  const [avatar, setAvatar] = useState<string>('🎯');
  const [avatarType, setAvatarType] = useState<AvatarType>('emoji');
  const [color, setColor] = useState<string>('#10b981');
  const [isGuest, setIsGuest] = useState<boolean>(false);
  const [pinCode, setPinCode] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'badges' | 'photo'>('badges');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync form inputs when initialPlayer or modal opening changes
  useEffect(() => {
    if (initialPlayer) {
      setName(initialPlayer.name || '');
      setAvatar(initialPlayer.avatar || '🎯');
      setAvatarType(initialPlayer.avatarType || 'emoji');
      setColor(initialPlayer.color || '#10b981');
      setIsGuest(initialPlayer.isGuest || false);
      setPinCode(initialPlayer.pinCode || '');
      setActiveTab(initialPlayer.avatarType === 'image' ? 'photo' : 'badges');
    } else {
      setName('');
      setAvatar('🎯');
      setAvatarType('emoji');
      setColor('#10b981');
      setIsGuest(false);
      setPinCode('');
      setActiveTab('badges');
    }
  }, [initialPlayer, isOpen]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 160;
          let width = img.width;
          let height = img.height;
          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.85);
          setAvatar(compressed);
          setAvatarType('image');
        };
        img.src = result;
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await onSubmit(name.trim(), avatar, color, avatarType, isGuest, pinCode);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialPlayer ? 'Modifier le Joueur' : 'Nouveau Joueur'}
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Avatar Preview */}
        <div className="flex flex-col items-center justify-center gap-2 py-2">
          <div
            className="w-20 h-20 rounded-3xl p-1 border-2 shadow-xl flex items-center justify-center relative overflow-hidden transition-all"
            style={{ borderColor: color, backgroundColor: `${color}15` }}
          >
            {avatarType === 'image' && avatar.startsWith('data:') ? (
              <img src={avatar} alt="Avatar" className="w-full h-full object-cover rounded-2xl" />
            ) : (
              <span className="text-4xl select-none">{avatar}</span>
            )}
          </div>
          <span className="text-xs text-slate-400 font-semibold">Aperçu du profil</span>
        </div>

        {/* Name Input */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
            Pseudo ou Prénom
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Robin, Max, Alex..."
            className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Avatar Selector Tabs */}
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
            Choisir un Avatar
          </label>

          <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800 text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab('badges')}
              className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1 transition-all ${
                activeTab === 'badges' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400'
              }`}
            >
              <Sparkles className="w-3 h-3" />
              <span>Pub & Darts</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('photo')}
              className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1 transition-all ${
                activeTab === 'photo' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400'
              }`}
            >
              <Camera className="w-3 h-3" />
              <span>Photo / Fichier</span>
            </button>
          </div>

          {activeTab === 'badges' && (
            <div className="grid grid-cols-5 gap-2 pt-1">
              {PUB_BADGES.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => {
                    setAvatar(b.icon);
                    setAvatarType('badge');
                  }}
                  className={`h-11 rounded-xl border flex items-center justify-center text-xl transition-all ${
                    avatar === b.icon
                      ? 'bg-emerald-600/30 border-emerald-500 shadow-md scale-105'
                      : 'bg-slate-900 border-slate-800 hover:bg-slate-800'
                  }`}
                  title={b.label}
                >
                  {b.icon}
                </button>
              ))}
            </div>
          )}

          {activeTab === 'photo' && (
            <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 text-center space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <ImageIcon className="w-4 h-4 text-emerald-400" />
                <span>Prendre une photo ou importer</span>
              </button>
              <p className="text-[10px] text-slate-500">
                La photo est automatiquement recadrée et optimisée.
              </p>
            </div>
          )}
        </div>

        {/* Color Palette */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
            Couleur Signature
          </label>
          <div className="flex items-center justify-between gap-1.5">
            {SIGNATURE_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`w-8 h-8 rounded-full transition-all ${
                  color === c ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-slate-900' : 'opacity-70 hover:opacity-100'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        {/* PIN Protection & Guest Toggle */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
          {/* PIN Input */}
          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-white">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>Code PIN (Optionnel)</span>
            </div>
            <input
              type="password"
              maxLength={6}
              placeholder="Ex: 1234"
              value={pinCode}
              onChange={(e) => setPinCode(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Guest Toggle */}
          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-slate-400" />
              <div>
                <div className="text-xs font-bold text-white">Profil Invité</div>
                <div className="text-[10px] text-slate-400">Temporaire</div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={isGuest}
              onChange={(e) => setIsGuest(e.target.checked)}
              className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
            />
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg glow-emerald transition-all active:scale-95"
          >
            {initialPlayer ? 'Enregistrer' : 'Créer le Joueur'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
