import { TargetedAnimation } from "babylonjs/Animations/animationGroup";
import * as React from "react";
import { GlobalState } from "../../../../../../globalState";
import { Context } from "../context";
import { ControlButtonComponent } from "../controls/controlButtonComponent";
import { Animation } from "babylonjs/Animations/animation";

const firstKeyIcon = require("../assets/animationLastKeyIcon.svg");
const firstKeyHoverIcon = require("../assets/animationLastKeyHoverIcon.svg");

const revKeyIcon = require("../assets/animationPlayRevIcon.svg");
const revKeyHoverIcon = require("../assets/animationPlayRevHoverIcon.svg");

const fwdKeyIcon = require("../assets/animationPlayFwdIcon.svg");
const fwdKeyHoverIcon = require("../assets/animationPlayFwdHoverIcon.svg");

const nextKeyIcon = require("../assets/animationNextKeyIcon.svg");
const nextKeyHoverIcon = require("../assets/animationNextKeyHoverIcon.svg");

const startKeyIcon = require("../assets/animationStartIcon.svg");
const startKeyHoverIcon = require("../assets/animationStartHoverIcon.svg");

const endKeyIcon = require("../assets/animationEndIcon.svg");
const endKeyHoverIcon = require("../assets/animationEndHoverIcon.svg");

const stopIcon = require("../assets/animationStopIcon.svg");
const stopHoverIcon = require("../assets/animationStopHoverIcon.svg");

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
    private _isMounted = false;

    constructor(props: IMediaPlayerComponentProps) {
        super(props);

        this.state = { };

        this.props.context.onAnimationStateChanged.add(() => {
            if (!this._isMounted) {
                return;
            }
            this.forceUpdate();
        });
    }

    componentDidMount() {
        this._isMounted = true;
    }

    componentWillUnmount() {
        this._isMounted = false;
    }

    private _onFirstKey() {
        this.props.context.onMoveToFrameRequired.notifyObservers(this.props.context.fromKey);
    }

    private _onPrevKey() {
        if (!this.props.context.animations || !this.props.context.animations.length) {
            return;
        }

        let prevKey = -Number.MAX_VALUE;

        for (var animation of this.props.context.animations) {
            const keys = this.props.context.useTargetAnimations ? (animation as TargetedAnimation).animation.getKeys() : (animation as Animation).getKeys();

            for (var key of keys) {
                if (key.frame < this.props.context.activeFrame && key.frame > prevKey) {
                    prevKey = key.frame;
                }
            }
        }

        if (prevKey === -Number.MAX_VALUE) {
            prevKey = this.props.context.fromKey;
        }

        this.props.context.onMoveToFrameRequired.notifyObservers(prevKey);
    }
    
    private _onRewind() {
        this.props.context.play(false);
        this.forceUpdate();
    }

    private _onForward() {
        this.props.context.play(true);
        this.forceUpdate();
    }

    private _onNextKey() {
        if (!this.props.context.animations || !this.props.context.animations.length) {
            return;
        }

        let nextKey = Number.MAX_VALUE;

        for (var animation of this.props.context.animations) {
            const keys = this.props.context.useTargetAnimations ? (animation as TargetedAnimation).animation.getKeys() : (animation as Animation).getKeys();

            for (var key of keys) {
                if (key.frame > this.props.context.activeFrame && key.frame < nextKey) {
                    nextKey = key.frame;
                }
            }
        }

        if (nextKey === Number.MAX_VALUE) {
            nextKey = this.props.context.toKey;
        }

        this.props.context.onMoveToFrameRequired.notifyObservers(nextKey);
    }

    private _onEndKey() {
        this.props.context.onMoveToFrameRequired.notifyObservers(this.props.context.toKey);
    }

    private _onStop() {
        this.props.context.stop();
        this.forceUpdate();
    }

    public render() {
        return (
            <div id="media-player">
                <ControlButtonComponent tooltip="Rewind to the first frame of the selected timeline"  id="start-key" context={this.props.context} globalState={this.props.globalState} icon={startKeyIcon}  hoverIcon={startKeyHoverIcon} onClick={() => this._onFirstKey()}/>
                <ControlButtonComponent tooltip="Rewind to the previous key frame" id="first-key" context={this.props.context} globalState={this.props.globalState} icon={firstKeyIcon} hoverIcon={firstKeyHoverIcon} onClick={() => this._onPrevKey()}/>
                { (this.props.context.isPlaying && this.props.context.forwardAnimation || !this.props.context.isPlaying) && 
                    <ControlButtonComponent tooltip="Play backwards" id="rev-key" context={this.props.context} globalState={this.props.globalState} icon={revKeyIcon} hoverIcon={revKeyHoverIcon} onClick={() => this._onRewind()}/>
                }                
                { (this.props.context.isPlaying && !this.props.context.forwardAnimation) && 
                    <ControlButtonComponent tooltip="Stop" id="stop-key" context={this.props.context} globalState={this.props.globalState} icon={stopIcon} hoverIcon={stopHoverIcon} onClick={() => this._onStop()}/>
                }
                { (this.props.context.isPlaying && !this.props.context.forwardAnimation || !this.props.context.isPlaying) && 
                    <ControlButtonComponent tooltip="Play forwards" id="fwd-key" context={this.props.context} globalState={this.props.globalState} icon={fwdKeyIcon} hoverIcon={fwdKeyHoverIcon} onClick={() => this._onForward()}/>
                }
                { (this.props.context.isPlaying && this.props.context.forwardAnimation) && 
                    <ControlButtonComponent tooltip="Stop" id="stop-key" context={this.props.context} globalState={this.props.globalState} icon={stopIcon} hoverIcon={stopHoverIcon} onClick={() => this._onStop()}/>
                }
                <ControlButtonComponent tooltip="Advance to the next key frame" id="next-key" context={this.props.context} globalState={this.props.globalState} icon={nextKeyIcon} hoverIcon={nextKeyHoverIcon} onClick={() => this._onNextKey()}/>
                <ControlButtonComponent tooltip="Advance to the last frame of the selected timeline" id="end-key" context={this.props.context} globalState={this.props.globalState} icon={endKeyIcon}  hoverIcon={endKeyHoverIcon} onClick={() => this._onEndKey()}/>
            </div>
        );
    }
}