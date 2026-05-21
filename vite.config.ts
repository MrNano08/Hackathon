import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const useZabbixProxy = env.VITE_USE_ZABBIX_PROXY === 'true'

  return {
    plugins: [react()],
    server: useZabbixProxy
      ? {
          proxy: {
            '/zabbix-api': {
              target: 'http://172.28.20.190',
              changeOrigin: true,
              secure: false,
              rewrite: (path) => path.replace(/^\/zabbix-api/, ''),
            },
          },
        }
      : undefined,
  }
})
