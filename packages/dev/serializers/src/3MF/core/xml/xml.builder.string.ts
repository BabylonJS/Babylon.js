import type { IXmlWriter } from "./xml.builder";

/** */
export class StringXmlWriter implements IXmlWriter {
    /** */
    public count = 0;
    private _chunks: string[] = [];

    /**
     * @param data
     * @returns
     */
    write(...data: string[]): IXmlWriter {
        if (data.length === 0) {
            return this;
        }

        // join once per call, keeps DOM out, very fast
        const s = data.join("");
        this._chunks.push(s);
        this.count += s.length;
        return this;
    }

    /**
     * @returns
     */
    toString(): string {
        return this._chunks.join("");
    }

    /**
     */
    clear(): void {
        this._chunks = [];
        this.count = 0;
    }
}
