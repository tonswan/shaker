
export enum GameMode {
  ONE_MIN = '1m',
  THREE_MIN = '3m',
  FIVE_MIN = '5m',
  SEVEN_MIN = '7m',
  INFINITE = '∞'
}

export interface ScoreEntry {
  username: string;
  score: number;
  mode: GameMode;
  date: number;
}

export interface GameState {
  currentMode: GameMode | null;
  score: number;
  timeLeft: number;
  isActive: boolean;
  fillLevel: number; // 0 to 100
}
