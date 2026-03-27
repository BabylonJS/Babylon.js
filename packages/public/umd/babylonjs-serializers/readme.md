# Babylon.js Serializers

> We recommend using the [ES6 package `@babylonjs/serializers`](https://www.npmjs.com/package/@babylonjs/serializers) for new projects.

## Installation

### CDN

> ⚠️ WARNING: The CDN should not be used in production environments. The purpose of our CDN is to serve Babylon packages to users learning how to use the platform or running small experiments. Once you've built an application and are ready to share it with the world at large, you should serve all packages from your own CDN.

Compiled js files (minified and source) are offered on our public CDN here:

- https://preview.babylonjs.com/serializers/babylonjs.serializers.js
- https://preview.babylonjs.com/serializers/babylonjs.serializers.min.js

### NPM

To install using npm:

```bash
npm install babylonjs babylonjs-serializers
```

If using TypeScript, the typing needs to be added to tsconfig.json:

```json
    "types": [
        "babylonjs",
        "babylonjs-serializers"
    ]
```

Afterwards it can be imported to the project using:

```javascript
import * as BABYLON from "babylonjs";
import "babylonjs-serializers";
```

This will extend Babylon's namespace with the serializers available.

For more information, see the [glTF exporter documentation](https://doc.babylonjs.com/features/featuresDeepDive/Exporters/glTFExporter/).
