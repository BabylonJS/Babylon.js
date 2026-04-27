# Babylon.js Serializers

## Installation

To install using npm:

```bash
npm install @babylonjs/core @babylonjs/serializers
```

## Usage

Import and use in your project:

```javascript
import { GLTF2Export } from "@babylonjs/serializers/glTF";

GLTF2Export.GLTFAsync(scene, "fileName").then((gltf) => {
    gltf.downloadFiles();
});
```

For more information, see the [ES6 support documentation](https://doc.babylonjs.com/setup/frameworkPackages/es6Support/) and the [glTF exporter documentation](https://doc.babylonjs.com/features/featuresDeepDive/Exporters/glTFExporter/).
