import { useSyncExternalStore } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

const subscribe = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;

/** Keep server markup and hydration consistent without a synchronous effect update. */
export function useColorScheme() {
  const hydrated = useSyncExternalStore(subscribe, clientSnapshot, serverSnapshot);
  const colorScheme = useRNColorScheme();
  return hydrated ? colorScheme : 'light';
}
