import { Nullable } from "babylonjs/types";
import * as React from "react";
import { GlobalState } from "../../../../../../globalState";
import { Context } from "../context";
import { Animation } from "babylonjs/Animations/animation";
import { Observer } from "babylonjs/Misc/observable";

interface IRangeFrameBarComponentProps {
    globalState: GlobalState;
    context: Context;
}

interface IRangeFrameBarComponentState {
}

export class RangeFrameBarComponent extends React.Component<
IRangeFrameBarComponentProps,
IRangeFrameBarComponentState
> {        
    private _svgHost: React.RefObject<SVGSVGElement>;
    private _viewWidth = 748;
    private _offsetX = 10;
    private _isMounted = false;

    private _currentAnimation: Nullable<Animation>;
    
    private _onActiveAnimationChangedObserver: Nullable<Observer<void>>;

    constructor(props: IRangeFrameBarComponentProps) {
        super(props);

        this.state = { };
        
        this._svgHost = React.createRef();

        this.props.context.onHostWindowResized.add(() => {
            this._computeSizes();
        });

        this._onActiveAnimationChangedObserver = this.props.context.onActiveAnimationChanged.add(() => {
            this._currentAnimation = this.props.context.activeAnimation;

            if (!this._isMounted) {
                return;
            }

            this._computeSizes();
            this.forceUpdate();
        });

        this.props.context.onFrameSet.add(() => {
            if (!this._isMounted) {
                return;
            }

            this.forceUpdate();
        });

        this.props.context.onRangeUpdated.add(() => {
            if (!this._isMounted) {
                return;
            }

            this.forceUpdate();
        })
    }

    componentDidMount() {
        this._isMounted = true;
    }

    componentWillUnmount() {
        if (this._onActiveAnimationChangedObserver) {
            this.props.context.onActiveAnimationChanged.remove(this._onActiveAnimationChangedObserver);
        }

        this._isMounted = false;
    }

    private _computeSizes() {
        if (!this._svgHost.current) {
            return;
        }

        this._viewWidth = this._svgHost.current.clientWidth;
        this.forceUpdate();
    }

    private _dropKeyFrames() {
        if (!this._currentAnimation) {
            return null;
        }

        const from = this.props.context.fromKey;
        const to = this.props.context.toKey;
        let range = to - from;
        let convertRatio = range / this._viewWidth;
        
        const keys = this._currentAnimation.getKeys();

        return (
            keys.map((k, i) => {
                let x = (k.frame - from) / convertRatio;
                return (
                    <line
                        key={"frame-line" + k.frame + i}
                        x1={x}
                        y1="0px"
                        x2={x}
                        y2="40px"
                        style={{
                            stroke: "#ffc017",
                            strokeWidth: 0.5,
                        }}>
                    </line>
                )
            })
        )
    }

    private _buildFrames() {
        if (!this._currentAnimation) {
            return null;
        }

        const from = this.props.context.fromKey;
        const to = this.props.context.toKey;

        let range = to - from;
        let stepCounts = Math.min(20, to - from);
        let offset = (range / stepCounts) | 0;
        let convertRatio = range / this._viewWidth;

        let steps = [];

        let start = from;
        let end = start + range;

        for (var step = start; step <= end; step += offset) {
            steps.push(step);
        }

        if (steps[steps.length - 1] < end - offset / 2) {
            steps.push(end);
        }        

        return (
            steps.map((s, i) => {
                let x = (s - from) / convertRatio;
                return (
                    <g key={"axis" + s + i}>
                        <line
                            key={"line" + s + i}
                            x1={x}
                            y1="22px"
                            x2={x}
                            y2="40px"
                            style={{
                                stroke: "#333333",
                                strokeWidth: 0.5,
                            }}>
                        </line>
                        <text
                            key={"label" + s + i}
                            x={x}
                            y={0}
                            dx="6px"
                            textAnchor="middle"
                            dy="14px"
                            style={{
                                fontFamily:"acumin-pro-condensed",                                
                                fontSize: `12px`,
                                fill: "#555555",
                                textAlign: "center",
                            }}
                        >
                            {s.toFixed(0)}
                        </text>
                    </g>
                )
            })
        )
    }

    public render() {

        const viewBox = `${-this._offsetX} 0 ${this._viewWidth + this._offsetX * 4} 40`;

        return (
            <div id="range-frame-bar">
                <svg
                    id="svg-range-frames"
                    viewBox={viewBox}
                    ref={this._svgHost}
                    >
                    {
                        this._buildFrames()
                    }
                    {
                        this._dropKeyFrames()
                    }
                </svg>
            </div>
        );
    }
}