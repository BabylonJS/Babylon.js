import { describe, expect, it } from "vitest";
import { GetGltfResourceKeys, GltfCompanionResolutionError, ResolveGltfCompanionFiles } from "flow-graph-editor/khrGltfCompanionFiles";

function FileAt(name: string, webkitRelativePath = ""): File {
    return { name, webkitRelativePath } as File;
}

describe("glTF companion path identity", () => {
    const main = FileAt("assembly.gltf", "asset/scenes/assembly.gltf");

    it("resolves known paths relative to the source directory, never another drop root", () => {
        const wrong = FileAt("paint.png", "textures/paint.png");
        const right = FileAt("paint.png", "asset/scenes/textures/paint.png");
        expect(() => ResolveGltfCompanionFiles(main, ["textures/paint.png"], [wrong])).toThrow("Missing companion file for textures/paint.png");
        expect(ResolveGltfCompanionFiles(main, ["textures/paint.png"], [wrong, right]).get("textures/paint.png")).toBe(right);
    });

    it("prefers a known source-relative file over an unrelated flat basename", () => {
        const right = FileAt("paint.png", "asset/scenes/paint.png");
        expect(ResolveGltfCompanionFiles(main, ["paint.png"], [FileAt("paint.png"), right]).get("paint.png")).toBe(right);
    });

    it.each(["paint.png", "/paint.png", "\\paint.png"])("does not infer a directory from a basename-only correctName (%s)", (correctName) => {
        const paint = { ...FileAt("paint.png"), correctName } as File;
        expect(ResolveGltfCompanionFiles(main, ["textures/paint.png"], [paint]).get("textures/paint.png")).toBe(paint);
    });

    it("uses a retained virtual basename when it differs from the physical filename", () => {
        const paint = { ...FileAt("physical.png"), correctName: "virtual.png" } as File;
        expect(ResolveGltfCompanionFiles(main, ["textures/virtual.png"], [paint]).get("textures/virtual.png")).toBe(paint);
    });

    it("distinguishes drop-root absolute paths from source-relative paths", () => {
        const absolute = FileAt("paint.png", "textures/paint.png");
        const relative = FileAt("paint.png", "asset/scenes/textures/paint.png");
        const result = ResolveGltfCompanionFiles(main, ["/textures/paint.png", "textures/paint.png"], [absolute, relative]);
        expect([...result.values()]).toEqual([absolute, relative]);
    });

    it("does not reinterpret an absent drop-root resource as a source-relative resource", () => {
        expect(() => ResolveGltfCompanionFiles(main, ["/textures/paint.png"], [FileAt("paint.png", "asset/scenes/textures/paint.png")])).toThrow(
            "Missing companion file for /textures/paint.png"
        );
    });

    it.each(["./textures/paint.png", "textures/./paint.png", "textures/unused/../paint.png", "textures/%70aint.png"])("allows the same resource through %s", (alias) => {
        const paint = FileAt("paint.png", "asset/scenes/textures/paint.png");
        const mapped = ResolveGltfCompanionFiles(main, ["textures/paint.png", alias], [paint]);
        expect([...mapped.values()]).toEqual([paint, paint]);
    });

    it("deduplicates repeated references to the same File object without hiding distinct files", () => {
        const paint = FileAt("paint.png", "asset/scenes/textures/paint.png");
        expect(ResolveGltfCompanionFiles(main, ["textures/paint.png"], [paint, paint]).get("textures/paint.png")).toBe(paint);
        expect(() => ResolveGltfCompanionFiles(main, ["textures/paint.png"], [paint, FileAt("paint.png", paint.webkitRelativePath)])).toThrow("Ambiguous companion file");
    });

    it("rejects different resources that collide in Babylon's case-insensitive virtual file store", () => {
        expect(() => ResolveGltfCompanionFiles(main, ["textures/Paint.png", "textures/paint.png"], [FileAt("Paint.png")])).toThrow("Ambiguous companion file");
    });

    it("does not silently reuse one flat file for two different directory paths", () => {
        const paint = FileAt("paint.png");
        expect(() => ResolveGltfCompanionFiles(main, ["red/paint.png", "blue/paint.png"], [paint])).toThrow("One file matches multiple resource paths");
        const choices = new Map([
            ["red/paint.png", paint],
            ["blue/paint.png", paint],
        ]);
        const mapped = ResolveGltfCompanionFiles(main, ["red/paint.png", "blue/paint.png"], [paint], main.webkitRelativePath, choices);
        expect([...mapped.values()]).toEqual([paint, paint]);
        expect([
            ...ResolveGltfCompanionFiles(main, ["red/paint.png", "blue/paint.png", "./red/paint.png", "./blue/paint.png"], [paint], main.webkitRelativePath, choices).values(),
        ]).toEqual([paint, paint, paint, paint]);
    });

    it.each([false, true])("requires an explicit choice for every ambiguous flat resource before guessing either binding (reverse: %s)", (reverse) => {
        const uris = ["red/paint.png", "blue/paint.png"];
        if (reverse) {
            uris.reverse();
        }
        const paint = FileAt("paint.png");
        let failure: unknown;
        try {
            ResolveGltfCompanionFiles(main, uris, [paint]);
        } catch (error) {
            failure = error;
        }
        expect(failure).toMatchObject({ kind: "ambiguous", uri: uris[0] });
        let retryFailure: unknown;
        try {
            ResolveGltfCompanionFiles(main, uris, [paint], main.webkitRelativePath, new Map([[uris[0], FileAt("chosen.png")]]));
        } catch (error) {
            retryFailure = error;
        }
        expect(retryFailure).toMatchObject({ kind: "ambiguous", uri: uris[1] });
    });

    it("keeps a flat fallback unambiguous when the other same-basename resource has a known path", () => {
        const known = FileAt("paint.png", "asset/scenes/red/paint.png");
        const flat = FileAt("paint.png");
        expect([...ResolveGltfCompanionFiles(main, ["red/paint.png", "blue/paint.png"], [known, flat]).values()]).toEqual([known, flat]);
    });

    it("rejects conflicting explicit choices for equivalent resource paths", () => {
        const first = FileAt("paint.png");
        const second = FileAt("replacement.png");
        expect(() =>
            ResolveGltfCompanionFiles(
                main,
                ["textures/paint.png", "./textures/paint.png"],
                [],
                main.webkitRelativePath,
                new Map([
                    ["textures/paint.png", first],
                    ["./textures/paint.png", second],
                ])
            )
        ).toThrow("Equivalent resource paths have different file choices");
    });

    it.each([false, true])("applies one explicit choice to every URI alias regardless of reference order (reverse: %s)", (reverse) => {
        const original = FileAt("paint.png", "asset/scenes/textures/paint.png");
        const chosen = FileAt("replacement.png");
        const uris = ["textures/paint.png", "./textures/paint.png"];
        if (reverse) {
            uris.reverse();
        }
        const result = ResolveGltfCompanionFiles(main, uris, [original], main.webkitRelativePath, new Map([["./textures/paint.png", chosen]]));
        expect([...result.values()]).toEqual([chosen, chosen]);
    });

    it.each(["textures/red%20paint.png", "textures/Échantillon%20%231%2520.png", "textures/%C3%89chantillon%20%231%2520.png"])(
        "decodes %s exactly once for file matching",
        (uri) => {
            const filename = decodeURIComponent(uri).split("/").pop()!;
            const paint = FileAt(filename, `asset/scenes/textures/${filename}`);
            expect(ResolveGltfCompanionFiles(main, [uri], [paint]).get(uri)).toBe(paint);
            // FileTools lowercases the URL BEFORE decoding it, including percent-encoded capitals.
            expect(GetGltfResourceKeys(uri)).toContain(decodeURIComponent(uri.toLowerCase()));
        }
    );

    it.each(["textures/bad%.png", "textures/%FF.png"])("reports malformed encoding in %s before guessing a basename", (uri) => {
        expect(() => ResolveGltfCompanionFiles(main, [uri], [FileAt("bad%.png")])).toThrow(`Invalid companion resource URI: ${uri}`);
    });

    it("preserves the exact missing URI and recoverable error kind", () => {
        let failure: unknown;
        try {
            ResolveGltfCompanionFiles(main, ["textures/blue%20paint.png"], [FileAt("blue paint.png", "asset/textures/red/blue paint.png")]);
        } catch (error) {
            failure = error;
        }
        expect(failure, "A known wrong-directory file must not be substituted").toBeInstanceOf(GltfCompanionResolutionError);
        expect(failure).toMatchObject({ uri: "textures/blue%20paint.png", kind: "missing" });
    });

    it("retains source-directory matching after the editor replaces the main File", () => {
        const paint = FileAt("paint.png", "asset/textures/paint.png");
        expect(ResolveGltfCompanionFiles(FileAt("assembly-behavior.gltf"), ["../textures/paint.png"], [paint], main.webkitRelativePath).get("../textures/paint.png")).toBe(paint);
    });

    it("does not interpret literal percent sequences in filenames as URI encoding", () => {
        const literal = FileAt("paint%20blue.png", "asset/scenes/textures/paint%20blue.png");
        const space = FileAt("paint blue.png", "asset/scenes/textures/paint blue.png");
        const mapped = ResolveGltfCompanionFiles(main, ["textures/paint%2520blue.png", "textures/paint%20blue.png"], [literal, space]);
        expect([...mapped.values()]).toEqual([literal, space]);
    });
});
