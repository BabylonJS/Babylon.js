import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { NullEngine } from "core/Engines/nullEngine";
import { type DataBuffer } from "core/Buffers/dataBuffer";
import { type VertexBuffer } from "core/Buffers/buffer";
import { Matrix } from "core/Maths/math.vector";
import { Scene } from "core/scene";
import { FontAsset } from "../../../src/msdfText/fontAsset";
import { TextRenderer } from "../../../src/msdfText/textRenderer";

/**
 * Minimal MSDF font definition: a single glyph ("a") is enough to lay out paragraphs of any length.
 * @returns the font definition as a JSON string
 */
function CreateFontDefinition(): string {
    return JSON.stringify({
        info: {
            face: "test",
            size: 32,
            bold: 0,
            italic: 0,
            charset: ["a"],
            unicode: 1,
            stretchH: 100,
            smooth: 1,
            aa: 1,
            padding: [0, 0, 0, 0],
            spacing: [0, 0],
        },
        common: { lineHeight: 32, base: 24, scaleW: 64, scaleH: 64, pages: 1, packed: 0, alphaChnl: 0, redChnl: 0, greenChnl: 0, blueChnl: 0 },
        pages: ["font.png"],
        chars: [{ id: 97, index: 0, char: "a", x: 0, y: 0, width: 16, height: 16, xoffset: 0, yoffset: 0, xadvance: 16, page: 0, chnl: 15 }],
        kernings: [],
        distanceField: { fieldType: "msdf", distanceRange: 4 },
    });
}

describe("TextRenderer", () => {
    let engine: NullEngine;
    let scene: Scene;
    let font: FontAsset;
    let renderer: TextRenderer;

    beforeEach(() => {
        engine = new NullEngine({
            renderHeight: 256,
            renderWidth: 256,
            textureSize: 256,
            deterministicLockstep: false,
            lockstepMaxSteps: 1,
        });

        // Pretend to be a WebGL2 engine: TextRenderer requires instancing and uses VAOs when available.
        const caps = engine.getCaps();
        caps.instancedArrays = true;
        caps.vertexArrayObject = true;
        engine._features.supportSpriteInstancing = true;

        // NullEngine reports a fixed capacity of 1 for dynamic buffers; report the real byte size like ThinEngine does
        // so the renderer only resizes its instance buffers when it actually runs out of room.
        const createDynamicVertexBuffer = engine.createDynamicVertexBuffer.bind(engine);
        vi.spyOn(engine, "createDynamicVertexBuffer").mockImplementation((data, label) => {
            const buffer = createDynamicVertexBuffer(data, label);
            buffer.capacity = typeof data === "number" ? data : (data as Float32Array).byteLength;
            return buffer;
        });

        scene = new Scene(engine);
        font = new FontAsset(CreateFontDefinition(), "font.png", scene);
    });

    afterEach(() => {
        renderer?.dispose();
        font.dispose();
        scene.dispose();
        engine.dispose();
    });

    it("re-records its vertex array object when the instance buffers grow past their initial capacity", async () => {
        // Each recorded VAO remembers the world/uv buffers it was recorded against.
        const recorded: { worldBuffer: DataBuffer | null; uvBuffer: DataBuffer | null }[] = [];
        const record = vi.spyOn(engine, "recordVertexArrayObject").mockImplementation((vertexBuffers: { [key: string]: VertexBuffer }) => {
            const vao = { worldBuffer: vertexBuffers["world0"].getBuffer(), uvBuffer: vertexBuffers["uvs"].getBuffer() };
            recorded.push(vao);
            return vao as unknown as WebGLVertexArrayObject;
        });
        const bind = vi.spyOn(engine, "bindVertexArrayObject").mockImplementation(() => {});
        const release = vi.spyOn(engine, "releaseVertexArrayObject").mockImplementation(() => {});

        renderer = await TextRenderer.CreateTextRendererAsync(font, engine);
        vi.spyOn((renderer as any)._drawWrapperBase.effect, "isReady").mockReturnValue(true);

        // First render: a short paragraph fits in the initial 128-glyph capacity.
        renderer.addParagraph("a".repeat(10));
        renderer.render(Matrix.Identity(), Matrix.Identity());

        expect(record).toHaveBeenCalledTimes(1);
        const firstVao = recorded[0];
        expect(bind).toHaveBeenLastCalledWith(firstVao, null);

        // Second render: grow past 128 glyphs so the instance buffers get reallocated.
        renderer.addParagraph("a".repeat(200));
        renderer.render(Matrix.Identity(), Matrix.Identity());

        const currentWorldBuffer = (renderer as any)._worldBuffer.getBuffer();
        const currentUvBuffer = (renderer as any)._uvBuffer.getBuffer();
        expect(currentWorldBuffer).not.toBe(firstVao.worldBuffer);

        // The stale VAO (pointing at the disposed buffers) must be released...
        expect(release).toHaveBeenCalledWith(firstVao);

        // ...and the VAO bound for this draw must reference the new buffers.
        const boundVao = bind.mock.lastCall![0] as unknown as (typeof recorded)[number];
        expect(boundVao.worldBuffer).toBe(currentWorldBuffer);
        expect(boundVao.uvBuffer).toBe(currentUvBuffer);
    });
});
