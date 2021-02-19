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
            if (this._currentAnimation === this.props.context.activeAnimation) {
                return;
            }

            this._currentAnimation = this.props.context.activeAnimation;
            this._computeSizes();
            this.forceUpdate();
        });
    }

    componentWillUnmount() {
        if (this._onActiveAnimationChangedObserver) {
            this.props.context.onActiveAnimationChanged.remove(this._onActiveAnimationChangedObserver);
        }
    }

    private _computeSizes() {
        if (!this._svgHost.current) {
            return;
        }

        this._viewWidth = this._svgHost.current.clientWidth;
        this.forceUpdate();
    }

    private _buildFrames() {
        if (!this._currentAnimation) {
            return null;
        }

        const from = this.props.context.fromKey;
        const to = this.props.context.toKey;

        let stepCounts = 20;
        let range = to - from;
        let offset = (range / stepCounts) | 0;
        let convertRatio = range / this._viewWidth;

        let steps = [];

        let startPosition = this._offsetX * convertRatio;
        let start = from - ((startPosition / offset) | 0) * offset;
        let end = start + range;

        for (var step = start - offset; step <= end + offset; step += offset) {
            steps.push(step);
        }

        return (
            steps.map((s, i) => {
                let x = (s - from) / convertRatio;
                return (
                    <g key={"axis" + s}>
                        <line
                            key={"line" + s}
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
                            key={"label" + s}
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
                </svg>
            </div>
        );
    }
}