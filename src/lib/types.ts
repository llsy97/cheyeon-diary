/** 'YYYY-MM-DD' (로컬 날짜) */
export type DateKey = string;
/** 'YYYY-MM' */
export type MonthKey = string;
/** 'HH:mm' (24시간) */
export type TimeString = string;

export const DIARY_MAX_LENGTH = 60;
export const MAX_GOALS_PER_MONTH = 6;

export interface DiaryEntry {
  date: DateKey;
  line: string;
}

export interface MonthlyGoal {
  id: string;
  month: MonthKey;
  name: string;
  /** GoalIcon 의 키 (lucide 아이콘 매핑) */
  icon: string;
  reminderTime?: TimeString;
  /** 목표를 추가한 날. 통계에서 '가능한 횟수'를 이 날부터 센다. */
  createdAt?: DateKey;
}

export interface GoalCheck {
  date: DateKey;
  goalId: string;
  done: boolean;
}

export interface Settings {
  dailyReminderOn: boolean;
  dailyReminderTime: TimeString;
  /** 인덱스 0 = 일요일 … 6 = 토요일 */
  repeatDays: boolean[];
  /** 23:00 까지 기록이 없으면 한 번 더 알림 */
  nudgeOn: boolean;
}

export interface Meta {
  /** 이 달의 '지난달 목표 이어가기 / 새로 정하기' 선택을 이미 했는지 */
  monthSetupDoneFor?: MonthKey;
  /** 첫 실행 때 알림 권한을 이미 물어봤는지 */
  askedNotificationPermission?: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  dailyReminderOn: true,
  dailyReminderTime: '21:00',
  repeatDays: [true, true, true, true, true, true, true],
  nudgeOn: true,
};

export const NUDGE_TIME: TimeString = '23:00';
