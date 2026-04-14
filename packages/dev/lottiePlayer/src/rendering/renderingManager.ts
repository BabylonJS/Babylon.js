import "core/Engines/Extensions/engine.dynamicBuffer";
import "core/Shaders/sprites.vertex";
import "core/Shaders/sprites.fragment";

import { type ThinEngine } from "core/Engines/thinEngine";
import { type ThinTexture } from "core/Materials/Textures/thinTexture";
import { type ThinSprite } from "core/Sprites/thinSprite";
import { SpriteRenderer } from "core/Sprites/spriteRenderer";

import { type ThinMatrix } from "../maths/matrix";

import { type AnimationConfiguration } from "../animationConfiguration";

/**
 * Represents all the sprites from the animation and manages their rendering.
 * Supports multiple atlas pages — when sprites span more than one texture,
 * render() performs one pass per page, switching the SpriteRenderer texture between passes.
 */
export class RenderingManager {
    private readonly _engine: ThinEngine;
    private _spritesRenderer: SpriteRenderer;
    private _spritesTextures: ThinTexture[];
    private _sprites: ThinSprite[];
    private _spriteLayerIndices: number[];
    private _spriteAtlasIndices: number[];
    private readonly _configuration: AnimationConfiguration;

    /**
     * Creates a new instance of the RenderingManager.
     * @param engine ThinEngine instance used for rendering.
     * @param configuration Configuration options for the rendering manager.
     */
    public constructor(engine: ThinEngine, configuration: AnimationConfiguration) {
        this._engine = engine;
        this._spritesTextures = [];
        this._sprites = [];
        this._spriteLayerIndices = [];
        this._spriteAtlasIndices = [];
        this._configuration = configuration;

        this._spritesRenderer = new SpriteRenderer(this._engine, this._configuration.spritesCapacity, 0);
        this._spritesRenderer.disableDepthWrite = true;
        this._spritesRenderer.autoResetAlpha = false;
        this._spritesRenderer.fogEnabled = false;
    }

    /**
     * Adds a sprite to the rendering manager.
     * @param sprite Sprite to add to the rendering manager.
     * @param layerIndex The original layer index from the Lottie file, used to determine rendering order.
     * @param atlasIndex The atlas page index this sprite belongs to.
     */
    public addSprite(sprite: ThinSprite, layerIndex: number, atlasIndex: number): void {
        this._sprites.push(sprite);
        this._spriteLayerIndices.push(layerIndex);
        this._spriteAtlasIndices.push(atlasIndex);
    }

    /**
     * Prepares the rendering manager for rendering.
     * Sorts sprites so they render back-to-front based on the original Lottie layer order.
     * In Lottie, layer 0 is the frontmost (rendered last), so higher indices render first (further back).
     * Sprites within the same layer preserve their relative insertion order.
     *
     * Also auto-grows the SpriteRenderer capacity if needed and sets the atlas textures.
     * @param spriteTextures The final array of atlas page textures, captured after all sprites have been packed.
     */
    public ready(spriteTextures: ThinTexture[]): void {
        // Capture the final set of atlas textures now that all sprites have been packed
        this._spritesTextures = spriteTextures;

        // Auto-grow: recreate SpriteRenderer if actual sprite count exceeds configured capacity
        if (this._sprites.length > this._configuration.spritesCapacity) {
            this._spritesRenderer.dispose();
            this._spritesRenderer = new SpriteRenderer(this._engine, this._sprites.length, 0);
            this._spritesRenderer.disableDepthWrite = true;
            this._spritesRenderer.autoResetAlpha = false;
            this._spritesRenderer.fogEnabled = false;
        }

        this._spritesRenderer.texture = this._spritesTextures[0];

        // Build index array and stable-sort by original layer index descending
        const count = this._sprites.length;
        const indices = new Array<number>(count);
        for (let i = 0; i < count; i++) {
            indices[i] = i;
        }
        indices.sort((a, b) => {
            const layerDiff = this._spriteLayerIndices[b] - this._spriteLayerIndices[a];
            if (layerDiff !== 0) {
                return layerDiff;
            }
            // Within the same layer, later-added sprites are further back (rendered first)
            return b - a;
        });
        this._sprites = indices.map((i) => this._sprites[i]);
        this._spriteAtlasIndices = indices.map((i) => this._spriteAtlasIndices[i]);
    }

    /**
     * Renders all the sprites in the rendering manager.
     * When sprites span multiple atlas pages, renders in sorted z-order by batching
     * consecutive runs of sprites that share the same atlas page.
     * @param worldMatrix World matrix to apply to the sprites.
     * @param projectionMatrix Projection matrix to apply to the sprites.
     */
    public render(worldMatrix: ThinMatrix, projectionMatrix: ThinMatrix): void {
        this._engine.clear(this._configuration.backgroundColor, true, false, false);

        if (this._spritesTextures.length <= 1) {
            // Fast path: single atlas — render everything in one call
            this._spritesRenderer.render(this._sprites, 0, worldMatrix, projectionMatrix, this._customSpriteUpdate);
        } else {
            // Multi-atlas: walk the sorted sprite list and batch consecutive runs
            // that share the same atlas page, flushing whenever the page changes.
            let batchStart = 0;
            let currentPage = this._spriteAtlasIndices[0];

            for (let i = 1; i <= this._sprites.length; i++) {
                const page = i < this._sprites.length ? this._spriteAtlasIndices[i] : -1;
                if (page !== currentPage) {
                    // Flush the current batch
                    this._spritesRenderer.texture = this._spritesTextures[currentPage];
                    this._spritesRenderer.render(this._sprites.slice(batchStart, i), 0, worldMatrix, projectionMatrix, this._customSpriteUpdate);
                    batchStart = i;
                    currentPage = page;
                }
            }
        }
    }

    /**
     * Disposes the rendering manager and its resources.
     */
    public dispose(): void {
        this._sprites.length = 0;
        this._spritesRenderer.texture = null; // Prevent disposal of the shared texture atlas.
        this._spritesRenderer.dispose();
    }

    private _customSpriteUpdate = (): void => {
        // All the work is done upfront within the sprite render
        // so that we do not need babylon to update back the information
    };
}
