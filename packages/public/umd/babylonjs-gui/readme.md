Babylon.js GUI module
=====================

For usage documentation please visit https://doc.babylonjs.com/overviews/gui

# Installation instructions

## CDN

> ⚠️ WARNING: The CDN should not be used in production environments. The purpose of our CDN is to serve Babylon packages to users learning how to use the platform or running small experiments. Once you've built an application and are ready to share it with the world at large, you should serve all packages from your own CDN.

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
        "babylonjs-gui",
        "otherImportsYouMightNeed"
    ],
    ....
```

Afterwards it can be imported to the project using:

```
import * as GUI from 'babylonjs-gui';
```

Using webpack to package your project will use the minified js file.
