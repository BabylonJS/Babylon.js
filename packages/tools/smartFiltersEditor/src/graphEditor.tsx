import * as react from "react";
import * as reactDOM from "react-dom";

import { PreviewAspectRatioKey, PreviewFillContainerKey, type GlobalState } from "./globalState.js";
import "./assets/styles/main.scss";

import { Portal } from "./portal.js";

import { MessageDialog } from "@babylonjs/shared-ui-components/components/MessageDialog.js";
import { GraphCanvasComponent } from "@babylonjs/shared-ui-components/nodeGraphSystem/graphCanvas.js";
import { LogComponent, LogEntry } from "./components/log/logComponent.js";
import { TypeLedger } from "@babylonjs/shared-ui-components/nodeGraphSystem/typeLedger.js";
import { BlockTools } from "./blockTools.js";
import { PropertyTabComponent } from "./components/propertyTab/propertyTabComponent.js";
import { NodeListComponent } from "./components/nodeList/nodeListComponent.js";
import { createDefaultInput } from "./graphSystem/registerDefaultInput.js";
import type { INodeData } from "@babylonjs/shared-ui-components/nodeGraphSystem/interfaces/nodeData";
import type { IEditorData } from "@babylonjs/shared-ui-components/nodeGraphSystem/interfaces/nodeLocationInfo";
import type { Nullable } from "@babylonjs/core/types";
import type { BaseBlock, SmartFilter } from "@babylonjs/smart-filters";
import { inputsNamespace } from "@babylonjs/smart-filters-blocks";
import { setEditorData } from "./helpers/serializationTools.js";
import { SplitContainer } from "@babylonjs/shared-ui-components/split/splitContainer.js";
import { Splitter } from "@babylonjs/shared-ui-components/split/splitter.js";
import { ControlledSize, SplitDirection } from "@babylonjs/shared-ui-components/split/splitContext.js";
import { PreviewAreaComponent } from "./components/preview/previewAreaComponent.js";
import { initializePreview } from "./initializePreview.js";
import { PreviewAreaControlComponent } from "./components/preview/previewAreaControlComponent.js";
import { CreatePopup } from "@babylonjs/shared-ui-components/popupHelper.js";
import type { IInspectorOptions } from "@babylonjs/core/Debug/debugLayer.js";
import { decodeBlockKey } from "./helpers/blockKeyConverters.js";
import { OutputBlockName } from "./configuration/constants.js";
import type { BlockNodeData } from "./graphSystem/blockNodeData";
import { DataStorage } from "@babylonjs/core/Misc/dataStorage.js";
import { OnlyShowCustomBlocksDefaultValue } from "./constants.js";
import { ThinEngine } from "@babylonjs/core/Engines/thinEngine.js";

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

export class GraphEditor extends react.Component<IGraphEditorProps, IGraphEditorState> {
    private _graphCanvasRef: react.RefObject<GraphCanvasComponent>;
    private _diagramContainerRef: react.RefObject<HTMLDivElement>;
    private _graphCanvas!: GraphCanvasComponent;
    private _diagramContainer!: HTMLDivElement;
    private _canvasResizeObserver: Nullable<ResizeObserver> = null;

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

    createInputBlock(blockTypeAndNamespace: string) {
        const { blockType } = decodeBlockKey(blockTypeAndNamespace);
        const nodeType = BlockTools.GetConnectionNodeTypeFromString(blockType);

        const newInputBlock = createDefaultInput(
            this.props.globalState.smartFilter,
            nodeType,
            this.props.globalState.engine
        );

        return newInputBlock;
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
            this._diagramContainer = this._diagramContainerRef.current!;
            const canvas = this.props.globalState.hostDocument.getElementById(
                "sfe-preview-canvas"
            ) as HTMLCanvasElement;
            if (canvas && this.props.globalState.onNewEngine) {
                const engine = initializePreview(canvas, this.props.globalState.forceWebGL1);
                const versionToLog = `Babylon.js v${ThinEngine.Version} - WebGL${engine.webGLVersion}`;
                this.props.globalState.onLogRequiredObservable.notifyObservers(new LogEntry(versionToLog, false));
                this.props.globalState.engine = engine;
                this.props.globalState.onNewEngine(engine);
                this._canvasResizeObserver.observe(canvas);
            }
        }

        if (navigator.userAgent.indexOf("Mobile") !== -1) {
            ((this.props.globalState.hostDocument || document).querySelector(".blocker") as HTMLElement).style.display =
                "grid";
        }

        this.props.globalState.onPopupClosedObservable.addOnce(() => {
            this.componentWillUnmount();
        });

        this.props.globalState.onSmartFilterLoadedObservable?.add((smartFilter: SmartFilter) => {
            this.props.globalState.smartFilter = smartFilter;
            this.props.globalState.onResetRequiredObservable.notifyObservers(false);
        });

        this.props.globalState.onlyShowCustomBlocksObservable.notifyObservers(
            DataStorage.ReadBoolean("OnlyShowCustomBlocks", OnlyShowCustomBlocksDefaultValue)
        );
        this.props.globalState.previewAspectRatio.onChangedObservable.add((newValue: string) => {
            localStorage.setItem(PreviewAspectRatioKey, newValue);
        });
        this.props.globalState.previewFillContainer.onChangedObservable.add((newValue: boolean) => {
            localStorage.setItem(PreviewFillContainerKey, newValue ? "true" : "");
        });

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
            (eventData: {
                type: string;
                targetX: number;
                targetY: number;
                needRepositioning?: boolean | undefined;
            }) => {
                let targetX = eventData.targetX;
                let targetY = eventData.targetY;

                if (eventData.needRepositioning) {
                    targetX = targetX - this._diagramContainer.offsetLeft;
                    targetY = targetY - this._diagramContainer.offsetTop;
                }

                this.emitNewBlock(eventData.type, targetX, targetY);
            }
        );

        this.props.globalState.stateManager.onRebuildRequiredObservable.add(async () => {
            this.props.globalState.rebuildRuntime?.();
        });

        this.props.globalState.onSaveEditorDataRequiredObservable.add(() => {
            setEditorData(this.props.globalState.smartFilter, this.props.globalState, this._graphCanvas);
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
            // If one of the selected nodes is an OutputBlock, and the keypress is delete, remove the OutputBlock from the selected list
            if (evt.keyCode === 46 || evt.keyCode === 8) {
                const indexOfOutputBlock = this._graphCanvas.selectedNodes.findIndex(
                    (node) => (node.content as BlockNodeData).data.isOutput
                );
                if (indexOfOutputBlock !== -1) {
                    this._graphCanvas.selectedNodes.splice(indexOfOutputBlock, 1);

                    // If there are none left, notify that the selection changed, because handleKeyDown will
                    // not do it since there is nothing selected any longer
                    if (this._graphCanvas.selectedNodes.length === 0) {
                        this.props.globalState.stateManager.onSelectionChangedObservable.notifyObservers(null);
                    }
                }
            }

            this._graphCanvas.handleKeyDown(
                evt,
                (nodeData) => {
                    if (!nodeData.data.isOutput) {
                        const block = nodeData.data as BaseBlock;
                        this.props.globalState.smartFilter!.removeBlock(block);
                    }
                },
                this._mouseLocationX,
                this._mouseLocationY,
                (_nodeData) => {
                    // TODO manage paste
                    // const block = nodeData.data as SmartFilterBlock;
                    // const clone = block.clone(this.props.globalState.smartFilter);
                    // if (!clone) {
                    //     return null;
                    // }
                    // return this.appendBlock(clone, false);
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

    async emitNewBlock(blockTypeAndNamespace: string, targetX: number, targetY: number) {
        const { blockType, namespace } = decodeBlockKey(blockTypeAndNamespace);

        let block: Nullable<BaseBlock> = null;

        // First try the block registrations provided to the editor
        if (this.props.globalState.engine && this.props.globalState.blockEditorRegistration) {
            block = await this.props.globalState.blockEditorRegistration.getBlock(
                blockType,
                namespace,
                this.props.globalState.smartFilter,
                this.props.globalState.engine
            );
        }

        // If we haven't created the block yet, see if it's a standard input block
        if (!block && namespace === inputsNamespace) {
            block = this.createInputBlock(blockTypeAndNamespace);
        }

        // If we don't have a block yet, display an error
        if (!block) {
            this.props.globalState.stateManager.onErrorMessageDialogRequiredObservable.notifyObservers(
                `Could not create a block of type ${blockTypeAndNamespace}`
            );
            return;
        }

        // Enforce uniqueness if applicable
        if (
            this.props.globalState.blockEditorRegistration &&
            this.props.globalState.blockEditorRegistration.getIsUniqueBlock(block)
        ) {
            const className = block.getClassName();
            for (const other of this._graphCanvas.getCachedData()) {
                if (other !== block && other.getClassName() === className) {
                    this.props.globalState.stateManager.onErrorMessageDialogRequiredObservable.notifyObservers(
                        `You can only have one ${className} per graph`
                    );
                    return;
                }
            }
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

        this.emitNewBlock(
            data,
            event.clientX - this._diagramContainer.offsetLeft,
            event.clientY - this._diagramContainer.offsetTop
        );
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

    initiatePreviewArea = (
        canvas: HTMLCanvasElement = this.props.globalState.hostDocument.getElementById(
            "sfe-preview-canvas"
        ) as HTMLCanvasElement
    ) => {
        if (canvas && this.props.globalState.onNewEngine) {
            const engine = initializePreview(canvas, this.props.globalState.forceWebGL1);
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
                        this.initiatePreviewArea(
                            parentControl.ownerDocument!.getElementById("sfe-preview-canvas") as HTMLCanvasElement
                        );
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

                    <Splitter
                        size={8}
                        minSize={180}
                        initialSize={200}
                        maxSize={350}
                        controlledSide={ControlledSize.First}
                    />

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
                        <Splitter
                            size={8}
                            minSize={40}
                            initialSize={120}
                            maxSize={500}
                            controlledSide={ControlledSize.Second}
                        />
                        <LogComponent globalState={this.props.globalState} />
                    </SplitContainer>

                    <Splitter
                        size={8}
                        minSize={250}
                        initialSize={300}
                        maxSize={500}
                        controlledSide={ControlledSize.Second}
                    />

                    {/* Property tab */}
                    <SplitContainer className="right-panel" direction={SplitDirection.Vertical}>
                        <PropertyTabComponent
                            lockObject={this.props.globalState.lockObject}
                            globalState={this.props.globalState}
                        />
                        {this.props.globalState.onNewEngine && (
                            <>
                                <Splitter
                                    size={8}
                                    minSize={200}
                                    initialSize={300}
                                    maxSize={800}
                                    controlledSide={ControlledSize.Second}
                                />
                                <div className="nme-preview-part">
                                    {!this.state.showPreviewPopUp ? (
                                        <PreviewAreaControlComponent
                                            globalState={this.props.globalState}
                                            togglePreviewAreaComponent={this.handlePopUp}
                                            allowPreviewFillMode={false}
                                        />
                                    ) : null}
                                    {!this.state.showPreviewPopUp ? (
                                        <PreviewAreaComponent
                                            globalState={this.props.globalState}
                                            allowPreviewFillMode={false}
                                        />
                                    ) : null}
                                </div>
                            </>
                        )}
                    </SplitContainer>
                </SplitContainer>
                <MessageDialog
                    message={this.state.message}
                    isError={this.state.isError}
                    onClose={() => this.setState({ message: "" })}
                />
                <div className="blocker">Smart Filter Editor only runs on desktops</div>
            </Portal>
        );
    }
}
