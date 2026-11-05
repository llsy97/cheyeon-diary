import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { addDays, formatKoreanTime, parseDateKey, parseTime } from './date';
import type { DiaryMap } from './storage';
import { NUDGE_TIME, type DateKey, type MonthlyGoal, type Settings } from './types';

export type PermissionState = 'granted' | 'denied' | 'undetermined' | 'unsupported';

const CHANNEL_ID = 'reminders';
/** 23시 알림을 미리 예약해 두는 기간 (앱을 열 때마다 다시 채워진다) */
const NUDGE_HORIZON_DAYS = 14;

export const isSupported = Platform.OS !== 'web';

export const MESSAGES = {
  daily: { title: '하루한줄', body: '오늘 하루를 한 줄로 남겨볼까요?' },
  nudge: { title: '하루한줄', body: '아직 오늘의 한 줄이 비어 있어요. 자기 전에 한 줄만 남겨요.' },
  goal: (name: string) => ({ title: name, body: `'${name}' 할 시간이에요. 하고 나면 체크해 주세요.` }),
};

/** 앱 시작 시 한 번: 포그라운드 표시 방식 + 안드로이드 채널 */
export async function configureNotifications() {
  if (!isSupported) return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
  if (Platform.OS === 'android') {
    // Android 13+ 에서는 채널이 있어야 권한 요청 창이 뜬다
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: '기록 알림',
      // eslint-disable-next-line import/namespace -- export * 로 재노출된 enum (tsc 로 확인됨)
      importance: Notifications.AndroidImportance.HIGH,
      lightColor: '#2F7A63',
    });
  }
}

function toState(p: Notifications.NotificationPermissionsStatus): PermissionState {
  // eslint-disable-next-line import/namespace -- export * 로 재노출된 enum (tsc 로 확인됨)
  if (p.granted || p.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) return 'granted';
  return p.status === 'denied' ? 'denied' : 'undetermined';
}

export async function getPermission(): Promise<PermissionState> {
  if (!isSupported) return 'unsupported';
  return toState(await Notifications.getPermissionsAsync());
}

export async function requestPermission(): Promise<PermissionState> {
  if (!isSupported) return 'unsupported';
  return toState(
    await Notifications.requestPermissionsAsync({ ios: { allowAlert: true, allowBadge: false, allowSound: true } }),
  );
}

export interface ScheduleInput {
  settings: Settings;
  /** 이번 달 목표 */
  goals: MonthlyGoal[];
  diary: DiaryMap;
  today: DateKey;
}

/** 실제로 예약할 알림 목록을 만든다 (순수 함수 — 미리보기에도 사용) */
export function buildRequests({ settings, goals, diary, today }: ScheduleInput, now = new Date()) {
  const requests: Notifications.NotificationRequestInput[] = [];
  const channel = Platform.OS === 'android' ? { channelId: CHANNEL_ID } : {};
  const T = Notifications.SchedulableTriggerInputTypes;

  // 1) 매일 기록 알림 — 반복 예약
  if (settings.dailyReminderOn && settings.repeatDays.some(Boolean)) {
    const { hour, minute } = parseTime(settings.dailyReminderTime);
    const content = { ...MESSAGES.daily, data: { url: '/' } };
    if (settings.repeatDays.every(Boolean)) {
      requests.push({ identifier: 'daily', content, trigger: { type: T.DAILY, hour, minute, ...channel } });
    } else {
      settings.repeatDays.forEach((on, i) => {
        if (!on) return;
        requests.push({
          identifier: `daily-${i}`,
          content,
          // expo-notifications 의 weekday 는 1 = 일요일 … 7 = 토요일
          trigger: { type: T.WEEKLY, weekday: i + 1, hour, minute, ...channel },
        });
      });
    }
  }

  // 2) 목표별 개별 알림 — 매일 반복
  for (const g of goals) {
    if (!g.reminderTime) continue;
    const { hour, minute } = parseTime(g.reminderTime);
    requests.push({
      identifier: `goal-${g.id}`,
      content: { ...MESSAGES.goal(g.name), data: { url: '/' } },
      trigger: { type: T.DAILY, hour, minute, ...channel },
    });
  }

  // 3) 23시 리마인드 — 날짜별 1회 예약. 이미 일기를 쓴 날은 건너뛴다.
  //    로컬 알림은 울리는 순간 조건을 검사할 수 없으므로, 일기를 저장하면
  //    전체를 다시 예약해서 오늘 몫을 빼는 방식으로 처리한다.
  if (settings.nudgeOn) {
    const { hour, minute } = parseTime(NUDGE_TIME);
    for (let i = 0; i < NUDGE_HORIZON_DAYS; i++) {
      const date = addDays(today, i);
      if (diary[date]) continue;
      const at = parseDateKey(date);
      if (!settings.repeatDays[at.getDay()]) continue;
      at.setHours(hour, minute, 0, 0);
      if (at.getTime() <= now.getTime()) continue;
      requests.push({
        identifier: `nudge-${date}`,
        content: { ...MESSAGES.nudge, data: { url: '/' } },
        trigger: { type: T.DATE, date: at, ...channel },
      });
    }
  }

  return requests;
}

let queue: Promise<unknown> = Promise.resolve();

/** 기존 예약을 모두 취소하고 다시 예약한다. 동시에 여러 번 불려도 순서대로 실행된다. */
export function rescheduleAll(input: ScheduleInput): Promise<number> {
  const run = async () => {
    if (!isSupported) return 0;
    await Notifications.cancelAllScheduledNotificationsAsync();
    if ((await getPermission()) !== 'granted') return 0;
    const requests = buildRequests(input);
    for (const r of requests) {
      try {
        await Notifications.scheduleNotificationAsync(r);
      } catch (e) {
        console.warn('[notifications] 예약 실패', r.identifier, e);
      }
    }
    return requests.length;
  };
  const next = queue.then(run, run);
  queue = next.catch(() => undefined);
  return next;
}

export async function getScheduled() {
  if (!isSupported) return [];
  return Notifications.getAllScheduledNotificationsAsync();
}

/** 개발용: 5초 뒤 테스트 알림 */
export async function sendTestNotification() {
  if (!isSupported) return;
  await Notifications.scheduleNotificationAsync({
    content: { ...MESSAGES.daily, data: { url: '/' } },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 5,
      ...(Platform.OS === 'android' ? { channelId: CHANNEL_ID } : {}),
    },
  });
}

export function describeDaily(settings: Settings) {
  if (!settings.dailyReminderOn || !settings.repeatDays.some(Boolean)) return null;
  const days = settings.repeatDays.every(Boolean)
    ? '매일'
    : settings.repeatDays.slice(1, 6).every(Boolean) && !settings.repeatDays[0] && !settings.repeatDays[6]
      ? '평일'
      : '선택한 요일';
  return `${days} ${formatKoreanTime(settings.dailyReminderTime)}`;
}

