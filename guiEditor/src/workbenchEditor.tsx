import * as React from "react";
import { GlobalState } from './globalState';
import { NodeListComponent } from './components/nodeList/nodeListComponent';
import { PropertyTabComponent } from './components/propertyTab/propertyTabComponent';
import { Portal } from './portal';
import { LogComponent, LogEntry } from './components/log/logComponent';
import { DataStorage } from 'babylonjs/Misc/dataStorage';
import { Nullable } from 'babylonjs/types';
import { MessageDialogComponent } from './sharedComponents/messageDialog';
import { BlockTools } from './blockTools';
import { PreviewManager } from './components/preview/previewManager';
import { IEditorData } from './nodeLocationInfo';
import { PreviewMeshControlComponent } from './components/preview/previewMeshControlComponent';
import { PreviewAreaComponent } from './components/preview/previewAreaComponent';
import { SerializationTools } from './serializationTools';
import { WorkbenchComponent } from './diagram/workbench';
import { GUINode } from './diagram/graphNode';
import * as ReactDOM from 'react-dom';
import { IInspectorOptions } from "babylonjs/Debug/debugLayer";
import { _TypeStore } from 'babylonjs/Misc/typeStore';

require("./main.scss");

interface IGraphEditorProps {
    globalState: GlobalState;
}

interface IGraphEditorState {
    showPreviewPopUp: boolean;
};

interface IInternalPreviewAreaOptions extends IInspectorOptions {
    popup: boolean;
    original: boolean;
    explorerWidth?: string;
    inspectorWidth?: string;
    embedHostWidth?: string;
}

export class WorkbenchEditor extends React.Component<IGraphEditorProps, IGraphEditorState> {
    private _workbenchCanvas: WorkbenchComponent;

    private _startX: number;
    private _moveInProgress: boolean;

    private _leftWidth = DataStorage.ReadNumber("LeftWidth", 200);
    private _rightWidth = DataStorage.ReadNumber("RightWidth", 300);

    private _blocks = new Array<BABYLON.GUI.Container | BABYLON.GUI.Control>();

    private _previewManager: PreviewManager;
    //private _mouseLocationX = 0;
    //private _mouseLocationY = 0;
    private _onWidgetKeyUpPointer: any;

    private _previewHost: Nullable<HTMLElement>;
    private _popUpWindow: Window;

    /**
     * Creates a node and recursivly creates its parent nodes from it's input
     * @param nodeMaterialBlock 
     */
    public createNodeFromObject(block: BABYLON.GUI.Control, recursion = true) {
        if (this._blocks.indexOf(block) !== -1) {        
            return this._workbenchCanvas.nodes.filter(n => n.guiNode === block)[0];
        }

        this._blocks.push(block);

        // Graph
        const node = null;// this._workbenchCanvas.appendBlock(block);


        return node;
    }
    
    addValueNode(type: string) {
        //let nodeType: NodeMaterialBlockConnectionPointTypes = BlockTools.GetConnectionNodeTypeFromString(type);

        //let newInputBlock = new InputBlock(type, undefined, nodeType);
        //return this.createNodeFromObject(newInputBlock);
    }

    componentDidMount() {
        if (this.props.globalState.hostDocument) {
            this._workbenchCanvas = (this.refs["graphCanvas"] as WorkbenchComponent);
           // this._previewManager = new PreviewManager(this.props.globalState.hostDocument.getElementById("preview-canvas") as HTMLCanvasElement, this.props.globalState);
        }

        if (navigator.userAgent.indexOf("Mobile") !== -1) {
            ((this.props.globalState.hostDocument || document).querySelector(".blocker") as HTMLElement).style.visibility = "visible";
        }

        this.build();
    }

    componentWillUnmount() {
        if (this.props.globalState.hostDocument) {
            this.props.globalState.hostDocument!.removeEventListener("keyup", this._onWidgetKeyUpPointer, false);
        }

        if (this._previewManager) {
            this._previewManager.dispose();
        }
    }

    constructor(props: IGraphEditorProps) {
        super(props);

        this.state = {
            showPreviewPopUp: false
        };

        this.props.globalState.onRebuildRequiredObservable.add(() => {
            if (this.props.globalState.nodeMaterial) {
                this.buildMaterial();
            }
        });

        this.props.globalState.onResetRequiredObservable.add(() => {
            this.build();
            if (this.props.globalState.nodeMaterial) {
                this.buildMaterial();
            }
        });

        this.props.globalState.onImportFrameObservable.add((source: any) => {
            /*const frameData = source.editorData.frames[0];

            // create new graph nodes for only blocks from frame (last blocks added)
            this.props.globalState.nodeMaterial.attachedBlocks.slice(-(frameData.blocks.length)).forEach((block: NodeMaterialBlock) => {
                this.createNodeFromObject();
            });
            this.reOrganize(this.props.globalState.nodeMaterial.editorData, true);*/
        })

        this.props.globalState.onZoomToFitRequiredObservable.add(() => {
            this.zoomToFit();
        });

        this.props.globalState.onReOrganizedRequiredObservable.add(() => {
            this.reOrganize();
        });

        /*this.props.globalState.onGetNodeFromBlock = (block) => {
             return this._workbenchCanvas.findNodeFromBlock(block);
        }*/

        this.props.globalState.hostDocument!.addEventListener("keydown", evt => {
            if ((evt.keyCode === 46 || evt.keyCode === 8) && !this.props.globalState.blockKeyboardEvents) { // Delete                
                let selectedItems = this._workbenchCanvas.selectedGuiNodes;

                for (var selectedItem of selectedItems) {
                    selectedItem.dispose();

                    //let targetBlock = selectedItem.block;
                    //this.props.globalState.nodeMaterial!.removeBlock(targetBlock);
                    //let blockIndex = this._blocks.indexOf(targetBlock);

                    //if (blockIndex > -1) {
                    //    this._blocks.splice(blockIndex, 1);
                    //}                                  
                }
               
                this.props.globalState.onSelectionChangedObservable.notifyObservers(null);  
                this.props.globalState.onRebuildRequiredObservable.notifyObservers();  
                return;
            }

            if (!evt.ctrlKey || this.props.globalState.blockKeyboardEvents) {
                return;
            }

            if (evt.key === "c") { // Copy
              
                let selectedItems = this._workbenchCanvas.selectedNodes;
                if (!selectedItems.length) {
                    return;
                }
    
                let selectedItem = selectedItems[0] as GUINode;
    
                if (!selectedItem.guiNode) {
                    return;
                }

            } else if (evt.key === "v") { // Paste
                //const rootElement = this.props.globalState.hostDocument!.querySelector(".diagram-container") as HTMLDivElement;
                //const zoomLevel = this._workbenchCanvas.zoom;
                //let currentY = (this._mouseLocationY - rootElement.offsetTop - this._workbenchCanvas.y - 20) / zoomLevel;

            }

        }, false);
    }

    pasteSelection(copiedNodes: GUINode[], currentX: number, currentY: number, selectNew = false) {

        //let originalNode: Nullable<GUINode> = null;

        let newNodes:GUINode[] = [];

        // Copy to prevent recursive side effects while creating nodes.
        copiedNodes = copiedNodes.slice();

        // Cancel selection        
        this.props.globalState.onSelectionChangedObservable.notifyObservers(null);

        // Create new nodes
        for (var node of copiedNodes) {
            let block = node.guiNode;

            if (!block) {
                continue;
            }

            let clone = null;//block.clone(this.props.globalState.nodeMaterial.getScene());

            if (!clone) {
                return;
            }

            //let newNode = this.createNodeFromObject(clone, false);

            /*let x = 0;
            let y = 0;
            if (originalNode) {
                x = currentX + node.x - originalNode.x;
                y = currentY + node.y - originalNode.y;
            } else {
                originalNode = node;
                x = currentX;
                y = currentY;
            }*/

            /*newNode.x = x;
            newNode.y = y;
            newNode.cleanAccumulation();

            newNodes.push(newNode);

            if (selectNew) {
                this.props.globalState.onSelectionChangedObservable.notifyObservers(newNode);
            }*/
        }

        return newNodes;
    }

    zoomToFit() {
        this._workbenchCanvas.zoomToFit();
    }

    buildMaterial() {
        if (!this.props.globalState.nodeMaterial) {
            return;
        }

        try {
            this.props.globalState.nodeMaterial.options.emitComments = true;
            this.props.globalState.nodeMaterial.build(true);
            this.props.globalState.onLogRequiredObservable.notifyObservers(new LogEntry("Node material build successful", false));
        }
        catch (err) {
            this.props.globalState.onLogRequiredObservable.notifyObservers(new LogEntry(err, true));
        }

        SerializationTools.UpdateLocations(this.props.globalState.nodeMaterial, this.props.globalState);

        this.props.globalState.onBuiltObservable.notifyObservers();
    }

    build() {        
        let editorData = this.props.globalState.nodeMaterial.editorData;        
        this._workbenchCanvas._isLoading = true; // Will help loading large graphes

        if (editorData instanceof Array) {
            editorData = {
                locations: editorData
            }
        }

        // setup the diagram model
        this._blocks = [];
        this._workbenchCanvas.reset();

        // Load graph of nodes from the material
        if (this.props.globalState.nodeMaterial) {
            this.loadGraph()
        }

        this.reOrganize(editorData);
    }

    loadGraph() {
        var material = this.props.globalState.nodeMaterial;
        material._vertexOutputNodes.forEach((n: any) => {
            this.createNodeFromObject(n, true);
        });
        material._fragmentOutputNodes.forEach((n: any) => {
            this.createNodeFromObject(n, true);
        });

        material.attachedBlocks.forEach((n: any) => {
            this.createNodeFromObject(n, true);
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
        this._workbenchCanvas._isLoading = true; // Will help loading large graphes

        setTimeout(() => {
            if (!editorData || !editorData.locations) {
                this._workbenchCanvas.distributeGraph();
            } else {
                // Locations
                for (var location of editorData.locations) {
                    for (var node of this._workbenchCanvas.nodes) {
                        if (node.guiNode && node.guiNode.uniqueId === location.blockId) {
                            node.x = location.x;
                            node.y = location.y;
                            node.cleanAccumulation();
                            break;
                        }
                    }
                }
                
                if (!isImportingAFrame){
                    this._workbenchCanvas.processEditorData(editorData);
                }
            }

            this._workbenchCanvas._isLoading = false;
            for (var node of this._workbenchCanvas.nodes) {
            }
            this.hideWaitScreen();
        });
    }

    onPointerDown(evt: React.PointerEvent<HTMLDivElement>) {
        this._startX = evt.clientX;
        this._moveInProgress = true;
        evt.currentTarget.setPointerCapture(evt.pointerId);
    }

    onPointerUp(evt: React.PointerEvent<HTMLDivElement>) {
        this._moveInProgress = false;
        evt.currentTarget.releasePointerCapture(evt.pointerId);
    }

    resizeColumns(evt: React.PointerEvent<HTMLDivElement>, forLeft = true) {
        if (!this._moveInProgress) {
            return;
        }

        const deltaX = evt.clientX - this._startX;
        const rootElement = evt.currentTarget.ownerDocument!.getElementById("node-editor-graph-root") as HTMLDivElement;

        if (forLeft) {
            this._leftWidth += deltaX;
            this._leftWidth = Math.max(150, Math.min(400, this._leftWidth));
            DataStorage.WriteNumber("LeftWidth", this._leftWidth);
        } else {
            this._rightWidth -= deltaX;
            this._rightWidth = Math.max(250, Math.min(500, this._rightWidth));
            DataStorage.WriteNumber("RightWidth", this._rightWidth);
            rootElement.ownerDocument!.getElementById("preview")!.style.height = this._rightWidth + "px";
        }

        rootElement.style.gridTemplateColumns = this.buildColumnLayout();

        this._startX = evt.clientX;
    }

    buildColumnLayout() {
        return `${this._leftWidth}px 4px calc(100% - ${this._leftWidth + 8 + this._rightWidth}px) 4px ${this._rightWidth}px`;
    }

    emitNewBlock(event: React.DragEvent<HTMLDivElement>) {
        var data = event.dataTransfer.getData("babylonjs-material-node") as string;

        let guiElement = BlockTools.GetGuiFromString(data);

        //guiElement.background = "#138016FF";

        let newGuiNode = this._workbenchCanvas.appendBlock(guiElement);
        
        /*let x = event.clientX;// - event.currentTarget.offsetLeft - this._workbenchCanvas.x;
        let y = event.clientY;// - event.currentTarget.offsetTop - this._workbenchCanvas.y - 20; 

        newGuiNode.x += (x - newGuiNode.x);
        newGuiNode.y += y - newGuiNode.y;
        //newGuiNode.cleanAccumulation();*/

        this.props.globalState.onSelectionChangedObservable.notifyObservers(null);
        this.props.globalState.onSelectionChangedObservable.notifyObservers(newGuiNode);

        this.forceUpdate();
    }

    handlePopUp = () => {
        this.setState({
            showPreviewPopUp : true
        });
        this.createPopUp();
        this.props.globalState.hostWindow.addEventListener('beforeunload', this.handleClosingPopUp);
    }

    handleClosingPopUp = () => {
        this._previewManager.dispose();
        this._popUpWindow.close();
        this.setState({
            showPreviewPopUp: false
        }, () => this.initiatePreviewArea()
        );
    }

    initiatePreviewArea = (canvas: HTMLCanvasElement = this.props.globalState.hostDocument.getElementById("preview-canvas") as HTMLCanvasElement) => {
        this._previewManager =  new PreviewManager(canvas, this.props.globalState);
    }

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
            ...userOptions
        };
        const popUpWindow = this.createPopupWindow("PREVIEW AREA", "_PreviewHostWindow");
        if (popUpWindow) {
            popUpWindow.addEventListener('beforeunload',  this.handleClosingPopUp);
            const parentControl = popUpWindow.document.getElementById('node-editor-graph-root');
            this.createPreviewMeshControlHost(options, parentControl);
            this.createPreviewHost(options, parentControl);
            if (parentControl) {
                this.fixPopUpStyles(parentControl.ownerDocument!);
                this.initiatePreviewArea(parentControl.ownerDocument!.getElementById("preview-canvas") as HTMLCanvasElement);
            }
        }
    }

    createPopupWindow = (title: string, windowVariableName: string, width = 500, height = 500): Window | null => {
        const windowCreationOptionsList = {
            width: width,
            height: height,
            top: (this.props.globalState.hostWindow.innerHeight - width) / 2 + window.screenY,
            left: (this.props.globalState.hostWindow.innerWidth - height) / 2 + window.screenX
        };

        var windowCreationOptions = Object.keys(windowCreationOptionsList)
            .map(
                (key) => key + '=' + (windowCreationOptionsList as any)[key]
            )
            .join(',');

        const popupWindow = this.props.globalState.hostWindow.open("", title, windowCreationOptions);
        if (!popupWindow) {
            return null;
        }

        const parentDocument = popupWindow.document;

        parentDocument.title = title;
        parentDocument.body.style.width = "100%";
        parentDocument.body.style.height = "100%";
        parentDocument.body.style.margin = "0";
        parentDocument.body.style.padding = "0";

        let parentControl = parentDocument.createElement("div");
        parentControl.style.width = "100%";
        parentControl.style.height = "100%";
        parentControl.style.margin = "0";
        parentControl.style.padding = "0";
        parentControl.style.display = "grid";
        parentControl.style.gridTemplateRows = "40px auto";
        parentControl.id = 'node-editor-graph-root';
        parentControl.className = 'right-panel';

        popupWindow.document.body.appendChild(parentControl);

        this.copyStyles(this.props.globalState.hostWindow.document, parentDocument);

        (this as any)[windowVariableName] = popupWindow;

        this._popUpWindow = popupWindow;

        return popupWindow;
    }

    copyStyles = (sourceDoc: HTMLDocument, targetDoc: HTMLDocument) => {
        const styleContainer = [];
        for (var index = 0; index < sourceDoc.styleSheets.length; index++) {
            var styleSheet: any = sourceDoc.styleSheets[index];
            try {
                if (styleSheet.href) { // for <link> elements loading CSS from a URL
                    const newLinkEl = sourceDoc.createElement('link');

                    newLinkEl.rel = 'stylesheet';
                    newLinkEl.href = styleSheet.href;
                    targetDoc.head!.appendChild(newLinkEl);
                    styleContainer.push(newLinkEl);
                }
                else if (styleSheet.cssRules) { // for <style> elements
                    const newStyleEl = sourceDoc.createElement('style');

                    for (var cssRule of styleSheet.cssRules) {
                        newStyleEl.appendChild(sourceDoc.createTextNode(cssRule.cssText));
                    }

                    targetDoc.head!.appendChild(newStyleEl);
                    styleContainer.push(newStyleEl);
                } 
            } catch (e) {
                console.log(e);
            }
        }
    }

    createPreviewMeshControlHost = (options: IInternalPreviewAreaOptions, parentControl: Nullable<HTMLElement>) => {
        // Prepare the preview control host
        if (parentControl) {

            const host = parentControl.ownerDocument!.createElement("div");

            host.id = "PreviewMeshControl-host";
            host.style.width = options.embedHostWidth || "auto";

            parentControl.appendChild(host);
            const PreviewMeshControlComponentHost = React.createElement(PreviewMeshControlComponent, {
                globalState: this.props.globalState,
                togglePreviewAreaComponent: this.handlePopUp
            });
            ReactDOM.render(PreviewMeshControlComponentHost, host);
        }
    }

    createPreviewHost = (options: IInternalPreviewAreaOptions, parentControl: Nullable<HTMLElement>) => {
        // Prepare the preview host
        if (parentControl) {
            const host = parentControl.ownerDocument!.createElement("div");

            host.id = "PreviewAreaComponent-host";
            host.style.width = options.embedHostWidth || "auto";
            host.style.display = "grid";
            host.style.gridRow = '2';
            host.style.gridTemplateRows = "auto 40px";

            parentControl.appendChild(host);

            this._previewHost = host;

            if (!options.overlay) {
                this._previewHost.style.position = "relative";
            }
        }

        if (this._previewHost) {
            const PreviewAreaComponentHost = React.createElement(PreviewAreaComponent, {
                globalState: this.props.globalState,
                width: 200
            });
            ReactDOM.render(PreviewAreaComponentHost, this._previewHost);
        }
    }

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
        const newWindowButton = document.getElementById('preview-new-window');
        if (newWindowButton) {
            newWindowButton.style.display = 'none';
        }
        const previewMeshBar = document.getElementById('preview-mesh-bar');
        if (previewMeshBar) {
            previewMeshBar.style.gridTemplateColumns = "auto 1fr 40px 40px";
        }
    }

    render() {
        return (
            <Portal globalState={this.props.globalState}>
                <div id="node-editor-graph-root" style={
                    {
                        gridTemplateColumns: this.buildColumnLayout()
                    }}
                    onMouseMove={evt => {                
                       // this._mouseLocationX = evt.pageX;
                       // this._mouseLocationY = evt.pageY;
                    }}
                    onMouseDown={(evt) => {
                        if ((evt.target as HTMLElement).nodeName === "INPUT") {
                            return;
                        }
                        this.props.globalState.blockKeyboardEvents = false;
                    }}
                    >
                    {/* Node creation menu */}
                    <NodeListComponent globalState={this.props.globalState} />

                    <div id="leftGrab"
                        onPointerDown={evt => this.onPointerDown(evt)}
                        onPointerUp={evt => this.onPointerUp(evt)}
                        onPointerMove={evt => this.resizeColumns(evt)}
                    ></div>

                    {/* The node graph diagram */}
                    <div className="diagram-container"
                        onDrop={event => {
                            this.emitNewBlock(event);
                        }}
                        onDragOver={event => {
                            event.preventDefault();
                        }}
                    >                        
                        <WorkbenchComponent ref={"graphCanvas"} globalState={this.props.globalState}/>
                    </div>

                    <div id="rightGrab"
                        onPointerDown={evt => this.onPointerDown(evt)}
                        onPointerUp={evt => this.onPointerUp(evt)}
                        onPointerMove={evt => this.resizeColumns(evt, false)}
                    ></div>

                    {/* Property tab */}
                    <div className="right-panel">
                        <PropertyTabComponent globalState={this.props.globalState} />
                       
                    </div>

                    <LogComponent globalState={this.props.globalState} />
                </div>                
                <MessageDialogComponent globalState={this.props.globalState} />
                <div className="blocker">
                    Node Material Editor runs only on desktop
                </div>
                <div className="wait-screen hidden">
                    Processing...please wait
                </div>
            </Portal>
        );
    }
}