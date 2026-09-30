import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Constants } from "core/Engines/constants";
import { NullEngine } from "core/Engines/nullEngine";
import { FrameGraph } from "core/FrameGraph/frameGraph";
import { FrameGraphMinMaxReducerTask } from "core/FrameGraph/Tasks/Misc/minMaxReducerTask";
import { FrameGraphRenderPass } from "core/FrameGraph/Passes/renderPass";
import { DepthTextureType, ThinMinMaxReducer } from "core/Misc/thinMinMaxReducer";
import { MinMaxReducer } from "core/Misc/minMaxReducer.pure";
import { Logger } from "core/Misc/logger";
import { InternalTexture, InternalTextureSource } from "core/Materials/Textures/internalTexture";
import { FreeCamera } from "core/Cameras/freeCamera";
import { RenderTargetTexture } from "core/Materials/Textures/renderTargetTexture";
import { Vector3 } from "core/Maths/math.vector";
import { Scene } from "core/scene";

describe("FrameGraphMinMaxReducerTask", () => {
    let engine: NullEngine;
    let scene: Scene;
    let graph: FrameGraph;
    let task: FrameGraphMinMaxReducerTask;

    const createSource = (width: number, height: number) =>
        graph.textureManager.createRenderTargetTexture("geometry depth", {
            size: { width, height },
            sizeIsPercentage: false,
            options: {
                createMipMaps: false,
                samples: 1,
                types: [Constants.TEXTURETYPE_HALF_FLOAT],
                formats: [Constants.TEXTUREFORMAT_RED],
            },
        });

    beforeEach(() => {
        engine = new NullEngine();
        scene = new Scene(engine);
        graph = new FrameGraph(scene);
        task = new FrameGraphMinMaxReducerTask("Min/max", graph);
        graph.addTask(task);
        vi.spyOn(graph.textureManager, "_allocateTextures").mockImplementation(() => {});
        vi.spyOn(task, "_initializePasses").mockImplementation(() => {});
    });

    afterEach(() => {
        vi.restoreAllMocks();
        scene.dispose();
        engine.dispose();
    });

    it("requires an explicitly supplied source texture", async () => {
        await expect(graph.buildAsync(false)).rejects.toThrow("sourceTexture is required");
    });

    it.each([
        { width: 0, height: 2 },
        { width: 2, height: 0 },
        { width: Number.NaN, height: 2 },
    ])("rejects invalid source dimensions ($width x $height)", async ({ width, height }) => {
        task.sourceTexture = createSource(width, height);
        await expect(graph.buildAsync(false)).rejects.toThrow("sourceTexture must have positive integer dimensions");
    });

    it.each([Constants.TEXTUREFORMAT_DEPTH32_FLOAT, Constants.TEXTUREFORMAT_RED_INTEGER])("rejects a source with format %i", async (format) => {
        task.sourceTexture = graph.textureManager.createRenderTargetTexture("invalid source", {
            size: { width: 4, height: 4 },
            sizeIsPercentage: false,
            options: { createMipMaps: false, samples: 1, types: [Constants.TEXTURETYPE_FLOAT], formats: [format] },
        });

        await expect(graph.buildAsync(false)).rejects.toThrow("sourceTexture must have a non-integer color format");
    });

    it.each([Constants.TEXTURE_CUBE_MAP, Constants.TEXTURE_2D_ARRAY, Constants.TEXTURE_3D])("rejects a non-2D source of type %i", async (targetType) => {
        task.sourceTexture = graph.textureManager.createRenderTargetTexture("non-2D source", {
            size: { width: 4, height: 4 },
            sizeIsPercentage: false,
            options: {
                createMipMaps: false,
                samples: 1,
                types: [Constants.TEXTURETYPE_HALF_FLOAT],
                formats: [Constants.TEXTUREFORMAT_RED],
                targetTypes: [targetType],
            },
        });

        await expect(graph.buildAsync(false)).rejects.toThrow("sourceTexture must be a 2D texture");
    });

    it.each([Constants.TEXTURETYPE_BYTE, Constants.TEXTURETYPE_SHORT, Constants.TEXTURETYPE_UNSIGNED_SHORT, Constants.TEXTURETYPE_INT, Constants.TEXTURETYPE_UNSIGNED_INTEGER])(
        "rejects unsupported reduction texture type %i",
        async (type) => {
            task.sourceTexture = createSource(4, 4);
            task.textureType = type;

            await expect(graph.buildAsync(false)).rejects.toThrow("textureType must be FLOAT, HALF_FLOAT, or UNSIGNED_BYTE");
        }
    );

    it.each([Constants.TEXTURETYPE_FLOAT, Constants.TEXTURETYPE_HALF_FLOAT, Constants.TEXTURETYPE_UNSIGNED_BYTE])(
        "records a reduction with supported texture type %i",
        async (type) => {
            task.sourceTexture = createSource(4, 4);
            task.textureType = type;

            await graph.buildAsync(false);

            expect(graph.textureManager.getTextureDescription(task.outputTexture).options.types).toEqual([type]);
        }
    );

    it("treats reverse screen depth's zero clear value as empty", async () => {
        engine.useReverseDepthBuffer = true;
        task.sourceTexture = createSource(4, 4);
        task.depthRedux = true;
        task.depthTextureType = DepthTextureType.ScreenDepth;
        const setDimensions = vi.spyOn(ThinMinMaxReducer.prototype, "setTextureDimensions");

        await graph.buildAsync(false);

        expect(setDimensions).toHaveBeenCalledWith(4, 4, DepthTextureType.ViewDepth);
    });

    it("reuses the input handle and produces a 1x1 RG output without a depth renderer", async () => {
        const source = createSource(5, 3);
        task.sourceTexture = source;
        task.depthRedux = true;
        task.depthTextureType = DepthTextureType.NormalizedViewDepth;

        await graph.buildAsync(false);

        const renderPasses = task.passes.filter(FrameGraphRenderPass.IsRenderPass);
        expect(renderPasses).toHaveLength(3);
        expect(renderPasses[0].renderTarget).not.toBe(source);

        const firstPassDependencies = new Set<number>();
        renderPasses[0].collectDependencies(firstPassDependencies);
        expect(firstPassDependencies.has(source)).toBe(true);

        expect(graph.textureManager.getTextureDescription(task.outputTexture)).toMatchObject({
            size: { width: 1, height: 1 },
            options: { formats: [Constants.TEXTUREFORMAT_RG], types: [Constants.TEXTURETYPE_HALF_FLOAT] },
        });
        expect(task.passesDisabled).toHaveLength(1);
        expect((task.passesDisabled[0] as FrameGraphRenderPass).renderTarget).toBe(task.outputTexture);
        expect(scene._depthRenderer).toBeUndefined();
    });

    it.each([
        { width: 1, height: 1 },
        { width: 1, height: 4 },
        { width: 4, height: 1 },
    ])("supports narrow source textures ($width x $height)", async ({ width, height }) => {
        task.sourceTexture = createSource(width, height);

        await graph.buildAsync(false);

        expect(task.passes.filter(FrameGraphRenderPass.IsRenderPass)).toHaveLength(width === 1 && height === 1 ? 1 : 2);
        expect(graph.textureManager.getTextureDescription(task.outputTexture).size).toEqual({ width: 1, height: 1 });
    });

    it("rebuilds the reduction steps when the source dimensions change", async () => {
        task.sourceTexture = createSource(8, 8);
        await graph.buildAsync(false);
        expect(task.passes.filter(FrameGraphRenderPass.IsRenderPass)).toHaveLength(3);

        task.sourceTexture = createSource(2, 2);
        await graph.buildAsync(false);
        expect(task.passes.filter(FrameGraphRenderPass.IsRenderPass)).toHaveLength(1);
        expect(graph.textureManager.getTextureDescription(task.outputTexture).size).toEqual({ width: 1, height: 1 });
    });

    it("reads the reduced output after the render passes", async () => {
        task.sourceTexture = createSource(4, 4);
        await graph.buildAsync(false);

        const output = new InternalTexture(engine, InternalTextureSource.RenderTarget);
        const getTexture = vi.spyOn(graph.textureManager, "getTextureFromHandle").mockReturnValue(output);
        const read = vi.spyOn(ThinMinMaxReducer.prototype, "readMinMax").mockImplementation(() => {});
        task.onAfterReductionPerformed.add(() => {});

        task.passes[task.passes.length - 1]._execute();

        expect(getTexture).toHaveBeenCalledWith(task.outputTexture);
        expect(read).toHaveBeenCalledExactlyOnceWith(output, false);
        output.dispose();
    });

    it("keeps equal min/max values for a non-depth source", async () => {
        task.sourceTexture = createSource(1, 1);
        await graph.buildAsync(false);
        task.waitForReadback = true;

        const output = new InternalTexture(engine, InternalTextureSource.RenderTarget);
        output.type = Constants.TEXTURETYPE_FLOAT;
        vi.spyOn(graph.textureManager, "getTextureFromHandle").mockReturnValue(output);
        engine._readTexturePixels = (_texture, _width, _height, _faceIndex, _level, buffer) => {
            if (buffer instanceof Float32Array) {
                buffer[0] = 0.5;
                buffer[1] = 0.5;
            }
            return Promise.resolve(buffer!);
        };
        const results: { min: number; max: number }[] = [];
        task.onAfterReductionPerformed.add(({ min, max }) => results.push({ min, max }));

        task.passes[task.passes.length - 1]._execute();

        expect(results).toEqual([{ min: 0.5, max: 0.5 }]);
        output.dispose();
    });

    it("logs a failed WebGPU readback and allows a subsequent request", async () => {
        task.sourceTexture = createSource(4, 4);
        await graph.buildAsync(false);
        task.waitForReadback = true;
        vi.spyOn(engine, "isWebGPU", "get").mockReturnValue(true);

        const output = new InternalTexture(engine, InternalTextureSource.RenderTarget);
        output.type = Constants.TEXTURETYPE_FLOAT;
        vi.spyOn(graph.textureManager, "getTextureFromHandle").mockReturnValue(output);
        const log = vi.spyOn(Logger, "Error").mockImplementation(() => {});
        const read = vi.fn(() => Promise.reject(new Error("readback failed")));
        engine._readTexturePixels = read;
        task.onAfterReductionPerformed.add(() => {});
        const readPass = task.passes[task.passes.length - 1];

        readPass._execute();
        await vi.waitFor(() => expect(log).toHaveBeenCalledWith(expect.stringContaining("readback failed")));
        readPass._execute();

        expect(read).toHaveBeenCalledTimes(2);
        await vi.waitFor(() => expect(log).toHaveBeenCalledTimes(2));
        output.dispose();
    });

    it("delays WebGPU notification until readback completes and skips overlapping requests", async () => {
        task.sourceTexture = createSource(4, 4);
        await graph.buildAsync(false);
        task.waitForReadback = true;
        vi.spyOn(engine, "isWebGPU", "get").mockReturnValue(true);

        const output = new InternalTexture(engine, InternalTextureSource.RenderTarget);
        output.type = Constants.TEXTURETYPE_FLOAT;
        vi.spyOn(graph.textureManager, "getTextureFromHandle").mockReturnValue(output);
        let completeReadback: () => void = () => {
            throw new Error("Readback was not started");
        };
        const read = vi.fn((_texture: InternalTexture, _width: number, _height: number, _face: number, _level: number, buffer: ArrayBufferView | null) => {
            return new Promise<ArrayBufferView>((resolve) => {
                completeReadback = () => {
                    const values = buffer as Float32Array;
                    values[0] = 0.25;
                    values[1] = 0.75;
                    resolve(values);
                };
            });
        });
        engine._readTexturePixels = read;
        const results: { min: number; max: number }[] = [];
        task.onAfterReductionPerformed.add(({ min, max }) => results.push({ min, max }));
        const readPass = task.passes[task.passes.length - 1];

        readPass._execute();
        readPass._execute();
        expect(read).toHaveBeenCalledTimes(1);
        expect(results).toEqual([]);

        completeReadback();
        await vi.waitFor(() => expect(results).toEqual([{ min: 0.25, max: 0.75 }]));

        readPass._execute();
        expect(read).toHaveBeenCalledTimes(2);
        completeReadback();
        await vi.waitFor(() => expect(results).toHaveLength(2));
        output.dispose();
    });

    it("exposes optional readback waiting on the legacy MinMaxReducer", () => {
        const camera = new FreeCamera("camera", Vector3.Zero(), scene);
        const reducer = new MinMaxReducer(camera);
        try {
            expect(reducer.waitForReadback).toBe(false);
            reducer.waitForReadback = true;
            expect(reducer.waitForReadback).toBe(true);
        } finally {
            reducer.dispose();
        }
    });

    it("keeps a terminal reduction step for a single-pixel legacy render target", () => {
        const camera = new FreeCamera("camera", Vector3.Zero(), scene);
        const reducer = new MinMaxReducer(camera);
        const source = new RenderTargetTexture("single-pixel", 1, scene);

        try {
            reducer.setSourceTexture(source, false);
            reducer.activate();

            expect(reducer.sourceTexture).toBe(source);
            expect(reducer.activated).toBe(true);
        } finally {
            reducer.deactivate();
            reducer.dispose();
            source.dispose();
        }
    });

    it("keeps the terminal step used by legacy and CSM reducers for a 1x1 texture", () => {
        const reducer = new ThinMinMaxReducer(scene);
        try {
            reducer.setTextureDimensions(1, 1);

            expect(reducer.reductionSteps).toHaveLength(2);
            expect(reducer.reductionSteps[1].name).toBe("Reduction phase 1");
        } finally {
            reducer.dispose();
        }
    });

    it("reports when the reduced output cannot be read", async () => {
        task.sourceTexture = createSource(4, 4);
        await graph.buildAsync(false);
        vi.spyOn(graph.textureManager, "getTextureFromHandle").mockReturnValue(null);
        task.onAfterReductionPerformed.add(() => {});

        expect(() => task.passes[task.passes.length - 1]._execute()).toThrow("output texture is unavailable");
    });

    it("skips CPU readback if only the output texture is used", async () => {
        task.sourceTexture = createSource(4, 4);
        await graph.buildAsync(false);
        const getTexture = vi.spyOn(graph.textureManager, "getTextureFromHandle");

        task.passes[task.passes.length - 1]._execute();

        expect(getTexture).not.toHaveBeenCalled();
    });
});
