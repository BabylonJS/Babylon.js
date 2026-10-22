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
import { MirrorTexture } from "core/Materials/Textures/mirrorTexture";
import { RenderTargetTexture } from "core/Materials/Textures/renderTargetTexture";
import { Plane } from "core/Maths/math.plane";
import { CreateBox } from "core/Meshes/Builders/boxBuilder";
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

            // a WGSL receiver here is compiled with the cascades buffer of light 0 (it fits within the device limit)
            const createEffect = (shaderLanguage: ShaderLanguage) =>
                ({
                    shaderLanguage,
                    _uniformBuffersNames: shaderLanguage === ShaderLanguage.WGSL ? { Light0: 0, cascades0: 1 } : { Light0: 0 },
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

            // the values a cascades buffer holds for one of its fields
            const cascadesField = (ubo: UniformBuffer, name: string, count = 1) => {
                const location = (ubo as unknown as { _uniformLocations: Record<string, number> })._uniformLocations[name];
                return Array.from(ubo.getData().subarray(location, location + count));
            };

            // A receiver bound now, as a WGSL effect and as a GLSL one: the cascades buffer the WGSL one gets, and the light
            // matrices the GLSL one gets as effect uniforms, which is what the WGSL one received before the cascades buffer
            const bindReceiver = (generator: CascadedShadowGenerator) => {
                const bound = vi.spyOn(UniformBuffer.prototype, "bindUniformBuffer");
                const wgsl = createEffect(ShaderLanguage.WGSL);
                const glsl = createEffect(ShaderLanguage.GLSL);
                generator.bindShadowLight("0", wgsl);
                generator.bindShadowLight("0", glsl);
                const ubo = bound.mock.contexts[bound.mock.contexts.length - 1] as UniformBuffer;
                bound.mockRestore();
                return { ubo, legacyLightMatrices: Array.from(glsl.setMatrices.mock.calls[0][1] as Float32Array) };
            };

            // a caster in front of the camera, so that the cascades have a depth range, and the camera's matrices in the scene
            const prepareView = (generator: CascadedShadowGenerator, x: number, z: number) => {
                const scene = generator.getLight().getScene();
                const caster = CreateBox("caster", { size: 4 }, scene);
                caster.position.set(x, 1, z);
                caster.computeWorldMatrix(true);
                generator.addShadowCaster(caster);
                scene.activeCamera!.computeWorldMatrix(true);
                scene.updateTransformMatrix(true);
            };

            const createFloatingOriginGenerator = () => {
                const scene = new Scene(engine, { useFloatingOrigin: true });
                const light = new DirectionalLight("Directional", new Vector3(-0.3, -1, 0.2), scene);
                const camera = new FreeCamera("camera", new Vector3(5000, 40, -3000), scene);
                camera.setTarget(new Vector3(5000, 0, -2900));
                scene.activeCamera = camera;
                const generator = new CascadedShadowGenerator(1024, light);
                prepareView(generator, 5000, -2950);
                return { scene, camera, generator };
            };

            it("gives receivers in a mirror their own cascades in floating origin mode", () => {
                const { scene, generator } = createFloatingOriginGenerator();
                const mirror = new MirrorTexture("mirror", 256, scene);
                mirror.mirrorPlane = new Plane(0, -1, 0, 0);

                computeCascades(generator);
                const main = bindReceiver(generator);
                mirror.onBeforeRenderObservable.notifyObservers(0);
                const reflected = bindReceiver(generator);
                mirror.onAfterRenderObservable.notifyObservers(0);

                // both views' commands run after every write of the frame: the mirror must not change the main view's buffer
                expect(reflected.ubo).not.toBe(main.ubo);
                expect(cascadesField(reflected.ubo, "lightMatrix", 64)).toEqual(reflected.legacyLightMatrices);
                expect(cascadesField(main.ubo, "lightMatrix", 64)).toEqual(main.legacyLightMatrices);
                scene.dispose();
            });

            it("follows the eye in floating origin mode while the shadow map does not render again", () => {
                const { scene, camera, generator } = createFloatingOriginGenerator();
                generator.getShadowMap()!.refreshRate = RenderTargetTexture.REFRESHRATE_RENDER_ONCE;

                computeCascades(generator);
                const first = bindReceiver(generator);
                engine.endFrame();
                camera.position.x += 100;
                camera.computeWorldMatrix(true);
                const second = bindReceiver(generator);

                expect(second.legacyLightMatrices).not.toEqual(first.legacyLightMatrices);
                expect(cascadesField(second.ubo, "lightMatrix", 64)).toEqual(second.legacyLightMatrices);
                scene.dispose();
            });

            it("keeps one cascades buffer per camera outside of floating origin mode, mirrors included", () => {
                const generator = createCameraGenerator();
                const scene = generator.getLight().getScene();
                prepareView(generator, 0, 0);
                const mirror = new MirrorTexture("mirror", 256, scene);
                mirror.mirrorPlane = new Plane(0, -1, 0, 0);

                computeCascades(generator);
                const main = bindReceiver(generator);
                mirror.onBeforeRenderObservable.notifyObservers(0);
                const reflected = bindReceiver(generator);
                mirror.onAfterRenderObservable.notifyObservers(0);

                expect(reflected.ubo).toBe(main.ubo);
                expect(cascadesField(main.ubo, "lightMatrix", 64)).toEqual(main.legacyLightMatrices);
            });

            it("applies cascadeBlendPercentage and penumbraDarkness while the shadow map renders once", () => {
                engine._features.supportShadowSamplers = true;
                const generator = createCameraGenerator();
                generator.filter = ShadowGenerator.FILTER_PCSS;
                generator.getShadowMap()!.refreshRate = RenderTargetTexture.REFRESHRATE_RENDER_ONCE;
                prepareView(generator, 0, 0);

                computeCascades(generator);
                const { ubo } = bindReceiver(generator);
                expect(cascadesField(ubo, "cascadeBlendFactor")).toEqual([10]);

                generator.cascadeBlendPercentage = 0.5;
                generator.penumbraDarkness = 0.25;
                const update = vi.spyOn(UniformBuffer.prototype, "update");
                const receivers = [bindReceiver(generator), bindReceiver(generator), bindReceiver(generator)];

                expect(receivers.every((receiver) => receiver.ubo === ubo)).toBe(true);
                expect(cascadesField(ubo, "cascadeBlendFactor")).toEqual([2]);
                expect(cascadesField(ubo, "penumbraDarkness")).toEqual([0.25]);
                // not uploaded again for each receiver
                expect(update.mock.contexts.filter((context: UniformBuffer) => context === ubo).length).toBeLessThanOrEqual(1);
            });
        });
    });
});
