import { Observer } from "babylonjs/Misc/observable";
import { Scene } from "babylonjs/scene";
import { Nullable } from "babylonjs/types";
import * as React from "react";
import { GlobalState } from "../../../../../../globalState";
import { Context } from "../context";

interface IPlayHeadComponentProps {
    globalState: GlobalState;
    context: Context;
}

interface IPlayHeadComponentState {
}

export class PlayHeadComponent extends React.Component<
IPlayHeadComponentProps,
IPlayHeadComponentState
> {        
    private readonly _GraphAbsoluteWidth = 788;
    private _playHead: React.RefObject<HTMLDivElement>;
    private _playHeadCircle: React.RefObject<HTMLDivElement>;
    private _playHeadArea: React.RefObject<HTMLDivElement>;
    private _onBeforeRenderObserver: Nullable<Observer<Scene>>;
    private _viewScale = 1;
    private _offsetX = 0;
    
    constructor(props: IPlayHeadComponentProps) {
        super(props);

        this.state = { };
        
        this._playHead = React.createRef();
        this._playHeadArea = React.createRef();
        this._playHeadCircle = React.createRef();

        this.props.context.onActiveAnimationChanged.add(() => {
            this.forceUpdate();
        });   
        
        this._onBeforeRenderObserver = this.props.context.scene.onBeforeRenderObservable.add(() => {
            if (!this.props.context.activeAnimation) {
                return;
            }

            let animation = this.props.context.activeAnimation;

            if (!animation) {
                return;
            }
            let runtimeAnimation = animation.runtimeAnimations[0];

            if (runtimeAnimation) {
                this._playHead.current!.style.left = this._frameToPixel(runtimeAnimation.currentFrame) + "px"
                this._playHeadCircle.current!.innerHTML = runtimeAnimation.currentFrame.toFixed(2);
            }
        });

        this.props.context.onGraphMoved.add(x => {
            this._offsetX = x;
            this.forceUpdate();
        });

        this.props.context.onGraphScaled.add(scale => {
            this._viewScale =  1 /scale;
            this.forceUpdate();
        });
    }

    private _frameToPixel(frame: number) {
        let animation = this.props.context.activeAnimation!;
        let keys = animation.getKeys();
        let minFrame = keys[0].frame;
        let maxFrame = keys[keys.length - 1].frame;

        return (((frame - minFrame) /  (maxFrame - minFrame)) * this._GraphAbsoluteWidth + this._offsetX) * this._viewScale;
    }

    componentWillUnmount() {
        if (this._onBeforeRenderObserver) {
            this.props.context.scene.onBeforeRenderObservable.remove(this._onBeforeRenderObserver);
            this._onBeforeRenderObserver = null;
        }
    }

    public render() {
        if (!this.props.context.activeAnimation) {
            return null;
        }

        return (
            <div id="play-head-area" ref={this._playHeadArea}>
                <div id="play-head" ref={this._playHead}>
                    <div id="play-head-bar"></div>
                    <div id="play-head-circle" ref={this._playHeadCircle}>
                    </div>
                </div>
            </div>
        );
    }
}