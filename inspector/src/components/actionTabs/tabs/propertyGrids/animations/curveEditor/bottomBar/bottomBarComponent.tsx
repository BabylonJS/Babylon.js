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
    }

    public render() {
        return (
            <div id="bottom-bar">
                <MediaPlayerComponent globalState={this.props.globalState} context={this.props.context} />
                <RangeSelectorComponent globalState={this.props.globalState} context={this.props.context} />
            </div>
        );
    }
}