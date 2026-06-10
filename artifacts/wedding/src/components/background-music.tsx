import { useEffect, useRef, useState } from "react";
import { Music, VolumeX } from "lucide-react";

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

/** Extract a YouTube video id from common URL shapes (or a raw 11-char id). */
function getYouTubeId(url: string): string | null {
  if (!url) return null;
  const raw = url.trim();
  try {
    const u = new URL(raw);
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtu.be") return u.pathname.slice(1) || null;
    if (host.endsWith("youtube.com")) {
      if (u.pathname === "/watch") return u.searchParams.get("v");
      const parts = u.pathname.split("/").filter(Boolean);
      if (["embed", "shorts", "v"].includes(parts[0] ?? "")) {
        return parts[1] ?? null;
      }
    }
  } catch {
    // Not a URL — maybe it's already a bare video id.
  }
  return /^[a-zA-Z0-9_-]{11}$/.test(raw) ? raw : null;
}

let apiPromise: Promise<void> | null = null;
function loadYouTubeApi(): Promise<void> {
  if (window.YT?.Player) return Promise.resolve();
  if (apiPromise) return apiPromise;
  apiPromise = new Promise((resolve) => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve();
    };
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
  });
  return apiPromise;
}

/**
 * Discreet background-music player driven by a YouTube link configured in the
 * admin panel. Attempts to autoplay (with sound) as soon as the invitation
 * opens; because browsers block unmuted autoplay without a user gesture, it
 * also starts on the visitor's first interaction. A small button in the
 * bottom-right corner toggles play/pause (mute).
 */
export function BackgroundMusic({ url }: { url?: string | null }) {
  const videoId = url ? getYouTubeId(url) : null;
  const hostRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!videoId) return;
    let cancelled = false;
    let removeGestureListeners: (() => void) | undefined;

    void loadYouTubeApi().then(() => {
      if (cancelled || !hostRef.current) return;

      playerRef.current = new window.YT.Player(hostRef.current, {
        videoId,
        playerVars: {
          autoplay: 1,
          controls: 0,
          loop: 1,
          playlist: videoId,
          playsinline: 1,
          modestbranding: 1,
          rel: 0,
          fs: 0,
          disablekb: 1,
        },
        events: {
          onReady: (e: any) => {
            try {
              e.target.unMute();
              e.target.setVolume(55);
              e.target.playVideo();
            } catch {
              // ignore — gesture fallback below will retry
            }
          },
          onStateChange: (e: any) => {
            setPlaying(e.data === window.YT?.PlayerState?.PLAYING);
          },
        },
      });

      // Fallback: if autoplay was blocked, start on the first user gesture.
      const start = () => {
        const p = playerRef.current;
        if (!p) return;
        try {
          p.unMute();
          p.playVideo();
        } catch {
          // ignore
        }
      };
      const gestures = ["pointerdown", "keydown", "touchstart", "scroll"];
      gestures.forEach((g) =>
        document.addEventListener(g, start, { once: true, passive: true }),
      );
      removeGestureListeners = () =>
        gestures.forEach((g) => document.removeEventListener(g, start));
    });

    return () => {
      cancelled = true;
      removeGestureListeners?.();
      try {
        playerRef.current?.destroy?.();
      } catch {
        // ignore
      }
      playerRef.current = null;
    };
  }, [videoId]);

  if (!videoId) return null;

  const toggle = () => {
    const p = playerRef.current;
    if (!p) return;
    if (playing) {
      p.pauseVideo();
    } else {
      try {
        p.unMute();
      } catch {
        // ignore
      }
      p.playVideo();
    }
  };

  return (
    <>
      {/* Off-screen YouTube player (kept rendered so audio keeps playing). */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          width: 1,
          height: 1,
          opacity: 0,
          pointerEvents: "none",
          zIndex: -10,
          overflow: "hidden",
        }}
      >
        <div ref={hostRef} />
      </div>

      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? "Silenciar música" : "Reproducir música"}
        title={playing ? "Silenciar música" : "Reproducir música"}
        className="fixed bottom-5 right-5 z-50 flex h-11 w-11 items-center justify-center rounded-full border border-[#A38C70]/50 bg-[#FDFBF7]/85 text-[#705B46] shadow-md backdrop-blur-sm transition-colors hover:bg-[#FDFBF7] hover:text-[#553927]"
      >
        {playing ? (
          <Music className="h-5 w-5 animate-pulse" />
        ) : (
          <VolumeX className="h-5 w-5" />
        )}
      </button>
    </>
  );
}
