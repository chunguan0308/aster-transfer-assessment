import { AppState, type AppStateStatus } from 'react-native';
import { waitForForeground } from '../src/features/auth/services/foreground';

beforeEach(() => jest.useFakeTimers());
afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});
test('does not delay a foreground app', async () => {
  AppState.currentState = 'active';
  await expect(waitForForeground()).resolves.toBe(true);
  expect(jest.getTimerCount()).toBe(0);
});
test('waits for native system UI to restore active and removes its listener/timer', async () => {
  AppState.currentState = 'inactive';
  let change!: (state: AppStateStatus) => void;
  const remove = jest.fn();
  jest.spyOn(AppState, 'addEventListener').mockImplementation((_type, listener) => {
    change = listener;
    return { remove };
  });
  const result = waitForForeground();
  AppState.currentState = 'active';
  change('active');
  await expect(result).resolves.toBe(true);
  expect(remove).toHaveBeenCalledTimes(1);
  expect(jest.getTimerCount()).toBe(0);
});
test('times out without authorizing when the app stays in the background', async () => {
  AppState.currentState = 'background';
  const remove = jest.fn();
  jest.spyOn(AppState, 'addEventListener').mockReturnValue({ remove });
  const result = waitForForeground();
  await jest.advanceTimersByTimeAsync(1500);
  await expect(result).resolves.toBe(false);
  expect(remove).toHaveBeenCalledTimes(1);
});
