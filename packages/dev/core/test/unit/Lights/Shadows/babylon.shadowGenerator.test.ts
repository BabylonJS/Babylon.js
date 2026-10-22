import { NullEngine } from "core/Engines/nullEngine";
import { type Engine } from "core/Engines/engine";
import { DirectionalLight } from "core/Lights/directionalLight";
import { PointLight } from "core/Lights/pointLight";
import { CascadedShadowGenerator } from "core/Lights/Shadows/cascadedShadowGenerator";
import { ShadowGenerator } from "core/Lights/Shadows/shadowGenerator";
import { Vector3 } from "core/Maths/math.vector";
import { Scene } from "core/scene";
import { InternalTexture, InternalTextureSource } from "core/Materials/Textures/internalTexture";
import { Logger } from "core/Misc/logger";
import { FreeCamera } from "core/Cameras/freeCamera";
import { type Camera } from "core/Cameras/camera";
import { type Effect } from "core/Materials/effect";
import { ShaderLanguage } from "core/Materials/shaderLanguage";
import { UniformBuffer } from "core/Materials/uniformBuffer";
import { type Nullable } from "core/types";
import { vi } from "vitest";

import "core/Lights/Shadows/shadowGeneratorSceneComponent";

// Pre-load shader modules that ShadowGenerator dynamically imports during construction.
// Without these, the fire-and-forget import() in _initShaderSourceAsync may still be
// resolving when the test environment tears down, causing EnvironmentTeardownError.
import "core/Shaders/shadowMap.fragment";
import "core/Shaders/shadowMap.vertex";
import "core/Shaders/depthBoxBlur.fragment";
import "core/Shaders/ShadersInclude/shadowMapFragmentSoftTransparentShadow";

describe("ShadowGenerator", () => {
    describe("instantiate", () => {
        let subject: Engine;

        beforeEach(function () {
            subject = new NullEngine({
                renderHeight: 256,
                renderWidth: 256,
                textureSize: 256,
                deterministicLockstep: false,
                lockstepMaxSteps: 1,
            });
        });

        afterEach(function () {
            subject.dispose();
        });

        it("should be able to be instantiated with a null engine", () => {
            const scene = new Scene(subject);
            const light = new PointLight("Point", new Vector3(1, 1, 1), scene);
            const generator = new ShadowGenerator(1024, light);

            expect(generator).not.toBeUndefined();
        });

        it("should throw a descriptive error when cascaded shadow maps are not supported", () => {
            const scene = new Scene(subject);
            const light = new DirectionalLight("Directional", new Vector3(0, -1, 0), scene);

            expect(CascadedShadowGenerator.IsSupported).toBe(false);
            expect(() => new CascadedShadowGenerator(1024, light)).toThrow("CascadedShadowMap is not supported by the current engine.");
        });
    });

    describe("cascaded", () => {
        let engine: Engine;

        beforeEach(function () {
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
        });

        afterEach(function () {
            vi.restoreAllMocks();
            engine.dispose();
        });

        const createGenerator = () => {
            const scene = new Scene(engine);
            const light = new DirectionalLight("Directional", new Vector3(0, -1, 0), scene);
            return new CascadedShadowGenerator(1024, light);
        };

        it("defaults to no filtering without comparison samplers and logs no error", () => {
            engine._features.supportShadowSamplers = false;
            const error = vi.spyOn(Logger, "Error");

            const generator = createGenerator();

            expect(generator.filter).toBe(ShadowGenerator.FILTER_NONE);
            expect(error).not.toHaveBeenCalled();
        });

        it("keeps the PCF default when comparison samplers are supported", () => {
            engine._features.supportShadowSamplers = true;
            const error = vi.spyOn(Logger, "Error");

            const generator = createGenerator();

            expect(generator.filter).toBe(ShadowGenerator.FILTER_PCF);
            expect(error).not.toHaveBeenCalled();
        });

        describe("cascades buffer", () => {
            beforeEach(function () {
                // WGSL receivers only exist on WebGPU, which always has uniform buffers
                vi.spyOn(engine, "supportsUniformBuffers", "get").mockReturnValue(true);
            });

            const createEffect = (shaderLanguage: ShaderLanguage) =>
                ({
                    shaderLanguage,
                    setMatrices: vi.fn(),
                    setArray: vi.fn(),
                    setArray2: vi.fn(),
                    setFloat: vi.fn(),
                    setTexture: vi.fn(),
                    setDepthStencilTexture: vi.fn(),
                    bindUniformBuffer: vi.fn(),
                }) as unknown as Effect & Record<string, ReturnType<typeof vi.fn>>;

            const createCameraGenerator = (camera: Nullable<Camera> = null) => {
                const scene = new Scene(engine);
                const light = new DirectionalLight("Directional", new Vector3(0, -1, 0), scene);
                scene.activeCamera = new FreeCamera("camera", new Vector3(0, 5, -10), scene);
                return new CascadedShadowGenerator(1024, light, undefined, camera);
            };

            // the shadow map computes the cascades when it binds, for the camera rendering at that moment
            const computeCascades = (generator: CascadedShadowGenerator) => generator.getShadowMap()!.onBeforeBindObservable.notifyObservers(generator.getShadowMap()!);

            const boundCascades = (effect: Effect & Record<string, ReturnType<typeof vi.fn>>) =>
                effect.bindUniformBuffer.mock.calls.filter(([, name]: [unknown, string]) => name === "cascades0").map(([buffer]: [unknown]) => buffer);

            it("binds the generator's cascades buffer to WGSL receivers instead of setting effect uniforms", () => {
                const generator = createCameraGenerator();
                const effect = createEffect(ShaderLanguage.WGSL);

                generator.bindShadowLight("0", effect);

                expect(boundCascades(effect)).toHaveLength(1);
                expect(effect.setMatrices).not.toHaveBeenCalled();
                expect(effect.setArray).not.toHaveBeenCalledWith("viewFrustumZ0", expect.anything());
            });

            it("keeps setting the cascades as effect uniforms for GLSL receivers", () => {
                const generator = createCameraGenerator();
                const effect = createEffect(ShaderLanguage.GLSL);

                generator.bindShadowLight("0", effect);

                expect(effect.setMatrices).toHaveBeenCalledWith("lightMatrix0", expect.any(Float32Array));
                expect(effect.setArray).toHaveBeenCalledWith("viewFrustumZ0", expect.any(Array));
                expect(boundCascades(effect)).toHaveLength(0);
            });

            it("writes the cascades of each camera in that camera's buffer", () => {
                const generator = createCameraGenerator();
                const scene = generator.getLight().getScene();
                const first = scene.activeCamera!;
                const second = new FreeCamera("second", new Vector3(20, 5, -10), scene);
                const effect = createEffect(ShaderLanguage.WGSL);
                generator.bindShadowLight("0", effect);

                computeCascades(generator);
                generator.bindShadowLight("0", effect);
                scene.activeCamera = second;
                computeCascades(generator);
                generator.bindShadowLight("0", effect);
                scene.activeCamera = first;
                computeCascades(generator);
                generator.bindShadowLight("0", effect);

                const [, forFirst, forSecond, forFirstAgain] = boundCascades(effect);
                expect(forSecond).not.toBe(forFirst);
                expect(forFirstAgain).toBe(forFirst);
            });

            it("releases its cascades buffers when it is disposed", () => {
                const generator = createCameraGenerator();
                generator.bindShadowLight("0", createEffect(ShaderLanguage.WGSL));
                const dispose = vi.spyOn(UniformBuffer.prototype, "dispose");

                generator.dispose();

                expect(dispose.mock.contexts.filter((ubo: UniformBuffer) => ubo.name === "CascadedShadowGenerator")).toHaveLength(1);
            });
        });
    });
});
