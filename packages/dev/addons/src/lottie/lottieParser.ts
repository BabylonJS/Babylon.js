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
import {
    LayerUnsuportedType,
    PropertyInvalidVector2Length,
    ShapeAnimatedPathProperty,
    ShapeUnsupportedChildType,
    ShapeUnsupportedTopLevelType,
    type LottieAnimation,
    type LottieLayer,
    type LottieSprite,
    type ScalarKeyframe,
    type ScalarProperty,
    type Transform,
    type Vector2Keyframe,
    type Vector2Property,
} from "./types/processedLottie";
import { Color3, Vector2 } from "core/Maths";
import { BezierCurveEase } from "core/Animations";
import { Mesh, MeshBuilder, TransformNode } from "core/Meshes";
import { StandardMaterial, Texture } from "core/Materials";

type Textures = {
    copilot: Texture;
    excel: Texture;
    m365: Texture;
    oneDrive: Texture;
    oneNote: Texture;
    outlook: Texture;
    powerPoint: Texture;
    swirl: Texture;
    word: Texture;
};

/**
 * Class responsible for parsing lottie data
 */
export class LottieParser {
    private _processedData: LottieAnimation;
    private _errors = new Array<string>();
    private _zIndex = 0;
    private _textures: Textures | undefined;

    /**
     * Creates an instance of LottieParser.
     */
    public constructor() {}

    /**
     * Gets the processed Lottie animation data, if available.
     */
    public get animation(): LottieAnimation | undefined {
        return this._processedData;
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
     * @param lottieAsJsonString - The lottie definition data as a string.
     * @param textures - The textures to use for the lottie animation.
     */
    public processLottieData(lottieAsJsonString: string, textures: Textures): void {
        const rawData = JSON.parse(lottieAsJsonString) as RawLottieAnimation;
        this._textures = textures;

        this._processedData = {
            startFrame: rawData.ip,
            endFrame: rawData.op,
            frameRate: rawData.fr,
            layers: new Map<number, LottieLayer>(),
        };

        // Create a map of all the layers by their index
        for (let i = 0; i < rawData.layers.length; i++) {
            this._processLottieLayer(rawData.layers[i]);
        }

        // Create parent-child relationships between layers to have the right transforms
        for (const layer of this._processedData.layers.values()) {
            if (layer.parentIndex === undefined) {
                continue;
            }

            const parentLayer = this._processedData.layers.get(layer.parentIndex);
            if (parentLayer) {
                layer.node.parent = parentLayer.node; // Set the Babylon node parent
            }
        }
    }

    private _processLottieLayer(rawLayer: RawLottieLayer): void {
        if (rawLayer.ty !== 3 && rawLayer.ty !== 4) {
            this._errors.push(`${LayerUnsuportedType} - Index: ${rawLayer.ind} Name: ${rawLayer.nm} Type: ${rawLayer.ty}`);
            return;
        }

        // Ignore invisible layers
        if (rawLayer.ip === 1) {
            return;
        }

        const transform = this._processLottieTransform(rawLayer.ks);

        const newLayer: LottieLayer = {
            name: rawLayer.nm ?? "No name",
            parentIndex: rawLayer.parent,
            index: rawLayer.ind!,
            isVisible: true,
            inFrame: rawLayer.ip ?? 0,
            outFrame: rawLayer.op ?? 0,
            startTime: rawLayer.st ?? 0,
            timeStretch: rawLayer.sr ?? 1,
            autoOrient: rawLayer.ao === 1,
            transform: transform,
            node:
                (rawLayer.shapes?.length ?? 0) === 0 ? new TransformNode(`Layer - ${rawLayer.nm}`) : MeshBuilder.CreatePlane(`Layer - ${rawLayer.nm}`, { height: 100, width: 100 }),
        };

        this._processedData.layers.set(newLayer.index, newLayer);

        newLayer.node.position.x = transform.position?.startValue.x ?? 0;
        newLayer.node.position.y = transform.position?.startValue.y ?? 0;
        newLayer.node.position.z = this._zIndex;
        this._zIndex += 0.1; // Increment zIndex for each layer

        newLayer.node.rotation.z = ((transform.rotation?.startValue ?? 0) * Math.PI) / 180;

        newLayer.node.scaling.x = (transform.scale?.startValue.x ?? 100) / 100;
        newLayer.node.scaling.y = (transform.scale?.startValue.y ?? 100) / 100;

        if (newLayer.node instanceof Mesh) {
            newLayer.node.isVisible = false;

            const material = new StandardMaterial("myMaterial");
            const texture = this._mapTexture(rawLayer.nm);
            if (texture) {
                material.diffuseTexture = texture;
            } else {
                material.diffuseColor = new Color3(Math.random(), Math.random(), Math.random());
            }

            newLayer.node.material = material;
        }

        this._processLottieShapes(newLayer, rawLayer.shapes);
    }

    private _mapTexture(rawName: string | undefined): Texture | undefined {
        if (rawName === undefined || !this._textures) {
            return undefined;
        }

        if (rawName === "Copilot 01") {
            return this._textures.copilot;
        } else if (rawName === "Excel 2") {
            return this._textures.excel;
        } else if (rawName === "M_plate 2") {
            return this._textures.m365;
        } else if (rawName === "OneDrive 2") {
            return this._textures.oneDrive;
        } else if (rawName === "One") {
            return this._textures.oneNote;
        } else if (rawName === "Out") {
            return this._textures.outlook;
        } else if (rawName === "P") {
            return this._textures.powerPoint;
        } else if (rawName === "Harmon 2") {
            return this._textures.swirl;
        } else if (rawName === "Word 2") {
            return this._textures.word;
        }

        return undefined;
    }

    private _processLottieShapes(parent: LottieLayer, shapes: RawGraphicElement[] | undefined): LottieSprite[] | undefined {
        if (!shapes) {
            return undefined;
        }

        const sprites = new Array<LottieSprite>();
        for (const shape of shapes) {
            if (shape.hd === true) {
                continue; // Ignore hidden shapes
            }

            if (shape.ty === "gr") {
                const sprite = this._processGroupShape(shape as RawGroupShape);
                if (sprite) {
                    sprites.push(sprite);
                }
            } else {
                this._errors.push(`${ShapeUnsupportedTopLevelType} - Name: ${shape.nm} Type: ${shape.ty}`);
                continue;
            }
        }

        return sprites;
    }

    private _processGroupShape(group: RawGroupShape): LottieSprite | undefined {
        if (!group.it) {
            return undefined;
        }

        if (group.hd === true) {
            return undefined;
        }

        const sprite: LottieSprite = {
            isVisible: true,
            transform: undefined,
            child: undefined,
        };

        for (const shape of group.it) {
            if (shape.ty === "gr") {
                sprite.child = this._processGroupShape(shape as RawGroupShape);
            } else if (shape.ty === "tr") {
                const transform = this._processLottieTransformShape(shape as RawTransformShape);
                sprite.transform = transform;

                // We do not support animated transforms
                this._validateNonAnimatedTransform(sprite.transform);
            } else if (shape.ty === "sh") {
                this._validatePathShape(shape as RawPathShape);
            } else if (shape.ty === "rc") {
                this._validateRectangleShape(shape as RawRectangleShape);
            } else if (shape.ty === "fl") {
                this._validateFillShape(shape as RawFillShape);
            } else if (shape.ty === "gf") {
                this._validateGradientFillShape(shape as RawGradientFillShape);
            } else {
                this._errors.push(`${ShapeUnsupportedChildType} - Name: ${shape.nm} Type: ${shape.ty}`);
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
        let i = 0;
        for (i = 0; i < rawKeyFrames.length; i++) {
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

        // DEBUGGING - Add one extra keyframe at the end to make sure the animation reaches the end value
        keyframes.push({
            value: rawKeyFrames[i - 1].s[0],
            time: rawKeyFrames[i - 1].t + 1,
            easeFunction: keyframes[i - 2].easeFunction,
        });

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
            this._errors.push(`${PropertyInvalidVector2Length} - Length: ${property.l}`);
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
        let i = 0;
        for (i = 0; i < rawKeyFrames.length; i++) {
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

        // DEBUGGING - Add one extra keyframe at the end to make sure the animation reaches the end value
        keyframes.push({
            value: new Vector2(rawKeyFrames[i - 1].s[0], rawKeyFrames[i - 1].s[1]),
            time: rawKeyFrames[i - 1].t + 1,
            easeFunction1: keyframes[i - 2].easeFunction1,
            easeFunction2: keyframes[i - 2].easeFunction2,
        });

        return {
            startValue: new Vector2(rawKeyFrames[0].s[0], rawKeyFrames[0].s[1]),
            keyframes: keyframes,
        };
    }

    private _validateNonAnimatedTransform(transform: Transform | undefined): void {
        if (!transform) {
            return;
        }

        if (transform.anchorPoint?.keyframes?.length ?? 0 > 0) {
            this._errors.push(`Transform anchor point is animated which is not supported`);
        }

        if (transform.position?.keyframes?.length ?? 0 > 0) {
            this._errors.push(`Transform position is animated which is not supported`);
        }

        if (transform.rotation?.keyframes?.length ?? 0 > 0) {
            this._errors.push(`Transform rotation is animated which is not supported`);
        }

        if (transform.scale?.keyframes?.length ?? 0 > 0) {
            this._errors.push(`Transform scale is animated which is not supported`);
        }

        if (transform.opacity?.keyframes?.length ?? 0 > 0) {
            this._errors.push(`Transform opacity is animated which is not supported`);
        }
    }
    private _validatePathShape(shape: RawPathShape): void {
        if (shape.ks.a === 1) {
            this._errors.push(`${ShapeAnimatedPathProperty} - Name: ${shape.nm}`);
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
