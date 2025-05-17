/* eslint-disable no-console */
import type {
    RawFillShape,
    RawGradientFillShape,
    RawGraphicElement,
    RawGroupShape,
    RawPathShape,
    RawLottieAnimation,
    RawLottieLayer,
    RawTransform,
    RawRectangleShape,
    RawScalarProperty,
    RawTransformShape,
    RawVectorKeyframe,
    RawVectorProperty,
} from "./types/rawLottie";
import type { LottieAnimation, LottieSprite, ScalarKeyframe, ScalarProperty, Transform, Vector2Keyframe, Vector2Property } from "./types/processedLottie";
import { Vector2 } from "core/Maths";
import { BezierCurveEase } from "core/Animations";

/**
 * Class responsible for parsing lottie data
 */
export class LottieParser {
    private _rawData: RawLottieAnimation;
    private _processedData: LottieAnimation;
    private _errors = new Array<string>();

    /**
     * Creates an instance of LottieParser.
     * @param definitionData - The lottie definition data as a string.
     */
    public constructor(definitionData: string) {
        this._rawData = JSON.parse(definitionData) as RawLottieAnimation;
    }

    /**
     * Logs either the processsed lottie object or the errors found during parsing.
     */
    public printProcessingReport(): void {
        if (this._errors.length === 0) {
            console.log("LottieParser: No errors found. Processed lottie object:");
            console.log(this._processedData);
            return;
        }

        console.log("LottieParser errors:");
        for (const error of this._errors) {
            console.log(error);
        }
    }

    /**
     * Processes the loaded Lottie data.
     */
    public processLottieData(): void {
        this._processedData = {
            startFrame: this._rawData.ip,
            endFrame: this._rawData.op,
            frameRate: this._rawData.fr,
            layers: new Array(this._rawData.layers.length),
        };

        for (let i = 0; i < this._rawData.layers.length; i++) {
            const layer = this._rawData.layers[i];
            this._processLottieLayerData(i, layer);
        }
    }

    private _processLottieLayerData(index: number, layer: RawLottieLayer): void {
        if (layer.ty !== 3 && layer.ty !== 4) {
            this._errors.push(`Layer ${layer.ind} - ${layer.nm} is not a null or shape layer`);
            return;
        }

        this._processedData.layers[index] = {
            parent: layer.parent,
            hidden: layer.ip === undefined,
            inFrame: layer.ip ?? 0,
            outFrame: layer.op ?? 0,
            startTime: layer.st ?? 0,
            timeStretch: layer.sr ?? 1,
            autoOrient: layer.ao === 1,
            transform: this._processLottieTransform(layer.ks),
            shapes: this._processLottieShapes(layer.shapes),
        };
    }

    private _processLottieShapes(shapes: RawGraphicElement[] | undefined): LottieSprite[] | undefined {
        if (!shapes) {
            return undefined;
        }

        const sprites = new Array<LottieSprite>();
        for (const shape of shapes) {
            if (shape.ty === "gr") {
                const sprite = this._processGroupShape(shape as RawGroupShape);
                if (sprite) {
                    sprites.push(sprite);
                }
            } else {
                this._errors.push(`Only groups (gr) are supported as top level shapes from a layer. Shape ${shape.nm} is of type ${shape.ty} instead`);
                continue;
            }
        }

        return sprites;
    }

    private _processGroupShape(group: RawGroupShape): LottieSprite | undefined {
        if (!group.it) {
            this._errors.push(`Group ${group.nm} has no shapes`);
            return undefined;
        }

        const sprite: LottieSprite = {
            hidden: group.hd ?? false,
            uvStart: new Vector2(0, 0),
            uvEnd: new Vector2(1, 1),
            transform: undefined,
            child: undefined,
        };

        for (const shape of group.it) {
            if (shape.ty === "gr") {
                sprite.child = this._processGroupShape(shape as RawGroupShape);
            } else if (shape.ty === "tr") {
                sprite.transform = this._processLottieTransformShape(shape as RawTransformShape);
            } else if (shape.ty === "sh") {
                this._validatePathShape(shape as RawPathShape);
            } else if (shape.ty === "rc") {
                this._validateRectangleShape(shape as RawRectangleShape);
            } else if (shape.ty === "fl") {
                this._validateFillShape(shape as RawFillShape);
            } else if (shape.ty === "gf") {
                this._validateGradientFillShape(shape as RawGradientFillShape);
            } else {
                this._errors.push(`Shape ${shape.nm} is of type ${shape.ty} which is not supported`);
            }
        }

        return sprite;
    }

    private _processLottieTransform(transform: RawTransform): Transform {
        return {
            opacity: this._fromLottieScalarToBabylonScalar(transform.o),
            rotation: this._fromLottieScalarToBabylonScalar(transform.r),
            scale: this._fromLottieVector2ToBabylonVector2(transform.s),
            position: this._fromLottieVector2ToBabylonVector2(transform.p),
            anchorPoint: this._fromLottieVector2ToBabylonVector2(transform.a),
        };
    }

    private _processLottieTransformShape(transform: RawTransformShape): Transform {
        return {
            opacity: this._fromLottieScalarToBabylonScalar(transform.o),
            rotation: this._fromLottieScalarToBabylonScalar(transform.r),
            scale: this._fromLottieVector2ToBabylonVector2(transform.s),
            position: this._fromLottieVector2ToBabylonVector2(transform.p),
            anchorPoint: this._fromLottieVector2ToBabylonVector2(transform.a),
        };
    }

    private _fromLottieScalarToBabylonScalar(property: RawScalarProperty | undefined): ScalarProperty | undefined {
        if (!property) {
            return undefined;
        }

        if (property.a === 0) {
            return {
                startValue: property.k as number,
            };
        }

        const keyframes: ScalarKeyframe[] = [];
        const rawKeyFrames = property.k as RawVectorKeyframe[];
        for (let i = 0; i < rawKeyFrames.length; i++) {
            let easeFunction: BezierCurveEase | undefined = undefined;
            if (rawKeyFrames[i].i !== undefined && rawKeyFrames[i].o !== undefined) {
                easeFunction = new BezierCurveEase(rawKeyFrames[i].i!.x[0], rawKeyFrames[i].i!.y[0], rawKeyFrames[i].o!.x[0], rawKeyFrames[i].o!.y[0]);
            }

            keyframes.push({
                value: rawKeyFrames[i].s[0],
                time: rawKeyFrames[i].t,
                easeFunction,
            });
        }

        return {
            startValue: rawKeyFrames[0].s[0],
            keyframes: keyframes,
        };
    }

    private _fromLottieVector2ToBabylonVector2(property: RawVectorProperty | undefined): Vector2Property | undefined {
        if (!property) {
            return undefined;
        }

        if (property.l !== undefined && property.l !== 2) {
            this._errors.push(`Vector2 property has an invalid number of components. Expected 2, got ${property.l}`);
            return undefined;
        }

        if (property.a === 0) {
            const values = property.k as number[];
            return {
                startValue: new Vector2(values[0], values[1]),
            };
        }

        const keyframes: Vector2Keyframe[] = [];
        const rawKeyFrames = property.k as RawVectorKeyframe[];
        for (let i = 0; i < rawKeyFrames.length; i++) {
            let easeFunction1: BezierCurveEase | undefined = undefined;
            if (rawKeyFrames[i].i !== undefined && rawKeyFrames[i].o !== undefined) {
                easeFunction1 = new BezierCurveEase(rawKeyFrames[i].i!.x[0], rawKeyFrames[i].i!.y[0], rawKeyFrames[i].o!.x[0], rawKeyFrames[i].o!.y[0]);
            }

            let easeFunction2: BezierCurveEase | undefined = undefined;
            if (rawKeyFrames[i].i !== undefined && rawKeyFrames[i].o !== undefined) {
                easeFunction2 = new BezierCurveEase(rawKeyFrames[i].i!.x[1], rawKeyFrames[i].i!.y[1], rawKeyFrames[i].o!.x[1], rawKeyFrames[i].o!.y[1]);
            }

            keyframes.push({
                value: new Vector2(rawKeyFrames[i].s[0], rawKeyFrames[i].s[1]),
                time: rawKeyFrames[i].t,
                easeFunction1,
                easeFunction2,
            });
        }

        return {
            startValue: new Vector2(rawKeyFrames[0].s[0], rawKeyFrames[0].s[1]),
            keyframes: keyframes,
        };
    }

    private _validatePathShape(shape: RawPathShape): void {
        if (shape.ks.a === 1) {
            this._errors.push(`Path ${shape.nm} has an animated path which is not supported`);
        }
    }

    private _validateRectangleShape(shape: RawRectangleShape): void {
        if (shape.p.a === 1) {
            this._errors.push(`Rectangle ${shape.nm} has an position property that is animated which is not supported`);
        }

        if (shape.s.a === 1) {
            this._errors.push(`Rectangle ${shape.nm} has a size property that is animated which is not supported`);
        }

        if (shape.r.a === 1) {
            this._errors.push(`Rectangle ${shape.nm} has a rounded corners property that is animated which is not supported`);
        }
    }

    private _validateFillShape(shape: RawFillShape) {
        if (shape.o.a === 1) {
            this._errors.push(`Fill ${shape.nm} has an opacity property that is animated which is not supported`);
        }

        if (shape.c.a === 1) {
            this._errors.push(`Fill ${shape.nm} has a color property that is animated which is not supported`);
        }
    }

    private _validateGradientFillShape(shape: RawGradientFillShape) {
        if (shape.o.a === 1) {
            this._errors.push(`Gradient fill ${shape.nm} has an opacity property that is animated which is not supported`);
        }

        if (shape.s.a === 1) {
            this._errors.push(`Gradient fill ${shape.nm} has a start point property that is animated which is not supported`);
        }

        if (shape.e.a === 1) {
            this._errors.push(`Gradient fill ${shape.nm} has an end point property that is animated which is not supported`);
        }
    }
}
