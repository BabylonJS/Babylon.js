import { afterEach, describe, expect, it, vi } from "vitest";
import { NullEngine } from "core/Engines/nullEngine";
import { Constants } from "core/Engines/constants";
import { Scene } from "core/scene";
import { SpriteRenderer } from "core/Sprites/spriteRenderer";
import { ThinSprite } from "core/Sprites/thinSprite";
import { MaterialHelperGeometryRendering } from "core/Materials/materialHelper.geometryrendering";
import { type DrawWrapper } from "core/Materials/drawWrapper";
import { type Effect, type IEffectCreationOptions } from "core/Materials/effect";
import { type VertexBuffer } from "core/Buffers/buffer";
import { RawTexture } from "core/Materials/Textures/rawTexture";
import { Matrix, Vector3 } from "core/Maths/math.vector";
import "core/Engines/Extensions/engine.multiRender";
import "core/Engines/AbstractEngine/abstractEngine.renderPass";
import "core/Shaders/sprites.vertex";
import "core/Shaders/sprites.fragment";

type SpriteRendererDrawCache = {
    drawWrapperBase: DrawWrapper;
    drawWrapperDepth: DrawWrapper;
    defines: string;
    variantKey: number;
    vertexBuffers: { [key: string]: VertexBuffer };
    vertexArrayObject?: WebGLVertexArrayObject;
    usesVelocity: boolean;
    usesInverseView: boolean;
};

type SpriteHistory = { previousX: number; currentX: number; frameId: number };
type CameraHistory = {
    previousView: Matrix;
    currentView: Matrix;
    sprites: WeakMap<ThinSprite, SpriteHistory>;
};

type SpriteRendererInternals = {
    _shadersLoaded: boolean;
    _useVAO: boolean;
    _previousBuffer: unknown;
    _previousVertexData: Float32Array;
    _drawCaches: Array<SpriteRendererDrawCache | undefined>;
    _getDrawCache: (renderPassId: number) => SpriteRendererDrawCache;
    _bindVertexBuffers: (cache: SpriteRendererDrawCache, effect: Effect) => void;
    _animateSprite: (sprite: ThinSprite, deltaTime: number) => void;
    _getCameraHistory: (cache: SpriteRendererDrawCache, view: Matrix, projection: Matrix, frameId: number) => CameraHistory;
    _prepareSpriteHistory: (history: CameraHistory, sprite: ThinSprite, frameId: number) => SpriteHistory | null;
    _updateSpriteHistory: (history: CameraHistory, sprite: ThinSprite, previous: SpriteHistory | null, origin: Vector3, frameId: number) => void;
    _appendSpriteVertex: (...args: unknown[]) => void;
};

const createReadyEffect = (engine: NullEngine): Effect =>
    ({
        _refCount: 1,
        dispose: vi.fn(),
        getEngine: () => engine,
        isReady: () => true,
        setTexture: vi.fn(),
        setMatrix: vi.fn(),
        setFloat: vi.fn(),
        setInt: vi.fn(),
        setFloat2: vi.fn(),
        setBool: vi.fn(),
    }) as unknown as Effect;

describe("SpriteRenderer geometry rendering", () => {
    const engines: NullEngine[] = [];
    const scenes: Scene[] = [];
    const renderers: SpriteRenderer[] = [];
    const renderPassIds: number[] = [];

    afterEach(() => {
        for (const renderPassId of renderPassIds) {
            MaterialHelperGeometryRendering.DeleteConfiguration(renderPassId);
        }
        for (const renderer of renderers) {
            renderer.dispose();
        }
        for (const scene of scenes) {
            scene.dispose();
        }
        for (const engine of engines) {
            engine.dispose();
        }
        renderPassIds.length = 0;
        renderers.length = 0;
        scenes.length = 0;
        engines.length = 0;
        vi.restoreAllMocks();
    });

    const createRenderer = async () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        const createEffect = vi.spyOn(engine, "createEffect").mockImplementation(() => createReadyEffect(engine));
        vi.spyOn(engine, "releaseVertexArrayObject").mockImplementation(() => {});
        const renderer = new SpriteRenderer(engine, 4, undefined, scene);
        const internals = renderer as unknown as SpriteRendererInternals;

        engines.push(engine);
        scenes.push(scene);
        renderers.push(renderer);
        await vi.waitFor(() => expect(internals._shadersLoaded).toBe(true));

        return { engine, scene, renderer, internals, createEffect };
    };

    const configureGeometryPass = (renderPassId: number) => {
        const configuration = MaterialHelperGeometryRendering.CreateConfiguration(renderPassId);
        configuration.defines.PREPASS_COLOR_INDEX = 0;
        configuration.defines.PREPASS_VELOCITY_LINEAR_INDEX = 1;
        configuration.defines.PREPASS_OBJECT_ID_INDEX = 2;
        configuration.defines.PREPASS_MESH_BLEND_TAG_INDEX = 3;
        MaterialHelperGeometryRendering._PrepareConfiguration(renderPassId, [1, 2, 3, 4], [1, 0, 0, 0]);
        renderPassIds.push(renderPassId);
    };

    it("creates and reuses a multi-target effect per geometry render pass", async () => {
        const { internals, createEffect } = await createRenderer();
        const renderPassId = 41;
        configureGeometryPass(renderPassId);

        const cache = internals._getDrawCache(renderPassId);
        const repeatedCache = internals._getDrawCache(renderPassId);
        const options = createEffect.mock.calls.at(-1)![1] as IEffectCreationOptions;

        expect(repeatedCache).toBe(cache);
        expect(cache.usesVelocity).toBe(true);
        expect(options.multiTarget).toBe(true);
        expect(options.indexParameters).toEqual({ SCENE_MRT_COUNT: 4 });
        expect(options.attributes).toEqual(expect.arrayContaining(["previousPosition", "previousOptions"]));
        expect(options.uniformsNames).toEqual(expect.arrayContaining(["invView", "previousView", "previousProjection", "objectId", "meshBlendTag"]));
        expect(options.defines).toContain("#define PREPASS_VELOCITY_LINEAR");
        expect(internals._previousBuffer).not.toBeNull();
    });

    it("prepares the active MRT shader through readiness checks before any draw", async () => {
        const { engine, scene, renderer, createEffect } = await createRenderer();
        renderer.texture = RawTexture.CreateRGBATexture(new Uint8Array([255, 255, 255, 255]), 1, 1, scene);
        const textureReady = vi.spyOn(renderer.texture, "isReady").mockReturnValue(false);
        configureGeometryPass(43);
        engine._features.supportRenderPasses = true;
        engine.currentRenderPassId = 43;

        expect(renderer.isReady()).toBe(false);
        textureReady.mockReturnValue(true);
        expect(renderer.isReady()).toBe(true);
        const options = createEffect.mock.calls.at(-1)![1] as IEffectCreationOptions;
        expect(options.multiTarget).toBe(true);
        expect(options.defines).toContain("#define PREPASS_VELOCITY_LINEAR");
        const effectCount = createEffect.mock.calls.length;
        expect(renderer.isReady()).toBe(true);
        expect(createEffect).toHaveBeenCalledTimes(effectCount);
    });

    it("keeps normal effects history-free and caches VAOs per draw cache", async () => {
        const { engine, internals } = await createRenderer();
        const normalCache = internals._getDrawCache(Constants.RENDERPASS_MAIN);

        expect(normalCache.usesVelocity).toBe(false);
        expect(normalCache.defines).toContain("#define SCENE_MRT_COUNT 0");
        expect(internals._previousBuffer).toBeNull();

        const vaoA = {} as WebGLVertexArrayObject;
        const vaoB = {} as WebGLVertexArrayObject;
        const recordVertexArrayObject = vi.spyOn(engine, "recordVertexArrayObject").mockReturnValueOnce(vaoA).mockReturnValueOnce(vaoB);
        const bindVertexArrayObject = vi.spyOn(engine, "bindVertexArrayObject").mockImplementation(() => {});
        internals._useVAO = true;

        internals._bindVertexBuffers(normalCache, normalCache.drawWrapperBase.effect!);
        internals._bindVertexBuffers(normalCache, normalCache.drawWrapperBase.effect!);

        const secondCache = { ...normalCache, vertexArrayObject: undefined };
        internals._bindVertexBuffers(secondCache, secondCache.drawWrapperBase.effect!);

        expect(recordVertexArrayObject).toHaveBeenCalledTimes(2);
        expect(bindVertexArrayObject).toHaveBeenCalledTimes(3);
        expect(normalCache.vertexArrayObject).toBe(vaoA);
        expect(secondCache.vertexArrayObject).toBe(vaoB);
    });

    it("advances a shared sprite animation only once per scene frame", async () => {
        const { engine, scene, internals } = await createRenderer();
        configureGeometryPass(42);
        engine.currentRenderPassId = 42;
        const sprite = new ThinSprite();
        const animate = vi.spyOn(sprite, "_animate");

        internals._animateSprite(sprite, 16);
        internals._animateSprite(sprite, 16);
        expect(animate).toHaveBeenCalledTimes(1);

        (scene as unknown as { _frameId: number })._frameId++;
        internals._animateSprite(sprite, 16);
        expect(animate).toHaveBeenCalledTimes(2);
    });

    it("preserves explicit animation advancement outside frame graph rendering", async () => {
        const { internals } = await createRenderer();
        const sprite = new ThinSprite();
        const animate = vi.spyOn(sprite, "_animate");

        internals._animateSprite(sprite, 16);
        internals._animateSprite(sprite, 16);

        expect(animate).toHaveBeenCalledTimes(2);
    });

    it("invalidates temporal state when an identical layout is rebuilt", async () => {
        const { internals } = await createRenderer();
        configureGeometryPass(44);
        const first = internals._getDrawCache(44);
        configureGeometryPass(44);

        expect(internals._getDrawCache(44)).not.toBe(first);
        expect(first.drawWrapperBase.effect).toBeNull();
    });

    it("resets missing-frame sprite and camera histories", async () => {
        const { internals } = await createRenderer();
        configureGeometryPass(45);
        const cache = internals._getDrawCache(45);
        const projection = Matrix.Identity();
        const view = Matrix.Identity();
        const history = internals._getCameraHistory(cache, view, projection, 1);
        const sprite = new ThinSprite();
        internals._updateSpriteHistory(history, sprite, null, Vector3.Zero(), 1);
        Matrix.TranslationToRef(1, 0, 0, view);
        internals._getCameraHistory(cache, view, projection, 2);
        Matrix.TranslationToRef(2, 0, 0, view);
        internals._getCameraHistory(cache, view, projection, 3);

        expect(internals._prepareSpriteHistory(history, sprite, 3)).toBeNull();
        internals._updateSpriteHistory(history, sprite, null, Vector3.Zero(), 3);
        Matrix.TranslationToRef(5, 0, 0, view);
        internals._getCameraHistory(cache, view, projection, 5);
        expect(history.previousView.m[12]).toBe(5);
        expect(history.sprites.get(sprite)).toBeUndefined();
    });

    it("releases pass caches and the last velocity buffer with their render pass", async () => {
        const { engine, internals } = await createRenderer();
        const id = engine.createRenderPassId("sprites");
        configureGeometryPass(id);
        const cache = internals._getDrawCache(id);
        expect(internals._previousBuffer).not.toBeNull();

        engine.releaseRenderPassId(id);

        expect(internals._drawCaches[id]).toBeUndefined();
        expect(cache.drawWrapperBase.effect).toBeNull();
        expect(internals._previousBuffer).toBeNull();
    });

    it("does not fill motion data for an ordinary draw after a velocity variant", async () => {
        const { renderer, internals } = await createRenderer();
        renderer.cellWidth = renderer.cellHeight = 1;
        configureGeometryPass(46);
        internals._getDrawCache(46);
        internals._previousVertexData.fill(123);

        internals._appendSpriteVertex(0, new ThinSprite(), 0, 0, { width: 1, height: 1 }, false, null, Vector3.Zero(), null, false);

        expect(internals._previousVertexData.every((value) => value === 123)).toBe(true);
    });

    it("restores the beauty attachment if a sprite draw throws", async () => {
        const { engine, scene, renderer, internals } = await createRenderer();
        const id = engine.createRenderPassId("throwing draw");
        configureGeometryPass(id);
        engine._features.supportRenderPasses = true;
        engine.currentRenderPassId = id;
        renderer.texture = RawTexture.CreateRGBATexture(new Uint8Array([255, 255, 255, 255]), 1, 1, scene);
        vi.spyOn(renderer.texture, "isReady").mockReturnValue(true);
        renderer.cellWidth = renderer.cellHeight = 1;
        renderer.disableDepthWrite = true;
        const cache = internals._getDrawCache(id);
        cache.drawWrapperBase.effect!._multiTarget = true;
        vi.spyOn(engine, "enableEffect").mockImplementation(() => {});
        const bindAttachments = vi.spyOn(engine, "bindAttachments").mockImplementation(() => {});
        vi.spyOn(engine, "drawArraysType").mockImplementation(() => {
            throw new Error("draw failed");
        });
        vi.spyOn(engine, "drawElementsType").mockImplementation(() => {
            throw new Error("draw failed");
        });

        expect(() => renderer.render([new ThinSprite()], 16, Matrix.Identity(), Matrix.Identity())).toThrow("draw failed");
        expect(bindAttachments).toHaveBeenLastCalledWith([1, 0, 0, 0]);
    });
});
