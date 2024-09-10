import type { NodeMaterial } from "core/Materials/Node/nodeMaterial";
import { Observable } from "core/Misc/observable";
import { LogEntry } from "./components/log/logComponent";
import type { NodeMaterialBlock } from "core/Materials/Node/nodeMaterialBlock";
import { PreviewType } from "./components/preview/previewType";
import { DataStorage } from "core/Misc/dataStorage";
import { Color4 } from "core/Maths/math.color";
import { NodeMaterialModes } from "core/Materials/Node/Enums/nodeMaterialModes";
import { ParticleSystem } from "core/Particles/particleSystem";
import { RegisterElbowSupport } from "./graphSystem/registerElbowSupport";
import { RegisterNodePortDesign } from "./graphSystem/registerNodePortDesign";
import type { GraphNode } from "shared-ui-components/nodeGraphSystem/graphNode";
import type { GraphFrame } from "shared-ui-components/nodeGraphSystem/graphFrame";
import type { Nullable } from "core/types";
import { LockObject } from "shared-ui-components/tabs/propertyGrids/lockObject";
import { StateManager } from "shared-ui-components/nodeGraphSystem/stateManager";
import { RegisterDefaultInput } from "./graphSystem/registerDefaultInput";
import { RegisterExportData } from "./graphSystem/registerExportData";
import type { FilesInput } from "core/Misc/filesInput";
import { RegisterDebugSupport } from "./graphSystem/registerDebugSupport";
import { SerializationTools } from "./serializationTools";

export class GlobalState {
    hostElement: HTMLElement;
    hostDocument: Document;
    hostWindow: Window;
    stateManager: StateManager;
    onBuiltObservable = new Observable<void>();
    onResetRequiredObservable = new Observable<boolean>();
    onClearUndoStack = new Observable<void>();
    onZoomToFitRequiredObservable = new Observable<void>();
    onReOrganizedRequiredObservable = new Observable<void>();
    onLogRequiredObservable = new Observable<LogEntry>();
    onIsLoadingChanged = new Observable<boolean>();
    onPreviewCommandActivated = new Observable<boolean>();
    onLightUpdated = new Observable<void>();
    onBackgroundHDRUpdated = new Observable<void>();
    onPreviewBackgroundChanged = new Observable<void>();
    onBackFaceCullingChanged = new Observable<void>();
    onDepthPrePassChanged = new Observable<void>();
    onAnimationCommandActivated = new Observable<void>();
    onImportFrameObservable = new Observable<any>();
    onPopupClosedObservable = new Observable<void>();
    onDropEventReceivedObservable = new Observable<DragEvent>();
    onGetNodeFromBlock: (block: NodeMaterialBlock) => GraphNode;
    previewType: PreviewType;
    previewFile: File;
    envType: PreviewType;
    envFile: File;
    particleSystemBlendMode = ParticleSystem.BLENDMODE_ONEONE;
    listOfCustomPreviewFiles: File[] = [];
    rotatePreview: boolean;
    backgroundColor: Color4;
    backFaceCulling: boolean;
    depthPrePass: boolean;
    lockObject = new LockObject();
    hemisphericLight: boolean;
    directionalLight0: boolean;
    directionalLight1: boolean;
    backgroundHDR: boolean;
    controlCamera: boolean;
    _mode: NodeMaterialModes;
    _engine: number;
    pointerOverCanvas: boolean = false;
    filesInput: FilesInput;
    onRefreshPreviewMeshControlComponentRequiredObservable = new Observable<void>();

    /** Gets the mode */
    public get mode(): NodeMaterialModes {
        return this._mode;
    }

    /** Sets the mode */
    public set mode(m: NodeMaterialModes) {
        DataStorage.WriteNumber("Mode", m);
        this._mode = m;
        this.onPreviewCommandActivated.notifyObservers(true);
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

    private _nodeMaterial: NodeMaterial;

    /**
     * Gets the current node material
     */
    public get nodeMaterial(): NodeMaterial {
        return this._nodeMaterial;
    }

    /**
     * Sets the current node material
     */
    public set nodeMaterial(nodeMaterial: NodeMaterial) {
        this._nodeMaterial = nodeMaterial;
        nodeMaterial.onBuildObservable.add(() => {
            this.onLogRequiredObservable.notifyObservers(new LogEntry("Node material build successful", false));

            SerializationTools.UpdateLocations(nodeMaterial, this);

            this.onBuiltObservable.notifyObservers();
        });
        nodeMaterial.onBuildErrorObservable.add((err: string) => {
            this.onLogRequiredObservable.notifyObservers(new LogEntry(err, true));
        });
    }

    customSave?: { label: string; action: (data: string) => Promise<void> };

    public constructor() {
        this.previewType = DataStorage.ReadNumber("PreviewType", PreviewType.Box);
        this.envType = DataStorage.ReadNumber("EnvType", PreviewType.Room);
        this.backFaceCulling = DataStorage.ReadBoolean("BackFaceCulling", true);
        this.depthPrePass = DataStorage.ReadBoolean("DepthPrePass", false);
        this.hemisphericLight = DataStorage.ReadBoolean("HemisphericLight", true);
        this.directionalLight0 = DataStorage.ReadBoolean("DirectionalLight0", false);
        this.directionalLight1 = DataStorage.ReadBoolean("DirectionalLight1", false);
        this.backgroundHDR = DataStorage.ReadBoolean("backgroundHDR", false);
        this.controlCamera = DataStorage.ReadBoolean("ControlCamera", true);
        this._mode = DataStorage.ReadNumber("Mode", NodeMaterialModes.Material);
        this._engine = DataStorage.ReadNumber("Engine", 0);

        this.stateManager = new StateManager();
        this.stateManager.data = this;
        this.stateManager.lockObject = this.lockObject;

        RegisterElbowSupport(this.stateManager);
        RegisterDebugSupport(this.stateManager);
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
