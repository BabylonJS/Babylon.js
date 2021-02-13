import * as React from "react";
import { GlobalState } from "../../../../../../globalState";
import { AnimationCurveEditorContext } from "../animationCurveEditorContext";
import { Animation } from "babylonjs/Animations/animation";
import { AnimationCurveEditorCurve } from "./animationCurveEditorCurve";
import { Vector2 } from "babylonjs";
import { AnimationCurveEditorKeyPointComponent } from "./animationCurveEditorKeyPoint";

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
    private _viewWidth = 784;
    private _viewHeight = 357;
    private _offsetX = 5;
    private _offsetY = 5;
    private _graphOffsetX = 25;
    private _graphOffsetY = 40;

    private _minValue: number;
    private _maxValue: number;
    private _minFrame: number;
    private _maxFrame: number;
    private _svgHost: React.RefObject<SVGSVGElement>;
    private _curves: AnimationCurveEditorCurve[];

    constructor(props: IAnimationCurveEditorGraphComponentProps) {
        super(props);

        this.state = { };
        
        this._svgHost = React.createRef();

        this._evaluateKeys();

        this.props.context.onHostWindowResized.add(() => {
            if (!this._svgHost.current) {
                return;
            }

            let ratio = this._svgHost.current.clientWidth / this._svgHost.current.clientHeight;
            //this._viewWidth = this._svgHost.current.clientWidth;
            this._viewHeight = this._viewWidth  / ratio;
     //       this._offsetX = this._viewWidth / 300;
           // this._offsetY = this._viewHeight / 8;
         //   this._graphOffsetX = this._offsetX * 5;

            this.forceUpdate();
        })
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
                this._curves.push(new AnimationCurveEditorCurve()); 
            break;
            case Animation.ANIMATIONTYPE_VECTOR2:
                this._curves.push(new AnimationCurveEditorCurve()); 
                this._curves.push(new AnimationCurveEditorCurve()); 
            case Animation.ANIMATIONTYPE_VECTOR3:
            case Animation.ANIMATIONTYPE_COLOR3:
                this._curves.push(new AnimationCurveEditorCurve()); 
                this._curves.push(new AnimationCurveEditorCurve()); 
                this._curves.push(new AnimationCurveEditorCurve()); 
                break;
            case Animation.ANIMATIONTYPE_QUATERNION:
            case Animation.ANIMATIONTYPE_COLOR4:
                this._curves.push(new AnimationCurveEditorCurve()); 
                this._curves.push(new AnimationCurveEditorCurve()); 
                this._curves.push(new AnimationCurveEditorCurve()); 
                this._curves.push(new AnimationCurveEditorCurve()); 
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

    private _buildYAxis() {
      
        let offset = (this._maxValue - this._minValue) / 10; // 10 steps

        let steps = [];

        steps.push(this._minValue - offset);
        for (var step = this._minValue; step <= this._maxValue; step += offset) {
            steps.push(step);
        }
        steps.push(this._maxValue + offset);

        return (
            steps.map((s, i) => {
                let y =  this._graphOffsetY + (this._viewHeight - this._graphOffsetY * 2) - ((s - this._minValue) / (this._maxValue - this._minValue)) *  (this._viewHeight - this._graphOffsetY * 2);
                return (
                    <>
                        <line
                            key={"line" + i}
                            x1={this._graphOffsetX}
                            y1={y}
                            x2={this._viewWidth}
                            y2={y}
                            style={{
                                stroke: "#333333",
                                strokeWidth: 0.5,
                            }}>
                        </line>
                        <text
                            key={"label" + i}
                            x={0}
                            y={y}
                            dx="15px"
                            textAnchor="middle"
                            dy="3px"
                            style={{
                                fontFamily:"acumin-pro-condensed",                                
                                fontSize: `10px`,
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
        if (curveId >= this._curves.length) {
            return null;
        }

        return this._curves[curveId].keys.map(key => {
            let x = this._offsetX + this._graphOffsetX + ((key.x - this._minFrame) / (this._maxFrame - this._minFrame)) *  (this._viewWidth - this._graphOffsetX - this._offsetX * 2);
            let y = this._graphOffsetY + (this._viewHeight - this._graphOffsetY * 2) - ((key.y - this._minValue) / (this._maxValue - this._minValue)) *  (this._viewHeight - this._graphOffsetY * 2);
            return (
               <AnimationCurveEditorKeyPointComponent x={x} y={y} context={this.props.context}/>
            );
        })
    }

    componentWillUpdate() {
        this._evaluateKeys();
    }

    public render() {
        if (!this.props.context.activeAnimation) {
            return null;
        }

        const scale = this.props.context.scale;
        const viewBoxScaling = `-${this._offsetX} -${this._offsetY} ${Math.round(scale * (this._viewWidth + this._offsetX * 2))} ${Math.round(scale * (this._viewHeight + this._offsetY * 2))}`;

        return (
            <div id="graph">
                <svg
                    ref={this._svgHost}
                    id="svg-graph"
                    tabIndex={0}
                    viewBox={viewBoxScaling}
                    >
                    {
                        this._buildYAxis()
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