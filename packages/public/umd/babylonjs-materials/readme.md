# Babylon.js Materials Library

> We recommend using the [ES6 package `@babylonjs/materials`](https://www.npmjs.com/package/@babylonjs/materials) for new projects.

For usage documentation please visit the [materials library documentation](https://doc.babylonjs.com/toolsAndResources/assetLibraries/materialsLibrary/).

## Installation

### CDN

> ⚠️ WARNING: The CDN should not be used in production environments. The purpose of our CDN is to serve Babylon packages to users learning how to use the platform or running small experiments. Once you've built an application and are ready to share it with the world at large, you should serve all packages from your own CDN.

Compiled js files (minified and source) are offered on our public CDN here:

- https://preview.babylonjs.com/materialsLibrary/babylonjs.materials.js
- https://preview.babylonjs.com/materialsLibrary/babylonjs.materials.min.js

### NPM

To install using npm:

```bash
npm install babylonjs babylonjs-materials
```

If using TypeScript, the typing needs to be added to tsconfig.json:

```json
    "types": [
        "babylonjs",
        "babylonjs-materials"
    ]
```

Afterwards it can be imported to the project using:

```javascript
import * as BABYLON from "babylonjs";
import "babylonjs-materials";

const skyMaterial = new BABYLON.SkyMaterial("skyMaterial", scene);
skyMaterial.backFaceCulling = false;
```
