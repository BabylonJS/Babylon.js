import * as React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import { Animation } from 'babylonjs/Animations/animation';
import { Vector2 } from 'babylonjs/Maths/math.vector';
import { EasingFunction } from 'babylonjs/Animations/easing';
import { IAnimationKey } from 'babylonjs/Animations/animationKey';
import { AnchorSvgPoint } from './anchorSvgPoint';
import { KeyframeSvgPoint } from './keyframeSvgPoint';

require("./curveEditor.scss");

interface IAnimationCurveEditorComponentProps {
    close: (event: any) => void;
    title: string;
    animations: Animation[];
    entityName: string;
}

export class AnimationCurveEditorComponent extends React.Component<IAnimationCurveEditorComponentProps, { isOpen: boolean, selected: Animation, currentPathData: string | undefined, anchorPoints: { point: Vector2, anchor: Vector2 }[] | null, keyframes: Vector2[] | null }> {

    private _anchorPoints: { point: Vector2, anchor: Vector2 }[] = [];
    private _keyframes: Vector2[] = [];
    constructor(props: IAnimationCurveEditorComponentProps) {
        super(props);
        this.state = { selected: this.props.animations[0], isOpen: true, currentPathData: this.getPathData(this.props.animations[0]), anchorPoints: this._anchorPoints, keyframes: this._keyframes }
    }

    getAnimationProperties(animation: Animation) {
        let easingType, easingMode;
        let easingFunction: EasingFunction = animation.getEasingFunction() as EasingFunction;
        if (easingFunction === undefined){
            easingType = undefined
            easingMode = undefined;
        } else {
            easingType = easingFunction.constructor.name;
            easingMode = easingFunction.getEasingMode();
        }
        return { easingType, easingMode }
    }

    getPathData(animation: Animation) {

        const { easingMode, easingType } = this.getAnimationProperties(animation);

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
        let data: string | undefined = `M0, ${middle}`;

        if (easingType === undefined && easingMode === undefined){
            data = this.linearInterpolation(keyframes, data, heightScale, middle);
        } else {
            let easingFunction = animation.getEasingFunction();
            data = this.curvePath(keyframes, data, heightScale, middle, easingFunction as EasingFunction)
        }

        return data;

    }

    curvePath(keyframes: IAnimationKey[], data: string, heightScale: number, middle: number, easingFunction: EasingFunction) {

        // This will get 1/4 and 3/4 of points in eased curve
        const u = .25;
        const v = .75;

        keyframes.forEach((key, i) => {
            if (i !== 0) {

                // Gets previous initial point of curve segment
                var pointA =  new Vector2(0, 0);
                if (i === 0) {
                    pointA.x = 0
                    pointA.y = middle;
                } else {
                    pointA.x = keyframes[i - 1].frame;
                    pointA.y = heightScale - (keyframes[i - 1].value * middle)
                }

                // Gets the end point of this curve segment
                var pointB = new Vector2(key.frame, heightScale - (key.value * middle));

                // Get easing value of percentage to get the bezier control points below
                let du = easingFunction.ease(u); // What to do here, when user edits the curve? Option 1: Modify the curve with the new control points as BezierEaseCurve(x,y,z,w)
                let dv = easingFunction.ease(v); // Option 2: Create a easeInCore function and adapt it with the new control points values... needs more revision.

                // Intermediate points in curve
                let intermediatePoint25 = new Vector2(((pointB.x - pointA.x) * u) + pointA.x,  ((pointB.y - pointA.y) * du) + middle);
                let intermediatePoint75 = new Vector2(((pointB.x - pointA.x) * v) + pointA.x,  ((pointB.y - pointA.y) * dv) + middle);
                
                // Gets the four control points of bezier curve
                let controlPoints = this.interpolateControlPoints(pointA, intermediatePoint25, u, intermediatePoint75, v, pointB);

                if (controlPoints === undefined){
                    console.log("error getting bezier control points");
                } else {
                    this.setAnchorPoint(controlPoints[0], controlPoints[1]);
                    this.setAnchorPoint(controlPoints[3], controlPoints[2]);
    
                    this.setKeyframePoint(pointA);
                    this.setKeyframePoint(pointB);
    
                    data += ` C${controlPoints[1].x}, ${controlPoints[1].y} ${controlPoints[2].x}, ${controlPoints[2].y} ${pointB.x}, ${pointB.y}`

                }
            }

        });

        return data;

    }

    
    linearInterpolation(keyframes: IAnimationKey[], data: string, heightScale: number, middle: number): string {
        keyframes.forEach((key, i) => {
            if (i !== 0) {
                data += ` L${key.frame} ${heightScale - (key.value * middle)}`
            }

        });
        return data;
    }

    
    setAnchorPoint(point: Vector2, anchor: Vector2) {
        this._anchorPoints.push({ point, anchor });
    }

    setKeyframePoint(point: Vector2) {
        this._keyframes.push(point);
    }

    selectAnimation(animation: Animation) {
        this._anchorPoints = [];
        this._keyframes = [];

        const pathData = this.getPathData(animation);
        if (pathData === "") {
            console.log("no keyframes in this animation");
        }
        this.setState({ selected: animation, currentPathData: pathData, anchorPoints: this._anchorPoints, keyframes: this._keyframes });

    }

    interpolateControlPoints(p0: Vector2, p1: Vector2, u: number, p2: Vector2, v:number, p3: Vector2 ): Vector2[] | undefined {

        let a=0.0;
        let b=0.0;
        let c=0.0;
        let d=0.0;
        let det=0.0;
        let q1: Vector2 = new Vector2();
        let q2: Vector2 = new Vector2();
        let controlA: Vector2 = p0;
        let controlB: Vector2 = new Vector2();
        let controlC: Vector2 = new Vector2();
        let controlD: Vector2 = p3;

        if ( (u<=0.0) || (u>=1.0) || (v<=0.0) || (v>=1.0) || (u>=v) ){
            return undefined;
        }

        a = 3*(1-u)*(1-u)*u; b = 3*(1-u)*u*u;
        c = 3*(1-v)*(1-v)*v; d = 3*(1-v)*v*v;
        det = a*d - b*c;

        if (det == 0.0) return undefined;

        q1.x = p1.x - ( (1-u)*(1-u)*(1-u)*p0.x + u*u*u*p3.x );
        q1.y = p1.y - ( (1-u)*(1-u)*(1-u)*p0.y + u*u*u*p3.y );
        
        q2.x = p2.x - ( (1-v)*(1-v)*(1-v)*p0.x + v*v*v*p3.x );
        q2.y = p2.y - ( (1-v)*(1-v)*(1-v)*p0.y + v*v*v*p3.y );


        controlB.x = (d*q1.x - b*q2.x)/det;
        controlB.y = (d*q1.y - b*q2.y)/det;

        controlC.x = ((-c)*q1.x + a*q2.x)/det;
        controlC.y = ((-c)*q1.y + a*q2.y)/det;

        return [controlA, controlB, controlC, controlD];

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
                                <AnchorSvgPoint key={i} point={anchorPoint.point} anchor={anchorPoint.anchor} />
                            )}

                            {this.state.keyframes?.map((keyframe, i) =>
                                <KeyframeSvgPoint key={i} point={keyframe} />
                            )}

                        </svg>

                        Animation name: {this.state.selected.name}

                    </div>
                </div>
            </div>
        );
    }
}

