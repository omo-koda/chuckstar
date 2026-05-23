import { useEffect, useRef, useState } from "react";

export function useCountdown(target: string | Date | null) {
  const [t, setT] = useState({ d: 0, h: 0, m: 0, s: 0, done: false });
  useEffect(() => {
    if (!target) return;
    const end = new Date(target).getTime();
    const tick = () => {
      const diff = end - Date.now();
      if (diff <= 0) { setT({ d: 0, h: 0, m: 0, s: 0, done: true }); return; }
      setT({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
        done: false,
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);
  return t;
}

export function CountdownTimer({ target }: { target: string | Date | null }) {
  const { d, h, m, s, done } = useCountdown(target);
  if (done) return <span className="font-rajdhani text-xs text-destructive">Ended</span>;
  const cells = [
    { v: d, l: "D" }, { v: h, l: "H" }, { v: m, l: "M" }, { v: s, l: "S" },
  ];
  return (
    <div className="flex items-center gap-1">
      {cells.map((c, i) => (
        <span key={i} className="font-display text-[10px] font-bold text-accent bg-background/60 rounded px-1.5 py-0.5 min-w-[26px] text-center tabular-nums">
          {String(c.v).padStart(2, "0")}
        </span>
      ))}
    </div>
  );
}

export function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

// Session ID for presence
export function getSessionId() {
  if (typeof window === "undefined") return "ssr";
  let id = sessionStorage.getItem("cv_sid");
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem("cv_sid", id);
  }
  return id;
}

// Adaptive performance / sensor effects (battery, ambient light, reduced motion)
export function useAdaptiveNeon() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const set = (v: number) => document.documentElement.style.setProperty("--neon-intensity", String(v));

    // prefers-reduced-motion → low
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) { set(0.4); return; }

    // saveData
    const conn = (navigator as any).connection;
    if (conn?.saveData) { set(0.5); return; }

    // Battery
    (navigator as any).getBattery?.().then((b: any) => {
      if (b.level < 0.2 && !b.charging) set(0.5);
      b.addEventListener?.("levelchange", () => set(b.level < 0.2 && !b.charging ? 0.5 : 1));
    });

    // Ambient light → soften neon in bright environments
    try {
      const Anyone = (window as any).AmbientLightSensor;
      if (Anyone) {
        const sensor = new Anyone({ frequency: 0.5 });
        sensor.onreading = () => {
          const lux = sensor.illuminance ?? 100;
          set(lux > 500 ? 0.6 : 1);
        };
        sensor.start();
      }
    } catch { /* permission denied or unsupported — ignore */ }
  }, []);
}

// Wake lock while element is visible
export function useWakeLockWhileVisible(ref: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const wl: any = (navigator as any).wakeLock;
    if (!wl || !ref.current) return;
    let lock: any = null;
    const obs = new IntersectionObserver(async ([e]) => {
      try {
        if (e.isIntersecting && !lock) lock = await wl.request("screen");
        else if (!e.isIntersecting && lock) { await lock.release(); lock = null; }
      } catch { /* user gesture required or unsupported */ }
    }, { threshold: 0.5 });
    obs.observe(ref.current);
    return () => { obs.disconnect(); lock?.release?.(); };
  }, [ref]);
}

// Lightweight haptic + vibrate
export function haptic(ms = 12) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try { navigator.vibrate(ms); } catch { /* ignore */ }
  }
}
