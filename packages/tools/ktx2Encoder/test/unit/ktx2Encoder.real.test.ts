import { readFileSync } from "node:fs";
import { expect, it, vi } from "vitest";
import { KTX2Encoder } from "../../src/ktx2Encoder";

it("loads the official Basis factory in Node ESM and encodes a mipmapped KTX2", async () => {
    const originalBinary = KTX2Encoder.WasmBinary;
    const source = readFileSync(new URL("../../../babylonServer/public/basisEncoder/v2_50/basis_encoder.js", import.meta.url), "utf8");
    const binary = readFileSync(new URL("../../../babylonServer/public/basisEncoder/v2_50/basis_encoder.wasm", import.meta.url));
    KTX2Encoder.WasmBinary = binary.buffer.slice(binary.byteOffset, binary.byteOffset + binary.byteLength);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(source)));
    try {
        const output = await new KTX2Encoder().encode(new Uint8Array(8 * 8 * 4).fill(128), 8, 8, { usage: "color", generateMipmaps: true });
        expect(Array.from(output.slice(0, 12))).toEqual([0xab, 0x4b, 0x54, 0x58, 0x20, 0x32, 0x30, 0xbb, 0x0d, 0x0a, 0x1a, 0x0a]);
        const view = new DataView(output.buffer, output.byteOffset, output.byteLength);
        expect([view.getUint32(20, true), view.getUint32(24, true), view.getUint32(40, true), view.getUint32(44, true)]).toEqual([8, 8, 4, 1]);
        const dfd = view.getUint32(48, true);
        expect(Array.from(output.slice(dfd + 12, dfd + 15))).toEqual([163, 1, 2]);
    } finally {
        KTX2Encoder.WasmBinary = originalBinary;
        vi.unstubAllGlobals();
    }
});
