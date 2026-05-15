# Babylon.js Post Processes Library

> We recommend using the [ES6 package `@babylonjs/post-processes`](https://www.npmjs.com/package/@babylonjs/post-processes) for new projects.

For usage documentation please visit the [post process library documentation](https://doc.babylonjs.com/toolsAndResources/assetLibraries/postProcessLibrary/).

## Installation

### CDN

> ⚠️ WARNING: The CDN should not be used in production environments. The purpose of our CDN is to serve Babylon packages to users learning how to use the platform or running small experiments. Once you've built an application and are ready to share it with the world at large, you should serve all packages from your own CDN.

Compiled js files (minified and source) are offered on our public CDN here:

- https://preview.babylonjs.com/postProcessesLibrary/babylonjs.postProcess.js
- https://preview.babylonjs.com/postProcessesLibrary/babylonjs.postProcess.min.js

### NPM

To install using npm:

```bash
npm install babylonjs babylonjs-post-process
```

If using TypeScript, the typing needs to be added to tsconfig.json:

```json
    "types": [
        "babylonjs",
        "babylonjs-post-process"
    ]
```

Afterwards it can be imported to the project using:

```javascript
import * as BABYLON from "babylonjs";
import "babylonjs-post-process";

const postProcess = new BABYLON.AsciiArtPostProcess("AsciiArt", camera);
```
