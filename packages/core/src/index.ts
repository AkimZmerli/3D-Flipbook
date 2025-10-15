// Export main classes and functions
export { Flipbook, createFlipbook, preloadImages, detectMediaType } from './core.js';

// Export types
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
} from './types.js';

// Export engines for advanced usage
export { SimpleWebGLEngine } from './engines/SimpleWebGLEngine.js';
export { CSSEngine } from './engines/CSSEngine.js';