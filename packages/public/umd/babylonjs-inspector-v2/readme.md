Babylon.js inspector module
=====================

For usage documentation please visit https://doc.babylonjs.com/how_to/debug_layer.

# Installation instructions

The inspector will be **automatically** (async) loaded when starting the debug layer, if not already included. So technically, nothing needs to be done!

If you wish however to use a different version of the inspector or host it on your own, follow these instructions:

## CDN

> ⚠️ WARNING: The CDN should not be used in production environments. The purpose of our CDN is to serve Babylon packages to users learning how to use the platform or running small experiments. Once you've built an application and are ready to share it with the world at large, you should serve all packages from your own CDN.

The latest compiled js file is offered on our public CDN here:

* https://preview.babylonjs.com/inspector/babylon.inspector.bundle.js

## NPM

To install using npm :

```
npm install --save babylonjs babylonjs-inspector
```
Afterwards it can be imported to the project using:

```
import * as BABYLON from 'babylonjs';
import 'babylonjs-inspector';
```

This will create a global INSPECTOR variable that will be used bay BabylonJS

Webpack is supported.
