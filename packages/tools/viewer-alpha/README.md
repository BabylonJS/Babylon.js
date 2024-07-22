# Viewer Alpha

This package is the alpha version of the new @babylonjs/viewer package.

## Layers

There are currently three layers (one of them is "internal"):
1. The pure JS layer is viewer.ts. This layer is not tied to the DOM and can be used in the browser or with Babylon Native.
1. The canvas factory layer is in viewerFactory.ts. This layer binds the viewer to a Canvas.
1. The Web Components custom element is in viewerElement.ts. This layer uses the canvas factory and exposes the <babylon-viewer> element.

The Canvas factory could be used for other browser based UI framework integrations like React.

## Tools

Run `npm run start:web` to run the test app and debug the code.

Run `npm run analyze` to visualize the bundled size as a flame chart. This is useful for understanding how different parts of @babylonjs/core and @babylonjs/loaders contribute to the bundle size, and how to optimize it.

Run `npm run start:bundle-test` to test the bundled code in a browser. This is just here to verify that the bundled code has everything needed to actually run successfully, so we know we are not missing any code in our size analysis.