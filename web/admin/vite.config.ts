import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  // 加载环境变量 - 第二个参数是目录路径，不是文件名
  const env = loadEnv(mode, process.cwd(), '');
  return {
    server: {
      hmr: true,
      proxy: {
        '/api': {
          // target: 'http://10.10.7.43:8000',
          target: env.TARGET || 'http://localhost:8000',
          // target: 'https://10.10.18.71:2443',
          // target: "http://localhost:8000",
          secure: false,
          changeOrigin: true,
        },
        '/share': {
          target: 'http://10.10.2.229:8000',
          // target: 'https://10.10.18.71:2443',
          // target: "http://localhost:8000",
          secure: false,
          changeOrigin: true,
        },
        '/static-file': 'https://10.10.2.229:2443',
      },
      host: '0.0.0.0',
    },
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
  };
});
