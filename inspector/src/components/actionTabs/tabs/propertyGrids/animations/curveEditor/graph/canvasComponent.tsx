import * as React from "react";
import { GlobalState } from "../../../../../../globalState";
import { Context } from "../context";
import { FrameBarComponent } from "./frameBarComponent";
import { GraphComponent } from "./graphComponent";
import { PlayHeadComponent } from "./playHeadComponent";
import { RangeFrameBarComponent } from "./rangeFrameBarComponent";
import { Nullable } from "babylonjs/types";
import { Observer } from "babylonjs/Misc/observable";

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

    private _onActiveAnimationChangedObserver: Nullable<Observer<void>>;
    constructor(props: ICanvasComponentProps) {
        super(props);

        this.state = { };

        this._onActiveAnimationChangedObserver = this.props.context.onActiveAnimationChanged.add(() => {
            this.forceUpdate();
        });
    }

    componentWillUnmount() {
        if (this._onActiveAnimationChangedObserver) {
            this.props.context.onActiveAnimationChanged.remove(this._onActiveAnimationChangedObserver);
        }
    }

    public render() {
        return (
            <div id="canvas-zone">
                <GraphComponent globalState={this.props.globalState} context={this.props.context}/>
                <FrameBarComponent globalState={this.props.globalState} context={this.props.context}/>
                <PlayHeadComponent context={this.props.context} globalState={this.props.globalState}/>
                <RangeFrameBarComponent context={this.props.context} globalState={this.props.globalState}/>
                {
                    this.props.context.activeAnimations.length > 0 &&
                    <div id="angle-mode" />
                }
            </div>
        );
    }
}