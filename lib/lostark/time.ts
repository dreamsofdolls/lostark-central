function startUtcHour(date: Date, hour: number): Date {
  const value = new Date(date);
  value.setUTCSeconds(0);
  value.setUTCMinutes(0);
  value.setUTCMilliseconds(0);
  value.setUTCHours(hour);
  return value;
}

function subDaysUtc(date: Date, days: number): Date {
  return new Date(date.getTime() - days * 24 * 60 * 60 * 1000);
}

function getIsoWeek(date: Date): number {
  const value = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNum = value.getUTCDay() || 7;
  value.setUTCDate(value.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(value.getUTCFullYear(), 0, 1));
  return Math.ceil(((value.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

export function getLastDailyReset(now: number): number {
  const current = new Date(now);
  let reset = startUtcHour(current, 10);
  if (current.getUTCHours() < 10) {
    reset = startUtcHour(subDaysUtc(current, 1), 10);
  }
  return reset.getTime();
}

export function getLastWeeklyReset(now: number): number {
  const weeklyResetDay = 3;
  const current = new Date(now);
  let reset = startUtcHour(current, 10);

  if (reset.getUTCDay() === weeklyResetDay) {
    if (current.getUTCHours() < 10) {
      reset = startUtcHour(subDaysUtc(current, 7), 10);
    }
  } else {
    let diff = weeklyResetDay - current.getUTCDay();
    if (diff < 0) {
      diff = Math.abs(diff);
    } else {
      diff = 7 - diff;
    }
    reset = startUtcHour(subDaysUtc(current, diff), 10);
  }

  return reset.getTime();
}

export function getLastBiWeeklyReset(now: number): number {
  const weeklyReset = getLastWeeklyReset(now);
  const week = getIsoWeek(new Date(weeklyReset));
  if (week % 2 === 1) {
    return weeklyReset;
  }
  return weeklyReset - 7 * 24 * 60 * 60 * 1000;
}

export function getLastBiWeeklyOffsetReset(now: number): number {
  const weeklyReset = getLastWeeklyReset(now);
  const week = getIsoWeek(new Date(weeklyReset));
  if (week % 2 === 0) {
    return weeklyReset;
  }
  return weeklyReset - 7 * 24 * 60 * 60 * 1000;
}

export function getNextDailyReset(now: number): number {
  return getLastDailyReset(now) + 24 * 60 * 60 * 1000;
}

export function getNextWeeklyReset(now: number): number {
  return getLastWeeklyReset(now) + 7 * 24 * 60 * 60 * 1000;
}

export function getNextBiWeeklyReset(now: number): number {
  const last = getLastBiWeeklyReset(now);
  const week = getIsoWeek(new Date(last));
  return last + (week % 2 === 1 ? 14 : 7) * 24 * 60 * 60 * 1000;
}

export function getNextBiWeeklyOffsetReset(now: number): number {
  const last = getLastBiWeeklyOffsetReset(now);
  const week = getIsoWeek(new Date(last));
  return last + (week % 2 === 0 ? 14 : 7) * 24 * 60 * 60 * 1000;
}
