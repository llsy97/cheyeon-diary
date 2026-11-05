import { Check, ChevronLeft, ChevronRight, Circle } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Card, Chip, IconButton, Screen, Txt } from '@/components/ui';
import {
  addMonths,
  dateInMonth,
  daysInMonth,
  firstWeekday,
  formatKoreanDate,
  formatKoreanMonth,
  monthOf,
  WEEKDAY_SHORT,
} from '@/lib/date';
import { doneCountOn, heatLevel, isDone } from '@/lib/stats';
import type { DateKey } from '@/lib/types';
import { useAppData, useMonthGoals } from '@/store/DataContext';
import { colors, fonts, space, TOUCH } from '@/theme';

function Legend({ total }: { total: number }) {
  return (
    <View style={styles.legend}>
      <Txt size={12} color={colors.subtext}>
        0개
      </Txt>
      {colors.heat.map((c) => (
        <View key={c} style={[styles.legendCell, { backgroundColor: c }]} />
      ))}
      <Txt size={12} color={colors.subtext}>
        {total ? `${total}개 모두` : '전체'}
      </Txt>
    </View>
  );
}

export default function CalendarScreen() {
  const { today, diary, checks } = useAppData();
  const thisMonth = monthOf(today);
  const [month, setMonth] = useState(thisMonth);
  const [selected, setSelected] = useState<DateKey | null>(today);
  const goals = useMonthGoals(month);

  const cells = useMemo(() => {
    const lead = firstWeekday(month);
    const n = daysInMonth(month);
    const arr: (DateKey | null)[] = Array.from({ length: lead }, () => null);
    for (let d = 1; d <= n; d++) arr.push(dateInMonth(month, d));
    while (arr.length % 7) arr.push(null);
    return arr;
  }, [month]);

  const go = (delta: number) => {
    const next = addMonths(month, delta);
    if (next > thisMonth) return;
    setMonth(next);
    setSelected(next === thisMonth ? today : null);
  };

  const sel = selected && monthOf(selected) === month ? selected : null;

  return (
    <Screen title="달력" subtitle="날짜 칸의 색이 진할수록 목표를 많이 해낸 날이에요">
      <Card style={styles.calendarCard}>
        <View style={styles.monthNav}>
          <IconButton label="이전 달" onPress={() => go(-1)}>
            <ChevronLeft size={22} color={colors.text} />
          </IconButton>
          <Txt weight="bold" size={17}>
            {formatKoreanMonth(month)}
          </Txt>
          <IconButton label="다음 달" onPress={() => go(1)} disabled={month >= thisMonth}>
            <ChevronRight size={22} color={colors.text} />
          </IconButton>
        </View>

        <View style={styles.grid}>
          {WEEKDAY_SHORT.map((w, i) => (
            <View key={w} style={styles.weekCell}>
              <Txt
                size={12}
                weight="medium"
                color={i === 0 ? colors.streakText : colors.subtext}
              >
                {w}
              </Txt>
            </View>
          ))}
          {cells.map((date, i) => {
            if (!date) return <View key={`e${i}`} style={styles.cell} />;
            const future = date > today;
            const done = future ? 0 : doneCountOn(checks, date, goals);
            const level = heatLevel(done, goals.length);
            const isSel = date === sel;
            const isToday = date === today;
            const hasDiary = !!diary[date];
            const textColor = level >= 3 ? colors.white : colors.text;
            return (
              <View key={date} style={styles.cell}>
                <Pressable
                  disabled={future}
                  onPress={() => setSelected(date)}
                  accessibilityRole="button"
                  accessibilityLabel={`${formatKoreanDate(date)}, 목표 ${done}개 달성${hasDiary ? ', 일기 있음' : ''}`}
                  accessibilityState={{ selected: isSel, disabled: future }}
                  style={({ pressed }) => [
                    styles.day,
                    { backgroundColor: future ? 'transparent' : colors.heat[level] },
                    isSel && styles.daySelected,
                    pressed && { opacity: 0.7 },
                  ]}
                >
                  <Txt
                    size={14}
                    weight={isToday ? 'bold' : 'regular'}
                    color={future ? '#B9C2BD' : textColor}
                  >
                    {Number(date.slice(8))}
                  </Txt>
                  {hasDiary ? (
                    <View style={[styles.dot, { backgroundColor: level >= 3 ? colors.white : colors.point }]} />
                  ) : null}
                </Pressable>
              </View>
            );
          })}
        </View>
        <Legend total={goals.length} />
      </Card>

      {sel ? (
        <Card>
          <Txt weight="bold" size={16}>
            {formatKoreanDate(sel)}
          </Txt>
          {diary[sel] ? (
            <Txt style={{ fontFamily: fonts.pen, fontSize: 26, lineHeight: 34 }}>{diary[sel].line}</Txt>
          ) : (
            <Txt size={14} color={colors.subtext}>
              이 날은 한 줄 기록이 없어요
            </Txt>
          )}
          {goals.length ? (
            <View style={styles.chips}>
              {goals.map((g) => {
                const done = isDone(checks, sel, g.id);
                return (
                  <Chip
                    key={g.id}
                    label={g.name}
                    active={done}
                    icon={
                      done ? (
                        <Check size={15} color={colors.point} strokeWidth={2.6} />
                      ) : (
                        <Circle size={15} color="#A8B3AD" />
                      )
                    }
                  />
                );
              })}
            </View>
          ) : (
            <Txt size={13} color={colors.subtext}>
              이 달에는 정한 목표가 없어요
            </Txt>
          )}
        </Card>
      ) : (
        <Card>
          <Txt size={14} color={colors.subtext}>
            날짜를 누르면 그날의 기록을 볼 수 있어요
          </Txt>
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  calendarCard: { paddingHorizontal: space.sm, gap: space.sm },
  monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  weekCell: { width: `${100 / 7}%`, alignItems: 'center', paddingVertical: space.xs },
  cell: { width: `${100 / 7}%`, aspectRatio: 1, padding: 2, minHeight: TOUCH },
  day: {
    flex: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  daySelected: { borderColor: colors.text },
  dot: { position: 'absolute', bottom: 5, width: 4, height: 4, borderRadius: 2 },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    paddingHorizontal: space.sm,
    paddingBottom: space.xs,
  },
  legendCell: { width: 14, height: 14, borderRadius: 4 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
});
