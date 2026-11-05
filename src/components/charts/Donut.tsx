import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Txt } from '@/components/ui';
import { colors } from '@/theme';

/** 달성률 도넛. 가운데에 퍼센트와 '완료/가능' 표시 */
export function Donut({
  done,
  possible,
  size = 168,
  stroke = 18,
}: {
  done: number;
  possible: number;
  size?: number;
  stroke?: number;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const rate = possible ? done / possible : 0;
  const center = size / 2;
  return (
    <View
      style={{ width: size, height: size }}
      accessibilityRole="image"
      accessibilityLabel={`이번 달 달성률 ${Math.round(rate * 100)}퍼센트, ${possible}번 중 ${done}번 완료`}
    >
      <Svg width={size} height={size}>
        <Circle cx={center} cy={center} r={r} stroke={colors.heat[0]} strokeWidth={stroke} fill="none" />
        {rate > 0 ? (
          <Circle
            cx={center}
            cy={center}
            r={r}
            stroke={colors.point}
            strokeWidth={stroke}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${c * rate} ${c}`}
            // 12시 방향에서 시작
            transform={`rotate(-90 ${center} ${center})`}
          />
        ) : null}
      </Svg>
      <View style={[StyleSheet.absoluteFill, styles.center]}>
        <Txt weight="bold" size={32} style={{ lineHeight: 40 }}>
          {Math.round(rate * 100)}
          <Txt weight="bold" size={18}>
            %
          </Txt>
        </Txt>
        <Txt size={13} color={colors.subtext}>
          {done} / {possible}
        </Txt>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({ center: { alignItems: 'center', justifyContent: 'center' } });
