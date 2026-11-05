import { useState } from 'react';
import { View } from 'react-native';
import Svg, { G, Line, Rect, Text as SvgText } from 'react-native-svg';
import { colors, fonts } from '@/theme';

/**
 * 일별 달성 개수 세로 막대.
 * values[i] = (i+1)일의 달성 개수, null 이면 아직 오지 않은 날.
 */
export function VBarChart({
  values,
  max,
  highlightIndex,
  height = 150,
}: {
  values: (number | null)[];
  max: number;
  highlightIndex?: number;
  height?: number;
}) {
  const [width, setWidth] = useState(0);
  const axisW = 18;
  const bottom = 20;
  const top = 6;
  const plotW = Math.max(0, width - axisW);
  const plotH = height - bottom - top;
  const slot = values.length ? plotW / values.length : 0;
  const barW = Math.max(2, slot * 0.62);
  const yMax = Math.max(1, max);
  const ticks = yMax <= 4 ? Array.from({ length: yMax + 1 }, (_, i) => i) : [0, Math.round(yMax / 2), yMax];
  const labelDays = new Set([1, 10, 20, values.length]);
  const label = (txt: string, x: number, y: number, anchor: 'start' | 'middle' | 'end', bold = false) => (
    <SvgText
      x={x}
      y={y}
      fontSize={10}
      fontFamily={bold ? fonts.bold : fonts.regular}
      fill={bold ? colors.point : colors.subtext}
      textAnchor={anchor}
    >
      {txt}
    </SvgText>
  );

  return (
    <View
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      style={{ height }}
      accessibilityRole="image"
      accessibilityLabel="일별 달성 개수 막대 그래프"
    >
      {width > 0 ? (
        <Svg width={width} height={height}>
          {ticks.map((t) => {
            const y = top + plotH - (t / yMax) * plotH;
            return (
              <G key={`t${t}`}>
                <Line x1={axisW} x2={width} y1={y} y2={y} stroke={colors.border} strokeWidth={1} strokeDasharray={t ? '3 4' : undefined} />
                {label(String(t), axisW - 6, y + 3.5, 'end')}
              </G>
            );
          })}
          {values.map((v, i) => {
            const cx = axisW + slot * i + slot / 2;
            const isHi = i === highlightIndex;
            if (v === null) {
              return <Rect key={i} x={cx - barW / 2} y={top + plotH - 2} width={barW} height={2} rx={1} fill={colors.heat[0]} />;
            }
            const h = v === 0 ? 2 : (v / yMax) * plotH;
            return (
              <Rect
                key={i}
                x={cx - barW / 2}
                y={top + plotH - h}
                width={barW}
                height={h}
                rx={Math.min(3, barW / 2)}
                fill={v === 0 ? colors.heat[0] : isHi ? colors.point : colors.heat[3]}
              />
            );
          })}
          {values.map((_, i) =>
            i === highlightIndex ||
            (labelDays.has(i + 1) && (highlightIndex === undefined || Math.abs(i - highlightIndex) > 2)) ? (
              <G key={`l${i}`}>
                {label(
                  i === highlightIndex ? '오늘' : `${i + 1}`,
                  axisW + slot * i + slot / 2,
                  height - 5,
                  'middle',
                  i === highlightIndex,
                )}
              </G>
            ) : null,
          )}
        </Svg>
      ) : null}
    </View>
  );
}
