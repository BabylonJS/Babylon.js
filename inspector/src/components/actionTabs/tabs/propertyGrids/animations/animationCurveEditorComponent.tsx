import * as React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faPlusCircle } from "@fortawesome/free-solid-svg-icons";
import { Animation } from 'babylonjs/Animations/animation';
import { Vector2 } from 'babylonjs/Maths/math.vector';
import { EasingFunction, BezierCurveEase } from 'babylonjs/Animations/easing';
import { IAnimationKey } from 'babylonjs/Animations/animationKey';
import { IKeyframeSvgPoint } from './keyframeSvgPoint';
import { SvgDraggableArea } from './svgDraggableArea';
import { Scene } from "babylonjs/scene";
import { IAnimatable } from 'babylonjs/Animations/animatable.interface';

require("./curveEditor.scss");

interface IAnimationCurveEditorComponentProps {
    close: (event: any) => void;
    title: string;
    animations: Animation[];
    entityName: string;
    scene: Scene;
    entity: IAnimatable;
}

export class AnimationCurveEditorComponent extends React.Component<IAnimationCurveEditorComponentProps, { animations: Animation[], animationName: string, animationTargetProperty:string, isOpen: boolean, selected: Animation, currentPathData: string | undefined, svgKeyframes: IKeyframeSvgPoint[] | undefined }> {

    readonly _heightScale: number = 100;
    private _newAnimations: Animation[] = [];
    private _svgKeyframes: IKeyframeSvgPoint[] = [];
    private _frames: Vector2[] = [];
    constructor(props: IAnimationCurveEditorComponentProps) {
        super(props);
        this.state = { animations: this._newAnimations,selected: this.props.animations[0], isOpen: true, currentPathData: this.getPathData(this.props.animations[0]), svgKeyframes: this._svgKeyframes, animationTargetProperty: 'position.x', animationName: "" }

    }

    handleNameChange(event: React.ChangeEvent<HTMLInputElement>){
        event.preventDefault();
        this.setState({animationName: event.target.value});
    }

    handlePropertyChange(event: React.ChangeEvent<HTMLInputElement>){
        event.preventDefault();
        this.setState({animationTargetProperty: event.target.value});
    }

    addAnimation(event: React.MouseEvent<HTMLDivElement>){
        event.preventDefault();
        if (this.state.animationName != "" && this.state.animationTargetProperty != ""){
            let animation = new Animation(this.state.animationName, this.state.animationTargetProperty, 30, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CYCLE);

            var keys = []; 
              keys.push({
                frame: 0,
                value: 1
              });

              keys.push({
                frame: 100,
                value: 1
              });


            animation.setKeys(keys);

            var bezierEase = new BezierCurveEase(10,0,10,0);
            bezierEase.setEasingMode(EasingFunction.EASINGMODE_EASEINOUT);
            animation.setEasingFunction((bezierEase as unknown) as EasingFunction);

            // Need to redefine/refactor not to update the prop collection
            (this.props.entity as IAnimatable).animations?.push(animation);
           
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

        var svgKeyframes = this.state.svgKeyframes?.map((k, i) => {
            if (i === index){
                k.keyframePoint.x = keyframe.x;
                k.keyframePoint.y = keyframe.y;
            }

            var height = 100;
            var middle = (height / 2);

            var keyValue;

            if (k.keyframePoint.y < middle){
                keyValue = 1 + ((100/k.keyframePoint.y) * .1)
            }

            if (k.keyframePoint.y > middle){
                keyValue = 1 - ((100/k.keyframePoint.y) * .1)
            }


            keys.push({frame: k.keyframePoint.x, value: keyValue})
            return k;
        });
        anim.setKeys(keys);

        this.setState({ svgKeyframes: svgKeyframes})

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

        // This assumes the startkey is always 0... beed to change this
        let middle = this._heightScale/2;

        // START OF LINE/CURVE
        let data: string | undefined = `M${startKey.frame}, ${this._heightScale - (startKey.value * middle)}`;

        if (easingType === undefined && easingMode === undefined){
            data = this.linearInterpolation(keyframes, data, middle);
        } else {
            let easingFunction = animation.getEasingFunction();
            
            data = this.curvePath(keyframes, data, middle, easingFunction as EasingFunction)
        }

      

        return data;

    }

    drawAllFrames(initialKey: IAnimationKey,endKey: IAnimationKey, easingFunction: EasingFunction) {

        let i = initialKey.frame;
        
        for (i; i < endKey.frame; i++){

            (i * 100/ endKey.frame)

            let dy = easingFunction.easeInCore(i);
            let value = this._heightScale - (dy * (this._heightScale/2));
            this. _frames.push(new Vector2(i,value));
           
        }

    }

    curvePath(keyframes: IAnimationKey[], data: string, middle: number, easingFunction: EasingFunction) {

        // This will get 1/4 and 3/4 of points in eased curve
        const u = .25;
        const v = .75;

        keyframes.forEach((key, i) => {

            // Gets previous initial point of curve segment
            var pointA =  new Vector2(0, 0);
            if (i === 0) {
                pointA.x = key.frame;
                pointA.y = this._heightScale - (key.value * middle);

                this.setKeyframePoint([pointA], i, keyframes.length);

            } else {
                pointA.x = keyframes[i - 1].frame;
                pointA.y = this._heightScale - (keyframes[i - 1].value * middle)
            
                // Gets the end point of this curve segment
                var pointB = new Vector2(key.frame, this._heightScale - (key.value * middle));

                // Get easing value of percentage to get the bezier control points below
                let du = easingFunction.easeInCore(u); // What to do here, when user edits the curve? Option 1: Modify the curve with the new control points as BezierEaseCurve(x,y,z,w)
                let dv = easingFunction.easeInCore(v); // Option 2: Create a easeInCore function and adapt it with the new control points values... needs more revision.

                // Direction of curve up/down
                let yInt25 = 0;
                if (pointB.y > pointA.y) {  // if pointB.y > pointA.y = goes down 
                    yInt25 = ((pointB.y - pointA.y) * du) + pointA.y
                } else if (pointB.y < pointA.y) {     // if pointB.y < pointA.y = goes up
                    yInt25 = pointA.y - ((pointA.y - pointB.y) * du);
                }

                let yInt75 = 0;
                if (pointB.y > pointA.y) {
                    yInt75 = ((pointB.y - pointA.y) * dv) + pointA.y
                } else if (pointB.y < pointA.y) {
                    yInt75 = pointA.y - ((pointA.y - pointB.y) * dv)
                }

                // Intermediate points in curve
                let intermediatePoint25 = new Vector2(((pointB.x - pointA.x) * u) + pointA.x, yInt25);
                let intermediatePoint75 = new Vector2(((pointB.x - pointA.x) * v) + pointA.x, yInt75);

                
                // Gets the four control points of bezier curve
                let controlPoints = this.interpolateControlPoints(pointA, intermediatePoint25, u, intermediatePoint75, v, pointB);

                if (controlPoints === undefined){
                    console.log("error getting bezier control points");
                } else {
    
                    this.setKeyframePoint(controlPoints, i, keyframes.length);
    
                    data += ` C${controlPoints[1].x} ${controlPoints[1].y} ${controlPoints[2].x} ${controlPoints[2].y} ${controlPoints[3].x} ${controlPoints[3].y}`

                }
            }

        });

        return data;

    }

    

    renderPoints(updatedSvgKeyFrame: IKeyframeSvgPoint, index: number){


        let animation = this.state.selected as Animation;

        let keys = [...animation.getKeys()];

        let newFrame = 0;
        if (updatedSvgKeyFrame.keyframePoint.x !== 0){
            if (updatedSvgKeyFrame.keyframePoint.x > 0 && updatedSvgKeyFrame.keyframePoint.x < 1){
                newFrame = 1;
            }else {
                newFrame = Math.round(updatedSvgKeyFrame.keyframePoint.x);
            }
        }

        keys[index].frame = newFrame; // This value comes as percentage/frame/time
        keys[index].value =  ((this._heightScale - updatedSvgKeyFrame.keyframePoint.y)/ this._heightScale)*2; // this value comes inverted svg from 0 = 100 to 100 = 0

        animation.setKeys(keys);

        this.selectAnimation(animation);

    }

    
    linearInterpolation(keyframes: IAnimationKey[], data: string, middle: number): string {
        keyframes.forEach((key, i) => {

            var point =  new Vector2(0, 0);
            point.x = key.frame;
            point.y = this._heightScale - (key.value * middle);
            this.setKeyframePointLinear(point, i);

            if (i !== 0) { 
                data += ` L${point.x} ${point.y}`
            }
        });
        return data;
    }

    setKeyframePointLinear(point: Vector2,index: number){
        let svgKeyframe = { keyframePoint: point, rightControlPoint: null, leftControlPoint: null, id: index.toString() }
        this._svgKeyframes.push(svgKeyframe);
    }

    setKeyframePoint(controlPoints: Vector2[], index: number, keyframesCount: number) {

        let svgKeyframe;
        if (index === 0){
            svgKeyframe = { keyframePoint: controlPoints[0], rightControlPoint: null, leftControlPoint: null, id: index.toString() }
        }else {
            this._svgKeyframes[index-1].rightControlPoint = controlPoints[1];
            svgKeyframe = { keyframePoint: controlPoints[3], rightControlPoint: null, leftControlPoint: controlPoints[2], id: index.toString() }
        }

        this._svgKeyframes.push(svgKeyframe);
    }

    selectAnimation(animation: Animation) {
        this._svgKeyframes = [];

        const pathData = this.getPathData(animation);
        if (pathData === "") {
            console.log("no keyframes in this animation");
        }
        this.setState({ selected: animation, currentPathData: pathData, svgKeyframes: this._svgKeyframes });

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
                
                    <div>
                        <div>
                        <label>Animation Name</label>
                        <input type="text" value={this.state.animationName} onChange={(e) => this.handleNameChange(e)}></input>
                        </div>
                        <div>
                        <label>Target Property</label>
                        <input type="text" value={this.state.animationTargetProperty} onChange={(e) => this.handlePropertyChange(e)}></input>
                        </div>
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
                    <div className="graph-chart">

                           { this.state.svgKeyframes && <SvgDraggableArea keyframeSvgPoints={this.state.svgKeyframes} updatePosition={(updatedSvgKeyFrame: IKeyframeSvgPoint,index: number) => this.renderPoints(updatedSvgKeyFrame, index)}>
                       
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

                            { this._frames && this._frames.map(frame => 
                             <svg x={frame.x} y={frame.y} style={{overflow:'visible'}}>
                             <circle cx="0" cy="0"  r="2" stroke="black" strokeWidth="1" fill="white"  />
                             </svg>

                            )}
                        
                        </SvgDraggableArea>

                        } 

                        Animation name: {this.state.selected.name}

                    </div>
                </div>
            </div>
        );
    }
}

