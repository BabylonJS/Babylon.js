# Playground Workflow

This file describes how to write Babylon.js Playground code, manage snippets via helper scripts, and run the local Playground servers. It applies to any task that involves Playground snippets — visual tests, API demos, repro cases, etc.

## Playground Examples for New APIs

When new APIs are added to published packages (core, loaders, materials, etc.), a playground example (https://playground.babylonjs.com) should be created to demonstrate the new API. The example should be noted in a comment in the code where the new API is added, with a link to the playground example. These playgrounds are often useful for visualization tests as well. When reviewing code, check if any new APIs are added without a corresponding playground example. If so, add a review comment suggesting creating and linking to a playground example.

## Writing Playground Code

Write the scene as a standard `createScene` function and save it to a temporary file. Default to `.js` unless the user asks for TypeScript or a nearby reference is already TypeScript. The helper script infers the snippet language from the file extension.

### Coding style

- **One statement per line.** Do not chain multiple statements on a single line. This keeps diffs readable and makes visual test review easier.
- Do not seed `Math.random` manually in snippets used for visualization tests. The visualization harness already replaces `Math.random` with a deterministic seeded implementation.

### Template

```javascript
// Save as temp_pg_mytest.js
const createScene = function () {
    const scene = new BABYLON.Scene(engine);
    const camera = new BABYLON.ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 2.5, 3, new BABYLON.Vector3(0, 0, 0), scene);
    camera.attachControl(canvas, true);
    new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);

    // Feature-specific setup goes here.

    return scene;
};

export default createScene;
```

## Reading Existing Snippets

Use `.github/scripts/visual-testing/read-snippet.js` to fetch code from an existing Playground snippet. This is useful when you want to study a reference test or reuse an existing scene setup.

The snippet server uses a slash URL format such as `https://snippet.babylonjs.com/ABC123/5`. The `playgroundId` format used in config entries is hash-based, such as `#ABC123#5`. The helper script handles the conversion automatically.

```bash
# Print snippet code to stdout
node .github/scripts/visual-testing/read-snippet.js "#ABC123#5"

# Save snippet code to a file for easier reading
node .github/scripts/visual-testing/read-snippet.js "#ABC123#5" --save existing_test.js
```

The script handles both V2 manifest snippets and legacy raw-code snippets, and extracts the entry file's JavaScript source.

## Saving Snippets

Use `.github/scripts/visual-testing/save-snippet.js` to post a temp playground file directly to the Babylon snippet server. This is usually more reliable than manually saving through the Playground UI. The helper infers the snippet language from the file extension: `.js` stays JavaScript, while `.ts` and `.tsx` are saved as TypeScript snippets.

```bash
node .github/scripts/visual-testing/save-snippet.js <code-file> "<Name>" "<Description>"
```

Example:

```bash
node .github/scripts/visual-testing/save-snippet.js temp_pg_mytest.js "My Test Name" "Description of test"
```

Expected output:

```text
Saved: #ABC123#0
```

If saving the snippet fails because the snippet server is unavailable or blocked from the current environment, stop and ask the user for help. Do not switch a standard visualization test to `scriptToRun` or another local-only workaround unless the user explicitly asks for that.

If you need to revise the snippet, edit the temp file and run `save-snippet.js` again. The snippet server will create a new revision, such as `#ABC123#1`.

## Local Servers

Local servers are only needed when you want to preview or run a snippet against a local engine build. Snippet creation and saving via the helper scripts do not require local servers.

For server startup steps, port numbers, and readiness checks, see [local-servers.md](local-servers.md). The key servers are CDN (`localhost:1337`) and Playground (`localhost:1338`).

## Forcing WebGPU

Add `?engine=webgpu` to the Playground URL to force WebGPU rendering.

## Cleanup

After finishing, remove any `temp_pg_*.js` / `temp_pg_*.ts` files and stop servers you started.
