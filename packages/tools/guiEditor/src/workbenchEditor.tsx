import * as React from "react";
import type { GlobalState } from "./globalState";
import { GUIEditorTool } from "./globalState";
import { PropertyTabComponent } from "./components/propertyTab/propertyTabComponent";
import { Portal } from "./portal";
import { LogComponent } from "./components/log/logComponent";
import { DataStorage } from "core/Misc/dataStorage";
import { GUINodeTools } from "./guiNodeTools";
import { WorkbenchComponent } from "./diagram/workbench";
import { MessageDialog } from "shared-ui-components/components/MessageDialog";
import { SceneExplorerComponent } from "./components/sceneExplorer/sceneExplorerComponent";
import { CommandBarComponent } from "./components/commandBarComponent";
import { GizmoWrapper } from "./diagram/gizmoWrapper";
import type { Nullable } from "core/types";
import { ArtBoardComponent } from "./diagram/artBoard";
import type { Control } from "gui/2D/controls/control";
import { ControlTypes } from "./controlTypes";

import "./main.scss";
import "./scss/header.scss";

import toolbarExpandIcon from "./imgs/toolbarExpandIcon.svg";
import toolbarCollapseIcon from "./imgs/toolbarCollapseIcon.svg";
import type { Observer } from "core/Misc/observable";

interface IGraphEditorProps {
    globalState: GlobalState;
    onReady?: () => Promise<void>;
}

interface IGraphEditorState {
    showPreviewPopUp: boolean;
    toolbarExpand: boolean;
    message: string;
}

export class WorkbenchEditor extends React.Component<IGraphEditorProps, IGraphEditorState> {
    private _moveInProgress: boolean;

    private _leftWidth = DataStorage.ReadNumber("LeftWidth", 200);
    private _rightWidth = DataStorage.ReadNumber("RightWidth", 300);

    private _popUpWindow: Window;
    private _draggedItem: Nullable<string>;
    private _rootRef: React.RefObject<HTMLDivElement>;
    private _onErrorMessageObserver: Nullable<Observer<string>>;
    private _workbenchRef: React.RefObject<WorkbenchComponent> = React.createRef();

    override componentDidMount() {
        if (navigator.userAgent.indexOf("Mobile") !== -1) {
            ((this.props.globalState.hostDocument || document).querySelector(".blocker") as HTMLElement).style.visibility = "visible";
        }
        document.addEventListener("keydown", this.addToolControls);
        document.addEventListener("keyup", this.removePressToolControls);
        this.props.onReady?.();
    }

    override componentWillUnmount() {
        document.removeEventListener("keydown", this.addToolControls);
        document.removeEventListener("keyup", this.removePressToolControls);
        if (this._onErrorMessageObserver) {
            this.props.globalState.onErrorMessageDialogRequiredObservable.remove(this._onErrorMessageObserver);
        }
    }

    addToolControls = (evt: KeyboardEvent) => {
        // If the event target is a text input, we're currently focused on it, and the user
        // just wants to type normal text
        if (evt.target && evt.target instanceof HTMLInputElement && evt.target.type === "text") {
            return;
        }
        switch (evt.key) {
            case "s": //select
            case "S":
                this.props.globalState.tool = GUIEditorTool.SELECT;
                break;
            case "p": //pan
            case "P":
            case " ":
                this.props.globalState.tool = GUIEditorTool.PAN;
                break;
            case "z": //zoom
            case "Z":
                this.props.globalState.tool = GUIEditorTool.ZOOM;
                break;
            case "g": //outlines
            case "G":
                this.props.globalState.outlines = !this.props.globalState.outlines;
                break;
            case "f": //fit to window
            case "F":
                this.props.globalState.onFitControlsToWindowObservable.notifyObservers();
                break;
        }
    };

    removePressToolControls = (evt: KeyboardEvent) => {
        if (evt.key === " ") {
            this.props.globalState.restorePreviousTool();
        }
    };

    constructor(props: IGraphEditorProps) {
        super(props);
        this._rootRef = React.createRef();
        this.state = {
            showPreviewPopUp: false,
            toolbarExpand: true,
            message: "",
        };

        this.props.globalState.onBackgroundColorChangeObservable.add(() => this.forceUpdate());
        this.props.globalState.onDropObservable.add(() => {
            if (this._draggedItem != null) {
                this.props.globalState.draggedControl = this.onCreate(this._draggedItem);
            }
            this._draggedItem = null;
        });
        this._onErrorMessageObserver = this.props.globalState.onErrorMessageDialogRequiredObservable.add((message) => {
            this.setState({ message });
        });
    }

    showWaitScreen() {
        this.props.globalState.hostDocument.querySelector(".wait-screen")?.classList.remove("hidden");
    }

    hideWaitScreen() {
        this.props.globalState.hostDocument.querySelector(".wait-screen")?.classList.add("hidden");
    }

    onPointerDown(evt: React.PointerEvent<HTMLDivElement>) {
        if (evt.button !== 0) return;
        this._moveInProgress = true;
        evt.currentTarget.setPointerCapture(evt.pointerId);
    }

    onPointerUp(evt: React.PointerEvent<HTMLDivElement>) {
        if (evt.button !== 0) return;
        this._moveInProgress = false;
        evt.currentTarget.releasePointerCapture(evt.pointerId);
    }

    resizeColumns(evt: React.PointerEvent<HTMLDivElement>, forLeft = true) {
        if (!this._moveInProgress) {
            return;
        }

        const rootElement = evt.currentTarget.ownerDocument!.getElementById("gui-editor-workbench-root") as HTMLDivElement;

        const maxWidth = this.props.globalState.hostWindow.innerWidth;

        if (forLeft) {
            this._leftWidth = Math.max(150, Math.min(maxWidth - this._rightWidth, evt.clientX - this._rootRef.current!.clientLeft));
            DataStorage.WriteNumber("LeftWidth", this._leftWidth);
        } else {
            this._rightWidth = Math.max(250, Math.min(maxWidth - this._leftWidth, this._rootRef.current!.clientLeft + this._rootRef.current!.clientWidth - evt.clientX));
            DataStorage.WriteNumber("RightWidth", this._rightWidth);
        }

        rootElement.style.gridTemplateColumns = this.buildColumnLayout();

        this.props.globalState.onWindowResizeObservable.notifyObservers();
    }

    buildColumnLayout() {
        return `${this._leftWidth}px 1fr ${this._rightWidth}px`;
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

    switchExpandedState(): void {
        this.setState({ toolbarExpand: !this.state.toolbarExpand });
        if (!this.state.toolbarExpand) {
            this._leftWidth = this._leftWidth - 50;
        } else {
            this._leftWidth = this._leftWidth + 50;
        }
    }

    override render() {
        const classForElement = this.state.toolbarExpand ? "left-panel" : "left-panel expand";
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
                    }}
                    ref={this._rootRef}
                    onPointerUp={(evt) => this.onPointerUp(evt)}
                >
                    {/* Node creation menu */}
                    <div className={classForElement}>
                        <SceneExplorerComponent globalState={this.props.globalState} noExpand={true}></SceneExplorerComponent>
                        {this.createToolbar()}
                        <div id="leftGrab" onPointerDown={(evt) => this.onPointerDown(evt)} onPointerMove={(evt) => this.resizeColumns(evt)}></div>
                    </div>
                    <SceneExplorerComponent globalState={this.props.globalState} noExpand={true}></SceneExplorerComponent>
                    {this.createToolbar()}
                    {/* The gui workbench diagram */}
                    <div
                        className="diagram-container"
                        onDrop={(event) => {
                            event.preventDefault();
                            this.props.globalState.onDropObservable.notifyObservers();
                            this.props.globalState.onParentingChangeObservable.notifyObservers(null);
                        }}
                        onDragOver={(event) => {
                            event.preventDefault();
                        }}
                        style={{
                            backgroundColor: this.props.globalState.backgroundColor.toHexString(),
                        }}
                    >
                        <ArtBoardComponent globalState={this.props.globalState} />
                        <WorkbenchComponent ref={this._workbenchRef} globalState={this.props.globalState} />
                        <GizmoWrapper globalState={this.props.globalState} />
                    </div>
                    {/* Property tab */}
                    <div className="right-panel">
                        <div id="rightGrab" onPointerDown={(evt) => this.onPointerDown(evt)} onPointerMove={(evt) => this.resizeColumns(evt, false)}></div>
                        <PropertyTabComponent globalState={this.props.globalState} />
                    </div>

                    <LogComponent globalState={this.props.globalState} />
                </div>
                <MessageDialog message={this.state.message} isError={true} />
                <div className="blocker">GUI Editor runs only on desktop</div>
                <div className="wait-screen hidden">Processing...please wait</div>
            </Portal>
        );
    }

    onCreate(value: string): Control {
        const guiElement = GUINodeTools.CreateControlFromString(value);
        const newGuiNode = this.props.globalState.workbench.appendBlock(guiElement);
        this.props.globalState.setSelection([newGuiNode]);
        this.props.globalState.onPointerUpObservable.notifyObservers(null);
        this.forceUpdate();
        return newGuiNode;
    }
    createBlackLine() {
        const icon = this.state.toolbarExpand ? <img src={toolbarExpandIcon} className="icon" /> : <img src={toolbarCollapseIcon} className="icon" />;
        return (
            <div className="blackLine">
                <div className="arrow" onClick={() => this.switchExpandedState()}>
                    {icon}
                </div>
            </div>
        );
    }
    createToolbarHelper(ct: { className: string; icon: string }[]) {
        return ct.map((type) => {
            return (
                <div
                    className={"toolbar-label"}
                    key={type.className}
                    onDragStart={() => {
                        this._draggedItem = type.className;
                    }}
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
        });
    }
    createToolbar() {
        if (this.state.toolbarExpand) {
            return (
                <>
                    <div className="toolbarGrab">
                        {this.createBlackLine()}
                        {<div className={"toolbar-content-sub1"}>{this.createToolbarHelper(ControlTypes)}</div>}
                    </div>
                </>
            );
        } else {
            return (
                <>
                    <div className="toolbarGrab expanded">
                        {this.createBlackLine()}
                        {
                            <div className={"toolbar-content-sub1"}>
                                {this.createToolbarHelper(ControlTypes.slice(0, Math.ceil(ControlTypes.length / 2)))}
                                {this.createToolbarHelper(ControlTypes.slice(Math.ceil(ControlTypes.length / 2)))}
                            </div>
                        }
                    </div>
                </>
            );
        }
    }
}
