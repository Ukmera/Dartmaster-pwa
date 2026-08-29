// Voice Caller service using Web Speech API with High Quality Voice selection

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

// Get all available system voices for current language
export function getAvailableVoices(langPrefix: string = 'fr'): SpeechSynthesisVoice[] {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return [];
  const voices = window.speechSynthesis.getVoices();
  return voices.filter((v) => v.lang.toLowerCase().startsWith(langPrefix.toLowerCase()));
}

// Announce turn score with energetic referee modulation
export function announceTurnScore(
  score: number,
  isBust: boolean = false,
  settings: VoiceSettings = loadVoiceSettings()
): void {
  if (!settings.enabled || typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return;
  }

  window.speechSynthesis.cancel();

  let textToSpeak = '';

  if (isBust) {
    textToSpeak = settings.language === 'en-GB' ? 'Bust !' : 'Bust !';
  } else if (score === 180) {
    textToSpeak = settings.language === 'en-GB' ? 'ONE HUNDRED AND EIGHTY !' : 'CENT QUATRE-VINGTS !';
  } else if (score === 0) {
    textToSpeak = settings.language === 'en-GB' ? 'No score' : 'Zéro point';
  } else {
    textToSpeak = String(score);
  }

  const utterance = new SpeechSynthesisUtterance(textToSpeak);
  utterance.lang = settings.language;
  utterance.volume = settings.volume;
  utterance.rate = score === 180 ? 0.95 : settings.rate;
  utterance.pitch = score === 180 ? 1.25 : settings.pitch;

  const voices = window.speechSynthesis.getVoices();
  
  if (settings.voiceURI) {
    const selectedVoice = voices.find((v) => v.voiceURI === settings.voiceURI);
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
  } else {
    // Pick the best natural/neural/Google voice automatically
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
