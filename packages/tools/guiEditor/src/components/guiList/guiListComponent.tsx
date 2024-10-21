/* eslint-disable @typescript-eslint/naming-convention */
import * as React from "react";
import type { GlobalState } from "../../globalState";
import { LineContainerComponent } from "shared-ui-components/lines/lineContainerComponent";
import { DraggableLineComponent } from "shared-ui-components/lines/draggableLineComponent";
import type { Observer } from "core/Misc/observable";
import type { Nullable } from "core/types";

import "./guiList.scss";

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

    override componentWillUnmount() {
        this.props.globalState.onResetRequiredObservable.remove(this._onResetRequiredObserver);
    }

    filterContent(filter: string) {
        this.setState({ filter: filter });
    }

    override render() {
        // Block types used to create the menu from
        const allBlocks: any = {
            Buttons: ["TextButton", "ImageButton"],
            // eslint-disable-next-line @typescript-eslint/naming-convention
            Controls: ["Slider", "Checkbox", "ColorPicker", "VirtualKeyboard"],
            Containers: ["DisplayGrid", "Grid", "StackPanel"],
            Shapes: ["Ellipse", "Image", "Line", "Rectangle"],
            Inputs: ["Text", "InputText", "InputPassword"],
        };

        // Create node menu
        const blockMenu = [];
        for (const key in allBlocks) {
            const blockList = (allBlocks as any)[key]
                .filter((b: string) => !this.state.filter || b.toLowerCase().indexOf(this.state.filter.toLowerCase()) !== -1)
                .sort((a: string, b: string) => a.localeCompare(b))
                .map((block: any) => {
                    return <DraggableLineComponent key={block} format={"babylonjs-gui-node"} data={block} tooltip={GuiListComponent._Tooltips[block] || ""} />;
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
                            <input type="text" placeholder="Filter" onChange={(evt) => this.filterContent(evt.target.value)} />
                        </div>
                        <div className="list-container">{blockMenu}</div>
                    </div>
                </div>
            </div>
        );
    }
}
