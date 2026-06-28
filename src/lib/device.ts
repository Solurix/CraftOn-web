// A stable per-device id (persisted in localStorage) + a human label derived
// from the user agent. Sent as X-Device-Id / X-Device-Name so the API can list
// and revoke devices.
const KEY = "crafton.device";

export function getDeviceId(): string | null {
  if (typeof window === "undefined") return null;
  let id = localStorage.getItem(KEY);
  if (!id) {
    id =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `dev-${Math.random().toString(36).slice(2)}${Date.now()}`;
    localStorage.setItem(KEY, id);
  }
  return id;
}

// Forget the current device id so the next request enrolls a fresh device.
// Used after a device_revoked response: a later legitimate login then gets a new
// (non-revoked) device record, while the revoked one stays revoked.
export function rotateDeviceId(): void {
  if (typeof window !== "undefined") localStorage.removeItem(KEY);
}

export function getDeviceName(): string | null {
  if (typeof navigator === "undefined") return null;
  const ua = navigator.userAgent;
  const browser = /Edg/.test(ua)
    ? "Edge"
    : /OPR|Opera/.test(ua)
      ? "Opera"
      : /Chrome/.test(ua)
        ? "Chrome"
        : /Firefox/.test(ua)
          ? "Firefox"
          : /Safari/.test(ua)
            ? "Safari"
            : "Browser";
  const os = /Android/.test(ua)
    ? "Android"
    : /iPhone|iPad|iPod/.test(ua)
      ? "iOS"
      : /Windows/.test(ua)
        ? "Windows"
        : /Mac OS/.test(ua)
          ? "macOS"
          : /Linux/.test(ua)
            ? "Linux"
            : "";
  return os ? `${browser} · ${os}` : browser;
}
