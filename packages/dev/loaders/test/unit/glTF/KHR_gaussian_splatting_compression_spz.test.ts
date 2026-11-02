import { describe, expect, it } from "vitest";
import { _ConvertSpzRubToLuf, KHR_gaussian_splatting_compression_spz } from "loaders/glTF/2.0/Extensions/KHR_gaussian_splatting_compression_spz.pure";

describe("KHR_gaussian_splatting_compression_spz", () => {
    it("converts packed splats from RUB to LUF", () => {
        const data = new ArrayBuffer(32);
        const floats = new Float32Array(data);
        const bytes = new Uint8Array(data);
        floats.set([1, 2, 3]);
        bytes.set([10, 20, 30, 40], 28);

        const sh = [new Uint8Array(16)];
        sh[0].set([100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115]);
        sh[0][3] = 0; // first flipped coefficient (degree 1, coefficient 1) saturates at 255

        _ConvertSpzRubToLuf(data, sh, 1);

        expect(Array.from(floats.subarray(0, 3))).toEqual([-1, 2, -3]);
        expect(Array.from(bytes.subarray(28, 32))).toEqual([10, 255 - 20, 30, 255 - 40]);
        // Degree 1 is [keep, flip, flip]: bytes 0-2 are kept, 3-8 are negated, the rest is untouched.
        expect(Array.from(sh[0].subarray(0, 9))).toEqual([100, 101, 102, 255, 256 - 104, 256 - 105, 256 - 106, 256 - 107, 256 - 108]);
        expect(sh[0][9]).toBe(109);
    });

    it("does not handle primitives without the nested SPZ extension", () => {
        const loader = { isExtensionUsed: () => true } as any;
        const extension = new KHR_gaussian_splatting_compression_spz(loader, "KHR_gaussian_splatting_compression_spz_2");

        expect(extension.enabled).toBe(true);
        expect(extension.order).toBeLessThan(200);
        const primitive = { attributes: {}, extensions: { KHR_gaussian_splatting: { extensions: {} } } } as any;
        expect(extension._loadMeshPrimitiveAsync("/meshes/0/primitives/0", "m", {} as any, {} as any, primitive, () => {})).toBeNull();
        expect(extension._loadMeshPrimitiveAsync("/meshes/0/primitives/0", "m", {} as any, {} as any, { attributes: {} } as any, () => {})).toBeNull();
    });
});
