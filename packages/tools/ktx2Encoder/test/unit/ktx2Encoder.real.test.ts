import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { KTX2Decoder } from "../../../ktx2Decoder/src/ktx2Decoder.js";
import { LiteTranscoder_UASTC_RGBA_UNORM } from "../../../ktx2Decoder/src/Transcoders/liteTranscoder_UASTC_RGBA_UNORM.js";
import { KTX2Encoder, type KTX2EncoderUsage } from "../../src/ktx2Encoder.js";
import { CheckKTX2 } from "./ktx2FileChecker.js";

type BasisFactory = (options: { wasmBinary: ArrayBuffer }) => Promise<unknown>;

const _readArrayBuffer = (url: URL): ArrayBuffer => {
    const buffer = readFileSync(url);
    return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
};

const _loadFactory = (): BasisFactory => {
    const moduleUrl = new URL("../../../babylonServer/public/basisEncoder/v2_50/basis_encoder.js", import.meta.url);
    const modulePath = fileURLToPath(moduleUrl);
    const source = readFileSync(moduleUrl, "utf8");
    return Function("require", "__dirname", "__filename", `${source}\nreturn BASIS;`)(createRequire(import.meta.url), dirname(modulePath), modulePath) as BasisFactory;
};

const _createPixels = (): Uint8Array => {
    const pixels = new Uint8Array(8 * 8 * 4);
    for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 8; x++) {
            const offset = (y * 8 + x) * 4;
            pixels[offset] = x * 32;
            pixels[offset + 1] = y * 32;
            pixels[offset + 2] = (x + y) * 16;
            pixels[offset + 3] = 255;
        }
    }
    return pixels;
};

describe("KTX2Encoder with Basis v2.50", () => {
    let encoder: KTX2Encoder;
    beforeAll(() => {
        const wasmBinary = _readArrayBuffer(new URL("../../../babylonServer/public/basisEncoder/v2_50/basis_encoder.wasm", import.meta.url));
        KTX2Encoder.JSModule = _loadFactory();
        KTX2Encoder.WasmBinary = wasmBinary;
        encoder = new KTX2Encoder();
    }, 30_000);

    afterEach(() => {
        KTX2Encoder.JSModule = null;
        KTX2Encoder.WasmBinary = null;
    });

    it("loads the official factory from a URL in Node ESM with an injected binary", async () => {
        const source = readFileSync(new URL("../../../babylonServer/public/basisEncoder/v2_50/basis_encoder.js", import.meta.url), "utf8");
        const wasmBinary = _readArrayBuffer(new URL("../../../babylonServer/public/basisEncoder/v2_50/basis_encoder.wasm", import.meta.url));
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(source)));
        try {
            KTX2Encoder.JSModule = null;
            KTX2Encoder.WasmBinary = wasmBinary;
            const loaded = new KTX2Encoder();
            const encoded = await loaded.encode(_createPixels(), 8, 8, { usage: "color", generateMipmaps: false });
            CheckKTX2(encoded, { width: 8, height: 8, levelCount: 1, supercompressionScheme: 1, colorModel: 163, primaries: 1, transferFunction: 2 });
        } finally {
            vi.unstubAllGlobals();
        }
    });

    it.each([
        { usage: "color", supercompressionScheme: 1, colorModel: 163, primaries: 1, transferFunction: 2 },
        { usage: "data", supercompressionScheme: 2, colorModel: 166, primaries: 0, transferFunction: 1 },
        { usage: "normal", supercompressionScheme: 2, colorModel: 166, primaries: 0, transferFunction: 1 },
    ] satisfies Array<{ usage: KTX2EncoderUsage; supercompressionScheme: number; colorModel: number; primaries: number; transferFunction: number }>)(
        "encodes $usage KTX2 output",
        async ({ usage, ...expected }) => {
            const encoded = await encoder.encode(_createPixels(), 8, 8, { usage, generateMipmaps: false });

            expect(encoded.byteLength).toBeGreaterThan(80);
            CheckKTX2(encoded, {
                width: 8,
                height: 8,
                levelCount: 1,
                ...expected,
            });
        },
        30_000
    );

    it("generates the expected mip chain", async () => {
        const encoded = await encoder.encode(_createPixels(), 8, 8, { usage: "color", generateMipmaps: true });

        CheckKTX2(encoded, {
            width: 8,
            height: 8,
            levelCount: 4,
            supercompressionScheme: 1,
            colorModel: 163,
            primaries: 1,
            transferFunction: 2,
        });
    });

    it("round trips UASTC pixels through the existing decoder", async () => {
        const source = _createPixels();
        const encoded = await encoder.encode(source, 8, 8, { usage: "data", generateMipmaps: false, zstandard: false });
        LiteTranscoder_UASTC_RGBA_UNORM.WasmBinary = _readArrayBuffer(new URL("../../../babylonServer/public/ktx2Transcoders/1/uastc_rgba8_unorm_v2.wasm", import.meta.url));

        const decoded = await new KTX2Decoder().decode(encoded, {});

        expect(decoded.width).toBe(8);
        expect(decoded.height).toBe(8);
        const pixels = decoded.mipmaps[0].data;
        expect(pixels).not.toBeNull();
        let maximumDifference = 0;
        for (let index = 0; index < source.length; index++) {
            maximumDifference = Math.max(maximumDifference, Math.abs(source[index] - pixels![index]));
        }
        expect(maximumDifference).toBeLessThanOrEqual(32);
    });
});
