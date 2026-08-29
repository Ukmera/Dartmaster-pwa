import React from 'react';
import { Sparkles } from 'lucide-react';
import { getCheckoutSuggestion } from '../../lib/checkouts';

interface CheckoutGuideProps {
  remainingScore: number;
}

export const CheckoutGuide: React.FC<CheckoutGuideProps> = ({ remainingScore }) => {
  const suggestions = getCheckoutSuggestion(remainingScore);

  if (!suggestions || suggestions.length === 0) return null;

  return (
    <div className="w-full flex items-center justify-between px-3.5 py-2 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 animate-fadeIn">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Checkout :</span>
      </div>
      <div className="flex items-center gap-1.5 font-black text-sm">
        {suggestions.map((step, idx) => (
          <React.Fragment key={idx}>
            <span className="px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-200 border border-emerald-500/40">
              {step}
            </span>
            {idx < suggestions.length - 1 && <span className="text-slate-400 text-xs">→</span>}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
