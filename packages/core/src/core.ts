import type { FlipbookConfig, FlipbookInstance, PageInfo, LoadingProgress } from './types.js';
import { WebGLEngine } from './engines/WebGLEngine.js';
import { CSSEngine } from './engines/CSSEngine.js';

/**
 * Default configuration for the flipbook
 */
const defaultConfig: Partial<FlipbookConfig> = {
  renderMode: 'css',
  layout: 'spread',
  initialPage: 0,
  animation: {
    duration: 800,
    easing: 'ease-in-out',
    physics: false
  },
  navigation: {
    keyboard: true,
    touch: true,
    click: true,
    arrows: true,
    pageIndicator: true
  },
  theme: {
    backgroundColor: '#000000',
    pageShadow: {
      enabled: true,
      color: 'rgba(0, 0, 0, 0.3)',
      blur: 20,
      offset: 5
    },
    spine: {
      enabled: true,
      color: '#666666',
      width: 2
    }
  },
  loading: {
    showIndicator: true,
    strategy: 'progressive',
    preloadCount: 3
  },
  responsive: true
};

/**
 * Main Flipbook class that manages the rendering engine and provides the public API
 */
export class Flipbook implements FlipbookInstance {
  private engine: WebGLEngine | CSSEngine;
  private config: FlipbookConfig;

  constructor(config: FlipbookConfig) {
    // Merge user config with defaults
    this.config = this.mergeConfig(defaultConfig, config);
    
    // Validate required config
    this.validateConfig(this.config);
    
    // Create appropriate engine based on render mode
    if (this.config.renderMode === 'webgl') {
      this.engine = new WebGLEngine(this.config);
    } else {
      this.engine = new CSSEngine(this.config);
    }
  }

  private mergeConfig(defaults: Partial<FlipbookConfig>, userConfig: FlipbookConfig): FlipbookConfig {
    return {
      ...defaults,
      ...userConfig,
      animation: { ...defaults.animation, ...userConfig.animation },
      navigation: { ...defaults.navigation, ...userConfig.navigation },
      theme: { 
        ...defaults.theme, 
        ...userConfig.theme,
        pageShadow: { ...defaults.theme?.pageShadow, ...userConfig.theme?.pageShadow },
        spine: { ...defaults.theme?.spine, ...userConfig.theme?.spine }
      },
      loading: { ...defaults.loading, ...userConfig.loading }
    } as FlipbookConfig;
  }

  private validateConfig(config: FlipbookConfig): void {
    if (!config.container) {
      throw new Error('Container element is required');
    }
    
    if (!config.media || !config.media.src) {
      throw new Error('Media source is required');
    }
    
    if (config.renderMode === 'webgl') {
      // Check for WebGL support
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) {
        console.warn('WebGL not supported, falling back to CSS rendering');
        config.renderMode = 'css';
      }
    }
  }

  /**
   * Navigate to the next page
   */
  public async nextPage(): Promise<void> {
    return this.engine.nextPage();
  }

  /**
   * Navigate to the previous page
   */
  public async prevPage(): Promise<void> {
    return this.engine.prevPage();
  }

  /**
   * Navigate to a specific page by index
   */
  public async goToPage(index: number): Promise<void> {
    return this.engine.goToPage(index);
  }

  /**
   * Get current page information
   */
  public getCurrentPage(): PageInfo {
    return this.engine.getCurrentPage();
  }

  /**
   * Check if animation is currently in progress
   */
  public isAnimating(): boolean {
    return this.engine.getIsAnimating();
  }

  /**
   * Get loading progress (always returns completed for CSS engine)
   */
  public getLoadingProgress(): LoadingProgress {
    const currentPage = this.getCurrentPage();
    return {
      loaded: currentPage.total,
      total: currentPage.total,
      progress: 1
    };
  }

  /**
   * Update configuration (limited support - mainly for theme changes)
   */
  public updateConfig(newConfig: Partial<FlipbookConfig>): void {
    this.config = this.mergeConfig(this.config, newConfig as FlipbookConfig);
    
    // For major changes, we might need to recreate the engine
    // For now, just update what we can
    if (newConfig.theme?.backgroundColor && this.engine instanceof WebGLEngine) {
      // Update background color for WebGL engine
      // This would require engine method to update renderer clear color
    }
  }

  /**
   * Resize the flipbook to fit its container
   */
  public resize(): void {
    this.engine.resize();
  }

  /**
   * Destroy the flipbook instance and clean up resources
   */
  public destroy(): void {
    this.engine.dispose();
  }

  /**
   * Get the current configuration
   */
  public getConfig(): FlipbookConfig {
    return { ...this.config };
  }

  /**
   * Check if WebGL rendering is supported
   */
  public static isWebGLSupported(): boolean {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    return !!gl;
  }

  /**
   * Get version information
   */
  public static getVersion(): string {
    return '1.0.0';
  }
}

/**
 * Factory function to create a new flipbook instance
 */
export function createFlipbook(config: FlipbookConfig): FlipbookInstance {
  return new Flipbook(config);
}

/**
 * Utility function to preload images
 */
export function preloadImages(sources: string[]): Promise<void[]> {
  const loadPromises = sources.map(src => {
    return new Promise<void>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => reject(new Error(`Failed to load: ${src}`));
      img.src = src;
    });
  });
  
  return Promise.all(loadPromises);
}

/**
 * Utility function to detect media type from URL/extension
 */
export function detectMediaType(src: string): 'image' | 'pdf' | 'url' {
  const extension = src.split('.').pop()?.toLowerCase();
  
  if (extension === 'pdf') {
    return 'pdf';
  }
  
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(extension || '')) {
    return 'image';
  }
  
  return 'url';
}