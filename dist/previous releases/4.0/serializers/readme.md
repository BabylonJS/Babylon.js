Babylon.js Serializers
=====================

# Installation instructions

## CDN

Compiled js files (minified and source) are offered on our public CDN here:

* https://preview.babylonjs.com/serializers/babylonjs.serializers.js
* https://preview.babylonjs.com/proceduralTexturesLibrary/babylonjs.serializers.min.js

## NPM

To install using npm :

```
npm install --save babylonjs babylonjs-serializers
```

If using TypeScript, the typing needs to be added to tsconfig.json:

```
    ....
    "types": [
        "babylonjs",
        "babylonjs-serializers",
        "oneMoreDependencyThatIReallyNeed"
    ],
    ....
```

Afterwards it can be imported to the project using:

```
import * as BABYLON from 'babylonjs';
import from 'babylonjs-serializers';
```

This will extend Babylon's namespace with the serializers currently available.

Using webpack to package your project will use the minified js file.
