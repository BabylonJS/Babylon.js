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
    type VectorType,
    type LottieAnimation,
    type LottieLayer,
    type LottieSprite,
    type ScalarKeyframe,
    type ScalarProperty,
    type Transform,
    type Vector2Keyframe,
    type Vector2Property,
} from "./types/processedLottie";
import { Color3, Vector2, Vector3 } from "core/Maths";
import { BezierCurveEase } from "core/Animations";
import { MeshBuilder, TransformNode } from "core/Meshes";
import { StandardMaterial, type Texture } from "core/Materials";

const BaseSize = 35; // Base size for the plane mesh, can be adjusted as needed

type SpriteData = {
    size: Vector2;
    scaling: number;
    texture: Texture;
};

/**
 * Class responsible for parsing lottie data
 */
export class LottieParser {
    private _processedData: LottieAnimation;
    private _errors = new Array<string>();
    private _zIndex = 0;
    private _spritesData: Map<string, SpriteData> | undefined = undefined;

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
        }

        console.log("LottieParser errors:");
        for (const error of this._errors) {
            console.log(error);
        }

        console.log("Processed data:");
        console.log(this._processedData);
    }

    /**
     * Processes the loaded Lottie data.
     * @param lottieAsJsonString - The lottie definition data as a string.
     * @param spritesData - Data for each sprite
     */
    public processLottieData(lottieAsJsonString: string, spritesData: Map<string, SpriteData>): void {
        this._errors.length = 0; // Clear previous errors
        this._spritesData = spritesData;
        const rawData = JSON.parse(lottieAsJsonString) as RawLottieAnimation;

        this._processedData = {
            startFrame: rawData.ip,
            endFrame: rawData.op,
            frameRate: rawData.fr,
            layers: new Map<number, LottieLayer>(),
            size: new Vector2(rawData.w, rawData.h),
        };

        // Bounds of the animation for testing
        const background = MeshBuilder.CreatePlane(`Animation bounds`, { height: rawData.h, width: rawData.w });
        background.position = new Vector3(rawData.w / 2, -rawData.h / 2, 0.1); // Position the background slightly behind the layers

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
                layer.nodeTrs!.parent = parentLayer.nodeAnchor!; // Set the Babylon node parent
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
            isVisible: false,
            inFrame: rawLayer.ip ?? 0,
            outFrame: rawLayer.op ?? 0,
            startTime: rawLayer.st ?? 0,
            timeStretch: rawLayer.sr ?? 1,
            autoOrient: rawLayer.ao === 1,
            transform: transform,
        };

        this._processedData.layers.set(newLayer.index, newLayer);

        newLayer.nodeTrs = new TransformNode(`TRS - ${rawLayer.nm}`);

        newLayer.nodeTrs.position.x = transform.position?.startValue.x ?? 0;
        newLayer.nodeTrs.position.y = transform.position?.startValue.y ?? 0;
        newLayer.nodeTrs.position.z = this._zIndex;
        this._zIndex -= 0.1; // Increment zIndex for each layer

        newLayer.nodeTrs.rotation.z = ((transform.rotation?.startValue ?? 0) * Math.PI) / 180;

        newLayer.nodeTrs.scaling.x = (transform.scale?.startValue.x ?? 100) / 100;
        newLayer.nodeTrs.scaling.y = (transform.scale?.startValue.y ?? 100) / 100;

        if ((rawLayer.shapes?.length ?? 0) !== 0) {
            const size = this._mapSize(newLayer.name);
            const scale = this._mapScale(newLayer.name);
            const mesh = MeshBuilder.CreatePlane(`Anchor with Sprite - ${rawLayer.nm}`, { height: size.y * scale, width: size.x * scale });

            mesh.isVisible = false;

            const material = new StandardMaterial("myMaterial");
            const texture = this._mapTexture(newLayer.name);
            if (texture) {
                material.diffuseTexture = texture;
            } else {
                material.diffuseColor = new Color3(Math.random(), Math.random(), Math.random());
            }

            mesh.material = material;

            newLayer.nodeAnchor = mesh;
            newLayer.nodeAnchor.position.x = transform.anchorPoint?.startValue.x ?? 0;
            newLayer.nodeAnchor.position.y = transform.anchorPoint?.startValue.y ?? 0;
            newLayer.nodeAnchor.position.z = 0; // Anchor position is always at z=0
        } else {
            newLayer.nodeAnchor = new TransformNode(`Anchor - ${rawLayer.nm}`);
            newLayer.nodeAnchor.position.x = transform.anchorPoint?.startValue.x ?? 0;
            newLayer.nodeAnchor.position.y = transform.anchorPoint?.startValue.y ?? 0;
            newLayer.nodeAnchor.position.z = 0; // Anchor position is always at z=0
        }

        newLayer.nodeAnchor.parent = newLayer.nodeTrs; // Set the anchor as a child of the TRS node

        this._processLottieShapes(newLayer, rawLayer.shapes);
    }

    private _mapSize(layerName: string): Vector2 {
        if (!this._spritesData) {
            return new Vector2(BaseSize, BaseSize);
        }

        return this._spritesData.get(layerName)?.size ?? new Vector2(BaseSize, BaseSize);
    }

    private _mapScale(layerName: string): number {
        if (!this._spritesData) {
            return 1;
        }

        return this._spritesData.get(layerName)?.scaling ?? 1;
    }

    private _mapTexture(layerName: string): Texture | undefined {
        if (!this._spritesData) {
            return undefined;
        }

        return this._spritesData.get(layerName)?.texture;
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
            scale: this._fromLottieVector2ToBabylonVector2(transform.s, "Scale"),
            position: this._fromLottieVector2ToBabylonVector2(transform.p, "Position"),
            anchorPoint: this._fromLottieVector2ToBabylonVector2(transform.a, "AnchorPoint"),
        };
    }

    private _processLottieTransformShape(transform: RawTransformShape): Transform {
        return {
            opacity: this._fromLottieScalarToBabylonScalar(transform.o),
            rotation: this._fromLottieScalarToBabylonScalar(transform.r),
            scale: this._fromLottieVector2ToBabylonVector2(transform.s, "Scale"),
            position: this._fromLottieVector2ToBabylonVector2(transform.p, "Position"),
            anchorPoint: this._fromLottieVector2ToBabylonVector2(transform.a, "AnchorPoint"),
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
            if (rawKeyFrames[i].o !== undefined && rawKeyFrames[i].i !== undefined) {
                if (Array.isArray(rawKeyFrames[i].o!.x)) {
                    // Value is an array
                    easeFunction = new BezierCurveEase(
                        (rawKeyFrames[i].o!.x as number[])[0],
                        (rawKeyFrames[i].o!.y as number[])[0],
                        (rawKeyFrames[i].i!.x as number[])[0],
                        (rawKeyFrames[i].i!.y as number[])[0]
                    );
                } else {
                    // Value is a number
                    easeFunction = new BezierCurveEase(
                        rawKeyFrames[i].o!.x as number,
                        rawKeyFrames[i].o!.y as number,
                        rawKeyFrames[i].i!.x as number,
                        rawKeyFrames[i].i!.y as number
                    );
                }
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

    private _fromLottieVector2ToBabylonVector2(property: RawVectorProperty | undefined, vectorType: VectorType): Vector2Property | undefined {
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
                startValue: this._calculateFinalVector(values[0], values[1], vectorType),
            };
        }

        const keyframes: Vector2Keyframe[] = [];
        const rawKeyFrames = property.k as RawVectorKeyframe[];
        let i = 0;
        for (i = 0; i < rawKeyFrames.length; i++) {
            let easeFunction1: BezierCurveEase | undefined = undefined;
            if (rawKeyFrames[i].o !== undefined && rawKeyFrames[i].i !== undefined) {
                if (Array.isArray(rawKeyFrames[i].o!.x)) {
                    // Value is an array
                    easeFunction1 = new BezierCurveEase(
                        (rawKeyFrames[i].o!.x as number[])[0],
                        (rawKeyFrames[i].o!.y as number[])[0],
                        (rawKeyFrames[i].i!.x as number[])[0],
                        (rawKeyFrames[i].i!.y as number[])[0]
                    );
                } else {
                    // Value is a number
                    easeFunction1 = new BezierCurveEase(
                        rawKeyFrames[i].o!.x as number,
                        rawKeyFrames[i].o!.y as number,
                        rawKeyFrames[i].i!.x as number,
                        rawKeyFrames[i].i!.y as number
                    );
                }
            }

            let easeFunction2: BezierCurveEase | undefined = undefined;
            if (rawKeyFrames[i].o !== undefined && rawKeyFrames[i].i !== undefined) {
                if (Array.isArray(rawKeyFrames[i].o!.x)) {
                    // Value is an array
                    easeFunction2 = new BezierCurveEase(
                        (rawKeyFrames[i].o!.x as number[])[1],
                        (rawKeyFrames[i].o!.y as number[])[1],
                        (rawKeyFrames[i].i!.x as number[])[1],
                        (rawKeyFrames[i].i!.y as number[])[1]
                    );
                } else {
                    // Value is a number
                    easeFunction2 = new BezierCurveEase(
                        rawKeyFrames[i].o!.x as number,
                        rawKeyFrames[i].o!.y as number,
                        rawKeyFrames[i].i!.x as number,
                        rawKeyFrames[i].i!.y as number
                    );
                }
            }

            keyframes.push({
                value: this._calculateFinalVector(rawKeyFrames[i].s[0], rawKeyFrames[i].s[1], vectorType),
                time: rawKeyFrames[i].t,
                easeFunction1,
                easeFunction2,
            });
        }

        // DEBUGGING - Add one extra keyframe at the end to make sure the animation reaches the end value
        // keyframes.push({
        //     value: this._calculateFinalVector(rawKeyFrames[i - 1].s[0], rawKeyFrames[i - 1].s[1], vectorType),
        //     time: rawKeyFrames[i - 1].t + 1,
        //     easeFunction1: keyframes[i - 2].easeFunction1,
        //     easeFunction2: keyframes[i - 2].easeFunction2,
        // });

        return {
            startValue: this._calculateFinalVector(rawKeyFrames[0].s[0], rawKeyFrames[0].s[1], vectorType),
            keyframes: keyframes,
        };
    }
    private _calculateFinalVector(x: number, y: number, vectorType: string) {
        const result = new Vector2(x, y);

        if (vectorType === "Position") {
            // Lottie uses a different coordinate system for position, so we need to invert the Y value
            result.y = -result.y;
        } else if (vectorType === "AnchorPoint") {
            // Lottie uses a different coordinate system for anchor point, so we need to invert the X value
            result.x = -result.x;
        }

        return result;
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
