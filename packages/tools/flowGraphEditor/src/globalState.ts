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
import { FlowGraphExecutionBlock } from "core/FlowGraph/flowGraphExecutionBlock";
import { type FlowGraphSignalConnection } from "core/FlowGraph/flowGraphSignalConnection";
import { RegisterDebugSupport } from "./graphSystem/registerDebugSupport";
import { type Scene } from "core/scene";
import { type SceneContext } from "./sceneContext";
import { FlowGraphInteger } from "core/FlowGraph/CustomTypes/flowGraphInteger";
import { type IFlowGraphValidationResult, ValidateFlowGraphWithBlockList } from "core/FlowGraph/flowGraphValidator";
import { type HelpTopicId } from "./components/help/helpContent";

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
    // eslint-disable-next-line jsdoc/require-returns
    /** Callback that returns true if the given graph node is within the visible viewport.
     *  Used by the debug highlighter to skip offscreen nodes and save DOM work. */
    isNodeVisible: (node: GraphNode) => boolean = () => true;
    /** Observable triggered when a drop event is received */
    onDropEventReceivedObservable = new Observable<DragEvent>();
    /** Observable triggered when help dialog is requested. Payload is an optional topic id. */
    onHelpRequested = new Observable<HelpTopicId | undefined>();
    /** Whether the pointer is over the canvas */
    pointerOverCanvas: boolean = false;
    /** Lock object for property grid */
    lockObject = new LockObject();

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
    /** Observer tracking graph state changes for debug re-subscription */
    private _debugStateObserver: Nullable<Observer<FlowGraphState>> = null;
    /** Per-node throttle timestamps to avoid excessive highlighting */
    private _highlightThrottleMap = new Map<string, number>();
    /** Blocks that executed since the last debug frame — batched to avoid per-call DOM work */
    private _debugPendingBlocks = new Set<FlowGraphBlock>();
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

        // The observer callback is kept as cheap as possible — it only adds
        // the block to a pending set.  All DOM work is deferred to a single
        // requestAnimationFrame pass per frame to avoid freezing on graphs
        // with many blocks executing every frame.
        this._debugExecutionObserver = context.onNodeExecutedObservable.add((block) => {
            this._debugPendingBlocks.add(block);
            if (!this._debugRafId) {
                this._debugRafId = requestAnimationFrame(() => this._flushDebugHighlights());
            }
        });
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
    }

    /** Step one block and pause again */
    public stepExecution(): void {
        const ctx = this._flowGraph?.getContext(this.selectedContextIndex);
        ctx?.stepExecution();
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

        // Stop the old graph to detach its event observer from the scene
        // coordinator.  Without this, the old graph's SceneDispose handler
        // could fire unexpectedly when the preview scene is reloaded.
        if (this._flowGraph && this._flowGraph !== flowGraph) {
            if (this._flowGraph.state !== FlowGraphState.Stopped) {
                this._flowGraph.stop();
            }
        }

        this._flowGraph = flowGraph;

        if (!flowGraph) {
            return;
        }

        // The editor always starts in Stopped state — the user must explicitly
        // press Start or Reset.  The graph may arrive already started when
        // opened from KHR_interactivity or another runtime path.
        if (flowGraph.state === FlowGraphState.Started || flowGraph.state === FlowGraphState.Paused) {
            // Snapshot user variables before stop() clears execution contexts.
            // These variables (e.g. pickedMesh_0 from KHR_interactivity) are
            // set during parsing and would be lost when stop() empties contexts.
            this._snapshotUserVariablesFrom(flowGraph);
            flowGraph.stop();
        } else {
            // Graph is already stopped but may still have parsed contexts with
            // variables that we need to preserve for when start() is called.
            this._snapshotUserVariablesFrom(flowGraph);
        }

        // Wire the observer: when scene context changes, update all execution contexts
        // and re-point the flow graph's event coordinator at the new scene so that
        // scene-based events (e.g. SceneOnTick) fire correctly.
        this._sceneContextObserver = this.onSceneContextChanged.add((ctx) => {
            const assetsContainer: IAssetContainer | undefined = ctx?.scene;
            this._applyAssetsContextToGraph(assetsContainer);
            if (ctx?.scene) {
                // Patch the new engine's getDeltaTime to respect the current time scale
                this._originalGetDeltaTime = null; // reset so _applyEngineTimeScale stores the new engine's original
                this._applyEngineTimeScale();

                // Remap GetAsset block references from old uniqueIds to new ones
                // (uniqueId values change when a snippet is re-executed).
                // Uses the cached id→name map built from the previous scene
                // (the old scene is already disposed by the time this fires).
                this._remapAssetReferences(ctx.scene);

                // Cache the NEW scene's id→name map for the next reload
                this._cacheSceneIdToNameMap(ctx.scene);

                // Snapshot user variables before setScene clears contexts —
                // they contain mesh references (pickedMesh_0 etc.) from
                // KHR_interactivity that must survive scene switches.
                this._snapshotUserVariables();

                if (typeof flowGraph.setScene === "function") {
                    flowGraph.setScene(ctx.scene);
                }
            }
        });

        // Wrap createContext() so newly created contexts also inherit the loaded scene
        // and any saved user variables from the previous context.
        this._originalCreateContext = flowGraph.createContext.bind(flowGraph);
        const origCreate = this._originalCreateContext!;
        flowGraph.createContext = (): FlowGraphContext => {
            const ctx = origCreate();
            if (this.sceneContext) {
                ctx.assetsContext = this.sceneContext.scene;
            }
            // Restore user variables saved before setScene cleared contexts
            if (this._savedUserVariables) {
                for (const key in this._savedUserVariables) {
                    ctx.setVariable(key, this._savedUserVariables[key]);
                }
                this._savedUserVariables = null;
            }
            // Restore connection values (unconnected input defaults like divide-by-2)
            if (this._savedConnectionValues) {
                for (const key in this._savedConnectionValues) {
                    ctx._setConnectionValueByKey(key, this._savedConnectionValues[key]);
                }
                this._savedConnectionValues = null;
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
            // Remap asset references (animation groups, meshes, etc.) that
            // couldn't be resolved during parsing because the graph was parsed
            // against the editor's host scene, not the preview scene.
            this._remapAssetReferences(this.sceneContext.scene);
            this._cacheSceneIdToNameMap(this.sceneContext.scene);
            if (typeof flowGraph.setScene === "function") {
                flowGraph.setScene(this.sceneContext.scene);
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
        const savedName: string | undefined = (block.config as any)?._meshName ?? (isObjectRef ? currentMesh.name : undefined);
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
     * Snapshot all user variables from the first execution context of a flow graph.
     * Called just before stop/setScene clears contexts so variables can be restored later.
     * @param graph - the flow graph to snapshot from (defaults to current graph)
     */
    private _snapshotUserVariablesFrom(graph?: FlowGraph): void {
        const fg = graph ?? this._flowGraph;
        if (!fg) {
            return;
        }
        const ctx = fg.getContext(0);
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
