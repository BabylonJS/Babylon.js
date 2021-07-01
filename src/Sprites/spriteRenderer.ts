import { Nullable } from "../types";
import { Constants } from "../Engines/constants";
import { IMatrixLike } from '../Maths/math.like';
import { ThinEngine } from "../Engines/thinEngine";
import { DataBuffer } from "../Buffers/dataBuffer";
import { Buffer, VertexBuffer } from "../Buffers/buffer";
import { DrawWrapper } from "../Materials/drawWrapper";
import { ThinSprite } from './thinSprite';
import { ISize } from '../Maths/math.size';

declare type ThinTexture = import("../Materials/Textures/thinTexture").ThinTexture;
declare type Scene = import("../scene").Scene;

import "../Engines/Extensions/engine.alpha";
import "../Engines/Extensions/engine.dynamicBuffer";

import "../Shaders/sprites.fragment";
import "../Shaders/sprites.vertex";

/**
 * Class used to render sprites.
 *
 * It can be used either to render Sprites or ThinSriptes with ThinEngine only.
 */
export class SpriteRenderer {
    /**
     * Defines the texture of the spritesheet
     */
    public texture: Nullable<ThinTexture>;

    /**
     * Defines the default width of a cell in the spritesheet
     */
    public cellWidth: number;

    /**
     * Defines the default height of a cell in the spritesheet
     */
    public cellHeight: number;

    /**
     * Blend mode use to render the particle, it can be any of
     * the static Constants.ALPHA_x properties provided in this class.
     * Default value is Constants.ALPHA_COMBINE
     */
    public blendMode = Constants.ALPHA_COMBINE;

    /**
     * Gets or sets a boolean indicating if alpha mode is automatically
     * reset.
     */
    public autoResetAlpha = true;

    /**
     * Disables writing to the depth buffer when rendering the sprites.
     * It can be handy to disable depth writing when using textures without alpha channel
     * and setting some specific blend modes.
     */
    public disableDepthWrite: boolean = false;

    /**
     * Gets or sets a boolean indicating if the manager must consider scene fog when rendering
     */
    public fogEnabled = true;

    /**
     * Gets the capacity of the manager
     */
    public get capacity() {
        return this._capacity;
    }

    private readonly _engine: ThinEngine;
    private readonly _useVAO: boolean = false;
    private readonly _useInstancing: boolean = false;
    private readonly _scene: Nullable<Scene>;

    private readonly _capacity: number;
    private readonly _epsilon: number;

    private _vertexBufferSize: number;
    private _vertexData: Float32Array;
    private _buffer: Buffer;
    private _vertexBuffers: { [key: string]: VertexBuffer } = {};
    private _spriteBuffer: Nullable<Buffer>;
    private _indexBuffer: DataBuffer;
    private _drawWrapperBase: DrawWrapper;
    private _drawWrapperFog: DrawWrapper;
    private _vertexArrayObject: WebGLVertexArrayObject;

    /**
     * Creates a new sprite Renderer
     * @param engine defines the engine the renderer works with
     * @param capacity defines the maximum allowed number of sprites
     * @param epsilon defines the epsilon value to align texture (0.01 by default)
     * @param scene defines the hosting scene
     */
    constructor(
        engine: ThinEngine,
        capacity: number,
        epsilon: number = 0.01,
        scene: Nullable<Scene> = null) {

        this._capacity = capacity;
        this._epsilon = epsilon;

        this._engine = engine;
        this._useInstancing = engine.getCaps().instancedArrays;
        this._useVAO = engine.getCaps().vertexArrayObject && !engine.disableVertexArrayObjects;
        this._scene = scene;
        this._drawWrapperBase = new DrawWrapper(engine);
        this._drawWrapperFog = new DrawWrapper(engine);

        if (!this._useInstancing) {
            this._buildIndexBuffer();
        }

        // VBO
        // 18 floats per sprite (x, y, z, angle, sizeX, sizeY, offsetX, offsetY, invertU, invertV, cellLeft, cellTop, cellWidth, cellHeight, color r, color g, color b, color a)
        // 16 when using instances
        this._vertexBufferSize = this._useInstancing ? 16 : 18;
        this._vertexData = new Float32Array(capacity * this._vertexBufferSize * (this._useInstancing ? 1 : 4));
        this._buffer = new Buffer(engine, this._vertexData, true, this._vertexBufferSize);

        const positions = this._buffer.createVertexBuffer(VertexBuffer.PositionKind, 0, 4, this._vertexBufferSize, this._useInstancing);
        const options = this._buffer.createVertexBuffer("options", 4, 2, this._vertexBufferSize, this._useInstancing);

        let offset = 6;
        let offsets: VertexBuffer;

        if (this._useInstancing) {
            var spriteData = new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]);
            this._spriteBuffer = new Buffer(engine, spriteData, false, 2);
            offsets = this._spriteBuffer.createVertexBuffer("offsets", 0, 2);
        } else {
            offsets = this._buffer.createVertexBuffer("offsets", offset, 2, this._vertexBufferSize, this._useInstancing);
            offset += 2;
        }

        const inverts = this._buffer.createVertexBuffer("inverts", offset, 2, this._vertexBufferSize, this._useInstancing);
        const cellInfo = this._buffer.createVertexBuffer("cellInfo", offset + 2, 4, this._vertexBufferSize, this._useInstancing);
        const colors = this._buffer.createVertexBuffer(VertexBuffer.ColorKind, offset + 6, 4, this._vertexBufferSize, this._useInstancing);

        this._vertexBuffers[VertexBuffer.PositionKind] = positions;
        this._vertexBuffers["options"] = options;
        this._vertexBuffers["offsets"] = offsets;
        this._vertexBuffers["inverts"] = inverts;
        this._vertexBuffers["cellInfo"] = cellInfo;
        this._vertexBuffers[VertexBuffer.ColorKind] = colors;

        // Effects
        this._drawWrapperBase.effect = this._engine.createEffect("sprites",
            [VertexBuffer.PositionKind, "options", "offsets", "inverts", "cellInfo", VertexBuffer.ColorKind],
            ["view", "projection", "textureInfos", "alphaTest"],
            ["diffuseSampler"], "");

        if (this._scene) {
            this._drawWrapperFog.effect = this._scene.getEngine().createEffect("sprites",
                [VertexBuffer.PositionKind, "options", "offsets", "inverts", "cellInfo", VertexBuffer.ColorKind],
                ["view", "projection", "textureInfos", "alphaTest", "vFogInfos", "vFogColor"],
                ["diffuseSampler"], "#define FOG");
        }
    }

    /**
     * Render all child sprites
     * @param sprites defines the list of sprites to render
     * @param deltaTime defines the time since last frame
     * @param viewMatrix defines the viewMatrix to use to render the sprites
     * @param projectionMatrix defines the projectionMatrix to use to render the sprites
     * @param customSpriteUpdate defines a custom function to update the sprites data before they render
     */
    public render(sprites: ThinSprite[], deltaTime: number, viewMatrix: IMatrixLike, projectionMatrix: IMatrixLike, customSpriteUpdate: Nullable<(sprite: ThinSprite, baseSize: ISize) => void> = null): void {
        if (!this.texture || !this.texture.isReady() || !sprites.length) {
            return;
        }

        let drawWrapper = this._drawWrapperBase;
        let shouldRenderFog = false;
        if (this.fogEnabled && this._scene && this._scene.fogEnabled && this._scene.fogMode !== 0) {
            drawWrapper = this._drawWrapperFog;
            shouldRenderFog = true;
        }

        const effect = drawWrapper.effect!;

        // Check
        if (!effect.isReady()) {
            return;
        }

        const engine = this._engine;
        const useRightHandedSystem = !!(this._scene && this._scene.useRightHandedSystem);
        const baseSize = this.texture.getBaseSize();

        // Sprites
        const max = Math.min(this._capacity, sprites.length);

        let offset = 0;
        let noSprite = true;
        for (var index = 0; index < max; index++) {
            const sprite = sprites[index];
            if (!sprite || !sprite.isVisible) {
                continue;
            }

            noSprite = false;
            sprite._animate(deltaTime);

            this._appendSpriteVertex(offset++, sprite, 0, 0, baseSize, useRightHandedSystem, customSpriteUpdate);
            if (!this._useInstancing) {
                this._appendSpriteVertex(offset++, sprite, 1, 0, baseSize, useRightHandedSystem, customSpriteUpdate);
                this._appendSpriteVertex(offset++, sprite, 1, 1, baseSize, useRightHandedSystem, customSpriteUpdate);
                this._appendSpriteVertex(offset++, sprite, 0, 1, baseSize, useRightHandedSystem, customSpriteUpdate);
            }
        }

        if (noSprite) {
            return;
        }

        this._buffer.update(this._vertexData);

        const culling = engine.depthCullingState.cull || true;
        const zOffset = engine.depthCullingState.zOffset;

        engine.setState(culling, zOffset, false, false);

        // Render
        engine.enableEffect(drawWrapper);

        effect.setTexture("diffuseSampler", this.texture);
        effect.setMatrix("view", viewMatrix);
        effect.setMatrix("projection", projectionMatrix);

        // Scene Info
        if (shouldRenderFog) {
            const scene = this._scene!;

            // Fog
            effect.setFloat4("vFogInfos", scene.fogMode, scene.fogStart, scene.fogEnd, scene.fogDensity);
            effect.setColor3("vFogColor", scene.fogColor);
        }

        if (this._useVAO) {
            if (!this._vertexArrayObject) {
                this._vertexArrayObject = engine.recordVertexArrayObject(this._vertexBuffers, this._indexBuffer, effect);
            }
            engine.bindVertexArrayObject(this._vertexArrayObject, this._indexBuffer);
        }
        else {
            // VBOs
            engine.bindBuffers(this._vertexBuffers, this._indexBuffer, effect);
        }

        // Draw order
        engine.depthCullingState.depthFunc = engine.useReverseDepthBuffer ? Constants.GEQUAL : Constants.LEQUAL;
        if (!this.disableDepthWrite) {
            effect.setBool("alphaTest", true);
            engine.setColorWrite(false);
            if (this._useInstancing) {
                engine.drawArraysType(Constants.MATERIAL_TriangleStripDrawMode, 0, 4, offset);
            } else {
                engine.drawElementsType(Constants.MATERIAL_TriangleFillMode, 0, (offset / 4) * 6);
            }
            engine.setColorWrite(true);
            effect.setBool("alphaTest", false);
        }

        engine.setAlphaMode(this.blendMode);
        if (this._useInstancing) {
            engine.drawArraysType(Constants.MATERIAL_TriangleStripDrawMode, 0, 4, offset);
        } else {
            engine.drawElementsType(Constants.MATERIAL_TriangleFillMode, 0, (offset / 4) * 6);
        }

        if (this.autoResetAlpha) {
            engine.setAlphaMode(Constants.ALPHA_DISABLE);
        }

        // Restore Right Handed
        if (useRightHandedSystem) {
            this._scene!.getEngine().setState(culling, zOffset, false, true);
        }

        engine.unbindInstanceAttributes();
    }

    private _appendSpriteVertex(index: number, sprite: ThinSprite, offsetX: number, offsetY: number, baseSize: ISize, useRightHandedSystem: boolean, customSpriteUpdate: Nullable<(sprite: ThinSprite, baseSize: ISize) => void>): void {
        var arrayOffset = index * this._vertexBufferSize;

        if (offsetX === 0) {
            offsetX = this._epsilon;
        }
        else if (offsetX === 1) {
            offsetX = 1 - this._epsilon;
        }

        if (offsetY === 0) {
            offsetY = this._epsilon;
        }
        else if (offsetY === 1) {
            offsetY = 1 - this._epsilon;
        }

        if (customSpriteUpdate) {
            customSpriteUpdate(sprite, baseSize);
        }
        else {
            if (!sprite.cellIndex) {
                sprite.cellIndex = 0;
            }

            const rowSize = baseSize.width / this.cellWidth;
            const offset = (sprite.cellIndex / rowSize) >> 0;
            sprite._xOffset = (sprite.cellIndex - offset * rowSize) * this.cellWidth / baseSize.width;
            sprite._yOffset = offset * this.cellHeight / baseSize.height;
            sprite._xSize = this.cellWidth;
            sprite._ySize = this.cellHeight;
        }

        // Positions
        this._vertexData[arrayOffset] = sprite.position.x;
        this._vertexData[arrayOffset + 1] = sprite.position.y;
        this._vertexData[arrayOffset + 2] = sprite.position.z;
        this._vertexData[arrayOffset + 3] = sprite.angle;
        // Options
        this._vertexData[arrayOffset + 4] = sprite.width;
        this._vertexData[arrayOffset + 5] = sprite.height;

        if (!this._useInstancing) {
            this._vertexData[arrayOffset + 6] = offsetX;
            this._vertexData[arrayOffset + 7] = offsetY;
        } else {
            arrayOffset -= 2;
        }

        // Inverts according to Right Handed
        if (useRightHandedSystem) {
            this._vertexData[arrayOffset + 8] = sprite.invertU ? 0 : 1;
        }
        else {
            this._vertexData[arrayOffset + 8] = sprite.invertU ? 1 : 0;
        }

        this._vertexData[arrayOffset + 9] = sprite.invertV ? 1 : 0;

        this._vertexData[arrayOffset + 10] = sprite._xOffset;
        this._vertexData[arrayOffset + 11] = sprite._yOffset;
        this._vertexData[arrayOffset + 12] = sprite._xSize / baseSize.width;
        this._vertexData[arrayOffset + 13] = sprite._ySize / baseSize.height;

        // Color
        this._vertexData[arrayOffset + 14] = sprite.color.r;
        this._vertexData[arrayOffset + 15] = sprite.color.g;
        this._vertexData[arrayOffset + 16] = sprite.color.b;
        this._vertexData[arrayOffset + 17] = sprite.color.a;
    }

    private _buildIndexBuffer(): void {
        const indices = [];
        let index = 0;
        for (let count = 0; count < this._capacity; count++) {
            indices.push(index);
            indices.push(index + 1);
            indices.push(index + 2);
            indices.push(index);
            indices.push(index + 2);
            indices.push(index + 3);
            index += 4;
        }

        this._indexBuffer = this._engine.createIndexBuffer(indices);
    }

    /**
     * Rebuilds the renderer (after a context lost, for eg)
     */
     public rebuild(): void {
        if (this._indexBuffer) {
            this._buildIndexBuffer();
        }

        if (this._useVAO) {
            this._vertexArrayObject = undefined as any;
        }

        this._buffer._rebuild();

        for (const key in this._vertexBuffers) {
            const vertexBuffer = <VertexBuffer>this._vertexBuffers[key];
            vertexBuffer._rebuild();
        }

        this._spriteBuffer?._rebuild();
    }

    /**
     * Release associated resources
     */
    public dispose(): void {
        if (this._buffer) {
            this._buffer.dispose();
            (<any>this._buffer) = null;
        }

        if (this._spriteBuffer) {
            this._spriteBuffer.dispose();
            (<any>this._spriteBuffer) = null;
        }

        if (this._indexBuffer) {
            this._engine._releaseBuffer(this._indexBuffer);
            (<any>this._indexBuffer) = null;
        }

        if (this._vertexArrayObject) {
            this._engine.releaseVertexArrayObject(this._vertexArrayObject);
            (<any>this._vertexArrayObject) = null;
        }

        if (this.texture) {
            this.texture.dispose();
            (<any>this.texture) = null;
        }
    }
}