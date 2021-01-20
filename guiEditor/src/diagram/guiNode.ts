import { GlobalState } from "../globalState";
import { Nullable } from "babylonjs/types";
import { Observer } from "babylonjs/Misc/observable";
import { WorkbenchComponent, FramePortData } from "./workbench";
import { Control } from "babylonjs-gui/2D/controls/control";
import { Vector2 } from "babylonjs/Maths/math.vector";
import { Container } from "babylonjs-gui/2D/controls/container";

export class GUINode {
    private _x = 0;
    private _y = 0;
    private _gridAlignedX = 0;
    private _gridAlignedY = 0;
    private _globalState: GlobalState;
    private _onSelectionChangedObserver: Nullable<Observer<Nullable<GUINode | FramePortData>>>;
    private _onSelectionBoxMovedObserver: Nullable<Observer<ClientRect | DOMRect>>;
    private _onUpdateRequiredObserver: Nullable<Observer<void>>;
    private _ownerCanvas: WorkbenchComponent;
    private _isSelected: boolean;
    private _isVisible = true;
    private _enclosingFrameId = -1;

    public children: GUINode[] = [];

    public get isVisible() {
        return this._isVisible;
    }

    public set isVisible(value: boolean) {
        this._isVisible = value;
    }

    public get gridAlignedX() {
        return this._gridAlignedX;
    }

    public get gridAlignedY() {
        return this._gridAlignedY;
    }

    public get x() {
        return this._x;
    }

    public set x(value: number) {
        if (this._x === value) {
            return;
        }
        this._x = value;

        this._gridAlignedX = this._ownerCanvas.getGridPosition(value);
    }

    public get y() {
        return this._y;
    }

    public set y(value: number) {
        if (this._y === value) {
            return;
        }

        this._y = value;

        this._gridAlignedY = this._ownerCanvas.getGridPosition(value);
    }

    public get width() {
        return this.guiControl.widthInPixels;
    }

    public get height() {
        return this.guiControl.heightInPixels;
    }

    public get id() {
        return this.guiControl.uniqueId;
    }

    public get name() {
        return this.guiControl.name;
    }

    public get isSelected() {
        return this._isSelected;
    }

    public get enclosingFrameId() {
        return this._enclosingFrameId;
    }

    public set enclosingFrameId(value: number) {
        this._enclosingFrameId = value;
    }

    public set isSelected(value: boolean) {
        this._isSelected = value;

        if (value) {
            this._globalState.onSelectionChangedObservable.notifyObservers(this);
        }
    }

    public constructor(globalState: GlobalState, public guiControl: Control) {
        this._globalState = globalState;
        this._ownerCanvas = this._globalState.workbench;
        this.x = guiControl.leftInPixels;
        this.y = guiControl.topInPixels;
        guiControl.onPointerUpObservable.add((evt) => {
            this.clicked = false;
            console.log("up");
        });

        guiControl.onPointerDownObservable.add((evt) => {
            if (!this._ownerCanvas.isUp) return;
            this.clicked = true;
            this.isSelected = true;
            console.log("down");
            this._ownerCanvas.isUp = false;
        });

        guiControl.onPointerEnterObservable.add((evt) => {
            this._ownerCanvas.isOverGUINode = true;
            console.log("in");
        });

        guiControl.onPointerOutObservable.add((evt) => {
            this._ownerCanvas.isOverGUINode = false;
            console.log("out");
        });

        this._onSelectionBoxMovedObserver = this._globalState.onSelectionBoxMoved.add((rect1) => {});
    }

    public cleanAccumulation(useCeil = false) {
        this.x = this._ownerCanvas.getGridPosition(this.x, useCeil);
        this.y = this._ownerCanvas.getGridPosition(this.y, useCeil);
    }

    public clicked: boolean;
    public _onMove(evt: Vector2, startPos: Vector2, ignorClick: boolean = false) {
        if (!this.clicked && !ignorClick) return false;
        console.log("moving");

        let newX = (evt.x - startPos.x) ;// / this._ownerCanvas.zoom;
        let newY = (evt.y - startPos.y) ;// / this._ownerCanvas.zoom;

        this.x += newX;
        this.y += newY;

        this.children.forEach((child) => {
            child._onMove(evt, startPos, true);
        });

        return true;
        //evt.stopPropagation();
    }

    public updateVisual() {
        this.guiControl.leftInPixels = this.x;
        this.guiControl.topInPixels = this.y;
    }

    private _isContainer() {
        switch (this.guiControl.typeName) {
            case "Button":
            case "StackPanel":
            case "Rectangle":
            case "Ellipse":
                return true;
            default:
                return false;
        }
    }

    public addGui(childNode: GUINode) {
        if (!this._isContainer) return;
        this.children.push(childNode);
        (this.guiControl as Container).addControl(childNode.guiControl);

        //adjust the position to be relative
        //childNode.x = this.x - childNode.x;
        //childNode.y = this.y - childNode.y;
    }

    public dispose() {
        // notify frame observers that this node is being deleted
        this._globalState.onGuiNodeRemovalObservable.notifyObservers(this);

        if (this._onSelectionChangedObserver) {
            this._globalState.onSelectionChangedObservable.remove(this._onSelectionChangedObserver);
        }

        if (this._onUpdateRequiredObserver) {
            this._globalState.onUpdateRequiredObservable.remove(this._onUpdateRequiredObserver);
        }

        if (this._onSelectionBoxMovedObserver) {
            this._globalState.onSelectionBoxMoved.remove(this._onSelectionBoxMovedObserver);
        }

        this.guiControl.dispose();
    }
}
