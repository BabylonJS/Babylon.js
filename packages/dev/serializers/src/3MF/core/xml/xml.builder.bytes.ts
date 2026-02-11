import type { IXmlWriter } from "./xml.builder";

/** */
export type ByteSink = {
    push(chunk: Uint8Array, final?: boolean): void;
};

/** */
export class Utf8XmlWriterToBytes implements IXmlWriter {
    /** */
    public count = 0;
    private _encoder = new TextEncoder();
    private _pending = "";
    private _pendingChars = 0;

    constructor(
        private readonly _sink: ByteSink,
        private readonly _opts: { flushChars?: number } = {}
    ) {}

    /**
     * @param data
     * @returns
     */
    write(...data: string[]): IXmlWriter {
        if (data.length === 0) {
            return this;
        }

        const s = data.join("");
        if (s.length === 0) {
            return this;
        }

        this._pending += s;
        this._pendingChars += s.length;

        const limit = this._opts.flushChars ?? 64 * 1024;
        if (this._pendingChars >= limit) {
            this.flush();
        }

        return this;
    }

    /**
     * @returns
     */
    flush(): this {
        if (this._pendingChars === 0) {
            return this;
        }

        const bytes = this._encoder.encode(this._pending);
        this._sink.push(bytes);
        this.count += bytes.length;

        this._pending = "";
        this._pendingChars = 0;

        return this;
    }

    /**
     */
    finish(): void {
        this.flush();
        this._sink.push(new Uint8Array(0), true);
    }

    /**
     */
    clear(): void {
        this._pending = "";
        this._pendingChars = 0;
        this.count = 0;
    }
}
