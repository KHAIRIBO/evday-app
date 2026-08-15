import {
  IconCloud,
  IconCloudDrizzle,
  IconCloudLightning,
  IconCloudRain,
  IconFog,
  IconSnow,
  IconSun,
  type IconProps,
} from '@/components/icon';
import type { WeatherConditionT } from '@workspace/shared/schema';

const ICONS: Record<WeatherConditionT, (props: IconProps) => React.JSX.Element> = {
  Clear: IconSun,
  Clouds: IconCloud,
  Rain: IconCloudRain,
  Drizzle: IconCloudDrizzle,
  Thunderstorm: IconCloudLightning,
  Snow: IconSnow,
  Fog: IconFog,
  Mist: IconFog,
  Haze: IconFog,
};

export function WeatherIcon({ condition, ...props }: IconProps & { condition: WeatherConditionT }) {
  const Icon = ICONS[condition] ?? IconCloud;
  return <Icon {...props} />;
}
