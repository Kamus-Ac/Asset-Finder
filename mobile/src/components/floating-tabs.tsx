import { useEffect, useState, type ComponentProps } from 'react';
import { Tabs } from 'expo-router';
import { House, FolderClosed, Settings2 } from 'lucide-react-native';
import { Animated, Easing, Platform, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

const icons = { home: House, projects: FolderClosed, settings: Settings2 };

function FloatingTabBar({ state, descriptors, emitter, navigateToTab }: TabBarProps) {
  const insets = useSafeAreaInsets();
  const [width, setWidth] = useState(0);
  const [hovered, setHovered] = useState<number | null>(null);
  const [position] = useState(() => new Animated.Value(state.index));
  const itemWidth = Math.max(0, width - 16) / state.routes.length;
  const target = hovered ?? state.index;

  useEffect(() => {
    const animation = Animated.timing(position, {
      toValue: target,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: Platform.OS !== 'web',
    });
    animation.start();
    return () => animation.stop();
  }, [position, target]);

  return (
    <View
      pointerEvents="box-none"
      className="absolute items-center"
      style={{ left: insets.left + 40, right: insets.right + 40, bottom: insets.bottom + 16 }}>
      <View
        className="h-20 w-full max-w-[420px] flex-row rounded-[20px] bg-[#0B0911] p-2"
        onLayout={({ nativeEvent }) => setWidth(nativeEvent.layout.width)}>
        {width > 0 && (
          <Animated.View
            pointerEvents="none"
            className="absolute bottom-2 left-2 top-2 rounded-[20px] bg-[#320A3D]"
            style={{ width: itemWidth, transform: [{ translateX: Animated.multiply(position, itemWidth) }] }}
          />
        )}
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const selected = state.index === index;
          const Icon = icons[route.name as keyof typeof icons];
          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              accessibilityLabel={options.tabBarAccessibilityLabel ?? options.title}
              className="flex-1 items-center justify-center gap-1 rounded-[20px]"
              onHoverIn={() => setHovered(index)}
              onHoverOut={() => setHovered(null)}
              onPress={() => {
                const event = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                if (!selected && !event.defaultPrevented) navigateToTab(route.key);
              }}
              onLongPress={() => emitter.emit({ type: 'tabLongPress', target: route.key })}>
              {Icon && <Icon color="#FFFFFF" size={23} strokeWidth={1.8} />}
              <Text className="font-sans-semibold text-xs text-white">{options.title ?? route.name}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function FloatingTabs() {
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <FloatingTabBar {...props} />}>
      <Tabs.Screen name="home" options={{ title: 'Inicio' }} />
      <Tabs.Screen name="projects" options={{ title: 'Proyectos' }} />
      <Tabs.Screen name="settings" options={{ title: 'Ajustes' }} />
    </Tabs>
  );
}
