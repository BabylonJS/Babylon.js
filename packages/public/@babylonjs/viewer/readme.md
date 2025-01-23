# BabylonJS Viewer

The Babylon Viewer aims to simplify a specific but common Babylon.js use case: loading, viewing, and interacting with a 3D model.

- [API](https://doc.babylonjs.com/packages/viewer/index)
- [Documentation](https://doc.babylonjs.com/features/featuresDeepDive/babylonViewer)
- [Feature requests](https://forum.babylonjs.com/t/babylon-viewer-v2/54317)
- [Support](https://forum.babylonjs.com/c/questions)

## Using with a Bundler

Install the package using npm:

```bash
npm install @babylonjs/viewer
```

To use the `HTML3DElement` you can import the `@babylonjs/viewer` module and then reference the `<babylon-viewer>` custom element in your HTML like this:

```html
<html lang="en">
    <body>
        <!-- Note: If @babylonjs/viewer is already being imported somewhere in your JavaScript, you don't need this script import. -->
        <script type="module">
            import "@babylonjs/viewer";
        </script>
        <babylon-viewer source="https://playground.babylonjs.com/scenes/BoomBox.glb"></babylon-viewer>
    </body>
</html>
```

## Using Directly in a Browser

If you want to use the viewer directly in a browser without any build tools, you can use the self-contained ESM bundle (which includes all dependencies) through a CDN such as [jsDelivr](https://www.jsdelivr.com/), [UNPKG](https://unpkg.com/), or your own CDN like this:

```html
<html lang="en">
    <body>
        <script type="module" src="https://cdn.jsdelivr.net/npm/@babylonjs/viewer/dist/babylon-viewer.esm.min.js"></script>
        <babylon-viewer source="https://playground.babylonjs.com/scenes/BoomBox.glb"></babylon-viewer>
    </body>
</html>
```

See the [codepen.io](https://codepen.io/BabylonJS/pen/ogvbyyW) example for a live demo.
