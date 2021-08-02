import { Container } from "babylonjs-gui/2D/controls/container";
import { Control } from "babylonjs-gui/2D/controls/control";
import * as React from "react";
import { GlobalState } from '../globalState';
import { GUINodeTools } from "../guiNodeTools";
import { CommandButtonComponent } from './commandButtonComponent';
import { CommandDropdownComponent } from './commandDropdownComponent';

const hamburgerIcon: string = require("../../public/imgs/hamburgerIcon.svg");
const pointerIcon: string = require("../../public/imgs/pointerIcon.svg");
const handIcon: string = require("../../public/imgs/handIcon.svg");
const zoomIcon: string = require("../../public/imgs/zoomIcon.svg");
const guidesIcon: string = require("../../public/imgs/guidesIcon.svg");
const controlsIcon: string = require("../../public/imgs/sliderIcon.svg");
const logoIcon: string = require("../../public/imgs/babylonLogo.svg");

const rectangleIcon: string = require("../../public/imgs/rectangleIcon.svg");
const ellipseIcon: string = require("../../public/imgs/ellipseIcon.svg");
const gridIcon: string = require("../../public/imgs/gridIcon.svg");
const stackPanelIcon: string = require("../../public/imgs/stackPanelIcon.svg");
const textBoxIcon: string = require("../../public/imgs/textBoxIcon.svg");
const sliderIcon: string = require("../../public/imgs/sliderIcon.svg");
const buttonIcon: string = require("../../public/imgs/buttonIcon.svg");
const passwordFieldIcon: string = require("../../public/imgs/passwordFieldIcon.svg");
const checkboxIcon: string = require("../../public/imgs/checkboxIcon.svg");
const imageIcon: string = require("../../public/imgs/imageIcon.svg");
const keyboardIcon: string = require("../../public/imgs/keyboardIcon.svg");
const inputFieldIcon: string = require("../../public/imgs/inputFieldIcon.svg");
const lineIcon: string = require("../../public/imgs/lineIcon.svg");
const displaygridIcon: string = require("../../public/imgs/displaygridIcon.svg");
const colorPickerIcon: string = require("../../public/imgs/colorPickerIcon.svg");

require("../scss/commandBar.scss");

declare var Versions: any;

interface ICommandBarComponentProps {
    globalState: GlobalState;
}

export class CommandBarComponent extends React.Component<ICommandBarComponentProps> {
    private _panning: boolean;
    private _zooming: boolean;
    private _selecting: boolean;
    private _outlines: boolean;
    public constructor(props: ICommandBarComponentProps) {
        super(props);

        props.globalState.onPanObservable.add(() => {
            this._panning = !this._panning;
            this._zooming = false;
            this._selecting = false;
            this.forceUpdate();
        });

        props.globalState.onSelectionButtonObservable.add(() => {
            this._selecting = true;
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

        props.globalState.onOutlinesObservable.add(() => {
            this._outlines = !this._outlines;
            const nodes = this.props.globalState.workbench.nodes;
            nodes.forEach(node => {
                this.updateNodeOutline(node);
            });
            this.forceUpdate();
        });
    }

    private updateNodeOutline(guiControl : Control) {
        guiControl.isHighlighted = this._outlines;
        guiControl.highlightLineWidth = 5;
        if (this.props.globalState.workbench.isContainer(guiControl)) {
            (guiControl as Container).children.forEach(child => {
                this.updateNodeOutline(child);
            });
        }
    }

    public render() {

        return (
            <div className={"ge-commands"}>
                <div className="commands-left">
                    <img src={logoIcon} color="white" className={"active"} />
                    <CommandDropdownComponent globalState={this.props.globalState} toRight={true} icon={hamburgerIcon} tooltip="Options" items={[
                        {
                            label: "Save",
                            onClick: () => { this.props.globalState.onSaveObservable.notifyObservers(); }
                        }, {
                            label: "Load",
                        }, {
                            label: "Save to snippet",
                            onClick: () => { this.props.globalState.onSnippetSaveObservable.notifyObservers();}
                        }, {
                            label: "Load from snippet",
                            onClick: () => { this.props.globalState.onSnippetLoadObservable.notifyObservers(); }
                        },
                    ]} />
                    <CommandButtonComponent tooltip="Select" icon={pointerIcon} shortcut="Q" isActive={this._selecting}
                        onClick={() => { if(!this._selecting) this.props.globalState.onSelectionButtonObservable.notifyObservers(); }} />
                    <CommandButtonComponent tooltip="Pan" icon={handIcon} shortcut="W" isActive={this._panning}
                        onClick={() => { if(!this._panning) this.props.globalState.onPanObservable.notifyObservers(); }} />
                    <CommandButtonComponent tooltip="Zoom" shortcut="E" icon={zoomIcon} isActive={this._zooming}
                        onClick={() => { if(!this._zooming) this.props.globalState.onZoomObservable.notifyObservers(); }} />
                    <CommandButtonComponent tooltip="Toggle Guides" shortcut="R" icon={guidesIcon} isActive={this._outlines}
                        onClick={() => { this.props.globalState.onOutlinesObservable.notifyObservers(); }} />
                    <CommandDropdownComponent globalState={this.props.globalState} icon={controlsIcon} tooltip="Create" items={[
                        {
                            label: "Image",
                            icon: imageIcon,
                            onClick: () => { this.onCreate("Image") }
                        }, {
                            label: "TextButton",
                            icon: buttonIcon,
                            onClick: () => { this.onCreate("TextButton") }
                        },
                        {
                            label: "Slider",
                            icon: sliderIcon,
                            onClick: () => { this.onCreate("Slider") }
                        },
                        {
                            label: "ColorPicker",
                            icon: colorPickerIcon,
                            onClick: () => { this.onCreate("ColorPicker") }
                        },
                        {
                            label: "ImageButton",
                            icon: buttonIcon,
                            onClick: () => { this.onCreate("ImageButton") }
                        },
                        {
                            label: "Checkbox",
                            icon: checkboxIcon,
                            onClick: () => { this.onCreate("Checkbox") }
                        },
                        {
                            label: "VirtualKeyboard",
                            icon: keyboardIcon,
                            onClick: () => { this.onCreate("VirtualKeyboard") }
                        },
                        {
                            label: "DisplayGrid",
                            icon: displaygridIcon,
                            onClick: () => { this.onCreate("DisplayGrid") }
                        },
                        {
                            label: "Grid",
                            icon: gridIcon,
                            onClick: () => { this.onCreate("Grid") }
                        },
                        {
                            label: "StackPanel",
                            icon: stackPanelIcon,
                            onClick: () => { this.onCreate("StackPanel") }
                        },
                        {
                            label: "Ellipse",
                            icon: ellipseIcon,
                            onClick: () => { this.onCreate("Ellipse") }
                        },
                        {
                            label: "Line",
                            icon: lineIcon,
                            onClick: () => { this.onCreate("Line") }
                        },
                        {
                            label: "Rectangle",
                            icon: rectangleIcon,
                            onClick: () => { this.onCreate("Rectangle") }
                        },
                        {
                            label: "Text",
                            icon: textBoxIcon,
                            onClick: () => { this.onCreate("Text") }
                        },
                        {
                            label: "InputText",
                            icon: inputFieldIcon,
                            onClick: () => { this.onCreate("InputText") }
                        },
                        {
                            label: "InputPassword",
                            icon: passwordFieldIcon,
                            onClick: () => { this.onCreate("InputPassword") }
                        }

                    ]} />
                </div>
                <div className="commands-right">

                </div>
            </div>
        );
    }
    onCreate(value: string): void {
        let guiElement = GUINodeTools.CreateControlFromString(value);
        let newGuiNode = this.props.globalState.workbench.appendBlock(guiElement);
        this.props.globalState.onSelectionChangedObservable.notifyObservers(newGuiNode);
        this.forceUpdate();
    }
}