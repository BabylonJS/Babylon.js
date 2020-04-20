import * as React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import { Animation } from 'babylonjs/Animations/animation';
import { EasingFunction, BezierCurveEase } from 'babylonjs';
import { AnchorPoint } from './anchorPoint';
import { KeyframePoint } from './keyframePoint';

require("./curveEditor.scss");

interface IAnimationCurveEditorComponentProps {
    close: (event: any) => void;
    title: string;
    animations: Animation[];
    entityName: string;
}

interface KeyFrame {
    frame: number;
    value: number;
    inTangent?: BABYLON.Vector2 | BABYLON.Vector3 | BABYLON.Quaternion;
    outTangent?: BABYLON.Vector2 | BABYLON.Vector3 | BABYLON.Quaternion;
}

interface Point {
    x: number;
    y: number;
}


enum EASEMODE {
    EASEIN, EASEOUT, EASEINOUT
}


export class AnimationCurveEditorComponent extends React.Component<IAnimationCurveEditorComponentProps, { isOpen: boolean, selected: Animation, currentPathData: string, anchorPoints: { point: Point, anchor: Point }[] | null, keyframes: Point[] | null }> {

    private _anchorPoints: { point: Point, anchor: Point }[] = [];
    private _keyframes: Point[] = [];
    constructor(props: IAnimationCurveEditorComponentProps) {
        super(props);
        this.state = { selected: this.props.animations[0], isOpen: true, currentPathData: this.getPathData(this.props.animations[0]), anchorPoints: this._anchorPoints, keyframes: this._keyframes }
    }

    getAnimationProperties(animation: Animation) {

        let easingFunction: EasingFunction = animation.getEasingFunction() as EasingFunction;
        let easingType = easingFunction.constructor.name;
        let easingMode = easingFunction.getEasingMode();

        return { easingType, easingMode }

    }

    getPathData(animation: Animation) {

        const { easingMode, easingType } = this.getAnimationProperties(animation);

        var easingFunction = animation.getEasingFunction();
        console.log(easingFunction);

        const keyframes = animation.getKeys();
        if (keyframes === undefined) {
            return "";
        }

        const startKey = keyframes[0];

        // This will change when Graph width becomes dinamic
        const heightScale = 100;

        // This assumes the startkey is always 0... we will change this
        let middle = (startKey.value / 2) * heightScale;

        // START OF LINE/CURVE
        let data = `M0, ${middle}`;

        // This will change setting other types 
        if (easingType === "BezierCurveEase") {

            var bezier = easingFunction as BezierCurveEase
            data = this.bezierEasePath(keyframes, data, heightScale, middle, [bezier.x1, bezier.y1], [bezier.x2, bezier.y2]);

        } else {

            switch (easingMode) {
                case EASEMODE.EASEIN:
                    data = this.easeIn(keyframes, data, heightScale, middle);
                    break;
                case EASEMODE.EASEOUT:
                    data = this.easeOut(keyframes, data, heightScale, middle);
                    break;
                case EASEMODE.EASEINOUT:
                    data = this.easeInOut(keyframes, data, heightScale, middle);
                    break;
                default: undefined
                    data = this.linearInterpolation(keyframes, data, heightScale, middle);
                    break;
            }

        }

        return data;

    }

    linearInterpolation(keyframes: KeyFrame[], data: string, heightScale: number, middle: number): string {
        keyframes.forEach((key, i) => {
            if (i !== 0) {
                data += ` L${key.frame} ${heightScale - (key.value * middle)}`
            }

        });
        return data;
    }

    easeIn(keyframes: KeyFrame[], data: string, heightScale: number, middle: number): string {

        // Will refactor 
        keyframes.forEach((key, i) => {
            if (i !== 0) {

                var pointA = [0, 0];
                if (i === 0) {
                    pointA = [0, middle];
                } else {
                    pointA = [keyframes[i - 1].frame, heightScale - (keyframes[i - 1].value * middle)];
                }

                var pointB = [key.frame, heightScale - (key.value * middle)];

                var anchorA = [((pointB[0] - pointA[0]) / 4) + pointA[0], pointA[1]]

                var anchorB = pointB;

                this.setAnchorPoint({ x: pointA[0], y: pointA[1] }, { x: anchorA[0], y: anchorA[1] });
                this.setAnchorPoint({ x: pointB[0], y: pointB[1] }, { x: anchorB[0], y: anchorB[1] });

                this.setKeyframePoint({ x: pointA[0], y: pointA[1] });
                this.setKeyframePoint({ x: pointB[0], y: pointB[1] });

                data += ` C${anchorA[0]}, ${anchorA[1]} ${anchorB[0]}, ${anchorB[1]} ${pointB[0]}, ${pointB[1]}`

            }

        });

        return data;
    }

    easeOut(keyframes: KeyFrame[], data: string, heightScale: number, middle: number): string {

        // Will refactor 
        keyframes.forEach((key, i) => {
            if (i !== 0) {

                var pointA = [0, 0];
                if (i === 0) {
                    pointA = [0, middle];
                } else {
                    pointA = [keyframes[i - 1].frame, heightScale - (keyframes[i - 1].value * middle)];
                }

                var pointB = [key.frame, heightScale - (key.value * middle)];

                var anchorA = pointA;

                var anchorB = [((pointB[0] - pointA[0]) / 4) + pointA[0], pointB[1]]

                this.setAnchorPoint({ x: pointA[0], y: pointA[1] }, { x: anchorA[0], y: anchorA[1] });
                this.setAnchorPoint({ x: pointB[0], y: pointB[1] }, { x: anchorB[0], y: anchorB[1] });

                this.setKeyframePoint({ x: pointA[0], y: pointA[1] });
                this.setKeyframePoint({ x: pointB[0], y: pointB[1] });

                data += ` C${anchorA[0]}, ${anchorA[1]} ${anchorB[0]}, ${anchorB[1]} ${pointB[0]}, ${pointB[1]}`

            }

        });

        return data;
    }

    easeInOut(keyframes: KeyFrame[], data: string, heightScale: number, middle: number): string {

        // Will refactor 
        keyframes.forEach((key, i) => {
            if (i !== 0) {

                var pointA = [0, 0];
                if (i === 0) {
                    pointA = [0, middle];
                } else {
                    pointA = [keyframes[i - 1].frame, heightScale - (keyframes[i - 1].value * middle)];
                }

                var pointB = [key.frame, heightScale - (key.value * middle)];

                var anchorA = [((pointB[0] - pointA[0]) * .40) + pointA[0], pointA[1]]

                var anchorB = [((pointB[0] - pointA[0]) * .60) + pointA[0], pointB[1]]

                this.setAnchorPoint({ x: pointA[0], y: pointA[1] }, { x: anchorA[0], y: anchorA[1] });
                this.setAnchorPoint({ x: pointB[0], y: pointB[1] }, { x: anchorB[0], y: anchorB[1] });

                this.setKeyframePoint({ x: pointA[0], y: pointA[1] });
                this.setKeyframePoint({ x: pointB[0], y: pointB[1] });

                // In redesign check c vs C for dinamic paths
                data += ` C${anchorA[0]}, ${anchorA[1]} ${anchorB[0]}, ${anchorB[1]} ${pointB[0]}, ${pointB[1]}`

            }

        });

        return data;
    }




    bezierEasePath(keyframes: KeyFrame[], data: string, heightScale: number, middle: number, bezierA: [number, number], bezierB: [number, number]) {

        //BezierCurveEase(bezierA.x: Percent, bezierA: Value up/down, bezierB.x: Percent, bezierB.y: Value up/down);
        keyframes.forEach((key, i) => {
            if (i !== 0) {

                var pointA = [0, 0];
                if (i === 0) {
                    pointA = [0, middle];
                } else {
                    pointA = [keyframes[i - 1].frame, heightScale - (keyframes[i - 1].value * middle)];
                }

                var pointB = [key.frame, heightScale - (key.value * middle)];

                var anchorA = [((pointB[0] - pointA[0]) * bezierA[0]) + pointA[0], pointA[1] * bezierA[1]];
                var anchorB = [((pointB[0] - pointA[0]) * bezierB[0]) + pointA[0], pointB[1] * bezierB[1]];

                this.setAnchorPoint({ x: pointA[0], y: pointA[1] }, { x: anchorA[0], y: anchorA[1] });
                this.setAnchorPoint({ x: pointB[0], y: pointB[1] }, { x: anchorB[0], y: anchorB[1] });

                this.setKeyframePoint({ x: pointA[0], y: pointA[1] });
                this.setKeyframePoint({ x: pointB[0], y: pointB[1] });

                data += ` C${anchorA[0]}, ${anchorA[1]} ${anchorB[0]}, ${anchorB[1]} ${pointB[0]}, ${pointB[1]}`

            }

        });


        return data;




    }

    setAnchorPoint(point: Point, anchor: Point) {
        this._anchorPoints.push({ point, anchor });
    }

    setKeyframePoint(point: Point) {
        this._keyframes.push(point);
    }

    selectAnimation(animation: Animation) {
        const pathData = this.getPathData(animation);
        if (pathData === "") {
            console.log("no keyframes in this animation");
        }
        this.setState({ selected: animation, currentPathData: pathData, anchorPoints: this._anchorPoints, keyframes: this._keyframes });
        this._anchorPoints = [];
        this._keyframes = [];
    }

    render() {
        return (
            <div id="animation-curve-editor">
                <div className="header">
                    <div className="title">{this.props.title}</div>
                    <div className="close" onClick={(event: React.MouseEvent<HTMLDivElement, MouseEvent>) => this.props.close(event)}>
                        <FontAwesomeIcon icon={faTimes} />
                    </div>
                </div>
                <div className="content">
                    <div className="animation-list">
                        <h2>{this.props.entityName}</h2>
                        <ul>
                            {this.props.animations.map((animation, i) => {
                                return <li className={this.state.selected.name === animation.name ? 'active' : ''} key={i} onClick={() => this.selectAnimation(animation)}>{animation.name} <strong>{animation.targetProperty}</strong></li>
                            })}
                        </ul>
                    </div>
                    <div className="graph-chart">
                        <svg className="linear" viewBox="0 0 100 100" preserveAspectRatio="none">
                             {/* Frame Labels  */}
                            <text x="10" y="0" dx="-1em" style={{ font: 'italic 0.2em sans-serif' }}>10</text>
                            <text x="20" y="0" dx="-1em" style={{ font: 'italic 0.2em sans-serif' }}>20</text>
                            <text x="30" y="0" dx="-1em" style={{ font: 'italic 0.2em sans-serif' }}>30</text>
                            <text x="40" y="0" dx="-1em" style={{ font: 'italic 0.2em sans-serif' }}>40</text>
                            <text x="50" y="0" dx="-1em" style={{ font: 'italic 0.2em sans-serif' }}>50</text>
                            <text x="60" y="0" dx="-1em" style={{ font: 'italic 0.2em sans-serif' }}>60</text>
                            <text x="70" y="0" dx="-1em" style={{ font: 'italic 0.2em sans-serif' }}>70</text>
                            <text x="80" y="0" dx="-1em" style={{ font: 'italic 0.2em sans-serif' }}>80</text>
                            <text x="90" y="0" dx="-1em" style={{ font: 'italic 0.2em sans-serif' }}>90</text>

                            { /* Vertical Grid  */}
                            <line x1="10" y1="0" x2="10" y2="100" style={{ stroke: 'black', strokeWidth: '0.2px' }}></line>
                            <line x1="20" y1="0" x2="20" y2="100" style={{ stroke: 'black', strokeWidth: '0.2px' }}></line>
                            <line x1="30" y1="0" x2="30" y2="100" style={{ stroke: 'black', strokeWidth: '0.2px' }}></line>
                            <line x1="40" y1="0" x2="40" y2="100" style={{ stroke: 'black', strokeWidth: '0.2px' }}></line>
                            <line x1="50" y1="0" x2="50" y2="100" style={{ stroke: 'black', strokeWidth: '0.2px' }}></line>
                            <line x1="60" y1="0" x2="60" y2="100" style={{ stroke: 'black', strokeWidth: '0.2px' }}></line>
                            <line x1="70" y1="0" x2="70" y2="100" style={{ stroke: 'black', strokeWidth: '0.2px' }}></line>
                            <line x1="80" y1="0" x2="80" y2="100" style={{ stroke: 'black', strokeWidth: '0.2px' }}></line>
                            <line x1="90" y1="0" x2="90" y2="100" style={{ stroke: 'black', strokeWidth: '0.2px' }}></line>

                            { /* Value Labels  */}
                            <text x="0" y="10" dx="-1em" style={{ font: 'italic 0.2em sans-serif' }}>1.8</text>
                            <text x="0" y="20" dx="-1em" style={{ font: 'italic 0.2em sans-serif' }}>1.6</text>
                            <text x="0" y="30" dx="-1em" style={{ font: 'italic 0.2em sans-serif' }}>1.4</text>
                            <text x="0" y="40" dx="-1em" style={{ font: 'italic 0.2em sans-serif' }}>1.2</text>
                            <text x="0" y="50" dx="-1em" style={{ font: 'italic 0.2em sans-serif' }}>1</text>
                            <text x="0" y="60" dx="-1em" style={{ font: 'italic 0.2em sans-serif' }}>0.8</text>
                            <text x="0" y="70" dx="-1em" style={{ font: 'italic 0.2em sans-serif' }}>0.6</text>
                            <text x="0" y="80" dx="-1em" style={{ font: 'italic 0.2em sans-serif' }}>0.4</text>
                            <text x="0" y="90" dx="-1em" style={{ font: 'italic 0.2em sans-serif' }}>0.2</text>

                            { /* Horizontal Grid  */}
                            <line x1="0" y1="10" x2="100" y2="10" style={{ stroke: 'black', strokeWidth: '0.2px' }}></line>
                            <line x1="0" y1="20" x2="100" y2="20" style={{ stroke: 'black', strokeWidth: '0.2px' }}></line>
                            <line x1="0" y1="30" x2="100" y2="30" style={{ stroke: 'black', strokeWidth: '0.2px' }}></line>
                            <line x1="0" y1="40" x2="100" y2="40" style={{ stroke: 'black', strokeWidth: '0.2px' }}></line>
                            <line x1="0" y1="50" x2="100" y2="50" style={{ stroke: 'black', strokeWidth: '0.2px' }}></line>
                            <line x1="0" y1="60" x2="100" y2="60" style={{ stroke: 'black', strokeWidth: '0.2px' }}></line>
                            <line x1="0" y1="70" x2="100" y2="70" style={{ stroke: 'black', strokeWidth: '0.2px' }}></line>
                            <line x1="0" y1="80" x2="100" y2="80" style={{ stroke: 'black', strokeWidth: '0.2px' }}></line>
                            <line x1="0" y1="90" x2="100" y2="90" style={{ stroke: 'black', strokeWidth: '0.2px' }}></line>

                            { /* Single Curve -Modify this for multiple selection and view  */}
                            <path id="curve" d={this.state.currentPathData} style={{ stroke: 'red', fill: 'none', strokeWidth: '0.5' }}></path>

                            {this.state.anchorPoints?.map((anchorPoint, i) =>
                                <AnchorPoint key={i} point={anchorPoint.point} anchor={anchorPoint.anchor} />
                            )}

                            {this.state.keyframes?.map((keyframe, i) =>
                                <KeyframePoint key={i} point={keyframe} />
                            )}

                        </svg>

                        Animation name: {this.state.selected.name}

                    </div>
                </div>
            </div>
        );
    }
}


/// NOTES >>>>>

// UPPER LIMIT
// BABYLON.Animation.ANIMATIONLOOPMODE_RELATIVE
// BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
// BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT

// TYPE OF CHANGE
//     Animation.ANIMATIONTYPE_FLOAT,
//     Animation.ANIMATIONTYPE_VECTOR2,
//     Animation.ANIMATIONTYPE_VECTOR3,
//     Animation.ANIMATIONTYPE_QUATERNION,
//     Animation.ANIMATIONTYPE_MATRIX,
//     Animation.ANIMATIONTYPE_COLOR3,

// TYPES OF CHANGE THAT ALLOW SPLINES INTERPOLATIONS
// BABYLON.Animation.ANIMATIONTYPE_VECTOR2
// BABYLON.Animation.ANIMATIONTYPE_VECTOR3
// BABYLON.Animation.ANIMATIONTYPE_QUATERNION
// <i className="e"></i>
// {
//     frame: 0,
//     value: BABYLON.Vector3.Zero(),
//     outTangent: new BABYLON.Vector3(1, 0, 0)
//   }
// keys.push({
//     frame: 20,
//     inTangent: new BABYLON.Vector3(1, 0, 0),
//     value: new BABYLON.Vector3(1, 1, 1),
//     outTangent: new BABYLON.Vector3(-1, 0, 0)
//  })


// BABYLON.Animation.prototype.floatInterpolateFunction = function (startValue, endValue, gradient) {
//     return startValue + (endValue - startValue) * gradient;
//   };

//   BABYLON.Animation.prototype.quaternionInterpolateFunction = function (startValue, endValue, gradient) {
//     return BABYLON.Quaternion.Slerp(startValue, endValue, gradient);
//   };

//   BABYLON.Animation.prototype.vector3InterpolateFunction = function (startValue, endValue, gradient) {
//     return BABYLON.Vector3.Lerp(startValue, endValue, gradient);
//   };

// floatInterpolateFunction
// quaternionInterpolateFunction
// quaternionInterpolateFunctionWithTangents
// vector3InterpolateFunction
// vector3InterpolateFunctionWithTangents
// vector2InterpolateFunction
// vector2InterpolateFunctionWithTangents
// sizeInterpolateFunction
// color3InterpolateFunction
// matrixInterpolateFunction