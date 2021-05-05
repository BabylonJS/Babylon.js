import * as React from "react";
import { GlobalState } from '../globalState';
import { GUINodeTools } from "../guiNodeTools";
import { CommandButtonComponent } from './commandButtonComponent';
import { CommandDropdownComponent } from './commandDropdownComponent';

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
            this.setState({ _panning: !this._panning});
            this.setState({ _zooming: false});
            this.setState({ _selecting: false});
        });

        props.globalState.onSelectionButtonObservable.add(() => {
            this.setState({ _selecting: true});
            this.setState({ _zooming: false});
            this.setState({ _panning: false});
        });

        props.globalState.onZoomObservable.add(() => {
            this.setState({ _zooming: !this._zooming});
            this.setState({ _selecting: false});
            this.setState({ _panning: false});
        });

    }

    public render() {

        return (
            <div className={"ge-commands"}>
                <div className="commands-left">
                    <img src={"./imgs/babylonLogo.svg"} color="white" className={"active"} />
                    <CommandDropdownComponent globalState={this.props.globalState} icon="hamburgerIcon" tooltip="Options" items={[
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
                    <CommandButtonComponent globalState={this.props.globalState} tooltip="Select" icon="pointerIcon" shortcut="Q" isActive={this._selecting}
                        onClick={() => { this.props.globalState.onSelectionButtonObservable.notifyObservers(); }} />
                    <CommandButtonComponent globalState={this.props.globalState} tooltip="Pan" icon="handIcon" shortcut="W" isActive={this._panning}
                        onClick={() => { this.props.globalState.onPanObservable.notifyObservers(); }} />
                    <CommandButtonComponent globalState={this.props.globalState} tooltip="Zoom" icon="zoomIcon" shortcut="E" isActive={this._zooming}
                        onClick={() => { this.props.globalState.onZoomObservable.notifyObservers(); }} />
                    <CommandDropdownComponent globalState={this.props.globalState} icon="guidesIcon" tooltip="Create" items={[
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