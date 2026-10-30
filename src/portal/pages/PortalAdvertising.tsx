import { Pause, Play, Volume2, VolumeX } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { RUNNING_ADS } from '../data/ads';

/**
 * Advertising — the ads homeowners are seeing right now, so a rep walks into
 * the call knowing what was promised on screen.
 *
 * Built to be cheap: one <video> element on the page, preload="none", so
 * nothing downloads until a rep taps play. The picker is ~25 KB posters.
 * The list itself lives in data/ads.ts.
 */

export default function PortalAdvertising() {
  const [selectedId, setSelectedId] = useState(RUNNING_ADS[0]?.id);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  // Only a tap on a thumbnail should start playback — not the first render.
  const autoplayNext = useRef(false);

  const ad = RUNNING_ADS.find((a) => a.id === selectedId) ?? RUNNING_ADS[0];

  useEffect(() => {
    setProgress(0);
    setPlaying(false);
    const video = videoRef.current;
    if (video && autoplayNext.current) {
      autoplayNext.current = false;
      video.play().catch(() => setPlaying(false));
    }
  }, [selectedId]);

  const select = (id: string) => {
    if (id === selectedId) {
      togglePlay();
      return;
    }
    autoplayNext.current = true;
    setSelectedId(id);
  };

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) video.play().catch(() => setPlaying(false));
    else video.pause();
  };

  if (!ad) {
    return <p className="text-sm text-slate-500">No ads are running right now.</p>;
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Marketing</p>
        <h1 className="text-xl font-semibold text-slate-900 lg:text-2xl">Advertising</h1>
        <p className="text-sm text-slate-500">
          The ads running right now — exactly what a homeowner saw before they booked. Tap one to play it.
        </p>
      </div>

      <div className="flex flex-col items-center gap-6 lg:flex-row lg:items-start lg:justify-center lg:gap-12">
        {/* Phone */}
        <div className="relative w-[min(78vw,300px)] shrink-0 rounded-[2.75rem] bg-slate-900 p-[10px] shadow-[0_30px_60px_-20px_rgba(15,23,42,0.55),inset_0_0_0_2px_#334155]">
          {/* 9:16 to match the renders — a true phone ratio crops the headline. */}
          <div className="relative aspect-[9/16] overflow-hidden rounded-[2.2rem] bg-black">
            <video
              ref={videoRef}
              key={ad.id}
              src={ad.video}
              poster={ad.poster}
              preload="none"
              playsInline
              loop
              muted={muted}
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
              onTimeUpdate={(e) => {
                const v = e.currentTarget;
                setProgress(v.duration ? v.currentTime / v.duration : 0);
              }}
              onClick={togglePlay}
              className="absolute inset-0 h-full w-full cursor-pointer object-cover"
            />

            {/* Dynamic island */}
            <div className="pointer-events-none absolute left-1/2 top-2 h-[18px] w-[70px] -translate-x-1/2 rounded-full bg-black" />

            {!playing && (
              <button
                type="button"
                onClick={togglePlay}
                aria-label={`Play ${ad.title}`}
                className="absolute inset-0 flex items-center justify-center bg-black/15"
              >
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 shadow-lg backdrop-blur">
                  <Play className="ml-1 h-7 w-7 fill-[#1B3C6C] text-[#1B3C6C]" />
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setMuted((m) => !m)}
              aria-label={muted ? 'Unmute' : 'Mute'}
              className="absolute bottom-5 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur"
            >
              {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>

            <div className="absolute inset-x-0 bottom-0 h-1 bg-white/20">
              <div className="h-full bg-white" style={{ width: `${progress * 100}%` }} />
            </div>
          </div>
        </div>

        {/* Picker */}
        <div className="w-full max-w-md space-y-2">
          {RUNNING_ADS.map((item) => {
            const active = item.id === ad.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => select(item.id)}
                className={`flex w-full items-center gap-3 rounded-xl border bg-white p-2 text-left transition ${
                  active ? 'border-[#1B3C6C] ring-2 ring-[#1B3C6C]/15' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <img
                  src={item.poster}
                  alt=""
                  loading="lazy"
                  width={48}
                  height={85}
                  className="h-[85px] w-12 shrink-0 rounded-lg object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-900">{item.title}</p>
                  <p className="text-xs text-slate-500">{item.angle}</p>
                  <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    {item.category} · {item.duration}s
                  </p>
                </div>
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                    active ? 'bg-[#1B3C6C] text-white' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {active && playing ? <Pause className="h-4 w-4" /> : <Play className="ml-0.5 h-4 w-4" />}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
