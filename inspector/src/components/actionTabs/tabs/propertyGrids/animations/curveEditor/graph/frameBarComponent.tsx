import { Nullable } from "babylonjs/types";
import * as React from "react";
import { GlobalState } from "../../../../../../globalState";
import { Context } from "../context";
import { Animation } from "babylonjs/Animations/animation";
import { Observer } from "babylonjs/Misc/observable";

interface IFrameBarComponentProps {
    globalState: GlobalState;
    context: Context;
}

interface IFrameBarComponentState {
}

export class FrameBarComponent extends React.Component<
IFrameBarComponentProps,
IFrameBarComponentState
> {        
    private readonly _GraphAbsoluteWidth = 788;
    private _svgHost: React.RefObject<SVGSVGElement>;
    private _viewWidth = 748;
    private _viewScale = 1;
    private _offsetX = 0;
    
    private _currentAnimation: Nullable<Animation>;

    
    private _onActiveAnimationChangedObserver: Nullable<Observer<void>>;

    constructor(props: IFrameBarComponentProps) {
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

        this.props.context.onGraphMoved.add(x => {
            this._offsetX = x;
            this.forceUpdate();
        });

        this.props.context.onGraphScaled.add(scale => {
            this._viewScale = scale;
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

        let minFrame = this.props.context.referenceMinFrame;
        let maxFrame = this.props.context.referenceMaxFrame;

        let stepCounts = 20;
        let range = maxFrame - minFrame;
        let offset = (range / stepCounts) | 0;
        let convertRatio = range / this._GraphAbsoluteWidth;

        let steps = [];

        if (offset === 0) {
            offset = 1;
        }

        let startPosition = this._offsetX * convertRatio;
        let start = minFrame - ((startPosition / offset) | 0) * offset;
        let end = start + (this._viewWidth * this._viewScale ) * convertRatio;

        for (var step = start - offset; step <= end + offset; step += offset) {
            steps.push(step);
        }

        return (
            steps.map((s, i) => {
                let x = (s - minFrame) / convertRatio;
                return (
                    <g key={"axis" + s}>
                        <line
                            key={"line" + s}
                            x1={x}
                            y1={`${5 * this._viewScale}px`}
                            x2={x}
                            y2={`${30 * this._viewScale}px`}
                            style={{
                                stroke: "#333333",
                                strokeWidth: 0.5,
                            }}>
                        </line>
                        <text
                            key={"label" + s}
                            x={x}
                            y={0}
                            dx={`${7 * this._viewScale}px`}
                            textAnchor="middle"
                            dy={`${15 * this._viewScale}px`}
                            style={{
                                fontFamily:"acumin-pro-condensed",                                
                                fontSize: `${10 * this._viewScale}px`,
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

        const viewBox = `${-this._offsetX} 0 ${Math.round(this._viewWidth * this._viewScale)} ${Math.round(30 * this._viewScale)}`;

        return (
            <div id="frame-bar">
                <div id="angle-unit">
                </div>

                <div id="frames">
                    <svg
                        id="svg-frames"
                        viewBox={viewBox}
                        ref={this._svgHost}
                        >
                        {
                            this._buildFrames()
                        }
                    </svg>
                </div>
            </div>
        );
    }
}