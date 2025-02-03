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

export interface SpotifyDevice {
  id: string;
  name: string;
  type: string;
  is_active: boolean;
  volume_percent: number;
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

export interface SpotifyError {
  message: string;
}

export interface SpotifyDeviceEvent {
  device_id: string;
}

export interface SpotifyPlayerState {
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
