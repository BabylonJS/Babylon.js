/* eslint-disable @typescript-eslint/naming-convention */
import * as React from "react";
import type { GlobalState } from "../globalState";
import { DragOverLocation, GUIEditorTool } from "../globalState";
import type { Nullable } from "core/types";
import { Control } from "gui/2D/controls/control";
import { AdvancedDynamicTexture } from "gui/2D/advancedDynamicTexture";
import { Vector2, Vector3 } from "core/Maths/math.vector";
import { Engine } from "core/Engines/engine";
import { Scene } from "core/scene";
import { Color4 } from "core/Maths/math.color";
import { ArcRotateCamera } from "core/Cameras/arcRotateCamera";
import { HemisphericLight } from "core/Lights/hemisphericLight";
import { Axis } from "core/Maths/math.axis";
import { Epsilon } from "core/Maths/math.constants";
import { Container } from "gui/2D/controls/container";
import type { KeyboardInfo } from "core/Events/keyboardEvents";
import { KeyboardEventTypes } from "core/Events/keyboardEvents";
import type { Line } from "gui/2D/controls/line";
import type { Grid } from "gui/2D/controls/grid";
import { Tools } from "../tools";
import type { Observable, Observer } from "core/Misc/observable";
import type { ISize } from "core/Maths/math";
import { Texture } from "core/Materials/Textures/texture";
import type { DimensionProperties } from "./coordinateHelper";
import { CoordinateHelper } from "./coordinateHelper";
import { Logger } from "core/Misc/logger";
import "./workbenchCanvas.scss";
import { ValueAndUnit } from "gui/2D/valueAndUnit";
import type { StackPanel } from "gui/2D/controls/stackPanel";
import type { TransformNode } from "core/Meshes/transformNode";
import { RandomGUID } from "core/Misc/guid";
import { DataStorage } from "core/Misc/dataStorage";
import type { Vector2WithInfo } from "gui/2D/math2D";

export interface IWorkbenchComponentProps {
    globalState: GlobalState;
}

export enum ConstraintDirection {
    NONE = 0,
    X = 2, // Horizontal constraint
    Y = 3, // Vertical constraint
}

/**
 * This function will throttle calls to functions.
 *
 * @param callback callback to call.
 * @param time time to wait between calls in ms.
 * @returns callback function.
 */
function throttle(callback: (...args: any[]) => void, time: number) {
    let lastCalledTime: number = 0;
    return function (...args: any[]) {
        const now = Date.now();
        if (now - lastCalledTime < time) {
            return;
        }
        lastCalledTime = now;
        callback(...args);
    };
}

const ARROW_KEY_MOVEMENT_SMALL = 1; // px
const ARROW_KEY_MOVEMENT_LARGE = 5; // px

const MAX_POINTER_TRAVEL_DISTANCE = 5; //px^2. determines how far the pointer can move to be treated as a drag vs. a click
const CONTROL_OFFSET = 10; //offset in pixels for when a control is added to editor

export class WorkbenchComponent extends React.Component<IWorkbenchComponentProps> {
    private _mouseDown: boolean;
    private _rootContainer: React.RefObject<HTMLCanvasElement>;
    private _setConstraintDirection: boolean = false;
    private _mouseStartPoint: Nullable<Vector2> = null;
    public _scene: Scene;
    private _constraintDirection = ConstraintDirection.NONE;
    private _panning: boolean;
    private _isOverGUINode: Control[] = [];
    private _engine: Engine;
    private _guiRenderObserver: Nullable<Observer<AdvancedDynamicTexture>>;
    private _doubleClick: Nullable<Control> = null;
    private _currLeft: number = 0;
    private _currTop: number = 0;
    private _controlsHit: Control[] = [];
    private _pointerTravelDistance = 0;
    private _processSelectionOnUp = false;
    private _visibleRegionContainer: Container;
    private _centerZoomMousePosition: Vector2 = new Vector2(0, 0);
    private _hasPerformedDragZoom: boolean = false;

    private static _addedFonts: string[] = [];
    public static get addedFonts() {
        return this._addedFonts;
    }

    public get visibleRegionContainer() {
        return this._visibleRegionContainer;
    }

    private _panAndZoomContainer: Container;
    public get panAndZoomContainer() {
        return this._panAndZoomContainer;
    }
    private _trueRootContainer: Container;
    public set trueRootContainer(value: Container) {
        if (value === this._trueRootContainer) return;
        this._visibleRegionContainer.children.forEach((child) => this._visibleRegionContainer.removeControl(child));
        this._visibleRegionContainer.addControl(value);
        this._trueRootContainer = value;
        value._host = this.props.globalState.guiTexture;
    }
    public get trueRootContainer() {
        return this._trueRootContainer;
    }

    private _defaultGUISize: ISize = { width: 1024, height: 1024 };
    private _initialPanningOffset: Vector2 = new Vector2(0, 0);
    private _panningOffset = new Vector2(0, 0);
    private _zoomFactor = 1;
    private _zoomModeIncrement = 0.2;
    private _guiSize = this._defaultGUISize;
    private _pasteDisabled = true;

    public get guiSize() {
        return this._guiSize;
    }
    public get pasteDisabled(): boolean {
        return this._pasteDisabled;
    }
    // sets the size of the GUI and makes all necessary adjustments
    public set guiSize(value: ISize) {
        this._guiSize = { ...value };
        this._visibleRegionContainer.widthInPixels = this._guiSize.width;
        this._visibleRegionContainer.heightInPixels = this._guiSize.height;
        this.props.globalState.onResizeObservable.notifyObservers(this._guiSize);
        this.props.globalState.onReframeWindowObservable.notifyObservers();
        this.props.globalState.onWindowResizeObservable.notifyObservers();
    }

    public applyEditorTransformation() {
        const adt = this.props.globalState.guiTexture;
        if (adt._rootContainer != this._panAndZoomContainer) {
            adt._rootContainer = this._panAndZoomContainer;
            this._visibleRegionContainer.addControl(this._trueRootContainer);
            this.props.globalState.guiTexture.markAsDirty();
        }
        if (adt.getSize().width !== this._engine.getRenderWidth() || adt.getSize().height !== this._engine.getRenderHeight()) {
            adt.scaleTo(this._engine.getRenderWidth(), this._engine.getRenderHeight());
        }
        if (adt.getSize().width !== this._engine.getRenderWidth() || adt.getSize().height !== this._engine.getRenderHeight()) {
            adt.scaleTo(this._engine.getRenderWidth(), this._engine.getRenderHeight());
        }
        this._trueRootContainer.clipContent = false;
        this._trueRootContainer.clipChildren = false;
    }

    public removeEditorTransformation() {
        const adt = this.props.globalState.guiTexture;
        if (adt._rootContainer != this._trueRootContainer) {
            this._visibleRegionContainer.removeControl(this._trueRootContainer);
            adt._rootContainer = this._trueRootContainer;
        }
        this._trueRootContainer.clipContent = true;
        this._trueRootContainer.clipChildren = true;
    }

    private _reframeWindow() {
        this._panningOffset = new Vector2(0, 0);
        const xFactor = this._engine.getRenderWidth() / this.guiSize.width;
        const yFactor = this._engine.getRenderHeight() / this.guiSize.height;
        this._zoomFactor = Math.min(xFactor, yFactor) * 0.9;
    }

    constructor(props: IWorkbenchComponentProps) {
        super(props);
        const { globalState } = props;
        this._rootContainer = React.createRef();

        globalState.onSelectionChangedObservable.add(() => this.updateNodeOutlines());

        globalState.onToolChangeObservable.add(() => {
            this.forceUpdate();
        });
        // Get the canvas element from the DOM.

        globalState.onFitControlsToWindowObservable.add(() => {
            if (globalState.selectedControls.length) {
                let minX = Number.MAX_SAFE_INTEGER;
                let minY = Number.MAX_SAFE_INTEGER;

                let maxX = -Number.MAX_SAFE_INTEGER;
                let maxY = -Number.MAX_SAFE_INTEGER;

                // Find bounding box of selected controls
                for (const selectedControl of globalState.selectedControls) {
                    const left = -selectedControl.widthInPixels / 2;
                    const top = -selectedControl.heightInPixels / 2;

                    const right = left! + selectedControl.widthInPixels;
                    const bottom = top! + selectedControl.heightInPixels;

                    // Compute all four corners of the control in root space
                    const leftTopRS = CoordinateHelper.NodeToRTTSpace(selectedControl, left, top, new Vector2(), undefined, this.trueRootContainer);
                    const rightBottomRS = CoordinateHelper.NodeToRTTSpace(selectedControl, right, bottom, new Vector2(), undefined, this.trueRootContainer);
                    const leftBottomRS = CoordinateHelper.NodeToRTTSpace(selectedControl, left, bottom, new Vector2(), undefined, this.trueRootContainer);
                    const rightTopRS = CoordinateHelper.NodeToRTTSpace(selectedControl, right, top, new Vector2(), undefined, this.trueRootContainer);

                    minX = Math.min(minX, leftTopRS.x, rightBottomRS.x, leftBottomRS.x, rightTopRS.x);
                    minY = Math.min(minY, leftTopRS.y, rightBottomRS.y, leftBottomRS.y, rightTopRS.y);

                    maxX = Math.max(maxX, leftTopRS.x, rightBottomRS.x, leftBottomRS.x, rightTopRS.x);
                    maxY = Math.max(maxY, leftTopRS.y, rightBottomRS.y, leftBottomRS.y, rightTopRS.y);
                }

                // Find width and height of bounding box
                const width = maxX - minX;
                const height = maxY - minY;

                // Calculate the offset on the center of the bounding box
                const centerX = (minX + maxX) / 2;
                const centerY = (minY + maxY) / 2;

                this._panningOffset = new Vector2(-centerX, centerY);

                // Calculate the zoom factors based on width and height
                const xFactor = this._engine.getRenderWidth() / width;
                const yFactor = this._engine.getRenderHeight() / height;
                this._zoomFactor = Math.min(xFactor, yFactor) * 0.9;
            } else {
                this._reframeWindow();
            }
        });

        globalState.onReframeWindowObservable.add(() => {
            this._reframeWindow();
        });

        globalState.onOutlineChangedObservable.add(() => {
            this.updateNodeOutlines();
        });

        globalState.onSelectionChangedObservable.add(() => {
            this.updateNodeOutlines();
        });

        globalState.onParentingChangeObservable.add((control) => {
            this.parent(control);
        });

        globalState.hostDocument!.addEventListener("keyup", this.keyEvent, false);

        // Hotkey shortcuts
        globalState.hostDocument!.addEventListener("keydown", this.keyEvent, false);
        globalState.hostDocument!.defaultView!.addEventListener("blur", this.blurEvent, false);
        let framesToUpdate = 1;
        globalState.onWindowResizeObservable.add(() => {
            // update the size for the next 5 frames
            framesToUpdate += 5;
        });
        globalState.onNewSceneObservable.add((scene) => {
            scene &&
                scene.onBeforeRenderObservable.add(() => {
                    if (framesToUpdate > 0) {
                        framesToUpdate--;
                        globalState.onGizmoUpdateRequireObservable.notifyObservers();
                        this._engine.resize();
                        globalState.onArtBoardUpdateRequiredObservable.notifyObservers();
                    }
                });
        });

        globalState.onCopyObservable.add((copyFn) => this.copyToClipboard(copyFn));
        globalState.onCutObservable.add((copyFn) => this.cutToClipboard(copyFn));
        globalState.onPasteObservable.add((content) => this.pasteFromClipboard(content));

        globalState.workbench = this;
        globalState.onResizeObservable.notifyObservers(this._guiSize);

        globalState.onPopupClosedObservable.add(() => {
            this.dispose();
        });
    }

    keyEvent = (evt: KeyboardEvent) => {
        if ((evt.target as HTMLElement).nodeName === "INPUT") return;
        if (evt.shiftKey) {
            this._setConstraintDirection = this._constraintDirection === ConstraintDirection.NONE;
        } else {
            this._setConstraintDirection = false;
            this._constraintDirection = ConstraintDirection.NONE;
        }
        this.props.globalState.shiftKeyPressed = evt.shiftKey && evt.type === "keydown";

        if (evt.key === "Delete" || evt.key === "Backspace") {
            if (!this.props.globalState.lockObject.lock) {
                this.props.globalState.deleteSelectedNodes();
            }
        }

        if (this.props.globalState.keys.isKeyDown("control") && !this.props.globalState.lockObject.lock) {
            if (evt.key === "a") {
                evt.preventDefault();
                this.props.globalState.setSelection(this.trueRootContainer.children);
            }
        }
    };

    public copyToClipboard(copyFn: (content: string) => void) {
        this._pasteDisabled = false;
        const controlList: any[] = [];
        for (const control of this.props.globalState.selectedControls) {
            // For grid controls, have to save current position in it
            if (control.parent?.getClassName() === "Grid") {
                const cellInfo = (control.parent as Grid).getChildCellInfo(control);
                const [row, column] = cellInfo.split(":");
                control.metadata = { ...control.metadata, _cellInfo: { row, column } };
            }
            const obj = {};
            control.serialize(obj);

            controlList.push(obj);
            this._currLeft = control.leftInPixels;
            this._currTop = control.topInPixels;
        }

        copyFn(
            JSON.stringify({
                GUIClipboard: true,
                controls: controlList,
            })
        );
    }

    public cutToClipboard(copyFn: (content: string) => void) {
        this.copyToClipboard(copyFn);
        this.props.globalState.deleteSelectedNodes();
    }

    public pasteFromClipboard(clipboardContents: string) {
        try {
            const parsed = JSON.parse(clipboardContents);
            if (parsed.GUIClipboard) {
                const newSelection = [];
                for (const control of parsed.controls) {
                    newSelection.push(Control.Parse(control, this.props.globalState.guiTexture));
                }

                if (newSelection[0].parent?.typeName != "StackPanel") {
                    this._currLeft += CONTROL_OFFSET;
                    this._currTop += CONTROL_OFFSET;
                }

                newSelection[0].leftInPixels = this._currLeft;
                newSelection[0].topInPixels = this._currTop;

                const newGuiNode = this.props.globalState.workbench.appendBlock(newSelection[0]);
                if (newGuiNode.parent?.typeName === "Grid" && newGuiNode.metadata?._cellInfo) {
                    const { row, column } = newGuiNode.metadata._cellInfo;
                    const gridParent = newGuiNode.parent as Grid;
                    gridParent.removeControl(newGuiNode);
                    gridParent.addControl(newGuiNode, parseInt(row), parseInt(column));
                }
                this.props.globalState.setSelection([newGuiNode]);

                return true;
            }
        } catch {
            // don't need an error message
        }
        Logger.Warn("Paste attempted, but clipboard content was invalid.");
        return false;
    }

    public CopyGUIControl(original: Control) {
        const serializationObject = {};
        original.serialize(serializationObject);
        const newControl = Control.Parse(serializationObject, this.props.globalState.guiTexture);

        if (newControl) {
            //insert the new control into the adt or parent container
            this.props.globalState.workbench.appendBlock(newControl);
            this.props.globalState.guiTexture.removeControl(newControl);
            if (original.parent?.typeName === "Grid") {
                const cell = Tools.GetCellInfo(original.parent as Grid, original);
                (original.parent as Grid).addControl(newControl, cell.x, cell.y);
            } else {
                original.parent?.addControl(newControl);
            }
            let index = 1;
            while (
                this.props.globalState.guiTexture.getDescendants(false).filter(
                    //search if there are any copies
                    (control) => control.name === `${newControl.name} Copy ${index}`
                ).length
            ) {
                index++;
            }
            newControl.name = `${newControl.name} Copy ${index}`;
            this.props.globalState.select(newControl);
        }
    }

    blurEvent = () => {
        this._constraintDirection = ConstraintDirection.NONE;
        this.props.globalState.onPointerUpObservable.notifyObservers(null);
    };

    /**
     * Adds editor observers to control and stores old data in metadata
     * @param guiControl
     */
    addEditorBehavior(guiControl: Control) {
        guiControl.onPointerUpObservable.add(() => {
            this.clicked = false;
        });

        guiControl.onPointerDownObservable.add((evt) => {
            if (evt.buttonIndex > 0 || this.props.globalState.tool !== GUIEditorTool.SELECT) return;
            this._controlsHit.push(guiControl);
        });

        guiControl.onPointerEnterObservable.add(() => {
            if (this._isOverGUINode.indexOf(guiControl) === -1) {
                this._isOverGUINode.push(guiControl);
            }
        });

        guiControl.onPointerOutObservable.add(() => {
            const index = this._isOverGUINode.indexOf(guiControl);
            if (index !== -1) {
                this._isOverGUINode.splice(index, 1);
            }
        });

        guiControl.onDisposeObservable.add(() => {
            const index = this._isOverGUINode.indexOf(guiControl);
            if (index !== -1) {
                this._isOverGUINode.splice(index, 1);
            }
        });

        guiControl.metadata = {
            ...guiControl.metadata,
            guiEditor: true,
        };
    }

    /**
     * Removes editor behavior (observables, metadata) from control
     * @param control
     */
    removeEditorBehavior(control: Control) {
        if (!control.metadata || !control.metadata.guiEditor) {
            return;
        }
        delete control.metadata.guiEditor;
        delete control.metadata.editorUniqueId;
    }

    dispose() {
        this.props.globalState.hostDocument!.removeEventListener("keyup", this.keyEvent);
        this.props.globalState.hostDocument!.removeEventListener("keydown", this.keyEvent);
        this.props.globalState.hostDocument!.defaultView!.removeEventListener("blur", this.blurEvent);
        if (this._guiRenderObserver) {
            this.props.globalState.guiTexture.onEndRenderObservable.remove(this._guiRenderObserver);
        }
        this._engine.dispose();
    }

    loadFromJson(serializationObject: any) {
        this.removeEditorTransformation();
        this.props.globalState.setSelection([]);
        if (this.props.globalState.liveGuiTexture) {
            this.props.globalState.liveGuiTexture?.parseContent(serializationObject, true);
            this.synchronizeLiveGUI();
        } else {
            this.props.globalState.guiTexture.parseContent(serializationObject, true);
        }
        this.trueRootContainer = this.props.globalState.guiTexture._rootContainer;
        this.guiSize = this.props.globalState.guiTexture.getSize();
        this.loadToEditor();
    }

    /**
     * Load Control from Json then select loaded Control
     * @param serializationObject
     */
    loadControlFromJson(serializationObject: any) {
        const newControls = [];
        for (const control of serializationObject.controls) {
            const newControl = Control.Parse(control, this.props.globalState.guiTexture);
            newControls.push(newControl);
            const newGuiNode = this.props.globalState.workbench.appendBlock(newControl);
            if (newGuiNode.parent?.typeName === "Grid" && newGuiNode.metadata?._cellInfo) {
                const { row, column } = newGuiNode.metadata._cellInfo;
                const gridParent = newGuiNode.parent as Grid;
                gridParent.removeControl(newGuiNode);
                gridParent.addControl(newGuiNode, parseInt(row), parseInt(column));
            }
        }
        this.props.globalState.setSelection(newControls);
    }

    async loadFromSnippet(snippetId: string) {
        this.removeEditorTransformation();
        this.props.globalState.setSelection([]);
        if (this.props.globalState.liveGuiTexture) {
            await this.props.globalState.liveGuiTexture?.parseFromSnippetAsync(snippetId, true);
            this.synchronizeLiveGUI();
        } else {
            await this.props.globalState.guiTexture.parseFromSnippetAsync(snippetId, true);
        }
        this.trueRootContainer = this.props.globalState.guiTexture._rootContainer;
        this.guiSize = this.props.globalState.guiTexture.getSize();
        this.loadToEditor();
        if (this.props.globalState.customLoad) {
            this.props.globalState.customLoad.action(snippetId).catch(() => {
                alert("Unable to load your GUI");
            });
        }
    }

    loadToEditor() {
        this.props.globalState.guiTexture.rootContainer.getDescendants().forEach((guiElement) => {
            const fontName = guiElement.fontFamily.trim().toLowerCase();
            if (WorkbenchComponent._addedFonts.indexOf(fontName) === -1) {
                WorkbenchComponent._addedFonts.push(guiElement.fontFamily);
            }
            this.addEditorBehavior(guiElement);
        });

        this._isOverGUINode = [];
        this.props.globalState.setSelection([]);
        this.props.globalState.onFitControlsToWindowObservable.notifyObservers();
        this.props.globalState.onFontsParsedObservable.notifyObservers();
    }

    public updateNodeOutlines() {
        for (const guiControl of this._trueRootContainer.getDescendants()) {
            guiControl.isHighlighted = guiControl.getClassName() === "Grid" && (this.props.globalState.outlines || this.props.globalState.selectedControls.includes(guiControl));
            guiControl.highlightLineWidth = 5;
        }
    }

    appendBlock(guiElement: Control) {
        this.addEditorBehavior(guiElement);
        guiElement.getDescendants(true).forEach((desc) => this.addEditorBehavior(desc));
        if (this.props.globalState.selectedControls.length != 0) {
            this.props.globalState.selectedControls[0].parent?.addControl(guiElement);
        } else {
            this.trueRootContainer.addControl(guiElement);
        }
        return guiElement;
    }
    private parent(dropLocationControl: Nullable<Control>) {
        const draggedControl = this.props.globalState.draggedControl;
        const draggedControlParent = draggedControl?.parent;
        if (draggedControlParent && draggedControl) {
            if (this._isNotChildInsert(dropLocationControl, draggedControl)) {
                //checking to make sure the element is not being inserted into a child

                if (dropLocationControl != null) {
                    //the control you are dragging onto top
                    if (
                        dropLocationControl instanceof Container && //dropping inside a container control
                        this.props.globalState.draggedControlDirection === DragOverLocation.CENTER
                    ) {
                        draggedControlParent.removeControl(draggedControl);
                        (dropLocationControl as Container).addControl(draggedControl);
                    } else if (dropLocationControl.parent) {
                        //dropping inside the controls parent container
                        if (dropLocationControl.parent.typeName !== "Grid") {
                            draggedControlParent.removeControl(draggedControl);
                            let index = dropLocationControl.parent.children.indexOf(dropLocationControl);
                            const reverse = dropLocationControl.parent.typeName === "StackPanel" || dropLocationControl.parent.typeName === "VirtualKeyboard";

                            index = this._adjustParentingIndex(index, reverse); //adjusting index to be before or after based on where the control is over

                            dropLocationControl.parent.children.splice(index, 0, draggedControl);
                            draggedControl.parent = dropLocationControl.parent;
                        } else if (dropLocationControl.parent === draggedControlParent) {
                            //special case for grid
                            this._reorderGrid(dropLocationControl.parent as Grid, draggedControl, dropLocationControl);
                        } else {
                            draggedControlParent.removeControl(draggedControl);
                            (dropLocationControl.parent as Container).addControl(draggedControl);
                            this._reorderGrid(dropLocationControl.parent as Grid, draggedControl, dropLocationControl);
                        }
                    } else {
                        draggedControlParent.removeControl(draggedControl);
                        this.trueRootContainer.addControl(draggedControl);
                    }
                } else {
                    draggedControlParent.removeControl(draggedControl);
                    this.trueRootContainer.addControl(draggedControl);
                    this.trueRootContainer.children.pop();
                    this.trueRootContainer.children.splice(0, 0, draggedControl);
                }
            }
        }

        if (draggedControl) {
            const newParent = draggedControl.parent;
            if (newParent) {
                if (newParent.typeName === "StackPanel" || newParent.typeName === "VirtualKeyboard") {
                    const isVertical = (newParent as StackPanel).isVertical;
                    if (draggedControl._width.unit === ValueAndUnit.UNITMODE_PERCENTAGE && !isVertical) {
                        CoordinateHelper.ConvertToPixels(draggedControl, ["width"]);
                        this.props.globalState.hostWindow.alert("Warning: Parenting to horizontal stack panel converts width to pixel values");
                    }
                    if (draggedControl._height.unit === ValueAndUnit.UNITMODE_PERCENTAGE && isVertical) {
                        CoordinateHelper.ConvertToPixels(draggedControl, ["height"]);
                        this.props.globalState.hostWindow.alert("Warning: Parenting to vertical stack panel converts height to pixel values");
                    }
                }
                // Force containers to re-render if we added a new child
                newParent.markAsDirty();
            }
        }
        this.props.globalState.draggedControl = null;
    }

    private _canClone() {
        return this.props.globalState.liveGuiTexture && this.props.globalState.guiTexture && this.trueRootContainer;
    }

    private _controlToLinkedMeshMap = new Map<Control, TransformNode>();
    private _observersMap = {
        onPointerDownObservable: new Map<string, Observable<Vector2WithInfo>>(),
        onPointerUpObservable: new Map<string, Observable<Vector2WithInfo>>(),
        onPointerMoveObservable: new Map<string, Observable<Vector2WithInfo>>(),
        onPointerEnterObservable: new Map<string, Observable<Vector2WithInfo>>(),
        onPointerOutObservable: new Map<string, Observable<Vector2WithInfo>>(),
        onPointerClickObservable: new Map<string, Observable<Vector2WithInfo>>(),
        onDisposeObservable: new Map<string, Observable<Control>>(),
        onIsVisibleChangedObservable: new Map<string, Observable<boolean>>(),
        onBeforeDrawObservable: new Map<string, Observable<Control>>(),
        onAfterDrawObservable: new Map<string, Observable<Control>>(),
        onWheelObservable: new Map<string, Observable<WheelEvent>>(),
    };

    private _saveObservables(root: Container) {
        root.getDescendants().forEach((control) => {
            if (control.linkedMesh) {
                this._controlToLinkedMeshMap.set(control.metadata.editorUniqueId, control.linkedMesh);
            }

            Object.keys(this._observersMap).forEach((key) => {
                const observable = (control as any)[key];
                if (observable.hasObservers()) {
                    (this._observersMap as any)[key].set(control.metadata.editorUniqueId, observable);
                }
            });
        });
    }

    private _restoreObservables(root: Container) {
        root.getDescendants().forEach((control) => {
            if (this._controlToLinkedMeshMap.has(control.metadata?.editorUniqueId)) {
                const linkedMesh = this._controlToLinkedMeshMap.get(control.metadata.editorUniqueId);
                if (linkedMesh) {
                    control.linkWithMesh(linkedMesh);
                }
            }

            Object.keys(this._observersMap).forEach((key) => {
                const savedObservable = (this._observersMap as any)[key].get(control.metadata?.editorUniqueId);
                if (savedObservable) {
                    (control as any)[key] = savedObservable;
                }
            });
        });

        this._controlToLinkedMeshMap.clear();
        Object.keys(this._observersMap).forEach((key) => {
            (this._observersMap as any)[key].clear();
        });
    }

    private _copyEditorGUIToLiveGUI() {
        if (this._canClone()) {
            // Before cloning, save all of the live GUI controls that have a linked mesh
            const liveRoot = this.props.globalState.liveGuiTexture!.rootContainer;
            this._saveObservables(liveRoot);
            liveRoot.clearControls();

            const originalToCloneMap = new Map<Control, Control>();
            const updatedRootChildren = this.trueRootContainer.children.slice(0);
            for (const child of updatedRootChildren) {
                const clone = child.clone(this.props.globalState.liveGuiTexture!);
                originalToCloneMap.set(child, clone);
                liveRoot.addControl(clone);
            }

            // Relink all meshes
            this._restoreObservables(liveRoot);
            this._syncConnectedLines(updatedRootChildren, originalToCloneMap);
        }
    }

    private _reorderGrid(grid: Grid, draggedControl: Control, dropLocationControl: Control) {
        const cellInfo = Tools.GetCellInfo(grid, draggedControl);
        grid.removeControl(draggedControl);

        let index = grid.children.indexOf(dropLocationControl);
        index = this._adjustParentingIndex(index);

        Tools.ReorderGrid(grid, index, draggedControl, cellInfo);
    }

    private _isNotChildInsert(control: Nullable<Control>, draggedControl: Nullable<Control>) {
        while (control?.parent) {
            if (control.parent == draggedControl) {
                return false;
            }
            control = control.parent;
        }
        return true;
    }

    private _adjustParentingIndex(index: number, reversed: boolean = false) {
        switch (this.props.globalState.draggedControlDirection) {
            case DragOverLocation.ABOVE:
                return reversed ? index : index + 1;
            case DragOverLocation.BELOW:
            case DragOverLocation.CENTER:
                return reversed ? index + 1 : index;
        }
        return index;
    }

    public isSelected(value: boolean, guiNode: Control) {
        this.props.globalState.select(guiNode);
    }

    public clicked: boolean;

    public _onMove(guiControl: Control, evt: Vector2, startPos: Vector2) {
        const toConvert: DimensionProperties[] = [];
        if (guiControl._top.unit === ValueAndUnit.UNITMODE_PERCENTAGE) {
            toConvert.push("top");
        }
        if (guiControl._left.unit === ValueAndUnit.UNITMODE_PERCENTAGE) {
            toConvert.push("left");
        }
        let newX = evt.x - startPos.x;
        let newY = evt.y - startPos.y;

        if (this._setConstraintDirection) {
            this._setConstraintDirection = false;
            this._constraintDirection = Math.abs(newX) >= Math.abs(newY) ? ConstraintDirection.X : ConstraintDirection.Y;
        }

        if (this._constraintDirection === ConstraintDirection.X) {
            newY = 0;
        } else if (this._constraintDirection === ConstraintDirection.Y) {
            newX = 0;
        }
        const referenceAxis = new Vector2(newX, newY);

        if (guiControl.typeName === "Line") {
            const line = guiControl as Line;
            const x1 = (line.x1 as string).substr(0, (line.x1 as string).length - 2); //removing the 'px'
            const x2 = (line.x2 as string).substr(0, (line.x2 as string).length - 2);
            const y1 = (line.y1 as string).substr(0, (line.y1 as string).length - 2);
            const y2 = (line.y2 as string).substr(0, (line.y2 as string).length - 2);
            line.x1 = (Number(x1) + newX).toFixed(2);
            line.x2 = (Number(x2) + newX).toFixed(2);
            line.y1 = (Number(y1) + newY).toFixed(2);
            line.y2 = (Number(y2) + newY).toFixed(2);
            this.props.globalState.onPropertyGridUpdateRequiredObservable.notifyObservers();
            return;
        }

        let totalRotation = 0;
        let currentControl: Nullable<Control> = guiControl.parent;
        while (currentControl) {
            totalRotation += currentControl.rotation;

            currentControl = currentControl.parent;
        }
        const rotatedReferenceAxis = new Vector2(0, 0);

        // Rotate the reference axis by the total rotation of the control
        const sinR = Math.sin(-totalRotation);
        const cosR = Math.cos(-totalRotation);
        rotatedReferenceAxis.x = cosR * referenceAxis.x - sinR * referenceAxis.y;
        rotatedReferenceAxis.y = sinR * referenceAxis.x + cosR * referenceAxis.y;

        // Apply the amount of change
        guiControl.leftInPixels += rotatedReferenceAxis.x;
        guiControl.topInPixels += rotatedReferenceAxis.y;

        CoordinateHelper.ConvertToPercentage(guiControl, toConvert);
        this.props.globalState.onPropertyGridUpdateRequiredObservable.notifyObservers();
    }

    onMove(evt: React.PointerEvent) {
        const pos = this.getScaledPointerPosition();
        // Move or guiNodes
        if (this._mouseStartPoint != null && !this._panning) {
            this.props.globalState.selectedControls.forEach((element) => {
                if (pos) {
                    this._onMove(element, pos, this._mouseStartPoint!);
                }
            });

            this._mouseStartPoint = pos ? pos : this._mouseStartPoint;
        }
        this._pointerTravelDistance += evt.movementX * evt.movementX + evt.movementY * evt.movementY;
        if (this._panning) {
            this.panning();
        }
    }

    private _screenToTexturePosition(screenPos: Vector2) {
        const zoomVector = new Vector2(this._zoomFactor, this._zoomFactor);
        return screenPos.divideInPlace(zoomVector).add(this._panningOffset);
    }

    private getScaledPointerPosition() {
        return this._screenToTexturePosition(new Vector2(this._scene.pointerX, this._scene.pointerY));
    }

    startPanning() {
        this._panning = true;
        this._initialPanningOffset = this.getScaledPointerPosition();
    }

    endPanning() {
        this._panning = false;
    }

    processSelection() {
        // if hit nothing, deselect all
        if (this.props.globalState.usePrevSelected) {
            this.props.globalState.usePrevSelected = false;
            return;
        }
        if (this._controlsHit.length === 0) {
            this.props.globalState.setSelection([]);
            return;
        }

        // if child of selected control -> select on double click
        for (const control of this._controlsHit) {
            if (this.props.globalState.selectedControls.includes(control.parent!)) {
                if (this._doubleClick === control) {
                    this.props.globalState.select(control);
                    return;
                } else {
                    this._doubleClick = control;
                    window.setTimeout(() => {
                        this._doubleClick = null;
                    }, 300);
                }
            }
        }

        // if control or sibling of control already selected -> select
        for (const control of this._controlsHit) {
            for (const selected of this.props.globalState.selectedControls) {
                if (selected.parent === control.parent) {
                    this.props.globalState.select(control);
                    return;
                }
                break; // we don't need to check any more since it's guaranteed that all selected controls have same parent
            }
        }
        // if control is child of root -> select
        for (const control of this._controlsHit) {
            if (control.parent === this._trueRootContainer) {
                this.props.globalState.select(control);
            }
        }
    }

    onDown(evt: React.PointerEvent<HTMLElement>) {
        this._pointerTravelDistance = 0;
        this._rootContainer.current?.setPointerCapture(evt.pointerId);

        if (this.props.globalState.tool === GUIEditorTool.SELECT) {
            this._mouseStartPoint = this.getScaledPointerPosition();
        }
        if (this.props.globalState.tool === GUIEditorTool.ZOOM) {
            this._centerZoomMousePosition.set(this._scene.pointerX, this._scene.pointerY);
        }
        if (evt.buttons & 4 || this.props.globalState.tool === GUIEditorTool.PAN) {
            this.startPanning();
        } else {
            this.endPanning();
            // process selection
            if (this.props.globalState.selectedControls.length !== 0) {
                this._processSelectionOnUp = true;
            }
            this._scene.onAfterRenderObservable.addOnce(() => {
                // if we didn't hit any selected controls, immediately process new selection
                if (!this._processSelectionOnUp || this._controlsHit.filter((control) => this.props.globalState.selectedControls.includes(control)).length === 0) {
                    this.processSelection();
                    this._controlsHit = [];
                    this._processSelectionOnUp = false;
                }
            });
        }
    }

    onUp(evt: React.PointerEvent) {
        if (this.props.globalState.tool === GUIEditorTool.ZOOM && !this._hasPerformedDragZoom) {
            this._panZoomToCenter(1000 * this._zoomModeIncrement, new Vector2(this._scene.pointerX, this._scene.pointerY));
            this.zooming(1.0 + (this.props.globalState.keys.isKeyDown("alt") ? -this._zoomModeIncrement : this._zoomModeIncrement));
        }
        this._hasPerformedDragZoom = false;
        this._mouseStartPoint = null;
        this._centerZoomMousePosition.set(0, 0);
        this._constraintDirection = ConstraintDirection.NONE;
        this._rootContainer.current?.releasePointerCapture(evt.pointerId);
        this._panning = false;
        if (this._processSelectionOnUp) {
            if (Math.sqrt(this._pointerTravelDistance) <= MAX_POINTER_TRAVEL_DISTANCE) {
                this.processSelection();
            }
            this._controlsHit = [];
            this._processSelectionOnUp = false;
        }
    }

    private _syncConnectedLines(controlList: Control[], originalToCloneMap: Map<Control, Control>) {
        for (const control of controlList) {
            if (control.getClassName() === "Line") {
                const lineControl = control as Line;
                if (lineControl.connectedControl) {
                    const connectedControl = lineControl.connectedControl;
                    const clonedLine = originalToCloneMap.get(lineControl) as Line;
                    const clonedConnectedControl = originalToCloneMap.get(connectedControl);
                    if (clonedLine && clonedConnectedControl) {
                        clonedLine.connectedControl = clonedConnectedControl;
                    }
                }
            }
        }
    }

    private _copyLiveGUIToEditorGUI() {
        if (this.props.globalState.liveGuiTexture && this.trueRootContainer) {
            // Create special IDs that will allow us to know which cloned control corresponds to its original
            this.props.globalState.liveGuiTexture.rootContainer.getDescendants().forEach((control) => {
                control.metadata = { ...(control.metadata ?? {}), editorUniqueId: RandomGUID() };
            });
            this.trueRootContainer.clearControls();
            const originalToCloneMap = new Map<Control, Control>();
            for (const control of this.props.globalState.liveGuiTexture.rootContainer.children) {
                const cloned = control.clone(this.props.globalState.guiTexture);
                originalToCloneMap.set(control, cloned);
                this.appendBlock(cloned);
            }
            // Synchronize existing connectedControls
            this._syncConnectedLines(this.props.globalState.liveGuiTexture.rootContainer.children, originalToCloneMap);
        }
    }

    public createGUICanvas(embed?: boolean) {
        // Get the canvas element from the DOM.

        const canvas = this._rootContainer.current as HTMLCanvasElement;
        // Associate a Babylon Engine to it.
        this._engine = new Engine(canvas);

        // Create our first scene.
        this._scene = new Scene(this._engine);

        this._scene.clearColor = new Color4(0, 0, 0, 0);
        const light = new HemisphericLight("light1", Axis.Y, this._scene);
        light.intensity = 0.9;

        if (this.props.globalState.liveGuiTexture) {
            this._guiSize.width = this.props.globalState.liveGuiTexture.getSize().width;
            this._guiSize.height = this.props.globalState.liveGuiTexture.getSize().height;

            canvas.width = this._guiSize.width;
            canvas.height = this._guiSize.height;
        } else {
            this._guiSize.width = DataStorage.ReadNumber("GUIEditorWidth", 1024);
            this._guiSize.height = DataStorage.ReadNumber("GUIEditorHeight", 1024);
        }

        this._panAndZoomContainer = new Container("panAndZoom");
        this._panAndZoomContainer.clipContent = false;
        this._panAndZoomContainer.clipChildren = false;

        this._visibleRegionContainer = new Container("visibleRegion");
        this._visibleRegionContainer.clipChildren = false;
        this._visibleRegionContainer.clipContent = false;
        this._visibleRegionContainer.widthInPixels = this.guiSize.width;
        this._visibleRegionContainer.heightInPixels = this.guiSize.height;
        this._panAndZoomContainer.addControl(this._visibleRegionContainer);

        const adt =
            (this.props.globalState.guiTexture =
            this._visibleRegionContainer._host =
            this._panAndZoomContainer._host =
                AdvancedDynamicTexture.CreateFullscreenUI("guiTexture", true, this._scene, Texture.NEAREST_NEAREST_MIPNEAREST, false));

        adt.useInvalidateRectOptimization = false;
        this.trueRootContainer = adt.rootContainer;
        adt.onEndRenderObservable.add(() => this.props.globalState.onGizmoUpdateRequireObservable.notifyObservers());

        this._copyLiveGUIToEditorGUI();

        new ArcRotateCamera("Camera", 0, 0, 0, Vector3.Zero(), this._scene);

        // This attaches the mouse controls
        this.addControls(this._scene);

        this._scene.getEngine().onCanvasPointerOutObservable.clear();
        this._scene.doNotHandleCursors = true;

        // Watch for browser/canvas resize events
        this.props.globalState.hostWindow.addEventListener("resize", () => {
            this.props.globalState.onWindowResizeObservable.notifyObservers();
            this._scene.onBeforeRenderObservable.addOnce(() => {
                this.props.globalState.onWindowResizeObservable.notifyObservers();
            });
        });
        this.props.globalState.onWindowResizeObservable.notifyObservers();

        this.props.globalState.guiTexture.onBeginRenderObservable.add(() => {
            this.applyEditorTransformation();
        });

        this.props.globalState.onPropertyChangedObservable.add((ev) => {
            (ev.object as Control).markAsDirty(false);
            this.props.globalState.onWindowResizeObservable.notifyObservers();
        });

        const throttledSynchronization = throttle(() => {
            this._copyEditorGUIToLiveGUI();
        }, 33);

        if (this.props.globalState.liveGuiTexture) {
            this._guiRenderObserver = this.props.globalState.guiTexture.onEndRenderObservable.add(throttledSynchronization);
        }

        this._engine.runRenderLoop(() => {
            this._scene.render();
        });
        this.props.globalState.onNewSceneObservable.notifyObservers(this.props.globalState.guiTexture.getScene());
        this.props.globalState.onPropertyGridUpdateRequiredObservable.notifyObservers();
        this.props.globalState.onFitControlsToWindowObservable.notifyObservers();
    }

    // removes all controls from both GUIs, and re-adds the controls from the original to the GUI editor
    synchronizeLiveGUI() {
        if (this.props.globalState.liveGuiTexture) {
            this._trueRootContainer.getDescendants().forEach((desc) => desc.dispose());
            this.props.globalState.liveGuiTexture.rootContainer.getDescendants(true).forEach((desc) => {
                this.props.globalState.liveGuiTexture?.removeControl(desc);
                this.appendBlock(desc);
            });
            this.props.globalState.guiTexture.snippetId = this.props.globalState.liveGuiTexture.snippetId;
        }
    }

    //Add zoom and pan controls
    addControls(scene: Scene) {
        scene.onKeyboardObservable.add((k: KeyboardInfo) => {
            switch (k.event.key) {
                case "ArrowUp": // move up
                    this.moveControls(false, k.event.shiftKey ? -ARROW_KEY_MOVEMENT_LARGE : -ARROW_KEY_MOVEMENT_SMALL);
                    break;
                case "ArrowDown": // move down
                    this.moveControls(false, k.event.shiftKey ? ARROW_KEY_MOVEMENT_LARGE : ARROW_KEY_MOVEMENT_SMALL);
                    break;
                case "ArrowLeft": // move left
                    this.moveControls(true, k.event.shiftKey ? -ARROW_KEY_MOVEMENT_LARGE : -ARROW_KEY_MOVEMENT_SMALL);
                    break;
                case "ArrowRight": // move right
                    this.moveControls(true, k.event.shiftKey ? ARROW_KEY_MOVEMENT_LARGE : ARROW_KEY_MOVEMENT_SMALL);
                    break;
            }
        }, KeyboardEventTypes.KEYDOWN);

        scene.onBeforeRenderObservable.add(() => {
            if (this._panAndZoomContainer.scaleX !== this._zoomFactor) {
                this._panAndZoomContainer.scaleX = this._zoomFactor;
                this._panAndZoomContainer.scaleY = this._zoomFactor;
                this.props.globalState.onArtBoardUpdateRequiredObservable.notifyObservers();
                this.props.globalState.onGizmoUpdateRequireObservable.notifyObservers();
            }
            const left = this._zoomFactor * this._panningOffset.x;
            const top = this._zoomFactor * -this._panningOffset.y;
            if (this._panAndZoomContainer.leftInPixels !== left || this._panAndZoomContainer.topInPixels !== top) {
                this._panAndZoomContainer.leftInPixels = left;
                this._panAndZoomContainer.topInPixels = top;
                this.props.globalState.onArtBoardUpdateRequiredObservable.notifyObservers();
                this.props.globalState.onGizmoUpdateRequireObservable.notifyObservers();
            }
        });
    }

    //Return offsets for inertial panning given initial and current pointer positions
    panning() {
        const panningDelta = this.getScaledPointerPosition().subtract(this._initialPanningOffset).multiplyByFloats(1, -1);
        this._panningOffset = this._panningOffset.add(panningDelta);
        this._initialPanningOffset = this.getScaledPointerPosition();
        this.props.globalState.onWindowResizeObservable.notifyObservers();
    }

    // Move the selected controls. Can be either on horizontal (leftInPixels) or
    // vertical (topInPixels) direction
    moveControls(moveHorizontal: boolean, amount: number) {
        for (const selectedControl of this.props.globalState.selectedControls) {
            if (moveHorizontal) {
                // move horizontal
                const prevValue = selectedControl.leftInPixels;
                selectedControl.leftInPixels += amount;
                this.props.globalState.onPropertyChangedObservable.notifyObservers({
                    object: selectedControl,
                    property: "leftInPixels",
                    value: selectedControl.leftInPixels,
                    initialValue: prevValue,
                });
                this.props.globalState.onPropertyGridUpdateRequiredObservable.notifyObservers();
            } else {
                // move vertical
                const prevValue = selectedControl.topInPixels;
                selectedControl.topInPixels += amount;
                this.props.globalState.onPropertyChangedObservable.notifyObservers({
                    object: selectedControl,
                    property: "topInPixels",
                    value: selectedControl.topInPixels,
                    initialValue: prevValue,
                });
                this.props.globalState.onPropertyGridUpdateRequiredObservable.notifyObservers();
            }
        }
    }

    //Get the wheel delta
    zoomWheel(event: React.WheelEvent) {
        let delta = 0;
        if (event.deltaY) {
            delta = -event.deltaY;
        } else if (event.detail) {
            delta = -event.detail;
        }
        const mouseCenter = new Vector2(this._scene.pointerX, this._scene.pointerY);
        this._panZoomToCenter(delta, mouseCenter);
        this.zooming(1 + delta / 1000);
    }

    private _panZoomToCenter(delta: number, mouseCenter: Vector2) {
        const mouseToRtt = CoordinateHelper.MousePointerToRTTSpace(this.trueRootContainer, mouseCenter.x, mouseCenter.y);
        const rttToLocal = CoordinateHelper.RttToLocalNodeSpace(this.trueRootContainer, mouseToRtt.x, mouseToRtt.y);

        const centerToRtt = CoordinateHelper.MousePointerToRTTSpace(this.trueRootContainer, this._engine.getRenderWidth() / 2, this._engine.getRenderHeight() / 2);
        const centerToLocal = CoordinateHelper.RttToLocalNodeSpace(this.trueRootContainer, centerToRtt.x, centerToRtt.y);
        const panScale = -delta / 1000;

        const deltaCenter = rttToLocal.subtract(centerToLocal).scale(panScale).multiplyByFloats(1, -1);

        this._panningOffset.addInPlace(deltaCenter);
    }

    zoomDrag(event: React.MouseEvent) {
        let delta = 0;
        if (event.movementY !== 0) {
            delta = -event.movementY;
        }
        this._hasPerformedDragZoom = true;
        this._panZoomToCenter(delta, this._centerZoomMousePosition);
        this.zooming(1 + delta / 1000);
    }

    //Zoom to pointer position. Zoom amount determined by delta
    zooming(delta: number) {
        this._zoomFactor *= delta;
    }

    //Sets x y or z of passed in vector to zero if less than Epsilon
    zeroIfClose(vec: Vector3) {
        if (Math.abs(vec.x) < Epsilon) {
            vec.x = 0;
        }
        if (Math.abs(vec.y) < Epsilon) {
            vec.y = 0;
        }
        if (Math.abs(vec.z) < Epsilon) {
            vec.z = 0;
        }
    }

    render() {
        let cursor = "default";
        if (this.props.globalState.tool === GUIEditorTool.PAN) {
            cursor = "grab";
        } else if (this.props.globalState.tool === GUIEditorTool.ZOOM) {
            cursor = this.props.globalState.keys.isKeyDown("alt") ? "zoom-out" : "zoom-in";
        }
        return (
            <canvas
                id="workbench-canvas"
                onPointerMove={(evt) => {
                    if (this._mouseDown && this.props.globalState.tool === GUIEditorTool.ZOOM) {
                        this.zoomDrag(evt);
                    }

                    if (this.props.globalState.guiTexture) {
                        this.onMove(evt);
                    }

                    this.props.globalState.onPointerMoveObservable.notifyObservers(evt);
                }}
                onPointerDown={(evt) => {
                    this.onDown(evt);
                    if (this._controlsHit.length === 0) {
                        this._mouseDown = true;
                    } else {
                        this._mouseDown = false;
                    }
                }}
                onPointerUp={(evt) => {
                    this.onUp(evt);
                    this.props.globalState.onPointerUpObservable.notifyObservers(evt);
                    this._mouseDown = false;
                }}
                onWheel={(evt) => this.zoomWheel(evt)}
                onContextMenu={(evt) => evt.preventDefault()}
                ref={this._rootContainer}
                style={{ cursor }}
            ></canvas>
        );
    }
}
