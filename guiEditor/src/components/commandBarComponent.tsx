import * as React from "react";
import { GlobalState } from "../globalState";
import { CommandButtonComponent } from "./commandButtonComponent";
import { CommandDropdownComponent } from "./commandDropdownComponent";

const hamburgerIcon: string = require("../../public/imgs/hamburgerIcon.svg");
const pointerIcon: string = require("../../public/imgs/pointerIcon.svg");
const handIcon: string = require("../../public/imgs/handIcon.svg");
const zoomIcon: string = require("../../public/imgs/zoomIcon.svg");
const guidesIcon: string = require("../../public/imgs/guidesIcon.svg");
const logoIcon: string = require("../../public/imgs/babylonLogo.svg");
const canvasFitIcon: string = require("../../public/imgs/canvasFitIcon.svg");

require("../scss/commandBar.scss");

declare var Versions: any;

interface ICommandBarComponentProps {
    globalState: GlobalState;
}

export class CommandBarComponent extends React.Component<ICommandBarComponentProps> {
    private _panning: boolean = false;
    private _zooming: boolean = false;
    private _selecting: boolean = true;
    public constructor(props: ICommandBarComponentProps) {
        super(props);

        props.globalState.onPanObservable.add(() => {
            this._panning = !this._panning;
            this._zooming = false;
            this._selecting = false;
            this.forceUpdate();
        });

        props.globalState.onSelectionButtonObservable.add(() => {
            this._selecting = !this._selecting;
            this._panning = false;
            this._zooming = false;
            this.forceUpdate();
        });

        props.globalState.onZoomObservable.add(() => {
            this._zooming = !this._zooming;
            this._panning = false;
            this._selecting = false;
            this.forceUpdate();
        });

        props.globalState.onOutlineChangedObservable.add(() => {
            this.forceUpdate();
        });
    }

    public render() {
        return (
            <div className={"ge-commands"}>
                <div className="commands-left">
                    <img src={logoIcon} color="white" className={"active"} />
                    <CommandDropdownComponent
                        globalState={this.props.globalState}
                        toRight={true}
                        icon={hamburgerIcon}
                        tooltip="Options"
                        items={[
                            {
                                label: "Save",
                                onClick: () => {
                                    this.props.globalState.onSaveObservable.notifyObservers();
                                },
                            },
                            {
                                label: "Load",
                                fileButton: true,
                            },
                            {
                                label: "Save to snippet",
                                onClick: () => {
                                    this.props.globalState.onSnippetSaveObservable.notifyObservers();
                                },
                            },
                            {
                                label: "Load from snippet",
                                onClick: () => {
                                    this.props.globalState.onSnippetLoadObservable.notifyObservers();
                                },
                            },
                            {
                                label: "Copy Selected",
                                onClick: () => {
                                    this.props.globalState.onCopyObservable.notifyObservers(content => this.props.globalState.hostWindow.navigator.clipboard.writeText(content));

                                },
                            },
                            {
                                label: "Paste",
                                onClick: async () => {
                                    this.props.globalState.onPasteObservable.notifyObservers(await this.props.globalState.hostWindow.navigator.clipboard.readText());
                                }
                            },
                            {
                                label: "Delete Selected",
                                onClick: () => {
                                    this.props.globalState.workbench.selectedGuiNodes.forEach((guiNode) => {
                                        if (guiNode !== this.props.globalState.guiTexture.getChildren()[0]) {
                                            this.props.globalState.guiTexture.removeControl(guiNode);
                                            this.props.globalState.liveGuiTexture?.removeControl(guiNode);
                                            guiNode.dispose();
                                        }
                                    });
                                    this.props.globalState.onSelectionChangedObservable.notifyObservers(null);
                                },
                            },
                            {
                                label: "Help",
                                onClick: () => {
                                    window.open("https://doc.babylonjs.com/toolsAndResources/tools/guiEditor", "_blank");
                                },
                            },
                            {
                                label: "Give feedback",
                                onClick: () => {
                                    window.open("https://forum.babylonjs.com/t/introducing-the-gui-editor-alpha/24578", "_blank");
                                },
                            },

                        ]}
                    />
                    <CommandButtonComponent
                        tooltip="Select"
                        icon={pointerIcon}
                        shortcut="S"
                        isActive={this._selecting}
                        onClick={() => {
                            if (!this._selecting) this.props.globalState.onSelectionButtonObservable.notifyObservers();
                        }}
                    />
                    <CommandButtonComponent
                        tooltip="Pan"
                        icon={handIcon}
                        shortcut="P"
                        isActive={this._panning}
                        onClick={() => {
                            if (!this._panning) this.props.globalState.onPanObservable.notifyObservers();
                        }}
                    />
                    <CommandButtonComponent
                        tooltip="Zoom"
                        shortcut="Z"
                        icon={zoomIcon}
                        isActive={this._zooming}
                        onClick={() => {
                            if (!this._zooming) this.props.globalState.onZoomObservable.notifyObservers();
                        }}
                    />
                    <CommandButtonComponent
                        tooltip="Fit to Window"
                        shortcut="F"
                        icon={canvasFitIcon}
                        isActive={false}
                        onClick={() => {
                            this.props.globalState.onFitToWindowObservable.notifyObservers();
                        }}
                    />
                    <CommandButtonComponent
                        tooltip="Toggle Guides"
                        shortcut="G"
                        icon={guidesIcon}
                        isActive={this.props.globalState.outlines}
                        onClick={() => this.props.globalState.outlines = !this.props.globalState.outlines}
                    />
                </div>
                <div className="commands-right"></div>
            </div>
        );
    }
}
