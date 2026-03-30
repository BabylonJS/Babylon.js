# Inspector CLI Plan

## Problem

There is currently no way to interact with a running Babylon.js scene from the terminal. The Inspector UI is browser-only. A CLI tool would enable terminal-based workflows: listing active scenes, querying available commands, and invoking them — all from the command line. **The primary consumer of this CLI is intended to be AI agents**, so the CLI should be designed with machine-friendly output and straightforward invocation patterns well suited for that scenario.

## Proposed Approach

Introduce a two-part architecture:

1. **CLI** (`src/cli/cli.ts` → bundled to `bin/inspector-cli.mjs`) — A short-lived Node.js script shipped in the `@babylonjs/inspector` published package's `bin` field so it can be invoked via `npx @babylonjs/inspector` or as an npm-installed binary. Each invocation connects to the bridge over WebSocket and exits.

2. **Bridge** (`src/cli/bridge.ts` → bundled to `bin/inspector-bridge.mjs`) — A long-lived Node.js process started on-demand by the CLI if not already running. It hosts **two WebSocket servers**: one for browser sessions (the "browser port") and one for CLI connections (the "CLI port"). The bridge acts as a relay between the CLI and the browser. The bridge assigns each browser session a unique numeric id (incrementing from 1).

3. **Browser-side `StartInspectable`** — A new public API analogous to `ShowInspector`. It creates a `ServiceContainer`, registers a primary "InspectableService" that opens a WebSocket to the bridge, and exposes a contract for registering CLI-invocable commands.

```
┌────────┐      WebSocket        ┌────────────┐      WebSocket       ┌─────────────┐
│  CLI   │ ───────────────────►  │   Bridge   │ ◄──────────────────► │   Browser   │
│ (node) │  (CLI port, e.g.      │  (node ws) │  (browser port, e.g. │  (scene)    │
│        │   4401)               │            │   4400)              │             │
└────────┘                       └────────────┘                      └─────────────┘
```

All source is **TypeScript**, compiled to `.mjs` files. The CLI and bridge are bundled (with `ws` inlined) via separate rollup configs so they are self-contained and easy to run.

---

## Configuration: `.babyloninspector`

A JSON file that can live anywhere in the directory parent chain (searched upward from `cwd`). If not found, defaults apply.

```jsonc
{
  "browserPort": 4400,    // WebSocket port for browser sessions
  "cliPort": 4401         // WebSocket port for CLI connections
}
```

Resolution order: walk from `process.cwd()` up to filesystem root, first `.babyloninspector` file wins.

---

## Todos

### 1. Config loader (`src/cli/config.ts`)

Create a utility that:
- Walks the directory parent chain from `cwd` looking for `.babyloninspector`.
- Parses it as JSON.
- Merges with defaults (`{ browserPort: 4400, cliPort: 4401 }`).
- Exported as a pure function usable by both CLI and bridge.

### 2. Bridge process (`src/cli/bridge.ts`)

A Node.js entry point that:
- Reads config via the config loader.
- Starts two `ws` WebSocket servers: one on `browserPort` (for browser sessions) and one on `cliPort` (for CLI connections).
- Tracks connected browser sessions. Each browser session sends a registration message with a `name` (defaults to `document.title` on the browser side). The bridge assigns each session a unique numeric `id` (incrementing from 1, never reused within a bridge lifetime).
- Responds to CLI WebSocket messages:
  - `{ type: "sessions" }` → returns list of active sessions.
  - `{ type: "commands", sessionId }` → forwards a "list commands" request to the browser session, awaits the response, returns it to CLI.
  - `{ type: "exec", sessionId, commandId, args }` → forwards a command invocation to the browser session, awaits the response, returns it.
  - `{ type: "stop" }` → shuts down the bridge gracefully.
- Graceful shutdown on `SIGTERM`/`SIGINT` or when receiving a stop command.
- **No lock file needed** — the CLI determines if the bridge is running by attempting to connect to the CLI port. If the connection fails, the bridge is not running.

### 3. CLI entry point (`src/cli/cli.ts`)

A Node.js script with `#!/usr/bin/env node` shebang in the source. It:
- Parses `process.argv` using `node:util` `parseArgs`.
- Reads config via the config loader.
- **`--help`**: Prints usage including fixed options and the pattern `--<command id> --help`.
- **`--sessions`**: Connects to the bridge's CLI port, sends a sessions request, prints active sessions (id, name, connected since, etc.).
- **`--stop`**: Sends a stop command to the bridge, which shuts it down cleanly.
- **`--commands <session id>`**: Sends a commands request for the session, prints available commands with their ids, and indicates `--<command id> --help` for more info.
- **`--<command id> [args...]`**: Forwards to the bridge → browser session, prints result.
- If the bridge is not running (connection attempt fails), spawns it as a detached child process (`child_process.spawn` with `detached: true`, `stdio: 'ignore'`, `unref()`), retries connection until ready, then proceeds.

### 4. Package.json `bin` field

Add to `packages/public/@babylonjs/inspector/package.json` only (the dev package does not need a `bin` entry since `npm exec` resolves through the monorepo):
```json
"bin": {
  "babylon-inspector": "./bin/inspector-cli.mjs"
}
```

### 5. Browser-side: `StartInspectable` function (`src/inspectable.ts`)

Public API:
```ts
export function StartInspectable(scene: Scene, options?: Partial<InspectableOptions>): InspectableToken
```

Behavior:
- If there is already an `InspectableToken` for this scene, return the existing one (or dispose and recreate — TBD, likely just return existing).
- Create a `ServiceContainer` (like `MakeModularTool` does, but headless — no React rendering).
- Register the **InspectableBridgeService** as the primary service.
- Return an `InspectableToken` (which is `IDisposable`).
- Track tokens in a `Map<Scene, InspectableToken>` (or `WeakMap`).

`InspectableToken`:
```ts
export type InspectableToken = IDisposable & {
  readonly isDisposed: boolean;
};
```

`InspectableOptions`:
```ts
export type InspectableOptions = {
  /** WebSocket port for the bridge's browser port. Defaults to 4400. */
  port?: number;
  /** Session display name. Defaults to document.title. */
  name?: string;
};
```

### 6. Browser-side: InspectableBridgeService (`src/services/inspectableBridgeService.ts`)

A service definition that:
- Opens a WebSocket connection to the bridge on the configured browser port.
- Sends a registration message (`{ type: "register", name }`).
- Listens for incoming messages from the bridge (command list requests, command invocations).
- Produces an `IInspectableCommandRegistry` contract:
  ```ts
  export interface IInspectableCommandRegistry {
    addCommand(descriptor: InspectableCommandDescriptor): IDisposable;
  }

  export type InspectableCommandDescriptor = {
    id: string;
    description: string;
    args?: InspectableCommandArg[];
    execute: (args: Record<string, string>) => Promise<string>;
  };

  export type InspectableCommandArg = {
    name: string;
    description: string;
    required?: boolean;
  };
  ```
- When the bridge asks for the command list, the service responds with all registered command descriptors (id, description, args).
- When the bridge asks to execute a command, the service finds the registered command and calls `execute`, then sends the result back.
- On dispose, closes the WebSocket.

### 7. Wire up exports (`src/index.ts`)

Export `StartInspectable`, `InspectableToken`, `InspectableOptions`, `IInspectableCommandRegistry`, and `InspectableCommandDescriptor` from the package index.

### 8. Build integration

- The CLI source files (`src/cli/*.ts`) are TypeScript, compiled and bundled into self-contained `.mjs` files via a **separate `rollup.config.cli.mjs`** with two entry points (one for the CLI, one for the bridge) that lives in the published package directory (`packages/public/@babylonjs/inspector/`).
- The `ws` package is **bundled into** the CLI and bridge `.mjs` files (not an external dependency), making them self-contained and easy to run.
- The CLI entry point (`src/cli/cli.ts`) has `#!/usr/bin/env node` directly in the source — no custom post-build step needed.
- The browser-side files (`src/inspectable.ts`, `src/services/inspectableBridgeService.ts`) use the native browser `WebSocket` API and are compiled normally with the rest of the inspector package via `tsc`.
- Output for CLI/bridge bundles goes to `bin/` in the published package directory.

### 9. Tests

- **Unit tests** for config loader (finding `.babyloninspector`, merging defaults).
- **Unit tests** for CLI arg parsing.
- **Unit tests** for InspectableCommandRegistry (registering commands, listing, disposing).
- **Integration test** for the bridge ↔ browser WebSocket protocol (can use `ws` on both sides in Node.js for testing).

---

## Protocol Sketch

### Browser ↔ Bridge (WebSocket on browser port)

```jsonc
// Browser → Bridge: Registration (bridge internally assigns a numeric id)
{ "type": "register", "name": "My Game" }

// Bridge → Browser: Request command list
{ "type": "listCommands", "requestId": "req-1" }

// Browser → Bridge: Command list response
{ "type": "commandListResponse", "requestId": "req-1", "commands": [
  { "id": "screenshot", "description": "Capture a screenshot", "args": [...] }
]}

// Bridge → Browser: Execute command
{ "type": "execCommand", "requestId": "req-2", "commandId": "screenshot", "args": {} }

// Browser → Bridge: Command execution response
{ "type": "commandResponse", "requestId": "req-2", "result": "Screenshot saved to ..." }
```

### CLI ↔ Bridge (WebSocket on CLI port)

```jsonc
// CLI → Bridge: List sessions
{ "type": "sessions" }

// Bridge → CLI: Sessions response
{ "type": "sessionsResponse", "sessions": [
  { "id": 1, "name": "My Game", "connectedAt": "2026-03-25T..." }
]}

// CLI → Bridge: List commands for session
{ "type": "commands", "sessionId": 1 }

// Bridge → CLI: Commands response (forwarded from browser)
{ "type": "commandsResponse", "commands": [
  { "id": "screenshot", "description": "Capture a screenshot", "args": [...] }
]}

// CLI → Bridge: Execute command
{ "type": "exec", "sessionId": 1, "commandId": "screenshot", "args": {} }

// Bridge → CLI: Execution response (forwarded from browser)
{ "type": "execResponse", "result": "Screenshot saved to ..." }

// CLI → Bridge: Stop bridge
{ "type": "stop" }
```

---

## Open Questions

1. **Authentication/security**: For the initial version, the bridge only listens on localhost. Future work could add token-based auth for remote scenarios.
