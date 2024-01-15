/* eslint-disable @typescript-eslint/naming-convention */
import type { GraphNode } from "./graphNode";
import type { GraphCanvasComponent } from "./graphCanvas";
import type { Nullable } from "core/types";
import type { Observer } from "core/Misc/observable";
import { Observable } from "core/Misc/observable";
import { Color3 } from "core/Maths/math.color";
import type { NodePort } from "./nodePort";
import { FrameNodePort } from "./frameNodePort";
import type { NodeLink } from "./nodeLink";
import type { IFrameData } from "./interfaces/nodeLocationInfo";
import { StringTools } from "../stringTools";
import styles from "./graphFrame.modules.scss";
import commonStyles from "./common.modules.scss";
import { ClassNames } from "../components/classNames";

import type { ISelectionChangedOptions } from "./interfaces/selectionChangedOptions";

enum ResizingDirection {
    Right,
    Left,
    Top,
    Bottom,
    TopRight,
    TopLeft,
    BottomRight,
    BottomLeft,
}

export enum FramePortPosition {
    Top,
    Middle,
    Bottom,
}

export class GraphFrame {
    private readonly _collapsedWidth = 200;
    private static _FrameCounter = 0;
    private static _FramePortCounter = 0;
    private _name: string;
    private _color: Color3;
    private _x = 0;
    private _y = 0;
    private _gridAlignedX = 0;
    private _gridAlignedY = 0;
    private _width: number;
    private _height: number;
    public element: HTMLDivElement;
    private _borderElement: HTMLDivElement;
    private _headerElement: HTMLDivElement;
    private _headerTextElement: HTMLDivElement;
    private _headerCollapseElement: HTMLDivElement;
    private _headerCloseElement: HTMLDivElement;
    private _commentsElement: HTMLDivElement;
    private _portContainer: HTMLDivElement;
    private _outputPortContainer: HTMLDivElement;
    private _inputPortContainer: HTMLDivElement;
    private _nodes: GraphNode[] = [];
    private _ownerCanvas: GraphCanvasComponent;
    private _mouseStartPointX: Nullable<number> = null;
    private _mouseStartPointY: Nullable<number> = null;
    private _onSelectionChangedObserver: Nullable<Observer<Nullable<ISelectionChangedOptions>>>;
    private _onGraphNodeRemovalObserver: Nullable<Observer<GraphNode>>;
    private _onExposePortOnFrameObserver: Nullable<Observer<GraphNode>>;
    private _onNodeLinkDisposedObservers: Nullable<Observer<NodeLink>>[] = [];
    private _isCollapsed = false;
    private _frameInPorts: FrameNodePort[] = [];
    private _frameOutPorts: FrameNodePort[] = [];
    private _controlledPorts: NodePort[] = []; // Ports on Nodes that are shown on outside of frame
    private _exposedInPorts: NodePort[] = [];
    private _exposedOutPorts: NodePort[] = [];
    private _id: number;
    private _comments: string;
    private _frameIsResizing: boolean;
    private _resizingDirection: Nullable<ResizingDirection>;
    private _minFrameHeight = 40;
    private _minFrameWidth = 220;
    private _mouseXLimit: Nullable<number>;

    public onExpandStateChanged = new Observable<GraphFrame>();

    private readonly _closeSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 30"><g id="Layer_2" data-name="Layer 2"><path d="M16,15l5.85,5.84-1,1L15,15.93,9.15,21.78l-1-1L14,15,8.19,9.12l1-1L15,14l5.84-5.84,1,1Z"/></g></svg>`;
    private readonly _expandSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 30"><g id="Layer_2" data-name="Layer 2"><path d="M22.31,7.69V22.31H7.69V7.69ZM21.19,8.81H8.81V21.19H21.19Zm-6.75,6.75H11.06V14.44h3.38V11.06h1.12v3.38h3.38v1.12H15.56v3.38H14.44Z"/></g></svg>`;
    private readonly _collapseSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 30"><g id="Layer_2" data-name="Layer 2"><path d="M22.31,7.69V22.31H7.69V7.69ZM21.19,8.81H8.81V21.19H21.19Zm-2.25,6.75H11.06V14.44h7.88Z"/></g></svg>`;

    public get id() {
        return this._id;
    }

    public get isCollapsed() {
        return this._isCollapsed;
    }

    private _createInputPort(port: NodePort, node: GraphNode) {
        const localPort = FrameNodePort.CreateFrameNodePortElement(
            port.portData,
            node,
            this._inputPortContainer,
            null,
            this._ownerCanvas.stateManager,
            true,
            GraphFrame._FramePortCounter++,
            this.id
        );
        this._frameInPorts.push(localPort);

        port.delegatedPort = localPort;
        this._controlledPorts.push(port);

        port.exposedPortPosition = this._exposedInPorts.findIndex((nodePort) => nodePort === port);
        if (port.exposedPortPosition < 0) {
            this._exposedInPorts.push(port);
            port.exposedPortPosition = this._exposedInPorts.length - 1;
        }
    }

    // Mark ports with FramePortPosition for re-arrangement support
    private _markFramePortPositions() {
        // mark FrameInPorts
        if (this._frameInPorts.length == 2) {
            this._frameInPorts[0].framePortPosition = FramePortPosition.Top;
            this._frameInPorts[1].framePortPosition = FramePortPosition.Bottom;
        } else {
            for (let i = 0; i < this._frameInPorts.length; i++) {
                const port = this._frameInPorts[i];
                if (i === 0) {
                    port.framePortPosition = FramePortPosition.Top;
                } else if (i === this._frameInPorts.length - 1) {
                    port.framePortPosition = FramePortPosition.Bottom;
                } else {
                    port.framePortPosition = FramePortPosition.Middle;
                }
            }
        }

        // mark FrameOutPorts
        if (this._frameOutPorts.length == 2) {
            this._frameOutPorts[0].framePortPosition = FramePortPosition.Top;
            this._frameOutPorts[1].framePortPosition = FramePortPosition.Bottom;
        } else {
            for (let i = 0; i < this._frameOutPorts.length; i++) {
                const port = this._frameOutPorts[i];
                if (i === 0) {
                    port.framePortPosition = FramePortPosition.Top;
                } else if (i === this._frameInPorts.length - 1) {
                    port.framePortPosition = FramePortPosition.Bottom;
                } else {
                    port.framePortPosition = FramePortPosition.Middle;
                }
            }
        }
    }

    private _createFramePorts() {
        for (const node of this._nodes) {
            node.isVisible = false;
        }

        for (let i = 0; i < this._exposedOutPorts.length; ) {
            // Output
            const port = this._exposedOutPorts[i];
            if (port) {
                if (port.node === null || port.node.enclosingFrameId != this.id) {
                    if (this._removePortFromExposedWithNode(port, this._exposedOutPorts)) continue;
                } else {
                    if (!this._createOutputPorts(port, port.node) && this._removePortFromExposedWithNode(port, this._exposedOutPorts)) {
                        continue;
                    }
                }
            }
            ++i;
        }

        for (let i = 0; i < this._exposedInPorts.length; ) {
            // Input
            const port = this._exposedInPorts[i];
            if (!port || port.node === null || port.node.enclosingFrameId != this.id) {
                if (this._removePortFromExposedWithNode(port, this._exposedInPorts)) {
                    continue;
                }
            } else {
                if (!this._createInputPorts(port, port.node) && this._removePortFromExposedWithNode(port, this._exposedInPorts)) {
                    continue;
                }
            }
            ++i;
        }

        for (const node of this._nodes) {
            for (const port of node.outputPorts) {
                // Output
                port.exposedPortPosition = this._exposedOutPorts.findIndex((nodePort) => nodePort === port);
                if (port.exposedPortPosition < 0) {
                    if (this._createOutputPorts(port, node)) {
                        port.node.enclosingFrameId = this.id;
                        this._exposedOutPorts.push(port);
                        port.exposedPortPosition = this._exposedOutPorts.length - 1;
                    }
                }
            }
            for (const port of node.inputPorts) {
                // Input
                port.exposedPortPosition = this._exposedInPorts.findIndex((nodePort) => nodePort === port);
                if (port.exposedPortPosition < 0) {
                    this._createInputPorts(port, node);
                }
            }
        }
    }

    private _removePortFromExposedWithNode(port: NodePort, exposedPorts: NodePort[]) {
        const index = exposedPorts.findIndex((nodePort) => nodePort === port);
        if (index >= 0) {
            exposedPorts.splice(index, 1);
            if (port) {
                port.exposedPortPosition = -1;
            }
            return true;
        }
        return false;
    }

    private _removePortFromExposedWithLink(nodeLink: NodeLink, exposedPorts: NodePort[]) {
        const aPort = exposedPorts.findIndex((nodePort) => nodePort === nodeLink.portA);
        const bPort = exposedPorts.findIndex((nodePort) => nodePort === nodeLink.portB);
        if (aPort >= 0) {
            if (!nodeLink.portA.exposedOnFrame) {
                exposedPorts.splice(aPort, 1);
                nodeLink.portA.exposedPortPosition = -1;
                return true;
            }
        } else if (bPort >= 0) {
            if (nodeLink.portB && !nodeLink.portB.exposedOnFrame) {
                exposedPorts.splice(bPort, 1);
                nodeLink.portB.exposedPortPosition = -1;
                return true;
            }
        }
        return false;
    }

    private _createInputPorts(port: NodePort, node: GraphNode) {
        if (port.portData.isConnected) {
            let portAdded = false;
            for (const link of node.links) {
                if (link.portB === port && this.nodes.indexOf(link.nodeA) === -1) {
                    this._createInputPort(port, node);
                    link.isVisible = true;
                    portAdded = true;
                    const onLinkDisposedObserver = link.onDisposedObservable.add((nodeLink: NodeLink) => {
                        if (this._removePortFromExposedWithLink(nodeLink, this._exposedInPorts)) {
                            this.redrawFramePorts();
                        }
                    });
                    this._onNodeLinkDisposedObservers.push(onLinkDisposedObserver);
                }
            }
            if (portAdded) return true;
        } else if (port.exposedOnFrame) {
            this._createInputPort(port, node);
            return true;
        }
        return false;
    }

    private _createOutputPorts(port: NodePort, node: GraphNode) {
        if (port.portData.hasEndpoints) {
            let portAdded = false;
            for (const link of node.links) {
                if (link.portA === port && this.nodes.indexOf(link.nodeB!) === -1) {
                    let localPort: FrameNodePort;

                    if (!portAdded) {
                        portAdded = true;
                        localPort = FrameNodePort.CreateFrameNodePortElement(
                            port.portData,
                            link.nodeA!,
                            this._outputPortContainer,
                            null,
                            this._ownerCanvas.stateManager,
                            false,
                            GraphFrame._FramePortCounter++,
                            this.id
                        );
                        this._frameOutPorts.push(localPort);

                        link.isVisible = true;

                        const onLinkDisposedObserver = link.onDisposedObservable.add((nodeLink: NodeLink) => {
                            if (this._removePortFromExposedWithLink(nodeLink, this._exposedOutPorts)) {
                                this.redrawFramePorts();
                            }
                        });

                        this._onNodeLinkDisposedObservers.push(onLinkDisposedObserver);
                    } else if (this.nodes.indexOf(link.nodeB!) === -1) {
                        link.isVisible = true;
                        localPort = this.ports.filter((p) => p.portData === port.portData)[0];
                    } else {
                        localPort = this.ports.filter((p) => p.portData === port.portData)[0];
                    }
                    port.delegatedPort = localPort;
                    this._controlledPorts.push(port);
                } else if (port.exposedPortPosition >= 0 && !portAdded) {
                    const localPort = FrameNodePort.CreateFrameNodePortElement(
                        port.portData,
                        node,
                        this._outputPortContainer,
                        null,
                        this._ownerCanvas.stateManager,
                        false,
                        GraphFrame._FramePortCounter++,
                        this.id
                    );
                    this._frameOutPorts.push(localPort);
                    port.delegatedPort = localPort;
                    this._controlledPorts.push(port);
                    portAdded = true;
                }
            }
            if (portAdded) return true;
        } else if (port.exposedOnFrame) {
            const localPort = FrameNodePort.CreateFrameNodePortElement(
                port.portData,
                node,
                this._outputPortContainer,
                null,
                this._ownerCanvas.stateManager,
                false,
                GraphFrame._FramePortCounter++,
                this.id
            );
            this._frameOutPorts.push(localPort);
            port.delegatedPort = localPort;
            this._controlledPorts.push(port);
            return true;
        }

        return false;
    }

    public redrawFramePorts() {
        if (!this.isCollapsed) {
            return;
        }

        this._outputPortContainer.innerHTML = "";
        this._inputPortContainer.innerHTML = "";
        this.ports.forEach((framePort: FrameNodePort) => {
            framePort.dispose();
        });

        this._controlledPorts.forEach((port) => {
            port.delegatedPort = null;
            port.refresh();
        });

        this._frameInPorts = [];
        this._frameOutPorts = [];
        this._controlledPorts = [];

        this._createFramePorts();
        this._markFramePortPositions();
        this.ports.forEach((framePort: FrameNodePort) => framePort.node._refreshLinks());
    }

    public set isCollapsed(value: boolean) {
        if (this._isCollapsed === value) {
            return;
        }

        this._isCollapsed = value;
        this._ownerCanvas._frameIsMoving = true;

        // Need to delegate the outside ports to the frame
        if (value) {
            this.element.classList.add(styles.collapsed);
            this.element.classList.remove(styles.expanded);
            this._headerElement.classList.add(styles.collapsedHeader);

            this._moveFrame((this.width - this._collapsedWidth) / 2, 0);

            this._createFramePorts();

            this._markFramePortPositions();
        } else {
            this.element.classList.add(styles.expanded);
            this.element.classList.remove(styles.collapsed);
            this._headerElement.classList.remove(styles.collapsedHeader);

            this._outputPortContainer.innerHTML = "";
            this._inputPortContainer.innerHTML = "";

            this._frameInPorts.forEach((p) => {
                p.dispose();
            });

            this._frameOutPorts.forEach((p) => {
                p.dispose();
            });

            this._controlledPorts.forEach((port) => {
                port.delegatedPort = null;
                port.refresh();
            });

            this._frameInPorts = [];
            this._frameOutPorts = [];
            this._controlledPorts = [];
            this._onNodeLinkDisposedObservers = [];

            for (const node of this._nodes) {
                node.isVisible = true;
            }

            this._moveFrame(-(this.width - this._collapsedWidth) / 2, 0);
        }

        this.cleanAccumulation();
        this._ownerCanvas._frameIsMoving = false;

        // UI
        if (this._isCollapsed) {
            this._headerCollapseElement.innerHTML = this._expandSVG;
            this._headerCollapseElement.title = "Expand";
        } else {
            this._headerCollapseElement.innerHTML = this._collapseSVG;
            this._headerCollapseElement.title = "Collapse";
        }

        this.onExpandStateChanged.notifyObservers(this);
    }

    public get nodes() {
        return this._nodes;
    }

    public get ports() {
        return this._frameInPorts.concat(this._frameOutPorts);
    }

    public get name() {
        return this._name;
    }

    public set name(value: string) {
        this._name = value;
        this._headerTextElement.innerHTML = value;
    }

    public get color() {
        return this._color;
    }

    public set color(value: Color3) {
        this._color = value;
        this._headerElement.style.background = `rgba(${value.r * 255}, ${value.g * 255}, ${value.b * 255}, 1)`;
        this._headerElement.style.borderColor = `rgba(${value.r * 255}, ${value.g * 255}, ${value.b * 255}, 1)`;
        this.element.style.background = `rgba(${value.r * 255}, ${value.g * 255}, ${value.b * 255}, 0.7)`;
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
        this.element.style.left = `${this._gridAlignedX}px`;
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
        this.element.style.top = `${this._gridAlignedY}px`;
    }

    public get width() {
        return this._width;
    }

    public set width(value: number) {
        if (this._width === value) {
            return;
        }
        const viableWidth = value > this._minFrameWidth ? value : this._minFrameWidth;
        this._width = viableWidth;

        const gridAlignedRight = this._ownerCanvas.getGridPositionCeil(viableWidth + this._gridAlignedX);

        this.element.style.width = `${gridAlignedRight - this._gridAlignedX}px`;
    }

    public get height() {
        return this._height;
    }

    public set height(value: number) {
        if (this._height === value) {
            return;
        }
        this._height = value;

        const gridAlignedBottom = this._ownerCanvas.getGridPositionCeil(value + this._gridAlignedY);

        this.element.style.height = `${gridAlignedBottom - this._gridAlignedY}px`;
    }

    public get comments(): string {
        return this._comments;
    }

    public set comments(comments: string) {
        if (comments && !this._comments && comments.length > 0) {
            this.element.style.gridTemplateRows = "40px min-content 1fr";
            this._borderElement.style.gridRow = "1 / span 3";
            this._portContainer.style.gridRow = "3";
            this._commentsElement.classList.add("has-comments");
        } else if (!comments) {
            this.element.style.gridTemplateRows = "40px calc(100% - 40px)";
            this._borderElement.style.gridRow = "1 / span 2";
            this._portContainer.style.gridRow = "2";
            this._commentsElement.classList.remove("has-comments");
        }

        if (comments === "" || (comments && comments.length >= 0)) {
            (this._commentsElement.children[0] as HTMLSpanElement).innerText = comments;
        }
        this.height = this._borderElement.offsetHeight;
        this._comments = comments;
        this._updateMinHeightWithComments();
    }

    public constructor(candidate: Nullable<HTMLDivElement>, canvas: GraphCanvasComponent, doNotCaptureNodes = false) {
        this._id = GraphFrame._FrameCounter++;

        this._ownerCanvas = canvas;
        const root = canvas.frameContainer;
        this.element = root.ownerDocument!.createElement("div");
        this.element.classList.add(commonStyles["frame-box"]);
        root.appendChild(this.element);

        this._headerElement = root.ownerDocument!.createElement("div");
        this._headerElement.classList.add(styles["frame-box-header"]);
        this._headerElement.addEventListener("dblclick", () => {
            this.isCollapsed = !this.isCollapsed;
        });
        this.element.appendChild(this._headerElement);

        this._borderElement = root.ownerDocument!.createElement("div");
        this._borderElement.classList.add(styles["frame-box-border"]);

        this.element.appendChild(this._borderElement);

        this.element.classList.add(styles.expanded);

        // add resizing side handles

        const rightHandle: HTMLDivElement = root.ownerDocument!.createElement("div");
        rightHandle.className = styles["right-handle"];
        this.element.appendChild(rightHandle);
        rightHandle.addEventListener("pointerdown", this._onRightHandlePointerDown);

        const leftHandle: HTMLDivElement = root.ownerDocument!.createElement("div");
        leftHandle.className = styles["left-handle"];
        this.element.appendChild(leftHandle);
        leftHandle.addEventListener("pointerdown", this._onLeftHandlePointerDown);

        const bottomHandle: HTMLDivElement = root.ownerDocument!.createElement("div");
        bottomHandle.className = styles["bottom-handle"];
        this.element.appendChild(bottomHandle);
        bottomHandle.addEventListener("pointerdown", this._onBottomHandlePointerDown);

        const topHandle: HTMLDivElement = root.ownerDocument!.createElement("div");
        topHandle.className = styles["top-handle"];
        this.element.appendChild(topHandle);
        topHandle.addEventListener("pointerdown", this._onTopHandlePointerDown);

        const topRightCornerHandle: HTMLDivElement = root.ownerDocument!.createElement("div");
        topRightCornerHandle.className = ClassNames({ "right-handle": true, "top-right-corner-handle": true }, styles);
        this.element.appendChild(topRightCornerHandle);
        topRightCornerHandle.addEventListener("pointerdown", this._onTopRightHandlePointerDown);

        const bottomRightCornerHandle: HTMLDivElement = root.ownerDocument!.createElement("div");
        bottomRightCornerHandle.className = ClassNames({ "right-handle": true, "bottom-right-corner-handle": true }, styles);
        this.element.appendChild(bottomRightCornerHandle);
        bottomRightCornerHandle.addEventListener("pointerdown", this._onBottomRightHandlePointerDown);

        const topLeftCornerHandle: HTMLDivElement = root.ownerDocument!.createElement("div");
        topLeftCornerHandle.className = ClassNames({ "left-handle": true, "top-left-corner-handle": true }, styles);
        this.element.appendChild(topLeftCornerHandle);
        topLeftCornerHandle.addEventListener("pointerdown", this._onTopLeftHandlePointerDown);

        const bottomLeftCornerHandle: HTMLDivElement = root.ownerDocument!.createElement("div");
        bottomLeftCornerHandle.className = ClassNames({ "left-handle": true, "bottom-left-corner-handle": true }, styles);
        this.element.appendChild(bottomLeftCornerHandle);
        bottomLeftCornerHandle.addEventListener("pointerdown", this._onBottomLeftHandlePointerDown);

        // add header elements

        this._headerTextElement = root.ownerDocument!.createElement("div");
        this._headerTextElement.classList.add(styles["frame-box-header-title"]);
        this._headerElement.appendChild(this._headerTextElement);

        this._headerCollapseElement = root.ownerDocument!.createElement("div");
        this._headerCollapseElement.classList.add(styles["frame-box-header-collapse"]);
        this._headerCollapseElement.classList.add(styles["frame-box-header-button"]);
        this._headerCollapseElement.title = "Collapse";
        this._headerCollapseElement.ondragstart = () => false;
        this._headerCollapseElement.addEventListener("pointerdown", (evt) => {
            this._headerCollapseElement.classList.add("down");
            evt.stopPropagation();
        });
        this._headerCollapseElement.addEventListener("pointerup", (evt) => {
            evt.stopPropagation();
            this._headerCollapseElement.classList.remove("down");
            this.isCollapsed = !this.isCollapsed;
        });
        this._headerCollapseElement.innerHTML = this._collapseSVG;
        this._headerElement.appendChild(this._headerCollapseElement);

        this._headerCloseElement = root.ownerDocument!.createElement("div");
        this._headerCloseElement.classList.add(styles["frame-box-header-close"]);
        this._headerCloseElement.classList.add(styles["frame-box-header-button"]);
        this._headerCloseElement.title = "Close";
        this._headerCloseElement.ondragstart = () => false;
        this._headerCloseElement.addEventListener("pointerdown", (evt) => {
            evt.stopPropagation();
        });
        this._headerCloseElement.addEventListener("pointerup", (evt) => {
            evt.stopPropagation();
            this.dispose();
        });
        this._headerCloseElement.innerHTML = this._closeSVG;
        this._headerElement.appendChild(this._headerCloseElement);

        this._portContainer = root.ownerDocument!.createElement("div");
        this._portContainer.classList.add(styles["port-container"]);
        this.element.appendChild(this._portContainer);

        this._outputPortContainer = root.ownerDocument!.createElement("div");
        this._outputPortContainer.classList.add(commonStyles["outputsContainer"]);
        this._portContainer.appendChild(this._outputPortContainer);

        this._inputPortContainer = root.ownerDocument!.createElement("div");
        this._inputPortContainer.classList.add(commonStyles["inputsContainer"]);
        this._portContainer.appendChild(this._inputPortContainer);

        this.name = "Frame";
        this.color = Color3.FromInts(72, 72, 72);

        if (candidate) {
            this.x = parseFloat(candidate.style.left!.replace("px", ""));
            this.y = parseFloat(candidate.style.top!.replace("px", ""));
            this.width = parseFloat(candidate.style.width!.replace("px", ""));
            this.height = parseFloat(candidate.style.height!.replace("px", ""));

            this.cleanAccumulation();
        }

        this._headerTextElement.addEventListener("pointerdown", (evt) => this._onDown(evt));
        this._headerTextElement.addEventListener("pointerup", (evt) => this._onUp(evt));
        this._headerTextElement.addEventListener("pointermove", (evt) => this._onMove(evt));

        this._onSelectionChangedObserver = canvas.stateManager.onSelectionChangedObservable.add(() => {
            if (this._ownerCanvas.selectedFrames.indexOf(this) !== -1) {
                this._borderElement.classList.add(styles["selected"]);
            } else {
                this._borderElement.classList.remove(styles["selected"]);
            }
        });

        canvas.stateManager.onSelectionBoxMoved.add((rect1) => {
            const rect2 = this.element.getBoundingClientRect();
            const overlap = !(rect1.right < rect2.left || rect1.left > rect2.right || rect1.bottom < rect2.top || rect1.top > rect2.bottom);
            if (overlap) {
                canvas.stateManager.onSelectionChangedObservable.notifyObservers({ selection: this, forceKeepSelection: true, marqueeSelection: true });
            }
        });

        this._onGraphNodeRemovalObserver = canvas.stateManager.onGraphNodeRemovalObservable.add((node: GraphNode) => {
            // remove node from this._nodes
            const index = this._nodes.indexOf(node);
            if (index === -1) {
                return;
            } else {
                node.enclosingFrameId = -1;
                this._nodes.splice(index, 1);
            }
        });

        this._onExposePortOnFrameObserver = canvas.stateManager.onExposePortOnFrameObservable.add((node: GraphNode) => {
            if (this.nodes.indexOf(node) === -1) {
                return;
            }
            this.redrawFramePorts();
        });

        this._commentsElement = document.createElement("div");
        this._commentsElement.className = styles["frame-comments"];
        this._commentsElement.style.color = "white";
        this._commentsElement.style.fontSize = "16px";
        const commentSpan = document.createElement("span");
        commentSpan.className = styles["frame-comment-span"];
        this._commentsElement.appendChild(commentSpan);

        this.element.appendChild(this._commentsElement);

        // Get nodes
        if (!doNotCaptureNodes) {
            this.refresh();
        }
    }

    public refresh() {
        this._nodes = [];
        this._ownerCanvas.stateManager.onFrameCreatedObservable.notifyObservers(this);
    }

    public addNode(node: GraphNode) {
        const index = this.nodes.indexOf(node);

        if (index === -1) {
            this.nodes.push(node);
        }
    }

    public removeNode(node: GraphNode) {
        const index = this.nodes.indexOf(node);
        if (index > -1) {
            node.enclosingFrameId = -1;
            this.nodes.splice(index, 1);
        }
    }

    public syncNode(node: GraphNode) {
        if (this.isCollapsed) {
            return;
        }

        if (node.isOverlappingFrame(this)) {
            this.addNode(node);
        } else {
            this.removeNode(node);
        }
    }

    public cleanAccumulation() {
        for (const selectedNode of this._nodes) {
            selectedNode.cleanAccumulation();
        }

        this.x = this._ownerCanvas.getGridPosition(this.x);
        this.y = this._ownerCanvas.getGridPosition(this.y);
    }

    private _onDown(evt: PointerEvent) {
        this._headerTextElement.setPointerCapture(evt.pointerId);

        const indexInSelection = this._ownerCanvas.selectedFrames.indexOf(this);
        if (indexInSelection === -1) {
            this._ownerCanvas.stateManager.onSelectionChangedObservable.notifyObservers({ selection: this });
        } else if (evt.ctrlKey) {
            this._ownerCanvas.selectedFrames.splice(indexInSelection, 1);
            this.element.classList.remove("selected");
        }
        this._ownerCanvas._frameIsMoving = true;

        this._mouseStartPointX = evt.clientX;
        this._mouseStartPointY = evt.clientY;

        evt.stopPropagation();
    }

    public move(newX: number, newY: number, align = true) {
        const oldX = this.x;
        const oldY = this.y;

        this.x = newX;
        this.y = newY;

        for (const selectedNode of this._nodes) {
            selectedNode.x += this.x - oldX;
            selectedNode.y += this.y - oldY;
            if (align) {
                selectedNode.cleanAccumulation(true);
            }
        }
    }

    private _onUp(evt: PointerEvent) {
        evt.stopPropagation();

        this.cleanAccumulation();
        this._mouseStartPointX = null;
        this._mouseStartPointY = null;
        this._headerTextElement.releasePointerCapture(evt.pointerId);

        this._ownerCanvas._frameIsMoving = false;
    }

    public _moveFrame(offsetX: number, offsetY: number) {
        this.x += offsetX;
        this.y += offsetY;

        for (const selectedNode of this._nodes) {
            selectedNode.x += offsetX;
            selectedNode.y += offsetY;
        }
    }

    private _onMove(evt: PointerEvent) {
        if (this._mouseStartPointX === null || this._mouseStartPointY === null || evt.ctrlKey || this._frameIsResizing) {
            return;
        }

        const newX = (evt.clientX - this._mouseStartPointX) / this._ownerCanvas.zoom;
        const newY = (evt.clientY - this._mouseStartPointY) / this._ownerCanvas.zoom;

        for (const frame of this._ownerCanvas.selectedFrames) {
            frame._moveFrame(newX, newY);
        }
        for (const node of this._ownerCanvas.selectedNodes) {
            node.x += newX;
            node.y += newY;
        }

        this._mouseStartPointX = evt.clientX;
        this._mouseStartPointY = evt.clientY;

        evt.stopPropagation();
    }

    public moveFramePortUp(nodePort: FrameNodePort) {
        let elementsArray: ChildNode[];
        if (nodePort.isInput) {
            if (this._inputPortContainer.children.length < 2) {
                return;
            }
            elementsArray = Array.from(this._inputPortContainer.childNodes);
            const indexInContainer = this._frameInPorts.findIndex((framePort) => framePort === nodePort);
            [this._exposedInPorts[indexInContainer - 1], this._exposedInPorts[indexInContainer]] = [
                this._exposedInPorts[indexInContainer],
                this._exposedInPorts[indexInContainer - 1],
            ]; // swap idicies
            this._movePortUp(elementsArray, nodePort, this._frameInPorts);
        } else {
            if (this._outputPortContainer.children.length < 2) {
                return;
            }
            elementsArray = Array.from(this._outputPortContainer.childNodes);
            const indexInContainer = this._frameOutPorts.findIndex((framePort) => framePort === nodePort);
            [this._exposedOutPorts[indexInContainer - 1], this._exposedOutPorts[indexInContainer]] = [
                this._exposedOutPorts[indexInContainer],
                this._exposedOutPorts[indexInContainer - 1],
            ]; // swap idicies
            this._movePortUp(elementsArray, nodePort, this._frameOutPorts);
        }
        this.ports.forEach((framePort: FrameNodePort) => framePort.node._refreshLinks());
    }

    private _movePortUp(elementsArray: ChildNode[], nodePort: FrameNodePort, framePortList: FrameNodePort[]) {
        // update UI
        const indexInElementArray = (elementsArray as HTMLElement[]).findIndex((elem) => elem.dataset.framePortId === `${nodePort.framePortId}`);
        if (indexInElementArray === 0) {
            return;
        }
        const secondPortElement = elementsArray[indexInElementArray];
        const firstPortElement = elementsArray[indexInElementArray - 1];
        firstPortElement.parentElement?.insertBefore(secondPortElement, firstPortElement);

        // update Frame Port Container
        const indexInContainer = framePortList.findIndex((framePort) => framePort === nodePort);
        [framePortList[indexInContainer - 1], framePortList[indexInContainer]] = [framePortList[indexInContainer], framePortList[indexInContainer - 1]]; // swap idicies

        //special case framePortList.length == 2
        if (framePortList.length == 2) {
            framePortList[1].framePortPosition = FramePortPosition.Bottom;
            framePortList[0].framePortPosition = FramePortPosition.Top;
        } else {
            // notify nodePort if it is now at Top (indexInElementArray === 1)
            if (indexInElementArray === 1) {
                framePortList[1].framePortPosition = FramePortPosition.Middle;
                framePortList[0].framePortPosition = FramePortPosition.Top;
            } else if (indexInContainer === elementsArray.length - 1) {
                framePortList[framePortList.length - 1].framePortPosition = FramePortPosition.Bottom;
                framePortList[framePortList.length - 2].framePortPosition = FramePortPosition.Middle;
            } else {
                nodePort.framePortPosition = FramePortPosition.Middle;
            }
        }
    }

    public moveFramePortDown(nodePort: FrameNodePort) {
        let elementsArray: ChildNode[];
        if (nodePort.isInput) {
            if (this._inputPortContainer.children.length < 2) {
                return;
            }
            elementsArray = Array.from(this._inputPortContainer.childNodes);
            const indexInContainer = this._frameInPorts.findIndex((framePort) => framePort === nodePort);
            [this._exposedInPorts[indexInContainer], this._exposedInPorts[indexInContainer + 1]] = [
                this._exposedInPorts[indexInContainer + 1],
                this._exposedInPorts[indexInContainer],
            ]; // swap idicies
            this._movePortDown(elementsArray, nodePort, this._frameInPorts);
        } else {
            if (this._outputPortContainer.children.length < 2) {
                return;
            }
            elementsArray = Array.from(this._outputPortContainer.childNodes);
            const indexInContainer = this._frameOutPorts.findIndex((framePort) => framePort === nodePort);
            [this._exposedOutPorts[indexInContainer], this._exposedOutPorts[indexInContainer + 1]] = [
                this._exposedOutPorts[indexInContainer + 1],
                this._exposedOutPorts[indexInContainer],
            ]; // swap idicies
            this._movePortDown(elementsArray, nodePort, this._frameOutPorts);
        }

        this.ports.forEach((framePort: FrameNodePort) => framePort.node._refreshLinks());
    }

    private _movePortDown(elementsArray: ChildNode[], nodePort: FrameNodePort, framePortList: FrameNodePort[]) {
        // update UI
        const indexInElementArray = (elementsArray as HTMLElement[]).findIndex((elem) => elem.dataset.framePortId === `${nodePort.framePortId}`);
        if (indexInElementArray === elementsArray.length - 1) {
            return;
        }
        const firstPort = elementsArray[indexInElementArray];
        const secondPort = elementsArray[indexInElementArray + 1];
        firstPort.parentElement?.insertBefore(secondPort, firstPort);

        // update Frame Port Container
        const indexInContainer = framePortList.findIndex((framePort) => framePort === nodePort);
        [framePortList[indexInContainer], framePortList[indexInContainer + 1]] = [framePortList[indexInContainer + 1], framePortList[indexInContainer]]; // swap idicies

        // notify nodePort if it is now at bottom (indexInContainer === elementsArray.length-2)
        if (framePortList.length == 2) {
            framePortList[0].framePortPosition = FramePortPosition.Top;
            framePortList[1].framePortPosition = FramePortPosition.Bottom;
        } else {
            if (indexInContainer === elementsArray.length - 2) {
                framePortList[elementsArray.length - 2].framePortPosition = FramePortPosition.Middle;
                framePortList[elementsArray.length - 1].framePortPosition = FramePortPosition.Bottom;
            } else if (indexInContainer === 0) {
                framePortList[0].framePortPosition = FramePortPosition.Top;
                framePortList[1].framePortPosition = FramePortPosition.Middle;
            } else {
                nodePort.framePortPosition = FramePortPosition.Middle;
            }
        }
    }

    private _initResizing = (evt: PointerEvent) => {
        evt.stopPropagation();
        this._mouseStartPointX = evt.clientX;
        this._mouseStartPointY = evt.clientY;
        this._frameIsResizing = true;
    };

    private _cleanUpResizing = (evt: PointerEvent) => {
        evt.stopPropagation();
        this._frameIsResizing = false;
        this._resizingDirection = null;
        this._mouseStartPointX = null;
        this._mouseStartPointY = null;
        this._mouseXLimit = null;
        this.refresh();
    };

    private _updateMinHeightWithComments = () => {
        if (this.comments && this.comments.length > 0) {
            const minFrameHeightWithComments = this._commentsElement.offsetHeight + 40;
            this._minFrameHeight = minFrameHeightWithComments;
        }
    };

    private _isResizingTop() {
        return this._resizingDirection === ResizingDirection.Top || this._resizingDirection === ResizingDirection.TopRight || this._resizingDirection === ResizingDirection.TopLeft;
    }

    private _isResizingRight() {
        return (
            this._resizingDirection === ResizingDirection.Right ||
            this._resizingDirection === ResizingDirection.TopRight ||
            this._resizingDirection === ResizingDirection.BottomRight
        );
    }

    private _isResizingBottom() {
        return (
            this._resizingDirection === ResizingDirection.Bottom ||
            this._resizingDirection === ResizingDirection.BottomLeft ||
            this._resizingDirection === ResizingDirection.BottomRight
        );
    }

    private _isResizingLeft() {
        return (
            this._resizingDirection === ResizingDirection.Left || this._resizingDirection === ResizingDirection.TopLeft || this._resizingDirection === ResizingDirection.BottomLeft
        );
    }

    private _onRightHandlePointerDown = (evt: PointerEvent) => {
        if (this.isCollapsed) {
            return;
        }
        this._initResizing(evt);
        this._resizingDirection = ResizingDirection.Right;
        this._mouseXLimit = evt.clientX - (this.width - this._minFrameWidth);
        this._ownerCanvas.hostCanvas.addEventListener("pointerup", this._onRightHandlePointerUp);
        this._ownerCanvas.hostCanvas.addEventListener("pointermove", this._onRightHandlePointerMove);
    };

    private _onRightHandlePointerMove = (evt: PointerEvent) => {
        const slack = (this.element.offsetWidth - this._minFrameWidth) * this._ownerCanvas.zoom;
        const xLimit = (this._mouseStartPointX as number) - slack;
        this._moveRightHandle(evt, xLimit);
    };

    private _moveRightHandle = (evt: PointerEvent, xLimit: number) => {
        // tslint:disable-next-line: no-this-assignment
        if (this._mouseXLimit) {
            if (!this._isResizingRight() || this._mouseStartPointX === null || this._mouseStartPointY === null || evt.clientX < xLimit) {
                return;
            }
            if (this._isResizingRight()) {
                evt.stopPropagation();
                const distanceMouseMoved = (evt.clientX - this._mouseStartPointX) / this._ownerCanvas.zoom;
                this._expandRight(distanceMouseMoved, evt.clientX);
                this._mouseStartPointX = evt.clientX;
            }
        }
    };

    private _onRightHandlePointerUp = (evt: PointerEvent) => {
        if (this._isResizingRight()) {
            this.width = parseFloat(this.element.style.width.replace("px", ""));
            this._ownerCanvas.hostCanvas.removeEventListener("pointerup", this._onRightHandlePointerUp);
            this._ownerCanvas.hostCanvas.removeEventListener("pointermove", this._onRightHandlePointerMove);
            this._cleanUpResizing(evt);
        }
    };

    private _onBottomHandlePointerDown = (evt: PointerEvent) => {
        if (this.isCollapsed) {
            return;
        }
        this._initResizing(evt);
        this._resizingDirection = ResizingDirection.Bottom;
        this._ownerCanvas.hostCanvas.addEventListener("pointermove", this._onBottomHandlePointerMove);
        this._ownerCanvas.hostCanvas.addEventListener("pointerup", this._onBottomHandlePointerUp);
    };

    private _onBottomHandlePointerMove = (evt: PointerEvent) => {
        const slack = (this.element.offsetHeight - this._minFrameHeight) * this._ownerCanvas.zoom;
        const yLimit = (this._mouseStartPointY as number) - slack;
        this._moveBottomHandle(evt, yLimit);
    };

    private _moveBottomHandle = (evt: PointerEvent, yLimit: number) => {
        if (this._resizingDirection !== ResizingDirection.Bottom || this._mouseStartPointX === null || this._mouseStartPointY === null || evt.clientY < yLimit) {
            return;
        }
        if (this._resizingDirection === ResizingDirection.Bottom) {
            evt.stopPropagation();
            const distanceMouseMoved = (evt.clientY - this._mouseStartPointY) / this._ownerCanvas.zoom;
            this._expandBottom(distanceMouseMoved);
            this._mouseStartPointY = evt.clientY;
        }
    };

    private _onBottomHandlePointerUp = (evt: PointerEvent) => {
        if (this._resizingDirection === ResizingDirection.Bottom) {
            this.height = parseFloat(this.element.style.height.replace("px", ""));
            this._ownerCanvas.hostCanvas.removeEventListener("pointermove", this._onBottomHandlePointerMove);
            this._ownerCanvas.hostCanvas.removeEventListener("pointerup", this._onBottomHandlePointerUp);
            this._cleanUpResizing(evt);
        }
    };

    private _onLeftHandlePointerDown = (evt: PointerEvent) => {
        if (this.isCollapsed) {
            return;
        }
        this._initResizing(evt);
        this._resizingDirection = ResizingDirection.Left;
        this._mouseXLimit = evt.clientX + this.width - this._minFrameWidth;
        this._ownerCanvas.hostCanvas.addEventListener("pointerup", this._onLeftHandlePointerUp);
        this._ownerCanvas.hostCanvas.addEventListener("pointermove", this._onLeftHandlePointerMove);
    };

    private _onLeftHandlePointerMove = (evt: PointerEvent) => {
        const slack = (this.element.offsetWidth - this._minFrameWidth) * this._ownerCanvas.zoom;
        const xLimit = (this._mouseStartPointX as number) + slack;
        this._moveLeftHandle(evt, xLimit);
    };

    private _moveLeftHandle = (evt: PointerEvent, xLimit: number) => {
        if (this._mouseXLimit) {
            if (this._resizingDirection !== ResizingDirection.Left || this._mouseStartPointX === null || this._mouseStartPointY === null || evt.clientX > xLimit) {
                return;
            }
            if (this._resizingDirection === ResizingDirection.Left) {
                evt.stopPropagation();
                const distanceMouseMoved = (evt.clientX - this._mouseStartPointX) / this._ownerCanvas.zoom;
                this._expandLeft(distanceMouseMoved);
                this._mouseStartPointX = evt.clientX;
            }
        }
    };

    private _onLeftHandlePointerUp = (evt: PointerEvent) => {
        if (this._resizingDirection === ResizingDirection.Left) {
            this.x = parseFloat(this.element.style.left!.replace("px", ""));
            this.width = parseFloat(this.element.style.width.replace("px", ""));
            this._ownerCanvas.hostCanvas.removeEventListener("pointerup", this._onLeftHandlePointerUp);
            this._ownerCanvas.hostCanvas.removeEventListener("pointermove", this._onLeftHandlePointerMove);
            this._cleanUpResizing(evt);
        }
    };

    private _onTopHandlePointerDown = (evt: PointerEvent) => {
        if (this.isCollapsed) {
            return;
        }
        this._initResizing(evt);
        this._resizingDirection = ResizingDirection.Top;
        this._ownerCanvas.hostCanvas.addEventListener("pointerup", this._onTopHandlePointerUp);
        this._ownerCanvas.hostCanvas.addEventListener("pointermove", this._onTopHandlePointerMove);
    };

    private _onTopHandlePointerMove = (evt: PointerEvent) => {
        const slack = (this.element.offsetHeight - this._minFrameHeight) * this._ownerCanvas.zoom;
        const yLimit = (this._mouseStartPointY as number) + slack;
        this._moveTopHandle(evt, yLimit);
    };

    private _moveTopHandle = (evt: PointerEvent, yLimit: number) => {
        if (!this._isResizingTop() || this._mouseStartPointX === null || this._mouseStartPointY === null || evt.clientY > yLimit) {
            return;
        }
        if (this._isResizingTop()) {
            evt.stopPropagation();
            const distanceMouseMoved = (evt.clientY - this._mouseStartPointY) / this._ownerCanvas.zoom;
            this._expandTop(distanceMouseMoved);
            this._mouseStartPointY = evt.clientY;
        }
    };

    private _onTopHandlePointerUp = (evt: PointerEvent) => {
        if (this._isResizingTop()) {
            this.y = parseFloat(this.element.style.top!.replace("px", ""));
            this.height = parseFloat(this.element.style.height.replace("px", ""));
            this._ownerCanvas.hostCanvas.removeEventListener("pointerup", this._onTopHandlePointerUp);
            this._ownerCanvas.hostCanvas.removeEventListener("pointermove", this._onTopHandlePointerMove);
            this._cleanUpResizing(evt);
        }
    };

    private _onTopRightHandlePointerDown = (evt: PointerEvent) => {
        if (this.isCollapsed) {
            return;
        }
        this._initResizing(evt);
        this._resizingDirection = ResizingDirection.TopRight;
        this._ownerCanvas.hostCanvas.addEventListener("pointerup", this._onTopRightHandlePointerUp);
        this._ownerCanvas.hostCanvas.addEventListener("pointermove", this._onTopRightHandlePointerMove);
    };

    private _onTopRightHandlePointerMove = (evt: PointerEvent) => {
        const topSlack = (this.element.offsetHeight - this._minFrameHeight) * this._ownerCanvas.zoom;
        const yLimit = (this._mouseStartPointY as number) + topSlack;
        const rightSlack = (this.element.offsetWidth - this._minFrameWidth) * this._ownerCanvas.zoom;
        const xLimit = (this._mouseStartPointX as number) - rightSlack;
        this._moveTopRightHandle(evt, xLimit, yLimit);
    };

    private _moveTopRightHandle = (evt: PointerEvent, xLimit: number, yLimit: number) => {
        if (!(this._isResizingTop() && this._isResizingRight()) || this._mouseStartPointX === null || this._mouseStartPointY === null) {
            return;
        }
        if (this._isResizingRight() && this._isResizingTop()) {
            evt.stopPropagation();
            if (evt.clientY < yLimit && evt.clientX > xLimit) {
                // able to move in X and Y
                const distanceMouseMovedX = (evt.clientX - this._mouseStartPointX) / this._ownerCanvas.zoom;
                this._expandRight(distanceMouseMovedX, evt.clientX);
                this._mouseStartPointX = evt.clientX;
                const distanceMouseMovedY = (evt.clientY - this._mouseStartPointY) / this._ownerCanvas.zoom;
                this._expandTop(distanceMouseMovedY);
                this._mouseStartPointY = evt.clientY;
            } else if (evt.clientY > yLimit && evt.clientX > xLimit) {
                // able to move in X but not Y
                const distanceMouseMovedX = (evt.clientX - this._mouseStartPointX) / this._ownerCanvas.zoom;
                this._expandRight(distanceMouseMovedX, evt.clientX);
                this._mouseStartPointX = evt.clientX;
            } else if (evt.clientY < yLimit && evt.clientX < xLimit) {
                // able to move in Y but not X
                const distanceMouseMovedY = (evt.clientY - this._mouseStartPointY) / this._ownerCanvas.zoom;
                this._expandTop(distanceMouseMovedY);
                this._mouseStartPointY = evt.clientY;
            }
        }
    };

    private _onTopRightHandlePointerUp = (evt: PointerEvent) => {
        evt.stopPropagation();
        if (this._resizingDirection === ResizingDirection.TopRight) {
            this.y = parseFloat(this.element.style.top!.replace("px", ""));
            this.height = parseFloat(this.element.style.height.replace("px", ""));
            this.width = parseFloat(this.element.style.width.replace("px", ""));
            this._ownerCanvas.hostCanvas.removeEventListener("pointerup", this._onTopRightHandlePointerUp);
            this._ownerCanvas.hostCanvas.removeEventListener("pointermove", this._onTopRightHandlePointerMove);
            this._cleanUpResizing(evt);
        }
    };

    private _onBottomRightHandlePointerDown = (evt: PointerEvent) => {
        if (this.isCollapsed) {
            return;
        }
        this._initResizing(evt);
        this._resizingDirection = ResizingDirection.BottomRight;
        this._ownerCanvas.hostCanvas.addEventListener("pointerup", this._onBottomRightHandlePointerUp);
        this._ownerCanvas.hostCanvas.addEventListener("pointermove", this._onBottomRightHandlePointerMove);
    };

    private _onBottomRightHandlePointerMove = (evt: PointerEvent) => {
        const bottomSlack = (this.element.offsetHeight - this._minFrameHeight) * this._ownerCanvas.zoom;
        const yLimit = (this._mouseStartPointY as number) - bottomSlack;
        const rightSlack = (this.element.offsetWidth - this._minFrameWidth) * this._ownerCanvas.zoom;
        const xLimit = (this._mouseStartPointX as number) - rightSlack;
        this._moveBottomRightHandle(evt, xLimit, yLimit);
    };

    private _moveBottomRightHandle = (evt: PointerEvent, xLimit: number, yLimit: number) => {
        if (!(this._isResizingBottom() && this._isResizingRight()) || this._mouseStartPointX === null || this._mouseStartPointY === null) {
            return;
        }
        if (this._isResizingRight() && this._isResizingBottom()) {
            evt.stopPropagation();
            if (evt.clientY > yLimit && evt.clientX > xLimit) {
                // able to move in X and Y
                const distanceMouseMovedX = (evt.clientX - this._mouseStartPointX) / this._ownerCanvas.zoom;
                this._expandRight(distanceMouseMovedX, evt.clientX);
                this._mouseStartPointX = evt.clientX;
                const distanceMouseMovedY = (evt.clientY - this._mouseStartPointY) / this._ownerCanvas.zoom;
                this._expandBottom(distanceMouseMovedY);
                this._mouseStartPointY = evt.clientY;
            } else if (evt.clientY < yLimit && evt.clientX > xLimit) {
                // able to move in X but not Y
                const distanceMouseMovedX = (evt.clientX - this._mouseStartPointX) / this._ownerCanvas.zoom;
                this._expandRight(distanceMouseMovedX, evt.clientX);
                this._mouseStartPointX = evt.clientX;
            } else if (evt.clientY > yLimit && evt.clientX < xLimit) {
                // able to move in Y but not X
                const distanceMouseMovedY = (evt.clientY - this._mouseStartPointY) / this._ownerCanvas.zoom;
                this._expandBottom(distanceMouseMovedY);
                this._mouseStartPointY = evt.clientY;
            }
        }
    };

    private _onBottomRightHandlePointerUp = (evt: PointerEvent) => {
        if (this._resizingDirection === ResizingDirection.BottomRight) {
            this.height = parseFloat(this.element.style.height.replace("px", ""));
            this.width = parseFloat(this.element.style.width.replace("px", ""));
            this._ownerCanvas.hostCanvas.removeEventListener("pointerup", this._onBottomRightHandlePointerUp);
            this._ownerCanvas.hostCanvas.removeEventListener("pointermove", this._onBottomRightHandlePointerMove);
            this._cleanUpResizing(evt);
        }
    };

    //@ts-ignore
    private _onBottomLeftHandlePointerDown = (evt: PointerEvent) => {
        if (this.isCollapsed) {
            return;
        }
        this._initResizing(evt);
        this._resizingDirection = ResizingDirection.BottomLeft;
        this._mouseXLimit = evt.clientX + this.width - this._minFrameWidth;
        this._ownerCanvas.hostCanvas.addEventListener("pointerup", this._onBottomLeftHandlePointerUp);
        this._ownerCanvas.hostCanvas.addEventListener("pointermove", this._onBottomLeftHandlePointerMove);
    };

    private _onBottomLeftHandlePointerMove = (evt: PointerEvent) => {
        const bottomSlack = (this.element.offsetHeight - this._minFrameHeight) * this._ownerCanvas.zoom;
        const yLimit = (this._mouseStartPointY as number) - bottomSlack;
        const leftSlack = (this.element.offsetWidth - this._minFrameWidth) * this._ownerCanvas.zoom;
        const xLimit = (this._mouseStartPointX as number) + leftSlack;
        this._moveBottomLeftHandle(evt, xLimit, yLimit);
    };

    private _moveBottomLeftHandle = (evt: PointerEvent, xLimit: number, yLimit: number) => {
        if (!(this._isResizingBottom() && this._isResizingLeft()) || this._mouseStartPointX === null || this._mouseStartPointY === null) {
            return;
        }
        if (this._isResizingLeft() && this._isResizingBottom()) {
            evt.stopPropagation();
            if (evt.clientY > yLimit && evt.clientX < xLimit) {
                // able to move in X and Y
                const distanceMouseMovedX = (evt.clientX - this._mouseStartPointX) / this._ownerCanvas.zoom;
                this._expandLeft(distanceMouseMovedX);
                this._mouseStartPointX = evt.clientX;
                const distanceMouseMovedY = (evt.clientY - this._mouseStartPointY) / this._ownerCanvas.zoom;
                this._expandBottom(distanceMouseMovedY);
                this._mouseStartPointY = evt.clientY;
            } else if (evt.clientY < yLimit && evt.clientX < xLimit) {
                // able to move in X but not Y
                const distanceMouseMovedX = (evt.clientX - this._mouseStartPointX) / this._ownerCanvas.zoom;
                this._expandLeft(distanceMouseMovedX);
                this._mouseStartPointX = evt.clientX;
            } else if (evt.clientY > yLimit && evt.clientX > xLimit) {
                // able to move in Y but not X
                const distanceMouseMovedY = (evt.clientY - this._mouseStartPointY) / this._ownerCanvas.zoom;
                this._expandBottom(distanceMouseMovedY);
                this._mouseStartPointY = evt.clientY;
            }
        }
    };

    private _onBottomLeftHandlePointerUp = (evt: PointerEvent) => {
        evt.stopPropagation();
        if (this._resizingDirection === ResizingDirection.BottomLeft) {
            this.height = parseFloat(this.element.style.height.replace("px", ""));
            this.x = parseFloat(this.element.style.left!.replace("px", ""));
            this.width = parseFloat(this.element.style.width.replace("px", ""));
            this._ownerCanvas.hostCanvas.removeEventListener("pointerup", this._onBottomLeftHandlePointerUp);
            this._ownerCanvas.hostCanvas.removeEventListener("pointermove", this._onBottomLeftHandlePointerMove);
            this._cleanUpResizing(evt);
        }
    };

    //@ts-ignore
    private _onTopLeftHandlePointerDown = (evt: PointerEvent) => {
        if (this.isCollapsed) {
            return;
        }
        this._initResizing(evt);
        this._resizingDirection = ResizingDirection.TopLeft;
        this._mouseXLimit = evt.clientX + this.width - this._minFrameWidth;
        this._ownerCanvas.hostCanvas.addEventListener("pointerup", this._onTopLeftHandlePointerUp);
        this._ownerCanvas.hostCanvas.addEventListener("pointermove", this._onTopLeftHandlePointerMove);
    };

    private _onTopLeftHandlePointerMove = (evt: PointerEvent) => {
        const topSlack = (this.element.offsetHeight - this._minFrameHeight) * this._ownerCanvas.zoom;
        const yLimit = (this._mouseStartPointY as number) + topSlack;
        const leftSlack = (this.element.offsetWidth - this._minFrameWidth) * this._ownerCanvas.zoom;
        const xLimit = (this._mouseStartPointX as number) + leftSlack;
        this._moveTopLeftHandle(evt, xLimit, yLimit);
    };

    private _moveTopLeftHandle = (evt: PointerEvent, xLimit: number, yLimit: number) => {
        if (!(this._isResizingTop() && this._isResizingLeft()) || this._mouseStartPointX === null || this._mouseStartPointY === null) {
            return;
        }
        if (this._isResizingLeft() && this._isResizingTop()) {
            evt.stopPropagation();
            if (evt.clientY < yLimit && evt.clientX < xLimit) {
                // able to move in X and Y
                const distanceMouseMovedX = (evt.clientX - this._mouseStartPointX) / this._ownerCanvas.zoom;
                this._expandLeft(distanceMouseMovedX);
                this._mouseStartPointX = evt.clientX;
                const distanceMouseMovedY = (evt.clientY - this._mouseStartPointY) / this._ownerCanvas.zoom;
                this._expandTop(distanceMouseMovedY);
                this._mouseStartPointY = evt.clientY;
            } else if (evt.clientY > yLimit && evt.clientX < xLimit) {
                // able to move in X but not Y
                const distanceMouseMovedX = (evt.clientX - this._mouseStartPointX) / this._ownerCanvas.zoom;
                this._expandLeft(distanceMouseMovedX);
                this._mouseStartPointX = evt.clientX;
            } else if (evt.clientY < yLimit && evt.clientX > xLimit) {
                // able to move in Y but not X
                const distanceMouseMovedY = (evt.clientY - this._mouseStartPointY) / this._ownerCanvas.zoom;
                this._expandTop(distanceMouseMovedY);
                this._mouseStartPointY = evt.clientY;
            }
        }
    };

    private _onTopLeftHandlePointerUp = (evt: PointerEvent) => {
        evt.stopPropagation();
        if (this._resizingDirection === ResizingDirection.TopLeft) {
            this.y = parseFloat(this.element.style.top!.replace("px", ""));
            this.height = parseFloat(this.element.style.height.replace("px", ""));
            this.x = parseFloat(this.element.style.left!.replace("px", ""));
            this.width = parseFloat(this.element.style.width.replace("px", ""));
            this._ownerCanvas.hostCanvas.removeEventListener("pointerup", this._onTopLeftHandlePointerUp);
            this._ownerCanvas.hostCanvas.removeEventListener("pointermove", this._onTopLeftHandlePointerMove);
            this._cleanUpResizing(evt);
        }
    };

    private _expandLeft(widthModification: number) {
        const frameElementWidth = parseFloat(this.element.style.width.replace("px", ""));
        const frameElementLeft = parseFloat(this.element.style.left.replace("px", ""));
        this.element.style.width = `${frameElementWidth - widthModification}px`;
        this.element.style.left = `${frameElementLeft + widthModification}px`;
        this._updateMinHeightWithComments();
    }

    private _expandTop(heightModification: number) {
        const frameElementHeight = parseFloat(this.element.style.height.replace("px", ""));
        const frameElementTop = parseFloat(this.element.style.top.replace("px", ""));
        this.element.style.height = `${frameElementHeight - heightModification}px`;
        this.element.style.top = `${frameElementTop + heightModification}px`;
    }

    private _expandRight(widthModification: number, x: number) {
        const frameElementWidth = parseFloat(this.element.style.width.replace("px", ""));
        if (frameElementWidth + widthModification > 20) {
            this._mouseStartPointX = x;
            this.element.style.width = `${frameElementWidth + widthModification}px`;
        }
        this._updateMinHeightWithComments();
    }

    private _expandBottom(heightModification: number) {
        const frameElementHeight = parseFloat(this.element.style.height.replace("px", ""));
        this.element.style.height = `${frameElementHeight + heightModification}px`;
    }

    public dispose() {
        if (this._onSelectionChangedObserver) {
            this._ownerCanvas.stateManager.onSelectionChangedObservable.remove(this._onSelectionChangedObserver);
        }

        if (this._onGraphNodeRemovalObserver) {
            this._ownerCanvas.stateManager.onGraphNodeRemovalObservable.remove(this._onGraphNodeRemovalObserver);
        }

        if (this._onExposePortOnFrameObserver) {
            this._ownerCanvas.stateManager.onExposePortOnFrameObservable.remove(this._onExposePortOnFrameObserver);
        }

        this.element.parentElement?.removeChild(this.element);

        this._ownerCanvas.frames.splice(this._ownerCanvas.frames.indexOf(this), 1);

        this.onExpandStateChanged.clear();
    }

    private _serializePortData(exposedPorts: NodePort[]) {
        if (exposedPorts.length > 0) {
            for (let i = 0; i < exposedPorts.length; ++i) {
                if (exposedPorts[i]) {
                    exposedPorts[i].exposedPortPosition = i;
                }
            }
        }
    }

    public serialize(saveCollapsedState: boolean): IFrameData {
        this._serializePortData(this._exposedInPorts);
        this._serializePortData(this._exposedOutPorts);
        return {
            x: this._x,
            y: this._y,
            width: this._width,
            height: this._height,
            color: this._color.asArray(),
            name: this.name,
            isCollapsed: saveCollapsedState ? this.isCollapsed : true, //keeping closed for stand along exporting.
            blocks: this.nodes.map((n) => n.content.uniqueId),
            comments: this._comments,
        };
    }

    public export() {
        const state = this._ownerCanvas.stateManager;
        const json = state.exportData(state.data, this);
        StringTools.DownloadAsFile(state.hostDocument, json, this._name + ".json");
    }

    public adjustPorts() {
        for (const node of this.nodes) {
            for (const port of node.outputPorts) {
                // Output
                if (port.exposedOnFrame) {
                    if (port.exposedPortPosition !== -1) {
                        this._exposedOutPorts[port.exposedPortPosition] = port;
                    }
                }
            }

            for (const port of node.inputPorts) {
                // Imports
                if (port.exposedOnFrame) {
                    if (port.exposedPortPosition !== -1) {
                        this._exposedInPorts[port.exposedPortPosition] = port;
                    }
                }
            }
        }
    }

    public static Parse(serializationData: IFrameData, canvas: GraphCanvasComponent, map?: { [key: number]: number }) {
        const newFrame = new GraphFrame(null, canvas, true);
        const isCollapsed = !!serializationData.isCollapsed;

        newFrame.x = serializationData.x;
        newFrame.y = serializationData.y;
        newFrame.width = serializationData.width;
        newFrame.height = serializationData.height;
        newFrame.name = serializationData.name;
        newFrame.color = Color3.FromArray(serializationData.color);
        newFrame.comments = serializationData.comments;

        if (serializationData.blocks && map) {
            for (const blockId of serializationData.blocks) {
                const actualId = map[blockId];
                const node = canvas.nodes.filter((n) => n.content.uniqueId === actualId);

                if (node.length) {
                    newFrame.nodes.push(node[0]);
                    node[0].enclosingFrameId = newFrame.id;
                }
            }
        } else {
            newFrame.refresh();
        }

        newFrame.adjustPorts();

        newFrame.isCollapsed = isCollapsed;
        if (isCollapsed) {
            canvas._frameIsMoving = true;
            newFrame._moveFrame(-(newFrame.width - newFrame._collapsedWidth) / 2, 0);
            const diff = serializationData.x - newFrame.x;
            newFrame._moveFrame(diff, 0);
            newFrame.cleanAccumulation();

            for (const selectedNode of newFrame.nodes) {
                selectedNode.refresh();
            }
            canvas._frameIsMoving = false;
        }

        return newFrame;
    }
}
