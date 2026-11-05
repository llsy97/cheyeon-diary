import { NanumPenScript_400Regular } from '@expo-google-fonts/nanum-pen-script';
import {
  NotoSansKR_400Regular,
  NotoSansKR_500Medium,
  NotoSansKR_700Bold,
  useFonts,
} from '@expo-google-fonts/noto-sans-kr';
import { router, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { addMonths, monthOf } from '@/lib/date';
import { goalsOfMonth } from '@/lib/stats';
import { DataProvider, useAppData } from '@/store/DataContext';
import { NotificationProvider } from '@/store/NotificationContext';
import { colors } from '@/theme';

SplashScreen.preventAutoHideAsync();

/**
 * 새 달이 시작됐는데 이번 달 목표가 없고 지난달 목표가 있으면
 * '지난달 목표 이어가기 / 새로 정하기' 화면을 한 번 띄운다.
 * (1일에 앱을 안 열어도, 그 달 처음 열 때 뜬다)
 */
function MonthSetupGate() {
  const { loaded, goals, today, meta } = useAppData();
  useEffect(() => {
    if (!loaded) return;
    const month = monthOf(today);
    if (meta.monthSetupDoneFor === month) return;
    if (goalsOfMonth(goals, month).length > 0) return;
    if (goalsOfMonth(goals, addMonths(month, -1)).length === 0) return;
    const t = setTimeout(() => router.push('/month-setup'), 300);
    return () => clearTimeout(t);
  }, [loaded, today, meta.monthSetupDoneFor, goals]);
  return null;
}

function Root() {
  const { loaded } = useAppData();
  const [fontsLoaded, fontError] = useFonts({
    NotoSansKR_400Regular,
    NotoSansKR_500Medium,
    NotoSansKR_700Bold,
    NanumPenScript_400Regular,
  });
  const ready = loaded && (fontsLoaded || !!fontError);

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;
  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="month-setup" options={{ presentation: 'modal', gestureEnabled: false }} />
      </Stack>
      <MonthSetupGate />
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <DataProvider>
        <NotificationProvider>
          <Root />
        </NotificationProvider>
      </DataProvider>
    </SafeAreaProvider>
  );
}
