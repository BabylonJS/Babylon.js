import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { Constants } from "core/Engines/constants";
import { NullEngine } from "core/Engines/nullEngine";
import { type Effect, type IEffectCreationOptions } from "core/Materials/effect";
import { type DrawWrapper } from "core/Materials/drawWrapper";
import { MaterialHelperGeometryRendering } from "core/Materials/materialHelper.geometryrendering";
import { GPUParticleSystem } from "core/Particles/gpuParticleSystem";
import { ParticleSystem } from "core/Particles/particleSystem";
import { Particle } from "core/Particles/particle";
import { Matrix, Quaternion, Vector3 } from "core/Maths/math.vector";
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

    it.each(["Shaders", "ShadersWGSL"])("%s removes the CPU render-space offset before reconstructing local position", (directory) => {
        const vertex = readFileSync(join(sourceDirectory, directory, "particles.vertex.fx"), "utf8");
        expect(vertex).toMatch(/inverseEmitterWM\s*\*\s*vec4f?\(geometryRenderPosition - (?:uniforms\.)?geometryWorldOffset, 1\.0\)/);
        expect(vertex).toMatch(/geometryRenderPosition = (?:vertexInputs\.)?position \+ \((?:uniforms\.)?invView \* vec4f?\(rotatedCorner, 0\.0\)\)\.xyz/);
    });

    it.each(["Shaders", "ShadersWGSL"])("%s uses the same render-space billboard conversion for GPU local positions", (directory) => {
        const vertex = readFileSync(join(sourceDirectory, directory, "gpuRenderParticles.vertex.fx"), "utf8");
        expect(vertex).toMatch(/geometryRenderPosition = particleBasePosition\(\) \+ \((?:uniforms\.)?invView \* vec4f?\(rotatedCorner\.xyz, 0\.0\)\)\.xyz/);
        expect(vertex).toMatch(/inverseEmitterWM\s*\*\s*vec4f?\(geometryRenderPosition - (?:uniforms\.)?worldOffset, 1\.0\)/);
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

    it.each([
        { name: "zero offsets", world: [0, 0, 0], origin: [0, 0, 0] },
        { name: "world offset", world: [7, -2, 4], origin: [0, 0, 0] },
        { name: "floating origin", world: [0, 0, 0], origin: [100, -40, 70] },
        { name: "combined offsets", world: [7, -2, 4], origin: [100, -40, 70] },
    ])("reconstructs CPU emitter-local positions with $name", ({ world, origin }) => {
        const configuration = MaterialHelperGeometryRendering.CreateConfiguration(Constants.RENDERPASS_MAIN);
        configuration.defines.PREPASS_COLOR_INDEX = 0;
        configuration.defines.PREPASS_LOCAL_POSITION_INDEX = 1;
        MaterialHelperGeometryRendering._PrepareConfiguration(Constants.RENDERPASS_MAIN, [1, 2], [1, 0]);
        const particleSystem = new ParticleSystem("local particles", 1, scene);
        particleSystem.isLocal = true;
        particleSystem.worldOffset.copyFromFloats(world[0], world[1], world[2]);
        vi.spyOn(scene, "floatingOriginOffset", "get").mockReturnValue(new Vector3(origin[0], origin[1], origin[2]));
        const emitterWorld = Matrix.Compose(new Vector3(2, 3, 4), Quaternion.RotationYawPitchRoll(0.4, 0.2, 0.1), new Vector3(21, -6, 13));
        emitterWorld.invertToRef(particleSystem._emitterInverseWorldMatrix);
        const expectedLocal = new Vector3(-1.5, 2.25, 0.75);
        const particle = new Particle(particleSystem);
        Vector3.TransformCoordinatesToRef(expectedLocal, emitterWorld, particle.position);
        particleSystem._appendParticleVertex(0, particle, 0, 0);

        const boundOffset = Vector3.Zero();
        const boundInverse = Matrix.Identity();
        const setVector3 = vi.fn((name: string, value: Vector3) => {
            if (name === "geometryWorldOffset") boundOffset.copyFrom(value);
        });
        const effect = {
            setFloat: vi.fn(),
            setInt: vi.fn(),
            setFloat2: vi.fn(),
            setVector3,
            setMatrix: (name: string, value: Matrix) => {
                if (name === "inverseEmitterWM") boundInverse.copyFrom(value);
            },
        } as unknown as Effect;
        const internals = particleSystem as unknown as {
            _bindGeometryRendering: (effect: Effect) => void;
            _vertexData: Float32Array;
            _getWrapper: (blendMode: number) => DrawWrapper;
        };
        const createEffectSpy = vi.spyOn(engine, "createEffect");
        internals._getWrapper(particleSystem.blendMode);
        expect(getLastEffectOptions(createEffectSpy).uniformsNames).toContain("geometryWorldOffset");
        internals._bindGeometryRendering(effect);
        expect(setVector3).toHaveBeenCalledWith("geometryWorldOffset", expect.any(Vector3));
        expect(boundOffset.asArray()).toEqual(world.map((value, index) => value - origin[index]));

        const renderPosition = Vector3.FromArray(internals._vertexData);
        const localPosition = Vector3.TransformCoordinates(renderPosition.subtract(boundOffset), boundInverse);
        expect(localPosition.x).toBeCloseTo(expectedLocal.x, 4);
        expect(localPosition.y).toBeCloseTo(expectedLocal.y, 4);
        expect(localPosition.z).toBeCloseTo(expectedLocal.z, 4);
        particleSystem.dispose();
    });

    it.each([
        { isLocal: false, localOutput: true },
        { isLocal: true, localOutput: false },
    ])("does not bind an unused local-position conversion ($isLocal/$localOutput)", ({ isLocal, localOutput }) => {
        const configuration = MaterialHelperGeometryRendering.CreateConfiguration(Constants.RENDERPASS_MAIN);
        configuration.defines.PREPASS_COLOR_INDEX = 0;
        configuration.defines[localOutput ? "PREPASS_LOCAL_POSITION_INDEX" : "PREPASS_POSITION_INDEX"] = 1;
        MaterialHelperGeometryRendering._PrepareConfiguration(Constants.RENDERPASS_MAIN, [1, 2], [1, 0]);
        const system = new ParticleSystem("CPU", 1, scene);
        system.isLocal = isLocal;
        const internals = system as unknown as {
            _getWrapper: (blendMode: number) => DrawWrapper;
            _bindGeometryRendering: (effect: Effect) => void;
        };
        const createEffectSpy = vi.spyOn(engine, "createEffect");
        internals._getWrapper(system.blendMode);
        expect(getLastEffectOptions(createEffectSpy).uniformsNames).not.toContain("geometryWorldOffset");
        const setVector3 = vi.fn();
        const setMatrix = vi.fn();
        internals._bindGeometryRendering({ setVector3, setMatrix, setFloat: vi.fn(), setInt: vi.fn(), setFloat2: vi.fn() } as unknown as Effect);
        expect(setVector3).not.toHaveBeenCalled();
        expect(setMatrix).not.toHaveBeenCalled();
        system.dispose();
    });
});
