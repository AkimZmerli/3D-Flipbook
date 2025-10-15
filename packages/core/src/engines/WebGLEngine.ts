import * as THREE from 'three';
import { gsap } from 'gsap';
import type { FlipbookConfig, PageInfo, LoadingProgress } from '../types.js';

export interface PageTexture {
  texture: THREE.Texture;
  aspectRatio: number;
  dimensions: { width: number; height: number };
}

export class WebGLEngine {
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private container: HTMLElement;
  
  private pages: THREE.Mesh[] = [];
  private textures: PageTexture[] = [];
  private currentPage = 0;
  private isAnimating = false;
  
  private config: FlipbookConfig;
  private animationId?: number;
  
  // Raycaster for interactions
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();
  
  // Bound event handlers for proper cleanup
  private boundMouseDown: (event: MouseEvent) => void;
  private boundMouseMove: (event: MouseEvent) => void;
  private boundTouchStart: (event: TouchEvent) => void;
  private boundTouchMove: (event: TouchEvent) => void;
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
    this.boundMouseDown = this.onMouseDown.bind(this);
    this.boundMouseMove = this.onMouseMove.bind(this);
    this.boundTouchStart = this.onTouchStart.bind(this);
    this.boundTouchMove = this.onTouchMove.bind(this);
    this.boundWindowResize = this.onWindowResize.bind(this);
    
    this.scene = new THREE.Scene();
    this.setupCamera();
    this.setupRenderer();
    this.bindEvents();
    
    this.loadTextures()
      .then(() => {
        this.createPages();
        this.animate();
        this.config.onReady?.();
      })
      .catch((error) => {
        this.config.onError?.(error);
      });
  }

  private setupCamera(): void {
    const aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(35, aspect, 0.1, 1000);
    this.camera.position.set(0, 0, 10);
    this.camera.lookAt(0, 0, 0);
  }

  private setupRenderer(): void {
    this.renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: false,
      powerPreference: "high-performance",
      preserveDrawingBuffer: true,
      premultipliedAlpha: false
    });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = false;
    this.renderer.toneMapping = THREE.NoToneMapping;
    // @ts-ignore - Disable color management completely
    this.renderer.outputEncoding = THREE.LinearEncoding;
    
    // Set background color from theme
    const bgColor = this.config.theme?.backgroundColor || '#000000';
    this.renderer.setClearColor(bgColor, 1);
    
    this.container.appendChild(this.renderer.domElement);
  }

  private async loadTextures(): Promise<void> {
    const loader = new THREE.TextureLoader();
    const images = Array.isArray(this.config.media.src) 
      ? this.config.media.src 
      : [this.config.media.src];
    
    const loadPromises: Promise<PageTexture>[] = [];

    images.forEach((imagePath, index) => {
      const promise = new Promise<PageTexture>((resolve, reject) => {
        loader.load(
          imagePath,
          (texture) => {
            // Validate texture
            if (!texture.image || texture.image.width === 0 || texture.image.height === 0) {
              reject(new Error(`Invalid image dimensions: ${imagePath}`));
              return;
            }
            
            // Optimize texture settings
            texture.minFilter = THREE.LinearFilter;
            texture.magFilter = THREE.LinearFilter;
            texture.format = THREE.RGBAFormat;
            // @ts-ignore
            texture.encoding = THREE.LinearEncoding;
            texture.generateMipmaps = false;
            texture.flipY = false;
            texture.needsUpdate = true;

            const pageTexture: PageTexture = {
              texture,
              aspectRatio: texture.image.width / texture.image.height,
              dimensions: {
                width: texture.image.width,
                height: texture.image.height
              }
            };

            resolve(pageTexture);
            
            // Update loading progress
            const progress: LoadingProgress = {
              loaded: index + 1,
              total: images.length,
              progress: (index + 1) / images.length,
              currentItem: imagePath
            };
            this.config.onLoadProgress?.(progress);
          },
          undefined,
          (error) => {
            reject(new Error(`Failed to load ${imagePath}: ${error instanceof Error ? error.message : 'Unknown error'}`));
          }
        );
      });
      
      loadPromises.push(promise);
    });

    try {
      this.textures = await Promise.all(loadPromises);
      this.config.onLoadComplete?.();
    } catch (error) {
      throw error;
    }
  }

  private createPages(): void {
    const baseWidth = 7;
    const baseHeight = 9;

    this.textures.forEach((pageTexture, index) => {
      // Cover page is wider
      const width = index === 0 ? baseWidth * 1.2 : baseWidth;
      const height = baseHeight;

      // Create geometry with high subdivision for smooth bending
      const geometry = new THREE.PlaneGeometry(width, height, 32, 32);
      
      // Use custom unlit shader to bypass color management
      const material = new THREE.ShaderMaterial({
        uniforms: {
          uTexture: { value: pageTexture.texture }
        },
        vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform sampler2D uTexture;
          varying vec2 vUv;
          
          void main() {
            vec4 texColor = texture2D(uTexture, vUv);
            
            // Apply a darkening factor to match HTML rendering
            float darkenFactor = 0.85;
            texColor.rgb *= darkenFactor;
            
            gl_FragColor = texColor;
          }
        `,
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: true
      });

      const page = new THREE.Mesh(geometry, material);
      
      // Position pages in a stack
      page.position.z = -index * 0.001;
      page.castShadow = false;
      page.receiveShadow = false;
      
      // Initially hide all pages except the first
      if (index > 0) {
        page.visible = false;
      }

      this.pages.push(page);
      this.scene.add(page);
    });
  }

  private bindEvents(): void {
    if (!this.config.navigation?.click) return;
    
    // Mouse events
    this.container.addEventListener('mousedown', this.boundMouseDown);
    this.container.addEventListener('mousemove', this.boundMouseMove);
    
    // Touch events
    if (this.config.navigation?.touch) {
      this.container.addEventListener('touchstart', this.boundTouchStart);
      this.container.addEventListener('touchmove', this.boundTouchMove);
    }
    
    // Resize events
    if (this.config.responsive) {
      window.addEventListener('resize', this.boundWindowResize);
    }
  }

  private onMouseDown(event: MouseEvent): void {
    if (this.isAnimating) return;

    this.updateMousePosition(event.clientX, event.clientY);
    this.handleInteraction();
  }

  private onMouseMove(event: MouseEvent): void {
    this.updateMousePosition(event.clientX, event.clientY);
  }

  private onTouchStart(event: TouchEvent): void {
    if (this.isAnimating || event.touches.length !== 1) return;

    const touch = event.touches[0];
    this.updateMousePosition(touch.clientX, touch.clientY);
    this.handleInteraction();
  }

  private onTouchMove(event: TouchEvent): void {
    if (event.touches.length !== 1) return;

    const touch = event.touches[0];
    this.updateMousePosition(touch.clientX, touch.clientY);
  }

  private updateMousePosition(clientX: number, clientY: number): void {
    const rect = this.container.getBoundingClientRect();
    this.mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;
  }

  private handleInteraction(): void {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.pages);

    if (intersects.length > 0) {
      // Determine if click is on left or right side of page
      const intersect = intersects[0];
      const uv = intersect.uv;
      
      if (uv && uv.x < 0.5) {
        // Left side - go to previous page
        this.prevPage();
      } else {
        // Right side - go to next page
        this.nextPage();
      }
    }
  }

  public async nextPage(): Promise<void> {
    if (this.isAnimating || this.currentPage >= this.pages.length - 1) return;
    
    this.isAnimating = true;
    this.config.onAnimationStart?.();
    
    const currentPageMesh = this.pages[this.currentPage];
    const nextPageMesh = this.pages[this.currentPage + 1];
    
    // Show next page
    nextPageMesh.visible = true;
    nextPageMesh.position.z = currentPageMesh.position.z - 0.001;
    
    // Animate page turn
    const duration = (this.config.animation?.duration || 800) / 1000;
    const timeline = gsap.timeline({
      onComplete: () => {
        this.currentPage++;
        this.isAnimating = false;
        
        const pageInfo: PageInfo = {
          index: this.currentPage,
          total: this.pages.length,
          spread: Math.floor(this.currentPage / 2),
          totalSpreads: Math.ceil(this.pages.length / 2)
        };
        
        this.config.onPageChange?.(pageInfo);
        this.config.onAnimationEnd?.();
        
        // Hide previous page
        currentPageMesh.visible = false;
        
        // Reset bend values (only for shader materials)
        if (currentPageMesh.material instanceof THREE.ShaderMaterial && currentPageMesh.material.uniforms?.uBend) {
          currentPageMesh.material.uniforms.uBend.value = 0;
        }
      }
    });

    timeline.to(currentPageMesh.rotation, {
      y: -Math.PI,
      duration: duration,
      ease: this.config.animation?.easing || "power2.inOut"
    });
  }

  public async prevPage(): Promise<void> {
    if (this.isAnimating || this.currentPage <= 0) return;
    
    this.isAnimating = true;
    this.config.onAnimationStart?.();
    
    const currentPageMesh = this.pages[this.currentPage];
    const prevPageMesh = this.pages[this.currentPage - 1];
    
    // Show previous page
    prevPageMesh.visible = true;
    prevPageMesh.rotation.y = -Math.PI; // Start rotated
    
    // Animate page turn back
    const duration = (this.config.animation?.duration || 800) / 1000;
    const timeline = gsap.timeline({
      onComplete: () => {
        this.currentPage--;
        this.isAnimating = false;
        
        const pageInfo: PageInfo = {
          index: this.currentPage,
          total: this.pages.length,
          spread: Math.floor(this.currentPage / 2),
          totalSpreads: Math.ceil(this.pages.length / 2)
        };
        
        this.config.onPageChange?.(pageInfo);
        this.config.onAnimationEnd?.();
        
        // Hide current page
        currentPageMesh.visible = false;
        
        // Reset bend values (only for shader materials)
        if (prevPageMesh.material instanceof THREE.ShaderMaterial && prevPageMesh.material.uniforms?.uBend) {
          prevPageMesh.material.uniforms.uBend.value = 0;
        }
      }
    });

    timeline.to(prevPageMesh.rotation, {
      y: 0,
      duration: duration,
      ease: this.config.animation?.easing || "power2.inOut"
    });
  }

  public async goToPage(pageIndex: number): Promise<void> {
    if (pageIndex < 0 || pageIndex >= this.pages.length || pageIndex === this.currentPage) return;
    
    // For now, just jump to page (could add multi-page animation later)
    this.pages[this.currentPage].visible = false;
    this.currentPage = pageIndex;
    this.pages[this.currentPage].visible = true;
    this.pages[this.currentPage].rotation.y = 0;
    
    const pageInfo: PageInfo = {
      index: this.currentPage,
      total: this.pages.length,
      spread: Math.floor(this.currentPage / 2),
      totalSpreads: Math.ceil(this.pages.length / 2)
    };
    
    this.config.onPageChange?.(pageInfo);
  }

  public getCurrentPage(): PageInfo {
    return {
      index: this.currentPage,
      total: this.pages.length,
      spread: Math.floor(this.currentPage / 2),
      totalSpreads: Math.ceil(this.pages.length / 2)
    };
  }

  public getIsAnimating(): boolean {
    return this.isAnimating;
  }

  private onWindowResize(): void {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  private animate(): void {
    this.animationId = requestAnimationFrame(this.animate.bind(this));
    
    // Early exit if disposed
    if (!this.renderer || !this.scene || !this.camera) {
      return;
    }
    
    try {
      // Update time uniform for subtle animations (only for shader materials)
      const time = Date.now() * 0.001;
      this.pages.forEach(page => {
        if (page.material instanceof THREE.ShaderMaterial && page.material.uniforms?.uTime) {
          page.material.uniforms.uTime.value = time;
        }
      });
      
      this.renderer.render(this.scene, this.camera);
    } catch (error) {
      console.error('Animation error:', error);
      if (this.animationId) {
        cancelAnimationFrame(this.animationId);
      }
    }
  }

  public dispose(): void {
    try {
      // Stop animation loop first
      if (this.animationId) {
        cancelAnimationFrame(this.animationId);
        this.animationId = undefined;
      }

      // Clean up pages and materials
      this.pages.forEach((page, index) => {
        try {
          if (page.material instanceof THREE.ShaderMaterial) {
            // Dispose uniforms
            Object.values(page.material.uniforms).forEach(uniform => {
              if (uniform.value && typeof uniform.value.dispose === 'function') {
                uniform.value.dispose();
              }
            });
          }
          // Dispose material
          const material = page.material;
          if (Array.isArray(material)) {
            material.forEach(mat => mat.dispose());
          } else {
            material.dispose();
          }
          page.geometry.dispose();
          this.scene.remove(page);
        } catch (error) {
          console.warn(`Failed to dispose page ${index}:`, error);
        }
      });
      
      // Clean up textures
      this.textures.forEach(({ texture }, index) => {
        try {
          texture.dispose();
        } catch (error) {
          console.warn(`Failed to dispose texture ${index}:`, error);
        }
      });
      
      // Clear arrays
      this.pages = [];
      this.textures = [];
      
      // Dispose renderer and WebGL context
      if (this.renderer) {
        // Force context loss to prevent memory leaks
        const gl = this.renderer.getContext();
        if (gl && gl.getExtension('WEBGL_lose_context')) {
          gl.getExtension('WEBGL_lose_context')?.loseContext();
        }
        
        this.renderer.dispose();
        this.renderer.forceContextLoss();
        
        // Remove DOM element safely
        if (this.renderer.domElement && 
            this.container && 
            this.container.contains(this.renderer.domElement)) {
          this.container.removeChild(this.renderer.domElement);
        }
      }
      
      // Remove event listeners
      if (this.container) {
        this.container.removeEventListener('mousedown', this.boundMouseDown);
        this.container.removeEventListener('mousemove', this.boundMouseMove);
        this.container.removeEventListener('touchstart', this.boundTouchStart);
        this.container.removeEventListener('touchmove', this.boundTouchMove);
      }
      
      if (this.boundWindowResize) {
        window.removeEventListener('resize', this.boundWindowResize);
      }
    } catch (error) {
      console.error('Error during WebGLEngine disposal:', error);
    }
  }

  public resize(): void {
    this.onWindowResize();
  }
}