
export type PackType = 'CONNECT' | 'PROCESS' | 'INSIGHT' | 'NONE';

export interface AuditData {
  sector: string;
  size: string;
  pains: string[];
  recommendation: string;
  potentialROI: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  isAudio?: boolean;
  attachments?: string[];
  isHistory?: boolean;
}

export type DouliaVoice = 'Kore' | 'Puck' | 'Charon' | 'Fenrir' | 'Zephyr';

export interface UserContext {
  name?: string;
  company?: string;
  sector?: string;
  language: 'FR' | 'EN';
  preferredVoice: DouliaVoice;
}
