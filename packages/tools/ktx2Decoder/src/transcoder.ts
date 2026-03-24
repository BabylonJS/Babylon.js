/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/naming-convention */
import type * as KTX2 from "core/Materials/Textures/ktx2decoderTypes";

import type { WASMMemoryManager } from "./wasmMemoryManager";
import type { KTX2FileReader, IKTX2_ImageDesc } from "./ktx2FileReader";

/**
 * @internal
 */
export class Transcoder {
    public static CanTranscode(src: KTX2.SourceTextureFormat, dst: KTX2.TranscodeTarget, isInGammaSpace: boolean): boolean {
        return false;
    }

    public static Name = "Transcoder";

    public static WasmBaseUrl = "";

    /**
     * The CDN version to use when constructing versioned CDN URLs.
     * Injected at build time by the version update script.
     * When set, unversioned CDN URLs will be rewritten to include this version prefix.
     * @internal
     */
    public static CdnVersion = "8.56.2";

    private static readonly _DefaultCdnUrl = "https://cdn.babylonjs.com";

    public static GetWasmUrl(wasmUrl: string) {
        if (wasmUrl.startsWith(Transcoder._DefaultCdnUrl)) {
            if (Transcoder.WasmBaseUrl) {
                // Normalize the base url
                const baseUrl = Transcoder.WasmBaseUrl.endsWith("/") ? Transcoder.WasmBaseUrl.slice(0, -1) : Transcoder.WasmBaseUrl;
                wasmUrl = wasmUrl.replace(Transcoder._DefaultCdnUrl, baseUrl);
            } else if (Transcoder.CdnVersion) {
                const versionedBase = `${Transcoder._DefaultCdnUrl}/v${Transcoder.CdnVersion}`;
                // Guard against double-versioning if the URL already contains the version prefix
                // (e.g. when GetWasmUrl is called multiple times on the same URL)
                if (!wasmUrl.startsWith(versionedBase)) {
                    wasmUrl = wasmUrl.replace(Transcoder._DefaultCdnUrl, versionedBase);
                }
            }
        }
        return wasmUrl;
    }

    public getName(): string {
        return Transcoder.Name;
    }

    public initialize(): void {}

    public needMemoryManager(): boolean {
        return false;
    }

    public setMemoryManager(memoryMgr: WASMMemoryManager): void {}

    public async transcode(
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
        return null;
    }
}
