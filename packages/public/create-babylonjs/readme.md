# create-babylonjs

Scaffold a new [Babylon.js](https://www.babylonjs.com/) project in seconds.

```bash
npm create babylonjs
```

## What it does

The CLI walks you through a few choices and generates a ready-to-run project:

| Prompt            | Options                                                                                            |
| ----------------- | -------------------------------------------------------------------------------------------------- |
| **Project name**  | Any name (defaults to `my-babylonjs-app`)                                                          |
| **Module format** | **ES6** (`@babylonjs/core` — tree-shakeable) or **UMD** (`babylonjs` — global `BABYLON` namespace) |
| **Language**      | **TypeScript** or **JavaScript**                                                                   |
| **Bundler**       | **Vite**, **Webpack**, **Rollup**, or **None** (CDN script tags only — UMD only)                   |

## Generated project

Every project includes:

- A starter scene that loads a glTF model with environment lighting
- Demonstrates `SceneLoader.AppendAsync`, `createDefaultCamera`, and `createDefaultEnvironment`
- Proper side-effect imports for tree-shaken ES6 builds (glTF loader, env texture loader, PBR material, etc.)
- Resize handling and render loop

### ES6 template

Uses tree-shakeable imports from `@babylonjs/core` and `@babylonjs/loaders`:

```ts
import { Engine } from "@babylonjs/core/Engines/engine";
import { Scene } from "@babylonjs/core/scene";
import { SceneLoader } from "@babylonjs/core/Loading/sceneLoader";
import "@babylonjs/core/Helpers/sceneHelpers";
import "@babylonjs/loaders/glTF";
// ...
```

### UMD template

Uses the `babylonjs` and `babylonjs-loaders` packages with the global `BABYLON` namespace:

```ts
import * as BABYLON from "babylonjs";
import "babylonjs-loaders";
// ...
```

### CDN-only template (no bundler)

A single `index.html` with `<script>` tags — no npm install required:

```html
<script src="https://cdn.babylonjs.com/babylon.js"></script>
<script src="https://cdn.babylonjs.com/loaders/babylonjs.loaders.min.js"></script>
```

## Bundler configurations

| Bundler | Config file                         | Dev server                                   |
| ------- | ----------------------------------- | -------------------------------------------- |
| Vite    | `vite.config.ts` / `vite.config.js` | `npm run dev`                                |
| Webpack | `webpack.config.js`                 | `npm run dev` (webpack-dev-server)           |
| Rollup  | `rollup.config.mjs`                 | `npm run dev` (rollup -c -w with livereload) |
| None    | —                                   | Open `index.html` in browser                 |

## Production build

All bundler-based templates include a `build:prod` script that creates an optimized production bundle:

```bash
npm run build:prod
```

| Bundler | Output           | Preview                                             |
| ------- | ---------------- | --------------------------------------------------- |
| Vite    | `dist/`          | `npm run preview`                                   |
| Webpack | `dist/`          | Serve `dist/` with any static server                |
| Rollup  | `dist/bundle.js` | Open `index.html` which references `dist/bundle.js` |

Deploy the contents of `dist/` (or the project root for Rollup) to any static hosting provider.

## Quick start

```bash
npm create babylonjs
cd my-babylonjs-app
npm install
npm run dev
```

When you are ready to deploy:

```bash
npm run build:prod
```

## License

Apache-2.0
