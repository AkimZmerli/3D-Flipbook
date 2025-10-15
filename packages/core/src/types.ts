/**
 * Media types supported by the flipbook
 */
export type MediaType = 'image' | 'pdf' | 'url';

/**
 * Rendering mode for the flipbook
 */
export type RenderMode = 'css' | 'webgl';

/**
 * Page layout configuration
 */
export type PageLayout = 'single' | 'spread';

/**
 * Animation easing options
 */
export type EasingType = 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'cubic-bezier';

/**
 * Navigation method types
 */
export type NavigationMethod = 'click' | 'keyboard' | 'touch' | 'api';

/**
 * Media source configuration
 */
export interface MediaSource {
  /** Type of media */
  type: MediaType;
  /** Source URL or array of URLs */
  src: string | string[];
  /** Optional thumbnail for PDF preview */
  thumbnail?: string;
  /** Alt text for accessibility */
  alt?: string;
}

/**
 * Animation configuration
 */
export interface AnimationConfig {
  /** Duration of page flip animation in milliseconds */
  duration: number;
  /** Easing function type */
  easing: EasingType;
  /** Custom cubic-bezier values if easing is 'cubic-bezier' */
  customEasing?: [number, number, number, number];
  /** Enable physics-based animation */
  physics?: boolean;
}

/**
 * Navigation configuration
 */
export interface NavigationConfig {
  /** Enable keyboard navigation */
  keyboard: boolean;
  /** Enable touch/swipe navigation */
  touch: boolean;
  /** Enable click navigation */
  click: boolean;
  /** Show navigation arrows */
  arrows: boolean;
  /** Enable page indicator */
  pageIndicator: boolean;
}

/**
 * Theme and styling configuration
 */
export interface ThemeConfig {
  /** Background color */
  backgroundColor: string;
  /** Page shadow configuration */
  pageShadow: {
    enabled: boolean;
    color: string;
    blur: number;
    offset: number;
  };
  /** Book spine styling */
  spine: {
    enabled: boolean;
    color: string;
    width: number;
  };
}

/**
 * Loading configuration
 */
export interface LoadingConfig {
  /** Show loading indicator */
  showIndicator: boolean;
  /** Preload strategy */
  strategy: 'eager' | 'lazy' | 'progressive';
  /** Number of pages to preload ahead */
  preloadCount: number;
}

/**
 * Core flipbook configuration options
 */
export interface FlipbookOptions {
  /** Container element or selector */
  container: HTMLElement | string;
  /** Media source configuration */
  media: MediaSource;
  /** Rendering mode */
  renderMode?: RenderMode;
  /** Page layout */
  layout?: PageLayout;
  /** Initial page index */
  initialPage?: number;
  /** Animation configuration */
  animation?: Partial<AnimationConfig>;
  /** Navigation configuration */
  navigation?: Partial<NavigationConfig>;
  /** Theme configuration */
  theme?: Partial<ThemeConfig>;
  /** Loading configuration */
  loading?: Partial<LoadingConfig>;
  /** Enable responsive behavior */
  responsive?: boolean;
  /** Custom CSS classes */
  className?: string;
}

/**
 * Page information
 */
export interface PageInfo {
  /** Page index */
  index: number;
  /** Total number of pages */
  total: number;
  /** Current spread index */
  spread: number;
  /** Total number of spreads */
  totalSpreads: number;
}

/**
 * Loading progress information
 */
export interface LoadingProgress {
  /** Number of loaded items */
  loaded: number;
  /** Total number of items to load */
  total: number;
  /** Progress percentage (0-1) */
  progress: number;
  /** Currently loading item */
  currentItem?: string;
}

/**
 * Event callback types
 */
export interface FlipbookEvents {
  /** Called when page changes */
  onPageChange?: (pageInfo: PageInfo) => void;
  /** Called when animation starts */
  onAnimationStart?: () => void;
  /** Called when animation ends */
  onAnimationEnd?: () => void;
  /** Called during loading progress */
  onLoadProgress?: (progress: LoadingProgress) => void;
  /** Called when loading is complete */
  onLoadComplete?: () => void;
  /** Called when an error occurs */
  onError?: (error: Error) => void;
  /** Called when ready to display */
  onReady?: () => void;
}

/**
 * Complete flipbook configuration
 */
export interface FlipbookConfig extends FlipbookOptions, FlipbookEvents {}

/**
 * Flipbook instance API
 */
export interface FlipbookInstance {
  /** Navigate to next page */
  nextPage(): Promise<void>;
  /** Navigate to previous page */
  prevPage(): Promise<void>;
  /** Navigate to specific page */
  goToPage(index: number): Promise<void>;
  /** Get current page information */
  getCurrentPage(): PageInfo;
  /** Check if animation is in progress */
  isAnimating(): boolean;
  /** Get loading progress */
  getLoadingProgress(): LoadingProgress;
  /** Destroy the flipbook instance */
  destroy(): void;
  /** Update configuration */
  updateConfig(config: Partial<FlipbookConfig>): void;
  /** Resize the flipbook */
  resize(): void;
}