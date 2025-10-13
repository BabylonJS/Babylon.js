import type { IVector2Like } from "core/Maths/math.like";
import { ThinSprite } from "core/Sprites/thinSprite";

import type {
    RawElement,
    RawFont,
    RawLottieAnimation,
    RawLottieLayer,
    RawScalarProperty,
    RawShapeLayer,
    RawTextLayer,
    RawTransform,
    RawTransformShape,
    RawVectorKeyframe,
    RawVectorProperty,
} from "./rawTypes";
import type { AnimationInfo, ScalarKeyframe, ScalarProperty, Transform, Vector2Keyframe, Vector2Property } from "./parsedTypes";

import type { SpritePacker } from "./spritePacker";
import { SpriteNode } from "../nodes/spriteNode";

import { BezierCurve } from "../maths/bezier";

import type { RenderingManager } from "../rendering/renderingManager";
import { Node } from "../nodes/node";
import { ControlNode } from "../nodes/controlNode";

import type { AnimationConfiguration } from "../animationConfiguration";

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
 * Tree structure used to reorder layers into a child-parent hierarchy.
 */
type LayerTree = {
    layer: RawLottieLayer;
    children: LayerTree[];
};

/**
 * Parses a lottie animation file from a URL and returns the json representation of the file.
 * @param urlToFile The URL to the Lottie animation file.
 * @returns The json representation of the lottie animation.
 */
export async function GetRawAnimationDataAsync(urlToFile: string): Promise<RawLottieAnimation> {
    const animationData = await (await fetch(urlToFile)).text();
    return JSON.parse(animationData) as RawLottieAnimation;
}

/**
 * Parses a lottie animation file and converts it into a format that can be rendered by Babylon.js
 * Important: not all lottie features are supported, you can call .debug() after parsing an animation to see what features were not supported.
 */
export class Parser {
    private _packer: SpritePacker;
    private readonly _configuration: AnimationConfiguration;
    private readonly _animationInfo: AnimationInfo;
    private readonly _renderingManager: RenderingManager;

    private _rawFonts: Map<string, RawFont> = new Map<string, RawFont>(); // Map of font names to raw font data
    private _unsupportedFeatures: string[];

    private _rootNodes: Node[]; // Array of root-level nodes in the animation, in top-down z order
    private _parentNodes: Map<number, Node> = new Map<number, Node>(); // Map of nodes to build the scenegraph from the animation layers

    /**
     * Get the animation information parsed from the Lottie file.
     */
    public get animationInfo(): AnimationInfo {
        return this._animationInfo;
    }

    /**
     * Creates a new instance of the Lottie animations parser.
     * @param packer Object that packs the sprites from the animation into a texture atlas.
     * @param animationData The raw lottie animation as a JSON object.
     * @param configuration Configuration options for the animation parser.
     * @param renderingManager Object that manages the rendering of the sprites in the animation.
     */
    public constructor(packer: SpritePacker, animationData: RawLottieAnimation, configuration: AnimationConfiguration, renderingManager: RenderingManager) {
        this._packer = packer;
        this._configuration = configuration;
        this._renderingManager = renderingManager;

        this._unsupportedFeatures = [];

        this._parentNodes = new Map<number, Node>();
        this._rootNodes = [];

        this._animationInfo = this._loadFromData(animationData);
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

    private _loadFromData(rawData: RawLottieAnimation): AnimationInfo {
        this._unsupportedFeatures.length = 0; // Clear previous errors

        this._parseFonts(rawData);

        // Layers data may come unorderer, we need to short into child-parents but maintaining z-order before parsing
        const orderedLayers = this._reoderLayers(rawData.layers);
        for (let i = 0; i < orderedLayers.length; i++) {
            this._parseLayer(orderedLayers[i]);
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

    private _parseFonts(rawData: RawLottieAnimation): void {
        if (rawData.fonts && rawData.fonts.list) {
            for (const font of rawData.fonts.list) {
                this._rawFonts.set(font.fName, font);
            }

            this._packer.rawFonts = this._rawFonts;
        }
    }

    private _reoderLayers(layers: RawLottieLayer[]): RawLottieLayer[] {
        let unusedIndex = Number.MIN_SAFE_INTEGER;
        const layerTrees: LayerTree[] = [];
        let movedLayers = Number.MAX_VALUE;

        while (movedLayers > 0) {
            movedLayers = 0;

            for (let i = 0; i < layers.length; i++) {
                const layer = layers[i];
                if (layer.ind === undefined) {
                    layer.ind = unusedIndex--; // Assign an unused index to the layer if it has no index
                }

                // Layers with no parents are top-level layers, push them to the final layers
                // in the same order they are declared to preserve the z-order
                if (layer.parent === undefined) {
                    layerTrees.push({
                        layer,
                        children: [],
                    });

                    layers.splice(i, 1);
                    i--;
                    movedLayers++;
                } else {
                    for (let j = 0; j < layerTrees.length; j++) {
                        const parent = this._searchBfs(layerTrees[j], layer.parent);
                        if (parent) {
                            parent.children.push({
                                layer,
                                children: [],
                            });

                            layers.splice(i, 1);
                            i--;
                            movedLayers++;
                            break;
                        }
                    }
                }
            }
        }

        // Finally, convert the map to an array of layers
        const finalLayersArray: RawLottieLayer[] = [];
        for (let i = 0; i < layerTrees.length; i++) {
            finalLayersArray.push(...this._visitDfs(layerTrees[i]));
        }

        if (layers.length > 0) {
            finalLayersArray.push(...layers); // Add any remaining layers that were not processed
        }

        return finalLayersArray;
    }

    private _searchBfs(tree: LayerTree, index: number): LayerTree | undefined {
        const queue: LayerTree[] = [tree];
        while (queue.length > 0) {
            const current = queue.shift()!;
            if (current.layer.ind === index) {
                return current;
            }
            for (let i = 0; i < current.children.length; i++) {
                queue.push(current.children[i]);
            }
        }
        return undefined;
    }

    private _visitDfs(tree: LayerTree): RawLottieLayer[] {
        const result: RawLottieLayer[] = [];

        const visit = (node: LayerTree) => {
            result.push(node.layer);
            for (let i = 0; i < node.children.length; i++) {
                visit(node.children[i]);
            }
        };

        visit(tree);
        return result;
    }

    private _parseLayer(layer: RawLottieLayer): void {
        if (layer.hd === true) {
            return; // Ignore hidden layers
        }

        // We only support null, shape and text layers
        if (layer.ty !== 3 && layer.ty !== 4 && layer.ty !== 5) {
            this._unsupportedFeatures.push(`UnsupportedLayerType - Layer Name: ${layer.nm} - Layer Index: ${layer.ind} - Layer Type: ${layer.ty}`);
            return;
        }

        if (layer.ip === undefined || layer.op === undefined || layer.st === undefined) {
            this._unsupportedFeatures.push(`Layer without required values - Layer Name: ${layer.nm}`);
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

        const trsNode = new ControlNode(
            `ControlNode (TRS) - ${layer.nm}`,
            layer.ip,
            layer.op,
            transform.position,
            transform.rotation,
            transform.scale,
            transform.opacity,
            parentNode
        );

        let anchorNode: Node | undefined = undefined;
        switch (layer.ty) {
            case 3: // Null layer
                anchorNode = this._parseNullLayer(layer, transform, trsNode);
                break;
            case 4: // Shape layer
                anchorNode = this._parseShapeLayer(layer as RawShapeLayer, transform, trsNode);
                break;
            case 5: // Text layer
                anchorNode = this._parseTextLayer(layer as RawTextLayer, transform, trsNode);
                if (anchorNode === undefined) {
                    return;
                }
                break;
        }

        // If no parent, this is a top level node, add it to the root nodes for rendering
        if (layer.parent === undefined) {
            this._rootNodes.push(trsNode);
        }

        if (anchorNode === undefined) {
            this._unsupportedFeatures.push(`Layer ${layer.nm} did not generate an anchor node, this is unexpected and should be investigated.`);
        }

        if (layer.ind !== undefined && anchorNode) {
            this._parentNodes.set(layer.ind, anchorNode);
        }
    }

    private _parseNullLayer(layer: RawLottieLayer, transform: Transform, parent: Node): Node {
        return new Node(
            `Node (Anchor) - ${layer.nm}`,
            transform.anchorPoint,
            undefined, // Rotation is not used for anchor point
            undefined, // Scale is not used for anchor point
            undefined, // Opacity is not used for anchor point
            parent
        );
    }

    private _parseShapeLayer(layer: RawShapeLayer, transform: Transform, parent: Node): Node {
        const anchorNode = this._parseNullLayer(layer, transform, parent);
        this._parseElements(layer.shapes, anchorNode);

        return anchorNode;
    }

    private _parseTextLayer(layer: RawTextLayer, transform: Transform, parent: Node): Node | undefined {
        // Get the scale and add the sprite to the texture packer
        const currentScale = { x: 1, y: 1 };
        const tempPosition = { x: 1, y: 1 };
        parent.worldMatrix.decompose(currentScale, tempPosition);
        const spriteInfo = this._packer.addLottieText(layer.t, currentScale);

        if (spriteInfo === undefined) {
            return undefined;
        }

        // Build the ThinSprite from the texture packer information
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

        const positionProperty: Vector2Property = {
            startValue: { x: transform.anchorPoint.startValue.x, y: transform.anchorPoint.startValue.y },
            currentValue: { x: transform.anchorPoint.currentValue.x, y: transform.anchorPoint.currentValue.y },
            currentKeyframeIndex: 0,
        };

        let textAlignment = 0;
        if (layer.t.d && layer.t.d.k && layer.t.d.k.length > 0) {
            textAlignment = layer.t.d.k[0].s.j;
        }

        // The X offset of the text depends on the alignment of the text: 0=left, 1=right, 2=centered
        // Sprites are centered by default, so that is why the offset is 0 for centered text
        const xAlignmentOffset = textAlignment === 0 ? spriteInfo.widthPx / 2 : textAlignment === 1 ? -spriteInfo.widthPx / 2 : 0;
        positionProperty.startValue.x += xAlignmentOffset;
        positionProperty.currentValue.x += xAlignmentOffset;

        // For text, its Y position is at the baseline, so we need to offset it by half the height of the text upwards
        positionProperty.startValue.y += spriteInfo.heightPx / 2;
        positionProperty.currentValue.y += spriteInfo.heightPx / 2;

        return new SpriteNode(
            "Sprite",
            sprite,
            positionProperty,
            undefined, // Rotation is not used for sprites final transform
            undefined, // Scale is not used for sprites final transform
            undefined, // Opacity is not used for sprites final transform
            parent
        );
    }

    private _parseElements(elements: RawElement[] | undefined, parent: Node): void {
        if (elements === undefined || elements.length <= 0) {
            return;
        }

        for (let i = 0; i < elements.length; i++) {
            if (elements[i].hd === true) {
                continue; // Ignore hidden shapes
            }

            if (elements[i].ty === "tr") {
                continue; // Transforms are parsed as part of other elements, so we can ignore it
            }

            if (elements[i].ty === "gr") {
                this._parseGroup(elements[i], parent);
                //break;
            } else if (elements[i].ty === "sh" || elements[i].ty === "rc") {
                this._parseShapes(elements, parent);
                break; // After parsing the shapes, this array of elements is done
            } else {
                this._unsupportedFeatures.push(`Only groups or shapes are supported as children of layers - Name: ${elements[i].nm} Type: ${elements[i].ty}`);
                continue;
            }
        }
    }

    private _parseGroup(group: RawElement, parent: Node): void {
        if (group.it === undefined || group.it.length === 0) {
            this._unsupportedFeatures.push(`Unexpected empty group: ${group.nm}`);
            return;
        }

        const transform: Transform | undefined = this._getTransform(group.it);
        if (transform === undefined) {
            this._unsupportedFeatures.push(`Group ${group.nm} does not have a transform which is not supported`);
            return;
        }

        // Create the nodes on the scenegraph for this group
        const trsNode = new Node(`Node (TRS)- ${group.nm}`, transform.position, transform.rotation, transform.scale, transform.opacity, parent);

        const anchorNode = new Node(
            `Node (Anchor) - ${group.nm}`,
            transform.anchorPoint,
            undefined, // Rotation is not used for anchor point
            undefined, // Scale is not used for anchor point
            undefined, // Opacity is not used for anchor point
            trsNode
        );

        // Parse the children of the group
        this._parseElements(group.it, anchorNode);
    }

    private _parseShapes(elements: RawElement[], parent: Node): void {
        // Get the scale and add the sprite to the texture packer
        const currentScale = { x: 1, y: 1 };
        const tempPosition = { x: 1, y: 1 };
        parent.worldMatrix.decompose(currentScale, tempPosition);
        const spriteInfo = this._packer.addLottieShape(elements, currentScale);

        // Build the ThinSprite from the texture packer information
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

        const positionProperty: Vector2Property = {
            startValue: { x: spriteInfo.centerX || 0, y: -spriteInfo.centerY || 0 },
            currentValue: { x: spriteInfo.centerX || 0, y: -spriteInfo.centerY || 0 },
            currentKeyframeIndex: 0,
        };

        new SpriteNode(
            "Sprite",
            sprite,
            positionProperty,
            undefined, // Rotation is not used for sprites final transform
            undefined, // Scale is not used for sprites final transform
            undefined, // Opacity is not used for sprites final transform
            parent
        );
    }

    private _getTransform(elements: RawElement[] | undefined): Transform | undefined {
        if (!elements || elements.length === 0) {
            return undefined;
        }

        // Lottie format mandates the transform is the last item on a list of elements
        if (elements[elements.length - 1].ty !== "tr") {
            return undefined;
        }

        return this._parseTransform(elements[elements.length - 1] as RawTransformShape);
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
            let startValue = property.k as number;

            if (scalarType === "Opacity") {
                startValue = startValue / 100;
            }

            if (scalarType === "Rotation") {
                startValue = (-1 * (startValue * Math.PI)) / 180; // Lottie uses degrees for rotation, convert to radians
            }

            return {
                startValue: startValue,
                currentValue: startValue,
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

            if (scalarType === "Opacity") {
                value = value / 100;
            }

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

        if (scalarType === "Opacity") {
            startValue = startValue / 100;
        }

        if (scalarType === "Rotation") {
            startValue = (-1 * (startValue * Math.PI)) / 180; // Lottie uses degrees for rotation, convert to radians
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

    // private _validatePathShape(shape: RawPathShape): void {
    //     if (shape.ks.a === 1) {
    //         this._unsupportedFeatures.push(`Path ${shape.nm} has animated properties which are not supported`);
    //     }
    // }

    // private _validateRectangleShape(shape: RawRectangleShape): void {
    //     if (shape.p.a === 1) {
    //         this._unsupportedFeatures.push(`Rectangle ${shape.nm} has an position property that is animated which is not supported`);
    //     }

    //     if (shape.s.a === 1) {
    //         this._unsupportedFeatures.push(`Rectangle ${shape.nm} has a size property that is animated which is not supported`);
    //     }

    //     if (shape.r.a === 1) {
    //         this._unsupportedFeatures.push(`Rectangle ${shape.nm} has a rounded corners property that is animated which is not supported`);
    //     }
    // }

    // private _validateFillShape(shape: RawFillShape) {
    //     if (shape.o.a === 1) {
    //         this._unsupportedFeatures.push(`Fill ${shape.nm} has an opacity property that is animated which is not supported`);
    //     }

    //     if (shape.c.a === 1) {
    //         this._unsupportedFeatures.push(`Fill ${shape.nm} has a color property that is animated which is not supported`);
    //     }
    // }

    // private _validateGradientFillShape(shape: RawGradientFillShape) {
    //     if (shape.o.a === 1) {
    //         this._unsupportedFeatures.push(`Gradient fill ${shape.nm} has an opacity property that is animated which is not supported`);
    //     }

    //     if (shape.s.a === 1) {
    //         this._unsupportedFeatures.push(`Gradient fill ${shape.nm} has a start point property that is animated which is not supported`);
    //     }

    //     if (shape.e.a === 1) {
    //         this._unsupportedFeatures.push(`Gradient fill ${shape.nm} has an end point property that is animated which is not supported`);
    //     }
    // }
}
