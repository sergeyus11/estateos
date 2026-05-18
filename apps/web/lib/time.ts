export interface MskDayBounds {
  now: Date;
  mskStart: Date;
  mskEnd: Date;
  todayStr: string;
}

export function mskDayBounds(now: Date = new Date()): MskDayBounds {
  const mskOffset = 3 * 60 * 60 * 1000;
  const mskNow = new Date(now.getTime() + mskOffset);
  const year = mskNow.getUTCFullYear();
  const month = mskNow.getUTCMonth();
  const day = mskNow.getUTCDate();
  const mskStart = new Date(Date.UTC(year, month, day) - mskOffset);
  const mskEnd = new Date(mskStart.getTime() + 24 * 60 * 60 * 1000);
  const todayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  return { now, mskStart, mskEnd, todayStr };
}
