declare namespace Spotify {
  interface Player {
    connect(): Promise<boolean>;
    disconnect(): void;
    addListener(
      eventName: "ready",
      callback: (state: { device_id: string }) => void
    ): void;
    addListener(
      eventName: "not_ready",
      callback: (state: { device_id: string }) => void
    ): void;
    addListener(
      eventName: "player_state_changed",
      callback: (state: any) => void
    ): void;
    addListener(
      eventName: "initialization_error",
      callback: (message: { message: string }) => void
    ): void;
    addListener(
      eventName: "authentication_error",
      callback: (message: { message: string }) => void
    ): void;
    addListener(
      eventName: "account_error",
      callback: (message: { message: string }) => void
    ): void;
    addListener(
      eventName: "playback_error",
      callback: (message: { message: string }) => void
    ): void;
    removeListener(eventName: string, callback?: () => void): void;
    getCurrentState(): Promise<any>;
    setName(name: string): Promise<void>;
    getVolume(): Promise<number>;
    setVolume(volume: number): Promise<void>;
    pause(): Promise<void>;
    resume(): Promise<void>;
    togglePlay(): Promise<void>;
    seek(position_ms: number): Promise<void>;
    previousTrack(): Promise<void>;
    nextTrack(): Promise<void>;
  }

  interface PlayerInit {
    name: string;
    getOAuthToken(callback: (token: string) => void): void;
    volume?: number;
  }

  interface WebPlaybackSDK {
    Player: {
      new (options: PlayerInit): Player;
    };
  }
}

interface Window {
  Spotify: Spotify.WebPlaybackSDK;
  onSpotifyWebPlaybackSDKReady: () => void;
}
