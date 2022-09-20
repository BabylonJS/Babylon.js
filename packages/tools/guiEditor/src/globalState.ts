import type { Nullable } from "core/types";
import { Observable } from "core/Misc/observable";
import type { LogEntry } from "./components/log/logComponent";
import { DataStorage } from "core/Misc/dataStorage";
import { Color3 } from "core/Maths/math.color";
import type { WorkbenchComponent } from "./diagram/workbench";
import type { AdvancedDynamicTexture } from "gui/2D/advancedDynamicTexture";
import type { PropertyChangedEvent } from "shared-ui-components/propertyChangedEvent";
import type { Scene } from "core/scene";
import type { Control } from "gui/2D/controls/control";
import { LockObject } from "shared-ui-components/tabs/propertyGrids/lockObject";
import type { ISize } from "core/Maths/math";
import { CoordinateHelper } from "./diagram/coordinateHelper";
import { Container } from "gui/2D/controls/container";
import { KeyboardManager } from "./keyboardManager";

export enum DragOverLocation {
    ABOVE = 0,
    BELOW = 1,
    CENTER = 2,
    NONE = 3,
}

export enum GUIEditorTool {
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
    private _fromPG: boolean;
    /** DO NOT USE: in the process of removing */
    public blockKeyboardEvents = false;
    onOutlineChangedObservable = new Observable<void>();
    controlCamera: boolean;
    selectionLock: boolean;
    workbench: WorkbenchComponent;
    onPropertyChangedObservable = new Observable<PropertyChangedEvent>();

    private _tool: GUIEditorTool = GUIEditorTool.SELECT;
    private _usePrevSelected: boolean;

    private _prevTool: GUIEditorTool = this._tool;
    onToolChangeObservable = new Observable<void>();
    public get tool(): GUIEditorTool {
        if (this._tool === GUIEditorTool.ZOOM) {
            return GUIEditorTool.ZOOM;
        } else if (this._tool === GUIEditorTool.PAN) {
            return GUIEditorTool.PAN;
        } else {
            return GUIEditorTool.SELECT;
        }
    }
    public set tool(newTool: GUIEditorTool) {
        if (this._tool === newTool) return;
        this._prevTool = this._tool;
        this._tool = newTool;
        this.onToolChangeObservable.notifyObservers();
    }
    public get usePrevSelected() {
        return this._usePrevSelected;
    }
    public set usePrevSelected(val: boolean) {
        this._usePrevSelected = val;
    }

    public restorePreviousTool() {
        if (this._tool !== this._prevTool) {
            this._tool = this._prevTool;
            this.onToolChangeObservable.notifyObservers();
        }
    }
    onFitControlsToWindowObservable = new Observable<void>();
    onReframeWindowObservable = new Observable<void>();
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
    onFontsParsedObservable = new Observable<void>();
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
    public get fromPG() {
        return this._fromPG;
    }
    public set fromPG(value: boolean) {
        this._fromPG = value;
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

    private _findParentControlInTexture(texture: AdvancedDynamicTexture, searchedControl: Control) {
        const searchList = [texture.rootContainer];
        while (searchList.length > 0) {
            const current = searchList.splice(0, 1)[0];
            const children = current.children;
            if (children.indexOf(searchedControl) !== -1) {
                return current;
            }
            for (const child of children) {
                if (child instanceof Container) {
                    searchList.push(child);
                }
            }
        }
        return null;
    }

    public deleteSelectedNodes() {
        for (const control of this.selectedControls) {
            const guiTextureParent = this._findParentControlInTexture(this.guiTexture, control);
            guiTextureParent?.removeControl(control);
            if (this.liveGuiTexture) {
                const allDescendants = control.getDescendants();
                for (const descendant of allDescendants) {
                    const liveGuiTextureDescendantParent = this._findParentControlInTexture(this.liveGuiTexture, descendant);
                    liveGuiTextureDescendantParent?.removeControl(descendant);
                    descendant.dispose();
                }
                const liveGuiTextureParent = this._findParentControlInTexture(this.liveGuiTexture, control);
                liveGuiTextureParent?.removeControl(control);
            }
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
