import { describe, expect, it, vi } from "vitest";
import "core/Engines/Extensions/engine.multiRender";
import { NullEngine } from "core/Engines/nullEngine";
import { Constants } from "core/Engines/constants";
import { GeometryBufferRenderer } from "core/Rendering/geometryBufferRenderer";
import { Scene } from "core/scene";
import "core/Shaders/geometry.fragment";
import "core/Shaders/geometry.vertex";

describe("GeometryBufferRenderer object IDs", () => {
    it("rejects object IDs when linked to the PrePassRenderer", async () => {
        const engine = new NullEngine();
        vi.spyOn(engine, "buildTextureLayout").mockImplementation((textureStatus) => textureStatus.map((enabled, index) => (enabled ? index + 1 : 0)));
        const scene = new Scene(engine);
        const renderer = new GeometryBufferRenderer(scene);
        await Promise.resolve();

        try {
            renderer._linkPrePassRenderer(null!);

            expect(() => {
                renderer.enableObjectId = true;
            }).toThrow("GeometryBufferRenderer: object ID textures are not supported when linked to the PrePassRenderer");
            expect(renderer.enableObjectId).toBe(false);
        } finally {
            renderer.dispose();
            scene.dispose();
            engine.dispose();
        }
    });

    it("rejects PrePass linking after object IDs are enabled", async () => {
        const engine = new NullEngine();
        vi.spyOn(engine, "buildTextureLayout").mockImplementation((textureStatus) => textureStatus.map((enabled, index) => (enabled ? index + 1 : 0)));
        const scene = new Scene(engine);
        const renderer = new GeometryBufferRenderer(scene);
        await Promise.resolve();

        try {
            vi.spyOn(renderer as any, "_createRenderTargets").mockImplementation(() => {});
            renderer.enableObjectId = true;

            expect(() => renderer._linkPrePassRenderer(null!)).toThrow("object ID and mesh-blending tag textures are not supported");
        } finally {
            scene.dispose();
            engine.dispose();
        }
    });
});

describe("GeometryBufferRenderer sizing", () => {
    it("uses integer physical dimensions for ratio-based targets", async () => {
        const engine = new NullEngine();
        let renderWidth = 1001;
        let renderHeight = 601;
        vi.spyOn(engine, "getRenderWidth").mockImplementation(() => renderWidth);
        vi.spyOn(engine, "getRenderHeight").mockImplementation(() => renderHeight);
        vi.spyOn(engine, "buildTextureLayout").mockImplementation((textureStatus) => textureStatus.map((enabled, index) => (enabled ? index + 1 : 0)));
        const scene = new Scene(engine);
        const renderer = new GeometryBufferRenderer(scene, 0.5);
        await Promise.resolve();

        try {
            expect((renderer as any)._getRenderTargetDimensions()).toEqual({ width: 500, height: 300 });

            renderWidth = 1003;
            renderHeight = 603;

            expect((renderer as any)._getRenderTargetDimensions()).toEqual({ width: 501, height: 301 });

            const explicitRenderer = new GeometryBufferRenderer(scene, { width: 100.75, height: 50.25 });
            try {
                expect((explicitRenderer as any)._getRenderTargetDimensions()).toEqual({ width: 100, height: 50 });
            } finally {
                explicitRenderer.dispose();
            }
        } finally {
            renderer.dispose();
            scene.dispose();
            engine.dispose();
        }
    });
});

describe("GeometryBufferRenderer mesh-blending tags", () => {
    it("configures a final, nearest-sampled R8UI attachment on WebGL2", async () => {
        const engine = new NullEngine();
        vi.spyOn(engine, "buildTextureLayout").mockImplementation((textureStatus) => textureStatus.map((enabled, index) => (enabled ? index + 1 : 0)));
        const scene = new Scene(engine);
        const renderer = new GeometryBufferRenderer(scene);
        await Promise.resolve();

        try {
            engine._webGLVersion = 2;
            engine.getCaps().drawBuffersExtension = true;
            engine.getCaps().maxDrawBuffers = 8;
            engine.getCaps().blendParametersPerTarget = true;
            vi.spyOn(renderer as any, "_createRenderTargets").mockImplementation(() => {});
            renderer.enableMeshBlendingTag = true;

            const [count, names, formats] = (renderer as any)._assignRenderTargetIndices();
            const index = renderer.getTextureIndex(GeometryBufferRenderer.MESH_BLEND_TAG_TEXTURE_TYPE);
            expect(index).toBe(count - 1);
            expect(names[index]).toBe("gBuffer_MeshBlendTag");
            expect(formats[index]).toEqual({
                textureType: Constants.TEXTURETYPE_UNSIGNED_BYTE,
                textureFormat: Constants.TEXTUREFORMAT_RED_INTEGER,
                samplingMode: Constants.TEXTURE_NEAREST_SAMPLINGMODE,
            });
        } finally {
            scene.dispose();
            engine.dispose();
        }
    });

    it("rejects unsupported backends, multisampling, and PrePass linking", async () => {
        const engine = new NullEngine();
        vi.spyOn(engine, "buildTextureLayout").mockImplementation((textureStatus) => textureStatus.map((enabled, index) => (enabled ? index + 1 : 0)));
        const scene = new Scene(engine);
        const renderer = new GeometryBufferRenderer(scene);
        await Promise.resolve();

        try {
            engine.getCaps().drawBuffersExtension = true;
            engine.getCaps().maxDrawBuffers = 8;
            expect(() => {
                renderer.enableMeshBlendingTag = true;
            }).toThrow("mesh-blending tag textures require WebGL2 or WebGPU");

            engine._webGLVersion = 2;
            engine.getCaps().blendParametersPerTarget = true;
            renderer.samples = 2;
            expect(() => {
                renderer.enableMeshBlendingTag = true;
            }).toThrow("mesh-blending tag textures require samples to be 1");

            renderer.samples = 1;
            renderer._linkPrePassRenderer(null!);
            expect(() => {
                renderer.enableMeshBlendingTag = true;
            }).toThrow("mesh-blending tag textures are not supported when linked to the PrePassRenderer");
        } finally {
            renderer.dispose();
            scene.dispose();
            engine.dispose();
        }
    });

    it("rejects Native even though it reports a WebGL2-compatible version", async () => {
        const engine = new NullEngine();
        engine._webGLVersion = 2;
        (engine as any)._shaderPlatformName = "NATIVE";
        const scene = new Scene(engine);
        const renderer = new GeometryBufferRenderer(scene);
        await Promise.resolve();

        try {
            expect(() => {
                renderer.enableMeshBlendingTag = true;
            }).toThrow("mesh-blending tag textures require WebGL2 or WebGPU");
        } finally {
            renderer.dispose();
            scene.dispose();
            engine.dispose();
        }
    });

    it("requires per-target blend parameters for transparent mesh-blending tags on WebGL2", async () => {
        const engine = new NullEngine();
        engine._webGLVersion = 2;
        const scene = new Scene(engine);
        const renderer = new GeometryBufferRenderer(scene);
        await Promise.resolve();

        try {
            expect(() => {
                renderer.enableMeshBlendingTag = true;
            }).toThrow("transparent mesh-blending tags require per-target blend parameters");

            renderer.renderTransparentMeshes = false;
            vi.spyOn(renderer as any, "_createRenderTargets").mockImplementation(() => {});
            expect(() => {
                renderer.enableMeshBlendingTag = true;
            }).not.toThrow();
            expect(() => {
                renderer.renderTransparentMeshes = true;
            }).toThrow("transparent mesh-blending tags require per-target blend parameters");
        } finally {
            renderer.dispose();
            scene.dispose();
            engine.dispose();
        }
    });

    it("rejects PrePass linking after the tag attachment is enabled", async () => {
        const engine = new NullEngine();
        vi.spyOn(engine, "buildTextureLayout").mockImplementation((textureStatus) => textureStatus.map((enabled, index) => (enabled ? index + 1 : 0)));
        const scene = new Scene(engine);
        const renderer = new GeometryBufferRenderer(scene);
        await Promise.resolve();

        try {
            engine._webGLVersion = 2;
            engine.getCaps().blendParametersPerTarget = true;
            vi.spyOn(renderer as any, "_createRenderTargets").mockImplementation(() => {});
            renderer.enableMeshBlendingTag = true;

            expect(() => renderer._linkPrePassRenderer(null!)).toThrow("mesh-blending tag textures are not supported when linked to the PrePassRenderer");
        } finally {
            scene.dispose();
            engine.dispose();
        }
    });

    it("rebuilds only its own targets when the tag output is disabled", async () => {
        const engine = new NullEngine();
        vi.spyOn(engine, "buildTextureLayout").mockImplementation((textureStatus) => textureStatus.map((enabled, index) => (enabled ? index + 1 : 0)));
        const scene = new Scene(engine);
        const renderer = new GeometryBufferRenderer(scene);
        await Promise.resolve();

        try {
            engine._webGLVersion = 2;
            engine.getCaps().blendParametersPerTarget = true;
            const createRenderTargetsSpy = vi.spyOn(renderer as any, "_createRenderTargets").mockImplementation(() => {});
            renderer.enableMeshBlendingTag = true;
            renderer.enableMeshBlendingTag = true;
            renderer.enableMeshBlendingTag = false;
            renderer.enableMeshBlendingTag = false;

            expect(createRenderTargetsSpy).toHaveBeenCalledTimes(2);
            expect(renderer.enableMeshBlendingTag).toBe(false);
            expect(renderer.getTextureIndex(GeometryBufferRenderer.MESH_BLEND_TAG_TEXTURE_TYPE)).toBe(-1);
        } finally {
            renderer.dispose();
            scene.dispose();
            engine.dispose();
        }
    });
});
