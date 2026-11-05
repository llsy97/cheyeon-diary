import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { Txt } from '@/components/ui';
import { colors, space } from '@/theme';

export interface HBarItem {
  key: string;
  label: string;
  icon?: ReactNode;
  value: number; // 0~1
  caption: string;
}

/** 항목별 가로 막대 (값 0~1) */
export function HBarChart({ items, barHeight = 12 }: { items: HBarItem[]; barHeight?: number }) {
  return (
    <View style={{ gap: space.md }}>
      {items.map((it) => {
        const pct = Math.max(0, Math.min(1, it.value)) * 100;
        return (
          <View key={it.key} style={{ gap: 6 }} accessibilityLabel={`${it.label} ${Math.round(pct)}퍼센트`}>
            <View style={styles.labelRow}>
              {it.icon}
              <Txt size={14} weight="medium" style={{ flex: 1 }} numberOfLines={1}>
                {it.label}
              </Txt>
              <Txt size={13} color={colors.subtext}>
                {it.caption}
              </Txt>
              <Txt size={14} weight="bold" color={colors.point} style={{ minWidth: 40, textAlign: 'right' }}>
                {Math.round(pct)}%
              </Txt>
            </View>
            <Svg width="100%" height={barHeight}>
              <Rect x={0} y={0} width="100%" height={barHeight} rx={barHeight / 2} fill={colors.heat[0]} />
              {pct > 0 ? (
                <Rect x={0} y={0} width={`${pct}%`} height={barHeight} rx={barHeight / 2} fill={colors.point} />
              ) : null}
            </Svg>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({ labelRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm } });
