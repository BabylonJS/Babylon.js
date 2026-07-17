import * as React from "react";
import { type GlobalState } from "./globalState";
import { LogComponent, LogEntry } from "./components/log/logComponent";
import { type Nullable } from "core/types";
import { type Observer } from "core/Misc/observable";
import { SerializationTools } from "./serializationTools";
import { blockFactory } from "core/FlowGraph/Blocks/flowGraphBlockFactory";

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
import { HistoryStack } from "shared-ui-components/historyStack";
import { FlowGraphEventBlock } from "core/FlowGraph/flowGraphEventBlock";
import { type IFlowGraphValidationResult, FlowGraphValidationSeverity } from "core/FlowGraph/flowGraphValidator";
import { AnalyzeSmartGroup, ApplySmartGroupExposure } from "./graphSystem/smartGroup";
import { ComputeFlowGraphLayout, type IFlowLayoutNode } from "./graphSystem/flowGraphLayout";
import { type ConnectionPointPortData } from "./graphSystem/connectionPointPortData";
import { HelpDialogComponent } from "./components/help/helpDialogComponent";
import { type HelpTopicId } from "./components/help/helpContent";
import { GraphTabBarComponent } from "./components/graphTabBar/graphTabBarComponent";
import { ShowToast } from "./components/toast/toastComponent";
import { HowToUseDialogComponent } from "./components/howToUse/howToUseDialogComponent";
import { AllCompositeTemplates, type ICompositeTemplate } from "./compositeTemplates";
import { Divider, makeStyles, Menu, MenuDivider, MenuItem, MenuList, MenuPopover, MenuTrigger, Title3, mergeClasses, tokens } from "@fluentui/react-components";
import { useResizeHandle } from "@fluentui-contrib/react-resize-handle";
import { createVirtualElementFromClick, type PositioningVirtualElement } from "@fluentui/react-positioning";

/**
 * Local context-menu item shape used by the right-click menu on the graph canvas.
 * Built dynamically by `_onContextMenu` and rendered inline as Fluent `<MenuItem>`s.
 */
type ContextMenuItem = {
    label: string;
    action: () => void;
    shortcut?: string;
    disabled?: boolean;
    ariaLabel?: string;
};
type ContextMenuSeparator = { isSeparator: true };
type ContextMenuEntry = ContextMenuItem | ContextMenuSeparator;
function IsContextMenuSeparator(entry: ContextMenuEntry): entry is ContextMenuSeparator {
    return "isSeparator" in entry && entry.isSeparator === true;
}

const MobileBlockerMediaQuery = "@media screen and (max-width: 899px)";

const useGraphEditorLayoutStyles = makeStyles({
    diagramContainer: {
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        background: "#3a4a4f",
        fontFamily: "acumin-pro",
        fontSize: "14px",
    },
    diagramCanvasPane: {
        display: "flex",
        flexDirection: "column",
        width: "100%",
        flex: 1,
        minHeight: 0,
        overflow: "hidden",
        "& > :last-child": {
            flex: 1,
            minHeight: 0,
            overflow: "hidden",
        },
    },
    blocker: {
        position: "absolute",
        width: "calc(100% - 40px)",
        height: "100%",
        top: 0,
        left: 0,
        background: "rgba(20, 20, 20, 0.95)",
        fontFamily: "acumin-pro",
        color: "white",
        fontSize: "24px",
        display: "none",
        alignContent: "center",
        justifyContent: "center",
        userSelect: "none",
        padding: "20px",
        textAlign: "center",
        [MobileBlockerMediaQuery]: {
            display: "grid",
        },
    },
    waitScreen: {
        display: "grid",
        justifyContent: "center",
        alignContent: "center",
        height: "100%",
        width: "100%",
        background: "#464646",
        opacity: 0.95,
        color: "white",
        fontFamily: "acumin-pro",
        fontSize: "24px",
        position: "absolute",
        top: 0,
        left: 0,
    },
    hidden: {
        visibility: "hidden",
    },
});

const LogHeightAdjustCSSVar = "--flow-graph-log-height-adjust";

const useLogResizeStyles = makeStyles({
    divider: {
        flex: "0 0 auto",
        margin: "0",
        minHeight: tokens.spacingVerticalM,
        cursor: "ns-resize",
        alignItems: "end",
    },
    logPane: {
        flex: "0 0 auto",
        overflow: "hidden",
        minHeight: 0,
    },
});

/**
 * Renders the resize handle (Fluent `<Divider>`) and the resizable log container as siblings.
 *
 * This only exists as a separate function component because {@link useResizeHandle} is a React
 * hook and cannot be called from a class component's render method. Once {@link GraphEditor}
 * is converted to a function component, this can be deleted: the divider and the resizable
 * div can become inline siblings of the canvas pane in `GraphEditor`'s render, with
 * `useResizeHandle` called directly in `GraphEditor` itself.
 * @param props The component props.
 * @returns A fragment containing the divider and the resizable log container.
 */
const LogResizeRegion: React.FC<React.PropsWithChildren> = ({ children }) => {
    const classes = useLogResizeStyles();
    const { elementRef, handleRef } = useResizeHandle({
        growDirection: "up",
        relative: true,
        variableName: LogHeightAdjustCSSVar,
        variableTarget: "element",
    });
    return (
        <>
            <Divider ref={handleRef} className={classes.divider} />
            <div ref={elementRef} className={classes.logPane} style={{ height: `clamp(40px, calc(120px + var(${LogHeightAdjustCSSVar}, 0px)), 500px)` }}>
                {children}
            </div>
        </>
    );
};

/**
 * Pre-populate string (and other primitive) config fields for blocks whose constructors
 * receive those fields via the config object. Without this, `_defaultValue` on the
 * DataConnection starts as `undefined` a nd the property panel can't show a text field.
 * Key = FlowGraphBlockNames string value (i.e. `getClassName()` output).
 */
interface IGraphEditorProps {
    globalState: GlobalState;
}

interface IGraphEditorState {
    helpTopicId: HelpTopicId | undefined | null;
    contextMenu: { target: PositioningVirtualElement; items: ContextMenuEntry[] } | null;
    showHowToUse: boolean;
    isWaitScreenVisible: boolean;
}

interface IGraphEditorLayoutProps {
    globalState: GlobalState;
    diagramContainerRef: React.RefObject<HTMLDivElement>;
    graphCanvasRef: React.RefObject<GraphCanvasComponent>;
    contextMenu: IGraphEditorState["contextMenu"];
    helpTopicId: IGraphEditorState["helpTopicId"];
    showHowToUse: boolean;
    isWaitScreenVisible: boolean;
    onPointerMove: (evt: React.PointerEvent<HTMLDivElement>) => void;
    onPointerDown: (evt: React.PointerEvent<HTMLDivElement>) => void;
    onDragOver: (evt: React.DragEvent<HTMLDivElement>) => void;
    onDrop: (evt: React.DragEvent<HTMLDivElement>) => void;
    onContextMenu: (evt: React.MouseEvent) => void;
    onEmitNewNode: (nodeData: INodeData) => GraphNode;
    onCloseHelp: () => void;
    onCloseHowToUse: () => void;
    onCloseContextMenu: () => void;
    onMenuAction: (action: () => void) => void;
}

const GraphEditorLayout: React.FC<IGraphEditorLayoutProps> = (props) => {
    const {
        globalState,
        diagramContainerRef,
        graphCanvasRef,
        contextMenu,
        helpTopicId,
        showHowToUse,
        isWaitScreenVisible,
        onPointerMove,
        onPointerDown,
        onDragOver,
        onDrop,
        onContextMenu,
        onEmitNewNode,
        onCloseHelp,
        onCloseHowToUse,
        onCloseContextMenu,
        onMenuAction,
    } = props;
    const classes = useGraphEditorLayoutStyles();

    return (
        <>
            <div
                id="flow-graph-editor-graph-root"
                className={mergeClasses("diagram-container", classes.diagramContainer)}
                ref={diagramContainerRef}
                onPointerMove={onPointerMove}
                onPointerDown={onPointerDown}
                onDragOver={onDragOver}
                onDrop={onDrop}
            >
                <div className={classes.diagramCanvasPane} onContextMenu={onContextMenu}>
                    <GraphTabBarComponent globalState={globalState} />
                    <GraphCanvasComponent
                        ref={graphCanvasRef}
                        stateManager={globalState.stateManager}
                        enableMinimap={true}
                        enableStickyNotes={true}
                        enableFindInGraph={true}
                        enablePortCompatibilityHighlight={true}
                        enableNodeBadges={true}
                        onEmitNewNode={onEmitNewNode}
                    />
                </div>
                <LogResizeRegion>
                    <LogComponent globalState={globalState} />
                </LogResizeRegion>
            </div>
            {helpTopicId !== null && <HelpDialogComponent initialTopicId={helpTopicId ?? undefined} onClose={onCloseHelp} />}
            {showHowToUse && <HowToUseDialogComponent globalState={globalState} onClose={onCloseHowToUse} />}
            <div className={classes.blocker}>
                <Title3 style={{ color: "inherit" }}>Flow Graph Editor needs a horizontal resolution of at least 900px</Title3>
            </div>
            <div className={mergeClasses(classes.waitScreen, !isWaitScreenVisible && classes.hidden)}>
                <Title3 style={{ color: "inherit" }}>Processing...please wait</Title3>
            </div>
            {contextMenu && (
                <Menu
                    open
                    onOpenChange={(_, data) => {
                        if (!data.open) {
                            onCloseContextMenu();
                        }
                    }}
                    positioning={{ target: contextMenu.target, position: "below", align: "start" }}
                >
                    {/* Empty trigger — Fluent requires one but we control open state imperatively. */}
                    <MenuTrigger disableButtonEnhancement>
                        <span hidden />
                    </MenuTrigger>
                    <MenuPopover>
                        <MenuList>
                            {contextMenu.items.map((entry, idx) => {
                                if (IsContextMenuSeparator(entry)) {
                                    return <MenuDivider key={`sep-${idx}`} />;
                                }
                                return (
                                    <MenuItem
                                        key={`item-${idx}`}
                                        disabled={entry.disabled}
                                        aria-label={entry.ariaLabel ?? entry.label}
                                        secondaryContent={entry.shortcut}
                                        onClick={() => onMenuAction(entry.action)}
                                    >
                                        {entry.label}
                                    </MenuItem>
                                );
                            })}
                        </MenuList>
                    </MenuPopover>
                </Menu>
            )}
        </>
    );
};

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
    private _helpObserver: Nullable<Observer<any>> = null;
    private _howToUseObserver: Nullable<Observer<void>> = null;
    private _beforeActiveGraphObserver: Nullable<Observer<any>> = null;
    private _activeGraphObserver: Nullable<Observer<any>> = null;
    private _blockClassRegistry = new Map<string, typeof FlowGraphBlock>();
    private _buildVersion = 0;
    /** Cache for O(1) block→GraphNode lookups (rebuilt on graph load) */
    private _blockToNodeMap = new Map<FlowGraphBlock, GraphNode>();

    private _onDocumentKeyDown = (evt: KeyboardEvent) => {
        // Don't process editor shortcuts (Delete, Backspace, Ctrl+Z, Ctrl+A, Ctrl+F, etc.) while
        // the user is typing in a text input, textarea, or contentEditable element. Without this
        // guard, pressing Delete inside a property-panel input would delete the selected node,
        // and Ctrl+A would select all canvas nodes instead of all the input's text.
        const target = evt.target as HTMLElement | null;
        if (target) {
            const tag = target.tagName;
            if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable) {
                return;
            }
        }

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
                // Snapshot live contexts so undo/redo preserves user variables,
                // variable types, and connection values even when the graph is stopped.
                globalState.snapshotUserVariables();
                const serializationObject: any = {};
                fg.serialize(serializationObject);
                // Inject saved context snapshots when the graph has no live contexts
                if (
                    (!serializationObject.executionContexts || serializationObject.executionContexts.length === 0) &&
                    globalState.savedContextSnapshots &&
                    globalState.savedContextSnapshots.length > 0
                ) {
                    serializationObject.executionContexts = globalState.savedContextSnapshots;
                }
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

            // When we have a coordinator with multiple graphs, replace only the
            // active graph. Otherwise fall back to creating a throwaway coordinator
            // (legacy path, also used for single-graph sessions).
            const existingCoordinator = globalState.coordinator;
            if (existingCoordinator && existingCoordinator.flowGraphs.length > 0) {
                const activeIndex = globalState.activeGraphIndex;
                const oldGraph = existingCoordinator.flowGraphs[activeIndex];
                if (oldGraph) {
                    existingCoordinator.removeGraph(oldGraph);
                }
                // Parse into the existing coordinator
                const parsedGraph = ParseFlowGraph(data, { coordinator: existingCoordinator }, resolvedClasses);
                // Move the parsed graph to the correct position in the coordinator
                const graphs = existingCoordinator.flowGraphs;
                const currentIndex = graphs.indexOf(parsedGraph);
                if (currentIndex !== activeIndex && currentIndex >= 0) {
                    graphs.splice(currentIndex, 1);
                    graphs.splice(activeIndex, 0, parsedGraph);
                }
                SerializationTools.PreserveUnresolvedNames(parsedGraph, data);
                if (data.editorData) {
                    (parsedGraph as any)._editorData = data.editorData;
                }
                globalState.flowGraph = parsedGraph;
            } else {
                // Fallback: create a throwaway coordinator
                const coordinator = new FlowGraphCoordinator({ scene: globalState.scene });
                const parsedGraph = ParseFlowGraph(data, { coordinator }, resolvedClasses);
                SerializationTools.PreserveUnresolvedNames(parsedGraph, data);
                if (data.editorData) {
                    (parsedGraph as any)._editorData = data.editorData;
                }
                globalState.flowGraph = parsedGraph;
            }
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

        this._helpObserver = this.props.globalState.onHelpRequested.add((topicId) => {
            this.setState({ helpTopicId: topicId ?? undefined });
        });

        this._howToUseObserver = this.props.globalState.onHowToUseRequested.add(() => {
            this.setState({ showHowToUse: true });
        });
    }

    /** @internal */
    override componentWillUnmount() {
        window.removeEventListener("wheel", this.onWheel);

        const globalState = this.props.globalState;

        if (globalState.hostDocument) {
            globalState.hostDocument.removeEventListener("keydown", this._onDocumentKeyDown, false);
            globalState.hostDocument.removeEventListener("keyup", this._onWidgetKeyUpPointer, false);
        }

        globalState.stateManager.onUpdateRequiredObservable.clear();
        globalState.stateManager.onRebuildRequiredObservable.clear();
        globalState.stateManager.onNodeMovedObservable.clear();
        globalState.stateManager.onNewNodeCreatedObservable.clear();

        globalState.onClearUndoStack.clear();
        globalState.cancelPendingValidation();
        globalState.restoreLiveGraph();

        this._helpObserver?.remove();
        this._helpObserver = null;
        this._howToUseObserver?.remove();
        this._howToUseObserver = null;
        this._beforeActiveGraphObserver?.remove();
        this._beforeActiveGraphObserver = null;
        this._activeGraphObserver?.remove();
        this._activeGraphObserver = null;

        if (this._historyStack) {
            this._historyStack.dispose();
            this._historyStack = null as any;
        }
    }

    /** @internal */
    constructor(props: IGraphEditorProps) {
        super(props);

        this.state = {
            helpTopicId: null,
            contextMenu: null,
            showHowToUse: false,
            isWaitScreenVisible: false,
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

        // Persist canvas state (zoom, pan, node positions) on the outgoing graph
        // so it is restored when the user switches back to that tab.
        this._beforeActiveGraphObserver = this.props.globalState.onBeforeActiveGraphChanged.add((outgoingGraph) => {
            SerializationTools.UpdateLocations(outgoingGraph, this.props.globalState);
        });

        // Rebuild the canvas when the active graph changes (multi-graph tab switch)
        this._activeGraphObserver = this.props.globalState.onActiveGraphChanged.add(() => {
            this.build();
            this.props.globalState.onClearUndoStack.notifyObservers();
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

        this.props.globalState.onSortGraphRequiredObservable.add(() => {
            this.sortGraph();
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
            const onClick = () => {
                for (const issue of issues) {
                    const prefix = issue.severity === FlowGraphValidationSeverity.Error ? "[Error]" : "[Warn]";
                    const blockName = issue.block?.name ?? "Graph";
                    this.props.globalState.onLogRequiredObservable.notifyObservers(
                        new LogEntry(`${prefix} ${blockName}: ${issue.message}`, issue.severity === FlowGraphValidationSeverity.Error, issue.block)
                    );
                }
                this.props.globalState.onToastNotification.notifyObservers({
                    message: tooltip,
                    severity: hasError ? "error" : "warning",
                });
            };
            node.setValidationState(hasError ? "error" : "warning", tooltip, onClick);
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
            node.setBreakpointState(hasBreakpoint || isPaused, isPaused);
        }
    }

    /** @internal */
    build(ignoreEditorData = false) {
        const buildVersion = ++this._buildVersion;
        const flowGraph = this.props.globalState.flowGraph;
        let editorData = ignoreEditorData ? null : (this.props.globalState.flowGraph as any)._editorData;
        this._graphCanvas._isLoading = true;

        if (editorData instanceof Array) {
            editorData = {
                locations: editorData,
            };
        }

        // Reset the diagram
        this._graphCanvas.reset(false);
        this._blockToNodeMap.clear();

        // Load graph of nodes from the flow graph
        if (this.props.globalState.flowGraph) {
            this.loadGraph();
        }

        if (editorData) {
            this.reOrganize(editorData);
        } else {
            // No saved positions — the graph was never laid out, so apply the flow-aware
            // "Sort graph" automatically. Deferred to the next macro-task so node DOM
            // elements have real dimensions: setTimeout(0) runs after the browser has
            // completed layout and paint (rAF alone is not sufficient because it fires
            // *before* layout in some browsers).
            //
            // The bulk node creation in loadGraph() is already done, so clear the loading
            // flag synchronously here. Otherwise it would stay set until the deferred
            // sortGraph() runs, and if that is skipped (newer build, changed flow graph,
            // or empty graph) the flag would be stranded as true — which freezes link and
            // frame updates while dragging nodes (_refreshLinks/_refreshFrames early-out).
            this._graphCanvas._isLoading = false;
            setTimeout(() => {
                if (buildVersion !== this._buildVersion || flowGraph !== this.props.globalState.flowGraph) {
                    return;
                }
                this.sortGraph();
                this.zoomToFit();
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
        this.setState({ isWaitScreenVisible: true });
    }

    /** @internal */
    hideWaitScreen() {
        this.setState({ isWaitScreenVisible: false });
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

    /**
     * Flow-aware "Sort graph" layout.
     *
     * Arranges the blocks following execution semantics: event blocks are anchored in the
     * left-most column stacked vertically, execution (signal) flow runs left-to-right, and
     * when flow diverges the branches are stacked with each branch's sub-tree forming a
     * contiguous vertical band. Data wires are used only as a secondary placement hint and
     * loop back-edges are dropped so the loop body still flows rightward. Unlike the generic
     * dagre "Reorganize", this understands the difference between signal and data ports.
     */
    sortGraph() {
        const canvas = this._graphCanvas;
        if (canvas.nodes.length === 0) {
            // Nothing to lay out, but make sure the loading flag is never left set by a
            // caller (e.g. build()) so node drags keep refreshing links and frames.
            canvas._isLoading = false;
            return;
        }

        this.showWaitScreen();
        canvas._isLoading = true;

        // Precompute a single block-instance -> node-id lookup so resolving each endpoint's
        // owner is O(1) instead of an O(N) scan of canvas.nodes per endpoint.
        const dataToNodeId = new Map<unknown, number>();
        for (const node of canvas.nodes) {
            dataToNodeId.set(node.content.data, node.id);
        }

        const layoutNodes: IFlowLayoutNode[] = canvas.nodes.map((node) => {
            const signalOut: number[] = [];
            const dataOut: number[] = [];
            for (const output of node.content.outputs) {
                if (!output.hasEndpoints) {
                    continue;
                }
                const kind = (output as ConnectionPointPortData).connectionKind;
                for (const endpoint of output.endpoints ?? []) {
                    const targetId = dataToNodeId.get(endpoint.ownerData);
                    if (targetId === undefined) {
                        continue;
                    }
                    if (kind === "signal") {
                        signalOut.push(targetId);
                    } else {
                        dataOut.push(targetId);
                    }
                }
            }
            return {
                id: node.id,
                width: node.width,
                height: node.height,
                isEvent: node.content.data instanceof FlowGraphEventBlock,
                signalOut,
                dataOut,
            };
        });

        const positions = ComputeFlowGraphLayout(layoutNodes);
        for (const node of canvas.nodes) {
            const position = positions.get(node.id);
            if (position) {
                node.x = position.x;
                node.y = position.y;
                node.cleanAccumulation();
            }
        }

        canvas.x = 0;
        canvas.y = 0;
        canvas.zoom = 1;
        canvas._isLoading = false;
        for (const node of canvas.nodes) {
            node._refreshLinks();
        }
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

    /**
     * Handle right-click context menu on the canvas.
     * Determines what was clicked and builds the appropriate menu.
     * @param evt the mouse event from the right-click
     */
    private _onContextMenu = (evt: React.MouseEvent) => {
        // Don't suppress native context menu for text inputs
        const target = evt.target;
        if (target instanceof HTMLElement && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.closest("[contenteditable]"))) {
            return;
        }
        evt.preventDefault();
        evt.stopPropagation();

        const globalState = this.props.globalState;
        const canvas = this._graphCanvas;
        const items: ContextMenuEntry[] = [];

        const selectedNodes = canvas.selectedNodes;
        const selectedLink = canvas.selectedLink;
        const selectedFrames = canvas.selectedFrames;

        const isMac = navigator.platform.indexOf("Mac") >= 0;
        const ctrlKey = isMac ? "⌘" : "Ctrl";

        if (selectedNodes.length > 0) {
            // ── Node context menu ──
            items.push({
                label: "Delete",
                shortcut: "Del",
                action: () => {
                    for (const node of [...selectedNodes]) {
                        const block = node.content?.data as FlowGraphBlock;
                        if (block) {
                            globalState.flowGraph.removeBlock(block);
                        }
                        node.dispose();
                    }
                    globalState.stateManager.onSelectionChangedObservable.notifyObservers(null);
                    globalState.stateManager.onRebuildRequiredObservable.notifyObservers();
                },
            });
            items.push({
                label: "Duplicate",
                shortcut: `${ctrlKey}+C / ${ctrlKey}+V`,
                action: () => {
                    // Update mouse location so paste places nodes at the right-click position
                    this._mouseLocationX = evt.pageX;
                    this._mouseLocationY = evt.pageY;
                    // Use the copy/paste mechanism
                    const keydownC = new KeyboardEvent("keydown", { key: "c", ctrlKey: !isMac, metaKey: isMac, bubbles: true });
                    globalState.hostDocument.dispatchEvent(keydownC);
                    setTimeout(() => {
                        const keydownV = new KeyboardEvent("keydown", { key: "v", ctrlKey: !isMac, metaKey: isMac, bubbles: true });
                        globalState.hostDocument.dispatchEvent(keydownV);
                    }, 50);
                },
            });
            items.push({ isSeparator: true });
            if (selectedNodes.length === 1) {
                const block = selectedNodes[0].content?.data as FlowGraphBlock;
                if (block instanceof FlowGraphExecutionBlock) {
                    const hasBreakpoint = globalState.hasBreakpoint(block.uniqueId);
                    items.push({
                        label: hasBreakpoint ? "Remove Breakpoint" : "Add Breakpoint",
                        shortcut: "F9",
                        action: () => {
                            globalState.toggleBreakpoint(block.uniqueId);
                        },
                    });
                }
            }
            if (selectedNodes.length >= 2) {
                items.push({
                    label: "Create Smart Group",
                    shortcut: `${ctrlKey}+G`,
                    action: () => this._createSmartGroup(),
                });
            }
            items.push({ isSeparator: true });
            items.push({
                label: "Disconnect All Ports",
                action: () => {
                    for (const node of selectedNodes) {
                        const block = node.content?.data as FlowGraphBlock;
                        if (!block) {
                            continue;
                        }
                        for (const input of block.dataInputs) {
                            input.disconnectFromAll();
                        }
                        for (const output of block.dataOutputs) {
                            output.disconnectFromAll();
                        }
                        if (block instanceof FlowGraphExecutionBlock) {
                            for (const sig of block.signalInputs) {
                                sig.disconnectFromAll();
                            }
                            for (const sig of block.signalOutputs) {
                                sig.disconnectFromAll();
                            }
                        }
                    }
                    globalState.stateManager.onRebuildRequiredObservable.notifyObservers();
                    ShowToast(globalState, "Disconnected all ports", "info");
                },
            });
        } else if (selectedLink) {
            // ── Link context menu ──
            items.push({
                label: "Delete Connection",
                shortcut: "Del",
                action: () => {
                    selectedLink.dispose();
                    globalState.stateManager.onSelectionChangedObservable.notifyObservers(null);
                    globalState.stateManager.onRebuildRequiredObservable.notifyObservers();
                },
            });
        } else if (selectedFrames.length > 0) {
            // ── Frame context menu ──
            items.push({
                label: "Delete Frame",
                shortcut: "Del",
                action: () => {
                    for (const frame of [...selectedFrames]) {
                        frame.dispose();
                    }
                    globalState.stateManager.onSelectionChangedObservable.notifyObservers(null);
                },
            });
            if (selectedFrames.length === 1) {
                const frame = selectedFrames[0];
                items.push({
                    label: frame.isCollapsed ? "Expand" : "Collapse",
                    action: () => {
                        frame.isCollapsed = !frame.isCollapsed;
                    },
                });
            }
        } else {
            // ── Canvas background context menu ──
            items.push({
                label: "Add Block...",
                shortcut: "Space",
                action: () => {
                    canvas.showSearch();
                },
            });
            items.push({
                label: "Paste",
                shortcut: `${ctrlKey}+V`,
                action: () => {
                    // Update mouse location so paste places nodes at the right-click position
                    this._mouseLocationX = evt.pageX;
                    this._mouseLocationY = evt.pageY;
                    const keydownV = new KeyboardEvent("keydown", { key: "v", ctrlKey: !isMac, metaKey: isMac, bubbles: true });
                    globalState.hostDocument.dispatchEvent(keydownV);
                },
            });
            items.push({ isSeparator: true });
            items.push({
                label: "Create Sticky Note",
                shortcut: `${ctrlKey}+M`,
                action: () => {
                    const container = globalState.hostDocument.querySelector(".diagram-container") as HTMLDivElement;
                    const zoomLevel = canvas.zoom;
                    const x = (evt.clientX - (container?.offsetLeft ?? 0) - canvas.x) / zoomLevel;
                    const y = (evt.clientY - (container?.offsetTop ?? 0) - canvas.y) / zoomLevel;
                    canvas.addStickyNote(x, y);
                },
            });
            items.push({ isSeparator: true });
            items.push({
                label: "Select All",
                shortcut: `${ctrlKey}+A`,
                action: () => {
                    globalState.stateManager.onSelectionChangedObservable.notifyObservers(null);
                    for (const node of canvas.nodes) {
                        globalState.stateManager.onSelectionChangedObservable.notifyObservers({ selection: node, forceKeepSelection: true });
                    }
                    for (const frame of canvas.frames) {
                        globalState.stateManager.onSelectionChangedObservable.notifyObservers({ selection: frame, forceKeepSelection: true });
                    }
                },
            });
            items.push({
                label: "Zoom to Fit",
                action: () => globalState.onZoomToFitRequiredObservable.notifyObservers(),
            });
            items.push({
                label: "Reorganize",
                action: () => globalState.onReOrganizedRequiredObservable.notifyObservers(),
            });
            items.push({
                label: "Sort graph",
                action: () => globalState.onSortGraphRequiredObservable.notifyObservers(),
            });
        }

        if (items.length > 0) {
            this.setState({ contextMenu: { target: createVirtualElementFromClick(evt.nativeEvent), items } });
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
            // Constant blocks need a default value so their output port type is resolved correctly.
            const config: any = { name: blockType };
            if (blockType === "FlowGraphConstantBlock") {
                config.value = 0;
            }
            const block = new (blockClass as any)(config) as FlowGraphBlock;

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

        // Use the graph canvas's own container rect so the drop point is computed in the
        // canvas's local coordinate space. The diagram pane includes toolbars (tab bar,
        // graph controls, variables panel) above the canvas, so its bounding rect is offset.
        const canvasContainer = this._graphCanvas?.canvasContainer;
        if (!canvasContainer) {
            return;
        }
        const rect = canvasContainer.getBoundingClientRect();
        const dropX = event.clientX - rect.left;
        const dropY = event.clientY - rect.top;

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
            <GraphEditorLayout
                globalState={this.props.globalState}
                diagramContainerRef={this._diagramContainerRef}
                graphCanvasRef={this._graphCanvasRef}
                contextMenu={this.state.contextMenu}
                helpTopicId={this.state.helpTopicId}
                showHowToUse={this.state.showHowToUse}
                isWaitScreenVisible={this.state.isWaitScreenVisible}
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
                onDragOver={(evt) => {
                    // Allow dropping 3D scene files anywhere on the editor, and node-list drag items
                    // onto the central content. Check both DataTransferItem.kind (modern) and
                    // dataTransfer.types (legacy/Firefox) to ensure preventDefault is called even
                    // when items list is unavailable.
                    const dt = evt.dataTransfer;
                    const hasFile =
                        (dt?.items && Array.from(dt.items).some((item) => item.kind === "file")) ||
                        (dt?.types && (dt.types.includes("Files") || dt.types.includes("application/x-moz-file")));
                    const hasNodeData = dt?.types && dt.types.includes("babylonjs-flow-graph-node");
                    if (hasFile || hasNodeData) {
                        evt.preventDefault();
                        evt.stopPropagation();
                    }
                }}
                onDrop={(evt) => {
                    // Files dropped on the canvas itself (block palette items) are handled by the
                    // inner pane below. This top-level handler only intercepts 3D scene files
                    // dropped anywhere in the central content.
                    const files = evt.dataTransfer?.files;
                    if (!files || files.length === 0) {
                        this.dropNewBlock(evt);
                        return;
                    }
                    evt.preventDefault();
                    evt.stopPropagation();
                    const supportedExtensions = [".glb", ".gltf", ".babylon"];
                    for (let i = 0; i < files.length; i++) {
                        const name = files[i].name.toLowerCase();
                        if (supportedExtensions.some((ext) => name.endsWith(ext))) {
                            this.props.globalState.onDropEventReceivedObservable.notifyObservers(evt.nativeEvent);
                            return;
                        }
                    }
                }}
                onContextMenu={this._onContextMenu}
                onEmitNewNode={(nodeData) => this.appendBlock(nodeData.data as FlowGraphBlock)}
                onCloseHelp={() => this.setState({ helpTopicId: null })}
                onCloseHowToUse={() => this.setState({ showHowToUse: false })}
                onCloseContextMenu={() => this.setState({ contextMenu: null })}
                onMenuAction={(action) => {
                    action();
                    this.setState({ contextMenu: null });
                }}
            />
        );
    }
}
