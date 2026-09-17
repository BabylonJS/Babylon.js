import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { Constants } from "core/Engines/constants";
import { NullEngine } from "core/Engines/nullEngine";
import { type IEffectCreationOptions } from "core/Materials/effect";
import { type DrawWrapper } from "core/Materials/drawWrapper";
import { MaterialHelperGeometryRendering } from "core/Materials/materialHelper.geometryrendering";
import { GPUParticleSystem } from "core/Particles/gpuParticleSystem";
import { ParticleSystem } from "core/Particles/particleSystem";
import { Scene } from "core/scene";

import "core/Particles/webgl2ParticleSystem";
import "core/Shaders/particles.vertex";
import "core/Shaders/particles.fragment";
import "core/Engines/AbstractEngine/abstractEngine.renderPass";

describe("Particle neutral velocity shader contract", () => {
    const sourceDirectory = fileURLToPath(new URL("../../../src/", import.meta.url));
    const variants = ["Shaders", "ShadersWGSL"].flatMap((directory) => ["particles", "gpuRenderParticles"].map((name) => ({ directory, name })));

    it.each(variants)("$directory/$name uses neutral outputs without temporal vertex inputs", ({ directory, name }) => {
        const fragment = readFileSync(join(sourceDirectory, directory, `${name}.fragment.fx`), "utf8");
        const vertex = readFileSync(join(sourceDirectory, directory, `${name}.vertex.fx`), "utf8");
        const neutralDefine = fragment.indexOf("#define PREPASS_VELOCITY_ZERO");

        expect(neutralDefine).toBeGreaterThanOrEqual(0);
        expect(neutralDefine).toBeLessThan(fragment.indexOf("#include<prePassDeclaration>"));
        expect(fragment).not.toMatch(/\bgeometry(Current|Previous)Position\b/);
        expect(vertex).not.toMatch(/\b(previousPosition|previousView|previousProjection|vCurrentPosition|vPreviousPosition|geometryHistoryReset)\b/);
    });
});

describe("Particle system geometry rendering effects", () => {
    let engine: NullEngine;
    let scene: Scene;

    beforeEach(() => {
        engine = new NullEngine();
        scene = new Scene(engine);
    });

    afterEach(() => {
        MaterialHelperGeometryRendering.DeleteConfiguration(Constants.RENDERPASS_MAIN);
        scene.dispose();
        engine.dispose();
        vi.restoreAllMocks();
    });

    const configureGeometryRendering = (mrtCount: number, velocityDefines: string[]): void => {
        const configuration = MaterialHelperGeometryRendering.CreateConfiguration(Constants.RENDERPASS_MAIN);
        configuration.defines.PREPASS_COLOR_INDEX = 0;
        configuration.defines.PREPASS_POSITION_INDEX = 1;
        for (let index = 0; index < velocityDefines.length; index++) {
            configuration.defines[velocityDefines[index]] = index + 2;
        }
        const attachments = Array.from({ length: mrtCount }, (_, index) => index);
        MaterialHelperGeometryRendering._PrepareConfiguration(Constants.RENDERPASS_MAIN, attachments, [0]);
    };

    const getLastEffectOptions = (createEffectSpy: ReturnType<typeof vi.spyOn>): IEffectCreationOptions => {
        return createEffectSpy.mock.calls[createEffectSpy.mock.calls.length - 1][1] as IEffectCreationOptions;
    };

    const velocityLayouts = [
        { name: "nonlinear", defines: ["PREPASS_VELOCITY_INDEX"] },
        { name: "linear", defines: ["PREPASS_VELOCITY_LINEAR_INDEX"] },
        { name: "both", defines: ["PREPASS_VELOCITY_INDEX", "PREPASS_VELOCITY_LINEAR_INDEX"] },
    ];

    it.each(velocityLayouts)("keeps CPU $name velocity outputs history-free when creating and invalidating MRT variants", ({ defines }) => {
        const mrtCount = defines.length + 2;
        configureGeometryRendering(mrtCount, defines);
        const createEffectSpy = vi.spyOn(engine, "createEffect");
        const particleSystem = new ParticleSystem("cpu", 4, scene);

        (particleSystem as unknown as { _getWrapper: (blendMode: number) => unknown })._getWrapper(particleSystem.blendMode);

        const initialOptions = getLastEffectOptions(createEffectSpy);
        expect(initialOptions.multiTarget).toBe(true);
        expect(initialOptions.indexParameters).toEqual({ buffersCount: mrtCount });
        expect(initialOptions.attributes.some((attribute) => attribute.startsWith("previous"))).toBe(false);
        expect(initialOptions.uniformsNames.some((uniform) => uniform.startsWith("previous") || uniform === "geometryHistoryReset")).toBe(false);
        for (const define of defines) {
            expect(initialOptions.defines).toContain(`#define ${define}`);
        }

        configureGeometryRendering(mrtCount + 1, defines);
        (particleSystem as unknown as { _getWrapper: (blendMode: number) => unknown })._getWrapper(particleSystem.blendMode);

        const updatedOptions = getLastEffectOptions(createEffectSpy);
        expect(updatedOptions.indexParameters).toEqual({ buffersCount: mrtCount + 1 });
        expect(updatedOptions.defines).toContain(`#define SCENE_MRT_COUNT ${mrtCount + 1}`);
        expect(updatedOptions.attributes).toEqual(initialOptions.attributes);
        expect(updatedOptions.uniformsNames).toEqual(initialOptions.uniformsNames);
        particleSystem.dispose();
    });

    it.each(velocityLayouts)("keeps GPU $name velocity outputs history-free", ({ defines }) => {
        const mrtCount = defines.length + 2;
        configureGeometryRendering(mrtCount, defines);
        const createEffectSpy = vi.spyOn(engine, "createEffect");
        const particleSystem = new GPUParticleSystem("gpu", { capacity: 4 }, scene);

        particleSystem._getWrapper(particleSystem.blendMode);

        const options = getLastEffectOptions(createEffectSpy);
        expect(options.multiTarget).toBe(true);
        expect(options.indexParameters).toEqual({ buffersCount: mrtCount });
        expect(options.attributes.some((attribute) => attribute.startsWith("previous"))).toBe(false);
        expect(options.uniformsNames.some((uniform) => uniform.startsWith("previous") || uniform === "geometryHistoryReset")).toBe(false);
        for (const define of defines) {
            expect(options.defines).toContain(`#define ${define}`);
        }
        particleSystem.dispose();
    });

    it.each(["CPU", "GPU"] as const)("releases %s render-pass wrappers when the pass is disposed", (kind) => {
        const renderPassId = engine.createRenderPassId("particle pass");
        engine._features.supportRenderPasses = true;
        engine.currentRenderPassId = renderPassId;
        const configuration = MaterialHelperGeometryRendering.CreateConfiguration(renderPassId);
        configuration.defines.PREPASS_COLOR_INDEX = 0;
        MaterialHelperGeometryRendering._PrepareConfiguration(renderPassId, [1], [1]);
        const system = kind === "CPU" ? new ParticleSystem("CPU", 4, scene) : new GPUParticleSystem("GPU", { capacity: 4 }, scene);
        const internals = system as unknown as {
            _getWrapper: (blendMode: number) => DrawWrapper;
            _drawWrappers: DrawWrapper[][];
        };

        const wrapper = internals._getWrapper(system.blendMode);
        engine.releaseRenderPassId(renderPassId);

        expect(internals._drawWrappers[renderPassId]).toBeUndefined();
        expect(wrapper.effect).toBeNull();
        MaterialHelperGeometryRendering.DeleteConfiguration(renderPassId);
        system.dispose();
    });
});
