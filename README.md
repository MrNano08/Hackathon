# Dashboard inteligente de priorizacion de alertas Zabbix

Prototipo React + TypeScript + Vite para consumir datos reales de Zabbix, mostrar eventos tecnicos sin priorizar y convertirlos en alertas explicadas con prioridad, categoria, tipo de mantenimiento y recomendacion inicial.

## Flujo del MVP

1. Consulta `host.get` para obtener hosts reales de Zabbix.
2. Consulta `problem.get` para mostrar eventos originales sin priorizar.
3. Consulta `item.get` para cargar metricas por host cuando existan.
4. Clasifica localmente por severidad, recurrencia, impacto operativo y senales tecnicas.
5. Si Gemini esta habilitado, mejora la explicacion y la recomendacion inicial sin reemplazar los datos reales.

## Configuracion recomendada para la demo con VPN

Cree un archivo `.env.local` en la raiz del proyecto:

```env
VITE_ZABBIX_MODE=real
VITE_ZABBIX_API_URL=/zabbix-api/zabbix/api_jsonrpc.php
VITE_ZABBIX_TOKEN=TOKEN_VALIDO_DE_ZABBIX
VITE_ZABBIX_REFRESH_SECONDS=15
VITE_USE_ZABBIX_PROXY=true

VITE_GEMINI_ENABLED=true
VITE_GEMINI_API_KEY=API_KEY_DE_GEMINI
VITE_GEMINI_MODEL=gemini-2.5-flash
```

Con esta configuracion, el navegador llama a `/zabbix-api/...` y Vite redirige la peticion al servidor real `http://172.28.20.190`. Esto ayuda cuando Zabbix no permite CORS directo desde el navegador.

## Modo real sin proxy

Use esto solo si Zabbix permite CORS desde el navegador:

```env
VITE_ZABBIX_MODE=real
VITE_ZABBIX_API_URL=http://172.28.20.190/zabbix/api_jsonrpc.php
VITE_ZABBIX_TOKEN=TOKEN_VALIDO_DE_ZABBIX
VITE_ZABBIX_REFRESH_SECONDS=15
VITE_USE_ZABBIX_PROXY=false

VITE_GEMINI_ENABLED=true
VITE_GEMINI_API_KEY=API_KEY_DE_GEMINI
VITE_GEMINI_MODEL=gemini-2.5-flash
```

## Modo demo

Funciona sin VPN y sin Gemini:

```env
VITE_ZABBIX_MODE=mock
VITE_ZABBIX_API_URL=http://172.28.20.190/zabbix/api_jsonrpc.php
VITE_ZABBIX_TOKEN=
VITE_ZABBIX_REFRESH_SECONDS=15
VITE_USE_ZABBIX_PROXY=false

VITE_GEMINI_ENABLED=false
VITE_GEMINI_API_KEY=
VITE_GEMINI_MODEL=gemini-2.5-flash
```

## Metodos Zabbix consumidos

- `host.get`
- `problem.get`
- `item.get`

La peticion se envia como JSON-RPC `POST` con:

- `Content-Type: application/json`
- `Authorization: Bearer <token>`
- `jsonrpc: "2.0"`
- `id: Date.now()`

## Gemini

El archivo `src/services/geminiService.ts` llama al endpoint REST `generateContent` y espera una respuesta JSON. Si Gemini falla, el dashboard no se cae: mantiene las explicaciones del clasificador local.

Importante: en Vite, las variables `VITE_*` quedan visibles en el navegador. Para una entrega real, la llamada a Gemini deberia moverse a un backend o funcion serverless. Para hackathon/local sirve como prototipo rapido.

## Ejecutar

```bash
npm install
npm run dev
```

## Validar build

```bash
npm run build
```

## Validacion rapida

1. Active la VPN.
2. Ejecute `npm run dev`.
3. Abra la URL local de Vite.
4. Si ve error de conexion, revise token, VPN y `VITE_USE_ZABBIX_PROXY=true`.
5. Si Gemini no responde, el sistema debe seguir mostrando la clasificacion local.
