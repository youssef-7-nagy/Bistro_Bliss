import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig(({ command }) => {
  const isVercel = Boolean(process.env.VERCEL);
  const isGitHubActions = Boolean(process.env.GITHUB_ACTIONS);

  // Vercel deploys to root domain (/), while GitHub Pages deploys under repo subpath (/Bistro_Bliss/)
  const base = process.env.VITE_BASE_PATH || (isVercel ? '/' : (isGitHubActions ? '/Bistro_Bliss/' : '/'));

  return {
    plugins: [react()],
    base,
    server: {
      headers: {
        'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
      },
    },
  };
});
