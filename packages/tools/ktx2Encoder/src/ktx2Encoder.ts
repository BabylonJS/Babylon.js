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

/**
 * Configuration used to create a KTX2 encoder.
 * @experimental
 */
export interface IKTX2EncoderConfiguration {
    /**
     * URL of the Basis encoder JavaScript factory.
     * This non-worker URL path evaluates the factory source and requires CSP unsafe-eval.
     * @experimental
     */
    jsModuleUrl?: string;
    /**
     * URL of the Basis encoder WebAssembly binary.
     * @experimental
     */
    wasmUrl?: string;
    /**
     * Basis encoder WebAssembly binary.
     * @experimental
     */
    wasmBinary?: ArrayBuffer;
    /**
     * Factory that returns a Basis module, synchronously or asynchronously.
     * @experimental
     */
    basisFactory?: unknown;
}

const ValidateIntegerRange = (name: string, value: number | undefined, minimum: number, maximum: number): void => {
    if (value !== undefined && (!Number.isInteger(value) || value < minimum || value > maximum)) {
        throw new Error(`${name} must be an integer from ${minimum} through ${maximum}.`);
    }
};

const ValidateOptions = (options: IKTX2EncoderOptions): void => {
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
};

const ValidateInput = (rgba: Uint8Array, width: number, height: number, options: IKTX2EncoderOptions): void => {
    _ValidateKTX2EncoderDimensions(width, height);
    const pixelCount = width * height;
    const expectedByteLength = pixelCount * 4;
    if (rgba.byteLength !== expectedByteLength) {
        throw new Error(`RGBA input byte length must be ${expectedByteLength} for a ${width}x${height} image, but received ${rgba.byteLength}.`);
    }

    ValidateOptions(options);
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
    return Function(`${source}\nreturn BASIS;`)() as BasisFactory;
};

/**
 * Encodes RGBA8 pixel data as KTX2 ETC1S or UASTC data.
 * @experimental
 */
export class KTX2Encoder {
    private readonly _basisModule: unknown;

    /**
     * Creates an encoder from an initialized Basis module.
     * @param basisModule The initialized Basis encoder module.
     * @experimental
     */
    public constructor(basisModule: unknown) {
        this._basisModule = basisModule;
    }

    /**
     * Loads and initializes the Basis encoder module.
     * The official Basis v2_50 factory requires CSP 'unsafe-eval' for Embind.
     * @param config The module factory, JavaScript URL, and WebAssembly source.
     * @returns A ready KTX2 encoder.
     * @experimental
     */
    public static async CreateAsync(config: IKTX2EncoderConfiguration): Promise<KTX2Encoder> {
        const factory = (config.basisFactory as BasisFactory | undefined) ?? (config.jsModuleUrl ? await LoadFactoryAsync(config.jsModuleUrl) : undefined);
        if (!factory) {
            throw new Error("A Basis encoder factory or jsModuleUrl is required.");
        }

        let wasmBinary: ArrayBuffer | Uint8Array | undefined = config.wasmBinary;
        if (!wasmBinary) {
            if (!config.wasmUrl) {
                throw new Error("A Basis encoder wasmBinary or wasmUrl is required.");
            }
            const response = await fetch(config.wasmUrl);
            if (!response.ok) {
                throw new Error(`Failed to load the Basis encoder WebAssembly module from '${config.wasmUrl}': ${response.status} ${response.statusText}.`);
            }
            wasmBinary = await response.arrayBuffer();
        }

        const basisModule = await factory({ wasmBinary });
        if (!basisModule[BasisInitialized]) {
            basisModule.initializeBasis();
            basisModule[BasisInitialized] = true;
        }
        return new KTX2Encoder(basisModule);
    }

    /**
     * Encodes an RGBA8 image.
     * @param rgba RGBA8 source pixels, top-down unless `flipY` is true.
     * @param width Source width in pixels.
     * @param height Source height in pixels.
     * @param options Encoding options.
     * @returns The encoded KTX2 file.
     * @experimental
     */
    public encode(rgba: Uint8Array, width: number, height: number, options: IKTX2EncoderOptions): Uint8Array {
        ValidateInput(rgba, width, height, options);

        const basisModule = this._basisModule as IBasisModule;
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
