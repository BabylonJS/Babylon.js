import * as React from "react";
import { GlobalState } from "./globalState";
import { PropertyTabComponent } from "./components/propertyTab/propertyTabComponent";
import { Portal } from "./portal";
import { LogComponent } from "./components/log/logComponent";
import { DataStorage } from "babylonjs/Misc/dataStorage";
import { GUINodeTools } from "./guiNodeTools";
import { WorkbenchComponent } from "./diagram/workbench";
import { _TypeStore } from "babylonjs/Misc/typeStore";
import { MessageDialogComponent } from "./sharedComponents/messageDialog";
import { SceneExplorerComponent } from "./components/sceneExplorer/sceneExplorerComponent";
import { Control } from "babylonjs-gui/2D/controls/control";

import { CommandBarComponent } from "./components/commandBarComponent";

require("./main.scss");
require("./scss/header.scss");

interface IGraphEditorProps {
    globalState: GlobalState;
}

interface IGraphEditorState {
    showPreviewPopUp: boolean;
}

export class WorkbenchEditor extends React.Component<IGraphEditorProps, IGraphEditorState> {
    private _workbenchCanvas: WorkbenchComponent;

    private _startX: number;
    private _moveInProgress: boolean;

    private _leftWidth = DataStorage.ReadNumber("LeftWidth", 200);
    private _rightWidth = DataStorage.ReadNumber("RightWidth", 300);

    private _onWidgetKeyUpPointer: any;
    private _popUpWindow: Window;


    componentDidMount() {
        if (this.props.globalState.hostDocument) {
            this._workbenchCanvas = this.refs["workbenchCanvas"] as WorkbenchComponent;
        }

        if (navigator.userAgent.indexOf("Mobile") !== -1) {
            ((this.props.globalState.hostDocument || document).querySelector(".blocker") as HTMLElement).style.visibility = "visible";
        }
    }

    componentWillUnmount() {
        if (this.props.globalState.hostDocument) {
            this.props.globalState.hostDocument!.removeEventListener("keyup", this._onWidgetKeyUpPointer, false);
        }
    }

    constructor(props: IGraphEditorProps) {
        super(props);

        this.state = {
            showPreviewPopUp: false,
        };

        this.props.globalState.hostDocument!.addEventListener(
            "keydown",
            (evt) => {
                if ((evt.keyCode === 46 || evt.keyCode === 8) && !this.props.globalState.blockKeyboardEvents) {
                    // Delete
                }

                if (!evt.ctrlKey || this.props.globalState.blockKeyboardEvents) {
                    return;
                }

                if (evt.key === "c") {
                    // Copy

                    let selectedItems = this._workbenchCanvas.selectedGuiNodes;
                    if (!selectedItems.length) {
                        return;
                    }

                    let selectedItem = selectedItems[0] as Control;

                    if (!selectedItem) {
                        return;
                    }
                } else if (evt.key === "v") {
                    // Paste
                }
            },
            false
        );
    }

    pasteSelection(copiedNodes: Control[], currentX: number, currentY: number, selectNew = false) {
        //let originalNode: Nullable<GUINode> = null;

        let newNodes: Control[] = [];

        // Copy to prevent recursive side effects while creating nodes.
        copiedNodes = copiedNodes.slice();

        // Cancel selection
        this.props.globalState.onSelectionChangedObservable.notifyObservers(null);

        // Create new nodes
        for (var node of copiedNodes) {
            let block = node;

            if (!block) {
                continue;
            }
        }

        return newNodes;
    }

    showWaitScreen() {
        this.props.globalState.hostDocument.querySelector(".wait-screen")?.classList.remove("hidden");
    }

    hideWaitScreen() {
        this.props.globalState.hostDocument.querySelector(".wait-screen")?.classList.add("hidden");
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
        const rootElement = evt.currentTarget.ownerDocument!.getElementById("gui-editor-workbench-root") as HTMLDivElement;

        if (forLeft) {
            this._leftWidth += deltaX;
            this._leftWidth = Math.max(150, Math.min(400, this._leftWidth));
            DataStorage.WriteNumber("LeftWidth", this._leftWidth);
        } else {
            this._rightWidth -= deltaX;
            this._rightWidth = Math.max(250, Math.min(500, this._rightWidth));
            DataStorage.WriteNumber("RightWidth", this._rightWidth);
        }

        rootElement.style.gridTemplateColumns = this.buildColumnLayout();

        this._startX = evt.clientX;
    }

    buildColumnLayout() {
        return `${this._leftWidth}px 4px calc(100% - ${this._leftWidth + 8 + this._rightWidth}px) 4px ${this._rightWidth}px`;
    }

    emitNewBlock(event: React.DragEvent<HTMLDivElement>) {
        var data = event.dataTransfer.getData("babylonjs-gui-node") as string;

        let guiElement = GUINodeTools.CreateControlFromString(data);

        let newGuiNode = this._workbenchCanvas.appendBlock(guiElement);

        this.props.globalState.onSelectionChangedObservable.notifyObservers(null);
        this.props.globalState.onSelectionChangedObservable.notifyObservers(newGuiNode);

        this.forceUpdate();
    }

    handlePopUp = () => {
        this.setState({
            showPreviewPopUp: true,
        });
        this.props.globalState.hostWindow.addEventListener("beforeunload", this.handleClosingPopUp);
    };

    handleClosingPopUp = () => {
        this._popUpWindow.close();
    };

    createPopupWindow = (title: string, windowVariableName: string, width = 500, height = 500): Window | null => {
        const windowCreationOptionsList = {
            width: width,
            height: height,
            top: (this.props.globalState.hostWindow.innerHeight - width) / 2 + window.screenY,
            left: (this.props.globalState.hostWindow.innerWidth - height) / 2 + window.screenX,
        };

        var windowCreationOptions = Object.keys(windowCreationOptionsList)
            .map((key) => key + "=" + (windowCreationOptionsList as any)[key])
            .join(",");

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
        parentControl.id = "gui-editor-workbench-root";
        parentControl.className = "right-panel";

        popupWindow.document.body.appendChild(parentControl);

        this.copyStyles(this.props.globalState.hostWindow.document, parentDocument);

        (this as any)[windowVariableName] = popupWindow;

        this._popUpWindow = popupWindow;

        return popupWindow;
    };

    copyStyles = (sourceDoc: HTMLDocument, targetDoc: HTMLDocument) => {
        const styleContainer = [];
        for (var index = 0; index < sourceDoc.styleSheets.length; index++) {
            var styleSheet: any = sourceDoc.styleSheets[index];
            try {
                if (styleSheet.href) {
                    // for <link> elements loading CSS from a URL
                    const newLinkEl = sourceDoc.createElement("link");

                    newLinkEl.rel = "stylesheet";
                    newLinkEl.href = styleSheet.href;
                    targetDoc.head!.appendChild(newLinkEl);
                    styleContainer.push(newLinkEl);
                } else if (styleSheet.cssRules) {
                    // for <style> elements
                    const newStyleEl = sourceDoc.createElement("style");

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
    };

    render() {
        return (
            <Portal globalState={this.props.globalState}>
                <div id="ge-header">
                    <div className="command-bar">
                        <CommandBarComponent globalState={this.props.globalState} />
                    </div>
                </div>
                <div
                    id="gui-editor-workbench-root"
                    style={{
                        gridTemplateColumns: this.buildColumnLayout(),
                    }}
                    onMouseDown={(evt) => {
                        if ((evt.target as HTMLElement).nodeName === "INPUT") {
                            return;
                        }
                        this.props.globalState.blockKeyboardEvents = false;
                    }}>
                    {/* Node creation menu */}

                    <div id="leftGrab" onPointerDown={(evt) => this.onPointerDown(evt)} onPointerUp={(evt) => this.onPointerUp(evt)} onPointerMove={(evt) => this.resizeColumns(evt)}></div>
                    <SceneExplorerComponent globalState={this.props.globalState}></SceneExplorerComponent>
                    {/* The gui workbench diagram */}
                    <div
                        className="diagram-container"
                    >
                        <WorkbenchComponent ref={"workbenchCanvas"} globalState={this.props.globalState} />
                    </div>

                    <div id="rightGrab" onPointerDown={(evt) => this.onPointerDown(evt)} onPointerUp={(evt) => this.onPointerUp(evt)} onPointerMove={(evt) => this.resizeColumns(evt, false)}></div>

                    {/* Property tab */}
                    <div className="right-panel">
                        <PropertyTabComponent globalState={this.props.globalState} />
                    </div>

                    <LogComponent globalState={this.props.globalState} />
                </div>
                <MessageDialogComponent globalState={this.props.globalState} />
                <div className="blocker">GUI Editor runs only on desktop</div>
                <div className="wait-screen hidden">Processing...please wait</div>
            </Portal>
        );
    }
}
