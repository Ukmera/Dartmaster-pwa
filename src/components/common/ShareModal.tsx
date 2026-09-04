import React, { useState } from 'react';
import { Share2, Copy, Check, QrCode, Smartphone } from 'lucide-react';
import { Modal } from './Modal';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState<boolean>(false);

  const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://dartmaster-pwa.vercel.app';
  const shareTitle = 'DartMaster PRO 🎯';
  const shareText = 'Rejoins-moi sur DartMaster PRO, le compteur de fléchettes en ligne avec 501, Cricket, King et Voice Caller !';

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: appUrl
        });
      } catch (err) {
        console.log('Share canceled or not supported:', err);
      }
    } else {
      handleCopyLink();
    }
  };

  const handleCopyLink = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(appUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // QR Code URL via high-speed CDN API
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(appUrl)}&bgcolor=090d18&color=10b981&margin=10`;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Partager DartMaster PRO" maxWidth="max-w-sm">
      <div className="space-y-4 text-center py-2">
        {/* Visual Header */}
        <div className="flex flex-col items-center justify-center space-y-1">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-amber-400 p-0.5 shadow-xl glow-emerald flex items-center justify-center">
            <span className="text-2xl">🎯</span>
          </div>
          <h3 className="font-black text-base text-white mt-1">Inviter des Joueurs</h3>
          <p className="text-xs text-slate-400">
            Faites scanner le QR code ou partagez le lien pour jouer à plusieurs en direct !
          </p>
        </div>

        {/* QR Code Container */}
        <div className="p-4 rounded-3xl bg-slate-950/80 border border-slate-800 flex flex-col items-center justify-center shadow-inner relative group">
          <div className="p-2 rounded-2xl bg-slate-900 border border-emerald-500/30 shadow-lg">
            <img
              src={qrCodeUrl}
              alt="QR Code DartMaster"
              className="w-44 h-44 rounded-xl object-contain"
            />
          </div>
          <span className="text-[10px] text-slate-400 font-semibold mt-2 flex items-center gap-1">
            <QrCode className="w-3 h-3 text-emerald-400" />
            <span>Pointez l'appareil photo du téléphone pour ouvrir</span>
          </span>
        </div>

        {/* Share Action Buttons */}
        <div className="space-y-2">
          {/* Native OS Share (iOS AirDrop / Android Share Sheet) */}
          <button
            type="button"
            onClick={handleNativeShare}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black text-xs shadow-lg glow-emerald flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <Share2 className="w-4 h-4" />
            <span>Partager via WhatsApp / SMS / AirDrop</span>
          </button>

          {/* Copy Link Button */}
          <button
            type="button"
            onClick={handleCopyLink}
            className="w-full py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400">Lien copié dans le presse-papier !</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-slate-400" />
                <span>Copier le lien direct</span>
              </>
            )}
          </button>
        </div>

        {/* PWA / Install Tip */}
        <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-500/20 text-[10px] text-slate-400 flex items-center gap-1.5 text-left">
          <Smartphone className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            Une fois ouvert sur le smartphone, cliquez sur <strong>« Ajouter à l'écran d'accueil »</strong> pour l'utiliser en plein écran !
          </span>
        </div>
      </div>
    </Modal>
  );
};
