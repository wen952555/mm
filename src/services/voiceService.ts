/**
 * Unified Teahouse Voice & Speech Synthesis Service
 * Handles TTS speech bubbles, phrase audition, and voice broadcast playback.
 */

export interface SpeechPhraseOption {
  text: string;
  sender?: string;
  roleId?: string;
  roleName?: string;
  pitch?: number;
  rate?: number;
  isFemale?: boolean;
}

class VoiceService {
  private activeUtterance: SpeechSynthesisUtterance | null = null;

  public speakPhrase(options: SpeechPhraseOption): Promise<void> {
    return new Promise((resolve) => {
      if (!('speechSynthesis' in window)) {
        resolve();
        return;
      }

      try {
        window.speechSynthesis.cancel();
      } catch {}

      const text = options.text;
      if (!text || text.trim() === '') {
        resolve();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'zh-CN';
      utterance.pitch = options.pitch ?? (options.isFemale ? 1.2 : 0.95);
      utterance.rate = options.rate ?? 1.05;

      // Select natural Chinese voice if available
      const voices = window.speechSynthesis.getVoices();
      if (voices && voices.length > 0) {
        const zhVoices = voices.filter((v) => v.lang.includes('zh') || v.lang.includes('CN'));
        if (zhVoices.length > 0) {
          const selected = options.isFemale
            ? zhVoices.find((v) => v.name.includes('Female') || v.name.includes('Xiaoxiao') || v.name.includes('Tingting')) || zhVoices[0]
            : zhVoices.find((v) => v.name.includes('Male') || v.name.includes('Yunxi') || v.name.includes('Kangkang')) || zhVoices[zhVoices.length - 1];
          utterance.voice = selected;
        }
      }

      utterance.onend = () => {
        this.activeUtterance = null;
        resolve();
      };

      utterance.onerror = () => {
        this.activeUtterance = null;
        resolve();
      };

      this.activeUtterance = utterance;
      try {
        window.speechSynthesis.speak(utterance);
      } catch {
        resolve();
      }
    });
  }

  public stop(): void {
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }
    this.activeUtterance = null;
  }
}

export const voiceService = new VoiceService();
