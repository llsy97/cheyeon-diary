import { addDays, dateInMonth, daysInMonth, monthOf } from './date';
import { checkKey, type CheckMap, type DiaryMap } from './storage';
import type { DateKey, MonthKey, MonthlyGoal } from './types';

export function goalsOfMonth(goals: MonthlyGoal[], month: MonthKey) {
  return goals.filter((g) => g.month === month);
}

export function isDone(checks: CheckMap, date: DateKey, goalId: string) {
  return checks[checkKey(date, goalId)]?.done === true;
}

export function doneCountOn(checks: CheckMap, date: DateKey, goals: MonthlyGoal[]) {
  return goals.reduce((n, g) => n + (isDone(checks, date, g.id) ? 1 : 0), 0);
}

/**
 * 연속 기록 일수: 오늘부터 거꾸로 일기가 있는 날이 이어진 수.
 * 오늘 아직 안 썼으면 어제부터 센다 (오늘 쓰기 전까지 기록이 끊기지 않게).
 */
export function diaryStreak(diary: DiaryMap, today: DateKey): number {
  let cursor = diary[today] ? today : addDays(today, -1);
  let n = 0;
  while (diary[cursor]) {
    n += 1;
    cursor = addDays(cursor, -1);
  }
  return n;
}

/** 히트맵 단계 0~4. 목표가 없으면 0. */
export function heatLevel(done: number, total: number): 0 | 1 | 2 | 3 | 4 {
  if (total === 0 || done === 0) return 0;
  return Math.min(4, Math.max(1, Math.ceil((done / total) * 4))) as 1 | 2 | 3 | 4;
}

export interface GoalStat {
  goal: MonthlyGoal;
  done: number;
  possible: number;
  rate: number; // 0~1
  longestStreak: number;
}

export interface MonthStats {
  month: MonthKey;
  /** 이번 달에서 오늘까지 지난 날 (미래 달이면 0, 지난 달이면 전체) */
  elapsedDays: number;
  totalDays: number;
  done: number;
  possible: number;
  rate: number;
  perGoal: GoalStat[];
  /** 일별 달성 개수 (index 0 = 1일) — 미래 날짜는 null */
  daily: (number | null)[];
  bestStreakGoal: GoalStat | null;
}

export function computeMonthStats(
  goals: MonthlyGoal[],
  checks: CheckMap,
  month: MonthKey,
  today: DateKey,
): MonthStats {
  const monthGoals = goalsOfMonth(goals, month);
  const totalDays = daysInMonth(month);
  const todayMonth = monthOf(today);
  const elapsedDays =
    month < todayMonth ? totalDays : month > todayMonth ? 0 : Number(today.slice(8, 10));

  const perGoal: GoalStat[] = monthGoals.map((goal) => {
    // 달 중간에 추가한 목표는 추가한 날부터 '가능한 날'로 센다
    const startDay =
      goal.createdAt && monthOf(goal.createdAt) === month ? Number(goal.createdAt.slice(8, 10)) : 1;
    let done = 0;
    let run = 0;
    let longest = 0;
    for (let d = 1; d <= elapsedDays; d++) {
      if (isDone(checks, dateInMonth(month, d), goal.id)) {
        if (d >= startDay) done += 1;
        run += 1;
        longest = Math.max(longest, run);
      } else {
        run = 0;
      }
    }
    const possible = Math.max(0, elapsedDays - startDay + 1);
    return { goal, done, possible, rate: possible ? done / possible : 0, longestStreak: longest };
  });

  const done = perGoal.reduce((s, g) => s + g.done, 0);
  const possible = perGoal.reduce((s, g) => s + g.possible, 0);

  const daily: (number | null)[] = [];
  for (let d = 1; d <= totalDays; d++) {
    daily.push(d <= elapsedDays ? doneCountOn(checks, dateInMonth(month, d), monthGoals) : null);
  }

  const bestStreakGoal = perGoal.reduce<GoalStat | null>(
    (best, g) => (g.longestStreak > 0 && (!best || g.longestStreak > best.longestStreak) ? g : best),
    null,
  );

  return {
    month,
    elapsedDays,
    totalDays,
    done,
    possible,
    rate: possible ? done / possible : 0,
    perGoal,
    daily,
    bestStreakGoal,
  };
}
