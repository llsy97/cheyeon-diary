import { router } from 'expo-router';
import { PenLine, RotateCcw } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GoalIcon } from '@/components/GoalIcon';
import { Card, Txt } from '@/components/ui';
import { addMonths, formatKoreanMonth, formatKoreanTime, monthOf, parseMonthKey } from '@/lib/date';
import { useAppData, useMonthGoals } from '@/store/DataContext';
import { colors, radius, space } from '@/theme';

/** 매월 첫 실행 시: 지난달 목표 이어가기 / 새로 정하기 */
export default function MonthSetupScreen() {
  const insets = useSafeAreaInsets();
  const { today, continueLastMonthGoals, updateMeta } = useAppData();
  const month = monthOf(today);
  const lastGoals = useMonthGoals(addMonths(month, -1));
  const monthNum = parseMonthKey(month).month + 1;

  const close = (href: '/' | '/goals') => {
    if (router.canGoBack()) router.back();
    router.navigate(href);
  };

  const onContinue = () => {
    continueLastMonthGoals();
    close('/');
  };
  const onFresh = () => {
    updateMeta({ monthSetupDoneFor: month });
    close('/goals');
  };

  return (
    <View style={[styles.wrap, { paddingTop: insets.top + space.xxl, paddingBottom: insets.bottom + space.lg }]}>
      <Txt size={14} color={colors.subtext}>
        {formatKoreanMonth(month)}
      </Txt>
      <Txt weight="bold" size={26} style={{ marginBottom: space.lg }}>
        {monthNum}월이 시작됐어요.{'\n'}이번 달 목표는 어떻게 할까요?
      </Txt>

      <Card>
        <Txt weight="bold">지난달 목표</Txt>
        <View style={{ gap: space.sm }}>
          {lastGoals.map((g) => (
            <View key={g.id} style={styles.goal}>
              <GoalIcon icon={g.icon} size={18} />
              <Txt style={{ flex: 1 }}>{g.name}</Txt>
              {g.reminderTime ? (
                <Txt size={12} color={colors.subtext}>
                  {formatKoreanTime(g.reminderTime)}
                </Txt>
              ) : null}
            </View>
          ))}
        </View>
      </Card>

      <View style={{ flex: 1 }} />

      <Pressable
        onPress={onContinue}
        accessibilityRole="button"
        style={({ pressed }) => [styles.option, styles.primary, pressed && { opacity: 0.85 }]}
      >
        <RotateCcw size={22} color={colors.white} />
        <View style={{ flex: 1 }}>
          <Txt weight="bold" size={16} color={colors.white}>
            지난달 목표 이어가기
          </Txt>
          <Txt size={13} color="#D7EBE3">
            {lastGoals.length}개 목표와 알림 시간을 그대로 가져와요
          </Txt>
        </View>
      </Pressable>
      <Pressable
        onPress={onFresh}
        accessibilityRole="button"
        style={({ pressed }) => [styles.option, styles.secondary, pressed && { opacity: 0.85 }]}
      >
        <PenLine size={22} color={colors.point} />
        <View style={{ flex: 1 }}>
          <Txt weight="bold" size={16} color={colors.point}>
            새로 정하기
          </Txt>
          <Txt size={13} color={colors.subtext}>
            목표 화면에서 이번 달 목표를 새로 골라요
          </Txt>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: space.lg, gap: space.md },
  goal: { flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: 32 },
  option: {
    minHeight: 72,
    borderRadius: radius.card,
    paddingHorizontal: space.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.lg,
  },
  primary: { backgroundColor: colors.point },
  secondary: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.pointSoft },
});
