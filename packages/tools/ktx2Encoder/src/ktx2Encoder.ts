/* eslint-disable @typescript-eslint/naming-convention */
import { _ValidateKTX2EncoderDimensions, type IKTX2EncoderOptions } from "./ktx2encoderTypes";

export type { IKTX2EncoderOptions, KTX2EncoderUsage } from "./ktx2encoderTypes";
const OutputBufferPadding = 65_536;
const KTX2DFDOffsetPosition = 48;
const KTX2PrimariesOffsetInDFD = 13;
const BasisInitialized = Symbol("KTX2EncoderBasisInitialized");

type BasisEnumValue = { value: number };

interface IBasisEncoder {
    delete(): void;
    encode(output: Uint8Array): number;
    setCreateKTX2File(value: boolean): void;
    setETC1SCompressionLevel(value: number): void;
    setFormatMode(value: number): void;
    setKTX2AndBasisSRGBTransferFunc(value: boolean): void;
    setKTX2UASTCSupercompression(value: boolean): void;
    setMipGen(value: boolean): void;
    setMipSRGB(value: boolean): void;
    setNormalMapPreset(): void;
    setPackUASTCFlags(value: number): void;
    setPerceptual(value: boolean): void;
    setQualityLevel(value: number): void;
    setSliceSourceImage(sliceIndex: number, source: Uint8Array, width: number, height: number, imageType: number): boolean;
    setTexType(value: number): void;
    setYFlip(value: boolean): void;
}

interface IBasisModule {
    [BasisInitialized]?: boolean;
    BasisEncoder: new () => IBasisEncoder;
    basis_tex_format: {
        cETC1S: BasisEnumValue;
        cUASTC_LDR_4x4: BasisEnumValue;
    };
    basis_texture_type: {
        cBASISTexType2D: BasisEnumValue;
    };
    initializeBasis(): void;
}

type BasisFactory = (options: { wasmBinary: ArrayBuffer | Uint8Array }) => IBasisModule | Promise<IBasisModule>;

const ValidateIntegerRange = (name: string, value: number | undefined, minimum: number, maximum: number): void => {
    if (value !== undefined && (!Number.isInteger(value) || value < minimum || value > maximum)) {
        throw new Error(`${name} must be an integer from ${minimum} through ${maximum}.`);
    }
};

const PatchDFDPrimaries = (data: Uint8Array): void => {
    if (data.byteLength < KTX2DFDOffsetPosition + 4) {
        throw new Error("Basis produced an invalid KTX2 file without a complete header.");
    }

    const dataView = new DataView(data.buffer, data.byteOffset, data.byteLength);
    const dfdByteOffset = dataView.getUint32(KTX2DFDOffsetPosition, true);
    const primariesPosition = dfdByteOffset + KTX2PrimariesOffsetInDFD;
    if (primariesPosition >= data.byteLength) {
        throw new Error("Basis produced an invalid KTX2 file with an out-of-range DFD.");
    }

    data[primariesPosition] = 0;
};

const LoadFactoryAsync = async (url: string): Promise<BasisFactory> => {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to load the Basis encoder JavaScript module from '${url}': ${response.status} ${response.statusText}.`);
    }

    const source = await response.text();
    if (typeof process === "object" && process.versions?.node) {
        // WASM is supplied directly, so the factory only needs Node's built-ins.
        const directory = process.cwd();
        const filename = `${directory}/basis_encoder.js`;
        const nodeRequire = process.getBuiltinModule("module").createRequire(filename);
        return Function("require", "__dirname", "__filename", `${source}\nreturn BASIS;`)(nodeRequire, directory, filename) as BasisFactory;
    }
    return Function(`${source}\nreturn BASIS;`)() as BasisFactory;
};

/**
 * Encodes RGBA8 pixel data as KTX2 ETC1S or UASTC data.
 * @experimental
 */
export class KTX2Encoder {
    /**
     * URL of the Basis encoder JavaScript factory. Configure before constructing an encoder.
     * URL loading evaluates trusted JavaScript and requires CSP 'unsafe-eval'.
     * @experimental
     */
    public static JSModuleURL = "https://cdn.babylonjs.com/basisEncoder/v2_50/basis_encoder.js";
    /**
     * URL of the Basis encoder WebAssembly binary. Configure before constructing an encoder.
     * @experimental
     */
    public static WasmModuleURL = "https://cdn.babylonjs.com/basisEncoder/v2_50/basis_encoder.wasm";
    /**
     * Injected Basis encoder WebAssembly binary, or null to load WasmModuleURL.
     * Configure before constructing an encoder.
     * @experimental
     */
    public static WasmBinary: ArrayBuffer | null = null;
    /**
     * Injected Basis encoder factory, or null to load JSModuleURL.
     * Configure before constructing an encoder.
     * @experimental
     */
    public static JSModule: unknown = null;

    private readonly _configuration = {
        jsModule: KTX2Encoder.JSModule as BasisFactory | null,
        wasmBinary: KTX2Encoder.WasmBinary,
        jsModuleURL: KTX2Encoder.JSModuleURL,
        wasmModuleURL: KTX2Encoder.WasmModuleURL,
    };
    private _basisModule?: IBasisModule;
    private _initializationPromise?: Promise<void>;
    /**
     * Captures the static resource settings without loading the codec.
     * The first encode initializes the codec lazily.
     * @experimental
     */
    public constructor() {}

    /** @internal */
    public async _initializeAsync(): Promise<void> {
        await (this._initializationPromise ??= this._loadAsync());
    }

    private async _loadAsync(): Promise<void> {
        const config = this._configuration;
        if (!config.jsModule && !config.jsModuleURL) {
            throw new Error("A Basis encoder JSModule or JSModuleURL is required.");
        }
        if (!config.wasmBinary && !config.wasmModuleURL) {
            throw new Error("A Basis encoder WasmBinary or WasmModuleURL is required.");
        }
        const [factory, wasmBinary] = await Promise.all([
            config.jsModule ?? LoadFactoryAsync(config.jsModuleURL),
            (async () => {
                if (config.wasmBinary) {
                    return config.wasmBinary;
                }
                const response = await fetch(config.wasmModuleURL);
                if (!response.ok) {
                    throw new Error(`Failed to load the Basis encoder WebAssembly module from '${config.wasmModuleURL}': ${response.status} ${response.statusText}.`);
                }
                return await response.arrayBuffer();
            })(),
        ]);

        const basisModule = await factory({ wasmBinary });
        if (!basisModule[BasisInitialized]) {
            basisModule.initializeBasis();
            basisModule[BasisInitialized] = true;
        }
        this._basisModule = basisModule;
    }

    /**
     * Encodes an RGBA8 image.
     * Loads the codec on first use. The official Basis v2_50 factory requires CSP 'unsafe-eval' for Embind.
     * Compression is synchronous after initialization; calls on this thread cannot overlap.
     * @param rgba RGBA8 source pixels, top-down unless `flipY` is true.
     * @param width Source width in pixels.
     * @param height Source height in pixels.
     * @param options Encoding options.
     * @returns The encoded KTX2 file.
     * @experimental
     */
    public async encode(rgba: Uint8Array, width: number, height: number, options: IKTX2EncoderOptions): Promise<Uint8Array> {
        _ValidateKTX2EncoderDimensions(width, height);
        const expectedByteLength = width * height * 4;
        if (rgba.byteLength !== expectedByteLength) {
            throw new Error(`RGBA input byte length must be ${expectedByteLength} for a ${width}x${height} image, but received ${rgba.byteLength}.`);
        }
        if (options.usage !== "color" && options.usage !== "data" && options.usage !== "normal") {
            throw new Error("usage must be 'color', 'data', or 'normal'.");
        }
        ValidateIntegerRange("etc1sQualityLevel", options.etc1sQualityLevel, 1, 255);
        ValidateIntegerRange("etc1sCompressionLevel", options.etc1sCompressionLevel, 0, 6);
        ValidateIntegerRange("uastcQualityLevel", options.uastcQualityLevel, 0, 4);
        if (options.usage === "color") {
            if (options.uastcQualityLevel !== undefined || options.zstandard !== undefined) {
                throw new Error("UASTC options cannot be used when usage is 'color'.");
            }
        } else if (options.etc1sQualityLevel !== undefined || options.etc1sCompressionLevel !== undefined) {
            throw new Error("ETC1S options can only be used when usage is 'color'.");
        }

        if (!this._basisModule) {
            await this._initializeAsync();
        }
        const basisModule = this._basisModule!;
        const encoder = new basisModule.BasisEncoder();
        try {
            const isColor = options.usage === "color";
            if (options.usage === "normal") {
                encoder.setNormalMapPreset();
            }

            encoder.setCreateKTX2File(true);
            encoder.setTexType(basisModule.basis_texture_type.cBASISTexType2D.value);
            encoder.setFormatMode((isColor ? basisModule.basis_tex_format.cETC1S : basisModule.basis_tex_format.cUASTC_LDR_4x4).value);
            encoder.setPerceptual(isColor);
            encoder.setMipSRGB(isColor);
            encoder.setKTX2AndBasisSRGBTransferFunc(isColor);
            encoder.setMipGen(options.generateMipmaps ?? true);
            encoder.setYFlip(options.flipY ?? false);

            if (isColor) {
                encoder.setQualityLevel(options.etc1sQualityLevel ?? 128);
                encoder.setETC1SCompressionLevel(options.etc1sCompressionLevel ?? 2);
            } else {
                encoder.setPackUASTCFlags(options.uastcQualityLevel ?? 2);
                encoder.setKTX2UASTCSupercompression(options.zstandard ?? true);
            }

            if (!encoder.setSliceSourceImage(0, rgba, width, height, 0)) {
                throw new Error(`Basis rejected the ${width}x${height} RGBA source image.`);
            }

            let output = new Uint8Array(rgba.byteLength + OutputBufferPadding);
            let encodedByteLength = encoder.encode(output);
            if (encodedByteLength === 0) {
                output = new Uint8Array(output.byteLength * 2);
                encodedByteLength = encoder.encode(output);
            }
            if (encodedByteLength === 0) {
                throw new Error(`Basis failed to encode the ${width}x${height} '${options.usage}' texture.`);
            }

            const encoded = output.slice(0, encodedByteLength);
            if (!isColor) {
                PatchDFDPrimaries(encoded);
            }
            return encoded;
        } finally {
            encoder.delete();
        }
    }
}
