import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Flipbook, FlipbookModal } from './packages/react/dist/index.js';

// Sample images for testing
const sampleImages = [
  'data:image/svg+xml;base64,' + btoa(`
    <svg width="400" height="600" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#4a90e2"/>
      <text x="50%" y="50%" text-anchor="middle" fill="white" font-size="24" font-family="Arial">
        FRONT COVER
      </text>
    </svg>
  `),
  'data:image/svg+xml;base64,' + btoa(`
    <svg width="400" height="600" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#7ed321"/>
      <text x="50%" y="50%" text-anchor="middle" fill="white" font-size="24" font-family="Arial">
        PAGE 1
      </text>
    </svg>
  `),
  'data:image/svg+xml;base64,' + btoa(`
    <svg width="400" height="600" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f5a623"/>
      <text x="50%" y="50%" text-anchor="middle" fill="white" font-size="24" font-family="Arial">
        PAGE 2
      </text>
    </svg>
  `),
  'data:image/svg+xml;base64,' + btoa(`
    <svg width="400" height="600" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#d0021b"/>
      <text x="50%" y="50%" text-anchor="middle" fill="white" font-size="24" font-family="Arial">
        BACK COVER
      </text>
    </svg>
  `)
];

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div style={{ padding: '20px', background: '#1a1a1a', minHeight: '100vh' }}>
      <h1 style={{ color: 'white', textAlign: 'center' }}>
        3D Flipbook React Test
      </h1>
      
      <div style={{ textAlign: 'center', margin: '20px 0' }}>
        <button 
          onClick={() => setIsModalOpen(true)}
          style={{
            background: '#007acc',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Open Flipbook Modal
        </button>
      </div>

      {/* Embedded Flipbook */}
      <div style={{ 
        width: '100%', 
        height: '60vh', 
        border: '1px solid #333',
        borderRadius: '8px',
        overflow: 'hidden'
      }}>
        <Flipbook
          media={{ type: 'image', src: sampleImages }}
          renderMode="css"
          onPageChange={(page) => console.log('Page changed:', page)}
          onReady={() => console.log('Flipbook ready!')}
        />
      </div>

      {/* Modal Flipbook */}
      <FlipbookModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="My 3D Flipbook"
        media={{ type: 'image', src: sampleImages }}
        renderMode="webgl"
        onPageChange={(page) => console.log('Modal page changed:', page)}
      />
    </div>
  );
}

// Mount the app
const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);