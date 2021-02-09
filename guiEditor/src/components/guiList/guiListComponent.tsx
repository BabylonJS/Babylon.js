import * as React from "react";
import { GlobalState } from "../../globalState";
import { LineContainerComponent } from "../../sharedUiComponents/lines/lineContainerComponent";
import { DraggableLineComponent } from "../../sharedUiComponents/lines/draggableLineComponent";
import { Observer } from "babylonjs/Misc/observable";
import { Nullable } from "babylonjs/types";

require("./guiList.scss");

interface IGuiListComponentProps {
    globalState: GlobalState;
}

export class GuiListComponent extends React.Component<IGuiListComponentProps, { filter: string }> {
    private _onResetRequiredObserver: Nullable<Observer<void>>;

    private static _Tooltips: { [key: string]: string } = {
        Button: "A simple button",
    };

    constructor(props: IGuiListComponentProps) {
        super(props);

        this.state = { filter: "" };

        this._onResetRequiredObserver = this.props.globalState.onResetRequiredObservable.add(() => {
            this.forceUpdate();
        });
    }

    componentWillUnmount() {
        this.props.globalState.onResetRequiredObservable.remove(this._onResetRequiredObserver);
    }

    filterContent(filter: string) {
        this.setState({ filter: filter });
    }

    render() {
        // Block types used to create the menu from
        const allBlocks: any = {
            Buttons: ["TextButton", "ImageButton"],
            Controls: ["Slider", "Checkbox", "ColorPicker", "VirtualKeyboard"],
            Containers: ["DisplayGrid", "Grid", "StackPanel"],
            Shapes: ["Ellipse", "Image", "Line", "Rectangle"],
            Inputs: ["Text", "InputText", "InputPassword"],
        };

        // Create node menu
        var blockMenu = [];
        for (var key in allBlocks) {
            var blockList = (allBlocks as any)[key]
                .filter((b: string) => !this.state.filter || b.toLowerCase().indexOf(this.state.filter.toLowerCase()) !== -1)
                .sort((a: string, b: string) => a.localeCompare(b))
                .map((block: any, i: number) => {
                    return <DraggableLineComponent key={block} data={block} tooltip={GuiListComponent._Tooltips[block] || ""} />;
                });

            if (blockList.length) {
                blockMenu.push(
                    <LineContainerComponent key={key + " blocks"} title={key.replace("__", ": ").replace("_", " ")} closed={false}>
                        {blockList}
                    </LineContainerComponent>
                );
            }
        }

        return (
            <div id="guiList">
                <div className="panes">
                    <div className="pane">
                        <div className="filter">
                            <input
                                type="text"
                                placeholder="Filter"
                                onFocus={() => (this.props.globalState.blockKeyboardEvents = true)}
                                onBlur={(evt) => {
                                    this.props.globalState.blockKeyboardEvents = false;
                                }}
                                onChange={(evt) => this.filterContent(evt.target.value)}
                            />
                        </div>
                        <div className="list-container">{blockMenu}</div>
                    </div>
                </div>
            </div>
        );
    }
}
