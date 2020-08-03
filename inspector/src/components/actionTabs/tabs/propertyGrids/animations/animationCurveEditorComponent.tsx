import * as React from "react";
import { Animation } from "babylonjs/Animations/animation";
import { Vector2, Vector3, Quaternion } from "babylonjs/Maths/math.vector";
import { Color3, Color4 } from "babylonjs/Maths/math.color";
import { Size } from "babylonjs/Maths/math.size";
import { EasingFunction } from "babylonjs/Animations/easing";
import { IAnimationKey } from "babylonjs/Animations/animationKey";
import { IKeyframeSvgPoint } from "./keyframeSvgPoint";
import { SvgDraggableArea } from "./svgDraggableArea";
import { Timeline } from "./timeline";
import { Notification } from "./notification";
import { GraphActionsBar } from "./graphActionsBar";
import { Scene } from "babylonjs/scene";
import { IAnimatable } from "babylonjs/Animations/animatable.interface";
import { Animatable } from "babylonjs/Animations/animatable";
import { TargetedAnimation } from "babylonjs/Animations/animationGroup";
import { EditorControls } from "./editorControls";
import { SelectedCoordinate } from "./animationListTree";
import { LockObject } from "../lockObject";
import { GlobalState } from "../../../../globalState";
import { Nullable } from "babylonjs/types";
import { Observer } from "babylonjs/Misc/observable";
import { ScaleLabel } from "./scale-label";

require("./curveEditor.scss");

interface IAnimationCurveEditorComponentProps {
    close: (event: any) => void;
    playOrPause?: () => void;
    scene: Scene;
    entity: IAnimatable | TargetedAnimation;
    lockObject: LockObject;
    globalState: GlobalState;
}

interface ICanvasAxis {
    value: number;
    label: number;
}

export enum CurveScale {
    float,
    radians,
    degrees,
    integers,
    default,
}

export interface IActionableKeyFrame {
    frame?: number | string;
    value?: any;
}

interface ICurveData {
    pathData: string;
    pathLength: number;
    domCurve: React.RefObject<SVGPathElement>;
    color: string;
    id: string;
}

export class AnimationCurveEditorComponent extends React.Component<
    IAnimationCurveEditorComponentProps,
    {
        isOpen: boolean;
        selected: Animation | null;
        svgKeyframes: IKeyframeSvgPoint[] | undefined;
        currentFrame: number;
        currentValue: number;
        frameAxisLength: ICanvasAxis[];
        valueAxisLength: ICanvasAxis[];
        isFlatTangentMode: boolean;
        isTangentMode: boolean;
        isBrokenMode: boolean;
        lerpMode: boolean;
        scale: number;
        playheadOffset: number;
        notification: string;
        currentPoint: SVGPoint | undefined;
        playheadPos: number;
        isPlaying: boolean;
        selectedPathData: ICurveData[] | undefined;
        selectedCoordinate: number;
        animationLimit: number;
        fps: number;
        isLooping: boolean;
        panningY: number;
        panningX: number;
        repositionCanvas: boolean;
        actionableKeyframe: IActionableKeyFrame;
        valueScale: CurveScale;
        canvasLength: number;
    }
> {
    private _snippetUrl = "https://snippet.babylonjs.com";
    // Height scale *Review this functionaliy
    private _heightScale: number = 100;
    private _scaleFactor: number = 2;
    private _currentScale: number = 10;
    // Canvas Length *Review this functionality
    readonly _entityName: string;
    //private _canvasLength: number;
    private _svgKeyframes: IKeyframeSvgPoint[] = [];
    private _isPlaying: boolean = false;
    private _graphCanvas: React.RefObject<HTMLDivElement>;
    private _editor: React.RefObject<HTMLDivElement>;

    //private _selectedCurve: React.RefObject<SVGPathElement>;
    private _svgCanvas: React.RefObject<SvgDraggableArea>;
    private _isTargetedAnimation: boolean;

    private _pixelFrameUnit: number;

    private _onBeforeRenderObserver: Nullable<Observer<Scene>>;
    private _mainAnimatable: Nullable<Animatable>;
    constructor(props: IAnimationCurveEditorComponentProps) {
        super(props);
        this._entityName = (this.props.entity as any).id;

        this._editor = React.createRef();
        this._graphCanvas = React.createRef();
        this._svgCanvas = React.createRef();

        this._pixelFrameUnit = 10;

        let initialSelection;
        let initialPathData;
        let initialLerpMode;
        if (this.props.entity instanceof TargetedAnimation) {
            this._isTargetedAnimation = true;
            initialSelection = this.props.entity.animation;
            initialLerpMode = initialSelection !== undefined ? this.analizeAnimationForLerp(initialSelection) : false;
            initialPathData = initialSelection !== undefined ? this.getPathData(initialSelection) : undefined;
        } else {
            this._isTargetedAnimation = false;

            let hasAnimations = this.props.entity.animations !== undefined || this.props.entity.animations !== null ? this.props.entity.animations : false;
            initialSelection = hasAnimations !== false ? hasAnimations && hasAnimations[0] : null;

            initialLerpMode = initialSelection !== undefined ? this.analizeAnimationForLerp(this.props.entity.animations && initialSelection) : false;
            initialPathData = initialSelection && this.getPathData(initialSelection);
            initialPathData = initialPathData === null || initialPathData === undefined ? undefined : initialPathData;
        }

        const _canvasLength = 240;

        this.stopAnimation();

        // will update this until we have a top scroll/zoom feature
        let valueInd = [2, 1.8, 1.6, 1.4, 1.2, 1, 0.8, 0.6, 0.4, 0.2, 0];
        this.state = {
            selected: initialSelection,
            isOpen: true,
            svgKeyframes: this._svgKeyframes,
            currentFrame: 0,
            currentValue: 1,
            isFlatTangentMode: false,
            isTangentMode: false,
            isBrokenMode: false,
            lerpMode: initialLerpMode,
            playheadOffset: this._graphCanvas.current ? this._graphCanvas.current.children[0].clientWidth / (_canvasLength * 10) : 0,
            frameAxisLength: this.setFrameAxis(_canvasLength),
            valueAxisLength: new Array(10).fill(0).map((s, i) => {
                return { value: i * 10, label: valueInd[i] };
            }),
            notification: "",
            currentPoint: undefined,
            scale: 1,
            playheadPos: 0,
            isPlaying: false,
            selectedPathData: initialPathData,
            selectedCoordinate: 0,
            animationLimit: _canvasLength / 2,
            canvasLength: _canvasLength,
            fps: 60,
            isLooping: true,
            panningY: 0,
            panningX: 0,
            repositionCanvas: false,
            actionableKeyframe: { frame: undefined, value: undefined },
            valueScale: CurveScale.default,
        };
    }

    componentDidMount() {
        this.state.selected && this.selectAnimation(this.state.selected);
    }

    componentDidUpdate(prevProps: IAnimationCurveEditorComponentProps, prevState: any) {
        if (prevState.currentFrame !== this.state.currentFrame) {
            this.onCurrentFrameChangeChangeScene(this.state.currentFrame);
        }
    }

    onCurrentFrameChangeChangeScene(value: number) {
        if (!this._mainAnimatable) {
            return;
        }
        this._mainAnimatable.goToFrame(value);
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
        let scaleX = 1;
        if (Math.sign(e.deltaY) === -1) {
            scaleX = this.state.scale; //- 0.01; //+ 0.01;
        }
        this.setState({ scale: scaleX });
    }

    setFrameAxis(currentLength: number) {
        let halfNegative = new Array(currentLength).fill(0).map((s, i) => {
            return { value: -i * 10, label: -i };
        });

        let halfPositive = new Array(currentLength).fill(0).map((s, i) => {
            return { value: i * 10, label: i };
        });

        return [...halfNegative, ...halfPositive];
    }

    setValueLines(type: CurveScale) {
        switch (type) {
            case CurveScale.default:
                this._heightScale = 100;
                this._scaleFactor = 2;
                break;
            case CurveScale.float:
                this._scaleFactor = 2.5;
                this._heightScale = 120;
                break;
            case CurveScale.degrees:
                this._scaleFactor = 50;
                this._heightScale = 200;
                break;
            case CurveScale.integers:
                this._scaleFactor = 320;
                break;
            case CurveScale.radians:
                this._scaleFactor = 0.8;
                break;
        }

        const lineV = this._heightScale / 10;

        const initialValues = new Array(this._currentScale).fill(0).map((_, i) => {
            return {
                value: i * lineV,
                label: (this._scaleFactor * ((this._currentScale - i) / this._currentScale)).toFixed(2),
            };
        });

        initialValues.shift();

        const valueHeight = Math.abs(Math.round(this.state.panningY / this._currentScale));
        const sign = Math.sign(this.state.panningY);

        const pannedValues = new Array(valueHeight).fill(0).map((s, i) => {
            return sign === -1
                ? {
                      value: -i * lineV,
                      label: (i + this._currentScale) / (this._currentScale / this._scaleFactor),
                  }
                : {
                      value: (i + lineV) * this._currentScale,
                      label: (i * -1) / (this._currentScale / this._scaleFactor),
                  };
        });

        return [...initialValues, ...pannedValues];
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
            label = (100 - i * 2) * 0.01 + 1;
        }
        return label;
    }

    resetPlayheadOffset() {
        if (this._graphCanvas && this._graphCanvas.current) {
            this.setState({
                playheadOffset: this._graphCanvas.current.children[0].clientWidth / (this.state.canvasLength * 10 * this.state.scale),
            });
        }
    }

    encodeCurveId(animationName: string, coordinate: number) {
        return animationName + "_" + coordinate;
    }

    decodeCurveId(id: string) {
        const order = parseInt(id.split("_")[3]);
        const coordinate = parseInt(id.split("_")[2]);
        return { order, coordinate };
    }

    getKeyframeValueFromAnimation(id: string) {
        const animation = this.state.selected as Animation;
        const { order, coordinate } = this.decodeCurveId(id);
        const keys = [...animation.getKeys()];

        const key = keys.find((_, i) => i === order);

        if (key) {
            const valueAsArray = this.getValueAsArray(animation.dataType, key.value);
            return { frame: key?.frame, value: valueAsArray[coordinate] };
        } else {
            return undefined;
        }
    }

    /**
     * Keyframe Manipulation
     * This section handles events from SvgDraggableArea.
     */
    selectKeyframe(id: string, multiselect: boolean) {
        const frameValue = this.getKeyframeValueFromAnimation(id);
        const selectedKeyFrame = this.state.svgKeyframes?.find((kf) => kf.id === id)?.selected;
        if (!multiselect) {
            this.deselectKeyframes();
        }

        const updatedKeyframes = this.state.svgKeyframes?.map((kf) => {
            if (kf.id === id) {
                kf.selected = !selectedKeyFrame;
            }
            return kf;
        });
        this.setState({
            svgKeyframes: updatedKeyframes,
            actionableKeyframe: frameValue ?? this.state.actionableKeyframe,
        });
    }

    resetActionableKeyframe() {
        this.setState({
            actionableKeyframe: { frame: undefined, value: undefined },
        });
    }

    selectedControlPoint(type: string, id: string) {
        let updatedKeyframes = this.state.svgKeyframes?.map((kf) => {
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

    deselectKeyframes() {
        let updatedKeyframes = this.state.svgKeyframes?.map((kf) => {
            kf.isLeftActive = false;
            kf.isRightActive = false;
            kf.selected = false;
            return kf;
        });
        this.setState({
            svgKeyframes: updatedKeyframes,
            actionableKeyframe: { frame: undefined, value: undefined },
        });
    }

    updateValuePerCoordinate(dataType: number, value: number | Vector2 | Vector3 | Color3 | Color4 | Size | Quaternion, newValue: number, coordinate?: number) {
        if (dataType === Animation.ANIMATIONTYPE_FLOAT) {
            value = newValue;
        }

        if (dataType === Animation.ANIMATIONTYPE_VECTOR2) {
            switch (coordinate) {
                case SelectedCoordinate.x:
                    (value as Vector2).x = newValue;
                    break;
                case SelectedCoordinate.y:
                    (value as Vector2).y = newValue;
                    break;
            }
        }

        if (dataType === Animation.ANIMATIONTYPE_VECTOR3) {
            switch (coordinate) {
                case SelectedCoordinate.x:
                    (value as Vector3).x = newValue;
                    break;
                case SelectedCoordinate.y:
                    (value as Vector3).y = newValue;
                    break;
                case SelectedCoordinate.z:
                    (value as Vector3).z = newValue;
                    break;
            }
        }

        if (dataType === Animation.ANIMATIONTYPE_QUATERNION) {
            switch (coordinate) {
                case SelectedCoordinate.x:
                    (value as Quaternion).x = newValue;
                    break;
                case SelectedCoordinate.y:
                    (value as Quaternion).y = newValue;
                    break;
                case SelectedCoordinate.z:
                    (value as Quaternion).z = newValue;
                    break;
                case SelectedCoordinate.w:
                    (value as Quaternion).w = newValue;
                    break;
            }
        }

        if (dataType === Animation.ANIMATIONTYPE_COLOR3) {
            switch (coordinate) {
                case SelectedCoordinate.r:
                    (value as Color3).r = newValue;
                    break;
                case SelectedCoordinate.g:
                    (value as Color3).g = newValue;
                    break;
                case SelectedCoordinate.b:
                    (value as Color3).b = newValue;
                    break;
            }
        }

        if (dataType === Animation.ANIMATIONTYPE_COLOR4) {
            switch (coordinate) {
                case SelectedCoordinate.r:
                    (value as Color4).r = newValue;
                    break;
                case SelectedCoordinate.g:
                    (value as Color4).g = newValue;
                    break;
                case SelectedCoordinate.b:
                    (value as Color4).b = newValue;
                    break;
                case SelectedCoordinate.a:
                    (value as Color4).a = newValue;
                    break;
            }
        }

        if (dataType === Animation.ANIMATIONTYPE_SIZE) {
            switch (coordinate) {
                case SelectedCoordinate.width:
                    (value as Size).width = newValue;
                    break;
                case SelectedCoordinate.g:
                    (value as Size).height = newValue;
                    break;
            }
        }

        return value;
    }

    renderPoints(updatedSvgKeyFrame: IKeyframeSvgPoint, id: string) {
        let animation = this.state.selected as Animation;

        const { order: index, coordinate } = this.decodeCurveId(id);

        let keys = [...animation.getKeys()];

        let newFrame = 0;
        if (updatedSvgKeyFrame.keyframePoint.x !== 0) {
            if (updatedSvgKeyFrame.keyframePoint.x > 0 && updatedSvgKeyFrame.keyframePoint.x < 1) {
                newFrame = 1;
            } else {
                newFrame = Math.round(updatedSvgKeyFrame.keyframePoint.x / this._pixelFrameUnit);
            }
        }

        if (newFrame > keys[index].frame) {
            if (index === keys.length - 1) {
                keys[index].frame = newFrame;
            } else {
                const nextKf = keys[index + 1];
                if (nextKf) {
                    if (nextKf.frame <= newFrame) {
                        keys[index].frame = keys[index].frame;
                    } else {
                        keys[index].frame = newFrame;
                    }
                }
            }
        }

        if (newFrame < keys[index].frame) {
            if (index === 0) {
                keys[index].frame = newFrame;
            } else {
                const prevKf = keys[index - 1];
                if (prevKf) {
                    if (prevKf.frame >= newFrame) {
                        keys[index].frame = keys[index].frame;
                    } else {
                        keys[index].frame = newFrame;
                    }
                }
            }
        }

        let updatedValue = ((this._heightScale - updatedSvgKeyFrame.keyframePoint.y) / this._heightScale) * this._scaleFactor;

        const updatedValueInCoordinate = this.updateValuePerCoordinate(animation.dataType, keys[index].value, updatedValue, coordinate);

        keys[index].value = updatedValueInCoordinate;

        this.updateLeftControlPoint(updatedSvgKeyFrame, keys[index], animation.dataType, coordinate);
        this.updateRightControlPoint(updatedSvgKeyFrame, keys[index], animation.dataType, coordinate);

        animation.setKeys(keys);

        this.setState({
            actionableKeyframe: { frame: newFrame, value: updatedValueInCoordinate },
        });

        this.selectAnimation(animation, coordinate);
    }

    updateLeftControlPoint(updatedSvgKeyFrame: IKeyframeSvgPoint, key: IAnimationKey, dataType: number, coordinate: number) {
        if (updatedSvgKeyFrame.isLeftActive) {
            if (updatedSvgKeyFrame.leftControlPoint !== null) {
                // Rotate
                let newValue = ((this._heightScale - updatedSvgKeyFrame.leftControlPoint.y) / this._heightScale) * 2;

                let keyframeValue = ((this._heightScale - updatedSvgKeyFrame.keyframePoint.y) / this._heightScale) * 2;

                let updatedValue = keyframeValue - newValue;

                key.inTangent = this.updateValuePerCoordinate(dataType, key.inTangent, updatedValue, coordinate);

                if (!this.state.isBrokenMode) {
                    // Right control point if exists
                    if (updatedSvgKeyFrame.rightControlPoint !== null) {
                        // Sets opposite value
                        key.outTangent = key.inTangent * -1;
                    }
                }
            }
        }
    }

    updateRightControlPoint(updatedSvgKeyFrame: IKeyframeSvgPoint, key: IAnimationKey, dataType: number, coordinate: number) {
        if (updatedSvgKeyFrame.isRightActive) {
            if (updatedSvgKeyFrame.rightControlPoint !== null) {
                // Rotate
                let newValue = ((this._heightScale - updatedSvgKeyFrame.rightControlPoint.y) / this._heightScale) * 2;

                let keyframeValue = ((this._heightScale - updatedSvgKeyFrame.keyframePoint.y) / this._heightScale) * 2;

                let updatedValue = keyframeValue - newValue;

                key.outTangent = this.updateValuePerCoordinate(dataType, key.outTangent, updatedValue, coordinate);

                if (!this.state.isBrokenMode) {
                    if (updatedSvgKeyFrame.leftControlPoint !== null) {
                        // Sets opposite value
                        key.inTangent = key.outTangent * -1;
                    }
                }
            }
        }
    }

    handleFrameChange(event: React.ChangeEvent<HTMLInputElement>) {
        event.preventDefault();

        let frame;
        if (event.target.value === "") {
            frame = "";
        } else {
            frame = parseInt(event.target.value);
        }

        this.setState({
            actionableKeyframe: {
                frame: frame,
                value: this.state.actionableKeyframe.value,
            },
        });
    }

    handleValueChange(event: React.ChangeEvent<HTMLInputElement>) {
        event.preventDefault();

        let value;

        if (event.target.value !== undefined) {
            if (event.target.value !== "") {
                value = parseFloat(event.target.value);
            } else {
                value = "";
            }

            this.setState({
                actionableKeyframe: {
                    frame: this.state.actionableKeyframe.frame,
                    value: value,
                },
            });
        }
    }

    setKeyframeValue() {
        if (this.state.actionableKeyframe.frame !== "" && this.state.actionableKeyframe.frame !== undefined && this.state.actionableKeyframe.value !== "" && this.state.actionableKeyframe.value !== undefined) {
            if (this.state.selected !== null) {
                let currentSelected = this.state.svgKeyframes?.find((kf) => kf.selected);
                if (currentSelected) {
                    let { order, coordinate } = this.decodeCurveId(currentSelected.id);
                    let animation = this.state.selected;
                    let keys = animation.getKeys();

                    let isKeyframe = keys.find((_, i) => i === order);
                    if (isKeyframe) {
                        let updatedKeys = keys.map((k, i) => {
                            if (i === order) {
                                k.frame = this.state.actionableKeyframe.frame as number;

                                const currentValue = this.getValueAsArray(animation.dataType, k.value);
                                currentValue[coordinate] = this.state.actionableKeyframe.value;
                                k.value = currentValue.length === 1 ? currentValue[0] : currentValue;
                            }
                            return k;
                        });
                        this.state.selected.setKeys(updatedKeys);
                        this.selectAnimation(animation);
                    }
                }
            }
        }
    }

    setFlatTangent() {
        const keyframes = this.state.svgKeyframes?.filter((kf) => kf.selected).map((k) => this.decodeCurveId(k.id));

        if (this.state.selected !== null) {
            let currentAnimation = this.state.selected;
            const keys = currentAnimation.getKeys();

            keyframes?.forEach((k) => {
                const keyframe = keys[k.order];
                keyframe.inTangent = this.returnZero(currentAnimation.dataType);
                keyframe.outTangent = this.returnZero(currentAnimation.dataType);
            });

            currentAnimation.setKeys(keys);

            this.selectAnimation(currentAnimation, this.state.selectedCoordinate);
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

            let keys = currentAnimation.getKeys();
            let x = this.state.currentFrame;

            let existValue = keys.find((k) => k.frame === x);

            if (existValue === undefined) {
                let y = this.state.actionableKeyframe.value ?? 1;
                // check if value exists...
                let arrayValue: any = [];
                let emptyValue = this.returnZero(currentAnimation.dataType);

                if (emptyValue) {
                    arrayValue = this.getValueAsArray(currentAnimation.dataType, emptyValue);
                }

                // calculate point between prevkeyframe and nextkeyframe.
                const previousKFs = keys.filter((kf) => kf.frame < x);
                const nextKFs = keys.filter((kf) => kf.frame > x);
                const prev = previousKFs.slice(-1)[0];
                const next = nextKFs[0];

                if (prev === undefined && next) {
                    y = next.value;
                }

                if (prev && next === undefined) {
                    y = prev.value;
                }

                if (prev && next) {
                    const value1 = new Vector2(prev.frame, prev.value);
                    const tangent1 = new Vector2(prev.outTangent, prev.outTangent);
                    const value2 = new Vector2(next.frame, next.value);
                    const tangent2 = new Vector2(next.inTangent, next.inTangent);

                    const amount = (x - prev.frame) / (next.frame - prev.frame);
                    const newV = Vector2.Hermite(value1, tangent1, value2, tangent2, amount);
                    y = newV.y;
                }

                arrayValue[this.state.selectedCoordinate] = y;

                let actualValue = this.setValueAsType(currentAnimation.dataType, arrayValue);

                keys.push({
                    frame: x,
                    value: actualValue,
                    inTangent: emptyValue,
                    outTangent: emptyValue,
                });
                keys.sort((a, b) => a.frame - b.frame);

                currentAnimation.setKeys(keys);

                this.selectAnimation(currentAnimation, this.state.selectedCoordinate);
            }
        }
    }

    removeKeyframeClick() {
        if (this.state.selected !== null) {
            let currentAnimation = this.state.selected;

            if (currentAnimation.dataType === Animation.ANIMATIONTYPE_FLOAT) {
                let keys = currentAnimation.getKeys();
                let x = this.state.currentFrame;
                let filteredKeys = keys.filter((kf) => kf.frame !== x);

                currentAnimation.setKeys(filteredKeys);

                this.selectAnimation(currentAnimation, this.state.selectedCoordinate);
            }
        }
    }

    removeKeyframes(points: IKeyframeSvgPoint[]) {
        if (this.state.selected !== null) {
            let currentAnimation = this.state.selected;

            const indexesToRemove = points.map((p) => {
                return {
                    index: parseInt(p.id.split("_")[3]),
                    coordinate: parseInt(p.id.split("_")[2]),
                };
            });

            if (currentAnimation.dataType === Animation.ANIMATIONTYPE_FLOAT) {
                let keys = currentAnimation.getKeys();

                let filteredKeys = keys.filter((_, i) => {
                    return !indexesToRemove.find((x) => x.index === i);
                });
                currentAnimation.setKeys(filteredKeys);
                this.deselectKeyframes();

                this.selectAnimation(currentAnimation, this.state.selectedCoordinate);
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
            var middle = height / 2;

            var keyValue;

            if (cursorpt.y < middle) {
                keyValue = 1 + (100 / cursorpt.y) * 0.1;
            }

            if (cursorpt.y > middle) {
                keyValue = 1 - (100 / cursorpt.y) * 0.1;
            }

            keys.push({ frame: cursorpt.x, value: keyValue });

            currentAnimation.setKeys(keys);

            this.selectAnimation(currentAnimation);
        }
    }

    /**
     * Curve Rendering Functions
     * This section handles how to render curves.
     */
    setKeyframePointLinear(point: Vector2, index: number) {
        // here set the ID to a unique id
        let svgKeyframe = {
            keyframePoint: point,
            rightControlPoint: null,
            leftControlPoint: null,
            id: index.toString(),
            selected: false,
            isLeftActive: false,
            isRightActive: false,
        };
        this._svgKeyframes.push(svgKeyframe);
    }

    flatTangents(keyframes: IAnimationKey[], dataType: number) {
        // Checks if Flat Tangent is active (tangents are set to zero)
        let flattened;
        if (this.state && this.state.isFlatTangentMode) {
            flattened = keyframes.map((kf) => {
                if (kf.inTangent !== undefined) {
                    kf.inTangent = this.returnZero(dataType);
                }

                if (kf.outTangent !== undefined) {
                    kf.outTangent = this.returnZero(dataType);
                }
                return kf;
            });
        } else {
            flattened = keyframes;
        }
        this.setState({ isFlatTangentMode: false });
        return flattened;
    }

    returnZero(dataType: number) {
        switch (dataType) {
            case Animation.ANIMATIONTYPE_FLOAT:
                return 0;
            case Animation.ANIMATIONTYPE_VECTOR3:
                return Vector3.Zero();
            case Animation.ANIMATIONTYPE_VECTOR2:
                return Vector2.Zero();
            case Animation.ANIMATIONTYPE_QUATERNION:
                return Quaternion.Zero();
            case Animation.ANIMATIONTYPE_COLOR3:
                return new Color3(0, 0, 0);
            case Animation.ANIMATIONTYPE_COLOR4:
                return new Color4(0, 0, 0, 0);
            case Animation.ANIMATIONTYPE_SIZE:
                return new Size(0, 0);
            default:
                return 0;
        }
    }

    getValueAsArray(valueType: number, value: number | Vector2 | Vector3 | Color3 | Color4 | Size | Quaternion) {
        switch (valueType) {
            case Animation.ANIMATIONTYPE_FLOAT:
                return [value as number];
            case Animation.ANIMATIONTYPE_VECTOR3:
                return (value as Vector3).asArray();
            case Animation.ANIMATIONTYPE_VECTOR2:
                return (value as Vector2).asArray();
            case Animation.ANIMATIONTYPE_QUATERNION:
                return (value as Quaternion).asArray();
            case Animation.ANIMATIONTYPE_COLOR3:
                return (value as Color3).asArray();
            case Animation.ANIMATIONTYPE_COLOR4:
                return (value as Color4).asArray();
            case Animation.ANIMATIONTYPE_SIZE:
                return [(value as Size).width, (value as Size).height];
            default:
                return [];
        }
    }

    setValueAsType(valueType: number, arrayValue: number[]) {
        switch (valueType) {
            case Animation.ANIMATIONTYPE_FLOAT:
                return arrayValue[0];
            case Animation.ANIMATIONTYPE_VECTOR3:
                return new Vector3(arrayValue[0], arrayValue[1], arrayValue[2]);
            case Animation.ANIMATIONTYPE_VECTOR2:
                return new Vector2(arrayValue[0], arrayValue[1]);
            case Animation.ANIMATIONTYPE_QUATERNION:
                return new Quaternion(arrayValue[0], arrayValue[1], arrayValue[2], arrayValue[3]);
            case Animation.ANIMATIONTYPE_COLOR3:
                return new Color3(arrayValue[0], arrayValue[1], arrayValue[2]);
            case Animation.ANIMATIONTYPE_COLOR4:
                return new Color4(arrayValue[0], arrayValue[1], arrayValue[2], arrayValue[3]);
            case Animation.ANIMATIONTYPE_SIZE:
                return new Size(arrayValue[0], arrayValue[1]);
            default:
                return arrayValue[0];
        }
    }

    getPathData(animation: Animation | null) {
        if (animation === null) {
            return undefined;
        }

        var keyframes = animation.getKeys();

        if (keyframes === undefined || keyframes.length === 0) {
            return undefined;
        } else {
            const { easingMode, easingType, usesTangents, valueType, highestFrame, name, targetProperty } = this.getAnimationData(animation);

            keyframes = this.flatTangents(keyframes, valueType);
            const startKey = keyframes[0];
            let middle = this._heightScale / this._scaleFactor; //?
            let collection: ICurveData[] = [];
            const colors = ["red", "green", "blue", "white", "#7a4ece"];
            const startValue = this.getValueAsArray(valueType, startKey.value);

            for (var d = 0; d < startValue.length; d++) {
                const id = `${name}_${targetProperty}_${d}`;

                const curveColor = valueType === Animation.ANIMATIONTYPE_FLOAT ? colors[4] : colors[d];
                // START OF LINE/CURVE
                let data: string | undefined = `M${startKey.frame * this._pixelFrameUnit}, ${this._heightScale - startValue[d] * middle}`; //

                if (this.state) {
                    if (usesTangents) {
                        data = this.curvePathWithTangents(keyframes, data, middle, valueType, d, id);
                    } else {
                        if (easingType !== undefined && easingMode !== undefined) {
                            let easingFunction = animation.getEasingFunction();
                            data = this.curvePath(keyframes, data, middle, easingFunction as EasingFunction);
                        } else {
                            if (this.state !== undefined) {
                                let emptyTangents = keyframes.map((kf, i) => {
                                    if (i === 0) {
                                        kf.outTangent = this.returnZero(valueType);
                                    } else if (i === keyframes.length - 1) {
                                        kf.inTangent = this.returnZero(valueType);
                                    } else {
                                        kf.inTangent = this.returnZero(valueType);
                                        kf.outTangent = this.returnZero(valueType);
                                    }
                                    return kf;
                                });
                                data = this.curvePathWithTangents(emptyTangents, data, middle, valueType, d, id);
                            }
                        }
                    }
                }

                collection.push({
                    pathData: data,
                    pathLength: highestFrame,
                    domCurve: React.createRef(),
                    color: curveColor,
                    id: id,
                });
            }

            return collection;
        }
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
        //let serialized = animation.serialize();
        let usesTangents = animation.getKeys().find((kf) => kf.hasOwnProperty("inTangent") || kf.hasOwnProperty("outTangent")) !== undefined ? true : false;
        let valueType = animation.dataType;
        // easing properties
        let easingType, easingMode;
        let easingFunction: EasingFunction = animation.getEasingFunction() as EasingFunction;
        if (easingFunction === undefined) {
            easingType = undefined;
            easingMode = undefined;
        } else {
            easingType = easingFunction.constructor.name;
            easingMode = easingFunction.getEasingMode();
        }

        return {
            loopMode,
            name,
            blendingSpeed,
            targetPropertyPath,
            targetProperty,
            framesPerSecond,
            highestFrame,
            usesTangents,
            easingType,
            easingMode,
            valueType,
        };
    }

    curvePathWithTangents(keyframes: IAnimationKey[], data: string, middle: number, type: number, coordinate: number, animationName: string) {
        keyframes.forEach((key, i) => {
            // Create a unique id for curve
            const curveId = this.encodeCurveId(animationName, i);

            // identify type of value and split...
            const keyframe_valueAsArray = this.getValueAsArray(type, key.value)[coordinate];

            let svgKeyframe;
            let outTangent;
            let inTangent;
            let defaultWeight = 5;

            let defaultTangent: number | null = null;
            if (i !== 0 || i !== keyframes.length - 1) {
                defaultTangent = 0;
            }

            var inT = key.inTangent === undefined ? defaultTangent : this.getValueAsArray(type, key.inTangent)[coordinate];
            var outT = key.outTangent === undefined ? defaultTangent : this.getValueAsArray(type, key.outTangent)[coordinate];

            let y = this._heightScale - keyframe_valueAsArray * middle;

            if (inT !== null) {
                let valueIn = y * inT + y;
                inTangent = new Vector2(key.frame * this._pixelFrameUnit - defaultWeight, valueIn);
            } else {
                inTangent = null;
            }

            if (outT !== null) {
                let valueOut = y * outT + y;
                outTangent = new Vector2(key.frame * this._pixelFrameUnit + defaultWeight, valueOut);
            } else {
                outTangent = null;
            }

            if (i === 0) {
                svgKeyframe = {
                    keyframePoint: new Vector2(key.frame * this._pixelFrameUnit, this._heightScale - keyframe_valueAsArray * middle),
                    rightControlPoint: outTangent,
                    leftControlPoint: null,
                    id: curveId,
                    selected: false,
                    isLeftActive: false,
                    isRightActive: false,
                };
                if (outTangent !== null) {
                    data += ` C${outTangent.x} ${outTangent.y} `;
                }
            } else {
                svgKeyframe = {
                    keyframePoint: new Vector2(key.frame * this._pixelFrameUnit, this._heightScale - keyframe_valueAsArray * middle),
                    rightControlPoint: outTangent,
                    leftControlPoint: inTangent,
                    id: curveId,
                    selected: false,
                    isLeftActive: false,
                    isRightActive: false,
                };

                if (outTangent !== null && inTangent !== null) {
                    data += ` ${inTangent.x} ${inTangent.y} ${svgKeyframe.keyframePoint.x} ${svgKeyframe.keyframePoint.y} C${outTangent.x} ${outTangent.y} `;
                } else if (inTangent !== null) {
                    data += ` ${inTangent.x} ${inTangent.y} ${svgKeyframe.keyframePoint.x} ${svgKeyframe.keyframePoint.y} `;
                }
            }

            if (this.state) {
                let prev = this.state.svgKeyframes?.find((kf) => kf.id === curveId);
                if (prev) {
                    svgKeyframe.isLeftActive = prev?.isLeftActive;
                    svgKeyframe.isRightActive = prev?.isRightActive;
                    svgKeyframe.selected = prev?.selected;
                }
            }

            this._svgKeyframes.push(svgKeyframe);
        }, this);

        return data;
    }

    curvePath(keyframes: IAnimationKey[], data: string, middle: number, easingFunction: EasingFunction) {
        // This will get 1/4 and 3/4 of points in eased curve
        const u = 0.25;
        const v = 0.75;

        keyframes.forEach((key, i) => {
            // identify type of value and split...

            // Gets previous initial point of curve segment
            var pointA = new Vector2(0, 0);
            if (i === 0) {
                pointA.x = key.frame;
                pointA.y = this._heightScale - key.value * middle;

                this.setKeyframePoint([pointA], i, keyframes.length);
            } else {
                pointA.x = keyframes[i - 1].frame;
                pointA.y = this._heightScale - keyframes[i - 1].value * middle;

                // Gets the end point of this curve segment
                var pointB = new Vector2(key.frame, this._heightScale - key.value * middle);

                // Get easing value of percentage to get the bezier control points below
                let du = easingFunction.easeInCore(u); // What to do here, when user edits the curve? Option 1: Modify the curve with the new control points as BezierEaseCurve(x,y,z,w)
                let dv = easingFunction.easeInCore(v); // Option 2: Create a easeInCore function and adapt it with the new control points values... needs more revision.

                // Direction of curve up/down
                let yInt25 = 0;
                if (pointB.y > pointA.y) {
                    // if pointB.y > pointA.y = goes down
                    yInt25 = (pointB.y - pointA.y) * du + pointA.y;
                } else if (pointB.y < pointA.y) {
                    // if pointB.y < pointA.y = goes up
                    yInt25 = pointA.y - (pointA.y - pointB.y) * du;
                }

                let yInt75 = 0;
                if (pointB.y > pointA.y) {
                    yInt75 = (pointB.y - pointA.y) * dv + pointA.y;
                } else if (pointB.y < pointA.y) {
                    yInt75 = pointA.y - (pointA.y - pointB.y) * dv;
                }

                // Intermediate points in curve
                let intermediatePoint25 = new Vector2((pointB.x - pointA.x) * u + pointA.x, yInt25);
                let intermediatePoint75 = new Vector2((pointB.x - pointA.x) * v + pointA.x, yInt75);

                // Gets the four control points of bezier curve
                let controlPoints = this.interpolateControlPoints(pointA, intermediatePoint25, u, intermediatePoint75, v, pointB);

                if (controlPoints !== undefined) {
                    this.setKeyframePoint(controlPoints, i, keyframes.length);
                    data += ` C${controlPoints[1].x} ${controlPoints[1].y} ${controlPoints[2].x} ${controlPoints[2].y} ${controlPoints[3].x} ${controlPoints[3].y}`;
                }
            }
        });

        return data;
    }

    setKeyframePoint(controlPoints: Vector2[], index: number, keyframesCount: number) {
        let svgKeyframe;
        if (index === 0) {
            svgKeyframe = {
                keyframePoint: controlPoints[0],
                rightControlPoint: null,
                leftControlPoint: null,
                id: index.toString(),
                selected: false,
                isLeftActive: false,
                isRightActive: false,
            };
        } else {
            this._svgKeyframes[index - 1].rightControlPoint = controlPoints[1];
            svgKeyframe = {
                keyframePoint: controlPoints[3],
                rightControlPoint: null,
                leftControlPoint: controlPoints[2],
                id: index.toString(),
                selected: false,
                isLeftActive: false,
                isRightActive: false,
            };
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

        if (u <= 0.0 || u >= 1.0 || v <= 0.0 || v >= 1.0 || u >= v) {
            return undefined;
        }

        a = 3 * (1 - u) * (1 - u) * u;
        b = 3 * (1 - u) * u * u;
        c = 3 * (1 - v) * (1 - v) * v;
        d = 3 * (1 - v) * v * v;
        det = a * d - b * c;

        if (det == 0.0) return undefined;

        q1.x = p1.x - ((1 - u) * (1 - u) * (1 - u) * p0.x + u * u * u * p3.x);
        q1.y = p1.y - ((1 - u) * (1 - u) * (1 - u) * p0.y + u * u * u * p3.y);

        q2.x = p2.x - ((1 - v) * (1 - v) * (1 - v) * p0.x + v * v * v * p3.x);
        q2.y = p2.y - ((1 - v) * (1 - v) * (1 - v) * p0.y + v * v * v * p3.y);

        controlB.x = (d * q1.x - b * q2.x) / det;
        controlB.y = (d * q1.y - b * q2.y) / det;

        controlC.x = (-c * q1.x + a * q2.x) / det;
        controlC.y = (-c * q1.y + a * q2.y) / det;

        return [controlA, controlB, controlC, controlD];
    }

    deselectAnimation() {
        this.setState({
            selected: null,
            svgKeyframes: [],
            selectedPathData: [],
            selectedCoordinate: 0,
        });
    }

    /**
     * Core functions
     * This section handles main Curve Editor Functions.
     */
    selectAnimation(animation: Animation, coordinate?: SelectedCoordinate) {
        this._svgKeyframes = [];
        let updatedPath;
        let filteredSvgKeys;
        let selectedCurve = 0;

        if (coordinate === undefined) {
            this.stopAnimation();
            updatedPath = this.getPathData(animation);
        } else {
            let curves = this.getPathData(animation);

            updatedPath = [];

            filteredSvgKeys = this._svgKeyframes?.filter((curve) => {
                let id = parseInt(curve.id.split("_")[2]);
                if (id === coordinate) {
                    return true;
                } else {
                    return false;
                }
            });

            curves?.map((curve) => {
                let id = parseInt(curve.id.split("_")[2]);
                if (id === coordinate) {
                    updatedPath.push(curve);
                }
            });

            selectedCurve = coordinate;
        }

        // check for empty svgKeyframes, lastframe, selected
        this.setState(
            {
                selected: animation,
                svgKeyframes: coordinate !== undefined ? filteredSvgKeys : this._svgKeyframes,
                selectedPathData: updatedPath,
                selectedCoordinate: selectedCurve,
                fps: animation.framePerSecond,
            },
            () => this.setMainAnimatable()
        );
    }

    setMainAnimatable() {
        if (this.state.selected) {
            let target = this.props.entity;
            if (this.props.entity instanceof TargetedAnimation) {
                target = this.props.entity.target;
            }

            this.props.scene.stopAllAnimations();

            if (this._mainAnimatable?.target !== target) {
                const keys = this.state.selected.getKeys();
                if (keys.length !== 0) {
                    const firstFrame = keys[0].frame;
                    const LastFrame = this.state.selected.getHighestFrame();
                    this._mainAnimatable = this.props.scene.beginAnimation(target, firstFrame, LastFrame, this.state.isLooping);
                    this._mainAnimatable.pause();
                }
            }
        }
    }

    isAnimationPlaying() {
        let target = this.props.entity;
        if (this.props.entity instanceof TargetedAnimation) {
            target = this.props.entity.target;
        }

        return this.props.scene.getAllAnimatablesByTarget(target).length > 0;
    }

    stopAnimation() {
        let target = this.props.entity;
        if (this.props.entity instanceof TargetedAnimation) {
            target = this.props.entity.target;
        }
        this._isPlaying = this.props.scene.getAllAnimatablesByTarget(target).length > 0;
        if (this._isPlaying) {
            this.props.playOrPause && this.props.playOrPause();
        }
    }

    setIsLooping() {
        this.setState({ isLooping: !this.state.isLooping, isPlaying: false }, () => this.stopAnimation());
    }

    setFramesPerSecond(fps: number) {
        this.setState({ fps: fps, isPlaying: false }, () => this.stopAnimation());
    }

    analizeAnimationForLerp(animation: Animation | null) {
        if (animation !== null) {
            const { easingMode, easingType, usesTangents } = this.getAnimationData(animation);
            if (easingType === undefined && easingMode === undefined && !usesTangents) {
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
        this.stopAnimation();
        if (this.state.selectedPathData) {
            let selectedCurve = this.state.selectedPathData[this.state.selectedCoordinate].domCurve.current;
            if (selectedCurve) {
                var curveLength = selectedCurve.getTotalLength();

                let frameValue = (frame * curveLength) / 100;
                let currentP = selectedCurve.getPointAtLength(frameValue);
                let middle = this._heightScale / 2;

                let offset = (currentP?.y * this._heightScale - this._heightScale ** 2 / 2) / middle / this._heightScale;

                let unit = Math.sign(offset);
                currentValue = unit === -1 ? Math.abs(offset + unit) : unit - offset;

                this.setState({
                    currentFrame: frame,
                    currentValue: currentValue,
                    currentPoint: currentP,
                    isPlaying: false,
                });
            }
        }
    }

    setCanvasPosition(frame: number) {
        this.setState({ panningX: (frame - 10) * 10, repositionCanvas: true });
    }

    setCurrentFrame(direction: number) {
        this.setState({
            currentFrame: this.state.currentFrame + direction,
        });
    }

    changeAnimationLimit(limit: number) {
        const doubleLimit = limit * 2;
        this.setState({
            animationLimit: limit,
            canvasLength: doubleLimit,
            frameAxisLength: this.setFrameAxis(doubleLimit),
        });
    }

    updateFrameInKeyFrame(frame: number, index: number) {
        if (this.state && this.state.selected) {
            let animation = this.state.selected;
            let keys = [...animation.getKeys()];

            keys[index].frame = frame;

            animation.setKeys(keys);

            this.selectAnimation(animation);
        }
    }

    playPause(direction: number) {
        this.registerObs();
        if (this.state.selected) {
            let target = this.props.entity;
            if (this.props.entity instanceof TargetedAnimation) {
                target = this.props.entity.target;
            }
            if (this.state.isPlaying && direction === 0) {
                this.props.scene.stopAnimation(target);
                this.setState({ isPlaying: false });
                this._isPlaying = false;
                this.forceUpdate();
            } else {
                if (this.state.isPlaying) {
                    this.props.scene.stopAnimation(target);
                }
                let keys = this.state.selected.getKeys();
                let firstFrame = keys[0].frame;
                let LastFrame = this.state.selected.getHighestFrame();
                if (direction === 1) {
                    this._mainAnimatable = this.props.scene.beginAnimation(target, firstFrame, LastFrame, this.state.isLooping);
                }
                if (direction === -1) {
                    this._mainAnimatable = this.props.scene.beginAnimation(target, LastFrame, firstFrame, this.state.isLooping);
                }

                this._isPlaying = true;
                this.setState({ isPlaying: true });
                this.forceUpdate();
            }
        }
    }

    moveFrameTo(e: React.MouseEvent<SVGRectElement, MouseEvent>) {
        this.stopAnimation();
        var svg = e.currentTarget as SVGRectElement;
        var CTM = svg.getScreenCTM();
        let position;
        if (CTM) {
            position = new Vector2((e.clientX - CTM.e) / CTM.a, (e.clientY - CTM.f) / CTM.d);
            let selectedFrame = Math.round(position.x / this._pixelFrameUnit);
            this.setState({ currentFrame: selectedFrame, isPlaying: false });
        }
    }

    registerObs() {
        this._onBeforeRenderObserver = this.props.scene.onBeforeRenderObservable.add(() => {
            if (!this._isPlaying || !this._mainAnimatable) {
                return;
            }
            this.setState({
                currentFrame: Math.round(this._mainAnimatable.masterFrame),
            });
        });
    }

    componentWillUnmount() {
        if (this._onBeforeRenderObserver) {
            this.props.scene.onBeforeRenderObservable.remove(this._onBeforeRenderObserver);
            this._onBeforeRenderObserver = null;
        }
    }

    isCurrentFrame(frame: number) {
        return this.state.currentFrame === frame;
    }

    render() {
        return (
            <div ref={this._editor} id="animation-curve-editor">
                <Notification message={this.state.notification} open={this.state.notification !== "" ? true : false} close={() => this.clearNotification()} />
                <GraphActionsBar
                    setKeyframeValue={() => this.setKeyframeValue()}
                    enabled={this.state.selected === null || this.state.selected === undefined ? false : true}
                    title={this._entityName}
                    close={this.props.close}
                    actionableKeyframe={this.state.actionableKeyframe}
                    handleFrameChange={(e) => this.handleFrameChange(e)}
                    handleValueChange={(e) => this.handleValueChange(e)}
                    addKeyframe={() => this.addKeyframeClick()}
                    removeKeyframe={() => this.removeKeyframeClick()}
                    brokenMode={this.state.isBrokenMode}
                    brokeTangents={() => this.setBrokenMode()}
                    lerpMode={this.state.lerpMode}
                    setLerpMode={() => this.setLerpMode()}
                    flatTangent={() => this.setFlatTangent()}
                />

                <div className="content">
                    <div className="row">
                        <EditorControls
                            deselectAnimation={() => this.deselectAnimation()}
                            selectAnimation={(animation: Animation, axis?: SelectedCoordinate) => this.selectAnimation(animation, axis)}
                            isTargetedAnimation={this._isTargetedAnimation}
                            entity={this.props.entity}
                            selected={this.state.selected}
                            lockObject={this.props.lockObject}
                            setNotificationMessage={(message: string) => {
                                this.setState({ notification: message });
                            }}
                            globalState={this.props.globalState}
                            snippetServer={this._snippetUrl}
                            fps={this.state.fps}
                            setFps={(fps: number) => this.setFramesPerSecond(fps)}
                            setIsLooping={() => this.setIsLooping()}
                        />

                        <div ref={this._graphCanvas} className="graph-chart" onWheel={(e) => this.zoom(e)}>
                            {this.state.svgKeyframes && (
                                <SvgDraggableArea
                                    ref={this._svgCanvas}
                                    selectKeyframe={(id: string, multiselect: boolean) => this.selectKeyframe(id, multiselect)}
                                    viewBoxScale={this.state.frameAxisLength.length}
                                    scale={this.state.scale}
                                    keyframeSvgPoints={this.state.svgKeyframes}
                                    removeSelectedKeyframes={(points: IKeyframeSvgPoint[]) => this.removeKeyframes(points)}
                                    selectedControlPoint={(type: string, id: string) => this.selectedControlPoint(type, id)}
                                    deselectKeyframes={() => this.deselectKeyframes()}
                                    updatePosition={(updatedSvgKeyFrame: IKeyframeSvgPoint, id: string) => this.renderPoints(updatedSvgKeyFrame, id)}
                                    panningY={(panningY: number) => {
                                        this.setState({ panningY: panningY });
                                    }}
                                    panningX={(panningX: number) => {
                                        this.setState({ panningX: panningX });
                                    }}
                                    setCurrentFrame={(direction: number) => this.setCurrentFrame(direction)}
                                    positionCanvas={this.state.panningX}
                                    repositionCanvas={this.state.repositionCanvas}
                                    canvasPositionEnded={() => this.setState({ repositionCanvas: false })}
                                    resetActionableKeyframe={() => this.resetActionableKeyframe()}
                                >
                                    {/* Multiple Curves  */}
                                    {this.state.selectedPathData?.map((curve, i) => (
                                        <path
                                            key={i}
                                            ref={curve.domCurve}
                                            pathLength={curve.pathLength}
                                            id="curve"
                                            d={curve.pathData}
                                            style={{
                                                stroke: curve.color,
                                                fill: "none",
                                                strokeWidth: "0.5",
                                            }}
                                        ></path>
                                    ))}

                                    {this.setValueLines(this.state.valueScale).map((line, i) => {
                                        return (
                                            <text
                                                key={`value_inline_${i}`}
                                                x={this.state.panningX - 5}
                                                y={line.value}
                                                dx="2"
                                                textAnchor="middle"
                                                dy="-1"
                                                style={{
                                                    fontSize: `${0.18 * this.state.scale}em`,
                                                    fontWeight: "bold",
                                                    textAlign: "center",
                                                }}
                                            >
                                                {line.label}
                                            </text>
                                        );
                                    })}

                                    {this.setValueLines(this.state.valueScale).map((line, i) => {
                                        return <line key={i} x1={-((this.state.frameAxisLength.length * 10) / 2)} y1={line.value} x2={this.state.frameAxisLength.length * 10} y2={line.value}></line>;
                                    })}

                                    <rect onClick={(e) => this.moveFrameTo(e)} x={-((this.state.frameAxisLength.length * 10) / 2)} y={91 + this.state.panningY + "%"} width={this.state.frameAxisLength.length * 10} height="9%" fill="#222" style={{ cursor: "pointer" }}></rect>

                                    {this.state.frameAxisLength.map((f, i) => (
                                        <svg key={i} x="0" y={96 + this.state.panningY + "%"} className="frame-contain">
                                            {f.label < 10 && f.label > -10 ? (
                                                <text x={f.value} y="-1.5px" dx="-0.5px" style={{ fontSize: `${0.17 * this.state.scale}em` }}>
                                                    {f.label}
                                                </text>
                                            ) : (
                                                <text x={f.value} y="-1.5px" dx="-1px" style={{ fontSize: `${0.17 * this.state.scale}em` }}>
                                                    {f.label}
                                                </text>
                                            )}

                                            <line x1={f.value} y1="0" x2={f.value} y2="5%"></line>

                                            {f.value % this.state.fps === 0 && f.value !== 0 ? <line x1={f.value} y1="-100%" x2={f.value} y2="5%"></line> : null}

                                            {this.state.selected && this.isCurrentFrame(f.label) ? (
                                                <svg>
                                                    <line
                                                        x1={f.value}
                                                        y1="0"
                                                        x2={f.value}
                                                        y2="-100%"
                                                        style={{
                                                            stroke: "white",
                                                            strokeWidth: 0.4,
                                                        }}
                                                    />
                                                    <svg x={f.value} y="-1">
                                                        <circle className="svg-playhead" cx="0" cy="0" r="2%" fill="white" />
                                                        <text
                                                            x="0"
                                                            y="1%"
                                                            textAnchor="middle"
                                                            style={{
                                                                fontSize: `${0.17 * this.state.scale}em`,
                                                                pointerEvents: "none",
                                                                fontWeight: 600,
                                                            }}
                                                        >
                                                            {f.label}
                                                        </text>
                                                    </svg>
                                                </svg>
                                            ) : null}
                                        </svg>
                                    ))}
                                </SvgDraggableArea>
                            )}
                            <ScaleLabel current={this.state.valueScale} />
                        </div>
                    </div>
                    <div className="row-bottom">
                        <Timeline
                            currentFrame={this.state.currentFrame}
                            playPause={(direction: number) => this.playPause(direction)}
                            isPlaying={this.state.isPlaying}
                            dragKeyframe={(frame: number, index: number) => this.updateFrameInKeyFrame(frame, index)}
                            onCurrentFrameChange={(frame: number) => this.changeCurrentFrame(frame)}
                            onAnimationLimitChange={(limit: number) => this.changeAnimationLimit(limit)}
                            animationLimit={this.state.animationLimit}
                            keyframes={this.state.selected && this.state.selected.getKeys()}
                            selected={this.state.selected && this.state.selected.getKeys()[0]}
                            fps={this.state.fps}
                            repositionCanvas={(frame: number) => this.setCanvasPosition(frame)}
                        ></Timeline>
                    </div>
                </div>
            </div>
        );
    }
}
