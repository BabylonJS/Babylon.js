import * as React from "react";
import { GlobalState } from "../../../../../../globalState";
import { Context } from "../context";
import { MediaPlayerComponent } from "./mediaPlayerComponent";
import { RangeSelectorComponent } from "./rangeSelectorComponent";

require("../scss/bottomBar.scss");

interface IBottomBarComponentProps {
    globalState: GlobalState;
    context: Context;
}

interface IBottomBarComponentState {
}

export class BottomBarComponent extends React.Component<
IBottomBarComponentProps,
IBottomBarComponentState
> {

    constructor(props: IBottomBarComponentProps) {
        super(props);

        this.state = { };

        this.props.context.onAnimationsLoaded.add(() => {
            this.forceUpdate();
        });

        this.props.context.onActiveAnimationChanged.add(() => {
            this.forceUpdate();
        });
    }

    private _renderMaxFrame() {
        const keys = this.props.context.activeAnimation!.getKeys();
        return Math.round(keys[keys.length - 1].frame);
    }

    public render() {
        return (
            <div id="bottom-bar">
                <MediaPlayerComponent globalState={this.props.globalState} context={this.props.context} />
                <RangeSelectorComponent globalState={this.props.globalState} context={this.props.context} />
                {
                    this.props.context.activeAnimation &&
                    <div id="bottom-bar-total">
                        {this._renderMaxFrame()}
                    </div>
                }
            </div>
        );
    }
}