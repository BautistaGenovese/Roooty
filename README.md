# 🔢 Roooty Lab

Plataforma de Análisis Numérico — **React + FastAPI**, empaquetada con Docker.

---

## 📋 Requisitos previos (Windows)

| Herramienta | Versión mínima | Descarga |
|---|---|---|
| Docker Desktop | 4.x | https://www.docker.com/products/docker-desktop |

> **Eso es todo.** Docker Desktop incluye `docker compose` y todo lo necesario.
> No necesitás instalar Python ni Node.js en tu máquina.

---

## 🚀 Instalación y arranque

### Paso 1 — Abrí Docker Desktop
Asegurate de que Docker Desktop esté corriendo (ícono en la barra del sistema).

### Paso 2 — Abrí una terminal (PowerShell o CMD)

```powershell
# Entrá a la carpeta del proyecto
cd roooty

# Construí y levantá los contenedores (primera vez tarda ~2-3 minutos)
docker compose up --build
```

### Paso 3 — Abrí el navegador

```
http://localhost
```

¡Listo! La app ya está corriendo.

---

## 🛠️ Desarrollo en tiempo real (Hot-Reloading)

Si querés modificar el código y ver los cambios al instante sin reconstruir Docker, tenés dos opciones:

### Opción 1: Localmente (Recomendado y más rápido)
Necesitás tener [Python](https://www.python.org/downloads/) y [Node.js](https://nodejs.org/es/) instalados.

**1. Levantar el Backend:**
Abre una terminal y ejecuta:
```powershell
cd backend
# Crear y activar entorno virtual (solo la primera vez)
python -m venv venv
.\venv\Scripts\activate
# Instalar dependencias (solo la primera vez)
pip install -r requirements.txt
# Correr el servidor
uvicorn main:app --reload
```

**2. Levantar el Frontend:**
Abre **otra** terminal y ejecuta:
```powershell
cd frontend
npm install # (solo la primera vez)
npm run dev
```
Luego abrí **`http://localhost:5173`** en tu navegador.

### Opción 2: Usando Docker (Entorno Dev)
Si preferís no instalar nada en tu computadora:

```powershell
# Levantar usando el archivo de desarrollo
docker compose -f docker-compose.dev.yml up
```
Luego abrí **`http://localhost:5173`** en tu navegador.

---

## 🛑 Comandos útiles

```powershell
# Levantar en segundo plano (sin bloquear la terminal)
docker compose up --build -d

# Ver logs en tiempo real
docker compose logs -f

# Detener todo
docker compose down

# Detener y borrar datos/caché
docker compose down --volumes --rmi all
```

---

## 🏗️ Arquitectura de los contenedores

```
Tu navegador (http://localhost)
        │
        ▼
┌──────────────────┐
│  roooty_frontend │  nginx  :80
│  (React + nginx) │
└────────┬─────────┘
         │  /api/* → proxy interno
         ▼
┌──────────────────┐
│  roooty_backend  │  FastAPI  :8000
│  (Python 3.11)   │
└──────────────────┘
```

- El **frontend** sirve la app React y redirige las llamadas `/api/` al backend automáticamente.
- El **backend** expone todos los métodos numéricos como endpoints REST.
- No necesitás configurar CORS ni puertos adicionales.

---

## 🔧 Variables y configuración

No hay variables de entorno requeridas. Si necesitás cambiar puertos, editá `docker-compose.yml`:

```yaml
ports:
  - "3000:80"   # Cambiá 3000 por el puerto que quieras para el frontend
  - "8080:8000" # Cambiá 8080 por el puerto que quieras para el backend
```

---

## 📁 Estructura del proyecto

```
roooty/
├── docker-compose.yml
├── backend/
│   ├── Dockerfile
│   ├── main.py          ← API FastAPI (todos los métodos numéricos)
│   └── requirements.txt
└── frontend/
    ├── Dockerfile
    ├── nginx.conf        ← Config del servidor web + proxy
    ├── src/
    │   ├── pages/        ← Bisección, Newton, Secante, etc.
    │   ├── components/   ← Sidebar, Chart, Settings
    │   └── App.jsx
    └── package.json
```

---

## ❓ Problemas comunes

**El puerto 80 ya está ocupado**
```powershell
# Buscá qué proceso usa el puerto 80
netstat -ano | findstr :80

# O simplemente cambiá el puerto en docker-compose.yml:
# "3000:80"  →  abrí http://localhost:3000
```

**Docker Desktop no inicia**
- Asegurate de tener virtualización habilitada en la BIOS.
- En Windows 11/10, activá "Hyper-V" y "Plataforma de máquina virtual" en Características de Windows.

**El build falla por falta de memoria**
- Entrá a Docker Desktop → Settings → Resources → aumentá la RAM a 4GB+.

---

## 👥 El Escuadrón

Bautista · Ignacio · Juan · Trini · Brisa · Micaías · Manuel
