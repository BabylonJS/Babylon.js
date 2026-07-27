import * as fflate from "fflate";
import { describe, expect, it } from "vitest";
import { ReadUsdzArchive } from "loaders/USD/resolution/parser/usdzArchive";

describe("USDZ archive reader", () => {
    it("extracts the first USD layer and all archive assets", async () => {
        const zipped = fflate.zipSync(
            {
                "root.usda": new TextEncoder().encode("#usda 1.0\n"),
                "textures/base.png": new Uint8Array([1, 2, 3]),
            },
            { level: 0 }
        );

        const archive = await ReadUsdzArchive(zipped.buffer, fflate);

        expect(archive.rootLayer.fileName).toBe("root.usda");
        expect(new TextDecoder().decode(new Uint8Array(archive.rootLayer.data))).toMatch(/^#usda/);
        expect(archive.assets.get("root.usda")).toEqual(new TextEncoder().encode("#usda 1.0\n"));
        expect(archive.assets.get("textures/base.png")).toEqual(new Uint8Array([1, 2, 3]));
    });

    it("rejects archives whose first entry is not a USD layer", async () => {
        const zipped = fflate.zipSync(
            {
                "textures/base.png": new Uint8Array([4, 5, 6]),
                "root.usda": new TextEncoder().encode("#usda 1.0\n"),
                "layers/mesh.usdc": new Uint8Array([7, 8, 9]),
            },
            { level: 0 }
        );

        await expect(ReadUsdzArchive(zipped.buffer, fflate)).rejects.toThrow("first entry");
    });

    it("rejects malformed and truncated archives", async () => {
        await expect(ReadUsdzArchive(new Uint8Array([0x50, 0x4b]).buffer, fflate)).rejects.toThrow();
    });

    it("rejects archive expansion above the resource cap before extracting entries", async () => {
        const oversizedArchive = {
            unzipSync: (_data: Uint8Array, options?: { filter?: (file: { name: string; size: number; originalSize: number; compression: number }) => boolean }) => {
                options?.filter?.({
                    name: "root.usda",
                    size: 1,
                    originalSize: 1024 * 1024 * 1024 + 1,
                    compression: 8,
                });
                return {};
            },
        };

        await expect(ReadUsdzArchive(new ArrayBuffer(0), oversizedArchive)).rejects.toThrow("uncompressed size exceeds");
    });

    it("reports a controlled error when fflate is omitted outside a browser", async () => {
        await expect(ReadUsdzArchive(new ArrayBuffer(0))).rejects.toThrow("preloaded fflate");
    });
});
