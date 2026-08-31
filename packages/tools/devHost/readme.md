# Dev Host

This devhost provides a fast inner loop for testing Babylon.js code in a small browser app. It is useful for ES6 experiences that contain their own engine, like lottie-player, and for focused validation apps when testing Babylon.js core changes.

## Running the dev host

From the Babylon.js repo root:

```bash
npm run build:dev
npm run serve -w @tools/dev-host
```

Then open `http://localhost:1338`.

## Scenarios

The dev host supports multiple scenarios that you can access by adding the `exp` QSP to the URL.

### exp=lottie

This experience allows you to test the Babylon lottie-player. It supports the following params:

- `file=string` Renders this file from the Babylon assets repo. For example, `file=triangles.json` uses `https://assets.babylonjs.com/lottie/triangles.json`. A path starting with `./` is served from the dev host's `public` folder instead.
- `useWorker=boolean` Whether to use the webworker for rendering or not. Defaults to true if not used.
- `useUrl=boolean` Whether to hand the player the file URL or a pre-parsed JSON object. Defaults to true.
- `usePreWarm=boolean` Whether to pre-warm the worker before playing. Defaults to false.
- `frame=number` Renders a single frame instead of playing (used by the visual tests).
- `variables=string` Base64-encoded JSON object of text substitutions.

To change lottie variables or more detailed configuration options, edit `src/lottie/main.ts` directly.

### exp=testScene

This experience renders a small scene using ES6 imports by default, which makes it useful for testing core changes, side-effect imports, and other app-like runtime behavior. Edit `src/testScene/createScene.ts` to build a focused validation scene, then open `http://localhost:1338/?exp=testScene`.

It supports the following params:

- `useTS=boolean` Whether to use the `createScene.ts` or `createSceneJS.js` files. Defaults to true (`createScene.ts`) if not used.

### exp=webxrOverWebGPU

This committed example creates an XR-compatible `WebGPUEngine`, enables the required WebXR Layers feature, and uses `WebXRDefaultExperience` for the standard entry UI, controller models, pointer selection, teleportation, near interaction, and hand tracking. It also displays WebGPU-XR capability and session-state diagnostics.

Run the dev host and open `http://localhost:1338/?exp=webxrOverWebGPU`. In a headset, use the standard XR button in the lower-right corner, then verify stereo geometry, controller appearance, pointer selection, teleportation, exit, and re-entry. On unsupported browsers or devices, the status panel displays the WebGPU-XR capability failure.
