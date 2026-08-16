import type { ColorValue } from 'react-native';
import Svg, { Circle, Ellipse, Path, Rect } from 'react-native-svg';

export type IconProps = {
  size?: number;
  color?: ColorValue;
  strokeWidth?: number;
};

// Exact outline icon set used by the product design (paths lifted verbatim
// from the reference mockup so these render pixel-identical to it).

function base(size = 20, strokeWidth = 2) {
  return { size, strokeWidth };
}

export function IconHome({ size, color = '#fff', strokeWidth }: IconProps) {
  const s = base(size, strokeWidth);
  return (
    <Svg width={s.size} height={s.size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={s.strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
      <Path d="M9 22V12h6v10" />
    </Svg>
  );
}

export function IconFolder({ size, color = '#fff', strokeWidth }: IconProps) {
  const s = base(size, strokeWidth);
  return (
    <Svg width={s.size} height={s.size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={s.strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
    </Svg>
  );
}

export function IconPencil({ size, color = '#fff', strokeWidth }: IconProps) {
  const s = base(size, strokeWidth);
  return (
    <Svg width={s.size} height={s.size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={s.strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M12 20h9" />
      <Path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </Svg>
  );
}

export function IconCalculator({ size, color = '#fff', strokeWidth }: IconProps) {
  const s = base(size, strokeWidth);
  return (
    <Svg width={s.size} height={s.size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={s.strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Rect x="4" y="2" width="16" height="20" rx="2" />
      <Path d="M8 6h8M8 10h2M12 10h2M16 10h.01M8 14h2M12 14h2M16 14h.01M8 18h8" />
    </Svg>
  );
}

export function IconBot({ size, color = '#fff', strokeWidth }: IconProps) {
  const s = base(size, strokeWidth);
  return (
    <Svg width={s.size} height={s.size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={s.strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M12 8V4H8" />
      <Rect width="16" height="12" x="4" y="8" rx="2" />
      <Path d="M2 14h2M20 14h2M15 13v2M9 13v2" />
    </Svg>
  );
}

export function IconFingerprint({ size, color = '#fff', strokeWidth = 1.7 }: IconProps) {
  const s = base(size, strokeWidth);
  return (
    <Svg width={s.size} height={s.size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={s.strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4" />
      <Path d="M14 13.12c0 2.38 0 6.38-1 8.88" />
      <Path d="M17.29 21.02c.12-.6.43-2.3.5-3.02" />
      <Path d="M2 12a10 10 0 0 1 18-6" />
      <Path d="M2 16h.01" />
      <Path d="M21.8 16c.2-2 .131-5.354 0-6" />
      <Path d="M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2" />
      <Path d="M8.65 22c.21-.66.45-1.32.57-2" />
      <Path d="M9 6.8a6 6 0 0 1 9 5.2v2" />
    </Svg>
  );
}

export function IconDelete({ size, color = '#fff', strokeWidth = 1.8 }: IconProps) {
  const s = base(size, strokeWidth);
  return (
    <Svg width={s.size} height={s.size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={s.strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Z" />
      <Path d="m18 9-6 6M12 9l6 6" />
    </Svg>
  );
}

export function IconArrowRight({ size, color = '#fff', strokeWidth = 2.2 }: IconProps) {
  const s = base(size, strokeWidth);
  return (
    <Svg width={s.size} height={s.size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={s.strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M5 12h14M12 5l7 7-7 7" />
    </Svg>
  );
}

export function IconArrowLeft({ size, color = '#fff', strokeWidth }: IconProps) {
  const s = base(size, strokeWidth);
  return (
    <Svg width={s.size} height={s.size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={s.strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M19 12H5M12 19l-7-7 7-7" />
    </Svg>
  );
}

export function IconLock({ size, color = 'rgba(255,255,255,.4)', strokeWidth = 2 }: IconProps) {
  const s = base(size, strokeWidth);
  return (
    <Svg width={s.size} height={s.size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={s.strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Rect x="3" y="11" width="18" height="11" rx="2" />
      <Path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </Svg>
  );
}

export function IconSearch({ size, color = '#fff', strokeWidth }: IconProps) {
  const s = base(size, strokeWidth);
  return (
    <Svg width={s.size} height={s.size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={s.strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx="11" cy="11" r="8" />
      <Path d="m21 21-4.3-4.3" />
    </Svg>
  );
}

export function IconBell({ size, color = '#fff', strokeWidth }: IconProps) {
  const s = base(size, strokeWidth);
  return (
    <Svg width={s.size} height={s.size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={s.strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M10.268 21a2 2 0 0 0 3.464 0" />
      <Path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326" />
    </Svg>
  );
}

export function IconPlus({ size, color = '#131313', strokeWidth = 2.2 }: IconProps) {
  const s = base(size, strokeWidth);
  return (
    <Svg width={s.size} height={s.size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={s.strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M12 5v14M5 12h14" />
    </Svg>
  );
}

export function IconChevronRight({ size = 16, color = 'rgba(255,255,255,.3)', strokeWidth = 2 }: IconProps) {
  const s = base(size, strokeWidth);
  return (
    <Svg width={s.size} height={s.size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={s.strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Path d="m9 18 6-6-6-6" />
    </Svg>
  );
}

export function IconMoreVertical({ size = 16, color = 'rgba(255,255,255,.3)', strokeWidth = 2 }: IconProps) {
  const s = base(size, strokeWidth);
  return (
    <Svg width={s.size} height={s.size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={s.strokeWidth} strokeLinecap="round">
      <Circle cx="12" cy="5" r="1" />
      <Circle cx="12" cy="12" r="1" />
      <Circle cx="12" cy="19" r="1" />
    </Svg>
  );
}

export function IconDatabase({ size, color = '#131313', strokeWidth = 2 }: IconProps) {
  const s = base(size, strokeWidth);
  return (
    <Svg width={s.size} height={s.size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={s.strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Ellipse cx="12" cy="5" rx="9" ry="3" />
      <Path d="M3 5v14a9 3 0 0 0 18 0V5" />
      <Path d="M3 12a9 3 0 0 0 18 0" />
    </Svg>
  );
}

export function IconFileText({ size, color = '#d8f34a', strokeWidth = 2 }: IconProps) {
  const s = base(size, strokeWidth);
  return (
    <Svg width={s.size} height={s.size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={s.strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <Path d="M14 2v4a2 2 0 0 0 2 2h4" />
    </Svg>
  );
}

export function IconSpreadsheet({ size, color = '#fff', strokeWidth = 2 }: IconProps) {
  const s = base(size, strokeWidth);
  return (
    <Svg width={s.size} height={s.size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={s.strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <Path d="M14 2v4a2 2 0 0 0 2 2h4" />
      <Path d="M8 13h2v5H8zM14 11h2v7h-2z" />
    </Svg>
  );
}

export function IconImage({ size, color = '#fff', strokeWidth = 2 }: IconProps) {
  const s = base(size, strokeWidth);
  return (
    <Svg width={s.size} height={s.size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={s.strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Rect width="18" height="18" x="3" y="3" rx="2" />
      <Circle cx="9" cy="9" r="2" />
      <Path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
    </Svg>
  );
}

export function IconVideo({ size, color = '#fff', strokeWidth = 2 }: IconProps) {
  const s = base(size, strokeWidth);
  return (
    <Svg width={s.size} height={s.size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={s.strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Path d="m22 8-6 4 6 4V8Z" />
      <Rect width="14" height="12" x="2" y="6" rx="2" />
    </Svg>
  );
}

export function IconCamera({ size = 19, color = '#fff', strokeWidth = 1.9 }: IconProps) {
  const s = base(size, strokeWidth);
  return (
    <Svg width={s.size} height={s.size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={s.strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3Z" />
      <Circle cx="12" cy="13" r="3" />
    </Svg>
  );
}

export function IconScan({ size = 19, color = '#fff', strokeWidth = 1.9 }: IconProps) {
  const s = base(size, strokeWidth);
  return (
    <Svg width={s.size} height={s.size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={s.strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" />
      <Path d="M7 12h10" />
    </Svg>
  );
}

export function IconUpload({ size = 19, color = '#fff', strokeWidth = 1.9 }: IconProps) {
  const s = base(size, strokeWidth);
  return (
    <Svg width={s.size} height={s.size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={s.strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <Path d="m17 8-5-5-5 5M12 3v12" />
    </Svg>
  );
}

export function IconClock({ size, color = '#fff', strokeWidth = 2 }: IconProps) {
  const s = base(size, strokeWidth);
  return (
    <Svg width={s.size} height={s.size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={s.strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M12 8v4l3 2" />
      <Circle cx="12" cy="12" r="10" />
    </Svg>
  );
}

export function IconPaperclip({ size = 18, color = '#fff', strokeWidth = 2 }: IconProps) {
  const s = base(size, strokeWidth);
  return (
    <Svg width={s.size} height={s.size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={s.strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
    </Svg>
  );
}

export function IconSend({ size = 18, color = '#131313', strokeWidth = 2.2 }: IconProps) {
  const s = base(size, strokeWidth);
  return (
    <Svg width={s.size} height={s.size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={s.strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Path d="m22 2-7 20-4-9-9-4Z" />
      <Path d="M22 2 11 13" />
    </Svg>
  );
}

// --- Weather icons — simple, geometrically-confident constructions rather
// than recalled-from-memory complex paths for icons with no reference
// source (unlike the set above, lifted verbatim from the mockup). Still
// match the rest of the set's stroke-outline style.

export function IconSun({ size, color = '#fff', strokeWidth = 2 }: IconProps) {
  const s = base(size, strokeWidth);
  return (
    <Svg width={s.size} height={s.size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={s.strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx="12" cy="12" r="4" />
      <Path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </Svg>
  );
}

export function IconCloud({ size, color = '#fff', strokeWidth = 2 }: IconProps) {
  const s = base(size, strokeWidth);
  return (
    <Svg width={s.size} height={s.size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={s.strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
    </Svg>
  );
}

export function IconCloudRain({ size, color = '#fff', strokeWidth = 2 }: IconProps) {
  const s = base(size, strokeWidth);
  return (
    <Svg width={s.size} height={s.size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={s.strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
      <Path d="M16 14v6M8 14v6M12 16v6" />
    </Svg>
  );
}

export function IconCloudDrizzle({ size, color = '#fff', strokeWidth = 2 }: IconProps) {
  const s = base(size, strokeWidth);
  return (
    <Svg width={s.size} height={s.size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={s.strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
      <Path d="M8 19v1M8 14v1M16 19v1M16 14v1M12 21v1M12 16v1" />
    </Svg>
  );
}

export function IconCloudLightning({ size, color = '#fff', strokeWidth = 2 }: IconProps) {
  const s = base(size, strokeWidth);
  return (
    <Svg width={s.size} height={s.size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={s.strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M6 16.326A7 7 0 1 1 15.71 9h1.79a4.5 4.5 0 0 1 .5 8.973" />
      <Path d="m13 12-3 5h4l-3 5" />
    </Svg>
  );
}

export function IconSnow({ size, color = '#fff', strokeWidth = 2 }: IconProps) {
  const s = base(size, strokeWidth);
  return (
    <Svg width={s.size} height={s.size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={s.strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M12 2v20M2 12h20M5 5l14 14M19 5 5 19" />
    </Svg>
  );
}

// Shared for Fog/Mist/Haze — visually similar atmospheric conditions,
// reusing one icon is a reasonable simplification, not a missing feature.
export function IconFog({ size, color = '#fff', strokeWidth = 2 }: IconProps) {
  const s = base(size, strokeWidth);
  return (
    <Svg width={s.size} height={s.size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={s.strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M3 8h18M6 12h12M3 16h18" />
    </Svg>
  );
}

export function IconDroplet({ size, color = '#fff', strokeWidth = 2 }: IconProps) {
  const s = base(size, strokeWidth);
  return (
    <Svg width={s.size} height={s.size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={s.strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M12 2C12 2 5 10.5 5 15a7 7 0 0 0 14 0c0-4.5-7-13-7-13z" />
    </Svg>
  );
}

export function IconWind({ size, color = '#fff', strokeWidth = 2 }: IconProps) {
  const s = base(size, strokeWidth);
  return (
    <Svg width={s.size} height={s.size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={s.strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2" />
    </Svg>
  );
}

export function IconMapPin({ size, color = '#fff', strokeWidth = 2 }: IconProps) {
  const s = base(size, strokeWidth);
  return (
    <Svg width={s.size} height={s.size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={s.strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M12 22s7-7.58 7-13A7 7 0 0 0 5 9c0 5.42 7 13 7 13Z" />
      <Circle cx="12" cy="9" r="2.5" />
    </Svg>
  );
}

export function IconEye({ size, color = '#fff', strokeWidth = 2 }: IconProps) {
  const s = base(size, strokeWidth);
  return (
    <Svg width={s.size} height={s.size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={s.strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" />
      <Circle cx="12" cy="12" r="3" />
    </Svg>
  );
}

export function IconUser({ size, color = '#fff', strokeWidth = 2 }: IconProps) {
  const s = base(size, strokeWidth);
  return (
    <Svg width={s.size} height={s.size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={s.strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <Circle cx="12" cy="7" r="4" />
    </Svg>
  );
}

export function IconLogOut({ size, color = '#fff', strokeWidth = 2 }: IconProps) {
  const s = base(size, strokeWidth);
  return (
    <Svg width={s.size} height={s.size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={s.strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <Path d="m16 17 5-5-5-5" />
      <Path d="M21 12H9" />
    </Svg>
  );
}

export function IconMic({ size, color = '#fff', strokeWidth = 2 }: IconProps) {
  const s = base(size, strokeWidth);
  return (
    <Svg width={s.size} height={s.size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={s.strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Rect x="9" y="2" width="6" height="12" rx="3" />
      <Path d="M5 10v2a7 7 0 0 0 14 0v-2" />
      <Path d="M12 19v3" />
    </Svg>
  );
}

export function IconPlay({ size, color = '#fff', strokeWidth = 2 }: IconProps) {
  const s = base(size, strokeWidth);
  return (
    <Svg width={s.size} height={s.size} viewBox="0 0 24 24" fill={color} stroke="none">
      <Path d="M8 5v14l11-7Z" />
    </Svg>
  );
}

export function IconPause({ size, color = '#fff', strokeWidth = 2 }: IconProps) {
  const s = base(size, strokeWidth);
  return (
    <Svg width={s.size} height={s.size} viewBox="0 0 24 24" fill={color} stroke="none">
      <Rect x="6" y="4" width="4" height="16" rx="1" />
      <Rect x="14" y="4" width="4" height="16" rx="1" />
    </Svg>
  );
}

export function IconMusic({ size, color = '#fff', strokeWidth = 2 }: IconProps) {
  const s = base(size, strokeWidth);
  return (
    <Svg width={s.size} height={s.size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={s.strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M9 18V5l12-2v13" />
      <Circle cx="6" cy="18" r="3" />
      <Circle cx="18" cy="16" r="3" />
    </Svg>
  );
}

export function IconCheck({ size, color = '#fff', strokeWidth = 2.4 }: IconProps) {
  const s = base(size, strokeWidth);
  return (
    <Svg width={s.size} height={s.size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={s.strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M20 6 9 17l-5-5" />
    </Svg>
  );
}

export function IconX({ size, color = '#fff', strokeWidth = 2.2 }: IconProps) {
  const s = base(size, strokeWidth);
  return (
    <Svg width={s.size} height={s.size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={s.strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M18 6 6 18" />
      <Path d="M6 6l12 12" />
    </Svg>
  );
}
