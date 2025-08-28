# BabylonJS Inspector

The Babylon Inspector is a diagnostic tool that makes it possible to view and edit the scene graph, properties of entities within the scene, and more.

Documentation and samples coming soon!

## Installation

Install the package using npm:

```bash
npm install @babylonjs/inspector@preview
```

The simplest way to use the `Inspector` is to call the `ShowInspector` function, passing in your scene:

```ts
import { ShowInspector } from "@babylonjs/inspector";

// Your code that sets up a Babylon.js scene

ShowInspector(scene);
```
