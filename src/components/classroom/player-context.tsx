"use client";

import * as React from "react";

export type PlayerHandle = {
  getCurrentTime: () => number;
  seekTo: (seconds: number) => void;
  pause: () => void;
  play: () => void;
};

type Ctx = {
  /** true si el reproductor expone el tiempo (YouTube / archivo de video) */
  syncable: boolean;
  currentTime: number;
  setCurrentTime: (t: number) => void;
  register: (h: PlayerHandle | null) => void;
  handle: React.MutableRefObject<PlayerHandle | null>;
};

const PlayerContext = React.createContext<Ctx | null>(null);

export function PlayerProvider({ syncable, children }: { syncable: boolean; children: React.ReactNode }) {
  const [currentTime, setCurrentTime] = React.useState(0);
  const handle = React.useRef<PlayerHandle | null>(null);
  const register = React.useCallback((h: PlayerHandle | null) => {
    handle.current = h;
  }, []);
  const value = React.useMemo(
    () => ({ syncable, currentTime, setCurrentTime, register, handle }),
    [syncable, currentTime, register]
  );
  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export function usePlayer() {
  const ctx = React.useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer debe usarse dentro de PlayerProvider");
  return {
    syncable: ctx.syncable,
    currentTime: ctx.currentTime,
    setCurrentTime: ctx.setCurrentTime,
    register: ctx.register,
    getCurrentTime: () => ctx.handle.current?.getCurrentTime() ?? ctx.currentTime,
    seekTo: (s: number) => {
      ctx.handle.current?.seekTo(s);
      ctx.handle.current?.play();
    },
    pause: () => ctx.handle.current?.pause(),
  };
}
