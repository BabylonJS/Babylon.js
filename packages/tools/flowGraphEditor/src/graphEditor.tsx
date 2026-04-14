import * as React from "react";
import { type GlobalState } from "./globalState";
import { NodeListComponent } from "./components/nodeList/nodeListComponent";
import { PropertyTabComponent } from "./components/propertyTab/propertyTabComponent";
import { Portal } from "./portal";
import { LogComponent, LogEntry } from "./components/log/logComponent";
import { type Nullable } from "core/types";
import { MessageDialog } from "shared-ui-components/components/MessageDialog";
import { SerializationTools } from "./serializationTools";
import { blockFactory } from "core/FlowGraph/Blocks/flowGraphBlockFactory";

import "./main.scss";
import { GraphCanvasComponent } from "shared-ui-components/nodeGraphSystem/graphCanvas";
import { type GraphNode } from "shared-ui-components/nodeGraphSystem/graphNode";
import { GraphFrame } from "shared-ui-components/nodeGraphSystem/graphFrame";
import { TypeLedger } from "shared-ui-components/nodeGraphSystem/typeLedger";
import { type IEditorData } from "shared-ui-components/nodeGraphSystem/interfaces/nodeLocationInfo";
import { type INodeData } from "shared-ui-components/nodeGraphSystem/interfaces/nodeData";
import { type FlowGraphBlock } from "core/FlowGraph/flowGraphBlock";
import { FlowGraphExecutionBlock } from "core/FlowGraph/flowGraphExecutionBlock";
import { ParseFlowGraph } from "core/FlowGraph/flowGraphParser";
import { FlowGraphCoordinator } from "core/FlowGraph/flowGraphCoordinator";
import { SplitContainer } from "shared-ui-components/split/splitContainer";
import { Splitter } from "shared-ui-components/split/splitter";
import { ControlledSize, SplitDirection } from "shared-ui-components/split/splitContext";
import { ScenePreviewComponent } from "./components/preview/scenePreviewComponent";
import { GraphControlsComponent } from "./components/graphControls/graphControlsComponent";
import { HistoryStack } from "shared-ui-components/historyStack";
import { FlowGraphEventBlock } from "core/FlowGraph/flowGraphEventBlock";
import { type IFlowGraphValidationResult, FlowGraphValidationSeverity } from "core/FlowGraph/flowGraphValidator";
import { AnalyzeSmartGroup, ApplySmartGroupExposure } from "./graphSystem/smartGroup";
import { HelpDialogComponent } from "./components/help/helpDialogComponent";
import { type HelpTopicId } from "./components/help/helpContent";
import { AllCompositeTemplates, type ICompositeTemplate } from "./compositeTemplates";

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
    helpTopicId: HelpTopicId | undefined | null;
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
    private _blockClassRegistry = new Map<string, typeof FlowGraphBlock>();
    /** Cache for O(1) block→GraphNode lookups (rebuilt on graph load) */
    private _blockToNodeMap = new Map<FlowGraphBlock, GraphNode>();

    private _onDocumentKeyDown = (evt: KeyboardEvent) => {
        if (this._historyStack && this._historyStack.processKeyEvent(evt)) {
            return;
        }

        // F9 — Toggle breakpoint on the selected node
        if (evt.key === "F9") {
            evt.preventDefault();
            this._toggleBreakpointOnSelection();
            return;
        }

        // Ctrl+G — Create smart group from selected nodes
        if ((evt.ctrlKey || evt.metaKey) && (evt.key === "g" || evt.key === "G")) {
            evt.preventDefault();
            this._createSmartGroup();
            return;
        }

        // Ctrl+M — Add a sticky note at the current mouse position
        if ((evt.ctrlKey || evt.metaKey) && (evt.key === "m" || evt.key === "M")) {
            evt.preventDefault();
            const zoomLevel = this._graphCanvas.zoom;
            const container = this.props.globalState.hostDocument.querySelector(".diagram-container") as HTMLDivElement;
            const x = (this._mouseLocationX - (container?.offsetLeft ?? 0) - this._graphCanvas.x) / zoomLevel;
            const y = (this._mouseLocationY - (container?.offsetTop ?? 0) - this._graphCanvas.y) / zoomLevel;
            this._graphCanvas.addStickyNote(x, y);
            return;
        }

        // Ctrl+F — Find in graph
        if ((evt.ctrlKey || evt.metaKey) && (evt.key === "f" || evt.key === "F")) {
            evt.preventDefault();
            this._graphCanvas.showSearch();
            return;
        }

        // Ctrl+A — Select all nodes and frames
        if ((evt.ctrlKey || evt.metaKey) && (evt.key === "a" || evt.key === "A")) {
            evt.preventDefault();
            // Clear current selection first
            this.props.globalState.stateManager.onSelectionChangedObservable.notifyObservers(null);
            // Select all nodes
            for (const node of this._graphCanvas.nodes) {
                this.props.globalState.stateManager.onSelectionChangedObservable.notifyObservers({ selection: node, forceKeepSelection: true });
            }
            // Select all frames
            for (const frame of this._graphCanvas.frames) {
                this.props.globalState.stateManager.onSelectionChangedObservable.notifyObservers({ selection: frame, forceKeepSelection: true });
            }
            return;
        }

        void this._graphCanvas.handleKeyDownAsync(
            evt,
            (nodeData) => {
                const block = nodeData.data as FlowGraphBlock;
                if (block) {
                    this.props.globalState.flowGraph.removeBlock(block);
                }
            },
            this._mouseLocationX,
            this._mouseLocationY,
            async (nodeData) => {
                return await this._cloneBlockAsync(nodeData);
            },
            this.props.globalState.hostDocument.querySelector(".diagram-container") as HTMLDivElement
        );
    };

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

        const dataProvider = () => {
            try {
                const fg = globalState.flowGraph;
                SerializationTools.UpdateLocations(fg, globalState);
                const serializationObject: any = {};
                fg.serialize(serializationObject);
                // Include editor layout so positions are restored on undo/redo
                serializationObject.editorData = (fg as any)._editorData;
                // Cache block class constructors for synchronous parsing in applyUpdate
                for (const block of fg.getAllBlocks()) {
                    this._blockClassRegistry.set(block.getClassName(), block.constructor as typeof FlowGraphBlock);
                }
                return serializationObject;
            } catch (e) {
                // eslint-disable-next-line no-console
                console.warn("Flow Graph Editor: failed to serialize graph for undo/redo snapshot", e);
                return null;
            }
        };

        const applyUpdate = (data: any) => {
            globalState.stateManager.onSelectionChangedObservable.notifyObservers(null);
            // Resolve block classes synchronously from the session-wide registry
            const resolvedClasses = (data.allBlocks || []).map((b: any) => this._blockClassRegistry.get(b.className)!);
            // Parse the snapshot into a new FlowGraph synchronously
            const coordinator = new FlowGraphCoordinator({ scene: globalState.scene });
            const parsedGraph = ParseFlowGraph(data, { coordinator }, resolvedClasses);
            SerializationTools.PreserveUnresolvedNames(parsedGraph, data);
            if (data.editorData) {
                (parsedGraph as any)._editorData = data.editorData;
            }
            globalState.flowGraph = parsedGraph;
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

        this.props.globalState.onHelpRequested.add((topicId) => {
            this.setState({ helpTopicId: topicId ?? undefined });
        });
    }

    /** @internal */
    override componentWillUnmount() {
        window.removeEventListener("wheel", this.onWheel);

        const globalState = this.props.globalState;

        if (globalState.hostDocument) {
            globalState.hostDocument.removeEventListener("keydown", this._onDocumentKeyDown, false);
            globalState.hostDocument.addEventListener("keydown", this._onDocumentKeyDown, false);
            globalState.hostDocument.removeEventListener("keyup", this._onWidgetKeyUpPointer, false);
        }

        globalState.stateManager.onUpdateRequiredObservable.clear();
        globalState.stateManager.onRebuildRequiredObservable.clear();
        globalState.stateManager.onNodeMovedObservable.clear();
        globalState.stateManager.onNewNodeCreatedObservable.clear();

        globalState.onClearUndoStack.clear();
        globalState.cancelPendingValidation();

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
            helpTopicId: null,
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

            // Check if this is a composite template
            const emitTemplate = AllCompositeTemplates[eventData.type];
            if (emitTemplate) {
                await this._emitTemplateAsync(emitTemplate, targetX, targetY);
                return;
            }

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
            let node = this._blockToNodeMap.get(block);
            if (!node) {
                node = this._graphCanvas.findNodeFromData(block);
                if (node) {
                    this._blockToNodeMap.set(block, node);
                }
            }
            return node;
        };

        // Viewport-based visibility check for debug highlighting.
        // Uses cached node x/y and the canvas transform — no DOM queries.
        this.props.globalState.isNodeVisible = (node: GraphNode) => {
            const gc = this._graphCanvas;
            const zoom = gc.zoom;
            // Canvas-space viewport bounds
            const viewLeft = -gc.x / zoom;
            const viewTop = -gc.y / zoom;
            const container = this._diagramContainerRef.current;
            if (!container) {
                return true; // fallback: treat as visible
            }
            const viewRight = viewLeft + container.clientWidth / zoom;
            const viewBottom = viewTop + container.clientHeight / zoom;
            // Node bounds (approximate — use cached width/height or generous defaults)
            const nodeRight = node.x + 320; // typical max node width
            const nodeBottom = node.y + 200; // typical max node height
            return nodeRight >= viewLeft && node.x <= viewRight && nodeBottom >= viewTop && node.y <= viewBottom;
        };

        this.props.globalState.hostDocument.removeEventListener("keydown", this._onDocumentKeyDown, false);
        this.props.globalState.hostDocument.addEventListener("keydown", this._onDocumentKeyDown, false);

        this.props.globalState.stateManager.onErrorMessageDialogRequiredObservable.add((message: string) => {
            this.setState({ message: message, isError: true });
        });

        // ── Validation wiring ──────────────────────────────────────────
        // Provide the editor's block list so "unreachable" detection works.
        this.props.globalState.registerEditorBlocksProvider(() => {
            const blocks: FlowGraphBlock[] = [];
            for (const node of this._graphCanvas.nodes) {
                if (node.content?.data) {
                    blocks.push(node.content.data as FlowGraphBlock);
                }
            }
            return blocks;
        });

        // When validation results change, update badges on all graph nodes.
        this.props.globalState.onValidationResultChanged.add((result) => {
            this._applyValidationBadges(result);
        });

        // Trigger live validation whenever the graph structure changes.
        const scheduleLiveValidation = () => this.props.globalState.scheduleLiveValidation();
        this.props.globalState.stateManager.onUpdateRequiredObservable.add(scheduleLiveValidation);
        this.props.globalState.stateManager.onNewNodeCreatedObservable.add(scheduleLiveValidation);
        this.props.globalState.stateManager.onRebuildRequiredObservable.add(scheduleLiveValidation);
        this.props.globalState.stateManager.onGraphNodeRemovalObservable.add(scheduleLiveValidation);

        // ── Breakpoint wiring ─────────────────────────────────────────
        // When breakpoints change, update badges on all graph nodes.
        this.props.globalState.onBreakpointsChanged.add(() => {
            this._applyBreakpointBadges();
        });

        // When a breakpoint is hit, highlight the paused node with the paused state.
        this.props.globalState.onBreakpointHit.add((activation) => {
            this._applyBreakpointBadges(activation.block.uniqueId);
        });
    }

    /** @internal */
    zoomToFit() {
        this._graphCanvas.zoomToFit();
    }

    /**
     * Applies validation badges (error/warning icons) to all graph nodes based on
     * the given validation result. Clears all badges first, then sets them.
     * @param result the validation result to apply badges for
     */
    private _applyValidationBadges(result: Nullable<IFlowGraphValidationResult>) {
        if (!this._graphCanvas) {
            return;
        }
        // Clear all badges first
        for (const node of this._graphCanvas.nodes) {
            node.setValidationState(null);
        }
        if (!result) {
            return;
        }
        // Apply badges
        for (const [blockId, issues] of result.issuesByBlock) {
            // Find the corresponding GraphNode
            const node = this._graphCanvas.nodes.find((n) => {
                const block = n.content?.data as FlowGraphBlock | undefined;
                return block && block.uniqueId === blockId;
            });
            if (!node) {
                continue;
            }
            const hasError = issues.some((i) => i.severity === FlowGraphValidationSeverity.Error);
            const tooltip = issues.map((i) => (i.severity === FlowGraphValidationSeverity.Error ? "[Error] " : "[Warn] ") + i.message).join("\n");
            node.setValidationState(hasError ? "error" : "warning", tooltip);
        }
    }

    /**
     * Toggle a breakpoint on the currently selected graph node.
     * Only execution blocks (blocks with signal inputs) can have breakpoints.
     */
    private _toggleBreakpointOnSelection(): void {
        if (!this._graphCanvas) {
            return;
        }
        for (const node of this._graphCanvas.selectedNodes) {
            const block = node.content?.data as FlowGraphBlock | undefined;
            if (block && block instanceof FlowGraphExecutionBlock) {
                this.props.globalState.toggleBreakpoint(block.uniqueId);
            }
        }
    }

    /**
     * Applies breakpoint badges (red dots) to all graph nodes.
     * @param pausedBlockId - if provided, the block that is currently paused on a breakpoint
     */
    private _applyBreakpointBadges(pausedBlockId?: string): void {
        if (!this._graphCanvas) {
            return;
        }
        for (const node of this._graphCanvas.nodes) {
            const block = node.content?.data as FlowGraphBlock | undefined;
            if (!block) {
                continue;
            }
            const hasBreakpoint = this.props.globalState.hasBreakpoint(block.uniqueId);
            const isPaused = pausedBlockId === block.uniqueId;
            node.setBreakpointState(hasBreakpoint, isPaused);
        }
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
        this._blockToNodeMap.clear();

        // Load graph of nodes from the flow graph
        if (this.props.globalState.flowGraph) {
            this.loadGraph();
        }

        if (editorData) {
            this.reOrganize(editorData);
        } else {
            // No saved positions — defer auto-layout until after the browser
            // has painted so that node DOM elements have real dimensions.
            // setTimeout(0) defers to the next macro-task, after the browser
            // has completed layout and paint. rAF alone is not sufficient
            // because it fires *before* layout in some browsers.
            setTimeout(() => {
                this.reOrganize(null);
            }, 0);
        }

        // Notify that the graph has been (re-)built so components like
        // GraphControlsComponent can re-subscribe to the current flow graph.
        this.props.globalState.onBuiltObservable.notifyObservers();

        // Run validation after build completes
        this.props.globalState.scheduleLiveValidation();
    }

    /** @internal */
    loadGraph() {
        const flowGraph = this.props.globalState.flowGraph;
        const allBlocks = flowGraph.getAllBlocks();

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

        if (!editorData && this._graphCanvas.nodes.length > 100) {
            // For large graphs (e.g. KHR_interactivity flocking demo), dagre
            // layout is too expensive and freezes the browser.  Use a simple
            // grid layout instead.
            this._gridLayout();
        } else {
            this._graphCanvas.reOrganize(editorData, isImportingAFrame);
        }

        // Ensure loading flag is cleared and links are rendered.
        // graphCanvas.reOrganize does this internally, but _gridLayout
        // bypasses it, so we always do it here to be safe.
        this._graphCanvas._isLoading = false;
        for (const node of this._graphCanvas.nodes) {
            node._refreshLinks();
        }
        this.hideWaitScreen();
    }

    /**
     * Fast grid layout for large graphs — avoids the O(V*E) dagre cost.
     * Places nodes in a left-to-right grid with fixed column widths.
     */
    private _gridLayout() {
        const nodes = this._graphCanvas.nodes;
        const cols = Math.ceil(Math.sqrt(nodes.length));
        const colWidth = 340;
        const rowHeight = 200;
        for (let i = 0; i < nodes.length; i++) {
            nodes[i].x = (i % cols) * colWidth;
            nodes[i].y = Math.floor(i / cols) * rowHeight;
            nodes[i].cleanAccumulation();
        }
        this._graphCanvas.x = 0;
        this._graphCanvas.y = 0;
        this._graphCanvas.zoom = 1;
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

    /**
     * Creates a smart group (frame) from the currently selected nodes.
     * Analyzes the blocks to determine which ports to expose on the frame boundary.
     * If the group has a single execution block + data blocks, ports are auto-configured.
     * Otherwise, all signal boundary ports are exposed and the user can refine later.
     */
    private _createSmartGroup(): void {
        const selectedNodes = this._graphCanvas.selectedNodes;
        if (selectedNodes.length < 2) {
            this.props.globalState.onLogRequiredObservable.notifyObservers(new LogEntry("Select at least 2 blocks to create a smart group", false));
            return;
        }

        // Analyze the selection
        const analysis = AnalyzeSmartGroup(selectedNodes);

        // Compute bounding box of selected nodes
        let minX = Infinity,
            minY = Infinity,
            maxX = -Infinity,
            maxY = -Infinity;
        for (const node of selectedNodes) {
            if (node.x < minX) {
                minX = node.x;
            }
            if (node.y < minY) {
                minY = node.y;
            }
            const nodeRight = node.x + GraphCanvasComponent.NodeWidth;
            const nodeBottom = node.y + (node.height || 150);
            if (nodeRight > maxX) {
                maxX = nodeRight;
            }
            if (nodeBottom > maxY) {
                maxY = nodeBottom;
            }
        }

        // Add padding around the bounding box
        const padding = 30;
        minX -= padding;
        minY -= padding;
        maxX += padding;
        maxY += padding;

        // Create frame programmatically
        const newFrame = new GraphFrame(null, this._graphCanvas, true);
        this._graphCanvas.frames.push(newFrame);

        newFrame.x = minX;
        newFrame.y = minY;
        newFrame.width = maxX - minX;
        newFrame.height = maxY - minY;
        newFrame.name = analysis.isAutoConfigurable ? "Smart Group" : "Block Group";

        // Add nodes to the frame
        for (const node of selectedNodes) {
            newFrame.nodes.push(node);
            node.enclosingFrameId = newFrame.id;
        }

        // Apply smart port exposure
        ApplySmartGroupExposure(newFrame, analysis);

        // Collapse the frame to show it as a compact unit with exposed ports
        newFrame.isCollapsed = true;

        this.props.globalState.stateManager.onSelectionChangedObservable.notifyObservers({ selection: newFrame });

        const modeLabel = analysis.isAutoConfigurable ? "auto-configured" : "manual";
        this.props.globalState.onLogRequiredObservable.notifyObservers(
            new LogEntry(`Smart group created (${modeLabel}): ${analysis.exposedInputPorts.length} inputs, ${analysis.exposedOutputPorts.length} outputs exposed`, false)
        );
    }

    /**
     * Clone a flow graph block from the given node data.
     * Serializes the block's config and default values, creates a new block of the same type
     * with a fresh uniqueId, registers event blocks with the flow graph, and returns a new GraphNode.
     * @param nodeData the node data containing the block to clone
     * @returns a promise that resolves to the new GraphNode, or null if cloning failed
     */
    private async _cloneBlockAsync(nodeData: INodeData): Promise<Nullable<GraphNode>> {
        const sourceBlock = nodeData.data as FlowGraphBlock;
        if (!sourceBlock) {
            return null;
        }

        try {
            const className = sourceBlock.getClassName();

            // Serialize the source block to capture config and default values
            const serialized: any = {};
            sourceBlock.serialize(serialized);

            // Use the block factory to get the class constructor
            const factory = blockFactory(className);
            const blockClass = await factory();

            // Parse config (just copy it — values are already serialized)
            const config = serialized.config ?? {};
            config.name = className;

            // Create the new block with the same config
            const newBlock = new (blockClass as any)(config) as FlowGraphBlock;
            // newBlock gets a fresh uniqueId from RandomGUID() in the constructor — no need to set it

            // Restore data input default values (but not connections)
            for (const serializedInput of serialized.dataInputs) {
                const input = newBlock.getDataInput(serializedInput.name);
                if (input) {
                    // Clear connectedPointIds so no stale connections are restored
                    const cleanInput = { ...serializedInput, connectedPointIds: [] };
                    input.deserialize(cleanInput);
                }
            }

            // Restore data output default values (but not connections)
            for (const serializedOutput of serialized.dataOutputs) {
                const output = newBlock.getDataOutput(serializedOutput.name);
                if (output) {
                    const cleanOutput = { ...serializedOutput, connectedPointIds: [] };
                    output.deserialize(cleanOutput);
                }
            }

            // Restore metadata (comments, etc.) except connection data
            if (sourceBlock.metadata) {
                newBlock.metadata = JSON.parse(JSON.stringify(sourceBlock.metadata));
            }

            // Also handle signal connection deserialization for execution blocks — clear connectedPointIds
            if (newBlock instanceof FlowGraphExecutionBlock && serialized.signalInputs) {
                for (const serializedSigIn of serialized.signalInputs) {
                    const sigIn = newBlock.getSignalInput(serializedSigIn.name);
                    if (sigIn) {
                        sigIn.deserialize({ ...serializedSigIn, connectedPointIds: [] });
                    }
                }
                for (const serializedSigOut of serialized.signalOutputs) {
                    const sigOut = newBlock.getSignalOutput(serializedSigOut.name);
                    if (sigOut) {
                        sigOut.deserialize({ ...serializedSigOut, connectedPointIds: [] });
                    }
                }
            }

            // Register event blocks with the flow graph
            if (newBlock instanceof FlowGraphEventBlock) {
                this.props.globalState.flowGraph.addEventBlock(newBlock);
            } else {
                this.props.globalState.flowGraph.addBlock(newBlock);
            }

            // Create the visual graph node
            const newNode = this.appendBlock(newBlock);
            newNode.addClassToVisual(newBlock.getClassName());
            return newNode;
        } catch (err) {
            this.props.globalState.onLogRequiredObservable.notifyObservers(new LogEntry(`Error cloning block: ${err}`, true));
            return null;
        }
    }

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
            if (block instanceof FlowGraphEventBlock) {
                this.props.globalState.flowGraph.addEventBlock(block);
            } else {
                this.props.globalState.flowGraph.addBlock(block);
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

        this.setState({});

        return newNode;
    }

    /** @internal */
    dropNewBlock(event: React.DragEvent<HTMLDivElement>) {
        const data = event.dataTransfer.getData("babylonjs-flow-graph-node");

        const container = this._diagramContainerRef.current!;
        const dropX = event.clientX - container.offsetLeft;
        const dropY = event.clientY - container.offsetTop;

        // Check if this is a composite template drop
        const dropTemplate = AllCompositeTemplates[data];
        if (dropTemplate) {
            void this._emitTemplateAsync(dropTemplate, dropX, dropY);
            return;
        }

        void this._emitNewBlockAsync(data, dropX, dropY);
    }

    /**
     * Instantiate a composite template: create all blocks, position them, and wire connections.
     * @param template - the template definition
     * @param dropX - X position of the drop
     * @param dropY - Y position of the drop
     */
    private async _emitTemplateAsync(template: ICompositeTemplate, dropX: number, dropY: number): Promise<void> {
        const createdNodes: GraphNode[] = [];

        // Pre-resolve all block classes in parallel to avoid await-in-loop
        const blockClasses: (typeof FlowGraphBlock)[] = [];
        try {
            const factories = template.blocks.map((blockDef) => blockFactory(blockDef.className));
            const resolved = await Promise.all(factories.map(async (f) => await f()));
            blockClasses.push(...resolved);
        } catch (err) {
            this.props.globalState.onLogRequiredObservable.notifyObservers(new LogEntry(`Error resolving template block classes: ${err}`, true));
            return;
        }

        // Create all blocks
        for (let i = 0; i < template.blocks.length; i++) {
            const blockDef = template.blocks[i];
            try {
                const blockClass = blockClasses[i];
                const config: any = { name: blockDef.className, ...blockDef.config };
                const block = new (blockClass as any)(config) as FlowGraphBlock;

                if (block instanceof FlowGraphEventBlock) {
                    this.props.globalState.flowGraph.addEventBlock(block);
                } else {
                    this.props.globalState.flowGraph.addBlock(block);
                }

                const newNode = this.appendBlock(block);
                newNode.addClassToVisual(block.getClassName());

                // Position the node at the drop location + offset
                const zoomLevel = this._graphCanvas.zoom;
                const nodeX = (dropX + blockDef.offsetX - this._graphCanvas.x) / zoomLevel;
                const nodeY = (dropY + blockDef.offsetY - this._graphCanvas.y) / zoomLevel;
                newNode.x = nodeX;
                newNode.y = nodeY;
                newNode.cleanAccumulation();

                createdNodes.push(newNode);
            } catch (err) {
                this.props.globalState.onLogRequiredObservable.notifyObservers(new LogEntry(`Error creating template block "${blockDef.className}": ${err}`, true));
                return;
            }
        }

        // Wire connections
        for (const conn of template.connections) {
            const fromNode = createdNodes[conn.fromBlock];
            const toNode = createdNodes[conn.toBlock];
            if (!fromNode || !toNode) {
                continue;
            }

            // Find the matching ports by name (signal and data ports live in
            // separate arrays on the underlying block, but the GraphNode merges
            // them into unified outputPorts/inputPorts lists, so a single search works).
            const fromPort = fromNode.outputPorts.find((p) => p.portData.name === conn.fromPort);
            const toPort = toNode.inputPorts.find((p) => p.portData.name === conn.toPort);

            if (fromPort && toPort) {
                this._graphCanvas.connectPorts(fromPort.portData, toPort.portData);
            }
        }

        // Force a refresh
        this.setState({});

        const blockCount = createdNodes.length;
        const connCount = template.connections.length;
        this.props.globalState.onLogRequiredObservable.notifyObservers(new LogEntry(`Template "${template.name}" created: ${blockCount} blocks, ${connCount} connections`, false));
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
                        <div className="diagram-canvas-pane">
                            <GraphControlsComponent globalState={this.props.globalState} />
                            <GraphCanvasComponent
                                ref={this._graphCanvasRef}
                                stateManager={this.props.globalState.stateManager}
                                enableMinimap={true}
                                enableStickyNotes={true}
                                enableFindInGraph={true}
                                enablePortCompatibilityHighlight={true}
                                enableNodeBadges={true}
                                onEmitNewNode={(nodeData) => {
                                    return this.appendBlock(nodeData.data as FlowGraphBlock);
                                }}
                            />
                        </div>
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
                {this.state.helpTopicId !== null && (
                    <HelpDialogComponent initialTopicId={this.state.helpTopicId ?? undefined} onClose={() => this.setState({ helpTopicId: null })} />
                )}
                <div className="blocker">Flow Graph Editor needs a horizontal resolution of at least 900px</div>
                <div className="wait-screen hidden">Processing...please wait</div>
            </Portal>
        );
    }
}
