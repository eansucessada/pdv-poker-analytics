// utils/time.ts
export const getHHMM = (d: Date) =>
  `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

export const subtractMinutes = (d: Date, minutes: number) =>
  new Date(d.getTime() - minutes * 60_000);
