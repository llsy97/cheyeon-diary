import type { NotificationRequest } from 'expo-notifications';
import { router } from 'expo-router';
import { BellOff, Info, PenLine } from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Switch, View } from 'react-native';
import { GoalIcon } from '@/components/GoalIcon';
import { TimePickerField } from '@/components/TimePickerField';
import { Button, Card, CardTitle, Divider, Screen, Txt } from '@/components/ui';
import { formatKoreanTime, toTimeString, WEEKDAY_SHORT } from '@/lib/date';
import { describeDaily, MESSAGES, sendTestNotification } from '@/lib/notifications';
import { NUDGE_TIME } from '@/lib/types';
import { useAppData, useMonthGoals, useSettings } from '@/store/DataContext';
import { useNotifications } from '@/store/NotificationContext';
import { colors, radius, space, TOUCH } from '@/theme';

function Toggle({ value, onValueChange, label }: { value: boolean; onValueChange: (v: boolean) => void; label: string }) {
  return (
    <Switch
      value={value}
      onValueChange={onValueChange}
      accessibilityLabel={label}
      trackColor={{ false: '#D5DCD8', true: colors.point }}
      thumbColor={colors.white}
      ios_backgroundColor="#D5DCD8"
    />
  );
}

function Row({ title, desc, right }: { title: string; desc?: string; right: ReactNode }) {
  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Txt weight="medium">{title}</Txt>
        {desc ? (
          <Txt size={13} color={colors.subtext}>
            {desc}
          </Txt>
        ) : null}
      </View>
      {right}
    </View>
  );
}

function PermissionBanner() {
  const { permission, request, openSystemSettings } = useNotifications();
  if (permission === 'granted') return null;
  const content = {
    denied: {
      text: '알림 권한이 꺼져 있어서 알림을 보낼 수 없어요. 휴대폰 설정 > 하루한줄 > 알림에서 허용해 주세요.',
      action: <Button label="설정 열기" variant="soft" onPress={openSystemSettings} />,
    },
    undetermined: {
      text: '알림을 허용하면 기록할 시간을 잊지 않게 알려드려요.',
      action: <Button label="알림 허용하기" onPress={request} />,
    },
    unsupported: {
      text: '웹 미리보기에서는 알림이 동작하지 않아요. 휴대폰(Expo Go 또는 앱)에서 확인해 주세요.',
      action: null,
    },
  }[permission];
  return (
    <Card style={styles.banner}>
      <View style={styles.bannerHead}>
        <BellOff size={20} color={colors.streakText} />
        <Txt weight="bold" color={colors.streakText}>
          알림이 꺼져 있어요
        </Txt>
      </View>
      <Txt size={14} color={colors.text}>
        {content.text}
      </Txt>
      {content.action}
    </Card>
  );
}

function PreviewCard() {
  const { settings } = useAppData();
  const daily = describeDaily(settings);
  return (
    <Card>
      <CardTitle>알림 미리보기</CardTitle>
      <View style={styles.preview}>
        <View style={styles.appIcon}>
          <PenLine size={18} color={colors.white} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.previewHead}>
            <Txt size={13} weight="bold">
              {MESSAGES.daily.title}
            </Txt>
            <Txt size={12} color={colors.subtext}>
              {settings.dailyReminderOn ? formatKoreanTime(settings.dailyReminderTime) : '꺼짐'}
            </Txt>
          </View>
          <Txt size={14}>{MESSAGES.daily.body}</Txt>
        </View>
      </View>
      <Txt size={13} color={colors.subtext}>
        {daily ? `${daily}에 이렇게 알려드려요.` : '매일 기록 알림이 꺼져 있어요.'}
        {settings.nudgeOn ? ` ${formatKoreanTime(NUDGE_TIME)}까지 기록이 없으면 한 번 더 알려드려요.` : ''}
      </Txt>
    </Card>
  );
}

function describeTrigger(r: NotificationRequest): string {
  const t = r.trigger as unknown as Record<string, unknown> | null;
  if (!t) return '';
  const hm = typeof t.hour === 'number' && typeof t.minute === 'number' ? formatKoreanTime(toTimeString(t.hour, t.minute as number)) : '';
  if (typeof t.weekday === 'number') return `매주 ${WEEKDAY_SHORT[t.weekday - 1]}요일 ${hm}`;
  if (hm) return `매일 ${hm}`;
  const raw = t.value ?? t.date ?? (t.dateComponents as Record<string, unknown> | undefined);
  if (typeof raw === 'number' || typeof raw === 'string') {
    const d = new Date(raw);
    return `${d.getMonth() + 1}/${d.getDate()} ${formatKoreanTime(toTimeString(d.getHours(), d.getMinutes()))}`;
  }
  return r.identifier.startsWith('nudge-') ? `${r.identifier.slice(6)} 23:00` : '';
}

function ScheduledList() {
  const { scheduled, permission } = useNotifications();
  const [expanded, setExpanded] = useState(false);
  if (permission !== 'granted') return null;
  const sorted = [...scheduled].sort((a, b) => a.identifier.localeCompare(b.identifier));
  const shown = expanded ? sorted : sorted.slice(0, 4);
  return (
    <Card>
      <CardTitle
        right={
          <Txt size={13} color={colors.subtext}>
            {scheduled.length}개
          </Txt>
        }
      >
        예약된 알림
      </CardTitle>
      {scheduled.length === 0 ? (
        <Txt size={14} color={colors.subtext}>
          예약된 알림이 없어요
        </Txt>
      ) : (
        shown.map((r) => (
          <View key={r.identifier} style={styles.schedRow}>
            <Txt size={14} style={{ flex: 1 }} numberOfLines={1}>
              {r.identifier.startsWith('nudge-') ? '23시 리마인드' : r.content.title}
            </Txt>
            <Txt size={13} color={colors.subtext}>
              {describeTrigger(r)}
            </Txt>
          </View>
        ))
      )}
      {sorted.length > 4 ? (
        <Button variant="ghost" label={expanded ? '접기' : `모두 보기 (${sorted.length})`} onPress={() => setExpanded(!expanded)} />
      ) : null}
    </Card>
  );
}

function DevTools() {
  const { seedSampleData, resetAll, updateMeta } = useAppData();
  const [confirmReset, setConfirmReset] = useState(false);
  return (
    <Card style={{ borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed' }}>
      <CardTitle>개발용 도구</CardTitle>
      <Txt size={12} color={colors.subtext}>
        개발 모드에서만 보여요. 단계별 확인용입니다.
      </Txt>
      <Button variant="soft" label="샘플 데이터 채우기 (최근 45일)" onPress={seedSampleData} />
      <Button variant="soft" label="5초 뒤 테스트 알림" onPress={sendTestNotification} />
      <Button
        variant="soft"
        label="월초 선택 화면 열기"
        onPress={() => {
          updateMeta({ monthSetupDoneFor: undefined });
          router.push('/month-setup');
        }}
      />
      <Button
        variant={confirmReset ? 'primary' : 'ghost'}
        label={confirmReset ? '정말 모두 지울까요? 한 번 더 누르세요' : '모든 데이터 지우기'}
        onPress={() => {
          if (confirmReset) {
            resetAll();
            setConfirmReset(false);
          } else setConfirmReset(true);
        }}
        style={confirmReset ? { backgroundColor: colors.danger } : undefined}
      />
    </Card>
  );
}

export default function NotificationsScreen() {
  const [settings, update] = useSettings();
  const { updateGoal } = useAppData();
  const goals = useMonthGoals();
  const { permission } = useNotifications();
  const blocked = permission === 'denied';

  const toggleDay = (i: number) => {
    const next = [...settings.repeatDays];
    next[i] = !next[i];
    update({ repeatDays: next });
  };

  return (
    <Screen title="알림" subtitle="기록할 시간을 알려드려요">
      <PermissionBanner />
      <PreviewCard />

      <Card style={blocked && { opacity: 0.6 }}>
        <Row
          title="매일 기록 알림"
          desc="한 줄 일기를 쓸 시간을 알려드려요"
          right={
            <Toggle label="매일 기록 알림" value={settings.dailyReminderOn} onValueChange={(v) => update({ dailyReminderOn: v })} />
          }
        />
        <Divider />
        <Row
          title="알림 시간"
          right={
            <TimePickerField
              label="기록 알림 시간"
              value={settings.dailyReminderTime}
              onChange={(t) => update({ dailyReminderTime: t })}
              disabled={!settings.dailyReminderOn}
            />
          }
        />
        <Divider />
        <Txt weight="medium">반복 요일</Txt>
        <View style={styles.days}>
          {WEEKDAY_SHORT.map((w, i) => {
            const on = settings.repeatDays[i];
            return (
              <Pressable
                key={w}
                onPress={() => toggleDay(i)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: on }}
                accessibilityLabel={`${w}요일`}
                style={[styles.day, on && styles.dayOn]}
              >
                <Txt weight="bold" size={14} color={on ? colors.white : colors.subtext}>
                  {w}
                </Txt>
              </Pressable>
            );
          })}
        </View>
        {!settings.repeatDays.some(Boolean) ? (
          <Txt size={13} color={colors.streakText}>
            요일을 하나 이상 골라야 알림이 가요
          </Txt>
        ) : null}
        <Divider />
        <Row
          title={`${formatKoreanTime(NUDGE_TIME)} 한 번 더 알림`}
          desc="23시까지 기록이 없으면 한 번 더 알려드려요. 이미 썼으면 보내지 않아요."
          right={<Toggle label="23시 한 번 더 알림" value={settings.nudgeOn} onValueChange={(v) => update({ nudgeOn: v })} />}
        />
      </Card>

      <Card style={blocked && { opacity: 0.6 }}>
        <CardTitle>목표별 알림</CardTitle>
        {goals.length === 0 ? (
          <Txt size={14} color={colors.subtext}>
            이번 달 목표를 추가하면 목표마다 알림을 정할 수 있어요
          </Txt>
        ) : (
          goals.map((g, i) => (
            <View key={g.id} style={{ gap: space.sm }}>
              {i > 0 ? <Divider /> : null}
              <View style={styles.row}>
                <GoalIcon icon={g.icon} size={18} />
                <Txt weight="medium" style={{ flex: 1 }}>
                  {g.name}
                </Txt>
                {g.reminderTime ? (
                  <TimePickerField
                    label={`${g.name} 알림 시간`}
                    value={g.reminderTime}
                    onChange={(t) => updateGoal(g.id, { reminderTime: t })}
                  />
                ) : null}
                <Toggle
                  label={`${g.name} 알림`}
                  value={!!g.reminderTime}
                  onValueChange={(v) => updateGoal(g.id, { reminderTime: v ? '08:00' : undefined })}
                />
              </View>
            </View>
          ))
        )}
      </Card>

      <ScheduledList />

      <View style={styles.note}>
        <Info size={14} color={colors.subtext} />
        <Txt size={12} color={colors.subtext} style={{ flex: 1 }}>
          설정을 바꾸면 기존 예약을 모두 취소하고 새로 예약해요. 모든 기록은 이 휴대폰에만 저장돼요.
        </Txt>
      </View>

      {__DEV__ ? <DevTools /> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: TOUCH },
  banner: { backgroundColor: colors.streakBg },
  bannerHead: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  preview: {
    flexDirection: 'row',
    gap: space.md,
    padding: space.md,
    backgroundColor: colors.bg,
    borderRadius: radius.field,
  },
  previewHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  appIcon: {
    width: 36,
    height: 36,
    borderRadius: 9,
    backgroundColor: colors.point,
    alignItems: 'center',
    justifyContent: 'center',
  },
  days: { flexDirection: 'row', justifyContent: 'space-between', gap: 4 },
  day: {
    flex: 1,
    maxWidth: TOUCH,
    height: TOUCH,
    borderRadius: TOUCH / 2,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayOn: { backgroundColor: colors.point },
  schedRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, minHeight: 28 },
  note: { flexDirection: 'row', gap: 6, paddingHorizontal: space.xs },
});
