# BabylonJS Viewer

This project is the alpha version of a new a 3d model viewer using babylonjs.

`Viewer` is a lower level JavaScript class that implements the bulk of the features, and can be used in any babylonjs context (in the browser using pure HTML, in the browser using React, or even in Babylon Native).

`HTML3DElement` is a custom HTML element that wraps the `Viewer` class and provides a declarative way to use it specifically in HTML via the custom element `<babylon-viewer>`.

## ES6/NPM usage

Install the package using npm:

```bash
npm install @babylonjs/viewer@preview --save
```

If you want to use the lower level `Viewer` directly in JavaScript code, you can import it and use it like this:

```bash
import { Engine } from '@babylonjs/core';
import { Viewer } from '@babylonjs/viewer';

const engine = new Engine(canvas);
const viewer = new Viewer(engine);
viewer.loadModelAsync("https://playground.babylonjs.com/scenes/BoomBox.glb");
```

To use the higher level `HTML3DElement` you can import the `@babylonjs/viewer` module and then reference the `<babylon-viewer>` element in your HTML like this:

```html
<html lang="en">
  <body>
    <script type="module">
      import '@babylonjs/viewer';
    </script>
    <babylon-viewer source="https://playground.babylonjs.com/scenes/BoomBox.glb"></babylon-viewer>
  </body>
</html>
```

## CDN/Direct usage

If you want to use the viewer directly in a browser without any build tools, you can use the self-contained ESM bundle (which includes all dependencies) through a CDN such as [UNPKG](https://unpkg.com/) or [jsDelivr](https://www.jsdelivr.com/) like this:

```html
<html lang="en">
  <body>
    <script type="module" src="https://unpkg.com/@babylonjs/viewer@preview/dist/babylon-viewer.esm.min.js"></script>
    <babylon-viewer source="https://playground.babylonjs.com/scenes/BoomBox.glb"></babylon-viewer>
  </body>
</html>
```

See the [codesandbox.io](https://codesandbox.io/p/sandbox/babylon-viewer-ws82xr) example for a live demo.
