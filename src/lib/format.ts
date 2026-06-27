// Money is integer JPY; times display in Asia/Tokyo (docs/CLAUDE.md).
export function formatYen(amount: number): string {
  return `¥${amount.toLocaleString("ja-JP")}`;
}

export function formatDate(iso: string): string {
  // Date-only values (work_date) render as-is; datetimes shown in Tokyo.
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
  try {
    return new Intl.DateTimeFormat("ja-JP", {
      timeZone: "Asia/Tokyo",
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function formatTime(t: string): string {
  return t.slice(0, 5); // HH:MM
}
