import React, { useState, useEffect } from 'react';
import { Volume2, Mic, Smartphone, Check, Sparkles } from 'lucide-react';
import { Modal } from '../common/Modal';
import { loadVoiceSettings, saveVoiceSettings, announceTurnScore, getAvailableVoices } from '../../utils/voiceCaller';
import type { VoiceSettings } from '../../utils/voiceCaller';
import { useSound } from '../../context/SoundContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSupabase?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose
}) => {
  const sound = useSound();
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>(() => loadVoiceSettings());
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  useEffect(() => {
    const updateVoices = () => {
      const langPrefix = voiceSettings.language.split('-')[0];
      const voices = getAvailableVoices(langPrefix);
      setAvailableVoices(voices);
    };

    updateVoices();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, [voiceSettings.language]);

  const handleVoiceChange = (key: keyof VoiceSettings, value: any) => {
    const updated = { ...voiceSettings, [key]: value };
    setVoiceSettings(updated);
    saveVoiceSettings(updated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 1500);
  };

  const testVoice = () => {
    announceTurnScore(180, false, voiceSettings);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Réglages & Préférences" maxWidth="max-w-md">
      <div className="space-y-4 py-1">
        {/* Voice Caller Section */}
        <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mic className="w-4 h-4 text-emerald-400" />
              <div>
                <div className="text-xs font-bold text-white">Annonceur Vocal (Voice Caller HD)</div>
                <div className="text-[10px] text-slate-400">Annonce le score réalisé à chaque volée</div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={voiceSettings.enabled}
              onChange={(e) => handleVoiceChange('enabled', e.target.checked)}
              className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
            />
          </div>

          {voiceSettings.enabled && (
            <div className="space-y-3 pt-2 border-t border-slate-800/80">
              {/* Language Selection */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-300 font-semibold">Langue / Style :</span>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleVoiceChange('language', 'fr-FR')}
                    className={`px-3 py-1 rounded-xl text-xs font-bold border transition-all ${
                      voiceSettings.language === 'fr-FR'
                        ? 'bg-emerald-600 border-emerald-400 text-white'
                        : 'bg-slate-900 border-slate-700 text-slate-400'
                    }`}
                  >
                    🇫🇷 Français
                  </button>
                  <button
                    type="button"
                    onClick={() => handleVoiceChange('language', 'en-GB')}
                    className={`px-3 py-1 rounded-xl text-xs font-bold border transition-all ${
                      voiceSettings.language === 'en-GB'
                        ? 'bg-emerald-600 border-emerald-400 text-white'
                        : 'bg-slate-900 border-slate-700 text-slate-400'
                    }`}
                  >
                    🇬🇧 PDC Referee
                  </button>
                </div>
              </div>

              {/* Voice Selector if multiple voices found */}
              {availableVoices.length > 0 && (
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-400 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span>Choisir une voix installée :</span>
                  </label>
                  <select
                    value={voiceSettings.voiceURI || ''}
                    onChange={(e) => handleVoiceChange('voiceURI', e.target.value || null)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold text-xs"
                  >
                    <option value="">Voix Automatique Optimisée (Recommandé)</option>
                    {availableVoices.map((v) => (
                      <option key={v.voiceURI} value={v.voiceURI}>
                        {v.name} {v.name.includes('Natural') || v.name.includes('Neural') || v.name.includes('Google') ? '✨ (HD)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Test Button */}
              <button
                type="button"
                onClick={testVoice}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-xs font-bold text-amber-300 flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95"
              >
                <Volume2 className="w-4 h-4 text-amber-400" />
                <span>Tester la voix (« 180 ! »)</span>
              </button>
            </div>
          )}
        </div>

        {/* Audio Effects & Haptics */}
        <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-emerald-400" />
              <div>
                <div className="text-xs font-bold text-white">Effets Sonores & Bruitages</div>
                <div className="text-[10px] text-slate-400">Synthétiseur de sons d'impact et fanfares</div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={sound.soundEnabled}
              onChange={sound.toggleSound}
              className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-emerald-400" />
              <div>
                <div className="text-xs font-bold text-white">Vibrations Haptiques</div>
                <div className="text-[10px] text-slate-400">Retour tactile sur mobile</div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={sound.hapticsEnabled}
              onChange={sound.toggleHaptics}
              className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
            />
          </div>
        </div>

        {savedSuccess && (
          <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-400 py-1 animate-fadeIn">
            <Check className="w-4 h-4" />
            <span>Réglages enregistrés avec succès !</span>
          </div>
        )}
      </div>
    </Modal>
  );
};
