import * as React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import { Animation } from 'babylonjs/Animations/animation';
import { Vector2, Vector3, Quaternion } from 'babylonjs/Maths/math.vector';
import { Size } from 'babylonjs/Maths/math.size';
import { Color3, Color4 } from 'babylonjs/Maths/math.color';
import { EasingFunction } from 'babylonjs/Animations/easing';
import { IAnimationKey } from 'babylonjs/Animations/animationKey';
import { IKeyframeSvgPoint } from './keyframeSvgPoint';
import { SvgDraggableArea } from './svgDraggableArea';
import { Timeline } from './timeline';
import { Playhead } from './playhead';
import { Notification } from './notification';
import { GraphActionsBar } from './graphActionsBar';
import { Scene } from "babylonjs/scene";
import { ButtonLineComponent } from '../../../lines/buttonLineComponent';
import { IAnimatable } from 'babylonjs/Animations/animatable.interface';
import { TargetedAnimation } from "babylonjs/Animations/animationGroup";

require("./curveEditor.scss");

interface IAnimationCurveEditorComponentProps {
    close: (event: any) => void;
    playOrPause?: () => void;
    title: string;
    scene: Scene;
    entity: IAnimatable | TargetedAnimation;
}

interface ICanvasAxis {
    value: number;
    label: number;
}

export class AnimationCurveEditorComponent extends React.Component<IAnimationCurveEditorComponentProps, {
    animations: Animation[],
    animationName: string,
    animationType: string,
    animationTargetProperty: string,
    isOpen: boolean,
    selected: Animation | null,
    currentPathData: string | undefined,
    svgKeyframes: IKeyframeSvgPoint[] | undefined,
    currentFrame: number,
    currentValue: number,
    frameAxisLength: ICanvasAxis[],
    valueAxisLength: ICanvasAxis[],
    isFlatTangentMode: boolean,
    isTangentMode: boolean,
    isBrokenMode: boolean,
    lerpMode: boolean,
    scale: number,
    playheadOffset: number,
    notification: string,
    currentPoint: SVGPoint | undefined,
    lastFrame: number,
    playheadPos: number
}> {

    // Height scale *Review this functionaliy
    private _heightScale: number = 100;
    // Canvas Length *Review this functionality
    readonly _entityName: string;
    readonly _canvasLength: number = 20;
    private _newAnimations: Animation[] = [];
    private _svgKeyframes: IKeyframeSvgPoint[] = [];
    private _frames: Vector2[] = [];
    private _isPlaying: boolean = false;
    private _graphCanvas: React.RefObject<HTMLDivElement>;
    private _selectedCurve: React.RefObject<SVGPathElement>;
    private _svgCanvas: React.RefObject<SvgDraggableArea>;
    private _isTargetedAnimation: boolean;
    constructor(props: IAnimationCurveEditorComponentProps) {
        super(props);
        this._entityName = (this.props.entity as any).id;
        // Review is we really need this refs
        this._graphCanvas = React.createRef();
        this._selectedCurve = React.createRef();
        this._svgCanvas = React.createRef();

        console.log(this.props.entity instanceof TargetedAnimation)

        let initialSelection;
        let initialPathData;
        let initialLerpMode;
        if (this.props.entity instanceof TargetedAnimation) {
            this._isTargetedAnimation = true;
            initialSelection = this.props.entity.animation;
            initialLerpMode = this.analizeAnimation(this.props.entity.animation);
            initialPathData = this.getPathData(this.props.entity.animation);
        } else {
            this._isTargetedAnimation = false;
            initialLerpMode = this.analizeAnimation(this.props.entity.animations && this.props.entity.animations[0]);
            initialSelection = this.props.entity.animations !== null ? this.props.entity.animations[0] : null;
            initialPathData = this.props.entity.animations !== null ? this.getPathData(this.props.entity.animations[0]) : "";
        }

        // will update this until we have a top scroll/zoom feature
        let valueInd = [2, 1.8, 1.6, 1.4, 1.2, 1, 0.8, 0.6, 0.4, 0.2, 0];
        this.state = {
            animations: this._newAnimations,
            selected: initialSelection,
            isOpen: true,
            currentPathData: initialPathData,
            svgKeyframes: this._svgKeyframes,
            animationTargetProperty: 'position.x',
            animationName: "",
            animationType: "Float",
            currentFrame: 0,
            currentValue: 1,
            isFlatTangentMode: false,
            isTangentMode: false,
            isBrokenMode: false,
            lerpMode: initialLerpMode,
            playheadOffset: this._graphCanvas.current ? (this._graphCanvas.current.children[1].clientWidth) / (this._canvasLength * 10) : 0,
            frameAxisLength: (new Array(this._canvasLength)).fill(0).map((s, i) => { return { value: i * 10, label: i * 10 } }),
            valueAxisLength: (new Array(10)).fill(0).map((s, i) => { return { value: i * 10, label: valueInd[i] } }),
            notification: "",
            lastFrame: 0,
            currentPoint: undefined,
            scale: 1,
            playheadPos: 0,
        }
    }

    componentDidMount() {
        setTimeout(() => this.resetPlayheadOffset(), 500);
    }

    /**
    * Notifications
    * To add notification we set the state and clear to make the notification bar hide.
    */
    clearNotification() {
        this.setState({ notification: "" });
    }

    /**
    * Zoom and Scroll
    * This section handles zoom and scroll
    * of the graph area.
    */
    zoom(e: React.WheelEvent<HTMLDivElement>) {
        e.nativeEvent.stopImmediatePropagation();
        console.log(e.deltaY);
        let scaleX = 1;
        if (Math.sign(e.deltaY) === -1) {
            scaleX = (this.state.scale - 0.01);
        } else {
            scaleX = (this.state.scale + 0.01);
        }

        this.setState({ scale: scaleX }, this.setAxesLength);

    }

    setAxesLength() {
        // Check why we get undefined, or NaN in length?
        let length = Math.round(this._canvasLength * this.state.scale);

        let highestFrame = 100;
        if (this.state.selected !== null) {
            highestFrame = this.state.selected.getHighestFrame();
        }

        if (length < (highestFrame * 2) / 10) {
            length = (highestFrame * 2) / 10
        }

        let valueLines = Math.round((this.state.scale * this._heightScale) / 10);
        let newFrameLength = (new Array(length)).fill(0).map((s, i) => { return { value: i * 10, label: i * 10 } });
        let newValueLength = (new Array(valueLines)).fill(0).map((s, i) => { return { value: i * 10, label: this.getValueLabel(i * 10) } });
        this.setState({ frameAxisLength: newFrameLength, valueAxisLength: newValueLength });
        this.resetPlayheadOffset();

    }

    getValueLabel(i: number) {
        // Need to update this when Y axis grows
        let label = 0;
        if (i === 0) {
            label = 2;
        }
        if (i === 50) {
            label = 1;
        } else {
            label = ((100 - (i * 2)) * 0.01) + 1;
        }
        return label;
    }

    resetPlayheadOffset() {
        if (this._graphCanvas && this._graphCanvas.current) {
            this.setState({ playheadOffset: (this._graphCanvas.current.children[1].clientWidth) / (this._canvasLength * 10 * this.state.scale) });
        }
    }



    /**
    * Add New Animation
    * This section handles events from AnimationCreation.
    */
    handleNameChange(event: React.ChangeEvent<HTMLInputElement>) {
        event.preventDefault();
        this.setState({ animationName: event.target.value.trim() });
    }

    handleTypeChange(event: React.ChangeEvent<HTMLSelectElement>) {
        event.preventDefault();
        this.setState({ animationType: event.target.value });
    }

    handlePropertyChange(event: React.ChangeEvent<HTMLInputElement>) {
        event.preventDefault();
        this.setState({ animationTargetProperty: event.target.value });
    }

    setListItem(animation: Animation, i: number) {
        let element;

        switch (animation.dataType) {
            case Animation.ANIMATIONTYPE_FLOAT:
                element = <li className={this.state.selected && this.state.selected.name === animation.name ? 'active' : ''} key={i} onClick={() => this.selectAnimation(animation)}>
                    <p>{animation.name}&nbsp;
                    <span>{animation.targetProperty}</span></p>
                </li>
                break;
            case Animation.ANIMATIONTYPE_VECTOR2:
                element = <li className="property" key={i}><p>{animation.targetProperty}</p>
                    <ul>
                        <li key={`${i}_x`}>Property <strong>X</strong></li>
                        <li key={`${i}_y`}>Property <strong>Y</strong></li>
                    </ul>
                </li>
                break;
            case Animation.ANIMATIONTYPE_VECTOR3:
                element = <li className="property" key={i}><p>{animation.targetProperty}</p>
                    <ul>
                        <li key={`${i}_x`}>Property <strong>X</strong></li>
                        <li key={`${i}_y`}>Property <strong>Y</strong></li>
                        <li key={`${i}_z`}>Property <strong>Z</strong></li>
                    </ul>
                </li>
                break;
            case Animation.ANIMATIONTYPE_QUATERNION:
                element = <li className="property" key={i}><p>{animation.targetProperty}</p>
                    <ul>
                        <li key={`${i}_x`}>Property <strong>X</strong></li>
                        <li key={`${i}_y`}>Property <strong>Y</strong></li>
                        <li key={`${i}_z`}>Property <strong>Z</strong></li>
                        <li key={`${i}_w`}>Property <strong>W</strong></li>
                    </ul>
                </li>
                break;
            case Animation.ANIMATIONTYPE_COLOR3:
                element = <li className="property" key={i}><p>{animation.targetProperty}</p>
                    <ul>
                        <li key={`${i}_r`}>Property <strong>R</strong></li>
                        <li key={`${i}_g`}>Property <strong>G</strong></li>
                        <li key={`${i}_b`}>Property <strong>B</strong></li>
                    </ul>
                </li>
                break;
            case Animation.ANIMATIONTYPE_COLOR4:
                element = <li className="property" key={i}><p>{animation.targetProperty}</p>
                    <ul>
                        <li key={`${i}_r`}>Property <strong>R</strong></li>
                        <li key={`${i}_g`}>Property <strong>G</strong></li>
                        <li key={`${i}_b`}>Property <strong>B</strong></li>
                        <li key={`${i}_a`}>Property <strong>A</strong></li>
                    </ul>
                </li>
                break;
            case Animation.ANIMATIONTYPE_SIZE:
                element = <li className="property" key={i}><p>{animation.targetProperty}</p>
                    <ul>
                        <li key={`${i}_width`}>Property <strong>Width</strong></li>
                        <li key={`${i}_height`}>Property <strong>Height</strong></li>
                    </ul>
                </li>
                break;
            default: console.log("not recognized");
                element = null;
                break;
        }

        return element;
    }

    getAnimationTypeofChange(selected: string) {
        let dataType = 0;
        switch (selected) {
            case "Float":
                dataType = Animation.ANIMATIONTYPE_FLOAT;
                break;
            case "Quaternion":
                dataType = Animation.ANIMATIONTYPE_QUATERNION;
                break;
            case "Vector3":
                dataType = Animation.ANIMATIONTYPE_VECTOR3;
                break;
            case "Vector2":
                dataType = Animation.ANIMATIONTYPE_VECTOR2;
                break;
            case "Size":
                dataType = Animation.ANIMATIONTYPE_SIZE;
                break;
            case "Color3":
                dataType = Animation.ANIMATIONTYPE_COLOR3;
                break;
            case "Color4":
                dataType = Animation.ANIMATIONTYPE_COLOR4;
                break;
        }

        return dataType;

    }

    addAnimation() {
        if (this.state.animationName != "" && this.state.animationTargetProperty != "") {

            let matchTypeTargetProperty = this.state.animationTargetProperty.split('.');
            let animationDataType = this.getAnimationTypeofChange(this.state.animationType);
            let matched = false;

            if (matchTypeTargetProperty.length === 1) {
                let match = (this.props.entity as any)[matchTypeTargetProperty[0]];

                if (match) {
                    switch (match.constructor.name) {
                        case "Vector2":
                            animationDataType === Animation.ANIMATIONTYPE_VECTOR2 ? matched = true : matched = false;
                            break;
                        case "Vector3":
                            animationDataType === Animation.ANIMATIONTYPE_VECTOR3 ? matched = true : matched = false;
                            break;
                        case "Quaternion":
                            animationDataType === Animation.ANIMATIONTYPE_QUATERNION ? matched = true : matched = false;
                            break;
                        case "Color3":
                            animationDataType === Animation.ANIMATIONTYPE_COLOR3 ? matched = true : matched = false;
                            break;
                        case "Color4":
                            animationDataType === Animation.ANIMATIONTYPE_COLOR4 ? matched = true : matched = false;
                            break;
                        case "Size":
                            animationDataType === Animation.ANIMATIONTYPE_SIZE ? matched = true : matched = false;
                            break;
                        default: console.log("not recognized");
                            break;
                    }
                } else {
                    this.setState({ notification: `The selected entity doesn't have a ${matchTypeTargetProperty[0]} property` });
                }
            } else if (matchTypeTargetProperty.length > 1) {
                let match = (this.props.entity as any)[matchTypeTargetProperty[0]][matchTypeTargetProperty[1]];
                if (typeof match === "number") {
                    animationDataType === Animation.ANIMATIONTYPE_FLOAT ? matched = true : matched = false;
                }
            }

            if (matched) {

                let startValue;
                let endValue;
                let outTangent;
                let inTangent;
                // Default start and end values for new animations
                switch (animationDataType) {
                    case Animation.ANIMATIONTYPE_FLOAT:
                        startValue = 1;
                        endValue = 1;
                        outTangent = 0;
                        inTangent = 0;
                        break;
                    case Animation.ANIMATIONTYPE_VECTOR2:
                        startValue = new Vector2(1, 1);
                        endValue = new Vector2(1, 1);
                        outTangent = Vector2.Zero();
                        inTangent = Vector2.Zero();
                        break;
                    case Animation.ANIMATIONTYPE_VECTOR3:
                        startValue = new Vector3(1, 1, 1);
                        endValue = new Vector3(1, 1, 1);
                        outTangent = Vector3.Zero();
                        inTangent = Vector3.Zero();
                        break;
                    case Animation.ANIMATIONTYPE_QUATERNION:
                        startValue = new Quaternion(1, 1, 1, 1);
                        endValue = new Quaternion(1, 1, 1, 1);
                        outTangent = Quaternion.Zero();
                        inTangent = Quaternion.Zero();
                        break;
                    case Animation.ANIMATIONTYPE_COLOR3:
                        startValue = new Color3(1, 1, 1);
                        endValue = new Color3(1, 1, 1);
                        outTangent = new Color3(0, 0, 0);
                        inTangent = new Color3(0, 0, 0);
                        break;
                    case Animation.ANIMATIONTYPE_COLOR4:
                        startValue = new Color4(1, 1, 1, 1);
                        endValue = new Color4(1, 1, 1, 1);
                        outTangent = new Color4(0, 0, 0, 0);
                        inTangent = new Color4(0, 0, 0, 0);
                        break;
                    case Animation.ANIMATIONTYPE_SIZE:
                        startValue = new Size(1, 1);
                        endValue = new Size(1, 1);
                        outTangent = Size.Zero();
                        inTangent = Size.Zero();
                        break;
                    default: console.log("not recognized");
                        break;
                }

                let animation = new Animation(this.state.animationName, this.state.animationTargetProperty, 30, animationDataType);

                // Start with two keyframes
                var keys = [];
                keys.push({
                    frame: 0,
                    value: startValue,
                    outTangent: outTangent
                });

                keys.push({
                    inTangent: inTangent,
                    frame: 100,
                    value: endValue
                });

                animation.setKeys(keys);
                (this.props.entity as IAnimatable).animations?.push(animation);

            } else {
                this.setState({ notification: `The property "${this.state.animationTargetProperty}" is not a "${this.state.animationType}" type` });
            }

        } else {
            this.setState({ notification: "You need to provide a name and target property." });
        }
    }

    /**
    * Keyframe Manipulation
    * This section handles events from SvgDraggableArea.
    */
    selectKeyframe(id: string) {
        let updatedKeyframes = this.state.svgKeyframes?.map(kf => {
            if (kf.id === id) {
                kf.selected = !kf.selected
            }
            return kf;
        });
        this.setState({ svgKeyframes: updatedKeyframes });

    }

    selectedControlPoint(type: string, id: string) {
        let updatedKeyframes = this.state.svgKeyframes?.map(kf => {
            if (kf.id === id) {
                this.setState({ isFlatTangentMode: false });
                if (type === "left") {
                    kf.isLeftActive = !kf.isLeftActive;
                    kf.isRightActive = false;
                }
                if (type === "right") {
                    kf.isRightActive = !kf.isRightActive;
                    kf.isLeftActive = false;
                }
            }
            return kf;
        });
        this.setState({ svgKeyframes: updatedKeyframes });
    }

    renderPoints(updatedSvgKeyFrame: IKeyframeSvgPoint, index: number) {

        let animation = this.state.selected as Animation;
        // Bug: After play/stop we get an extra keyframe at 0

        let keys = [...animation.getKeys()];

        let newFrame = 0;
        if (updatedSvgKeyFrame.keyframePoint.x !== 0) {
            if (updatedSvgKeyFrame.keyframePoint.x > 0 && updatedSvgKeyFrame.keyframePoint.x < 1) {
                newFrame = 1;
            } else {
                newFrame = Math.round(updatedSvgKeyFrame.keyframePoint.x);
            }
        }

        keys[index].frame = newFrame; // This value comes as percentage/frame/time
        keys[index].value = ((this._heightScale - updatedSvgKeyFrame.keyframePoint.y) / this._heightScale) * 2; // this value comes inverted svg from 0 = 100 to 100 = 0

        if (!this.state.isBrokenMode) {
            if (updatedSvgKeyFrame.isLeftActive) {

                if (updatedSvgKeyFrame.leftControlPoint !== null) {
                    // Rotate 
                    let updatedValue = ((this._heightScale - updatedSvgKeyFrame.leftControlPoint.y) / this._heightScale) * 2;

                    let keyframeValue = ((this._heightScale - updatedSvgKeyFrame.keyframePoint.y) / this._heightScale) * 2;

                    keys[index].inTangent = keyframeValue - updatedValue;

                    // Right control point if exists
                    if (updatedSvgKeyFrame.rightControlPoint !== null) {
                        // Sets opposite value
                        keys[index].outTangent = keys[index].inTangent * -1
                    }
                }
            }

            if (updatedSvgKeyFrame.isRightActive) {

                if (updatedSvgKeyFrame.rightControlPoint !== null) {
                    // Rotate 
                    let updatedValue = ((this._heightScale - updatedSvgKeyFrame.rightControlPoint.y) / this._heightScale) * 2;

                    let keyframeValue = ((this._heightScale - updatedSvgKeyFrame.keyframePoint.y) / this._heightScale) * 2;

                    keys[index].outTangent = keyframeValue - updatedValue;

                    if (updatedSvgKeyFrame.leftControlPoint !== null) {   // Sets opposite value
                        keys[index].inTangent = keys[index].outTangent * -1
                    }
                }
            }
        }

        animation.setKeys(keys);

        this.selectAnimation(animation);

    }

    /**
    * Actions
    * This section handles events from GraphActionsBar.
    */
    handleFrameChange(event: React.ChangeEvent<HTMLInputElement>) {
        event.preventDefault();
        this.changeCurrentFrame(parseInt(event.target.value))
    }

    handleValueChange(event: React.ChangeEvent<HTMLInputElement>) {
        event.preventDefault();
        this.setState({ currentValue: parseFloat(event.target.value) }, () => {
            if (this.state.selected !== null) {
                let animation = this.state.selected;
                let keys = animation.getKeys();

                let isKeyframe = keys.find(k => k.frame === this.state.currentFrame);
                if (isKeyframe) {
                    let updatedKeys = keys.map(k => {
                        if (k.frame === this.state.currentFrame) {
                            k.value = this.state.currentValue;
                        }
                        return k;
                    });
                    this.state.selected.setKeys(updatedKeys);
                    this.selectAnimation(animation);
                }
            }
        });
    }

    setFlatTangent() {
        if (this.state.selected !== null) {
            let animation = this.state.selected;
            this.setState({ isFlatTangentMode: !this.state.isFlatTangentMode }, () => this.selectAnimation(animation));
        }
    }

    // Use this for Bezier curve mode
    setTangentMode() {
        if (this.state.selected !== null) {
            let animation = this.state.selected;
            this.setState({ isTangentMode: !this.state.isTangentMode }, () => this.selectAnimation(animation));
        }
    }

    setBrokenMode() {
        if (this.state.selected !== null) {
            let animation = this.state.selected;
            this.setState({ isBrokenMode: !this.state.isBrokenMode }, () => this.selectAnimation(animation));
        }
    }

    setLerpMode() {
        if (this.state.selected !== null) {
            let animation = this.state.selected;
            this.setState({ lerpMode: !this.state.lerpMode }, () => this.selectAnimation(animation));
        }
    }

    addKeyframeClick() {

        if (this.state.selected !== null) {
            let currentAnimation = this.state.selected;

            if (currentAnimation.dataType === Animation.ANIMATIONTYPE_FLOAT) {
                let keys = currentAnimation.getKeys();
                let x = this.state.currentFrame;
                let y = this.state.currentValue;

                keys.push({ frame: x, value: y, inTangent: 0, outTangent: 0 });
                keys.sort((a, b) => a.frame - b.frame);

                currentAnimation.setKeys(keys);

                this.selectAnimation(currentAnimation);
            }
        }
    }

    removeKeyframeClick() {

        if (this.state.selected !== null) {
            let currentAnimation = this.state.selected;

            if (currentAnimation.dataType === Animation.ANIMATIONTYPE_FLOAT) {
                let keys = currentAnimation.getKeys();
                let x = this.state.currentFrame;
                let filteredKeys = keys.filter(kf => kf.frame !== x);

                currentAnimation.setKeys(filteredKeys);

                this.selectAnimation(currentAnimation);
            }
        }
    }

    addKeyFrame(event: React.MouseEvent<SVGSVGElement>) {

        event.preventDefault();

        if (this.state.selected !== null) {

            var svg = event.target as SVGSVGElement;

            var pt = svg.createSVGPoint();

            pt.x = event.clientX;
            pt.y = event.clientY;

            var inverse = svg.getScreenCTM()?.inverse();

            var cursorpt = pt.matrixTransform(inverse);

            var currentAnimation = this.state.selected;

            var keys = currentAnimation.getKeys();

            var height = 100;
            var middle = (height / 2);

            var keyValue;

            if (cursorpt.y < middle) {
                keyValue = 1 + ((100 / cursorpt.y) * .1)
            }

            if (cursorpt.y > middle) {
                keyValue = 1 - ((100 / cursorpt.y) * .1)
            }

            keys.push({ frame: cursorpt.x, value: keyValue });

            currentAnimation.setKeys(keys);

            this.selectAnimation(currentAnimation);
        }
    }

    updateKeyframe(keyframe: Vector2, index: number) {

        let anim = this.state.selected as Animation;
        var keys: IAnimationKey[] = [];

        var svgKeyframes = this.state.svgKeyframes?.map((k, i) => {
            if (i === index) {
                k.keyframePoint.x = keyframe.x;
                k.keyframePoint.y = keyframe.y;
            }

            var height = 100;
            var middle = (height / 2);

            var keyValue;

            if (k.keyframePoint.y < middle) {
                keyValue = 1 + ((100 / k.keyframePoint.y) * .1)
            }

            if (k.keyframePoint.y > middle) {
                keyValue = 1 - ((100 / k.keyframePoint.y) * .1)
            }

            keys.push({ frame: k.keyframePoint.x, value: keyValue })
            return k;
        });

        anim.setKeys(keys);

        this.setState({ svgKeyframes: svgKeyframes });

    }

    /**
    * Curve Rendering Functions
    * This section handles how to render curves.
    */
    getAnimationProperties(animation: Animation) {
        let easingType, easingMode;
        let easingFunction: EasingFunction = animation.getEasingFunction() as EasingFunction;
        if (easingFunction === undefined) {
            easingType = undefined
            easingMode = undefined;
        } else {
            easingType = easingFunction.constructor.name;
            easingMode = easingFunction.getEasingMode();
        }
        return { easingType, easingMode }
    }

    linearInterpolation(keyframes: IAnimationKey[], data: string, middle: number): string {
        keyframes.forEach((key, i) => {

            var point = new Vector2(0, 0);
            point.x = key.frame;
            point.y = this._heightScale - (key.value * middle);
            this.setKeyframePointLinear(point, i);

            if (i !== 0) {
                data += ` L${point.x} ${point.y}`
            }
        });
        return data;
    }

    setKeyframePointLinear(point: Vector2, index: number) {
        let svgKeyframe = { keyframePoint: point, rightControlPoint: null, leftControlPoint: null, id: index.toString(), selected: false, isLeftActive: false, isRightActive: false }
        this._svgKeyframes.push(svgKeyframe);
    }

    getPathData(animation: Animation) {

        // Check if Tangent mode is active and broken mode is active. (Only one tangent moves)
        let keyframes = animation.getKeys();

        if (keyframes === undefined) {
            return "";
        }

        // Checks if Flat Tangent is active (tangents are set to zero)
        if (this.state && this.state.isFlatTangentMode) {
            keyframes = animation.getKeys().map(kf => {

                if (kf.inTangent !== undefined) {
                    kf.inTangent = 0;
                }

                if (kf.outTangent !== undefined) {
                    kf.outTangent = 0;
                }

                return kf;
            });
        } else {
            keyframes = animation.getKeys();
        }

        const startKey = keyframes[0];

        let middle = this._heightScale / 2;

        // START OF LINE/CURVE
        let data: string | undefined = `M${startKey.frame}, ${this._heightScale - (startKey.value * middle)}`;

        if (this.state && this.state.lerpMode) {
            data = this.linearInterpolation(keyframes, data, middle);
        } else {
            if (this.getAnimationData(animation).usesTangents) {
                data = this.curvePathWithTangents(keyframes, data, middle, animation.dataType);
            } else {
                const { easingMode, easingType } = this.getAnimationProperties(animation);
                if (easingType !== undefined && easingMode !== undefined) {
                    let easingFunction = animation.getEasingFunction();
                    data = this.curvePath(keyframes, data, middle, easingFunction as EasingFunction)
                } else {
                    if (this.state !== undefined) {
                        let emptyTangents = keyframes.map((kf, i) => {
                            if (i === 0) {
                                kf.outTangent = 0;
                            } else if (i === keyframes.length - 1) {
                                kf.inTangent = 0;
                            } else {
                                kf.inTangent = 0;
                                kf.outTangent = 0;
                            }
                            return kf;
                        });
                        data = this.curvePathWithTangents(emptyTangents, data, middle, animation.dataType);
                    } else {
                        data = this.linearInterpolation(keyframes, data, middle);
                    }

                }
            }
        }

        return data;

    }

    getAnimationData(animation: Animation) {

        // General Props
        let loopMode = animation.loopMode;
        let name = animation.name;
        let blendingSpeed = animation.blendingSpeed;
        let targetProperty = animation.targetProperty;
        let targetPropertyPath = animation.targetPropertyPath;
        let framesPerSecond = animation.framePerSecond;
        let highestFrame = animation.getHighestFrame();
        let serialized = animation.serialize();
        let usesTangents = animation.getKeys().find(kf => kf.hasOwnProperty('inTangent') || kf.hasOwnProperty('outTangent')) !== undefined ? true : false;

        return { loopMode, name, blendingSpeed, targetPropertyPath, targetProperty, framesPerSecond, highestFrame, serialized, usesTangents }

    }

    drawAllFrames(initialKey: IAnimationKey, endKey: IAnimationKey, easingFunction: EasingFunction) {

        let i = initialKey.frame;

        for (i; i < endKey.frame; i++) {

            (i * 100 / endKey.frame)

            let dy = easingFunction.easeInCore(i);
            let value = this._heightScale - (dy * (this._heightScale / 2));
            this._frames.push(new Vector2(i, value));

        }
    }

    curvePathFlat(keyframes: IAnimationKey[], data: string, middle: number, dataType: number) {

        keyframes.forEach((key, i) => {

            if (dataType === Animation.ANIMATIONTYPE_FLOAT) {

                var pointA = new Vector2(0, 0);
                if (i === 0) {
                    pointA.set(key.frame, this._heightScale - (key.value * middle));
                    this.setKeyframePoint([pointA], i, keyframes.length);
                } else {
                    pointA.set(keyframes[i - 1].frame, this._heightScale - (keyframes[i - 1].value * middle));

                    let defaultWeight = 10;

                    let nextKeyframe = keyframes[i + 1];
                    let prevKeyframe = keyframes[i - 1];
                    if (nextKeyframe !== undefined) {
                        let distance = keyframes[i + 1].frame - key.frame;
                        defaultWeight = distance * .33;
                    }

                    if (prevKeyframe !== undefined) {
                        let distance = key.frame - keyframes[i - 1].frame;
                        defaultWeight = distance * .33;
                    }

                    let tangentA = new Vector2(pointA.x + defaultWeight, pointA.y);

                    let pointB = new Vector2(key.frame, this._heightScale - (key.value * middle));

                    let tangentB = new Vector2(pointB.x - defaultWeight, pointB.y);

                    this.setKeyframePoint([pointA, tangentA, tangentB, pointB], i, keyframes.length);

                    data += ` C${tangentA.x} ${tangentA.y} ${tangentB.x} ${tangentB.y} ${pointB.x} ${pointB.y} `

                }
            }
        });

        return data;

    }

    curvePathWithTangents(keyframes: IAnimationKey[], data: string, middle: number, type: number) {

        keyframes.forEach((key, i) => {

            let svgKeyframe;
            let outTangent;
            let inTangent;
            let defaultWeight = 5;

            var inT = key.inTangent === undefined ? null : key.inTangent;
            var outT = key.outTangent === undefined ? null : key.outTangent;

            let y = this._heightScale - (key.value * middle);

            let nextKeyframe = keyframes[i + 1];
            let prevKeyframe = keyframes[i - 1];
            if (nextKeyframe !== undefined) {
                let distance = keyframes[i + 1].frame - key.frame;
                defaultWeight = distance * .33;
            }

            if (prevKeyframe !== undefined) {
                let distance = key.frame - keyframes[i - 1].frame;
                defaultWeight = distance * .33;
            }

            if (inT !== null) {
                let valueIn = (y * inT) + y;
                inTangent = new Vector2(key.frame - defaultWeight, valueIn)
            } else {
                inTangent = null;
            }

            if (outT !== null) {
                let valueOut = (y * outT) + y;
                outTangent = new Vector2(key.frame + defaultWeight, valueOut);
            } else {
                outTangent = null;
            }

            if (i === 0) {
                svgKeyframe = { keyframePoint: new Vector2(key.frame, this._heightScale - (key.value * middle)), rightControlPoint: outTangent, leftControlPoint: null, id: i.toString(), selected: false, isLeftActive: false, isRightActive: false }
                if (outTangent !== null) {
                    data += ` C${outTangent.x} ${outTangent.y} `;
                }

            } else {

                svgKeyframe = { keyframePoint: new Vector2(key.frame, this._heightScale - (key.value * middle)), rightControlPoint: outTangent, leftControlPoint: inTangent, id: i.toString(), selected: false, isLeftActive: false, isRightActive: false }

                if (outTangent !== null && inTangent !== null) {
                    data += ` ${inTangent.x} ${inTangent.y} ${svgKeyframe.keyframePoint.x} ${svgKeyframe.keyframePoint.y} C${outTangent.x} ${outTangent.y} `
                } else if (inTangent !== null) {
                    data += ` ${inTangent.x} ${inTangent.y} ${svgKeyframe.keyframePoint.x} ${svgKeyframe.keyframePoint.y} `
                }

            }

            if (this.state) {
                let prev = this.state.svgKeyframes?.find(kf => kf.id === i.toString());
                if (prev) {
                    svgKeyframe.isLeftActive = prev?.isLeftActive;
                    svgKeyframe.isRightActive = prev?.isRightActive;
                    svgKeyframe.selected = prev?.selected
                }
            }

            this._svgKeyframes.push(svgKeyframe);

        }, this);

        return data;

    }

    curvePath(keyframes: IAnimationKey[], data: string, middle: number, easingFunction: EasingFunction) {

        // This will get 1/4 and 3/4 of points in eased curve
        const u = .25;
        const v = .75;

        keyframes.forEach((key, i) => {

            // Gets previous initial point of curve segment
            var pointA = new Vector2(0, 0);
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

                if (controlPoints === undefined) {
                    console.log("error getting bezier control points");
                } else {

                    this.setKeyframePoint(controlPoints, i, keyframes.length);

                    data += ` C${controlPoints[1].x} ${controlPoints[1].y} ${controlPoints[2].x} ${controlPoints[2].y} ${controlPoints[3].x} ${controlPoints[3].y}`

                }
            }

        });

        return data;

    }

    setKeyframePoint(controlPoints: Vector2[], index: number, keyframesCount: number) {

        let svgKeyframe;
        if (index === 0) {
            svgKeyframe = { keyframePoint: controlPoints[0], rightControlPoint: null, leftControlPoint: null, id: index.toString(), selected: false, isLeftActive: false, isRightActive: false }
        } else {
            this._svgKeyframes[index - 1].rightControlPoint = controlPoints[1];
            svgKeyframe = { keyframePoint: controlPoints[3], rightControlPoint: null, leftControlPoint: controlPoints[2], id: index.toString(), selected: false, isLeftActive: false, isRightActive: false }
        }

        this._svgKeyframes.push(svgKeyframe);
    }

    interpolateControlPoints(p0: Vector2, p1: Vector2, u: number, p2: Vector2, v: number, p3: Vector2): Vector2[] | undefined {

        let a = 0.0;
        let b = 0.0;
        let c = 0.0;
        let d = 0.0;
        let det = 0.0;
        let q1: Vector2 = new Vector2();
        let q2: Vector2 = new Vector2();
        let controlA: Vector2 = p0;
        let controlB: Vector2 = new Vector2();
        let controlC: Vector2 = new Vector2();
        let controlD: Vector2 = p3;

        if ((u <= 0.0) || (u >= 1.0) || (v <= 0.0) || (v >= 1.0) || (u >= v)) {
            return undefined;
        }

        a = 3 * (1 - u) * (1 - u) * u; b = 3 * (1 - u) * u * u;
        c = 3 * (1 - v) * (1 - v) * v; d = 3 * (1 - v) * v * v;
        det = a * d - b * c;

        if (det == 0.0) return undefined;

        q1.x = p1.x - ((1 - u) * (1 - u) * (1 - u) * p0.x + u * u * u * p3.x);
        q1.y = p1.y - ((1 - u) * (1 - u) * (1 - u) * p0.y + u * u * u * p3.y);

        q2.x = p2.x - ((1 - v) * (1 - v) * (1 - v) * p0.x + v * v * v * p3.x);
        q2.y = p2.y - ((1 - v) * (1 - v) * (1 - v) * p0.y + v * v * v * p3.y);


        controlB.x = (d * q1.x - b * q2.x) / det;
        controlB.y = (d * q1.y - b * q2.y) / det;

        controlC.x = ((-c) * q1.x + a * q2.x) / det;
        controlC.y = ((-c) * q1.y + a * q2.y) / det;

        return [controlA, controlB, controlC, controlD];

    }

    /**
    * Core functions
    * This section handles main Curve Editor Functions.
    */
    selectAnimation(animation: Animation) {

        this.isAnimationPlaying();

        this._svgKeyframes = [];

        const pathData = this.getPathData(animation);

        let lastFrame = animation.getHighestFrame();

        if (pathData === "") {
            console.log("no keyframes in this animation");
        }

        this.setState({ selected: animation, currentPathData: pathData, svgKeyframes: this._svgKeyframes, lastFrame: lastFrame });

    }

    isAnimationPlaying() {

        let target = this.props.entity;
        if (this.props.entity instanceof TargetedAnimation) {
            target = this.props.entity.target;
        }

        this._isPlaying = this.props.scene.getAllAnimatablesByTarget(target).length > 0;
        if (this._isPlaying) {
            this.props.playOrPause && this.props.playOrPause();
        } else {
            this._isPlaying = false;
        }
    }

    analizeAnimation(animation: Animation | null) {
        if (animation !== null) {
            const { easingMode, easingType } = this.getAnimationProperties(animation);
            let hasDefinedTangents = this.getAnimationData(animation).usesTangents;

            if (easingType === undefined && easingMode === undefined && !hasDefinedTangents) {
                return true;
            } else {
                return false;
            }
        } else {
            return false;
        }
    }

    /**
    * Timeline
    * This section controls the timeline.
    */
    changeCurrentFrame(frame: number) {

        let currentValue;
        let selectedCurve = this._selectedCurve.current;
        if (selectedCurve) {

            var curveLength = selectedCurve.getTotalLength();

            let frameValue = (frame * curveLength) / 100;
            let currentP = selectedCurve.getPointAtLength(frameValue);
            let middle = this._heightScale / 2;

            let offset = (((currentP?.y * this._heightScale) - (this._heightScale ** 2) / 2) / middle) / this._heightScale;

            let unit = Math.sign(offset);
            currentValue = unit === -1 ? Math.abs(offset + unit) : unit - offset;

            this.setState({ currentFrame: frame, currentValue: currentValue, currentPoint: currentP });

        }
    }

    render() {
        return (
            <div id="animation-curve-editor">

                <Notification message={this.state.notification} open={this.state.notification !== "" ? true : false} close={() => this.clearNotification()} />

                <div className="header">
                    <div className="title">{this.props.title}</div>
                    <div className="close" onClick={(event: React.MouseEvent<HTMLDivElement, MouseEvent>) => this.props.close(event)}>
                        <FontAwesomeIcon icon={faTimes} />
                    </div>
                </div>

                <GraphActionsBar currentValue={this.state.currentValue}
                    currentFrame={this.state.currentFrame}
                    handleFrameChange={(e) => this.handleFrameChange(e)}
                    handleValueChange={(e) => this.handleValueChange(e)}
                    addKeyframe={() => this.addKeyframeClick()}
                    removeKeyframe={() => this.removeKeyframeClick()}
                    brokenMode={this.state.isBrokenMode}
                    brokeTangents={() => this.setBrokenMode()}
                    lerpMode={this.state.lerpMode}
                    setLerpMode={() => this.setLerpMode()}
                    flatTangent={() => this.setFlatTangent()} />

                <div className="content">
                    <div className="row">
                        <div className="animation-list">
                            <div style={{ display: this._isTargetedAnimation ? "none" : "block" }}>
                                <div className="label-input">
                                    <label>Animation Name</label>
                                    <input type="text" value={this.state.animationName} onChange={(e) => this.handleNameChange(e)}></input>
                                </div>
                                <div className="label-input">
                                    <label>Type</label>
                                    <select onChange={(e) => this.handleTypeChange(e)} value={this.state.animationType}>
                                        <option value="Float">Float</option>
                                        <option value="Vector3">Vector3</option>
                                        <option value="Vector2">Vector2</option>
                                        <option value="Quaternion">Quaternion</option>
                                        <option value="Color3">Color3</option>
                                        <option value="Color4">Color4</option>
                                        <option value="Size">Size</option>
                                    </select>
                                </div>
                                <div className="label-input">
                                    <label>Target Property</label>
                                    <input type="text" value={this.state.animationTargetProperty} onChange={(e) => this.handlePropertyChange(e)}></input>
                                </div>
                                <ButtonLineComponent label={"Add Animation"} onClick={() => this.addAnimation()} />
                            </div>

                            <div className="object-tree">
                                <h2>{this._entityName}</h2>
                                <ul>
                                    {

                                        this.props.entity instanceof TargetedAnimation ? this.setListItem(this.props.entity.animation, 0) :
                                            this.props.entity.animations && this.props.entity.animations.map((animation, i) => {

                                                return this.setListItem(animation, i);

                                            })}

                                </ul>
                            </div>
                        </div>

                        <div ref={this._graphCanvas} className="graph-chart" onWheel={(e) => this.zoom(e)} >

                            <Playhead frame={this.state.currentFrame} offset={this.state.playheadOffset} />

                            {this.state.svgKeyframes && <SvgDraggableArea ref={this._svgCanvas}
                                selectKeyframe={(id: string) => this.selectKeyframe(id)}
                                viewBoxScale={this.state.frameAxisLength.length} scale={this.state.scale}
                                keyframeSvgPoints={this.state.svgKeyframes}
                                selectedControlPoint={(type: string, id: string) => this.selectedControlPoint(type, id)}
                                updatePosition={(updatedSvgKeyFrame: IKeyframeSvgPoint, index: number) => this.renderPoints(updatedSvgKeyFrame, index)}>

                                {/* Frame Labels  */}
                                { /* Vertical Grid  */}
                                {this.state.frameAxisLength.map((f, i) =>
                                    <svg key={i}>
                                        <text x={f.value} y="-2" dx="-1em" style={{ font: 'italic 0.2em sans-serif', fontSize: `${0.2 * this.state.scale}em` }}>{f.value}</text>
                                        <line x1={f.value} y1="0" x2={f.value} y2="100%"></line>
                                    </svg>
                                )}

                                {this.state.valueAxisLength.map((f, i) => {
                                    return <svg key={i}>
                                        <text x="-3" y={f.value} dx="-1em" style={{ font: 'italic 0.2em sans-serif', fontSize: `${0.2 * this.state.scale}em` }}>{f.label.toFixed(1)}</text>
                                        <line x1="0" y1={f.value} x2="100%" y2={f.value}></line>
                                    </svg>

                                })}

                                { /* Single Curve -Modify this for multiple selection and view  */}
                                <path ref={this._selectedCurve} pathLength={this.state.lastFrame} id="curve" d={this.state.currentPathData} style={{ stroke: 'red', fill: 'none', strokeWidth: '0.5' }}></path>

                                {this._frames && this._frames.map(frame =>
                                    <svg x={frame.x} y={frame.y} style={{ overflow: 'visible' }}>
                                        <circle cx="0" cy="0" r="2" stroke="black" strokeWidth="1" fill="white" />
                                    </svg>
                                )}

                            </SvgDraggableArea>

                            }

                        </div>
                    </div>
                    <div className="row">
                        <Timeline currentFrame={this.state.currentFrame} onCurrentFrameChange={(frame: number) => this.changeCurrentFrame(frame)} keyframes={this.state.selected && this.state.selected.getKeys()} selected={this.state.selected && this.state.selected.getKeys()[0]}></Timeline>
                    </div>
                </div>
            </div>
        );
    }
}

