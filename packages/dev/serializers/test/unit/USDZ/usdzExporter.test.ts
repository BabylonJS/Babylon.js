import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { NullEngine } from "core/Engines/nullEngine";
import { InternalTextureSource } from "core/Materials/Textures/internalTexture";
import { Texture } from "core/Materials/Textures/texture";
import { PBRMaterial } from "core/Materials/PBR/pbrMaterial";
import { CreateBox } from "core/Meshes/Builders/boxBuilder";
import { DumpTools } from "core/Misc/dumpTools";
import { Tools } from "core/Misc/tools";
import { Scene } from "core/scene";

import { USDZExportAsync } from "serializers/USDZ/usdzExporter";

// Minimal 1x1 red PNG - lets us assert exact bytes round-trip into the archive
// without needing any real image decoding at test time.
const OnePixelRedPng = new Uint8Array([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x02, 0x00, 0x00,
    0x00, 0x90, 0x77, 0x53, 0xde, 0x00, 0x00, 0x00, 0x0c, 0x49, 0x44, 0x41, 0x54, 0x08, 0x99, 0x63, 0xf8, 0xcf, 0xc0, 0x00, 0x00, 0x00, 0x03, 0x00, 0x01, 0x5b, 0x82, 0x5c,
    0x17, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
]);

/**
 * The USDZ exporter expects `fflate` to be available on the global scope — in
 * the browser it is loaded lazily via Tools.LoadScriptAsync. In Node.js there
 * is no script loader, so we install a minimal stub that is enough for
 * USDZExportAsync to finish and lets us observe the archive contents.
 */
function installFflateStub(): { capturedFiles: { value: { [key: string]: Uint8Array } | null } } {
    const state = { value: null as { [key: string]: Uint8Array } | null };
    (globalThis as any).fflate = {
        strToU8: (s: string) => new TextEncoder().encode(s),
        zipSync: (files: { [key: string]: Uint8Array }) => {
            state.value = files;
            return new Uint8Array([0x50, 0x4b, 0x03, 0x04]);
        },
    };
    return { capturedFiles: state };
}

describe("USDZ Exporter - NullEngine / Node.js environment", () => {
    let engine: NullEngine;
    let scene: Scene;
    let captured: { value: { [key: string]: Uint8Array } | null };
    let dumpSpy: ReturnType<typeof vi.spyOn>;
    let loadScriptSpy: ReturnType<typeof vi.spyOn>;
    let previousFflate: unknown;

    beforeEach(() => {
        engine = new NullEngine({
            renderHeight: 256,
            renderWidth: 256,
            textureSize: 256,
            deterministicLockstep: false,
            lockstepMaxSteps: 1,
        });
        scene = new Scene(engine);

        previousFflate = (globalThis as any).fflate;
        ({ capturedFiles: captured } = installFflateStub());

        // If the exporter ever tries to network-load the fflate script we want
        // the test to fail loudly rather than hit unpkg.
        loadScriptSpy = vi.spyOn(Tools, "LoadScriptAsync").mockImplementation(async () => {
            throw new Error("Tools.LoadScriptAsync must not be called when fflate is already on globalThis.");
        });

        // The whole point of the new GetCachedImageAsync path is to avoid the
        // DumpTools route, which requires a WebGL / canvas context and is the
        // exact failure mode reported on the Babylon.js forum.
        dumpSpy = vi.spyOn(DumpTools, "DumpDataAsync").mockImplementation(async () => {
            throw new Error("DumpTools.DumpDataAsync must not be invoked when a cached image is available.");
        });
    });

    afterEach(() => {
        dumpSpy.mockRestore();
        loadScriptSpy.mockRestore();
        (globalThis as any).fflate = previousFflate;
        scene.dispose();
        engine.dispose();
    });

    function buildTexturedBox(): { texture: Texture } {
        const box = CreateBox("box", { size: 1 }, scene);
        const material = new PBRMaterial("mat", scene);
        const texture = new Texture("red.png", scene);
        material.albedoTexture = texture;
        box.material = material;
        return { texture };
    }

    // After the exporter's 64-byte-alignment pass, a file entry is either a
    // raw Uint8Array or the tuple `[Uint8Array, { extra: ... }]` that fflate
    // expects. Unwrap both shapes so we can assert on the actual bytes.
    function unwrapFileBytes(entry: unknown): Uint8Array {
        if (Array.isArray(entry)) {
            return entry[0] as Uint8Array;
        }
        return entry as Uint8Array;
    }

    it("exports a textured PBR mesh using a cached Uint8Array (ArrayBufferView) on the internal texture", async () => {
        const { texture } = buildTexturedBox();

        const internal = texture.getInternalTexture()!;
        // NullEngine marks createTexture output as InternalTextureSource.Url, which
        // is what GetCachedImageAsync requires before reading the cached buffer.
        expect(internal.source).toBe(InternalTextureSource.Url);
        internal.invertY = false;
        internal._buffer = OnePixelRedPng;
        (texture as any)._mimeType = "image/png";

        const result = await USDZExportAsync(scene, {});
        expect(result).toBeInstanceOf(Uint8Array);

        const pngEntries = Object.keys(captured.value!).filter((k) => k.startsWith("textures/Texture_") && k.endsWith(".png"));
        expect(pngEntries).toHaveLength(1);

        // Bytes land in the archive verbatim — no GPU round-trip, no re-encoding.
        const exported = unwrapFileBytes(captured.value![pngEntries[0]]);
        expect(exported).toBeInstanceOf(Uint8Array);
        expect(Array.from(exported)).toEqual(Array.from(OnePixelRedPng));

        expect(dumpSpy).not.toHaveBeenCalled();
    });

    it("accepts a Blob cached on the internal texture buffer", async () => {
        const { texture } = buildTexturedBox();

        const internal = texture.getInternalTexture()!;
        internal.invertY = false;
        internal._buffer = new Blob([OnePixelRedPng], { type: "image/png" });

        await USDZExportAsync(scene, {});

        const pngEntries = Object.keys(captured.value!).filter((k) => k.startsWith("textures/Texture_") && k.endsWith(".png"));
        expect(pngEntries).toHaveLength(1);
        expect(unwrapFileBytes(captured.value![pngEntries[0]]).byteLength).toBe(OnePixelRedPng.byteLength);
        expect(dumpSpy).not.toHaveBeenCalled();
    });

    it("falls back to Tools.LoadFileAsync(url) when no buffer is cached, still avoiding DumpTools", async () => {
        const loadFileSpy = vi.spyOn(Tools, "LoadFileAsync").mockImplementation(async () => OnePixelRedPng.buffer.slice(0) as ArrayBuffer);

        try {
            const { texture } = buildTexturedBox();
            const internal = texture.getInternalTexture()!;
            internal.invertY = false;
            internal._buffer = null;
            internal.url = "/assets/red.png";

            await USDZExportAsync(scene, {});

            expect(loadFileSpy).toHaveBeenCalledWith("/assets/red.png");
            expect(dumpSpy).not.toHaveBeenCalled();

            const pngEntries = Object.keys(captured.value!).filter((k) => k.startsWith("textures/Texture_") && k.endsWith(".png"));
            expect(pngEntries).toHaveLength(1);
            expect(unwrapFileBytes(captured.value![pngEntries[0]]).byteLength).toBe(OnePixelRedPng.byteLength);
        } finally {
            loadFileSpy.mockRestore();
        }
    });
});
