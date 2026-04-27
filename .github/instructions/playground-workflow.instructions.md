# Playground Workflow

This file describes how to write Babylon.js Playground code, manage snippets via helper scripts, and run the local Playground servers. It applies to any task that involves Playground snippets — visual tests, API demos, repro cases, etc.

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

Local servers are only needed when you want to preview or run a snippet against a local engine build — for example, when validating visual tests locally or testing unreleased code changes. Snippet creation and saving via the helper scripts do not require local servers, and many tasks (API demos, repro cases, etc.) can use the public Playground at `https://playground.babylonjs.com` instead.

When local servers are needed, there are two:

- Babylon CDN server on `localhost:1337`
- Playground server on `localhost:1338`

The safest option is to use the VS Code tasks already defined in `.vscode/tasks.json`, because they already use the correct working directory:

- `CDN Serve and watch (Dev)`
- `Playground Serve for core (Dev)`

In multi-root workspaces, background terminals often start in the wrong folder, so VS Code tasks are more reliable than ad hoc background shells.

### Check whether the servers are already running

In PowerShell:

```powershell
Test-NetConnection -ComputerName localhost -Port 1337 -WarningAction SilentlyContinue -ErrorAction SilentlyContinue | Select-Object TcpTestSucceeded
Test-NetConnection -ComputerName localhost -Port 1338 -WarningAction SilentlyContinue -ErrorAction SilentlyContinue | Select-Object TcpTestSucceeded
```

If both ports are already up, skip the server startup steps below. If only `1337` is up, start only the Playground server. If neither is up, continue below.

### Start the CDN server

Preferred approach:

- Start the `.vscode` task `CDN Serve and watch (Dev)`.

Manual fallback from the Babylon.js repo root:

```bash
npm run build:dev
npx build-tools -c dw -wd -wa -sc
npm run serve -w @tools/babylon-server
```

### Wait for the CDN server to be ready

Do not continue until `localhost:1337` accepts connections.

```powershell
Start-Sleep -Seconds 15
Test-NetConnection -ComputerName localhost -Port 1337 -WarningAction SilentlyContinue -ErrorAction SilentlyContinue | Select-Object TcpTestSucceeded
```

Repeat the check until the port is ready.

### Start the Playground server

Preferred approach:

- Start the `.vscode` task `Playground Serve for core (Dev)`.

Manual fallback from the Babylon.js repo root:

```bash
npm run serve -w @tools/playground
```

Start the Playground only after the CDN server is up.

### Wait for the Playground server to be ready

```powershell
Start-Sleep -Seconds 15
Test-NetConnection -ComputerName localhost -Port 1338 -WarningAction SilentlyContinue -ErrorAction SilentlyContinue | Select-Object TcpTestSucceeded
```

The local Playground at `http://localhost:1338` uses the local engine build served from the CDN server, which is why it reflects local Babylon.js code changes immediately.

## Verifying a Snippet in the Browser

Open the saved snippet in the local Playground:

```text
http://localhost:1338/#ABC123#0
```

Note that the Playground editor covers part of the canvas. That is fine for a preview. Visual tests capture the render canvas directly, not the visible editor layout.

## Forcing WebGPU

By default the Playground uses WebGL2. To force WebGPU rendering, append `?webgpu` to the URL:

```text
http://localhost:1338/?webgpu#ABC123#0
https://playground.babylonjs.com/?webgpu#ABC123#0
```

This works on both the local and public Playground, provided the browser supports WebGPU. The Playground also accepts the more explicit `?engine=WebGPU` form:

```text
http://localhost:1338/?engine=WebGPU#ABC123#0
```

## Cleanup

Remove temporary Playground source files when done:

```bash
rm temp_pg_mytest.js
```

Stop any long-running servers you started specifically for the task.
