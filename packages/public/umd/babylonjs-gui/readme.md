# Babylon.js GUI Module

> We recommend using the [ES6 package `@babylonjs/gui`](https://www.npmjs.com/package/@babylonjs/gui) for new projects.

For usage documentation please visit the [GUI documentation](https://doc.babylonjs.com/features/featuresDeepDive/gui/).

## Installation

### CDN

> ⚠️ WARNING: The CDN should not be used in production environments. The purpose of our CDN is to serve Babylon packages to users learning how to use the platform or running small experiments. Once you've built an application and are ready to share it with the world at large, you should serve all packages from your own CDN.

Compiled js files (minified and source) are offered on our public CDN here:

- https://preview.babylonjs.com/gui/babylon.gui.js
- https://preview.babylonjs.com/gui/babylon.gui.min.js

### NPM

To install using npm:

```bash
npm install babylonjs babylonjs-gui
```

If using TypeScript, the typing needs to be added to tsconfig.json:

```json
    "types": [
        "babylonjs",
        "babylonjs-gui"
    ]
```

Afterwards it can be imported to the project using:

```javascript
import * as GUI from "babylonjs-gui";
```
