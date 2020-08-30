# Babylon.js

Getting started? Play directly with the Babylon.js API using our [playground](https://playground.babylonjs.com/). It also contains a lot of samples to learn how to use it.

[![npm version](https://badge.fury.io/js/babylonjs.svg)](https://badge.fury.io/js/babylonjs)
[![Build Status](https://travis-ci.com/BabylonJS/Babylon.js.svg?branch=master)](https://travis-ci.com/BabylonJS/Babylon.js)
[![Average time to resolve an issue](http://isitmaintained.com/badge/resolution/BabylonJS/Babylon.js.svg)](http://isitmaintained.com/project/BabylonJS/Babylon.js "Average time to resolve an issue")
[![Percentage of issues still open](https://isitmaintained.com/badge/open/babylonJS/babylon.js.svg)](https://isitmaintained.com/project/babylonJS/babylon.js "Percentage of issues still open")
[![Build Size](https://img.badgesize.io/BabylonJS/Babylon.js/master/dist/preview%20release/babylon.js.svg?compression=gzip)](https://img.badgesize.io/BabylonJS/Babylon.js/master/dist/preview%20release/babylon.js.svg?compression=gzip)
[![Twitter](https://img.shields.io/twitter/follow/babylonjs.svg?style=social&label=Follow)](https://twitter.com/intent/follow?screen_name=babylonjs)

**Any questions?** Here is our official [forum](https://forum.babylonjs.com/).

## CDN

To look into our CDN bundled distribution, you can refer to the package [babylonjs](https://www.npmjs.com/package/babylonjs)

## npm

BabylonJS and its modules are published on npm as esNext modules with full typing support. To install, use:

```text
npm install @babylonjs/core --save
```

This will allow you to import BabylonJS entirely using:

```javascript
import * as BABYLON from '@babylonjs/core/Legacy/legacy';
```

or individual classes to benefit from enhanced tree shaking using :

```javascript
import { Scene } from '@babylonjs/core/scene';
import { Engine } from '@babylonjs/core/Engines/engine';
```

To add a module, install the respective package. A list of extra packages and their installation instructions can be found on the [babylonjs user on npm](https://www.npmjs.com/~babylonjs) scoped on @babylonjs.

## Usage

See [our ES6 dedicated documentation](https://doc.babylonjs.com/features/es6_support):

```javascript
import { Engine } from "@babylonjs/core/Engines/engine";
import { Scene } from "@babylonjs/core/scene";
import { Vector3 } from "@babylonjs/core/Maths/math";
import { FreeCamera } from "@babylonjs/core/Cameras/freeCamera";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { Mesh } from "@babylonjs/core/Meshes/mesh";

// Side-effects only imports allowing the standard material to be used as default.
import "@babylonjs/core/Materials/standardMaterial";
// Side-effects only imports allowing Mesh to create default shapes (to enhance tree shaking, the construction methods on mesh are not available if the meshbuilder has not been imported).
import "@babylonjs/core/Meshes/Builders/sphereBuilder";
import "@babylonjs/core/Meshes/Builders/boxBuilder";
import "@babylonjs/core/Meshes/Builders/groundBuilder";

const canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;
const engine = new Engine(canvas);
var scene = new Scene(engine);

// This creates and positions a free camera (non-mesh)
var camera = new FreeCamera("camera1", new Vector3(0, 5, -10), scene);

// This targets the camera to scene origin
camera.setTarget(Vector3.Zero());

// This attaches the camera to the canvas
camera.attachControl(canvas, true);

// This creates a light, aiming 0,1,0 - to the sky (non-mesh)
var light = new HemisphericLight("light1", new Vector3(0, 1, 0), scene);

// Default intensity is 1. Let's dim the light a small amount
light.intensity = 0.7;

// Our built-in 'sphere' shape. Params: name, subdivs, size, scene
var sphere = Mesh.CreateSphere("sphere1", 16, 2, scene);

// Move the sphere upward 1/2 its height
sphere.position.y = 2;

// Our built-in 'ground' shape. Params: name, width, depth, subdivs, scene
Mesh.CreateGround("ground1", 6, 6, 2, scene);

engine.runRenderLoop(() => {
    scene.render();
});
```

## Preview release

Preview version of **4.0** can be found [here](https://github.com/BabylonJS/Babylon.js/tree/master/dist/preview%20release).
If you want to contribute, please read our [contribution guidelines](https://github.com/BabylonJS/Babylon.js/blob/master/contributing.md) first.

## Documentation

- [Documentation](https://doc.babylonjs.com)
- [Examples](https://doc.babylonjs.com/examples)

## Contributing
Please see the [Contributing Guidelines](./contributing.md)

## Useful links

- Official web site: [www.babylonjs.com](https://www.babylonjs.com/)
- Online [playground](https://playground.babylonjs.com/) to learn by experimentating
- Online [sandbox](https://www.babylonjs.com/sandbox) where you can test your .babylon and glTF scenes with a simple drag'n'drop
- Online [shader creation tool](https://www.babylonjs.com/cyos/) where you can learn how to create GLSL shaders
- 3DS Max [exporter](https://github.com/BabylonJS/Exporters/tree/master/3ds%20Max) can be used to generate a .babylon file from 3DS Max
- Maya [exporter](https://github.com/BabylonJS/Exporters/tree/master/Maya) can be used to generate a .babylon file from 3DS Max
- Blender [exporter](https://github.com/BabylonJS/Exporters/tree/master/Blender) can be used to generate a .babylon file from Blender 3d
- Unity 5[ (deprecated) exporter](https://github.com/BabylonJS/Exporters/tree/master/Unity) can be used to export your geometries from Unity 5 scene editor(animations are supported)
- [glTF Tools](https://github.com/KhronosGroup/glTF#gltf-tools) by KhronosGroup

## Features

To get a complete list of supported features, please visit our [website](https://www.babylonjs.com/#specifications).

## Build

Babylon.js is automatically built using [Gulp](https://gulpjs.com/). For further instructions see the readme at [/Tools/Gulp](https://github.com/BabylonJS/Babylon.js/tree/master/Tools/Gulp).
