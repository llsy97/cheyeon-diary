import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';
import { addDays, addMonths, dateInMonth, monthOf, toDateKey } from '@/lib/date';
import { goalsOfMonth } from '@/lib/stats';
import { checkKey, clearAll, loadAll, save, type PersistedData } from '@/lib/storage';
import {
  DEFAULT_SETTINGS,
  DIARY_MAX_LENGTH,
  MAX_GOALS_PER_MONTH,
  type DateKey,
  type Meta,
  type MonthlyGoal,
  type Settings,
} from '@/lib/types';

const newId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

export interface NewGoalInput {
  name: string;
  icon: string;
  reminderTime?: string;
}

interface DataContextValue extends PersistedData {
  loaded: boolean;
  /** 오늘 날짜 키. 자정이 지나거나 앱이 다시 열리면 갱신된다. */
  today: DateKey;
  saveDiary: (date: DateKey, line: string) => void;
  toggleCheck: (date: DateKey, goalId: string) => void;
  /** 성공하면 true. 이번 달 목표가 이미 6개거나 같은 이름이 있으면 false. */
  addGoal: (input: NewGoalInput) => boolean;
  updateGoal: (id: string, patch: Partial<Omit<MonthlyGoal, 'id' | 'month'>>) => void;
  removeGoal: (id: string) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  updateMeta: (patch: Partial<Meta>) => void;
  /** 지난달 목표를 이번 달로 복사 (알림 시간 포함) */
  continueLastMonthGoals: () => void;
  seedSampleData: () => void;
  resetAll: () => Promise<void>;
}

const DataContext = createContext<DataContextValue | null>(null);

const EMPTY: PersistedData = {
  diary: {},
  goals: [],
  checks: {},
  settings: DEFAULT_SETTINGS,
  meta: {},
};

function useToday(): DateKey {
  const [today, setToday] = useState(() => toDateKey(new Date()));
  useEffect(() => {
    const refresh = () => setToday(toDateKey(new Date()));
    const now = new Date();
    const msToMidnight =
      new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime() - now.getTime() + 1000;
    const timer = setTimeout(refresh, msToMidnight);
    const sub = AppState.addEventListener('change', (s) => s === 'active' && refresh());
    return () => {
      clearTimeout(timer);
      sub.remove();
    };
  }, [today]);
  return today;
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<PersistedData>(EMPTY);
  const [loaded, setLoaded] = useState(false);
  const today = useToday();
  // 콜백 안에서 항상 최신 상태를 읽기 위한 ref (setData 하는 곳에서 함께 갱신)
  const ref = useRef(data);

  useEffect(() => {
    loadAll().then((d) => {
      ref.current = d;
      setData(d);
      setLoaded(true);
    });
  }, []);

  /** 상태를 바꾸고, 바뀐 컬렉션만 저장한다 */
  const commit = useCallback((next: Partial<PersistedData>) => {
    const merged = { ...ref.current, ...next };
    ref.current = merged;
    setData(merged);
    if (next.diary) save.diary(merged.diary);
    if (next.goals) save.goals(merged.goals);
    if (next.checks) save.checks(merged.checks);
    if (next.settings) save.settings(merged.settings);
    if (next.meta) save.meta(merged.meta);
  }, []);

  const saveDiary = useCallback(
    (date: DateKey, line: string) => {
      const text = line.trim().slice(0, DIARY_MAX_LENGTH);
      const diary = { ...ref.current.diary };
      if (text) diary[date] = { date, line: text };
      else delete diary[date];
      commit({ diary });
    },
    [commit],
  );

  const toggleCheck = useCallback(
    (date: DateKey, goalId: string) => {
      const key = checkKey(date, goalId);
      const checks = { ...ref.current.checks };
      if (checks[key]?.done) delete checks[key];
      else checks[key] = { date, goalId, done: true };
      commit({ checks });
    },
    [commit],
  );

  const addGoal = useCallback(
    ({ name, icon, reminderTime }: NewGoalInput) => {
      const month = monthOf(today);
      const trimmed = name.trim();
      const current = goalsOfMonth(ref.current.goals, month);
      if (!trimmed || current.length >= MAX_GOALS_PER_MONTH) return false;
      if (current.some((g) => g.name === trimmed)) return false;
      const goal: MonthlyGoal = { id: newId(), month, name: trimmed, icon, reminderTime, createdAt: today };
      commit({ goals: [...ref.current.goals, goal] });
      return true;
    },
    [commit, today],
  );

  const updateGoal = useCallback<DataContextValue['updateGoal']>(
    (id, patch) => {
      commit({ goals: ref.current.goals.map((g) => (g.id === id ? { ...g, ...patch } : g)) });
    },
    [commit],
  );

  const removeGoal = useCallback(
    (id: string) => {
      const checks = Object.fromEntries(
        Object.entries(ref.current.checks).filter(([, c]) => c.goalId !== id),
      );
      commit({ goals: ref.current.goals.filter((g) => g.id !== id), checks });
    },
    [commit],
  );

  const updateSettings = useCallback(
    (patch: Partial<Settings>) => commit({ settings: { ...ref.current.settings, ...patch } }),
    [commit],
  );

  const updateMeta = useCallback(
    (patch: Partial<Meta>) => commit({ meta: { ...ref.current.meta, ...patch } }),
    [commit],
  );

  const continueLastMonthGoals = useCallback(() => {
    const month = monthOf(today);
    const existing = goalsOfMonth(ref.current.goals, month);
    const prev = goalsOfMonth(ref.current.goals, addMonths(month, -1));
    const copies = prev
      .filter((p) => !existing.some((e) => e.name === p.name))
      .slice(0, MAX_GOALS_PER_MONTH - existing.length)
      .map<MonthlyGoal>((p) => ({
        id: newId(),
        month,
        name: p.name,
        icon: p.icon,
        reminderTime: p.reminderTime,
        createdAt: dateInMonth(month, 1),
      }));
    commit({
      goals: [...ref.current.goals, ...copies],
      meta: { ...ref.current.meta, monthSetupDoneFor: month },
    });
  }, [commit, today]);

  /** 개발용: 지난달 + 이번 달 샘플 데이터를 채운다 (달력/통계 확인용) */
  const seedSampleData = useCallback(() => {
    const month = monthOf(today);
    const prevMonth = addMonths(month, -1);
    const templates = [
      { name: '스트레칭 5분', icon: 'stretch' },
      { name: '물 2L 마시기', icon: 'water' },
      { name: '약 먹기', icon: 'pill', reminderTime: '08:00' },
      { name: '일찍 자기', icon: 'moon' },
    ];
    const lines = [
      '비 오는 소리에 오래 깨어 있었다',
      '점심에 먹은 김치찌개가 유난히 맛있었다',
      '산책길에 고양이랑 눈이 마주쳤다',
      '별일 없었지만 그래서 좋은 하루',
      '오랜만에 친구에게 전화를 걸었다',
      '퇴근길 노을이 예뻐서 사진을 찍었다',
      '조금 지쳤지만 끝까지 해냈다',
      '새로 산 책 첫 장을 펼쳤다',
    ];
    const goals: MonthlyGoal[] = ref.current.goals.filter((g) => g.month !== month && g.month !== prevMonth);
    for (const m of [prevMonth, month]) {
      templates.forEach((t) =>
        goals.push({ id: newId(), month: m, createdAt: dateInMonth(m, 1), ...t }),
      );
    }
    const diary = { ...ref.current.diary };
    const checks = { ...ref.current.checks };
    // 오늘 이전 45일치
    for (let i = 1; i <= 45; i++) {
      const date = addDays(today, -i);
      const mg = goals.filter((g) => g.month === monthOf(date));
      // 최근 6일은 연속 기록이 보이도록 반드시 채운다
      if (i <= 6 || Math.random() < 0.75) {
        diary[date] = { date, line: lines[i % lines.length] };
      }
      mg.forEach((g, gi) => {
        const p = [0.85, 0.6, 0.9, 0.4][gi] ?? 0.5;
        if (Math.random() < p) checks[checkKey(date, g.id)] = { date, goalId: g.id, done: true };
      });
    }
    commit({ goals, diary, checks, meta: { ...ref.current.meta, monthSetupDoneFor: month } });
  }, [commit, today]);

  const resetAll = useCallback(async () => {
    await clearAll();
    ref.current = EMPTY;
    setData(EMPTY);
  }, []);

  const value = useMemo<DataContextValue>(
    () => ({
      ...data,
      loaded,
      today,
      saveDiary,
      toggleCheck,
      addGoal,
      updateGoal,
      removeGoal,
      updateSettings,
      updateMeta,
      continueLastMonthGoals,
      seedSampleData,
      resetAll,
    }),
    [data, loaded, today, saveDiary, toggleCheck, addGoal, updateGoal, removeGoal, updateSettings, updateMeta, continueLastMonthGoals, seedSampleData, resetAll],
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useAppData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useAppData 는 DataProvider 안에서만 사용할 수 있어요');
  return ctx;
}

/** 특정 월(기본: 이번 달)의 목표 */
export function useMonthGoals(month?: string) {
  const { goals, today } = useAppData();
  const m = month ?? monthOf(today);
  return useMemo(() => goalsOfMonth(goals, m), [goals, m]);
}

export function useSettings() {
  const { settings, updateSettings } = useAppData();
  return [settings, updateSettings] as const;
}
