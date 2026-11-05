import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { AppState, Linking } from 'react-native';
import {
  configureNotifications,
  getPermission,
  getScheduled,
  isSupported,
  requestPermission,
  rescheduleAll,
  type PermissionState,
} from '@/lib/notifications';
import { useAppData, useMonthGoals } from './DataContext';

interface NotificationContextValue {
  permission: PermissionState;
  request: () => Promise<void>;
  openSystemSettings: () => void;
  scheduled: Notifications.NotificationRequest[];
  refreshScheduled: () => Promise<void>;
}

const Ctx = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { loaded, settings, diary, today, meta, updateMeta } = useAppData();
  const goals = useMonthGoals();
  const [permission, setPermission] = useState<PermissionState>(isSupported ? 'undetermined' : 'unsupported');
  const [scheduled, setScheduled] = useState<Notifications.NotificationRequest[]>([]);

  const refreshScheduled = useCallback(async () => setScheduled(await getScheduled()), []);

  // 1) 채널/핸들러 설정 + 첫 실행 시 권한 요청
  useEffect(() => {
    if (!loaded || !isSupported) return;
    (async () => {
      await configureNotifications();
      let state = await getPermission();
      if (state === 'undetermined' && !meta.askedNotificationPermission) {
        state = await requestPermission();
        updateMeta({ askedNotificationPermission: true });
      }
      setPermission(state);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);

  // 설정 앱에서 권한을 바꾸고 돌아온 경우 반영
  useEffect(() => {
    if (!isSupported) return;
    const sub = AppState.addEventListener('change', async (s) => {
      if (s === 'active') setPermission(await getPermission());
    });
    return () => sub.remove();
  }, []);

  // 알림을 누르면 오늘 탭으로
  useEffect(() => {
    if (!isSupported) return;
    const sub = Notifications.addNotificationResponseReceivedListener(() => router.navigate('/'));
    return () => sub.remove();
  }, []);

  // 2) 설정·목표·오늘 일기 여부가 바뀌면 전부 취소 후 재예약
  const wroteToday = Boolean(diary[today]);
  // 23시 알림에 영향을 주는 앞으로 2주간의 일기 여부만 의존성으로 삼는다
  const diaryKeys = Object.keys(diary).filter((d) => d >= today).sort().join(',');
  const goalSig = goals.map((g) => `${g.id}:${g.name}:${g.reminderTime ?? ''}`).join('|');
  useEffect(() => {
    if (!loaded || permission !== 'granted') return;
    const t = setTimeout(() => {
      rescheduleAll({ settings, goals, diary, today }).then(refreshScheduled);
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, permission, settings, goalSig, wroteToday, diaryKeys, today]);

  const request = useCallback(async () => {
    const state = await requestPermission();
    setPermission(state);
    updateMeta({ askedNotificationPermission: true });
  }, [updateMeta]);

  const value = useMemo(
    () => ({
      permission,
      request,
      openSystemSettings: () => Linking.openSettings(),
      scheduled: permission === 'granted' ? scheduled : [],
      refreshScheduled,
    }),
    [permission, request, scheduled, refreshScheduled],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useNotifications() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useNotifications 는 NotificationProvider 안에서만 사용할 수 있어요');
  return ctx;
}
