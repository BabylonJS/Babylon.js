import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { NullEngine } from "core/Engines/nullEngine";
import { InternalTextureSource } from "core/Materials/Textures/internalTexture";
import { Texture } from "core/Materials/Textures/texture";
import { PBRMaterial } from "core/Materials/PBR/pbrMaterial";
import { CreateBox } from "core/Meshes/Builders/boxBuilder";
import { Tools } from "core/Misc/tools";
import { Scene } from "core/scene";

import { GLTF2Export } from "serializers/glTF/2.0/glTFSerializer";

// Minimal 1x1 red PNG — lets us assert a known buffer flows through the
// export pipeline without needing any real image decoding at test time.
const OnePixelRedPng = new Uint8Array([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x02, 0x00, 0x00,
    0x00, 0x90, 0x77, 0x53, 0xde, 0x00, 0x00, 0x00, 0x0c, 0x49, 0x44, 0x41, 0x54, 0x08, 0x99, 0x63, 0xf8, 0xcf, 0xc0, 0x00, 0x00, 0x00, 0x03, 0x00, 0x01, 0x5b, 0x82, 0x5c,
    0x17, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
]);

describe("glTF Exporter - NullEngine / cached texture path", () => {
    let engine: NullEngine;
    let scene: Scene;
    let loadScriptSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        engine = new NullEngine({
            renderHeight: 256,
            renderWidth: 256,
            textureSize: 256,
            deterministicLockstep: false,
            lockstepMaxSteps: 1,
        });
        scene = new Scene(engine);

        loadScriptSpy = vi.spyOn(Tools, "LoadScriptAsync").mockImplementation(async () => {
            throw new Error("Tools.LoadScriptAsync must not be called in a Node.js environment.");
        });
    });

    afterEach(() => {
        loadScriptSpy.mockRestore();
        scene.dispose();
        engine.dispose();
    });

    // Creates a PBRMaterial in metallic workflow (metallic + roughness are set
    // to non-null values) with an albedo texture whose internal buffer holds
    // known bytes. metallic/roughness must be non-null for isMetallicWorkflow()
    // to return true; otherwise the exporter follows the SpecGloss conversion
    // path, which always requires GPU readback.
    function buildTexturedBox(): { texture: Texture } {
        const box = CreateBox("box", { size: 1 }, scene);
        const material = new PBRMaterial("mat", scene);
        const texture = new Texture("red.png", scene);
        material.albedoTexture = texture;
        material.metallic = 0;
        material.roughness = 1;
        box.material = material;
        return { texture };
    }

    it("exports GLB with invertY=true (default) using cached Uint8Array buffer, without GPU fallback", async () => {
        const { texture } = buildTexturedBox();

        const internal = texture.getInternalTexture()!;
        // NullEngine marks createTexture output as InternalTextureSource.Url,
        // which is required by GetCachedImageAsync before reading the buffer.
        expect(internal.source).toBe(InternalTextureSource.Url);
        // invertY defaults to true for URL-loaded textures — this is the exact
        // condition that was (incorrectly) blocking the cached path before the fix.
        expect(internal.invertY).toBe(true);
        internal._buffer = OnePixelRedPng;
        (texture as any)._mimeType = "image/png";

        // Under NullEngine there is no GPU context. If the exporter falls back
        // to GetTextureDataAsync (the GPU readback path) it will throw with
        // "Failed to read pixels from texture". The test passing is therefore
        // an implicit assertion that the cached path was taken.
        const result = await GLTF2Export.GLBAsync(scene, "output");
        expect(result.glTFFiles["output.glb"]).toBeDefined();
    });

    it("exports GLB with a Blob cached on the internal texture buffer", async () => {
        const { texture } = buildTexturedBox();

        const internal = texture.getInternalTexture()!;
        internal._buffer = new Blob([OnePixelRedPng], { type: "image/png" });

        const result = await GLTF2Export.GLBAsync(scene, "output");
        expect(result.glTFFiles["output.glb"]).toBeDefined();
    });

    it("falls back to Tools.LoadFileAsync(url) when no buffer is cached, still avoiding GPU readback", async () => {
        const loadFileSpy = vi.spyOn(Tools, "LoadFileAsync").mockImplementation(async () => OnePixelRedPng.buffer.slice(0) as ArrayBuffer);

        try {
            const { texture } = buildTexturedBox();
            const internal = texture.getInternalTexture()!;
            internal._buffer = null;
            internal.url = "/assets/red.png";

            const result = await GLTF2Export.GLBAsync(scene, "output");

            expect(result.glTFFiles["output.glb"]).toBeDefined();
            expect(loadFileSpy).toHaveBeenCalledWith("/assets/red.png");
        } finally {
            loadFileSpy.mockRestore();
        }
    });
});
