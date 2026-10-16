import { AppState } from 'react-native';

/** Native authentication can resolve just before its system UI restores the app to active. */
export function waitForForeground(): Promise<boolean> {
  if (AppState.currentState === 'active') return Promise.resolve(true);
  return new Promise((resolve) => {
    let finished = false;
    let subscription: { remove: () => void } | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const finish = (active: boolean) => {
      if (finished) return;
      finished = true;
      subscription?.remove();
      clearTimeout(timer);
      resolve(active);
    };
    subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') finish(true);
    });
    timer = setTimeout(() => finish(false), 1500);
    if (AppState.currentState === 'active') finish(true);
  });
}
