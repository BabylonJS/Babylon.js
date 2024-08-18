import type { NodeRenderGraph } from "core/FrameGraph/Node/nodeRenderGraph";
import { Observable } from "core/Misc/observable";
import type { LogEntry } from "./components/log/logComponent";
import { DataStorage } from "core/Misc/dataStorage";
import { Color4 } from "core/Maths/math.color";
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
import type { AbstractEngine } from "core/Engines";

export class GlobalState {
    nodeRenderGraph: NodeRenderGraph;
    hostElement: HTMLElement;
    hostDocument: Document;
    hostWindow: Window;
    stateManager: StateManager;
    onBuiltObservable = new Observable<void>();
    onResetRequiredObservable = new Observable<boolean>();
    onZoomToFitRequiredObservable = new Observable<void>();
    onReOrganizedRequiredObservable = new Observable<void>();
    onLogRequiredObservable = new Observable<LogEntry>();
    onIsLoadingChanged = new Observable<boolean>();
    onPreviewBackgroundChanged = new Observable<void>();
    onFrame = new Observable<void>();
    onAnimationCommandActivated = new Observable<void>();
    onImportFrameObservable = new Observable<any>();
    onPopupClosedObservable = new Observable<void>();
    onGetNodeFromBlock: (block: NodeRenderGraphBlock) => GraphNode;
    listOfCustomPreviewFiles: File[] = [];
    rotatePreview: boolean;
    backgroundColor: Color4;
    lockObject = new LockObject();
    pointerOverCanvas: boolean = false;
    onRefreshPreviewMeshControlComponentRequiredObservable = new Observable<void>();
    engine: AbstractEngine;

    customSave?: { label: string; action: (data: string) => Promise<void> };

    public constructor(engine: AbstractEngine) {
        this.engine = engine;
        this.stateManager = new StateManager();
        this.stateManager.data = this;
        this.stateManager.lockObject = this.lockObject;

        RegisterElbowSupport(this.stateManager);
        RegisterNodePortDesign(this.stateManager);
        RegisterDefaultInput(this.stateManager);
        RegisterExportData(this.stateManager);

        const r = DataStorage.ReadNumber("BackgroundColorR", 0.12549019607843137);
        const g = DataStorage.ReadNumber("BackgroundColorG", 0.09803921568627451);
        const b = DataStorage.ReadNumber("BackgroundColorB", 0.25098039215686274);
        this.backgroundColor = new Color4(r, g, b, 1.0);
    }

    storeEditorData(serializationObject: any, frame?: Nullable<GraphFrame>) {
        this.stateManager.storeEditorData(serializationObject, frame);
    }
}
