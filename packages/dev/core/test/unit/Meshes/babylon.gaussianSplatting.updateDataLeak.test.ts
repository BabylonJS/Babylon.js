import { NullEngine } from "core/Engines/nullEngine";
import { type BaseTexture } from "core/Materials/Textures/baseTexture";
import "core/Materials/GaussianSplatting/gaussianSplattingMaterial";
import { GaussianSplattingMesh } from "core/Meshes/GaussianSplatting/gaussianSplattingMesh";
import { Scene } from "core/scene";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

// Builds `count` splats (32 bytes each) with distinct positions so vertexCount is deterministic.
const createMultiSplatData = (count: number): ArrayBuffer => {
    const data = new ArrayBuffer(count * 32);
    const floats = new Float32Array(data);
    const bytes = new Uint8Array(data);
    for (let i = 0; i < count; i++) {
        const f = i * 8;
        floats[f + 0] = i;
        floats[f + 1] = i;
        floats[f + 2] = i;
        floats[f + 3] = 0.5;
        floats[f + 4] = 0.5;
        floats[f + 5] = 0.5;
        const b = i * 32;
        bytes[b + 24] = 255;
        bytes[b + 25] = 255;
        bytes[b + 26] = 255;
        bytes[b + 27] = 255;
        // Identity quaternion in the packed splat layout.
        bytes[b + 28] = 0;
        bytes[b + 29] = 128;
        bytes[b + 30] = 128;
        bytes[b + 31] = 128;
    }
    return data;
};

describe("GaussianSplatting updateData texture leak", () => {
    let engine: NullEngine;
    let scene: Scene;

    beforeEach(() => {
        engine = new NullEngine();
        (engine.getCaps() as { maxVertexUniformVectors: number }).maxVertexUniformVectors = 256;
        // Force a small texture width so a different splat count produces a different texture height,
        // exercising the "texture size changed" full-rebuild path in _updateTextures.
        (engine.getCaps() as { maxTextureSize: number }).maxTextureSize = 8;
        scene = new Scene(engine);
    });

    afterEach(() => {
        scene.dispose();
        engine.dispose();
    });

    it("disposes the previous GPU textures when updateData resizes the texture (no leak)", () => {
        const mesh = new GaussianSplattingMesh("gs", null, scene);
        // Avoid spinning up the sort worker so behavior is synchronous and deterministic.
        mesh.disableDepthSort = true;

        // First load: 8 splats -> texture height 1.
        mesh.updateData(createMultiSplatData(8));

        // Capture the GPU textures created by the first load.
        const oldTextures: BaseTexture[] = [mesh.covariancesATexture!, mesh.covariancesBTexture!, mesh.centersTexture!, mesh.colorsTexture!];
        for (const texture of oldTextures) {
            expect(texture).toBeTruthy();
            expect(scene.textures).toContain(texture);
        }

        // Second load with a different splat count: 40 splats -> texture height 5.
        // This changes the texture size and forces the full-rebuild path that recreates every texture.
        mesh.updateData(createMultiSplatData(40));

        // The textures must have actually been recreated (new instances), not reused.
        expect(mesh.covariancesATexture).not.toBe(oldTextures[0]);
        expect(mesh.covariancesBTexture).not.toBe(oldTextures[1]);
        expect(mesh.centersTexture).not.toBe(oldTextures[2]);
        expect(mesh.colorsTexture).not.toBe(oldTextures[3]);

        // The old textures must have been disposed. A disposed texture is removed from scene.textures
        // and releases its underlying internal texture.
        for (const texture of oldTextures) {
            expect(scene.textures).not.toContain(texture);
            expect(texture.getInternalTexture()).toBeNull();
        }
    });
});
