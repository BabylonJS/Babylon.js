/** @hidden */
export class TextWrapper {
    private _text: string;
    private _characters: string[] | undefined;

    public get text(): string {
        return this._characters ? this._characters.join("") : this._text;
    }

    public set text(txt: string) {
        this._text = txt;
        this._characters = Array.from && Array.from(txt);
    }

    public get length(): number {
        return this._characters ? this._characters.length : this._text.length;
    }

    public removePart(idxStart: number, idxEnd: number, insertTxt?: string): void {
        this._text = this._text.slice(0, idxStart) + (insertTxt ? insertTxt : "") + this._text.slice(idxEnd);
        if (this._characters) {
            const newCharacters = insertTxt ? Array.from(insertTxt) : [];
            this._characters.splice(idxStart, idxEnd - idxStart, ...newCharacters);
        }
    }

    public charAt(idx: number): string {
        return this._characters ? this._characters[idx] : this._text.charAt(idx);
    }

    public substr(from: number, length?: number): string {
        if (this._characters) {
            if (isNaN(from)) {
                from = 0;
            } else if (from >= 0) {
                from = Math.min(from, this._characters.length);
            } else {
                from = this._characters.length + Math.max(from, -this._characters.length);
            }
            if (length === undefined) {
                length = this._characters.length - from;
            } else if (isNaN(length)) {
                length = 0;
            } else if (length < 0) {
                length = 0;
            }
            const temp = [];
            while (--length >= 0) {
                temp[length] = this._characters[from + length];
            }
            return temp.join("");
        }

        return this._text.substr(from, length);
    }

    public substring(from: number, to?: number): string {
        if (this._characters) {
            if (isNaN(from)) {
                from = 0;
            } else if (from > this._characters.length) {
                from = this._characters.length;
            } else if (from < 0) {
                from = 0;
            }
            if (to === undefined) {
                to = this._characters.length;
            } else if (isNaN(to)) {
                to = 0;
            } else if (to > this._characters.length) {
                to = this._characters.length;
            } else if (to < 0) {
                to = 0;
            }
            const temp = [];
            let idx = 0;
            while (from < to) {
                temp[idx++] = this._characters[from++];
            }
            return temp.join("");
        }

        return this._text.substring(from, to);
    }

    public isWord(index: number): boolean {
        const rWord = /\w/g;
        return this._characters ? this._characters[index].search(rWord) !== -1 : this._text.search(rWord) !== -1;
    }
}
