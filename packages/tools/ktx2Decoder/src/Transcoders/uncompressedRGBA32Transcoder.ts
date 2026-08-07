/* eslint-disable @typescript-eslint/naming-convention */
import * as KTX2 from "core/Materials/Textures/ktx2decoderTypes";

import { Transcoder } from "../transcoder";
import { type KTX2FileReader, type IKTX2_ImageDesc } from "../ktx2FileReader";

/**
 * Transcoder for uncompressed RGBA8 KTX2 files. The container already holds the exact bytes the engine
 * expects, so the "transcoding" is a straight copy and no WASM module is involved.
 * @internal
 */
export class UncompressedRGBA32Transcoder extends Transcoder {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public static override CanTranscode(src: KTX2.SourceTextureFormat, dst: KTX2.TranscodeTarget, isInGammaSpace: boolean): boolean {
        return src === KTX2.SourceTextureFormat.RGBA32 && dst === KTX2.TranscodeTarget.RGBA32;
    }

    public static override Name = "UncompressedRGBA32Transcoder";

    public override getName(): string {
        return UncompressedRGBA32Transcoder.Name;
    }

    public override async transcode(
        src: KTX2.SourceTextureFormat,
        dst: KTX2.TranscodeTarget,
        level: number,
        width: number,
        height: number,
        uncompressedByteLength: number,
        ktx2Reader: KTX2FileReader,
        imageDesc: IKTX2_ImageDesc | null,
        encodedData: Uint8Array
    ): Promise<Uint8Array | null> {
        // The view points into the (possibly shared) file buffer, so copy it: the caller keeps the result
        // beyond the lifetime of the source data and may transfer it to another thread.
        return encodedData.slice();
    }
}
