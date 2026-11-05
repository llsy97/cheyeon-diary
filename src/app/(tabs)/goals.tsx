import { Bell, Plus, Trash2, X } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { GoalIcon, guessIcon, ICON_KEYS } from '@/components/GoalIcon';
import { Button, Card, CardTitle, Chip, Divider, IconButton, Screen, Txt } from '@/components/ui';
import { formatKoreanMonth, formatKoreanTime, monthOf } from '@/lib/date';
import { MAX_GOALS_PER_MONTH } from '@/lib/types';
import { useAppData, useMonthGoals } from '@/store/DataContext';
import { colors, fonts, radius, space, TOUCH } from '@/theme';

const SUGGESTIONS = [
  { name: '스트레칭 5분', icon: 'stretch' },
  { name: '일찍 자기', icon: 'moon' },
  { name: '물 2L 마시기', icon: 'water' },
  { name: '책 10쪽 읽기', icon: 'book' },
  { name: '산책 20분', icon: 'walk' },
  { name: '약 먹기', icon: 'pill' },
  { name: '감사한 일 떠올리기', icon: 'heart' },
  { name: '커피 한 잔만', icon: 'coffee' },
  { name: '7시 기상', icon: 'sun' },
];

const MAX_NAME = 20;

function GoalRow({ id, name, icon, reminderTime }: { id: string; name: string; icon: string; reminderTime?: string }) {
  const { removeGoal } = useAppData();
  const [confirming, setConfirming] = useState(false);
  return (
    <View style={styles.row}>
      <View style={styles.rowIcon}>
        <GoalIcon icon={icon} size={18} />
      </View>
      <View style={{ flex: 1 }}>
        <Txt weight="medium">{name}</Txt>
        {reminderTime ? (
          <View style={styles.reminder}>
            <Bell size={12} color={colors.subtext} />
            <Txt size={12} color={colors.subtext}>
              {formatKoreanTime(reminderTime)}
            </Txt>
          </View>
        ) : null}
      </View>
      {confirming ? (
        <View style={styles.confirm}>
          <IconButton label="삭제 취소" onPress={() => setConfirming(false)}>
            <X size={18} color={colors.subtext} />
          </IconButton>
          <Pressable
            onPress={() => removeGoal(id)}
            accessibilityRole="button"
            accessibilityLabel={`${name} 삭제 확인`}
            style={({ pressed }) => [styles.deleteBtn, pressed && { opacity: 0.7 }]}
          >
            <Txt size={13} weight="bold" color={colors.white}>
              삭제
            </Txt>
          </Pressable>
        </View>
      ) : (
        <IconButton label={`${name} 삭제`} onPress={() => setConfirming(true)}>
          <Trash2 size={18} color={colors.subtext} strokeWidth={1.8} />
        </IconButton>
      )}
    </View>
  );
}

export default function GoalsScreen() {
  const { today, addGoal } = useAppData();
  const goals = useMonthGoals();
  const [name, setName] = useState('');
  const [icon, setIcon] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const full = goals.length >= MAX_GOALS_PER_MONTH;

  const add = (n: string, i?: string) => {
    const trimmed = n.trim();
    if (!trimmed) return;
    if (goals.some((g) => g.name === trimmed)) {
      setError('이미 있는 목표예요');
      return;
    }
    if (addGoal({ name: trimmed, icon: i ?? guessIcon(trimmed) })) {
      setName('');
      setIcon(null);
      setError(null);
    }
  };

  const suggestions = SUGGESTIONS.filter((s) => !goals.some((g) => g.name === s.name));
  const previewIcon = icon ?? guessIcon(name);

  return (
    <Screen title="이번 달 목표" subtitle={formatKoreanMonth(monthOf(today))}>
      <Card>
        <CardTitle
          right={
            <Txt size={13} color={colors.subtext}>
              {goals.length} / {MAX_GOALS_PER_MONTH}
            </Txt>
          }
        >
          목표 목록
        </CardTitle>
        {goals.length === 0 ? (
          <Txt color={colors.subtext} size={14}>
            아직 목표가 없어요. 아래에서 추가해 보세요.
          </Txt>
        ) : (
          <View>
            {goals.map((g, i) => (
              <View key={g.id}>
                {i > 0 ? <Divider /> : null}
                <GoalRow {...g} />
              </View>
            ))}
          </View>
        )}
      </Card>

      <Card>
        <CardTitle>새 목표</CardTitle>
        {full ? (
          <Txt size={14} color={colors.subtext}>
            목표는 한 달에 {MAX_GOALS_PER_MONTH}개까지 정할 수 있어요. 하나를 지우면 새로 추가할 수 있어요.
          </Txt>
        ) : (
          <>
            <View style={styles.inputRow}>
              <View style={styles.inputIcon}>
                <GoalIcon icon={previewIcon} size={18} />
              </View>
              <TextInput
                value={name}
                onChangeText={(t) => {
                  setName(t);
                  setError(null);
                }}
                maxLength={MAX_NAME}
                placeholder="예: 스쿼트 20개"
                placeholderTextColor="#9AA6A0"
                returnKeyType="done"
                onSubmitEditing={() => add(name, icon ?? undefined)}
                style={styles.input}
                accessibilityLabel="새 목표 이름"
              />
              <Button
                label="추가"
                icon={<Plus size={16} color={colors.white} />}
                onPress={() => add(name, icon ?? undefined)}
                disabled={!name.trim()}
              />
            </View>
            {error ? (
              <Txt size={13} color={colors.danger}>
                {error}
              </Txt>
            ) : null}
            <Txt size={13} color={colors.subtext}>
              아이콘
            </Txt>
            <View style={styles.iconGrid}>
              {ICON_KEYS.map((k) => {
                const selected = previewIcon === k;
                return (
                  <Pressable
                    key={k}
                    onPress={() => setIcon(k)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    accessibilityLabel={`아이콘 ${k}`}
                    style={[styles.iconCell, selected && styles.iconCellOn]}
                  >
                    <GoalIcon icon={k} size={20} color={selected ? colors.point : colors.subtext} />
                  </Pressable>
                );
              })}
            </View>
          </>
        )}
      </Card>

      {!full && suggestions.length > 0 ? (
        <Card>
          <CardTitle>추천 목표</CardTitle>
          <Txt size={13} color={colors.subtext}>
            탭하면 바로 추가돼요
          </Txt>
          <View style={styles.chips}>
            {suggestions.map((s) => (
              <Chip
                key={s.name}
                label={s.name}
                icon={<GoalIcon icon={s.icon} size={16} color={colors.subtext} />}
                onPress={() => add(s.name, s.icon)}
              />
            ))}
          </View>
        </Card>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: 60 },
  rowIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.pointSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reminder: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  confirm: { flexDirection: 'row', alignItems: 'center' },
  deleteBtn: {
    minHeight: 36,
    minWidth: TOUCH + 8,
    paddingHorizontal: space.md,
    borderRadius: radius.chip,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  inputIcon: {
    width: TOUCH,
    height: TOUCH + 4,
    borderRadius: radius.field,
    backgroundColor: colors.pointSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    minHeight: TOUCH + 4,
    paddingHorizontal: space.md,
    borderRadius: radius.field,
    backgroundColor: colors.bg,
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.text,
  },
  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  iconCell: {
    width: TOUCH,
    height: TOUCH,
    borderRadius: radius.field,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCellOn: { borderColor: colors.point, backgroundColor: colors.pointSoft },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
});
