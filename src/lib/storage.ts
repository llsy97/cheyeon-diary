import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  DEFAULT_SETTINGS,
  type DateKey,
  type DiaryEntry,
  type GoalCheck,
  type Meta,
  type MonthlyGoal,
  type Settings,
} from './types';

/**
 * 모든 데이터는 기기 안(AsyncStorage)에만 저장된다. 서버 없음.
 * 컬렉션마다 키 하나에 JSON 으로 통째로 저장한다 (데이터 양이 작아서 충분).
 */
const KEYS = {
  diary: '@haru/v1/diary',
  goals: '@haru/v1/goals',
  checks: '@haru/v1/checks',
  settings: '@haru/v1/settings',
  meta: '@haru/v1/meta',
} as const;

export type DiaryMap = Record<DateKey, DiaryEntry>;
/** 키: `${date}|${goalId}` */
export type CheckMap = Record<string, GoalCheck>;

export interface PersistedData {
  diary: DiaryMap;
  goals: MonthlyGoal[];
  checks: CheckMap;
  settings: Settings;
  meta: Meta;
}

export const checkKey = (date: DateKey, goalId: string) => `${date}|${goalId}`;

async function readJSON<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch (e) {
    console.warn(`[storage] ${key} 읽기 실패`, e);
    return fallback;
  }
}

async function writeJSON(key: string, value: unknown) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn(`[storage] ${key} 저장 실패`, e);
  }
}

export async function loadAll(): Promise<PersistedData> {
  const [diary, goals, checks, settings, meta] = await Promise.all([
    readJSON<DiaryMap>(KEYS.diary, {}),
    readJSON<MonthlyGoal[]>(KEYS.goals, []),
    readJSON<CheckMap>(KEYS.checks, {}),
    readJSON<Partial<Settings>>(KEYS.settings, {}),
    readJSON<Meta>(KEYS.meta, {}),
  ]);
  return {
    diary,
    goals,
    checks,
    // 나중에 설정 항목이 늘어나도 기본값으로 채워지도록 병합
    settings: { ...DEFAULT_SETTINGS, ...settings },
    meta,
  };
}

export const save = {
  diary: (v: DiaryMap) => writeJSON(KEYS.diary, v),
  goals: (v: MonthlyGoal[]) => writeJSON(KEYS.goals, v),
  checks: (v: CheckMap) => writeJSON(KEYS.checks, v),
  settings: (v: Settings) => writeJSON(KEYS.settings, v),
  meta: (v: Meta) => writeJSON(KEYS.meta, v),
};

export async function clearAll() {
  await AsyncStorage.multiRemove(Object.values(KEYS));
}
