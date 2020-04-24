import { NodePort } from "./nodePort";
import { GraphNode } from './graphNode';
import { FramePortPosition } from './graphFrame';
import { GlobalState } from '../globalState';
import { IDisplayManager } from './display/displayManager';
import { Observable } from 'babylonjs/Misc/observable';
import { Nullable } from 'babylonjs/types';
import { NodeMaterialConnectionPoint } from 'babylonjs/Materials/Node/nodeMaterialBlockConnectionPoint';
import { FramePortData, isFramePortData } from './graphCanvas';

export class FrameNodePort extends NodePort {
    private _parentFrameId: number;
    private _isInput: boolean;
    private _framePortPosition: FramePortPosition
    private _framePortId: number;
    private _onFramePortPositionChangedObservable = new Observable<FrameNodePort>();

    public get parentFrameId () {
        return this._parentFrameId;
    }

    public get onFramePortPositionChangedObservable() {
        return this._onFramePortPositionChangedObservable;
    }

    public get isInput() {
        return this._isInput;
    }

    public get framePortId() {
        return this._framePortId;
    }

    public get framePortPosition() {
        return this._framePortPosition;
    }

    public set framePortPosition(position: FramePortPosition) {
        this._framePortPosition = position;
        this.onFramePortPositionChangedObservable.notifyObservers(this);
    }

    public constructor(portContainer: HTMLElement, public connectionPoint: NodeMaterialConnectionPoint, public node: GraphNode, globalState: GlobalState, isInput: boolean, framePortId: number, parentFrameId: number) {
        super(portContainer, connectionPoint,node, globalState);

        this._parentFrameId = parentFrameId;
        this._isInput = isInput;
        this._framePortId = framePortId;

        this._onSelectionChangedObserver = this._globalState.onSelectionChangedObservable.add((selection) => {
            if (isFramePortData(selection) && (selection as FramePortData).port === this) {
                this._img.classList.add("selected");
            } else {
                this._img.classList.remove("selected");
            }
        });

        this.refresh();
    }

    public static CreateFrameNodePortElement(connectionPoint: NodeMaterialConnectionPoint, node: GraphNode, root: HTMLElement, 
        displayManager: Nullable<IDisplayManager>, globalState: GlobalState, isInput: boolean, framePortId: number, parentFrameId: number) {
        let portContainer = root.ownerDocument!.createElement("div");
        let block = connectionPoint.ownerBlock;

        portContainer.classList.add("portLine");
        if(framePortId !== null) {
            portContainer.dataset.framePortId = `${framePortId}`;
        }
        root.appendChild(portContainer);

        if (!displayManager || displayManager.shouldDisplayPortLabels(block)) {
            let portLabel = root.ownerDocument!.createElement("div");
            portLabel.classList.add("port-label");
            let portName = connectionPoint.displayName || connectionPoint.name;
            if (connectionPoint.ownerBlock.isInput) {
                portName = node.name;
            }
            portLabel.innerHTML = portName;       
            portContainer.appendChild(portLabel);
        }

        return new FrameNodePort(portContainer, connectionPoint, node, globalState, isInput, framePortId, parentFrameId);
    }

} 

