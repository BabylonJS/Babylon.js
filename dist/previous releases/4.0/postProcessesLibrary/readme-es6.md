Babylon.js Post Processes Library
=====================

For usage documentation please visit http://doc.babylonjs.com/extensions and choose "post process library".

# Installation instructions

To install using npm :

```
npm install --save @babylonjs/core @babylonjs/post-processes
```

# How to use

Afterwards it can be imported to the your project using:

```
import { AsciiArtPostProcess } from '@babylonjs/post-processes/asciiArt';
```

And used as usual:

```
// Some awesome code
// Creates the post process
let postProcess = new AsciiArtPostProcess("AsciiArt", camera);
// Some more awesome code
```

For more information you can have a look at our [our ES6 dedicated documentation](https://doc.babylonjs.com/features/es6_support).