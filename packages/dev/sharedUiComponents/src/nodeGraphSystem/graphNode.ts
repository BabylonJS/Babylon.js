import type { Nullable } from "core/types";
import type { Observer } from "core/Misc/observable";
import type { GraphCanvasComponent } from "./graphCanvas";
import * as React from "react";
import { NodePort } from "./nodePort";
import type { GraphFrame } from "./graphFrame";
import type { NodeLink } from "./nodeLink";
import type { StateManager } from "./stateManager";
import type { ISelectionChangedOptions } from "./interfaces/selectionChangedOptions";
import type { IDisplayManager } from "./interfaces/displayManager";
import { PropertyLedger } from "./propertyLedger";
import { DisplayLedger } from "./displayLedger";
import type { INodeData } from "./interfaces/nodeData";
import type { IPortData } from "./interfaces/portData";
import localStyles from "./graphNode.modules.scss";
import commonStyles from "./common.modules.scss";

export class GraphNode {
    private _visual: HTMLDivElement;
    private _headerContainer: HTMLDivElement;
    private _headerIcon: HTMLDivElement;
    private _headerIconImg: HTMLImageElement;
    private _header: HTMLDivElement;
    private _connections: HTMLDivElement;
    private _inputsContainer: HTMLDivElement;
    private _outputsContainer: HTMLDivElement;
    private _content: HTMLDivElement;
    private _comments: HTMLDivElement;
    private _executionTime: HTMLDivElement;
    private _selectionBorder: HTMLDivElement;
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
    private _onHighlightNodeObserver: Nullable<Observer<any>>;
    private _ownerCanvas: GraphCanvasComponent;
    private _isSelected: boolean;
    private _displayManager: Nullable<IDisplayManager> = null;
    private _isVisible = true;
    private _enclosingFrameId = -1;

    public addClassToVisual(className: string) {
        this._visual.classList.add(className);
    }

    public removeClassFromVisual(className: string) {
        this._visual.classList.remove(className);
    }

    public get isVisible() {
        return this._isVisible;
    }

    public set isVisible(value: boolean) {
        this._isVisible = value;

        if (!value) {
            this._visual.classList.add(commonStyles["hidden"]);
        } else {
            this._visual.classList.remove(commonStyles["hidden"]);
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
            this._visual.classList.remove(localStyles["selected"]);
            const indexInSelection = this._ownerCanvas.selectedNodes.indexOf(this);

            if (indexInSelection > -1) {
                this._ownerCanvas.selectedNodes.splice(indexInSelection, 1);
            }
        } else {
            this._stateManager.onSelectionChangedObservable.notifyObservers({ selection: this, marqueeSelection });
        }
    }

    public get rootElement() {
        return this._visual;
    }

    public constructor(
        public content: INodeData,
        stateManager: StateManager
    ) {
        this._stateManager = stateManager;

        this._onSelectionChangedObserver = this._stateManager.onSelectionChangedObservable.add((options) => {
            const { selection: node } = options || {};
            if (node === this) {
                this._visual.classList.add(localStyles["selected"]);
                if (this._displayManager && this._displayManager.onSelectionChanged) {
                    this._displayManager.onSelectionChanged(this.content, node.content, this._stateManager);
                }
            } else {
                if (this._ownerCanvas.selectedNodes.indexOf(this) === -1) {
                    this._visual.classList.remove(localStyles["selected"]);
                    if (this._displayManager && this._displayManager.onSelectionChanged) {
                        this._displayManager.onSelectionChanged(this.content, node && (node as GraphNode).content ? (node as GraphNode).content : null, this._stateManager);
                    }
                }
            }
        });

        this._onHighlightNodeObserver = this._stateManager.onHighlightNodeObservable.add((data) => {
            if (data.data !== this.content.data) {
                return;
            }
            if (data.active) {
                this._visual.classList.add(localStyles["highlighted"]);
            } else {
                this._visual.classList.remove(localStyles["highlighted"]);
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

            if (attachedPoint === portData || (attachedPoint.ownerData === portData.ownerData && attachedPoint.internalName === portData.internalName)) {
                return port;
            }
        }

        for (const port of this._outputPorts) {
            const attachedPoint = port.portData;

            if (attachedPoint === portData || (attachedPoint.ownerData === portData.ownerData && attachedPoint.internalName === portData.internalName)) {
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
            this._header.classList.value = localStyles.header;
            this._headerContainer.classList.value = localStyles["header-container"];
            if (additionalClass) {
                this._headerContainer.classList.add(additionalClass);
            }
            if (this._displayManager.updateFullVisualContent) {
                this._displayManager.updateFullVisualContent(this.content, {
                    visual: this._visual,
                    header: this._header,
                    headerContainer: this._headerContainer,
                    headerIcon: this._headerIcon,
                    headerIconImg: this._headerIconImg,
                    comments: this._comments,
                    connections: this._connections,
                    inputsContainer: this._inputsContainer,
                    outputsContainer: this._outputsContainer,
                    content: this._content,
                    selectionBorder: this._selectionBorder,
                });
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

        const executionTime = this.content.executionTime || 0;
        this._executionTime.innerHTML = executionTime >= 0 ? `${executionTime.toFixed(2)} ms` : "";

        this.content.prepareHeaderIcon(this._headerIcon, this._headerIconImg);
        if (this._headerIconImg.src) {
            this._header.classList.add(localStyles["headerWithIcon"]);
        }
    }

    private _onDown(evt: PointerEvent) {
        // Check if this is coming from the port
        if (evt.target && (evt.target as HTMLElement).nodeName === "IMG") {
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

        if (!this._ownerCanvas._targetLinkCandidate) {
            this._stateManager.onNodeMovedObservable.notifyObservers(this);
            return;
        }

        // Connect the ports
        const inputs: Nullable<IPortData>[] = [];
        const outputs: Nullable<IPortData>[] = [];
        const availableNodeInputs: Nullable<IPortData>[] = [];
        const availableNodeOutputs: Nullable<IPortData>[] = [];
        const leftNode = this._ownerCanvas._targetLinkCandidate.nodeA;
        const rightNode = this._ownerCanvas._targetLinkCandidate.nodeB!;
        const leftPort = this._ownerCanvas._targetLinkCandidate.portA.portData;
        const rightPort = this._ownerCanvas._targetLinkCandidate.portB!.portData;

        // Delete previous
        this._ownerCanvas._targetLinkCandidate.dispose();
        this._ownerCanvas._targetLinkCandidate = null;

        // Get the ports
        availableNodeInputs.push(...this.content.inputs.filter((i) => !i.isConnected));

        availableNodeOutputs.push(...this.content.outputs);

        inputs.push(...leftNode.content.outputs);

        outputs.push(...rightNode.content.inputs.filter((i) => !i.isConnected));

        // Prioritize the already connected ports
        const leftPortIndex = inputs.indexOf(leftPort);
        const rightPortIndex = outputs.indexOf(rightPort);

        if (leftPortIndex > 0) {
            inputs.splice(leftPortIndex, 1);
            inputs.splice(0, 0, leftPort);
        }

        if (rightPortIndex > 0) {
            outputs.splice(rightPortIndex, 1);
            outputs.splice(0, 0, rightPort);
        }

        // Reconnect
        this._ownerCanvas.automaticRewire(inputs, availableNodeInputs, true);
        this._ownerCanvas.automaticRewire(availableNodeOutputs, outputs, true);

        this._stateManager.onRebuildRequiredObservable.notifyObservers();
        this._stateManager.onNodeMovedObservable.notifyObservers(this);
    }

    private _onMove(evt: PointerEvent) {
        this._ownerCanvas._targetLinkCandidate = null;
        if (this._mouseStartPointX === null || this._mouseStartPointY === null || evt.ctrlKey) {
            return;
        }

        // Move
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

        if (this._inputPorts.some((p) => p.portData.isConnected) || this._outputPorts.some((o) => o.portData.hasEndpoints)) {
            return;
        }

        // Check wires that could be underneath
        const rect = this._visual.getBoundingClientRect();
        for (const link of this._ownerCanvas.links) {
            if (link.portA.node === this || link.portB!.node === this) {
                link.isTargetCandidate = false;
                continue;
            }
            link.isTargetCandidate = link.intersectsWith(rect);

            if (link.isTargetCandidate) {
                if (this._ownerCanvas._targetLinkCandidate !== link) {
                    if (this._ownerCanvas._targetLinkCandidate) {
                        this._ownerCanvas._targetLinkCandidate.isTargetCandidate = false;
                    }
                    this._ownerCanvas._targetLinkCandidate = link;
                }
            }
        }
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
        this._visual.classList.add(localStyles.visual);

        this._visual.addEventListener("pointerdown", (evt) => this._onDown(evt));
        this._visual.addEventListener("pointerup", (evt) => this._onUp(evt));
        this._visual.addEventListener("pointermove", (evt) => this._onMove(evt));

        this._headerContainer = root.ownerDocument!.createElement("div");
        this._headerContainer.classList.add(localStyles["header-container"]);
        this._visual.appendChild(this._headerContainer);

        this._header = root.ownerDocument!.createElement("div");
        this._header.classList.add(localStyles.header);
        this._headerContainer.appendChild(this._header);

        this._headerIcon = root.ownerDocument!.createElement("div");
        this._headerIcon.classList.add(localStyles.headerIcon);
        this._headerIconImg = root.ownerDocument!.createElement("img");
        this._headerIcon.appendChild(this._headerIconImg);
        this._headerContainer.appendChild(this._headerIcon);

        this._selectionBorder = root.ownerDocument!.createElement("div");
        this._selectionBorder.classList.add("selection-border");
        this._visual.appendChild(this._selectionBorder);

        this._connections = root.ownerDocument!.createElement("div");
        this._connections.classList.add(localStyles.connections);
        this._visual.appendChild(this._connections);

        this._inputsContainer = root.ownerDocument!.createElement("div");
        this._inputsContainer.classList.add(commonStyles.inputsContainer);
        this._connections.appendChild(this._inputsContainer);

        this._outputsContainer = root.ownerDocument!.createElement("div");
        this._outputsContainer.classList.add(commonStyles.outputsContainer);
        this._connections.appendChild(this._outputsContainer);

        this._content = root.ownerDocument!.createElement("div");
        this._content.classList.add(localStyles.content);
        this._visual.appendChild(this._content);

        root.appendChild(this._visual);

        // Comments
        this._comments = root.ownerDocument!.createElement("div");
        this._comments.classList.add(localStyles.comments);

        this._visual.appendChild(this._comments);

        // Comments
        this._executionTime = root.ownerDocument!.createElement("div");
        this._executionTime.classList.add(localStyles.executionTime);

        this._visual.appendChild(this._executionTime);

        // Connections
        for (const input of this.content.inputs) {
            this._inputPorts.push(NodePort.CreatePortElement(input, this, this._inputsContainer, this._displayManager, this._stateManager));
        }

        for (const output of this.content.outputs) {
            this._outputPorts.push(NodePort.CreatePortElement(output, this, this._outputsContainer, this._displayManager, this._stateManager));
        }

        this.refresh();

        this.content.refreshCallback = () => {
            this.refresh();
        };
    }

    public dispose() {
        if (this._displayManager && this._displayManager.onDispose) {
            this._displayManager.onDispose(this.content, this._stateManager);
        }

        // notify frame observers that this node is being deleted
        this._stateManager.onGraphNodeRemovalObservable.notifyObservers(this);

        if (this._onSelectionChangedObserver) {
            this._stateManager.onSelectionChangedObservable.remove(this._onSelectionChangedObserver);
        }

        if (this._onUpdateRequiredObserver) {
            this._stateManager.onUpdateRequiredObservable.remove(this._onUpdateRequiredObserver);
        }

        if (this._onHighlightNodeObserver) {
            this._stateManager.onHighlightNodeObservable.remove(this._onHighlightNodeObserver);
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
