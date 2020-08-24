declare function postMessage(message: any, transfer?: any[]): void;

/**
 * @hidden
 */
export class WASMMemoryManager {

    public static LoadBinariesFromCurrentThread = true;
    public static InitialMemoryPages = (1 * 1024 * 1024) >> 16; // 1 Mbytes

    private static _RequestId = 0;

    public static LoadWASM(path: string): Promise<ArrayBuffer> {
        if (this.LoadBinariesFromCurrentThread) {
            return new Promise((resolve, reject) => {
                fetch(path)
                .then((response) => {
                    if (response.ok) {
                        return response.arrayBuffer();
                    }
                    throw new Error(`Could not fetch the wasm component from "${path}": ${response.status} - ${response.statusText}`);
                })
                .then((wasmBinary) => resolve(wasmBinary))
                .catch((reason) => {
                    reject(reason);
                });
            });
        }

        const id = this._RequestId++;

        return new Promise((resolve) => {
            const wasmLoadedHandler = (msg: any) => {
                if (msg.data.action === "wasmLoaded" && msg.data.id === id) {
                    self.removeEventListener("message", wasmLoadedHandler);
                    resolve(msg.data.wasmBinary);
                }
            };

            self.addEventListener("message", wasmLoadedHandler);

            postMessage({ action: "loadWASM", path: path, id: id });
        });
    }

    private _memory: WebAssembly.Memory;
    private _numPages: number;
    private _memoryView: Uint8Array;
    private _memoryViewByteLength: number;
    private _memoryViewOffset: number;

    constructor(initialMemoryPages: number = WASMMemoryManager.InitialMemoryPages) {
        this._numPages = initialMemoryPages;

        this._memory = new WebAssembly.Memory({ initial: this._numPages });
        this._memoryViewByteLength = this._numPages << 16;
        this._memoryViewOffset = 0;
        this._memoryView = new Uint8Array(this._memory.buffer, this._memoryViewOffset, this._memoryViewByteLength);
    }

    public get wasmMemory(): WebAssembly.Memory {
        return this._memory;
    }

    public getMemoryView(numPages: number, offset: number = 0, byteLength?: number): Uint8Array {
        byteLength = byteLength ?? numPages << 16;

        if (this._numPages < numPages) {
            this._memory.grow(numPages - this._numPages);
            this._numPages = numPages;
            this._memoryView = new Uint8Array(this._memory.buffer, offset, byteLength);
            this._memoryViewByteLength = byteLength;
            this._memoryViewOffset = offset;
        } else {
            this._memoryView = new Uint8Array(this._memory.buffer, offset, byteLength);
            this._memoryViewByteLength = byteLength;
            this._memoryViewOffset = offset;
        }

        return this._memoryView;
    }
}
