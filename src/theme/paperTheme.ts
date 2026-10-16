import { MD3LightTheme } from 'react-native-paper';

import { colors } from './tokens';

export const theme = {
  ...MD3LightTheme,
  roundness: 4,
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.primary,
    onPrimary: colors.onPrimary,
    primaryContainer: colors.primarySoft,
    onPrimaryContainer: colors.onPrimarySoft,
    background: colors.background,
    surface: colors.surface,
    onSurface: colors.ink,
    onSurfaceVariant: colors.muted,
    outline: colors.outline,
    error: colors.error,
    errorContainer: colors.errorSoft,
    surfaceVariant: colors.surfaceVariant,
  },
};
