import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{js,jsx}'],
    // The app owner reads URME from America/Denver, and event dates are stored as midnight
    // UTC, so a suite running in UTC cannot see the day-behind bug that shift causes.
    env: { TZ: 'America/Denver' },
  },
});
