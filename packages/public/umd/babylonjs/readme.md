# Babylon.js

> We recommend using the [ES6 package `@babylonjs/core`](https://www.npmjs.com/package/@babylonjs/core) for new projects. This UMD package is provided for compatibility.

Getting started? Play directly with the Babylon.js API using our [playground](https://playground.babylonjs.com/). It also contains a lot of samples to learn how to use it.

[![npm version](https://badge.fury.io/js/babylonjs.svg)](https://badge.fury.io/js/babylonjs)

**Any questions?** Here is our official [forum](https://forum.babylonjs.com/).

## CDN

> ⚠️ WARNING: The CDN should not be used in production environments. The purpose of our CDN is to serve Babylon packages to users learning how to use the platform or running small experiments. Once you've built an application and are ready to share it with the world at large, you should serve all packages from your own CDN.

- <https://cdn.babylonjs.com/babylon.js>
- <https://cdn.babylonjs.com/babylon.max.js>

## npm

Babylon.js and its modules are published on npm with full typing support. To install, use:

```text
npm install babylonjs
```

This will allow you to import Babylon.js entirely using:

```javascript
import * as BABYLON from "babylonjs";
```

or individual classes using:

```javascript
import { Scene, Engine } from "babylonjs";
```

If using TypeScript, don't forget to add 'babylonjs' to 'types' in `tsconfig.json`:

```json
    ...
    "types": [
        "babylonjs",
        "anotherAwesomeDependency"
    ],
    ...
```

To add a module, install the respective package. A list of extra packages and their installation instructions can be found on the [babylonjs user on npm](https://www.npmjs.com/~babylonjs).

## Usage

See [Getting Started](https://doc.babylonjs.com/start):

```javascript
const canvas = document.getElementById("renderCanvas");
const engine = new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });

const createScene = () => {
    const scene = new BABYLON.Scene(engine);
    const camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, 5, -10), scene);
    camera.setTarget(BABYLON.Vector3.Zero());
    camera.attachControl(canvas, false);

    const light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), scene);

    const sphere = BABYLON.MeshBuilder.CreateSphere("sphere1", { segments: 16, diameter: 2 }, scene);
    sphere.position.y = 1;

    BABYLON.MeshBuilder.CreateGround("ground1", { width: 6, height: 6, subdivisions: 2 }, scene);

    return scene;
};

const scene = createScene();
engine.runRenderLoop(() => {
    scene.render();
});
window.addEventListener("resize", () => {
    engine.resize();
});
```

## Documentation

- [Documentation](https://doc.babylonjs.com)
- [Examples](https://playground.babylonjs.com)

## Contributing

Please see the [Contributing Guidelines](https://github.com/BabylonJS/Babylon.js/blob/master/contributing.md).

## Useful links

- Official web site: [www.babylonjs.com](https://www.babylonjs.com/)
- Online [playground](https://playground.babylonjs.com/) to learn by experimenting
- Online [sandbox](https://www.babylonjs.com/sandbox) where you can test your .babylon and glTF scenes with a simple drag'n'drop
- [glTF Tools](https://github.com/KhronosGroup/glTF#gltf-tools) by KhronosGroup

## Features

To get a complete list of supported features, please visit [Babylon.js website](https://www.babylonjs.com/).
