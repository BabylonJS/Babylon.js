import * as React from "react";
import { CommandButtonComponent } from "./commandButtonComponent";
import { CommandDropdownComponent } from "./commandDropdownComponent";
import { ColorLineComponent } from "shared-ui-components/lines/colorLineComponent";

import hamburgerIcon from "../../imgs/hamburger.svg";
import pointerIcon from "../../imgs/pointerIcon.svg";
import handIcon from "../../imgs/handIcon.svg";
import zoomIcon from "../../imgs/zoomIcon.svg";
import logoIcon from "../../imgs/babylonLogo.svg";
import canvasFitIcon from "../../imgs/canvasFitIcon.svg";
import betaFlag from "../../imgs/betaFlag.svg";

import "./commandBar.scss";

interface ICommandBarComponentProps {}

export const CommandBarComponent: React.FC<ICommandBarComponentProps> = (props) => {
    return (
        <div className={"ge-commands"}>
            <div className="commands-left">
                <div className="divider">
                    <img src={logoIcon} color="white" className={"active"} draggable={false} />
                    <CommandDropdownComponent
                        //globalState={this.props.globalState}
                        toRight={true}
                        icon={hamburgerIcon}
                        tooltip="Options"
                        items={[
                            {
                                label: "Save",
                                onClick: () => {
                                    //this.props.globalState.onSaveObservable.notifyObservers();
                                },
                            },
                            {
                                label: "Load",
                                fileButton: true,
                            },
                            {
                                label: "Save to snippet",
                                onClick: () => {
                                    //this.props.globalState.onSnippetSaveObservable.notifyObservers();
                                },
                            },
                            {
                                label: "Load from snippet",
                                onClick: () => {
                                    //this.props.globalState.onSnippetLoadObservable.notifyObservers();
                                },
                            },
                            {
                                label: "Help",
                                onClick: () => {
                                    //window.open("https://doc.babylonjs.com/toolsAndResources/tools/guiEditor", "_blank");
                                },
                            },
                            {
                                label: "Give feedback",
                                onClick: () => {
                                    //window.open("https://forum.babylonjs.com/t/introducing-the-gui-editor-beta/28943", "_blank");
                                },
                            },
                        ]}
                    />
                    <CommandButtonComponent
                        tooltip="Select"
                        icon={pointerIcon}
                        shortcut="S"
                        isActive={true}
                        onClick={() => {
                            //this.props.globalState.tool = GUIEditorTool.SELECT;
                        }}
                    />
                    <CommandButtonComponent
                        tooltip="Pan"
                        icon={handIcon}
                        shortcut="P"
                        isActive={true}
                        onClick={() => {
                            //this.props.globalState.tool = GUIEditorTool.PAN;
                        }}
                    />
                    <CommandButtonComponent
                        tooltip="Zoom"
                        shortcut="Z"
                        icon={zoomIcon}
                        isActive={true}
                        onClick={() => {
                            //this.props.globalState.tool = GUIEditorTool.ZOOM;
                        }}
                    />
                </div>
                <div className="divider">
                    <CommandButtonComponent
                        tooltip="Fit to Window"
                        shortcut="F"
                        icon={canvasFitIcon}
                        isActive={false}
                        onClick={() => {
                            //this.props.globalState.onFitControlsToWindowObservable.notifyObservers();
                        }}
                    />
                </div>
                <div className="divider padded">
                    <ColorLineComponent lockObject={{ lock: false }} label={"Artboard:"} target={{}} propertyName="backgroundColor" disableAlpha={true} />
                </div>
            </div>
            <div className="commands-right">
                <img src={betaFlag} className="beta-flag" draggable={false} />
            </div>
        </div>
    );
};
