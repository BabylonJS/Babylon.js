import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { KTX2Encoder, type IKTX2EncoderOptions } from "../../src/ktx2Encoder";

const OriginalSettings = { JSModule: KTX2Encoder.JSModule, WasmBinary: KTX2Encoder.WasmBinary, DefaultEncoderOptions: KTX2Encoder.DefaultEncoderOptions };
const Native = {
    delete: vi.fn(),
    encode: vi.fn((output: Uint8Array) => {
        new DataView(output.buffer).setUint32(48, 80, true);
        return 96;
    }),
    setCreateKTX2File: vi.fn(),
    setETC1SCompressionLevel: vi.fn(),
    setFormatMode: vi.fn(),
    setKTX2AndBasisSRGBTransferFunc: vi.fn(),
    setKTX2UASTCSupercompression: vi.fn(),
    setMipGen: vi.fn(),
    setMipSRGB: vi.fn(),
    setNormalMapPreset: vi.fn(),
    setPackUASTCFlags: vi.fn(),
    setPerceptual: vi.fn(),
    setQualityLevel: vi.fn(),
    setSliceSourceImage: vi.fn(() => true),
    setTexType: vi.fn(),
    setYFlip: vi.fn(),
};

beforeEach(() => {
    KTX2Encoder.WasmBinary = new ArrayBuffer(8);
    KTX2Encoder.JSModule = () => ({
        BasisEncoder: class {
            constructor() {
                return Native;
            }
        },
        initializeBasis: vi.fn(),
        basis_tex_format: { cETC1S: { value: 0 }, cUASTC_LDR_4x4: { value: 1 } },
        basis_texture_type: { cBASISTexType2D: { value: 0 } },
    });
});

afterEach(() => {
    Object.assign(KTX2Encoder, OriginalSettings);
    vi.clearAllMocks();
    vi.unstubAllGlobals();
});

it.each(["factory", "WASM fetch"])("retries lazy initialization after %s failure while sharing concurrent attempts", async (stage) => {
    const originalFactory = KTX2Encoder.JSModule as () => unknown;
    const factory = vi.fn(async () => originalFactory());
    KTX2Encoder.JSModule = factory;
    if (stage === "factory") {
        factory.mockRejectedValueOnce(new Error("Temporary codec failure"));
    } else {
        KTX2Encoder.WasmBinary = null;
        vi.stubGlobal(
            "fetch",
            vi
                .fn()
                .mockResolvedValueOnce(new Response(null, { status: 503 }))
                .mockResolvedValue(new Response(new Uint8Array(8)))
        );
    }
    const encoder = new KTX2Encoder();
    const encode = () => encoder.encode(new Uint8Array(64), 4, 4, { usage: "data" });
    const error = stage === "factory" ? "Temporary codec failure" : "503";
    await Promise.all([expect(encode()).rejects.toThrow(error), expect(encode()).rejects.toThrow(error)]);
    expect(factory).toHaveBeenCalledTimes(stage === "factory" ? 1 : 0);
    await Promise.all([encode(), encode()]);
    expect(factory).toHaveBeenCalledTimes(stage === "factory" ? 2 : 1);
    expect(Native.encode).toHaveBeenCalledTimes(2);
});

it.each(["color", "data", "normal"] as const)("forces only %s-relevant defaults, preserves falsy values and allows clearing", async (usage) => {
    const encoder = new KTX2Encoder();
    const options = { usage, etc1sQualityLevel: 200, etc1sCompressionLevel: 4, uastcQualityLevel: 3, zstandard: true, flipY: true, generateMipmaps: false };
    KTX2Encoder.DefaultEncoderOptions = { etc1sQualityLevel: 1, etc1sCompressionLevel: 0, uastcQualityLevel: 0, zstandard: false };
    const setters = usage === "color" ? [Native.setQualityLevel, Native.setETC1SCompressionLevel] : [Native.setPackUASTCFlags, Native.setKTX2UASTCSupercompression];
    const irrelevant = usage === "color" ? [Native.setPackUASTCFlags, Native.setKTX2UASTCSupercompression] : [Native.setQualityLevel, Native.setETC1SCompressionLevel];
    const expected = usage === "color" ? [1, 0] : [0, false];
    await encoder.encode(new Uint8Array(64), 4, 4, options);
    setters.forEach((setter, index) => expect(setter).toHaveBeenLastCalledWith(expected[index]));
    irrelevant.forEach((setter) => expect(setter).not.toHaveBeenCalled());
    expect(Native.setNormalMapPreset).toHaveBeenCalledTimes(usage === "normal" ? 1 : 0);
    expect(Native.setYFlip).toHaveBeenCalledWith(true);
    expect(Native.setMipGen).toHaveBeenCalledWith(false);
    KTX2Encoder.DefaultEncoderOptions = {};
    await encoder.encode(new Uint8Array(64), 4, 4, options);
    const perCall = usage === "color" ? [200, 4] : [3, true];
    setters.forEach((setter, index) => expect(setter).toHaveBeenLastCalledWith(perCall[index]));
    expect(Native.delete).toHaveBeenCalledTimes(2);
});

it.each([
    [4, 4, {}, "usage must be"],
    [5, 4, { usage: "color" }, "positive multiples"],
    [16388, 4, { usage: "color" }, "16,384"],
    [4096, 4096, { usage: "color" }, "12,582,912"],
] as const)("rejects unsupported input %s x %s, %o before invoking the codec", async (width, height, options, error) => {
    await expect(new KTX2Encoder().encode(new Uint8Array(64), width, height, options as IKTX2EncoderOptions)).rejects.toThrow(error);
    expect(Native.encode).not.toHaveBeenCalled();
});
