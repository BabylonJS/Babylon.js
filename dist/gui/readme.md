Babylon.js GUI module
=====================

For usage documentation please visit http://doc.babylonjs.com/overviews/gui

# Installation instructions

## CDN

Compiled js files (minified and source) are offered on our public CDN here:

* https://preview.babylonjs.com/gui/babylon.gui.js
* https://preview.babylonjs.com/gui/babylon.gui.min.js

## NPM

To install using npm :

```
npm install --save babylonjs babylonjs-gui
```

If using TypeScript, the typing needs to be added to tsconfig.json:

```
    ....
    "types": [
        "babylonjs",
        "babylonjs-gui"
    ],
    ....
```

Afterwards it can be imported to the project using:

```
import * as GUI from 'babylonjs-gui';
```

Using webpack to package your project will use the minified js file.
