# WebMCP Migration Plan

Status: NGE reference implementation implemented and validated with a simulated browser API; native experimental-feature validation pending

## Summary

Babylon.js browser editors currently integrate with local MCP servers through an HTTP/SSE editor session created by the server. This allows a standard MCP client to manipulate a server-owned document and synchronize that document with an open editor, but the session URL must be transferred to the editor manually.

WebMCP exposes tools directly from a web page through `document.modelContext`. It is a better fit for an agent already integrated with the browser because it can operate on the editor's live document without starting a separate local session. It is not a replacement transport for external MCP clients: a standard stdio or Streamable HTTP MCP client cannot consume page tools without browser integration or a bridge.

The proposed architecture therefore keeps both integrations:

- WebMCP is the preferred integration for browser-integrated agents.
- Existing MCP servers and HTTP/SSE editor sessions remain supported for standard external MCP clients.
- Shared editor and domain infrastructure prevents each Babylon.js tool from independently implementing the same detection, lifecycle, fallback, and operation logic.
- Node Geometry Editor (NGE) is the reference implementation before other editors migrate.

This document records the implemented NGE reference architecture and the intended rollout to other editors. It does not commit the project to the current experimental WebMCP API shape, and it does not set a date for removing the existing MCP servers.

## Goals

1. Expose useful editor operations directly through WebMCP when the browser supports it.
2. Preserve backward compatibility for every existing MCP server and client configuration.
3. Reuse transport-neutral domain operations between standard MCP and WebMCP.
4. Implement WebMCP lifecycle, status, error handling, and writer arbitration once for all browser editors.
5. Migrate editors incrementally, using NGE to validate the architecture.
6. Avoid Node.js dependencies and server transport code in browser bundles.
7. Keep browser tool inputs validated and browser tool capabilities narrowly scoped.

## Non-goals

- Transparently converting WebMCP into a standard MCP transport.
- Making a stdio MCP client discover page tools without a browser bridge.
- Removing the existing MCP servers or editor session protocol during this migration.
- Migrating every editor and every tool in one pull request.
- Exposing local filesystem operations through browser tools.
- Treating WebMCP API availability as proof that an agent is attached to the page.

## Decisions

### Use two adapters rather than a transport proxy

The project should share tool contracts and operations, but retain separate adapters:

```text
                         Shared domain operations
                                  |
                    +-------------+-------------+
                    |                           |
          Standard MCP adapter            WebMCP adapter
          stdio MCP server                document.modelContext
                    |                           |
       server-owned document state        live editor document
                    |
       optional HTTP/SSE editor session
```

A standard MCP server should not attempt to control Chrome through the DevTools protocol and proxy calls into WebMCP. Such a proxy would couple the server to a particular browser, require browser process discovery and attachment permissions, and recreate transport and lifecycle concerns outside the WebMCP standard.

### Keep the legacy session available when WebMCP is supported

WebMCP tool registration indicates browser support, not active client attachment. There is no reliable fallback signal such as "no WebMCP client connected." NGE and subsequent editors should therefore:

1. Register WebMCP tools whenever `document.modelContext` is supported.
2. Keep legacy session controls available.
3. Allow a standard MCP session to connect even while WebMCP tools are registered.
4. Avoid an arbitrary timeout that attempts to guess whether WebMCP is in use.

### A connected legacy session owns MCP mutations

The selected conflict policy is:

- When no legacy editor session is connected, WebMCP read and mutation tools may execute.
- When a legacy editor session is connected, it becomes the exclusive MCP writer.
- WebMCP read-only tools remain usable.
- WebMCP mutation tools fail with a clear message explaining that the legacy session must be disconnected or used for the mutation.
- Disconnecting the legacy session immediately restores WebMCP mutation access.

This arbitration applies to MCP callers. Human editing and legacy document synchronization retain the existing editor session conflict behavior unless a later project explicitly changes it.

### Migrate tool parity incrementally

The first production-quality implementation should establish lifecycle and a useful set of core read/edit tools. Import, export, snippet, and specialized operations can follow after the common path is proven. Server lifecycle and local filesystem tools remain standard-MCP-only.

## Scope

The reusable editor infrastructure is intended for Babylon.js browser tools with corresponding MCP servers and live editor state:

- Node Geometry Editor
- Node Material Editor
- Node Render Graph Editor
- Node Particle Editor
- Smart Filters Editor
- GUI Editor
- Flow Graph editor and related tooling

The Scene MCP server and other headless workflows should be evaluated separately. They may reuse transport-neutral helpers, but they are not automatically WebMCP candidates because they do not necessarily have one authoritative browser editor document.

## Proposed Package Boundaries

The plan is stored in `@tools/mcp-server-core` because that is the current shared MCP package. This does not imply that browser runtime code should be added to its existing Node-oriented entry point.

### Shared editor MCP runtime

Create a browser-safe package or isolated browser-safe entry point, tentatively named `@tools/mcp-editor-core`. It should contain only code that can safely execute in both browser and non-browser TypeScript environments:

- WebMCP capability types and feature detection
- tool registration and abort-based disposal
- common tool metadata types
- read-only versus mutation classification
- writer arbitration
- standardized execution errors
- status state machine
- optional helpers for projecting editor operations into WebMCP tools

It must not import:

- Node.js built-ins
- stdio or HTTP server transports
- the MCP server SDK's server runtime
- filesystem helpers
- editor-specific graph implementations

If a separate package is considered excessive, an explicitly browser-safe subpath can be evaluated. The browser bundle must prove that Node-oriented exports and dependencies are not included before choosing that approach.

### Per-editor shared domain packages

Each editor should have a browser-safe domain package or module shared by its standard MCP server and WebMCP adapter. For NGE, the tentative package is `@tools/nge-mcp-common`.

The NGE common layer should own:

- serialized Node Geometry types
- block registry and block metadata
- graph validation
- pure graph mutations
- transport-neutral operation inputs and results
- the reusable parts of `GeometryGraphManager`

It should not own:

- stdio server creation
- HTTP/SSE session lifecycle
- local file reads or writes
- snippet network operations unless they are explicitly designed as cross-runtime services
- React state or NGE UI refresh behavior

Equivalent domain boundaries can be introduced for other editors as they migrate. They do not need to have identical graph-manager interfaces.

### Transport adapters

The existing `*-mcp-server` packages remain the standard MCP adapters. They keep their current public tool names and input shapes and translate those calls into the shared domain operations.

Each browser editor receives a WebMCP adapter that:

- targets the currently open document rather than a server-side named document
- validates page tool inputs
- invokes shared domain operations
- applies successful mutations back to the editor
- performs the editor-specific refresh sequence
- enforces writer arbitration

## Shared Contracts and Schemas

The common layer should share:

- TypeScript input and output contracts
- tool identifiers where the two surfaces are semantically identical
- titles and descriptions where appropriate
- read-only and mutation classification
- transport-neutral operation functions
- structured success and error results

The standard MCP SDK currently uses Zod-oriented registration while WebMCP consumes JSON Schema. The implementation should not add a large validation dependency to every browser bundle solely to force one schema representation.

Transport-specific schema projections may remain in their adapters when necessary. Tests must then verify that required fields, optional fields, and accepted values remain semantically aligned with the shared TypeScript contract. If Zod-to-JSON-Schema conversion produces an acceptable browser bundle, schemas can be consolidated later.

## Editor Runtime Model

### Status

The shared runtime should distinguish these states:

- `unsupported`: `document.modelContext` is unavailable.
- `registering`: tool registration is in progress.
- `registered`: page tools are registered; this does not claim that an agent is attached.
- `error`: one or more tools failed to register.

UI labels should use "Supported" or "Registered," not "Connected," for WebMCP. The API does not establish an MCP transport connection in the same sense as the legacy session.

### Writer state

The editor should maintain a small transport-neutral state:

```text
legacy session disconnected
    WebMCP reads: allowed
    WebMCP mutations: allowed

legacy session connected
    WebMCP reads: allowed
    WebMCP mutations: rejected
    legacy mutations: allowed
```

The state should be observable so the session panel and WebMCP execution wrapper use the same source of truth. Connect, connection failure, remote session closure, explicit disconnect, editor replacement, and editor disposal must all update it consistently.

### Registration lifecycle

WebMCP registration belongs to the root editor lifecycle, not a collapsible property panel:

1. Create the editor's WebMCP controller after its document and global state are initialized.
2. Register all page tools with one or more `AbortController` signals.
3. Store the controller with the editor state.
4. Abort registrations when the popup closes, the embedded editor unmounts, or another editor instance replaces it.
5. Surface registration errors through the editor's existing logging mechanism.

If read-only and mutation tools need different registration lifetimes in a future browser implementation, use separate abort controllers. The initial implementation can keep mutation tools registered and reject their execution while a legacy writer is active, which preserves stable tool discovery.

## NGE Reference Implementation

The NGE reference implementation exposes the complete browser-appropriate current-document surface while preserving the standard MCP server. Its shared runtime, domain package, writer arbitration, and tool adapter are the template for later editor migrations. Live browser validation with the experimental WebMCP feature remains required before migrating another editor.

### Phase 1: Root lifecycle and arbitration

1. Move registration out of `McpSessionComponent` and into the `NodeGeometryEditor` lifecycle.
2. Add deterministic registration disposal through the editor close/unmount path.
3. Add MCP writer state to `GlobalState`.
4. Make legacy connect/disconnect and connection-error paths claim or release writer ownership.
5. Wrap every WebMCP mutation with the shared writer check.
6. Keep WebMCP reads available during a legacy session.
7. Update the MCP panel to display WebMCP registration status and active writer status.

Expected behavior:

- The property panel does not need to be opened for tools to exist.
- Browser support without an attached agent does not block a later legacy connection.
- A legacy session cannot race with WebMCP mutations.

### Phase 2: Extract NGE domain operations

1. Add characterization tests around the current `GeometryGraphManager` and `BlockRegistry`.
2. Move browser-safe serialized types, registry data, validation, and graph mutation logic into the NGE common layer.
3. Remove imports from that layer that transitively expose HTTP, filesystem, or other Node APIs.
4. Keep compatibility imports or update the standard server without changing its external behavior.
5. Confirm that exported NGE JSON remains byte-equivalent where ordering is contractually relevant and structurally equivalent otherwise.
6. Confirm that all current standard MCP tool responses and session notifications remain unchanged.

### Phase 3: Add core WebMCP editing tools

The first parity wave should expose:

- `get_current_node_geometry`
- `replace_current_node_geometry`
- `describe_current_node_geometry`
- `rebuild_current_node_geometry`
- `list_block_types`
- `get_block_type_info`
- `add_block`
- `add_blocks_batch`
- `remove_block`
- `set_block_properties`
- `connect_blocks`
- `connect_blocks_batch`
- `disconnect_input`
- `validate_current_node_geometry`

WebMCP tools target the currently open document, so they should not require the standard server's `geometryName` parameter.

Each browser mutation should be transactional from the editor's perspective:

1. Serialize the latest live NGE document.
2. Import the snapshot into the shared NGE graph core.
3. Execute the requested operation.
4. Stop and return a structured error if the operation cannot be applied.
5. Export the resulting serialized document.
6. Apply it to the editor.
7. Refresh the graph, selection, preview, undo history, and framing exactly once.
8. Return a small structured result rather than the entire document unless the caller requested the document.

Rehydrating from the live editor before every mutation avoids stale shared-manager state when the user edits the graph manually between calls.

### Phase 4: Expand appropriate parity

Evaluate these for a later WebMCP wave:

- import inline JSON
- export inline JSON
- import from snippet
- save snippet
- snippet URL generation
- additional graph descriptions and catalogs

Keep these standard-MCP-only:

- `get_session_url`
- `start_session`
- `close_session`
- `stop_session_server`
- process-owned multi-geometry management when it has no current-document equivalent
- `jsonFile` inputs
- `outputFile` outputs
- other arbitrary local filesystem access

Browser equivalents should be named and documented around the current editor document rather than imitating server process lifecycle.

## Migration Process for Other Editors

After NGE proves the common runtime, migrate each editor independently:

1. Inventory its standard MCP tools.
2. Classify each tool as:
    - shared domain operation
    - WebMCP current-document operation
    - standard-MCP-only server/session operation
    - unsupported or unsafe in a browser
3. Identify the editor's authoritative live state and serialization boundary.
4. Extract only genuinely reusable, browser-safe domain operations.
5. Implement the editor's snapshot, apply, refresh, and rebuild adapter.
6. Register WebMCP tools through the shared editor runtime.
7. Connect the editor's existing legacy session state to shared writer arbitration.
8. Add transport parity and conflict tests.
9. Document tool availability and browser requirements.
10. Ship the migration without changing the existing standard MCP contract.

Do not require all editors to use one universal graph abstraction. The shared runtime should standardize transport concerns, while domain packages preserve editor-specific models.

## Compatibility Requirements

The migration must not change, without a separate compatibility decision:

- existing standard MCP server package names
- stdio startup commands
- legacy MCP tool names
- legacy MCP input parameters
- tool response formats relied on by clients
- session URL format
- HTTP/SSE session behavior
- serialized editor document formats

New WebMCP tools may use current-document-oriented names and omit server-only identifiers such as `geometryName`.

## Input Validation and Security

1. Treat all WebMCP input as untrusted.
2. Validate every input before touching editor state.
3. Reject unknown fields where practical.
4. Apply read-only and other WebMCP annotations accurately.
5. Never expose arbitrary local filesystem reads or writes from the browser adapter.
6. Do not include credentials, access tokens, or privileged browser state in tool results.
7. Respect WebMCP origin isolation and Permissions Policy requirements.
8. Return explicit errors rather than silently ignoring unsupported operations.
9. Ensure a failed mutation does not partially refresh or corrupt the live editor.
10. Keep result payloads bounded so full serialized documents are returned only by explicit document tools.

## Testing Strategy

### Shared runtime tests

- capability detection
- registration success and failure
- abort-based unregistration
- read-only versus mutation classification
- writer arbitration transitions
- standardized error conversion

### NGE domain tests

- existing manager behavior before and after extraction
- block addition and removal
- property changes
- individual and batch connections
- validation
- import/export round trips
- preservation of editor layout data

### Browser adapter tests

- tools register without mounting the MCP property panel
- reads serialize the latest editor state
- successful mutations refresh all required editor surfaces once
- invalid input leaves editor state unchanged
- legacy connection permits reads but rejects WebMCP mutations
- legacy disconnection restores WebMCP mutations
- editor disposal aborts all registrations

### Standard MCP regression tests

- existing tool names and schemas remain available
- existing responses remain compatible
- geometry mutations still notify attached SSE sessions
- editor-to-server document posts still update the manager
- session creation, reuse, closure, and idle shutdown remain functional

### Browser smoke tests

Test the supported development configuration in Chrome or Edge:

1. Open the editor with the required experimental WebMCP feature enabled.
2. Confirm tools appear in the browser's WebMCP inspection surface.
3. Invoke one read tool.
4. Invoke representative add, connect, validate, and rebuild operations.
5. Connect a legacy session and confirm WebMCP mutation rejection.
6. Disconnect it and confirm mutation recovery.
7. Close the editor and confirm the tools are removed.

External-client testing through a browser bridge is useful integration coverage, but it must not become a runtime dependency of the Babylon.js implementation.

## Rollout

Use reviewable delivery slices rather than a cross-editor change:

1. **NGE foundation:** reorganize the proof of concept around root lifecycle, cleanup, status, and writer arbitration.
2. **NGE shared core:** extract browser-safe graph logic and switch the legacy server to it without behavioral changes.
3. **NGE core parity:** add the first WebMCP read/edit tool wave.
4. **NGE expansion:** add appropriate import, export, snippet, and catalog operations.
5. **Shared runtime stabilization:** finalize the reusable browser-editor MCP package based on NGE experience.
6. **Editor migrations:** migrate NME, NRGE, NPE, Smart Filters, GUI, and Flow Graph independently.
7. **Legacy reassessment:** reconsider the HTTP/SSE session only after browser and external MCP client support has matured.

The existing legacy path remains the fallback throughout every stage.

## Definition of Done for NGE

NGE is considered the reference implementation when:

- WebMCP tools are registered from the root editor lifecycle.
- registration is reliably cleaned up.
- core current-document read/edit tools are available.
- those tools reuse the same graph operations as the standard MCP server.
- a connected legacy session has exclusive MCP mutation ownership.
- standard MCP behavior remains backward compatible.
- browser bundles contain no Node server or transport implementation.
- unit, standard MCP integration, and live browser smoke coverage pass.
- testing and fallback behavior are documented.

## Definition of Done for the Platform Migration

The broader migration is complete when:

- all applicable Babylon.js browser editors use the shared editor MCP runtime.
- each editor has classified and migrated its browser-appropriate tools.
- standard MCP and WebMCP adapters reuse domain operations where practical.
- all editors apply the same writer arbitration policy.
- no editor duplicates WebMCP lifecycle and fallback infrastructure.
- standard MCP clients continue to work without migration.
- any proposal to retire legacy sessions is made separately with current browser and client compatibility data.

## Known Risks

| Risk                                                | Mitigation                                                                                       |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| WebMCP changes while experimental                   | Isolate API-specific types and calls behind one adapter.                                         |
| Browser support is mistaken for client attachment   | Keep legacy sessions available; do not use timeout-based fallback.                               |
| WebMCP and legacy callers mutate concurrently       | Give a connected legacy session exclusive MCP write ownership.                                   |
| Shared packages pull Node code into browser bundles | Enforce browser-safe package boundaries and inspect production bundles.                          |
| Shared schemas increase browser size                | Share contracts and operations first; keep schema projections transport-specific when necessary. |
| Editor UI becomes stale after a tool call           | Require an editor-specific apply-and-refresh adapter with focused tests.                         |
| Refactoring changes legacy MCP behavior             | Add characterization tests and preserve public tool contracts.                                   |
| One abstraction does not fit every editor           | Share transport infrastructure, not a universal graph model.                                     |

## Deferred Decisions

These should be revisited during implementation rather than assumed now:

- final name and location of the browser-safe shared runtime package
- whether schema conversion can be shared without unacceptable bundle cost
- whether an editor should offer an explicit UI override for MCP writer selection
- whether human edits should automatically push during a legacy session
- which WebMCP browser versions and origin-trial configuration are supported at release time
- whether WebMCP eventually gains a reliable client-attachment signal
- whether mature external clients eliminate the need for the HTTP/SSE session path
