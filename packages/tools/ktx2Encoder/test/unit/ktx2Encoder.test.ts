import { afterEach, describe, expect, it, vi } from "vitest";
import { KTX2Encoder, type IKTX2EncoderOptions } from "../../src/ktx2Encoder.js";

type EncoderMethod = keyof FakeBasisEncoder;
const DefaultSettings = {
    JSModule: KTX2Encoder.JSModule,
    WasmBinary: KTX2Encoder.WasmBinary,
    JSModuleURL: KTX2Encoder.JSModuleURL,
    WasmModuleURL: KTX2Encoder.WasmModuleURL,
};

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
    KTX2Encoder.JSModule = () => module;
    KTX2Encoder.WasmBinary = new ArrayBuffer(1);
    return {
        module,
        encoder: new KTX2Encoder(),
        get basisEncoder(): FakeBasisEncoder {
            if (!basisEncoder) {
                throw new Error("BasisEncoder has not been created.");
            }
            return basisEncoder;
        },
    };
};

const _rgba = (width = 4, height = 4) => new Uint8Array(width * height * 4);

afterEach(() => {
    Object.assign(KTX2Encoder, DefaultSettings);
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
});

describe("KTX2Encoder lazy initialization", () => {
    it("constructs without loading and shares initialization across concurrent encodes", async () => {
        const native: FakeBasisEncoder[] = [];
        const context = _createEncoder((instance) => {
            expect(native.every((previous) => previous.deleted)).toBe(true);
            native.push(instance);
        });
        let initialize!: () => void;
        const ready = new Promise<void>((resolve) => (initialize = resolve));
        const factory = vi.fn(async () => {
            await ready;
            return context.module;
        });
        KTX2Encoder.JSModule = factory;
        KTX2Encoder.WasmBinary = new ArrayBuffer(1);
        const encoder = new KTX2Encoder();
        expect(factory).not.toHaveBeenCalled();
        const results = Promise.all([encoder.encode(_rgba(), 4, 4, { usage: "color" }), encoder.encode(_rgba(), 4, 4, { usage: "data" })]);
        try {
            await vi.waitFor(() => expect(factory).toHaveBeenCalledOnce());
            expect(native).toHaveLength(0);
        } finally {
            initialize();
        }
        await results;
        expect(native).toHaveLength(2);
        expect(native.every((instance) => instance.deleted)).toBe(true);
        expect(context.module.initializeBasis).toHaveBeenCalledOnce();
    });

    it("keeps each instance's injected resources when settings change before first use", async () => {
        const first = _createEncoder();
        const firstFactory = vi.fn(async () => first.module);
        const firstBinary = new ArrayBuffer(2);
        KTX2Encoder.JSModule = firstFactory;
        KTX2Encoder.WasmBinary = firstBinary;
        const firstEncoder = new KTX2Encoder();
        const second = _createEncoder();
        const secondFactory = vi.fn(async () => second.module);
        const secondBinary = new ArrayBuffer(3);
        KTX2Encoder.JSModule = secondFactory;
        KTX2Encoder.WasmBinary = secondBinary;
        const secondEncoder = new KTX2Encoder();
        const fetch = vi.fn();
        vi.stubGlobal("fetch", fetch);
        await secondEncoder.encode(_rgba(), 4, 4, { usage: "color" });
        await firstEncoder.encode(_rgba(), 4, 4, { usage: "color" });
        expect(firstFactory).toHaveBeenCalledWith({ wasmBinary: firstBinary });
        expect(secondFactory).toHaveBeenCalledWith({ wasmBinary: secondBinary });
        expect(fetch).not.toHaveBeenCalled();
    });

    it.each(["factory", "initializeBasis"] as const)("caches %s failures for every pending encode", async (failure) => {
        const context = _createEncoder();
        const error = new Error("Initialization failed");
        const factory = vi.fn(async () => {
            if (failure === "factory") {
                throw error;
            }
            return context.module;
        });
        if (failure === "initializeBasis") {
            context.module.initializeBasis.mockImplementation(() => {
                throw error;
            });
        }
        KTX2Encoder.JSModule = factory;
        const encoder = new KTX2Encoder();
        const pending = [encoder.encode(_rgba(), 4, 4, { usage: "color" }), encoder.encode(_rgba(), 4, 4, { usage: "data" })];
        await Promise.all(pending.map(async (result) => await expect(result).rejects.toThrow(error)));
        await expect(encoder.encode(_rgba(), 4, 4, { usage: "color" })).rejects.toThrow(error);
        expect(factory).toHaveBeenCalledOnce();
        expect(() => context.basisEncoder).toThrow("has not been created");
    });
});

describe("KTX2Encoder validation", () => {
    it.each([
        { rgba: _rgba(), width: 0, height: 4, options: { usage: "color" }, message: "positive multiples of 4" },
        { rgba: _rgba(), width: 5, height: 4, options: { usage: "color" }, message: "positive multiples of 4" },
        { rgba: _rgba(), width: 16388, height: 4, options: { usage: "color" }, message: "16,384" },
        { rgba: _rgba(), width: 4, height: 16388, options: { usage: "color" }, message: "16,384" },
        { rgba: new Uint8Array(63), width: 4, height: 4, options: { usage: "color" }, message: "byte length must be 64" },
        { rgba: new Uint8Array(1), width: 4096, height: 3076, options: { usage: "color" }, message: "12,582,912" },
        { rgba: _rgba(), width: 4, height: 4, options: { usage: "other" }, message: "usage must be" },
        { rgba: _rgba(), width: 4, height: 4, options: { usage: "color", etc1sQualityLevel: 0 }, message: "etc1sQualityLevel" },
        { rgba: _rgba(), width: 4, height: 4, options: { usage: "color", etc1sCompressionLevel: 7 }, message: "etc1sCompressionLevel" },
        { rgba: _rgba(), width: 4, height: 4, options: { usage: "data", uastcQualityLevel: 5 }, message: "uastcQualityLevel" },
        { rgba: _rgba(), width: 4, height: 4, options: { usage: "color", zstandard: true }, message: "UASTC options" },
        { rgba: _rgba(), width: 4, height: 4, options: { usage: "color", zstandard: false }, message: "UASTC options" },
        { rgba: _rgba(), width: 4, height: 4, options: { usage: "data", etc1sQualityLevel: 128 }, message: "ETC1S options" },
    ])("rejects invalid input before creating BasisEncoder", async ({ rgba, width, height, options, message }) => {
        const context = _createEncoder();
        await expect(context.encoder.encode(rgba, width, height, options as IKTX2EncoderOptions)).rejects.toThrow(message);
        expect(() => context.basisEncoder).toThrow("has not been created");
    });
});

describe("KTX2Encoder presets", () => {
    it.each([
        [16384, 4],
        [4, 16384],
    ])("accepts the maximum dimension in a %s by %s image", async (width, height) => {
        const context = _createEncoder();
        await expect(context.encoder.encode(_rgba(width, height), width, height, { usage: "color" })).resolves.toHaveLength(96);
    });
    it.each(["color", "data", "normal"] as const)("uses the default %s quality and compression settings without overrides", async (usage) => {
        const context = _createEncoder();
        await context.encoder.encode(_rgba(), 4, 4, { usage });
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

    it("maps the color preset and overrides to Basis setters", async () => {
        const context = _createEncoder();
        await context.encoder.encode(_rgba(), 4, 4, {
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

    it.each(["data", "normal"] as const)("maps the %s preset and overrides to Basis setters", async (usage) => {
        const context = _createEncoder();
        const output = await context.encoder.encode(_rgba(), 4, 4, {
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
    it("retries once with a doubled output buffer", async () => {
        const context = _createEncoder((encoder) => (encoder.encodeResults = [0, 96]));

        const output = await context.encoder.encode(_rgba(), 4, 4, { usage: "color" });

        expect(output.byteLength).toBe(96);
        expect(output.buffer.byteLength).toBe(96);
        const encodeCalls = context.basisEncoder.calls.filter(([name]) => name === "encode");
        expect(encodeCalls).toEqual([
            ["encode", 65_600],
            ["encode", 131_200],
        ]);
    });

    it("throws after two failed encode attempts and deletes the encoder", async () => {
        const context = _createEncoder((encoder) => (encoder.encodeResults = [0, 0]));

        await expect(context.encoder.encode(_rgba(), 4, 4, { usage: "color" })).rejects.toThrow("Basis failed to encode the 4x4 'color' texture.");
        expect(context.basisEncoder.deleted).toBe(true);
    });

    it("deletes the encoder when Basis rejects the source", async () => {
        const context = _createEncoder((encoder) => (encoder.rejectSource = true));

        await expect(context.encoder.encode(_rgba(), 4, 4, { usage: "color" })).rejects.toThrow("Basis rejected");
        expect(context.basisEncoder.deleted).toBe(true);
    });

    it("deletes the encoder when the KTX2 DFD is invalid", async () => {
        const context = _createEncoder((encoder) => (encoder.encodeResults = [40]));

        await expect(context.encoder.encode(_rgba(), 4, 4, { usage: "data" })).rejects.toThrow("complete header");
        expect(context.basisEncoder.deleted).toBe(true);
    });

    it("rejects an out-of-range KTX2 DFD and deletes the encoder", async () => {
        const context = _createEncoder((encoder) => (encoder.dfdOffset = 1_000));

        await expect(context.encoder.encode(_rgba(), 4, 4, { usage: "data" })).rejects.toThrow("out-of-range DFD");
        expect(context.basisEncoder.deleted).toBe(true);
    });
});

describe("KTX2Encoder resource configuration", () => {
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

        KTX2Encoder.JSModule = factory;
        KTX2Encoder.WasmBinary = wasmBinary;
        await new KTX2Encoder().encode(_rgba(), 4, 4, { usage: "color" });
        await new KTX2Encoder().encode(_rgba(), 4, 4, { usage: "color" });

        expect(factory).toHaveBeenCalledTimes(2);
        expect(factory).toHaveBeenCalledWith({ wasmBinary });
        expect(initializeBasis).toHaveBeenCalledOnce();
    });

    it("requires a factory and WebAssembly source", async () => {
        KTX2Encoder.JSModuleURL = "";
        await expect(new KTX2Encoder().encode(_rgba(), 4, 4, { usage: "color" })).rejects.toThrow("JSModule or JSModuleURL");
        KTX2Encoder.JSModule = vi.fn();
        KTX2Encoder.WasmModuleURL = "";
        await expect(new KTX2Encoder().encode(_rgba(), 4, 4, { usage: "color" })).rejects.toThrow("WasmBinary or WasmModuleURL");
    });

    it("loads the factory and WebAssembly binary concurrently from URLs", async () => {
        const initializeBasis = vi.fn();
        const module = {
            BasisEncoder: FakeBasisEncoder,
            basis_tex_format: { cETC1S: { value: 0 }, cUASTC_LDR_4x4: { value: 1 } },
            basis_texture_type: { cBASISTexType2D: { value: 0 } },
            initializeBasis,
        };
        (globalThis as typeof globalThis & { __basisTestModule?: unknown }).__basisTestModule = module;
        const wasmBinary = new ArrayBuffer(2);
        let releaseSource!: (response: Response) => void;
        const sourceResponse = new Promise<Response>((resolve) => {
            releaseSource = resolve;
        });
        const fetchMock = vi.fn().mockReturnValueOnce(sourceResponse).mockResolvedValueOnce(new Response(wasmBinary));
        vi.stubGlobal("fetch", fetchMock);

        try {
            const pending = new KTX2Encoder().encode(_rgba(), 4, 4, { usage: "color" });
            try {
                expect(fetchMock).toHaveBeenCalledTimes(2);
            } finally {
                releaseSource(new Response("var BASIS = async () => globalThis.__basisTestModule;"));
                await pending;
            }
        } finally {
            delete (globalThis as typeof globalThis & { __basisTestModule?: unknown }).__basisTestModule;
            vi.unstubAllGlobals();
        }

        expect(fetchMock).toHaveBeenNthCalledWith(1, DefaultSettings.JSModuleURL);
        expect(fetchMock).toHaveBeenNthCalledWith(2, DefaultSettings.WasmModuleURL);
        expect(initializeBasis).toHaveBeenCalledOnce();
    });

    it("reports URL loading failures", async () => {
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 404, statusText: "Not Found" })));
        try {
            KTX2Encoder.JSModuleURL = "missing.js";
            await expect(new KTX2Encoder().encode(_rgba(), 4, 4, { usage: "color" })).rejects.toThrow("missing.js");
            KTX2Encoder.JSModule = vi.fn();
            KTX2Encoder.WasmModuleURL = "missing.wasm";
            await expect(new KTX2Encoder().encode(_rgba(), 4, 4, { usage: "color" })).rejects.toThrow("missing.wasm");
        } finally {
            vi.unstubAllGlobals();
        }
    });
});
