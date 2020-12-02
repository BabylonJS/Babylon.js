
import * as React from "react";
import { GlobalState } from '../../globalState';
import { LineContainerComponent } from '../../sharedComponents/lineContainerComponent';
import { DraggableLineComponent } from '../../sharedComponents/draggableLineComponent';
import { Observer } from 'babylonjs/Misc/observable';
import { Nullable } from 'babylonjs/types';

//const addButton = require("../../../imgs/add.svg");
//const deleteButton = require('../../../imgs/delete.svg');

require("./nodeList.scss");

interface INodeListComponentProps {
    globalState: GlobalState;
}

export class NodeListComponent extends React.Component<INodeListComponentProps, {filter: string}> {

    private _onResetRequiredObserver: Nullable<Observer<void>>;

    private static _Tooltips: {[key: string]: string} = {
        "Buttons": "Provides a world matrix for each vertex, based on skeletal (bone/joint) animation",
    };

    constructor(props: INodeListComponentProps) {
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
            Buttons: ["Text", "ImageButton"],
            Controls: ["Slider", "Checkbox", "ColorPicker", "VisualKeyboard"],
            Containers: ["DisplayGrid", "Grid", "StackPanel"],
            Shapes: ["Ellipse","Image", "Line","Rectangle" ],
            Inputs: ["textBlock", "intputText", "inputPassword"]
        };

        // Create node menu
        var blockMenu = [];
        for (var key in allBlocks) {
            var blockList = (allBlocks as any)[key].filter((b: string) => !this.state.filter || b.toLowerCase().indexOf(this.state.filter.toLowerCase()) !== -1)
            .sort((a: string, b: string) => a.localeCompare(b))
            .map((block: any, i: number) => {
                return <DraggableLineComponent key={block} data={block} tooltip={ NodeListComponent._Tooltips[block] || ""}/>;

            });
        
            if(blockList.length) {
                blockMenu.push(
                    <LineContainerComponent key={key + " blocks"} title={key.replace("__", ": ").replace("_", " ")} closed={false}>
                        {blockList}
                    </LineContainerComponent>
                );
           }
        }

        return (
            <div id="nodeList">
                <div className="panes">
                    <div className="pane">
                        <div className="filter">
                            <input type="text" placeholder="Filter"
                                onFocus={() => this.props.globalState.blockKeyboardEvents = true}
                                onBlur={(evt) => {
                                    this.props.globalState.blockKeyboardEvents = false;
                                }}
                                onChange={(evt) => this.filterContent(evt.target.value)} />
                        </div>
                        <div className="list-container">
                            {blockMenu}
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}