import type { IDisplayManager } from "./interfaces/displayManager";
import { Observable } from "core/Misc/observable";
import type { Nullable } from "core/types";
import type { IPortData } from "./interfaces/portData";
import { NodePort } from "./nodePort";
import type { GraphNode } from "./graphNode";
import { IsFramePortData } from "./tools";
import type { FramePortPosition } from "./graphFrame";
import type { StateManager } from "./stateManager";
import type { FramePortData } from "./types/framePortData";
import commonStyles from "./common.modules.scss";

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
        stateManager: StateManager,
        isInput: boolean,
        framePortId: number,
        parentFrameId: number
    ) {
        super(portContainer, portData, node, stateManager);

        this._parentFrameId = parentFrameId;
        this._isInput = isInput;
        this._framePortId = framePortId;

        this._onSelectionChangedObserver = stateManager.onSelectionChangedObservable.add((options) => {
            const { selection } = options || {};
            if (IsFramePortData(selection) && (selection as FramePortData).port === this) {
                this._img.classList.add(commonStyles["selected"]);
            } else {
                this._img.classList.remove(commonStyles["selected"]);
            }
        });

        this.refresh();
    }

    public static CreateFrameNodePortElement(
        portData: IPortData,
        node: GraphNode,
        root: HTMLElement,
        displayManager: Nullable<IDisplayManager>,
        stateManager: StateManager,
        isInput: boolean,
        framePortId: number,
        parentFrameId: number
    ) {
        const portContainer = root.ownerDocument!.createElement("div");

        portContainer.classList.add(commonStyles["portLine"]);
        if (framePortId !== null) {
            portContainer.dataset.framePortId = `${framePortId}`;
        }
        root.appendChild(portContainer);

        if (!displayManager || displayManager.shouldDisplayPortLabels(portData)) {
            const portLabel = root.ownerDocument!.createElement("div");
            portLabel.classList.add(commonStyles["port-label"]);

            portLabel.innerHTML = portData.name;
            portContainer.appendChild(portLabel);
        }

        return new FrameNodePort(portContainer, portData, node, stateManager, isInput, framePortId, parentFrameId);
    }
}
