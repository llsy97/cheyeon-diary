import { router } from 'expo-router';
import { Bell, BellOff, Check, ChevronRight, Flame, Plus } from 'lucide-react-native';
import { useState } from 'react';
import { Keyboard, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { GoalIcon } from '@/components/GoalIcon';
import { Button, Card, CardTitle, ProgressBar, Screen, Txt } from '@/components/ui';
import { formatKoreanDate, formatKoreanTime } from '@/lib/date';
import { describeDaily } from '@/lib/notifications';
import { diaryStreak, isDone } from '@/lib/stats';
import { DIARY_MAX_LENGTH, NUDGE_TIME } from '@/lib/types';
import { useAppData, useMonthGoals } from '@/store/DataContext';
import { useNotifications } from '@/store/NotificationContext';
import { colors, fonts, radius, space, TOUCH } from '@/theme';

function StreakBadge({ days }: { days: number }) {
  return (
    <View style={styles.badge} accessibilityLabel={`연속 기록 ${days}일`}>
      <Flame size={16} color={colors.streakText} strokeWidth={2} />
      <Txt weight="bold" size={14} color={colors.streakText}>
        {days}일 연속
      </Txt>
    </View>
  );
}

function DiaryCard() {
  const { diary, today, saveDiary } = useAppData();
  const saved = diary[today]?.line ?? '';
  const [draft, setDraft] = useState(saved);
  const [justSaved, setJustSaved] = useState(false);

  const dirty = draft.trim() !== saved;
  const onSave = () => {
    saveDiary(today, draft);
    setDraft(draft.trim());
    Keyboard.dismiss();
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 1600);
  };

  return (
    <Card>
      <CardTitle
        right={
          saved && !dirty ? (
            <View style={styles.savedTag}>
              <Check size={14} color={colors.point} strokeWidth={2.4} />
              <Txt size={12} weight="medium" color={colors.point}>
                {justSaved ? '저장했어요' : '기록 완료'}
              </Txt>
            </View>
          ) : null
        }
      >
        오늘의 한 줄
      </CardTitle>
      <TextInput
        value={draft}
        onChangeText={(t) => setDraft(t.replace(/\n/g, ' '))}
        maxLength={DIARY_MAX_LENGTH}
        placeholder="오늘을 한 줄로 남겨보세요"
        placeholderTextColor="#9AA6A0"
        multiline
        submitBehavior="blurAndSubmit"
        returnKeyType="done"
        onSubmitEditing={() => dirty && onSave()}
        style={styles.input}
        accessibilityLabel="오늘의 한 줄 일기"
      />
      <View style={styles.inputFooter}>
        <Txt size={13} color={draft.length >= DIARY_MAX_LENGTH ? colors.streakText : colors.subtext}>
          {draft.length} / {DIARY_MAX_LENGTH}
        </Txt>
        <Button label={saved ? '수정 저장' : '저장'} onPress={onSave} disabled={!dirty} style={{ minWidth: 96 }} />
      </View>
    </Card>
  );
}

function GoalChecklist() {
  const { checks, today, toggleCheck } = useAppData();
  const goals = useMonthGoals();
  const doneCount = goals.filter((g) => isDone(checks, today, g.id)).length;

  return (
    <Card>
      <CardTitle
        right={
          goals.length ? (
            <Txt size={14} weight="bold" color={colors.point}>
              {doneCount} / {goals.length}
            </Txt>
          ) : null
        }
      >
        이번 달 목표
      </CardTitle>

      {goals.length === 0 ? (
        <Pressable onPress={() => router.navigate('/goals')} style={styles.emptyGoals} accessibilityRole="button">
          <Plus size={18} color={colors.point} />
          <Txt weight="medium" color={colors.point}>
            이번 달 목표를 정해보세요
          </Txt>
        </Pressable>
      ) : (
        <>
          <ProgressBar value={doneCount / goals.length} />
          <View style={{ gap: space.xs }}>
            {goals.map((g) => {
              const done = isDone(checks, today, g.id);
              return (
                <Pressable
                  key={g.id}
                  onPress={() => toggleCheck(today, g.id)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: done }}
                  accessibilityLabel={g.name}
                  style={({ pressed }) => [styles.goalRow, pressed && { backgroundColor: colors.bg }]}
                >
                  <View style={[styles.goalIcon, done && { backgroundColor: colors.pointSoft }]}>
                    <GoalIcon icon={g.icon} size={18} color={done ? colors.point : colors.subtext} />
                  </View>
                  <Txt
                    size={15}
                    weight="medium"
                    color={done ? colors.subtext : colors.text}
                    style={[{ flex: 1 }, done && { textDecorationLine: 'line-through' }]}
                  >
                    {g.name}
                  </Txt>
                  <View style={[styles.checkbox, done && styles.checkboxOn]}>
                    {done ? <Check size={16} color={colors.white} strokeWidth={3} /> : null}
                  </View>
                </Pressable>
              );
            })}
          </View>
          {doneCount === goals.length ? (
            <Txt size={13} color={colors.point} weight="medium" style={{ textAlign: 'center' }}>
              오늘 목표를 모두 해냈어요!
            </Txt>
          ) : null}
        </>
      )}
    </Card>
  );
}

function ReminderInfoCard() {
  const { settings } = useAppData();
  const { permission } = useNotifications();
  const daily = describeDaily(settings);
  const off = permission === 'denied' || !daily;

  let text: string;
  if (permission === 'unsupported') text = '알림은 휴대폰 앱에서 동작해요';
  else if (permission === 'denied') text = '알림 권한이 꺼져 있어요. 눌러서 확인해 주세요';
  else if (!daily) text = '기록 알림이 꺼져 있어요';
  else text = `${daily}에 기록 알림을 보내드려요`;

  return (
    <Pressable onPress={() => router.navigate('/notifications')} accessibilityRole="button">
      {({ pressed }) => (
        <Card style={[styles.infoCard, pressed && { opacity: 0.8 }]}>
          <View style={styles.infoIcon}>
            {off ? <BellOff size={20} color={colors.subtext} /> : <Bell size={20} color={colors.point} />}
          </View>
          <View style={{ flex: 1 }}>
            <Txt weight="medium" size={14}>
              {text}
            </Txt>
            {!off && settings.nudgeOn ? (
              <Txt size={12} color={colors.subtext}>
                {formatKoreanTime(NUDGE_TIME)}까지 기록이 없으면 한 번 더 알려드려요
              </Txt>
            ) : null}
          </View>
          <ChevronRight size={18} color={colors.subtext} />
        </Card>
      )}
    </Pressable>
  );
}

export default function TodayScreen() {
  const { diary, today } = useAppData();
  const streak = diaryStreak(diary, today);
  return (
    <Screen title={formatKoreanDate(today)} subtitle="하루한줄" right={<StreakBadge days={streak} />}>
      {/* key: 자정이 지나면 입력칸을 새 날짜 기준으로 다시 만든다 */}
      <DiaryCard key={today} />
      <GoalChecklist />
      <ReminderInfoCard />
    </Screen>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.streakBg,
    paddingHorizontal: 12,
    height: 34,
    borderRadius: radius.chip,
    marginBottom: 2,
  },
  savedTag: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  input: {
    fontFamily: fonts.pen,
    fontSize: 28,
    lineHeight: 36,
    color: colors.text,
    minHeight: 92,
    paddingHorizontal: space.md,
    paddingVertical: space.md,
    backgroundColor: colors.bg,
    borderRadius: radius.field,
    textAlignVertical: 'top',
  },
  inputFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  emptyGoals: {
    minHeight: 56,
    borderRadius: radius.field,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.point,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
  },
  goalRow: {
    minHeight: TOUCH + 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.xs,
    borderRadius: radius.field,
  },
  goalIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: { backgroundColor: colors.point, borderColor: colors.point },
  infoCard: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.lg },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
