import { GlobalState } from '../globalState';
import { Nullable } from 'babylonjs/types';
import { Observer } from 'babylonjs/Misc/observable';
import { WorkbenchComponent, FramePortData } from './workbench';
import { PropertyGuiLedger } from './propertyLedger';
import * as React from 'react';
import { GenericPropertyComponent } from './properties/genericNodePropertyComponent';

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
        return 0;
    }

    public get height() {
        return 0;
    }

    public get id() {
        return this.guiNode.uniqueId;
    }

    public get name() {
        return this.guiNode.name;
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
        if (this._isSelected === value) {
            return;            
        }

        this._isSelected = value;

        if (value) {
            this._globalState.onSelectionChangedObservable.notifyObservers(this);  
        }
    }

    public constructor(globalState: GlobalState, public guiNode: BABYLON.GUI.Control) {
        this._globalState = globalState;
        this._ownerCanvas = this._globalState.workbench;
        
        guiNode.onPointerUpObservable.add(evt => {
            this.clicked = false;
            console.log("up");
        });

        guiNode.onPointerDownObservable.add( evt => {
            this.clicked = true;
            this.isSelected = true;
            console.log("down");
        }
        );

        guiNode.onPointerEnterObservable.add( evt => {
            this._ownerCanvas.isOverGUINode = true;
            console.log("in");
        }
        );

        guiNode.onPointerOutObservable.add( evt => {
            this._ownerCanvas.isOverGUINode = false;
            console.log("out");
        }
        );

        this._onSelectionBoxMovedObserver = this._globalState.onSelectionBoxMoved.add(rect1 => {
        });

    }

    public cleanAccumulation(useCeil = false) {
        this.x = this._ownerCanvas.getGridPosition(this.x, useCeil);
        this.y = this._ownerCanvas.getGridPosition(this.y, useCeil);
    }

    public clicked: boolean;
    public _onMove(evt: BABYLON.Vector2, startPos: BABYLON.Vector2) {
       
        if(!this.clicked) return false;

        let newX = (evt.x - startPos.x) ;// / this._ownerCanvas.zoom;
        let newY = (evt.y - startPos.y) ;// / this._ownerCanvas.zoom;


        this.x += newX;
        this.y += newY;  

        return true;
        //evt.stopPropagation();
    }

    public renderProperties(): Nullable<JSX.Element> {
        let className = this.guiNode.getClassName();
        let control = PropertyGuiLedger.RegisteredControls[className];
        
        if (!control) {
            control = GenericPropertyComponent;
        }

        return React.createElement(control, {
        globalState: this._globalState,
        guiBlock: this.guiNode
        });
    }

    public updateVisual()
    {
        if(this.guiNode)
        {
            this.guiNode.leftInPixels = this.x;
            this.guiNode.topInPixels = this.y;
        }
    }

    public appendVisual(root: HTMLDivElement, owner: WorkbenchComponent) {
        this._ownerCanvas = owner;
    }

    public dispose() {
        // notify frame observers that this node is being deleted
        this._globalState.onGraphNodeRemovalObservable.notifyObservers(this);

        if (this._onSelectionChangedObserver) {
            this._globalState.onSelectionChangedObservable.remove(this._onSelectionChangedObserver);
        }

        if (this._onUpdateRequiredObserver) {
            this._globalState.onUpdateRequiredObservable.remove(this._onUpdateRequiredObserver);
        }

        if (this._onSelectionBoxMovedObserver) {
            this._globalState.onSelectionBoxMoved.remove(this._onSelectionBoxMovedObserver);
        }

        this.guiNode.dispose();   

    }
}