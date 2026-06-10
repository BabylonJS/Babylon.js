import { describe, it, expect, vi, afterEach } from "vitest";
import { NullEngine } from "core/Engines/nullEngine";
import { MeshBuilder } from "core/Meshes/meshBuilder";
import { Scene } from "core/scene";
import { ShaderLanguage } from "core/Materials/shaderLanguage";
import { FluentMaterial } from "../../src/3D/materials/fluent/fluentMaterial";
import { FluentBackplateMaterial } from "../../src/3D/materials/fluentBackplate/fluentBackplateMaterial";
import { FluentButtonMaterial } from "../../src/3D/materials/fluentButton/fluentButtonMaterial";
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

function getErrorThrownBy(callback: () => void): Error {
    let thrownError: unknown;
    try {
        callback();
    } catch (error) {
        thrownError = error;
    }

    expect(thrownError).toBeInstanceOf(Error);
    return thrownError as Error;
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

    it("uses WGSL when FluentButtonMaterial creates an effect under WebGPU", () => {
        engine = createWebGPUNullEngine();
        scene = new Scene(engine);
        const mesh = MeshBuilder.CreatePlane("button", {}, scene);
        const material = new FluentButtonMaterial("button", scene);
        (material as any)._blobTexture.isReady = () => true;
        const createEffect = vi.spyOn(engine, "createEffect").mockReturnValue(createReadyEffect(engine));

        expect(material.isReadyForSubMesh(mesh, mesh.subMeshes[0])).toBe(true);
        expect(createEffect).toHaveBeenCalled();

        const options = createEffect.mock.calls[0][1] as any;
        expect(options.shaderLanguage).toBe(ShaderLanguage.WGSL);
        expect(options.extraInitializationsAsync).toBeTypeOf("function");
    });

    it("should not create the effect until the blob texture is ready", () => {
        engine = createWebGPUNullEngine();
        scene = new Scene(engine);
        const mesh = MeshBuilder.CreatePlane("button", {}, scene);
        const material = new FluentButtonMaterial("button", scene);
        const createEffect = vi.spyOn(engine, "createEffect").mockReturnValue(createReadyEffect(engine));

        (material as any)._blobTexture.isReady = () => false;
        expect(material.isReadyForSubMesh(mesh, mesh.subMeshes[0])).toBe(false);
        expect(createEffect).not.toHaveBeenCalled();

        (material as any)._blobTexture.isReady = () => true;
        expect(material.isReadyForSubMesh(mesh, mesh.subMeshes[0])).toBe(true);
        expect(createEffect).toHaveBeenCalledOnce();
    });

    it("throws an actionable FluentButtonMaterial error when async blob texture loading fails", () => {
        engine = createWebGPUNullEngine();
        scene = new Scene(engine);
        const mesh = MeshBuilder.CreatePlane("button", {}, scene);
        const material = new FluentButtonMaterial("button", scene);
        const blobTexture = (material as any)._blobTexture;
        const blobTextureException = new Error("mock async blob fetch rejected");
        const createEffect = vi.spyOn(engine, "createEffect").mockReturnValue(createReadyEffect(engine));

        blobTexture.isReady = vi.fn(() => false);
        Object.defineProperty(blobTexture, "loadingError", {
            configurable: true,
            value: true,
        });
        Object.defineProperty(blobTexture, "errorObject", {
            configurable: true,
            value: {
                message: "mock blob texture load failed",
                exception: blobTextureException,
            },
        });

        const error = getErrorThrownBy(() => material.isReadyForSubMesh(mesh, mesh.subMeshes[0]));

        expect(error.message).toContain('FluentButtonMaterial "button" failed to load blob texture');
        expect(error.message).toContain("mrtk-fluent-button-blob.png");
        expect(error.message).toContain("mock blob texture load failed");
        expect(error.message).toContain("FluentButtonMaterial.BLOB_TEXTURE_URL");
        expect((error as Error & { cause?: unknown }).cause).toBe(blobTextureException);
        expect(error.stack).toContain("FluentButtonMaterial.isReadyForSubMesh");
        expect(blobTexture.isReady).not.toHaveBeenCalled();
        expect(createEffect).not.toHaveBeenCalled();
    });

    it("uses WGSL for HandleMaterial under WebGPU", () => {
        engine = createWebGPUNullEngine();
        scene = new Scene(engine);
        const material = new HandleMaterial("handle", scene);

        expect(material.options.shaderLanguage).toBe(ShaderLanguage.WGSL);
        expect(material.options.extraInitializationsAsync).toBeTypeOf("function");
    });
});
