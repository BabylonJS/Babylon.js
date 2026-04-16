# Inspectable Refactor: MakeModularCLI + Long-Lived Bridge

## Problem

Today, `_StartInspectable` creates a `ServiceContainer` keyed by `Scene`. When the Playground re-runs, it disposes the old engine (which disposes the scene), tearing down the CLI bridge. The bridge must reconnect on every re-run. We want the CLI bridge to survive across playground re-runs.

## Goals

1. Introduce a lower-level `MakeModularCLI` function in `sharedUiComponents/modularTool/` that mirrors the `MakeModularTool` / `ShowInspector` split — scene-agnostic, owns only the command bridge, reusable by any tool.
2. Let the Playground hold a single long-lived `ModularCLIToken` that survives across re-runs, while `StartInspectable` continues to be per-scene.

## Architecture: Three Layers of ServiceContainer

The design uses three nested `ServiceContainer` layers, each with a distinct lifetime and responsibility:

```
┌─────────────────────────────────────────────────────────┐
│ Layer 1: MakeModularCLI (longest-lived)                 │
│ ─ CLI bridge (WebSocket + command registry)             │
│ ─ No scene dependency                                   │
│ ─ Playground: created once, survives across re-runs     │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │ Layer 2: StartInspectable (per-scene)             │  │
│  │ ─ SceneContext, EntityQuery, Screenshot, etc.     │  │
│  │ ─ Child container of CLI container                │  │
│  │ ─ Auto-disposes when scene disposes               │  │
│  │ ─ Playground: recreated each re-run               │  │
│  │                                                   │  │
│  │  ┌─────────────────────────────────────────────┐  │  │
│  │  │ Layer 3: ShowInspector / MakeModularTool    │  │  │
│  │  │ ─ UI services (shell, theme, panes, etc.)   │  │  │
│  │  │ ─ Child container of inspectable container  │  │  │
│  │  │ ─ Disposed when inspector is closed         │  │  │
│  │  └─────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

This keeps `StartInspectable` and `ShowInspector` almost exactly as they are today. The only structural change is that `_StartInspectable`'s `ServiceContainer` can optionally have a parent (the CLI container) instead of always being a root container.

## Design

### 1. `MakeModularCLI` (new, in `sharedUiComponents/modularTool/`)

> **Location:** `packages/dev/sharedUiComponents/src/modularTool/modularCLI.ts` — lives in sharedUiComponents alongside `MakeModularTool` so any tool (viewer-configurator, sandbox, etc.) can use it, not just inspector-v2.

```ts
/**
 * @experimental
 * @internal
 */
export type ModularCLIOptions = {
    /** WebSocket port for the bridge. Defaults to 4400. */
    port?: number;
    /** Session display name. Defaults to document.title. */
    name?: string;
    /** Auto-start bridge connection. Defaults to false. */
    autoStart?: boolean;
    /** Additional service definitions to register alongside the bridge. */
    serviceDefinitions?: readonly WeaklyTypedServiceDefinition[];
};

/**
 * @experimental
 * @internal
 * Token returned by MakeModularCLI. Exposes the ServiceContainer for
 * parent-container wiring in StartInspectable / MakeModularTool.
 */
export type ModularCLIToken = IDisposable & {
    readonly isDisposed: boolean;
    readonly serviceContainer: ServiceContainer;
};
```

**What it does:**
- Creates a headless `ServiceContainer("ModularCLIContainer")`.
- Registers `MakeCLIBridgeServiceDefinition` (renamed from `MakeInspectableBridgeServiceDefinition`) — the WebSocket bridge + command registry.
- Registers any additional `serviceDefinitions` from options in the same container.
- Returns a `ModularCLIToken`.
- No ref-counting on `ModularCLIToken` itself — the caller owns its lifetime. `dispose()` tears down the bridge and container.
- The function itself is marked `@experimental @internal`.

### 2. Files moving to `sharedUiComponents`

The bridge service and its dependencies need to move from `inspector-v2` to `sharedUiComponents` so that `MakeModularCLI` can use them without depending on inspector-v2.

| Current location (inspector-v2)              | New location (sharedUiComponents)                 | Rename                                                                                                                                                                                                                                                                            |
| -------------------------------------------- | ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `services/cli/inspectableBridgeService.ts`   | `modularTool/services/cli/cliBridgeService.ts`    | `MakeInspectableBridgeServiceDefinition` → `MakeCLIBridgeServiceDefinition`, `IInspectableBridgeServiceOptions` → `ICLIBridgeServiceOptions`                                                                                                                                      |
| `services/cli/inspectableCommandRegistry.ts` | `modularTool/services/cli/cliCommandRegistry.ts`  | `InspectableCommandRegistryIdentity` → `CLICommandRegistryIdentity`, `IInspectableCommandRegistry` → `ICLICommandRegistry`, `InspectableCommandDescriptor` → `CLICommandDescriptor`, `InspectableCommandArg` → `CLICommandArg`, `InspectableCommandArgType` → `CLICommandArgType` |
| `services/cli/cliConnectionStatus.ts`        | `modularTool/services/cli/cliConnectionStatus.ts` | No rename needed                                                                                                                                                                                                                                                                  |
| `cli/protocol.ts`                            | `modularTool/services/cli/protocol.ts`            | No rename needed                                                                                                                                                                                                                                                                  |

The old names (`InspectableCommandRegistryIdentity`, `IInspectableCommandRegistry`, `InspectableCommandDescriptor`, `InspectableCommandArg`) are public API. They should be kept as **deprecated type aliases / re-exports** in inspector-v2 for backward compatibility, pointing at the new names in sharedUiComponents. The new canonical names (`CLICommandRegistryIdentity`, `ICLICommandRegistry`, etc.) should be the ones used going forward.

### 3. `InspectableOptions` changes

`InspectableOptions` becomes a discriminated union so that bridge options (`port`, `name`, `autoStart`) and `cliToken` are mutually exclusive at the type level:

```ts
export type InspectableOptions = {
    serviceDefinitions?: readonly WeaklyTypedServiceDefinition[];
} & (
    | {
          /**
           * An existing ModularCLI token whose ServiceContainer will be used as
           * the parent for the inspectable container. The bridge already exists
           * in the CLI token's container, so bridge options are not accepted.
           * @experimental
           */
          cliToken: ModularCLIToken;
          port?: never;
          name?: never;
          autoStart?: never;
      }
    | {
          cliToken?: never;
          /** WebSocket port for the bridge. Defaults to 4400. */
          port?: number;
          /** Session display name. Defaults to document.title. */
          name?: string;
          /** Auto-start bridge connection. Defaults to false. */
          autoStart?: boolean;
      }
);
```

This ensures callers cannot accidentally pass both `cliToken` and bridge options — TypeScript will flag the conflict.

### 4. `_StartInspectable` / `StartInspectable` changes

Both functions stay as they are today. The only change: they accept the optional `cliToken` from options and use it as the parent for the inspectable `ServiceContainer`.

```ts
// _StartInspectable stays as the internal implementation returning InternalInspectableToken.
// StartInspectable stays as the public wrapper returning InspectableToken.
```

**Changes from today:**

- **Still takes `Scene`** — no overloads needed. Per-scene lifetime is preserved.
- **`cliToken` or bridge options** in options (mutually exclusive via union type):
  - If `cliToken` provided: creates the inspectable `ServiceContainer` as a **child** of `cliToken.serviceContainer`. Bridge options (`port`, `name`, `autoStart`) are typed as `never` and cannot be passed. The bridge service definition is **not** registered in the inspectable container (the bridge service is inherited from the parent).
  - If `cliToken` not provided: calls `MakeModularCLI` internally (forwarding `port`, `name`, `autoStart`) to create a CLI container, then creates the inspectable container as its child. This is the default path and preserves current behavior exactly.
- **Inspectable container registers** (same as today):
  - `SceneContextServiceDefinition` (wrapping the raw `Scene`)
  - `EntityQueryServiceDefinition`
  - `ScreenshotCommandServiceDefinition`
  - `ShaderCommandServiceDefinition`
  - `StatsCommandServiceDefinition`
  - `PerfTraceCommandServiceDefinition`
  - Any extra `options.serviceDefinitions`
- **Ref-counting per scene stays as-is**: `InspectableStates` map keyed by `Scene`, ref count per token.
- **Auto-dispose on scene disposal stays as-is**: hooks `scene.onDisposeObservable`.
- **When ref count reaches 0 or scene disposes**: the inspectable container is disposed. If `MakeModularCLI` was called internally (no external `cliToken`), the CLI container is also disposed. If an external `cliToken` was provided, it is NOT disposed — the caller controls its lifetime.
- **`_StartInspectable` and `InternalInspectableToken` stay as they are.** `ShowInspector` continues to call `_StartInspectable(scene)` and access `.serviceContainer` from the `InternalInspectableToken`.

### 5. `ShowInspector` — no changes

`ShowInspector` continues to call `_StartInspectable(scene)` as it does today. The scene-based lookup in `InspectableStates` finds the existing inspectable container (which the Playground already created via `StartInspectable(scene, { cliToken })`), increments the ref count, and returns the `InternalInspectableToken` with `.serviceContainer`. `ShowInspector` uses that as `parentContainer` for `MakeModularTool`.

No changes to `InspectorOptions` or `ShowInspector` are needed.

### 6. Playground changes

```ts
private _cliToken: ModularCLIToken | null = null;

// Called once during component mount
private _initCLI() {
    const inspectorV2Module: InspectorV2Module | undefined = (globalThis as any).INSPECTOR;
    if (inspectorV2Module?.MakeModularCLI) {
        this._cliToken = inspectorV2Module.MakeModularCLI({
            serviceDefinitions: [MakePlaygroundCommandServiceDefinition(this.props.globalState, inspectorV2Module)],
        });
    }
}

// Called each re-run after new scene is created (same shape as current _ensureInspectable)
private _ensureInspectable() {
    if (this._inspectableToken && !this._inspectableToken.isDisposed) {
        return;
    }
    if (!this._scene) {
        return;
    }
    const inspectorV2Module: InspectorV2Module | undefined = (globalThis as any).INSPECTOR;
    if (inspectorV2Module?.StartInspectable) {
        this._inspectableToken = inspectorV2Module.StartInspectable(this._scene, {
            cliToken: this._cliToken!,
        });
    }
}

// _showInspectorAsync — no changes needed! ShowInspector finds the inspectable by scene.
```

**Key behaviors:**
- `_cliToken` is created once and survives across all re-runs. The WebSocket bridge stays connected. Playground-specific commands (run-playground, etc.) are registered here since they are scene-agnostic.
- `_ensureInspectable()` still runs each re-run, creating a per-scene inspectable container as a child of the long-lived CLI container.
- When the scene disposes (during re-run), the inspectable container is torn down. CLI command services (EntityQuery, Screenshot, etc.) unregister their commands. But the bridge stays alive.
- After the new scene is created, `_ensureInspectable()` creates a fresh inspectable container as a child of the same CLI container. Command services re-register their commands.
- `ShowInspector` needs no new options — it calls `_StartInspectable(scene)` which finds the existing per-scene state via the `InspectableStates` map, exactly as today.
- The brief gap between scene teardown and re-creation means no commands are registered momentarily. This is acceptable — the bridge is still connected, and any CLI query during that instant would get "unknown command" rather than a connection failure.

### 7. Command service cleanup

When the inspectable container is disposed (scene teardown), all its services are disposed in reverse order. The CLI command services (EntityQuery, Screenshot, etc.) consume `ICLICommandRegistry` from the parent CLI container and call `addCommand()` during initialization. Each `addCommand()` returns an `IDisposable` that unregisters the command.

**Requirement:** Each command service's `dispose()` method must call the `IDisposable` returned by `addCommand()` to properly unregister from the parent's command registry. This ensures:
- No stale commands reference a dead scene after teardown.
- Commands are cleanly re-registered when a new inspectable container is created for the new scene.

This should already be the case for well-behaved services, but must be verified for all built-in command services.

## Summary of file changes

| File                                                                     | Change                                                                                                                                                                                                                                                                                          |
| ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `sharedUiComponents/src/modularTool/modularCLI.ts`                       | **New.** `MakeModularCLI` function + `ModularCLIToken` type + `ModularCLIOptions` type. All marked `@experimental @internal`.                                                                                                                                                                   |
| `sharedUiComponents/src/modularTool/services/cli/cliBridgeService.ts`    | **Moved + renamed** from `inspector-v2/src/services/cli/inspectableBridgeService.ts`. `MakeCLIBridgeServiceDefinition`.                                                                                                                                                                         |
| `sharedUiComponents/src/modularTool/services/cli/cliCommandRegistry.ts`  | **Moved + renamed** from `inspector-v2/src/services/cli/inspectableCommandRegistry.ts`. `ICLICommandRegistry`, `CLICommandRegistryIdentity`, etc.                                                                                                                                               |
| `sharedUiComponents/src/modularTool/services/cli/cliConnectionStatus.ts` | **Moved** from `inspector-v2/src/services/cli/cliConnectionStatus.ts`. No rename.                                                                                                                                                                                                               |
| `sharedUiComponents/src/modularTool/services/cli/protocol.ts`            | **Moved** from `inspector-v2/src/cli/protocol.ts`. No rename.                                                                                                                                                                                                                                   |
| `inspector-v2/src/services/cli/inspectableCommandRegistry.ts`            | **Deprecated re-exports** of old names pointing at new sharedUiComponents locations.                                                                                                                                                                                                            |
| `inspector-v2/src/services/cli/inspectableBridgeService.ts`              | **Deprecated re-export** of `MakeCLIBridgeServiceDefinition` as `MakeInspectableBridgeServiceDefinition`.                                                                                                                                                                                       |
| `inspector-v2/src/inspectable.ts`                                        | Accept `cliToken` in options (mutually exclusive union with bridge options). When provided, use as parent container and skip bridge creation. When not provided, call `MakeModularCLI` internally. Dispose internally-created CLI container on full teardown, but not externally-provided ones. |
| `inspector-v2/src/inspector.tsx`                                         | **No changes.**                                                                                                                                                                                                                                                                                 |
| `inspector-v2/src/index.ts`                                              | Re-export `MakeModularCLI`, `ModularCLIToken`, `ModularCLIOptions` from sharedUiComponents. Re-export new CLI type names. Keep deprecated re-exports of old names.                                                                                                                              |
| `inspector-v2/src/services/sceneContext.ts`                              | No changes needed.                                                                                                                                                                                                                                                                              |
| `playground/src/components/rendererComponent.tsx`                        | Create long-lived `ModularCLIToken` once (with playground-specific commands). Pass `cliToken` to `StartInspectable` each re-run. `_showInspectorAsync` unchanged.                                                                                                                               |

## Backward compatibility

- `StartInspectable(scene, options)` still works exactly as before — `cliToken` is optional, and when omitted the function creates its own CLI container internally.
- `ShowInspector(scene, options)` is completely unchanged.
- `_StartInspectable` and `InternalInspectableToken` stay as they are — no internal API churn.
- `InspectableToken` public type is unchanged.
- Old names (`InspectableCommandRegistryIdentity`, `IInspectableCommandRegistry`, `InspectableCommandDescriptor`, `InspectableCommandArg`) are preserved as deprecated re-exports for public API compat.

## Open questions

1. **Playground-specific command lifetime**: Playground commands (run-playground, etc.) are now registered in the long-lived CLI container. If the Playground component unmounts, those commands would need to be cleaned up by disposing the `ModularCLIToken`. Verify that the current Playground component lifecycle handles this correctly.
2. **Other tools**: Should other tools (viewer-configurator, sandbox) adopt `MakeModularCLI` for their own headless CLI bridge needs? For now, only inspector-v2 re-exports it, but it lives in sharedUiComponents and is ready for reuse.
