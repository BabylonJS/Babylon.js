# NME ↔ MCP Live Session Bridge — Agent Prompt

## Context

You are working in the Babylon.js monorepo at `packages/tools/`. There are two targets:

1. **`packages/tools/nme-mcp-server/`** — the Node Material Editor MCP server (runs locally via stdio)
2. **`packages/tools/nodeEditor/`** — the Node Material Editor UI (React/TypeScript, eventually hosted at `nme.babylonjs.com`)

The goal is to implement a **bidirectional live session** between the two: the MCP server broadcasts changes to the editor, and the editor can push user changes back to the MCP server.

Read the following files **before writing any code** to understand existing patterns:

- `packages/tools/nme-mcp-server/src/index.ts`
- `packages/tools/nme-mcp-server/src/materialGraph.ts`
- `packages/tools/scene-mcp-server/src/previewServer.ts` — the SSE/HTTP server pattern to replicate
- `packages/tools/nodeEditor/src/globalState.ts`
- `packages/tools/nodeEditor/src/graphEditor.tsx`
- `packages/tools/nodeEditor/src/components/propertyTab/propertyTabComponent.tsx`

---

## Part 1 — MCP Server: Session Server (`nme-mcp-server`)

Create a new file `packages/tools/nme-mcp-server/src/sessionServer.ts`. Model it closely on `packages/tools/scene-mcp-server/src/previewServer.ts` (zero new npm dependencies — use only Node built-ins: `http`, `crypto`).

**The session server is a local HTTP server** with the following routes. It maintains a `Map<sessionId, materialName>` so one server instance can serve multiple simultaneous sessions (one per material).

Routes:

- `GET /session/:id/events` — **SSE stream**. The editor subscribes here. Whenever the MCP updates the material for this session, it sends a `data:` event with the full material JSON. Send a keepalive comment (`: ping\n\n`) every 15 seconds.
- `GET /session/:id/material` — Returns the current material JSON (for initial load on connect). Responds with `Content-Type: application/json`.
- `POST /session/:id/material` — The editor posts updated JSON here after the user makes changes. The server parses the JSON, calls `manager.importJSON(materialName, json)` to replace the in-memory graph, then broadcasts the update to all other SSE subscribers on the same session. Responds `200 OK` or an error.
- `GET /` — A plain-text status page listing active sessions.

Add CORS headers on every response (`Access-Control-Allow-Origin: *`). Handle `OPTIONS` preflight.

**Singleton lifecycle** (same pattern as `previewServer.ts`):

- `startSessionServer(manager: MaterialGraphManager, port?: number): Promise<number>` — starts the server if not running, returns the port
- `stopSessionServer(): Promise<void>`
- `isSessionServerRunning(): boolean`
- `createSession(materialName: string): string` — generates a random 8-char alphanumeric session ID, stores the mapping, returns the ID
- `notifyMaterialUpdate(sessionId: string)` — pushes the latest JSON to all SSE subscribers for that session (called internally whenever an MCP tool modifies a material that has an active session)
- `getSessionUrl(sessionId: string, port: number): string` — returns `http://localhost:{port}/session/{id}`

The `MaterialGraphManager` reference must be passed in and stored (as a module-level variable, same as `previewServer.ts` stores `_manager`).

---

## Part 2 — MCP Server: Hook into existing tools (`index.ts`)

In `packages/tools/nme-mcp-server/src/index.ts`:

1. Import `startSessionServer`, `createSession`, `notifyMaterialUpdate`, `getSessionUrl`, `isSessionServerRunning` from `./sessionServer.js`.

2. **Modify `create_material` tool**: after successfully creating a material, automatically:

    - Call `startSessionServer(manager)` if not already running (use port 3001 by default)
    - Call `createSession(materialName)` to get a session ID
    - Append to the returned text: `\n\nMCP Session URL: http://localhost:3001/session/{sessionId}\nPaste this URL in the Node Material Editor's "Connect to MCP Session" panel to see live updates.`

3. **Add a `get_session_url` tool** that, given a `materialName`, finds its active session and returns the session URL. If no session exists for that material, creates one (starting the server if needed).

4. **After every tool that modifies a material** (i.e. `add_block`, `remove_block`, `connect_blocks`, `disconnect_input`, `set_block_properties`, `add_blocks_batch`, `connect_blocks_batch`), call `notifyMaterialUpdate(sessionId)` for any active session associated with that material. To do this efficiently, keep a reverse `Map<materialName, sessionId>` in `sessionServer.ts` and expose a `getSessionForMaterial(materialName): string | undefined` helper.

---

## Part 3 — Editor UI: "Connect to MCP Session" panel (`nodeEditor`)

In `packages/tools/nodeEditor/src/globalState.ts`, add:

```ts
mcpSessionUrl: string | null = null;
mcpSessionConnected: boolean = false;
onMcpSessionStateChangedObservable: Observable<boolean>;  // fires on connect/disconnect
```

Create a new file `packages/tools/nodeEditor/src/components/mcpSession/mcpSessionComponent.tsx`:

This is a small React component (functional, with hooks) that renders:

- A text input for the session URL (placeholder: `http://localhost:3001/session/ABC123`)
- A **Connect** button (when disconnected) / **Disconnect** button (when connected)
- A status badge: green "Connected" / grey "Disconnected"
- A **Push to MCP** button (when connected): immediately POSTs the current serialized material JSON to `{sessionUrl}/material` using `fetch`
- A small note in italic: _"Do not edit the material in the editor while the AI agent is working — changes may conflict."_

**Connect behavior** (triggered by clicking Connect):

1. Store the URL in `globalState.mcpSessionUrl`
2. Make a `GET {sessionUrl}/material` request; if successful, call `NodeMaterial.Parse(json, scene)` to load the material and `globalState.onNewNodeCreatedObservable` etc. to refresh the editor (look at how `import_from_snippet` works in the existing property tab for the right sequence of calls to re-initialize the editor with a new `NodeMaterial` instance)
3. Open an `EventSource` SSE connection to `{sessionUrl}/events`
4. On each SSE `message` event: parse the JSON, reload the material the same way as step 2
5. On SSE `error`: update status to disconnected
6. Set `globalState.mcpSessionConnected = true` and notify `onMcpSessionStateChangedObservable`

**Disconnect behavior**: close the `EventSource`, set `mcpSessionConnected = false`.

**Push to MCP behavior**: serialize current material via `SerializationTools.Serialize(globalState.nodeMaterial, globalState)`, POST JSON string to `{sessionUrl}/material`.

Store the `EventSource` instance in a `useRef` so it can be closed on disconnect/unmount.

---

## Part 4 — Wire the component into the editor UI

In `packages/tools/nodeEditor/src/graphEditor.tsx`, add the `<McpSessionComponent>` to the left or bottom of the property panel (look at how other sidebar components are mounted). It should always be visible regardless of what is selected in the graph.

---

## Part 5 — Warning Documentation

In `packages/tools/nme-mcp-server/src/sessionServer.ts`, add a JSDoc comment at the top of the file:

```
 * **No lock mechanism**: The MCP server and the user can both modify the material,
 * but NOT simultaneously. If the user edits the material in the editor while the AI
 * agent is calling MCP tools, their changes will be overwritten by the next agent
 * push. Users should finish their own edits before asking the agent to continue,
 * and vice versa.
```

---

## Implementation Notes

- The session server uses **port 3001** by default. If the port is in use, try 3002, 3003, up to 3010 (same auto-increment pattern as `previewServer.ts` if it does that, otherwise just fail with a clear error message).
- The `EventSource` in the browser connects to the MCP server running **locally** — this only works when the user is running the MCP server on their own machine, which is always the case for MCP.
- SSE requires no extra npm packages (browser-native `EventSource` on client, standard HTTP chunked response on server).
- When reloading the material in the editor from incoming JSON, reuse whatever code path the existing "Load" / `import_from_snippet` feature uses to swap in a new `NodeMaterial` — do not invent a new code path.
- Run `npm run lint` after implementation and fix any lint errors.
- The `MaterialGraphManager` type is the default export / main class in `materialGraph.ts` — check the exact type name before referencing it.

---

## What NOT to do

- Do not add any npm dependencies beyond what's already in `nme-mcp-server/package.json`.
- Do not modify `materialGraph.ts` for this feature — all integration is in `index.ts` and the new `sessionServer.ts`.
- Do not add a lock mechanism — that is explicitly deferred.
- Do not implement this for any other MCP server (NGE, NPE, GUI, etc.) — NME only.
