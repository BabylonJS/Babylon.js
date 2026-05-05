import { type IVector2Like } from "core/Maths/math.like";
import { ThinSprite } from "core/Sprites/thinSprite";

import {
    type RawElement,
    type RawFont,
    type RawLottieAnimation,
    type RawLottieLayer,
    type RawScalarProperty,
    type RawShapeLayer,
    type RawSolidLayer,
    type RawTextLayer,
    type RawTransform,
    type RawTransformShape,
    type RawVectorKeyframe,
    type RawVectorProperty,
} from "./rawTypes";
import { type AnimationInfo, type ScalarKeyframe, type ScalarProperty, type Transform, type Vector2Keyframe, type Vector2Property } from "./parsedTypes";

import { type SpriteAtlasInfo, type SpritePacker } from "./spritePacker";
import { SpriteNode } from "../nodes/spriteNode";

import { BezierCurve } from "../maths/bezier";

import { type RenderingManager } from "../rendering/renderingManager";
import { Node } from "../nodes/node";
import { ControlNode } from "../nodes/controlNode";

import { type AnimationConfiguration } from "../animationConfiguration";

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
 * Parses a CSS hex color string in `#RGB` or `#RRGGBB` form into normalized 0..1 RGB components.
 * Used for solid layers (`ty:1`), whose color is stored as a CSS string in `sc`. Falls back to
 * white and pushes a warning for any other form (e.g. `rgb()`, named colors) so the source is
 * traceable instead of silently producing the wrong color.
 * @param value The raw `sc` string from a solid layer.
 * @param layerName The owning layer's name (for the warning message).
 * @param unsupported Mutable list to push a warning into when the value cannot be parsed.
 * @returns A `[r, g, b]` triple of normalized components in 0..1.
 */
function ParseCssColorString(value: string, layerName: string | undefined, unsupported: string[]): [number, number, number] {
    if (typeof value === "string") {
        if (value.length === 7 && value[0] === "#") {
            const r = parseInt(value.substring(1, 3), 16);
            const g = parseInt(value.substring(3, 5), 16);
            const b = parseInt(value.substring(5, 7), 16);
            if (Number.isFinite(r) && Number.isFinite(g) && Number.isFinite(b)) {
                return [r / 255, g / 255, b / 255];
            }
        }
        if (value.length === 4 && value[0] === "#") {
            const r = parseInt(value[1] + value[1], 16);
            const g = parseInt(value[2] + value[2], 16);
            const b = parseInt(value[3] + value[3], 16);
            if (Number.isFinite(r) && Number.isFinite(g) && Number.isFinite(b)) {
                return [r / 255, g / 255, b / 255];
            }
        }
    }
    unsupported.push(`Unsupported CSS color string in solid layer ${layerName ?? "<unknown>"}: ${value}`);
    return [1, 1, 1];
}

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
    private _seenUnsupportedMessages: Set<string> = new Set<string>(); // Dedup guard so spammy per-property warnings only surface once.

    private _rootNodes: Node[]; // Array of root-level nodes in the animation, in top-down z order
    private _parentNodes: Map<number, Node> = new Map<number, Node>(); // Map of nodes to build the scenegraph from the animation layers
    private _currentLayerOriginalIndex: number = 0; // Original array index of the layer currently being parsed, used for sprite z-ordering
    private _currentLayerName: string | undefined = undefined; // Name of the layer currently being parsed, used for diagnostic messages
    private _layerOriginalIndices: Map<RawLottieLayer, number> = new Map<RawLottieLayer, number>(); // Maps layers to their original array index for z-ordering
    private _startFrame: number = 0;

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

    /**
     * Pushes a message to the unsupported features list only if it has not been seen before during this parse.
     * Used for warnings that would otherwise be repeated for every property/layer matching the same case.
     * @param message The message to push, used as the dedup key.
     */
    private _pushUnsupportedOnce(message: string): void {
        if (this._seenUnsupportedMessages.has(message)) {
            return;
        }
        this._seenUnsupportedMessages.add(message);
        this._unsupportedFeatures.push(message);
    }

    private _loadFromData(rawData: RawLottieAnimation): AnimationInfo {
        this._unsupportedFeatures.length = 0; // Clear previous errors
        this._seenUnsupportedMessages.clear();
        this._startFrame = rawData.ip;

        this._parseFonts(rawData);

        // Layers data may come unorderer, we need to short into child-parents but maintaining z-order before parsing
        const orderedLayers = this._reoderLayers(rawData.layers);
        for (let i = 0; i < orderedLayers.length; i++) {
            this._currentLayerOriginalIndex = this._layerOriginalIndices.get(orderedLayers[i]) ?? i;
            this._currentLayerName = orderedLayers[i].nm;
            this._parseLayer(orderedLayers[i]);
        }

        // Clear layer index map to allow raw JSON data to be garbage-collected
        this._layerOriginalIndices.clear();

        // Update the atlas texture after creating all sprites from the animation
        this._packer.updateAtlasTexture();

        // Reorder the sprites from back to front and set the final atlas textures
        this._renderingManager.ready(this._packer.textures);

        // Drain any unsupported-feature reports from the packer before we drop the reference to it,
        // so debug() can surface them after construction.
        const packerUnsupported = this._packer.unsupportedFeatures;
        for (let i = 0; i < packerUnsupported.length; i++) {
            this._unsupportedFeatures.push(packerUnsupported[i]);
        }

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
        // Record the original array index of each layer before reordering, for z-order preservation
        for (let i = 0; i < layers.length; i++) {
            this._layerOriginalIndices.set(layers[i], i);
        }

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

        // We only support solid, null, shape and text layers
        if (layer.ty !== 1 && layer.ty !== 3 && layer.ty !== 4 && layer.ty !== 5) {
            this._unsupportedFeatures.push(`UnsupportedLayerType - Layer Name: ${layer.nm} - Layer Index: ${layer.ind} - Layer Type: ${layer.ty}`);
            return;
        }

        if (layer.ip === undefined || layer.op === undefined || layer.st === undefined) {
            this._unsupportedFeatures.push(`Layer without required values - Layer Name: ${layer.nm}`);
            return;
        }

        let parentNode: Node | undefined = undefined;
        if (layer.parent !== undefined) {
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
            parentNode,
            layer.ty === 3 // isNullLayer
        );

        let anchorNode: Node | undefined = undefined;
        switch (layer.ty) {
            case 1: // Solid layer
                anchorNode = this._parseSolidLayer(layer as RawSolidLayer, transform, trsNode);
                break;
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
        const rasterizationFrame = this._getRasterizationFrame(layer);
        this._parseElements(layer.shapes, anchorNode, rasterizationFrame);

        return anchorNode;
    }

    private _parseSolidLayer(layer: RawSolidLayer, transform: Transform, parent: Node): Node {
        const anchorNode = this._parseNullLayer(layer, transform, parent);

        // Defensive: malformed solid layer with no usable rectangle. Skip rasterization but keep the
        // anchor node so any layers parented to this one (via `ind`) still get a valid parent slot.
        if (!(layer.sw > 0) || !(layer.sh > 0)) {
            this._unsupportedFeatures.push(`Solid layer ${layer.nm} has invalid sw/sh and will not render`);
            return anchorNode;
        }

        const [r, g, b] = ParseCssColorString(layer.sc, layer.nm, this._unsupportedFeatures);

        // Solid layers are by definition a single flat color (Lottie schema only allows `sc` as a
        // CSS color string — no gradient, no animation). Rasterize it into a 1x1 atlas cell instead
        // of an `sw`x`sh` cell: the sprite samples one pixel and the GPU stretches it, which is
        // pixel-equivalent for a flat fill and avoids consuming a multi-megabyte chunk of the atlas
        // for what's typically a full-stage backplate (e.g. Pages.json's 960x540 "Grey" layer would
        // otherwise eat ~90% of a 2048-pixel atlas page at devicePixelRatio=2).
        const atlasShapes: RawElement[] = [
            {
                ty: "rc",
                nm: "Solid Rect (atlas)",
                d: 1,
                p: { a: 0, k: [0.5, 0.5] },
                s: { a: 0, k: [1, 1] },
                r: { a: 0, k: 0 },
            } as unknown as RawElement,
            {
                ty: "fl",
                nm: "Solid Fill",
                c: { a: 0, k: [r, g, b, 1] },
                o: { a: 0, k: 100 },
                r: 1,
            } as unknown as RawElement,
        ];

        // Atlas write at unit scale: the cell is 1 lottie pixel * 1 = 1 atlas pixel (multiplied by
        // devicePixelRatio internally). Using the layer's actual rasterization scale would defeat
        // the optimization by reintroducing the sw*sh cell.
        const atlasScale = { x: 1, y: 1 };
        const spriteInfo = this._packer.addLottieShape(atlasShapes, atlasScale, layer.nm);

        // Build the sprite ourselves rather than going through `_parseShapes`, so we can keep the
        // tiny atlas cell while sizing the on-screen sprite to the layer's full sw*sh. The sprite
        // is positioned with its center at (sw/2, -sh/2) in the layer's local space so its top-left
        // sits at the layer origin (0, 0) — matching how After Effects positions a solid layer.
        const sprite = new ThinSprite();
        sprite._xOffset = spriteInfo.uOffset;
        sprite._yOffset = spriteInfo.vOffset;
        sprite._xSize = spriteInfo.cellWidth;
        sprite._ySize = spriteInfo.cellHeight;
        sprite.width = layer.sw;
        sprite.height = layer.sh;
        sprite.invertV = true;

        this._renderingManager.addSprite(sprite, this._currentLayerOriginalIndex, spriteInfo.atlasIndex);

        const positionProperty: Vector2Property = {
            startValue: { x: layer.sw / 2, y: -layer.sh / 2 },
            currentValue: { x: layer.sw / 2, y: -layer.sh / 2 },
            currentKeyframeIndex: 0,
        };

        new SpriteNode(
            "Sprite",
            sprite,
            positionProperty,
            undefined, // Rotation is not used for sprites final transform
            undefined, // Scale is not used for sprites final transform
            undefined, // Opacity is not used for sprites final transform
            anchorNode
        );

        return anchorNode;
    }

    private _parseTextLayer(layer: RawTextLayer, transform: Transform, parent: Node): Node | undefined {
        // Get the rasterization scale at the frame when the layer first becomes visible
        const rasterizationFrame = this._getRasterizationFrame(layer);
        const currentScale = this._getRasterizationScale(parent, rasterizationFrame);
        const spriteInfo = this._packer.addLottieText(layer.t, currentScale, layer.nm);

        if (spriteInfo === undefined) {
            return undefined;
        }

        const useBabylon8TextPlacement = this._configuration.textLayerCompatibilityMode === "babylon8";
        const spriteParent = useBabylon8TextPlacement ? parent : this._parseNullLayer(layer, transform, parent);

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

        this._renderingManager.addSprite(sprite, this._currentLayerOriginalIndex, spriteInfo.atlasIndex);

        const positionProperty = useBabylon8TextPlacement ? this._getBabylon8TextPosition(layer, transform, spriteInfo) : this._getTextPosition(spriteInfo);

        const spriteNode = new SpriteNode(
            "Sprite",
            sprite,
            positionProperty,
            undefined, // Rotation is not used for sprites final transform
            undefined, // Scale is not used for sprites final transform
            undefined, // Opacity is not used for sprites final transform
            spriteParent
        );

        return useBabylon8TextPlacement ? spriteNode : spriteParent;
    }

    private _getTextPosition(spriteInfo: SpriteAtlasInfo): Vector2Property {
        return {
            startValue: { x: spriteInfo.centerX || 0, y: -spriteInfo.centerY || 0 },
            currentValue: { x: spriteInfo.centerX || 0, y: -spriteInfo.centerY || 0 },
            currentKeyframeIndex: 0,
        };
    }

    private _getBabylon8TextPosition(layer: RawTextLayer, transform: Transform, spriteInfo: SpriteAtlasInfo): Vector2Property {
        const textAlignment = layer.t.d?.k?.[0]?.s?.j ?? 0;
        const xAlignmentOffset = textAlignment === 0 ? spriteInfo.widthPx / 2 : textAlignment === 1 ? -spriteInfo.widthPx / 2 : 0;
        const yBaselineOffset = spriteInfo.heightPx / 2;

        return {
            startValue: { x: transform.anchorPoint.startValue.x + xAlignmentOffset, y: transform.anchorPoint.startValue.y + yBaselineOffset },
            currentValue: { x: transform.anchorPoint.currentValue.x + xAlignmentOffset, y: transform.anchorPoint.currentValue.y + yBaselineOffset },
            currentKeyframeIndex: 0,
        };
    }

    private _parseElements(elements: RawElement[] | undefined, parent: Node, rasterizationFrame: number): void {
        if (elements === undefined || elements.length <= 0) {
            return;
        }

        // Lottie/After Effects shape stack: a fill/stroke (or gradient fill/stroke) at a given level
        // applies to every sibling shape/group above it. When a layer (or a group) mixes child groups
        // with sibling decorators, those decorators have to flow into each child group so each group's
        // sprite is rasterized with them. Without this, e.g. `[gr, gr, fl]` would render only the
        // groups that already carry their own fill — the others would rasterize as empty sprites
        let hasGroup = false;
        let levelDecorators: RawElement[] | undefined;
        for (let i = 0; i < elements.length; i++) {
            const el = elements[i];
            if (el.hd === true || el.ty === "tr") {
                continue;
            }
            if (el.ty === "gr") {
                hasGroup = true;
            } else if (el.ty === "fl" || el.ty === "st" || el.ty === "gf" || el.ty === "gs") {
                (levelDecorators ??= []).push(el);
            }
        }
        const propagateDecorators = hasGroup && levelDecorators !== undefined && levelDecorators.length > 0;

        for (let i = 0; i < elements.length; i++) {
            if (elements[i].hd === true) {
                continue; // Ignore hidden shapes
            }

            if (elements[i].ty === "tr") {
                continue; // Transforms are parsed as part of other elements, so we can ignore it
            }

            if (elements[i].ty === "gr") {
                this._parseGroup(elements[i], parent, rasterizationFrame, propagateDecorators ? levelDecorators : undefined);
                //break;
            } else if (elements[i].ty === "sh" || elements[i].ty === "rc" || elements[i].ty === "el") {
                this._parseShapes(elements, parent, rasterizationFrame);
                break; // After parsing the shapes, this array of elements is done
            } else if (propagateDecorators && (elements[i].ty === "fl" || elements[i].ty === "st" || elements[i].ty === "gf" || elements[i].ty === "gs")) {
                // Already absorbed into the preceding sibling groups via `_parseGroup` above.
                continue;
            } else {
                this._unsupportedFeatures.push(`Only groups or shapes are supported as children of layers - Name: ${elements[i].nm} Type: ${elements[i].ty}`);
                continue;
            }
        }
    }

    private _parseGroup(group: RawElement, parent: Node, rasterizationFrame: number, inheritedDecorators?: RawElement[]): void {
        if (group.it === undefined || group.it.length === 0) {
            this._unsupportedFeatures.push(`Unexpected empty group: ${group.nm}`);
            return;
        }

        const transform: Transform | undefined = this._getTransform(group.it);
        if (transform === undefined) {
            this._unsupportedFeatures.push(`Group ${group.nm} does not have a transform which is not supported`);
            return;
        }

        // Splice any inherited decorators (parent-level fills/strokes) just before the group's
        // transform so the rasterizer sees them in the same relative position they had at the
        // parent level — i.e. below the group's own contents in z-order. Lottie's terminal-`tr`
        // contract (relied on by `_getTransform` and `_drawVectorShape`) is preserved.
        let items = group.it;
        if (inheritedDecorators && inheritedDecorators.length > 0) {
            items = group.it.slice(0, -1).concat(inheritedDecorators, group.it[group.it.length - 1]);
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
        this._parseElements(items, anchorNode, rasterizationFrame);
    }

    private _parseShapes(elements: RawElement[], parent: Node, rasterizationFrame: number): void {
        // Get the rasterization scale at the frame when the layer first becomes visible
        const currentScale = this._getRasterizationScale(parent, rasterizationFrame);
        const spriteInfo = this._packer.addLottieShape(elements, currentScale, this._currentLayerName);

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

        this._renderingManager.addSprite(sprite, this._currentLayerOriginalIndex, spriteInfo.atlasIndex);

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

    private _getRasterizationFrame(layer: RawLottieLayer): number {
        const fallback = layer.ip ?? this._startFrame;

        const opacityProp = layer.ks?.o;
        if (!opacityProp || opacityProp.a === 0) {
            return fallback;
        }

        const keyframes = opacityProp.k as RawVectorKeyframe[];
        if (keyframes.length === 0) {
            return fallback;
        }

        // If the first keyframe is already non-zero, the layer is visible from its start.
        if (keyframes[0].s[0] > 0) {
            return Math.max(fallback, keyframes[0].t);
        }

        // Otherwise find the first segment where opacity transitions from 0 to > 0.
        // For held segments (h === 1) the jump happens at the next keyframe's time.
        // For interpolated segments the layer becomes visible just after the current keyframe's time
        // (use t + 1 since lottie frame times are integers in practice).
        for (let i = 0; i < keyframes.length - 1; i++) {
            if (keyframes[i].s[0] === 0 && keyframes[i + 1].s[0] > 0) {
                const visibleFrame = keyframes[i].h === 1 ? keyframes[i + 1].t : keyframes[i].t + 1;
                return Math.max(fallback, visibleFrame);
            }
        }

        // Opacity never transitions to a visible value; fall back to the layer start.
        return fallback;
    }

    private _getRasterizationScale(parent: Node, rasterizationFrame: number): IVector2Like {
        const scale = { x: 1, y: 1 };
        const tempPosition = { x: 0, y: 0 };

        // Always evaluate via decomposeWorldMatrixAtFrame. The cached parent.worldMatrix reflects each
        // ancestor's transform at its own first keyframe time, which is not guaranteed to equal
        // rasterizationFrame (or even _startFrame) — composition ip and per-layer keyframe start times
        // can all differ. decomposeWorldMatrixAtFrame handles frames before/at/after keyframes uniformly.
        parent.decomposeWorldMatrixAtFrame(rasterizationFrame, scale, tempPosition);

        return scale;
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
        let i: number;
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

        // The Lottie spec says `l` is optional and defaults to the array length, but in practice
        // some exporters omit it on `[x, y, 0]` triples (e.g. After Effects emits 3D-style transforms
        // even on 2D layers). We silently treat those as 2D using indices 0/1, but flag the case so
        // we don't keep accepting unexpected component counts unnoticed.
        if (property.l === undefined) {
            const sampleLength = property.a === 0 ? (property.k as number[]).length : ((property.k as RawVectorKeyframe[])[0]?.s?.length ?? 2);
            if (sampleLength !== 2) {
                // Include the original layer index in the dedup key so two layers that happen to share `nm`
                // each get their own warning instead of collapsing to a single message.
                this._pushUnsupportedOnce(
                    `Vector2 missing 'l' with ${sampleLength}-component value (expected 2) - Layer: ${this._currentLayerName ?? "<unknown>"} - LayerIdx: ${this._currentLayerOriginalIndex} - VectorType: ${vectorType}. Using x/y components.`
                );
            }
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
        let i: number;
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
