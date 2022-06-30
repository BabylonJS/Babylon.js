import type { Nullable } from "core/types";
import type { Observer } from "core/Misc/observable";
import type { GraphCanvasComponent } from "./graphCanvas";
import * as React from "react";
import { NodePort } from "./nodePort";
import type { GraphFrame } from "./graphFrame";
import triangle from "../imgs/triangle.svg";
import type { NodeLink } from "./nodeLink";
import type { StateManager } from "./stateManager";
import type { ISelectionChangedOptions } from "./interfaces/selectionChangedOptions";
import type { IDisplayManager } from "./interfaces/displayManager";
import { PropertyLedger } from "./propertyLedger";
import { DisplayLedger } from "./displayLedger";
import type { INodeData } from "./interfaces/nodeData";
import type { IPortData } from "./interfaces/portData";

export class GraphNode {
    private _visual: HTMLDivElement;
    private _headerContainer: HTMLDivElement;
    private _warning: HTMLDivElement;
    private _header: HTMLDivElement;
    private _connections: HTMLDivElement;
    private _inputsContainer: HTMLDivElement;
    private _outputsContainer: HTMLDivElement;
    private _content: HTMLDivElement;
    private _comments: HTMLDivElement;
    private _inputPorts: NodePort[] = [];
    private _outputPorts: NodePort[] = [];
    private _links: NodeLink[] = [];
    private _x = 0;
    private _y = 0;
    private _gridAlignedX = 0;
    private _gridAlignedY = 0;
    private _mouseStartPointX: Nullable<number> = null;
    private _mouseStartPointY: Nullable<number> = null;
    private _stateManager: StateManager;
    private _onSelectionChangedObserver: Nullable<Observer<Nullable<ISelectionChangedOptions>>>;
    private _onSelectionBoxMovedObserver: Nullable<Observer<ClientRect | DOMRect>>;
    private _onFrameCreatedObserver: Nullable<Observer<GraphFrame>>;
    private _onUpdateRequiredObserver: Nullable<Observer<Nullable<INodeData>>>;
    private _ownerCanvas: GraphCanvasComponent;
    private _isSelected: boolean;
    private _displayManager: Nullable<IDisplayManager> = null;
    private _isVisible = true;
    private _enclosingFrameId = -1;

    public get isVisible() {
        return this._isVisible;
    }

    public set isVisible(value: boolean) {
        this._isVisible = value;

        if (!value) {
            this._visual.classList.add("hidden");
        } else {
            this._visual.classList.remove("hidden");
            this._upateNodePortNames();
        }

        for (const link of this._links) {
            link.isVisible = value;
        }

        this._refreshLinks();
    }

    private _upateNodePortNames() {
        for (const port of this._inputPorts.concat(this._outputPorts)) {
            if (port.hasLabel()) {
                port.portName = port.portData.name;
            }
        }
    }

    public get outputPorts() {
        return this._outputPorts;
    }

    public get inputPorts() {
        return this._inputPorts;
    }

    public get links() {
        return this._links;
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
        this._visual.style.left = `${this._gridAlignedX}px`;

        this._refreshLinks();
        this._refreshFrames();
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
        this._visual.style.top = `${this._gridAlignedY}px`;

        this._refreshLinks();
        this._refreshFrames();
    }

    public get width() {
        return this._visual.clientWidth;
    }

    public get height() {
        return this._visual.clientHeight;
    }

    public get id() {
        return this.content.uniqueId;
    }

    public get name() {
        return this.content.name;
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
        this.setIsSelected(value, false);
    }

    public setIsSelected(value: boolean, marqueeSelection: boolean) {
        if (this._isSelected === value) {
            return;
        }

        this._isSelected = value;

        if (!value) {
            this._visual.classList.remove("selected");
            const indexInSelection = this._ownerCanvas.selectedNodes.indexOf(this);

            if (indexInSelection > -1) {
                this._ownerCanvas.selectedNodes.splice(indexInSelection, 1);
            }
        } else {
            this._stateManager.onSelectionChangedObservable.notifyObservers({ selection: this, marqueeSelection });
        }
    }

    public constructor(public content: INodeData, stateManager: StateManager) {
        this._stateManager = stateManager;

        this._onSelectionChangedObserver = this._stateManager.onSelectionChangedObservable.add((options) => {
            const { selection: node } = options || {};
            if (node === this) {
                this._visual.classList.add("selected");
            } else {
                setTimeout(() => {
                    if (this._ownerCanvas.selectedNodes.indexOf(this) === -1) {
                        this._visual.classList.remove("selected");
                    }
                });
            }
        });

        this._onUpdateRequiredObserver = this._stateManager.onUpdateRequiredObservable.add((data) => {
            if (data !== this.content.data) {
                return;
            }
            this.refresh();
        });

        this._onSelectionBoxMovedObserver = this._stateManager.onSelectionBoxMoved.add((rect1) => {
            const rect2 = this._visual.getBoundingClientRect();
            const overlap = !(rect1.right < rect2.left || rect1.left > rect2.right || rect1.bottom < rect2.top || rect1.top > rect2.bottom);

            this.setIsSelected(overlap, true);
        });

        this._onFrameCreatedObserver = this._stateManager.onFrameCreatedObservable.add((frame) => {
            if (this._ownerCanvas.frames.some((f) => f.nodes.indexOf(this) !== -1)) {
                return;
            }

            if (this.isOverlappingFrame(frame)) {
                frame.nodes.push(this);
            }
        });
    }

    public isOverlappingFrame(frame: GraphFrame) {
        const rect2 = this._visual.getBoundingClientRect();
        const rect1 = frame.element.getBoundingClientRect();

        // Add a tiny margin
        rect1.width -= 5;
        rect1.height -= 5;

        const isOverlappingFrame = !(rect1.right < rect2.left || rect1.left > rect2.right || rect1.bottom < rect2.top || rect1.top > rect2.bottom);

        if (isOverlappingFrame) {
            this.enclosingFrameId = frame.id;
        }
        return isOverlappingFrame;
    }

    public getPortForPortData(portData: IPortData) {
        for (const port of this._inputPorts) {
            const attachedPoint = port.portData;

            if (attachedPoint === portData) {
                return port;
            }
        }

        for (const port of this._outputPorts) {
            const attachedPoint = port.portData;

            if (attachedPoint === portData) {
                return port;
            }
        }

        return null;
    }

    public getPortDataForPortDataContent(data: any) {
        for (const port of this._inputPorts) {
            const attachedPoint = port.portData;

            if (attachedPoint.data === data) {
                return attachedPoint;
            }
        }

        for (const port of this._outputPorts) {
            const attachedPoint = port.portData;

            if (attachedPoint.data === data) {
                return attachedPoint;
            }
        }

        return null;
    }

    public getLinksForPortDataContent(data: any) {
        return this._links.filter((link) => link.portA.portData.data === data || link.portB!.portData.data === data);
    }

    public getLinksForPortData(portData: IPortData) {
        return this._links.filter((link) => link.portA.portData === portData || link.portB!.portData === portData);
    }

    private _refreshFrames() {
        if (this._ownerCanvas._frameIsMoving || this._ownerCanvas._isLoading) {
            return;
        }

        // Frames
        for (const frame of this._ownerCanvas.frames) {
            frame.syncNode(this);
        }
    }

    public _refreshLinks() {
        if (this._ownerCanvas._isLoading) {
            return;
        }
        for (const link of this._links) {
            link.update();
        }
    }

    public refresh() {
        if (this._displayManager) {
            this._header.innerHTML = this._displayManager.getHeaderText(this.content);
            this._displayManager.updatePreviewContent(this.content, this._content);
            this._visual.style.background = this._displayManager.getBackgroundColor(this.content);
            const additionalClass = this._displayManager.getHeaderClass(this.content);
            this._header.classList.value = "header";
            this._headerContainer.classList.value = "header-container";
            if (additionalClass) {
                this._headerContainer.classList.add(additionalClass);
            }
        } else {
            this._header.innerHTML = this.content.name;
        }

        for (const port of this._inputPorts) {
            port.refresh();
        }

        for (const port of this._outputPorts) {
            port.refresh();
        }

        if (this.enclosingFrameId !== -1) {
            const index = this._ownerCanvas.frames.findIndex((frame) => frame.id === this.enclosingFrameId);
            if (index >= 0 && this._ownerCanvas.frames[index].isCollapsed) {
                this._ownerCanvas.frames[index].redrawFramePorts();
            }
        }

        this._comments.innerHTML = this.content.comments || "";
        this._comments.title = this.content.comments || "";

        const warningMessage = this.content.getWarningMessage();
        if (warningMessage) {
            this._warning.classList.add("visible");
            this._warning.title = warningMessage;
        } else {
            this._warning.classList.remove("visible");
        }
    }

    private _onDown(evt: PointerEvent) {
        // Check if this is coming from the port
        if (evt.srcElement && (evt.srcElement as HTMLElement).nodeName === "IMG") {
            return;
        }

        const indexInSelection = this._ownerCanvas.selectedNodes.indexOf(this);
        if (indexInSelection === -1) {
            this._stateManager.onSelectionChangedObservable.notifyObservers({ selection: this });
        } else if (evt.ctrlKey) {
            this.setIsSelected(false, false);
        }

        evt.stopPropagation();

        for (const selectedNode of this._ownerCanvas.selectedNodes) {
            selectedNode.cleanAccumulation();
        }

        this._mouseStartPointX = evt.clientX;
        this._mouseStartPointY = evt.clientY;

        this._visual.setPointerCapture(evt.pointerId);
    }

    public cleanAccumulation(useCeil = false) {
        this.x = this._ownerCanvas.getGridPosition(this.x, useCeil);
        this.y = this._ownerCanvas.getGridPosition(this.y, useCeil);
    }

    private _onUp(evt: PointerEvent) {
        evt.stopPropagation();

        for (const selectedNode of this._ownerCanvas.selectedNodes) {
            selectedNode.cleanAccumulation();
        }

        this._mouseStartPointX = null;
        this._mouseStartPointY = null;
        this._visual.releasePointerCapture(evt.pointerId);
    }

    private _onMove(evt: PointerEvent) {
        if (this._mouseStartPointX === null || this._mouseStartPointY === null || evt.ctrlKey) {
            return;
        }

        const newX = (evt.clientX - this._mouseStartPointX) / this._ownerCanvas.zoom;
        const newY = (evt.clientY - this._mouseStartPointY) / this._ownerCanvas.zoom;

        for (const selectedNode of this._ownerCanvas.selectedNodes) {
            selectedNode.x += newX;
            selectedNode.y += newY;
        }
        for (const frame of this._ownerCanvas.selectedFrames) {
            frame._moveFrame(newX, newY);
        }

        this._mouseStartPointX = evt.clientX;
        this._mouseStartPointY = evt.clientY;

        evt.stopPropagation();
    }

    public renderProperties(): Nullable<JSX.Element> {
        let control = PropertyLedger.RegisteredControls[this.content.getClassName()];

        if (!control) {
            control = PropertyLedger.DefaultControl;
        }

        return React.createElement(control, {
            stateManager: this._stateManager,
            nodeData: this.content,
        });
    }

    public appendVisual(root: HTMLDivElement, owner: GraphCanvasComponent) {
        this._ownerCanvas = owner;

        // Display manager
        const displayManagerClass = DisplayLedger.RegisteredControls[this.content.getClassName()];

        if (displayManagerClass) {
            this._displayManager = new displayManagerClass();
        }

        // DOM
        this._visual = root.ownerDocument!.createElement("div");
        this._visual.classList.add("visual");

        this._visual.addEventListener("pointerdown", (evt) => this._onDown(evt));
        this._visual.addEventListener("pointerup", (evt) => this._onUp(evt));
        this._visual.addEventListener("pointermove", (evt) => this._onMove(evt));

        this._headerContainer = root.ownerDocument!.createElement("div");
        this._headerContainer.classList.add("header-container");
        this._visual.appendChild(this._headerContainer);

        this._header = root.ownerDocument!.createElement("div");
        this._header.classList.add("header");
        this._headerContainer.appendChild(this._header);

        this._warning = root.ownerDocument!.createElement("div");
        this._warning.classList.add("warning");
        const img = root.ownerDocument!.createElement("img");
        img.src = triangle;
        this._warning.appendChild(img);
        this._visual.appendChild(this._warning);

        const selectionBorder = root.ownerDocument!.createElement("div");
        selectionBorder.classList.add("selection-border");
        this._visual.appendChild(selectionBorder);

        this._connections = root.ownerDocument!.createElement("div");
        this._connections.classList.add("connections");
        this._visual.appendChild(this._connections);

        this._inputsContainer = root.ownerDocument!.createElement("div");
        this._inputsContainer.classList.add("inputsContainer");
        this._connections.appendChild(this._inputsContainer);

        this._outputsContainer = root.ownerDocument!.createElement("div");
        this._outputsContainer.classList.add("outputsContainer");
        this._connections.appendChild(this._outputsContainer);

        this._content = root.ownerDocument!.createElement("div");
        this._content.classList.add("content");
        this._visual.appendChild(this._content);

        root.appendChild(this._visual);

        // Comments
        this._comments = root.ownerDocument!.createElement("div");
        this._comments.classList.add("comments");

        this._visual.appendChild(this._comments);

        // Connections
        for (const input of this.content.inputs) {
            this._inputPorts.push(NodePort.CreatePortElement(input, this, this._inputsContainer, this._displayManager, this._stateManager));
        }

        for (const output of this.content.outputs) {
            this._outputPorts.push(NodePort.CreatePortElement(output, this, this._outputsContainer, this._displayManager, this._stateManager));
        }

        this.refresh();
    }

    public dispose() {
        // notify frame observers that this node is being deleted
        this._stateManager.onGraphNodeRemovalObservable.notifyObservers(this);

        if (this._onSelectionChangedObserver) {
            this._stateManager.onSelectionChangedObservable.remove(this._onSelectionChangedObserver);
        }

        if (this._onUpdateRequiredObserver) {
            this._stateManager.onUpdateRequiredObservable.remove(this._onUpdateRequiredObserver);
        }

        if (this._onSelectionBoxMovedObserver) {
            this._stateManager.onSelectionBoxMoved.remove(this._onSelectionBoxMovedObserver);
        }

        if (this._visual.parentElement) {
            this._visual.parentElement.removeChild(this._visual);
        }

        if (this._onFrameCreatedObserver) {
            this._stateManager.onFrameCreatedObservable.remove(this._onFrameCreatedObserver);
        }

        for (const port of this._inputPorts) {
            port.dispose();
        }

        for (const port of this._outputPorts) {
            port.dispose();
        }

        const links = this._links.slice(0);
        for (const link of links) {
            link.dispose();
        }

        this.content.dispose();
    }
}
