
export interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
}

export interface Profile {
  id: string;
  linkedin: string;
  github: string;
  image_url?: string;
  resume_url: string;
  resume_text: string;
  updated_at?: string;
}

export interface UploadResponse {
  success: boolean;
  message?: string;
  resume_text?: string;
  resume_url?: string;
}

export type Theme = 'cosmic' | 'cyber' | 'matrix';

export interface ChatSession {
  id: string;
  title: string;
  date: number;
  messages: Message[];
}

// Mock PDF.js types since we are using CDN
declare global {
  const pdfjsLib: {
    getDocument: (src: string | Uint8Array) => {
      promise: Promise<{
        numPages: number;
        getPage: (num: number) => Promise<{
          getTextContent: () => Promise<{
            items: { str: string }[];
          }>;
        }>;
      }>;
    };
    GlobalWorkerOptions: {
      workerSrc: string;
    };
  };
  
  interface Window {
    webkitSpeechRecognition: any;
  }
}
