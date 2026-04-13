# Babylon.js Loaders Module

> We recommend using the [ES6 package `@babylonjs/loaders`](https://www.npmjs.com/package/@babylonjs/loaders) for new projects.

For usage documentation please visit the [loaders documentation](https://doc.babylonjs.com/features/featuresDeepDive/importers/loadingFileTypes/).

## Installation

### CDN

> ⚠️ WARNING: The CDN should not be used in production environments. The purpose of our CDN is to serve Babylon packages to users learning how to use the platform or running small experiments. Once you've built an application and are ready to share it with the world at large, you should serve all packages from your own CDN.

Compiled js files (minified and source) are offered on our public CDN here:

- https://preview.babylonjs.com/loaders/babylonjs.loaders.js
- https://preview.babylonjs.com/loaders/babylonjs.loaders.min.js

### NPM

To install using npm:

```bash
npm install babylonjs babylonjs-loaders
```

If using TypeScript, the typing needs to be added to tsconfig.json:

```json
    "types": [
        "babylonjs",
        "babylonjs-loaders"
    ]
```

Afterwards it can be imported to the project using:

```javascript
import * as BABYLON from "babylonjs";
import "babylonjs-loaders";
```

This will extend Babylon's namespace with the loaders available.
