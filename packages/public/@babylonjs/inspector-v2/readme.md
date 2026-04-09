# BabylonJS Inspector

The Babylon Inspector is a diagnostic tool that makes it possible to view and edit the scene graph, properties of entities within the scene, and more.

You can learn more in the Inspector [documentation](https://doc.babylonjs.com/toolsAndResources/inspectorv2/).

## Installation

Install the package using npm:

```bash
npm install @babylonjs/inspector
```

The simplest way to use `Inspector` is to call the `ShowInspector` function, passing in your scene:

```ts
import { ShowInspector } from "@babylonjs/inspector";

// Your code that sets up a Babylon.js scene...

ShowInspector(scene);
```

## Headless Inspectable (No UI)

You can make a scene inspectable for the CLI without showing the Inspector UI by calling `StartInspectable`:

```ts
import { StartInspectable } from "@babylonjs/inspector";

// Your code that sets up a Babylon.js scene...

const token = StartInspectable(scene);

// When you're done, dispose the token to disconnect:
token.dispose();
```

`StartInspectable` connects the scene to the Inspector CLI bridge, enabling CLI commands like querying entities, taking screenshots, and capturing performance traces — all without rendering any Inspector UI. `ShowInspector` automatically calls `StartInspectable` internally.

## Inspector CLI

While the Inspector UI is designed for humans, the Inspector CLI is designed for AI agents. It provides machine-friendly JSON output for querying scene entities, capturing screenshots, collecting performance data, and more.

To get started:

```bash
npx babylon-inspector --help
```
