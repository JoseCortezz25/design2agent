# Template Starter — Figma Plugin

Template base para construir plugins de Figma con React 19, TypeScript, Vite y una arquitectura de doble contexto preparada para producción.

---

## ¿Qué incluye el template?

El flujo de referencia es el siguiente:

1. El usuario abre el plugin dentro de Figma Desktop y se autentica con su cuenta de la plataforma.
2. Selecciona el cliente y la brand con los que va a trabajar.
3. Elige una campaña de destino (o crea una nueva).
4. Lanza la identificación de elementos: el plugin escanea el canvas en busca de frames con nomenclatura específica (**Hub Framework**) y componentes independientes.
5. Revisa los elementos detectados, deselecciona los que no quiere incluir, y confirma la exportación.
6. El plugin sube los assets al backend configurado y vuelve al estado inicial listo para una nueva operación.

---

## Arquitectura — dos contextos de ejecución aislados

Figma ejecuta los plugins en dos hilos completamente separados que **no pueden comunicarse directamente**:

| Contexto      | Ruta          | Tiene acceso a                                          |
| ------------- | ------------- | ------------------------------------------------------- |
| **Sandbox**   | `src/plugin/` | API de Figma (`figma.*`), canvas, `figma.clientStorage` |
| **UI iframe** | `src/ui/`     | Browser, DOM, `fetch`, React                            |

La comunicación entre ambos ocurre **exclusivamente a través de mensajes tipados** usando [`monorepo-networker`](https://github.com/CoconutGoodie/monorepo-networker). El contrato de mensajes se define en `src/common/networkSides.ts`.

> El sandbox nunca hace peticiones HTTP — todo lo que necesita salir a internet pasa por la UI.

### Diagrama

```
┌─────────────────────────────────────────────────────────┐
│                        Figma Host                        │
│                                                          │
│   ┌──────────────────────┐  mensajes  ┌───────────────┐  │
│   │  Sandbox (plugin.js) │ ─────────► │  UI (iframe)  │  │
│   │  figma.* API         │ ◄───────── │  React App    │  │
│   └──────────────────────┘            └───────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## Flujo UX

```
Primer uso:  Login → SelectClient* → SelectBrand → ExportHub
Usos posteriores:                                  ExportHub (sesión cacheada)

ExportHub → Identifying → ExportReview → Exporting → ExportHub (éxito)
                                                    → ExportError → ExportReview (retry)
```

\* `SelectClient` se omite si el usuario tiene un solo cliente asignado.

---

## Stack tecnológico

| Tecnología                 | Rol                                                            |
| -------------------------- | -------------------------------------------------------------- |
| TypeScript                 | Tipado estático en todo el proyecto                            |
| React 19 + React Router v7 | UI con `MemoryRouter` (único compatible con Figma)             |
| Vite (dual build)          | Compila sandbox y UI por separado                              |
| vite-plugin-singlefile     | Inlinea todos los assets en un único HTML (requisito de Figma) |
| Tailwind v4                | Estilos con tokens de diseño                                   |
| shadcn/ui                  | Componentes base para los átomos                               |
| Zustand                    | Estado global (`session.store` + `stepper.store`)              |
| Zod                        | Validación de schemas                                          |
| monorepo-networker         | IPC tipado entre sandbox y UI                                  |
| Storybook                  | Documentación visual de componentes                            |

---

## Requisitos

- Node.js >= 20.11.0
- pnpm >= 8.6.3

---

## Primeros pasos

```bash
# 1. Instalar dependencias
pnpm install

# 2. Copiar variables de entorno
cp .env.example .env
# Edita .env y añade la URL base de tu API
```

---

## Comandos

| Comando                | Descripción                                 |
| ---------------------- | ------------------------------------------- |
| `pnpm dev`             | Watch mode: compila plugin y UI en paralelo |
| `pnpm dev:ui-only`     | Servidor Vite de la UI sin contexto Figma   |
| `pnpm build`           | Build de producción completo                |
| `pnpm storybook`       | Abre Storybook en http://localhost:6006     |
| `pnpm build-storybook` | Build estático de Storybook                 |
| `pnpm lint`            | Ejecuta ESLint                              |
| `pnpm format`          | Formatea el código con Prettier             |
| `pnpm types`           | Verificación de tipos TypeScript            |

### Cargar el plugin en Figma Desktop

1. Ejecuta `pnpm dev`
2. En Figma Desktop: clic derecho → **Plugins** → **Development** → **Import plugin from manifest...**
3. Selecciona `dist/manifest.json`
4. Activa **"Hot reload plugin"** para recargar automáticamente al guardar cambios

---

## Estructura de carpetas

```
src/
├── common/                    ← compartido entre sandbox y UI
│   ├── network-sides.ts       ← contrato de mensajes tipados
│   └── types/                 ← interfaces TypeScript compartidas
│
├── plugin/                    ← sandbox de Figma (figma.* sí, browser APIs no)
│   ├── plugin.ts              ← entry point del sandbox
│   ├── plugin.network.ts      ← canal de mensajes del sandbox
│   ├── auth/
│   ├── identification/
│   ├── export/
│   └── lib/
│
└── ui/                        ← iframe React (browser, DOM, fetch)
    ├── index.html
    ├── main.tsx
    ├── App.tsx
    ├── app.network.tsx        ← canal de mensajes de la UI
    ├── config/
    │   └── messages.ts        ← mensajes globales reutilizables
    ├── router/
    ├── screens/               ← una carpeta por pantalla del stepper
    ├── components/            ← Atomic Design (atoms / molecules / organisms)
    ├── repositories/          ← fetch hacia la API externa
    ├── api/                   ← instancia base con auth headers
    ├── store/                 ← session.store + stepper.store (Zustand)
    ├── hooks/
    ├── lib/
    └── styles/                ← arquitectura 7-1
```

---

## Gestión de textos

Ningún string de UI se escribe directamente en un componente. Los textos se gestionan en dos niveles:

### Mensajes globales — `src/ui/config/messages.ts`

Textos reutilizables en toda la aplicación: acciones comunes, estados del sistema, errores genéricos.

```ts
import { messages } from '@ui/config/messages';

messages.common.actions.save; // "Guardar"
messages.common.errors.serverError; // "Algo salió mal. Intenta de nuevo."
```

### Mensajes de dominio — `messages.ts` dentro de cada screen

Cada pantalla encapsula sus propios textos junto a sus componentes.

```ts
// src/ui/screens/login/messages.ts
export const loginMessages = {
  title: 'Bienvenido al plugin',
  submitButton: 'Iniciar sesión'
} as const;
```

### Textos dinámicos

Para textos con valores en tiempo de ejecución se usan funciones:

```ts
export const exportMessages = {
  exportCount: (n: number) =>
    `Exportar ${n} ${n === 1 ? 'elemento' : 'elementos'}`
} as const;
```

| Situación                                       | Dónde poner el texto        |
| ----------------------------------------------- | --------------------------- |
| Acción genérica (Guardar, Cancelar, Exportar)   | `src/ui/config/messages.ts` |
| Error genérico del servidor                     | `src/ui/config/messages.ts` |
| Título o descripción de una pantalla específica | `messages.ts` del screen    |
| Texto usado en 2+ dominios no genéricos         | `src/ui/config/messages.ts` |

---

## Convenciones de nomenclatura

### Archivos y directorios

| Tipo              | Convención       | Ejemplo                            |
| ----------------- | ---------------- | ---------------------------------- |
| Directorios       | kebab-case       | `select-client/`, `export-hub/`    |
| Componentes React | `kebab-case.tsx` | `card-review.tsx`                  |
| Hooks             | `use-*.ts`       | `use-auth.ts`                      |
| Stores Zustand    | `*.store.ts`     | `session.store.ts`                 |
| Schemas Zod       | `*.schema.ts`    | `login.schema.ts`                  |
| Types             | `*.types.ts`     | `auth.types.ts`                    |
| Servicios         | `*.service.ts`   | `color.service.ts`                 |
| Utilidades        | `*.util.ts`      | `format.util.ts`                   |
| Mensajes          | `messages.ts`    | `messages.ts` (dentro del dominio) |

### Variables

| Tipo                | Convención                           | Ejemplo                 |
| ------------------- | ------------------------------------ | ----------------------- |
| Booleanos           | Prefijo `is`, `has`, `should`, `can` | `isLoading`, `hasError` |
| Estado no booleano  | camelCase                            | `selectedClient`        |
| Constantes globales | SCREAMING_SNAKE_CASE                 | `API_BASE_URL`          |

### Funciones

| Tipo           | Convención                      | Ejemplo            |
| -------------- | ------------------------------- | ------------------ |
| Event handlers | Prefijo `handle`                | `handleLogin`      |
| Fetch/request  | Prefijo `fetch`, `get` o `load` | `fetchClients`     |
| Transformación | Verbo + objeto                  | `formatColorToHex` |

### Componentes y tipos

```ts
// Componente — PascalCase, named export (no default exports)
export function CardReview({ name, isSelected }: CardReviewProps) { ... }

// Props — mismo nombre del componente + sufijo Props
interface CardReviewProps {
  name: string;
  isSelected: boolean;
  onSelect: () => void;
}

// Types e interfaces — PascalCase sin prefijo I ni sufijo Interface
type ExportResult = { ... }
interface Client { ... }

// Zod schema — camelCase + sufijo Schema
export const loginSchema = z.object({ ... });
export type Login = z.infer<typeof loginSchema>;
```

---

## Convenciones de commit

Los commits siguen el formato de [Conventional Commits](https://www.conventionalcommits.org/):

```
[TICKET-123 ]tipo(scope)?: descripción
```

- El prefijo de ticket Jira (`OBN-123`) es **opcional**
- El tipo y la descripción son **obligatorios**
- El mensaje completo no puede superar **88 caracteres**

**Tipos válidos:** `feat`, `fix`, `chore`, `docs`, `test`, `style`, `refactor`, `perf`, `build`, `ci`, `revert`

Los hooks de Husky validan esto automáticamente en cada commit.

---

## Cómo adaptar este template

- Cambia `name` e `id` en `figma.manifest.ts` antes de distribuir el plugin.
- Configura `VITE_API_BASE_URL` en `.env` para apuntar al backend de tu producto.
- Reemplaza los repositorios de `src/ui/repositories/` por los endpoints reales de tu dominio.
- Actualiza los textos en `messages.ts`; los componentes no deben contener strings visibles hardcodeados.
