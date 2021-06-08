import { Nullable } from "babylonjs/types";
import { Observable } from "babylonjs/Misc/observable";
import { LogEntry } from "./components/log/logComponent";
import { DataStorage } from "babylonjs/Misc/dataStorage";
import { Color4 } from "babylonjs/Maths/math.color";
import { WorkbenchComponent } from "./diagram/workbench";
import { AdvancedDynamicTexture } from "babylonjs-gui/2D/advancedDynamicTexture";
import { PropertyChangedEvent } from "./sharedUiComponents/propertyChangedEvent";
import { Vector2 } from "babylonjs/Maths/math.vector";
import { Scene } from "babylonjs/scene";
import { Control } from "babylonjs-gui/2D/controls/control";

export class GlobalState {
    [x: string]: any;
    guiTexture: AdvancedDynamicTexture;
    hostElement: HTMLElement;
    hostDocument: HTMLDocument;
    hostWindow: Window;
    onSelectionChangedObservable = new Observable<Nullable<Control>>();
    onResizeObservable = new Observable<Vector2>();
    onBuiltObservable = new Observable<void>();
    onResetRequiredObservable = new Observable<void>();
    onUpdateRequiredObservable = new Observable<void>();
    onLogRequiredObservable = new Observable<LogEntry>();
    onErrorMessageDialogRequiredObservable = new Observable<string>();
    onIsLoadingChanged = new Observable<boolean>();
    onSelectionBoxMoved = new Observable<ClientRect | DOMRect>();
    onNewSceneObservable = new Observable<Nullable<Scene>>();
    onGuiNodeRemovalObservable = new Observable<Control>();
    backgroundColor: Color4;
    blockKeyboardEvents = false;
    controlCamera: boolean;
    workbench: WorkbenchComponent;
    onPropertyChangedObservable = new Observable<PropertyChangedEvent>();

    onZoomObservable = new Observable<void>();
    onPanObservable = new Observable<void>();
    onSelectionButtonObservable = new Observable<void>();
    onLoadObservable = new Observable<void>();
    onSaveObservable = new Observable<void>();
    onSnippetLoadObservable = new Observable<void>();
    onSnippetSaveObservable = new Observable<void>();
    onOutlinesObservable = new Observable<void>();
    onResponsiveChangeObservable = new Observable<boolean>();
    onParentingChangeObservable = new Observable<Nullable<Control>>();
    draggedControl: Nullable<Control>;
    storeEditorData: (serializationObject: any) => void;

    customSave?: { label: string; action: (data: string) => Promise<void> };

    public constructor() {
        this.controlCamera = DataStorage.ReadBoolean("ControlCamera", true);

        let r = DataStorage.ReadNumber("BackgroundColorR", 0.12549019607843137);
        let g = DataStorage.ReadNumber("BackgroundColorG", 0.09803921568627451);
        let b = DataStorage.ReadNumber("BackgroundColorB", 0.25098039215686274);
        this.backgroundColor = new Color4(r, g, b, 1.0);
    }
}
