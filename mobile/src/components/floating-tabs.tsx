import { useEffect, useState, type ComponentProps } from 'react';
import { Tabs } from 'expo-router';
import { Animated, Easing, Platform, Pressable, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import NavbarIcon, { type NavbarDestination } from '@/components/navbar-icon';
import { useReducedMotion } from '@/hooks/use-reduced-motion';

type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

const BAR_COLOR = '#0B0911';
const ACTIVE_COLOR = '#A805F4';

function FloatingTabBar({ state, descriptors, emitter, navigateToTab }: TabBarProps) {
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const [width, setWidth] = useState(0);
  const [position] = useState(() => new Animated.Value(state.index));
  // Scale the entire silhouette with the reference's 618px canvas.
  const scale = width / 618;
  const height = 140 * scale;
  const padding = 24 * scale;
  const itemWidth = (width - padding * 2) / state.routes.length;
  const center = Animated.add(Animated.multiply(position, itemWidth), padding + itemWidth / 2);

  useEffect(() => {
    if (reducedMotion) {
      position.stopAnimation();
      position.setValue(state.index);
      return;
    }
    const animation = Animated.spring(position, {
      toValue: state.index,
      stiffness: 230,
      damping: 25,
      mass: 0.9,
      overshootClamping: true,
      useNativeDriver: Platform.OS !== 'web',
    });
    animation.start();
    return () => animation.stop();
  }, [position, reducedMotion, state.index]);

  return (
    <View
      pointerEvents="box-none"
      className="absolute items-center"
      style={{ left: insets.left + 20, right: insets.right + 20, bottom: insets.bottom + 16 }}>
      <View
        testID="floating-navbar"
        className="w-full max-w-[618px] overflow-hidden"
        style={{ height: width ? height : 88 }}
        onLayout={({ nativeEvent }) => setWidth(nativeEvent.layout.width)}>
        {width > 0 && <>
          <View pointerEvents="none" className="absolute bottom-0 left-0 right-0" style={{ top: 38 * scale, backgroundColor: BAR_COLOR }} />
          <Animated.View
            pointerEvents="none"
            testID="navbar-indicator"
            className="absolute left-0 top-0"
            style={{ width: 180 * scale, height, transform: [{ translateX: Animated.subtract(center, 80 * scale) }] }}>
            <Svg width="100%" height="100%" viewBox="0 0 180 140">
              <Path fill={BAR_COLOR} d="M0 38H8C16 38 17 29 30 20C45 6 61 0 80 0C104 0 118 10 137 27C147 36 155 38 170 38H180V140H0Z" />
            </Svg>
            <View className="absolute rounded-full" style={{ width: 96 * scale, height: 96 * scale, left: 32 * scale, top: 24 * scale, backgroundColor: ACTIVE_COLOR }} />
          </Animated.View>
          <View className="absolute inset-0 flex-row" style={{ paddingHorizontal: padding }}>
            {state.routes.map((route, index) => {
              const { options } = descriptors[route.key];
              const selected = state.index === index;
              const inputRange = [index - 1, index, index + 1];
              return (
                <Pressable
                  key={route.key}
                  testID={`navbar-${route.name}`}
                  accessibilityRole="tab"
                  accessibilityState={{ selected }}
                  aria-selected={selected}
                  accessibilityLabel={options.tabBarAccessibilityLabel ?? options.title ?? route.name}
                  className="flex-1 items-center justify-center active:opacity-70 focus-visible:rounded-full focus-visible:border-2 focus-visible:border-white"
                  style={{ paddingTop: 32 * scale }}
                  onPress={() => {
                    const event = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                    if (!selected && !event.defaultPrevented) navigateToTab(route.key);
                  }}
                  onLongPress={() => emitter.emit({ type: 'tabLongPress', target: route.key })}>
                  <Animated.View pointerEvents="none" style={{ transform: [
                    { translateY: position.interpolate({ inputRange, outputRange: [0, -14 * scale, 0], extrapolate: 'clamp' }) },
                  ] }}>
                    <NavbarIcon name={route.name as NavbarDestination} size={40 * scale} />
                  </Animated.View>
                </Pressable>
              );
            })}
          </View>
        </>}
      </View>
    </View>
  );
}

export default function FloatingTabs() {
  const reducedMotion = useReducedMotion();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        animation: reducedMotion ? 'none' : 'fade',
        transitionSpec: { animation: 'timing', config: { duration: 200, easing: Easing.out(Easing.cubic) } },
      }}
      tabBar={(props) => <FloatingTabBar {...props} />}>
      <Tabs.Screen name="home" options={{ title: 'Inicio' }} />
      <Tabs.Screen name="projects" options={{ title: 'Proyectos' }} />
      <Tabs.Screen name="camera" options={{ title: 'Cámara' }} />
      <Tabs.Screen name="settings" options={{ title: 'Ajustes' }} />
      <Tabs.Screen name="profile" options={{ title: 'Perfil' }} />
    </Tabs>
  );
}
