# BabylonJS Inspector

The Babylon Inspector is a diagnostic tool that makes it possible to view and edit the scene graph, properties of entities within the scene, and more.

If you are bundling your app, we recommend using the `@babylonjs/inspector` ESM package instead of this UMD package. This package can be useful if you are trying to use Inspector directly in a web page without running your own bundler.

You can learn more in the Inspector [documentation](https://doc.babylonjs.com/toolsAndResources/inspectorv2/).

## Installation

Install the package using npm:

```bash
npm install babylonjs-inspector
```

The simplest way to use `Inspector` is to call the `BABYLON.ShowInspector` function, passing in your scene:

```ts
// Your code that sets up a Babylon.js scene...

BABYLON.ShowInspector(scene);
```

```html
<html>
    <body>
        <canvas id="renderCanvas"></canvas>
        <script src="babylon.inspector-v2.bundle.js"></script>
        <script>
            // Your code that sets up a Babylon.js scene...

            BABYLON.ShowInspector(scene);
        </script>
    </body>
</html>
```
