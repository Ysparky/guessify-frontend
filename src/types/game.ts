export enum GameStatus {
  WAITING = "WAITING",
  IN_PROGRESS = "IN_PROGRESS",
  FINISHED = "FINISHED",
}

export enum GameMode {
  MULTIPLE_CHOICE = "MULTIPLE_CHOICE",
  LETTER_REVEAL = "LETTER_REVEAL",
}

export interface Game {
  id: string;
  roomCode: string;
  hostId: string;
  playerIds: string[];
  gameMode: GameMode;
  status: GameStatus;
  currentRoundNumber: number;
  totalRounds: number;
  createdAt: string;
  updatedAt: string;
}

export interface RoundData {
  songPreviewUrl: string;
  options: string[];
  duration: number;
  revealedLetters?: string;
}

export interface AnswerResult {
  playerId: string;
  answer: string;
  correct: boolean;
  score: number;
}
