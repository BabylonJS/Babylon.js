import * as React from "react";
import { GlobalState } from "../../../../../../globalState";
import { Context } from "../context";
import { FrameBarComponent } from "./frameBarComponent";
import { GraphComponent } from "./graphComponent";

require("../scss/canvas.scss");

interface ICanvasComponentProps {
    globalState: GlobalState;
    context: Context;
}

interface ICanvasComponentState {
}

export class CanvasComponent extends React.Component<
ICanvasComponentProps,
ICanvasComponentState
> {

    constructor(props: ICanvasComponentProps) {
        super(props);

        this.state = { };
    }

    public render() {
        return (
            <div id="canvas-zone">
                <GraphComponent globalState={this.props.globalState} context={this.props.context}/>
                <FrameBarComponent globalState={this.props.globalState} context={this.props.context}/>
            </div>
        );
    }
}