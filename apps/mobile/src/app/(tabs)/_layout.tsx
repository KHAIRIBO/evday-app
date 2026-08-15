import { Redirect, Tabs } from 'expo-router';

import { IconBot, IconCalculator, IconFolder, IconHome, IconPencil } from '@/components/icon';
import { useSession } from '@/stores/session';
import { Colors, Fonts } from '@/constants/theme';

export default function TabsLayout() {
  // accessToken is the real gate: it only gets set after a successful
  // verify-email or a successful passcode/biometric unlock (which itself
  // calls /api/auth/refresh). Redirecting to /login is safe even for a
  // brand-new install — login.tsx itself redirects on to /email when
  // there's no stored session to unlock.
  const accessToken = useSession((s) => s.accessToken);
  if (!accessToken) return <Redirect href="/login" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.lime,
        tabBarInactiveTintColor: 'rgba(255,255,255,0.4)',
        tabBarStyle: {
          backgroundColor: Colors.tabbar,
          borderTopColor: Colors.panelBorder,
          borderTopWidth: 1,
          height: 66,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontFamily: Fonts.semiBold,
          fontSize: 9.5,
        },
        tabBarItemStyle: {
          paddingTop: 0,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{ title: 'Home', tabBarIcon: ({ color }) => <IconHome size={20} color={color} /> }}
      />
      <Tabs.Screen
        name="files"
        options={{ title: 'Files', tabBarIcon: ({ color }) => <IconFolder size={20} color={color} /> }}
      />
      <Tabs.Screen
        name="notes"
        options={{ title: 'Notes', tabBarIcon: ({ color }) => <IconPencil size={20} color={color} /> }}
      />
      <Tabs.Screen
        name="calculator"
        options={{ title: 'Calc', tabBarIcon: ({ color }) => <IconCalculator size={20} color={color} /> }}
      />
      <Tabs.Screen
        name="assistant"
        options={{ title: 'AI', tabBarIcon: ({ color }) => <IconBot size={20} color={color} /> }}
      />
    </Tabs>
  );
}
