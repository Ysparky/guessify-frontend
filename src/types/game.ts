export enum GameStatus {
  WAITING = "WAITING",
  IN_PROGRESS = "IN_PROGRESS",
  FINISHED = "FINISHED",
}

export enum GameMode {
  MULTIPLE_CHOICE = "MULTIPLE_CHOICE",
  LETTER_REVEAL = "LETTER_REVEAL",
}

export interface PlayerInfo {
  id: string;
  displayName: string;
  avatarUrl: string;
}

export interface Game {
  id: string;
  roomCode: string;
  hostId: string;
  playerIds: string[];
  players: PlayerInfo[];
  gameMode: GameMode;
  status: GameStatus;
  currentRoundNumber: number;
  totalRounds: number;
  createdAt: string;
  updatedAt: string;
}

export interface RoundData {
  songId: string;
  songUri: string;
  options: string[];
  duration: number;
  startTime: Date;
  endTime: Date;
}

export interface AnswerResult {
  playerId: string;
  answer: string;
  correct: boolean;
  score: number;
}

export interface SpotifyImage {
  url: string;
  height: number;
  width: number;
}

export interface SpotifyPlaylist {
  id: string;
  name: string;
  description: string;
  images: SpotifyImage[];
  tracks: {
    total: number;
  };
}

export interface SpotifyArtist {
  id: string;
  name: string;
  images: SpotifyImage[];
  popularity: number;
  genres: string[];
}

export interface SpotifyTrack {
  id: string;
  name: string;
  uri: string;
  artist: string;
  duration_ms: number;
}
