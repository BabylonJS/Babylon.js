import { Nullable } from "core/types";
import { Observable } from "core/Misc/observable";
import { LogEntry } from "./components/log/logComponent";
import { DataStorage } from "core/Misc/dataStorage";
import { Color3 } from "core/Maths/math.color";
import { WorkbenchComponent } from "./diagram/workbench";
import { AdvancedDynamicTexture } from "gui/2D/advancedDynamicTexture";
import { PropertyChangedEvent } from "shared-ui-components/propertyChangedEvent";
import { Scene } from "core/scene";
import { Control } from "gui/2D/controls/control";
import { LockObject } from "shared-ui-components/tabs/propertyGrids/lockObject";
import { ISize } from "core/Maths/math";
import { CoordinateHelper } from "./diagram/coordinateHelper";
import { KeyboardManager } from "./keyboardManager";

export enum DragOverLocation {
    ABOVE = 0,
    BELOW = 1,
    CENTER = 2,
    NONE = 3,
}

export enum Tool {
    SELECT = 0,
    PAN = 1,
    ZOOM = 2,
}

export class GlobalState {
    liveGuiTexture: Nullable<AdvancedDynamicTexture>;
    guiTexture: AdvancedDynamicTexture;
    hostElement: HTMLElement;
    hostDocument: HTMLDocument;
    hostWindow: Window;
    selectedControls: Control[] = [];
    onSelectionChangedObservable = new Observable<void>();
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
    public keys: KeyboardManager;
    /** DO NOT USE: in the process of removing */
    public blockKeyboardEvents = false;
    onOutlineChangedObservable = new Observable<void>();
    controlCamera: boolean;
    selectionLock: boolean;
    workbench: WorkbenchComponent;
    onPropertyChangedObservable = new Observable<PropertyChangedEvent>();

    private _tool: Tool = Tool.SELECT;
    onToolChangeObservable = new Observable<void>();
    public get tool(): Tool {
        if (this._tool === Tool.ZOOM) {
            return Tool.ZOOM;
        } else if (this._tool === Tool.PAN || this.keys.isKeyDown("space")) {
            return Tool.PAN;
        } else {
            return Tool.SELECT;
        }
    }
    public set tool(newTool: Tool) {
        if (this._tool === newTool) return;
        this._tool = newTool;
        this.onToolChangeObservable.notifyObservers();
    }
    onFitToWindowObservable = new Observable<void>();
    onLoadObservable = new Observable<File>();
    onSaveObservable = new Observable<void>();
    onSnippetLoadObservable = new Observable<void>();
    onSnippetSaveObservable = new Observable<void>();
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
        const r = DataStorage.ReadNumber("BackgroundColorR", defaultBrightness);
        const g = DataStorage.ReadNumber("BackgroundColorG", defaultBrightness);
        const b = DataStorage.ReadNumber("BackgroundColorB", defaultBrightness);
        this.backgroundColor = new Color3(r, g, b);
        this.onBackgroundColorChangeObservable.notifyObservers();

        CoordinateHelper.GlobalState = this;
    }

    /** adds copy, cut and paste listeners to the host window */
    public registerEventListeners() {
        const isElementEditable = (element: HTMLElement) => {
            return element.isContentEditable || element.tagName === "INPUT" || element.tagName === "TEXTAREA";
        };
        this.hostDocument.addEventListener("copy", (event) => {
            if (!isElementEditable(event.target as HTMLElement)) {
                this.onCopyObservable.notifyObservers((content) => event.clipboardData?.setData("text/plain", content));
                event.preventDefault();
            }
        });
        this.hostDocument.addEventListener("cut", (event) => {
            if (!isElementEditable(event.target as HTMLElement)) {
                this.onCutObservable.notifyObservers((content) => event.clipboardData?.setData("text/plain", content));
                event.preventDefault();
            }
        });
        this.hostDocument.addEventListener("paste", (event) => {
            if (!isElementEditable(event.target as HTMLElement)) {
                this.onPasteObservable.notifyObservers(event.clipboardData?.getData("text") || "");
                event.preventDefault();
            }
        });
        this.keys = new KeyboardManager(this.hostDocument);
        this.keys.onKeyPressedObservable.add(() => {
            // trigger a tool update (in case space is now pressed)
            // we should really have a state management system to handle this for us
            this.onToolChangeObservable.notifyObservers();
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

    public select(control: Control) {
        if (this.keys.isKeyDown("control") && this.isMultiSelectable(control)) {
            const index = this.selectedControls.indexOf(control);
            if (index === -1) {
                this.setSelection([...this.selectedControls, control]);
            } else {
                this.setSelection(this.selectedControls.filter((node) => node !== control));
            }
        } else {
            this.setSelection([control]);
        }
    }

    public setSelection(controls: Control[]) {
        this.selectedControls = [...controls];
        this.onSelectionChangedObservable.notifyObservers();
    }

    public deleteSelectedNodes() {
        for (const control of this.selectedControls) {
            this.guiTexture.removeControl(control);
            this.liveGuiTexture?.removeControl(control);
            control.dispose();
        }
        this.setSelection([]);
    }

    public isMultiSelectable(control: Control): boolean {
        if (this.selectedControls.length === 0) return true;
        if (this.selectedControls[0].parent === control.parent) return true;
        return false;
    }

    public dispose() {
        this.keys.dispose();
    }
}
