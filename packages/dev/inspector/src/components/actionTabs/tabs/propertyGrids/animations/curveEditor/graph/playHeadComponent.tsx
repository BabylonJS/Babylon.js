import type { Observer } from "core/Misc/observable";
import type { Scene } from "core/scene";
import type { Nullable } from "core/types";
import * as React from "react";
import type { GlobalState } from "../../../../../../globalState";
import type { Context, IActiveAnimationChangedOptions } from "../context";

interface IPlayHeadComponentProps {
    globalState: GlobalState;
    context: Context;
}

interface IPlayHeadComponentState {}

export class PlayHeadComponent extends React.Component<IPlayHeadComponentProps, IPlayHeadComponentState> {
    private readonly _graphAbsoluteWidth = 788;
    private _playHead: React.RefObject<HTMLDivElement>;
    private _playHeadCircle: React.RefObject<HTMLDivElement>;
    private _onBeforeRenderObserver: Nullable<Observer<Scene>>;
    private _onActiveAnimationChangedObserver: Nullable<Observer<IActiveAnimationChangedOptions>>;
    private _viewScale = 1;
    private _offsetX = 0;
    private _offsetRange = 0;
    private _isMounted = false;

    private _pointerIsDown: boolean;

    constructor(props: IPlayHeadComponentProps) {
        super(props);

        this.state = {};

        this._playHead = React.createRef();
        this._playHeadCircle = React.createRef();

        this._onActiveAnimationChangedObserver = this.props.context.onActiveAnimationChanged.add(() => {
            this.forceUpdate();
        });

        this._onBeforeRenderObserver = this.props.context.scene.onBeforeRenderObservable.add(() => {
            if (this.props.context.activeAnimations.length === 0) {
                return;
            }

            const animation = this.props.context.activeAnimations[0];

            if (!animation) {
                return;
            }
            const runtimeAnimation = animation.runtimeAnimations[0];

            if (runtimeAnimation) {
                this._moveHead(runtimeAnimation.currentFrame);
            } else if (!this._playHeadCircle.current?.innerHTML) {
                this._moveHead(0);
            }
        });

        this.props.context.onMoveToFrameRequired.add((frame) => {
            this.props.context.moveToFrame(frame);
            this._moveHead(frame);
        });

        this.props.context.onGraphMoved.add((x) => {
            if (!this._isMounted) {
                return;
            }

            this._offsetX = x;
            this.forceUpdate();

            this._moveHead(this.props.context.activeFrame);
        });

        this.props.context.onGraphScaled.add((scale) => {
            if (!this._isMounted) {
                return;
            }

            this._viewScale = 1 / scale;
            this.forceUpdate();

            this._moveHead(this.props.context.activeFrame);
        });
    }

    componentDidMount() {
        this._isMounted = true;
    }

    private _moveHead(frame: number) {
        if (!this._playHead.current || !this._playHeadCircle.current || frame === undefined) {
            return;
        }

        this._playHead.current.style.left = this._frameToPixel(frame) + "px";
        this._playHeadCircle.current.innerHTML = frame.toFixed(0);

        this.props.context.activeFrame = frame;
    }

    private _frameToPixel(frame: number, offsetX = this._offsetX, scale = this._viewScale) {
        const minFrame = this.props.context.referenceMinFrame;
        const maxFrame = this.props.context.referenceMaxFrame;

        return (((frame - minFrame) / (maxFrame - minFrame)) * this._graphAbsoluteWidth + offsetX) * scale;
    }

    private _pixelToFrame(pixel: number, offsetX = this._offsetX, scale = this._viewScale) {
        const animation = this.props.context.activeAnimations[0];
        const keys = animation.getKeys();
        const minFrame = this.props.context.referenceMinFrame;
        const maxFrame = this.props.context.referenceMaxFrame;

        return Math.max(((pixel / scale - offsetX) / this._graphAbsoluteWidth) * (maxFrame - minFrame) + minFrame, keys[0].frame);
    }

    componentWillUnmount() {
        if (this._onBeforeRenderObserver) {
            this.props.context.scene.onBeforeRenderObservable.remove(this._onBeforeRenderObserver);
            this._onBeforeRenderObserver = null;
        }

        if (this._onActiveAnimationChangedObserver) {
            this.props.context.onActiveAnimationChanged.remove(this._onActiveAnimationChangedObserver);
        }

        this._isMounted = false;
    }

    private _onPointerDown(evt: React.PointerEvent<HTMLDivElement>, offsetX?: number, scale?: number) {
        evt.preventDefault();

        this._pointerIsDown = true;
        evt.currentTarget.setPointerCapture(evt.pointerId);

        const frame = this._pixelToFrame(evt.nativeEvent.offsetX, offsetX, scale);
        this.props.context.moveToFrame(frame);

        this._moveHead(frame);
    }

    private _onPointerMove(evt: React.PointerEvent<HTMLDivElement>, offsetX?: number, scale?: number) {
        if (!this._pointerIsDown) {
            return;
        }

        const frame = this._pixelToFrame(evt.nativeEvent.offsetX, offsetX, scale);
        this.props.context.moveToFrame(frame);

        this._moveHead(frame);
    }

    private _onPointerUp(evt: React.PointerEvent<HTMLDivElement>) {
        this._pointerIsDown = false;
        evt.currentTarget.releasePointerCapture(evt.pointerId);
    }

    public render() {
        if (this.props.context.activeAnimations.length === 0) {
            return null;
        }

        return (
            <>
                <div id="play-head" ref={this._playHead}>
                    <div id="play-head-bar"></div>
                    <div id="play-head-circle" ref={this._playHeadCircle} />
                </div>
                <div
                    id="play-head-control"
                    onPointerDown={(evt) => this._onPointerDown(evt)}
                    onPointerMove={(evt) => this._onPointerMove(evt)}
                    onPointerUp={(evt) => this._onPointerUp(evt)}
                ></div>
                <div
                    id="play-head-control-2"
                    onPointerDown={(evt) => this._onPointerDown(evt, this._offsetRange, 1)}
                    onPointerMove={(evt) => this._onPointerMove(evt, this._offsetRange, 1)}
                    onPointerUp={(evt) => this._onPointerUp(evt)}
                ></div>
            </>
        );
    }
}
