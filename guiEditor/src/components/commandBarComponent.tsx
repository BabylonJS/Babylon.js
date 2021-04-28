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

    public constructor(props: ICommandBarComponentProps) {
        super(props);

    }

    public render() {

        return (
            <div className={"commands "}>
                <div className="commands-left">
                    <img src={"../imgs/babylonLogo.svg"} color="white" className={"active"} />
                    <CommandDropdownComponent globalState={this.props.globalState} icon="hamburgerIcon" tooltip="Options" items={[
                        {
                            label: "Save",
                            onClick: () => { this.props.globalState.onSaveObservable.notifyObservers(); }
                        }, {
                            label: "Load",
                        }, {
                            label: "Save to snippet",
                            onClick: () => { this.props.globalState.onSnippetSaveObservable.notifyObservers(); }
                        }, {
                            label: "Load from snippet",
                            onClick: () => { this.props.globalState.onSnippetLoadObservable.notifyObservers(); }
                        },
                    ]} />
                    <CommandButtonComponent globalState={this.props.globalState} tooltip="Select" icon="pointerIcon" shortcut="Ctrl+S" isActive={false}
                        onClick={() => { this.props.globalState.onSelectionObservable.notifyObservers(); }} />
                    <CommandButtonComponent globalState={this.props.globalState} tooltip="Pan" icon="handIcon" shortcut="Ctrl" isActive={false}
                        onClick={() => { this.props.globalState.onPanObservable.notifyObservers(); }} />
                    <CommandButtonComponent globalState={this.props.globalState} tooltip="Zoom" icon="zoomIcon" isActive={false}
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