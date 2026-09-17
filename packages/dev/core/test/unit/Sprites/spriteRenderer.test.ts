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
};

type SpriteRendererInternals = {
    _shadersLoaded: boolean;
    _useVAO: boolean;
    _previousBuffer: unknown;
    _getDrawCache: (renderPassId: number) => SpriteRendererDrawCache;
    _bindVertexBuffers: (cache: SpriteRendererDrawCache, effect: Effect) => void;
    _animateSprite: (sprite: ThinSprite, deltaTime: number) => void;
};

const createReadyEffect = (engine: NullEngine): Effect =>
    ({
        _refCount: 1,
        dispose: vi.fn(),
        getEngine: () => engine,
        isReady: () => true,
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
        MaterialHelperGeometryRendering._PrepareConfiguration(renderPassId, [0, 1, 2, 3], [0]);
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
});
