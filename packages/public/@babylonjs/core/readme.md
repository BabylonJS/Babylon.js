# Babylon.js

Getting started? Play directly with the Babylon.js API using our [playground](https://playground.babylonjs.com/). It also contains a lot of samples to learn how to use it.

[![npm version](https://badge.fury.io/js/%40babylonjs%2Fcore.svg)](https://www.npmjs.com/package/@babylonjs/core)

**Any questions?** Here is our official [forum](https://forum.babylonjs.com/).

## CDN

For the UMD bundled distribution, see the [babylonjs](https://www.npmjs.com/package/babylonjs) package.

## npm

Babylon.js and its modules are published on npm as ES modules with full typing support. To install, use:

```text
npm install @babylonjs/core
```

This will allow you to import Babylon.js entirely using:

```javascript
import * as BABYLON from "@babylonjs/core/Legacy/legacy";
```

or individual classes to benefit from tree shaking:

```javascript
import { Scene } from "@babylonjs/core/scene";
import { Engine } from "@babylonjs/core/Engines/engine";
```

To add a module, install the respective package. A list of extra packages and their installation instructions can be found on the [@babylonjs scope on npm](https://www.npmjs.com/~babylonjs).

## Usage

See [our ES6 dedicated documentation](https://doc.babylonjs.com/setup/frameworkPackages/es6Support/):

```javascript
import { Engine } from "@babylonjs/core/Engines/engine";
import { Scene } from "@babylonjs/core/scene";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { FreeCamera } from "@babylonjs/core/Cameras/freeCamera";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { CreateSphere } from "@babylonjs/core/Meshes/Builders/sphereBuilder";
import { CreateGround } from "@babylonjs/core/Meshes/Builders/groundBuilder";

// Side-effect import allowing the standard material to be used as default.
import "@babylonjs/core/Materials/standardMaterial";

const canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;
const engine = new Engine(canvas);
const scene = new Scene(engine);

// This creates and positions a free camera (non-mesh)
const camera = new FreeCamera("camera1", new Vector3(0, 5, -10), scene);

// This targets the camera to scene origin
camera.setTarget(Vector3.Zero());

// This attaches the camera to the canvas
camera.attachControl(canvas, true);

// This creates a light, aiming 0,1,0 - to the sky (non-mesh)
const light = new HemisphericLight("light1", new Vector3(0, 1, 0), scene);

// Default intensity is 1. Let's dim the light a small amount
light.intensity = 0.7;

// Our built-in 'sphere' shape
const sphere = CreateSphere("sphere1", { segments: 16, diameter: 2 }, scene);

// Move the sphere upward 1/2 its height
sphere.position.y = 1;

// Our built-in 'ground' shape
CreateGround("ground1", { width: 6, height: 6, subdivisions: 2 }, scene);

engine.runRenderLoop(() => {
    scene.render();
});
```

## Documentation

- [Documentation](https://doc.babylonjs.com)
- [Examples](https://doc.babylonjs.com/examples)

## Contributing

Please see the [contribution guidelines](https://github.com/BabylonJS/Babylon.js/blob/master/contributing.md).

## Useful links

- Official web site: [www.babylonjs.com](https://www.babylonjs.com/)
- Online [playground](https://playground.babylonjs.com/) to learn by experimenting
- Online [sandbox](https://www.babylonjs.com/sandbox) where you can test your .babylon and glTF scenes with a simple drag'n'drop
- [glTF Tools](https://github.com/KhronosGroup/glTF#gltf-tools) by KhronosGroup

## Features

To get a complete list of supported features, please visit our [website](https://www.babylonjs.com/).
