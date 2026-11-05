import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Clock, Minus, Plus } from 'lucide-react-native';
import { useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, IconButton, Txt } from '@/components/ui';
import { formatKoreanTime, parseTime, toTimeString } from '@/lib/date';
import type { TimeString } from '@/lib/types';
import { colors, radius, space, TOUCH } from '@/theme';

const toDate = (t: TimeString) => {
  const { hour, minute } = parseTime(t);
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d;
};
const fromDate = (d: Date) => toTimeString(d.getHours(), d.getMinutes());

/** 시간 선택 칸. 안드로이드는 시스템 다이얼로그, iOS 는 하단 시트, 웹은 +/- 조절 */
export function TimePickerField({
  value,
  onChange,
  disabled,
  label,
}: {
  value: TimeString;
  onChange: (t: TimeString) => void;
  disabled?: boolean;
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const insets = useSafeAreaInsets();

  const onPress = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: toDate(value),
        mode: 'time',
        is24Hour: false,
        onValueChange: (_e, d) => onChange(fromDate(d)),
      });
      return;
    }
    setDraft(value);
    setOpen(true);
  };

  const { hour, minute } = parseTime(draft);
  const step = (dh: number, dm: number) => {
    let total = hour * 60 + minute + dh * 60 + dm;
    total = ((total % 1440) + 1440) % 1440;
    setDraft(toTimeString(Math.floor(total / 60), total % 60));
  };

  return (
    <>
      <Pressable
        onPress={onPress}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={`${label} ${formatKoreanTime(value)}, 눌러서 변경`}
        style={({ pressed }) => [styles.field, { opacity: disabled ? 0.4 : pressed ? 0.7 : 1 }]}
      >
        <Clock size={16} color={colors.point} />
        <Txt weight="bold" size={15} color={colors.point}>
          {formatKoreanTime(value)}
        </Txt>
      </Pressable>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)} accessibilityLabel="닫기" />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + space.lg }]}>
          <Txt weight="bold" size={17}>
            {label}
          </Txt>
          {Platform.OS === 'ios' ? (
            <DateTimePicker
              value={toDate(draft)}
              mode="time"
              display="spinner"
              locale="ko-KR"
              minuteInterval={5}
              onValueChange={(_e, d) => setDraft(fromDate(d))}
              style={{ alignSelf: 'stretch' }}
            />
          ) : (
            <View style={styles.stepper}>
              {(
                [
                  ['시', 1, 0, hour],
                  ['분', 0, 5, minute],
                ] as const
              ).map(([unit, dh, dm, v]) => (
                <View key={unit} style={styles.stepCol}>
                  <IconButton label={`${unit} 올리기`} onPress={() => step(dh, dm)}>
                    <Plus size={20} color={colors.point} />
                  </IconButton>
                  <Txt weight="bold" size={28}>
                    {String(v).padStart(2, '0')}
                  </Txt>
                  <IconButton label={`${unit} 내리기`} onPress={() => step(-dh, -dm)}>
                    <Minus size={20} color={colors.point} />
                  </IconButton>
                </View>
              ))}
              <Txt size={15} color={colors.subtext} style={{ alignSelf: 'center' }}>
                {formatKoreanTime(draft)}
              </Txt>
            </View>
          )}
          <Button
            label="완료"
            onPress={() => {
              onChange(draft);
              setOpen(false);
            }}
          />
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  field: {
    minHeight: TOUCH,
    paddingHorizontal: space.md,
    borderRadius: radius.field,
    backgroundColor: colors.pointSoft,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  backdrop: { flex: 1, backgroundColor: 'rgba(30,39,35,0.35)' },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.card,
    borderTopRightRadius: radius.card,
    padding: space.xl,
    gap: space.lg,
  },
  stepper: { flexDirection: 'row', justifyContent: 'center', gap: space.xxl },
  stepCol: { alignItems: 'center' },
});
