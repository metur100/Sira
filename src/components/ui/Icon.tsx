import Svg, { Path } from 'react-native-svg';

const circle = (cx: number, cy: number, r: number) => `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`;

/** Line icons on a 24×24 grid. `fill: true` draws the shape filled instead of outlined. */
const ICONS = {
  home: { d: ['M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z'] },
  timeline: { d: ['M6 3v18', circle(6, 6, 1.6), circle(6, 12, 1.6), circle(6, 18, 1.6), 'M10 6h10', 'M10 12h7', 'M10 18h9'] },
  map: { d: ['M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2z', 'M9 4v14', 'M15 6v14'] },
  compass: { d: [circle(12, 12, 9), 'm15.5 8.5-2 5-5 2 2-5z'] },
  user: { d: [circle(12, 8, 4), 'M4 21c0-4 3.6-6 8-6s8 2 8 6'] },
  search: { d: [circle(11, 11, 7), 'm20 20-4-4'] },
  bookmark: { d: ['M6 3h12v18l-6-4-6 4z'] },
  bookmarkFilled: { d: ['M6 3h12v18l-6-4-6 4z'], fill: true },
  chevron: { d: ['m9 6 6 6-6 6'] },
  back: { d: ['m15 6-6 6 6 6'] },
  close: { d: ['M6 6l12 12', 'M18 6 6 18'] },
  check: { d: ['m5 12 5 5 9-10'] },
  play: { d: ['M7 4v16l13-8z'], fill: true },
  pause: { d: ['M7 4h4v16H7z', 'M13 4h4v16h-4z'], fill: true },
  star: { d: ['m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z'] },
  book: { d: ['M2 5h7a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H2z', 'M22 5h-7a3 3 0 0 0-3 3v13a2 2 0 0 1 2-2h8z'] },
  people: { d: [circle(9, 8, 3.5), 'M2 20c0-3.5 3-5.5 7-5.5s7 2 7 5.5', circle(17, 9, 2.5), 'M17 14.5c2.8 0 5 1.5 5 4.5'] },
  pin: { d: ['M12 22s7-6.5 7-12a7 7 0 0 0-14 0c0 5.5 7 12 7 12z', circle(12, 10, 2.5)] },
  calendar: { d: ['M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z', 'M3 10h18', 'M8 3v4', 'M16 3v4'] },
  tag: { d: ['M3 12V3h9l9 9-9 9z', circle(7.5, 7.5, 1.5)] },
  link: { d: ['M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1', 'M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1'] },
  settings: { d: ['M4 6h9', 'M17 6h3', circle(15, 6, 2), 'M4 12h3', 'M11 12h9', circle(9, 12, 2), 'M4 18h11', 'M19 18h1', circle(17, 18, 2)] },
  sun: { d: [circle(12, 12, 4), 'M12 2v2', 'M12 20v2', 'm4.9 4.9 1.4 1.4', 'm17.7 17.7 1.4 1.4', 'M2 12h2', 'M20 12h2', 'm4.9 19.1 1.4-1.4', 'm17.7 6.3 1.4-1.4'] },
  moon: { d: ['M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z'] },
  info: { d: [circle(12, 12, 9), 'M12 11v6', 'M12 7.5v.5'] },
  shield: { d: ['M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z'] },
  refresh: { d: ['M20 11a8 8 0 1 0-2.3 5.7', 'M20 4v7h-7'] },
  trash: { d: ['M4 7h16', 'M9 7V4h6v3', 'M6 7l1 13h10l1-13'] },
  feather: { d: ['M20 4C12 4 7 9 7 17v3', 'M7 17l7-7', 'M10 14h5'] },
  kaaba: { d: ['M5 7l7-3 7 3v10l-7 3-7-3z', 'M5 7l7 3 7-3', 'M12 10v10', 'M5 10l7 3 7-3'] },
  mosque: { d: ['M6 21v-9a6 6 0 0 1 12 0v9z', 'M12 3v3', 'M3 21V9', 'M21 21V9', 'M2 21h20'] },
  plus: { d: ['M12 5v14', 'M5 12h14'] },
  minus: { d: ['M5 12h14'] },
  locate: { d: [circle(12, 12, 7), 'M12 2v3', 'M12 19v3', 'M2 12h3', 'M19 12h3'] },
  globe: { d: [circle(12, 12, 9), 'M3 12h18', 'M12 3c2.5 2.5 3.8 5.5 3.8 9s-1.3 6.5-3.8 9c-2.5-2.5-3.8-5.5-3.8-9S9.5 5.5 12 3z'] },
  bell: { d: ['M6 16v-5a6 6 0 0 1 12 0v5l2 2H4z', 'M10 20a2 2 0 0 0 4 0'] },
  text: { d: ['M4 7V5h16v2', 'M12 5v14', 'M9 19h6'] },
  eye: { d: ['M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z', circle(12, 12, 3)] },
  route: { d: [circle(6, 17, 2), circle(18, 7, 2), 'M8 17h7a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h7'] },
  external: { d: ['M14 4h6v6', 'M20 4l-9 9', 'M18 14v5H5V6h5'] },
  sparkle: { d: ['M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z'] },
  list: { d: ['M8 6h12', 'M8 12h12', 'M8 18h12', 'M4 6h.01', 'M4 12h.01', 'M4 18h.01'] },
  scroll: { d: ['M7 3h11a2 2 0 0 1 2 2v2h-4', 'M16 7v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2h10', 'M7 3a2 2 0 0 0-2 2v12', 'M9 9h4', 'M9 13h4'] },
  quote: { d: ['M9 7H5v6h4v-2a4 4 0 0 1-4 4', 'M19 7h-4v6h4v-2a4 4 0 0 1-4 4'] },
} as const;

export type IconName = keyof typeof ICONS;

interface IconProps {
  name: IconName;
  size?: number;
  color: string;
  strokeWidth?: number;
}

/** Decorative icon – screen readers rely on the label of the surrounding control. */
export function Icon({ name, size = 22, color, strokeWidth = 1.9 }: IconProps) {
  const icon = ICONS[name];
  const filled = 'fill' in icon && icon.fill;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {icon.d.map((d, i) => (
        <Path
          key={i}
          d={d}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill={filled ? color : 'none'}
        />
      ))}
    </Svg>
  );
}
