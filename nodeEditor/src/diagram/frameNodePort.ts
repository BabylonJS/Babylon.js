import { NodePort } from "./nodePort";
import { Nullable, Observable, NodeMaterialConnectionPoint } from 'babylonjs';
import { GraphNode } from './graphNode';
import { FramePortPosition } from './graphFrame';
import { GlobalState } from '../globalState';
import { IDisplayManager } from './display/displayManager';

export class FrameNodePort extends NodePort {
    private _onFramePortMoveUpObservable = new Observable<FrameNodePort>();
    private _onFramePortMoveDownObservable = new Observable<FrameNodePort>();
    private _onFramePortPositionChangedObservable = new Observable<FramePortPosition>();
    private _portLabel: Element;
    private _isInput: boolean;
    private _framePortPosition: FramePortPosition
    private _framePortId: Nullable<number>;

    public get onFramePortMoveUpObservable() {
        return this._onFramePortMoveUpObservable;
    }

    public get onFramePortMoveDownObservable() {
        return this._onFramePortMoveDownObservable;
    }

    public get onFramePortPositionChangedObservable() {
        return this._onFramePortPositionChangedObservable;
    }

    public get isInput() {
        return this._isInput;
    }

    public get portLabel() {
        return this._portLabel.innerHTML;
    }

    public get framePortId() {
        return this._framePortId;
    }

    public set portLabel(newLabel: string) {
        this._portLabel.innerHTML = newLabel;
    }

    public get framePortPosition() {
        return this._framePortPosition;
    }

    public set framePortPosition(position: FramePortPosition) {
        this._framePortPosition = position;
        this.onFramePortPositionChangedObservable.notifyObservers(position);
    }

    public constructor(portContainer: HTMLElement, public connectionPoint: NodeMaterialConnectionPoint, public node: GraphNode, globalState: GlobalState, isInput: boolean, framePortId: number) {
        super(portContainer, connectionPoint,node, globalState);
        this._element = portContainer.ownerDocument!.createElement("div");
        this._element.classList.add("port");
        portContainer.appendChild(this._element);
        this._globalState = globalState;

        this._portLabel = portContainer.children[0];
        this._isInput = isInput;
        this._framePortId = framePortId;


        this._img = portContainer.ownerDocument!.createElement("img");
        this._element.appendChild(this._img );

        (this._element as any).port = this;

        // Drag support
        this._element.ondragstart= () => false;

        this._onCandidateLinkMovedObserver = globalState.onCandidateLinkMoved.add(coords => {
            const rect = this._element.getBoundingClientRect();

            if (!coords || rect.left > coords.x || rect.right < coords.x || rect.top > coords.y || rect.bottom < coords.y) {
                this._element.classList.remove("selected"); 
                return;
            }

            this._element.classList.add("selected"); 
            this._globalState.onCandidatePortSelectedObservable.notifyObservers(this);
        });

        this._onSelectionChangedObserver = this._globalState.onSelectionChangedObservable.add((selection) => {
            if (selection === this) {
                this._img.classList.add("selected");
            } else {
                this._img.classList.remove("selected");
            }
        });

        this.refresh();
    }

    public static CreateFrameNodePortElement(connectionPoint: NodeMaterialConnectionPoint, node: GraphNode, root: HTMLElement, 
        displayManager: Nullable<IDisplayManager>, globalState: GlobalState, isInput: boolean, framePortId: number) {
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
            portLabel.innerHTML = connectionPoint.name;        
            portContainer.appendChild(portLabel);
        }

        return new FrameNodePort(portContainer, connectionPoint, node, globalState, isInput, framePortId);
    }

} 

