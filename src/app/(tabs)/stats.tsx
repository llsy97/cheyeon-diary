import { router } from 'expo-router';
import { Trophy } from 'lucide-react-native';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Donut } from '@/components/charts/Donut';
import { HBarChart } from '@/components/charts/HBarChart';
import { VBarChart } from '@/components/charts/VBarChart';
import { GoalIcon } from '@/components/GoalIcon';
import { Button, Card, CardTitle, Screen, Txt } from '@/components/ui';
import { formatKoreanMonth, monthOf } from '@/lib/date';
import { computeMonthStats } from '@/lib/stats';
import { useAppData } from '@/store/DataContext';
import { colors, radius, space } from '@/theme';

export default function StatsScreen() {
  const { goals, checks, today } = useAppData();
  const month = monthOf(today);
  const stats = useMemo(() => computeMonthStats(goals, checks, month, today), [goals, checks, month, today]);

  if (stats.perGoal.length === 0) {
    return (
      <Screen title="통계" subtitle={formatKoreanMonth(month)}>
        <Card>
          <Txt color={colors.subtext}>이번 달 목표를 정하면 달성률을 보여드려요.</Txt>
          <Button label="목표 정하러 가기" variant="soft" onPress={() => router.navigate('/goals')} />
        </Card>
      </Screen>
    );
  }

  const best = stats.bestStreakGoal;
  const ranked = [...stats.perGoal].sort((a, b) => b.rate - a.rate);

  return (
    <Screen title="통계" subtitle={formatKoreanMonth(month)}>
      <Card>
        <CardTitle>이번 달 전체 달성률</CardTitle>
        <View style={styles.donutRow}>
          <Donut done={stats.done} possible={stats.possible} />
          <View style={{ flex: 1, gap: space.md }}>
            <View>
              <Txt size={13} color={colors.subtext}>
                완료
              </Txt>
              <Txt weight="bold" size={20}>
                {stats.done}회
              </Txt>
            </View>
            <View>
              <Txt size={13} color={colors.subtext}>
                가능
              </Txt>
              <Txt weight="bold" size={20}>
                {stats.possible}회
              </Txt>
            </View>
            <Txt size={12} color={colors.subtext}>
              목표 {stats.perGoal.length}개 × 지난 {stats.elapsedDays}일 기준
            </Txt>
          </View>
        </View>
      </Card>

      <Card style={styles.bestCard}>
        <View style={styles.trophy}>
          <Trophy size={22} color={colors.streakText} strokeWidth={1.8} />
        </View>
        <View style={{ flex: 1 }}>
          <Txt size={13} color={colors.subtext}>
            최장 연속 기록 목표
          </Txt>
          {best ? (
            <Txt weight="bold" size={16}>
              {best.goal.name} · {best.longestStreak}일 연속
            </Txt>
          ) : (
            <Txt weight="medium" size={15}>
              아직 연속 기록이 없어요
            </Txt>
          )}
        </View>
      </Card>

      <Card>
        <CardTitle>목표별 달성률</CardTitle>
        <HBarChart
          items={ranked.map((g) => ({
            key: g.goal.id,
            label: g.goal.name,
            icon: <GoalIcon icon={g.goal.icon} size={16} />,
            value: g.rate,
            caption: `${g.done}/${g.possible}`,
          }))}
        />
      </Card>

      <Card>
        <CardTitle
          right={
            <Txt size={12} color={colors.subtext}>
              최대 {stats.perGoal.length}개
            </Txt>
          }
        >
          일별 달성 개수
        </CardTitle>
        <VBarChart values={stats.daily} max={stats.perGoal.length} highlightIndex={stats.elapsedDays - 1} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  donutRow: { flexDirection: 'row', alignItems: 'center', gap: space.xl },
  bestCard: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  trophy: {
    width: 44,
    height: 44,
    borderRadius: radius.chip,
    backgroundColor: colors.streakBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
