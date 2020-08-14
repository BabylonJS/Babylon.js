/**
 * @hidden
 */
export class WASMMemoryManager {

    private _memory: WebAssembly.Memory;
    private _numPages: number;
    private _memoryView: Uint8Array;
    private _memoryViewByteLength: number;
    private _memoryViewOffset: number;

    constructor(initialMemoryPages: number = (1 * 1024 * 1024) >> 16) {
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
            console.log("grow memory", this._numPages, numPages);
            this._memory.grow(numPages - this._numPages);
            this._numPages = numPages;
            this._memoryView = new Uint8Array(this._memory.buffer, offset, byteLength);
            this._memoryViewByteLength = byteLength;
            this._memoryViewOffset = offset;
        } else if (this._memoryViewByteLength < byteLength || this._memoryViewOffset !== offset) {
            console.log("recreate view", this._memoryViewByteLength, byteLength, this._memoryViewOffset, offset);
            this._memoryView = new Uint8Array(this._memory.buffer, offset, byteLength);
            this._memoryViewByteLength = byteLength;
            this._memoryViewOffset = offset;
        }

        return this._memoryView;
    }
}
