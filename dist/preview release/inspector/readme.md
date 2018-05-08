Babylon.js inspector module
=====================

For usage documentation please visit http://doc.babylonjs.com/how_to/debug_layer and search "inspector".

# Installation instructions

The inspector will be **automatically** (async) loaded when starting the debug layer, if not already included. So technically, nothing needs to be done!

If you wish however to use a different version of the inspector or host it on your own, follow these instructions:

## CDN

The latest compiled js file is offered on our public CDN here:

* https://preview.babylonjs.com/inspector/babylonjs.inspector.bundle.js

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
