// Voice Caller service using Web Speech API with High Quality Voice selection & Contextual Taunts

export interface VoiceSettings {
  enabled: boolean;
  language: 'fr-FR' | 'en-GB';
  voiceURI: string | null;
  volume: number; // 0 to 1
  rate: number;   // 0.8 to 1.3
  pitch: number;  // 0.8 to 1.3
}

const DEFAULT_SETTINGS: VoiceSettings = {
  enabled: true,
  language: 'fr-FR',
  voiceURI: null,
  volume: 1,
  rate: 1.05,
  pitch: 1.0
};

const VOICE_SETTINGS_KEY = 'dartmaster_voice_settings';

export function loadVoiceSettings(): VoiceSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(VOICE_SETTINGS_KEY);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveVoiceSettings(settings: VoiceSettings): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(VOICE_SETTINGS_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error('Error saving voice settings', err);
  }
}

export function getAvailableVoices(langPrefix: string = 'fr'): SpeechSynthesisVoice[] {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return [];
  const voices = window.speechSynthesis.getVoices();
  return voices.filter((v) => v.lang.toLowerCase().startsWith(langPrefix.toLowerCase()));
}

/**
 * Announce turn score with energetic referee voice & smart finish-line awareness.
 * 
 * Rules:
 * 1. isWin: NEVER taunt! Announce "Game shot / Victoire !"
 * 2. remainingScoreBeforeTurn <= 65: In checkout/setup range -> NEVER taunt "Gros nul" (small scores are normal strategy).
 * 3. remainingScoreBeforeTurn > 65: Far from checkout -> score < 10 or Bust gets the humorous taunt.
 */
export function announceTurnScore(
  score: number,
  isBust: boolean = false,
  isWin: boolean = false,
  remainingScoreBeforeTurn: number = 501,
  settings: VoiceSettings = loadVoiceSettings()
): void {
  if (!settings.enabled || typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return;
  }

  window.speechSynthesis.cancel();

  let textToSpeak = '';
  const isCloseToFinish = remainingScoreBeforeTurn <= 65;

  if (isWin) {
    textToSpeak = settings.language === 'en-GB'
      ? `Game shot ! ${score} !`
      : `Manche gagnée ! ${score} !`;
  } else if (isBust) {
    if (isCloseToFinish) {
      textToSpeak = settings.language === 'en-GB' ? 'Bust !' : 'Bust !';
    } else {
      textToSpeak = settings.language === 'en-GB' ? 'Bust ! Poor throw !' : 'Bust ! ... Gros nul !';
    }
  } else if (score === 180) {
    textToSpeak = settings.language === 'en-GB' ? 'ONE HUNDRED AND EIGHTY !' : 'CENT QUATRE-VINGTS !';
  } else if (score === 0) {
    if (isCloseToFinish) {
      textToSpeak = settings.language === 'en-GB' ? 'Zero.' : 'Zéro point.';
    } else {
      textToSpeak = settings.language === 'en-GB' ? 'Zero... Poor throw !' : 'Zéro point... Gros nul !';
    }
  } else if (score < 10) {
    if (isCloseToFinish) {
      // In checkout finish zone, hitting 1, 2, 4 etc. to setup double is normal
      textToSpeak = String(score);
    } else {
      textToSpeak = settings.language === 'en-GB' ? `${score}... Poor throw !` : `${score}... Gros nul !`;
    }
  } else {
    textToSpeak = String(score);
  }

  const utterance = new SpeechSynthesisUtterance(textToSpeak);
  utterance.lang = settings.language;
  utterance.volume = settings.volume;
  utterance.rate = score === 180 || isWin ? 0.95 : settings.rate;
  utterance.pitch = score === 180 || isWin ? 1.25 : score < 10 && !isCloseToFinish ? 0.9 : settings.pitch;

  const voices = window.speechSynthesis.getVoices();
  
  if (settings.voiceURI) {
    const selectedVoice = voices.find((v) => v.voiceURI === settings.voiceURI);
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
  } else {
    const langCode = settings.language.split('-')[0];
    const matchingVoices = voices.filter((v) => v.lang.toLowerCase().startsWith(langCode));
    const premiumVoice = matchingVoices.find(
      (v) =>
        v.name.includes('Natural') ||
        v.name.includes('Neural') ||
        v.name.includes('Google') ||
        v.name.includes('Premium')
    );
    if (premiumVoice) {
      utterance.voice = premiumVoice;
    } else if (matchingVoices.length > 0) {
      utterance.voice = matchingVoices[0];
    }
  }

  window.speechSynthesis.speak(utterance);
}
