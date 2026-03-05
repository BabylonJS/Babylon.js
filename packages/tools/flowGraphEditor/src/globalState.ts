import type { FlowGraph } from "core/FlowGraph/flowGraph";
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

    /** The scene context populated when a Playground snippet is loaded */
    sceneContext: Nullable<SceneContext> = null;
    /** Observable triggered when the scene context changes (snippet loaded/disposed) */
    onSceneContextChanged = new Observable<Nullable<SceneContext>>();

    /** The snippet ID of the currently loaded scene (persisted in the serialized JSON) */
    snippetId: string = "";
    /** Observable triggered when the snippet ID changes (e.g. after deserialization) */
    onSnippetIdChanged = new Observable<string>();

    private _flowGraph: FlowGraph;
    private _sceneContextObserver: Nullable<Observer<Nullable<SceneContext>>> = null;
    private _originalCreateContext: Nullable<() => FlowGraphContext> = null;

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

        // Wire the observer: when scene context changes, update all execution contexts
        this._sceneContextObserver = this.onSceneContextChanged.add((ctx) => {
            const assetsContainer: IAssetContainer | undefined = ctx?.scene;
            this._applyAssetsContextToGraph(assetsContainer);
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
