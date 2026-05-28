# Generar APK de SmartRoots (Android)

La app móvil carga la **misma web** que GitHub Pages y usa la **API** en PythonAnywhere. No hace falta tu PC encendido.

| En el APK | URL |
|-----------|-----|
| Interfaz | https://jchantre-jpg.github.io/SmartRoots/ |
| API | https://jchantre.pythonanywhere.com |

---

## Requisitos (una sola vez)

1. Cuenta gratis en [expo.dev](https://expo.dev/signup) (con GitHub vale).
2. Node.js en tu PC.

---

## Pasos para crear el APK

### 1. Instalar dependencias

```bash
cd SmartRoots/mobile
npm install
```

### 2. Iniciar sesión en Expo

```bash
npx eas-cli login
```

(Email y contraseña de expo.dev.)

### 3. Vincular el proyecto (solo la primera vez)

```bash
npx eas-cli init
```

- Pregunta si crear proyecto → **Yes**.
- Deja el nombre **SmartRootsMOVIL** o similar.

Esto añade `projectId` en `app.config.js`.

### 4. Compilar el APK en la nube (gratis)

```bash
npm run build:apk
```

**La primera vez** EAS puede preguntar: *Generate a new Android Keystore?* → responde **Y** (Yes).  
Si no puedes responder en la terminal, usa (genera el keystore en la nube solo):

```bash
set CI=true
npm run build:apk -- --non-interactive
```

En PowerShell: `$env:CI="true"; npx eas-cli build -p android --profile preview --non-interactive`

Tarda **10–20 minutos**. Al terminar verás un enlace para **descargar el .apk**.

También puedes ver el progreso en [expo.dev](https://expo.dev) → tu proyecto → **Builds**.

### 5. Instalar en el teléfono

1. Descarga el `.apk` en el móvil (o pásalo por USB/Drive).
2. Android puede pedir **“Instalar apps desconocidas”** para el navegador o Archivos → actívalo.
3. Abre el APK → **Instalar**.

**Demo:** usuario `demo_smartroots` / contraseña `SmartRoots1!`

---

## Comandos útiles

| Comando | Qué hace |
|---------|----------|
| `npm run build:apk` | APK de prueba (descarga directa) |
| `npm run build:apk:prod` | APK perfil production |
| `npx eas-cli build:list` | Ver builds anteriores y enlaces |

---

## Cambiar API o web del APK

Edita `mobile/app.config.js` → `extra.apiBase` y `extra.webUrl`, luego vuelve a ejecutar `npm run build:apk`.

---

## Expo Go vs APK

| | Expo Go | APK instalable |
|---|---------|----------------|
| Instalación | App Expo Go + QR | Archivo `.apk` |
| API por defecto | Tu PC / túnel | PythonAnywhere |
| Web por defecto | Flask `/app/` o dev | GitHub Pages |

Para desarrollo en casa sigue usando `npm start` y Expo Go.

---

## Problemas frecuentes

| Problema | Solución |
|----------|----------|
| `Not logged in` | `npx eas-cli login` |
| `projectId` missing | `npx eas-cli init` |
| “Sin API” en el APK | Comprueba https://jchantre.pythonanywhere.com/api/health en el navegador del móvil |
| Pantalla en blanco | Internet activo; prueba ↻ en la app |
