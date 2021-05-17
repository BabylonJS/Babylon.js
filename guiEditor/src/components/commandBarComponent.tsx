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

require("../scss/commandBar.scss");

declare var Versions: any;

interface ICommandBarComponentProps {
    globalState: GlobalState;
}

export class CommandBarComponent extends React.Component<ICommandBarComponentProps> {
    private _panning: boolean;
    private _zooming: boolean;
    private _selecting: boolean;
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

    }

    public render() {

        return (
            <div className={"ge-commands"}>
                <div className="commands-left">
                    <img src={"./imgs/babylonLogo.svg"} color="white" className={"active"} />
                    <CommandDropdownComponent globalState={this.props.globalState} icon={hamburgerIcon} tooltip="Options" items={[
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
                    <CommandButtonComponent globalState={this.props.globalState} tooltip="Select" icon={pointerIcon} shortcut="Q" isActive={this._selecting}
                        onClick={() => { if(!this._selecting) this.props.globalState.onSelectionButtonObservable.notifyObservers(); }} />
                    <CommandButtonComponent globalState={this.props.globalState} tooltip="Pan" icon={handIcon} shortcut="W" isActive={this._panning}
                        onClick={() => { if(!this._panning) this.props.globalState.onPanObservable.notifyObservers(); }} />
                    <CommandButtonComponent globalState={this.props.globalState} tooltip="Zoom" shortcut="E" icon={zoomIcon} isActive={this._zooming}
                        onClick={() => { if(!this._zooming) this.props.globalState.onZoomObservable.notifyObservers(); }} />
                    <CommandDropdownComponent globalState={this.props.globalState} icon={guidesIcon} tooltip="Create" items={[
                        {
                            label: "Image",
                            icon: "zoomIcon",
                            onClick: () => { this.onCreate("Image") }
                        }, {
                            label: "TextButton",
                            onClick: () => { this.onCreate("TextButton") }
                        },
                        {
                            label: "Slider",
                            onClick: () => { this.onCreate("Slider") }
                        },
                        {
                            label: "ColorPicker",
                            onClick: () => { this.onCreate("ColorPicker") }
                        },
                        {
                            label: "ImageButton",
                            onClick: () => { this.onCreate("ImageButton") }
                        },
                        {
                            label: "Checkbox",
                            onClick: () => { this.onCreate("Checkbox") }
                        },
                        {
                            label: "VirtualKeyboard",
                            onClick: () => { this.onCreate("VirtualKeyboard") }
                        },
                        {
                            label: "DisplayGrid",
                            onClick: () => { this.onCreate("DisplayGrid") }
                        },
                        {
                            label: "Grid",
                            onClick: () => { this.onCreate("Grid") }
                        },
                        {
                            label: "StackPanel",
                            onClick: () => { this.onCreate("StackPanel") }
                        },
                        {
                            label: "Ellipse",
                            onClick: () => { this.onCreate("Ellipse") }
                        },
                        {
                            label: "Line",
                            onClick: () => { this.onCreate("Line") }
                        },
                        {
                            label: "Rectangle",
                            onClick: () => { this.onCreate("Rectangle") }
                        },
                        {
                            label: "Text",
                            onClick: () => { this.onCreate("Text") }
                        },
                        {
                            label: "InputText",
                            onClick: () => { this.onCreate("InputText") }
                        },
                        {
                            label: "InputPassword",
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