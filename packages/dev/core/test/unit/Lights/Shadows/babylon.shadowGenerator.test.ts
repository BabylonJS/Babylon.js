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
    });
});
