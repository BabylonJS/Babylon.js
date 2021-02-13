import * as React from "react";
import { GlobalState } from "../../../../../../globalState";
import { AnimationCurveEditorContext } from "../animationCurveEditorContext";
import { Animation } from "babylonjs/Animations/animation";
import { AnimationCurveEditorCurve } from "./animationCurveEditorCurve";
import { AnimationCurveEditorKeyPointComponent } from "./animationCurveEditorKeyPoint";
import { AnimationCurveEditorCurveComponent } from "./animationCurveEditorCurveComponent";
import { Nullable } from "babylonjs/types";
import { Vector2 } from "babylonjs/Maths/math.vector";

interface IAnimationCurveEditorGraphComponentProps {
    globalState: GlobalState;
    context: AnimationCurveEditorContext;
}

interface IAnimationCurveEditorGraphComponentState {
}

export class AnimationCurveEditorGraphComponent extends React.Component<
IAnimationCurveEditorGraphComponentProps,
IAnimationCurveEditorGraphComponentState
> {
    private readonly _MinScale = 0.1;
    private readonly _MaxScale = 4;

    private _viewWidth = 788;
    private _viewCurveWidth = 788;
    private _viewHeight = 357;
    private _viewScale = 1;
    private _offsetX = 0;
    private _offsetY = 0;
    
    private _graphOffsetX = 30;
    private _graphAbsoluteWidth = 788;
    private _graphAbsoluteHeight = 357;

    private _minValue: number;
    private _maxValue: number;
    private _minFrame: number;
    private _maxFrame: number;
    private _svgHost: React.RefObject<SVGSVGElement>;
    private _svgHost2: React.RefObject<SVGSVGElement>;
    private _curves: AnimationCurveEditorCurve[];

    private _pointerIsDown: boolean;
    private _sourcePointerX: number;
    private _sourcePointerY: number;

    private _currentAnimation: Nullable<Animation>;

    constructor(props: IAnimationCurveEditorGraphComponentProps) {
        super(props);

        this.state = { };
        
        this._svgHost = React.createRef();
        this._svgHost2 = React.createRef();

        this._evaluateKeys();

        this.props.context.onHostWindowResized.add(() => {
            this._computeSizes();
        })

        this.props.context.onActiveAnimationChanged.add(() => {
            if (this._currentAnimation === this.props.context.activeAnimation) {
                return;
            }

            this._currentAnimation = this.props.context.activeAnimation;
            this._computeSizes();
            this.forceUpdate();
        });
    }

    private _computeSizes() {
        if (!this._svgHost.current || !this._svgHost2.current) {
            return;
        }

        this._viewWidth = this._svgHost.current.clientWidth;
        this._viewCurveWidth = this._svgHost2.current.clientWidth;
        this._viewHeight = this._svgHost.current.clientHeight;
        this.forceUpdate();
    }

    private _evaluateKeys() {
        if (!this.props.context.activeAnimation) {
            return;
        }
        let minValue = Number.MAX_VALUE;
        let maxValue = -Number.MAX_VALUE;
        let animation = this.props.context.activeAnimation;
        let keys = animation.getKeys();

        this._curves = [];

        switch (animation.dataType) {
            case Animation.ANIMATIONTYPE_FLOAT:
                this._curves.push(new AnimationCurveEditorCurve("#DB3E3E", animation)); 
            break;
            case Animation.ANIMATIONTYPE_VECTOR2:
                this._curves.push(new AnimationCurveEditorCurve("#DB3E3E", animation)); 
                this._curves.push(new AnimationCurveEditorCurve("#51E22D", animation)); 
            case Animation.ANIMATIONTYPE_VECTOR3:
            case Animation.ANIMATIONTYPE_COLOR3:
                this._curves.push(new AnimationCurveEditorCurve("#DB3E3E", animation)); 
                this._curves.push(new AnimationCurveEditorCurve("#51E22D", animation)); 
                this._curves.push(new AnimationCurveEditorCurve("#00A3FF", animation)); 
                break;
            case Animation.ANIMATIONTYPE_QUATERNION:
            case Animation.ANIMATIONTYPE_COLOR4:
                this._curves.push(new AnimationCurveEditorCurve("#DB3E3E", animation)); 
                this._curves.push(new AnimationCurveEditorCurve("#51E22D", animation)); 
                this._curves.push(new AnimationCurveEditorCurve("#00A3FF", animation)); 
                this._curves.push(new AnimationCurveEditorCurve("#8700FF", animation)); 
                break;
        }

        for (var key of keys) {
            switch (animation.dataType) {
                case Animation.ANIMATIONTYPE_FLOAT:
                    minValue = Math.min(minValue, key.value);
                    maxValue = Math.max(maxValue, key.value);

                    this._curves[0].keys.push(new Vector2(key.frame, key.value));
                    break;
                case Animation.ANIMATIONTYPE_VECTOR2:
                    minValue = Math.min(minValue, key.value.x);
                    minValue = Math.min(minValue, key.value.y);
                    maxValue = Math.max(maxValue, key.value.x);
                    maxValue = Math.max(maxValue, key.value.y);

                    this._curves[0].keys.push(new Vector2(key.frame, key.value.x));
                    this._curves[1].keys.push(new Vector2(key.frame, key.value.y));
                    break;
                case Animation.ANIMATIONTYPE_VECTOR3:
                    minValue = Math.min(minValue, key.value.x);
                    minValue = Math.min(minValue, key.value.y);
                    minValue = Math.min(minValue, key.value.z);
                    maxValue = Math.max(maxValue, key.value.x);
                    maxValue = Math.max(maxValue, key.value.y);
                    maxValue = Math.max(maxValue, key.value.z);

                    this._curves[0].keys.push(new Vector2(key.frame, key.value.x));
                    this._curves[1].keys.push(new Vector2(key.frame, key.value.y));
                    this._curves[2].keys.push(new Vector2(key.frame, key.value.z));

                    break;
                case Animation.ANIMATIONTYPE_COLOR3:
                    minValue = Math.min(minValue, key.value.r);
                    minValue = Math.min(minValue, key.value.g);
                    minValue = Math.min(minValue, key.value.b);
                    maxValue = Math.max(maxValue, key.value.r);
                    maxValue = Math.max(maxValue, key.value.g);
                    maxValue = Math.max(maxValue, key.value.b);

                    this._curves[0].keys.push(new Vector2(key.frame, key.value.r));
                    this._curves[1].keys.push(new Vector2(key.frame, key.value.g));
                    this._curves[2].keys.push(new Vector2(key.frame, key.value.b));

                    break;                    
                case Animation.ANIMATIONTYPE_QUATERNION:
                    minValue = Math.min(minValue, key.value.x);
                    minValue = Math.min(minValue, key.value.y);
                    minValue = Math.min(minValue, key.value.z);
                    minValue = Math.min(minValue, key.value.w);
                    maxValue = Math.max(maxValue, key.value.x);
                    maxValue = Math.max(maxValue, key.value.y);
                    maxValue = Math.max(maxValue, key.value.z);
                    maxValue = Math.max(maxValue, key.value.w);

                    this._curves[0].keys.push(new Vector2(key.frame, key.value.x));
                    this._curves[1].keys.push(new Vector2(key.frame, key.value.y));
                    this._curves[2].keys.push(new Vector2(key.frame, key.value.z));  
                    this._curves[3].keys.push(new Vector2(key.frame, key.value.w));                        
                    break;
                case Animation.ANIMATIONTYPE_COLOR4:
                    minValue = Math.min(minValue, key.value.r);
                    minValue = Math.min(minValue, key.value.g);
                    minValue = Math.min(minValue, key.value.b);
                    minValue = Math.min(minValue, key.value.a);
                    maxValue = Math.max(maxValue, key.value.r);
                    maxValue = Math.max(maxValue, key.value.g);
                    maxValue = Math.max(maxValue, key.value.b);
                    maxValue = Math.max(maxValue, key.value.a);

                    this._curves[0].keys.push(new Vector2(key.frame, key.value.r));
                    this._curves[1].keys.push(new Vector2(key.frame, key.value.g));
                    this._curves[2].keys.push(new Vector2(key.frame, key.value.b));  
                    this._curves[3].keys.push(new Vector2(key.frame, key.value.a));                        
                    break;                    
            }
        }

        this._minValue = minValue;
        this._maxValue = maxValue;

        this._minFrame = keys[0].frame;
        this._maxFrame = keys[keys.length - 1].frame;
    }

    
    private _convertX(x: number) {
        return ((x - this._minFrame) / (this._maxFrame - this._minFrame)) *  (this._graphAbsoluteWidth);
    }

    private _convertY(y: number) {
        return this._graphAbsoluteHeight - ((y - this._minValue) / (this._maxValue - this._minValue)) * this._graphAbsoluteHeight;
    }

    private _buildYAxis() {
        if (!this.props.context.activeAnimation) {
            return null;
        }

        let stepCounts = 10;
        let range = this._maxValue - this._minValue;
        let offset = range / stepCounts;
        let convertRatio = range / this._graphAbsoluteHeight;

        let steps = [];

        let startPosition = ((this._viewHeight  * this._viewScale) - this._graphAbsoluteHeight - this._offsetY) * convertRatio;
        let start = this._minValue - ((startPosition / offset) | 0) * offset;
        let end = start + (this._viewHeight * this._viewScale )* convertRatio;

        for (var step = start - offset; step <= end + offset; step += offset) {
            steps.push(step);
        }

        return (
            steps.map((s, i) => {
                let y = this._graphAbsoluteHeight - ((s - this._minValue) / convertRatio);
                return (
                    <>
                        <line
                            key={"line" + s}
                            x1={this._graphOffsetX * this._viewScale}
                            y1={y}
                            x2={this._viewWidth * this._viewScale}
                            y2={y}
                            style={{
                                stroke: "#333333",
                                strokeWidth: 0.5,
                            }}>
                        </line>
                        <text
                            key={"label" + s}
                            x={0}
                            y={y}
                            dx={`${15 * this._viewScale}px`}
                            textAnchor="middle"
                            dy={`${3 * this._viewScale}px`}
                            style={{
                                fontFamily:"acumin-pro-condensed",                                
                                fontSize: `${10 * this._viewScale}px`,
                                fill: "#888888",
                                textAlign: "center",
                            }}
                        >
                            {s.toFixed(2)}
                        </text>
                    </>
                )
            })
        )
    }

    private _dropKeyFrames(curveId: number) {
        if (!this.props.context.activeAnimation) {
            return null;
        }

        if (curveId >= this._curves.length) {
            return null;
        }

        return this._curves[curveId].keys.map(key => {
            let x = this._convertX(key.x);
            let y = this._convertY(key.y);
            return (
               <AnimationCurveEditorKeyPointComponent x={x} y={y} context={this.props.context} scale={this._viewScale} channel={this._curves[curveId].color}/>
            );
        })
    }

    componentWillUpdate() {
        this._evaluateKeys();
    }

    private _onPointerDown(evt: React.PointerEvent<HTMLDivElement>) {
        if ((evt.nativeEvent.target as any).id !== "svg-graph-curves") {
            return;
        }

        this._pointerIsDown = true;
        evt.currentTarget.setPointerCapture(evt.pointerId);
        this._sourcePointerX = evt.nativeEvent.offsetX;
        this._sourcePointerY = evt.nativeEvent.offsetY;
    }

    private _onPointerMove(evt: React.PointerEvent<HTMLDivElement>) {
        if (!this._pointerIsDown) {
            return;
        }
        this._offsetX += (evt.nativeEvent.offsetX - this._sourcePointerX) * this._viewScale;
        this._offsetY += (evt.nativeEvent.offsetY - this._sourcePointerY) * this._viewScale;
        
        this._sourcePointerX = evt.nativeEvent.offsetX;
        this._sourcePointerY = evt.nativeEvent.offsetY;

        this.forceUpdate();
    }

    private _onPointerUp(evt: React.PointerEvent<HTMLDivElement>) {
        this._pointerIsDown = false;
        evt.currentTarget.releasePointerCapture(evt.pointerId);
    }

    onWheel(evt: React.WheelEvent) {
        let delta = evt.deltaY < 0 ? -0.05 : 0.05;

        this._viewScale = Math.min(Math.max(this._MinScale, this._viewScale + delta * this._viewScale), this._MaxScale);
        this.forceUpdate();

        evt.stopPropagation();
    }

    public render() {
        const scale = this._viewScale;
        const viewBoxScalingCurves = `${-this._offsetX} ${-this._offsetY} ${Math.round(scale * this._viewCurveWidth)} ${Math.round(scale * this._viewHeight)}`;
        const viewBoxScalingGrid = `0 ${-this._offsetY} ${Math.round(scale * this._viewWidth)} ${Math.round(scale * this._viewHeight)}`;

        return (
            <div 
                id="graph"                
                onWheel={evt => this.onWheel(evt)}
                onPointerDown={evt => this._onPointerDown(evt)}
                onPointerMove={evt => this._onPointerMove(evt)}
                onPointerUp={evt => this._onPointerUp(evt)}
            >
                <svg
                    id="svg-graph-grid"
                    viewBox={viewBoxScalingGrid}
                    ref={this._svgHost}
                    >
                    {
                        this._buildYAxis()
                    }
                </svg>
                <div id="dark-rectangle"/>
                <svg
                    ref={this._svgHost2}
                    id="svg-graph-curves"
                    tabIndex={0}
                    viewBox={viewBoxScalingCurves}
                    >
                    {
                        this._curves !== undefined && this._curves.length > 0 &&
                        <AnimationCurveEditorCurveComponent context={this.props.context} curve={this._curves[0]} convertX={x => this._convertX(x)} convertY={y => this._convertY(y)}/>
                    }
                    {
                        this._curves !== undefined && this._curves.length > 1 &&
                        <AnimationCurveEditorCurveComponent context={this.props.context} curve={this._curves[1]} convertX={x => this._convertX(x)} convertY={y => this._convertY(y)}/>
                    }
                    {
                        this._curves !== undefined && this._curves.length > 2 &&
                        <AnimationCurveEditorCurveComponent context={this.props.context} curve={this._curves[2]} convertX={x => this._convertX(x)} convertY={y => this._convertY(y)}/>
                    }
                    {
                        this._curves !== undefined && this._curves.length > 3 &&
                        <AnimationCurveEditorCurveComponent context={this.props.context} curve={this._curves[3]} convertX={x => this._convertX(x)} convertY={y => this._convertY(y)}/>
                    }
                    {
                        this._dropKeyFrames(0)
                    }
                    {
                        this._dropKeyFrames(1)
                    }
                    {
                        this._dropKeyFrames(2)
                    }
                    {
                        this._dropKeyFrames(3)
                    }
                </svg>
            </div>
        );
    }
}