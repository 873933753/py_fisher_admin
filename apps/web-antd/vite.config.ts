import { fileURLToPath } from 'node:url';

import { defineConfig } from '@vben/vite-config';

import { loadEnv } from 'vite';

const root = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig(async (config) => {
  const mode = config?.mode ?? 'development';
  const env = loadEnv(mode, root, '');

  return {
    application: {
      devtools: false,
      injectMetadata: false,
      nitroMock: false,
      print: false,
      pwa: false,
      vxeTableLazyImport: false,
    },
    vite: {
      server: {
        host: '127.0.0.1',
        proxy: {
          // PayPal 接口路径自带 /api 前缀，不可走通用 strip 规则
          '/api/paypal': {
            changeOrigin: true,
            target: env.VITE_PROXY_TARGET || 'http://106.53.79.120:18690',
            ws: true,
          },
          '/api': {
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api/, ''),
            target: env.VITE_PROXY_TARGET || 'http://106.53.79.120:18690',
            ws: true,
          },
        },
      },
    },
  };
});
