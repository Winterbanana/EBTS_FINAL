export const OVERDUE_DAILY_RATE = 100;

export function getOverdueDays(dueDate: string, today = new Date()): number {
  const due = new Date(`${dueDate}T00:00:00`);
  const currentDate = new Date(today);
  if (Number.isNaN(due.getTime())) return 0;
  due.setHours(0, 0, 0, 0);
  currentDate.setHours(0, 0, 0, 0);
  return Math.max(0, Math.floor((currentDate.getTime() - due.getTime()) / 86_400_000));
}

export function calculateOverduePenalty(dueDate: string, today = new Date()): number {
  return getOverdueDays(dueDate, today) * OVERDUE_DAILY_RATE;
}
