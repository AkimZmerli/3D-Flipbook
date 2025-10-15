import type { FlipbookConfig, PageInfo, LoadingProgress } from '../types.js';

interface Spread {
  left: string | null;
  right: string | null;
  isCover?: boolean;
  isBack?: boolean;
}

export class CSSEngine {
  private container: HTMLElement;
  private flipbookElement!: HTMLElement;
  private config: FlipbookConfig;
  
  private spreads: Spread[] = [];
  private currentSpread = 0;
  private isFlipping = false;
  private flipDirection: 'forward' | 'back' | null = null;
  private displaySpread = 0;
  private loadedImages = new Set<number>();
  private flippingPageImage: string | null = null;
  private isBackFace = false;
  
  // Event handlers
  private boundKeyDown: (e: KeyboardEvent) => void;
  private boundWindowResize: () => void;

  constructor(config: FlipbookConfig) {
    this.config = config;
    this.container = typeof config.container === 'string' 
      ? document.querySelector(config.container)!
      : config.container;
    
    if (!this.container) {
      throw new Error('Container element not found');
    }

    // Bind event handlers
    this.boundKeyDown = this.handleKeyDown.bind(this);
    this.boundWindowResize = this.onWindowResize.bind(this);
    
    this.createStructure();
    this.bindEvents();
    this.loadImages();
  }

  private createStructure(): void {
    // Create main flipbook structure
    this.flipbookElement = document.createElement('div');
    this.flipbookElement.className = '3d-flipbook-wrapper';
    if (this.config.className) {
      this.flipbookElement.classList.add(this.config.className);
    }
    
    this.flipbookElement.innerHTML = `
      <div class="3d-flipbook-container">
        <div class="3d-flipbook">
          <div class="spread">
            <div class="book-spine"></div>
            <div class="page page-left"></div>
            <div class="page page-right"></div>
          </div>
        </div>
        
        ${this.config.navigation?.arrows ? `
          <button class="nav-button nav-button-prev" data-direction="prev">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="15,18 9,12 15,6"></polyline>
            </svg>
          </button>
          <button class="nav-button nav-button-next" data-direction="next">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9,18 15,12 9,6"></polyline>
            </svg>
          </button>
        ` : ''}
      </div>
      
      ${this.config.navigation?.pageIndicator ? `
        <div class="page-indicator">
          Page 1 / 1
        </div>
      ` : ''}
    `;
    
    this.container.appendChild(this.flipbookElement);
  }

  private bindEvents(): void {
    // Keyboard navigation
    if (this.config.navigation?.keyboard) {
      window.addEventListener('keydown', this.boundKeyDown);
    }
    
    // Click navigation
    if (this.config.navigation?.click) {
      const pages = this.flipbookElement.querySelectorAll('.page');
      pages.forEach(page => {
        page.addEventListener('click', (e) => {
          if (this.isFlipping) return;
          
          const rect = page.getBoundingClientRect();
          const clickX = (e as MouseEvent).clientX - rect.left;
          const pageWidth = rect.width;
          
          if (clickX < pageWidth / 2) {
            this.goToPrevSpread();
          } else {
            this.goToNextSpread();
          }
        });
      });
    }
    
    // Navigation buttons
    if (this.config.navigation?.arrows) {
      const prevBtn = this.flipbookElement.querySelector('.nav-button-prev');
      const nextBtn = this.flipbookElement.querySelector('.nav-button-next');
      
      prevBtn?.addEventListener('click', () => this.goToPrevSpread());
      nextBtn?.addEventListener('click', () => this.goToNextSpread());
    }
    
    // Touch navigation
    if (this.config.navigation?.touch) {
      this.bindTouchEvents();
    }
    
    // Resize events
    if (this.config.responsive) {
      window.addEventListener('resize', this.boundWindowResize);
    }
  }

  private bindTouchEvents(): void {
    let startX = 0;
    let startY = 0;
    
    this.flipbookElement.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
      }
    });
    
    this.flipbookElement.addEventListener('touchend', (e) => {
      if (this.isFlipping || e.changedTouches.length !== 1) return;
      
      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      
      const deltaX = endX - startX;
      const deltaY = endY - startY;
      
      // Check if it's a horizontal swipe
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
        if (deltaX > 0) {
          this.goToPrevSpread();
        } else {
          this.goToNextSpread();
        }
      }
    });
  }

  private async loadImages(): Promise<void> {
    const images = Array.isArray(this.config.media.src) 
      ? this.config.media.src 
      : [this.config.media.src];
    
    // Create spreads structure
    this.createSpreads(images);
    
    // Load images progressively
    const loadPromises = images.map((src, index) => this.loadImage(src, index));
    
    try {
      await Promise.all(loadPromises);
      this.renderCurrentSpread();
      this.config.onLoadComplete?.();
      this.config.onReady?.();
    } catch (error) {
      this.config.onError?.(error as Error);
    }
  }

  private loadImage(src: string, index: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        this.loadedImages.add(index);
        
        const progress: LoadingProgress = {
          loaded: this.loadedImages.size,
          total: Array.isArray(this.config.media.src) ? this.config.media.src.length : 1,
          progress: this.loadedImages.size / (Array.isArray(this.config.media.src) ? this.config.media.src.length : 1),
          currentItem: src
        };
        
        this.config.onLoadProgress?.(progress);
        resolve();
      };
      
      img.onerror = () => {
        reject(new Error(`Failed to load image: ${src}`));
      };
      
      img.src = src;
    });
  }

  private createSpreads(images: string[]): void {
    this.spreads = [];
    
    // First spread is the front cover - single page
    if (images.length > 0) {
      this.spreads.push({
        left: null,
        right: images[0],
        isCover: true,
        isBack: false
      });
    }
    
    // Middle pages are paired (1-2, 3-4, 5-6, etc.)
    for (let i = 1; i < images.length - 1; i += 2) {
      this.spreads.push({
        left: images[i] || null,
        right: images[i + 1] || null,
        isCover: false,
        isBack: false
      });
    }
    
    // Last spread is the back cover - single page
    if (images.length > 1) {
      this.spreads.push({
        left: images[images.length - 1],
        right: null,
        isCover: false,
        isBack: true
      });
    }
  }

  private renderCurrentSpread(): void {
    const spread = this.spreads[this.currentSpread];
    if (!spread) return;
    
    const leftPage = this.flipbookElement.querySelector('.page-left') as HTMLElement;
    const rightPage = this.flipbookElement.querySelector('.page-right') as HTMLElement;
    
    // Clear existing content
    leftPage.innerHTML = '';
    rightPage.innerHTML = '';
    
    // Render pages based on spread type
    if (spread.isCover) {
      // Front cover - only right page
      if (spread.right) {
        const img = document.createElement('img');
        img.src = spread.right;
        img.className = 'page-image page-cover-image';
        img.alt = this.config.media.alt || 'Front Cover';
        rightPage.appendChild(img);
      }
    } else if (spread.isBack) {
      // Back cover - only left page
      if (spread.left) {
        const img = document.createElement('img');
        img.src = spread.left;
        img.className = 'page-image page-cover-image';
        img.alt = this.config.media.alt || 'Back Cover';
        leftPage.appendChild(img);
      }
    } else {
      // Regular spread - both pages
      if (spread.left) {
        const img = document.createElement('img');
        img.src = spread.left;
        img.className = 'page-image';
        img.alt = this.config.media.alt || 'Left Page';
        leftPage.appendChild(img);
      }
      
      if (spread.right) {
        const img = document.createElement('img');
        img.src = spread.right;
        img.className = 'page-image';
        img.alt = this.config.media.alt || 'Right Page';
        rightPage.appendChild(img);
      }
    }
    
    // Update page indicator
    this.updatePageIndicator();
  }

  private updatePageIndicator(): void {
    const indicator = this.flipbookElement.querySelector('.page-indicator');
    if (indicator) {
      indicator.textContent = `Page ${this.currentSpread + 1} / ${this.spreads.length}`;
    }
  }

  private handleKeyDown(e: KeyboardEvent): void {
    if (this.isFlipping) return;
    
    if (e.key === 'ArrowRight') {
      this.goToNextSpread();
    } else if (e.key === 'ArrowLeft') {
      this.goToPrevSpread();
    }
  }

  private goToNextSpread(): void {
    if (this.isFlipping || this.currentSpread >= this.spreads.length - 1) return;
    
    this.performFlipAnimation('forward');
  }

  private goToPrevSpread(): void {
    if (this.isFlipping || this.currentSpread <= 0) return;
    
    this.performFlipAnimation('back');
  }

  private performFlipAnimation(direction: 'forward' | 'back'): void {
    this.isFlipping = true;
    this.flipDirection = direction;
    this.config.onAnimationStart?.();
    
    const duration = this.config.animation?.duration || 800;
    
    // Create flipping page element
    this.createFlippingPage(direction);
    
    // Update spread after animation
    setTimeout(() => {
      if (direction === 'forward') {
        this.currentSpread++;
      } else {
        this.currentSpread--;
      }
      
      this.renderCurrentSpread();
      this.removeFlippingPage();
      
      this.isFlipping = false;
      this.flipDirection = null;
      
      const pageInfo: PageInfo = {
        index: this.currentSpread * 2,
        total: this.spreads.length * 2,
        spread: this.currentSpread,
        totalSpreads: this.spreads.length
      };
      
      this.config.onPageChange?.(pageInfo);
      this.config.onAnimationEnd?.();
    }, duration);
  }

  private createFlippingPage(direction: 'forward' | 'back'): void {
    const flipbook = this.flipbookElement.querySelector('.3d-flipbook');
    if (!flipbook) return;
    
    const flippingContainer = document.createElement('div');
    flippingContainer.className = `flipping-page-container ${direction === 'back' ? 'flipping-page-container-back' : ''}`;
    
    const flippingPage = document.createElement('div');
    flippingPage.className = `flipping-page flip-${direction}`;
    
    // Determine which image to show
    let imageSrc: string | null = null;
    const currentSpread = this.spreads[this.currentSpread];
    
    if (direction === 'forward' && currentSpread) {
      imageSrc = currentSpread.right;
    } else if (direction === 'back' && currentSpread) {
      imageSrc = currentSpread.left;
    }
    
    if (imageSrc) {
      const img = document.createElement('img');
      img.src = imageSrc;
      img.className = 'page-image';
      img.style.width = '100%';
      img.style.height = '100%';
      img.style.objectFit = 'contain';
      flippingPage.appendChild(img);
    }
    
    const shadowOverlay = document.createElement('div');
    shadowOverlay.className = 'page-shadow-overlay';
    
    flippingContainer.appendChild(flippingPage);
    flippingContainer.appendChild(shadowOverlay);
    flipbook.appendChild(flippingContainer);
  }

  private removeFlippingPage(): void {
    const flippingContainer = this.flipbookElement.querySelector('.flipping-page-container');
    if (flippingContainer) {
      flippingContainer.remove();
    }
  }

  private onWindowResize(): void {
    // Handle responsive behavior
    // The CSS should handle most of the responsive behavior
  }

  public async nextPage(): Promise<void> {
    this.goToNextSpread();
  }

  public async prevPage(): Promise<void> {
    this.goToPrevSpread();
  }

  public async goToPage(index: number): Promise<void> {
    const spreadIndex = Math.floor(index / 2);
    if (spreadIndex < 0 || spreadIndex >= this.spreads.length || spreadIndex === this.currentSpread) return;
    
    this.currentSpread = spreadIndex;
    this.renderCurrentSpread();
    
    const pageInfo: PageInfo = {
      index: this.currentSpread * 2,
      total: this.spreads.length * 2,
      spread: this.currentSpread,
      totalSpreads: this.spreads.length
    };
    
    this.config.onPageChange?.(pageInfo);
  }

  public getCurrentPage(): PageInfo {
    return {
      index: this.currentSpread * 2,
      total: this.spreads.length * 2,
      spread: this.currentSpread,
      totalSpreads: this.spreads.length
    };
  }

  public getIsAnimating(): boolean {
    return this.isFlipping;
  }

  public resize(): void {
    this.onWindowResize();
  }

  public dispose(): void {
    // Remove event listeners
    if (this.config.navigation?.keyboard) {
      window.removeEventListener('keydown', this.boundKeyDown);
    }
    
    if (this.config.responsive) {
      window.removeEventListener('resize', this.boundWindowResize);
    }
    
    // Remove DOM elements
    if (this.flipbookElement && this.container.contains(this.flipbookElement)) {
      this.container.removeChild(this.flipbookElement);
    }
    
    // Clear references
    this.spreads = [];
    this.loadedImages.clear();
  }
}