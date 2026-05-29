import { describe, it, expect, vi, afterEach } from "vitest";
import { NullEngine } from "core/Engines/nullEngine";
import { MeshBuilder } from "core/Meshes/meshBuilder";
import { Scene } from "core/scene";
import { ShaderLanguage } from "core/Materials/shaderLanguage";
import { FluentMaterial } from "../../src/3D/materials/fluent/fluentMaterial";
import { FluentBackplateMaterial } from "../../src/3D/materials/fluentBackplate/fluentBackplateMaterial";
import { HandleMaterial } from "../../src/3D/materials/handle/handleMaterial";

function createWebGPUNullEngine(): NullEngine {
    const engine = new NullEngine({
        renderHeight: 256,
        renderWidth: 256,
        textureSize: 256,
    });

    Object.defineProperty(engine, "isWebGPU", {
        configurable: true,
        value: true,
    });

    return engine;
}

function createReadyEffect(engine: NullEngine): any {
    return {
        isReady: () => true,
        dispose: () => {},
        getEngine: () => engine,
    };
}

describe("GUI3D WebGPU shaders", () => {
    let engine: NullEngine | undefined;
    let scene: Scene | undefined;

    afterEach(() => {
        scene?.dispose();
        engine?.dispose();
        scene = undefined;
        engine = undefined;
    });

    it("uses WGSL when FluentMaterial creates an effect under WebGPU", () => {
        engine = createWebGPUNullEngine();
        scene = new Scene(engine);
        const mesh = MeshBuilder.CreateBox("box", {}, scene);
        const material = new FluentMaterial("fluent", scene);
        const createEffect = vi.spyOn(engine, "createEffect").mockReturnValue(createReadyEffect(engine));

        expect(material.isReadyForSubMesh(mesh, mesh.subMeshes[0])).toBe(true);
        expect(createEffect).toHaveBeenCalled();

        const options = createEffect.mock.calls[0][1] as any;
        expect(options.shaderLanguage).toBe(ShaderLanguage.WGSL);
        expect(options.extraInitializationsAsync).toBeTypeOf("function");
    });

    it("uses WGSL when FluentBackplateMaterial creates an effect under WebGPU", () => {
        engine = createWebGPUNullEngine();
        scene = new Scene(engine);
        const mesh = MeshBuilder.CreatePlane("plane", {}, scene);
        const material = new FluentBackplateMaterial("backplate", scene);
        (material as any)._blobTexture.isReady = () => true;
        (material as any)._iridescentMap.isReady = () => true;
        const createEffect = vi.spyOn(engine, "createEffect").mockReturnValue(createReadyEffect(engine));

        expect(material.isReadyForSubMesh(mesh, mesh.subMeshes[0])).toBe(true);
        expect(createEffect).toHaveBeenCalled();

        const options = createEffect.mock.calls[0][1] as any;
        expect(options.shaderLanguage).toBe(ShaderLanguage.WGSL);
        expect(options.extraInitializationsAsync).toBeTypeOf("function");
    });

    it("uses WGSL for HandleMaterial under WebGPU", () => {
        engine = createWebGPUNullEngine();
        scene = new Scene(engine);
        const material = new HandleMaterial("handle", scene);

        expect(material.options.shaderLanguage).toBe(ShaderLanguage.WGSL);
        expect(material.options.extraInitializationsAsync).toBeTypeOf("function");
    });
});
