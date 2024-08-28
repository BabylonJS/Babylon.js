import type { NodeRenderGraph } from "core/FrameGraph/Node/nodeRenderGraph";
import { Observable } from "core/Misc/observable";
import type { LogEntry } from "./components/log/logComponent";
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
    onPreviewCommandActivated = new Observable<boolean>();
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

    customSave?: { label: string; action: (data: string) => Promise<void> };

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
