import { useEffect, useRef, useState, useCallback } from 'react';
import { createFlipbook, type FlipbookConfig, type FlipbookInstance, type PageInfo, type LoadingProgress } from '@3d-flipbook/core';

export interface UseFlipbookOptions extends Omit<FlipbookConfig, 'container'> {
  /**
   * Whether the flipbook should be enabled/initialized
   * @default true
   */
  enabled?: boolean;
}

export interface UseFlipbookReturn {
  /** Ref to attach to the container element */
  containerRef: React.RefObject<HTMLDivElement>;
  /** Current page information */
  currentPage: PageInfo;
  /** Whether the flipbook is currently animating */
  isAnimating: boolean;
  /** Loading progress information */
  loadingProgress: LoadingProgress;
  /** Whether the flipbook is ready to use */
  isReady: boolean;
  /** Navigate to next page */
  nextPage: () => Promise<void>;
  /** Navigate to previous page */
  prevPage: () => Promise<void>;
  /** Navigate to specific page */
  goToPage: (index: number) => Promise<void>;
  /** Resize the flipbook */
  resize: () => void;
}

/**
 * React hook for managing a 3D flipbook instance
 */
export function useFlipbook(options: UseFlipbookOptions): UseFlipbookReturn {
  const {
    enabled = true,
    onPageChange,
    onAnimationStart,
    onAnimationEnd,
    onLoadProgress,
    onLoadComplete,
    onError,
    onReady,
    ...flipbookOptions
  } = options;

  const containerRef = useRef<HTMLDivElement>(null);
  const flipbookRef = useRef<FlipbookInstance | null>(null);
  
  const [currentPage, setCurrentPage] = useState<PageInfo>({
    index: 0,
    total: 0,
    spread: 0,
    totalSpreads: 0
  });
  const [isAnimating, setIsAnimating] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState<LoadingProgress>({
    loaded: 0,
    total: 0,
    progress: 0
  });
  const [isReady, setIsReady] = useState(false);

  // Initialize flipbook when enabled and container is available
  useEffect(() => {
    if (!enabled || !containerRef.current) {
      return;
    }

    // Clean up existing instance
    if (flipbookRef.current) {
      flipbookRef.current.destroy();
      flipbookRef.current = null;
    }

    try {
      const config: FlipbookConfig = {
        ...flipbookOptions,
        container: containerRef.current,
        onPageChange: (pageInfo) => {
          setCurrentPage(pageInfo);
          onPageChange?.(pageInfo);
        },
        onAnimationStart: () => {
          setIsAnimating(true);
          onAnimationStart?.();
        },
        onAnimationEnd: () => {
          setIsAnimating(false);
          onAnimationEnd?.();
        },
        onLoadProgress: (progress) => {
          setLoadingProgress(progress);
          onLoadProgress?.(progress);
        },
        onLoadComplete: () => {
          onLoadComplete?.();
        },
        onError: (error) => {
          setIsReady(false);
          onError?.(error);
        },
        onReady: () => {
          setIsReady(true);
          if (flipbookRef.current) {
            setCurrentPage(flipbookRef.current.getCurrentPage());
          }
          onReady?.();
        }
      };

      flipbookRef.current = createFlipbook(config);
    } catch (error) {
      console.error('Failed to create flipbook:', error);
      onError?.(error as Error);
    }

    return () => {
      if (flipbookRef.current) {
        flipbookRef.current.destroy();
        flipbookRef.current = null;
      }
      setIsReady(false);
      setIsAnimating(false);
      setLoadingProgress({ loaded: 0, total: 0, progress: 0 });
    };
  }, [enabled, flipbookOptions.media.src, flipbookOptions.renderMode]);

  // Navigation functions
  const nextPage = useCallback(async () => {
    if (flipbookRef.current && isReady && !isAnimating) {
      await flipbookRef.current.nextPage();
    }
  }, [isReady, isAnimating]);

  const prevPage = useCallback(async () => {
    if (flipbookRef.current && isReady && !isAnimating) {
      await flipbookRef.current.prevPage();
    }
  }, [isReady, isAnimating]);

  const goToPage = useCallback(async (index: number) => {
    if (flipbookRef.current && isReady && !isAnimating) {
      await flipbookRef.current.goToPage(index);
    }
  }, [isReady, isAnimating]);

  const resize = useCallback(() => {
    if (flipbookRef.current && isReady) {
      flipbookRef.current.resize();
    }
  }, [isReady]);

  return {
    containerRef,
    currentPage,
    isAnimating,
    loadingProgress,
    isReady,
    nextPage,
    prevPage,
    goToPage,
    resize
  };
}