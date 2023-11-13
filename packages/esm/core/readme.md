# @esm/core

## How to use?

@esm/core is ready to be consumed right after building it. To build run

`npm run build -w @esm/core`

For the time being, importing directly from esm/core will need to be done from its dist directory. Of course, this will not be a part of the final architecture.

After building you can install @esm/core using npm link or uding a direct file:// link alongside @babylonjs/core

Any function from the webgl engine is used independently using the engineState object you initially create. This state object holds all variables needed for the different functions to work.

To use, for example:

```javascript
import { Color4 } from "@babylonjs/core/Maths/math.color";
import { initWebGLEngineState, clear, setViewport, createTexture } from "@esm/core/dist/Engines/WebGL/engine.webgl";

const canvas = document.getElementById("babylon-canvas") as HTMLCanvasElement;

const engineState = initWebGLEngineState(canvas);

setViewport(engineState, {
    x: 0,
    y: 0,
    width: 1,
    height: 1
});
clear(engineState, Color4.FromInts(83, 156, 33, 255), true, true);

createTexture(engineState, "./alien.png", false, false, null);
```

## Adapters

You can generate an adapter that will be "converted" to a corresponding Engine class. For example, you can generate a ThinEngine using this command:

```javascript
const engineState = initWebGLEngineState(glContext, {
         disableWebGL2Support: true
      });
      // get adapter
      const adapter: Engine = augmentEngineState(engineState, {
        // functions you are using in your experience, imported from the webgl engine

      });
```

Adapters are useful when you want to use ESM to construct a class that requires an engine in its constructor. There are a few helper/adapter objects that can be used to generate an engine that fits the class you are constructing. for example, to create an effect, do the following:

```javascript
import { initWebGLEngineState } from "@esm/core/dist/Engines/engine.webgl";

import { augmentEngineState } from "@esm/core/dist/Engines/engine.adapters";
import { effectWebGLAdapter } from "@esm/core/dist/Engines/WebGL/engine.adapterHelpers";

const canvas = document.getElementById("babylon-canvas") as HTMLCanvasElement;

const engineState = initWebGLEngineState(canvas);
// augment the engine state
const engineForEffect = augmentEngineState(engineState, effectWebGLAdapter);
// now engineForEffect can be used to construct an effect
```

This mechanism is (still) used internally.

## Extensions

Engine extensions are now not a part of the engine itself, but external functions. You can still use them to augment the state object for legacy reasons.

To use an extension:

```javascript
// import the functions needed
import * as multiRenderExtension from "@esm/core/dist/Engines/WebGL/Extensions/multiRender/multiRender.webgl.js";
import { setExtension, EngineExtensions } from "@esm/core/dist/Engines/Extensions/engine.extensions.js";

// To let the engine use it internally (when needed by the engine) you can register he extension
setExtension(engineState, EngineExtensions.MULTI_RENDER, multiRenderExtension);

// You can use the import directly using the engine state, and now the engine can use it internally, if needed
```
