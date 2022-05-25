# Babylon.js

Getting started? Play directly with the Babylon.js API using our [playground](https://playground.babylonjs.com/). It also contains a lot of samples to learn how to use it.

[![npm version](https://badge.fury.io/js/babylonjs.svg)](https://badge.fury.io/js/babylonjs)
[![Build Status](https://dev.azure.com/babylonjs/ContinousIntegration/_apis/build/status/CI?branchName=master)](https://dev.azure.com/babylonjs/ContinousIntegration/_build/latest?definitionId=14&branchName=master)
[![Average time to resolve an issue](http://isitmaintained.com/badge/resolution/BabylonJS/Babylon.js.svg)](http://isitmaintained.com/project/BabylonJS/Babylon.js "Average time to resolve an issue")
[![Percentage of issues still open](https://isitmaintained.com/badge/open/babylonJS/babylon.js.svg)](https://isitmaintained.com/project/babylonJS/babylon.js "Percentage of issues still open")
![Build size](https://img.shields.io/bundlephobia/minzip/babylonjs)
[![Twitter](https://img.shields.io/twitter/follow/babylonjs.svg?style=social&label=Follow)](https://twitter.com/intent/follow?screen_name=babylonjs)
![Discourse users](https://img.shields.io/discourse/users?server=https%3A%2F%2Fforum.babylonjs.com)

**Any questions?** Here is our official [forum](https://forum.babylonjs.com/).

## CDN

- <https://cdn.babylonjs.com/babylon.js>
- <https://cdn.babylonjs.com/babylon.max.js>


For the preview release, use the following URLs:

- <https://preview.babylonjs.com/babylon.js>
- <https://preview.babylonjs.com/babylon.max.js>

A list of additional references can be found [here](https://doc.babylonjs.com/divingDeeper/developWithBjs/frameworkVers#cdn-current-versions).

## npm

BabylonJS and its modules are published on npm with full typing support. To install, use:

```text
npm install babylonjs --save
```

This will allow you to import BabylonJS entirely using:

```javascript
import * as BABYLON from 'babylonjs';
```

or individual classes using:

```javascript
import { Scene, Engine } from 'babylonjs';
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

See [Getting Started](https://doc.babylonjs.com/#getting-started):

```javascript
// Get the canvas DOM element
var canvas = document.getElementById('renderCanvas');
// Load the 3D engine
var engine = new BABYLON.Engine(canvas, true, {preserveDrawingBuffer: true, stencil: true});
// CreateScene function that creates and return the scene
var createScene = function(){
    // Create a basic BJS Scene object
    var scene = new BABYLON.Scene(engine);
    // Create a FreeCamera, and set its position to {x: 0, y: 5, z: -10}
    var camera = new BABYLON.FreeCamera('camera1', new BABYLON.Vector3(0, 5, -10), scene);
    // Target the camera to scene origin
    camera.setTarget(BABYLON.Vector3.Zero());
    // Attach the camera to the canvas
    camera.attachControl(canvas, false);
    // Create a basic light, aiming 0, 1, 0 - meaning, to the sky
    var light = new BABYLON.HemisphericLight('light1', new BABYLON.Vector3(0, 1, 0), scene);
    // Create a built-in "sphere" shape using the SphereBuilder
    var sphere = BABYLON.MeshBuilder.CreateSphere('sphere1', {segments: 16, diameter: 2, sideOrientation: BABYLON.Mesh.FRONTSIDE}, scene);
    // Move the sphere upward 1/2 of its height
    sphere.position.y = 1;
    // Create a built-in "ground" shape;
    var ground = BABYLON.MeshBuilder.CreateGround("ground1", { width: 6, height: 6, subdivisions: 2, updatable: false }, scene);
    // Return the created scene
    return scene;
}
// call the createScene function
var scene = createScene();
// run the render loop
engine.runRenderLoop(function(){
    scene.render();
});
// the canvas/window resize event handler
window.addEventListener('resize', function(){
    engine.resize();
});
```

## Contributing

If you want to contribute, please read our [contribution guidelines](https://github.com/BabylonJS/Babylon.js/blob/master/contributing.md) first.

## Documentation

- [Documentation](https://doc.babylonjs.com)
- [Demos](https://www.babylonjs.com/community/)

## Contributing
Please see the [Contributing Guidelines](./contributing.md).

## Useful links

- Official web site: [www.babylonjs.com](https://www.babylonjs.com/)
- Online [playground](https://playground.babylonjs.com/) to learn by experimentating
- Online [sandbox](https://www.babylonjs.com/sandbox) where you can test your .babylon and glTF scenes with a simple drag'n'drop
- Online [shader creation tool](https://cyos.babylonjs.com/) where you can learn how to create GLSL shaders
- 3DS Max [exporter](https://github.com/BabylonJS/Exporters/tree/master/3ds%20Max) can be used to generate a .babylon file from 3DS Max
- Maya [exporter](https://github.com/BabylonJS/Exporters/tree/master/Maya) can be used to generate a .babylon file from Maya
- Blender [exporter](https://github.com/BabylonJS/BlenderExporter) can be used to generate a .babylon file from Blender 3d
- Unity 5[ (deprecated) exporter](https://github.com/BabylonJS/Exporters/tree/master/Unity) can be used to export your geometries from Unity 5 scene editor(animations are supported)
- [glTF Tools](https://github.com/KhronosGroup/glTF#gltf-tools) by KhronosGroup

## Features

To get a complete list of supported features, please visit our [website](https://www.babylonjs.com/specifications/).
