import { describe, expect, it } from "vitest";
import { ParseUsda, ParseUsdaWithDiagnostics } from "loaders/USD/resolution/parser/usda/usdaParser";

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
