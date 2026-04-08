# Babylon.js Procedural Textures Library

For usage documentation please visit the [procedural textures library documentation](https://doc.babylonjs.com/toolsAndResources/assetLibraries/proceduralTexturesLibrary/).

## Installation

To install using npm:

```bash
npm install @babylonjs/core @babylonjs/procedural-textures
```

## Usage

Import and use in your project:

```javascript
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { FireProceduralTexture } from "@babylonjs/procedural-textures/fireProceduralTexture";

const fireMaterial = new StandardMaterial("fireMaterial", scene);
const fireTexture = new FireProceduralTexture("fire", 256, scene);
fireMaterial.diffuseTexture = fireTexture;
fireMaterial.opacityTexture = fireTexture;
```

For more information, see the [ES6 support documentation](https://doc.babylonjs.com/setup/frameworkPackages/es6Support/).
