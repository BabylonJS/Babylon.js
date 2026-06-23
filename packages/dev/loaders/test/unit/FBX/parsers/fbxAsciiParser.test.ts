import { describe, expect, it } from "vitest";
import { parseAsciiFBX } from "loaders/FBX/parsers/fbxAsciiParser";

describe("parseAsciiFBX", () => {
    it("parses shorthand arrays with the declared value count", () => {
        const doc = parseAsciiFBX(`; FBX 7.4.0 project file
Vertices: *3 {
    a: 1,2,3
}`);

        expect(doc.version).toBe(7400);
        expect(doc.nodes[0].properties[0].value).toEqual(new Float64Array([1, 2, 3]));
    });

    it("rejects shorthand arrays with fewer values than declared", () => {
        expect(() =>
            parseAsciiFBX(`; FBX 7.4.0 project file
Vertices: *3 {
    a: 1,2
}`)
        ).toThrow("ASCII FBX array declared 3 values but parsed 2");
    });

    it("rejects shorthand arrays with more values than declared", () => {
        expect(() =>
            parseAsciiFBX(`; FBX 7.4.0 project file
Vertices: *2 {
    a: 1,2,3
}`)
        ).toThrow("ASCII FBX array declared 2 values but parsed 3");
    });

    it("parses int64 object identifiers as number values", () => {
        const doc = parseAsciiFBX(`; FBX 7.4.0 project file
Model: 3000000000, "Model::Root", "Null" {
}`);

        expect(doc.nodes[0].properties[0]).toEqual({ type: "int64", value: 3000000000 });
    });
});
