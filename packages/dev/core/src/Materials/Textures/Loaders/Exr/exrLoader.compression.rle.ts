/** @internal */
export function DecodeRunLength(source: ArrayBuffer) {
    let size = source.byteLength;
    const out = new Array();
    let p = 0;

    const reader = new DataView(source);

    while (size > 0) {
        const l = reader.getInt8(p++);

        if (l < 0) {
            const count = -l;
            size -= count + 1;

            for (let i = 0; i < count; i++) {
                out.push(reader.getUint8(p++));
            }
        } else {
            const count = l;
            size -= 2;

            const value = reader.getUint8(p++);

            for (let i = 0; i < count + 1; i++) {
                out.push(value);
            }
        }
    }

    return out;
}
