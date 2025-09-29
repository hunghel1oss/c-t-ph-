import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      // Bật polyfills cho các module Node.js
      include: ['process', 'buffer', 'util', 'stream'],
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
    })
  ],
  
  // Hỗ trợ các file 3D assets
  assetsInclude: [
    '**/*.glb', 
    '**/*.gltf', 
    '**/*.fbx', 
    '**/*.obj',
    '**/*.hdr'
  ],
  
  // Tối ưu build
  build: {
    assetsInlineLimit: 0, // Không inline assets lớn (>4kb)
    rollupOptions: {
      output: {
        // Tách assets lớn ra file riêng
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/\.(glb|gltf|fbx|obj)$/i.test(assetInfo.name)) {
            return `models/[name]-[hash][extname]`;
          }
          if (/\.(png|jpe?g|svg|gif|tiff|bmp|ico)$/i.test(assetInfo.name)) {
            return `images/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        }
      }
    },
    // Tăng chunk size limit cho 3D models
    chunkSizeWarningLimit: 2000,
  },
  
  // Tối ưu dev server
  server: {
    // Cải thiện HMR cho development
    hmr: {
      overlay: false
    },
    // Headers cho CORS nếu cần
    headers: {
      'Cross-Origin-Embedder-Policy': 'credentialless',
      'Cross-Origin-Opener-Policy': 'same-origin'
    }
  },
  
  // Tối ưu dependencies
  optimizeDeps: {
    include: [
      '@react-three/fiber',
      '@react-three/drei',
      '@react-three/cannon',
      'three'
    ],
    exclude: ['@react-three/offscreen']
  },
  
  // Define globals - Mở rộng để hỗ trợ Node.js modules
  define: {
    global: 'globalThis',
    'process.env': {},
  }
})
