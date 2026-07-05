import { NullEngine } from "core/Engines/nullEngine";
import { ShaderLanguage } from "core/Materials/shaderLanguage";
import { PostProcess } from "core/PostProcesses/postProcess.pure";
import { VolumetricLightScatteringPostProcess } from "core/PostProcesses/volumetricLightScatteringPostProcess.pure";
import { Scene } from "core/scene";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

function createReadyEffect(engine: NullEngine): any {
    return {
        dispose: vi.fn(),
        getEngine: () => engine,
        isReady: () => true,
    };
}

describe("VolumetricLightScatteringPostProcess", () => {
    let engine: NullEngine;
    let scene: Scene;
    let postProcess: VolumetricLightScatteringPostProcess | undefined;

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
        PostProcess.ForceGLSL = false;

        if (postProcess) {
            const pass = postProcess.getPass();
            const passIndex = scene.customRenderTargets.indexOf(pass);
            if (passIndex !== -1) {
                scene.customRenderTargets.splice(passIndex, 1);
            }
            pass.dispose();
            PostProcess.prototype.dispose.call(postProcess);
            postProcess = undefined;
        }

        vi.restoreAllMocks();
        scene.dispose();
        engine.dispose();
    });

    for (const { name, isWebGPU, forceGLSL, expectedShaderLanguage, expectedUseWebGPU } of [
        {
            name: "WGSL on WebGPU",
            isWebGPU: true,
            forceGLSL: false,
            expectedShaderLanguage: ShaderLanguage.WGSL,
            expectedUseWebGPU: true,
        },
        {
            name: "GLSL when ForceGLSL is enabled on WebGPU",
            isWebGPU: true,
            forceGLSL: true,
            expectedShaderLanguage: ShaderLanguage.GLSL,
            expectedUseWebGPU: false,
        },
        {
            name: "GLSL on non-WebGPU engines",
            isWebGPU: false,
            forceGLSL: false,
            expectedShaderLanguage: ShaderLanguage.GLSL,
            expectedUseWebGPU: false,
        },
    ] as const) {
        it(`uses the scene engine and selects ${name} when camera is null`, () => {
            Object.defineProperty(engine, "isWebGPU", { configurable: true, value: isWebGPU });
            PostProcess.ForceGLSL = forceGLSL;

            const createEffect = vi.spyOn(engine, "createEffect").mockReturnValue(createReadyEffect(engine));
            const gatherImports = vi.spyOn(VolumetricLightScatteringPostProcess.prototype as any, "_gatherImports");

            expect(() => {
                postProcess = new VolumetricLightScatteringPostProcess("vls", 1, null, undefined, undefined, undefined, undefined, undefined, scene);
            }).not.toThrow();

            expect(postProcess!.getEngine()).toBe(engine);
            expect(gatherImports).toHaveBeenCalledWith(expectedUseWebGPU, expect.any(Array));

            const postProcessEffectCall = createEffect.mock.calls.find(([shaderPath]) => {
                return typeof shaderPath === "object" && shaderPath !== null && "fragment" in shaderPath && shaderPath.fragment === "volumetricLightScattering";
            });
            expect(postProcessEffectCall).toBeDefined();
            expect(postProcessEffectCall![1]).toMatchObject({ shaderLanguage: expectedShaderLanguage });
        });
    }
});
