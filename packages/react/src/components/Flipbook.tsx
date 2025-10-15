import React, { forwardRef, useImperativeHandle } from 'react';
import { useFlipbook, type UseFlipbookOptions, type UseFlipbookReturn } from '../hooks/useFlipbook.js';
import type { FlipbookInstance } from '@3d-flipbook/core';

export interface FlipbookProps extends UseFlipbookOptions {
  /**
   * CSS class name for the container
   */
  className?: string;
  /**
   * Inline styles for the container
   */
  style?: React.CSSProperties;
  /**
   * Children to render (useful for custom loading states)
   */
  children?: React.ReactNode;
}

export interface FlipbookRef extends Omit<UseFlipbookReturn, 'containerRef'> {}

/**
 * React component for 3D flipbook
 */
export const Flipbook = forwardRef<FlipbookRef, FlipbookProps>(
  ({ className, style, children, ...options }, ref) => {
    const flipbook = useFlipbook(options);

    useImperativeHandle(ref, () => ({
      currentPage: flipbook.currentPage,
      isAnimating: flipbook.isAnimating,
      loadingProgress: flipbook.loadingProgress,
      isReady: flipbook.isReady,
      nextPage: flipbook.nextPage,
      prevPage: flipbook.prevPage,
      goToPage: flipbook.goToPage,
      resize: flipbook.resize
    }), [flipbook]);

    return (
      <div
        ref={flipbook.containerRef}
        className={className}
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          ...style
        }}
      >
        {children}
      </div>
    );
  }
);

Flipbook.displayName = 'Flipbook';