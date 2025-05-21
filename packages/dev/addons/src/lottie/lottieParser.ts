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
import type { LottieAnimation, LottieLayer, LottieSprite, ScalarKeyframe, ScalarProperty, Transform, Vector2Keyframe, Vector2Property } from "./types/processedLottie";
import { Color3, Vector2 } from "core/Maths";
import { BezierCurveEase } from "core/Animations";
import { MeshBuilder } from "core/Meshes";
import { StandardMaterial } from "core/Materials";

/**
 * Class responsible for parsing lottie data
 */
export class LottieParser {
    private _processedData: LottieAnimation;
    private _errors = new Array<string>();
    private _zIndex = 0;

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
     */
    public processLottieData(lottieAsJsonString: string): void {
        const rawData = JSON.parse(lottieAsJsonString) as RawLottieAnimation;
        this._processedData = {
            startFrame: rawData.ip,
            endFrame: rawData.op,
            frameRate: rawData.fr,
            layers: [],
        };

        // For now we only support two levels in the layer hierarchy
        // Process the top level layers (no parents)
        for (let i = 0; i < rawData.layers.length; i++) {
            const layer = rawData.layers[i];
            if (layer.parent === undefined) {
                this._processLottieParentLayerData(i, layer);
            }
        }

        // Now process the child layers and parent them
        for (let i = 0; i < rawData.layers.length; i++) {
            const layer = rawData.layers[i];
            if (layer.parent !== undefined) {
                this._processLottieChildLayerData(i, layer);
            }
        }
    }

    private _processLottieParentLayerData(index: number, rawLayer: RawLottieLayer): void {
        if (rawLayer.ty !== 3 && rawLayer.ty !== 4) {
            this._errors.push(`Layer ${rawLayer.ind} - ${rawLayer.nm} is not a null or shape layer`);
            return;
        }

        // Ignore invisible layers
        if (rawLayer.ip === 1) {
            return;
        }

        const transform = this._processLottieTransform(rawLayer.ks);

        const newLayer: LottieLayer = {
            name: rawLayer.nm ?? "No name", // DEBUGGING
            parent: undefined,
            index: rawLayer.ind,
            children: [],
            isVisible: true,
            inFrame: rawLayer.ip ?? 0,
            outFrame: rawLayer.op ?? 0,
            startTime: rawLayer.st ?? 0,
            timeStretch: rawLayer.sr ?? 1,
            autoOrient: rawLayer.ao === 1,
            transform: transform,
            localAnchorPoint: transform.anchorPoint?.startValue ?? new Vector2(0, 0),
            localPosition: transform.position?.startValue ?? new Vector2(0, 0),
            localRotation: transform.rotation?.startValue ?? 0,
            localScale: transform.scale?.startValue ?? new Vector2(1, 1),
            localOpacity: transform.opacity?.startValue ?? 1,
            sprites: undefined,
            mesh: MeshBuilder.CreatePlane(rawLayer.nm ?? "No name", { height: 100, width: 100 }), // DEBUGGING
        };

        const material = new StandardMaterial("myMaterial");
        material.diffuseColor = new Color3(Math.random(), Math.random(), Math.random());
        newLayer.mesh.material = material;

        newLayer.mesh.position.x = transform.position?.startValue.x ?? 0;
        newLayer.mesh.position.y = transform.position?.startValue.y ?? 0;
        newLayer.mesh.position.z = this._zIndex;
        this._zIndex += 0.1; // Increment zIndex for each layer

        newLayer.mesh.rotation.z = transform.rotation?.startValue ?? 0;
        newLayer.mesh.scaling.x = (transform.scale?.startValue.x ?? 100) / 100;
        newLayer.mesh.scaling.y = (transform.scale?.startValue.y ?? 100) / 100;

        newLayer.sprites = this._processLottieShapes(newLayer, rawLayer.shapes);
        this._processedData.layers.push(newLayer);
    }

    private _processLottieChildLayerData(index: number, rawLayer: RawLottieLayer): void {
        if (rawLayer.ty !== 3 && rawLayer.ty !== 4) {
            this._errors.push(`Layer ${rawLayer.ind} - ${rawLayer.nm} is not a null or shape layer`);
            return;
        }

        // Ignore invisible layers
        if (rawLayer.ip === 1) {
            return;
        }

        const transform = this._processLottieTransform(rawLayer.ks);

        const parentLayer = this._findParent(rawLayer.parent!);
        if (!parentLayer) {
            this._errors.push(`Layer index ${rawLayer.ind} has a parent ${rawLayer.parent} that is not a top level layer Layer. This is not supported`);
            return;
        }

        const childLayer: LottieLayer = {
            name: rawLayer.nm ?? "No name", // DEBUGGING
            parent: parentLayer,
            isVisible: true,
            inFrame: rawLayer.ip ?? 0,
            outFrame: rawLayer.op ?? 0,
            startTime: rawLayer.st ?? 0,
            timeStretch: rawLayer.sr ?? 1,
            autoOrient: rawLayer.ao === 1,
            transform: transform,
            localAnchorPoint: transform.anchorPoint?.startValue ?? new Vector2(0, 0),
            localPosition: transform.position?.startValue ?? new Vector2(0, 0),
            localRotation: transform.rotation?.startValue ?? 0,
            localScale: transform.scale?.startValue ?? new Vector2(1, 1),
            localOpacity: transform.opacity?.startValue ?? 1,
            sprites: undefined,
            mesh: MeshBuilder.CreatePlane(rawLayer.nm ?? "No name", { height: 100, width: 100 }), // DEBUGGING
        };

        const material = new StandardMaterial("myMaterial");
        material.diffuseColor = new Color3(Math.random(), Math.random(), Math.random());
        childLayer.mesh.material = material;

        childLayer.mesh.position.x = transform.position?.startValue.x ?? 0;
        childLayer.mesh.position.y = transform.position?.startValue.y ?? 0;
        childLayer.mesh.position.z = 0;

        childLayer.mesh.rotation.z = transform.rotation?.startValue ?? 0;
        childLayer.mesh.scaling.x = (transform.scale?.startValue.x ?? 100) / 100;
        childLayer.mesh.scaling.y = (transform.scale?.startValue.y ?? 100) / 100;

        childLayer.sprites = this._processLottieShapes(childLayer, rawLayer.shapes);
        // Add the child layer to the parent layer
        parentLayer.children!.push(childLayer);
    }

    private _findParent(parentIndex: number): LottieLayer | undefined {
        for (let i = 0; i < this._processedData.layers.length; i++) {
            const layer = this._processedData.layers[i];
            if (layer.index === parentIndex) {
                return layer;
            }
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
                const sprite = this._processGroupShape(parent, shape as RawGroupShape);
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

    private _processGroupShape(parent: LottieLayer | LottieSprite, group: RawGroupShape): LottieSprite | undefined {
        if (!group.it) {
            this._errors.push(`Group ${group.nm} has no shapes`);
            return undefined;
        }

        if (group.hd === true) {
            return undefined;
        }

        const sprite: LottieSprite = {
            parent: parent,
            isVisible: true,
            transform: undefined,
            child: undefined,
            mesh: MeshBuilder.CreatePlane(group.nm ?? "No name", { height: 100, width: 100 }),
        };

        // TESTING!
        const material = new StandardMaterial("myMaterial");
        material.diffuseColor = new Color3(Math.random(), Math.random(), Math.random());
        sprite.mesh.material = material;

        for (const shape of group.it) {
            if (shape.ty === "gr") {
                sprite.child = this._processGroupShape(sprite, shape as RawGroupShape);
            } else if (shape.ty === "tr") {
                const transform = this._processLottieTransformShape(shape as RawTransformShape);
                sprite.transform = transform;
                sprite.localAnchorPoint = transform.anchorPoint?.startValue ?? new Vector2(0, 0);
                sprite.localPosition = transform.position?.startValue ?? new Vector2(0, 0);
                sprite.localRotation = transform.rotation?.startValue ?? 0;
                sprite.localScale = transform.scale?.startValue ?? new Vector2(1, 1);
                sprite.localOpacity = transform.opacity?.startValue ?? 1;

                // TESTING!
                const localPosition = sprite.localPosition ?? new Vector2(0, 0);
                const parentPosition = /*sprite.parent.localPosition ??*/ new Vector2(0, 0);
                sprite.mesh.position.x = localPosition.x + parentPosition.x;
                sprite.mesh.position.y = localPosition.y + parentPosition.y;
                sprite.mesh.position.z = 0;

                sprite.mesh.rotation.z = transform.rotation?.startValue ?? 0;
                sprite.mesh.scaling.x = (transform.scale?.startValue.x ?? 100) / 100;
                sprite.mesh.scaling.y = (transform.scale?.startValue.y ?? 100) / 100;
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
