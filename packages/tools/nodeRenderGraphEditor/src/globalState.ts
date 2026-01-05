import type { NodeRenderGraph } from "core/FrameGraph/Node/nodeRenderGraph";
import { Observable } from "core/Misc/observable";
import { LogEntry } from "./components/log/logComponent";
import { DataStorage } from "core/Misc/dataStorage";
import { RegisterElbowSupport } from "./graphSystem/registerElbowSupport";
import { RegisterNodePortDesign } from "./graphSystem/registerNodePortDesign";
import type { GraphNode } from "shared-ui-components/nodeGraphSystem/graphNode";
import type { GraphFrame } from "shared-ui-components/nodeGraphSystem/graphFrame";
import type { Nullable } from "core/types";
import { LockObject } from "shared-ui-components/tabs/propertyGrids/lockObject";
import { StateManager } from "shared-ui-components/nodeGraphSystem/stateManager";
import { RegisterDefaultInput } from "./graphSystem/registerDefaultInput";
import { RegisterExportData } from "./graphSystem/registerExportData";
import type { NodeRenderGraphBlock } from "core/FrameGraph/Node/nodeRenderGraphBlock";
import type { FilesInput } from "core/Misc/filesInput";
import { RegisterDebugSupport } from "./graphSystem/registerDebugSupport";
import { PreviewType } from "./components/preview/previewType";
import type { Scene } from "core/scene";
import { SerializationTools } from "./serializationTools";
import type { INodeRenderGraphCustomBlockDescription } from "core/FrameGraph/Node/Types/nodeRenderGraphTypes";

export class GlobalState {
    hostElement: HTMLElement;
    hostDocument: Document;
    hostWindow: Window;
    hostScene?: Scene;
    stateManager: StateManager;
    onClearUndoStack = new Observable<void>();
    onBuiltObservable = new Observable<void>();
    onResetRequiredObservable = new Observable<boolean>();
    onZoomToFitRequiredObservable = new Observable<void>();
    onReOrganizedRequiredObservable = new Observable<void>();
    onLogRequiredObservable = new Observable<LogEntry>();
    onIsLoadingChanged = new Observable<boolean>();
    onLightUpdated = new Observable<void>();
    onFrame = new Observable<void>();
    onAnimationCommandActivated = new Observable<void>();
    onImportFrameObservable = new Observable<any>();
    onPopupClosedObservable = new Observable<void>();
    onGetNodeFromBlock: (block: NodeRenderGraphBlock) => GraphNode;
    onDropEventReceivedObservable = new Observable<DragEvent>();
    previewType: PreviewType;
    previewFile: File;
    envType: PreviewType;
    envFile: File;
    listOfCustomPreviewFiles: File[] = [];
    rotatePreview: boolean;
    lockObject = new LockObject();
    hemisphericLight: boolean;
    directionalLight0: boolean;
    directionalLight1: boolean;
    pointerOverCanvas: boolean = false;
    onRefreshPreviewMeshControlComponentRequiredObservable = new Observable<void>();
    filesInput: FilesInput;
    scene: Scene;
    noAutoFillExternalInputs: boolean;
    _engine: number;

    customSave?: { label: string; action: (data: string) => Promise<void> };
    customBlockDescriptions?: INodeRenderGraphCustomBlockDescription[];

    private _nodeRenderGraph: NodeRenderGraph;

    /**
     * Gets the current node render graph
     */
    public get nodeRenderGraph(): NodeRenderGraph {
        return this._nodeRenderGraph;
    }

    /**
     * Sets the current node material
     */
    public set nodeRenderGraph(nodeRenderGraph: NodeRenderGraph) {
        this._nodeRenderGraph = nodeRenderGraph;
        nodeRenderGraph.onBuildObservable.add(() => {
            this.onLogRequiredObservable.notifyObservers(new LogEntry("Node render graph build successful", false));

            SerializationTools.UpdateLocations(nodeRenderGraph, this);

            this.onBuiltObservable.notifyObservers();
        });
        nodeRenderGraph.onBuildErrorObservable.add((err: string) => {
            this.onLogRequiredObservable.notifyObservers(new LogEntry(err, true));
        });
    }

    /** Gets the engine */
    public get engine(): number {
        return this._engine;
    }

    /** Sets the engine */
    public set engine(e: number) {
        if (e === this._engine) {
            return;
        }
        DataStorage.WriteNumber("Engine", e);
        this._engine = e;
        location.reload();
    }

    public constructor(scene: Scene) {
        this.scene = scene;
        this.stateManager = new StateManager();
        this.stateManager.data = this;
        this.stateManager.lockObject = this.lockObject;

        this.previewType = DataStorage.ReadNumber("PreviewType", PreviewType.Box);
        this.envType = DataStorage.ReadNumber("EnvType", PreviewType.Room);
        this.hemisphericLight = DataStorage.ReadBoolean("HemisphericLight", false);
        this.directionalLight0 = DataStorage.ReadBoolean("DirectionalLight0", false);
        this.directionalLight1 = DataStorage.ReadBoolean("DirectionalLight1", false);
        this._engine = DataStorage.ReadNumber("Engine", 0);

        RegisterElbowSupport(this.stateManager);
        RegisterDebugSupport(this.stateManager);
        RegisterNodePortDesign(this.stateManager);
        RegisterDefaultInput(this.stateManager);
        RegisterExportData(this.stateManager);
    }

    storeEditorData(serializationObject: any, frame?: Nullable<GraphFrame>) {
        this.stateManager.storeEditorData(serializationObject, frame);
    }
}
