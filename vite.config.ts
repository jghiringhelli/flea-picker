import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath, URL } from 'node:url';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: false, // we supply our own public/manifest.json
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      },
    }),
  ],

  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@engine': fileURLToPath(new URL('./src/features/game-engine', import.meta.url)),
      '@ui': fileURLToPath(new URL('./src/features/game-ui', import.meta.url)),
      '@config': fileURLToPath(new URL('./src/shared/config', import.meta.url)),
    },
  },

  build: {
    target: 'es2022',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          state: ['xstate', '@xstate/react'],
        },
      },
    },
  },

  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'json-summary'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        // Entry point
        'src/app/main.tsx',
        // Browser-only / React UI — covered by E2E tests (Playwright)
        'src/app/**',
        'src/features/game-ui/**',
        'src/features/game-renderer/**',
        // Requires requestAnimationFrame — not unit-testable in jsdom
        'src/features/game-engine/ScenarioEngine.ts',
        // XState machine — integration/E2E territory
        'src/features/game-state/**',
        // Interface-only files — no executable code
        'src/features/game-engine/System.ts',
        'src/features/game-engine/components/**',
        'src/shared/config/ScenarioConfig.ts',
        'src/shared/config/PetConfig.ts',
        // Barrel re-exports — no executable code
        'src/**/*index.ts',
        // Type declarations and test files
        'src/**/*.d.ts',
        'src/**/*.test.{ts,tsx}',
        'src/**/__tests__/**',
      ],
    },
  },
});
