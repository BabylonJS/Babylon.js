import * as React from "react";
import { GlobalState } from "../../../../../../globalState";
import { Context } from "../context";
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
const startKeyHoverIcon = require("../assets/animationStartHoverIcon.svg");

const endKeyIcon = require("../assets/animationEndIcon.svg");
const endKeyHoverIcon = require("../assets/animationEndHoverIcon.svg");

const stopIcon = require("../assets/animationStopIcon.svg");
const stopHoverIcon = require("../assets/animationStopHoverIcon.svg");

const nextFrameIcon = require("../assets/animationNextFrameIcon.svg");
const nextFrameHoverIcon = require("../assets/animationNextFrameHoverIcon.svg");

const lastFrameIcon = require("../assets/animationLastFrameIcon.svg");
const lastFrameHoverIcon = require("../assets/animationLastFrameHoverIcon.svg");

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
        const prevKey = this.props.context.getPrevKey();

        if (prevKey !== null) {
            this.props.context.onMoveToFrameRequired.notifyObservers(prevKey);
        }
    }
    
    private _onRewind() {
        this.props.context.play(false);
        this.forceUpdate();
    }

    private _onForward() {
        this.props.context.play(true);
        this.forceUpdate();
    }

    private _onPrevFrame() {
        this.props.context.onMoveToFrameRequired.notifyObservers(Math.max(0, this.props.context.activeFrame - 1));
    }

    private _onNextFrame() {
        this.props.context.onMoveToFrameRequired.notifyObservers(this.props.context.activeFrame + 1);
    }

    private _onNextKey() {
        const nextKey = this.props.context.getNextKey();

        if (nextKey !== null) {
            this.props.context.onMoveToFrameRequired.notifyObservers(nextKey);
        }
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
                <ControlButtonComponent tooltip="Rewind to the previous frame" id="prev-frame" context={this.props.context} globalState={this.props.globalState} icon={lastFrameIcon} hoverIcon={lastFrameHoverIcon} onClick={() => this._onPrevFrame()}/>
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
                <ControlButtonComponent tooltip="Advance to the next frame" id="next-frame" context={this.props.context} globalState={this.props.globalState} icon={nextFrameIcon} hoverIcon={nextFrameHoverIcon} onClick={() => this._onNextFrame()}/>
                <ControlButtonComponent tooltip="Advance to the last frame of the selected timeline" id="end-key" context={this.props.context} globalState={this.props.globalState} icon={endKeyIcon}  hoverIcon={endKeyHoverIcon} onClick={() => this._onEndKey()}/>
            </div>
        );
    }
}