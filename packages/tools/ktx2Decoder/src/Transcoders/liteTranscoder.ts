import type * as KTX2 from "core/Materials/Textures/ktx2decoderTypes";

import { Transcoder } from "../transcoder";
import { WASMMemoryManager } from "../wasmMemoryManager";
import type { KTX2FileReader, IKTX2_ImageDesc } from "../ktx2FileReader";

/**
 * @internal
 */
export class LiteTranscoder extends Transcoder {
    private _modulePath: string;
    private _wasmBinary: ArrayBuffer | null = null;
    private _modulePromise: Promise<{ module: any }>;
    private _memoryManager: WASMMemoryManager;
    protected _transcodeInPlace: boolean;

    private _instantiateWebAssembly(wasmBinary: ArrayBuffer): Promise<{ module: any }> {
        return WebAssembly.instantiate(wasmBinary as ArrayBuffer, { env: { memory: this._memoryManager.wasmMemory } }).then((moduleWrapper) => {
            return { module: moduleWrapper.instance.exports };
        });
    }

    protected _loadModule(wasmBinary: ArrayBuffer | null = this._wasmBinary): Promise<{ module: any }> {
        this._modulePromise =
            this._modulePromise ||
            (wasmBinary ? Promise.resolve(wasmBinary) : WASMMemoryManager.LoadWASM(this._modulePath)).then((wasmBinary) => {
                return this._instantiateWebAssembly(wasmBinary);
            });
        return this._modulePromise;
    }

    // eslint-disable-next-line @typescript-eslint/naming-convention
    protected get memoryManager(): WASMMemoryManager {
        return this._memoryManager;
    }

    // eslint-disable-next-line @typescript-eslint/naming-convention
    protected setModulePath(modulePath: string, wasmBinary: ArrayBuffer | null): void {
        this._modulePath = Transcoder.GetWasmUrl(modulePath);
        this._wasmBinary = wasmBinary;
    }

    public initialize(): void {
        this._transcodeInPlace = true;
    }

    public needMemoryManager(): boolean {
        return true;
    }

    public setMemoryManager(memoryMgr: WASMMemoryManager): void {
        this._memoryManager = memoryMgr;
    }

    public transcode(
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
        return this._loadModule().then((moduleWrapper: any) => {
            const transcoder: any = moduleWrapper.module;
            const [textureView, uncompressedTextureView, nBlocks] = this._prepareTranscoding(width, height, uncompressedByteLength, encodedData);

            return transcoder.transcode(nBlocks) === 0 ? (this._transcodeInPlace ? textureView.slice() : uncompressedTextureView!.slice()) : null;
        });
    }

    protected _prepareTranscoding(
        width: number,
        height: number,
        uncompressedByteLength: number,
        encodedData: Uint8Array,
        uncompressedNumComponents?: number
    ): [Uint8Array, Uint8Array | null, number] {
        const nBlocks = ((width + 3) >> 2) * ((height + 3) >> 2);

        if (uncompressedNumComponents !== undefined) {
            uncompressedByteLength = width * ((height + 3) >> 2) * 4 * uncompressedNumComponents;
        }

        const texMemoryPages = ((nBlocks * 16 + 65535 + (this._transcodeInPlace ? 0 : uncompressedByteLength)) >> 16) + 1;

        const textureView = this.memoryManager.getMemoryView(texMemoryPages, 65536, nBlocks * 16);

        const uncompressedTextureView = this._transcodeInPlace
            ? null
            : new Uint8Array(
                  this._memoryManager.wasmMemory.buffer,
                  65536 + nBlocks * 16,
                  uncompressedNumComponents !== undefined ? width * height * uncompressedNumComponents : uncompressedByteLength
              );

        textureView.set(encodedData);

        return [textureView, uncompressedTextureView, nBlocks];
    }
}
