import { NodePort } from "../../diagram/nodePort";
import type { GraphNode } from "../../diagram/graphNode";
import type { FramePortPosition } from "../../diagram/graphFrame";
import type { GlobalState } from "../../globalState";
import type { IDisplayManager } from "./displayManager";
import { Observable } from "core/Misc/observable";
import type { Nullable } from "core/types";
import type { FramePortData } from "../../diagram/graphCanvas";
import { isFramePortData } from "../../diagram/graphCanvas";
import { IPortData } from "./portData";

export class FrameNodePort extends NodePort {
    private _parentFrameId: number;
    private _isInput: boolean;
    private _framePortPosition: FramePortPosition;
    private _framePortId: number;
    private _onFramePortPositionChangedObservable = new Observable<FrameNodePort>();

    public get parentFrameId() {
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

    public constructor(
        portContainer: HTMLElement,
        public portData: IPortData,
        public node: GraphNode,
        globalState: GlobalState,
        isInput: boolean,
        framePortId: number,
        parentFrameId: number
    ) {
        super(portContainer, portData.data, node, globalState);

        this._parentFrameId = parentFrameId;
        this._isInput = isInput;
        this._framePortId = framePortId;

        this._onSelectionChangedObserver = this._globalState.onSelectionChangedObservable.add((options) => {
            const { selection } = options || {};
            if (isFramePortData(selection) && (selection as FramePortData).port === this) {
                this._img.classList.add("selected");
            } else {
                this._img.classList.remove("selected");
            }
        });

        this.refresh();
    }

    public static CreateFrameNodePortElement(
        portData: IPortData,
        node: GraphNode,
        root: HTMLElement,
        displayManager: Nullable<IDisplayManager>,
        globalState: GlobalState,
        isInput: boolean,
        framePortId: number,
        parentFrameId: number
    ) {
        const portContainer = root.ownerDocument!.createElement("div");

        portContainer.classList.add("portLine");
        if (framePortId !== null) {
            portContainer.dataset.framePortId = `${framePortId}`;
        }
        root.appendChild(portContainer);

        if (!displayManager || displayManager.shouldDisplayPortLabels(portData)) {
            const portLabel = root.ownerDocument!.createElement("div");
            portLabel.classList.add("port-label");

            portLabel.innerHTML = portData.getName();
            portContainer.appendChild(portLabel);
        }

        return new FrameNodePort(portContainer, portData, node, globalState, isInput, framePortId, parentFrameId);
    }
}
