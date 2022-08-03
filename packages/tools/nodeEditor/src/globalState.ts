import type { NodeMaterial } from "core/Materials/Node/nodeMaterial";
import { Observable } from "core/Misc/observable";
import type { LogEntry } from "./components/log/logComponent";
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

export class GlobalState {
    nodeMaterial: NodeMaterial;
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
    onPreviewBackgroundChanged = new Observable<void>();
    onBackFaceCullingChanged = new Observable<void>();
    onDepthPrePassChanged = new Observable<void>();
    onAnimationCommandActivated = new Observable<void>();
    onImportFrameObservable = new Observable<any>();
    onPopupClosedObservable = new Observable<void>();
    onGetNodeFromBlock: (block: NodeMaterialBlock) => GraphNode;
    previewType: PreviewType;
    previewFile: File;
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
    controlCamera: boolean;
    _mode: NodeMaterialModes;
    pointerOverCanvas: boolean = false;

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

    customSave?: { label: string; action: (data: string) => Promise<void> };

    public constructor() {
        this.previewType = DataStorage.ReadNumber("PreviewType", PreviewType.Box);
        this.backFaceCulling = DataStorage.ReadBoolean("BackFaceCulling", true);
        this.depthPrePass = DataStorage.ReadBoolean("DepthPrePass", false);
        this.hemisphericLight = DataStorage.ReadBoolean("HemisphericLight", true);
        this.directionalLight0 = DataStorage.ReadBoolean("DirectionalLight0", false);
        this.directionalLight1 = DataStorage.ReadBoolean("DirectionalLight1", false);
        this.controlCamera = DataStorage.ReadBoolean("ControlCamera", true);
        this._mode = DataStorage.ReadNumber("Mode", NodeMaterialModes.Material);
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
