import * as React from "react";
import type { GlobalState } from "../../../../../../globalState";
import type { Context, IActiveAnimationChangedOptions } from "../context";
import { Animation } from "core/Animations/animation";
import { Curve } from "./curve";
import { KeyPointComponent } from "./keyPoint";
import { CurveComponent } from "./curveComponent";
import type { Nullable } from "core/types";
import type { Observer } from "core/Misc/observable";
import type { IAnimationKey } from "core/Animations/animationKey";
import { Quaternion, Vector2, Vector3 } from "core/Maths/math.vector";
import { Color3, Color4 } from "core/Maths/math.color";
import { Scalar } from "core/Maths/math.scalar";
import { Tools } from "core/Misc/tools";

interface IGraphComponentProps {
    globalState: GlobalState;
    context: Context;
}

interface IGraphComponentState {}

export class GraphComponent extends React.Component<IGraphComponentProps, IGraphComponentState> {
    private readonly _minScale = 0.5;
    private readonly _maxScale = 5;
    private readonly _graphAbsoluteWidth = 788;
    private readonly _graphAbsoluteHeight = 357;

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
    private _selectionMade: boolean;

    private _selectionStartX: number;
    private _selectionStartY: number;

    private _onActiveAnimationChangedObserver: Nullable<Observer<IActiveAnimationChangedOptions>>;

    constructor(props: IGraphComponentProps) {
        super(props);

        this.state = {};

        this._svgHost = React.createRef();
        this._svgHost2 = React.createRef();
        this._selectionRectangle = React.createRef();

        this._evaluateKeys();

        this.props.context.onHostWindowResized.add(() => {
            Tools.SetImmediate(() => {
                this._computeSizes();
            });
        });

        this._onActiveAnimationChangedObserver = this.props.context.onActiveAnimationChanged.add(({ evaluateKeys = true, frame = true, range = true }) => {
            if (evaluateKeys) {
                this._evaluateKeys(frame, range);
            }
            Tools.SetImmediate(() => {
                this._computeSizes();
                this.forceUpdate();
            });
        });

        this.props.context.onFrameRequired.add(() => {
            this._frameFromActiveKeys();
            this.forceUpdate();
        });

        this.props.context.onRangeUpdated.add(() => {
            this.forceUpdate();
        });

        // Delete keypoint
        this.props.context.onDeleteKeyActiveKeyPoints.add(() => {
            if (this.props.context.activeAnimations.length === 0 || !this.props.context.activeKeyPoints) {
                return;
            }

            for (const currentAnimation of this.props.context.activeAnimations) {
                const keys = currentAnimation.getKeys();
                const newKeys = keys.slice(0);
                let deletedFrame: Nullable<number> = null;

                for (const keyPoint of this.props.context.activeKeyPoints) {
                    // Cannot delete 0 and last
                    if (keyPoint.props.keyId === 0 || keyPoint.props.keyId === keys.length - 1) {
                        continue;
                    }

                    const key = keys[keyPoint.props.keyId];

                    const keyIndex = newKeys.indexOf(key);
                    if (keyIndex > -1) {
                        newKeys.splice(keyIndex, 1);

                        if (deletedFrame === null) {
                            deletedFrame = key.frame;
                        }
                    }
                }

                this.props.context.stop();
                currentAnimation.setKeys(newKeys);
                if (deletedFrame !== null) {
                    this.props.context.moveToFrame(deletedFrame);
                }
            }
            this._evaluateKeys(false, false);

            this.props.context.activeKeyPoints = [];
            this.props.context.onActiveKeyPointChanged.notifyObservers();
            this.props.context.onActiveAnimationChanged.notifyObservers({ evaluateKeys: false });
            this.forceUpdate();
        });

        // Create or Update keypoint
        this.props.context.onCreateOrUpdateKeyPointRequired.add(() => {
            if (this.props.context.activeAnimations.length === 0) {
                return;
            }

            for (const currentAnimation of this.props.context.activeAnimations) {
                if (currentAnimation.dataType === Animation.ANIMATIONTYPE_QUATERNION) {
                    continue;
                }
                const keys = currentAnimation.getKeys();

                const currentFrame = this.props.context.activeFrame;

                let indexToAdd = -1;
                for (const key of keys) {
                    if (key.frame < currentFrame) {
                        indexToAdd++;
                    } else {
                        break;
                    }
                }

                let value: any;

                if (this.props.context.target) {
                    value = this.props.context.target as any;
                    for (const path of currentAnimation.targetPropertyPath) {
                        value = value[path];
                    }

                    if (value.clone) {
                        value = value.clone();
                    }
                } else {
                    value = currentAnimation.evaluate(currentFrame);
                }

                const leftKey = keys[indexToAdd];
                const rightKey = keys[indexToAdd + 1];

                if (Math.floor(currentFrame - leftKey?.frame) === 0) {
                    // Key already exists, update it
                    leftKey.value = value;
                } else if (Math.floor(rightKey?.frame - currentFrame) === 0) {
                    // Key already exists, update it
                    rightKey.value = value;
                } else {
                    // Key doesn't exist, create it (same operations) as
                    // the new key listener
                    const newKey: IAnimationKey = {
                        frame: currentFrame,
                        value: value,
                        lockedTangent: true,
                    };

                    if (leftKey?.outTangent !== undefined && rightKey?.inTangent !== undefined) {
                        let derivative: Nullable<any> = null;
                        const invFrameDelta = 1.0 / (rightKey.frame - leftKey.frame);
                        const cutTime = (currentFrame - leftKey.frame) * invFrameDelta;

                        switch (currentAnimation.dataType) {
                            case Animation.ANIMATIONTYPE_FLOAT: {
                                derivative = Scalar.Hermite1stDerivative(
                                    leftKey.value * invFrameDelta,
                                    leftKey.outTangent,
                                    rightKey.value * invFrameDelta,
                                    rightKey.inTangent,
                                    cutTime
                                );
                                break;
                            }
                            case Animation.ANIMATIONTYPE_VECTOR2: {
                                derivative = Vector2.Hermite1stDerivative(
                                    leftKey.value.scale(invFrameDelta),
                                    leftKey.outTangent,
                                    rightKey.value.scale(invFrameDelta),
                                    rightKey.inTangent,
                                    cutTime
                                );
                                break;
                            }
                            case Animation.ANIMATIONTYPE_VECTOR3: {
                                derivative = Vector3.Hermite1stDerivative(
                                    leftKey.value.scale(invFrameDelta),
                                    leftKey.outTangent,
                                    rightKey.value.scale(invFrameDelta),
                                    rightKey.inTangent,
                                    cutTime
                                );
                                break;
                            }
                            case Animation.ANIMATIONTYPE_COLOR3:
                                derivative = Color3.Hermite1stDerivative(
                                    leftKey.value.scale(invFrameDelta),
                                    leftKey.outTangent,
                                    rightKey.value.scale(invFrameDelta),
                                    rightKey.inTangent,
                                    cutTime
                                );
                                break;
                            case Animation.ANIMATIONTYPE_COLOR4:
                                derivative = Color4.Hermite1stDerivative(
                                    leftKey.value.scale(invFrameDelta),
                                    leftKey.outTangent,
                                    rightKey.value.scale(invFrameDelta),
                                    rightKey.inTangent,
                                    cutTime
                                );
                                break;
                        }

                        if (derivative !== null) {
                            newKey.inTangent = derivative;
                            newKey.outTangent = derivative.clone ? derivative.clone() : derivative;
                        }
                    }
                    keys.splice(indexToAdd + 1, 0, newKey);
                }

                currentAnimation.setKeys(keys);
            }
            this._evaluateKeys(false, false);

            this.props.context.activeKeyPoints = [];
            this.props.context.onActiveKeyPointChanged.notifyObservers();
            this.props.context.onActiveAnimationChanged.notifyObservers({ evaluateKeys: false });
            this.forceUpdate();
        });
    }

    override componentWillUnmount() {
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
        for (const curve of this._curves) {
            curve.storeDefaultInTangent(keyId);
        }
    }

    private _setDefaultOutTangent(keyId: number) {
        for (const curve of this._curves) {
            curve.storeDefaultOutTangent!(keyId);
        }
    }

    private _evaluateKeys(frame = true, range = true) {
        if (this.props.context.activeAnimations.length === 0) {
            this._curves = [];
            return;
        }

        this._curves = [];

        for (const animation of this.props.context.activeAnimations) {
            const keys = animation.getKeys();

            const curves = [];
            switch (animation.dataType) {
                case Animation.ANIMATIONTYPE_FLOAT:
                    curves.push(new Curve("#DB3E3E", animation));
                    break;
                case Animation.ANIMATIONTYPE_VECTOR2:
                    curves.push(
                        new Curve(
                            "#DB3E3E",
                            animation,
                            "x",
                            () => Vector2.Zero(),
                            (keyId) => this._setDefaultInTangent(keyId),
                            (keyId) => this._setDefaultOutTangent(keyId)
                        )
                    );
                    curves.push(
                        new Curve(
                            "#51E22D",
                            animation,
                            "y",
                            () => Vector2.Zero(),
                            (keyId) => this._setDefaultInTangent(keyId),
                            (keyId) => this._setDefaultOutTangent(keyId)
                        )
                    );
                    break;
                case Animation.ANIMATIONTYPE_VECTOR3:
                    curves.push(
                        new Curve(
                            "#DB3E3E",
                            animation,
                            "x",
                            () => Vector3.Zero(),
                            (keyId) => this._setDefaultInTangent(keyId),
                            (keyId) => this._setDefaultOutTangent(keyId)
                        )
                    );
                    curves.push(
                        new Curve(
                            "#51E22D",
                            animation,
                            "y",
                            () => Vector3.Zero(),
                            (keyId) => this._setDefaultInTangent(keyId),
                            (keyId) => this._setDefaultOutTangent(keyId)
                        )
                    );
                    curves.push(
                        new Curve(
                            "#00A3FF",
                            animation,
                            "z",
                            () => Vector3.Zero(),
                            (keyId) => this._setDefaultInTangent(keyId),
                            (keyId) => this._setDefaultOutTangent(keyId)
                        )
                    );
                    break;
                case Animation.ANIMATIONTYPE_COLOR3:
                    curves.push(
                        new Curve(
                            "#DB3E3E",
                            animation,
                            "r",
                            () => Color3.Black(),
                            (keyId) => this._setDefaultInTangent(keyId),
                            (keyId) => this._setDefaultOutTangent(keyId)
                        )
                    );
                    curves.push(
                        new Curve(
                            "#51E22D",
                            animation,
                            "g",
                            () => Color3.Black(),
                            (keyId) => this._setDefaultInTangent(keyId),
                            (keyId) => this._setDefaultOutTangent(keyId)
                        )
                    );
                    curves.push(
                        new Curve(
                            "#00A3FF",
                            animation,
                            "b",
                            () => Color3.Black(),
                            (keyId) => this._setDefaultInTangent(keyId),
                            (keyId) => this._setDefaultOutTangent(keyId)
                        )
                    );
                    break;
                case Animation.ANIMATIONTYPE_QUATERNION:
                    curves.push(
                        new Curve(
                            "#DB3E3E",
                            animation,
                            "x",
                            () => Quaternion.Zero(),
                            (keyId) => this._setDefaultInTangent(keyId),
                            (keyId) => this._setDefaultOutTangent(keyId)
                        )
                    );
                    curves.push(
                        new Curve(
                            "#51E22D",
                            animation,
                            "y",
                            () => Quaternion.Zero(),
                            (keyId) => this._setDefaultInTangent(keyId),
                            (keyId) => this._setDefaultOutTangent(keyId)
                        )
                    );
                    curves.push(
                        new Curve(
                            "#00A3FF",
                            animation,
                            "z",
                            () => Quaternion.Zero(),
                            (keyId) => this._setDefaultInTangent(keyId),
                            (keyId) => this._setDefaultOutTangent(keyId)
                        )
                    );
                    curves.push(
                        new Curve(
                            "#8700FF",
                            animation,
                            "w",
                            () => Quaternion.Zero(),
                            (keyId) => this._setDefaultInTangent(keyId),
                            (keyId) => this._setDefaultOutTangent(keyId)
                        )
                    );
                    break;
                case Animation.ANIMATIONTYPE_COLOR4:
                    curves.push(
                        new Curve(
                            "#DB3E3E",
                            animation,
                            "r",
                            () => new Color4(),
                            (keyId) => this._setDefaultInTangent(keyId),
                            (keyId) => this._setDefaultOutTangent(keyId)
                        )
                    );
                    curves.push(
                        new Curve(
                            "#51E22D",
                            animation,
                            "g",
                            () => new Color4(),
                            (keyId) => this._setDefaultInTangent(keyId),
                            (keyId) => this._setDefaultOutTangent(keyId)
                        )
                    );
                    curves.push(
                        new Curve(
                            "#00A3FF",
                            animation,
                            "b",
                            () => new Color4(),
                            (keyId) => this._setDefaultInTangent(keyId),
                            (keyId) => this._setDefaultOutTangent(keyId)
                        )
                    );
                    curves.push(
                        new Curve(
                            "#8700FF",
                            animation,
                            "a",
                            () => new Color4(),
                            (keyId) => this._setDefaultInTangent(keyId),
                            (keyId) => this._setDefaultOutTangent(keyId)
                        )
                    );
                    break;
            }

            const values = this._extractValuesFromKeys(keys, animation.dataType, curves);

            this._curves.push(...curves);

            if (range) {
                this._minValue = Math.min(this._minValue, values.min);
                this._maxValue = Math.max(this._maxValue, values.max);

                this._minFrame = Math.min(this._minFrame, keys[0].frame);
                this._maxFrame = Math.max(this._maxFrame, keys[keys.length - 1].frame);
            }
        }

        if (frame) {
            this._frameFromActiveKeys();
        }
    }

    private _extractValuesFromKeys(keys: IAnimationKey[], dataType: number, curvesToPushTo?: Curve[], propertyFilter?: string) {
        let minValue = Number.MAX_VALUE;
        let maxValue = -Number.MAX_VALUE;

        for (const key of keys) {
            let lockedTangent = true;
            if (key.lockedTangent !== undefined) {
                lockedTangent = key.lockedTangent;
            }

            switch (dataType) {
                case Animation.ANIMATIONTYPE_FLOAT:
                    minValue = Math.min(minValue, key.value);
                    maxValue = Math.max(maxValue, key.value);

                    if (curvesToPushTo) {
                        curvesToPushTo[0].keys.push({
                            frame: key.frame,
                            value: key.value,
                            inTangent: key.inTangent,
                            outTangent: key.outTangent,
                            lockedTangent: lockedTangent,
                            interpolation: key.interpolation,
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

                    if (curvesToPushTo) {
                        curvesToPushTo[0].keys.push({
                            frame: key.frame,
                            value: key.value.x,
                            inTangent: key.inTangent?.x,
                            outTangent: key.outTangent?.x,
                            lockedTangent: lockedTangent,
                            interpolation: key.interpolation,
                        });
                        curvesToPushTo[1].keys.push({
                            frame: key.frame,
                            value: key.value.y,
                            inTangent: key.inTangent?.y,
                            outTangent: key.outTangent?.y,
                            lockedTangent: lockedTangent,
                            interpolation: key.interpolation,
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

                    if (curvesToPushTo) {
                        curvesToPushTo[0].keys.push({
                            frame: key.frame,
                            value: key.value.x,
                            inTangent: key.inTangent?.x,
                            outTangent: key.outTangent?.x,
                            lockedTangent: lockedTangent,
                            interpolation: key.interpolation,
                        });
                        curvesToPushTo[1].keys.push({
                            frame: key.frame,
                            value: key.value.y,
                            inTangent: key.inTangent?.y,
                            outTangent: key.outTangent?.y,
                            lockedTangent: lockedTangent,
                            interpolation: key.interpolation,
                        });
                        curvesToPushTo[2].keys.push({
                            frame: key.frame,
                            value: key.value.z,
                            inTangent: key.inTangent?.z,
                            outTangent: key.outTangent?.z,
                            lockedTangent: lockedTangent,
                            interpolation: key.interpolation,
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

                    if (curvesToPushTo) {
                        curvesToPushTo[0].keys.push({
                            frame: key.frame,
                            value: key.value.r,
                            inTangent: key.inTangent?.r,
                            outTangent: key.outTangent?.r,
                            lockedTangent: lockedTangent,
                            interpolation: key.interpolation,
                        });
                        curvesToPushTo[1].keys.push({
                            frame: key.frame,
                            value: key.value.g,
                            inTangent: key.inTangent?.g,
                            outTangent: key.outTangent?.g,
                            lockedTangent: lockedTangent,
                            interpolation: key.interpolation,
                        });
                        curvesToPushTo[2].keys.push({
                            frame: key.frame,
                            value: key.value.b,
                            inTangent: key.inTangent?.b,
                            outTangent: key.outTangent?.b,
                            lockedTangent: lockedTangent,
                            interpolation: key.interpolation,
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

                    if (curvesToPushTo) {
                        curvesToPushTo[0].keys.push({
                            frame: key.frame,
                            value: key.value.x,
                            inTangent: key.inTangent?.x,
                            outTangent: key.outTangent?.x,
                            lockedTangent: lockedTangent,
                            interpolation: key.interpolation,
                        });
                        curvesToPushTo[1].keys.push({
                            frame: key.frame,
                            value: key.value.y,
                            inTangent: key.inTangent?.y,
                            outTangent: key.outTangent?.y,
                            lockedTangent: lockedTangent,
                            interpolation: key.interpolation,
                        });
                        curvesToPushTo[2].keys.push({
                            frame: key.frame,
                            value: key.value.z,
                            inTangent: key.inTangent?.z,
                            outTangent: key.outTangent?.z,
                            lockedTangent: lockedTangent,
                            interpolation: key.interpolation,
                        });
                        curvesToPushTo[3].keys.push({
                            frame: key.frame,
                            value: key.value.w,
                            inTangent: key.inTangent?.w,
                            outTangent: key.outTangent?.w,
                            lockedTangent: lockedTangent,
                            interpolation: key.interpolation,
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

                    if (curvesToPushTo) {
                        curvesToPushTo[0].keys.push({
                            frame: key.frame,
                            value: key.value.r,
                            inTangent: key.inTangent?.r,
                            outTangent: key.outTangent?.r,
                            lockedTangent: lockedTangent,
                            interpolation: key.interpolation,
                        });
                        curvesToPushTo[1].keys.push({
                            frame: key.frame,
                            value: key.value.g,
                            inTangent: key.inTangent?.g,
                            outTangent: key.outTangent?.g,
                            lockedTangent: lockedTangent,
                            interpolation: key.interpolation,
                        });
                        curvesToPushTo[2].keys.push({
                            frame: key.frame,
                            value: key.value.b,
                            inTangent: key.inTangent?.b,
                            outTangent: key.outTangent?.b,
                            lockedTangent: lockedTangent,
                            interpolation: key.interpolation,
                        });
                        curvesToPushTo[3].keys.push({
                            frame: key.frame,
                            value: key.value.a,
                            inTangent: key.inTangent?.a,
                            outTangent: key.outTangent?.a,
                            lockedTangent: lockedTangent,
                            interpolation: key.interpolation,
                        });
                    }
                    break;
            }
        }

        return {
            min: minValue,
            max: maxValue,
        };
    }

    private _convertX(x: number) {
        let diff = this._maxFrame - this._minFrame;

        if (diff === 0) {
            diff = 1;
        }

        return ((x - this._minFrame) / diff) * this._graphAbsoluteWidth;
    }

    private _invertX(x: number) {
        return (x / this._graphAbsoluteWidth) * (this._maxFrame - this._minFrame) + this._minFrame;
    }

    private _convertY(y: number) {
        let diff = this._maxValue - this._minValue;

        if (diff === 0) {
            diff = 1;
        }

        return this._graphAbsoluteHeight - ((y - this._minValue) / diff) * this._graphAbsoluteHeight;
    }

    private _invertY(y: number) {
        let diff = this._maxValue - this._minValue;

        if (diff === 0) {
            diff = 1;
        }

        return ((this._graphAbsoluteHeight - y) / this._graphAbsoluteHeight) * diff + this._minValue;
    }

    private _buildFrameIntervalAxis() {
        if (this.props.context.activeAnimations.length === 0) {
            return null;
        }

        const maxFrame = this.props.context.referenceMaxFrame;

        const range = maxFrame;
        let offset = this.props.context.activeAnimations[0].framePerSecond;
        const convertRatio = range / this._graphAbsoluteWidth;

        const steps = [];

        if (offset === 0) {
            offset = 1;
        }

        const startPosition = this._offsetX * convertRatio;
        const start = ((startPosition / offset) | 0) * offset;
        const end = start + (this._viewWidth - 40) * this._viewScale * convertRatio;

        for (let step = start - offset; step <= end + offset; step += offset) {
            steps.push(step);
        }

        return steps.map((s) => {
            const x = s / convertRatio;
            return (
                <g key={"axis" + s}>
                    <line
                        key={"line" + s}
                        x1={x}
                        y1={0}
                        x2={x}
                        y2={this._viewHeight * this._viewScale}
                        style={{
                            stroke: "#666666",
                            strokeWidth: 1,
                        }}
                    ></line>
                </g>
            );
        });
    }

    private _buildYAxis() {
        if (this.props.context.activeAnimations.length === 0) {
            return null;
        }

        const stepCounts = 10;
        const range = this._maxValue !== this._minValue ? this._maxValue - this._minValue : 1;
        let offset = (range / stepCounts) * this._viewScale;
        const convertRatio = range / this._graphAbsoluteHeight;
        const steps = [];

        // Get precision
        const a = 0;
        const b = offset;
        let precision = 2;

        while (a.toFixed(precision) === b.toFixed(precision)) {
            precision++;
        }

        // Make sure we have an even number with the correct number of decimals
        const pow = Math.pow(10, precision);
        offset = Math.round(offset * pow);
        if (offset % 2 !== 0) {
            offset -= 1;
        }

        offset /= pow;

        // Evaluate limits
        const startPosition = (this._viewHeight * this._viewScale - this._graphAbsoluteHeight - this._offsetY) * convertRatio;
        const start = Math.ceil((this._minValue - ((startPosition / offset) | 0) * offset) / offset) * offset;
        const end = Math.round((start + this._viewHeight * this._viewScale * convertRatio) / offset) * offset;

        for (let step = start - offset; step <= end + offset; step += offset) {
            steps.push(step);
        }

        return steps.map((s) => {
            const y = this._graphAbsoluteHeight - (s - this._minValue) / convertRatio;
            let text = s.toFixed(precision);

            text = parseFloat(text).toFixed(precision); // Avoid -0.00 (negative zero)
            const zero = 0.0;
            const isZero = text === zero.toFixed(precision);

            return (
                <g key={"axis" + s}>
                    <line
                        key={"line" + s}
                        x1={this._graphOffsetX * this._viewScale}
                        y1={y}
                        x2={this._viewWidth * this._viewScale}
                        y2={y}
                        style={{
                            stroke: isZero ? "#666666" : "#333333",
                            strokeWidth: isZero ? 1.0 : 0.5,
                        }}
                    ></line>
                    <text
                        key={"label" + s}
                        x={0}
                        y={y}
                        dx={`${15 * this._viewScale}px`}
                        textAnchor="middle"
                        dy={`${3 * this._viewScale}px`}
                        style={{
                            fontFamily: "acumin-pro-condensed",
                            fontSize: `${10 * this._viewScale}px`,
                            fill: "#888888",
                            textAlign: "center",
                        }}
                    >
                        {text}
                    </text>
                </g>
            );
        });
    }
    private _frameFromActiveKeys() {
        if (this.props.context.activeAnimations.length === 0) {
            return;
        }

        this._offsetX = 20;
        this._offsetY = 20;

        let minValue = Number.MAX_VALUE;
        let maxValue = -Number.MAX_VALUE;

        let minFrame = Number.MAX_VALUE;
        let maxFrame = -Number.MAX_VALUE;

        let hasRange = false;

        for (const animation of this.props.context.activeAnimations) {
            let propertyFilter: string | undefined = undefined;
            const activeChannel = this.props.context.getActiveChannel(animation);
            if (activeChannel) {
                const activeCurve = this._curves.filter((c) => c.color === activeChannel)[0];

                if (activeCurve) {
                    propertyFilter = activeCurve.property;
                }
            }

            let keys = animation.getKeys();
            // Only keep selected keys, the previous sibling to the first key, and the next sibling of the last key
            if (this.props.context.activeKeyPoints && this.props.context.activeKeyPoints.length > 0) {
                const newKeys = [];

                for (let i = 0; i < this.props.context.activeKeyPoints.length; i++) {
                    const keyPoint = this.props.context.activeKeyPoints[i];
                    if (keyPoint.props.curve.animation === animation) {
                        newKeys.push(keys[keyPoint.props.keyId]);
                        if (i === 0 && keyPoint.props.keyId >= 1) {
                            newKeys.unshift(keys[keyPoint.props.keyId - 1]);
                        }
                        if (i === this.props.context.activeKeyPoints.length - 1 && keyPoint.props.keyId < keys.length - 1) {
                            newKeys.push(keys[keyPoint.props.keyId + 1]);
                        }
                    }
                }

                keys = newKeys;
            }

            if (keys.length === 0) {
                continue;
            }

            const values = this._extractValuesFromKeys(keys, animation.dataType, undefined, propertyFilter);

            minValue = Math.min(minValue, values.min);
            maxValue = Math.max(maxValue, values.max);

            minFrame = Math.min(minFrame, keys[0].frame);
            maxFrame = Math.max(maxFrame, keys[keys.length - 1].frame);

            hasRange = true;
        }

        if (!hasRange) {
            return;
        }

        this._minFrame = minFrame;
        this._maxFrame = maxFrame;

        this._minValue = minValue;
        this._maxValue = maxValue;

        this.props.context.referenceMinFrame = this._minFrame;
        this.props.context.referenceMaxFrame = this._maxFrame;

        const frameConvert = Math.abs(this._convertX(this._maxFrame) - this._convertX(this._minFrame)) + this._offsetX * 2;
        const valueConvert = this._minValue !== this._maxValue ? Math.abs(this._convertY(this._minValue) - this._convertY(this._maxValue)) + this._offsetY * 2 : 1;

        const scaleWidth = frameConvert / this._viewCurveWidth;
        const scaleHeight = valueConvert / this._viewHeight;

        this._viewScale = scaleWidth * this._viewHeight < valueConvert ? scaleHeight : scaleWidth;

        this.props.context.onGraphMoved.notifyObservers(this._offsetX);
        this.props.context.onGraphScaled.notifyObservers(this._viewScale);
    }

    private _dropKeyFrames(curve: Curve) {
        return curve.keys.map((key, i) => {
            const x = this._convertX(key.frame);
            const y = this._convertY(key.value);

            return (
                <KeyPointComponent
                    x={x}
                    y={y}
                    context={this.props.context}
                    scale={this._viewScale}
                    getPreviousX={() => (i > 0 ? this._convertX(curve.keys[i - 1].frame) : null)}
                    getNextX={() => (i < curve.keys.length - 1 ? this._convertX(curve.keys[i + 1].frame) : null)}
                    channel={curve.color}
                    keyId={i}
                    curve={curve}
                    key={"curve-" + i}
                    invertX={(x) => this._invertX(x)}
                    invertY={(y) => this._invertY(y)}
                    convertX={(x) => this._convertX(x)}
                    convertY={(y) => this._convertY(y)}
                    onFrameValueChanged={(value) => {
                        curve.updateKeyFrame(i, value);
                        this.props.context.refreshTarget();
                    }}
                    onKeyValueChanged={(value) => {
                        curve.updateKeyValue(i, value);
                        this.props.context.refreshTarget();
                    }}
                />
            );
        });
    }

    private _onPointerDown(evt: React.PointerEvent<HTMLDivElement>) {
        if ((evt.nativeEvent.target as any).id !== "svg-graph-curves") {
            return;
        }

        evt.preventDefault();

        this._pointerIsDown = true;
        evt.currentTarget.setPointerCapture(evt.pointerId);
        this._sourcePointerX = evt.nativeEvent.offsetX;
        this._sourcePointerY = evt.nativeEvent.offsetY;

        const isMiddleButton = evt.nativeEvent.which == 2 || evt.button == 4;
        this._inSelectionMode = !isMiddleButton && !evt.altKey;

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
            const style = this._selectionRectangle.current!.style;
            style.visibility = "visible";

            const localX = evt.nativeEvent.offsetX;
            const localY = evt.nativeEvent.offsetY;

            if (localX > this._selectionStartX) {
                style.left = `${this._selectionStartX}px`;
                style.width = `${localX - this._selectionStartX}px`;
            } else {
                style.left = `${localX}px`;
                style.width = `${this._selectionStartX - localX}px`;
            }

            if (localY > this._selectionStartY) {
                style.top = `${this._selectionStartY}px`;
                style.height = `${localY - this._selectionStartY}px`;
            } else {
                style.top = `${localY}px`;
                style.height = `${this._selectionStartY - localY}px`;
            }
            if (localX !== this._selectionStartX || localY !== this._selectionStartY) {
                this._selectionMade = true;
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

        if (!this._inSelectionMode || !this._selectionMade) {
            this.props.context.clearSelection();
        }

        this._selectionMade = false;
    }

    private _onWheel(evt: React.WheelEvent) {
        const delta = evt.deltaY < 0 ? -0.05 : 0.05;

        const oldScale = this._viewScale;
        this._viewScale = Math.min(Math.max(this._minScale, this._viewScale + delta * this._viewScale), this._maxScale);

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

    public override render() {
        const scale = this._viewScale;
        const viewBoxScalingCurves = `${-this._offsetX} ${-this._offsetY} ${Math.round(scale * this._viewCurveWidth)} ${Math.round(scale * this._viewHeight)}`;
        const viewBoxScalingGrid = `0 ${-this._offsetY} ${Math.round(scale * this._viewWidth)} ${Math.round(scale * this._viewHeight)}`;
        const viewBoxHorizontal = `${-this._offsetX} 0 ${Math.round((this._viewWidth - 40) * this._viewScale)}  ${Math.round(scale * this._viewHeight)}`;

        let activeBoxLeft = 0;
        let activeBoxRight = 0;
        if (this.props.context.activeAnimations.length !== 0) {
            const minFrame = this.props.context.referenceMinFrame;
            const maxFrame = this.props.context.referenceMaxFrame;

            activeBoxLeft = (((this.props.context.fromKey - minFrame) / (maxFrame - minFrame)) * this._graphAbsoluteWidth + this._offsetX) / this._viewScale;
            activeBoxRight = (((this.props.context.toKey - minFrame) / (maxFrame - minFrame)) * this._graphAbsoluteWidth + this._offsetX) / this._viewScale;
        }

        return (
            <div
                id="graph"
                onWheel={(evt) => this._onWheel(evt)}
                onPointerDown={(evt) => this._onPointerDown(evt)}
                onPointerMove={(evt) => this._onPointerMove(evt)}
                onPointerUp={(evt) => this._onPointerUp(evt)}
            >
                {this.props.context.activeAnimations.length !== 0 && (
                    <div
                        id="dark-rectangle"
                        style={{
                            left: activeBoxLeft + "px",
                            width: activeBoxRight - activeBoxLeft + "px",
                        }}
                    />
                )}
                <div id="block-rectangle" />
                <svg id="svg-graph-grid" viewBox={viewBoxScalingGrid} ref={this._svgHost}>
                    {this._buildYAxis()}
                </svg>
                <svg id="svg-graph-horizontal" viewBox={viewBoxHorizontal}>
                    {this._buildFrameIntervalAxis()}
                </svg>
                <svg ref={this._svgHost2} id="svg-graph-curves" tabIndex={0} viewBox={viewBoxScalingCurves}>
                    {this._curves.map((c, i) => {
                        return <CurveComponent key={i} context={this.props.context} curve={c} convertX={(x) => this._convertX(x)} convertY={(y) => this._convertY(y)} />;
                    })}
                    {this._curves.map((c) => {
                        return this._dropKeyFrames(c);
                    })}
                </svg>
                <div ref={this._selectionRectangle} id="selection-rectangle"></div>
            </div>
        );
    }
}
