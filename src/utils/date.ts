/**
 * 날짜 포맷 (YYYY-MM-DD → 표시용)
 */
export function formatDate(isoOrYmd: string): string {
  if (!isoOrYmd) return '';
  const datePart = isoOrYmd.slice(0, 10); // YYYY-MM-DD
  const [y, m, d] = datePart.split('-');
  if (!y || !m || !d) return datePart;
  return `${y}. ${parseInt(m, 10)}. ${parseInt(d, 10)}.`;
}

function toYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** 오늘 날짜 YYYY-MM-DD (로컬) */
export function getTodayYmd(): string {
  return toYmd(new Date());
}

/** 이번 주 (일요일~토요일) 시작일·종료일 YYYY-MM-DD (로컬) */
export function getThisWeekRange(): { start: string; end: string } {
  const d = new Date();
  const day = d.getDay();
  const start = new Date(d);
  start.setDate(d.getDate() - day);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { start: toYmd(start), end: toYmd(end) };
}

/** 이번 달 첫날·마지막날 YYYY-MM-DD (로컬) */
export function getThisMonthRange(): { start: string; end: string } {
  const d = new Date();
  const start = new Date(d.getFullYear(), d.getMonth(), 1);
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return { start: toYmd(start), end: toYmd(end) };
}
