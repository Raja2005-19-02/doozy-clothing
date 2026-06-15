// Browser notification + sound helpers — used by the admin dashboard when a
// new order arrives via the Firestore real-time listener.

const SOUND_KEY = "doozy_admin_sound";

export function isSoundEnabled() {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(SOUND_KEY) !== "0";
}
export function setSoundEnabled(v: boolean) {
  try {
    localStorage.setItem(SOUND_KEY, v ? "1" : "0");
  } catch {}
}

// Tiny synthesized two-tone "ping" — no external audio file required.
let _ctx: AudioContext | null = null;
export function playNotificationSound() {
  if (typeof window === "undefined") return;
  if (!isSoundEnabled()) return;
  try {
    _ctx = _ctx || new (window.AudioContext || (window as any).webkitAudioContext)();
    const ctx = _ctx!;
    const now = ctx.currentTime;
    const o1 = ctx.createOscillator();
    const o2 = ctx.createOscillator();
    const g = ctx.createGain();
    o1.type = "sine";
    o2.type = "sine";
    o1.frequency.setValueAtTime(880, now);          // A5
    o2.frequency.setValueAtTime(1318.51, now + 0.12); // E6
    o2.frequency.exponentialRampToValueAtTime(2200, now + 0.5);
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(0.18, now + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);
    o1.connect(g);
    o2.connect(g);
    g.connect(ctx.destination);
    o1.start(now);
    o2.start(now + 0.1);
    o1.stop(now + 0.5);
    o2.stop(now + 0.6);
  } catch {}
}

export async function ensureBrowserNotificationPermission() {
  if (typeof Notification === "undefined") return "denied";
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  try {
    return await Notification.requestPermission();
  } catch {
    return "denied";
  }
}

export function fireBrowserNotification(title: string, body: string) {
  if (typeof Notification === "undefined") return;
  if (Notification.permission !== "granted") return;
  try {
    new Notification(title, { body, icon: "/logo.jpg", silent: false });
  } catch {}
}
