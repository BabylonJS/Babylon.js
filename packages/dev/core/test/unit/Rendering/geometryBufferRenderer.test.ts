import { describe, expect, it, vi } from "vitest";
import "core/Engines/Extensions/engine.multiRender";
import { NullEngine } from "core/Engines/nullEngine";
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
});
