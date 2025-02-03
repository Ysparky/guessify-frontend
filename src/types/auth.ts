export interface Player {
  id: string;
  spotifyId: string;
  displayName: string;
  avatarUrl: string;
  accessToken: string;
  tokenExpiresAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface SpotifyPlayer {
  device_id: string;
  volume: number;
  paused: boolean;
  position: number;
  duration: number;
  track_window: {
    current_track: {
      id: string;
      uri: string;
      name: string;
      artists: Array<{ name: string }>;
    };
  };
}
