# 3D Flipbook

A modern, lightweight 3D flipbook component for web applications. Features both CSS and WebGL rendering modes with smooth page flip animations, framework-agnostic core, and React components.

![npm version](https://img.shields.io/npm/v/@3d-flipbook/core)
![License](https://img.shields.io/badge/license-MIT-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)

## ✨ Features

- 🎯 **Dual Rendering Modes**: CSS-based and WebGL-based rendering
- 📱 **Responsive Design**: Works seamlessly on desktop and mobile
- ⚡ **Performance Optimized**: Efficient memory management and smooth animations
- 🎨 **Customizable**: Extensive theming and animation options
- 📚 **Framework Support**: React components with Vue/Angular adapters coming soon
- 🔧 **TypeScript Ready**: Full TypeScript support with comprehensive type definitions
- ♿ **Accessible**: Keyboard navigation and screen reader support
- 📄 **Multiple Media Types**: Support for images, PDFs, and remote URLs

## 🚀 Quick Start

### Installation

```bash
# For React projects
npm install @3d-flipbook/react @3d-flipbook/core

# For vanilla JavaScript
npm install @3d-flipbook/core

# With pnpm
pnpm add @3d-flipbook/react @3d-flipbook/core
```

### Basic Usage

#### React

```tsx
import React from 'react';
import { Flipbook } from '@3d-flipbook/react';
import '@3d-flipbook/core/css';

function App() {
  const images = [
    '/images/cover.jpg',
    '/images/page1.jpg',
    '/images/page2.jpg',
    '/images/back.jpg'
  ];

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Flipbook
        media={{ type: 'image', src: images }}
        renderMode="css"
        onPageChange={(page) => console.log('Page changed:', page)}
      />
    </div>
  );
}
```

#### Vanilla JavaScript

```javascript
import { createFlipbook } from '@3d-flipbook/core';
import '@3d-flipbook/core/css';

const flipbook = createFlipbook({
  container: '#flipbook-container',
  media: {
    type: 'image',
    src: [
      '/images/cover.jpg',
      '/images/page1.jpg',
      '/images/page2.jpg',
      '/images/back.jpg'
    ]
  },
  renderMode: 'css',
  onPageChange: (page) => console.log('Page changed:', page)
});
```

### Modal Usage (React)

```tsx
import React, { useState } from 'react';
import { FlipbookModal } from '@3d-flipbook/react';

function App() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsOpen(true)}>
        Open Flipbook
      </button>
      
      <FlipbookModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="My Photo Album"
        media={{ type: 'image', src: images }}
        renderMode="webgl"
      />
    </>
  );
}
```

## 📖 Documentation

### Configuration Options

```typescript
interface FlipbookConfig {
  // Required
  container: HTMLElement | string;
  media: MediaSource;
  
  // Optional
  renderMode?: 'css' | 'webgl';           // Default: 'css'
  layout?: 'single' | 'spread';           // Default: 'spread'
  initialPage?: number;                   // Default: 0
  
  // Animation settings
  animation?: {
    duration: number;                     // Default: 800ms
    easing: 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out';
    physics?: boolean;                    // Default: false
  };
  
  // Navigation settings
  navigation?: {
    keyboard: boolean;                    // Default: true
    touch: boolean;                       // Default: true
    click: boolean;                       // Default: true
    arrows: boolean;                      // Default: true
    pageIndicator: boolean;               // Default: true
  };
  
  // Theme settings
  theme?: {
    backgroundColor: string;              // Default: '#000000'
    pageShadow: {
      enabled: boolean;
      color: string;
      blur: number;
      offset: number;
    };
    spine: {
      enabled: boolean;
      color: string;
      width: number;
    };
  };
  
  // Loading settings
  loading?: {
    showIndicator: boolean;               // Default: true
    strategy: 'eager' | 'lazy' | 'progressive'; // Default: 'progressive'
    preloadCount: number;                 // Default: 3
  };
  
  // Event callbacks
  onPageChange?: (page: PageInfo) => void;
  onReady?: () => void;
  onError?: (error: Error) => void;
}
```

### Media Source Types

```typescript
// Image arrays
const imageMedia = {
  type: 'image',
  src: ['/img1.jpg', '/img2.jpg', '/img3.jpg']
};

// PDF files
const pdfMedia = {
  type: 'pdf',
  src: '/document.pdf'
};

// Remote URLs
const urlMedia = {
  type: 'url',
  src: 'https://example.com/api/flipbook-data'
};
```

### API Methods

```typescript
// Navigation
await flipbook.nextPage();
await flipbook.prevPage();
await flipbook.goToPage(5);

// Information
const currentPage = flipbook.getCurrentPage();
const isAnimating = flipbook.isAnimating();
const progress = flipbook.getLoadingProgress();

// Control
flipbook.resize();
flipbook.updateConfig({ theme: { backgroundColor: '#fff' } });
flipbook.destroy();
```

## 🎨 Customization

### Custom Themes

```css
/* Custom CSS theme */
.my-flipbook-theme {
  --flipbook-bg-color: #1a1a1a;
  --flipbook-page-shadow: 0 0 30px rgba(0, 0, 0, 0.5);
  --flipbook-spine-color: #444;
  --flipbook-nav-color: rgba(255, 255, 255, 0.8);
}
```

### Animation Customization

```typescript
const flipbook = createFlipbook({
  container: '#container',
  media: { type: 'image', src: images },
  animation: {
    duration: 1200,
    easing: 'cubic-bezier',
    customEasing: [0.25, 0.46, 0.45, 0.94],
    physics: true
  }
});
```

## 📱 Mobile Support

The flipbook is fully responsive and touch-enabled:

- **Swipe gestures** for page navigation
- **Pinch-to-zoom** support
- **Adaptive layouts** for different screen sizes
- **Touch-optimized** navigation controls

## ⚡ Performance

- **Lazy loading** with configurable preload strategies
- **WebGL optimizations** with efficient texture management
- **Memory management** with automatic cleanup
- **Progressive enhancement** fallback from WebGL to CSS

## 🧪 Browser Support

- **Modern browsers** (Chrome 80+, Firefox 75+, Safari 13+, Edge 80+)
- **WebGL support** for enhanced rendering (optional)
- **Graceful degradation** to CSS mode when WebGL unavailable
- **Mobile browsers** with touch event support

## 📦 Package Structure

```
3d-flipbook/
├── packages/
│   ├── core/           # Framework-agnostic core engine
│   ├── react/          # React components and hooks
│   └── vue/            # Vue components (coming soon)
├── examples/           # Usage examples
└── docs/              # Documentation
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

```bash
# Clone the repository
git clone https://github.com/akimzmerli/3d-flipbook.git
cd 3d-flipbook

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Start development mode
pnpm dev
```

## 📄 License

MIT License - see the [LICENSE](LICENSE) file for details.

---

**Created by WebDev4Life (akimzmerli)**

⭐ If you find this project useful, please consider giving it a star on GitHub!