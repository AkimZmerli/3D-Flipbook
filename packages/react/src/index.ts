// Export components
export { Flipbook, type FlipbookProps, type FlipbookRef } from './components/Flipbook.js';
export { FlipbookModal, type FlipbookModalProps } from './components/FlipbookModal.js';

// Export hooks
export { useFlipbook, type UseFlipbookOptions, type UseFlipbookReturn } from './hooks/useFlipbook.js';

// Re-export types from core for convenience
export type {
  MediaType,
  RenderMode,
  PageLayout,
  EasingType,
  NavigationMethod,
  MediaSource,
  AnimationConfig,
  NavigationConfig,
  ThemeConfig,
  LoadingConfig,
  FlipbookOptions,
  PageInfo,
  LoadingProgress,
  FlipbookEvents,
  FlipbookConfig,
  FlipbookInstance
} from '@3d-flipbook/core';