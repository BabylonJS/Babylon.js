# Manual testing workflows

## Reusing running processes

Many workflows share the same prerequisite commands (e.g. `npm run build:dev`, `npx build-tools -c dw -wd -wa -sc`, `npm run serve -w @tools/babylon-server`). **Before starting any command, check whether it is already running** by looking for an existing shell session running that command, or by checking whether the port it listens on is already in use. If the process is already running and healthy, skip that step and move on to the next command.

Key ports to check:
| Port | Service |
|------|---------|
| 1337 | babylon-server (CDN) |
| 1338 | Dev Host / Playground (shared port — depends on which server you started) |
| 1340 | Node Material Editor (NME) |
| 1341 | GUI Editor |
| 1343 | Node Geometry Editor (NGE) |
| 1344 | Node Render Graph Editor (NRGE) |
| 1345 | Node Particle Editor (NPE) |
| 1346 | Smart Filter Editor (SFE) |

You can check whether a port is already in use with:

```powershell
Get-NetTCPConnection -LocalPort <port> -State Listen -ErrorAction SilentlyContinue
```

If a port is occupied, the server for that service is already running — do not start another instance.

For ports that may be reused by multiple local workflows, such as `1338`, verify that the running process is the expected service before reusing it.

Similarly, `npm run build:dev` only needs to run once. If its output artifacts already exist from a prior run (or you have a shell session that already completed this build), skip it.

## Dev Host

Use Dev Host while developing core changes, not just after the work is complete. As you implement the change, keep a small validation scene in `packages/tools/devHost/src/testScene/createScene.ts` and reload it to confirm the current behavior works before moving on.

To test Dev Host, you need to build the dev packages and then start the Dev Host dev server. Here are the commands you need to run in order:

`npm run build:dev` (skip if already completed in a prior workflow)
Wait for the build to complete successfully, then continue.
`npm run serve -w @tools/dev-host` (skip if port 1338 is already listening and the running process is Dev Host)
Wait for "compiled successfully" then continue.

Launch the tool in the browser by navigating to the following URL using playwright-cli:
`http://localhost:1338/?exp=testScene`

For core-engine validation, edit `packages/tools/devHost/src/testScene/createScene.ts` to build a small app that exercises the behavior you changed. Refresh the page as you develop so the app stays part of the implementation loop rather than a final after-the-fact check.

## Smart Filter Editor (SFE)

To test SFE, you need to run multiple commands to build the necessary assets and start the dev server. Here are the commands you need to run in separate terminal windows:

Start these next two in parallel:
`npm run watch:assets`
`npm run watch:assets:smart-filters`
Once they both report "Watching for" then continue.
`npm run watch:source:smart-filters`
Wait for "Watching for file changes." then continue.
`npm run serve -w @tools/smart-filters-editor`
Wait for "compiled successfully" then continue.

Launch the tool in the browser by navigating to the following URL using playwright-cli:
`http://localhost:1346`

Use the `.github\instructions\editor-interaction.instructions.md` instructions for interacting with SFE.

## Node Material Editor (NME)

To test NME, you need to build the dev packages, start the CDN server, and then start the Node Editor dev server. Here are the commands you need to run in order:

`npm run build:dev` (skip if already completed in a prior workflow)
Wait for the build to complete successfully, then continue.
`npx build-tools -c dw -wd -wa -sc` (skip if already running)
Wait for "watching for asset changes..." then continue.
`npm run serve -w @tools/babylon-server` (skip if port 1337 is already listening)
Wait for "compiled successfully" then continue.
`npm run serve -w @tools/node-editor` (skip if port 1340 is already listening)
Wait for "compiled successfully" then continue.

Launch the tool in the browser by navigating to the following URL using playwright-cli:
`http://localhost:1340`

Use the `.github\instructions\editor-interaction.instructions.md` instructions for interacting with NME.

## GUI Editor

To test the GUI Editor, you need to build the dev packages, start the CDN server, and then start the GUI Editor dev server. Here are the commands you need to run in order:

`npm run build:dev` (skip if already completed in a prior workflow)
Wait for the build to complete successfully, then continue.
`npx build-tools -c dw -wd -wa -sc` (skip if already running)
Wait for "watching for asset changes..." then continue.
`npm run serve -w @tools/babylon-server` (skip if port 1337 is already listening)
Wait for "compiled successfully" then continue.
`npm run serve -w @tools/gui-editor` (skip if port 1341 is already listening)
Wait for "compiled successfully" then continue.

Launch the tool in the browser by navigating to the following URL using playwright-cli:
`http://localhost:1341`

Use the `.github\instructions\editor-interaction.instructions.md` instructions for interacting with the GUI Editor.

## Node Geometry Editor (NGE)

To test NGE, you need to build the dev packages, start the CDN server, and then start the Node Geometry Editor dev server. Here are the commands you need to run in order:

`npm run build:dev` (skip if already completed in a prior workflow)
Wait for the build to complete successfully, then continue.
`npx build-tools -c dw -wd -wa -sc` (skip if already running)
Wait for "watching for asset changes..." then continue.
`npm run serve -w @tools/babylon-server` (skip if port 1337 is already listening)
Wait for "compiled successfully" then continue.
`npm run serve -w @tools/node-geometry-editor` (skip if port 1343 is already listening)
Wait for "compiled successfully" then continue.

Launch the tool in the browser by navigating to the following URL using playwright-cli:
`http://localhost:1343`

Use the `.github\instructions\editor-interaction.instructions.md` instructions for interacting with NGE.

## Node Render Graph Editor (NRGE)

To test NRGE, you need to build the dev packages, start the CDN server, and then start the Node Render Graph Editor dev server. Here are the commands you need to run in order:

`npm run build:dev` (skip if already completed in a prior workflow)
Wait for the build to complete successfully, then continue.
`npx build-tools -c dw -wd -wa -sc` (skip if already running)
Wait for "watching for asset changes..." then continue.
`npm run serve -w @tools/babylon-server` (skip if port 1337 is already listening)
Wait for "compiled successfully" then continue.
`npm run serve -w @tools/node-render-graph-editor` (skip if port 1344 is already listening)
Wait for "compiled successfully" then continue.

Launch the tool in the browser by navigating to the following URL using playwright-cli:
`http://localhost:1344`

Use the `.github\instructions\editor-interaction.instructions.md` instructions for interacting with NRGE.

## Node Particle Editor (NPE)

To test NPE, you need to build the dev packages, start the CDN server, and then start the Node Particle Editor dev server. Here are the commands you need to run in order:

`npm run build:dev` (skip if already completed in a prior workflow)
Wait for the build to complete successfully, then continue.
`npx build-tools -c dw -wd -wa -sc` (skip if already running)
Wait for "watching for asset changes..." then continue.
`npm run serve -w @tools/babylon-server` (skip if port 1337 is already listening)
Wait for "compiled successfully" then continue.
`npm run serve -w @tools/node-particle-editor` (skip if port 1345 is already listening)
Wait for "compiled successfully" then continue.

Launch the tool in the browser by navigating to the following URL using playwright-cli:
`http://localhost:1345`

Use the `.github\instructions\editor-interaction.instructions.md` instructions for interacting with NPE.
