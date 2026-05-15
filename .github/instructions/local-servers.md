# Local Development Servers

## Port Table

| Port | Service                             | Workspace                               |
| ---- | ----------------------------------- | --------------------------------------- |
| 1337 | babylon-server (CDN)                | `@tools/babylon-server`                 |
| 1338 | Dev Host / Playground (shared port) | `@tools/dev-host` / `@tools/playground` |
| 1340 | Node Material Editor (NME)          | `@tools/node-editor`                    |
| 1341 | GUI Editor                          | `@tools/gui-editor`                     |
| 1343 | Node Geometry Editor (NGE)          | `@tools/node-geometry-editor`           |
| 1344 | Node Render Graph Editor (NRGE)     | `@tools/node-render-graph-editor`       |
| 1345 | Node Particle Editor (NPE)          | `@tools/node-particle-editor`           |
| 1346 | Smart Filter Editor (SFE)           | `@tools/smart-filters-editor`           |
| 1347 | Flow Graph Editor (FGE)             | `@tools/flow-graph-editor`              |

## Checking Ports

```powershell
Get-NetTCPConnection -LocalPort <port> -State Listen -ErrorAction SilentlyContinue
```

If a port is occupied, the server is already running — do not start another instance. For port `1338` (shared by Dev Host and Playground), verify the running process is the expected service before reusing it.

## Starting Servers

**Before starting any server**, check whether it (or its prerequisite `npm run build:dev`) is already running. Skip steps that are already done.

### CDN Server (1337)

Preferred: VS Code task `CDN Serve and watch (Dev)`.

CLI fallback from repo root:

```bash
npm run build:dev
npx build-tools -c dw -wd -wa -sc
npm run serve -w @tools/babylon-server
```

### Playground Server (1338)

Preferred: VS Code task `Playground Serve for core (Dev)`.

CLI fallback: `npm run serve -w @tools/playground`

### Editor Servers

All CDN-based editors require the CDN server (1337) first. Then: `npm run serve -w <workspace>` (see port table for workspace names).

In multi-root workspaces, VS Code tasks are more reliable than ad hoc terminal commands because they use the correct working directory.
