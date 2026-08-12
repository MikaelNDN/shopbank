import * as Haptics from 'expo-haptics';

export const haptics = {
  light: () =>
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => null),
  medium: () =>
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => null),
  heavy: () =>
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => null),
  success: () =>
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
      () => null,
    ),
  warning: () =>
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(
      () => null,
    ),
  error: () =>
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(
      () => null,
    ),
};
