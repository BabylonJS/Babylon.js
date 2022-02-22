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
    private _backgroundColor: Color3;
    private _outlines: boolean = false;
    onOutlineChangedObservable = new Observable<void>();
    blockKeyboardEvents = false;
    controlCamera: boolean;
    selectionLock: boolean;
    workbench: WorkbenchComponent;
    onPropertyChangedObservable = new Observable<PropertyChangedEvent>();

    onZoomObservable = new Observable<void>();
    onFitToWindowObservable = new Observable<void>();
    onPanObservable = new Observable<void>();
    onSelectionButtonObservable = new Observable<void>();
    onLoadObservable = new Observable<File>();
    onSaveObservable = new Observable<void>();
    onSnippetLoadObservable = new Observable<void>();
    onSnippetSaveObservable = new Observable<void>();
    onResponsiveChangeObservable = new Observable<boolean>();
    onParentingChangeObservable = new Observable<Nullable<Control>>();
    onPropertyGridUpdateRequiredObservable = new Observable<void>();
    onDraggingEndObservable = new Observable<void>();
    onDraggingStartObservable = new Observable<void>();
    onWindowResizeObservable = new Observable<void>();
    onGizmoUpdateRequireObservable = new Observable<void>();
    onArtBoardUpdateRequiredObservable = new Observable<void>();
    onBackgroundColorChangeObservable = new Observable<void>();
    onPointerMoveObservable = new Observable<React.PointerEvent<HTMLCanvasElement>>();
    onPointerUpObservable = new Observable<Nullable<React.PointerEvent<HTMLCanvasElement> | PointerEvent>>();
    draggedControl: Nullable<Control> = null;
    draggedControlDirection: DragOverLocation;
    onCopyObservable = new Observable<(content: string) => void>();
    onCutObservable = new Observable<(content: string) => void>();
    onPasteObservable = new Observable<string>();
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

    /** adds copy, cut and paste listeners to the host window */
    public registerEventListeners() {
        this.hostDocument.addEventListener("copy", (event) => {
            const target = event.target as HTMLElement;
            if (!target.isContentEditable && target.tagName !== "input" && target.tagName !== "textarea") {
                this.onCopyObservable.notifyObservers(content => event.clipboardData?.setData("text/plain", content));
                event.preventDefault();
            }
        });
        this.hostDocument.addEventListener("cut", (event) => {
            const target = event.target as HTMLElement;
            if (!target.isContentEditable && target.tagName !== "input" && target.tagName !== "textarea") {
                this.onCutObservable.notifyObservers(content => event.clipboardData?.setData("text/plain", content));
                event.preventDefault();
            }
        });
        this.hostDocument.addEventListener("paste", (event) => {
            const target = event.target as HTMLElement;
            if (!target.isContentEditable && target.tagName !== "input" && target.tagName !== "textarea") {
                this.onPasteObservable.notifyObservers(event.clipboardData?.getData("text") || "");
                event.preventDefault();
            }
        });
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

    public get outlines() {
        return this._outlines;
    }

    public set outlines(value: boolean) {
        this._outlines = value;
        this.onOutlineChangedObservable.notifyObservers();
    }
}
