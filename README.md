# Dashboard inteligente de priorizacion de alertas Zabbix

Prototipo React + TypeScript + Vite para consumir alertas reales de Zabbix,
priorizarlas y explicarlas con reglas operativas.

## Modo mock

Funciona sin VPN:

```env
VITE_ZABBIX_MODE=mock
VITE_ZABBIX_API_URL=http://172.28.20.190/zabbix/api_jsonrpc.php
VITE_ZABBIX_TOKEN=
VITE_ZABBIX_REFRESH_SECONDS=15
VITE_USE_ZABBIX_PROXY=false
```

## Modo real

Requiere VPN activa y token valido:

```env
VITE_ZABBIX_MODE=real
VITE_ZABBIX_API_URL=http://172.28.20.190/zabbix/api_jsonrpc.php
VITE_ZABBIX_TOKEN=TOKEN_VALIDO
VITE_ZABBIX_REFRESH_SECONDS=15
VITE_USE_ZABBIX_PROXY=false
```

El servicio envia peticiones `POST` JSON-RPC con:

- `Content-Type: application/json`
- `Authorization: Bearer VITE_ZABBIX_TOKEN`
- `id: Date.now()`

Metodos consumidos:

- `host.get`
- `problem.get`
- `item.get`

## Proxy por CORS

Si el navegador bloquea CORS, usar el proxy local de Vite:

```env
VITE_ZABBIX_MODE=real
VITE_ZABBIX_API_URL=/zabbix-api/zabbix/api_jsonrpc.php
VITE_ZABBIX_TOKEN=TOKEN_VALIDO
VITE_ZABBIX_REFRESH_SECONDS=15
VITE_USE_ZABBIX_PROXY=true
```

Reiniciar Vite despues de cambiar `.env.local`.

## Ejecutar

```bash
npm install
npm run dev
```

## Validar build

```bash
npm run build
```
