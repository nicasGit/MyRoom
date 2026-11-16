import { defineConfig } from 'vite';
export default defineConfig({
  build: { rollupOptions: { input: ['index.html', 'admin.html'], output:{manualChunks(id){
    if(id.includes('/three/examples/'))return 'three-controls';
    if(id.includes('/node_modules/three/'))return 'three';
  }} } },
  server: { port: 5173, strictPort: true, proxy: {
    '/ws': { target: 'ws://localhost:3000', ws: true },
    '/api/admin': { target: 'http://localhost:3000' },
  } },
});
