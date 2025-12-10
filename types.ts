export interface Message {
  role: 'user' | 'model';
  text: string;
  isError?: boolean;
}

export enum Tab {
  CHAT = 'chat',
  EDITOR = 'editor'
}

export interface RunResult {
  output: string;
  error?: boolean;
}