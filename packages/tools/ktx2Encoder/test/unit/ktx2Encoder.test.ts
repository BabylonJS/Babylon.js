import { describe, expect, it, vi } from "vitest";
import { KTX2Encoder, type IKTX2EncoderOptions } from "../../src/ktx2Encoder.js";

type EncoderMethod = keyof FakeBasisEncoder;

class FakeBasisEncoder {
    public readonly calls: Array<[EncoderMethod, ...unknown[]]> = [];
    public encodeResults = [96];
    public rejectSource = false;
    public deleted = false;
    public dfdOffset = 80;

    public delete(): void {
        this.deleted = true;
        this.calls.push(["delete"]);
    }

    public encode(output: Uint8Array): number {
        this.calls.push(["encode", output.byteLength]);
        const result = this.encodeResults.shift() ?? 0;
        if (result > 0) {
            output.fill(0, 0, result);
            new DataView(output.buffer).setUint32(48, this.dfdOffset, true);
            if (this.dfdOffset + 13 < result) {
                output[this.dfdOffset + 13] = 1;
            }
        }
        return result;
    }

    public setCreateKTX2File(value: boolean): void {
        this.calls.push(["setCreateKTX2File", value]);
    }
    public setETC1SCompressionLevel(value: number): void {
        this.calls.push(["setETC1SCompressionLevel", value]);
    }
    public setFormatMode(value: number): void {
        this.calls.push(["setFormatMode", value]);
    }
    public setKTX2AndBasisSRGBTransferFunc(value: boolean): void {
        this.calls.push(["setKTX2AndBasisSRGBTransferFunc", value]);
    }
    public setKTX2UASTCSupercompression(value: boolean): void {
        this.calls.push(["setKTX2UASTCSupercompression", value]);
    }
    public setMipGen(value: boolean): void {
        this.calls.push(["setMipGen", value]);
    }
    public setMipSRGB(value: boolean): void {
        this.calls.push(["setMipSRGB", value]);
    }
    public setNormalMapPreset(): void {
        this.calls.push(["setNormalMapPreset"]);
    }
    public setPackUASTCFlags(value: number): void {
        this.calls.push(["setPackUASTCFlags", value]);
    }
    public setPerceptual(value: boolean): void {
        this.calls.push(["setPerceptual", value]);
    }
    public setQualityLevel(value: number): void {
        this.calls.push(["setQualityLevel", value]);
    }
    public setSliceSourceImage(sliceIndex: number, source: Uint8Array, width: number, height: number, imageType: number): boolean {
        this.calls.push(["setSliceSourceImage", sliceIndex, source, width, height, imageType]);
        return !this.rejectSource;
    }
    public setTexType(value: number): void {
        this.calls.push(["setTexType", value]);
    }
    public setYFlip(value: boolean): void {
        this.calls.push(["setYFlip", value]);
    }
}

const _createEncoder = (configure?: (encoder: FakeBasisEncoder) => void) => {
    let basisEncoder: FakeBasisEncoder | undefined;
    const module = {
        BasisEncoder: class extends FakeBasisEncoder {
            public constructor() {
                super();
                configure?.(this);
                basisEncoder = this;
            }
        },
        basis_tex_format: {
            cETC1S: { value: 10 },
            cUASTC_LDR_4x4: { value: 11 },
        },
        basis_texture_type: {
            cBASISTexType2D: { value: 20 },
        },
        initializeBasis: vi.fn(),
    };
    return {
        encoder: new KTX2Encoder(module),
        get basisEncoder(): FakeBasisEncoder {
            if (!basisEncoder) {
                throw new Error("BasisEncoder has not been created.");
            }
            return basisEncoder;
        },
    };
};

const _rgba = (width = 4, height = 4) => new Uint8Array(width * height * 4);

describe("KTX2Encoder validation", () => {
    it.each([
        { rgba: _rgba(), width: 0, height: 4, options: { usage: "color" }, message: "positive multiples of 4" },
        { rgba: _rgba(), width: 5, height: 4, options: { usage: "color" }, message: "positive multiples of 4" },
        { rgba: new Uint8Array(63), width: 4, height: 4, options: { usage: "color" }, message: "byte length must be 64" },
        { rgba: new Uint8Array(1), width: 4096, height: 3076, options: { usage: "color" }, message: "12,582,912" },
        { rgba: _rgba(), width: 4, height: 4, options: { usage: "other" }, message: "usage must be" },
        { rgba: _rgba(), width: 4, height: 4, options: { usage: "color", etc1sQualityLevel: 0 }, message: "etc1sQualityLevel" },
        { rgba: _rgba(), width: 4, height: 4, options: { usage: "color", etc1sCompressionLevel: 7 }, message: "etc1sCompressionLevel" },
        { rgba: _rgba(), width: 4, height: 4, options: { usage: "data", uastcQualityLevel: 5 }, message: "uastcQualityLevel" },
        { rgba: _rgba(), width: 4, height: 4, options: { usage: "color", zstandard: true }, message: "UASTC options" },
        { rgba: _rgba(), width: 4, height: 4, options: { usage: "color", zstandard: false }, message: "UASTC options" },
        { rgba: _rgba(), width: 4, height: 4, options: { usage: "data", etc1sQualityLevel: 128 }, message: "ETC1S options" },
    ])("rejects invalid input before creating BasisEncoder", ({ rgba, width, height, options, message }) => {
        const context = _createEncoder();
        expect(() => context.encoder.encode(rgba, width, height, options as IKTX2EncoderOptions)).toThrow(message);
        expect(() => context.basisEncoder).toThrow("has not been created");
    });
});

describe("KTX2Encoder presets", () => {
    it.each(["color", "data", "normal"] as const)("uses the default %s quality and compression settings without overrides", (usage) => {
        const context = _createEncoder();
        context.encoder.encode(_rgba(), 4, 4, { usage });
        expect(context.basisEncoder.calls).toEqual(
            expect.arrayContaining(
                usage === "color"
                    ? [
                          ["setQualityLevel", 128],
                          ["setETC1SCompressionLevel", 2],
                      ]
                    : [
                          ["setPackUASTCFlags", 2],
                          ["setKTX2UASTCSupercompression", true],
                      ]
            )
        );
    });

    it("maps the color preset and overrides to Basis setters", () => {
        const context = _createEncoder();
        context.encoder.encode(_rgba(), 4, 4, {
            usage: "color",
            generateMipmaps: false,
            flipY: true,
            etc1sQualityLevel: 200,
            etc1sCompressionLevel: 5,
        });

        expect(context.basisEncoder.calls).toEqual(
            expect.arrayContaining([
                ["setCreateKTX2File", true],
                ["setTexType", 20],
                ["setFormatMode", 10],
                ["setPerceptual", true],
                ["setMipSRGB", true],
                ["setKTX2AndBasisSRGBTransferFunc", true],
                ["setMipGen", false],
                ["setYFlip", true],
                ["setQualityLevel", 200],
                ["setETC1SCompressionLevel", 5],
            ])
        );
        expect(context.basisEncoder.deleted).toBe(true);
    });

    it.each(["data", "normal"] as const)("maps the %s preset and overrides to Basis setters", (usage) => {
        const context = _createEncoder();
        const output = context.encoder.encode(_rgba(), 4, 4, {
            usage,
            uastcQualityLevel: 4,
            zstandard: false,
        });

        expect(context.basisEncoder.calls).toEqual(
            expect.arrayContaining([
                ["setFormatMode", 11],
                ["setPerceptual", false],
                ["setMipSRGB", false],
                ["setKTX2AndBasisSRGBTransferFunc", false],
                ["setMipGen", true],
                ["setYFlip", false],
                ["setPackUASTCFlags", 4],
                ["setKTX2UASTCSupercompression", false],
            ])
        );
        expect(context.basisEncoder.calls.some(([name]) => name === "setNormalMapPreset")).toBe(usage === "normal");
        expect(output[93]).toBe(0);
        expect(output.buffer.byteLength).toBe(output.byteLength);
        expect(context.basisEncoder.deleted).toBe(true);
    });
});

describe("KTX2Encoder output handling", () => {
    it("retries once with a doubled output buffer", () => {
        const context = _createEncoder((encoder) => (encoder.encodeResults = [0, 96]));

        const output = context.encoder.encode(_rgba(), 4, 4, { usage: "color" });

        expect(output.byteLength).toBe(96);
        expect(output.buffer.byteLength).toBe(96);
        const encodeCalls = context.basisEncoder.calls.filter(([name]) => name === "encode");
        expect(encodeCalls).toEqual([
            ["encode", 65_600],
            ["encode", 131_200],
        ]);
    });

    it("throws after two failed encode attempts and deletes the encoder", () => {
        const context = _createEncoder((encoder) => (encoder.encodeResults = [0, 0]));

        expect(() => context.encoder.encode(_rgba(), 4, 4, { usage: "color" })).toThrow("Basis failed to encode the 4x4 'color' texture.");
        expect(context.basisEncoder.deleted).toBe(true);
    });

    it("deletes the encoder when Basis rejects the source", () => {
        const context = _createEncoder((encoder) => (encoder.rejectSource = true));

        expect(() => context.encoder.encode(_rgba(), 4, 4, { usage: "color" })).toThrow("Basis rejected");
        expect(context.basisEncoder.deleted).toBe(true);
    });

    it("deletes the encoder when the KTX2 DFD is invalid", () => {
        const context = _createEncoder((encoder) => (encoder.encodeResults = [40]));

        expect(() => context.encoder.encode(_rgba(), 4, 4, { usage: "data" })).toThrow("complete header");
        expect(context.basisEncoder.deleted).toBe(true);
    });

    it("rejects an out-of-range KTX2 DFD and deletes the encoder", () => {
        const context = _createEncoder((encoder) => (encoder.dfdOffset = 1_000));

        expect(() => context.encoder.encode(_rgba(), 4, 4, { usage: "data" })).toThrow("out-of-range DFD");
        expect(context.basisEncoder.deleted).toBe(true);
    });
});

describe("KTX2Encoder.CreateAsync", () => {
    it("initializes an injected module once", async () => {
        const initializeBasis = vi.fn();
        const module = {
            BasisEncoder: FakeBasisEncoder,
            basis_tex_format: { cETC1S: { value: 0 }, cUASTC_LDR_4x4: { value: 1 } },
            basis_texture_type: { cBASISTexType2D: { value: 0 } },
            initializeBasis,
        };
        const factory = vi.fn(async () => module);
        const wasmBinary = new ArrayBuffer(1);

        await KTX2Encoder.CreateAsync({ basisFactory: factory, wasmBinary });
        await KTX2Encoder.CreateAsync({ basisFactory: factory, wasmBinary });

        expect(factory).toHaveBeenCalledTimes(2);
        expect(factory).toHaveBeenCalledWith({ wasmBinary });
        expect(initializeBasis).toHaveBeenCalledOnce();
    });

    it("requires a factory and WebAssembly source", async () => {
        await expect(KTX2Encoder.CreateAsync({ wasmBinary: new ArrayBuffer(1) })).rejects.toThrow("factory or jsModuleUrl");
        await expect(KTX2Encoder.CreateAsync({ basisFactory: vi.fn() })).rejects.toThrow("wasmBinary or wasmUrl");
    });

    it("loads the factory and WebAssembly binary from URLs", async () => {
        const initializeBasis = vi.fn();
        const module = {
            BasisEncoder: FakeBasisEncoder,
            basis_tex_format: { cETC1S: { value: 0 }, cUASTC_LDR_4x4: { value: 1 } },
            basis_texture_type: { cBASISTexType2D: { value: 0 } },
            initializeBasis,
        };
        (globalThis as typeof globalThis & { __basisTestModule?: unknown }).__basisTestModule = module;
        const wasmBinary = new ArrayBuffer(2);
        const fetchMock = vi.fn().mockResolvedValueOnce(new Response("var BASIS = async () => globalThis.__basisTestModule;")).mockResolvedValueOnce(new Response(wasmBinary));
        vi.stubGlobal("fetch", fetchMock);

        try {
            await KTX2Encoder.CreateAsync({ jsModuleUrl: "basis.js", wasmUrl: "basis.wasm" });
        } finally {
            delete (globalThis as typeof globalThis & { __basisTestModule?: unknown }).__basisTestModule;
            vi.unstubAllGlobals();
        }

        expect(fetchMock).toHaveBeenNthCalledWith(1, "basis.js");
        expect(fetchMock).toHaveBeenNthCalledWith(2, "basis.wasm");
        expect(initializeBasis).toHaveBeenCalledOnce();
    });

    it("reports URL loading failures", async () => {
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 404, statusText: "Not Found" })));
        try {
            await expect(KTX2Encoder.CreateAsync({ jsModuleUrl: "missing.js", wasmUrl: "basis.wasm" })).rejects.toThrow("missing.js");
            await expect(KTX2Encoder.CreateAsync({ basisFactory: vi.fn(), wasmUrl: "missing.wasm" })).rejects.toThrow("missing.wasm");
        } finally {
            vi.unstubAllGlobals();
        }
    });
});
