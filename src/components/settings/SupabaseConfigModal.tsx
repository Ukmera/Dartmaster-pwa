import React, { useState } from 'react';
import { Database, ShieldCheck, Copy, Check, RefreshCw, AlertCircle } from 'lucide-react';
import { Modal } from '../common/Modal';
import { getSupabaseConfig, saveSupabaseConfig, clearSupabaseConfig, getSupabaseClient } from '../../lib/supabase';
import { SUPABASE_SQL_SCHEMA } from '../../lib/supabaseSchema';
import { usePlayers } from '../../context/PlayerContext';

interface SupabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseConfigModal: React.FC<SupabaseConfigModalProps> = ({ isOpen, onClose }) => {
  const { refreshPlayers, isSupabaseConnected } = usePlayers();
  const config = getSupabaseConfig();

  const [url, setUrl] = useState<string>(config?.url || '');
  const [anonKey, setAnonKey] = useState<string>(config?.anonKey || '');
  const [copied, setCopied] = useState<boolean>(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || !anonKey.trim()) {
      clearSupabaseConfig();
      await refreshPlayers();
      setStatusMessage('Configuration réinitialisée en mode local.');
      setTestStatus('idle');
      return;
    }

    setTestStatus('testing');
    setStatusMessage('Test de connexion en cours...');

    saveSupabaseConfig(url, anonKey);
    const client = getSupabaseClient();

    if (!client) {
      setTestStatus('error');
      setStatusMessage('URL Supabase ou clé invalide.');
      return;
    }

    try {
      const { error } = await client.from('players').select('count', { count: 'exact', head: true });
      if (error) {
        setTestStatus('error');
        setStatusMessage(`Erreur Supabase : ${error.message}. Avez-vous exécuté le script SQL ci-dessous ?`);
      } else {
        setTestStatus('success');
        setStatusMessage('Connexion réussie avec Supabase ! Synchronisation active.');
        await refreshPlayers();
      }
    } catch (err: any) {
      setTestStatus('error');
      setStatusMessage(`Exception de connexion : ${err?.message || 'Vérifiez vos paramètres'}`);
    }
  };

  const handleDisconnect = async () => {
    clearSupabaseConfig();
    setUrl('');
    setAnonKey('');
    setTestStatus('idle');
    setStatusMessage('');
    await refreshPlayers();
  };

  const handleCopySchema = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Synchronisation Cloud & Supabase" maxWidth="max-w-xl">
      <div className="space-y-5">
        {/* Status Alert */}
        <div
          className={`p-3.5 rounded-2xl border flex items-center gap-3 ${
            isSupabaseConnected
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
              : 'bg-slate-950/60 border-slate-800 text-slate-300'
          }`}
        >
          {isSupabaseConnected ? (
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <Database className="w-5 h-5 text-slate-400 shrink-0" />
          )}
          <div className="text-xs">
            <div className="font-bold text-white">
              {isSupabaseConnected ? 'Cloud Supabase Connecté' : 'Mode Hors-Ligne Actif'}
            </div>
            <div className="text-slate-400 text-[11px] mt-0.5">
              {isSupabaseConnected
                ? 'Vos joueurs, statistiques et historiques sont synchronisés en temps réel.'
                : 'Toutes les données sont stockées localement dans votre navigateur sans connexion requise.'}
            </div>
          </div>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleSave} className="space-y-3.5">
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Supabase Project URL
            </label>
            <input
              type="text"
              placeholder="https://xyzcompany.supabase.co"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Supabase Anon Public API Key
            </label>
            <input
              type="password"
              placeholder="eyJhbGciOi..."
              value={anonKey}
              onChange={(e) => setAnonKey(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Feedback message */}
          {statusMessage && (
            <div
              className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                testStatus === 'success'
                  ? 'bg-emerald-950/50 text-emerald-300 border border-emerald-500/30'
                  : testStatus === 'error'
                  ? 'bg-rose-950/50 text-rose-300 border border-rose-500/30'
                  : 'bg-slate-800 text-slate-300'
              }`}
            >
              {testStatus === 'error' && <AlertCircle className="w-4 h-4 shrink-0" />}
              {testStatus === 'success' && <Check className="w-4 h-4 shrink-0" />}
              <span>{statusMessage}</span>
            </div>
          )}

          <div className="flex gap-2 pt-1">
            {isSupabaseConnected && (
              <button
                type="button"
                onClick={handleDisconnect}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-300 text-xs font-bold transition-colors border border-slate-700"
              >
                Déconnecter
              </button>
            )}

            <button
              type="submit"
              disabled={testStatus === 'testing'}
              className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg glow-emerald transition-all flex items-center justify-center gap-2"
            >
              {testStatus === 'testing' ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Vérification...</span>
                </>
              ) : (
                <span>Enregistrer & Synchroniser</span>
              )}
            </button>
          </div>
        </form>

        {/* SQL Setup Instructions & Copy Box */}
        <div className="pt-3 border-t border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Script SQL d'initialisation (Tables & RLS)
            </span>
            <button
              onClick={handleCopySchema}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold text-xs transition-colors border border-slate-700"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copié !' : 'Copier le SQL'}</span>
            </button>
          </div>

          <p className="text-[11px] text-slate-400">
            Copiez ce script et collez-le dans le <strong>SQL Editor</strong> de votre projet Supabase pour créer automatiquement les tables <code>players</code>, <code>player_stats</code>, et <code>matches</code>.
          </p>

          <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[10px] text-slate-300 font-mono overflow-x-auto max-h-36">
            {SUPABASE_SQL_SCHEMA}
          </pre>
        </div>
      </div>
    </Modal>
  );
};
