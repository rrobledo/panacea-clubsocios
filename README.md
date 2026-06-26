# Panacea Club Socios

Frontend React para la gestión de socios del club. Conecta con el backend de [panacea-socios-backend](https://panacea-socios-backend.vercel.app) usando OAuth con Google y autenticación por email/contraseña.

## Requisitos

- Node.js >= 20.19 o >= 22.12
- npm >= 9

## Configuración local

1. Copiá el archivo de entorno de ejemplo:

```bash
cp .env.example .env
```

2. Editá `.env` si necesitás apuntar a una instancia local del backend (por defecto apunta a `http://localhost:8000`):

```env
VITE_BACKEND_API_URL=http://localhost:8000
FRONTEND_URL=http://localhost:5173/auth/callback
```

> Para desarrollo contra el backend productivo, dejá `VITE_BACKEND_API_URL` vacío: el proxy de Vite redirigirá `/auth`, `/socios` y `/ventas` a `https://panacea-socios-backend.vercel.app`.

## Instalación

```bash
npm install
```

## Ejecutar en modo desarrollo

```bash
npm run dev
```

La app queda disponible en [http://localhost:5173](http://localhost:5173).

El proxy de Vite redirige automáticamente las rutas del backend:

| Ruta frontend | Destino |
|---|---|
| `/auth/*` | `https://panacea-socios-backend.vercel.app/auth/*` |
| `/socios/*` | `https://panacea-socios-backend.vercel.app/socios/*` |
| `/ventas/*` | `https://panacea-socios-backend.vercel.app/ventas/*` |

## Build de producción

```bash
npm run build
```

Los archivos estáticos quedan en `dist/`. El archivo `vercel.json` incluye las redirecciones necesarias para que el backend sea accesible desde Vercel.

## Autenticación

El flujo OAuth de Google funciona así:

1. El usuario hace clic en **Continuar con Google** en `/login`.
2. El frontend redirige a `VITE_BACKEND_API_URL/auth/google` (o `/auth/google` vía proxy).
3. El backend completa el handshake con Google y redirige a `/auth/callback?token=...&socio_id=...`.
4. El componente `OAuthCallback` guarda el token JWT en `localStorage` bajo la clave `panacea_auth` y redirige a `/`.

También es posible iniciar sesión con email y contraseña directamente desde la misma pantalla de login.
