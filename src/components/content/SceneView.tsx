import { useState } from 'react';
import { type LayoutChangeEvent, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import type { Scene, SceneElement } from '@/models';
import { radius } from '@/theme';

import { star8 } from '../ui/Ornament';

/**
 * Abstract historical scenery: sky, landscape, architecture and objects only.
 * By design it can never show a person – the Prophet ﷺ is never depicted, and neither is anyone else.
 */
const SKY: Record<Scene['sky'], [string, string]> = {
  night: ['#0B1229', '#24315A'],
  dawn: ['#2B3460', '#D9A066'],
  day: ['#8EB8CF', '#EBD9B0'],
  dusk: ['#2A2147', '#B9714E'],
};

const W = 400;
const H = 160;

function element(name: SceneElement, i: number) {
  switch (name) {
    case 'stars':
      return (
        <G key={i} opacity={0.85}>
          {[30, 85, 140, 205, 260, 330, 375, 60, 300].map((x, k) => (
            <Circle key={k} cx={x} cy={14 + ((k * 23) % 50)} r={k % 3 === 0 ? 1.6 : 1} fill="#F5EEDF" />
          ))}
        </G>
      );
    case 'crescent':
      return (
        <G key={i}>
          <Circle cx={330} cy={38} r={16} fill="#E9C77A" />
          <Circle cx={337} cy={33} r={14} fill="#18223F" opacity={0.92} />
        </G>
      );
    case 'mountains':
      return <Path key={i} d="M0 118 L60 72 L105 104 L165 52 L230 112 L285 70 L345 108 L400 80 L400 160 L0 160Z" fill="#3B3A5A" opacity={0.85} />;
    case 'dunes':
      return <Path key={i} d="M0 132 Q70 108 140 128 T280 124 T400 120 L400 160 L0 160Z" fill="#C59A5E" opacity={0.9} />;
    case 'city':
      return (
        <G key={i} fill="#2A2C46">
          <Rect x={40} y={112} width={26} height={30} />
          <Rect x={70} y={100} width={30} height={42} />
          <Rect x={104} y={116} width={22} height={26} />
          <Rect x={262} y={108} width={28} height={34} />
          <Rect x={294} y={98} width={24} height={44} />
          <Rect x={322} y={114} width={30} height={28} />
          {[78, 88, 300, 330].map((x, k) => (
            <Rect key={k} x={x} y={k % 2 ? 120 : 108} width={5} height={7} fill="#E9C77A" opacity={0.7} />
          ))}
        </G>
      );
    case 'kaaba':
      return (
        <G key={i}>
          <Rect x={176} y={92} width={48} height={50} fill="#14141C" />
          <Rect x={176} y={102} width={48} height={6} fill="#C9A24D" />
          <Rect x={206} y={118} width={9} height={24} fill="#C9A24D" opacity={0.85} />
        </G>
      );
    case 'mosque':
      return (
        <G key={i} fill="#26325A">
          <Path d="M160 142 V112 A40 40 0 0 1 240 112 V142Z" />
          <Rect x={148} y={78} width={9} height={64} />
          <Rect x={243} y={78} width={9} height={64} />
          <Path d={star8(200, 78, 6)} fill="#E9C77A" />
        </G>
      );
    case 'cave':
      return (
        <G key={i}>
          <Path d="M110 160 L200 60 L300 160Z" fill="#2E2B44" />
          <Path d="M184 160 Q186 128 200 124 Q214 128 216 160Z" fill="#0B0B14" />
        </G>
      );
    case 'palms':
      return (
        <G key={i} stroke="#2F4A3A" strokeWidth={3} fill="none" strokeLinecap="round">
          {[40, 362].map((x, k) => (
            <G key={k}>
              <Path d={`M${x} 150 Q${x + 4} 120 ${x} 96`} />
              <Path d={`M${x} 96 Q${x - 20} 88 ${x - 30} 100 M${x} 96 Q${x + 20} 86 ${x + 30} 98 M${x} 96 Q${x - 6} 80 ${x - 18} 76 M${x} 96 Q${x + 8} 80 ${x + 20} 78`} />
            </G>
          ))}
        </G>
      );
    case 'caravan':
      return (
        <G key={i} opacity={0.9}>
          {[96, 140, 184].map((x, k) => (
            <G key={k}>
              <Path d={`M${x} 126 Q${x + 4} 110 ${x + 15} 110 Q${x + 26} 110 ${x + 30} 126 Z`} fill="#3B2A1E" />
              <Path
                d={`M${x + 4} 125 V142 M${x + 10} 125 V142 M${x + 22} 125 V142 M${x + 27} 125 V142 M${x + 29} 122 L${x + 36} 110 L${x + 42} 112`}
                stroke="#3B2A1E"
                strokeWidth={2.6}
                strokeLinecap="round"
                fill="none"
              />
            </G>
          ))}
        </G>
      );
    case 'tents':
      return (
        <G key={i} fill="#E8D7B4" stroke="#8A6A3A" strokeWidth={1.5}>
          <Path d="M60 142 L95 108 L130 142Z" />
          <Path d="M270 142 L300 114 L330 142Z" />
        </G>
      );
    case 'lamp':
      return (
        <G key={i}>
          <Path d="M200 40 v12" stroke="#C9A24D" strokeWidth={2} />
          <Path d="M188 52 h24 l-4 22 h-16z" fill="#C9A24D" />
          <Circle cx={200} cy={64} r={18} fill="#F2D48A" opacity={0.18} />
        </G>
      );
    case 'scroll':
      return (
        <G key={i}>
          <Rect x={150} y={96} width={100} height={46} rx={4} fill="#F2E4C2" />
          <Path d="M164 110 h72 M164 120 h60 M164 130 h66" stroke="#8A6A3A" strokeWidth={2} />
        </G>
      );
    case 'sea':
      return <Path key={i} d="M0 138 Q50 132 100 138 T200 138 T300 138 T400 138 V160 H0Z" fill="#3E6A86" opacity={0.85} />;
  }
}

export function SceneView({ scene, height = 140, rounded }: { scene: Scene; height?: number; rounded?: boolean }) {
  const [width, setWidth] = useState(0);
  const [top, bottom] = SKY[scene.sky];
  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);
  return (
    <View
      style={[styles.root, { height }, rounded && styles.rounded]}
      onLayout={onLayout}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {width > 0 ? (
        <Svg width={width} height={height} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice">
          <Defs>
            <LinearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={top} />
              <Stop offset="1" stopColor={bottom} />
            </LinearGradient>
          </Defs>
          <Rect width={W} height={H} fill="url(#sky)" />
          {scene.elements.map(element)}
        </Svg>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { width: '100%', overflow: 'hidden' },
  rounded: { borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg },
});
