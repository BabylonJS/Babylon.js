import type { FlowGraph } from "core/FlowGraph/flowGraph";
import { FlowGraphState } from "core/FlowGraph/flowGraph";
import type { FlowGraphContext } from "core/FlowGraph/flowGraphContext";
import { Observable } from "core/Misc/observable";
import type { Observer } from "core/Misc/observable";
import type { IAssetContainer } from "core/IAssetContainer";
import type { LogEntry } from "./components/log/logComponent";
import { RegisterElbowSupport } from "./graphSystem/registerElbowSupport";
import { RegisterNodePortDesign } from "./graphSystem/registerNodePortDesign";
import type { GraphNode } from "shared-ui-components/nodeGraphSystem/graphNode";
import type { GraphFrame } from "shared-ui-components/nodeGraphSystem/graphFrame";
import type { Nullable } from "core/types";
import { LockObject } from "shared-ui-components/tabs/propertyGrids/lockObject";
import { StateManager } from "shared-ui-components/nodeGraphSystem/stateManager";
import { RegisterDefaultInput } from "./graphSystem/registerDefaultInput";
import { RegisterExportData } from "./graphSystem/registerExportData";
import type { FlowGraphBlock } from "core/FlowGraph/flowGraphBlock";
import { RegisterDebugSupport } from "./graphSystem/registerDebugSupport";
import type { Scene } from "core/scene";
import type { SceneContext } from "./sceneContext";
import { FlowGraphInteger } from "core/FlowGraph/CustomTypes/flowGraphInteger";
import type { IFlowGraphValidationResult } from "core/FlowGraph/flowGraphValidator";
import { ValidateFlowGraphWithBlockList } from "core/FlowGraph/flowGraphValidator";

/**
 * Class used to hold the global state of the flow graph editor
 */
export class GlobalState {
    /** Host element for the editor */
    hostElement: HTMLElement;
    /** Host document */
    hostDocument: Document;
    /** Host window */
    hostWindow: Window;
    /** Host scene (if provided externally) */
    hostScene?: Scene;
    /** State manager for graph UI */
    stateManager: StateManager;
    /** Observable for clearing undo stack */
    onClearUndoStack = new Observable<void>();
    /** Observable triggered when graph is built */
    onBuiltObservable = new Observable<void>();
    /** Observable triggered when graph reset is required */
    onResetRequiredObservable = new Observable<boolean>();
    /** Observable triggered when zoom to fit is required */
    onZoomToFitRequiredObservable = new Observable<void>();
    /** Observable triggered when reorganization is required */
    onReOrganizedRequiredObservable = new Observable<void>();
    /** Observable triggered when log entry is required */
    onLogRequiredObservable = new Observable<LogEntry>();
    /** Observable triggered when loading state changes */
    onIsLoadingChanged = new Observable<boolean>();
    /** Observable triggered on frame  */
    onFrame = new Observable<void>();
    /** Observable triggered when a frame is imported */
    onImportFrameObservable = new Observable<any>();
    /** Observable triggered when popup is closed */
    onPopupClosedObservable = new Observable<void>();
    /** Callback to get a graph node from a flow graph block */
    onGetNodeFromBlock: (block: FlowGraphBlock) => GraphNode;
    /** Observable triggered when a drop event is received */
    onDropEventReceivedObservable = new Observable<DragEvent>();
    /** Whether the pointer is over the canvas */
    pointerOverCanvas: boolean = false;
    /** Lock object for property grid */
    lockObject = new LockObject();
    /** The scene associated with this editor */
    scene: Scene;

    /** Optional custom save handler */
    customSave?: { label: string; action: (data: string) => Promise<void> };

    // ── Validation ─────────────────────────────────────────────────────
    /** Whether live validation is enabled (re-validates on graph changes). */
    private _liveValidation: boolean = true;
    /** Observable triggered when live validation mode changes. */
    onLiveValidationChanged = new Observable<boolean>();
    /** The latest validation result. Null if validation has not run yet. */
    private _validationResult: Nullable<IFlowGraphValidationResult> = null;
    /** Observable triggered when validation results change. */
    onValidationResultChanged = new Observable<Nullable<IFlowGraphValidationResult>>();
    /** Debounce timer for live validation */
    private _validationDebounceTimer: ReturnType<typeof setTimeout> | null = null;
    /** Debounce delay for live validation (ms) */
    private static readonly _VALIDATION_DEBOUNCE_MS = 300;

    /** Gets whether live validation is enabled. */
    public get liveValidation(): boolean {
        return this._liveValidation;
    }

    /** Sets live validation mode. When enabled, triggers an immediate validation. */
    public set liveValidation(value: boolean) {
        if (this._liveValidation === value) {
            return;
        }
        this._liveValidation = value;
        this.onLiveValidationChanged.notifyObservers(value);
        if (value) {
            this.runValidation();
        }
    }

    /** Gets the latest validation result. */
    public get validationResult(): Nullable<IFlowGraphValidationResult> {
        return this._validationResult;
    }

    /**
     * Run validation immediately and publish results.
     * Uses `ValidateFlowGraphWithBlockList` to also detect unreachable blocks.
     */
    public runValidation(): void {
        if (!this._flowGraph) {
            this._validationResult = null;
            this.onValidationResultChanged.notifyObservers(null);
            return;
        }
        // Collect all known blocks from the editor graph canvas (via onGetNodeFromBlock callback)
        const allBlocks: FlowGraphBlock[] = [];
        this._flowGraph.visitAllBlocks((b) => allBlocks.push(b));
        // Also include any blocks in the canvas that aren't reachable
        if (this._allEditorBlocks) {
            for (const block of this._allEditorBlocks()) {
                if (!allBlocks.find((b) => b.uniqueId === block.uniqueId)) {
                    allBlocks.push(block);
                }
            }
        }
        this._validationResult = ValidateFlowGraphWithBlockList(this._flowGraph, allBlocks);
        this.onValidationResultChanged.notifyObservers(this._validationResult);
    }

    /**
     * Schedule a debounced live validation run.
     * Call this when graph structure changes (connection added/removed, block added/removed).
     */
    public scheduleLiveValidation(): void {
        if (!this._liveValidation) {
            return;
        }
        if (this._validationDebounceTimer !== null) {
            clearTimeout(this._validationDebounceTimer);
        }
        this._validationDebounceTimer = setTimeout(() => {
            this._validationDebounceTimer = null;
            this.runValidation();
        }, GlobalState._VALIDATION_DEBOUNCE_MS);
    }

    /** Callback that returns all blocks the editor knows about (set by GraphEditor) */
    private _allEditorBlocks: Nullable<() => FlowGraphBlock[]> = null;

    /**
     * Register a callback that provides the full list of blocks in the editor.
     * @param provider - callback returning all editor blocks
     */
    public registerEditorBlocksProvider(provider: () => FlowGraphBlock[]): void {
        this._allEditorBlocks = provider;
    }

    /** Whether debug mode is active (execution highlighting, value probes) */
    private _isDebugMode: boolean = false;
    /** Observable triggered when debug mode changes */
    onDebugModeChanged = new Observable<boolean>();
    /** The index of the context to observe in debug mode (0 = first context) */
    selectedContextIndex: number = 0;
    /** Observer tracking node execution for debug highlighting */
    private _debugExecutionObserver: Nullable<Observer<FlowGraphBlock>> = null;
    /** Per-node throttle timestamps to avoid excessive highlighting */
    private _highlightThrottleMap = new Map<string, number>();
    /** Minimum interval between highlight pulses per node (ms) */
    private static readonly _HIGHLIGHT_THROTTLE_MS = 100;

    /** Gets whether debug mode is active */
    public get isDebugMode(): boolean {
        return this._isDebugMode;
    }

    /** Sets debug mode and subscribes/unsubscribes from execution observables */
    public set isDebugMode(value: boolean) {
        if (this._isDebugMode === value) {
            return;
        }
        this._isDebugMode = value;
        if (value) {
            this._subscribeDebugObservers();
        } else {
            this._unsubscribeDebugObservers();
        }
        this.onDebugModeChanged.notifyObservers(value);
    }

    /** Subscribe to the selected context's onNodeExecutedObservable for execution highlighting */
    private _subscribeDebugObservers(): void {
        this._unsubscribeDebugObservers();
        const context = this._flowGraph?.getContext(this.selectedContextIndex);
        if (!context) {
            return;
        }
        this._highlightThrottleMap.clear();
        this._debugExecutionObserver = context.onNodeExecutedObservable.add((block) => {
            const now = performance.now();
            const lastTime = this._highlightThrottleMap.get(block.uniqueId) ?? 0;
            if (now - lastTime < GlobalState._HIGHLIGHT_THROTTLE_MS) {
                return;
            }
            this._highlightThrottleMap.set(block.uniqueId, now);

            // Highlight the node briefly
            this.stateManager.onHighlightNodeObservable.notifyObservers({ data: block, active: true });
            setTimeout(() => {
                this.stateManager.onHighlightNodeObservable.notifyObservers({ data: block, active: false });
            }, 300);

            // Trigger a refresh so executionTime updates in the UI
            if (this.onGetNodeFromBlock) {
                const graphNode = this.onGetNodeFromBlock(block);
                if (graphNode) {
                    graphNode.refresh();
                }
            }
        });
    }

    /** Unsubscribe from debug execution observers */
    private _unsubscribeDebugObservers(): void {
        this._debugExecutionObserver?.remove();
        this._debugExecutionObserver = null;
        this._highlightThrottleMap.clear();
    }

    /** The scene context populated when a Playground snippet is loaded */
    sceneContext: Nullable<SceneContext> = null;
    /** Observable triggered when the scene context changes (snippet loaded/disposed) */
    onSceneContextChanged = new Observable<Nullable<SceneContext>>();

    /** The snippet ID of the currently loaded scene (persisted in the serialized JSON) */
    snippetId: string = "";
    /** Observable triggered when the snippet ID changes (e.g. after deserialization) */
    onSnippetIdChanged = new Observable<string>();
    /** Observable triggered to request a snippet reload (e.g. from the Reset button) */
    onReloadSnippetRequested = new Observable<void>();

    private _flowGraph: FlowGraph;
    private _sceneContextObserver: Nullable<Observer<Nullable<SceneContext>>> = null;
    private _originalCreateContext: Nullable<() => FlowGraphContext> = null;

    /**
     * Cached uniqueId → name lookup per asset type from the PREVIOUS scene.
     * Built eagerly when a scene context arrives so it survives scene disposal.
     */
    private _cachedOldIdToName: Map<string, Map<number, string>> | null = null;

    /**
     * Gets the current flow graph
     */
    public get flowGraph(): FlowGraph {
        return this._flowGraph;
    }

    /**
     * Sets the current flow graph and wires the scene-context ↔ assets-context bridge.
     * When a SceneContext is set (via snippet load), all existing and future
     * FlowGraphContext execution contexts will have their assetsContext updated
     * to point at the loaded scene.
     */
    public set flowGraph(flowGraph: FlowGraph) {
        // Tear down previous wiring
        if (this._sceneContextObserver) {
            this.onSceneContextChanged.remove(this._sceneContextObserver);
            this._sceneContextObserver = null;
        }
        if (this._originalCreateContext && this._flowGraph) {
            this._flowGraph.createContext = this._originalCreateContext;
            this._originalCreateContext = null;
        }

        this._flowGraph = flowGraph;

        if (!flowGraph) {
            return;
        }

        // The editor always starts in Stopped state — the user must explicitly
        // press Start or Reset.  The graph may arrive already started when
        // opened from KHR_interactivity or another runtime path.
        if (flowGraph.state === FlowGraphState.Started || flowGraph.state === FlowGraphState.Paused) {
            flowGraph.stop();
        }

        // Wire the observer: when scene context changes, update all execution contexts
        // and re-point the flow graph's event coordinator at the new scene so that
        // scene-based events (e.g. SceneOnTick) fire correctly.
        this._sceneContextObserver = this.onSceneContextChanged.add((ctx) => {
            const assetsContainer: IAssetContainer | undefined = ctx?.scene;
            this._applyAssetsContextToGraph(assetsContainer);
            if (ctx?.scene) {
                // Remap GetAsset block references from old uniqueIds to new ones
                // (uniqueId values change when a snippet is re-executed).
                // Uses the cached id→name map built from the previous scene
                // (the old scene is already disposed by the time this fires).
                this._remapAssetReferences(ctx.scene);

                // Cache the NEW scene's id→name map for the next reload
                this._cacheSceneIdToNameMap(ctx.scene);

                flowGraph.setScene(ctx.scene);
            }
        });

        // Wrap createContext() so newly created contexts also inherit the loaded scene
        this._originalCreateContext = flowGraph.createContext.bind(flowGraph);
        const origCreate = this._originalCreateContext!;
        flowGraph.createContext = (): FlowGraphContext => {
            const ctx = origCreate();
            if (this.sceneContext) {
                ctx.assetsContext = this.sceneContext.scene;
            }
            return ctx;
        };

        // If a scene context is already loaded, apply it immediately
        if (this.sceneContext) {
            this._applyAssetsContextToGraph(this.sceneContext.scene);
        }

        // Re-subscribe debug observers if debug mode is active
        if (this._isDebugMode) {
            this._subscribeDebugObservers();
        }
    }

    /**
     * Iterate all execution contexts on the current flow graph and set their assetsContext.
     * Falls back to the editor's host scene when no custom asset container is given.
     * @param assetsContainer - the IAssetContainer to set, or undefined to revert to the default scene
     */
    private _applyAssetsContextToGraph(assetsContainer: IAssetContainer | undefined): void {
        if (!this._flowGraph) {
            return;
        }
        const fallback = this.scene;
        let index = 0;
        let context = this._flowGraph.getContext(index);
        while (context) {
            context.assetsContext = assetsContainer ?? fallback;
            index++;
            context = this._flowGraph.getContext(index);
        }
    }

    /**
     * When a scene is reloaded from the same snippet, objects get new uniqueId values.
     * This method visits all GetAsset blocks and remaps their stored uniqueId references
     * to the corresponding objects in the new scene, matching by name and type.
     *
     * Uses `_cachedOldIdToName` — a snapshot built from the previous scene BEFORE it was disposed.
     * @param newScene - the newly loaded scene
     */
    private _remapAssetReferences(newScene: Scene): void {
        if (!this._flowGraph || !this._cachedOldIdToName) {
            return;
        }

        // Build a name → newUniqueId lookup per asset type from the new scene
        const nameLookup = new Map<string, Map<string, number>>([
            ["Mesh", new Map(newScene.meshes.map((m) => [m.name, m.uniqueId]))],
            ["Light", new Map(newScene.lights.map((l) => [l.name, l.uniqueId]))],
            ["Camera", new Map(newScene.cameras.map((c) => [c.name, c.uniqueId]))],
            ["Material", new Map(newScene.materials.map((m) => [m.name, m.uniqueId]))],
            ["AnimationGroup", new Map(newScene.animationGroups.map((ag) => [ag.name, ag.uniqueId]))],
            ["Animation", new Map(newScene.animations.map((a) => [a.name, a.uniqueId]))],
        ]);

        const oldIdToName = this._cachedOldIdToName;

        this._flowGraph.visitAllBlocks((block: FlowGraphBlock) => {
            if (block.getClassName() !== "FlowGraphGetAssetBlock") {
                return;
            }

            const config = (block as any).config;
            if (!config || !config.useIndexAsUniqueId) {
                return;
            }

            const assetType: string | undefined = config.type;
            const rawIdx = config.index ?? -1;
            const oldIndex = rawIdx instanceof FlowGraphInteger ? rawIdx.value : typeof rawIdx === "number" ? rawIdx : -1;
            if (!assetType || oldIndex < 0) {
                return;
            }

            // Find the name of the old asset
            const oldMap = oldIdToName.get(assetType);
            const newMap = nameLookup.get(assetType);
            if (!oldMap || !newMap) {
                return;
            }

            const name = oldMap.get(oldIndex);
            if (name === undefined) {
                return;
            }

            const newId = newMap.get(name);
            if (newId === undefined) {
                return;
            }

            // Update config and DataConnection default value
            config.index = new FlowGraphInteger(newId);
            const indexDC = (block as any).index;
            if (indexDC && "_defaultValue" in indexDC) {
                indexDC._defaultValue = new FlowGraphInteger(newId);
            }
        });
    }

    /**
     * Snapshot the current scene's uniqueId→name mappings so they survive scene disposal.
     * Called immediately after a scene context arrives — before the scene can be disposed.
     * @param scene - the scene to snapshot
     */
    private _cacheSceneIdToNameMap(scene: Scene): void {
        this._cachedOldIdToName = new Map<string, Map<number, string>>([
            ["Mesh", new Map(scene.meshes.map((m) => [m.uniqueId, m.name]))],
            ["Light", new Map(scene.lights.map((l) => [l.uniqueId, l.name]))],
            ["Camera", new Map(scene.cameras.map((c) => [c.uniqueId, c.name]))],
            ["Material", new Map(scene.materials.map((m) => [m.uniqueId, m.name]))],
            ["AnimationGroup", new Map(scene.animationGroups.map((ag) => [ag.uniqueId, ag.name]))],
            ["Animation", new Map(scene.animations.map((a) => [a.uniqueId, a.name]))],
        ]);
    }

    /**
     * Creates a new GlobalState
     * @param scene the scene to associate with
     */
    public constructor(scene: Scene) {
        this.scene = scene;
        this.stateManager = new StateManager();
        this.stateManager.data = this;
        this.stateManager.lockObject = this.lockObject;

        RegisterElbowSupport(this.stateManager);
        RegisterDebugSupport(this.stateManager);
        RegisterNodePortDesign(this.stateManager);
        RegisterDefaultInput(this.stateManager);
        RegisterExportData(this.stateManager);
    }

    /**
     * Store editor data for serialization
     * @param serializationObject the object to store data into
     * @param frame optional frame to store data for
     */
    storeEditorData(serializationObject: any, frame?: Nullable<GraphFrame>) {
        this.stateManager.storeEditorData(serializationObject, frame);
    }
}
