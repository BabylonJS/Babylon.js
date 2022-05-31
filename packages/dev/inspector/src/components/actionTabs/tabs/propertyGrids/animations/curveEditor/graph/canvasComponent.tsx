import * as React from "react";
import type { GlobalState } from "../../../../../../globalState";
import type { Context, IActiveAnimationChangedOptions } from "../context";
import { FrameBarComponent } from "./frameBarComponent";
import { GraphComponent } from "./graphComponent";
import { PlayHeadComponent } from "./playHeadComponent";
import { RangeFrameBarComponent } from "./rangeFrameBarComponent";
import type { Nullable } from "core/types";
import type { Observer } from "core/Misc/observable";

import "../scss/canvas.scss";

interface ICanvasComponentProps {
    globalState: GlobalState;
    context: Context;
}

interface ICanvasComponentState {}

export class CanvasComponent extends React.Component<ICanvasComponentProps, ICanvasComponentState> {
    private _onActiveAnimationChangedObserver: Nullable<Observer<IActiveAnimationChangedOptions>>;
    constructor(props: ICanvasComponentProps) {
        super(props);

        this.state = {};

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
                <FrameBarComponent globalState={this.props.globalState} context={this.props.context} />
                <GraphComponent globalState={this.props.globalState} context={this.props.context} />
                <PlayHeadComponent context={this.props.context} globalState={this.props.globalState} />
                <RangeFrameBarComponent context={this.props.context} globalState={this.props.globalState} />
                {this.props.context.activeAnimations.length > 0 && <div id="angle-mode" />}
            </div>
        );
    }
}
