import type { NodeMaterialBlock } from "core/Materials/Node/nodeMaterialBlock";
import type { GlobalState, ISelectionChangedOptions } from "../globalState";
import type { Nullable } from "core/types";
import type { Observer } from "core/Misc/observable";
import type { NodeMaterialConnectionPoint } from "core/Materials/Node/nodeMaterialBlockConnectionPoint";
import type { GraphCanvasComponent } from "./graphCanvas";
import { PropertyLedger } from "./propertyLedger";
import * as React from "react";
import { GenericPropertyComponent } from "./properties/genericNodePropertyComponent";
import { DisplayLedger } from "./displayLedger";
import type { IDisplayManager } from "./display/displayManager";
import type { NodeLink } from "./nodeLink";
import { NodePort } from "./nodePort";
import type { GraphFrame } from "./graphFrame";

import triangle from "../imgs/triangle.svg";

export class GraphNode {
    private _visual: HTMLDivElement;
    private _headerContainer: HTMLDivElement;
    private _promotionWarning: HTMLDivElement;
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
    private _globalState: GlobalState;
    private _onSelectionChangedObserver: Nullable<Observer<Nullable<ISelectionChangedOptions>>>;
    private _onSelectionBoxMovedObserver: Nullable<Observer<ClientRect | DOMRect>>;
    private _onFrameCreatedObserver: Nullable<Observer<GraphFrame>>;
    private _onUpdateRequiredObserver: Nullable<Observer<Nullable<NodeMaterialBlock>>>;
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
                port.portName = port.connectionPoint.displayName || port.connectionPoint.name;
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
        return this.block.uniqueId;
    }

    public get name() {
        return this.block.name;
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

        if (!value) {
            this._visual.classList.remove("selected");
            const indexInSelection = this._ownerCanvas.selectedNodes.indexOf(this);

            if (indexInSelection > -1) {
                this._ownerCanvas.selectedNodes.splice(indexInSelection, 1);
            }
        } else {
            this._globalState.onSelectionChangedObservable.notifyObservers({ selection: this });
        }
    }

    public constructor(public block: NodeMaterialBlock, globalState: GlobalState) {
        this._globalState = globalState;

        this._onSelectionChangedObserver = this._globalState.onSelectionChangedObservable.add((options) => {
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

        this._onUpdateRequiredObserver = this._globalState.onUpdateRequiredObservable.add((block) => {
            if (block !== this.block) {
                return;
            }
            this.refresh();
        });

        this._onSelectionBoxMovedObserver = this._globalState.onSelectionBoxMoved.add((rect1) => {
            const rect2 = this._visual.getBoundingClientRect();
            const overlap = !(rect1.right < rect2.left || rect1.left > rect2.right || rect1.bottom < rect2.top || rect1.top > rect2.bottom);

            this.isSelected = overlap;
        });

        this._onFrameCreatedObserver = this._globalState.onFrameCreatedObservable.add((frame) => {
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

    public getPortForConnectionPoint(point: NodeMaterialConnectionPoint) {
        for (const port of this._inputPorts) {
            const attachedPoint = port.connectionPoint;

            if (attachedPoint === point) {
                return port;
            }
        }

        for (const port of this._outputPorts) {
            const attachedPoint = port.connectionPoint;

            if (attachedPoint === point) {
                return port;
            }
        }

        return null;
    }

    public getLinksForConnectionPoint(point: NodeMaterialConnectionPoint) {
        return this._links.filter((link) => link.portA.connectionPoint === point || link.portB!.connectionPoint === point);
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
            this._header.innerHTML = this._displayManager.getHeaderText(this.block);
            this._displayManager.updatePreviewContent(this.block, this._content);
            this._visual.style.background = this._displayManager.getBackgroundColor(this.block);
            const additionalClass = this._displayManager.getHeaderClass(this.block);
            this._header.classList.value = "header";
            this._headerContainer.classList.value = "header-container";
            if (additionalClass) {
                this._headerContainer.classList.add(additionalClass);
            }
        } else {
            this._header.innerHTML = this.block.name;
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
        this._comments.innerHTML = this.block.comments || "";
        this._comments.title = this.block.comments || "";

        if (this.block.getClassName() !== "ElbowBlock" && this.block.willBeGeneratedIntoVertexShaderFromFragmentShader) {
            this._promotionWarning.classList.add("visible");
        } else {
            this._promotionWarning.classList.remove("visible");
        }
    }

    private _onDown(evt: PointerEvent) {
        // Check if this is coming from the port
        if (evt.srcElement && (evt.srcElement as HTMLElement).nodeName === "IMG") {
            return;
        }

        const indexInSelection = this._ownerCanvas.selectedNodes.indexOf(this);
        if (indexInSelection === -1) {
            this._globalState.onSelectionChangedObservable.notifyObservers({ selection: this });
        } else if (evt.ctrlKey) {
            this.isSelected = false;
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
        let control = PropertyLedger.RegisteredControls[this.block.getClassName()];

        if (!control) {
            control = GenericPropertyComponent;
        }

        return React.createElement(control, {
            globalState: this._globalState,
            block: this.block,
        });
    }

    public appendVisual(root: HTMLDivElement, owner: GraphCanvasComponent) {
        this._ownerCanvas = owner;

        // Display manager
        const displayManagerClass = DisplayLedger.RegisteredControls[this.block.getClassName()];

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

        this._promotionWarning = root.ownerDocument!.createElement("div");
        this._promotionWarning.classList.add("promotion-warning");
        this._promotionWarning.title =
            "For optimization reasons, this block will be promoted to the vertex shader. You can force it to render in the fragment shader by setting its target to Fragment";
        const img = root.ownerDocument!.createElement("img");
        img.src = triangle;
        this._promotionWarning.appendChild(img);
        this._visual.appendChild(this._promotionWarning);

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
        for (const input of this.block.inputs) {
            this._inputPorts.push(NodePort.CreatePortElement(input, this, this._inputsContainer, this._displayManager, this._globalState));
        }

        for (const output of this.block.outputs) {
            this._outputPorts.push(NodePort.CreatePortElement(output, this, this._outputsContainer, this._displayManager, this._globalState));
        }

        this.refresh();
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

        if (this._visual.parentElement) {
            this._visual.parentElement.removeChild(this._visual);
        }

        if (this._onFrameCreatedObserver) {
            this._globalState.onFrameCreatedObservable.remove(this._onFrameCreatedObserver);
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

        this.block.dispose();
    }
}
