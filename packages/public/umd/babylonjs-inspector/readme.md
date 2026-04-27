# Babylon.js Inspector (Legacy)

> **Note:** This is the legacy inspector. For the new inspector, use the [`babylonjs-inspector`](https://www.npmjs.com/package/babylonjs-inspector) package (inspector v2), or the ES6 [`@babylonjs/inspector`](https://www.npmjs.com/package/@babylonjs/inspector). See the [Inspector v2 documentation](https://doc.babylonjs.com/toolsAndResources/inspectorv2/).

For usage documentation on the legacy inspector, see the [legacy inspector documentation](https://doc.babylonjs.com/legacy/inspector/).

## Installation

The inspector will be **automatically** (async) loaded when starting the debug layer, if not already included.

### CDN

> ⚠️ WARNING: The CDN should not be used in production environments. The purpose of our CDN is to serve Babylon packages to users learning how to use the platform or running small experiments. Once you've built an application and are ready to share it with the world at large, you should serve all packages from your own CDN.

The latest compiled js file is offered on our public CDN here:

- https://preview.babylonjs.com/inspector/babylon.inspector.bundle.js

### NPM

To install using npm:

```bash
npm install babylonjs babylonjs-inspector
```

Afterwards it can be imported to the project using:

```javascript
import * as BABYLON from "babylonjs";
import "babylonjs-inspector";
```
