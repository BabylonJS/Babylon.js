Babylon.js Materials Library
=====================

For usage documentation please visit http://doc.babylonjs.com/extensions and choose "materials library".

# Installation instructions

## CDN

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
