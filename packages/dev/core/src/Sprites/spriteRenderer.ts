import { type Nullable } from "../types";
import { Constants } from "../Engines/constants";
import { type IMatrixLike } from "../Maths/math.like";
import { type AbstractEngine } from "../Engines/abstractEngine";
import { type DataBuffer } from "../Buffers/dataBuffer";
import { Buffer, VertexBuffer } from "../Buffers/buffer.pure";
import { DrawWrapper } from "../Materials/drawWrapper";
import { type ThinSprite } from "./thinSprite";
import { type ISize } from "../Maths/math.size";

import { type ThinTexture } from "../Materials/Textures/thinTexture";
import { type Scene } from "../scene";
import { type ThinEngine } from "../Engines/thinEngine";
import { Logger } from "../Misc/logger";
import { BindLogDepth } from "../Materials/materialHelper.functions";
import { ShaderLanguage } from "../Materials/shaderLanguage";
import { Matrix, Vector3 } from "../Maths/math.vector.pure";
import { MaterialHelperGeometryRendering } from "../Materials/materialHelper.geometryrendering";
import { type Effect, type IEffectCreationOptions } from "../Materials/effect";

type SpriteRendererSpriteHistory = {
    previousX: number;
    previousY: number;
    previousZ: number;
    previousAngle: number;
    previousWidth: number;
    previousHeight: number;
    currentX: number;
    currentY: number;
    currentZ: number;
    currentAngle: number;
    currentWidth: number;
    currentHeight: number;
    frameId: number;
};

type SpriteRendererCameraHistory = {
    previousView: Matrix;
    previousProjection: Matrix;
    currentView: Matrix;
    currentProjection: Matrix;
    sprites: WeakMap<ThinSprite, SpriteRendererSpriteHistory>;
    frameId: number;
};

type SpriteRendererDrawCache = {
    drawWrapperBase: DrawWrapper;
    drawWrapperDepth: DrawWrapper;
    defines: string;
    geometryDefines?: string;
    variantKey: number;
    vertexBuffers: { [key: string]: VertexBuffer };
    vertexArrayObject?: WebGLVertexArrayObject;
    usesGeometryRendering: boolean;
    usesVelocity: boolean;
    usesObjectId: boolean;
    usesMeshBlendTag: boolean;
    cameraHistories?: WeakMap<object, SpriteRendererCameraHistory>;
};

/**
 * Options for the SpriteRenderer
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export interface SpriteRendererOptions {
    /**
     * Sets a boolean indicating if the renderer must render sprites with pixel perfect rendering.
     * In this mode, sprites are rendered as "pixel art", which means that they appear as pixelated but remain stable when moving or when rotated or scaled.
     * Note that for this mode to work as expected, the sprite texture must use the BILINEAR sampling mode, not NEAREST!
     * Default is false.
     */
    pixelPerfect?: boolean;
}

/**
 * Class used to render sprites.
 *
 * It can be used either to render Sprites or ThinSprites with ThinEngine only.
 */
export class SpriteRenderer {
    /**
     * Force all the sprites to compile to glsl even on WebGPU engines.
     * False by default. This is mostly meant for backward compatibility.
     */
    public static ForceGLSL = false;
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

    private _fogEnabled = true;

    /**
     * Gets or sets a boolean indicating if the manager must consider scene fog when rendering
     */
    public get fogEnabled() {
        return this._fogEnabled;
    }

    public set fogEnabled(value: boolean) {
        if (this._fogEnabled === value) {
            return;
        }

        this._fogEnabled = value;
        this._createEffects();
    }

    protected _useLogarithmicDepth: boolean;

    /**
     * In case the depth buffer does not allow enough depth precision for your scene (might be the case in large scenes)
     * You can try switching to logarithmic depth.
     * @see https://doc.babylonjs.com/features/featuresDeepDive/materials/advanced/logarithmicDepthBuffer
     */
    public get useLogarithmicDepth(): boolean {
        return this._useLogarithmicDepth;
    }

    public set useLogarithmicDepth(value: boolean) {
        const fragmentDepthSupported = !!this._scene?.getEngine().getCaps().fragmentDepthSupported;

        if (value && !fragmentDepthSupported) {
            Logger.Warn("Logarithmic depth has been requested for a sprite renderer on a device that doesn't support it.");
        }

        this._useLogarithmicDepth = value && fragmentDepthSupported;
        this._createEffects();
    }

    /**
     * Gets the capacity of the manager
     */
    public get capacity() {
        return this._capacity;
    }

    private _pixelPerfect = false;

    /**
     * Gets or sets a boolean indicating if the renderer must render sprites with pixel perfect rendering
     * Note that pixel perfect mode is not supported in WebGL 1
     */
    public get pixelPerfect() {
        return this._pixelPerfect;
    }

    public set pixelPerfect(value: boolean) {
        if (this._pixelPerfect === value) {
            return;
        }

        this._pixelPerfect = value;
        this._createEffects();
    }

    /** Shader language used by the material */
    protected _shaderLanguage = ShaderLanguage.GLSL;

    /**
     * Gets the shader language used in this renderer.
     */
    public get shaderLanguage(): ShaderLanguage {
        return this._shaderLanguage;
    }

    private readonly _engine: AbstractEngine;
    private readonly _useVAO: boolean = false;
    private readonly _useInstancing: boolean = false;
    private readonly _scene: Nullable<Scene>;

    private readonly _capacity: number;
    private readonly _epsilon: number;

    private _vertexBufferSize: number;
    private _vertexData: Float32Array;
    private _buffer: Buffer;
    private _vertexBuffers: { [key: string]: VertexBuffer } = {};
    private _previousVertexData: Nullable<Float32Array> = null;
    private _previousBuffer: Nullable<Buffer> = null;
    private _vertexBuffersWithPrevious: Nullable<{ [key: string]: VertexBuffer }> = null;
    private _spriteBuffer: Nullable<Buffer>;
    private _indexBuffer: DataBuffer;
    /** @internal */
    public _drawWrapperBase: DrawWrapper;
    /** @internal */
    public _drawWrapperDepth: DrawWrapper;
    private _drawCaches: Array<SpriteRendererDrawCache | undefined> = [];
    private _inverseViewMatrix: Nullable<Matrix> = null;
    private _isDisposed = false;

    /**
     * Creates a new sprite renderer
     * @param engine defines the engine the renderer works with
     * @param capacity defines the maximum allowed number of sprites
     * @param epsilon defines the epsilon value to align texture (0.01 by default)
     * @param scene defines the hosting scene
     * @param rendererOptions options for the sprite renderer
     */
    constructor(engine: AbstractEngine, capacity: number, epsilon: number = 0.01, scene: Nullable<Scene> = null, rendererOptions?: SpriteRendererOptions) {
        this._pixelPerfect = rendererOptions?.pixelPerfect ?? false;
        this._capacity = capacity;
        this._epsilon = epsilon;

        this._engine = engine;
        this._useInstancing = engine.getCaps().instancedArrays && engine._features.supportSpriteInstancing;
        this._useVAO = engine.getCaps().vertexArrayObject && !engine.disableVertexArrayObjects;
        this._scene = scene;

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
            const spriteData = new Float32Array([
                this._epsilon,
                this._epsilon,
                1 - this._epsilon,
                this._epsilon,
                this._epsilon,
                1 - this._epsilon,
                1 - this._epsilon,
                1 - this._epsilon,
            ]);
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

        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        this._initShaderSourceAsync();
    }

    private _shadersLoaded = false;

    private async _initShaderSourceAsync() {
        const engine = this._engine;

        if (engine.isWebGPU && !SpriteRenderer.ForceGLSL) {
            this._shaderLanguage = ShaderLanguage.WGSL;

            await Promise.all([import("../ShadersWGSL/sprites.vertex"), import("../ShadersWGSL/sprites.fragment")]);
        } else {
            await Promise.all([import("../Shaders/sprites.vertex"), import("../Shaders/sprites.fragment")]);
        }

        this._shadersLoaded = true;
        this._createEffects();
    }

    /**
     * Checks whether the texture and shader variant for the current render pass are ready.
     * This prepares the effect without updating or drawing any sprites.
     * @returns true when the renderer can draw sprites
     * @see https://playground.babylonjs.com/#PVK3RV#2
     */
    public isReady(): boolean {
        if (this._isDisposed || !this._shadersLoaded || !this.texture?.isReady()) {
            return false;
        }
        const renderPassId = this._engine._features.supportRenderPasses ? this._engine.currentRenderPassId : Constants.RENDERPASS_MAIN;
        return !!this._getDrawCache(renderPassId).drawWrapperBase.effect?.isReady();
    }

    private _createEffects() {
        if (this._isDisposed || !this._shadersLoaded) {
            return;
        }

        this._disposeDrawCaches();

        const mainCache = this._getDrawCache(Constants.RENDERPASS_MAIN);
        this._drawWrapperBase = mainCache.drawWrapperBase;
        this._drawWrapperDepth = mainCache.drawWrapperDepth;
    }

    private _getDrawCache(renderPassId: number): SpriteRendererDrawCache {
        const fogEnabled = !!(this._scene && this._scene.fogEnabled && this._scene.fogMode !== 0 && this._fogEnabled);
        const variantKey = (this._pixelPerfect ? 1 : 0) | (fogEnabled ? 2 : 0) | (this._useLogarithmicDepth ? 4 : 0);
        const geometryDefines = MaterialHelperGeometryRendering.GetConfiguration(renderPassId)?._defines;
        let cache = this._drawCaches[renderPassId];

        if (cache?.variantKey === variantKey && cache.geometryDefines === geometryDefines) {
            return cache;
        }

        const defines: string[] = [];

        if (this._pixelPerfect) {
            defines.push("#define PIXEL_PERFECT");
        }
        if (fogEnabled) {
            defines.push("#define FOG");
        }
        if (this._useLogarithmicDepth) {
            defines.push("#define LOGARITHMICDEPTH");
        }

        const usesGeometryRendering = MaterialHelperGeometryRendering._PrepareStringDefines(renderPassId, defines);
        const mrtCount = usesGeometryRendering ? (MaterialHelperGeometryRendering.GetConfiguration(renderPassId)._mrtCount ?? 0) : 0;
        if (!usesGeometryRendering) {
            defines.push("#define SCENE_MRT_COUNT 0");
        }
        const joinedDefines = defines.join("\n");

        if (cache) {
            this._disposeDrawCache(cache);
            this._drawCaches[renderPassId] = undefined;
        }

        const usesVelocity = joinedDefines.indexOf("#define PREPASS_VELOCITY\n") !== -1 || joinedDefines.indexOf("#define PREPASS_VELOCITY_LINEAR\n") !== -1;
        const usesObjectId = joinedDefines.indexOf("#define PREPASS_OBJECT_ID\n") !== -1;
        const usesMeshBlendTag = joinedDefines.indexOf("#define PREPASS_MESH_BLEND_TAG\n") !== -1;
        const attributes = [VertexBuffer.PositionKind, "options", "offsets", "inverts", "cellInfo", VertexBuffer.ColorKind];
        let vertexBuffers = this._vertexBuffers;

        if (usesVelocity) {
            vertexBuffers = this._ensurePreviousVertexBuffer();
            attributes.push("previousPosition", "previousOptions");
        }

        const uniforms = [
            "view",
            "projection",
            "textureInfos",
            "alphaTest",
            "vFogInfos",
            "vFogColor",
            "logarithmicDepthConstant",
            "invView",
            "cameraInfo",
            "spriteNormalSign",
            "previousView",
            "previousProjection",
            "objectId",
            "meshBlendTag",
        ];
        const drawWrapperBase = new DrawWrapper(this._engine);
        const drawWrapperDepth = new DrawWrapper(this._engine, false);

        if (drawWrapperBase.drawContext) {
            drawWrapperBase.drawContext.useInstancing = this._useInstancing;
        }
        if (drawWrapperDepth.drawContext) {
            drawWrapperDepth.drawContext.useInstancing = this._useInstancing;
        }

        const effectOptions: IEffectCreationOptions = {
            attributes,
            uniformsNames: uniforms,
            samplers: ["diffuseSampler"],
            defines: joinedDefines,
            fallbacks: null,
            onCompiled: null,
            onError: null,
            indexParameters: { SCENE_MRT_COUNT: mrtCount },
            multiTarget: usesGeometryRendering,
            shaderLanguage: this._shaderLanguage,
        };
        const effect = this._engine.createEffect("sprites", effectOptions, this._engine);

        drawWrapperBase.effect = effect;
        drawWrapperBase.defines = joinedDefines;
        drawWrapperDepth.effect = effect;
        effect._refCount++;
        drawWrapperDepth.defines = joinedDefines;
        drawWrapperDepth.materialContext = drawWrapperBase.materialContext;

        cache = {
            drawWrapperBase,
            drawWrapperDepth,
            defines: joinedDefines,
            geometryDefines,
            variantKey,
            vertexBuffers,
            usesGeometryRendering,
            usesVelocity,
            usesObjectId,
            usesMeshBlendTag,
            cameraHistories: usesVelocity ? new WeakMap<object, SpriteRendererCameraHistory>() : undefined,
        };
        this._drawCaches[renderPassId] = cache;
        this._disposePreviousVertexBufferIfUnused();

        return cache;
    }

    private _ensurePreviousVertexBuffer(): { [key: string]: VertexBuffer } {
        if (this._vertexBuffersWithPrevious) {
            return this._vertexBuffersWithPrevious;
        }

        const previousVertexBufferSize = 6;
        this._previousVertexData = new Float32Array(this._capacity * previousVertexBufferSize * (this._useInstancing ? 1 : 4));
        this._previousBuffer = new Buffer(this._engine, this._previousVertexData, true, previousVertexBufferSize);
        this._vertexBuffersWithPrevious = { ...this._vertexBuffers };
        this._vertexBuffersWithPrevious["previousPosition"] = this._previousBuffer.createVertexBuffer("previousPosition", 0, 4, previousVertexBufferSize, this._useInstancing);
        this._vertexBuffersWithPrevious["previousOptions"] = this._previousBuffer.createVertexBuffer("previousOptions", 4, 2, previousVertexBufferSize, this._useInstancing);

        return this._vertexBuffersWithPrevious;
    }

    private _disposeDrawCache(cache: SpriteRendererDrawCache): void {
        if (cache.vertexArrayObject) {
            (this._engine as ThinEngine).releaseVertexArrayObject(cache.vertexArrayObject);
        }
        cache.drawWrapperBase.dispose();
        cache.drawWrapperDepth.dispose();
    }

    private _disposeDrawCaches(): void {
        for (const cache of this._drawCaches) {
            if (cache) {
                this._disposeDrawCache(cache);
            }
        }
        this._drawCaches = [];
        this._disposePreviousVertexBuffer();
    }

    private _disposePreviousVertexBufferIfUnused(): void {
        for (const cache of this._drawCaches) {
            if (cache?.usesVelocity) {
                return;
            }
        }
        this._disposePreviousVertexBuffer();
    }

    private _disposePreviousVertexBuffer(): void {
        if (this._previousBuffer) {
            this._previousBuffer.dispose();
            this._previousBuffer = null;
            this._previousVertexData = null;
            this._vertexBuffersWithPrevious = null;
        }
    }

    private _bindVertexBuffers(cache: SpriteRendererDrawCache, effect: Effect): void {
        if (this._useVAO) {
            if (!cache.vertexArrayObject) {
                cache.vertexArrayObject = (this._engine as ThinEngine).recordVertexArrayObject(cache.vertexBuffers, this._indexBuffer, effect);
            }
            (this._engine as ThinEngine).bindVertexArrayObject(cache.vertexArrayObject, this._indexBuffer);
        } else {
            this._engine.bindBuffers(cache.vertexBuffers, this._indexBuffer, effect);
        }
    }

    private _getCameraHistory(cache: SpriteRendererDrawCache, viewMatrix: IMatrixLike, projectionMatrix: IMatrixLike, frameId: number): SpriteRendererCameraHistory {
        const cameraKey = (this._scene?.activeCamera ?? viewMatrix) as object;
        let history = cache.cameraHistories!.get(cameraKey);

        if (!history) {
            const currentView = Matrix.FromArray(viewMatrix.asArray());
            const currentProjection = Matrix.FromArray(projectionMatrix.asArray());
            history = {
                previousView: currentView.clone(),
                previousProjection: currentProjection.clone(),
                currentView,
                currentProjection,
                sprites: new WeakMap<ThinSprite, SpriteRendererSpriteHistory>(),
                frameId,
            };
            cache.cameraHistories!.set(cameraKey, history);
        } else if (history.frameId !== frameId) {
            history.previousView.copyFrom(history.currentView);
            history.previousProjection.copyFrom(history.currentProjection);
            Matrix.FromArrayToRef(viewMatrix.asArray(), 0, history.currentView);
            Matrix.FromArrayToRef(projectionMatrix.asArray(), 0, history.currentProjection);
            history.frameId = frameId;
        }

        return history;
    }

    private _prepareSpriteHistory(history: SpriteRendererCameraHistory, sprite: ThinSprite, frameId: number): Nullable<SpriteRendererSpriteHistory> {
        const spriteHistory = history.sprites.get(sprite);
        if (spriteHistory && spriteHistory.frameId !== frameId) {
            spriteHistory.previousX = spriteHistory.currentX;
            spriteHistory.previousY = spriteHistory.currentY;
            spriteHistory.previousZ = spriteHistory.currentZ;
            spriteHistory.previousAngle = spriteHistory.currentAngle;
            spriteHistory.previousWidth = spriteHistory.currentWidth;
            spriteHistory.previousHeight = spriteHistory.currentHeight;
            spriteHistory.frameId = frameId;
        }
        return spriteHistory ?? null;
    }

    private _updateSpriteHistory(
        history: SpriteRendererCameraHistory,
        sprite: ThinSprite,
        spriteHistory: Nullable<SpriteRendererSpriteHistory>,
        floatingOriginOffset: Vector3,
        frameId: number
    ): void {
        const x = sprite.position.x - floatingOriginOffset.x;
        const y = sprite.position.y - floatingOriginOffset.y;
        const z = sprite.position.z - floatingOriginOffset.z;

        if (!spriteHistory) {
            history.sprites.set(sprite, {
                previousX: x,
                previousY: y,
                previousZ: z,
                previousAngle: sprite.angle,
                previousWidth: sprite.width,
                previousHeight: sprite.height,
                currentX: x,
                currentY: y,
                currentZ: z,
                currentAngle: sprite.angle,
                currentWidth: sprite.width,
                currentHeight: sprite.height,
                frameId,
            });
            return;
        }

        if (spriteHistory.frameId === frameId) {
            spriteHistory.currentX = x;
            spriteHistory.currentY = y;
            spriteHistory.currentZ = z;
            spriteHistory.currentAngle = sprite.angle;
            spriteHistory.currentWidth = sprite.width;
            spriteHistory.currentHeight = sprite.height;
        }
    }

    private _animateSprite(sprite: ThinSprite, deltaTime: number): void {
        if (!this._scene) {
            sprite._animate(deltaTime);
            return;
        }

        const frameId = this._scene.getFrameId();
        const frameGraphRendering = !!this._scene.frameGraph || !!MaterialHelperGeometryRendering.GetConfiguration(this._engine.currentRenderPassId);
        if (!frameGraphRendering || sprite._animationFrameId !== frameId || sprite._animationSceneId !== this._scene.uniqueId) {
            sprite._animationFrameId = frameId;
            sprite._animationSceneId = this._scene.uniqueId;
            sprite._animate(deltaTime);
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
    public render(
        sprites: ThinSprite[],
        deltaTime: number,
        viewMatrix: IMatrixLike,
        projectionMatrix: IMatrixLike,
        customSpriteUpdate: Nullable<(sprite: ThinSprite, baseSize: ISize) => void> = null
    ): void {
        if (!this._shadersLoaded || !this.texture || !this.texture.isReady() || !sprites.length) {
            return;
        }

        const engine = this._engine;
        const renderPassId = engine._features.supportRenderPasses ? engine.currentRenderPassId : Constants.RENDERPASS_MAIN;
        const drawCache = this._getDrawCache(renderPassId);
        const drawWrapper = drawCache.drawWrapperBase;
        const drawWrapperDepth = drawCache.drawWrapperDepth;
        const shouldRenderFog = this.fogEnabled && this._scene && this._scene.fogEnabled && this._scene.fogMode !== 0;

        const effect = drawWrapper.effect!;

        // Check
        if (!effect.isReady()) {
            return;
        }

        const useRightHandedSystem = !!(this._scene && this._scene.useRightHandedSystem);
        const frameId = this._scene?.getFrameId() ?? engine.frameId;
        const cameraHistory = drawCache.usesVelocity ? this._getCameraHistory(drawCache, viewMatrix, projectionMatrix, frameId) : null;

        // Sprites
        const max = Math.min(this._capacity, sprites.length);

        let offset = 0;
        let noSprite = true;
        const floatingOriginOffset = this._scene?.floatingOriginOffset || Vector3.ZeroReadOnly;
        for (let index = 0; index < max; index++) {
            const sprite = sprites[index];
            if (!sprite || !sprite.isVisible) {
                continue;
            }

            noSprite = false;
            this._animateSprite(sprite, deltaTime);
            const baseSize = this.texture.getBaseSize(); // This could be change by the user inside the animate callback (like onAnimationEnd)
            const spriteHistory = cameraHistory ? this._prepareSpriteHistory(cameraHistory, sprite, frameId) : null;

            this._appendSpriteVertex(offset++, sprite, 0, 0, baseSize, useRightHandedSystem, customSpriteUpdate, floatingOriginOffset, spriteHistory);
            if (!this._useInstancing) {
                this._appendSpriteVertex(offset++, sprite, 1, 0, baseSize, useRightHandedSystem, customSpriteUpdate, floatingOriginOffset, spriteHistory);
                this._appendSpriteVertex(offset++, sprite, 1, 1, baseSize, useRightHandedSystem, customSpriteUpdate, floatingOriginOffset, spriteHistory);
                this._appendSpriteVertex(offset++, sprite, 0, 1, baseSize, useRightHandedSystem, customSpriteUpdate, floatingOriginOffset, spriteHistory);
            }

            if (cameraHistory) {
                this._updateSpriteHistory(cameraHistory, sprite, spriteHistory, floatingOriginOffset, frameId);
            }
        }

        if (noSprite) {
            return;
        }

        this._buffer.update(this._vertexData);
        if (drawCache.usesVelocity) {
            this._previousBuffer!.update(this._previousVertexData!);
        }

        const culling = !!engine.depthCullingState.cull;
        const zOffset = engine.depthCullingState.zOffset;
        const zOffsetUnits = engine.depthCullingState.zOffsetUnits;

        engine.setState(culling, zOffset, false, false, undefined, undefined, zOffsetUnits);

        // Render
        engine.enableEffect(drawWrapper);

        effect.setTexture("diffuseSampler", this.texture);
        effect.setMatrix("view", viewMatrix);
        effect.setMatrix("projection", projectionMatrix);

        if (drawCache.usesGeometryRendering) {
            this._inverseViewMatrix ??= Matrix.Identity();
            Matrix.FromArrayToRef(viewMatrix.asArray(), 0, this._inverseViewMatrix).invertToRef(this._inverseViewMatrix);
            effect.setMatrix("invView", this._inverseViewMatrix);
            effect.setFloat("spriteNormalSign", useRightHandedSystem ? 1 : -1);

            const camera = this._scene?.activeCamera;
            effect.setFloat2("cameraInfo", camera?.minZ ?? 0, camera?.maxZ ?? 1);

            if (drawCache.usesObjectId) {
                effect.setFloat("objectId", 0);
            }
            if (drawCache.usesMeshBlendTag) {
                effect.setInt("meshBlendTag", 0);
            }
            if (cameraHistory) {
                effect.setMatrix("previousView", cameraHistory.previousView);
                effect.setMatrix("previousProjection", cameraHistory.previousProjection);
            }
        }

        // Scene Info
        if (shouldRenderFog) {
            const scene = this._scene;

            // Fog
            effect.setFloat4("vFogInfos", scene.fogMode, scene.fogStart, scene.fogEnd, scene.fogDensity);
            effect.setColor3("vFogColor", scene.fogColor);
        }

        // Log. depth
        if (this.useLogarithmicDepth && this._scene) {
            BindLogDepth(drawWrapper.defines, effect, this._scene);
        }

        this._bindVertexBuffers(drawCache, effect);

        // Draw order
        engine.depthCullingState.depthFunc = engine.useReverseDepthBuffer ? Constants.GEQUAL : Constants.LEQUAL;
        if (!this.disableDepthWrite) {
            effect.setBool("alphaTest", true);
            engine.setColorWrite(false);
            engine.enableEffect(drawWrapperDepth);
            if (this._useInstancing) {
                engine.drawArraysType(Constants.MATERIAL_TriangleStripDrawMode, 0, 4, offset);
            } else {
                engine.drawElementsType(Constants.MATERIAL_TriangleFillMode, 0, (offset / 4) * 6);
            }
            engine.enableEffect(drawWrapper);
            engine.setColorWrite(true);
            effect.setBool("alphaTest", false);
        }

        engine.setAlphaMode(this.blendMode);
        if (MaterialHelperGeometryRendering._BindAttachmentsForEffect(engine, effect)) {
            if (this._useInstancing) {
                engine.drawArraysType(Constants.MATERIAL_TriangleStripDrawMode, 0, 4, offset);
            } else {
                engine.drawElementsType(Constants.MATERIAL_TriangleFillMode, 0, (offset / 4) * 6);
            }
        }
        MaterialHelperGeometryRendering._RestoreAttachments(engine);

        if (this.autoResetAlpha) {
            engine.setAlphaMode(Constants.ALPHA_DISABLE);
        }

        // Restore Right Handed
        if (useRightHandedSystem) {
            this._scene.getEngine().setState(culling, zOffset, false, true, undefined, undefined, zOffsetUnits);
        }

        engine.unbindInstanceAttributes();
    }

    private _appendSpriteVertex(
        index: number,
        sprite: ThinSprite,
        offsetX: number,
        offsetY: number,
        baseSize: ISize,
        useRightHandedSystem: boolean,
        customSpriteUpdate: Nullable<(sprite: ThinSprite, baseSize: ISize) => void>,
        floatingOriginOffset: Vector3,
        spriteHistory: Nullable<SpriteRendererSpriteHistory>
    ): void {
        let arrayOffset = index * this._vertexBufferSize;

        if (offsetX === 0) {
            offsetX = this._epsilon;
        } else if (offsetX === 1) {
            offsetX = 1 - this._epsilon;
        }

        if (offsetY === 0) {
            offsetY = this._epsilon;
        } else if (offsetY === 1) {
            offsetY = 1 - this._epsilon;
        }

        if (customSpriteUpdate) {
            customSpriteUpdate(sprite, baseSize);
        } else {
            if (!sprite.cellIndex) {
                sprite.cellIndex = 0;
            }

            const rowSize = baseSize.width / this.cellWidth;
            const offset = (sprite.cellIndex / rowSize) >> 0;
            sprite._xOffset = ((sprite.cellIndex - offset * rowSize) * this.cellWidth) / baseSize.width;
            sprite._yOffset = (offset * this.cellHeight) / baseSize.height;
            sprite._xSize = this.cellWidth;
            sprite._ySize = this.cellHeight;
        }

        // Positions
        this._vertexData[arrayOffset] = sprite.position.x - floatingOriginOffset.x;
        this._vertexData[arrayOffset + 1] = sprite.position.y - floatingOriginOffset.y;
        this._vertexData[arrayOffset + 2] = sprite.position.z - floatingOriginOffset.z;
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
        } else {
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

        if (this._previousVertexData) {
            const previousArrayOffset = index * 6;
            this._previousVertexData[previousArrayOffset] = spriteHistory?.previousX ?? sprite.position.x - floatingOriginOffset.x;
            this._previousVertexData[previousArrayOffset + 1] = spriteHistory?.previousY ?? sprite.position.y - floatingOriginOffset.y;
            this._previousVertexData[previousArrayOffset + 2] = spriteHistory?.previousZ ?? sprite.position.z - floatingOriginOffset.z;
            this._previousVertexData[previousArrayOffset + 3] = spriteHistory?.previousAngle ?? sprite.angle;
            this._previousVertexData[previousArrayOffset + 4] = spriteHistory?.previousWidth ?? sprite.width;
            this._previousVertexData[previousArrayOffset + 5] = spriteHistory?.previousHeight ?? sprite.height;
        }
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
            for (const cache of this._drawCaches) {
                if (cache) {
                    cache.vertexArrayObject = undefined;
                }
            }
        }

        this._buffer._rebuild();

        for (const key in this._vertexBuffers) {
            const vertexBuffer = this._vertexBuffers[key];
            vertexBuffer._rebuild();
        }

        this._spriteBuffer?._rebuild();
        this._previousBuffer?._rebuild();
    }

    /**
     * Release associated resources
     */
    public dispose(): void {
        this._disposeDrawCaches();

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

        if (this.texture) {
            this.texture.dispose();
            (<any>this.texture) = null;
        }
        this._isDisposed = true;
    }
}
