import { MD3LightTheme } from 'react-native-paper';

export const colors = {
  ink: '#162E34',
  muted: '#52656A',
  background: '#F6F8F7',
  surface: '#FFFFFF',
  primary: '#11634F',
  line: '#DEE6E2',
};
export const theme = {
  ...MD3LightTheme,
  roundness: 4,
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.primary,
    onPrimary: '#FFFFFF',
    primaryContainer: '#E1F1E9',
    onPrimaryContainer: '#123F32',
    background: colors.background,
    surface: colors.surface,
    onSurface: colors.ink,
    onSurfaceVariant: colors.muted,
    outline: '#70847A',
    error: '#AF2929',
    errorContainer: '#FCE8E6',
    surfaceVariant: '#ECF1EE',
  },
};
