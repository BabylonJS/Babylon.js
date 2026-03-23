# @tools/snippet-loader

Load, parse, and execute [Babylon.js Playground](https://playground.babylonjs.com) snippets by ID.

The snippet loader handles the full lifecycle — fetching from the snippet server, detecting the content type, transpiling TypeScript, resolving imports, and providing ready-to-call `createEngine` / `createScene` functions — so consumers don't need to reimplement the Playground's execution logic.

## Quick Start

```ts
import { LoadSnippet } from "@tools/snippet-loader";

const result = await LoadSnippet("ABC123#2");

if (result.type === "playground") {
    const canvas = document.getElementById("renderCanvas");
    const engine = await result.createEngine(canvas);
    const scene = await result.createScene(engine, canvas);

    engine.runRenderLoop(() => scene.render());
}
```

## API

### `LoadSnippet(snippetId, options?)`

Fetches a snippet from the snippet server, detects its type, transpiles TS if needed, and returns a typed result.

```ts
const result = await LoadSnippet("PIZ1GK#2388");
```

**Options:**

| Option         | Type                | Default                           | Description                     |
| -------------- | ------------------- | --------------------------------- | ------------------------------- |
| `snippetUrl`   | `string`            | `"https://snippet.babylonjs.com"` | Override the snippet server URL |
| `transpile`    | `TranspileFn`       | Built-in (Monaco TS)              | Custom TS → JS transpiler       |
| `moduleFormat` | `"esm" \| "script"` | `"esm"`                           | Target module format            |

### `ParseSnippetResponse(response, snippetId, options?)`

Same pipeline but from an already-fetched `ISnippetServerResponse` — useful when you have your own fetching strategy or locally saved snippet JSON.

```ts
const response = await fetch("https://snippet.babylonjs.com/ABC123/0").then((r) => r.json());
const result = await ParseSnippetResponse(response, "ABC123#0");
```

### `CreateTypeScriptTranspiler(tsInstance, moduleFormat?)`

Creates a `TranspileFn` from any TypeScript compiler instance. Useful when you already have TS loaded and don't want to use the built-in Monaco transpiler.

```ts
import ts from "typescript";
import { LoadSnippet, CreateTypeScriptTranspiler } from "@tools/snippet-loader";

const transpile = CreateTypeScriptTranspiler(ts, "esm");
const result = await LoadSnippet("ABC123", { transpile });
```

## Result Types

The result is a discriminated union based on the `type` field:

### Playground Snippets (`type === "playground"`)

```ts
if (result.type === "playground") {
    // Source info
    result.language; // "JS" | "TS"
    result.engineType; // "WebGL2" | "WebGPU" | undefined
    result.isMultiFile; // true for V2, false for V1 legacy
    result.code; // Entry file source (as authored)
    result.files; // All source files (may include .ts)
    result.jsFiles; // All files transpiled to JS

    // Executable functions
    const engine = await result.createEngine(canvas);
    const scene = await result.createScene(engine, canvas);

    // Provenance
    result.createEngineSource; // "snippet" | "default"
    result.sceneFunctionName; // e.g. "createScene", "CreateScene", "delayCreateScene"

    // Runtime features
    result.runtimeFeatures; // { havok: bool, ammo: bool, recast: bool }
    await result.initializeRuntimeAsync();

    // Metadata
    result.metadata.name;
    result.metadata.description;
    result.metadata.tags;
}
```

### Data Snippets (`type !== "playground" && type !== "unknown"`)

Node Material, GUI, particles, animations, etc.:

```ts
if (result.type === "nodeMaterial") {
    // result.data is the parsed serialization object
    const mat = result.load((data) => NodeMaterial.Parse(data, scene));
}
```

### Unknown Snippets (`type === "unknown"`)

```ts
if (result.type === "unknown") {
    console.log(result.rawPayload); // Raw parsed JSON for manual inspection
}
```

## Module Formats

### ESM (default)

Code is loaded via blob URLs and dynamic `import()`. Bare `@babylonjs/*` imports are resolved to a synthetic proxy module that re-exports from `globalThis.BABYLON`. V2 manifest `imports` maps and relative imports are resolved automatically.

```ts
const result = await LoadSnippet("ABC123", { moduleFormat: "esm" });
```

### Script

Code is stripped of module syntax and executed via `new Function()`. Suitable for environments where Babylon.js is loaded as a UMD global via `<script>` tags.

```ts
const result = await LoadSnippet("ABC123", { moduleFormat: "script" });
```

## Runtime Features (Havok, Ammo, Recast)

The loader probes snippet source code for references to physics and navigation plugins and exposes what it finds:

```ts
const result = await LoadSnippet("ABC123");
if (result.type === "playground") {
    console.log(result.runtimeFeatures);
    // { havok: true, ammo: false, recast: false }
}
```

### Initializing Runtime Globals

Call `initializeRuntimeAsync()` **before** `createScene` to set up required globals.

**If the scripts are already loaded** (e.g. via `<script>` tags in your HTML):

```ts
// Just calls the factory functions already on window
// e.g. window.HK = await HavokPhysics()
await result.initializeRuntimeAsync();
```

**If you want the loader to fetch the scripts from CDN:**

```ts
await result.initializeRuntimeAsync({ loadScripts: true });
```

**With a custom base URL** (e.g. self-hosted or versioned CDN):

```ts
await result.initializeRuntimeAsync({
    loadScripts: true,
    baseUrl: "https://my-cdn.example.com/babylon/v8.0.0",
});
// Resolves to:
//   https://my-cdn.example.com/babylon/v8.0.0/havok/HavokPhysics_umd.js
//   https://my-cdn.example.com/babylon/v8.0.0/ammo/ammo.js
//   https://my-cdn.example.com/babylon/v8.0.0/recast.js
```

**Override individual URLs** (takes precedence over `baseUrl`):

```ts
await result.initializeRuntimeAsync({
    loadScripts: true,
    scriptUrls: { havok: "https://other-cdn.com/custom-havok.js" },
});
```

## Full Example

```html
<!DOCTYPE html>
<html>
    <head>
        <!-- Load Babylon.js as a global -->
        <script src="https://cdn.babylonjs.com/babylon.js"></script>
        <script src="https://cdn.babylonjs.com/loaders/babylonjs.loaders.min.js"></script>
    </head>
    <body>
        <canvas id="renderCanvas" style="width: 100%; height: 100vh;"></canvas>
        <script type="module">
            import { LoadSnippet } from "@tools/snippet-loader";

            const snippetId = location.hash.slice(1) || "PIZ1GK#2388";
            const canvas = document.getElementById("renderCanvas");

            const result = await LoadSnippet(snippetId);

            if (result.type !== "playground") {
                console.error("Not a playground snippet:", result.type);
                return;
            }

            // Create engine (uses WebGPU if the snippet requires it)
            const engine = await result.createEngine(canvas);

            // Initialize physics/navigation if the snippet needs them
            await result.initializeRuntimeAsync({ loadScripts: true });

            // Create the scene
            const scene = await result.createScene(engine, canvas);

            // Render loop
            engine.runRenderLoop(() => scene.render());
            window.addEventListener("resize", () => engine.resize());
        </script>
    </body>
</html>
```

## Legacy Snippet Compatibility

The loader handles legacy (V1) snippets transparently:

- **Language guessing** — Detects JS vs TS using heuristics when the snippet doesn't declare its language.
- **Export injection** — Adds `export default Playground` or `export default createScene` so legacy code works as ES modules.
- **Boilerplate stripping** — Removes hardcoded `var canvas = document.getElementById(...)` and `var engine = new BABYLON.Engine(...)` declarations that would conflict with the host page.
- **`this` binding proxy** — Old snippets that use `this.scene`, `this.engine`, or `this.canvas` work without modification.
- **Function name variants** — Detects `createScene`, `CreateScene`, `Playground.CreateScene`, `delayCreateScene`, `delayLoadScene`, and more.

## Engine Creation

When a snippet doesn't define its own `createEngine`, the loader provides a default:

- **WebGPU** — Creates `WebGPUEngine` with `enableAllFeatures: true` and `setMaximumLimits: true`.
- **WebGL** — Creates `BABYLON.Engine` with antialiasing, `preserveDrawingBuffer`, and stencil enabled.

You can check where the engine came from:

```ts
result.createEngineSource; // "snippet" — the snippet defines its own
result.createEngineSource; // "default" — loader-provided default
```

## Exports

| Export                       | Kind     | Description                               |
| ---------------------------- | -------- | ----------------------------------------- |
| `loadSnippet`                | function | Fetch + parse a snippet by ID             |
| `parseSnippetResponse`       | function | Parse an already-fetched response         |
| `createTypeScriptTranspiler` | function | Create a TranspileFn from a TS instance   |
| `fetchSnippet`               | function | Low-level fetch helper                    |
| `DEFAULT_SNIPPET_URL`        | const    | `"https://snippet.babylonjs.com"`         |
| `DefaultRuntimeBaseUrl`      | const    | `"https://cdn.babylonjs.com"`             |
| `RuntimeScriptPaths`         | const    | Relative paths for runtime scripts        |
| `PlaygroundSnippetResult`    | type     | Result for playground snippets            |
| `DataSnippetResult`          | type     | Result for data snippets (NME, GUI, etc.) |
| `UnknownSnippetResult`       | type     | Result for unrecognised snippets          |
| `SnippetResult`              | type     | Union of all result types                 |
| `LoadSnippetOptions`         | type     | Options for loadSnippet                   |
| `RuntimeFeatures`            | type     | `{ havok, ammo, recast }` flags           |
| `InitializeRuntimeOptions`   | type     | Options for initializeRuntimeAsync        |
| `TranspileFn`                | type     | Custom transpiler function signature      |
| `ModuleFormat`               | type     | `"esm" \| "script"`                       |
| `CreateEngineSource`         | type     | `"snippet" \| "default"`                  |
| `SnippetContentType`         | type     | Union of all content type strings         |
