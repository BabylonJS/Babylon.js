# Babylon.js Procedural Textures Library

> We recommend using the [ES6 package `@babylonjs/procedural-textures`](https://www.npmjs.com/package/@babylonjs/procedural-textures) for new projects.

For usage documentation please visit the [procedural textures library documentation](https://doc.babylonjs.com/toolsAndResources/assetLibraries/proceduralTexturesLibrary/).

## Installation

### CDN

> ⚠️ WARNING: The CDN should not be used in production environments. The purpose of our CDN is to serve Babylon packages to users learning how to use the platform or running small experiments. Once you've built an application and are ready to share it with the world at large, you should serve all packages from your own CDN.

Compiled js files (minified and source) are offered on our public CDN here:

- https://preview.babylonjs.com/proceduralTexturesLibrary/babylonjs.proceduralTextures.js
- https://preview.babylonjs.com/proceduralTexturesLibrary/babylonjs.proceduralTextures.min.js

### NPM

To install using npm:

```bash
npm install babylonjs babylonjs-procedural-textures
```

If using TypeScript, the typing needs to be added to tsconfig.json:

```json
    "types": [
        "babylonjs",
        "babylonjs-procedural-textures"
    ]
```

Afterwards it can be imported to the project using:

```javascript
import * as BABYLON from "babylonjs";
import "babylonjs-procedural-textures";

const fireMaterial = new BABYLON.StandardMaterial("fireMaterial", scene);
const fireTexture = new BABYLON.FireProceduralTexture("fire", 256, scene);
fireMaterial.diffuseTexture = fireTexture;
fireMaterial.opacityTexture = fireTexture;
```
