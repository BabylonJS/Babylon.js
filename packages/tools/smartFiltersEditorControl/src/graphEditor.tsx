/* eslint-disable jsdoc/require-jsdoc */
/* eslint-disable babylonjs/available */
import * as react from "react";
import * as reactDOM from "react-dom";

import { PreviewAspectRatioKey, PreviewFillContainerKey, type GlobalState } from "./globalState.js";
import "./assets/styles/main.scss";

import { Portal } from "./portal.js";

import { MessageDialog } from "shared-ui-components/components/MessageDialog.js";
import { GraphCanvasComponent } from "shared-ui-components/nodeGraphSystem/graphCanvas.js";
import { LogComponent } from "./components/log/logComponent.js";
import { TypeLedger } from "shared-ui-components/nodeGraphSystem/typeLedger.js";
import { BlockTools } from "./blockTools.js";
import { PropertyTabComponent } from "./components/propertyTab/propertyTabComponent.js";
import { NodeListComponent } from "./components/nodeList/nodeListComponent.js";
import { CreateDefaultInput } from "./graphSystem/registerDefaultInput.js";
import type { INodeData } from "shared-ui-components/nodeGraphSystem/interfaces/nodeData";
import type { IEditorData } from "shared-ui-components/nodeGraphSystem/interfaces/nodeLocationInfo";
import type { Nullable } from "core/types";
import { createStrongRef, Logger, ShaderBlock, type BaseBlock, type SmartFilter, InputBlock, ConnectionPointType } from "smart-filters";
import { inputsNamespace } from "smart-filters-blocks";
import { SetEditorData } from "./helpers/serializationTools.js";
import { SplitContainer } from "shared-ui-components/split/splitContainer.js";
import { Splitter } from "shared-ui-components/split/splitter.js";
import { ControlledSize, SplitDirection } from "shared-ui-components/split/splitContext.js";
import { PreviewAreaComponent } from "./components/preview/previewAreaComponent.js";
import { InitializePreview } from "./initializePreview.js";
import { PreviewAreaControlComponent } from "./components/preview/previewAreaControlComponent.js";
import { CreatePopup } from "shared-ui-components/popupHelper.js";
import type { IInspectorOptions } from "core/Debug/debugLayer.js";
import { DecodeBlockKey, GetBlockKey } from "./helpers/blockKeyConverters.js";
import { OutputBlockName } from "./configuration/constants.js";
import type { BlockNodeData } from "./graphSystem/blockNodeData";
import { DataStorage } from "core/Misc/dataStorage.js";
import { OnlyShowCustomBlocksDefaultValue } from "./constants.js";
import { ThinEngine } from "core/Engines/thinEngine.js";
import { HistoryStack } from "shared-ui-components/historyStack.js";
import { WebCamInputBlockName } from "./configuration/editorBlocks/blockNames.js";

interface IGraphEditorProps {
    globalState: GlobalState;
}

interface IGraphEditorState {
    showPreviewPopUp: boolean;
    message: string;
    isError: boolean;
}

interface IInternalPreviewAreaOptions extends IInspectorOptions {
    popup: boolean;
    original: boolean;
    explorerWidth?: string;
    inspectorWidth?: string;
    embedHostWidth?: string;
}

/**
 * The main React component for the Smart Filter Editor control.
 * Draws the whole editor, including the side panels and console, and handles global events.
 */
export class GraphEditor extends react.Component<IGraphEditorProps, IGraphEditorState> {
    private _graphCanvasRef: react.RefObject<GraphCanvasComponent>;
    private _diagramContainerRef: react.RefObject<HTMLDivElement>;
    private _graphCanvas!: GraphCanvasComponent;
    private _diagramContainer!: HTMLDivElement;
    private _canvasResizeObserver: Nullable<ResizeObserver> = null;
    private _historyStack: Nullable<HistoryStack> = null;

    private _mouseLocationX = 0;
    private _mouseLocationY = 0;
    private _onWidgetKeyUpPointer: any;

    private _previewHost: Nullable<HTMLElement> = null;
    private _popUpWindow: Nullable<Window> = null;

    appendBlock(dataToAppend: BaseBlock | INodeData, recursion = true) {
        return this._graphCanvas.createNodeFromObject(
            TypeLedger.NodeDataBuilder(dataToAppend, this._graphCanvas),
            (block: BaseBlock) => {
                if (this.props.globalState.smartFilter!.attachedBlocks.indexOf(block) === -1) {
                    // TODO manage add but should not be possible to arrive here.
                    // this.props.globalState.smartFilter!.attachedBlocks.push(block);
                }

                if (block.getClassName() === OutputBlockName) {
                    // Do Nothing, only one output block allowed and created by the graph
                }
            },
            recursion
        );
    }

    createInputBlock(blockTypeAndNamespace: string, name?: string) {
        const { blockType } = DecodeBlockKey(blockTypeAndNamespace);
        const nodeType = BlockTools.GetConnectionNodeTypeFromString(blockType);

        const newInputBlock = CreateDefaultInput(this.props.globalState.smartFilter, nodeType, this.props.globalState.engine, name);

        return newInputBlock;
    }

    prepareHistoryStack() {
        const globalState = this.props.globalState;

        // eslint-disable-next-line no-restricted-syntax
        const dataProvider = async () => {
            // return the serialized version to store
            if (globalState.copySmartFilterToStringAsync) {
                this.props.globalState.onSaveEditorDataRequiredObservable.notifyObservers();
                return await globalState.copySmartFilterToStringAsync();
            }

            return "";
        };

        const applyUpdateAsync = async (data: any) => {
            if (this.props.globalState.pasteSmartFilterFromStringAsync) {
                this.props.globalState.onSaveEditorDataRequiredObservable.notifyObservers();
                await this.props.globalState.pasteSmartFilterFromStringAsync(data);
            }
        };

        // Create the stack
        this._historyStack = new HistoryStack(dataProvider, applyUpdateAsync);
        globalState.stateManager.historyStack = this._historyStack;

        // Connect to relevant events
        globalState.stateManager.onUpdateRequiredObservable.add(() => {
            void this._historyStack!.storeAsync();
        });
        globalState.stateManager.onRebuildRequiredObservable.add(() => {
            void this._historyStack!.storeAsync();
        });
        globalState.stateManager.onNodeMovedObservable.add(() => {
            void this._historyStack!.storeAsync();
        });
        globalState.stateManager.onNewNodeCreatedObservable.add(() => {
            void this._historyStack!.storeAsync();
        });
        globalState.onClearUndoStack.add(() => {
            this._historyStack!.reset();
        });
    }

    override componentDidMount() {
        window.addEventListener("wheel", this.onWheel, { passive: false });

        this._canvasResizeObserver = new ResizeObserver(() => {
            if (this.props.globalState.engine) {
                setTimeout(() => {
                    this.props.globalState.engine?.resize();
                }, 0);
            }
        });

        if (this.props.globalState.hostDocument) {
            this._graphCanvas = this._graphCanvasRef.current!;
            this.prepareHistoryStack();
            this._diagramContainer = this._diagramContainerRef.current!;
            const canvas = this.props.globalState.hostDocument.getElementById("sfe-preview-canvas") as HTMLCanvasElement;
            if (canvas && this.props.globalState.onNewEngine) {
                const engine = InitializePreview(canvas, this.props.globalState.forceWebGL1);
                const versionToLog = `Babylon.js v${ThinEngine.Version} - WebGL${engine.webGLVersion}`;
                Logger.Log(versionToLog);
                this.props.globalState.engine = engine;
                this.props.globalState.onNewEngine(engine);
                this._canvasResizeObserver.observe(canvas);
            }
        }

        if (navigator.userAgent.indexOf("Mobile") !== -1) {
            ((this.props.globalState.hostDocument || document).querySelector(".blocker") as HTMLElement).style.display = "grid";
        }

        this.props.globalState.onPopupClosedObservable.addOnce(() => {
            this.componentWillUnmount();
        });

        this.props.globalState.onSmartFilterLoadedObservable?.add((smartFilter: SmartFilter) => {
            if (!this._historyStack) {
                return;
            }

            this.props.globalState.smartFilter = smartFilter;
            this.props.globalState.onResetRequiredObservable.notifyObservers(false);

            if (!this._historyStack.hasData) {
                // For the first load when there is no history, we capture the baseline
                setTimeout(() => {
                    // We skip the current frame to let the location being updated
                    this.props.globalState.onClearUndoStack.notifyObservers();
                });
            }
        });

        this.props.globalState.onlyShowCustomBlocksObservable.notifyObservers(DataStorage.ReadBoolean("OnlyShowCustomBlocks", OnlyShowCustomBlocksDefaultValue));
        this.props.globalState.previewAspectRatio.onChangedObservable.add((newValue: string) => {
            localStorage.setItem(PreviewAspectRatioKey, newValue);
        });
        this.props.globalState.previewFillContainer.onChangedObservable.add((newValue: boolean) => {
            localStorage.setItem(PreviewFillContainerKey, newValue ? "true" : "");
        });

        this.props.globalState.onClearUndoStack.notifyObservers();

        this.build();
    }

    override componentWillUnmount() {
        window.removeEventListener("wheel", this.onWheel);

        this._canvasResizeObserver?.disconnect();

        if (this.props.globalState.hostDocument) {
            this.props.globalState.hostDocument!.removeEventListener("keyup", this._onWidgetKeyUpPointer, false);
        }

        // Save new editor data
        this.props.globalState.onSaveEditorDataRequiredObservable.notifyObservers();

        this.props.globalState.onClearUndoStack.clear();

        if (this._historyStack) {
            this._historyStack.dispose();
            this._historyStack = null as any;
        }

        // if (this._previewManager) {
        //     this._previewManager.dispose();
        //     this._previewManager = null as any;
        // }
    }

    constructor(props: IGraphEditorProps) {
        super(props);

        this.state = {
            showPreviewPopUp: false,
            message: "",
            isError: true,
        };

        this._graphCanvasRef = react.createRef();
        this._diagramContainerRef = react.createRef();

        this.props.globalState.stateManager.onNewBlockRequiredObservable.add(
            (eventData: { type: string; targetX: number; targetY: number; needRepositioning?: boolean | undefined }) => {
                let targetX = eventData.targetX;
                let targetY = eventData.targetY;

                if (eventData.needRepositioning) {
                    targetX = targetX - this._diagramContainer.offsetLeft;
                    targetY = targetY - this._diagramContainer.offsetTop;
                }

                // eslint-disable-next-line @typescript-eslint/no-floating-promises
                this.emitNewBlockAsync(eventData.type, targetX, targetY);
            }
        );

        this.props.globalState.stateManager.onRebuildRequiredObservable.add(async () => {
            this.props.globalState.rebuildRuntime?.();
        });

        this.props.globalState.onSaveEditorDataRequiredObservable.add(() => {
            SetEditorData(this.props.globalState.smartFilter, this.props.globalState, this._graphCanvas);
        });

        this.props.globalState.onResetRequiredObservable.add((isDefault) => {
            if (isDefault) {
                if (this.props.globalState.smartFilter) {
                    // this.buildMaterial();
                }
                this.build(true);
            } else {
                this.build();
                if (this.props.globalState.smartFilter) {
                    // this.buildMaterial();
                }
            }
        });

        this.props.globalState.onZoomToFitRequiredObservable.add(() => {
            this.zoomToFit();
        });

        this.props.globalState.onReOrganizedRequiredObservable.add(() => {
            this.reOrganize();
        });

        this.props.globalState.onGetNodeFromBlock = (block: BaseBlock) => {
            return this._graphCanvas.findNodeFromData(block);
        };

        this.props.globalState.hostDocument!.addEventListener("keydown", (evt) => {
            if (this._historyStack && this._historyStack.processKeyEvent(evt)) {
                return;
            }

            // If one of the selected nodes is an OutputBlock, and the keypress is delete, remove the OutputBlock from the selected list
            if (evt.keyCode === 46 || evt.keyCode === 8) {
                const indexOfOutputBlock = this._graphCanvas.selectedNodes.findIndex((node) => (node.content as BlockNodeData).data.isOutput);
                if (indexOfOutputBlock !== -1) {
                    this._graphCanvas.selectedNodes.splice(indexOfOutputBlock, 1);

                    // If there are none left, notify that the selection changed, because handleKeyDown will
                    // not do it since there is nothing selected any longer
                    if (this._graphCanvas.selectedNodes.length === 0) {
                        this.props.globalState.stateManager.onSelectionChangedObservable.notifyObservers(null);
                    }
                }
            }

            void this._graphCanvas.handleKeyDownAsync(
                evt,
                (nodeData) => {
                    if (!nodeData.data.isOutput) {
                        const block = nodeData.data as BaseBlock;
                        this.props.globalState.smartFilter!.removeBlock(block);
                    }
                },
                this._mouseLocationX,
                this._mouseLocationY,
                async (_nodeData) => {
                    const oldBlock = _nodeData.data as BaseBlock;
                    const newBlock = await this.cloneBlockAsync(oldBlock);
                    if (!newBlock) {
                        return null;
                    }
                    return this.appendBlock(newBlock, false);
                },
                this.props.globalState.hostDocument!.querySelector(".diagram-container") as HTMLDivElement
            );
        });

        this.props.globalState.stateManager.onErrorMessageDialogRequiredObservable.add((message: string) => {
            this.setState({ message: message, isError: true });
        });
    }

    zoomToFit() {
        this._graphCanvas.zoomToFit();
    }

    build(ignoreEditorData = false) {
        const editorData = ignoreEditorData ? null : this.props.globalState.smartFilter.editorData;
        this._graphCanvas._isLoading = true; // Will help loading large graphs

        // setup the diagram model
        this._graphCanvas.reset();

        // Load graph of nodes from the Smart Filter
        if (this.props.globalState.smartFilter) {
            this.loadGraph();
        }

        this.reOrganize(editorData);
    }

    loadGraph() {
        const smartFilter = this.props.globalState.smartFilter;

        smartFilter.attachedBlocks.forEach((n: BaseBlock) => {
            this.appendBlock(n, true);
        });

        // Links
        smartFilter.attachedBlocks.forEach((n: BaseBlock) => {
            if (n.inputs.length) {
                const nodeData = this._graphCanvas.findNodeFromData(n);
                for (const input of nodeData.content.inputs) {
                    if (input.isConnected) {
                        this._graphCanvas.connectPorts(input.connectedPort!, input);
                    }
                }
            }
        });
    }

    showWaitScreen() {
        this.props.globalState.hostDocument.querySelector(".wait-screen")?.classList.remove("hidden");
    }

    hideWaitScreen() {
        this.props.globalState.hostDocument.querySelector(".wait-screen")?.classList.add("hidden");
    }

    reOrganize(editorData: Nullable<IEditorData> = null, isImportingAFrame = false) {
        this.showWaitScreen();
        this._graphCanvas._isLoading = true; // Will help loading large graphs

        setTimeout(() => {
            this._graphCanvas.reOrganize(editorData, isImportingAFrame);
            this.hideWaitScreen();
        });
    }

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

    async cloneBlockAsync(oldBlock: BaseBlock): Promise<Nullable<BaseBlock>> {
        let blockType = oldBlock.blockType;
        let blockNamespace = oldBlock.namespace;

        // Input blocks are special case, fix up the blockType and namespace
        if (oldBlock.blockType === "InputBlock") {
            blockType = BlockTools.GetStringFromConnectionNodeType(oldBlock.outputs[0].type);
            blockNamespace = inputsNamespace;

            // A special type of input block is the webcam block, which uses a special blockType so its registration can be found
            if (oldBlock.name === WebCamInputBlockName) {
                blockType = WebCamInputBlockName;
            }
        }

        const blockTypeAndNamespace = GetBlockKey(blockType, blockNamespace);

        const newBlock = await this.createBlockAsync(blockTypeAndNamespace, true, oldBlock.name);
        if (!newBlock) {
            return null;
        }

        // Copy over InputBlock specific data
        if (oldBlock.blockType === "InputBlock" && newBlock instanceof InputBlock && oldBlock instanceof InputBlock) {
            // Make a copy of the value, unless it's a texture, then let it be the default
            if (oldBlock.outputs[0].runtimeData && oldBlock.type !== ConnectionPointType.Texture) {
                newBlock.outputs[0].runtimeData = createStrongRef(JSON.parse(JSON.stringify(oldBlock.outputs[0].runtimeData.value)));
            }

            // Copy appMetadata over, which could be any type
            if (oldBlock.appMetadata) {
                newBlock.appMetadata = JSON.parse(JSON.stringify(oldBlock.appMetadata));
            }

            // Copy editorData over
            if (oldBlock.editorData) {
                newBlock.editorData = JSON.parse(JSON.stringify(oldBlock.editorData));
            }
        }

        // Copy over the data that block factories are not responsible for setting
        newBlock.comments = oldBlock.comments;
        if (oldBlock instanceof ShaderBlock && oldBlock.outputTextureOptions && newBlock instanceof ShaderBlock) {
            newBlock.outputTextureOptions = { ...oldBlock.outputTextureOptions };
        }

        return newBlock;
    }

    async createBlockAsync(blockTypeAndNamespace: string, suppressAutomaticInputBlocks: boolean, name?: string): Promise<Nullable<BaseBlock>> {
        const { blockType, namespace } = DecodeBlockKey(blockTypeAndNamespace);

        let block: Nullable<BaseBlock> = null;

        // First try the block registrations provided to the editor
        if (this.props.globalState.engine && this.props.globalState.blockEditorRegistration) {
            block = await this.props.globalState.blockEditorRegistration.getBlock(
                blockType,
                namespace,
                this.props.globalState.smartFilter,
                this.props.globalState.engine,
                suppressAutomaticInputBlocks,
                name
            );
        }

        // If we haven't created the block yet, see if it's a standard input block
        if (!block && namespace === inputsNamespace) {
            block = this.createInputBlock(blockTypeAndNamespace, name);
        }

        // If we don't have a block yet, display an error
        if (!block) {
            this.props.globalState.stateManager.onErrorMessageDialogRequiredObservable.notifyObservers(`Could not create a block of type ${blockTypeAndNamespace}`);
            return null;
        }

        // Enforce uniqueness if applicable
        if (this.props.globalState.blockEditorRegistration && this.props.globalState.blockEditorRegistration.getIsUniqueBlock(block)) {
            const className = block.getClassName();
            for (const other of this._graphCanvas.getCachedData()) {
                if (other !== block && other.getClassName() === className) {
                    this.props.globalState.stateManager.onErrorMessageDialogRequiredObservable.notifyObservers(`You can only have one ${className} per graph`);
                    return null;
                }
            }
        }

        return block;
    }

    async emitNewBlockAsync(blockTypeAndNamespace: string, targetX: number, targetY: number) {
        const block = await this.createBlockAsync(blockTypeAndNamespace, false);
        if (!block) {
            return;
        }

        const newNode = this.appendBlock(block);

        // Size exceptions
        let offsetX = GraphCanvasComponent.NodeWidth;
        let offsetY = 20;

        if (blockTypeAndNamespace === "ElbowBlock") {
            offsetX = 10;
            offsetY = 10;
        }

        // Drop
        this._graphCanvas.drop(newNode, targetX, targetY, offsetX, offsetY);

        this.forceUpdate();
    }

    dropNewBlock(event: react.DragEvent<HTMLDivElement>) {
        const data = event.dataTransfer.getData("babylonjs-smartfilter-node") as string;

        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        this.emitNewBlockAsync(data, event.clientX - this._diagramContainer.offsetLeft, event.clientY - this._diagramContainer.offsetTop);
    }

    handlePopUp = () => {
        this.setState({
            showPreviewPopUp: true,
        });
        this.createPopUp();
        this.props.globalState.hostWindow.addEventListener("beforeunload", this.handleClosingPopUp);
    };

    handleClosingPopUp = () => {
        this._popUpWindow?.close();
        this.setState(
            {
                showPreviewPopUp: false,
            },
            () => this.initiatePreviewArea()
        );
    };

    initiatePreviewArea = (canvas: HTMLCanvasElement = this.props.globalState.hostDocument.getElementById("sfe-preview-canvas") as HTMLCanvasElement) => {
        if (canvas && this.props.globalState.onNewEngine) {
            const engine = InitializePreview(canvas, this.props.globalState.forceWebGL1);
            this.props.globalState.engine = engine;
            this.props.globalState.onNewEngine(engine);
        }
    };

    createPopUp = () => {
        const userOptions = {
            original: true,
            popup: true,
            overlay: false,
            embedMode: false,
            enableClose: true,
            handleResize: true,
            enablePopup: true,
        };
        const options = {
            embedHostWidth: "100%",
            ...userOptions,
        };
        let popUpWindow: Nullable<Window> = null;
        CreatePopup("PREVIEW AREA", {
            width: 500,
            height: 500,
            onParentControlCreateCallback: (parentControl) => {
                if (parentControl) {
                    parentControl.style.display = "grid";
                    parentControl.style.gridTemplateRows = "40px auto";
                    parentControl.id = "filter-editor-graph-root";
                    parentControl.className = "nme-right-panel popup";
                }
            },
            onWindowCreateCallback: (w) => {
                popUpWindow = w;
                if (popUpWindow) {
                    popUpWindow.addEventListener("beforeunload", this.handleClosingPopUp);
                    popUpWindow.addEventListener("resize", () => {
                        this.props.globalState.engine?.resize();
                    });
                    const parentControl = popUpWindow.document.getElementById("filter-editor-graph-root");
                    this.createPreviewAreaControlHost(options, parentControl);
                    this.createPreviewHost(options, parentControl);
                    if (parentControl) {
                        this.fixPopUpStyles(parentControl.ownerDocument!);
                        this.initiatePreviewArea(parentControl.ownerDocument!.getElementById("sfe-preview-canvas") as HTMLCanvasElement);
                    }
                }
            },
        });
    };

    createPreviewAreaControlHost = (options: IInternalPreviewAreaOptions, parentControl: Nullable<HTMLElement>) => {
        // Prepare the preview control host
        if (parentControl) {
            const host = parentControl.ownerDocument!.createElement("div");

            host.id = "PreviewAreaControl-host";
            host.style.width = options.embedHostWidth || "auto";

            parentControl.appendChild(host);
            const previewAreaControlComponentHost = react.createElement(PreviewAreaControlComponent, {
                globalState: this.props.globalState,
                togglePreviewAreaComponent: this.handlePopUp,
                allowPreviewFillMode: true,
            });
            reactDOM.render(previewAreaControlComponentHost, host);
        }
    };

    createPreviewHost = (options: IInternalPreviewAreaOptions, parentControl: Nullable<HTMLElement>) => {
        // Prepare the preview host
        if (parentControl) {
            const host = parentControl.ownerDocument!.createElement("div");

            host.id = "PreviewAreaComponent-host";
            host.style.width = options.embedHostWidth || "auto";
            host.style.height = "100%";
            host.style.overflow = "hidden";
            host.style.display = "grid";
            host.style.gridRow = "2";
            host.style.gridTemplateRows = "auto";

            parentControl.appendChild(host);

            this._previewHost = host;

            if (!options.overlay) {
                this._previewHost.style.position = "relative";
            }
        }

        if (this._previewHost) {
            const previewAreaComponentHost = react.createElement(PreviewAreaComponent, {
                globalState: this.props.globalState,
                allowPreviewFillMode: true,
            });
            reactDOM.render(previewAreaComponentHost, this._previewHost);
        }
    };

    fixPopUpStyles = (document: Document) => {
        const previewContainer = document.getElementById("preview");
        if (previewContainer) {
            previewContainer.style.height = "auto";
            previewContainer.style.gridRow = "1";
        }
        const previewConfigBar = document.getElementById("preview-config-bar");
        if (previewConfigBar) {
            previewConfigBar.style.gridRow = "2";
        }
        const newWindowButton = document.getElementById("preview-new-window");
        if (newWindowButton) {
            newWindowButton.style.display = "none";
        }
    };

    override render() {
        return (
            <Portal globalState={this.props.globalState}>
                <SplitContainer
                    id="filter-editor-graph-root"
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
                        className="diagram-container"
                        direction={SplitDirection.Vertical}
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
                                return this.appendBlock(nodeData.data as BaseBlock);
                            }}
                        />
                        <Splitter size={8} minSize={40} initialSize={120} maxSize={500} controlledSide={ControlledSize.Second} />
                        <LogComponent globalState={this.props.globalState} />
                    </SplitContainer>

                    <Splitter size={8} minSize={250} initialSize={300} maxSize={500} controlledSide={ControlledSize.Second} />

                    {/* Property tab */}
                    <SplitContainer className="right-panel" direction={SplitDirection.Vertical}>
                        <PropertyTabComponent lockObject={this.props.globalState.lockObject} globalState={this.props.globalState} />
                        {this.props.globalState.onNewEngine && (
                            <>
                                <Splitter size={8} minSize={200} initialSize={300} maxSize={800} controlledSide={ControlledSize.Second} />
                                <div className="nme-preview-part">
                                    {!this.state.showPreviewPopUp ? (
                                        <PreviewAreaControlComponent
                                            globalState={this.props.globalState}
                                            togglePreviewAreaComponent={this.handlePopUp}
                                            allowPreviewFillMode={false}
                                        />
                                    ) : null}
                                    {!this.state.showPreviewPopUp ? <PreviewAreaComponent globalState={this.props.globalState} allowPreviewFillMode={false} /> : null}
                                </div>
                            </>
                        )}
                    </SplitContainer>
                </SplitContainer>
                <MessageDialog message={this.state.message} isError={this.state.isError} onClose={() => this.setState({ message: "" })} />
                <div className="blocker">Smart Filter Editor only runs on desktops</div>
            </Portal>
        );
    }
}
