import { TargetedAnimation } from "babylonjs/Animations/animationGroup";
import * as React from "react";
import { GlobalState } from "../../../../../../globalState";
import { Context } from "../context";
import { Animation } from "babylonjs/Animations/animation";

const handleIcon = require("../assets/scrollbarHandleIcon.svg");

interface IRangeSelectorComponentProps {
    globalState: GlobalState;
    context: Context;
}

interface IRangeSelectorComponentState {
}

export class RangeSelectorComponent extends React.Component<
IRangeSelectorComponentProps,
IRangeSelectorComponentState
> {        
    private _rangeHost: React.RefObject<HTMLDivElement>;
    private _rangeScrollbarHost: React.RefObject<HTMLDivElement>;
    private _viewWidth = 748;
    private _pointerIsDown: boolean;
    private _minFrame: number;
    private _maxFrame: number;

    private _leftHandleIsActive: boolean;
    private _bothHandleIsActive: boolean;
    private _currentOffset: number;
    private _currentFrom: number;
    private _currentTo: number;

    constructor(props: IRangeSelectorComponentProps) {
        super(props);

        this.state = { };
        
        this._rangeHost = React.createRef();
        this._rangeScrollbarHost = React.createRef();

        this.props.context.onHostWindowResized.add(() => {
            this._computeSizes();
        });

        this.props.context.onFrameSet.add(() => {
            this.forceUpdate();
        });

        this.props.context.onAnimationsLoaded.add(() => {
            this.forceUpdate();
        });

        this._updateLimits();
    }

    private _computeSizes() {
        if (!this._rangeHost.current) {
            return;
        }

        this._viewWidth = this._rangeHost.current.clientWidth - 4;
        this.forceUpdate();
    }

    private _onPointerDown(evt: React.PointerEvent<HTMLDivElement>) {
        this._bothHandleIsActive = false;

        if ((evt.nativeEvent.target as HTMLDivElement).id === "left-handle" ) {
            this._leftHandleIsActive = true;
        } else if ((evt.nativeEvent.target as HTMLDivElement).id === "right-handle" ) {
            this._leftHandleIsActive = false;
        } else {           
            this._bothHandleIsActive = true;
            this._currentOffset = evt.nativeEvent.clientX;
            this._currentFrom = this.props.context.fromKey;            
            this._currentTo = this.props.context.toKey;
        }

        this._pointerIsDown = true;
        evt.currentTarget.setPointerCapture(evt.pointerId);
    }

    private _onPointerMove(evt: React.PointerEvent<HTMLDivElement>) {
        if (!this._pointerIsDown) {
            return;
        }

        if (!this.props.context.animations || !this.props.context.animations.length) {
            return;
        }

        this._updateLimits();
        let left = evt.nativeEvent.offsetX;

        if (this._bothHandleIsActive) {
            left = evt.nativeEvent.clientX - this._currentOffset;
        }

        let offset = (left / this._viewWidth) * (this._maxFrame - this._minFrame);
        const newValue = Math.min(this._maxFrame, Math.max(this._minFrame, Math.round(this._minFrame + offset)));

        if (this._bothHandleIsActive) {

            if (this._currentTo + offset > this._maxFrame) {
                offset = this._maxFrame - this._currentTo;
            }
            if (this._currentFrom + offset < this._minFrame) {
                offset = this._minFrame - this._currentFrom;
            }

            this.props.context.fromKey = Math.min(this._maxFrame, Math.max(this._minFrame, (this._currentFrom + offset) | 0));  
            this.props.context.toKey = Math.min(this._maxFrame, Math.max(this._minFrame, (this._currentTo + offset) | 0));
        } else if (this._leftHandleIsActive) {
            this.props.context.fromKey = newValue;  
            
            this.props.context.fromKey = Math.min(this.props.context.toKey - 1, this.props.context.fromKey);
        } else {
            this.props.context.toKey = newValue;
            this.props.context.toKey = Math.max(this.props.context.fromKey + 1, this.props.context.toKey);
        }
        

        this.props.context.onRangeUpdated.notifyObservers();
        this.props.context.stop();

        this.forceUpdate();
    }

    private _updateLimits() {
        if (!this.props.context.animations || !this.props.context.animations.length) {
            return;
        }

        let minFrame = Number.MAX_VALUE;
        let maxFrame = -Number.MAX_VALUE;

        for (var animation of this.props.context.animations) {
            const keys = this.props.context.useTargetAnimations ? (animation as TargetedAnimation).animation.getKeys() : (animation as Animation).getKeys();

            minFrame = Math.min(minFrame, keys[0].frame);
            maxFrame = Math.max(maxFrame, keys[keys.length - 1].frame);
        }

        this._minFrame = minFrame;
        this._maxFrame = maxFrame;
    }

    private _onPointerUp(evt: React.PointerEvent<HTMLDivElement>) {
        this._pointerIsDown = false;
        evt.currentTarget.releasePointerCapture(evt.pointerId);
    }

    public render() {
        this._updateLimits();

        const ratio = this._maxFrame - this._minFrame

        if (this.props.context.toKey > this._maxFrame ) {
            this.props.context.toKey = this._maxFrame;
        }

        return (
            <div id="range-selector" ref={this._rangeHost}
                onPointerDown={evt => this._onPointerDown(evt)}
                onPointerMove={evt => this._onPointerMove(evt)}
                onPointerUp={evt => this._onPointerUp(evt)}
            >
                <div id="range-scrollbar" 
                    ref={this._rangeScrollbarHost}
                    style={
                        {
                            left: `${2 + ((this.props.context.fromKey - this._minFrame) / ratio) * this._viewWidth}px`,
                            right: `${2 + ((this._maxFrame - this.props.context.toKey) / ratio) * this._viewWidth}px`,
                        }
                    }>
                    <div id="left-handle" className="handle">
                        <img src={handleIcon} />
                    </div>
                    <div id="from-key">
                        {this.props.context.fromKey | 0}
                    </div>
                    <div id="to-key">
                        {this.props.context.toKey | 0}
                    </div>
                    <div id="right-handle" className="handle">
                        <img src={handleIcon} />
                    </div>
                </div>
            </div>
        );
    }
}