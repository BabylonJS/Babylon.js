import * as React from "react";
import { GlobalState } from "./globalState";
import { PropertyTabComponent } from "./components/propertyTab/propertyTabComponent";
import { Portal } from "./portal";
import { LogComponent } from "./components/log/logComponent";
import { DataStorage } from "babylonjs/Misc/dataStorage";
import { GUINodeTools } from "./guiNodeTools";
import { WorkbenchComponent } from "./diagram/workbench";
import { MessageDialogComponent } from "./sharedComponents/messageDialog";
import { SceneExplorerComponent } from "./components/sceneExplorer/sceneExplorerComponent";
import { CommandBarComponent } from "./components/commandBarComponent";
import { GizmoWrapper } from "./diagram/guiGizmoWrapper";
import { Nullable } from "babylonjs/types";
import { ArtBoardComponent } from './diagram/artBoard';
import { Control } from "babylonjs-gui/2D/controls/control";
import { ControlTypes } from "./controlTypes";

require("./main.scss");
require("./scss/header.scss");

interface IGraphEditorProps {
    globalState: GlobalState;
}

interface IGraphEditorState {
    showPreviewPopUp: boolean;
}

export class WorkbenchEditor extends React.Component<IGraphEditorProps, IGraphEditorState> {
    private _moveInProgress: boolean;

    private _leftWidth = DataStorage.ReadNumber("LeftWidth", 200);
    private _rightWidth = DataStorage.ReadNumber("RightWidth", 300);
    private _toolBarIconSize = 40;

    private _popUpWindow: Window;
    private _draggedItem: Nullable<string>;
    private _rootRef: React.RefObject<HTMLDivElement>;

    componentDidMount() {
        if (navigator.userAgent.indexOf("Mobile") !== -1) {
            ((this.props.globalState.hostDocument || document).querySelector(".blocker") as HTMLElement).style.visibility = "visible";
        }
    }

    constructor(props: IGraphEditorProps) {
        super(props);
        this._rootRef = React.createRef();

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

                if (evt.key === "a") {
                    //all
                    evt.preventDefault();
                }
            },
            false
        );

        this.props.globalState.onBackgroundColorChangeObservable.add(() => this.forceUpdate());
        this.props.globalState.onDropObservable.add(() => {
            if (this._draggedItem != null) {
                this.props.globalState.draggedControl = this.onCreate(this._draggedItem);
            }
            this._draggedItem = null;
        })
    }

    showWaitScreen() {
        this.props.globalState.hostDocument.querySelector(".wait-screen")?.classList.remove("hidden");
    }

    hideWaitScreen() {
        this.props.globalState.hostDocument.querySelector(".wait-screen")?.classList.add("hidden");
    }

    onPointerDown(evt: React.PointerEvent<HTMLDivElement>) {
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

        const rootElement = evt.currentTarget.ownerDocument!.getElementById("gui-editor-workbench-root") as HTMLDivElement;

        const maxWidth = this.props.globalState.hostWindow.innerWidth - this._toolBarIconSize - 8;

        if (forLeft) {
            this._leftWidth = Math.max(150, Math.min(maxWidth - this._rightWidth, evt.clientX - this._rootRef.current!.clientLeft));
            DataStorage.WriteNumber("LeftWidth", this._leftWidth);
        } else {
            this._rightWidth = Math.max(250, Math.min(maxWidth - this._leftWidth, (this._rootRef.current!.clientLeft + this._rootRef.current!.clientWidth) - evt.clientX));
            DataStorage.WriteNumber("RightWidth", this._rightWidth);
        }

        rootElement.style.gridTemplateColumns = this.buildColumnLayout();

        this.props.globalState.onWindowResizeObservable.notifyObservers();
    }

    buildColumnLayout() {
        return `${this._leftWidth}px 4px ${this._toolBarIconSize}px calc(100% - ${this._leftWidth + this._toolBarIconSize + 8 + this._rightWidth}px) ${this._rightWidth}px`;
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
                    }}
                    ref={this._rootRef}
                >
                    {/* Node creation menu */}

                    <div
                        id="leftGrab"
                        onPointerDown={(evt) => this.onPointerDown(evt)}
                        onPointerUp={(evt) => this.onPointerUp(evt)}
                        onPointerMove={(evt) => this.resizeColumns(evt)}
                    ></div>
                    <SceneExplorerComponent globalState={this.props.globalState} noExpand={true}></SceneExplorerComponent>
                    {this.createToolbar()}
                    {/* The gui workbench diagram */}
                    <div className="diagram-container"
                        onDrop={(event) => {
                            event.preventDefault();
                            this.props.globalState.onDropObservable.notifyObservers();
                        }}
                        onDragOver={(event) => {
                            event.preventDefault();
                        }}
                        style={{
                            backgroundColor: this.props.globalState.backgroundColor.toHexString()
                        }}>
                        <ArtBoardComponent globalState={this.props.globalState}/>
                        <WorkbenchComponent ref={"workbenchCanvas"} globalState={this.props.globalState} />
                        <GizmoWrapper globalState={this.props.globalState} />
                    </div>
                    {/* Property tab */}
                    <div className="right-panel">
                        <div
                            id="rightGrab"
                            onPointerDown={(evt) => this.onPointerDown(evt)}
                            onPointerUp={(evt) => this.onPointerUp(evt)}
                            onPointerMove={(evt) => this.resizeColumns(evt, false)}
                        ></div>
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

    onCreate(value: string): Control {
        let guiElement = GUINodeTools.CreateControlFromString(value);
        let newGuiNode = this.props.globalState.workbench.appendBlock(guiElement);
        this.props.globalState.select(newGuiNode);
        this.props.globalState.onPointerUpObservable.notifyObservers(null);
        this.forceUpdate();
        return newGuiNode;
    }

    createToolbar() {
        return (
            <>
                <div id="toolbarGrab">
                    {<div className="blackLine"></div>}
                    {
                        <div className={"toolbar-content sub1"}>
                            {ControlTypes.map((type) => {
                                return (
                                    <div
                                        className={"toolbar-label"}
                                        key={type.className}
                                        onDragStart={(evt) => { this._draggedItem = type.className }}
                                        onClick={() => {
                                            this.onCreate(type.className);
                                        }}
                                        title={type.className}
                                    >
                                    {type.icon && (
                                        <div className="toolbar-icon" draggable={true}>
                                            <img src={type.icon} alt={type.className} width="40px" height={"40px"} />
                                        </div>
                                    )}
                                    </div>
                                );
                            })}
                        </div>
                    }
                </div>
            </>
        );
    }
}
