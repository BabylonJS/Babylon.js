Babylon.js Loaders module
=====================

For usage documentation please visit http://doc.babylonjs.com/extensions and choose "loaders".

# Installation instructions

## CDN

Compiled js files (minified and source) are offered on our public CDN here:

* https://preview.babylonjs.com/loaders/babylonjs.loaders.js
* https://preview.babylonjs.com/loaders/babylonjs.loaders.min.js

## NPM

To install using npm :

```
npm install --save babylonjs babylonjs-loaders
```

If using TypeScript, the typing needs to be added to tsconfig.json:

```
    ....
    "types": [
        "babylonjs",
        "babylonjs-loaders",
        ""
    ],
    ....
```

Afterwards it can be imported to the project using:

```
import * as BABYLON from 'babylonjs';
import 'babylonjs-loaders';
```

This will extend Babylon's namespace with the loaders available.

Using webpack to package your project will use the minified js file.
