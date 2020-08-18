import { Nullable } from '../../types';
import { Tools } from '../tools';
import { Transcoder, sourceTextureFormat, transcodeTarget } from './transcoder';
import { WASMMemoryManager } from './wasmMemoryManager';
import { KTX2FileReader, IKTX2_ImageDesc } from './KTX2FileReader';

/**
 * @hidden
 */
export class LiteTranscoder extends Transcoder {

    private _modulePath: string;
    private _modulePromise: Promise<{ module: any }>;
    private _memoryManager: WASMMemoryManager;

    protected _loadModule(): Promise<{ module: any }> {
        if (this._modulePromise) {
            return this._modulePromise;
        }

        this._modulePromise = new Promise((resolve) => {
            Tools.LoadFileAsync(this._modulePath).then((wasmBinary: string | ArrayBuffer) => {
                WebAssembly.instantiate(wasmBinary as ArrayBuffer, { env: { memory: this._memoryManager.wasmMemory } }).then((moduleWrapper) => {
                    resolve({ module: moduleWrapper.instance.exports });
                });
            });
        });

        return this._modulePromise;
    }

    protected get memoryManager(): WASMMemoryManager {
        return this._memoryManager;
    }

    protected setModulePath(modulePath: string): void {
        this._modulePath = modulePath;
    }

    public needMemoryManager(): boolean {
        return true;
    }

    public setMemoryManager(memoryMgr: WASMMemoryManager): void {
        this._memoryManager = memoryMgr;
    }

    public transcode(src: sourceTextureFormat, dst: transcodeTarget, level: number, width: number, height: number, uncompressedByteLength: number, ktx2Reader: KTX2FileReader, imageDesc: Nullable<IKTX2_ImageDesc>, encodedData: Uint8Array): Promise<Nullable<Uint8Array>> {
        return this._loadModule().then((moduleWrapper: any) => {
            const transcoder: any = moduleWrapper.module;

            const nBlocks = ((width + 3) >> 2) * ((height + 3) >> 2);

            const texMemoryPages = ((nBlocks * 16 + 65535) >> 16) + 1;

            const textureView = this.memoryManager.getMemoryView(texMemoryPages, 65536, nBlocks * 16);

            textureView.set(encodedData);

            return transcoder.transcode(nBlocks) === 0 ? textureView.slice() : null;
        });
    }
}
