import * as React from "react";
import { GlobalState } from "../../../../../../globalState";
import { Context } from "../context";
import { ActionButtonComponent } from "../controls/actionButtonComponent";
import { ControlButtonComponent } from "../controls/controlButtonComponent";

const firstKeyIcon = require("../assets/animationLastKeyIcon.svg");
const firstKeyHoverIcon = require("../assets/animationLastKeyHoverIcon.svg");

const revKeyIcon = require("../assets/animationPlayRevIcon.svg");
const revKeyHoverIcon = require("../assets/animationPlayRevHoverIcon.svg");

const fwdKeyIcon = require("../assets/animationPlayFwdIcon.svg");
const fwdKeyHoverIcon = require("../assets/animationPlayFwdHoverIcon.svg");

const nextKeyIcon = require("../assets/animationNextKeyIcon.svg");
const nextKeyHoverIcon = require("../assets/animationNextKeyHoverIcon.svg");

const startKeyIcon = require("../assets/animationStartIcon.svg");

const endKeyIcon = require("../assets/animationEndIcon.svg");

interface IMediaPlayerComponentProps {
    globalState: GlobalState;
    context: Context;
}

interface IMediaPlayerComponentState {
}

export class MediaPlayerComponent extends React.Component<
IMediaPlayerComponentProps,
IMediaPlayerComponentState
> {

    constructor(props: IMediaPlayerComponentProps) {
        super(props);

        this.state = { };
    }

    private _onFirstKey() {

    }

    private _onPrevKey() {

    }
    
    private _onRewind() {
        this.props.context.play(false);
    }

    private _onForward() {
        this.props.context.play(true);
    }

    private _onNextKey() {

    }

    private _onEndKey() {

    }

    public render() {
        return (
            <div id="media-player">
                <ActionButtonComponent id="start-key" context={this.props.context} globalState={this.props.globalState} icon={startKeyIcon} onClick={() => this._onPrevKey()}/>
                <ControlButtonComponent id="first-key" context={this.props.context} globalState={this.props.globalState} icon={firstKeyIcon} hoverIcon={firstKeyHoverIcon} onClick={() => this._onFirstKey()}/>
                <ControlButtonComponent id="rev-key" context={this.props.context} globalState={this.props.globalState} icon={revKeyIcon} hoverIcon={revKeyHoverIcon} onClick={() => this._onRewind()}/>
                <ControlButtonComponent id="fwd-key" context={this.props.context} globalState={this.props.globalState} icon={fwdKeyIcon} hoverIcon={fwdKeyHoverIcon} onClick={() => this._onForward()}/>
                <ControlButtonComponent id="next-key" context={this.props.context} globalState={this.props.globalState} icon={nextKeyIcon} hoverIcon={nextKeyHoverIcon} onClick={() => this._onNextKey()}/>
                <ActionButtonComponent id="end-key" context={this.props.context} globalState={this.props.globalState} icon={endKeyIcon} onClick={() => this._onEndKey()}/>
            </div>
        );
    }
}