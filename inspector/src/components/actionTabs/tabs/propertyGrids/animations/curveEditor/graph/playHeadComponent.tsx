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
    private _onBeforeRenderObserver: Nullable<Observer<Scene>>;
    private _onActiveAnimationChangedObserver: Nullable<Observer<void>>;
    private _viewScale = 1;
    private _offsetX = 0;
    
    private _pointerIsDown: boolean;
    
    constructor(props: IPlayHeadComponentProps) {
        super(props);

        this.state = { };
        
        this._playHead = React.createRef();
        this._playHeadCircle = React.createRef();

        this._onActiveAnimationChangedObserver = this.props.context.onActiveAnimationChanged.add(() => {
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
                this._moveHead(runtimeAnimation.currentFrame);
            } else if (!this._playHeadCircle.current?.innerHTML){
                this._moveHead(0);
            }       
        });

        this.props.context.onMoveToFrameRequired.add(frame => {
            this.props.context.moveToFrame(frame);
            this._moveHead(frame);
        })

        this.props.context.onGraphMoved.add(x => {
            this._offsetX = x;
            this.forceUpdate();

            this._moveHead(this.props.context.activeFrame);
        });

        this.props.context.onGraphScaled.add(scale => {
            this._viewScale =  1 /scale;
            this.forceUpdate();

            this._moveHead(this.props.context.activeFrame);
        });
    }

    private _moveHead(frame: number) {
        if (!this._playHead.current || !this._playHeadCircle.current || frame === undefined) {
            return;
        }

        this._playHead.current.style.left = this._frameToPixel(frame) + "px"
        this._playHeadCircle.current.innerHTML = frame.toFixed(0);

        this.props.context.activeFrame = frame;
    }

    private _frameToPixel(frame: number) {
        let minFrame = this.props.context.referenceMinFrame;
        let maxFrame = this.props.context.referenceMaxFrame;

        return (((frame - minFrame) /  (maxFrame - minFrame)) * this._GraphAbsoluteWidth + this._offsetX) * this._viewScale;
    }

    private _pixelToFrame(pixel: number) {
        let animation = this.props.context.activeAnimation!;
        let keys = animation.getKeys();
        let minFrame = this.props.context.referenceMinFrame;
        let maxFrame = this.props.context.referenceMaxFrame;

        return  Math.max(Math.min(keys[keys.length - 1].frame, ((pixel / this._viewScale - this._offsetX) / this._GraphAbsoluteWidth) * (maxFrame - minFrame) + minFrame), keys[0].frame);
    }

    componentWillUnmount() {
        if (this._onBeforeRenderObserver) {
            this.props.context.scene.onBeforeRenderObservable.remove(this._onBeforeRenderObserver);
            this._onBeforeRenderObserver = null;
        }

        if (this._onActiveAnimationChangedObserver) {
            this.props.context.onActiveAnimationChanged.remove(this._onActiveAnimationChangedObserver);
        }
    }

    private _onPointerDown(evt: React.PointerEvent<HTMLDivElement>) {
        this._pointerIsDown = true;
        evt.currentTarget.setPointerCapture(evt.pointerId);

        const frame = this._pixelToFrame(evt.nativeEvent.offsetX);
        this.props.context.moveToFrame(frame);
               
        this._moveHead(frame);
    }

    private _onPointerMove(evt: React.PointerEvent<HTMLDivElement>) {
        if (!this._pointerIsDown) {
            return;
        }

        const frame = this._pixelToFrame(evt.nativeEvent.offsetX);
        this.props.context.moveToFrame(frame);
               
        this._moveHead(frame);
    }

    private _onPointerUp(evt: React.PointerEvent<HTMLDivElement>) {
        this._pointerIsDown = false;
        evt.currentTarget.releasePointerCapture(evt.pointerId);
    }

    public render() {
        if (!this.props.context.activeAnimation) {
            return null;
        }

        return (
            <>
                <div id="play-head" ref={this._playHead}>
                    <div id="play-head-bar"></div>
                    <div id="play-head-circle" ref={this._playHeadCircle}/>
                </div>
                <div 
                    id="play-head-control"
                        onPointerDown={evt => this._onPointerDown(evt)}
                        onPointerMove={evt => this._onPointerMove(evt)}
                        onPointerUp={evt => this._onPointerUp(evt)}
                ></div>                
            </>
        );
    }
}