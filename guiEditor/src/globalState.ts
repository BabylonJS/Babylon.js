import { Nullable } from "babylonjs/types";
import { Observable } from "babylonjs/Misc/observable";
import { DataStorage } from "babylonjs/Misc/dataStorage";
import { Color4 } from "babylonjs/Maths/math.color";
import { GUINode } from "./diagram/guiNode";
import { FramePortData, WorkbenchComponent } from "./diagram/workbench";
import { AdvancedDynamicTexture } from "babylonjs-gui/2D/advancedDynamicTexture";
import { LogEntry } from "./components/log/logComponent";

export class GlobalState {
    guiTexture: AdvancedDynamicTexture;
    hostElement: HTMLElement;
    hostDocument: HTMLDocument;
    hostWindow: Window;
    onSelectionChangedObservable = new Observable<Nullable<GUINode | FramePortData>>();
    onRebuildRequiredObservable = new Observable<void>();
    onBuiltObservable = new Observable<void>();
    onResetRequiredObservable = new Observable<void>();
    onUpdateRequiredObservable = new Observable<void>();
    onZoomToFitRequiredObservable = new Observable<void>();
    onReOrganizedRequiredObservable = new Observable<void>();
    onLogRequiredObservable = new Observable<LogEntry>();
    onErrorMessageDialogRequiredObservable = new Observable<string>();
    onIsLoadingChanged = new Observable<boolean>();
    onSelectionBoxMoved = new Observable<ClientRect | DOMRect>();
    onGuiNodeRemovalObservable = new Observable<GUINode>();
    onGridSizeChanged = new Observable<void>();
    listOfCustomPreviewFiles: File[] = [];
    rotatePreview: boolean;
    backgroundColor: Color4;
    backFaceCulling: boolean;
    depthPrePass: boolean;
    blockKeyboardEvents = false;
    hemisphericLight: boolean;
    directionalLight0: boolean;
    directionalLight1: boolean;
    controlCamera: boolean;
    workbench: WorkbenchComponent;
    storeEditorData: (serializationObject: any, frame?: Nullable<null>) => void;


    customSave?: { label: string; action: (data: string) => Promise<void> };

    public constructor() {
        this.controlCamera = DataStorage.ReadBoolean("ControlCamera", true);

        let r = DataStorage.ReadNumber("BackgroundColorR", 0.12549019607843137);
        let g = DataStorage.ReadNumber("BackgroundColorG", 0.09803921568627451);
        let b = DataStorage.ReadNumber("BackgroundColorB", 0.25098039215686274);
        this.backgroundColor = new Color4(r, g, b, 1.0);
    }
}
