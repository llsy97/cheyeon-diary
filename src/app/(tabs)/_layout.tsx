import { Tabs } from 'expo-router';
import { Bell, CalendarDays, ChartColumn, PenLine, Target } from 'lucide-react-native';
import type { ColorValue } from 'react-native';
import { colors, fonts } from '@/theme';

function icon(Icon: typeof PenLine) {
  function TabIcon({ color }: { color: ColorValue }) {
    return <Icon size={22} color={String(color)} strokeWidth={1.8} />;
  }
  return TabIcon;
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.point,
        tabBarInactiveTintColor: colors.subtext,
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border, minHeight: 60 },
        tabBarLabelStyle: { fontFamily: fonts.medium, fontSize: 11 },
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen name="index" options={{ title: '오늘', tabBarIcon: icon(PenLine) }} />
      <Tabs.Screen name="calendar" options={{ title: '달력', tabBarIcon: icon(CalendarDays) }} />
      <Tabs.Screen name="stats" options={{ title: '통계', tabBarIcon: icon(ChartColumn) }} />
      <Tabs.Screen name="goals" options={{ title: '목표', tabBarIcon: icon(Target) }} />
      <Tabs.Screen name="notifications" options={{ title: '알림', tabBarIcon: icon(Bell) }} />
    </Tabs>
  );
}
