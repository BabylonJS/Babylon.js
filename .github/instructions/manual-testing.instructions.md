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

For devhost setup, validation workflow, and cleanup, see [devhost-testing.instructions.md](devhost-testing.instructions.md).

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

## CDN-based Editors (NME, GUI Editor, NGE, NRGE, NPE)

All CDN-based editors share the same prerequisite steps. Only the workspace name and port differ.

| Editor | Workspace | Port | URL |
|--------|-----------|------|-----|
| Node Material Editor (NME) | `@tools/node-editor` | 1340 | `http://localhost:1340` |
| GUI Editor | `@tools/gui-editor` | 1341 | `http://localhost:1341` |
| Node Geometry Editor (NGE) | `@tools/node-geometry-editor` | 1343 | `http://localhost:1343` |
| Node Render Graph Editor (NRGE) | `@tools/node-render-graph-editor` | 1344 | `http://localhost:1344` |
| Node Particle Editor (NPE) | `@tools/node-particle-editor` | 1345 | `http://localhost:1345` |

### Steps

1. `npm run build:dev` (skip if already completed in a prior workflow)
2. `npx build-tools -c dw -wd -wa -sc` (skip if already running)
3. `npm run serve -w @tools/babylon-server` (skip if port 1337 is already listening)
4. `npm run serve -w <workspace>` (skip if the editor's port is already listening)

Wait for each command to complete before starting the next. Launch the editor at its URL.

Use [editor-interaction.instructions.md](editor-interaction.instructions.md) for interacting with any of these editors.
