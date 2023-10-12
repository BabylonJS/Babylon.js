Babylon.js Materials Library
=====================

For usage documentation please visit https://doc.babylonjs.com/extensions and choose "materials library".

# Installation instructions

## CDN

> ⚠️ WARNING: The CDN should not be used in production environments. The purpose of our CDN is to serve Babylon packages to users learning how to use the platform or running small experiments. Once you've built an application and are ready to share it with the world at large, you should serve all packages from your own CDN.

Compiled js files (minified and source) are offered on our public CDN here:

* https://preview.babylonjs.com/materialsLibrary/babylonjs.materials.js
* https://preview.babylonjs.com/materialsLibrary/babylonjs.materials.min.js

## NPM

To install using npm :

```
npm install --save babylonjs babylonjs-materials
```

If using TypeScript, the typing needs to be added to tsconfig.json:

```
    ....
    "types": [
        "babylonjs",
        "babylonjs-materials",
        "oneMoreDependencyThatIReallyNeed"
    ],
    ....
```

Afterwards it can be imported to the project using:

```
import * as BABYLON from 'babylonjs';
import 'babylonjs-materials';
```

This will extend Babylon's namespace with the materials available:

```
// Some awesome code
let skyMaterial = new BABYLON.SkyMaterial("skyMaterial", scene);
skyMaterial.backFaceCulling = false;
// Some more awesome code
```

Using webpack to package your project will use the minified js file.
