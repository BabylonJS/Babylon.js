Babylon.js Procedural Textures Library
=====================

For usage documentation please visit http://doc.babylonjs.com/extensions and choose "procedural textures library".

# Installation instructions

## CDN

Compiled js files (minified and source) are offered on our public CDN here:

* https://preview.babylonjs.com/proceduralTexturesLibrary/babylonjs.proceduralTextures.js
* https://preview.babylonjs.com/proceduralTexturesLibrary/babylonjs.proceduralTextures.min.js

## NPM

To install using npm :

```
npm install --save babylonjs babylonjs-procedural-textures
```

If using TypeScript, the typing needs to be added to tsconfig.json:

```
    ....
    "types": [
        "babylonjs",
        "babylonjs-procedural-textures",
        "oneMoreDependencyThatIReallyNeed"
    ],
    ....
```

Afterwards it can be imported to the project using:

```
import * as BABYLON from 'babylonjs';
import 'babylonjs-procedural-textures';
```

This will extend Babylon's namespace with the procedural textures available:

```
// Some awesome code
var fireMaterial = new BABYLON.StandardMaterial("fontainSculptur2", scene);
var fireTexture = new BABYLON.FireProceduralTexture("fire", 256, scene);
fireMaterial.diffuseTexture = fireTexture;
fireMaterial.opacityTexture = fireTexture;
// Some more awesome code
```

Using webpack to package your project will use the minified js file.
