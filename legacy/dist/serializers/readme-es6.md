Babylon.js Serializers
=====================

# Installation instructions

To install using npm :

```
npm install --save @babylonjs/core @babylonjs/serializers
```

# How to use

Afterwards it can be imported to the your project using:

```
import { GLTF2Export } from '@babylonjs/serializers/glTF';
```

And used as usual:

```
GLTF2Export.GLTFAsync(scene, "fileName").then((gltf) => {
    gltf.downloadFiles();
});
```

For more information you can have a look at our [our ES6 dedicated documentation](https://doc.babylonjs.com/features/es6_support) and the [gltf exporter documentation](https://doc.babylonjs.com/extensions/gltfexporter).

