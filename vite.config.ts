import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  const useZabbixProxy = env.VITE_USE_ZABBIX_PROXY === 'true'
  const zabbixTarget = env.VITE_ZABBIX_PROXY_TARGET || 'http://172.28.20.190'
  const zabbixToken = env.VITE_ZABBIX_TOKEN || ''
  const zabbixAuthMode = env.VITE_ZABBIX_AUTH_MODE || 'bearer'
  const zabbixDebug = env.VITE_ZABBIX_DEBUG === 'true'

  function buildAuthorizationHeader() {
    if (!zabbixToken) return ''

    if (zabbixAuthMode === 'raw') {
      return zabbixToken
    }

    return `Bearer ${zabbixToken}`
  }

  return {
    plugins: [react()],
    server: {
      proxy: useZabbixProxy
        ? {
            '/zabbix-api': {
              target: zabbixTarget,
              changeOrigin: true,
              secure: false,
              rewrite: (path) => path.replace(/^\/zabbix-api/, ''),
              configure: (proxy) => {
                proxy.on('proxyReq', (proxyReq, req) => {
                  const authorization = buildAuthorizationHeader()

                  proxyReq.setHeader('Content-Type', 'application/json')

                  if (authorization) {
                    proxyReq.setHeader('Authorization', authorization)
                  }

                  if (zabbixDebug) {
                    console.log('[ZABBIX PROXY] Request:', {
                      method: req.method,
                      originalUrl: req.url,
                      target: zabbixTarget,
                      authMode: zabbixAuthMode,
                      authorization: authorization
                        ? authorization.startsWith('Bearer ')
                          ? `Bearer ${zabbixToken.slice(0, 6)}...${zabbixToken.slice(-6)}`
                          : `${zabbixToken.slice(0, 6)}...${zabbixToken.slice(-6)}`
                        : 'NO_TOKEN',
                    })
                  }
                })

                proxy.on('proxyRes', (proxyRes, req) => {
                  if (zabbixDebug) {
                    console.log('[ZABBIX PROXY] Response:', {
                      originalUrl: req.url,
                      statusCode: proxyRes.statusCode,
                      statusMessage: proxyRes.statusMessage,
                    })
                  }
                })

                proxy.on('error', (err) => {
                  console.error('[ZABBIX PROXY] Error:', err.message)
                })
              },
            },
          }
        : undefined,
    },
  }
})