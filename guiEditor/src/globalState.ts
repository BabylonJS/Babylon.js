import { Nullable } from "babylonjs/types";
import { Observable } from "babylonjs/Misc/observable";
import { LogEntry } from "./components/log/logComponent";
import { DataStorage } from "babylonjs/Misc/dataStorage";
import { Color3 } from "babylonjs/Maths/math.color";
import { WorkbenchComponent } from "./diagram/workbench";
import { AdvancedDynamicTexture } from "babylonjs-gui/2D/advancedDynamicTexture";
import { PropertyChangedEvent } from "./sharedUiComponents/propertyChangedEvent";
import { Scene } from "babylonjs/scene";
import { Control } from "babylonjs-gui/2D/controls/control";
import { LockObject } from "./sharedUiComponents/tabs/propertyGrids/lockObject";
import { GuiGizmoComponent } from "./diagram/guiGizmo";
import { ISize } from "babylonjs/Maths/math";
import { CoordinateHelper } from "./diagram/coordinateHelper";

export enum DragOverLocation {
    ABOVE = 0,
    BELOW = 1,
    CENTER = 2,
    NONE = 3
}

export class GlobalState {
    [x: string]: any;
    liveGuiTexture: Nullable<AdvancedDynamicTexture>;
    guiTexture: AdvancedDynamicTexture;
    hostElement: HTMLElement;
    hostDocument: HTMLDocument;
    hostWindow: Window;
    onSelectionChangedObservable = new Observable<Nullable<Control>>();
    onResizeObservable = new Observable<ISize>();
    onBuiltObservable = new Observable<void>();
    onResetRequiredObservable = new Observable<void>();
    onUpdateRequiredObservable = new Observable<void>();
    onLogRequiredObservable = new Observable<LogEntry>();
    onErrorMessageDialogRequiredObservable = new Observable<string>();
    onIsLoadingChanged = new Observable<boolean>();
    onSelectionBoxMoved = new Observable<ClientRect | DOMRect>();
    onNewSceneObservable = new Observable<Nullable<Scene>>();
    onGuiNodeRemovalObservable = new Observable<Control>();
    onPopupClosedObservable = new Observable<void>();
    _backgroundColor: Color3;
    blockKeyboardEvents = false;
    controlCamera: boolean;
    selectionLock: boolean;
    workbench: WorkbenchComponent;
    guiGizmo: GuiGizmoComponent;
    onPropertyChangedObservable = new Observable<PropertyChangedEvent>();

    onZoomObservable = new Observable<void>();
    onFitToWindowObservable = new Observable<void>();
    onPanObservable = new Observable<void>();
    onSelectionButtonObservable = new Observable<void>();
    onMoveObservable = new Observable<void>();
    onLoadObservable = new Observable<File>();
    onSaveObservable = new Observable<void>();
    onSnippetLoadObservable = new Observable<void>();
    onSnippetSaveObservable = new Observable<void>();
    onOutlinesObservable = new Observable<void>();
    onResponsiveChangeObservable = new Observable<boolean>();
    onParentingChangeObservable = new Observable<Nullable<Control>>();
    onDropObservable = new Observable<void>();
    onPropertyGridUpdateRequiredObservable = new Observable<void>();
    onDraggingEndObservable = new Observable<void>();
    onDraggingStartObservable = new Observable<void>();
    onWindowResizeObservable = new Observable<void>();
    onGizmoUpdateRequireObservable = new Observable<void>();
    onArtBoardUpdateRequiredObservable = new Observable<void>();
    onBackgroundColorChangeObservable = new Observable<void>();
    draggedControl: Nullable<Control> = null;
    draggedControlDirection: DragOverLocation;
    isSaving = false;
    public lockObject = new LockObject();
    storeEditorData: (serializationObject: any) => void;

    customSave?: { label: string; action: (data: string) => Promise<string> };
    customLoad?: { label: string; action: (data: string) => Promise<string> };
    public constructor() {
        this.controlCamera = DataStorage.ReadBoolean("ControlCamera", true);

        const defaultBrightness = 204 / 255.0;
        let r = DataStorage.ReadNumber("BackgroundColorR", defaultBrightness);
        let g = DataStorage.ReadNumber("BackgroundColorG", defaultBrightness);
        let b = DataStorage.ReadNumber("BackgroundColorB", defaultBrightness);
        this.backgroundColor = new Color3(r, g, b);
        this.onBackgroundColorChangeObservable.notifyObservers();

        CoordinateHelper.globalState = this;
    }

    public get backgroundColor() {
        return this._backgroundColor;
    }

    public set backgroundColor(value: Color3) {
        this._backgroundColor = value;
        this.onBackgroundColorChangeObservable.notifyObservers();
        DataStorage.WriteNumber("BackgroundColorR", value.r);
        DataStorage.WriteNumber("BackgroundColorG", value.g);
        DataStorage.WriteNumber("BackgroundColorB", value.b);
    }
}
