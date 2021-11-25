import * as React from "react";
import { DragOverLocation, GlobalState } from "../globalState";
import { Nullable } from "babylonjs/types";
import { Control } from "babylonjs-gui/2D/controls/control";
import { AdvancedDynamicTexture } from "babylonjs-gui/2D/advancedDynamicTexture";
import { Matrix, Vector2, Vector3 } from "babylonjs/Maths/math.vector";
import { Engine } from "babylonjs/Engines/engine";
import { Scene } from "babylonjs/scene";
import { Color4 } from "babylonjs/Maths/math.color";
import { ArcRotateCamera } from "babylonjs/Cameras/arcRotateCamera";
import { HemisphericLight } from "babylonjs/Lights/hemisphericLight";
import { Axis } from "babylonjs/Maths/math.axis";
import { Mesh } from "babylonjs/Meshes/mesh";
import { Plane } from "babylonjs/Maths/math.plane";
import { PointerEventTypes, PointerInfo } from "babylonjs/Events/pointerEvents";
import { EventState } from "babylonjs/Misc/observable";
import { IWheelEvent } from "babylonjs/Events/deviceInputEvents";
import { Epsilon } from "babylonjs/Maths/math.constants";
import { Container } from "babylonjs-gui/2D/controls/container";
import { Rectangle } from "babylonjs-gui/2D/controls/rectangle";
import { KeyboardEventTypes, KeyboardInfo } from "babylonjs/Events/keyboardEvents";
import { Line } from "babylonjs-gui/2D/controls/line";
import { DataStorage } from "babylonjs/Misc/dataStorage";
import { Grid } from "babylonjs-gui/2D/controls/grid";
import { Tools } from "../tools";
import { CreateGround } from "babylonjs/Meshes/Builders/groundBuilder";
import { NodeMaterial } from "babylonjs/Materials/Node/nodeMaterial";
import { TextureBlock } from "babylonjs/Materials/Node/Blocks/Dual/textureBlock";
import { GUIEditorNodeMaterial } from "./GUIEditorNodeMaterial";
require("./workbenchCanvas.scss");

export interface IWorkbenchComponentProps {
    globalState: GlobalState;
}

export type FramePortData = {};

export const isFramePortData = (variableToCheck: any): variableToCheck is FramePortData => {
    if (variableToCheck) {
        return (variableToCheck as FramePortData) !== undefined;
    } else return false;
};

export enum ConstraintDirection {
    NONE = 0,
    X = 2, // Horizontal constraint
    Y = 3, // Vertical constraint
}

export class WorkbenchComponent extends React.Component<IWorkbenchComponentProps> {
    public artBoardBackground: Rectangle;
    private _rootContainer: React.RefObject<HTMLCanvasElement>;
    private _setConstraintDirection: boolean = false;
    private _mouseStartPointX: Nullable<number> = null;
    private _mouseStartPointY: Nullable<number> = null;
    private _textureMesh: Mesh;
    public _scene: Scene;
    private _selectedGuiNodes: Control[] = [];
    private _ctrlKeyIsPressed = false;
    private _altKeyIsPressed = false;
    private _constraintDirection = ConstraintDirection.NONE;
    private _forcePanning = false;
    private _forceZooming = false;
    private _forceMoving = false;
    private _forceSelecting = true;
    private _outlines = false;
    private _panning: boolean;
    private _canvas: HTMLCanvasElement;
    private _responsive: boolean;
    private _isOverGUINode: Control[] = [];
    private _clipboard: Control[] = [];
    private _selectAll: boolean = false;
    private _camera: ArcRotateCamera;
    private _cameraRadias: number;
    private _cameraMaxRadiasFactor = 16384; // 2^13
    private _pasted: boolean;
    private _engine: Engine;
    public get globalState() {
        return this.props.globalState;
    }

    public get nodes() {
        return this.globalState.guiTexture.getChildren()[0].children;
    }

    public get selectedGuiNodes() {
        return this._selectedGuiNodes;
    }

    constructor(props: IWorkbenchComponentProps) {
        super(props);
        this._responsive = DataStorage.ReadBoolean("Responsive", true);

        props.globalState.onSelectionChangedObservable.add((selection) => {
            if (!selection) {
                this.changeSelectionHighlight(false);
                this._selectedGuiNodes = [];
                this._selectAll = false;
            } else {
                if (selection instanceof Control) {
                    if (this._ctrlKeyIsPressed) {
                        let index = this._selectedGuiNodes.indexOf(selection);
                        if (index === -1) {
                            this._selectedGuiNodes.push(selection);
                        } else {
                            this.changeSelectionHighlight(false);
                            this._selectedGuiNodes.splice(index, 1);
                        }
                    } else if (this._selectedGuiNodes.length <= 1) {
                        this.changeSelectionHighlight(false);
                        this._selectedGuiNodes = [selection];
                        this._selectAll = false;
                    }
                    this.changeSelectionHighlight(true);
                }
            }
        });

        props.globalState.onPanObservable.add(() => {
            this._forcePanning = !this._forcePanning;
            this._forceSelecting = false;
            this._forceMoving = false;
            this._forceZooming = false;
            if (!this._forcePanning) {
                this.globalState.onSelectionButtonObservable.notifyObservers();
            } else {
                this._canvas.style.cursor = "grab";
            }
            this.updateHitTest(this.globalState.guiTexture.getChildren()[0], this._forceSelecting);
            this.artBoardBackground.isHitTestVisible = true;
        });

        props.globalState.onMoveObservable.add(() => {
            this._forceMoving = !this._forceMoving;
            this._forcePanning = false;
            this._forceZooming = false;
            this._forceSelecting = false;
            this.updateHitTest(this.globalState.guiTexture.getChildren()[0], this._forceSelecting);
            if (!this._forceSelecting) {
                this.updateHitTestForSelection(true);
            }

            if (!this._forceMoving) {
                this.globalState.onSelectionButtonObservable.notifyObservers();
            } else {
                this._canvas.style.cursor = "move";
            }
            this.artBoardBackground.isHitTestVisible = true;
        });

        props.globalState.onSelectionButtonObservable.add(() => {
            this._forceSelecting = !this._forceSelecting;
            this._forcePanning = false;
            this._forceZooming = false;
            this._forceMoving = false;
            this._canvas.style.cursor = "default";
            this.updateHitTest(this.globalState.guiTexture.getChildren()[0], this._forceSelecting);
            if (this._forceMoving) {
                this.updateHitTestForSelection(true);
            }
            this.artBoardBackground.isHitTestVisible = true;
        });

        props.globalState.onZoomObservable.add(() => {
            this._forceZooming = !this._forceZooming;
            this._forcePanning = false;
            this._forceSelecting = false;
            this._forceMoving = false;
            if (!this._forceZooming) {
                this.globalState.onSelectionButtonObservable.notifyObservers();
            } else {
                this._canvas.style.cursor = "zoom-in";
            }
            this.updateHitTest(this.globalState.guiTexture.getChildren()[0], this._forceSelecting);
            this.artBoardBackground.isHitTestVisible = true;
        });

        props.globalState.onFitToWindowObservable.add(() => {
            this.setCameraRadius();
            for (let i = 0; i < 2; ++i) {
                this._camera.alpha = -Math.PI / 2;
                this._camera.beta = 0;
                this._camera.radius = this._cameraRadias;
                this._camera.target = Vector3.Zero();
            }
        });

        props.globalState.onOutlinesObservable.add(() => {
            this._outlines = !this._outlines;
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
            this._engine.resize();
        });

        this.props.globalState.workbench = this;
    }

    keyEvent = (evt: KeyboardEvent) => {
        this._ctrlKeyIsPressed = evt.ctrlKey;
        this._altKeyIsPressed = evt.altKey;
        if (evt.shiftKey) {
            this._setConstraintDirection = this._constraintDirection === ConstraintDirection.NONE;
        } else {
            this._setConstraintDirection = false;
            this._constraintDirection = ConstraintDirection.NONE;
        }

        if (evt.key === "Delete") {
            if (!this.props.globalState.lockObject.lock) {
                this._selectedGuiNodes.forEach((guiNode) => {
                    if (guiNode !== this.globalState.guiTexture.getChildren()[0]) {
                        guiNode.dispose();
                    }
                });
                this.props.globalState.onSelectionChangedObservable.notifyObservers(null);
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
            } else if (evt.key === "c") {
                this.copyToClipboard();
            } else if (evt.key === "v" && !this._pasted) {
                this.globalState.onSelectionChangedObservable.notifyObservers(null);
                this.pasteFromClipboard();
                this._pasted = true;
            }
        } else if (!this._ctrlKeyIsPressed) {
            this._pasted = false;
        }

        if (this._forceZooming) {
            this._canvas.style.cursor = this._altKeyIsPressed ? "zoom-out" : "zoom-in";
        }
    };

    private updateHitTest(guiControl: Control, value: boolean) {
        guiControl.isHitTestVisible = value;
        if (guiControl instanceof Container) {
            (guiControl as Container).children.forEach((child) => {
                this.updateHitTest(child, value);
            });
        }
    }

    private updateHitTestForSelection(value: boolean) {
        if (this._forceSelecting && !value) return;
        this.selectedGuiNodes.forEach((control) => {
            control.isHitTestVisible = value;
        });
    }

    private setCameraRadius() {
        const size = this.props.globalState.guiTexture.getSize();
        this._cameraRadias = size.width > size.height ? size.width : size.height;
        this._cameraRadias += this._cameraRadias - this._cameraRadias / 1.5;
    }

    private copyToClipboard() {
        if (this._selectAll) {
            let index = 0;
            this.nodes.forEach((node) => {
                if (index++) {
                    //skip the first node, the background
                    this._clipboard.push(node);
                }
            });
        } else {
            this._clipboard = this.selectedGuiNodes;
        }
    }

    private pasteFromClipboard() {
        this._clipboard.forEach((control) => {
            this.CopyGUIControl(control);
        });
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
        this._selectAll = true;
    }

    blurEvent = () => {
        this._ctrlKeyIsPressed = false;
        this._constraintDirection = ConstraintDirection.NONE;
    };

    componentWillUnmount() {
        this.props.globalState.hostDocument!.removeEventListener("keyup", this.keyEvent);
        this.props.globalState.hostDocument!.removeEventListener("keydown", this.keyEvent);
        this.props.globalState.hostDocument!.defaultView!.removeEventListener("blur", this.blurEvent);
        this._engine.dispose();
    }

    loadFromJson(serializationObject: any) {
        this.globalState.onSelectionChangedObservable.notifyObservers(null);
        this.globalState.guiTexture.parseContent(serializationObject, true);
        this.loadToEditor();
    }

    async loadFromSnippet(snippedId: string) {
        this.globalState.onSelectionChangedObservable.notifyObservers(null);
        await this.globalState.guiTexture.parseFromSnippetAsync(snippedId, true);
        this.loadToEditor();
        if (this.props.globalState.customLoad) {
            this.props.globalState.customLoad.action(this.globalState.guiTexture.snippetId).catch((err) => {
                alert("Unable to load your GUI");
            });
        }
        this.globalState.onSelectionChangedObservable.notifyObservers(null);
    }

    loadToEditor() {
        const size = this.globalState.guiTexture.getSize();
        this.resizeGuiTexture(new Vector2(size.width, size.height));
        var children = this.globalState.guiTexture.getChildren();
        children[0].children.forEach((guiElement) => {
            if (guiElement.name === "Art-Board-Background" && guiElement.typeName === "Rectangle") {
                this.artBoardBackground = guiElement as Rectangle;
                return;
            }
            this.createNewGuiNode(guiElement);
        });

        if (this.props.globalState.guiTexture.getChildren()[0].children.length) {
            this.props.globalState.guiTexture.getChildren()[0].children.unshift(this.props.globalState.workbench.artBoardBackground);
        } else {
            this.props.globalState.guiTexture.getChildren()[0].children.push(this.props.globalState.workbench.artBoardBackground);
        }
        this._isOverGUINode = [];
    }

    changeSelectionHighlight(value: boolean) {
        this._selectedGuiNodes.forEach((node) => {
            if (this._outlines) {
                node.isHighlighted = true;
                node.highlightLineWidth = value ? 10 : 5;
            } else {
                node.isHighlighted = value;
                node.highlightLineWidth = 10;
            }
        });
        this.updateHitTestForSelection(value);
    }

    resizeGuiTexture(newvalue: Vector2) {
        this._textureMesh.scaling.x = newvalue.x;
        this._textureMesh.scaling.z = newvalue.y;
        this.globalState.guiTexture.scaleTo(newvalue.x, newvalue.y);
        this.globalState.guiTexture.markAsDirty();
        this.globalState.onResizeObservable.notifyObservers(newvalue);
        this.globalState.onFitToWindowObservable.notifyObservers();
    }

    findNodeFromGuiElement(guiControl: Control) {
        return this.nodes.filter((n) => n === guiControl)[0];
    }

    appendBlock(guiElement: Control) {
        var newGuiNode = this.createNewGuiNode(guiElement);
        this.globalState.guiTexture.addControl(guiElement);
        return newGuiNode;
    }



    createNewGuiNode(guiControl: Control) {
        guiControl.highlightLineWidth = 5;
        guiControl.onPointerUpObservable.add((evt) => {
            this.clicked = false;
        });

        guiControl.onPointerDownObservable.add((evt) => {
            if (!this.isUp || evt.buttonIndex > 0) return;
            if (this._forceSelecting) {
                this.isSelected(true, guiControl);
                this.isUp = false;
            }
        });

        guiControl.onPointerEnterObservable.add((evt) => {
            if (this._isOverGUINode.indexOf(guiControl) === -1) {
                this._isOverGUINode.push(guiControl);
            }
        });

        guiControl.onPointerOutObservable.add((evt) => {
            const index = this._isOverGUINode.indexOf(guiControl);
            if (index !== -1) {
                this._isOverGUINode.splice(index, 1);
            }
        });

        guiControl.onDisposeObservable.add((evt) => {
            const index = this._isOverGUINode.indexOf(guiControl);
            if (index !== -1) {
                this._isOverGUINode.splice(index, 1);
            }
        });

        if (guiControl instanceof Container) {
            (guiControl as Container).children.forEach((child) => {
                this.createNewGuiNode(child);
            });
        }
        guiControl.isReadOnly = true;
        guiControl.isHitTestVisible = true;
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
                        if (dropLocationControl.parent.typeName != "Grid") {
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
                        this.props.globalState.guiTexture.addControl(draggedControl);
                    }
                } else {
                    //starting at index 1 because of object "Art-Board-Background" must be at index 0
                    draggedControlParent.removeControl(draggedControl);
                    draggedControlParent.children.splice(1, 0, draggedControl);
                    draggedControl.parent = draggedControlParent;
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
            alert("Warning: Parenting to stack panel will convert control to pixel value");
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
            let ratioX = this._textureMesh.scaling.x;
            let ratioY = this._textureMesh.scaling.z;
            if (guiControl.parent) {
                if (guiControl.parent.typeName === "Grid") {
                    const cellInfo = (guiControl.parent as Grid).getChildCellInfo(guiControl);
                    const cell = (guiControl.parent as Grid).cells[cellInfo];
                    ratioX = cell.widthInPixels;
                    ratioY = cell.heightInPixels;
                } else if (guiControl.parent.typeName === "Rectangle" || guiControl.parent.typeName === "Button") {
                    const thickness = (guiControl.parent as Rectangle).thickness * 2;
                    ratioX = guiControl.parent._currentMeasure.width - thickness;
                    ratioY = guiControl.parent._currentMeasure.height - thickness;
                } else {
                    ratioX = guiControl.parent._currentMeasure.width;
                    ratioY = guiControl.parent._currentMeasure.height;
                }
            }
            const left = (guiControl.leftInPixels * 100) / ratioX;
            const top = (guiControl.topInPixels * 100) / ratioY;
            guiControl.left = `${left.toFixed(2)}%`;
            guiControl.top = `${top.toFixed(2)}%`;
        }
        this.props.globalState.onPropertyGridUpdateRequiredObservable.notifyObservers();
        return true;
    }

    componentDidMount() {
        this._rootContainer = React.createRef();
    }

    onMove(evt: React.PointerEvent) {
        var pos = this.getGroundPosition();
        // Move or guiNodes
        if (this._mouseStartPointX != null && this._mouseStartPointY != null && !this._panning) {
            var x = this._mouseStartPointX;
            var y = this._mouseStartPointY;
            let selected = false;
            this.selectedGuiNodes.forEach((element) => {
                if (pos) {
                    selected = this._onMove(element, new Vector2(pos.x, -pos.z), new Vector2(x, y), false) || selected;
                }
            });

            this._mouseStartPointX = pos ? pos.x : this._mouseStartPointX;
            this._mouseStartPointY = pos ? pos.z * -1 : this._mouseStartPointY;
        }
    }

    public getGroundPosition() {
        var tex = this._textureMesh;
        // Use a predicate to get position on the ground
        var pickinfo = this._scene.pick(this._scene.pointerX, this._scene.pointerY, function (mesh) {
            return mesh == tex;
        });
        if (pickinfo?.hit) {
            return pickinfo.pickedPoint;
        }

        return null;
    }

    onDown(evt: React.PointerEvent<HTMLElement>) {
        this._rootContainer.current?.setPointerCapture(evt.pointerId);
        if (this._isOverGUINode.length === 0 && !evt.button) {
            if (this._forceSelecting) {
                this.props.globalState.onSelectionChangedObservable.notifyObservers(null);
            }
            return;
        }

        var pos = this.getGroundPosition();
        if (pos === null && this._forceSelecting && !evt.button) {
            this.props.globalState.onSelectionChangedObservable.notifyObservers(null);
        }
        if (this._forceMoving) {
            this._mouseStartPointX = pos ? pos.x : this._mouseStartPointX;
            this._mouseStartPointY = pos ? -pos.z : this._mouseStartPointY;
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
        const canvas = document.getElementById("workbench-canvas") as HTMLCanvasElement;
        this._canvas = canvas;
        // Associate a Babylon Engine to it.
        this._engine = new Engine(canvas);

        // Create our first scene.
        this._scene = new Scene(this._engine);
        const clearColor = 204 / 255.0;
        this._scene.clearColor = new Color4(clearColor, clearColor, clearColor, 1.0);
        const light = new HemisphericLight("light1", Axis.Y, this._scene);
        light.intensity = 0.9;

        let textureSize = 1024;
        this._textureMesh = CreateGround("GuiCanvas", { width: 1, height: 1, subdivisions: 1 }, this._scene);
        this._textureMesh.scaling.x = textureSize;
        this._textureMesh.scaling.z = textureSize;
        this.globalState.guiTexture = AdvancedDynamicTexture.CreateForMesh(this._textureMesh, textureSize, textureSize, true);
        this._textureMesh.showBoundingBox = true;
        this.artBoardBackground = new Rectangle("Art-Board-Background");
        this.artBoardBackground.width = "100%";
        this.artBoardBackground.height = "100%";
        this.artBoardBackground.background = "transparent";
        this.artBoardBackground.thickness = 0;

        this.globalState.guiTexture.addControl(this.artBoardBackground);

        const nodeMaterial = new NodeMaterial("NodeMaterial", this._scene);
        nodeMaterial.loadFromSerialization(GUIEditorNodeMaterial);

        nodeMaterial.build(true);
        this._textureMesh.material = nodeMaterial;
        if (nodeMaterial) {
            const block = nodeMaterial.getBlockByName("Texture") as TextureBlock;
            block.texture = this.globalState.guiTexture;
        }
        
        this.setCameraRadius();
        this._camera = new ArcRotateCamera("Camera", -Math.PI / 2, 0, this._cameraRadias, Vector3.Zero(), this._scene);
        this._camera.maxZ = this._cameraMaxRadiasFactor * 2;
        // This attaches the camera to the canvas
        this.addControls(this._scene, this._camera);

        this._scene.getEngine().onCanvasPointerOutObservable.clear();
        this._scene.doNotHandleCursors = true;

        // Watch for browser/canvas resize events
        window.addEventListener("resize", () => {
            this._engine.resize();
        });

        this.props.globalState.onErrorMessageDialogRequiredObservable.notifyObservers(
            `Welcome to the GUI Editor Alpha. This editor is still a work in progress. Icons are currently temporary. Please submit feedback using the "Give feedback" button in the menu. `
        );
        this._engine.runRenderLoop(() => {
            this._scene.render();
        });
        this.globalState.onNewSceneObservable.notifyObservers(this.globalState.guiTexture.getScene());
        this.globalState.onPropertyGridUpdateRequiredObservable.notifyObservers();
    }

    //Add map-like controls to an ArcRotate camera
    addControls(scene: Scene, camera: ArcRotateCamera) {
        camera.inertia = 0.7;
        camera.lowerRadiusLimit = 10;
        camera.upperRadiusLimit = this._cameraMaxRadiasFactor;
        camera.upperBetaLimit = Math.PI / 2 - 0.1;
        camera.angularSensibilityX = camera.angularSensibilityY = 500;

        const plane = Plane.FromPositionAndNormal(Vector3.Zero(), Axis.Y);

        const inertialPanning = Vector3.Zero();

        let initialPos = new Vector3(0, 0, 0);
        const panningFn = () => {
            const pos = this.getPosition(scene, camera, plane);
            this.panning(pos, initialPos, camera.inertia, inertialPanning);
        };

        const inertialPanningFn = () => {
            if (inertialPanning.x !== 0 || inertialPanning.y !== 0 || inertialPanning.z !== 0) {
                camera.target.addInPlace(inertialPanning);
                inertialPanning.scaleInPlace(camera.inertia);
                this.zeroIfClose(inertialPanning);
            }
        };

        const wheelPrecisionFn = () => {
            camera.wheelPrecision = (1 / camera.radius) * 1000;
        };

        const zoomFnScrollWheel = (p: PointerInfo, e: EventState) => {
            const delta = this.zoomWheel(p, e, camera);
            this.zooming(delta, scene, camera, plane, inertialPanning);
        };

        const zoomFnMouse = (p: PointerInfo, e: EventState) => {
            this.zooming(this._altKeyIsPressed ? -10 : 10, scene, camera, plane, inertialPanning);
        };

        const removeObservers = () => {
            scene.onPointerObservable.removeCallback(panningFn);
            scene.onPointerObservable.removeCallback(zoomFnMouse);
        };

        scene.onPointerObservable.add((p: PointerInfo, e: EventState) => {
            removeObservers();
            if (p.event.button !== 0 || this._forcePanning) {
                initialPos = this.getPosition(scene, camera, plane);
                scene.onPointerObservable.add(panningFn, PointerEventTypes.POINTERMOVE);
                this._panning = true;
            } else if (this._forceZooming) {
                initialPos = this.getPosition(scene, camera, plane);
                scene.onPointerObservable.add(zoomFnMouse, PointerEventTypes.POINTERMOVE);
                this._panning = false;
            } else {
                this._panning = false;
            }
        }, PointerEventTypes.POINTERDOWN);

        scene.onPointerObservable.add((p: PointerInfo, e: EventState) => {
            this._panning = false;
            removeObservers();
        }, PointerEventTypes.POINTERUP);

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
                    this.globalState.onOutlinesObservable.notifyObservers();
                    break;
                case "m": //move
                case "M":
                    if (!this._forceMoving) this.globalState.onMoveObservable.notifyObservers();
                    break;
                case "f": //fit to window
                case "F":
                    this.globalState.onFitToWindowObservable.notifyObservers();
                    break;
                default:
                    break;
            }
        }, KeyboardEventTypes.KEYDOWN);

        scene.onPointerObservable.add(zoomFnScrollWheel, PointerEventTypes.POINTERWHEEL);
        scene.onBeforeRenderObservable.add(inertialPanningFn);
        scene.onBeforeRenderObservable.add(wheelPrecisionFn);

        // stop context menu showing on canvas right click
        scene
            .getEngine()
            .getRenderingCanvas()
            ?.addEventListener("contextmenu", (e) => {
                e.preventDefault();
            });
    }

    //Get pos on plane
    getPosition(scene: Scene, camera: ArcRotateCamera, plane: Plane) {
        const ray = scene.createPickingRay(scene.pointerX, scene.pointerY, Matrix.Identity(), camera, false);
        const distance = ray.intersectsPlane(plane);

        //not using this ray again, so modifying its vectors here is fine
        return distance !== null ? ray.origin.addInPlace(ray.direction.scaleInPlace(distance)) : Vector3.Zero();
    }

    //Return offsets for inertial panning given initial and current pointer positions
    panning(newPos: Vector3, initialPos: Vector3, inertia: number, ref: Vector3) {
        const directionToZoomLocation = initialPos.subtract(newPos);
        const panningX = directionToZoomLocation.x * (1 - inertia);
        const panningZ = directionToZoomLocation.z * (1 - inertia);
        ref.copyFromFloats(panningX, 0, panningZ);
        return ref;
    }

    //Get the wheel delta divided by the camera wheel precision
    zoomWheel(p: PointerInfo, e: EventState, camera: ArcRotateCamera) {
        const event = p.event as IWheelEvent;

        event.preventDefault();
        let delta = 0;
        if (event.deltaY) {
            delta = -event.deltaY;
        } else if (event.detail) {
            delta = -event.detail;
        }
        delta /= camera.wheelPrecision;
        return delta;
    }

    //Zoom to pointer position. Zoom amount determined by delta
    zooming(delta: number, scene: Scene, camera: ArcRotateCamera, plane: Plane, ref: Vector3) {
        let lr = camera.lowerRadiusLimit;
        let ur = camera.upperRadiusLimit;
        if (!lr || !ur) {
            return;
        }
        if (camera.radius - lr < 1 && delta > 0) {
            return;
        } else if (ur - camera.radius < 1 && delta < 0) {
            return;
        }
        const inertiaComp = 1 - camera.inertia;
        if (camera.radius - (camera.inertialRadiusOffset + delta) / inertiaComp < lr) {
            delta = (camera.radius - lr) * inertiaComp - camera.inertialRadiusOffset;
        } else if (camera.radius - (camera.inertialRadiusOffset + delta) / inertiaComp > ur) {
            delta = (camera.radius - ur) * inertiaComp - camera.inertialRadiusOffset;
        }

        const zoomDistance = delta / inertiaComp;
        const ratio = zoomDistance / camera.radius;
        const vec = this.getPosition(scene, camera, plane);

        const directionToZoomLocation = vec.subtract(camera.target);
        const offset = directionToZoomLocation.scale(ratio);
        offset.scaleInPlace(inertiaComp);
        ref.addInPlace(offset);

        camera.inertialRadiusOffset += delta;
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
            <canvas
                id="workbench-canvas"
                onPointerMove={(evt) => this.onMove(evt)}
                onPointerDown={(evt) => this.onDown(evt)}
                onPointerUp={(evt) => this.onUp(evt)}
                ref={this._rootContainer}
            ></canvas>
        );
    }
}
