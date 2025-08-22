import "core/Engines/Extensions/engine.dynamicBuffer";
import "core/Shaders/sprites.vertex";
import "core/Shaders/sprites.fragment";

import type { ThinEngine } from "core/Engines/thinEngine";
import type { ThinTexture } from "core/Materials/Textures/thinTexture";
import type { ThinSprite } from "core/Sprites/thinSprite";
import { SpriteRenderer } from "core/Sprites/spriteRenderer";

import type { ThinMatrix } from "../maths/matrix";

import type { AnimationConfiguration } from "../lottiePlayer";

/**
 * Represents all the sprites from the animation and manages their rendering.
 */
export class RenderingManager {
    private readonly _engine: ThinEngine;
    private readonly _spritesRenderer: SpriteRenderer;
    private readonly _spritesTexture: ThinTexture;
    private _sprites: ThinSprite[];
    private readonly _configuration: AnimationConfiguration;

    /**
     * Creates a new instance of the RenderingManager.
     * @param engine ThinEngine instance used for rendering.
     * @param spriteTexture The texture atlas containing the sprites.
     * @param configuration Configuration options for the rendering manager.
     */
    public constructor(engine: ThinEngine, spriteTexture: ThinTexture, configuration: AnimationConfiguration) {
        this._engine = engine;
        this._spritesTexture = spriteTexture;
        this._sprites = [];
        this._configuration = configuration;

        this._spritesRenderer = new SpriteRenderer(this._engine, this._configuration.spritesCapacity, 0);
        this._spritesRenderer.disableDepthWrite = true;
        this._spritesRenderer.autoResetAlpha = false;
        this._spritesRenderer.fogEnabled = false;
        this._spritesRenderer.texture = this._spritesTexture;
    }

    /**
     * Adds a sprite to the rendering manager.
     * @param sprite Sprite to add to the rendering manager.
     */
    public addSprite(sprite: ThinSprite): void {
        this._sprites.push(sprite);
    }

    /**
     * Prepares the rendering manager for rendering.
     */
    public ready(): void {
        this._sprites = this._sprites.reverse();
    }

    /**
     * Renders all the sprites in the rendering manager.
     * @param worldMatrix World matrix to apply to the sprites.
     * @param projectionMatrix Projection matrix to apply to the sprites.
     */
    public render(worldMatrix: ThinMatrix, projectionMatrix: ThinMatrix): void {
        this._engine.clear(this._configuration.backgroundColor, true, false, false);
        this._spritesRenderer.render(this._sprites, 0, worldMatrix, projectionMatrix, this._customSpriteUpdate);
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
