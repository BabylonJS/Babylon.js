import { type FlowGraph, FlowGraphState } from "core/FlowGraph/flowGraph";
import { type FlowGraphContext, type IFlowGraphPendingActivation } from "core/FlowGraph/flowGraphContext";
import { Observable, type Observer } from "core/Misc/observable";
import { type IAssetContainer } from "core/IAssetContainer";
import { type LogEntry } from "./components/log/logComponent";
import { RegisterElbowSupport } from "./graphSystem/registerElbowSupport";
import { RegisterNodePortDesign } from "./graphSystem/registerNodePortDesign";
import { type GraphNode } from "shared-ui-components/nodeGraphSystem/graphNode";
import { type GraphFrame } from "shared-ui-components/nodeGraphSystem/graphFrame";
import { type Nullable } from "core/types";
import { LockObject } from "shared-ui-components/tabs/propertyGrids/lockObject";
import { StateManager } from "shared-ui-components/nodeGraphSystem/stateManager";
import { RegisterDefaultInput } from "./graphSystem/registerDefaultInput";
import { RegisterExportData } from "./graphSystem/registerExportData";
import { type FlowGraphBlock } from "core/FlowGraph/flowGraphBlock";
import { type FlowGraphDataConnection } from "core/FlowGraph/flowGraphDataConnection";
import { FlowGraphExecutionBlock } from "core/FlowGraph/flowGraphExecutionBlock";
import { FlowGraphEventBlock } from "core/FlowGraph/flowGraphEventBlock";
import { type FlowGraphSignalConnection } from "core/FlowGraph/flowGraphSignalConnection";
import { RegisterDebugSupport } from "./graphSystem/registerDebugSupport";
import { type Scene } from "core/scene";
import { type SceneContext } from "./sceneContext";
import { FlowGraphInteger } from "core/FlowGraph/CustomTypes/flowGraphInteger";
import { FlowGraphValidationSeverity, type IFlowGraphValidationIssue, type IFlowGraphValidationResult, ValidateFlowGraphWithBlockList } from "core/FlowGraph/flowGraphValidator";
import { type HelpTopicId } from "./components/help/helpContent";
import { FlowGraphCoordinator } from "core/FlowGraph/flowGraphCoordinator";
import { type IFlowGraphSoundAsset } from "core/FlowGraph/flowGraphSoundAssets";
import { Logger } from "core/Misc/logger";
import { type IKHRInteractivityImportResult } from "loaders/glTF/2.0/Extensions/KHR_interactivity.pure";

export type SceneReferenceLocation = { id: string; name: string; className: string; idIndex: number; nameIndex: number; sceneUid?: string };
type SceneReferenceProvenance = Array<[number, SceneReferenceLocation]>;

function SerializeEditorValue(value: any): any {
    const className = value?.getClassName?.() ?? "";
    if (className && typeof value.asArray === "function") {
        return { value: value.asArray(), className };
    }
    if (className === "FlowGraphInteger") {
        return { value: value.value, className };
    }
    if (className && (value.id || value.name)) {
        return { id: value.id, name: value.name, className, uniqueId: value.uniqueId };
    }
    const isSceneReference = (entry: any) => entry && typeof entry.getClassName === "function" && !!(entry.id || entry.name);
    const isSerializedReference = (entry: any) =>
        entry && typeof entry === "object" && typeof entry.className === "string" && !!(entry.id || entry.name) && entry.value === undefined;
    if (Array.isArray(value) && value.length > 0 && value.every((entry) => isSceneReference(entry) || isSerializedReference(entry))) {
        return value.map((entry) => (isSceneReference(entry) ? { id: entry.id, name: entry.name, className: entry.getClassName(), uniqueId: entry.uniqueId } : { ...entry }));
    }
    if (typeof value !== "object" || value === null) {
        return value;
    }
    if (Object.values(value).some((entry) => typeof entry === "function")) {
        return undefined;
    }
    try {
        return JSON.parse(JSON.stringify(value));
    } catch {
        Logger.Warn("Flow Graph editor serialization skipped a value that is not JSON-serializable.");
        return undefined;
    }
}

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
    /** Observable triggered when a flow-aware graph sort is required */
    onSortGraphRequiredObservable = new Observable<void>();
    /** Observable triggered when log entry is required */
    onLogRequiredObservable = new Observable<LogEntry>();
    /** Observable triggered when a debug execution entry should be added to the log. */
    onDebugLogRequiredObservable = new Observable<{ message: string; block: FlowGraphBlock }>();
    /** Observable triggered when coordinator sound assets change. */
    onSoundAssetsChanged = new Observable<void>();
    /** Observable triggered when loading state changes */
    onIsLoadingChanged = new Observable<boolean>();
    /** Observable triggered on frame  */
    onFrame = new Observable<void>();
    /** Observable triggered when a frame is imported */
    onImportFrameObservable = new Observable<any>();
    /** Observable triggered when popup is closed */
    onPopupClosedObservable = new Observable<void>();
    /** Callback to get a graph node from a flow graph block. Set by GraphEditor after mount. */
    onGetNodeFromBlock: Nullable<(block: FlowGraphBlock) => GraphNode> = null;
    // eslint-disable-next-line jsdoc/require-returns
    /** Callback that returns true if the given graph node is within the visible viewport.
     *  Used by the debug highlighter to skip offscreen nodes and save DOM work. */
    isNodeVisible: (node: GraphNode) => boolean = () => true;
    /** Observable triggered when a drop event is received */
    onDropEventReceivedObservable = new Observable<DragEvent>();
    /** Observable triggered when help dialog is requested. Payload is an optional topic id. */
    onHelpRequested = new Observable<HelpTopicId | undefined>();
    /** Observable triggered when a toast notification should be shown. */
    onToastNotification = new Observable<{ message: string; severity: "info" | "success" | "error" | "warning" }>();
    /** Observable triggered when the "How to Use" (embed code) dialog is requested. */
    onHowToUseRequested = new Observable<void>();
    /** Whether the pointer is over the canvas */
    pointerOverCanvas: boolean = false;
    /** Lock object for property grid */
    lockObject = new LockObject();

    /** Current MCP editor-session URL. */
    mcpSessionUrl: string | null = null;
    /** Whether the editor is connected to an MCP session. */
    mcpSessionConnected: boolean = false;
    /** Active MCP session event stream. */
    mcpEventSource: EventSource | null = null;
    /** Observable triggered when MCP session connection state changes. */
    onMcpSessionStateChangedObservable = new Observable<boolean>();

    // ── Time Scale ─────────────────────────────────────────────────────
    /** Observable triggered when the time scale changes. */
    onTimeScaleChanged = new Observable<number>();

    private _timeScale: number = 1;

    /** Gets the current time scale (1 = normal, 0.5 = half speed, etc.). */
    public get timeScale(): number {
        return this._timeScale;
    }

    /**
     * Sets the time scale. Patches engine.getDeltaTime() on the preview
     * engine so that ALL code reading delta time (FlowGraph, animations,
     * render-loop code, physics, particles) gets the scaled value.
     */
    public set timeScale(value: number) {
        this._timeScale = value;
        this._applyEngineTimeScale();
        this.onTimeScaleChanged.notifyObservers(value);
    }

    /** The original (un-patched) getDeltaTime bound to the preview engine. */
    private _originalGetDeltaTime: (() => number) | null = null;

    /**
     * Patch (or re-patch) engine.getDeltaTime() on the current preview engine
     * to return the raw delta time multiplied by `_timeScale`, AND throttle the
     * actual render loop for scales below 1 so that tick-based logic (flow graph
     * onTick, render-loop code that doesn't use deltaTime) also slows down.
     */
    private _applyEngineTimeScale(): void {
        if (!this.sceneContext) {
            return;
        }
        // In host mode the engine belongs to the running application. Patching its getDeltaTime
        // or replacing customAnimationFrameRequester would permanently alter the live app's render
        // loop (there is no restore path), so never touch a borrowed engine's timing.
        if (!this.sceneContext.ownsScene) {
            return;
        }
        const engine = this.sceneContext.engine;
        // Store original only once per engine instance
        if (!this._originalGetDeltaTime) {
            this._originalGetDeltaTime = engine.getDeltaTime.bind(engine);
        }
        const scale = this._timeScale;
        const orig = this._originalGetDeltaTime!;
        // Scale reported deltaTime so deltaTime-based code runs proportionally
        engine.getDeltaTime = () => orig() * scale;

        // Throttle the render loop frame rate for scales below 1.
        // This ensures tick-count-based logic fires fewer times per second.
        // The delay is derived from the native frame interval (1/refreshRate)
        // divided by the scale, so it adapts to any monitor refresh rate.
        if ("customAnimationFrameRequester" in engine) {
            if (scale < 1) {
                const nativeIntervalMs = 1000 / (engine.getFps() || 60);
                const interval = nativeIntervalMs / scale;
                (engine as any).customAnimationFrameRequester = {
                    requestAnimationFrame: (callback: FrameRequestCallback) => window.setTimeout(callback, interval),
                    cancelAnimationFrame: (id: number) => window.clearTimeout(id),
                };
            } else {
                // At 1× or faster, use native requestAnimationFrame
                (engine as any).customAnimationFrameRequester = null;
            }
        }
    }
    /** The scene associated with this editor */
    scene: Scene;

    /** Optional custom save handler */
    customSave?: { label: string; action: (data: string) => Promise<void> };

    /** Reason serialization is unavailable for the currently loaded graph set, or null when it is supported. */
    serializationDisabledReason: Nullable<string> = null;

    /** Whether the active coordinator depends on runtime services scoped to its imported asset. */
    hasImportScopedRuntime = false;

    /** Canonical KHR_interactivity import associated with the active editor coordinator. */
    khrInteractivityImportResult: Nullable<IKHRInteractivityImportResult> = null;

    // ── Multi-Graph / Coordinator ──────────────────────────────────────
    /** The coordinator that owns all graphs in this editor session. */
    private _coordinator: Nullable<FlowGraphCoordinator> = null;
    private _soundAssetChangedObserver: Nullable<Observer<string>> = null;
    private _lifetimeGeneration = 0;

    /** Coordinators created by editor parsing or graph creation and therefore safe for the editor to dispose. */
    private readonly _editorOwnedCoordinators = new WeakSet<FlowGraphCoordinator>();

    /** Index of the currently active (displayed) graph within the coordinator. */
    private _activeGraphIndex: number = 0;
    private _skipNextOutgoingGraphSnapshot = false;

    /** Observable triggered when the active graph changes (graph switch, add, remove). */
    onActiveGraphChanged = new Observable<FlowGraph>();

    /** Observable triggered *before* the active graph changes, with the outgoing graph. */
    onBeforeActiveGraphChanged = new Observable<FlowGraph>();

    /** Observable triggered when the graph list changes (add, remove, rename). */
    onGraphListChanged = new Observable<void>();

    /**
     * Gets the coordinator that owns all graphs.
     */
    public get coordinator(): Nullable<FlowGraphCoordinator> {
        return this._coordinator;
    }

    /**
     * Sets the coordinator and activates its first graph.
     * This is the primary entry point when loading a new set of graphs.
     */
    public set coordinator(coordinator: Nullable<FlowGraphCoordinator>) {
        this.setCoordinator(coordinator);
    }

    /**
     * Sets the active coordinator and records whether its lifecycle belongs to the editor.
     * @param coordinator coordinator to activate
     * @param editorOwned whether the editor may dispose the coordinator when replacing it
     * @param activate whether to activate the coordinator's first graph immediately
     */
    public setCoordinator(coordinator: Nullable<FlowGraphCoordinator>, editorOwned = false, activate = true): void {
        const coordinatorChanged = this._coordinator !== coordinator;
        this._lifetimeGeneration++;
        this._soundAssetChangedObserver?.remove();
        this._soundAssetChangedObserver = null;
        if (coordinatorChanged) {
            this._savedUserVariables = null;
            this._savedConnectionValues = null;
            this._savedContextSnapshots = null;
            this._savedContextRuntimeData = null;
            this._perGraphContextSnapshots.clear();
            this._perGraphContextRuntimeData.clear();
            this._referenceLocationsByOccurrence = new WeakMap();
            this._restoredReferenceProvenance = null;
            this._skipNextOutgoingGraphSnapshot = true;
            this._lastSuccessfulSoundAssets.clear();
        }
        if (coordinator && editorOwned) {
            this._editorOwnedCoordinators.add(coordinator);
        }
        this._coordinator = coordinator;
        this._soundAssetChangedObserver = coordinator?.onSoundAssetChangedObservable.add(() => this.onSoundAssetsChanged.notifyObservers()) ?? null;
        this._exportValidationIssues = [];
        this._validationResult = null;
        this.onValidationResultChanged.notifyObservers(null);
        this.onSoundAssetsChanged.notifyObservers();
        if (activate && coordinator && coordinator.flowGraphs.length > 0) {
            this._activeGraphIndex = 0;
            this._activateGraph(coordinator.flowGraphs[0]);
        }
    }

    /** Releases editor-owned subscriptions and restores patched host graph signals. */
    public dispose(): void {
        this._lifetimeGeneration++;
        this._unsubscribeDebugObservers();
        this._debugNewNodeObserver?.remove();
        this._debugNewNodeObserver = null;
        this._debugNodeRemovalObserver?.remove();
        this._debugNodeRemovalObserver = null;
        this._soundAssetChangedObserver?.remove();
        this._soundAssetChangedObserver = null;
    }

    /**
     * Captures the current editor lifetime for deferred work.
     * @returns current lifetime generation
     */
    public get lifetimeGeneration(): number {
        return this._lifetimeGeneration;
    }

    /**
     * Checks whether deferred work still belongs to the active editor coordinator.
     * @param coordinator coordinator captured when the work started
     * @param generation editor lifetime captured when the work started
     * @returns true while the work may safely update the coordinator
     */
    public isLifetimeCurrent(coordinator: FlowGraphCoordinator, generation: number): boolean {
        return this._coordinator === coordinator && this._lifetimeGeneration === generation;
    }

    /**
     * Updates an unconnected input default and any context values that still mirror the old default.
     * Context-specific overrides remain unchanged.
     * @param input input connection to update
     * @param value new editor value
     */
    public setUnconnectedInputValue<T>(input: FlowGraphDataConnection<T>, value: T): void {
        const previousValue = (input as any)._defaultValue as T;
        (input as any)._defaultValue = value;
        const updatedContexts: FlowGraphContext[] = [];

        for (let index = 0; index < this._flowGraph.contextCount; index++) {
            const context = this._flowGraph.getContext(index);
            if (!context) {
                continue;
            }
            if (!context._hasConnectionValue(input)) {
                updatedContexts.push(context);
            } else if (this._editableValuesMatch(context._getConnectionValue(input), previousValue)) {
                input.setValue(value, context);
                updatedContexts.push(context);
            }
        }
        this._updateSavedInputValues(input.uniqueId, previousValue, value);
        const ownerBlock = input._ownerBlock;
        if (!input.isConnected() && ownerBlock.getClassName() === "FlowGraphSoundEndedEventBlock" && this._flowGraph.state === FlowGraphState.Started) {
            const eventBlock = ownerBlock as FlowGraphEventBlock;
            for (const context of updatedContexts) {
                eventBlock._cancelPendingTasks(context);
                if (value) {
                    eventBlock._preparePendingTasks(context);
                }
            }
        }
        this._snapshotUserVariablesFrom();
    }

    private _updateSavedInputValues<T>(connectionId: string, previousValue: T, value: T): void {
        const updateRuntime = (contexts: Array<{ connectionValues: { [key: string]: any } }> | null) => {
            const updatedIndexes = new Set<number>();
            contexts?.forEach((context, index) => {
                if (connectionId in context.connectionValues && this._editableValuesMatch(context.connectionValues[connectionId], previousValue)) {
                    context.connectionValues[connectionId] = value;
                    updatedIndexes.add(index);
                }
            });
            return updatedIndexes;
        };
        const updateSerialized = (contexts: any[] | null, updatedIndexes: Set<number>) => {
            const serializedValue = SerializeEditorValue(value);
            contexts?.forEach((context, index) => {
                const connectionValues = context._connectionValues;
                if (updatedIndexes.has(index) && connectionValues && connectionId in connectionValues) {
                    connectionValues[connectionId] = serializedValue;
                    this._rememberSerializedReferenceLocations(value, serializedValue);
                }
            });
        };
        const runtimeSnapshots = this._perGraphContextRuntimeData.get(this._flowGraph.uniqueId) ?? null;
        const updatedIndexes = updateRuntime(runtimeSnapshots);
        updateSerialized(this._savedContextSnapshots, updatedIndexes);
        updateSerialized(this._perGraphContextSnapshots.get(this._flowGraph.uniqueId) ?? null, updatedIndexes);
    }

    private _editableValuesMatch(left: unknown, right: unknown): boolean {
        if (Object.is(left, right)) {
            return true;
        }
        if (Array.isArray(left) && Array.isArray(right)) {
            return left.length === right.length && left.every((value, index) => this._editableValuesMatch(value, right[index]));
        }
        if (left && right && typeof left === "object" && typeof right === "object") {
            const leftReference = left as { uniqueId?: number; id?: string; name?: string; className?: string; getClassName?: () => string; getScene?: () => Scene };
            const rightReference = right as { uniqueId?: number; id?: string; name?: string; className?: string; getClassName?: () => string; getScene?: () => Scene };
            if (leftReference.uniqueId !== undefined || rightReference.uniqueId !== undefined) {
                if (
                    leftReference.uniqueId !== rightReference.uniqueId ||
                    leftReference.id !== rightReference.id ||
                    leftReference.name !== rightReference.name ||
                    (leftReference.getClassName?.() ?? leftReference.className) !== (rightReference.getClassName?.() ?? rightReference.className)
                ) {
                    return false;
                }
                const leftIsLive = typeof leftReference.getScene === "function";
                const rightIsLive = typeof rightReference.getScene === "function";
                if (leftIsLive && rightIsLive) {
                    return false;
                }
                if (leftIsLive !== rightIsLive) {
                    const leftLocation = this._getReferenceLocation(leftReference);
                    const rightLocation = this._getReferenceLocation(rightReference);
                    return !!leftLocation && !!rightLocation && this._referenceLocationsMatch(leftLocation, rightLocation);
                }
                return true;
            }
            if (leftReference.id !== undefined || rightReference.id !== undefined || leftReference.name !== undefined || rightReference.name !== undefined) {
                return leftReference.id === rightReference.id && leftReference.name === rightReference.name;
            }
        }
        return false;
    }

    /**
     * Adds or replaces a named sound asset on the active coordinator.
     * @param asset sound asset declaration
     */
    public async addSoundAssetAsync(asset: IFlowGraphSoundAsset): Promise<void> {
        if (!this._coordinator) {
            throw new Error("No flow graph coordinator is available.");
        }
        try {
            await this._coordinator.addSoundAssetAsync(asset);
        } catch (error) {
            // Failed loads remain declared by the coordinator and must still be manageable in the panel.
            this.onSoundAssetsChanged.notifyObservers();
            throw error;
        }
    }

    /**
     * Removes a named sound asset from the active coordinator.
     * Name-based block references are intentionally left unchanged.
     * @param name sound asset name
     */
    public removeSoundAsset(name: string): void {
        this.beginSoundAssetOperation(name, true);
        this._lastSuccessfulSoundAssets.delete(name);
        this._coordinator?.removeSoundAsset(name);
    }

    /**
     * Gets the last sound declaration known to have loaded successfully.
     * @param coordinator coordinator that owns the declaration
     * @param name sound asset name
     * @returns stable rollback declaration, if one exists
     */
    public getSoundAssetRollback(coordinator: FlowGraphCoordinator, name: string): IFlowGraphSoundAsset | undefined {
        const current = coordinator.soundAssets.find((asset) => asset.name === name);
        if (current && coordinator.getSoundAsset(name)) {
            this._lastSuccessfulSoundAssets.set(name, current);
            return current;
        }
        const cached = this._lastSuccessfulSoundAssets.get(name);
        if (cached) {
            return cached;
        }
        if (current) {
            this._lastSuccessfulSoundAssets.set(name, current);
        }
        return current;
    }

    /**
     * Records a sound declaration after its audio loaded successfully.
     * @param asset loaded sound declaration
     */
    public markSoundAssetLoaded(asset: IFlowGraphSoundAsset): void {
        this._lastSuccessfulSoundAssets.set(asset.name, { ...asset });
    }

    /**
     * Starts a sound-asset operation and invalidates earlier work for the same name.
     * @param name sound asset name
     * @param removed whether this operation removes the asset
     * @returns operation token
     */
    public beginSoundAssetOperation(name: string, removed = false): number {
        const token = (this._soundAssetOperations.get(name)?.token ?? 0) + 1;
        this._soundAssetOperations.set(name, { token, removed });
        return token;
    }

    /**
     * Checks whether a sound-asset operation is still the newest operation for its name.
     * @param name sound asset name
     * @param token operation token
     * @returns whether this is the current operation
     */
    public isSoundAssetOperationCurrent(name: string, token: number): boolean {
        return this._soundAssetOperations.get(name)?.token === token;
    }

    /**
     * Checks whether a newer remove operation superseded a sound import.
     * @param name sound asset name
     * @param token import operation token
     * @returns whether a later operation removed the asset
     */
    public wasSoundAssetRemovedAfter(name: string, token: number): boolean {
        const operation = this._soundAssetOperations.get(name);
        return !!operation && operation.token !== token && operation.removed;
    }

    /**
     * Returns whether a coordinator's lifecycle belongs to this editor.
     * @param coordinator coordinator to inspect
     * @returns true when the editor created and may dispose the coordinator
     */
    public isCoordinatorEditorOwned(coordinator: Nullable<FlowGraphCoordinator>): boolean {
        return !!coordinator && this._editorOwnedCoordinators.has(coordinator);
    }

    /**
     * Gets the index of the currently active graph.
     */
    public get activeGraphIndex(): number {
        return this._activeGraphIndex;
    }

    /**
     * Sets the active graph index, switching the editor to display that graph.
     */
    public set activeGraphIndex(index: number) {
        if (!this._coordinator) {
            return;
        }
        const graphs = this._coordinator.flowGraphs;
        if (index < 0 || index >= graphs.length) {
            return;
        }
        if (index === this._activeGraphIndex && this._flowGraph === graphs[index]) {
            return;
        }
        this._activeGraphIndex = index;
        this._activateGraph(graphs[index]);
    }

    /**
     * Adds a new empty graph to the coordinator and switches to it.
     * @returns the newly created FlowGraph
     */
    public addGraph(): FlowGraph {
        let coordinator = this._coordinator;
        if (!coordinator) {
            coordinator = new FlowGraphCoordinator({ scene: this.scene });
            this.setCoordinator(coordinator, true);
        }
        const graph = coordinator.createGraph();
        this._activeGraphIndex = coordinator.flowGraphs.indexOf(graph);
        this._activateGraph(graph);
        this.onGraphListChanged.notifyObservers();
        return graph;
    }

    /**
     * Removes a graph from the coordinator by index.
     * If the active graph is removed, switches to the nearest remaining graph.
     * The last graph cannot be removed.
     * @param index - the index of the graph to remove
     * @returns true if the graph was removed
     */
    public removeGraph(index: number): boolean {
        if (!this._coordinator) {
            return false;
        }
        const graphs = this._coordinator.flowGraphs;
        if (graphs.length <= 1 || index < 0 || index >= graphs.length) {
            return false;
        }
        const graph = graphs[index];
        this._coordinator.removeGraph(graph);
        // Adjust active index to keep the same graph selected when possible
        if (index < this._activeGraphIndex) {
            // Removed a graph before the active one — shift index down
            this._activeGraphIndex--;
        } else if (index === this._activeGraphIndex) {
            // Removed the active graph — select the nearest remaining
            if (this._activeGraphIndex >= graphs.length) {
                this._activeGraphIndex = graphs.length - 1;
            }
            this._activateGraph(graphs[this._activeGraphIndex]);
        }
        this.forgetGraphSnapshots(graph.uniqueId);
        // If index > _activeGraphIndex, no adjustment needed (active graph unchanged)
        this.onGraphListChanged.notifyObservers();
        return true;
    }

    /**
     * Renames a graph.
     * @param index - the index of the graph to rename
     * @param name - the new name
     */
    public renameGraph(index: number, name: string): void {
        if (!this._coordinator) {
            return;
        }
        const graphs = this._coordinator.flowGraphs;
        if (index < 0 || index >= graphs.length) {
            return;
        }
        graphs[index].name = name;
        this.onGraphListChanged.notifyObservers();
    }

    /**
     * Internal: activate a graph — wire scene context, stop old graph, notify observers.
     * This contains the same wiring logic that was previously in the `flowGraph` setter.
     * @param graph - the graph to activate
     */
    private _activateGraph(graph: FlowGraph): void {
        // Let observers (e.g. graphEditor) persist canvas state before the switch
        if (this._flowGraph && !this._skipNextOutgoingGraphSnapshot) {
            // Snapshot user variables/contexts for the outgoing graph so they
            // survive the stop() that the flowGraph setter triggers.
            this._snapshotUserVariablesFrom(this._flowGraph);
            this.onBeforeActiveGraphChanged.notifyObservers(this._flowGraph);
        }
        this._skipNextOutgoingGraphSnapshot = false;
        // Use the existing setter which does all the wiring
        this.flowGraph = graph;
        this.onActiveGraphChanged.notifyObservers(graph);
    }

    // ── Validation ─────────────────────────────────────────────────────
    /** Whether live validation is enabled (re-validates on graph changes). */
    private _liveValidation: boolean = true;
    /** Observable triggered when live validation mode changes. */
    onLiveValidationChanged = new Observable<boolean>();
    /** The latest validation result. Null if validation has not run yet. */
    private _validationResult: Nullable<IFlowGraphValidationResult> = null;
    /** Export diagnostics collected by the latest KHR_interactivity export attempt. */
    private _exportValidationIssues: IFlowGraphValidationIssue[] = [];
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
        const additionalIssues: IFlowGraphValidationIssue[] = [...this._exportValidationIssues];
        for (const block of allBlocks) {
            if (block.getClassName() === "FlowGraphUnsupportedInteractivityBlock") {
                const operation = String((block.config as any)?.operation ?? "unknown operation");
                additionalIssues.push({
                    severity: FlowGraphValidationSeverity.Warning,
                    message: `KHR_interactivity operation "${operation}" has no runtime implementation and is preserved as an unsupported block.`,
                    block,
                });
            }
        }
        for (const issue of additionalIssues) {
            this._validationResult.issues.push(issue);
            if (issue.block) {
                const blockIssues = this._validationResult.issuesByBlock.get(issue.block.uniqueId) ?? [];
                blockIssues.push(issue);
                this._validationResult.issuesByBlock.set(issue.block.uniqueId, blockIssues);
            }
        }
        this._validationResult.issues.sort((a, b) => a.severity - b.severity);
        this._validationResult.errorCount = this._validationResult.issues.filter((issue) => issue.severity === FlowGraphValidationSeverity.Error).length;
        this._validationResult.warningCount = this._validationResult.issues.filter((issue) => issue.severity === FlowGraphValidationSeverity.Warning).length;
        this._validationResult.isValid = this._validationResult.errorCount === 0;
        this.onValidationResultChanged.notifyObservers(this._validationResult);
    }

    /**
     * Replaces the KHR export diagnostics surfaced by graph validation.
     * @param diagnostics export diagnostics, or an empty array after a successful export
     */
    public setExportValidationDiagnostics(diagnostics: { path: string; message: string }[]): void {
        this._exportValidationIssues = diagnostics.map((diagnostic) => ({
            severity: FlowGraphValidationSeverity.Error,
            message: `KHR_interactivity export error at ${diagnostic.path}: ${diagnostic.message}`,
        }));
        this.runValidation();
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
     * Cancel any pending debounced validation.
     * Call this during teardown to prevent validation from firing after cleanup.
     */
    public cancelPendingValidation(): void {
        if (this._validationDebounceTimer !== null) {
            clearTimeout(this._validationDebounceTimer);
            this._validationDebounceTimer = null;
        }
    }

    /**
     * Undo any mutations the editor applied to the live flow graph so it is left in the same shape
     * it had before the editor opened. Critical for host mode, where the graph belongs to a running
     * application: without this, the editor's `createContext` wrapper would outlive the editor and
     * keep re-injecting editor snapshot data into contexts the application creates later.
     * Call this during teardown.
     */
    public restoreLiveGraph(): void {
        if (this._originalCreateContext && this._flowGraph) {
            this._flowGraph.createContext = this._originalCreateContext;
            this._originalCreateContext = null;
        }
    }

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
    /** Observable triggered when the selected context index changes */
    onSelectedContextChanged = new Observable<number>();
    /** The index of the context to observe in debug mode (0 = first context) */
    private _selectedContextIndex: number = 0;

    /** Get the currently selected execution context index */
    public get selectedContextIndex(): number {
        return this._selectedContextIndex;
    }

    /** Set the selected execution context index.
     * Switches debug/breakpoint observers to the new context.
     */
    public set selectedContextIndex(value: number) {
        if (value === this._selectedContextIndex) {
            return;
        }
        this._selectedContextIndex = value;
        // Re-attach debug observers to the new context if debug mode is active
        if (this._isDebugMode && this._flowGraph?.state === FlowGraphState.Started) {
            this._attachContextExecutionObserver();
        }
        this.onSelectedContextChanged.notifyObservers(value);
    }

    /** Observer tracking node execution for debug highlighting */
    private _debugExecutionObserver: Nullable<Observer<FlowGraphBlock>> = null;
    /** Observer tracking graph state changes for debug re-subscription */
    private _debugStateObserver: Nullable<Observer<FlowGraphState>> = null;
    /** Observer tracking event blocks added while debug instrumentation is active. */
    private _debugNewNodeObserver: Nullable<Observer<GraphNode>> = null;
    /** Observer tracking event blocks removed while debug instrumentation is active. */
    private _debugNodeRemovalObserver: Nullable<Observer<GraphNode>> = null;
    /** Per-node throttle timestamps to avoid excessive highlighting */
    private _highlightThrottleMap = new Map<string, number>();
    /** Blocks that executed since the last debug frame — batched to avoid per-call DOM work */
    private _debugPendingBlocks = new Set<FlowGraphBlock>();
    /** Restores event signal methods patched for accurate debug event logging. */
    private _debugEventSignalRestorers = new Map<string, Array<() => void>>();
    /** rAF handle for batched debug updates */
    private _debugRafId: number = 0;
    /** Port elements currently glowing — tracked so we can clear them on stop */
    private _activePortHighlights = new Set<HTMLElement>();
    /** Minimum interval between highlight pulses per node (ms) */
    private static readonly _HIGHLIGHT_THROTTLE_MS = 100;
    /** Maximum number of nodes to process per rAF frame to keep the editor responsive */
    private static readonly _MAX_HIGHLIGHTS_PER_FRAME = 30;
    /** Whether the debug pulse CSS has been injected into a given document */
    private static _DebugStyleInjectedDocs = new WeakSet<Document>();
    /** Monotonically increasing counter toggled on port elements to restart CSS animation without forced reflow */
    private _pulseGeneration = 0;

    /**
     * Inject the CSS keyframe animation for port pulsing (once per document).
     * Uses two alternating animation names keyed by a `data-debug-gen` attribute
     * so we can restart the animation by toggling the attribute value — no forced
     * reflow (`void el.offsetWidth`) needed.
     * @param doc - the document to inject the style into
     */
    private static _InjectDebugStyle(doc: Document): void {
        if (GlobalState._DebugStyleInjectedDocs.has(doc)) {
            return;
        }
        GlobalState._DebugStyleInjectedDocs.add(doc);
        const style = doc.createElement("style");
        style.textContent = `
            @keyframes debug-port-pulse-a {
                0%   { box-shadow: 0 0 8px 4px #33B766; }
                16%  { box-shadow: 0 0 8px 4px #33B766; }
                100% { box-shadow: none; }
            }
            @keyframes debug-port-pulse-b {
                0%   { box-shadow: 0 0 8px 4px #33B766; }
                16%  { box-shadow: 0 0 8px 4px #33B766; }
                100% { box-shadow: none; }
            }
            [data-debug-gen="0"] {
                animation: debug-port-pulse-a 600ms ease-out forwards;
            }
            [data-debug-gen="1"] {
                animation: debug-port-pulse-b 600ms ease-out forwards;
            }
        `;
        doc.head.appendChild(style);
    }

    /**
     * Apply a brief green glow to a port connector element.
     * Uses a generation toggle to restart the CSS animation without forcing reflow.
     * @param el - the port HTML element to pulse
     */
    private _pulsePortElement(el: HTMLElement): void {
        GlobalState._InjectDebugStyle(el.ownerDocument);
        // Toggle between "0" and "1" to switch animation names → restarts
        // the CSS animation without needing void el.offsetWidth (forced reflow).
        el.dataset.debugGen = String(this._pulseGeneration & 1);
        this._activePortHighlights.add(el);
    }

    /** Immediately clear all active port highlights */
    private _clearAllPortHighlights(): void {
        for (const el of this._activePortHighlights) {
            delete el.dataset.debugGen;
        }
        this._activePortHighlights.clear();
    }

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

        if (!this._flowGraph) {
            return;
        }

        // Listen for graph state changes so we can (re-)attach to the context
        // when the graph starts (contexts may not exist until start() is called).
        this._debugStateObserver = this._flowGraph.onStateChangedObservable.add((state) => {
            if (state === FlowGraphState.Started) {
                this._attachContextExecutionObserver();
            } else if (state === FlowGraphState.Stopped) {
                // Detach the per-context observer but keep the state observer alive
                this._debugExecutionObserver?.remove();
                this._debugExecutionObserver = null;
                this._restoreDebugEventSignals();
                this._highlightThrottleMap.clear();
                this._clearAllPortHighlights();
            }
        });

        // If the graph is already running, attach immediately
        if (this._flowGraph.state === FlowGraphState.Started) {
            this._attachContextExecutionObserver();
        }
    }

    /** Attach the execution observer to the currently selected context */
    private _attachContextExecutionObserver(): void {
        this._debugExecutionObserver?.remove();
        this._debugExecutionObserver = null;
        this._highlightThrottleMap.clear();
        this._debugPendingBlocks.clear();

        const context = this._flowGraph?.getContext(this.selectedContextIndex);
        if (!context) {
            return;
        }

        // Install breakpoint predicate when attaching to a context
        this._installBreakpointPredicate(context);
        this._patchDebugEventSignals();

        // Event entries are emitted by patched event output signals so data-output reads
        // cannot be mistaken for another event dispatch. Other blocks are logged here.
        this._debugExecutionObserver = context.onNodeExecutedObservable.add((block) => {
            this._debugPendingBlocks.add(block);
            if (!(block instanceof FlowGraphEventBlock)) {
                this.onDebugLogRequiredObservable.notifyObservers({
                    message: `Block ran: ${block.name ?? block.getClassName()}`,
                    block,
                });
            }
            if (!this._debugRafId) {
                this._debugRafId = requestAnimationFrame(() => this._flushDebugHighlights());
            }
        });
    }

    private _patchDebugEventSignals(): void {
        this._restoreDebugEventSignals();
        this._flowGraph?.visitAllBlocks((block) => {
            if (!(block instanceof FlowGraphEventBlock)) {
                return;
            }
            const specializedOutputs = block.signalOutputs.filter((signal) => signal.name !== "out" && signal.name !== "done" && signal.name !== "error");
            const eventOutputs = specializedOutputs.length > 0 ? specializedOutputs : block.signalOutputs.filter((signal) => signal.name === "out");
            const restorers: Array<() => void> = [];
            for (const signal of eventOutputs) {
                const originalActivateSignal = signal._activateSignal;
                const patchedActivateSignal = (context: FlowGraphContext) => {
                    if (context === this._flowGraph?.getContext(this.selectedContextIndex)) {
                        const suffix = specializedOutputs.length > 1 ? ` (${signal.name})` : "";
                        this.onDebugLogRequiredObservable.notifyObservers({
                            message: `Event fired: ${block.name ?? block.getClassName()}${suffix}`,
                            block,
                        });
                    }
                    originalActivateSignal.call(signal, context);
                };
                signal._activateSignal = patchedActivateSignal;
                restorers.push(() => {
                    if (signal._activateSignal === patchedActivateSignal) {
                        signal._activateSignal = originalActivateSignal;
                    }
                });
            }
            this._debugEventSignalRestorers.set(block.uniqueId, restorers);
        });
    }

    private _restoreDebugEventSignals(block?: FlowGraphBlock): void {
        const restorers = block ? (this._debugEventSignalRestorers.get(block.uniqueId) ?? []) : [...this._debugEventSignalRestorers.values()].flat();
        for (const restore of restorers) {
            restore();
        }
        if (block) {
            this._debugEventSignalRestorers.delete(block.uniqueId);
        } else {
            this._debugEventSignalRestorers.clear();
        }
    }

    /**
     * Process all pending debug highlights in a single batched DOM pass.
     * Performance safeguards for large graphs (100+ blocks):
     * - Per-frame cap: only _MAX_HIGHLIGHTS_PER_FRAME nodes are updated per rAF call
     * - Viewport culling: offscreen nodes skip all DOM work
     * - No forced reflows: port pulse uses generation-toggle CSS trick
     * - No graphNode.refresh(): only the execution-time label is updated
     * - Link animations are skipped for offscreen nodes
     */
    private _flushDebugHighlights(): void {
        this._debugRafId = 0;
        const now = performance.now();
        // Advance the pulse generation so CSS animation restarts via attribute toggle
        this._pulseGeneration++;

        let processed = 0;
        for (const block of this._debugPendingBlocks) {
            if (processed >= GlobalState._MAX_HIGHLIGHTS_PER_FRAME) {
                // Leave remaining blocks for the next frame
                break;
            }

            const lastTime = this._highlightThrottleMap.get(block.uniqueId) ?? 0;
            if (now - lastTime < GlobalState._HIGHLIGHT_THROTTLE_MS) {
                // Remove throttled blocks so they don't carry over
                this._debugPendingBlocks.delete(block);
                continue;
            }
            this._highlightThrottleMap.set(block.uniqueId, now);

            if (!this.onGetNodeFromBlock) {
                this._debugPendingBlocks.delete(block);
                continue;
            }
            const graphNode = this.onGetNodeFromBlock(block);
            if (!graphNode) {
                this._debugPendingBlocks.delete(block);
                continue;
            }

            // Viewport culling — skip all DOM work for offscreen nodes
            if (!this.isNodeVisible(graphNode)) {
                this._debugPendingBlocks.delete(block);
                processed++;
                continue;
            }

            // Lightweight update: only refresh the execution time label
            // instead of the full graphNode.refresh() which touches innerHTML,
            // display manager, all ports, and all visual properties.
            const execTime = graphNode.content.executionTime ?? 0;
            if (execTime >= 0 && graphNode.executionTimeElement) {
                const formatted = `${execTime.toFixed(2)} ms`;
                if (graphNode.executionTimeElement.textContent !== formatted) {
                    graphNode.executionTimeElement.textContent = formatted;
                }
            }

            // Build lookup of this block's CONNECTED input connections (data + signal).
            const inputSet = new Set<unknown>();
            for (const dataIn of block.dataInputs) {
                if (dataIn.isConnected()) {
                    inputSet.add(dataIn);
                }
            }
            if (block instanceof FlowGraphExecutionBlock) {
                for (const sig of block.signalInputs) {
                    if (sig.isConnected() && now - (sig as FlowGraphSignalConnection)._lastActivationTime < GlobalState._HIGHLIGHT_THROTTLE_MS) {
                        inputSet.add(sig);
                    }
                }
            }

            // Pulse the port connector dots for each triggered input
            for (const port of graphNode.inputPorts) {
                if (inputSet.has(port.portData.data)) {
                    this._pulsePortElement(port.element);
                }
            }

            // Pulse output signal ports that actually fired (recently)
            const firedOutputs = new Set<unknown>();
            if (block instanceof FlowGraphExecutionBlock) {
                for (const sig of block.signalOutputs) {
                    if (sig.isConnected() && now - (sig as FlowGraphSignalConnection)._lastActivationTime < GlobalState._HIGHLIGHT_THROTTLE_MS) {
                        firedOutputs.add(sig);
                    }
                }
                for (const port of graphNode.outputPorts) {
                    if (firedOutputs.has(port.portData.data)) {
                        this._pulsePortElement(port.element);
                    }
                }
            }

            // Animate traveling dot on links (only for visible nodes)
            for (const link of graphNode.links) {
                if (link.portB && inputSet.has(link.portB.portData.data)) {
                    link.triggerFlowAnimation();
                }
                if (link.portA && firedOutputs.has(link.portA.portData.data)) {
                    link.triggerFlowAnimation();
                }
            }

            this._debugPendingBlocks.delete(block);
            processed++;
        }

        // If there are still pending blocks, schedule another frame
        if (this._debugPendingBlocks.size > 0 && !this._debugRafId) {
            this._debugRafId = requestAnimationFrame(() => this._flushDebugHighlights());
        }
    }

    /** Unsubscribe from debug execution observers */
    private _unsubscribeDebugObservers(): void {
        this._debugExecutionObserver?.remove();
        this._debugExecutionObserver = null;
        this._restoreDebugEventSignals();
        this._debugStateObserver?.remove();
        this._debugStateObserver = null;
        this._highlightThrottleMap.clear();
        this._debugPendingBlocks.clear();
        if (this._debugRafId) {
            cancelAnimationFrame(this._debugRafId);
            this._debugRafId = 0;
        }
        this._clearAllPortHighlights();
        this._removeBreakpointPredicate();
    }

    // ── Breakpoints ────────────────────────────────────────────────────
    /** Set of block uniqueIds that have breakpoints */
    private _breakpointBlockIds = new Set<string>();
    /** Observer for breakpoint-hit events on the current context */
    private _breakpointHitObserver: Nullable<Observer<IFlowGraphPendingActivation>> = null;
    /** Observable fired when the set of breakpoints changes (add/remove/clear) */
    onBreakpointsChanged = new Observable<void>();
    /** Observable fired when a breakpoint is hit (carries the paused activation) */
    onBreakpointHit = new Observable<IFlowGraphPendingActivation>();

    /**
     * Check whether a block has a breakpoint set
     * @param blockId - the unique id of the block
     * @returns true if the block has a breakpoint
     */
    public hasBreakpoint(blockId: string): boolean {
        return this._breakpointBlockIds.has(blockId);
    }

    /**
     * Toggle a breakpoint on a block.
     * @param blockId - the unique id of the block
     * @returns the new state (true = breakpoint set, false = removed)
     */
    public toggleBreakpoint(blockId: string): boolean {
        if (this._breakpointBlockIds.has(blockId)) {
            this._breakpointBlockIds.delete(blockId);
            this.onBreakpointsChanged.notifyObservers();
            return false;
        }
        this._breakpointBlockIds.add(blockId);
        this.onBreakpointsChanged.notifyObservers();
        return true;
    }

    /** Remove all breakpoints */
    public clearAllBreakpoints(): void {
        if (this._breakpointBlockIds.size === 0) {
            return;
        }
        this._breakpointBlockIds.clear();
        this.onBreakpointsChanged.notifyObservers();
    }

    /**
     * Install the breakpoint predicate on the given context
     * @param context - the flow graph context to install the predicate on
     */
    private _installBreakpointPredicate(context: FlowGraphContext): void {
        // Set the predicate
        context.breakpointPredicate = (block) => this._breakpointBlockIds.has(block.uniqueId);
        // Subscribe to breakpoint-hit events
        this._breakpointHitObserver?.remove();
        this._breakpointHitObserver = context.onBreakpointHitObservable.add((activation) => {
            this.onBreakpointHit.notifyObservers(activation);
        });
    }

    /** Remove the breakpoint predicate from the current context */
    private _removeBreakpointPredicate(): void {
        this._breakpointHitObserver?.remove();
        this._breakpointHitObserver = null;
        const ctx = this._flowGraph?.getContext(this.selectedContextIndex);
        if (ctx) {
            ctx.breakpointPredicate = null;
            ctx._clearPendingActivation();
        }
    }

    /** Resume execution from a breakpoint */
    public continueExecution(): void {
        const ctx = this._flowGraph?.getContext(this.selectedContextIndex);
        ctx?.continueExecution();
        this.onBreakpointsChanged.notifyObservers();
    }

    /** Step one block and pause again */
    public stepExecution(): void {
        const ctx = this._flowGraph?.getContext(this.selectedContextIndex);
        ctx?.stepExecution();
        if (!ctx?.pendingActivation) {
            this.onBreakpointsChanged.notifyObservers();
        }
    }

    // ── Execution Context Management ───────────────────────────────────
    /** Observable triggered when a context is added or removed */
    onContextListChanged = new Observable<void>();

    /**
     * Create a new execution context on the current flow graph.
     * Assigns a default name like "Context N".
     * @returns the index of the newly created context, or -1 if no graph
     */
    public createNewContext(): number {
        if (!this._flowGraph) {
            return -1;
        }
        const ctx = this._flowGraph.createContext();
        const index = this._flowGraph.contextCount - 1;
        ctx.name = `Context ${index}`;
        // Copy the assets context from the scene if available
        if (this.sceneContext?.scene) {
            ctx.assetsContext = this.sceneContext.scene;
        }
        this.onContextListChanged.notifyObservers();
        return index;
    }

    /**
     * Remove an execution context by index.
     * If the removed context was the selected one, selects the nearest remaining context.
     * @param index - the index of the context to remove
     * @returns true if removed successfully
     */
    public removeContextAt(index: number): boolean {
        if (!this._flowGraph) {
            return false;
        }
        // Don't allow removing the last context
        if (this._flowGraph.contextCount <= 1) {
            return false;
        }
        const removed = this._flowGraph.removeContext(index);
        if (!removed) {
            return false;
        }
        // Adjust selection
        if (this._selectedContextIndex >= this._flowGraph.contextCount) {
            this._selectedContextIndex = this._flowGraph.contextCount - 1;
        }
        if (this._isDebugMode && this._flowGraph.state === FlowGraphState.Started) {
            this._attachContextExecutionObserver();
        }
        this.onContextListChanged.notifyObservers();
        this.onSelectedContextChanged.notifyObservers(this._selectedContextIndex);
        return true;
    }

    /**
     * Rename an execution context.
     * @param index - the index of the context
     * @param name - the new name
     */
    public renameContext(index: number, name: string): void {
        const ctx = this._flowGraph?.getContext(index);
        if (ctx) {
            ctx.name = name;
            this.onContextListChanged.notifyObservers();
        }
    }

    /**
     * Get a summary of all execution contexts (index, uniqueId, name).
     * @returns an array of context info objects
     */
    public getContextList(): Array<{ index: number; uniqueId: string; name: string }> {
        const result: Array<{ index: number; uniqueId: string; name: string }> = [];
        if (!this._flowGraph) {
            return result;
        }
        for (let i = 0; i < this._flowGraph.contextCount; i++) {
            const ctx = this._flowGraph.getContext(i);
            result.push({ index: i, uniqueId: ctx.uniqueId, name: ctx.name || `Context ${i}` });
        }
        return result;
    }

    /** The scene context populated when a Playground snippet is loaded */
    sceneContext: Nullable<SceneContext> = null;
    /** Canvas retained across scene-preview pane mounts so its engine and WebGL context remain usable. */
    scenePreviewCanvas: Nullable<HTMLCanvasElement> = null;
    /** The source used to create the current preview scene, if known. */
    sceneSource: "default" | "snippet" | "file" | "host" | null = null;
    /** Original GLB for source-preserving behavior authoring; cleared when the preview source changes. */
    sourceGlb: { file: File; companionFiles?: File[]; nodeCount: number; hasAnimations: boolean; authoredBehavior: boolean; externalResourceUris: string[] } | null = null;
    /** Retained glTF file used to apply behavior edits without serializing the preview scene. */
    sourceGltf: { file: File; externalResourceUris: string[] } | null = null;
    /** Observable triggered when the scene context changes (snippet loaded/disposed) */
    onSceneContextChanged = new Observable<Nullable<SceneContext>>();

    /** The snippet ID of the currently loaded scene (persisted in the serialized JSON) */
    snippetId: string = "";
    /** Observable triggered when the snippet ID changes (e.g. after deserialization) */
    onSnippetIdChanged = new Observable<string>();
    /** Observable triggered to request a snippet reload (e.g. from the Reset button) */
    onReloadSnippetRequested = new Observable<void>();

    /** The snippet ID of the flow graph itself (for save/load to snippet server) */
    flowGraphSnippetId: string = "";

    private _flowGraph: FlowGraph;
    private _sceneContextObserver: Nullable<Observer<Nullable<SceneContext>>> = null;
    private _originalCreateContext: Nullable<() => FlowGraphContext> = null;

    /**
     * Cached uniqueId → name lookup per asset type from the PREVIOUS scene.
     * Built eagerly when a scene context arrives so it survives scene disposal.
     */
    private _cachedOldIdToName: Map<string, Map<number, string>> | null = null;

    /** Cached position of each previous-scene node among nodes with the same identity. */
    private _cachedOldNodeLocations: Map<number, SceneReferenceLocation> | null = null;
    private _restoredReferenceProvenance: Map<number, SceneReferenceLocation[]> | null = null;
    private _referenceLocationsByOccurrence = new WeakMap<object, SceneReferenceLocation>();
    private readonly _soundAssetOperations = new Map<string, { token: number; removed: boolean }>();
    private readonly _lastSuccessfulSoundAssets = new Map<string, IFlowGraphSoundAsset>();

    /**
     * Saved user variables from the last execution context before setScene cleared it.
     * These are restored into the newly created context to preserve mesh references.
     */
    private _savedUserVariables: { [key: string]: any } | null = null;

    /**
     * Saved connection values (unconnected input defaults) from the last execution context
     * before setScene cleared it. These hold values like the "2" in a divide-by-2 block
     * that has no incoming connection on its "b" input.
     */
    private _savedConnectionValues: { [key: string]: any } | null = null;

    /**
     * Serialized snapshots of ALL execution contexts, taken before stop()/setScene()
     * clears them.  Used by SerializationTools.Serialize() to include context data
     * (user variables, variable types, connection values) in the saved JSON even
     * when the graph is stopped and has no live contexts.
     */
    private _savedContextSnapshots: any[] | null = null;

    /**
     * Per-graph serialized context snapshots, keyed by FlowGraph.uniqueId.
     * Used to preserve context data for inactive graphs during multi-graph serialization.
     */
    private _perGraphContextSnapshots = new Map<string, any[]>();
    private _perGraphContextRuntimeData = new Map<
        string,
        Array<{
            userVariables: { [key: string]: any };
            connectionValues: { [key: string]: any };
            variableTypes: { [key: string]: string };
            name: string;
            uniqueId: string;
        }>
    >();

    /**
     * Runtime (non-serialized) copies of each execution context's data.
     * Unlike _savedContextSnapshots (which holds serialized/JSON-safe values for
     * injecting into saved files), these hold actual runtime objects (Vector3,
     * Mesh references, etc.) so they can be restored directly into newly
     * created contexts without needing to re-parse.
     */
    private _savedContextRuntimeData: Array<{
        userVariables: { [key: string]: any };
        connectionValues: { [key: string]: any };
        variableTypes: { [key: string]: string };
        name: string;
        uniqueId: string;
    }> | null = null;

    /**
     * Gets the current flow graph
     */
    public get flowGraph(): FlowGraph {
        return this._flowGraph;
    }

    /**
     * Whether the given graph lives on the live host scene supplied to the editor. Such graphs
     * belong to a running application, so the editor must not stop or otherwise disrupt them.
     * @param graph - the graph to test
     * @returns true when the graph runs on the host scene
     */
    private _isHostGraph(graph: Nullable<FlowGraph>): boolean {
        return !!graph && !!this.hostScene && graph.scene === this.hostScene;
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

        // Stop the old graph to detach its event observer from the scene
        // coordinator.  Without this, the old graph's SceneDispose handler
        // could fire unexpectedly when the preview scene is reloaded.
        // Never stop a live host graph — it belongs to the running application.
        if (this._flowGraph && this._flowGraph !== flowGraph && !this._isHostGraph(this._flowGraph)) {
            if (this._flowGraph.state !== FlowGraphState.Stopped) {
                this._flowGraph.stop();
            }
        }

        this._flowGraph = flowGraph;

        if (!flowGraph) {
            return;
        }
        this._savedContextSnapshots = this._perGraphContextSnapshots.get(flowGraph.uniqueId) ?? null;
        this._savedContextRuntimeData = this._perGraphContextRuntimeData.get(flowGraph.uniqueId) ?? null;

        // Snapshot user variables so Start/Reset can restore them regardless of run state.
        // These variables (e.g. pickedMesh_0 from KHR_interactivity) are set during parsing and
        // would otherwise be lost when stop() empties execution contexts.
        this._snapshotUserVariablesFrom(flowGraph);

        // The editor normally forces a Stopped graph so it exclusively drives execution (the user
        // must press Start or Reset). A live host graph is exempt: halting it would freeze the
        // running application, and closing the editor would leave it permanently stopped.
        if (!this._isHostGraph(flowGraph) && (flowGraph.state === FlowGraphState.Started || flowGraph.state === FlowGraphState.Paused)) {
            flowGraph.stop();
        }

        // Wire the observer: when scene context changes, update all execution contexts
        // and re-point the flow graph's event coordinator at the new scene so that
        // scene-based events (e.g. SceneOnTick) fire correctly.
        this._sceneContextObserver = this.onSceneContextChanged.add((ctx) => {
            const assetsContainer: IAssetContainer | undefined = ctx?.scene;
            this._applyAssetsContextToGraph(assetsContainer);
            if (ctx?.scene) {
                // When attached to a live host scene, the graph is already authored against this
                // exact scene: its contexts, asset references, and engine belong to the running
                // application. Re-pointing/remapping or patching the host engine's timing would
                // corrupt the live graph, so only refresh the assets context above and stop here.
                if (this.sceneSource === "host") {
                    return;
                }

                // Patch the new engine's getDeltaTime to respect the current time scale
                this._originalGetDeltaTime = null; // reset so _applyEngineTimeScale stores the new engine's original
                this._applyEngineTimeScale();

                // Remap GetAsset block references from old uniqueIds to new ones
                // (uniqueId values change when a snippet is re-executed).
                // Uses the cached id→name map built from the previous scene
                // (the old scene is already disposed by the time this fires).
                this._remapAssetReferences(ctx.scene);

                // Snapshot user variables before setScene clears contexts —
                // they contain mesh references (pickedMesh_0 etc.) from
                // KHR_interactivity that must survive scene switches.
                this._snapshotUserVariables();
                const reboundDefaults = this._rebindSavedConnectionReferences(ctx.scene);

                if (typeof flowGraph.setScene === "function") {
                    flowGraph.setScene(ctx.scene);
                }
                this._restoreReboundDefaults(reboundDefaults);
                // Re-create contexts from snapshots so the editor UI has
                // live contexts after setScene() clears them.
                this._restoreContextsFromSnapshots(flowGraph);
                this._snapshotUserVariables();

                // Cache the NEW scene's node mappings for the next reload.
                this._cacheSceneIdToNameMap(ctx.scene);
            }
        });

        // Wrap createContext() so newly created contexts also inherit the loaded scene
        // and any saved user variables from the previous context.
        this._originalCreateContext = flowGraph.createContext.bind(flowGraph);
        const origCreate = this._originalCreateContext!;
        flowGraph.createContext = (): FlowGraphContext => {
            const ctx = origCreate();
            // Assign a default name if the context doesn't have one
            if (!ctx.name) {
                ctx.name = `Context ${flowGraph.contextCount - 1}`;
            }
            if (this.sceneContext) {
                ctx.assetsContext = this.sceneContext.scene;
            }
            // Restore full context data from the runtime snapshot matching
            // this context's index. This handles user variables, variable types,
            // connection values, and names for ALL contexts (not just the first).
            if (this._savedContextRuntimeData && this._savedContextRuntimeData.length > 0) {
                const ctxIndex = flowGraph.contextCount - 1;
                // Only restore from the exact matching index — do not fall back
                // to snapshot[0] to avoid silently restoring the wrong data
                // when contexts are removed or reordered.
                const runtimeData = this._savedContextRuntimeData[ctxIndex];
                if (runtimeData) {
                    for (const key in runtimeData.userVariables) {
                        ctx.setVariable(key, runtimeData.userVariables[key]);
                    }
                    const serializedSnapshot = this._savedContextSnapshots?.[ctxIndex];
                    if (serializedSnapshot?._userVariables) {
                        for (const key in serializedSnapshot._userVariables) {
                            const serializedVal = serializedSnapshot._userVariables[key];
                            if (serializedVal && typeof serializedVal === "object" && serializedVal.className && !ctx.userVariables[key]) {
                                ctx.setVariable(key, serializedVal);
                            }
                        }
                    }
                    for (const key in runtimeData.variableTypes) {
                        ctx.setVariableType(key, runtimeData.variableTypes[key]);
                    }
                    for (const key in runtimeData.connectionValues) {
                        ctx._setConnectionValueByKey(key, runtimeData.connectionValues[key]);
                    }
                    if (runtimeData.name) {
                        ctx.name = runtimeData.name;
                    }
                    if (runtimeData.uniqueId) {
                        ctx.uniqueId = runtimeData.uniqueId;
                    }
                }
            } else {
                // Legacy path: restore from flat saved variables (first context only)
                if (this._savedUserVariables) {
                    for (const key in this._savedUserVariables) {
                        ctx.setVariable(key, this._savedUserVariables[key]);
                    }
                    this._savedUserVariables = null;
                }
                if (this._savedConnectionValues) {
                    for (const key in this._savedConnectionValues) {
                        ctx._setConnectionValueByKey(key, this._savedConnectionValues[key]);
                    }
                    this._savedConnectionValues = null;
                }
            }
            // Resolve raw descriptor objects (e.g. {className:"Mesh",id:"x"})
            // into actual scene objects.  _rebindContextUserVariables only
            // works when execution contexts exist, so call it now that the
            // context has been created and populated.
            if (this.sceneContext?.scene) {
                this._rebindContextUserVariables(this.sceneContext.scene);
            }
            return ctx;
        };

        // If a scene context is already loaded, apply it immediately
        if (this.sceneContext) {
            this._applyAssetsContextToGraph(this.sceneContext.scene);
            // A live host scene owns the graph already; skip remapping/re-pointing (see the
            // scene-context observer above for the rationale) and only refresh the assets context.
            if (this.sceneSource !== "host") {
                // Remap asset references (animation groups, meshes, etc.) that
                // couldn't be resolved during parsing because the graph was parsed
                // against the editor's host scene, not the preview scene.
                this._remapAssetReferences(this.sceneContext.scene);
                const reboundDefaults = this._rebindSavedConnectionReferences(this.sceneContext.scene);
                if (typeof flowGraph.setScene === "function") {
                    flowGraph.setScene(this.sceneContext.scene);
                }
                this._restoreReboundDefaults(reboundDefaults);
                // Re-create contexts from snapshots so the editor UI has live
                // contexts to display (variables panel, context selector, etc.)
                this._restoreContextsFromSnapshots(flowGraph);
                this._snapshotUserVariables();
                this._cacheSceneIdToNameMap(this.sceneContext.scene);
            }
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
        if (!this._flowGraph) {
            return;
        }

        // Build a name → newUniqueId lookup per asset type from the new scene
        // (only needed for GetAsset block remapping)
        const hasOldIdCache = !!this._cachedOldIdToName;
        const nameLookup = hasOldIdCache
            ? new Map<string, Map<string, number>>([
                  ["Mesh", new Map(newScene.meshes.map((m) => [m.name, m.uniqueId]))],
                  ["Light", new Map(newScene.lights.map((l) => [l.name, l.uniqueId]))],
                  ["Camera", new Map(newScene.cameras.map((c) => [c.name, c.uniqueId]))],
                  ["Material", new Map(newScene.materials.map((m) => [m.name, m.uniqueId]))],
                  ["AnimationGroup", new Map(newScene.animationGroups.map((ag) => [ag.name, ag.uniqueId]))],
                  ["Animation", new Map(newScene.animations.map((a) => [a.name, a.uniqueId]))],
              ])
            : null;

        const oldIdToName = this._cachedOldIdToName;

        this._flowGraph.visitAllBlocks((block: FlowGraphBlock) => {
            const className = block.getClassName();

            // --- GetAsset blocks: remap index by uniqueId ---
            if (className === "FlowGraphGetAssetBlock") {
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

                let newId: number | undefined;

                if (oldIdToName && nameLookup) {
                    // Normal case: remap via the cached old-id→name→new-id lookup
                    const oldMap = oldIdToName.get(assetType);
                    const newMap = nameLookup.get(assetType);
                    if (oldMap && newMap) {
                        const name = oldMap.get(oldIndex);
                        if (name !== undefined) {
                            newId = newMap.get(name);
                        }
                    }
                }

                // Fallback for first load (no old cache): use the saved _assetName
                // to find the asset by name in the new scene.
                if (newId === undefined) {
                    const savedName: string | undefined = config._assetName;
                    if (savedName) {
                        const sceneList = this._getSceneListForAssetType(newScene, assetType);
                        const match = sceneList.find((a) => a.name === savedName);
                        if (match) {
                            newId = match.uniqueId;
                        }
                    }
                }

                if (newId === undefined) {
                    return;
                }

                config.index = new FlowGraphInteger(newId);
                const indexDC = (block as any).index;
                if (indexDC && "_defaultValue" in indexDC) {
                    indexDC._defaultValue = new FlowGraphInteger(newId);
                }
                return;
            }

            // --- Blocks with direct targetMesh references (MeshPick, PointerDown/Up/Move/Over/Out) ---
            this._rebindMeshReference(block, newScene);

            // --- PlayAnimation: rebind animationGroup and animation ---
            this._rebindAnimationGroupReference(block, newScene);
            this._rebindAnimationReference(block, newScene);
        });

        // --- Rebind mesh references stored in context user variables ---
        // KHR_interactivity stores mesh references in user variables (e.g. pickedMesh_0)
        // that feed MeshPickEvent blocks through GetVariable connections.
        this._rebindContextUserVariables(newScene);
    }

    /**
     * Returns scene objects for a given asset type string.
     * @param scene - the scene to pull objects from
     * @param assetType - the type of asset ("Mesh", "Light", etc.)
     * @returns a list of objects in the scene matching the given type, with their uniqueId and name
     */
    private _getSceneListForAssetType(scene: Scene, assetType: string): Array<{ uniqueId: number; name: string }> {
        switch (assetType) {
            case "Mesh":
                return scene.meshes;
            case "Light":
                return scene.lights;
            case "Camera":
                return scene.cameras;
            case "Material":
                return scene.materials;
            case "AnimationGroup":
                return scene.animationGroups;
            case "Animation":
                return scene.animations;
            default:
                return [];
        }
    }

    /**
     * Rebind a block's targetMesh / asset config + _defaultValue by name.
     * Covers MeshPickEventBlock and all pointer event blocks.
     * @param block - the block to rebind
     * @param newScene - the newly loaded scene to rebind against
     */
    private _rebindMeshReference(block: FlowGraphBlock, newScene: Scene): void {
        const meshInput = block.getDataInput("targetMesh") ?? block.getDataInput("asset");
        if (!meshInput) {
            return;
        }
        const currentMesh = (meshInput as any)._defaultValue;
        const isObjectRef = currentMesh != null && typeof currentMesh === "object";
        // Already pointing at a mesh in the new scene?
        if (isObjectRef && newScene.meshes.some((m) => m === currentMesh)) {
            return;
        }
        if (isObjectRef) {
            const reboundMesh = this._rebindSceneValue(currentMesh, newScene);
            if (reboundMesh !== currentMesh) {
                if (!block.config) {
                    (block as any).config = {};
                }
                (block.config as any).targetMesh = reboundMesh;
                (meshInput as any)._defaultValue = reboundMesh;
            }
            return;
        }
        const savedName: string | undefined = (block.config as any)?._meshName;
        const savedUniqueId: number | undefined = isObjectRef ? currentMesh.uniqueId : undefined;
        if (!savedName && savedUniqueId === undefined) {
            return;
        }
        // Filter by name, then prefer uniqueId match when multiple meshes share the same name
        const candidates = savedName ? newScene.meshes.filter((m) => m.name === savedName) : [];
        const match = candidates.length === 1 ? candidates[0] : savedUniqueId !== undefined ? candidates.find((m) => m.uniqueId === savedUniqueId) : candidates[0];
        if (match) {
            if (!block.config) {
                (block as any).config = {};
            }
            (block.config as any).targetMesh = match;
            (meshInput as any)._defaultValue = match;
        }
    }

    /**
     * Rebind a block's animationGroup config + _defaultValue by name.
     * @param block - the block to rebind
     * @param newScene - the newly loaded scene to rebind against
     */
    private _rebindAnimationGroupReference(block: FlowGraphBlock, newScene: Scene): void {
        const agInput = block.getDataInput("animationGroup");
        if (!agInput) {
            return;
        }
        const currentAg = (agInput as any)._defaultValue;
        // Already pointing at an animation group in the new scene?
        if (currentAg && typeof currentAg === "object" && newScene.animationGroups.some((ag) => ag === currentAg)) {
            return;
        }
        const savedName: string | undefined = (block.config as any)?._animationGroupName ?? (currentAg && typeof currentAg === "object" ? currentAg.name : undefined);
        if (!savedName) {
            return;
        }
        const match = newScene.animationGroups.find((ag) => ag.name === savedName);
        if (match) {
            if (!block.config) {
                (block as any).config = {};
            }
            (block.config as any).animationGroup = match;
            (agInput as any)._defaultValue = match;
        }
    }

    /**
     * Rebind a block's animation config + _defaultValue by name.
     * @param block - the block to rebind
     * @param newScene - the newly loaded scene to rebind against
     */
    private _rebindAnimationReference(block: FlowGraphBlock, newScene: Scene): void {
        const animInput = block.getDataInput("animation");
        if (!animInput) {
            return;
        }
        const currentAnim = (animInput as any)._defaultValue;
        // Already pointing at an animation in the new scene?
        if (currentAnim && typeof currentAnim === "object" && newScene.animations.some((a) => a === currentAnim)) {
            return;
        }
        const savedName: string | undefined = (block.config as any)?._animationName ?? (currentAnim && typeof currentAnim === "object" ? currentAnim.name : undefined);
        if (!savedName) {
            return;
        }
        const match = newScene.animations.find((a) => a.name === savedName);
        if (match) {
            if (!block.config) {
                (block as any).config = {};
            }
            (animInput as any)._defaultValue = match;
        }
    }

    /**
     * Rebind mesh and transform node references stored in context user variables.
     * KHR_interactivity stores references like pickedMesh_0 in context._userVariables
     * which are read by GetVariable blocks to feed MeshPickEvent.asset.
     * When the scene changes, these references become stale and need updating.
     * @param newScene - the newly loaded scene to resolve references against
     */
    private _rebindContextUserVariables(newScene: Scene): void {
        if (!this._flowGraph) {
            return;
        }

        const allMeshesAndNodes = [...newScene.meshes, ...newScene.transformNodes];

        const ctxCount = (this._flowGraph as any)._executionContexts?.length ?? 0;
        for (let i = 0; i < ctxCount; i++) {
            const context = this._flowGraph.getContext(i);
            if (!context) {
                continue;
            }
            const vars = context.userVariables;
            for (const key in vars) {
                const value = vars[key];
                if (!value || typeof value !== "object") {
                    continue;
                }
                // Check if this is a stale mesh/transform node reference (raw descriptor object
                // that wasn't resolved during parsing, or a reference to a disposed/wrong-scene mesh)
                const isUnresolved = value.className && (value.id || value.name) && typeof value.getClassName !== "function";
                const isStaleRef = typeof value.getClassName === "function" && !allMeshesAndNodes.some((m) => m === value);

                if (isUnresolved || isStaleRef) {
                    const name = value.name ?? (typeof value.getClassName === "function" ? value.name : undefined);
                    const id = value.id ?? (typeof value.getClassName === "function" ? value.id : undefined);
                    const uid: number | undefined = value.uniqueId;

                    // Filter candidates by id first, then by name
                    let candidates = id ? allMeshesAndNodes.filter((m) => m.id === id) : [];
                    if (candidates.length === 0 && name) {
                        candidates = allMeshesAndNodes.filter((m) => m.name === name);
                    }

                    // Prefer uniqueId match when multiple candidates share the same id/name
                    const match = candidates.length === 1 ? candidates[0] : uid !== undefined ? candidates.find((m) => m.uniqueId === uid) : candidates[0];

                    if (match) {
                        context.setVariable(key, match);
                    }
                }
            }
        }
    }

    /**
     * Rebinds scene-node references retained in input defaults and saved execution-context values.
     * @param newScene - replacement scene that should own the restored references
     * @returns authoritative input defaults to restore after the core scene switch
     */
    private _rebindSavedConnectionReferences(newScene: Scene): Map<FlowGraphDataConnection<any>, any> {
        const reboundDefaults = new Map<FlowGraphDataConnection<any>, any>();
        for (const graph of this._coordinator?.flowGraphs ?? [this._flowGraph]) {
            for (const block of this._getAllGraphBlocks(graph)) {
                for (const input of block.dataInputs) {
                    const currentValue = (input as any)._defaultValue;
                    const reboundValue = this._rebindSceneValue(currentValue, newScene);
                    (input as any)._defaultValue = reboundValue;
                    reboundDefaults.set(input, reboundValue);
                }
            }
            for (let index = 0; index < graph.contextCount; index++) {
                const context = graph.getContext(index);
                const connectionValues = (context as any)?._connectionValues;
                for (const key in connectionValues) {
                    connectionValues[key] = this._rebindSceneValue(connectionValues[key], newScene);
                }
            }
            this._perGraphContextSnapshots.get(graph.uniqueId)?.forEach((context) => {
                for (const key in context._connectionValues) {
                    const reboundValue = this._rebindSceneValue(context._connectionValues[key], newScene);
                    const serializedValue = this._serializeValue(reboundValue);
                    context._connectionValues[key] = serializedValue;
                    this._rememberSerializedReferenceLocations(reboundValue, serializedValue);
                }
            });
        }

        if (this._savedConnectionValues) {
            for (const key in this._savedConnectionValues) {
                this._savedConnectionValues[key] = this._rebindSceneValue(this._savedConnectionValues[key], newScene);
            }
        }

        for (const runtimeSnapshots of this._perGraphContextRuntimeData.values()) {
            for (const contextData of runtimeSnapshots) {
                for (const key in contextData.connectionValues) {
                    contextData.connectionValues[key] = this._rebindSceneValue(contextData.connectionValues[key], newScene);
                }
            }
        }
        return reboundDefaults;
    }

    /**
     * Removes saved context data for a graph that no longer belongs to the coordinator.
     * @param graphUniqueId graph identifier to forget
     */
    public forgetGraphSnapshots(graphUniqueId: string): void {
        this._perGraphContextSnapshots.delete(graphUniqueId);
        this._perGraphContextRuntimeData.delete(graphUniqueId);
        if (this._flowGraph?.uniqueId === graphUniqueId) {
            this._savedUserVariables = null;
            this._savedConnectionValues = null;
            this._savedContextSnapshots = null;
            this._savedContextRuntimeData = null;
        }
    }

    private _getAllGraphBlocks(graph: FlowGraph): FlowGraphBlock[] {
        const blocks = new Map<string, FlowGraphBlock>();
        graph.visitAllBlocks((block) => blocks.set(block.uniqueId, block));
        graph.getAllBlocks().forEach((block) => blocks.set(block.uniqueId, block));
        return Array.from(blocks.values());
    }

    private _serializeValue(value: any): any {
        return SerializeEditorValue(value);
    }

    private _restoreReboundDefaults(reboundDefaults: Map<FlowGraphDataConnection<any>, any>): void {
        for (const [input, value] of reboundDefaults) {
            (input as any)._defaultValue = value;
        }
    }

    private _rebindSceneValue(value: any, newScene: Scene): any {
        if (Array.isArray(value)) {
            return value.map((entry) => this._rebindSceneValue(entry, newScene));
        }
        if (!value || typeof value !== "object") {
            return value;
        }

        const isSceneNode = typeof value.getClassName === "function" && typeof value.getScene === "function";
        const isSerializedNode = typeof value.className === "string" && !!(value.id || value.name) && value.value === undefined;
        if (!isSceneNode && !isSerializedNode) {
            return value;
        }
        if (isSceneNode && value.getScene() === newScene) {
            return value;
        }

        const reference = {
            id: value.id as string | undefined,
            name: value.name as string | undefined,
            className: (isSceneNode ? value.getClassName() : value.className) as string | undefined,
            uniqueId: value.uniqueId as number | undefined,
        };
        const allNodes = newScene.getNodes();
        const filterByClass = (nodes: typeof allNodes) => {
            if (!reference.className) {
                return nodes;
            }
            const classMatches = nodes.filter((node) => node.getClassName() === reference.className);
            return classMatches.length > 0 ? classMatches : nodes;
        };

        let candidates = reference.id ? filterByClass(allNodes.filter((node) => node.id === reference.id)) : [];
        let locationIndex: number | undefined;
        const oldLocation =
            reference.uniqueId === undefined ? undefined : isSerializedNode ? this._getReferenceLocation(value) : this._cachedOldNodeLocations?.get(reference.uniqueId);
        if (candidates.length > 0) {
            locationIndex = oldLocation && oldLocation.id === reference.id && oldLocation.className === reference.className ? oldLocation.idIndex : undefined;
        } else if (reference.name) {
            candidates = filterByClass(allNodes.filter((node) => node.name === reference.name));
            locationIndex = oldLocation && oldLocation.name === reference.name && oldLocation.className === reference.className ? oldLocation.nameIndex : undefined;
        }
        if (candidates.length === 0) {
            return value;
        }

        if (oldLocation?.sceneUid === newScene.uid && reference.uniqueId !== undefined) {
            const sameSceneNode = candidates.find((node) => node.uniqueId === reference.uniqueId);
            if (sameSceneNode) {
                return sameSceneNode;
            }
        }

        if (locationIndex !== undefined) {
            return candidates[locationIndex] ?? value;
        }

        return (reference.uniqueId === undefined ? undefined : candidates.find((node) => node.uniqueId === reference.uniqueId)) ?? candidates[0];
    }

    private _getRestoredReferenceLocation(uniqueId: number, reference: { id?: string; name?: string; className?: string }): SceneReferenceLocation | undefined {
        const locations = this._restoredReferenceProvenance?.get(uniqueId);
        if (!locations) {
            return undefined;
        }
        return (
            locations.find((location) => location.className === reference.className && location.id === reference.id && location.name === reference.name) ??
            locations.find((location) => location.className === reference.className && location.id === reference.id) ??
            locations.find((location) => location.className === reference.className && location.name === reference.name) ??
            (locations.length === 1 ? locations[0] : undefined)
        );
    }

    /**
     * Snapshot user variables and connection values from the selected execution context of a flow graph,
     * falling back to the first execution context when the selected one is unavailable.
     * Also serializes ALL execution contexts so they survive stop()/setScene().
     * Called just before stop/setScene clears contexts so variables can be restored later.
     * @param graph - the flow graph to snapshot from (defaults to current graph)
     */
    private _snapshotUserVariablesFrom(graph?: FlowGraph): void {
        const fg = graph ?? this._flowGraph;
        if (!fg) {
            return;
        }
        // Snapshot from the selected context (or context 0 as fallback)
        const ctx = fg.getContext(this._selectedContextIndex) ?? fg.getContext(0);
        if (!ctx) {
            return;
        }
        const vars = ctx.userVariables;
        if (vars && Object.keys(vars).length > 0) {
            this._savedUserVariables = { ...vars };
        }
        // Also snapshot connection values (unconnected input defaults)
        const connVals = (ctx as any)._connectionValues;
        if (connVals && Object.keys(connVals).length > 0) {
            this._savedConnectionValues = { ...connVals };
        }

        // Snapshot ALL contexts so they survive stop()/setScene().
        // Two parallel snapshots:
        //   _savedContextSnapshots  — serialized (JSON-safe) for file save injection
        //   _savedContextRuntimeData — runtime objects for live context restoration
        if (fg.contextCount > 0) {
            this._savedContextSnapshots = [];
            this._savedContextRuntimeData = [];
            for (let i = 0; i < fg.contextCount; i++) {
                const context = fg.getContext(i);
                Object.values((context as any)._connectionValues ?? {}).forEach((value) => this._rememberReferenceLocations(value));
                // Serialized snapshot for SerializationTools
                const serialized: any = {};
                context.serialize(serialized);
                this._rememberSerializedReferenceLocations((context as any)._connectionValues, serialized._connectionValues);
                this._savedContextSnapshots.push(serialized);
                // Runtime snapshot for createContext wrapper
                this._savedContextRuntimeData.push({
                    userVariables: { ...context.userVariables },
                    connectionValues: { ...(context as any)._connectionValues },
                    variableTypes: { ...context.variableTypes },
                    name: context.name,
                    uniqueId: context.uniqueId,
                });
            }
            // Store per-graph snapshots for multi-graph serialization
            this._perGraphContextSnapshots.set(fg.uniqueId, [...this._savedContextSnapshots!]);
            this._perGraphContextRuntimeData.set(fg.uniqueId, [...this._savedContextRuntimeData!]);
        }
    }

    /**
     * Convenience alias for snapshotting from the current flow graph.
     */
    private _snapshotUserVariables(): void {
        this._snapshotUserVariablesFrom();
    }

    /**
     * Public method to snapshot user variables before an operation that clears contexts.
     * Call this before flowGraph.stop() to preserve variables for the next start().
     */
    public snapshotUserVariables(): void {
        this._snapshotUserVariablesFrom();
    }

    /**
     * Recreate saved execution contexts after an operation that clears them.
     * Keeps stopped graphs editable in the editor without starting execution.
     */
    public restoreSavedContexts(): void {
        if (!this._flowGraph) {
            return;
        }

        const previousContextCount = this._flowGraph.contextCount;
        this._restoreContextsFromSnapshots(this._flowGraph);
        const currentContextCount = this._flowGraph.contextCount;

        if (currentContextCount === previousContextCount) {
            return;
        }

        if (currentContextCount > 0 && this._selectedContextIndex >= currentContextCount) {
            this._selectedContextIndex = currentContextCount - 1;
        }
        this.onContextListChanged.notifyObservers();
        this.onSelectedContextChanged.notifyObservers(this._selectedContextIndex);
    }

    /**
     * Returns the last serialized context snapshots (taken before stop()/setScene()).
     * Used by SerializationTools to inject context data into the serialized output
     * when the graph is stopped and has no live execution contexts.
     * @returns array of serialized context objects, or null if none saved
     */
    public get savedContextSnapshots(): any[] | null {
        return this._savedContextSnapshots;
    }

    /**
     * Returns saved context snapshots for a specific graph by uniqueId.
     * Used by SerializationTools to inject context data for inactive graphs.
     * @param graphUniqueId - the uniqueId of the graph
     * @returns array of serialized context objects, or null if none saved
     */
    public getContextSnapshotsForGraph(graphUniqueId: string): any[] | null {
        return this._perGraphContextSnapshots.get(graphUniqueId) ?? null;
    }

    private _getLiveReferenceLocation(value: any): SceneReferenceLocation | undefined {
        if (typeof value?.getScene !== "function" || typeof value?.getClassName !== "function") {
            return undefined;
        }
        const scene = value.getScene() as Scene;
        const className = value.getClassName();
        const classNodes = scene.getNodes().filter((node) => node.getClassName() === className);
        if (!classNodes.includes(value)) {
            return undefined;
        }
        return {
            id: value.id,
            name: value.name,
            className,
            idIndex: classNodes.filter((node) => node.id === value.id).indexOf(value),
            nameIndex: classNodes.filter((node) => node.name === value.name).indexOf(value),
            sceneUid: scene.uid,
        };
    }

    private _referenceLocationsMatch(left: SceneReferenceLocation, right: SceneReferenceLocation): boolean {
        return left.className === right.className && left.id === right.id && left.name === right.name && left.idIndex === right.idIndex && left.nameIndex === right.nameIndex;
    }

    private _getReferenceLocation(value: any): SceneReferenceLocation | undefined {
        const liveLocation = this._getLiveReferenceLocation(value);
        if (liveLocation) {
            return liveLocation;
        }
        if (!value || typeof value !== "object" || typeof value.uniqueId !== "number") {
            return undefined;
        }
        return this._referenceLocationsByOccurrence.get(value) ?? this._getRestoredReferenceLocation(value.uniqueId, value) ?? this._cachedOldNodeLocations?.get(value.uniqueId);
    }

    private _forEachReferenceValue(callback: (value: any) => void): void {
        const collect = (value: any) => {
            if (Array.isArray(value)) {
                value.forEach(collect);
                return;
            }
            if (!value || typeof value !== "object" || typeof value.uniqueId !== "number") {
                return;
            }
            if (
                (typeof value.getScene === "function" && typeof value.getClassName === "function") ||
                (typeof value.className === "string" && typeof value.getScene !== "function")
            ) {
                callback(value);
            }
        };
        for (const graph of this._coordinator?.flowGraphs ?? [this._flowGraph]) {
            this._getAllGraphBlocks(graph).forEach((block) => block.dataInputs.forEach((input) => collect((input as any)._defaultValue)));
            for (let index = 0; index < graph.contextCount; index++) {
                Object.values((graph.getContext(index) as any)?._connectionValues ?? {}).forEach(collect);
            }
            this._perGraphContextSnapshots.get(graph.uniqueId)?.forEach((context) => Object.values(context._connectionValues ?? {}).forEach(collect));
        }
        if (this._savedConnectionValues) {
            Object.values(this._savedConnectionValues).forEach(collect);
        }
        for (const runtimeSnapshots of this._perGraphContextRuntimeData.values()) {
            runtimeSnapshots.forEach((contextData) => Object.values(contextData.connectionValues).forEach(collect));
        }
    }

    private _rememberReferenceLocations(value: any): void {
        const collect = (entry: any) => {
            if (Array.isArray(entry)) {
                entry.forEach(collect);
                return;
            }
            const location = this._getLiveReferenceLocation(entry);
            if (!location) {
                return;
            }
            this._cachedOldNodeLocations ??= new Map();
            this._cachedOldNodeLocations.set(entry.uniqueId, location);
        };
        collect(value);
    }

    private _rememberSerializedReferenceLocations(runtimeValue: any, serializedValue: any): void {
        if (Array.isArray(runtimeValue) && Array.isArray(serializedValue)) {
            runtimeValue.forEach((entry, index) => this._rememberSerializedReferenceLocations(entry, serializedValue[index]));
            return;
        }
        if (!runtimeValue || !serializedValue || typeof runtimeValue !== "object" || typeof serializedValue !== "object") {
            return;
        }
        const location = this._getReferenceLocation(runtimeValue);
        if (location && typeof serializedValue.uniqueId === "number") {
            this._referenceLocationsByOccurrence.set(serializedValue, location);
            return;
        }
        for (const key of Object.keys(serializedValue)) {
            this._rememberSerializedReferenceLocations(runtimeValue[key], serializedValue[key]);
        }
    }

    /**
     * Associates a parsed reference occurrence with the provenance entry that resolved it.
     * @param value parsed live or unresolved reference value
     * @param location durable reference location
     */
    public rememberReferenceOccurrence(value: object, location: SceneReferenceLocation): void {
        this._referenceLocationsByOccurrence.set(value, location);
    }

    /** Gets durable scene-reference provenance for editor serialization. */
    public get referenceProvenance(): SceneReferenceProvenance {
        const provenance = new Map<number, [number, SceneReferenceLocation]>();
        this._forEachReferenceValue((value) => {
            const location = this._getReferenceLocation(value);
            if (location) {
                provenance.set(value.uniqueId, [value.uniqueId, location]);
            }
        });
        return Array.from(provenance.values());
    }

    /**
     * Temporarily remaps serialized reference descriptors so each serialized id names one identity.
     * @returns cleanup callback that restores editor runtime state after serialization
     */
    public prepareReferenceProvenanceForSerialization(): () => void {
        for (const [graphUniqueId, runtimeSnapshots] of this._perGraphContextRuntimeData) {
            const serializedSnapshots = this._perGraphContextSnapshots.get(graphUniqueId);
            runtimeSnapshots.forEach((runtimeData, index) => {
                const serialized = serializedSnapshots?.[index];
                if (serialized) {
                    this._rememberSerializedReferenceLocations(runtimeData.connectionValues, serialized._connectionValues);
                }
            });
        }
        const occurrences: Array<{ value: any; location: SceneReferenceLocation; live: boolean }> = [];
        const usedIds = new Set<number>();
        this._forEachReferenceValue((value) => {
            usedIds.add(value.uniqueId);
            const location = this._getReferenceLocation(value);
            if (location) {
                occurrences.push({ value, location, live: typeof value.getScene === "function" });
            }
        });
        for (const uniqueId of this._restoredReferenceProvenance?.keys() ?? []) {
            usedIds.add(uniqueId);
        }

        const identityKey = (uniqueId: number, location: SceneReferenceLocation) =>
            `${uniqueId}\0${location.className}\0${location.id}\0${location.name}\0${location.idIndex}\0${location.nameIndex}`;
        const identitiesById = new Map<number, Map<string, { location: SceneReferenceLocation; live: boolean }>>();
        for (const occurrence of occurrences) {
            const identities = identitiesById.get(occurrence.value.uniqueId) ?? new Map();
            const key = identityKey(occurrence.value.uniqueId, occurrence.location);
            const identity = identities.get(key);
            identities.set(key, { location: occurrence.location, live: occurrence.live || identity?.live === true });
            identitiesById.set(occurrence.value.uniqueId, identities);
        }

        const remappedIds = new Map<string, number>();
        let nextId = -1;
        for (const identities of identitiesById.values()) {
            if (identities.size < 2) {
                continue;
            }
            const keeper = Array.from(identities.entries()).find(([, identity]) => identity.live)?.[0] ?? identities.keys().next().value;
            for (const [key] of identities) {
                if (key === keeper) {
                    continue;
                }
                while (usedIds.has(nextId)) {
                    nextId--;
                }
                remappedIds.set(key, nextId);
                usedIds.add(nextId);
                nextId--;
            }
        }

        const originalProvenance = this._restoredReferenceProvenance;
        const preparedProvenance = new Map<number, SceneReferenceLocation[]>(originalProvenance ? Array.from(originalProvenance, ([id, locations]) => [id, [...locations]]) : []);
        const changedValues: Array<{ value: any; uniqueId: number }> = [];
        for (const occurrence of occurrences) {
            if (occurrence.live) {
                continue;
            }
            const key = identityKey(occurrence.value.uniqueId, occurrence.location);
            const remappedId = remappedIds.get(key);
            if (remappedId !== undefined) {
                changedValues.push({ value: occurrence.value, uniqueId: occurrence.value.uniqueId });
                occurrence.value.uniqueId = remappedId;
                preparedProvenance.set(remappedId, [occurrence.location]);
            }
        }
        this._restoredReferenceProvenance = preparedProvenance;

        return () => {
            for (const changed of changedValues) {
                changed.value.uniqueId = changed.uniqueId;
            }
            this._restoredReferenceProvenance = originalProvenance;
        };
    }

    /**
     * Restores durable scene-reference provenance before a deserialized coordinator is activated.
     * @param entries serialized provenance entries
     * @param occurrences provenance paired with exact parsed reference values
     * @param replace whether to replace all coordinator provenance or merge these entries
     */
    public restoreReferenceProvenance(entries: SceneReferenceProvenance, occurrences: Array<[object, SceneReferenceLocation]> = [], replace = true): void {
        if (replace || !this._restoredReferenceProvenance) {
            this._restoredReferenceProvenance = new Map();
        }
        if (replace) {
            this._referenceLocationsByOccurrence = new WeakMap();
        }
        for (const [uniqueId, location] of entries) {
            const locations = this._restoredReferenceProvenance.get(uniqueId) ?? [];
            if (!locations.some((candidate) => this._referenceLocationsMatch(candidate, location) && candidate.sceneUid === location.sceneUid)) {
                locations.push(location);
            }
            this._restoredReferenceProvenance.set(uniqueId, locations);
        }
        for (const [value, location] of occurrences) {
            this.rememberReferenceOccurrence(value, location);
        }
    }

    /**
     * Re-create execution contexts on the flow graph from `_savedContextSnapshots`.
     * Called after setScene() clears live contexts so the editor UI (variables panel,
     * context selector) has live contexts to display and serialize.
     * @param fg - the flow graph to restore contexts on
     */
    private _restoreContextsFromSnapshots(fg: FlowGraph): void {
        if (!this._savedContextSnapshots || this._savedContextSnapshots.length === 0) {
            return;
        }
        if (fg.contextCount > 0) {
            // Already has contexts (e.g. setScene was a no-op) — don't duplicate
            return;
        }
        for (let i = 0; i < this._savedContextSnapshots.length; i++) {
            // The wrapped createContext() picks up snapshot[i] automatically
            fg.createContext();
        }
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

        const retainedLocationIds = this._getUnresolvedSceneNodeUniqueIds(scene);
        const previousLocations = this._cachedOldNodeLocations;
        this._cachedOldNodeLocations = new Map(previousLocations ? Array.from(previousLocations).filter(([uniqueId]) => retainedLocationIds.has(uniqueId)) : undefined);
        const idCounts = new Map<string, number>();
        const nameCounts = new Map<string, number>();
        for (const node of scene.getNodes()) {
            const className = node.getClassName();
            const idKey = `${className}\0${node.id}`;
            const nameKey = `${className}\0${node.name}`;
            const idIndex = idCounts.get(idKey) ?? 0;
            const nameIndex = nameCounts.get(nameKey) ?? 0;
            this._cachedOldNodeLocations.set(node.uniqueId, { id: node.id, name: node.name, className, idIndex, nameIndex, sceneUid: scene.uid });
            idCounts.set(idKey, idIndex + 1);
            nameCounts.set(nameKey, nameIndex + 1);
        }
    }

    private _getUnresolvedSceneNodeUniqueIds(scene: Scene): Set<number> {
        const uniqueIds = new Set<number>();
        const collect = (value: any) => {
            if (Array.isArray(value)) {
                value.forEach(collect);
                return;
            }
            if (!value || typeof value !== "object") {
                return;
            }
            const isSceneReference = typeof value.getScene === "function" || typeof value.className === "string";
            if (typeof value.uniqueId === "number" && isSceneReference && this._rebindSceneValue(value, scene) === value) {
                uniqueIds.add(value.uniqueId);
            }
        };
        const graphs = this._coordinator?.flowGraphs ?? [this._flowGraph];
        for (const graph of graphs) {
            this._getAllGraphBlocks(graph).forEach((block) => block.dataInputs.forEach((input) => collect((input as any)._defaultValue)));
            for (let index = 0; index < graph.contextCount; index++) {
                const context = graph.getContext(index);
                Object.values((context as any)?._connectionValues ?? {}).forEach(collect);
            }
            const snapshots = this._perGraphContextSnapshots.get(graph.uniqueId);
            snapshots?.forEach((context) => Object.values(context._connectionValues ?? {}).forEach(collect));
        }
        if (this._savedConnectionValues) {
            Object.values(this._savedConnectionValues).forEach(collect);
        }
        for (const runtimeSnapshots of this._perGraphContextRuntimeData.values()) {
            runtimeSnapshots.forEach((contextData) => Object.values(contextData.connectionValues).forEach(collect));
        }
        return uniqueIds;
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

        this._debugNewNodeObserver = this.stateManager.onNewNodeCreatedObservable.add((node) => {
            if (this._isDebugMode && this._flowGraph?.state === FlowGraphState.Started && node.content.data instanceof FlowGraphEventBlock) {
                this._patchDebugEventSignals();
            }
        });
        this._debugNodeRemovalObserver = this.stateManager.onGraphNodeRemovalObservable.add((node) => {
            const block = node.content.data;
            if (block instanceof FlowGraphEventBlock) {
                this._restoreDebugEventSignals(block);
            }
        });
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
