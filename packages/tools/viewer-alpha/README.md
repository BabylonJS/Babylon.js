# Viewer Alpha

This package is the alpha version of the new @babylonjs/viewer package.

## Layers

There are currently three layers (one of them is "internal"):
1. The pure JS layer is viewer.ts. This layer is not tied to the DOM and can be used in the browser or with Babylon Native.
1. The canvas factory layer is in viewerFactory.ts. This layer binds the viewer to a Canvas.
1. The Web Components custom element is in viewerElement.ts. This layer uses the canvas factory and exposes the <babylon-viewer> element.

The Canvas factory could be used for other browser based UI framework integrations like React.

## Tools

### `npm run start:web`

Runs the test app and debug the code.

### `npm run analyze`
Visualizes the bundled size as a flame chart. This is useful for understanding how different parts of @babylonjs/core and @babylonjs/loaders contribute to the bundle size, and how to optimize it.

### `npm run import-chains -- <partial file path>`
NOTE: `npm run analyze` must be run first.

Prints out all the import chains that lead to a particular module. This is useful for understanding why a particular module is not being tree shaken. For example:
```
npm run import-chains -- standardmaterial
```

### `npm run start:analyze`
Tests the analyze bundled code in a browser. This is just here to verify that the bundled code has everything needed to actually run successfully, so we know we are not missing any code in our size analysis.

### `npm run start:coverage`
Creates a non-minified bundle, instruments it with nyc/istanbul, and launches the result in the browser. At this point, the web app can be interacted with manually to generate coverage data. Pressing the "Collect Coverage" button will generate and visualize a coverage report as well as an unused bytes flame chart.
