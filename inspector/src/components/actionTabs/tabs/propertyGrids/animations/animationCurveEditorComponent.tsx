import * as React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import { Animation } from 'babylonjs/Animations/animation';
import { EasingFunction, Vector4, Vector2, IAnimationKey, IEasingFunction} from 'babylonjs';
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
        let data: string | undefined = `M0, ${middle}`;

        if (easingType === undefined){
            data = this.linearInterpolation(keyframes, data, heightScale, middle);
        } else {
            var bezier = this.getEasingBezierValues(easingMode, easingType, easingFunction);
            data = bezier && this.bezierEasePath(keyframes, data, heightScale, middle, [bezier.x, bezier.y], [bezier.z, bezier.w], easingMode);
        }

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

    getEasingBezierValues(easingMode: number, easingType: string, easingFunction: IEasingFunction): Vector4 | undefined {

        // X, Y, W, Z
        let easingFunctionMode = `${easingType}_${easingMode}`;
        let bezierValues:Vector4 | undefined;

        if (easingType === 'BezierCurveEase'){
            let easeF = easingFunction as BABYLON.BezierCurveEase;   
            bezierValues = new Vector4(easeF.x1, easeF.y1, easeF.x2, easeF.y2);
        } else {
               
        switch (easingFunctionMode){
            case 'CircleEase_0':
                bezierValues = new Vector4(0.55,0,1,0.45);//cubic-bezier(0.55, 0, 1, 0.45);
                break;
            case 'CircleEase_1':
                bezierValues = new Vector4(0,0.55,0.45,1);//cubic-bezier(0, 0.55, 0.45, 1);
                break;
            case 'CircleEase_2':
                bezierValues = new Vector4(0.85, 0, 0.15, 1) //cubic-bezier(0.85, 0, 0.15, 1);
                 break;
            case 'CubicEase_0':
                bezierValues = new Vector4(0.32, 0, 0.67, 0); //cubic-bezier(0.32, 0, 0.67, 0);
                break;
            case 'CubicEase_1':
                bezierValues = new Vector4(0.33, 1, 0.68, 1); //cubic-bezier(0.33, 1, 0.68, 1);
                break;
            case 'CubicEase_2':
                bezierValues = new Vector4(0.65, 0, 0.35, 1); //cubic-bezier(0.65, 0, 0.35, 1);
                break;
            case 'QuadraticEase_0':
                bezierValues = new Vector4(0.11, 0, 0.5, 0); //cubic-bezier(0.11, 0, 0.5, 0);
                break;
            case 'QuadraticEase_1':
                bezierValues = new Vector4(0.5, 1, 0.89, 1); //cubic-bezier(0.5, 1, 0.89, 1);
                break;
            case 'QuadraticEase_2':
                bezierValues = new Vector4(0.45, 0, 0.55, 1); //cubic-bezier(0.45, 0, 0.55, 1);
                break;
            case 'QuarticEase_0':
                bezierValues = new Vector4(0.5, 0, 0.75, 0); //cubic-bezier(0.5, 0, 0.75, 0);
                break;
            case 'QuarticEase_1':
                bezierValues = new Vector4(0.25, 1, 0.5, 1); //cubic-bezier(0.25, 1, 0.5, 1);
                break;
            case 'QuarticEase_2':
                bezierValues = new Vector4(0.76, 0, 0.24, 1); //cubic-bezier(0.76, 0, 0.24, 1);
                break;
            case 'QuinticEase_0':
                bezierValues = new Vector4(0.64, 0, 0.78, 0); //cubic-bezier(0.64, 0, 0.78, 0);
                break;
            case 'QuinticEase_1':
                bezierValues = new Vector4(0.22, 1, 0.36, 1); //cubic-bezier(0.22, 1, 0.36, 1);
                break;
            case 'QuinticEase_2':
                bezierValues = new Vector4(0.83, 0, 0.17, 1); //cubic-bezier(0.83, 0, 0.17, 1);
                break;
            case 'SineEase_0':
                bezierValues = new Vector4(0.12, 0, 0.39, 0); //cubic-bezier(0.12, 0, 0.39, 0);
                break;
            case 'SineEase_1':
                bezierValues = new Vector4(0.61, 1, 0.88, 1); //cubic-bezier(0.61, 1, 0.88, 1);
                break;
            case 'SineEase_2':
                bezierValues = new Vector4(0.37, 0, 0.63, 1); //cubic-bezier(0.37, 0, 0.63, 1);
                break;
            case 'BackEase_0':
                bezierValues = new Vector4(0.36, 0, 0.66, -0.56); //cubic-bezier(0.36, 0, 0.66, -0.56);
                break;
            case 'BackEase_1':
                bezierValues = new Vector4(0.34, 1.56, 0.64, 1); //cubic-bezier(0.34, 1.56, 0.64, 1);
                break;
            case 'BackEase_2':
                bezierValues = new Vector4(0.68, -0.6, 0.32, 1.6); //cubic-bezier(0.68, -0.6, 0.32, 1.6);
                break;
            case 'BounceEase_0':
                bezierValues = new Vector4(1, 1, 1, 1); //Create Function for number of bounces and bounciness inverse to BounceEase_1;
                break;
            case 'BounceEase_1':
                bezierValues = new Vector4(1, 1, 1, 1); //Create Function for number of bounces and bounciness
                break;
            case 'BounceEase_2':
                bezierValues = new Vector4(1, 1, 1, 1); //Create Function for number of bounces and bounciness inverse to BounceEase_1
                break;
            case 'ElasticEase_0':
                bezierValues = new Vector4(1, 1, 1, 1); //Create Function for number of oscillations and springiness;
                break;
            case 'ElasticEase_1':
                bezierValues = new Vector4(1, 1, 1, 1); //Create Function for number of oscillations and springiness;
                break;
            case 'ElasticEase_2':
                bezierValues = new Vector4(1, 1, 1, 1); //Create Function for number of oscillations and springiness;
                break;
            case 'ExponentialEase_0':
                bezierValues = new Vector4(0.7, 0, 0.84, 0); //cubic-bezier(0.7, 0, 0.84, 0); // Implement Exponential in Path
                break;
            case 'ExponentialEase_1':
                bezierValues = new Vector4(0.16, 1, 0.3, 1); //cubic-bezier(0.16, 1, 0.3, 1); // Implement Exponential in Path
                break;
            case 'ExponentialEase_2':
                bezierValues = new Vector4(0.87, 0, 0.13, 1); //cubic-bezier(0.87, 0, 0.13, 1); // Implement Exponential in Path
                break;
            case 'PowerEase_0':
                bezierValues = new Vector4(0.11, 0, 0.5, 0); //cubic-bezier(0.11, 0, 0.5, 0); // Implement Power in Path
                break;
            case 'PowerEase_1':
                bezierValues = new Vector4(0.5, 1, 0.89, 1); //cubic-bezier(0.5, 1, 0.89, 1); // Implement Power in Path
                break;
            case 'PowerEase_2':
                bezierValues = new Vector4(0.45, 0, 0.55, 1); //cubic-bezier(0.45, 0, 0.55, 1); // Implement Power in Path
                break;
            default: undefined
                bezierValues = undefined
                break;
            }
        }
        return bezierValues;

    }

    bezierEasePath(keyframes: BABYLON.IAnimationKey[], data: string, heightScale: number, middle: number, bezierA: [number, number], bezierB: [number, number], mode: number) {

        if (mode === 0 || mode === 1){

            console.log("value of mode = 0");
            keyframes.forEach((key, i) => {
                if (i !== 0) {

                    var pointA =  new Vector2(0, 0);
                    if (i === 0) {
                        pointA.x = 0
                        pointA.y = middle;
                    } else {
                        pointA.x = keyframes[i - 1].frame;
                        pointA.y = heightScale - (keyframes[i - 1].value * middle)
                    }

                    var pointB = new Vector2(key.frame, heightScale - (key.value * middle));

                    let anchorA_Y;
                    let anchorB_X;
                    let anchorA_X;
                    let anchorB_Y;

                    if (mode === 0){
                        anchorA_Y = pointA.y;
                        anchorB_X = pointB.x;
                        anchorA_X = bezierA[0] * (pointB.x - pointA.x);
                        anchorB_Y = (bezierB[1] * (pointA.y - pointB.y)) + pointB.y;
                    }
        
                    if (mode === 1){
                        anchorA_X = pointA.x;
                        anchorB_Y = pointB.y;
                        anchorB_X = bezierB[0] * (pointB.x - pointA.x);
                        anchorA_Y = (bezierA[1] * (pointA.y - pointB.y)) + pointB.y;
                    }


                    var anchorA = new Vector2(anchorA_X, anchorA_Y);
                    var anchorB = new Vector2(anchorB_X, anchorB_Y);

                    this.setAnchorPoint(pointA, anchorA);
                    this.setAnchorPoint(pointB, anchorB);

                    this.setKeyframePoint(pointA);
                    this.setKeyframePoint(pointB);

                    data += ` C${anchorA.x}, ${anchorA.y} ${anchorB.x}, ${anchorB.y} ${pointB.x}, ${pointB.y}`

                }

            });

        } else if (mode === 2){

            //mode easeInOut
            console.log("value of mode = 2");
            keyframes.forEach((key, i) => {
                if (i !== 0) {

                    var pointA =  new Vector2(0, 0);
                    if (i === 0) {
                        pointA.x = 0
                        pointA.y = middle;
                    } else {
                        pointA.x = keyframes[i - 1].frame;
                        pointA.y = heightScale - (keyframes[i - 1].value * middle)
                    }

                    var pointB = new Vector2(key.frame, heightScale - (key.value * middle));

                    var anchorA_Y = bezierA[1] === 0 ? pointA.y : pointA.y * bezierA[1];
                    var anchorB_Y = bezierB[1] === 0 ? pointB.y : (pointB.y * bezierB[1]);

                    var anchorA_X = bezierA[0] === 0 ? (pointB.x - pointA.x) + pointA.x : ((pointB.x - pointA.x) * bezierA[0]) + pointA.x;
                    var anchorB_X = bezierB[0] === 0 ? (pointB.x - pointA.x) + pointA.x : ((pointB.x - pointA.x) * bezierB[0]) + pointA.x;

                    var anchorA = new Vector2(anchorA_X, anchorA_Y);
                    var anchorB = new Vector2(anchorB_X, anchorB_Y);

                    
                    this.setAnchorPoint(pointA, anchorA);
                    this.setAnchorPoint(pointB, anchorB);

                    this.setKeyframePoint(pointA);
                    this.setKeyframePoint(pointB);

                    data += ` C${anchorA.x}, ${anchorA.y} ${anchorB.x}, ${anchorB.y} ${pointB.x}, ${pointB.y}`

                }

            });

        }

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

