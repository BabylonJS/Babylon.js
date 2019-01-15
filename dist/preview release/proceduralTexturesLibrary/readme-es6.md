Babylon.js Procedural Textures Library
=====================

For usage documentation please visit http://doc.babylonjs.com/extensions and choose "procedural textures library".

# Installation instructions

To install using npm :

```
npm install --save @babylonjs/core @babylonjs/procedural-textures
```

# How to use

Afterwards it can be imported to the your project using:

```
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { FireProceduralTexture } from '@babylonjs/procedural-textures/fireProceduralTexture';
```

And used as usual:

```
// Some awesome code
var fireMaterial = new StandardMaterial("fontainSculptur2", scene);
var fireTexture = new FireProceduralTexture("fire", 256, scene);
fireMaterial.diffuseTexture = fireTexture;
fireMaterial.opacityTexture = fireTexture;
// Some more awesome code
```

For more information you can have a look at our [our ES6 dedicated documentation](https://doc.babylonjs.com/features/es6_support).
