import * as React from "react";
import type { GlobalState } from "./globalState";
import { NodeListComponent } from "./components/nodeList/nodeListComponent";
import { PropertyTabComponent } from "./components/propertyTab/propertyTabComponent";
import { Portal } from "./portal";
import { LogComponent, LogEntry } from "./components/log/logComponent";
import type { Nullable } from "core/types";
import { MessageDialog } from "shared-ui-components/components/MessageDialog";
import { SerializationTools } from "./serializationTools";
import { blockFactory } from "core/FlowGraph/Blocks/flowGraphBlockFactory";

import "./main.scss";
import { GraphCanvasComponent } from "shared-ui-components/nodeGraphSystem/graphCanvas";
import type { GraphNode } from "shared-ui-components/nodeGraphSystem/graphNode";
import { TypeLedger } from "shared-ui-components/nodeGraphSystem/typeLedger";
import type { IEditorData } from "shared-ui-components/nodeGraphSystem/interfaces/nodeLocationInfo";
import type { INodeData } from "shared-ui-components/nodeGraphSystem/interfaces/nodeData";
import type { FlowGraphBlock } from "core/FlowGraph/flowGraphBlock";
import { SplitContainer } from "shared-ui-components/split/splitContainer";
import { Splitter } from "shared-ui-components/split/splitter";
import { ControlledSize, SplitDirection } from "shared-ui-components/split/splitContext";
import { ScenePreviewComponent } from "./components/preview/scenePreviewComponent";
import { HistoryStack } from "shared-ui-components/historyStack";
import { FlowGraphEventType } from "core/FlowGraph/flowGraphEventType";
import type { FlowGraphEventBlock } from "core/FlowGraph/flowGraphEventBlock";

/**
 * Pre-populate string (and other primitive) config fields for blocks whose constructors
 * receive those fields via the config object. Without this, `_defaultValue` on the
 * DataConnection starts as `undefined` and the property panel can't show a text field.
 * Key = FlowGraphBlockNames string value (i.e. `getClassName()` output).
 */
interface IGraphEditorProps {
    globalState: GlobalState;
}

interface IGraphEditorState {
    message: string;
    isError: boolean;
}

/**
 * Main React component for the Flow Graph Editor
 */
export class GraphEditor extends React.Component<IGraphEditorProps, IGraphEditorState> {
    private _graphCanvasRef: React.RefObject<GraphCanvasComponent>;
    private _diagramContainerRef: React.RefObject<HTMLDivElement>;
    private _graphCanvas: GraphCanvasComponent;

    private _mouseLocationX = 0;
    private _mouseLocationY = 0;
    private _onWidgetKeyUpPointer: any;
    private _historyStack: HistoryStack;

    /** @internal */
    appendBlock(dataToAppend: FlowGraphBlock | INodeData, recursion = true) {
        return this._graphCanvas.createNodeFromObject(
            dataToAppend instanceof Object && "getClassName" in dataToAppend && typeof (dataToAppend as FlowGraphBlock).dataInputs !== "undefined"
                ? TypeLedger.NodeDataBuilder(dataToAppend as FlowGraphBlock, this._graphCanvas)
                : (dataToAppend as INodeData),
            (_block: FlowGraphBlock) => {
                // FlowGraph doesn't have an attachedBlocks list like NRGE;
                // blocks are reachable through event-block graph traversal.
            },
            recursion
        );
    }

    /** @internal */
    prepareHistoryStack() {
        const globalState = this.props.globalState;
        const flowGraph = this.props.globalState.flowGraph;

        const dataProvider = () => {
            SerializationTools.UpdateLocations(flowGraph, globalState);
            const serializationObject: any = {};
            flowGraph.serialize(serializationObject);
            return serializationObject;
        };

        const applyUpdate = (_data: any) => {
            globalState.stateManager.onSelectionChangedObservable.notifyObservers(null);
            // Re-parse the flow graph from serialized data
            // For now, notify a reset so the graph reloads
            globalState.onResetRequiredObservable.notifyObservers(false);
        };

        // Create the stack
        this._historyStack = new HistoryStack(dataProvider, applyUpdate);
        globalState.stateManager.historyStack = this._historyStack;

        // Connect to relevant events
        globalState.stateManager.onUpdateRequiredObservable.add(() => {
            void this._historyStack.storeAsync();
        });
        globalState.stateManager.onRebuildRequiredObservable.add(() => {
            void this._historyStack.storeAsync();
        });
        globalState.stateManager.onNodeMovedObservable.add(() => {
            void this._historyStack.storeAsync();
        });
        globalState.stateManager.onNewNodeCreatedObservable.add(() => {
            void this._historyStack.storeAsync();
        });
        globalState.onClearUndoStack.add(() => {
            this._historyStack.reset();
        });
    }

    /** @internal */
    override componentDidMount() {
        window.addEventListener("wheel", this.onWheel, { passive: false });
        const globalState = this.props.globalState;

        if (globalState.hostDocument) {
            this._graphCanvas = this._graphCanvasRef.current!;
            this.prepareHistoryStack();
        }

        this.props.globalState.onPopupClosedObservable.addOnce(() => {
            this.componentWillUnmount();
        });

        this.build();
        this.props.globalState.onClearUndoStack.notifyObservers();
    }

    /** @internal */
    override componentWillUnmount() {
        window.removeEventListener("wheel", this.onWheel);

        const globalState = this.props.globalState;

        if (globalState.hostDocument) {
            globalState.hostDocument.removeEventListener("keyup", this._onWidgetKeyUpPointer, false);
        }

        globalState.stateManager.onUpdateRequiredObservable.clear();
        globalState.stateManager.onRebuildRequiredObservable.clear();
        globalState.stateManager.onNodeMovedObservable.clear();
        globalState.stateManager.onNewNodeCreatedObservable.clear();

        globalState.onClearUndoStack.clear();

        if (this._historyStack) {
            this._historyStack.dispose();
            this._historyStack = null as any;
        }
    }

    /** @internal */
    constructor(props: IGraphEditorProps) {
        super(props);

        this.state = {
            message: "",
            isError: true,
        };

        this._graphCanvasRef = React.createRef();
        this._diagramContainerRef = React.createRef();

        this.props.globalState.stateManager.onNewBlockRequiredObservable.add(async (eventData) => {
            let targetX = eventData.targetX;
            let targetY = eventData.targetY;

            if (eventData.needRepositioning) {
                const container = this._diagramContainerRef.current!;
                targetX = targetX - container.offsetLeft;
                targetY = targetY - container.offsetTop;
            }

            const selectedLink = this._graphCanvas.selectedLink;
            const selectedNode = this._graphCanvas.selectedNodes.length ? this._graphCanvas.selectedNodes[0] : null;
            const newNode = await this._emitNewBlockAsync(eventData.type, targetX, targetY);

            if (newNode && eventData.smartAdd) {
                if (selectedLink) {
                    this._graphCanvas.smartAddOverLink(newNode, selectedLink);
                } else if (selectedNode) {
                    this._graphCanvas.smartAddOverNode(newNode, selectedNode);
                }
            }
        });

        this.props.globalState.stateManager.onRebuildRequiredObservable.add(() => {
            this.props.globalState.onBuiltObservable.notifyObservers();
        });

        this.props.globalState.onResetRequiredObservable.add((isDefault) => {
            if (isDefault) {
                this.build(true);
            } else {
                this.build();
            }
        });

        this.props.globalState.onImportFrameObservable.add((source: any) => {
            const frameData = source.editorData.frames[0];

            // Create graph nodes for blocks from the imported frame
            const blocks: FlowGraphBlock[] = [];
            this.props.globalState.flowGraph.visitAllBlocks((block) => blocks.push(block));
            const frameBlocks = blocks.slice(-frameData.blocks.length);
            for (const block of frameBlocks) {
                this.appendBlock(block);
            }
            this._graphCanvas.addFrame(frameData);
            this.reOrganize(null, true);
        });

        this.props.globalState.onZoomToFitRequiredObservable.add(() => {
            this.zoomToFit();
        });

        this.props.globalState.onReOrganizedRequiredObservable.add(() => {
            this.reOrganize();
        });

        this.props.globalState.onGetNodeFromBlock = (block) => {
            return this._graphCanvas.findNodeFromData(block);
        };

        this.props.globalState.hostDocument.addEventListener("keydown", (evt) => {
            if (this._historyStack && this._historyStack.processKeyEvent(evt)) {
                return;
            }

            void this._graphCanvas.handleKeyDownAsync(
                evt,
                (_nodeData) => {
                    // Block removal: FlowGraph blocks are removed by disconnecting them.
                    // The graph traversal will no longer visit disconnected blocks.
                },
                this._mouseLocationX,
                this._mouseLocationY,
                async (_nodeData) => {
                    // Clone is not directly supported for all FlowGraph blocks
                    return null;
                },
                this.props.globalState.hostDocument.querySelector(".diagram-container") as HTMLDivElement
            );
        });

        this.props.globalState.stateManager.onErrorMessageDialogRequiredObservable.add((message: string) => {
            this.setState({ message: message, isError: true });
        });
    }

    /** @internal */
    zoomToFit() {
        this._graphCanvas.zoomToFit();
    }

    /** @internal */
    build(ignoreEditorData = false) {
        let editorData = ignoreEditorData ? null : (this.props.globalState.flowGraph as any)._editorData;
        this._graphCanvas._isLoading = true;

        if (editorData instanceof Array) {
            editorData = {
                locations: editorData,
            };
        }

        // Reset the diagram
        this._graphCanvas.reset();

        // Load graph of nodes from the flow graph
        if (this.props.globalState.flowGraph) {
            this.loadGraph();
        }

        this.reOrganize(editorData);
    }

    /** @internal */
    loadGraph() {
        const flowGraph = this.props.globalState.flowGraph;
        const allBlocks: FlowGraphBlock[] = [];

        flowGraph.visitAllBlocks((block) => {
            allBlocks.push(block);
        });

        for (const block of allBlocks) {
            this.appendBlock(block, true);
        }

        // Links
        for (const block of allBlocks) {
            const nodeData = this._graphCanvas.findNodeFromData(block);
            if (!nodeData) {
                continue;
            }
            for (const input of nodeData.content.inputs) {
                if (input.isConnected) {
                    this._graphCanvas.connectPorts(input.connectedPort!, input);
                }
            }
        }
    }

    /** @internal */
    showWaitScreen() {
        this.props.globalState.hostDocument.querySelector(".wait-screen")?.classList.remove("hidden");
    }

    /** @internal */
    hideWaitScreen() {
        this.props.globalState.hostDocument.querySelector(".wait-screen")?.classList.add("hidden");
    }

    /** @internal */
    reOrganize(editorData: Nullable<IEditorData> = null, isImportingAFrame = false) {
        this.showWaitScreen();
        this._graphCanvas._isLoading = true;

        this._graphCanvas.reOrganize(editorData, isImportingAFrame);
        this.hideWaitScreen();
    }

    /** @internal */
    onWheel = (evt: WheelEvent) => {
        if (this.props.globalState.pointerOverCanvas) {
            return evt.preventDefault();
        }

        if (evt.ctrlKey) {
            return evt.preventDefault();
        }

        if (Math.abs(evt.deltaX) < Math.abs(evt.deltaY)) {
            return;
        }

        const targetElem = evt.currentTarget as HTMLElement;
        const scrollLeftMax = targetElem.scrollWidth - targetElem.offsetWidth;
        if (targetElem.scrollLeft + evt.deltaX < 0 || targetElem.scrollLeft + evt.deltaX > scrollLeftMax) {
            return evt.preventDefault();
        }
    };

    /** @internal */
    async _emitNewBlockAsync(blockType: string, targetX: number, targetY: number): Promise<GraphNode | undefined> {
        let newNode: GraphNode;

        blockType = blockType.replace(/ /g, "_");

        // Dropped something that is not a node
        if (blockType === "") {
            return undefined;
        }

        try {
            // Use the FlowGraph block factory to create the block asynchronously
            const factory = blockFactory(blockType);
            const blockClass = await factory();
            const block = new (blockClass as any)({ name: blockType }) as FlowGraphBlock;

            // If this is an event block, register it with the flow graph.
            // We check for the _executeEvent method which is unique to FlowGraphEventBlock,
            // rather than checking .type, because other blocks (e.g. GetAssetBlock) also
            // have a .type field with a different meaning (FlowGraphDataConnection).
            const maybeEvent = block as unknown as FlowGraphEventBlock;
            if (typeof maybeEvent._executeEvent === "function" && maybeEvent.type !== FlowGraphEventType.NoTrigger) {
                this.props.globalState.flowGraph.addEventBlock(maybeEvent);
            }

            newNode = this.appendBlock(block);
            newNode.addClassToVisual(block.getClassName());
        } catch (err) {
            this.props.globalState.onLogRequiredObservable.notifyObservers(new LogEntry(`Error creating block "${blockType}": ${err}`, true));
            return undefined;
        }

        // Size exceptions
        const offsetX = GraphCanvasComponent.NodeWidth;
        const offsetY = 20;

        // Drop at position
        this._graphCanvas.drop(newNode, targetX, targetY, offsetX, offsetY);

        this.forceUpdate();

        return newNode;
    }

    /** @internal */
    dropNewBlock(event: React.DragEvent<HTMLDivElement>) {
        const data = event.dataTransfer.getData("babylonjs-flow-graph-node");

        const container = this._diagramContainerRef.current!;
        void this._emitNewBlockAsync(data, event.clientX - container.offsetLeft, event.clientY - container.offsetTop);
    }

    /** @internal */
    override render() {
        return (
            <Portal globalState={this.props.globalState}>
                <SplitContainer
                    id="flow-graph-editor-graph-root"
                    direction={SplitDirection.Horizontal}
                    onPointerMove={(evt) => {
                        this._mouseLocationX = evt.pageX;
                        this._mouseLocationY = evt.pageY;
                    }}
                    onPointerDown={(evt) => {
                        if ((evt.target as HTMLElement).nodeName === "INPUT") {
                            return;
                        }
                        this.props.globalState.lockObject.lock = false;
                    }}
                >
                    {/* Node creation menu */}
                    <NodeListComponent globalState={this.props.globalState} />

                    <Splitter size={8} minSize={180} initialSize={200} maxSize={350} controlledSide={ControlledSize.First} />

                    {/* The node graph diagram */}
                    <SplitContainer
                        direction={SplitDirection.Vertical}
                        className="diagram-container"
                        containerRef={this._diagramContainerRef}
                        onDrop={(event) => {
                            this.dropNewBlock(event);
                        }}
                        onDragOver={(event) => {
                            event.preventDefault();
                        }}
                    >
                        <GraphCanvasComponent
                            ref={this._graphCanvasRef}
                            stateManager={this.props.globalState.stateManager}
                            onEmitNewNode={(nodeData) => {
                                return this.appendBlock(nodeData.data as FlowGraphBlock);
                            }}
                        />
                        <Splitter size={8} minSize={40} initialSize={120} maxSize={500} controlledSide={ControlledSize.Second} />
                        <LogComponent globalState={this.props.globalState} />
                    </SplitContainer>

                    <Splitter size={8} minSize={250} initialSize={300} maxSize={500} controlledSide={ControlledSize.Second} />

                    {/* Property tab + Scene preview */}
                    <SplitContainer direction={SplitDirection.Vertical} className="fge-right-panel">
                        <PropertyTabComponent lockObject={this.props.globalState.lockObject} globalState={this.props.globalState} />
                        <Splitter size={8} minSize={150} initialSize={300} maxSize={500} controlledSide={ControlledSize.Second} />
                        <ScenePreviewComponent globalState={this.props.globalState} />
                    </SplitContainer>
                </SplitContainer>
                <MessageDialog message={this.state.message} isError={this.state.isError} onClose={() => this.setState({ message: "" })} />
                <div className="blocker">Flow Graph Editor needs a horizontal resolution of at least 900px</div>
                <div className="wait-screen hidden">Processing...please wait</div>
            </Portal>
        );
    }
}
