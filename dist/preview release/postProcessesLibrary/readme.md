Babylon.js Post Processes Library
=====================

For usage documentation please visit http://doc.babylonjs.com/extensions and choose "post process library".

# Installation instructions

## CDN

Compiled js files (minified and source) are offered on our public CDN here:

* https://preview.babylonjs.com/postProcessesLibrary/babylonjs.postProcess.js
* https://preview.babylonjs.com/postProcessesLibrary/babylonjs.postProcess.min.js

## NPM

To install using npm :

```
npm install --save babylonjs babylonjs-post-process
```

If using TypeScript, the typing needs to be added to tsconfig.json:

```
    ....
    "types": [
        "babylonjs",
        "babylonjs-post-process",
        "oneMoreDependencyThatIReallyNeed"
    ],
    ....
```

Afterwards it can be imported to the project using:

```
import * as BABYLON from 'babylonjs';
import 'babylonjs-post-process';
```

This will extend Babylon's namespace with the post processes available:

```
// Some awesome code
// Creates the post process
let postProcess = new BABYLON.AsciiArtPostProcess("AsciiArt", camera);
// Some more awesome code
```

Using webpack to package your project will use the minified js file.
