import React, { useEffect, useState } from 'react';
import { Flipbook, type FlipbookProps } from './Flipbook.js';
import type { PageInfo, LoadingProgress } from '@3d-flipbook/core';

export interface FlipbookModalProps extends Omit<FlipbookProps, 'style'> {
  /**
   * Whether the modal is open
   */
  isOpen: boolean;
  /**
   * Callback when modal should close
   */
  onClose: () => void;
  /**
   * Modal title
   */
  title?: string;
  /**
   * Custom close button content
   */
  closeButton?: React.ReactNode;
  /**
   * Whether to show overlay background
   * @default true
   */
  showOverlay?: boolean;
  /**
   * Whether clicking overlay closes modal
   * @default true
   */
  closeOnOverlayClick?: boolean;
  /**
   * Whether ESC key closes modal
   * @default true
   */
  closeOnEscape?: boolean;
  /**
   * Custom loading component
   */
  loadingComponent?: React.ReactNode;
  /**
   * Custom modal styles
   */
  modalStyle?: React.CSSProperties;
  /**
   * Custom overlay styles
   */
  overlayStyle?: React.CSSProperties;
}

const defaultCloseButton = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

const defaultLoadingComponent = (
  <div style={{
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    textAlign: 'center',
    color: 'white',
    zIndex: 100
  }}>
    <div style={{
      width: '40px',
      height: '40px',
      border: '3px solid rgba(255, 255, 255, 0.3)',
      borderTop: '3px solid white',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
      margin: '0 auto 1rem'
    }} />
    <div>Loading flipbook...</div>
    <style>{`
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}</style>
  </div>
);

/**
 * Modal component for displaying flipbook in fullscreen overlay
 */
export const FlipbookModal: React.FC<FlipbookModalProps> = ({
  isOpen,
  onClose,
  title,
  closeButton = defaultCloseButton,
  showOverlay = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  loadingComponent = defaultLoadingComponent,
  modalStyle,
  overlayStyle,
  className,
  onPageChange,
  onLoadProgress,
  onReady,
  ...flipbookProps
}) => {
  const [isReady, setIsReady] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState<LoadingProgress>({
    loaded: 0,
    total: 0,
    progress: 0
  });
  const [currentPage, setCurrentPage] = useState<PageInfo>({
    index: 0,
    total: 0,
    spread: 0,
    totalSpreads: 0
  });

  // Handle ESC key
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeOnEscape, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  // Handle overlay click
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        backgroundColor: showOverlay ? 'rgba(0, 0, 0, 0.8)' : 'transparent',
        backdropFilter: showOverlay ? 'blur(4px)' : 'none',
        ...overlayStyle
      }}
      onClick={handleOverlayClick}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          ...modalStyle
        }}
        onClick={handleOverlayClick}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            zIndex: 60,
            padding: '0.5rem',
            color: 'rgba(255, 255, 255, 0.8)',
            backgroundColor: 'transparent',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'white';
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)';
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          {closeButton}
        </button>

        {/* Title */}
        {title && (
          <div
            style={{
              position: 'absolute',
              top: '1rem',
              left: '1rem',
              zIndex: 60,
              fontSize: '1.25rem',
              fontWeight: '300',
              color: 'rgba(255, 255, 255, 0.9)'
            }}
          >
            {title}
          </div>
        )}

        {/* Loading State */}
        {!isReady && loadingComponent}

        {/* Flipbook Container */}
        <div
          style={{
            width: '100%',
            height: '85vh',
            maxWidth: '90vw',
            borderRadius: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Flipbook
            {...flipbookProps}
            className={className}
            enabled={isOpen}
            onPageChange={(pageInfo) => {
              setCurrentPage(pageInfo);
              onPageChange?.(pageInfo);
            }}
            onLoadProgress={(progress) => {
              setLoadingProgress(progress);
              onLoadProgress?.(progress);
            }}
            onReady={() => {
              setIsReady(true);
              onReady?.();
            }}
            style={{
              width: '100%',
              height: '100%',
              opacity: isReady ? 1 : 0,
              transition: 'opacity 0.3s'
            }}
          />
        </div>

        {/* Navigation Hint */}
        {isReady && (
          <div
            style={{
              position: 'absolute',
              bottom: '1rem',
              right: '1rem',
              color: 'rgba(255, 255, 255, 0.6)',
              fontSize: '0.75rem',
              textAlign: 'right',
              display: window.innerWidth > 768 ? 'block' : 'none'
            }}
          >
            <div>Use arrow keys or click to navigate</div>
            <div>Press ESC to close</div>
          </div>
        )}
      </div>
    </div>
  );
};