import * as React from "react";
import { GlobalState } from "../../../../../../globalState";
import { Context } from "../context";
import { Animation } from "babylonjs/Animations/animation";
import { Curve } from "./curve";
import { KeyPointComponent } from "./keyPoint";
import { CurveComponent } from "./curveComponent";
import { Nullable } from "babylonjs/types";
import { Observer } from "babylonjs/Misc/observable";
import { IAnimationKey } from "babylonjs/Animations/animationKey";
import { Quaternion, Vector2, Vector3 } from "babylonjs/Maths/math.vector";
import { Color3, Color4 } from "babylonjs/Maths/math.color";
import { Scalar } from "babylonjs/Maths/math.scalar";

interface IGraphComponentProps {
    globalState: GlobalState;
    context: Context;
}

interface IGraphComponentState {
}

export class GraphComponent extends React.Component<
IGraphComponentProps,
IGraphComponentState
> {
    private readonly _MinScale = 0.5;
    private readonly _MaxScale = 4;
    private readonly _GraphAbsoluteWidth = 788;
    private readonly _GraphAbsoluteHeight = 357;

    private _viewWidth = 788;
    private _viewCurveWidth = 788;
    private _viewHeight = 357;
    private _viewScale = 1;
    private _offsetX = 0;
    private _offsetY = 0;

    private _inSelectionMode: boolean;
    
    private _graphOffsetX = 30;

    private _minValue: number;
    private _maxValue: number;
    private _minFrame: number;
    private _maxFrame: number;
    private _svgHost: React.RefObject<SVGSVGElement>;
    private _svgHost2: React.RefObject<SVGSVGElement>;    
    private _selectionRectangle: React.RefObject<HTMLDivElement>;
    private _curves: Curve[];

    private _pointerIsDown: boolean;
    private _sourcePointerX: number;
    private _sourcePointerY: number;
    
    private _selectionStartX: number;
    private _selectionStartY: number;

    private _currentAnimation: Nullable<Animation>;
   
    private _onActiveAnimationChangedObserver: Nullable<Observer<void>>;

    constructor(props: IGraphComponentProps) {
        super(props);

        this.state = {};
        
        this._svgHost = React.createRef();
        this._svgHost2 = React.createRef();
        this._selectionRectangle = React.createRef();

        this._evaluateKeys();

        this.props.context.onHostWindowResized.add(() => {
            this._computeSizes();
        });

        this._onActiveAnimationChangedObserver = this.props.context.onActiveAnimationChanged.add(() => {
            if (this._currentAnimation === this.props.context.activeAnimation) {
                return;
            }

            this._currentAnimation = this.props.context.activeAnimation;
            this._evaluateKeys();
            this._computeSizes();
            this.forceUpdate();
        });

        this.props.context.onFrameRequired.add(() => {
            this._frame();
            this.forceUpdate();
        });

        this.props.context.onRangeUpdated.add(() => {
            this.forceUpdate();
        });

        // Delete keypoint
        this.props.context.onDeleteKeyActiveKeyPoints.add(() => { 
            if (!this._currentAnimation || !this.props.context.activeKeyPoints) {
                return;
            }

            let keys = this._currentAnimation.getKeys();
            let newKeys = keys.slice(0);
            let deletedFrame: Nullable<number> = null;            

            for (var keyPoint of this.props.context.activeKeyPoints) {
                // Cannot delete 0 and last
                if (keyPoint.props.keyId === 0 || keyPoint.props.keyId === keys.length - 1) {
                    continue;
                }

                let key = keys[keyPoint.props.keyId];

                let keyIndex = newKeys.indexOf(key);
                if (keyIndex > -1) {
                    newKeys.splice(keyIndex, 1);

                    if (deletedFrame === null) {
                        deletedFrame = key.frame;
                    }
                }
            }

            this.props.context.stop();
            this._currentAnimation.setKeys(newKeys);
            if (deletedFrame !== null) {
                this.props.context.moveToFrame(deletedFrame)
            }

            this.props.context.activeKeyPoints = [];
            this._currentAnimation = null;

            this.props.context.onActiveAnimationChanged.notifyObservers();
        });

        // New keypoint
        this.props.context.onNewKeyPointRequired.add(() => {
            if (!this._currentAnimation) {
                return;
            }

            let keys = this._currentAnimation.getKeys();

            const currentFrame = this.props.context.activeFrame;

            let indexToAdd = -1;
            for (var key of keys) {
                if (key.frame < currentFrame) {
                    indexToAdd++;
                } else {
                    break;
                }
            }

            const value = this._currentAnimation.evaluate(currentFrame);
            const leftKey = keys[indexToAdd];
            const rightKey = keys[indexToAdd + 1];
            
            let newKey: IAnimationKey = {
                frame: currentFrame,
                value: value
            }

            if (leftKey.outTangent !== undefined && rightKey.inTangent !== undefined) {
                let derivative: Nullable<any> = null;
                const invFrameDelta = 1.0 / (rightKey.frame - leftKey.frame);
                const cutTime = (currentFrame - leftKey.frame) * invFrameDelta;

                switch (this._currentAnimation.dataType) {
                    case Animation.ANIMATIONTYPE_FLOAT: {
                        derivative = Scalar.Hermite1stDerivative(leftKey.value * invFrameDelta, leftKey.outTangent, rightKey.value * invFrameDelta, rightKey.inTangent, cutTime);
                        break;
                    }
                    case Animation.ANIMATIONTYPE_VECTOR2: {
                        derivative = Vector2.Hermite1stDerivative(leftKey.value.scale(invFrameDelta), leftKey.outTangent, rightKey.value.scale(invFrameDelta), rightKey.inTangent, cutTime);
                        break;
                    }
                    case Animation.ANIMATIONTYPE_VECTOR3: {
                        derivative = Vector3.Hermite1stDerivative(leftKey.value.scale(invFrameDelta), leftKey.outTangent, rightKey.value.scale(invFrameDelta), rightKey.inTangent, cutTime);
                        break;
                    }
                    case Animation.ANIMATIONTYPE_QUATERNION:{
                        derivative = Quaternion.Hermite1stDerivative(leftKey.value.scale(invFrameDelta), leftKey.outTangent, rightKey.value.scale(invFrameDelta), rightKey.inTangent, cutTime);
                        break;
                    }
                    case Animation.ANIMATIONTYPE_COLOR3:
                        derivative = Color3.Hermite1stDerivative(leftKey.value.scale(invFrameDelta), leftKey.outTangent, rightKey.value.scale(invFrameDelta), rightKey.inTangent, cutTime);
                        break;
                    case Animation.ANIMATIONTYPE_COLOR4:
                        derivative = Color4.Hermite1stDerivative(leftKey.value.scale(invFrameDelta), leftKey.outTangent, rightKey.value.scale(invFrameDelta), rightKey.inTangent, cutTime);
                        break;
                }

                if (derivative !== null) {
                    newKey.inTangent = derivative;
                    newKey.outTangent = derivative.clone ? derivative.clone() : derivative;
                }
            }

            
            keys.splice(indexToAdd + 1, 0, newKey);

            this._currentAnimation.setKeys(keys);
            this._evaluateKeys(false, false);

            this.props.context.activeKeyPoints = [];            
            this.props.context.onActiveKeyPointChanged.notifyObservers();
            this.props.context.onActiveAnimationChanged.notifyObservers();        
            this.forceUpdate();    
        });
    }

    componentWillUnmount() {
        if (this._onActiveAnimationChangedObserver) {
            this.props.context.onActiveAnimationChanged.remove(this._onActiveAnimationChangedObserver);
        }
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

    private _setDefaultInTangent(keyId: number) {
        for (var curve of this._curves) {
            curve.storeDefaultInTangent(keyId);
        }
    }

    private _setDefaultOutTangent(keyId: number) {
        for (var curve of this._curves) {
            curve.storeDefaultOutTangent!(keyId);
        }
    }

    private _evaluateKeys(frame = true, range = true) {
        if (!this.props.context.activeAnimation) {
            this._curves = [];
            return;
        }
        
        let animation = this.props.context.activeAnimation;
        let keys = animation.getKeys();

        this._curves = [];

        switch (animation.dataType) {
            case Animation.ANIMATIONTYPE_FLOAT:
                this._curves.push(new Curve("#DB3E3E", animation)); 
                break;
            case Animation.ANIMATIONTYPE_VECTOR2:
                this._curves.push(new Curve("#DB3E3E", animation, "x", () => Vector2.Zero(), keyId => this._setDefaultInTangent(keyId), keyId => this._setDefaultOutTangent(keyId))); 
                this._curves.push(new Curve("#51E22D", animation, "y", () => Vector2.Zero(), keyId => this._setDefaultInTangent(keyId), keyId => this._setDefaultOutTangent(keyId)));
                break; 
            case Animation.ANIMATIONTYPE_VECTOR3:
                this._curves.push(new Curve("#DB3E3E", animation, "x", () => Vector3.Zero(), keyId => this._setDefaultInTangent(keyId), keyId => this._setDefaultOutTangent(keyId))); 
                this._curves.push(new Curve("#51E22D", animation, "y", () => Vector3.Zero(), keyId => this._setDefaultInTangent(keyId), keyId => this._setDefaultOutTangent(keyId))); 
                this._curves.push(new Curve("#00A3FF", animation, "z", () => Vector3.Zero(), keyId => this._setDefaultInTangent(keyId), keyId => this._setDefaultOutTangent(keyId))); 
                break;
            case Animation.ANIMATIONTYPE_COLOR3:
                this._curves.push(new Curve("#DB3E3E", animation, "r", () => Color3.Black(), keyId => this._setDefaultInTangent(keyId), keyId => this._setDefaultOutTangent(keyId))); 
                this._curves.push(new Curve("#51E22D", animation, "g", () => Color3.Black(), keyId => this._setDefaultInTangent(keyId), keyId => this._setDefaultOutTangent(keyId))); 
                this._curves.push(new Curve("#00A3FF", animation, "b", () => Color3.Black(), keyId => this._setDefaultInTangent(keyId), keyId => this._setDefaultOutTangent(keyId))); 
                break;
            case Animation.ANIMATIONTYPE_QUATERNION:
                this._curves.push(new Curve("#DB3E3E", animation, "x", () => Quaternion.Zero(), keyId => this._setDefaultInTangent(keyId), keyId => this._setDefaultOutTangent(keyId))); 
                this._curves.push(new Curve("#51E22D", animation, "y", () => Quaternion.Zero(), keyId => this._setDefaultInTangent(keyId), keyId => this._setDefaultOutTangent(keyId))); 
                this._curves.push(new Curve("#00A3FF", animation, "z", () => Quaternion.Zero(), keyId => this._setDefaultInTangent(keyId), keyId => this._setDefaultOutTangent(keyId))); 
                this._curves.push(new Curve("#8700FF", animation, "w", () => Quaternion.Zero(), keyId => this._setDefaultInTangent(keyId), keyId => this._setDefaultOutTangent(keyId))); 
                break;
            case Animation.ANIMATIONTYPE_COLOR4:
                this._curves.push(new Curve("#DB3E3E", animation, "r", () => new Color4(), keyId => this._setDefaultInTangent(keyId), keyId => this._setDefaultOutTangent(keyId))); 
                this._curves.push(new Curve("#51E22D", animation, "g", () => new Color4(), keyId => this._setDefaultInTangent(keyId), keyId => this._setDefaultOutTangent(keyId))); 
                this._curves.push(new Curve("#00A3FF", animation, "b", () => new Color4(), keyId => this._setDefaultInTangent(keyId), keyId => this._setDefaultOutTangent(keyId))); 
                this._curves.push(new Curve("#8700FF", animation, "a", () => new Color4(), keyId => this._setDefaultInTangent(keyId), keyId => this._setDefaultOutTangent(keyId))); 
                break;
        }

        let values = this._extractValuesFromKeys(keys, animation.dataType, true);

        if (range) {
            this._minValue = values.min;
            this._maxValue = values.max;

            this._minFrame = keys[0].frame;
            this._maxFrame = keys[keys.length - 1].frame;
        }

        if (frame) {
            this._frame();
        }
    }

    private _extractValuesFromKeys(keys: IAnimationKey[], dataType: number, pushToCurves: boolean, propertyFilter?: string) {
        let minValue = Number.MAX_VALUE;
        let maxValue = -Number.MAX_VALUE;

        for (var key of keys) {
            let lockedTangent = true;
            if (key.lockedTangent !== undefined) {
                lockedTangent = key.lockedTangent;
            }

            switch (dataType) {
                case Animation.ANIMATIONTYPE_FLOAT:
                    minValue = Math.min(minValue, key.value);
                    maxValue = Math.max(maxValue, key.value);

                    if (pushToCurves) {
                        this._curves[0].keys.push({
                            frame: key.frame, 
                            value: key.value,
                            inTangent: key.inTangent,
                            outTangent: key.outTangent,
                            lockedTangent: lockedTangent
                        });
                    }
                    break;
                case Animation.ANIMATIONTYPE_VECTOR2:
                    if (!propertyFilter || propertyFilter === "x") {
                        minValue = Math.min(minValue, key.value.x);
                        maxValue = Math.max(maxValue, key.value.x);
                    }
                    if (!propertyFilter || propertyFilter === "y") {
                        minValue = Math.min(minValue, key.value.y);
                        maxValue = Math.max(maxValue, key.value.y);
                    }

                    if (pushToCurves) {
                        this._curves[0].keys.push({
                            frame: key.frame, 
                            value: key.value.x,
                            inTangent: key.inTangent?.x,
                            outTangent: key.outTangent?.x,
                            lockedTangent: lockedTangent
                        });
                        this._curves[1].keys.push({
                            frame: key.frame, 
                            value: key.value.y,
                            inTangent: key.inTangent?.y,
                            outTangent: key.outTangent?.y,
                            lockedTangent: lockedTangent
                        });
                    }
                    break;
                case Animation.ANIMATIONTYPE_VECTOR3:
                    if (!propertyFilter || propertyFilter === "x") {
                        minValue = Math.min(minValue, key.value.x);
                        maxValue = Math.max(maxValue, key.value.x);
                    }

                    if (!propertyFilter || propertyFilter === "y") {
                        minValue = Math.min(minValue, key.value.y);
                        maxValue = Math.max(maxValue, key.value.y);
                    }
    
                    if (!propertyFilter || propertyFilter === "z") {
                        minValue = Math.min(minValue, key.value.z);
                        maxValue = Math.max(maxValue, key.value.z);
                    }
                    
                    if (pushToCurves) {
                        this._curves[0].keys.push({
                            frame: key.frame, 
                            value: key.value.x,
                            inTangent: key.inTangent?.x,
                            outTangent: key.outTangent?.x,
                            lockedTangent: lockedTangent
                        });
                        this._curves[1].keys.push({
                            frame: key.frame, 
                            value: key.value.y,
                            inTangent: key.inTangent?.y,
                            outTangent: key.outTangent?.y,
                            lockedTangent: lockedTangent
                        });
                        this._curves[2].keys.push({
                            frame: key.frame, 
                            value: key.value.z,
                            inTangent: key.inTangent?.z,
                            outTangent: key.outTangent?.z,
                            lockedTangent: lockedTangent
                        });
                    }
                    break;
                case Animation.ANIMATIONTYPE_COLOR3:
                    if (!propertyFilter || propertyFilter === "r") {
                        minValue = Math.min(minValue, key.value.r);
                        maxValue = Math.max(maxValue, key.value.r);
                    }

                    if (!propertyFilter || propertyFilter === "g") {
                        minValue = Math.min(minValue, key.value.g);
                        maxValue = Math.max(maxValue, key.value.g);
                    }

                    if (!propertyFilter || propertyFilter === "b") {
                        minValue = Math.min(minValue, key.value.b);
                        maxValue = Math.max(maxValue, key.value.b);
                    }

                    if (pushToCurves) {
                        this._curves[0].keys.push({
                            frame: key.frame, 
                            value: key.value.r,
                            inTangent: key.inTangent?.r,
                            outTangent: key.outTangent?.r,
                            lockedTangent: lockedTangent
                        });
                        this._curves[1].keys.push({
                            frame: key.frame, 
                            value: key.value.g,
                            inTangent: key.inTangent?.g,
                            outTangent: key.outTangent?.g,
                            lockedTangent: lockedTangent
                        });
                        this._curves[2].keys.push({
                            frame: key.frame, 
                            value: key.value.b,
                            inTangent: key.inTangent?.b,
                            outTangent: key.outTangent?.b,
                            lockedTangent: lockedTangent
                        });
                    }
                    break;                    
                case Animation.ANIMATIONTYPE_QUATERNION:
                    if (!propertyFilter || propertyFilter === "x") {
                        minValue = Math.min(minValue, key.value.x);
                        maxValue = Math.max(maxValue, key.value.x);
                    }

                    if (!propertyFilter || propertyFilter === "y") {
                        minValue = Math.min(minValue, key.value.y);
                        maxValue = Math.max(maxValue, key.value.y);
                    }
    
                    if (!propertyFilter || propertyFilter === "z") {
                        minValue = Math.min(minValue, key.value.z);
                        maxValue = Math.max(maxValue, key.value.z);
                    }

                    if (!propertyFilter || propertyFilter === "w") {
                        minValue = Math.min(minValue, key.value.w);
                        maxValue = Math.max(maxValue, key.value.w);
                    }                    
                    
                    if (pushToCurves) {
                        this._curves[0].keys.push({
                            frame: key.frame, 
                            value: key.value.x,
                            inTangent: key.inTangent?.x,
                            outTangent: key.outTangent?.x,
                            lockedTangent: lockedTangent
                        });
                        this._curves[1].keys.push({
                            frame: key.frame, 
                            value: key.value.y,
                            inTangent: key.inTangent?.y,
                            outTangent: key.outTangent?.y,
                            lockedTangent: lockedTangent
                        });
                        this._curves[2].keys.push({
                            frame: key.frame, 
                            value: key.value.z,
                            inTangent: key.inTangent?.z,
                            outTangent: key.outTangent?.z,
                            lockedTangent: lockedTangent
                        });   
                        this._curves[3].keys.push({
                            frame: key.frame, 
                            value: key.value.w,
                            inTangent: key.inTangent?.w,
                            outTangent: key.outTangent?.w,
                            lockedTangent: lockedTangent
                        }); 
                    }                   
                    break;
                case Animation.ANIMATIONTYPE_COLOR4:
                    if (!propertyFilter || propertyFilter === "r") {
                        minValue = Math.min(minValue, key.value.r);
                        maxValue = Math.max(maxValue, key.value.r);
                    }

                    if (!propertyFilter || propertyFilter === "g") {
                        minValue = Math.min(minValue, key.value.g);
                        maxValue = Math.max(maxValue, key.value.g);
                    }

                    if (!propertyFilter || propertyFilter === "b") {
                        minValue = Math.min(minValue, key.value.b);
                        maxValue = Math.max(maxValue, key.value.b);
                    }

                    if (!propertyFilter || propertyFilter === "a") {
                        minValue = Math.min(minValue, key.value.a);
                        maxValue = Math.max(maxValue, key.value.a);
                    }                    
                    
                    if (pushToCurves) {
                        this._curves[0].keys.push({
                            frame: key.frame, 
                            value: key.value.r,
                            inTangent: key.inTangent?.r,
                            outTangent: key.outTangent?.r,
                            lockedTangent: lockedTangent
                        });
                        this._curves[1].keys.push({
                            frame: key.frame, 
                            value: key.value.g,
                            inTangent: key.inTangent?.g,
                            outTangent: key.outTangent?.g,
                            lockedTangent: lockedTangent
                        });
                        this._curves[2].keys.push({
                            frame: key.frame, 
                            value: key.value.b,
                            inTangent: key.inTangent?.b,
                            outTangent: key.outTangent?.b,
                            lockedTangent: lockedTangent
                        });   
                        this._curves[3].keys.push({
                            frame: key.frame, 
                            value: key.value.a,
                            inTangent: key.inTangent?.a,
                            outTangent: key.outTangent?.a,
                            lockedTangent: lockedTangent
                        });                  
                    }
                    break;                    
            }
        }

        return (
            {
                min: minValue,
                max: maxValue
            }
        )
    }

    
    private _convertX(x: number) {
        let diff = this._maxFrame - this._minFrame;

        if (diff === 0) {
            diff = 1;
        }

        return ((x - this._minFrame) / diff) *  (this._GraphAbsoluteWidth);
    }

    private _invertX(x: number) {
        return  (x / this._GraphAbsoluteWidth) * (this._maxFrame - this._minFrame) +  this._minFrame;
    }

    private _convertY(y: number) {
        let diff = this._maxValue - this._minValue;

        if (diff === 0) {
            diff = 1;
        }

        return this._GraphAbsoluteHeight - ((y - this._minValue) / diff) * this._GraphAbsoluteHeight;
    }

    private _invertY(y: number) {
        let diff = this._maxValue - this._minValue;

        if (diff === 0) {
            diff = 1;
        }

        return ((this._GraphAbsoluteHeight - y) / this._GraphAbsoluteHeight) * diff + this._minValue;
    }

    private _buildYAxis() {
        if (!this.props.context.activeAnimation) {
            return null;
        }

        let stepCounts = 10;
        let range = this._maxValue !== this._minValue ? this._maxValue - this._minValue : 1;
        let offset = range / stepCounts;
        let convertRatio = range / this._GraphAbsoluteHeight;

        let steps = [];

        let startPosition = ((this._viewHeight  * this._viewScale) - this._GraphAbsoluteHeight - this._offsetY) * convertRatio;
        let start = this._minValue - ((startPosition / offset) | 0) * offset;
        let end = start + (this._viewHeight * this._viewScale )* convertRatio;

        for (var step = start - offset; step <= end + offset; step += offset) {
            steps.push(step);
        }

        let precision = 2;

        while (steps[0].toFixed(precision) === steps[1].toFixed(precision)) {
            precision++;
        }

        return (
            steps.map((s, i) => {
                let y = this._GraphAbsoluteHeight - ((s - this._minValue) / convertRatio);
                return (
                    <g key={"axis" + s}>
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
                            {s.toFixed(precision)}
                        </text>
                    </g>
                )
            })
        )
    }

    private _frame() {
        if (!this._currentAnimation) {
            return;
        }

        this._offsetX = 20;
        this._offsetY = 20;

        let keys = this._currentAnimation.getKeys();

        // Only keep selected keys
        if (this.props.context.activeKeyPoints && this.props.context.activeKeyPoints.length > 1) {
            let newKeys = [];
            for (var keyPoint of this.props.context.activeKeyPoints) {
                newKeys.push(keys[keyPoint.props.keyId]);
            }

            keys = newKeys;
        }

        this._minFrame = keys[0].frame;
        this._maxFrame = keys[keys.length - 1].frame;
        let propertyFilter: string | undefined = undefined;

        if (this.props.context.activeColor) {
            const activeCurve = this._curves.filter(c => c.color === this.props.context.activeColor)[0];

            if (activeCurve) {
                propertyFilter = activeCurve.property;
            } else {
                this.props.context.activeColor = null;
            }
        }

        let values = this._extractValuesFromKeys(keys, this._currentAnimation.dataType, false, propertyFilter);
        this._minValue = values.min;
        this._maxValue = values.max;

        this.props.context.referenceMinFrame = this._minFrame;
        this.props.context.referenceMaxFrame = this._maxFrame;

        const frameConvert = Math.abs(this._convertX(this._maxFrame ) - this._convertX(this._minFrame)) + this._offsetX * 2;
        const valueConvert = this._minValue !== this._maxValue ? Math.abs(this._convertY(this._minValue) - this._convertY(this._maxValue)) + this._offsetY * 2 : 1;

        let scaleWidth =  frameConvert/ this._viewCurveWidth;
        let scaleHeight = valueConvert / this._viewHeight;

        this._viewScale = scaleWidth * this._viewHeight < valueConvert ? scaleHeight : scaleWidth;

        this.props.context.onGraphMoved.notifyObservers(this._offsetX);
        this.props.context.onGraphScaled.notifyObservers(this._viewScale);
    }

    private _dropKeyFrames(curveId: number) {
        if (!this.props.context.activeAnimation || !this._curves || !this._curves.length) {
            return null;
        }

        if (curveId >= this._curves.length) {
            return null;
        }
        let curve = this._curves[curveId];

        return curve.keys.map((key, i) => {
            let x = this._convertX(key.frame);
            let y = this._convertY(key.value);

            return (
               <KeyPointComponent 
                    x={x} y={y} context={this.props.context} 
                    scale={this._viewScale} 
                    getPreviousX={() => i > 0 ? this._convertX(curve.keys[i - 1].frame) : null}
                    getNextX={() => i < curve.keys.length - 1 ? this._convertX(curve.keys[i + 1].frame) : null}
                    channel={curve.color}
                    keyId={i}
                    curve={curve}
                    key={curveId + "-" + i}
                    invertX={x => this._invertX(x)}
                    invertY={y => this._invertY(y)}
                    convertX={x => this._convertX(x)}
                    convertY={y => this._convertY(y)}
                    onFrameValueChanged={value => { curve.updateKeyFrame(i, value)}}
                    onKeyValueChanged={value => { curve.updateKeyValue(i, value)}}
                />
            );
        })
    }

    private _onPointerDown(evt: React.PointerEvent<HTMLDivElement>) {
        if ((evt.nativeEvent.target as any).id !== "svg-graph-curves") {
            return;
        }

        this._pointerIsDown = true;
        evt.currentTarget.setPointerCapture(evt.pointerId);
        this._sourcePointerX = evt.nativeEvent.offsetX;
        this._sourcePointerY = evt.nativeEvent.offsetY;

        this._inSelectionMode = evt.nativeEvent.ctrlKey;

        if (this._inSelectionMode) {
            this._selectionStartX = this._sourcePointerX + 40;
            this._selectionStartY = this._sourcePointerY;
        }
    }

    private _onPointerMove(evt: React.PointerEvent<HTMLDivElement>) {
        if (!this._pointerIsDown) {
            return;
        }

        if (this._inSelectionMode) {
            let style = this._selectionRectangle.current!.style;
            style.visibility = "visible";

            const localX = evt.nativeEvent.offsetX;
            const localY = evt.nativeEvent.offsetY;

            if (localX > this._selectionStartX) {
                style.left = `${this._selectionStartX}px`;
                style.width = `${(localX - this._selectionStartX)}px`;
            } else {
                style.left = `${localX}px`;
                style.width = `${(this._selectionStartX - localX)}px`;
            }

            if (localY > this._selectionStartY) {                
                style.top = `${this._selectionStartY}px`;
                style.height = `${(localY - this._selectionStartY)}px`;
            } else {
                style.top = `${localY}px`;
                style.height = `${(this._selectionStartY - localY)}px`;
            }
            
            this.props.context.onSelectionRectangleMoved.notifyObservers(this._selectionRectangle.current!.getBoundingClientRect());

            return;
        }

        this._offsetX += (evt.nativeEvent.offsetX - this._sourcePointerX) * this._viewScale;
        this._offsetY += (evt.nativeEvent.offsetY - this._sourcePointerY) * this._viewScale;
        
        this._sourcePointerX = evt.nativeEvent.offsetX;
        this._sourcePointerY = evt.nativeEvent.offsetY;
        
        this.props.context.onGraphMoved.notifyObservers(this._offsetX);

        this.forceUpdate();
    }

    private _onPointerUp(evt: React.PointerEvent<HTMLDivElement>) {
        this._pointerIsDown = false;
        evt.currentTarget.releasePointerCapture(evt.pointerId);

        this._selectionRectangle.current!.style.visibility = "hidden";
    }

    private _onWheel(evt: React.WheelEvent) {
        let delta = evt.deltaY < 0 ? -0.05 : 0.05;

        const oldScale = this._viewScale;
        this._viewScale = Math.min(Math.max(this._MinScale, this._viewScale + delta * this._viewScale), this._MaxScale);

        const clientX = evt.nativeEvent.offsetX;
        const clientY = evt.nativeEvent.offsetY;

        const xDiff = clientX * oldScale - clientX * this._viewScale;
        const yDiff = clientY * oldScale - clientY * this._viewScale;

        this._offsetX -= xDiff;
        this._offsetY -= yDiff;

        this.forceUpdate();

        evt.stopPropagation();

        this.props.context.onGraphMoved.notifyObservers(this._offsetX);
        this.props.context.onGraphScaled.notifyObservers(this._viewScale);
    }

    public render() {
        const scale = this._viewScale;
        const viewBoxScalingCurves = `${-this._offsetX} ${-this._offsetY} ${Math.round(scale * this._viewCurveWidth)} ${Math.round(scale * this._viewHeight)}`;
        const viewBoxScalingGrid = `0 ${-this._offsetY} ${Math.round(scale * this._viewWidth)} ${Math.round(scale * this._viewHeight)}`;

        let activeBoxLeft = 0;
        let activeBoxRight = 0;
        if (this.props.context.activeAnimation) {
            let minFrame = this.props.context.referenceMinFrame;
            let maxFrame = this.props.context.referenceMaxFrame;
        
            activeBoxLeft = (((this.props.context.fromKey - minFrame) /  (maxFrame - minFrame)) * this._GraphAbsoluteWidth + this._offsetX) / this._viewScale;
            activeBoxRight = (((this.props.context.toKey - minFrame) /  (maxFrame - minFrame)) * this._GraphAbsoluteWidth + this._offsetX) / this._viewScale;
        }

        return (
            <div 
                id="graph"                
                onWheel={evt => this._onWheel(evt)}
                onPointerDown={evt => this._onPointerDown(evt)}
                onPointerMove={evt => this._onPointerMove(evt)}
                onPointerUp={evt => this._onPointerUp(evt)}
            >
                {
                    this.props.context.activeAnimation && 
                    <div id="dark-rectangle" style={ {
                        left: activeBoxLeft + "px",
                        width: (activeBoxRight - activeBoxLeft) + "px"
                    }}/>
                }
                <div id="block-rectangle"/>
                <svg
                    id="svg-graph-grid"
                    viewBox={viewBoxScalingGrid}
                    ref={this._svgHost}
                    >
                    {
                        this._buildYAxis()
                    }
                </svg>
                <svg
                    ref={this._svgHost2}
                    id="svg-graph-curves"
                    tabIndex={0}
                    viewBox={viewBoxScalingCurves}
                    >
                    {
                        this._curves.map((c, i) => {
                            return (
                                <CurveComponent key={i} context={this.props.context} curve={c} convertX={x => this._convertX(x)} convertY={y => this._convertY(y)}/>
                            )
                        })
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
                <div 
                    ref={this._selectionRectangle}
                    id="selection-rectangle">
                </div>
            </div>
        );
    }
}