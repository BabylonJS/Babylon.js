import * as React from "react";
import { DragOverLocation, GlobalState } from "../globalState";
import { Nullable } from "babylonjs/types";
import { Control } from "babylonjs-gui/2D/controls/control";
import { AdvancedDynamicTexture } from "babylonjs-gui/2D/advancedDynamicTexture";
import { Vector2, Vector3 } from "babylonjs/Maths/math.vector";
import { Engine } from "babylonjs/Engines/engine";
import { Scene } from "babylonjs/scene";
import { Color4 } from "babylonjs/Maths/math.color";
import { ArcRotateCamera } from "babylonjs/Cameras/arcRotateCamera";
import { HemisphericLight } from "babylonjs/Lights/hemisphericLight";
import { Axis } from "babylonjs/Maths/math.axis";
import { PointerEventTypes } from "babylonjs/Events/pointerEvents";
import { IWheelEvent } from "babylonjs/Events/deviceInputEvents";
import { Epsilon } from "babylonjs/Maths/math.constants";
import { Container } from "babylonjs-gui/2D/controls/container";
import { KeyboardEventTypes, KeyboardInfo } from "babylonjs/Events/keyboardEvents";
import { Line } from "babylonjs-gui/2D/controls/line";
import { DataStorage } from "babylonjs/Misc/dataStorage";
import { Grid } from "babylonjs-gui/2D/controls/grid";
import { Tools } from "../tools";
import { Observer } from "babylonjs/Misc/observable";
import { ISize } from "babylonjs/Maths/math";
import { Texture } from "babylonjs/Materials/Textures/texture";
import { CoordinateHelper } from "./coordinateHelper";
import { Logger } from "babylonjs/Misc/logger";
require("./workbenchCanvas.scss");

export interface IWorkbenchComponentProps {
    globalState: GlobalState;
}

export enum ConstraintDirection {
    NONE = 0,
    X = 2, // Horizontal constraint
    Y = 3, // Vertical constraint
}

export class WorkbenchComponent extends React.Component<IWorkbenchComponentProps> {
    private _rootContainer: React.RefObject<HTMLCanvasElement>;
    private _setConstraintDirection: boolean = false;
    private _mouseStartPointX: Nullable<number> = null;
    private _mouseStartPointY: Nullable<number> = null;
    public _scene: Scene;
    private _selectedGuiNodes: Control[] = [];
    private _ctrlKeyIsPressed = false;
    private _altKeyIsPressed = false;
    private _constraintDirection = ConstraintDirection.NONE;
    private _forcePanning = false;
    private _forceZooming = false;
    private _forceSelecting = true;
    private _panning: boolean;
    private _canvas: HTMLCanvasElement;
    private _responsive: boolean;
    private _isOverGUINode: Control[] = [];
    private _engine: Engine;
    private _liveRenderObserver: Nullable<Observer<AdvancedDynamicTexture>>;
    private _guiRenderObserver: Nullable<Observer<AdvancedDynamicTexture>>;
    private _mainSelection: Nullable<Control> = null;
    private _selectionDepth = 0;
    private _doubleClick: Nullable<Control> = null;
    private _lockMainSelection: boolean = false;
    public _liveGuiTextureRerender: boolean = true;
    private _anyControlClicked = true;
    private _visibleRegionContainer : Container;
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
        this._visibleRegionContainer.children.forEach(child => this._visibleRegionContainer.removeControl(child));
        this._visibleRegionContainer.addControl(value);
        this._trueRootContainer = value;
        this._trueRootContainer.isPointerBlocker = false;
        value._host = this.props.globalState.guiTexture;
    }
    public get trueRootContainer() {
        return this._trueRootContainer;
    }
    private _nextLiveGuiRender = -1;
    private _liveGuiRerenderDelay = 30;
    private _defaultGUISize: ISize = {width: 1024, height: 1024};
    private _initialPanningOffset: Vector2 = new Vector2(0,0);
    private _panningOffset = new Vector2(0,0);
    private _zoomFactor = 1;
    private _zoomModeIncrement = 0.2;
    private _guiSize = this._defaultGUISize;
    public get guiSize() {
        return this._guiSize;
    }
    // sets the size of the GUI and makes all neccessary adjustments
    public set guiSize(value: ISize) {
        this._guiSize = {...value};
        this._visibleRegionContainer.widthInPixels = this._guiSize.width;
        this._visibleRegionContainer.heightInPixels = this._guiSize.height;
        this.globalState.onResizeObservable.notifyObservers(this._guiSize);
        this.globalState.onFitToWindowObservable.notifyObservers();
        this.globalState.onArtBoardUpdateRequiredObservable.notifyObservers();
    }

    public applyEditorTransformation() {
        const adt = this.globalState.guiTexture;
        if (adt._rootContainer != this._panAndZoomContainer) {
            adt._rootContainer = this._panAndZoomContainer;
            this._visibleRegionContainer.addControl(this._trueRootContainer);
            this.globalState.guiTexture.markAsDirty();
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
        const adt = this.globalState.guiTexture;
        if (adt._rootContainer != this._trueRootContainer) {
            this._visibleRegionContainer.removeControl(this._trueRootContainer);
            adt._rootContainer = this._trueRootContainer;
        }
        this._trueRootContainer.clipContent = true;
        this._trueRootContainer.clipChildren = true;
    }

    public get globalState() {
        return this.props.globalState;
    }

    public get nodes() {
        return this.globalState.guiTexture.getChildren()[0].children;
    }

    public get selectedGuiNodes() {
        return this._selectedGuiNodes;
    }

    // given a control gets the parent up the tree selectionDepth times. Selection depth is altered as we go down the tree.
    private _getParentWithDepth(control: Control) {
        --this._selectionDepth;
        let parent = control;
        for (let i = 0; i < this._selectionDepth; ++i) {
            if (!parent.parent) {
                break;
            }
            parent = parent.parent;
        }
        return parent;
    }

    //gets the higher parent of a given control.
    private _getMaxParent(control: Control, maxParent: Control) {
        let parent = control;
        this._selectionDepth = 0;
        while (parent.parent && parent.parent !== maxParent) {
            parent = parent.parent;
            ++this._selectionDepth;
        }
        return parent;
    }

    constructor(props: IWorkbenchComponentProps) {
        super(props);
        this._rootContainer = React.createRef();
        this._responsive = DataStorage.ReadBoolean("Responsive", true);

        props.globalState.onSelectionChangedObservable.add((selection) => {
            if (!selection) {
                this.updateNodeOutlines();
                this._selectedGuiNodes = [];
                this._mainSelection = null;
            } else {
                if (selection instanceof Control) {
                    if (this._ctrlKeyIsPressed) {
                        let index = this._selectedGuiNodes.indexOf(selection);
                        if (index === -1) {
                            this._selectedGuiNodes.push(selection);
                        } else {
                            this.updateNodeOutlines();
                            this._selectedGuiNodes.splice(index, 1);
                        }
                    } else if (this._selectedGuiNodes.length <= 1) {
                        this.updateNodeOutlines();

                        this._selectedGuiNodes = [selection];
                        if (!this._lockMainSelection && selection != this.props.globalState.guiTexture._rootContainer) {
                            //incase the selection did not come from the canvas and mouse
                            this._mainSelection = selection;
                        }
                        this._lockMainSelection = false;

                    }
                    this.updateNodeOutlines();
                }
            }

        });

        props.globalState.onPanObservable.add(() => {
            this._forcePanning = !this._forcePanning;
            this._forceSelecting = false;
            this._forceZooming = false;
            if (!this._forcePanning) {
                this.globalState.onSelectionButtonObservable.notifyObservers();
            } else {
                this._canvas.style.cursor = "grab";
            }
        });


        props.globalState.onSelectionButtonObservable.add(() => {
            this._forceSelecting = !this._forceSelecting;
            this._forcePanning = false;
            this._forceZooming = false;
            this._canvas.style.cursor = "default";
        });

        props.globalState.onZoomObservable.add(() => {
            this._forceZooming = !this._forceZooming;
            this._forcePanning = false;
            this._forceSelecting = false;
            if (!this._forceZooming) {
                this.globalState.onSelectionButtonObservable.notifyObservers();
            } else {
                this._canvas.style.cursor = "zoom-in";
            }
        });

        props.globalState.onFitToWindowObservable.add(() => {
            this._panningOffset = new Vector2(0,0);
            const xFactor =  this._engine.getRenderWidth() / this.guiSize.width;
            const yFactor = this._engine.getRenderHeight() / this.guiSize.height;
            this._zoomFactor = Math.min(xFactor, yFactor) * 0.9;
        });

        props.globalState.onOutlineChangedObservable.add(() => {
            this.updateNodeOutlines();
        });

        props.globalState.onSelectionChangedObservable.add(() => {
            this.updateNodeOutlines();
        });

        props.globalState.onParentingChangeObservable.add((control) => {
            this.parent(control);
        });

        props.globalState.onResponsiveChangeObservable.add((value) => {
            this._responsive = value;
        });

        this.props.globalState.hostDocument!.addEventListener("keyup", this.keyEvent, false);

        // Hotkey shortcuts
        this.props.globalState.hostDocument!.addEventListener("keydown", this.keyEvent, false);
        this.props.globalState.hostDocument!.defaultView!.addEventListener("blur", this.blurEvent, false);

        props.globalState.onWindowResizeObservable.add(() => {
            this.props.globalState.onGizmoUpdateRequireObservable.notifyObservers();
            this.props.globalState.onArtBoardUpdateRequiredObservable.notifyObservers();
            this._engine.resize();
        });

        props.globalState.onCopyObservable.add(copyFn => this.copyToClipboard(copyFn));
        props.globalState.onCutObservable.add(copyFn => this.cutToClipboard(copyFn));
        props.globalState.onPasteObservable.add(content => this.pasteFromClipboard(content));

        this.props.globalState.workbench = this;
    }

    determineMouseSelection(selection: Nullable<Control>) {
        if (selection && this._selectedGuiNodes.length <= 1) {
            // if we're still on the same main selection, got down the tree.
            if (selection === this._selectedGuiNodes[0] || selection === this._mainSelection) {
                selection = this._getParentWithDepth(selection);

            } else { // get the start of our tree by getting our max parent and storing our main selected control
                if (this._isMainSelectionParent(selection) && this._mainSelection) {
                    selection = this._getParentWithDepth(selection);
                }
                else {
                    selection = this._getMaxParent(selection, this.trueRootContainer);
                }
                this._mainSelection = selection;
            }
        }
        this._lockMainSelection = true;
        this.props.globalState.onSelectionChangedObservable.notifyObservers(selection);
    }

    keyEvent = (evt: KeyboardEvent) => {
        if ((evt.target as HTMLElement).localName === "input") return;
        this._ctrlKeyIsPressed = evt.ctrlKey;
        this._altKeyIsPressed = evt.altKey;
        if (evt.shiftKey) {
            this._setConstraintDirection = this._constraintDirection === ConstraintDirection.NONE;
        } else {
            this._setConstraintDirection = false;
            this._constraintDirection = ConstraintDirection.NONE;
        }

        if (evt.key === "Delete" || evt.key === "Backspace") {
            if (!this.props.globalState.lockObject.lock) {
                this._deleteSelectedNodes();
            }
        }

        if (this._ctrlKeyIsPressed && !this.props.globalState.lockObject.lock) {
            if (evt.key === "a") {
                this.props.globalState.onSelectionChangedObservable.notifyObservers(null);
                let index = 0;
                this.nodes.forEach((node) => {
                    if (index++) {
                        //skip the first node, the background
                        this.selectAllGUI(node);
                    }
                });
            }
        }

        if (this._forceZooming) {
            this._canvas.style.cursor = this._altKeyIsPressed ? "zoom-out" : "zoom-in";
        }
    };

    private _deleteSelectedNodes() {
        for (const control of this._selectedGuiNodes) {
            this.props.globalState.guiTexture.removeControl(control);
            this.props.globalState.liveGuiTexture?.removeControl(control);
            control.dispose();
        };
        this.props.globalState.onSelectionChangedObservable.notifyObservers(null);
    }

    public copyToClipboard(copyFn: (content: string) => void) {
        const controlList: any[] = [];
        for(const control of this.selectedGuiNodes) {
            const obj = {}
            control.serialize(obj);
            controlList.push(obj);
        }
        copyFn(JSON.stringify({
            GUIClipboard: true,
            controls: controlList
        }));
    }

    public cutToClipboard(copyFn: (content: string) => void) {
        this.copyToClipboard(copyFn);
        this._deleteSelectedNodes();
    }

    public pasteFromClipboard(clipboardContents: string) {
        try {
            const parsed = JSON.parse(clipboardContents);
            if (parsed.GUIClipboard) {
                this.props.globalState.onSelectionChangedObservable.notifyObservers(null);
                for(const control of parsed.controls) {
                    const newControl = this.appendBlock(Control.Parse(control, this.props.globalState.guiTexture));
                    this.props.globalState.onSelectionChangedObservable.notifyObservers(newControl);
                }
                return true;
            }
        }
        catch {
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
                const cell = Tools.getCellInfo(original.parent as Grid, original);
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
            this.props.globalState.onSelectionChangedObservable.notifyObservers(newControl);
        }
    }

    private selectAllGUI(node: Control) {
        this.globalState.onSelectionChangedObservable.notifyObservers(node);
        if (node instanceof Container) {
            (node as Container).children.forEach((child) => {
                this.selectAllGUI(child);
            });
        }
    }

    blurEvent = () => {
        this._ctrlKeyIsPressed = false;
        this._constraintDirection = ConstraintDirection.NONE;
        this.props.globalState.onPointerUpObservable.notifyObservers(null);
    };

    componentWillUnmount() {
        this.props.globalState.hostDocument!.removeEventListener("keyup", this.keyEvent);
        this.props.globalState.hostDocument!.removeEventListener("keydown", this.keyEvent);
        this.props.globalState.hostDocument!.defaultView!.removeEventListener("blur", this.blurEvent);
        if (this.props.globalState.liveGuiTexture) {
            this.props.globalState.liveGuiTexture.onEndRenderObservable.remove(this._liveRenderObserver);
            this.props.globalState.guiTexture.onBeginRenderObservable.remove(this._guiRenderObserver);
            this.props.globalState.guiTexture.getDescendants(false).forEach(control => {
                if (!control.metadata || !control.metadata.guiEditor) {
                    return;
                }
                control.onPointerUpObservable.remove(control.metadata.onPointerUp);
                control.onPointerDownObservable.remove(control.metadata.onPointerDown);
                control.onPointerEnterObservable.remove(control.metadata.onPointerEnter);
                control.onPointerOutObservable.remove(control.metadata.onPointerOut);
                control.onDisposeObservable.remove(control.metadata.onDispose);
                control.highlightLineWidth = control.metadata.highlightLineWidth;
                control.isHighlighted = control.metadata.isHighlighted;
                control.metadata = control.metadata.metadata;
            })

        }
        this._engine.dispose();
    }

    loadFromJson(serializationObject: any) {
        this.removeEditorTransformation();
        this.globalState.onSelectionChangedObservable.notifyObservers(null);
        if (this.props.globalState.liveGuiTexture) {
            this.globalState.liveGuiTexture?.parseContent(serializationObject, true);
            this.synchronizeLiveGUI();
        } else {
            this.globalState.guiTexture.parseContent(serializationObject, true);
        }
        this.trueRootContainer = this.props.globalState.guiTexture._rootContainer;
        this.guiSize = this.globalState.guiTexture.getSize();
        this.loadToEditor();
    }

    async loadFromSnippet(snippetId: string) {
        this.removeEditorTransformation();
        this.globalState.onSelectionChangedObservable.notifyObservers(null);
        if (this.props.globalState.liveGuiTexture) {
            await this.globalState.liveGuiTexture?.parseFromSnippetAsync(snippetId, true);
            this.synchronizeLiveGUI();
        } else {
            await this.globalState.guiTexture.parseFromSnippetAsync(snippetId, true);
        }
        this.trueRootContainer = this.props.globalState.guiTexture._rootContainer;
        this.guiSize = this.globalState.guiTexture.getSize();
        this.loadToEditor();
        if (this.props.globalState.customLoad) {
            this.props.globalState.customLoad.action(this.globalState.guiTexture.snippetId).catch((err) => {
                alert("Unable to load your GUI");
            });
        }
    }

    loadToEditor() {
        this.globalState.guiTexture.rootContainer.children.forEach((guiElement) => {
            this.createNewGuiNode(guiElement);
        });

        this._isOverGUINode = [];
        this.globalState.onSelectionChangedObservable.notifyObservers(null);
        this.globalState.onFitToWindowObservable.notifyObservers();
    }

    public updateNodeOutlines() {
        for(const guiControl of this._trueRootContainer.getDescendants()) {
            guiControl.isHighlighted = guiControl.getClassName() === "Grid" && (this.props.globalState.outlines || this.props.globalState.workbench.selectedGuiNodes.includes(guiControl));
            guiControl.highlightLineWidth = 5;
        }
    }

    findNodeFromGuiElement(guiControl: Control) {
        return this.nodes.filter((n) => n === guiControl)[0];
    }

    appendBlock(guiElement: Control) {
        if (this.globalState.liveGuiTexture) {
            this.globalState.liveGuiTexture.addControl(guiElement);
        }
        var newGuiNode = this.createNewGuiNode(guiElement);
        this.trueRootContainer.addControl(guiElement);
        return newGuiNode;
    }

    //is the
    private _isMainSelectionParent(control: Nullable<Control>) {
        do {
            if (this._mainSelection === control) {
                return true;
            };
            control = control?.parent || null;
        } while (control);
        return false;
    }

    createNewGuiNode(guiControl: Control) {
        const onPointerUp = guiControl.onPointerUpObservable.add((evt) => {
            this.clicked = false;
        });

        const onPointerDown = guiControl.onPointerDownObservable.add((evt) => {
            this._anyControlClicked = true;
            if (!this.isUp || evt.buttonIndex > 0) return;
            if (this._forceSelecting) {
                // if this is our first click and the clicked control is a child the of the main selected control.
                if (!this._doubleClick && this._isMainSelectionParent(guiControl)) {
                    this._doubleClick = guiControl;
                    window.setTimeout(() => {
                        this._doubleClick = null;
                    }, Scene.DoubleClickDelay);
                }
                else { //function will either select our new main control or contrue down the tree.

                    this.determineMouseSelection(guiControl);
                    this._doubleClick = null;
                }
                this.isUp = false;
            }
        });

        const onPointerEnter = guiControl.onPointerEnterObservable.add((evt) => {
            if (this._isOverGUINode.indexOf(guiControl) === -1) {
                this._isOverGUINode.push(guiControl);
            }
        });

        const onPointerOut = guiControl.onPointerOutObservable.add((evt) => {
            const index = this._isOverGUINode.indexOf(guiControl);
            if (index !== -1) {
                this._isOverGUINode.splice(index, 1);
            }
        });

        const onDispose = guiControl.onDisposeObservable.add((evt) => {
            const index = this._isOverGUINode.indexOf(guiControl);
            if (index !== -1) {
                this._isOverGUINode.splice(index, 1);
            }
        });
        // use metadata to keep track of things we need to cleanup/restore when the gui editor closes
        // also stores the old metadata
        guiControl.metadata = {
            guiEditor: true,
            metadata: guiControl.metadata,
            isHighlighted: guiControl.isHighlighted,
            highlightLineWidth: guiControl.highlightLineWidth,
            isReadOnly: guiControl.isReadOnly,
            isHitTestVisible: guiControl.isHitTestVisible,
            onPointerUp,
            onPointerDown,
            onPointerEnter,
            onPointerOut,
            onDispose
        }
        guiControl.highlightLineWidth = 5;
        guiControl.isHighlighted = false;
        guiControl.isReadOnly = true;
        guiControl.isHitTestVisible = true;
        guiControl.getDescendants(true).forEach((child) => {
            this.createNewGuiNode(child);
        });
        return guiControl;
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
                        dropLocationControl instanceof Container && //dropping inside a contrainer control
                        this.props.globalState.draggedControlDirection === DragOverLocation.CENTER
                    ) {
                        draggedControlParent.removeControl(draggedControl);
                        (dropLocationControl as Container).addControl(draggedControl);
                        const stackPanel = dropLocationControl.typeName === "StackPanel" || dropLocationControl.typeName === "VirtualKeyboard";
                        if (stackPanel) {
                            this._convertToPixels(draggedControl, dropLocationControl as Container);
                        }
                    } else if (dropLocationControl.parent) {
                        //dropping inside the controls parent container
                        if (dropLocationControl.parent.typeName !== "Grid") {
                            draggedControlParent.removeControl(draggedControl);
                            let index = dropLocationControl.parent.children.indexOf(dropLocationControl);
                            const reversed = dropLocationControl.parent.typeName === "StackPanel" || dropLocationControl.parent.typeName === "VirtualKeyboard";

                            index = this._adjustParentingIndex(index, reversed); //adjusting index to be before or after based on where the control is over

                            dropLocationControl.parent.children.splice(index, 0, draggedControl);
                            draggedControl.parent = dropLocationControl.parent;
                            if (reversed) {
                                this._convertToPixels(draggedControl, draggedControl.parent);
                            }
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
        this.globalState.draggedControl = null;
        this.globalState.onPropertyGridUpdateRequiredObservable.notifyObservers();
    }

    private _convertToPixels(draggedControl: Control, parent: Container) {
        const width = draggedControl.widthInPixels + "px";
        const height = draggedControl.heightInPixels + "px";
        if (draggedControl.width !== width || draggedControl.height !== height) {
            draggedControl.width = width;
            draggedControl.height = height;
            this.props.globalState.hostWindow.alert("Warning: Parenting to stack panel will convert control to pixel value");
        }
    }

    private _reorderGrid(grid: Grid, draggedControl: Control, dropLocationControl: Control) {
        const cellInfo = Tools.getCellInfo(grid, draggedControl);
        grid.removeControl(draggedControl);

        let index = grid.children.indexOf(dropLocationControl);
        index = this._adjustParentingIndex(index);

        Tools.reorderGrid(grid, index, draggedControl, cellInfo);
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
        this.globalState.onSelectionChangedObservable.notifyObservers(guiNode);
    }

    public clicked: boolean;

    public _onMove(guiControl: Control, evt: Vector2, startPos: Vector2, ignorClick: boolean = false) {
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

        if (guiControl.typeName === "Line") {
            let line = guiControl as Line;
            const x1 = (line.x1 as string).substr(0, (line.x1 as string).length - 2); //removing the 'px'
            const x2 = (line.x2 as string).substr(0, (line.x2 as string).length - 2);
            const y1 = (line.y1 as string).substr(0, (line.y1 as string).length - 2);
            const y2 = (line.y2 as string).substr(0, (line.y2 as string).length - 2);
            line.x1 = Number(x1) + newX;
            line.x2 = Number(x2) + newX;
            line.y1 = Number(y1) + newY;
            line.y2 = Number(y2) + newY;
            return true;
        }

        guiControl.leftInPixels += newX;
        guiControl.topInPixels += newY;

        //convert to percentage
        if (this._responsive) {
            CoordinateHelper.convertToPercentage(guiControl, ["left", "top"]);
        }
        this.props.globalState.onPropertyGridUpdateRequiredObservable.notifyObservers();
        return true;
    }

    onMove(evt: React.PointerEvent) {
        var pos = this.getScaledPointerPosition();
        // Move or guiNodes
        if (this._mouseStartPointX != null && this._mouseStartPointY != null && !this._panning) {
            var x = this._mouseStartPointX;
            var y = this._mouseStartPointY;
            let selected = false;
            this.selectedGuiNodes.forEach((element) => {
                if (pos) {
                    selected = this._onMove(element, new Vector2(pos.x, pos.y), new Vector2(x, y), false) || selected;
                }
            });

            this._mouseStartPointX = pos ? pos.x : this._mouseStartPointX;
            this._mouseStartPointY = pos ? pos.y : this._mouseStartPointY;
        }
    }

    private _screenToTexturePosition(screenPos: Vector2) {
        const zoomVector = new Vector2(this._zoomFactor, this._zoomFactor);
        return screenPos.divideInPlace(zoomVector).add(this._panningOffset);
    }

    private getScaledPointerPosition() {
        return this._screenToTexturePosition(new Vector2(this._scene.pointerX, this._scene.pointerY));
    }

    onDown(evt: React.PointerEvent<HTMLElement>) {
        this._rootContainer.current?.setPointerCapture(evt.pointerId);
        if (this._isOverGUINode.length === 0 && !evt.button) {
            if (this._forceSelecting) {
                this.props.globalState.onSelectionChangedObservable.notifyObservers(null);
            }
            return;
        }

        var pos = this.getScaledPointerPosition();
        if (this._forceSelecting) {
            this._mouseStartPointX = pos ? pos.x : this._mouseStartPointX;
            this._mouseStartPointY = pos ? pos.y : this._mouseStartPointY;
        }
    }

    public isUp: boolean = true;
    onUp(evt: React.PointerEvent) {
        this._mouseStartPointX = null;
        this._mouseStartPointY = null;
        this._constraintDirection = ConstraintDirection.NONE;
        this._rootContainer.current?.releasePointerCapture(evt.pointerId);
        this.isUp = true;
    }

    public createGUICanvas() {
        // Get the canvas element from the DOM.
        const canvas = this._rootContainer.current as HTMLCanvasElement;
        this._canvas = canvas;
        // Associate a Babylon Engine to it.
        this._engine = new Engine(canvas);

        // Create our first scene.
        this._scene = new Scene(this._engine);

        this._scene.clearColor = new Color4(0, 0, 0, 0);
        const light = new HemisphericLight("light1", Axis.Y, this._scene);
        light.intensity = 0.9;

        this._guiSize = this._defaultGUISize;

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
        this.globalState.guiTexture =
        this._visibleRegionContainer._host =
        this._panAndZoomContainer._host =
        AdvancedDynamicTexture.CreateFullscreenUI("guiTexture", true, this._scene, Texture.NEAREST_NEAREST_MIPNEAREST, false);

        adt.useInvalidateRectOptimization = false;
        this.trueRootContainer = adt.rootContainer;
        adt.onEndRenderObservable.add(() => this.props.globalState.onGizmoUpdateRequireObservable.notifyObservers());

        this.synchronizeLiveGUI();

        new ArcRotateCamera("Camera", 0, 0, 0, Vector3.Zero(), this._scene);
        // This attaches the mouse controls
        this.addControls(this._scene);

        this._scene.getEngine().onCanvasPointerOutObservable.clear();
        this._scene.doNotHandleCursors = true;

        // Watch for browser/canvas resize events
        this.globalState.hostWindow.addEventListener("resize", () => {
            this.props.globalState.onWindowResizeObservable.notifyObservers();
        });
        this._engine.resize();

        this.globalState.guiTexture.onBeginRenderObservable.add(() => {
            this.applyEditorTransformation();
        })

        this.globalState.onPropertyChangedObservable.add((ev) => {
            (ev.object as Control).markAsDirty(false);
            this.globalState.onArtBoardUpdateRequiredObservable.notifyObservers();
        })

        // Every time the original ADT re-renders, we must also re-render, so that layout information is computed correctly
        // also, every time *we* re-render (due to a change in the GUI), we must re-render the original ADT
        // to prevent an infite loop, we flip a boolean flag
        if (this.globalState.liveGuiTexture) {
            this._guiRenderObserver = this.globalState.guiTexture.onBeginRenderObservable.add(() => {
                if (this._liveGuiTextureRerender) {
                    this._nextLiveGuiRender = Date.now() + this._liveGuiRerenderDelay;
                }
                this._liveGuiTextureRerender = true;
            });
            this._liveRenderObserver = this.globalState.liveGuiTexture.onEndRenderObservable.add(() => {
                // return the GUI to the editor mode
                this.globalState.guiTexture?.markAsDirty();
                this._liveGuiTextureRerender = false;
            });
            this._scene.onAfterRenderObservable.add(() => {
                if (this._nextLiveGuiRender > 0 && Date.now() > this._nextLiveGuiRender) {
                    this._nextLiveGuiRender = -1;
                    this.globalState.liveGuiTexture?.markAsDirty();
                }
            })
        }

        this.props.globalState.onErrorMessageDialogRequiredObservable.notifyObservers(
            `Welcome to the GUI Editor Alpha. This editor is still a work in progress. Icons are currently temporary. Please submit feedback using the "Give feedback" button in the menu. `
        );
        this._engine.runRenderLoop(() => {
            this._scene.render();
        });
        this.globalState.onNewSceneObservable.notifyObservers(this.globalState.guiTexture.getScene());
        this.globalState.onPropertyGridUpdateRequiredObservable.notifyObservers();
        this.props.globalState.onFitToWindowObservable.notifyObservers();
    }

    // removes all controls from both GUIs, and re-adds the controls from the original to the GUI editor
    synchronizeLiveGUI() {
        if (this.globalState.liveGuiTexture) {
            this._trueRootContainer.getDescendants().forEach(desc => desc.dispose());
            this.globalState.liveGuiTexture.rootContainer.getDescendants(true).forEach(desc => {
                this.globalState.liveGuiTexture?.removeControl(desc);
                this.appendBlock(desc);
            })
            this.globalState.guiTexture.snippetId = this.globalState.liveGuiTexture.snippetId;
        }
    }

    //Add zoom and pan controls
    addControls(scene: Scene) {

        const zoomFnScrollWheel = (e: IWheelEvent) => {
            const delta = this.zoomWheel(e);
            this.zooming(1 + (delta / 1000));
        };

        const panningFn = () => this.panning();

        const startPanning = () => {
            this._scene.onPointerObservable.add(panningFn, PointerEventTypes.POINTERMOVE);
            this._panning = true;
            this._initialPanningOffset = this.getScaledPointerPosition();
            this._panAndZoomContainer.getDescendants().forEach(desc => {

                if (!desc.metadata) desc.metadata = {};
                desc.metadata.isPointerBlocker = desc.isPointerBlocker;
                desc.isPointerBlocker = false;
            })
        }
    
        const endPanning = () => {
            this._panning = false;
            this._panAndZoomContainer.getDescendants().forEach(desc => {
                if (desc.metadata && desc.metadata.isPointerBlocker !== undefined) {
                    desc.isPointerBlocker = desc.metadata.isPointerBlocker;
                    delete desc.metadata.isPointerBlocker;
                }
            })
        }

        const removeObservers = () => {
            scene.onPointerObservable.removeCallback(panningFn);
        };

        this._rootContainer.current?.addEventListener("wheel",  zoomFnScrollWheel);
        this._rootContainer.current?.addEventListener("pointerdown", (event) => {
            removeObservers();
            if (event.button !== 0 || this._forcePanning) {
                startPanning();
            } else {
                if (this._forceZooming) {
                    this.zooming(1.0 + (this._altKeyIsPressed ? -this._zoomModeIncrement : this._zoomModeIncrement));
                }
                endPanning();
                    // if we click in the scene and we don't hit any controls, deselect all
                this._scene.onAfterRenderObservable.addOnce(() => {
                    if (!this._anyControlClicked) {
                        this.props.globalState.onSelectionChangedObservable.notifyObservers(null);
                    }
                    this._anyControlClicked = false;

                });
            }
        });
        this._rootContainer.current?.addEventListener("pointerup", (event) => {
            this._panning = false;
            removeObservers();
            this.props.globalState.onPointerUpObservable.notifyObservers(event);          
        })

        scene.onKeyboardObservable.add((k: KeyboardInfo, e: KeyboardEventTypes) => {
            switch (k.event.key) {
                case "s": //select
                case "S":
                    if (!this._forceSelecting) this.globalState.onSelectionButtonObservable.notifyObservers();
                    break;
                case "p": //pan
                case "P":
                    if (!this._forcePanning) this.globalState.onPanObservable.notifyObservers();
                    break;
                case "z": //zoom
                case "Z":
                    if (!this._forceZooming) this.globalState.onZoomObservable.notifyObservers();
                    break;
                case "g": //outlines
                case "G":
                    this.globalState.outlines = !this.globalState.outlines;
                    break;
                case "f": //fit to window
                case "F":
                    this.globalState.onFitToWindowObservable.notifyObservers();
                    break;
                case "ArrowUp": // move up
                case "W":
                case "w":
                    this.moveControls(false, k.event.shiftKey ? -5 : -1);
                    break;
                case "ArrowDown": // move down
                case "S":
                case "s":
                    this.moveControls(false, k.event.shiftKey ? 5 : 1);
                    break;
                case "ArrowLeft": // move left
                case "A":
                case "a":
                    this.moveControls(true, k.event.shiftKey ? -5 : -1);
                    break;
                case "ArrowRight": // move right
                case "D":
                case "d":
                    this.moveControls(true, k.event.shiftKey ? 5 : 1);
                default:
                    break;
            }
        }, KeyboardEventTypes.KEYDOWN);

        scene.onBeforeRenderObservable.add(() => {
            if (this._panAndZoomContainer.scaleX !== this._zoomFactor) {
                this._panAndZoomContainer.scaleX = this._zoomFactor;
                this._panAndZoomContainer.scaleY = this._zoomFactor;
                this.globalState.onArtBoardUpdateRequiredObservable.notifyObservers();
                this.globalState.onGizmoUpdateRequireObservable.notifyObservers();
            }
            const left = this._zoomFactor * this._panningOffset.x;
            const top = this._zoomFactor * -this._panningOffset.y;
            if (this._panAndZoomContainer.leftInPixels !== left || this._panAndZoomContainer.topInPixels !== top) {
                this._panAndZoomContainer.leftInPixels = left;
                this._panAndZoomContainer.topInPixels = top;
                this.globalState.onArtBoardUpdateRequiredObservable.notifyObservers();
                this.globalState.onGizmoUpdateRequireObservable.notifyObservers();
            }
        })

        // stop context menu showing on canvas right click
        scene
            .getEngine()
            .getRenderingCanvas()
            ?.addEventListener("contextmenu", (e) => {
                e.preventDefault();
            });
    }

    //Return offsets for inertial panning given initial and current pointer positions
    panning() {
        const panningDelta = this.getScaledPointerPosition().subtract(this._initialPanningOffset).multiplyByFloats(1, -1);
        this._panningOffset = this._panningOffset.add(panningDelta);
        this._initialPanningOffset = this.getScaledPointerPosition();
        this.props.globalState.onArtBoardUpdateRequiredObservable.notifyObservers();
        this.props.globalState.onGizmoUpdateRequireObservable.notifyObservers();
    }

    // Move the selected controls. Can be either on horizontal (leftInPixels) or 
    // vertical (topInPixels) direction
    moveControls(horizontal: boolean, amount: number) {
        for (let selectedControl of this.props.globalState.workbench.selectedGuiNodes) {
            if (horizontal) {
                const prevValue = selectedControl.leftInPixels;
                selectedControl.leftInPixels += amount;
                this.props.globalState.onPropertyChangedObservable.notifyObservers({
                    object: selectedControl,
                    property: "leftInPixels",
                    value: selectedControl.leftInPixels,
                    initialValue: prevValue
                });
                this.props.globalState.onPropertyGridUpdateRequiredObservable.notifyObservers();
            } else {
                const prevValue = selectedControl.topInPixels;
                selectedControl.topInPixels += amount;
                this.props.globalState.onPropertyChangedObservable.notifyObservers({
                    object: selectedControl,
                    property: "topInPixels",
                    value: selectedControl.topInPixels,
                    initialValue: prevValue
                });
                this.props.globalState.onPropertyGridUpdateRequiredObservable.notifyObservers();
            }
        }
    }

    //Get the wheel delta
    zoomWheel(event: IWheelEvent) {

        event.preventDefault();
        let delta = 0;
        if (event.deltaY) {
            delta = -event.deltaY;
        } else if (event.detail) {
            delta = -event.detail;
        }
        return delta;
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
        return (

            <canvas id="workbench-canvas" onPointerMove={
                (evt) => {
                    if (this.props.globalState.guiTexture) {
                        this.onMove(evt);
                    }
                    this.props.globalState.onPointerMoveObservable.notifyObservers(evt);
                }} onPointerDown={(evt) => this.onDown(evt)}
                onPointerUp={(evt) => {
                    this.onUp(evt);
                    this.props.globalState.onPointerUpObservable.notifyObservers(evt);
                }}
                ref={this._rootContainer}>

            </canvas>

        );
    }
}
