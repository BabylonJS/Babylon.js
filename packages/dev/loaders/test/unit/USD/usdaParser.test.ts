import { describe, expect, it } from "vitest";
import { ParseUsda, ParseUsdaWithDiagnostics, type IUsdaParseDiagnostic } from "loaders/USD/resolution/parser/usda/usdaParser";

const representativeUsda = `#usda 1.0
(
    upAxis = "Z"
    metersPerUnit = 0.01
    defaultPrim = "World"
)

def Xform "World"
{
    float3 xformOp:translate = (1, 2, 3)
    uniform token[] xformOpOrder = ["xformOp:translate"]

    def Mesh "M" (
        prepend references = @other.usd@</Foo>
    )
    {
        point3f[] points = [(0, 0, 0), (1, 0, 0), (1, 1, 0)]
        int[] faceVertexIndices = [0, 1, 2]
        int[] faceVertexCounts = [3]
        texCoord2f[] primvars:st (
            interpolation = "faceVarying"
        ) = [(0, 0), (1, 0), (1, 1)]
        rel material:binding = </World/Mat>

        variantSet "lod" {
            "high" {
                token purpose = "render"
                def Scope "HighGeom" {}
            }
            "low" {
                token purpose = "proxy"
            }
        }
    }

    def Material "Mat" {}
}
`;

describe("USDA parser", () => {
    it("parses representative USDA authoring into an Sdf layer", () => {
        const layer = ParseUsda(representativeUsda, "memory:representative.usda");

        expect(layer.identifier).toBe("memory:representative.usda");
        expect(layer.upAxis).toBe("Z");
        expect(layer.metersPerUnit).toBe(0.01);
        expect(layer.defaultPrim).toBe("World");

        const world = layer.rootPrims[0];
        expect(world.path).toBe("/World");
        expect(world.specifier).toBe("def");
        expect(world.typeName).toBe("Xform");

        const mesh = world.children.find((child) => child.name === "M");
        expect(mesh).toBeDefined();
        expect(mesh?.path).toBe("/World/M");
        expect(mesh?.typeName).toBe("Mesh");

        const points = mesh?.properties.points;
        expect(points?.kind).toBe("attribute");
        if (points?.kind !== "attribute") {
            throw new Error("Expected points to be an attribute");
        }
        expect(points.typeName).toBe("point3f[]");
        expect(points.default?.type).toBe("point3f[]");
        expect(points.default?.value).toEqual([
            [0, 0, 0],
            [1, 0, 0],
            [1, 1, 0],
        ]);

        const xformOpOrder = world.properties.xformOpOrder;
        expect(xformOpOrder?.kind).toBe("attribute");
        if (xformOpOrder?.kind !== "attribute") {
            throw new Error("Expected xformOpOrder to be an attribute");
        }
        expect(xformOpOrder.default).toEqual({ type: "token[]", value: ["xformOp:translate"] });

        expect(mesh?.references?.prepended).toEqual([{ assetPath: "other.usd", primPath: "/Foo" }]);

        const materialBinding = mesh?.properties["material:binding"];
        expect(materialBinding?.kind).toBe("relationship");
        if (materialBinding?.kind !== "relationship") {
            throw new Error("Expected material:binding to be a relationship");
        }
        expect(materialBinding.targets.explicit).toEqual(["/World/Mat"]);

        const primvar = mesh.properties["primvars:st"];
        expect(primvar?.kind).toBe("attribute");
        if (primvar?.kind !== "attribute") {
            throw new Error("Expected primvars:st to be an attribute");
        }
        expect(primvar.interpolation).toBe("faceVarying");

        const lod = mesh.variantSets?.find((variantSet) => variantSet.name === "lod");
        expect(lod).toBeDefined();
        expect(Object.keys(lod?.variants ?? {})).toEqual(["high", "low"]);
        expect(lod?.variants.high.children[0].path).toBe("/World/M/HighGeom");
        expect(lod?.variants.low.properties.purpose.kind).toBe("attribute");
    });

    it("preserves unsafe int64 and uint64 values as bigint", () => {
        const layer = ParseUsda(
            `#usda 1.0
def Xform "Root"
{
    int64 signedValue = -9007199254740993
    uint64 unsignedValue = 18446744073709551615
}`,
            "memory:integers.usda"
        );

        const properties = layer.rootPrims[0].properties;
        expect(properties.signedValue.kind === "attribute" ? properties.signedValue.default : undefined).toEqual({
            type: "int64",
            value: -9007199254740993n,
        });
        expect(properties.unsignedValue.kind === "attribute" ? properties.unsignedValue.default : undefined).toEqual({
            type: "uint64",
            value: 18446744073709551615n,
        });
    });

    it("rejects excessive prim nesting with a controlled parser error", () => {
        const depth = 300;
        const source = `#usda 1.0\n${Array.from({ length: depth }, (_, index) => `def Xform "P${index}" {`).join("\n")}\n${"}\n".repeat(depth)}`;

        expect(() => ParseUsda(source, "memory:deep.usda")).toThrow("nesting depth exceeds");
    });

    it("recovers from malformed reference-list items with bounded diagnostics", () => {
        const result = ParseUsdaWithDiagnostics(
            `#usda 1.0
def Xform "Root" (
    references = [ bogus ]
)
{
}`,
            "memory:malformed-reference.usda"
        );

        expect(result.layer.rootPrims[0].references?.explicit).toEqual([]);
        expect(result.diagnostics).toEqual([
            expect.objectContaining({
                message: "Expected reference or payload target.",
            }),
        ]);
    });
});

function propertiesOf(source: string, identifier = "memory:lexer.usda") {
    const layer = ParseUsda(source, identifier);
    return layer.rootPrims[0].properties;
}

function attributeValue(source: string, propertyName: string): unknown {
    const property = propertiesOf(source)[propertyName];
    if (property?.kind !== "attribute") {
        throw new Error(`Expected '${propertyName}' to be an attribute`);
    }
    return property.default?.value;
}

function stringAttribute(literal: string): unknown {
    return attributeValue(`#usda 1.0\ndef Xform "Root" {\n    string val = ${literal}\n}\n`, "val");
}

function diagnosticsFor(source: string): IUsdaParseDiagnostic[] {
    return ParseUsdaWithDiagnostics(source, "memory:lexer-diagnostics.usda").diagnostics;
}

function numberDiagnostics(literal: string): IUsdaParseDiagnostic[] {
    return diagnosticsFor(`#usda 1.0\ndef Xform "Root" {\n    double val = ${literal}\n}\n`);
}

describe("USDA lexer hardening", () => {
    it.each([
        { literal: `"hello"`, expected: "hello" },
        { literal: `""`, expected: "" },
        { literal: `"tab\\tafter"`, expected: "tab\tafter" },
        { literal: `"newline\\nafter"`, expected: "newline\nafter" },
        { literal: `"escaped\\"quote"`, expected: `escaped"quote` },
        { literal: `"back\\\\slash"`, expected: "back\\slash" },
        { literal: `"""single line triple"""`, expected: "single line triple" },
        { literal: `"""triple\\ttab"""`, expected: "triple\ttab" },
        { literal: `'single quoted'`, expected: "single quoted" },
        { literal: `'escaped\\'apostrophe'`, expected: "escaped'apostrophe" },
        { literal: `'''single line triple'''`, expected: "single line triple" },
        { literal: `'''triple\\'quote'''`, expected: "triple'quote" },
    ])("parses string literal $literal with escapes", ({ literal, expected }) => {
        expect(stringAttribute(literal)).toBe(expected);
    });

    it("parses multi-line triple-quoted strings", () => {
        expect(stringAttribute(`"""line one\nline two"""`)).toBe("line one\nline two");
    });

    it("parses multi-line triple-single-quoted strings", () => {
        expect(stringAttribute(`'''line one\nline two'''`)).toBe("line one\nline two");
    });

    it.each([
        { source: `#usda 1.0\ndef Xform "Root" {\n    string s = "oops\n}\n`, message: "Unterminated string literal." },
        { source: `#usda 1.0\ndef Xform "Root" {\n    string s = """oops\n}\n`, message: "Unterminated triple-quoted string." },
        { source: `#usda 1.0\ndef Xform "Root" {\n    string s = 'oops\n}\n`, message: "Unterminated string literal." },
        { source: `#usda 1.0\ndef Xform "Root" {\n    string s = '''oops\n}\n`, message: "Unterminated triple-quoted string." },
        { source: `#usda 1.0\ndef Xform "Root" {\n    asset a = @tex.png\n}\n`, message: "Unterminated asset reference." },
        { source: `#usda 1.0\ndef Xform "Root" {\n    rel r = </Foo\n}\n`, message: "Unterminated path reference." },
        { source: `#usda 1.0\ndef Xform "Root" {\n}\n/* dangling comment\n`, message: "Unterminated block comment." },
    ])("emits a bounded diagnostic for $message", ({ source, message }) => {
        const diagnostics = diagnosticsFor(source);
        expect(diagnostics).toContainEqual(expect.objectContaining({ message }));
        // Bounded recovery: a single truncated token must not cascade into an unbounded diagnostic flood.
        expect(diagnostics.length).toBeLessThanOrEqual(4);
    });

    it.each([`1e`, `1e+`, `1e-`, `2.5e`, `.5e-`, `10E`])("rejects the malformed exponent %s", (literal) => {
        expect(numberDiagnostics(literal)).toContainEqual(expect.objectContaining({ message: expect.stringContaining("Malformed exponent") }));
    });

    it.each([
        { literal: `1e3`, expected: 1000 },
        { literal: `1.5e-3`, expected: 0.0015 },
        { literal: `2E+2`, expected: 200 },
        { literal: `42`, expected: 42 },
        { literal: `3.14`, expected: 3.14 },
    ])("accepts the well-formed number $literal without an exponent diagnostic", ({ literal, expected }) => {
        expect(numberDiagnostics(literal)).not.toContainEqual(expect.objectContaining({ message: expect.stringContaining("Malformed exponent") }));
        expect(attributeValue(`#usda 1.0\ndef Xform "Root" {\n    double val = ${literal}\n}\n`, "val")).toBeCloseTo(expected, 10);
    });

    it("treats semicolons as statement separators alongside newlines", () => {
        const properties = propertiesOf(`#usda 1.0\ndef Xform "Root" {\n    double a = 1; double b = 2\n    double c = 3\n}\n`);
        expect(properties.a?.kind === "attribute" ? properties.a.default?.value : undefined).toBe(1);
        expect(properties.b?.kind === "attribute" ? properties.b.default?.value : undefined).toBe(2);
        expect(properties.c?.kind === "attribute" ? properties.c.default?.value : undefined).toBe(3);
    });

    it("tolerates hostile whitespace (tabs, CRLF, mixed spacing)", () => {
        const source = '#usda 1.0\ndef\tXform\t"Root"\t{\r\n\t\tdouble\ta\t=\t1\r\n}\r\n';
        const result = ParseUsdaWithDiagnostics(source, "memory:whitespace.usda");
        expect(result.diagnostics).toEqual([]);
        const attribute = result.layer.rootPrims[0].properties.a;
        expect(attribute?.kind === "attribute" ? attribute.default?.value : undefined).toBe(1);
    });

    it("accepts UTF-8 identifiers and string values", () => {
        const properties = propertiesOf(`#usda 1.0\ndef Xform "Root" {\n    string café = "naïve"\n    token 日本 = "x"\n}\n`);
        expect(properties["café"]?.kind === "attribute" ? properties["café"].default?.value : undefined).toBe("naïve");
        expect(properties["日本"]).toBeDefined();
    });

    it("skips '#' comments and legacy '//' comments", () => {
        const source = `#usda 1.0
def Xform "Root" { # trailing hash comment
    double a = 1 // trailing legacy comment
    // full-line legacy comment
    # full-line hash comment
    double b = 2
}
`;
        const result = ParseUsdaWithDiagnostics(source, "memory:comments.usda");
        expect(result.diagnostics).toEqual([]);
        const properties = result.layer.rootPrims[0].properties;
        expect(properties.a?.kind === "attribute" ? properties.a.default?.value : undefined).toBe(1);
        expect(properties.b?.kind === "attribute" ? properties.b.default?.value : undefined).toBe(2);
    });

    it.each([
        { header: `#usda 1.1`, version: "1.1" },
        { header: `#usda 1.2`, version: "1.2" },
        { header: `#usda 2.0`, version: "2.0" },
    ])("rejects unsupported version $version with an explicit message", ({ header, version }) => {
        expect(() => ParseUsda(`${header}\ndef Xform "Root" {\n}\n`, "memory:version.usda")).toThrow(`unsupported USDA version '${version}'`);
    });

    it.each([`#usda 1.0`, `#usda 1.0.1`, `#usda 1.0.32`, `#usda 1.0.234`])("accepts USDA 1.0 header %s including cosmetic patch levels", (header) => {
        const layer = ParseUsda(`${header}\ndef Xform "Root" {\n}\n`, "memory:version-ok.usda");
        expect(layer.rootPrims[0].path).toBe("/Root");
    });

    it("reports a non-USDA document distinctly from an unsupported version", () => {
        expect(() => ParseUsda(`#foo 1.0\ndef Xform "Root" {\n}\n`, "memory:not-usda.usda")).toThrow("not a valid USDA document");
    });
});
