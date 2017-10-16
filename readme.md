Babylon.js
==========

Getting started? Play directly with the Babylon.js API via our [playground](http://www.babylonjs.com/playground). It contains also lot of simple samples to learn how to use it.

[![Build Status](https://travis-ci.org/BabylonJS/Babylon.js.svg)](https://travis-ci.org/BabylonJS/Babylon.js)

**Any questions?** Here is our official [forum](http://www.html5gamedevs.com/forum/16-babylonjs/) on www.html5gamedevs.com.

## CDN
- https://cdn.babylonjs.com/babylon.js
- https://cdn.babylonjs.com/babylon.max.js
- https://cdn.babylonjs.com/babylon.worker.js

Additional references can be found on https://cdn.babylonjs.com/xxx where xxx is the folder structure you can find in the /dist folder like https://cdn.babylonjs.com/gui/babylon.gui.min.js

For preview release you can use the following ones:

- https://preview.babylonjs.com/babylon.js
- https://preview.babylonjs.com/babylon.max.js
- https://preview.babylonjs.com/babylon.worker.js

Additional references can be found on https://preview.babylonjs.com/xxx where xxx is the folder structure you can find in the /dist/preview release folder like https://preview.babylonjs.com/gui/babylon.gui.min.js

## NPM

BabylonJS and its modules are published on NPM with full typing support. To install use

```
npm install babylonjs --save
```

This will allow you to import BabylonJS entirely using:

```
import * as BABYLON from 'babylonjs';
```

or individual classes using:

```
import { Scene, Engine } from 'babylonjs';
```

If using TypeScript, don't forget to add 'babylonjs' to 'types' in tsconfig.json:

```
    ....
    "types": [
        "babylonjs",
        "anotherAwesomeDependency"
    ],
    ....
```

To add a module install the respected package. A list of extra packages and their installation instructions can be found on [babylonjs' user at npm](https://www.npmjs.com/~babylonjs).

## Preview release

**3.1-alpha** can be found [here](https://github.com/BabylonJS/Babylon.js/tree/master/dist/preview%20release).
If you want to contribute, please read our [contribution guidelines](https://github.com/BabylonJS/Babylon.js/blob/master/contributing.md) first.

## Documentation
- [Documentation](http://doc.babylonjs.com)
- [Samples](https://github.com/BabylonJS/Samples)
- [Video overview (1 hour) of BabylonJS features](http://www.youtube.com/watch?v=z80TYMqsdEM)
- [Complete course (8 hours)](http://www.microsoftvirtualacademy.com/training-courses/introduction-to-webgl-3d-with-html5-and-babylon-js)

## Useful links

 - Official web site: [www.babylonjs.com](http://www.babylonjs.com/)
 - Online [sandbox](http://www.babylonjs.com/sandbox) where you can test your .babylon scenes with a simple drag'n'drop
 - Online [shader creation tool](http://www.babylonjs.com/cyos/) where you can learn how to create GLSL shaders
 - 3DS Max [exporter](https://github.com/BabylonJS/Exporters/tree/master/3ds%20Max) can be used to generate a .babylon file from 3DS Max
 - Blender [exporter](https://github.com/BabylonJS/Exporters/tree/master/Blender) can be used to generate a .babylon file from Blender 3d
 - Unity 5 [exporter](https://github.com/BabylonJS/Exporters/tree/master/Unity%205) can be used to export your geometries from Unity 5 scene editor(animations are supported)

## Features
To get a complete list of supported features, please visit our [website](http://www.babylonjs.com/#specifications).
