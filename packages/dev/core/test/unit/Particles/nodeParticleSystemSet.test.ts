import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { NullEngine } from "core/Engines/nullEngine";
import { Scene } from "core/scene";
import { ProceduralTexture } from "core/Materials/Textures/Procedurals/proceduralTexture";
import { Vector3 } from "core/Maths/math.vector";
import { Particle } from "core/Particles/particle";
import { ParticleSystem } from "core/Particles/particleSystem";
import { NodeParticleBuildState } from "core/Particles/Node/nodeParticleBuildState";
import { NodeParticleSystemSet } from "core/Particles/Node/nodeParticleSystemSet";
import { SystemBlock } from "core/Particles/Node/Blocks/systemBlock";
import { CreateParticleBlock } from "core/Particles/Node/Blocks/Emitters/createParticleBlock";
import { UpdateFlowMapBlock } from "core/Particles/Node/Blocks/Update/updateFlowMapBlock";
import { UpdateNoiseBlock } from "core/Particles/Node/Blocks/Update/updateNoiseBlock";
import { type BaseTexture } from "core/Materials/Textures/baseTexture";
import { type INodeParticleTextureData, ParticleTextureSourceBlock } from "core/Particles/Node/Blocks/particleSourceTextureBlock";
import { Observable } from "core/Misc/observable";

import "core/Shaders/particles.vertex";
import "core/Shaders/particles.fragment";

describe("NodeParticleSystemSet", () => {
    let engine: NullEngine;
    let scene: Scene;

    beforeEach(() => {
        engine = new NullEngine({
            renderHeight: 256,
            renderWidth: 256,
            textureSize: 256,
            deterministicLockstep: false,
            lockstepMaxSteps: 1,
        });
        scene = new Scene(engine);
    });

    afterEach(() => {
        scene.dispose();
        engine.dispose();
    });

    it("waits for flow-map texture extraction before resolving buildAsync", async () => {
        const nodeParticleSet = new NodeParticleSystemSet("test");
        const systemBlock = new SystemBlock("System");
        const createParticleBlock = new CreateParticleBlock("Create");
        const flowMapBlock = new UpdateFlowMapBlock("Flow Map Update");
        const flowMapTextureBlock = new ParticleTextureSourceBlock("Flow Map Texture");
        const particleTextureBlock = new ParticleTextureSourceBlock("Particle Texture");

        createParticleBlock.particle.connectTo(flowMapBlock.particle);
        flowMapTextureBlock.textureOutput.connectTo(flowMapBlock.flowMap);
        flowMapBlock.output.connectTo(systemBlock.particle);
        particleTextureBlock.textureOutput.connectTo(systemBlock.texture);
        nodeParticleSet.systemBlocks.push(systemBlock);

        let resolveTextureContent: (value: INodeParticleTextureData) => void;
        const textureContentPromise = new Promise<INodeParticleTextureData>((resolve) => {
            resolveTextureContent = resolve;
        });
        const extractTextureContentAsync = vi.spyOn(flowMapTextureBlock, "extractTextureContentAsync").mockReturnValue(textureContentPromise);

        let buildResolved = false;
        const buildPromise = (async () => {
            const set = await nodeParticleSet.buildAsync(scene);
            buildResolved = true;
            return set;
        })();

        await Promise.resolve();

        expect(extractTextureContentAsync).toHaveBeenCalledTimes(1);
        expect(buildResolved).toBe(false);

        resolveTextureContent!({
            width: 1,
            height: 1,
            data: new Uint8ClampedArray([128, 128, 0, 255]),
        });

        const builtSet = await buildPromise;

        expect(buildResolved).toBe(true);
        expect(builtSet.systems.length).toBe(1);
    });

    it("resolves texture extraction with null when texture loading errors", async () => {
        const textureBlock = new ParticleTextureSourceBlock("Flow Map Texture");
        const loadObservable = new Observable<BaseTexture>();
        const errorObservable = new Observable<Partial<{ message: string; exception: any }>>();
        const texture = {
            url: "bad-texture.png",
            loadingError: false,
            isReady: () => false,
            onLoadObservable: loadObservable,
            getInternalTexture: () => ({ onErrorObservable: errorObservable }),
        } as unknown as BaseTexture;

        textureBlock.sourceTexture = texture;

        const textureContentPromise = textureBlock.extractTextureContentAsync();
        errorObservable.notifyObservers({ message: "load failed" });

        await expect(textureContentPromise).resolves.toBeNull();
    });

    it("resolves buildAsync when flow-map extraction rejects", async () => {
        const nodeParticleSet = new NodeParticleSystemSet("test");
        const systemBlock = new SystemBlock("System");
        const createParticleBlock = new CreateParticleBlock("Create");
        const flowMapBlock = new UpdateFlowMapBlock("Flow Map Update");
        const flowMapTextureBlock = new ParticleTextureSourceBlock("Flow Map Texture");
        const particleTextureBlock = new ParticleTextureSourceBlock("Particle Texture");

        createParticleBlock.particle.connectTo(flowMapBlock.particle);
        flowMapTextureBlock.textureOutput.connectTo(flowMapBlock.flowMap);
        flowMapBlock.output.connectTo(systemBlock.particle);
        particleTextureBlock.textureOutput.connectTo(systemBlock.texture);
        nodeParticleSet.systemBlocks.push(systemBlock);

        vi.spyOn(flowMapTextureBlock, "extractTextureContentAsync").mockRejectedValue(new Error("load failed"));

        const builtSet = await nodeParticleSet.buildAsync(scene);

        expect(builtSet.systems.length).toBe(1);
    });

    it("waits for noise texture extraction before resolving buildAsync", async () => {
        const nodeParticleSet = new NodeParticleSystemSet("test");
        const systemBlock = new SystemBlock("System");
        const createParticleBlock = new CreateParticleBlock("Create");
        const noiseBlock = new UpdateNoiseBlock("Noise Update");
        const noiseTextureBlock = new ParticleTextureSourceBlock("Noise Texture");
        const particleTextureBlock = new ParticleTextureSourceBlock("Particle Texture");

        createParticleBlock.particle.connectTo(noiseBlock.particle);
        noiseTextureBlock.textureOutput.connectTo(noiseBlock.noiseTexture);
        noiseBlock.output.connectTo(systemBlock.particle);
        particleTextureBlock.textureOutput.connectTo(systemBlock.texture);
        nodeParticleSet.systemBlocks.push(systemBlock);

        let resolveTextureContent: (value: INodeParticleTextureData) => void;
        const textureContentPromise = new Promise<INodeParticleTextureData>((resolve) => {
            resolveTextureContent = resolve;
        });
        const extractTextureContentAsync = vi.spyOn(noiseTextureBlock, "extractTextureContentAsync").mockReturnValue(textureContentPromise);

        let buildResolved = false;
        const buildPromise = (async () => {
            const set = await nodeParticleSet.buildAsync(scene);
            buildResolved = true;
            return set;
        })();

        await Promise.resolve();

        expect(extractTextureContentAsync).toHaveBeenCalledTimes(1);
        expect(buildResolved).toBe(false);

        resolveTextureContent!({
            width: 1,
            height: 1,
            data: new Uint8ClampedArray([128, 128, 0, 255]),
        });

        const builtSet = await buildPromise;

        expect(buildResolved).toBe(true);
        expect(builtSet.systems.length).toBe(1);
    });

    it("resolves buildAsync when noise extraction rejects", async () => {
        const nodeParticleSet = new NodeParticleSystemSet("test");
        const systemBlock = new SystemBlock("System");
        const createParticleBlock = new CreateParticleBlock("Create");
        const noiseBlock = new UpdateNoiseBlock("Noise Update");
        const noiseTextureBlock = new ParticleTextureSourceBlock("Noise Texture");
        const particleTextureBlock = new ParticleTextureSourceBlock("Particle Texture");

        createParticleBlock.particle.connectTo(noiseBlock.particle);
        noiseTextureBlock.textureOutput.connectTo(noiseBlock.noiseTexture);
        noiseBlock.output.connectTo(systemBlock.particle);
        particleTextureBlock.textureOutput.connectTo(systemBlock.texture);
        nodeParticleSet.systemBlocks.push(systemBlock);

        vi.spyOn(noiseTextureBlock, "extractTextureContentAsync").mockRejectedValue(new Error("load failed"));

        const builtSet = await nodeParticleSet.buildAsync(scene);

        expect(builtSet.systems.length).toBe(1);
    });

    it("retries a rejected noise update readback on the next frame without an unhandled rejection", async () => {
        const texture = new ProceduralTexture("noise", 2, null, scene);
        const pixels = new Uint8Array(2 * 2 * 4);
        vi.spyOn(texture, "isReady").mockReturnValue(true);
        const readPixelsSpy = vi.spyOn(texture, "readPixels").mockRejectedValueOnce(new Error("readback failed")).mockResolvedValue(pixels);
        const frameIdSpy = vi.spyOn(scene, "getFrameId").mockReturnValue(0);
        const textureBlock = new ParticleTextureSourceBlock("Noise Texture");
        textureBlock.textureOutput._storedValue = texture;
        vi.spyOn(textureBlock, "extractTextureContentAsync").mockResolvedValue(null);
        const noiseBlock = new UpdateNoiseBlock("Noise Update");
        textureBlock.textureOutput.connectTo(noiseBlock.noiseTexture);
        const system = new ParticleSystem("noise", 10, scene);
        vi.spyOn(noiseBlock.particle, "getConnectedValue").mockReturnValue(system);
        const state = new NodeParticleBuildState();
        noiseBlock._build(state);
        await state.waitForBuildPromisesAsync();
        const particle = new Particle(system);
        particle._properties.randomNoiseCoordinates1 = Vector3.Zero();
        particle._properties.randomNoiseCoordinates2 = Vector3.Zero();
        let noiseProcessing = system._updateQueueStart!;
        while (noiseProcessing.nextItem) {
            noiseProcessing = noiseProcessing.nextItem;
        }
        const processNoise = noiseProcessing.process;
        const fetchSpy = vi.spyOn(system, "_fetchR");

        processNoise(particle, system);
        await new Promise<void>((resolve) => setTimeout(resolve, 0));
        expect(fetchSpy).not.toHaveBeenCalled();

        frameIdSpy.mockReturnValue(1);
        processNoise(particle, system);
        await new Promise<void>((resolve) => setTimeout(resolve, 0));
        processNoise(particle, system);

        expect(readPixelsSpy).toHaveBeenCalledTimes(2);
        expect(fetchSpy).toHaveBeenCalledTimes(3);
        expect(fetchSpy).toHaveBeenLastCalledWith(0, 0, 2, 2, pixels);
    });

    it("keeps extracted procedural texture dimensions paired with the buffer when resized while pending", async () => {
        const texture = new ProceduralTexture("noise", 2, null, scene);
        vi.spyOn(texture, "isReady").mockReturnValue(true);
        vi.spyOn(texture, "render").mockImplementation(() => {});
        let resolveReadback: (data: ArrayBufferView) => void;
        vi.spyOn(texture, "readPixels").mockReturnValue(new Promise((resolve) => (resolveReadback = resolve)));
        const textureBlock = new ParticleTextureSourceBlock("Noise Texture");
        textureBlock.sourceTexture = texture;

        const extraction = textureBlock.extractTextureContentAsync();
        texture.resize(4, false);
        resolveReadback!(new Uint8Array(2 * 2 * 4));
        const content = await extraction;

        expect(content!.width).toBe(2);
        expect(content!.height).toBe(2);
        expect(content!.data.length).toBe(content!.width * content!.height * 4);
    });

    it("discards an extracted buffer that does not match its dimensions and allows a later retry", async () => {
        const texture = new ProceduralTexture("noise", 4, null, scene);
        const pixels = new Uint8Array(4 * 4 * 4);
        vi.spyOn(texture, "isReady").mockReturnValue(true);
        vi.spyOn(texture, "render").mockImplementation(() => {});
        const readPixelsSpy = vi
            .spyOn(texture, "readPixels")
            .mockResolvedValueOnce(new Uint8Array(2 * 2 * 4))
            .mockResolvedValue(pixels);
        const textureBlock = new ParticleTextureSourceBlock("Noise Texture");
        textureBlock.sourceTexture = texture;

        await expect(textureBlock.extractTextureContentAsync()).resolves.toBeNull();
        (texture as unknown as { _frameId: number })._frameId++;
        await expect(textureBlock.extractTextureContentAsync()).resolves.toBeNull();
        const content = await textureBlock.extractTextureContentAsync();

        expect(content!.width).toBe(4);
        expect(content!.height).toBe(4);
        expect(content!.data).toEqual(new Uint8ClampedArray(pixels));
        expect(readPixelsSpy).toHaveBeenCalledTimes(2);
    });
});
