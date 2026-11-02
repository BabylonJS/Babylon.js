import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { FreeCamera } from "core/Cameras/freeCamera";
import { NullEngine } from "core/Engines/nullEngine";
import { type Engine } from "core/Engines/engine";
import { Finalize, Initialize, Process } from "core/Engines/Processors/shaderProcessor";
import { type _IProcessingOptions } from "core/Engines/Processors/shaderProcessingOptions";
import { ShaderStore } from "core/Engines/shaderStore";
import * as WebGPUConstants from "core/Engines/WebGPU/webgpuConstants";
import { WebGPUShaderProcessingContext } from "core/Engines/WebGPU/webgpuShaderProcessingContext";
import { WebGPUShaderProcessorWGSL } from "core/Engines/WebGPU/webgpuShaderProcessorsWGSL";
import { DirectionalLight } from "core/Lights/directionalLight";
import { CascadedShadowGenerator } from "core/Lights/Shadows/cascadedShadowGenerator";
import { type Effect } from "core/Materials/effect";
import { type MaterialDefines } from "core/Materials/materialDefines";
import { ShaderLanguage } from "core/Materials/shaderLanguage";
import { StandardMaterial } from "core/Materials/standardMaterial";
import { InternalTexture, InternalTextureSource } from "core/Materials/Textures/internalTexture";
import { Vector3 } from "core/Maths/math.vector";
import { CreateBox } from "core/Meshes/Builders/boxBuilder";
import { type Mesh } from "core/Meshes/mesh";
import { Scene } from "core/scene";

import "core/Lights/Shadows/shadowGeneratorSceneComponent";
// StandardMaterial serialization depends on the ColorCurves side effect.
import "core/Materials/colorCurves";
// Pre-load the shader modules that StandardMaterial and ShadowGenerator import during effect creation.
import "core/Shaders/default.fragment";
import "core/Shaders/default.vertex";
import "core/Shaders/shadowMap.fragment";
import "core/Shaders/shadowMap.vertex";
import "core/Shaders/depthBoxBlur.fragment";
import "core/Shaders/ShadersInclude/shadowMapFragmentSoftTransparentShadow";
// The WGSL shaders whose pipeline layout is checked against the device limit, with the includes they nest.
import "core/ShadersWGSL/default.fragment";
import "core/ShadersWGSL/default.vertex";

// The uniform buffers in the pipeline layout of the default material's WGSL shaders, per stage, as the WebGPU shader
// processor builds it for these defines: what the device's maxUniformBuffersPerShaderStage is checked against.
function UniformBuffersPerStage(engine: Engine, defines: string, maxSimultaneousLights: number) {
    const processingContext = new WebGPUShaderProcessingContext(ShaderLanguage.WGSL);
    const options = {
        defines: defines.split("\n"),
        indexParameters: { maxSimultaneousLights, maxSimultaneousMorphTargets: 0 },
        isFragment: false,
        shouldUseHighPrecisionShader: true,
        processor: new WebGPUShaderProcessorWGSL(),
        supportsUniformBuffers: true,
        shadersRepository: "",
        includesShadersStore: ShaderStore.IncludesShadersStoreWGSL,
        version: "100",
        platformName: "WEBGPU",
        processingContext,
        isNDCHalfZRange: true,
        useReverseDepthBuffer: false,
    } as unknown as _IProcessingOptions;
    let vertexCode = "";
    let fragmentCode = "";
    Initialize(options);
    Process(ShaderStore.ShadersStoreWGSL["defaultVertexShader"], options, (code) => (vertexCode = code), engine);
    options.isFragment = true;
    Process(ShaderStore.ShadersStoreWGSL["defaultPixelShader"], options, (code) => (fragmentCode = code), engine);
    const final = Finalize(vertexCode, fragmentCode, options);

    const vertex: string[] = [];
    const fragment: string[] = [];
    processingContext.bindGroupLayoutEntries.forEach((entries, group) =>
        entries?.forEach((entry) => {
            if (entry.buffer?.type !== WebGPUConstants.BufferBindingType.Uniform) {
                return;
            }
            const name = processingContext.bindGroupLayoutEntryInfo[group][entry.binding].name;
            if (entry.visibility & WebGPUConstants.ShaderStage.Vertex) {
                vertex.push(name);
            }
            if (entry.visibility & WebGPUConstants.ShaderStage.Fragment) {
                fragment.push(name);
            }
        })
    );
    return { vertex, fragment, fragmentCode: final.fragmentCode };
}

describe("CascadedShadowGenerator cascades buffer and the uniform buffer budget", () => {
    let engine: Engine;
    let scene: Scene;

    beforeEach(() => {
        engine = new NullEngine({
            renderHeight: 256,
            renderWidth: 256,
            textureSize: 256,
            deterministicLockstep: false,
            lockstepMaxSteps: 1,
        });
        engine._features.supportCSM = true;
        // NullEngine cannot allocate the depth texture CSM requests for its shadow map.
        vi.spyOn(engine, "_createDepthStencilTexture").mockImplementation(() => new InternalTexture(engine, InternalTextureSource.DepthStencil));
        scene = new Scene(engine);
    });

    afterEach(() => {
        vi.restoreAllMocks();
        scene.dispose();
        engine.dispose();
    });

    // A box lit by `lights` directional lights, the first `csmLights` of them casting cascaded shadows on it, on a device
    // reporting `limit` uniform buffers per shader stage; returns the defines its StandardMaterial gets.
    const prepare = (limit: number, lights: number, csmLights: number) => {
        engine.getCaps().maxUniformBuffersPerShaderStage = limit;
        const mesh: Mesh = CreateBox("box", {}, scene);
        mesh.receiveShadows = true;
        for (let i = 0; i < lights; i++) {
            const light = new DirectionalLight("light" + i, new Vector3(0.1 * i, -1, 0.2), scene);
            if (i < csmLights) {
                new CascadedShadowGenerator(512, light).addShadowCaster(mesh);
            }
        }
        const material = new StandardMaterial("material", scene);
        material.maxSimultaneousLights = lights;
        mesh.material = material;
        material.isReadyForSubMesh(mesh, mesh.subMeshes[0], false);
        return mesh.subMeshes[0].materialDefines as MaterialDefines & Record<string, unknown>;
    };

    // [device limit, lights, CSM lights]: every one fits within the limit without cascades buffers (lights + 4 <= limit),
    // which is the budget lights had before them
    describe.each([
        [12, 8, 1],
        [12, 8, 3],
        [12, 7, 1],
        [12, 7, 2],
        [12, 4, 4],
        [8, 4, 1],
        [10, 6, 2],
        [16, 12, 1],
        [16, 10, 4],
    ])("a device limit of %i, %i lights, %i of them with CSM", (limit, lights, csmLights) => {
        it("keeps every light and every cascaded shadow", () => {
            const defines = prepare(limit, lights, csmLights);

            for (let i = 0; i < lights; i++) {
                expect(defines["LIGHT" + i]).toBe(true);
                expect(defines["SHADOWCSM" + i]).toBe(i < csmLights);
            }
            const { vertex, fragmentCode } = UniformBuffersPerStage(engine, defines.toString(), lights);
            for (let i = 0; i < lights; i++) {
                expect(vertex).toContain("Light" + i);
            }
            // each CSM light reads its cascades, from the generator's buffer or from the effect uniforms
            for (let i = 0; i < csmLights; i++) {
                expect(fragmentCode).toMatch(new RegExp(`cascades${i}\\.viewFrustumZ|uniforms\\.viewFrustumZ${i}\\b`));
            }
        });

        it("stays within the limit in each stage, using the cascades buffers that fit", () => {
            const defines = prepare(limit, lights, csmLights);

            const { vertex, fragment } = UniformBuffersPerStage(engine, defines.toString(), lights);

            expect(vertex.length).toBeLessThanOrEqual(limit);
            expect(fragment.length).toBeLessThanOrEqual(limit);
            // Scene, Mesh, Internals and LeftOver, then the lights, then a cascades buffer for each CSM light that still fits
            const cascadesBuffers = Math.min(csmLights, limit - 4 - lights);
            const declared = vertex.filter((name) => name.startsWith("cascades"));
            expect(declared).toHaveLength(cascadesBuffers);
            expect(fragment.filter((name) => name.startsWith("cascades"))).toEqual(declared);
            // the effect's uniform buffer list names the cascades buffers the shader declares, and only those
            const listed = Object.keys(scene.meshes[0].subMeshes[0].effect!._uniformBuffersNames).filter((name) => name.startsWith("cascades"));
            expect(listed.sort()).toEqual([...declared].sort());
        });
    });

    it("sets the cascades as effect uniforms for a WGSL receiver whose shader has no cascades buffer", () => {
        vi.spyOn(engine, "supportsUniformBuffers", "get").mockReturnValue(true);
        const light = new DirectionalLight("light", new Vector3(0, -1, 0), scene);
        scene.activeCamera = new FreeCamera("camera", new Vector3(0, 5, -10), scene);
        const generator = new CascadedShadowGenerator(512, light);
        const effect = {
            shaderLanguage: ShaderLanguage.WGSL,
            // compiled without the cascades buffer of light 0: its uniform buffers are Light0 and the material's
            _uniformBuffersNames: { Light0: 0 },
            setMatrices: vi.fn(),
            setArray: vi.fn(),
            setArray2: vi.fn(),
            setFloat: vi.fn(),
            setTexture: vi.fn(),
            setDepthStencilTexture: vi.fn(),
            bindUniformBuffer: vi.fn(),
        } as unknown as Effect & Record<string, ReturnType<typeof vi.fn>>;

        generator.bindShadowLight("0", effect);

        expect(effect.setMatrices).toHaveBeenCalledWith("lightMatrix0", expect.any(Float32Array));
        expect(effect.setArray).toHaveBeenCalledWith("viewFrustumZ0", expect.any(Array));
        expect(effect.bindUniformBuffer).not.toHaveBeenCalled();
    });
});
