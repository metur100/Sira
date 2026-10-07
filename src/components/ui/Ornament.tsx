import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Line, Path, Pattern, Rect, Defs } from 'react-native-svg';

/** A small eight-pointed star between two lines – a quiet divider. */
export function Ornament({ color, width = 120 }: { color: string; width?: number }) {
  const mid = width / 2;
  return (
    <View style={styles.ornament} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Svg width={width} height={14}>
        <Line x1={0} y1={7} x2={mid - 12} y2={7} stroke={color} strokeWidth={1} opacity={0.6} />
        <Line x1={mid + 12} y1={7} x2={width} y2={7} stroke={color} strokeWidth={1} opacity={0.6} />
        <Path d={star8(mid, 7, 6)} fill={color} />
      </Svg>
    </View>
  );
}

/** Eight-pointed star (two overlapping squares) as an SVG path. */
export function star8(cx: number, cy: number, r: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 16; i++) {
    const angle = (Math.PI / 8) * i - Math.PI / 2;
    const rad = i % 2 === 0 ? r : r * 0.62;
    pts.push(`${(cx + Math.cos(angle) * rad).toFixed(2)},${(cy + Math.sin(angle) * rad).toFixed(2)}`);
  }
  return `M${pts.join('L')}Z`;
}

/** Subtle geometric pattern of stars for dark headers. */
export function PatternBackground({ color, opacity = 0.07 }: { color: string; opacity?: number }) {
  return (
    <Svg style={StyleSheet.absoluteFill} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Defs>
        <Pattern id="stars" width={56} height={56} patternUnits="userSpaceOnUse">
          <Path d={star8(28, 28, 12)} fill="none" stroke={color} strokeWidth={1} />
          <Circle cx={0} cy={0} r={1.5} fill={color} />
          <Circle cx={56} cy={56} r={1.5} fill={color} />
        </Pattern>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#stars)" opacity={opacity} />
    </Svg>
  );
}

const styles = StyleSheet.create({
  ornament: { paddingVertical: 2 },
});
