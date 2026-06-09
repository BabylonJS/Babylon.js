import { NullEngine } from "core/Engines/nullEngine";
import { NodeMaterial } from "core/Materials/Node/nodeMaterial";
import { Effect } from "core/Materials/effect";
import { ShaderLanguage } from "core/Materials/shaderLanguage";
import { FreeCamera } from "core/Cameras/freeCamera";
import { Vector3 } from "core/Maths/math.vector";
import { Scene } from "core/scene";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Some node material blocks (e.g. CurrentScreenBlock) load their shader code through an asynchronous
// dynamic import, so NodeMaterial.build() can finish after it returns. createPostProcess /
// createProceduralTexture used to read the (still empty) compilation strings synchronously and register
// empty shaders, which made the engine try to fetch the shaders from a URL and fail with a 404 - leaving
// the NME preview blank in Post Process / Smart Filter / Procedural modes. These tests lock in that the
// effect creation is deferred until the build has produced real (non-empty) shader code.
describe("NodeMaterial effect creation with an asynchronous build", () => {
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

    const waitForBuild = async (material: NodeMaterial): Promise<void> => {
        if (!material.buildIsInProgress) {
            return;
        }
        await new Promise<void>((resolve) => material.onBuildObservable.addOnce(() => resolve()));
    };

    it("defers post process shader registration until the asynchronous build completes", async () => {
        const material = new NodeMaterial("node", scene);
        material.setToDefaultPostProcess();
        material.build();

        // CurrentScreenBlock loads its shader code asynchronously, so the build is still in progress.
        expect(material.buildIsInProgress).toBe(true);

        const registerSpy = vi.spyOn(Effect, "RegisterShader");

        const camera = new FreeCamera("camera", new Vector3(0, 0, -1), scene);
        const postProcess = material.createPostProcess(camera);

        // A usable handle is returned synchronously...
        expect(postProcess).not.toBeNull();
        // ...but no empty shader is registered while the build is still pending (an empty registration
        // is what made the engine fetch the shader from a URL and 404).
        expect(registerSpy.mock.calls.filter(([, pixelShader]) => !pixelShader)).toHaveLength(0);

        await waitForBuild(material);

        // Once the build completes, the real (non-empty) shader is registered.
        const registeredRealShader = registerSpy.mock.calls.some(([name, pixelShader]) => typeof name === "string" && name.startsWith("node") && !!pixelShader);
        expect(registeredRealShader).toBe(true);

        registerSpy.mockRestore();
        postProcess?.dispose(camera);
    });

    it("defers procedural texture shader registration until the asynchronous build completes", async () => {
        const material = new NodeMaterial("node", scene);
        material.setToDefaultProceduralTexture();
        material.build();

        expect(material.buildIsInProgress).toBe(true);

        const registerSpy = vi.spyOn(Effect, "RegisterShader");

        const proceduralTexture = material.createProceduralTexture(256, scene);

        expect(proceduralTexture).not.toBeNull();
        // A procedural texture without an effect yet must report "not ready" instead of throwing.
        expect(proceduralTexture!.isReady()).toBe(false);
        expect(registerSpy.mock.calls.filter(([, pixelShader]) => !pixelShader)).toHaveLength(0);

        await waitForBuild(material);

        const registeredRealShader = registerSpy.mock.calls.some(([name, pixelShader]) => typeof name === "string" && name.startsWith("node") && !!pixelShader);
        expect(registeredRealShader).toBe(true);

        registerSpy.mockRestore();
        proceduralTexture?.dispose();
    });

    it("registers the post process shaders with the material shader language (WGSL)", async () => {
        vi.spyOn(engine, "isWebGPU", "get").mockReturnValue(true);
        const material = new NodeMaterial("node", scene, { shaderLanguage: ShaderLanguage.WGSL });
        material.setToDefaultPostProcess();
        material.build();

        expect(material.buildIsInProgress).toBe(true);

        const registerSpy = vi.spyOn(Effect, "RegisterShader");

        const camera = new FreeCamera("camera", new Vector3(0, 0, -1), scene);
        const postProcess = material.createPostProcess(camera);

        await waitForBuild(material);

        // The shader must be registered into the WGSL store (the 4th argument), otherwise a WGSL node
        // material post process resolves against the GLSL store and fails to compile.
        const registeredAsWgsl = registerSpy.mock.calls.some(
            ([name, pixelShader, , shaderLanguage]) => typeof name === "string" && name.startsWith("node") && !!pixelShader && shaderLanguage === ShaderLanguage.WGSL
        );
        expect(registeredAsWgsl).toBe(true);

        registerSpy.mockRestore();
        postProcess?.dispose(camera);
    });

    it("creates the procedural texture effect with the material shader language (WGSL)", async () => {
        vi.spyOn(engine, "isWebGPU", "get").mockReturnValue(true);
        const material = new NodeMaterial("node", scene, { shaderLanguage: ShaderLanguage.WGSL });
        material.setToDefaultProceduralTexture();
        material.build();

        expect(material.buildIsInProgress).toBe(true);

        const createEffectSpy = vi.spyOn(engine, "createEffect");

        const proceduralTexture = material.createProceduralTexture(256, scene);

        await waitForBuild(material);
        // The effect is created on a SetImmediate; let it run.
        await new Promise((resolve) => setTimeout(resolve, 16));

        // createEffect receives the shader language as its 10th argument; it must be WGSL here.
        const createdAsWgsl = createEffectSpy.mock.calls.some((args) => args[9] === ShaderLanguage.WGSL);
        expect(createdAsWgsl).toBe(true);

        createEffectSpy.mockRestore();
        proceduralTexture?.dispose();
    });
});
