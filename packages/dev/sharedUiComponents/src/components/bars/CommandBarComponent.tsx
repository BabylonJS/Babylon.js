import * as React from "react";
import { JoinClassNames } from "../classNames";
import { CommandButtonComponent } from "./CommandButtonComponent";
import { CommandDropdownComponent } from "./CommandDropdownComponent";
// import { ColorLineComponent } from "shared-ui-components/lines/colorLineComponent";

import hamburgerIcon from "../../imgs/hamburgerIcon.svg";
import pointerIcon from "../../imgs/pointerIcon.svg";
import handIcon from "../../imgs/handIcon.svg";
import zoomIcon from "../../imgs/zoomIcon.svg";
import logoIcon from "../../imgs/babylonLogo.svg";
import canvasFitIcon from "../../imgs/canvasFitIcon.svg";
import betaFlag from "../../imgs/betaFlag.svg";

import style from "./CommandBar.modules.scss";

export interface ICommandBarComponentProps {
    onSaveButtonClicked?: () => void;
    onSaveToSnippetButtonClicked?: () => void;
    onLoadFromSnippetButtonClicked?: () => void;
    onHelpButtonClicked?: () => void;
    onGiveFeedbackButtonClicked?: () => void;
    onSelectButtonClicked?: () => void;
    onPanButtonClicked?: () => void;
    onZoomButtonClicked?: () => void;
    onFitButtonClicked?: () => void;
}

export const CommandBarComponent: React.FC<ICommandBarComponentProps> = (props) => {
    return (
        <div className={style.commandBar}>
            <div className={style.commandsLeft}>
                <div className={style.divider}>
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
                                    props.onSaveButtonClicked && props.onSaveButtonClicked();
                                },
                            },
                            {
                                label: "Load",
                                fileButton: true,
                            },
                            {
                                label: "Save to snippet",
                                onClick: () => {
                                    props.onSaveToSnippetButtonClicked && props.onSaveToSnippetButtonClicked();
                                },
                            },
                            {
                                label: "Load from snippet",
                                onClick: () => {
                                    props.onLoadFromSnippetButtonClicked && props.onLoadFromSnippetButtonClicked();
                                },
                            },
                            {
                                label: "Help",
                                onClick: () => {
                                    props.onHelpButtonClicked && props.onHelpButtonClicked();
                                },
                            },
                            {
                                label: "Give feedback",
                                onClick: () => {
                                    props.onGiveFeedbackButtonClicked && props.onGiveFeedbackButtonClicked();
                                },
                            },
                        ]}
                    />
                    <CommandButtonComponent
                        tooltip="Select"
                        icon={pointerIcon}
                        shortcut="S"
                        isActive={false}
                        onClick={() => {
                            props.onSelectButtonClicked && props.onSelectButtonClicked();
                        }}
                    />
                    <CommandButtonComponent
                        tooltip="Pan"
                        icon={handIcon}
                        shortcut="P"
                        isActive={false}
                        onClick={() => {
                            props.onPanButtonClicked && props.onPanButtonClicked();
                        }}
                    />
                    <CommandButtonComponent
                        tooltip="Zoom"
                        shortcut="Z"
                        icon={zoomIcon}
                        isActive={false}
                        onClick={() => {
                            props.onZoomButtonClicked && props.onZoomButtonClicked();
                        }}
                    />
                </div>
                <div className={style.divider}>
                    <CommandButtonComponent
                        tooltip="Fit to Window"
                        shortcut="F"
                        icon={canvasFitIcon}
                        isActive={false}
                        onClick={() => {
                            props.onFitButtonClicked && props.onFitButtonClicked();
                        }}
                    />
                </div>
                <div className={JoinClassNames(style, "divider", "padded")}>
                    {/* <ColorLineComponent lockObject={{ lock: false }} label={"Artboard:"} target={{}} propertyName="backgroundColor" disableAlpha={true} /> */}
                </div>
            </div>
            <div className={style.commandsRight}>
                <img src={betaFlag} className={style.betaFlag} draggable={false} />
            </div>
        </div>
    );
};
