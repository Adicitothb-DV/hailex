import { useSyncExternalStore } from 'react';
import { resolveScreen } from '../app/navigation/navigation';

function subscribe(onChange: () => void) {
  window.addEventListener('hashchange', onChange);
  return () => window.removeEventListener('hashchange', onChange);
}

export function useScreenNavigation() {
  const hash = useSyncExternalStore(
    subscribe,
    () => window.location.hash,
    () => '',
  );
  return { hash, screen: resolveScreen(hash) };
}
