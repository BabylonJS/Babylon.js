import type { IVector2Like } from "core/Maths/math.like";
import { ThinSprite } from "core/Sprites/thinSprite";

import type {
    RawFillShape,
    RawGradientFillShape,
    RawGraphicElement,
    RawGroupShape,
    RawLottieAnimation,
    RawLottieLayer,
    RawPathShape,
    RawRectangleShape,
    RawScalarProperty,
    RawTransform,
    RawTransformShape,
    RawVectorKeyframe,
    RawVectorProperty,
} from "./rawTypes";
import type { AnimationInfo, ScalarKeyframe, ScalarProperty, Transform, Vector2Keyframe, Vector2Property } from "./parsedTypes";

import type { SpritePacker } from "../sprites/spritePacker";
import { SpriteNode } from "../sprites/spriteNode";

import { BezierCurve } from "../maths/bezier";

import type { RenderingManager } from "../rendering/renderingManager";
import { Node } from "../rendering/node";
import { ControlNode } from "../rendering/controlNode";

import type { AnimationConfiguration } from "../lottiePlayer";

/**
 * Type of the vector properties in the Lottie animation. It determines how the vector values are interpreted in Babylon.js.
 */
type VectorType = "Scale" | "Position" | "AnchorPoint";
/**
 * Type of the scalar properties in the Lottie animation. It determines how the scalar values are interpreted in Babylon.js.
 */
type ScalarType = "Rotation" | "Opacity";

/**
 * Default scale value for the scale property of a Lottie transform.
 */
const DefaultScale: IVector2Like = { x: 1, y: 1 };

/**
 * Default position value for the position property of a Lottie transform.
 */
const DefaultPosition: IVector2Like = { x: 0, y: 0 };

/**
 * Parses a lottie animation file and converts it into a format that can be rendered by Babylon.js
 * Important: not all lottie features are supported, you can call .debug() after parsing an animation to see what features were not supported.
 */
export class AnimationParser {
    private _packer: SpritePacker;
    private readonly _renderingManager: RenderingManager;
    private readonly _configuration: AnimationConfiguration;
    private readonly _animationInfo: AnimationInfo;

    private _unsupportedFeatures: string[];

    private _parentNodes: Map<number, Node>; // Map of nodes to build the scenegraph from the animation layers
    private _rootNodes: Node[]; // Array of root-level nodes in the animation, in top-down z order

    // Loop variables to save allocations
    private _shape: RawGraphicElement | undefined = undefined;

    /**
     * Get the animation information parsed from the Lottie file.
     */
    public get animationInfo(): AnimationInfo {
        return this._animationInfo;
    }

    /**
     * Creates a new instance of the Lottie animations parser.
     * @param packer Object that packs the sprites from the animation into a texture atlas.
     * @param fileContentAsJsonString The content of the lottie file as a JSON string.
     * @param configuration Configuration options for the animation parser.
     * @param renderingManager Object that manages the rendering of the sprites in the animation.
     */
    public constructor(packer: SpritePacker, fileContentAsJsonString: string, configuration: AnimationConfiguration, renderingManager: RenderingManager) {
        this._packer = packer;
        this._renderingManager = renderingManager;
        this._configuration = configuration;

        this._unsupportedFeatures = [];

        this._parentNodes = new Map<number, Node>();
        this._rootNodes = [];

        this._animationInfo = this._loadFromData(fileContentAsJsonString);
    }

    /**
     * Logs to the console all issues that were encountered during parsing the file.
     */
    public debug() {
        for (let i = 0; i < this._unsupportedFeatures.length; i++) {
            // eslint-disable-next-line no-console
            console.log(this._unsupportedFeatures[i]);
        }
    }

    private _loadFromData(fileContentAsJsonString: string): AnimationInfo {
        this._unsupportedFeatures.length = 0; // Clear previous errors
        const rawData = JSON.parse(fileContentAsJsonString) as RawLottieAnimation;

        for (let i = 0; i < rawData.layers.length; i++) {
            this._parseLayer(rawData.layers[i]);
        }

        // Update the atlas texture after creating all sprites from the animation
        this._packer.updateAtlasTexture();

        // Reorder the sprites from back to front
        this._renderingManager.ready();

        // Release the canvas to avoid memory leaks
        this._packer.releaseCanvas();
        this._packer = undefined as any; // Clear the reference to the sprite packer to allow garbage collection

        return {
            startFrame: rawData.ip,
            endFrame: rawData.op,
            frameRate: rawData.fr,
            widthPx: rawData.w,
            heightPx: rawData.h,
            nodes: this._rootNodes,
        };
    }

    private _parseLayer(layer: RawLottieLayer): void {
        if (layer.hd === true) {
            return; // Ignore hidden layers
        }

        if (layer.ty !== 3 && layer.ty !== 4) {
            this._unsupportedFeatures.push(`UnsupportedLayerType - Index: ${layer.ind} Name: ${layer.nm} Type: ${layer.ty}`);
            return;
        }

        if (layer.ind === undefined || layer.ip === undefined || layer.op === undefined || layer.st === undefined) {
            this._unsupportedFeatures.push(`Layer without required values - Name: ${layer.nm}`);
            return;
        }

        let parentNode: Node | undefined = undefined;
        if (layer.parent) {
            parentNode = this._parentNodes.get(layer.parent);
            if (parentNode === undefined) {
                this._unsupportedFeatures.push(`Parent node with index ${layer.parent} not found for layer ${layer.nm}`);
            }
        }

        const transform = this._parseTransform(layer.ks);

        const controlNode = new ControlNode(
            parentNode ? `${parentNode.id} - ${layer.nm} - ControlNode (TRS)` : `${layer.nm} - ControlNode (TRS)`,
            this._configuration.ignoreOpacityAnimations,
            layer.ip,
            layer.op,
            transform.position,
            transform.rotation,
            transform.scale,
            transform.opacity,
            parentNode
        );

        // Nodes without a parent are top-level nodes in the scenegraph
        if (!parentNode) {
            this._rootNodes.push(controlNode);
        }

        const anchorNode = new Node(
            parentNode ? `${parentNode.id} - ${layer.nm} - Node (Anchor)` : `${layer.nm} - Node (Anchor)`,
            this._configuration.ignoreOpacityAnimations,
            transform.anchorPoint,
            undefined, // Rotation is not used for anchor point
            undefined, // Scale is not used for anchor point
            undefined, // Opacity is not used for anchor point
            controlNode
        );

        // Anchor nodes are always the parent of the control node of a child layer, build a map to build the scenegraph
        this._parentNodes.set(layer.ind, anchorNode);

        // Create the sprites for the layer if it has shapes
        if (layer.shapes && layer.shapes.length > 0) {
            const scalingFactor = this._getScaleFactor(anchorNode);
            this._parseShapes(anchorNode, layer.shapes, scalingFactor);
        }
    }

    private _parseShapes(parent: Node, shapes: RawGraphicElement[], scalingFactor: IVector2Like): void {
        for (let i = 0; i < shapes.length; i++) {
            if (shapes[i].hd === true) {
                continue; // Ignore hidden shapes
            }

            if (shapes[i].ty === "gr") {
                this._parseGroupShape(parent, shapes[i] as RawGroupShape, scalingFactor);
            } else {
                this._unsupportedFeatures.push(`Only group shapes are supported as children of layers - Name: ${shapes[i].nm} Type: ${shapes[i].ty}`);
                continue;
            }
        }
    }

    private _parseGroupShape(parent: Node, rawGroup: RawGroupShape, scalingFactor: IVector2Like): void {
        if (!rawGroup.it || rawGroup.it.length === 0) {
            return;
        }

        let transform: Transform | undefined = undefined;
        for (let i = 0; i < rawGroup.it.length; i++) {
            this._shape = rawGroup.it[i];
            if (this._shape.ty === "gr") {
                this._unsupportedFeatures.push(`Nested group shapes are not supported. - Group ${rawGroup.nm} - Nested Group ${this._shape.nm}`);
            } else if (this._shape.ty === "tr") {
                transform = this._parseTransform(this._shape as RawTransformShape);
            } else if (this._shape.ty === "sh") {
                this._validatePathShape(this._shape as RawPathShape);
            } else if (this._shape.ty === "rc") {
                this._validateRectangleShape(this._shape as RawRectangleShape);
            } else if (this._shape.ty === "fl") {
                this._validateFillShape(this._shape as RawFillShape);
            } else if (this._shape.ty === "gf") {
                this._validateGradientFillShape(this._shape as RawGradientFillShape);
            } else {
                this._unsupportedFeatures.push(`Unsupported shape type - Name: ${this._shape.nm} Type: ${this._shape.ty}`);
            }
        }

        if (transform === undefined) {
            this._unsupportedFeatures.push(`Group ${rawGroup.nm} does not have a transform which is not supported`);
            return;
        }

        const trsNode = new Node(
            `${parent.id} - ${rawGroup.nm} - ControlNode (TRS)`,
            this._configuration.ignoreOpacityAnimations,
            transform.position,
            transform.rotation,
            transform.scale,
            transform.opacity,
            parent
        );

        const spriteInfo = this._packer.addLottieShape(rawGroup, scalingFactor);

        const sprite = new ThinSprite();

        // Set sprite UV coordinates
        sprite._xOffset = spriteInfo.uOffset;
        sprite._yOffset = spriteInfo.vOffset;
        sprite._xSize = spriteInfo.cellWidth;
        sprite._ySize = spriteInfo.cellHeight;

        // Set sprite dimensions for rendering
        sprite.width = spriteInfo.widthPx;
        sprite.height = spriteInfo.heightPx;
        sprite.invertV = true;

        this._renderingManager.addSprite(sprite);

        transform.anchorPoint.startValue.x += spriteInfo.centerX || 0;
        transform.anchorPoint.startValue.y -= spriteInfo.centerY || 0;

        new SpriteNode(
            `${parent.id} - ${rawGroup.nm} - SpriteNode (Anchor)`,
            this._configuration.ignoreOpacityAnimations,
            sprite,
            transform.anchorPoint,
            undefined, // Rotation is not used for anchor point
            undefined, // Scale is not used for anchor point
            undefined, // Opacity is not used for anchor point
            trsNode
        );
    }

    private _parseTransform(transform: RawTransform): Transform {
        return {
            opacity: this._fromLottieScalarToBabylonScalar(transform.o, "Opacity", 1),
            rotation: this._fromLottieScalarToBabylonScalar(transform.r, "Rotation", 0),
            scale: this._fromLottieVector2ToBabylonVector2(transform.s, "Scale", DefaultScale),
            position: this._fromLottieVector2ToBabylonVector2(transform.p, "Position", DefaultPosition),
            anchorPoint: this._fromLottieVector2ToBabylonVector2(transform.a, "AnchorPoint", DefaultPosition),
        };
    }

    private _fromLottieScalarToBabylonScalar(property: RawScalarProperty | undefined, scalarType: ScalarType, defaultValue: number): ScalarProperty {
        if (!property) {
            return {
                startValue: defaultValue,
                currentValue: defaultValue,
                currentKeyframeIndex: 0,
            };
        }

        if (property.a === 0) {
            return {
                startValue: property.k as number,
                currentValue: property.k as number,
                currentKeyframeIndex: 0,
            };
        }

        const keyframes: ScalarKeyframe[] = [];
        const rawKeyFrames = property.k as RawVectorKeyframe[];
        let i = 0;
        for (i = 0; i < rawKeyFrames.length; i++) {
            let easeFunction: BezierCurve | undefined = undefined;
            if (rawKeyFrames[i].o !== undefined && rawKeyFrames[i].i !== undefined) {
                if (Array.isArray(rawKeyFrames[i].o!.x)) {
                    // Value is an array
                    easeFunction = new BezierCurve(
                        (rawKeyFrames[i].o!.x as number[])[0],
                        (rawKeyFrames[i].o!.y as number[])[0],
                        (rawKeyFrames[i].i!.x as number[])[0],
                        (rawKeyFrames[i].i!.y as number[])[0],
                        this._configuration.easingSteps
                    );
                } else {
                    // Value is a number
                    easeFunction = new BezierCurve(
                        rawKeyFrames[i].o!.x as number,
                        rawKeyFrames[i].o!.y as number,
                        rawKeyFrames[i].i!.x as number,
                        rawKeyFrames[i].i!.y as number,
                        this._configuration.easingSteps
                    );
                }
            }

            let value = rawKeyFrames[i].s[0];
            if (scalarType === "Rotation") {
                value = (value * Math.PI) / 180; // Lottie uses degrees for rotation, convert to radians
            }

            keyframes.push({
                value: value,
                time: rawKeyFrames[i].t,
                easeFunction: easeFunction!, // We assume that the ease function is always defined if we have keyframes
            });
        }

        let startValue = rawKeyFrames[0].s[0];
        if (scalarType === "Rotation") {
            startValue = (startValue * Math.PI) / 180; // Lottie uses degrees for rotation, convert to radians
        }

        return {
            startValue: startValue,
            currentValue: startValue,
            keyframes: keyframes,
            currentKeyframeIndex: 0,
        };
    }

    private _fromLottieVector2ToBabylonVector2(property: RawVectorProperty | undefined, vectorType: VectorType, defaultValue: IVector2Like): Vector2Property {
        if (!property) {
            return {
                startValue: defaultValue,
                currentValue: defaultValue,
                currentKeyframeIndex: 0,
            };
        }

        if (property.l !== undefined && property.l !== 2) {
            this._unsupportedFeatures.push(`Invalid Vector2 Length - Length: ${property.l}`);
            return {
                startValue: defaultValue,
                currentValue: defaultValue,
                currentKeyframeIndex: 0,
            };
        }

        if (property.a === 0) {
            const values = property.k as number[];
            const value = this._calculateFinalVector(values[0], values[1], vectorType);
            return {
                startValue: value,
                currentValue: value,
                currentKeyframeIndex: 0,
            };
        }

        const keyframes: Vector2Keyframe[] = [];
        const rawKeyFrames = property.k as RawVectorKeyframe[];
        let i = 0;
        for (i = 0; i < rawKeyFrames.length; i++) {
            let easeFunction1: BezierCurve | undefined = undefined;
            if (rawKeyFrames[i].o !== undefined && rawKeyFrames[i].i !== undefined) {
                if (Array.isArray(rawKeyFrames[i].o!.x)) {
                    // Value is an array
                    easeFunction1 = new BezierCurve(
                        (rawKeyFrames[i].o!.x as number[])[0],
                        (rawKeyFrames[i].o!.y as number[])[0],
                        (rawKeyFrames[i].i!.x as number[])[0],
                        (rawKeyFrames[i].i!.y as number[])[0],
                        this._configuration.easingSteps
                    );
                } else {
                    // Value is a number
                    easeFunction1 = new BezierCurve(
                        rawKeyFrames[i].o!.x as number,
                        rawKeyFrames[i].o!.y as number,
                        rawKeyFrames[i].i!.x as number,
                        rawKeyFrames[i].i!.y as number,
                        this._configuration.easingSteps
                    );
                }
            }

            let easeFunction2: BezierCurve | undefined = undefined;
            if (rawKeyFrames[i].o !== undefined && rawKeyFrames[i].i !== undefined) {
                if (Array.isArray(rawKeyFrames[i].o!.x)) {
                    // Value is an array
                    easeFunction2 = new BezierCurve(
                        (rawKeyFrames[i].o!.x as number[])[1],
                        (rawKeyFrames[i].o!.y as number[])[1],
                        (rawKeyFrames[i].i!.x as number[])[1],
                        (rawKeyFrames[i].i!.y as number[])[1],
                        this._configuration.easingSteps
                    );
                } else {
                    // Value is a number
                    easeFunction2 = new BezierCurve(
                        rawKeyFrames[i].o!.x as number,
                        rawKeyFrames[i].o!.y as number,
                        rawKeyFrames[i].i!.x as number,
                        rawKeyFrames[i].i!.y as number,
                        this._configuration.easingSteps
                    );
                }
            }

            keyframes.push({
                value: this._calculateFinalVector(rawKeyFrames[i].s[0], rawKeyFrames[i].s[1], vectorType),
                time: rawKeyFrames[i].t,
                easeFunction1: easeFunction1!, // We assume that the ease function is always defined if we have keyframes
                easeFunction2: easeFunction2!, // We assume that the ease function is always defined if we have keyframes
            });
        }

        const startValue = this._calculateFinalVector(rawKeyFrames[0].s[0], rawKeyFrames[0].s[1], vectorType);
        return {
            startValue: startValue,
            currentValue: { x: startValue.x, y: startValue.y }, // All vectors are passed by reference, so we need to create a copy to avoid modifying the start value
            keyframes: keyframes,
            currentKeyframeIndex: 0,
        };
    }

    private _calculateFinalVector(x: number, y: number, vectorType: VectorType): IVector2Like {
        const result = { x, y };

        if (vectorType === "Position") {
            // Lottie uses a different coordinate system for position, so we need to invert the Y value
            result.y = -result.y;
        } else if (vectorType === "AnchorPoint") {
            // Lottie uses a different coordinate system for anchor point, so we need to invert the X value
            result.x = -result.x;
        } else if (vectorType === "Scale") {
            // Lottie uses a different coordinate system for scale, so we need to divide by 100
            result.x = result.x / 100;
            result.y = result.y / 100;
        }

        return result;
    }

    private _getScaleFactor(node: Node): IVector2Like {
        const scale = { x: node.startScale.x, y: node.startScale.y };
        while (node.parent) {
            node = node.parent;
            scale.x *= node.startScale.x;
            scale.y *= node.startScale.y;
        }

        scale.x = scale.x * this._configuration.scaleMultiplier;
        scale.y = scale.y * this._configuration.scaleMultiplier;

        return scale;
    }

    private _validatePathShape(shape: RawPathShape): void {
        if (shape.ks.a === 1) {
            this._unsupportedFeatures.push(`Path ${shape.nm} has animated properties which are not supported`);
        }
    }

    private _validateRectangleShape(shape: RawRectangleShape): void {
        if (shape.p.a === 1) {
            this._unsupportedFeatures.push(`Rectangle ${shape.nm} has an position property that is animated which is not supported`);
        }

        if (shape.s.a === 1) {
            this._unsupportedFeatures.push(`Rectangle ${shape.nm} has a size property that is animated which is not supported`);
        }

        if (shape.r.a === 1) {
            this._unsupportedFeatures.push(`Rectangle ${shape.nm} has a rounded corners property that is animated which is not supported`);
        }
    }

    private _validateFillShape(shape: RawFillShape) {
        if (shape.o.a === 1) {
            this._unsupportedFeatures.push(`Fill ${shape.nm} has an opacity property that is animated which is not supported`);
        }

        if (shape.c.a === 1) {
            this._unsupportedFeatures.push(`Fill ${shape.nm} has a color property that is animated which is not supported`);
        }
    }

    private _validateGradientFillShape(shape: RawGradientFillShape) {
        if (shape.o.a === 1) {
            this._unsupportedFeatures.push(`Gradient fill ${shape.nm} has an opacity property that is animated which is not supported`);
        }

        if (shape.s.a === 1) {
            this._unsupportedFeatures.push(`Gradient fill ${shape.nm} has a start point property that is animated which is not supported`);
        }

        if (shape.e.a === 1) {
            this._unsupportedFeatures.push(`Gradient fill ${shape.nm} has an end point property that is animated which is not supported`);
        }
    }
}
