import { InternalTexture } from "../Materials/Textures/internalTexture";
import { ThinEngine } from "../Engines/thinEngine";
import { EngineCapabilities } from '../Engines/engineCapabilities';

declare var LIBKTX: any;

/**
 * Class for loading KTX2 files
 * !!! Experimental Extension Subject to Changes !!!
 * @hidden
 */
export class KhronosTextureContainer2 {
    private static _ModulePromise: Promise<{ module: any }>;
    private static _TranscodeFormat: number;

    public constructor(engine: ThinEngine) {
        if (!KhronosTextureContainer2._ModulePromise) {
            KhronosTextureContainer2._ModulePromise = new Promise((resolve) => {
                LIBKTX().then((module: any) => {
                    module.GL.makeContextCurrent(module.GL.registerContext(engine._gl, { majorVersion: engine._webGLVersion }));
                    KhronosTextureContainer2._TranscodeFormat = this._determineTranscodeFormat(module.TranscodeTarget, engine.getCaps());
                    resolve({ module: module });
                });
            });
        }
    }

    public uploadAsync(data: ArrayBufferView, internalTexture: InternalTexture): Promise<void> {
        return KhronosTextureContainer2._ModulePromise.then((moduleWrapper: any) => {
            const module = moduleWrapper.module;

            const ktxTexture = new module.ktxTexture(data);
            try {
                if (ktxTexture.isBasisSupercompressed) {
                    ktxTexture.transcodeBasis(KhronosTextureContainer2._TranscodeFormat, 0);
                }

                internalTexture.width = internalTexture.baseWidth = ktxTexture.baseWidth;
                internalTexture.height = internalTexture.baseHeight = ktxTexture.baseHeight;
                internalTexture.generateMipMaps = false;

                const result = ktxTexture.glUpload();
                if (result.error === 0) {
                    internalTexture._webGLTexture = result.texture;
                }
                else {
                    throw new Error(`Failed to upload: ${result.error}`);
                }

                internalTexture.isReady = true;
            }
            finally {
                ktxTexture.delete();
            }
        });
    }

    private _determineTranscodeFormat(transcodeTarget: any, caps: EngineCapabilities): number {
        if (caps.s3tc) {
            return transcodeTarget.BC1_OR_3;
        }
        else if (caps.etc2) {
            return transcodeTarget.ETC;
        }

        throw new Error("No compatible format available");
    }

    /**
     * Checks if the given data starts with a KTX2 file identifier.
     * @param data the data to check
     * @returns true if the data is a KTX2 file or false otherwise
     */
    public static IsValid(data: ArrayBufferView): boolean {
        if (data.byteLength >= 12)
        {
            // '«', 'K', 'T', 'X', ' ', '2', '0', '»', '\r', '\n', '\x1A', '\n'
            const identifier = new Uint8Array(data.buffer, data.byteOffset, 12);
            if (identifier[0] === 0xAB && identifier[1] === 0x4B && identifier[2] === 0x54 && identifier[3] === 0x58 && identifier[4] === 0x20 && identifier[5] === 0x32 &&
                identifier[6] === 0x30 && identifier[7] === 0xBB && identifier[8] === 0x0D && identifier[9] === 0x0A && identifier[10] === 0x1A && identifier[11] === 0x0A) {
                return true;
            }
        }

        return false;
    }
}
