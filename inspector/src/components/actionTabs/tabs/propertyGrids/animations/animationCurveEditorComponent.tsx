import * as React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faPlusCircle } from "@fortawesome/free-solid-svg-icons";
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
    entity: Animatable;
}

export class AnimationCurveEditorComponent extends React.Component<IAnimationCurveEditorComponentProps, { animations: Animation[], animationName: string, selectedProperty:string, isOpen: boolean, selected: Animation, currentPathData: string | undefined, anchorPoints: { point: Vector2, anchor: Vector2 }[] | undefined, keyframes: Vector2[] | undefined }> {

    private _anchorPoints: { point: Vector2, anchor: Vector2 }[] = [];
    private _newAnimations: Animation[] = [];
    private _keyframes: Vector2[] = [];
    constructor(props: IAnimationCurveEditorComponentProps) {
        super(props);
        this.state = { animations: this._newAnimations,selected: this.props.animations[0], isOpen: true, currentPathData: this.getPathData(this.props.animations[0]), anchorPoints: this._anchorPoints, keyframes: this._keyframes, selectedProperty: 'position.x', animationName: "" }
        
    }

    handlePropertyChange(event: React.ChangeEvent<HTMLSelectElement>){
        event.preventDefault();
        this.setState({selectedProperty: event.target.value});
    }

    handleNameChange(event: React.ChangeEvent<HTMLInputElement>){
        //let value = (event.target as HTMLInputElement).value;
        event.preventDefault();
        this.setState({animationName: event.target.value});
    }

    addAnimation(event: React.MouseEvent<HTMLDivElement>){
        event.preventDefault();
        if (this.state.animationName != ""){
            let animation = new Animation(this.state.animationName, this.state.selectedProperty, 30, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);

            var keys = []; 
// //At the animation key 0, the value of scaling is "1"
  keys.push({
    frame: 0,
    value: 1
  });
//   //At the animation key 20, the value of scaling is "0.2"
//   keys.push({
//     frame: 20,
//     value: 0.2
//   });
//   //At the animation key 100, the value of scaling is "1"
//   keys.push({
//     frame: 100,
//     value: 1
//   });

animation.setKeys(keys);

var bezierEase = new BABYLON.CircleEase();
//var bezierEase = new BABYLON.BezierCurveEase(0.55,0,1,0.45) as unknown;
bezierEase.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEINOUT);
animation.setEasingFunction((bezierEase as unknown) as EasingFunction);

            this._newAnimations.push(animation);
            this.setState({animations: this._newAnimations, animationName: ""});
        }

    
    }

    addKeyFrame(event: React.MouseEvent<SVGSVGElement>){

        event.preventDefault();

        if (event.button === 2){

        var svg = event.target as SVGSVGElement;

        var pt = svg.createSVGPoint();

        pt.x = event.clientX;
        pt.y = event.clientY;

        var inverse = svg.getScreenCTM()?.inverse();

        var cursorpt =  pt.matrixTransform(inverse);

        var currentAnimation = this.state.selected;

        var keys = currentAnimation.getKeys();

        var height = 100;
        var middle = (height / 2);

        var keyValue;

        if (cursorpt.y < middle){
            keyValue = 1 + ((100/cursorpt.y) * .1)
        }

        if (cursorpt.y > middle){
            keyValue = 1 - ((100/cursorpt.y) * .1)
        }



        keys.push({ frame: cursorpt.x, value: keyValue });

        currentAnimation.setKeys(keys);

        this.selectAnimation(currentAnimation);
     }
    }

    updateKeyframe(keyframe: Vector2, index: number){

        let anim = this.state.selected as Animation;
        var keys: IAnimationKey[] = [];

        var keyframes = this.state.keyframes?.map((k, i) => {
            if (i === index){
                k.x = keyframe.x;
                k.y = keyframe.y;
            }

            var height = 100;
            var middle = (height / 2);

            var keyValue;

            if (k.y < middle){
                keyValue = 1 + ((100/k.y) * .1)
            }

            if (k.y > middle){
                keyValue = 1 - ((100/k.y) * .1)
            }


            keys.push({frame: k.x, value: keyValue})
            return k;
        });
        anim.setKeys(keys);

        this.setState({ keyframes: keyframes})



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

    curvePath(keyframes: BABYLON.IAnimationKey[], data: string, heightScale: number, middle: number, easingFunction: EasingFunction) {

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
                let du = easingFunction.ease(u);
                let dv = easingFunction.ease(v);

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
        let ControlA: Vector2 = p0;
        let ControlB: Vector2 = new Vector2();
        let ControlC: Vector2 = new Vector2();
        let ControlD: Vector2 = p3;

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


        ControlB.x = (d*q1.x - b*q2.x)/det;
        ControlB.y = (d*q1.y - b*q2.y)/det;

        ControlC.x = ((-c)*q1.x + a*q2.x)/det;
        ControlC.y = ((-c)*q1.y + a*q2.y)/det;

        return [ControlA, ControlB, ControlC, ControlD];

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

                    <div>
                        <select value={this.state.selectedProperty} onChange={(e) => this.handlePropertyChange(e)}>
                            <option value="position.x">Position X</option>
                            <option value="position.y">Position Y</option>
                            <option value="position.z">Position Z</option>
                        </select>

                        <input type="text" value={this.state.animationName} onChange={(e) => this.handleNameChange(e)}></input>

                        <div className="add" onClick={(e) => this.addAnimation(e)}>
                        <FontAwesomeIcon icon={faPlusCircle} />
                    </div>
                    </div>

                        <h2>{this.props.entityName}</h2>
                        <ul>
                            {this.props.animations && this.props.animations.map((animation, i) => {
                                return <li className={this.state.selected.name === animation.name ? 'active' : ''} key={i} onClick={() => this.selectAnimation(animation)}>{animation.name} <strong>{animation.targetProperty}</strong></li>
                            })}

                        </ul>

                        <h2>New Animations</h2>
                        <ul>
                            {this.state.animations && this.state.animations.map((animation, i) => {
                                return <li className={this.state.selected.name === animation.name ? 'active' : ''} key={i} onClick={() => this.selectAnimation(animation)}>{animation.name} <strong>{animation.targetProperty}</strong></li>
                            })}

                        </ul>
                    </div>
                    <div className="sample-chart" style={{width:500, height:500}}>

                        <svg className="linear" viewBox="0 0 100 100" preserveAspectRatio="none">
                        
                           <KeyframeSvgPoint key={0} point={new Vector2(50,50)} onUpdate={(keyframe: Vector2, index: number) => {}} index={0} />

                        </svg>
                    </div>
                    <div className="graph-chart">
                        <svg className="linear" viewBox="0 0 100 100" preserveAspectRatio="none" onMouseDown={(e) => this.addKeyFrame(e)}>
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
                                <KeyframeSvgPoint key={i} point={keyframe} onUpdate={(keyframe: Vector2, index: number) => this.updateKeyframe(keyframe, index)} index={i} />
                            )}

                        </svg>

                        Animation name: {this.state.selected.name}

                    </div>
                </div>
            </div>
        );
    }
}

