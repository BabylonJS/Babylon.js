// Copyright (c) Microsoft Corporation. All rights reserved.

import "core/Engines/Extensions/engine.dynamicBuffer";
import "core/Shaders/sprites.vertex";
import "core/Shaders/sprites.fragment";

import type { ThinEngine } from "core/Engines/thinEngine";
import type { ThinTexture } from "core/Materials/Textures/thinTexture";
import type { ThinSprite } from "core/Sprites/thinSprite";
import { SpriteRenderer } from "core/Sprites/spriteRenderer";

import type { ThinMatrix } from "../maths/matrix";

import { DefaultCapacity, White } from "../config";

/**
 * Represents all the sprites from the animation and manages their rendering.
 */
export class RenderingManager {
    private _engine: ThinEngine;
    private _spritesRenderer: SpriteRenderer;
    private _spritesTexture: ThinTexture;
    private _sprites: ThinSprite[];

    /**
     * Creates a new instance of the RenderingManager.
     * @param engine ThinEngine instance used for rendering.
     * @param spriteTexture The texture atlas containing the sprites.
     */
    public constructor(engine: ThinEngine, spriteTexture: ThinTexture) {
        this._engine = engine;
        this._spritesTexture = spriteTexture;
        this._sprites = [];

        this._spritesRenderer = new SpriteRenderer(this._engine, DefaultCapacity, 0);
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
        this._engine.clear(White, true, false, false);
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
