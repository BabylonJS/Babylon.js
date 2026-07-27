import { describe, expect, it } from "vitest";
import { NullEngine } from "core/Engines/nullEngine";
import { Scene } from "core/scene";
import { ParseUsda } from "loaders/USD/resolution/parser/usda/usdaParser";
import { MapLayerToResolvedStage } from "loaders/USD/resolution/mapping/stageMapper";
import { USDFileLoader } from "loaders/USD/usdFileLoader";
import { type IResolvedMesh, type IResolvedPrim, type IResolvedStage } from "loaders/USD/resolution/resolvedStage";
import { type ISdfLayer, type ISdfPropertySpec } from "loaders/USD/resolution/sdf";

// Issue #64: the parse-to-Babylon path must validate polygon topology and enforce the polygonal-mesh
// profile. Valid polygons keep mapping; malformed topology and out-of-profile schemas must stop or skip
// with deterministic diagnostics rather than build corrupt/out-of-bounds buffers or silent approximations.

function mapUsda(text: string): IResolvedStage {
    return MapLayerToResolvedStage(ParseUsda(text, "memory:geometry-validation.usda"));
}

function errorsOf(stage: IResolvedStage): string[] {
    return stage.diagnostics.filter((diagnostic) => diagnostic.severity === "error").map((diagnostic) => diagnostic.message);
}

function findPrim(stage: IResolvedStage, name: string): IResolvedPrim | undefined {
    const stack: IResolvedPrim[] = [...stage.root.children];
    while (stack.length > 0) {
        const prim = stack.pop()!;
        if (prim.name === name) {
            return prim;
        }
        stack.push(...prim.children);
    }
    return undefined;
}

function meshByName(stage: IResolvedStage, name: string): IResolvedMesh | undefined {
    const prim = findPrim(stage, name);
    return prim?.meshIndex !== undefined ? stage.meshes[prim.meshIndex] : undefined;
}

describe("USD geometry profile validation", () => {
    describe("valid polygon meshes still map", () => {
        it("maps triangles, quads, and n-gons", () => {
            const stage = mapUsda(`#usda 1.0
def Mesh "Tri"
{
    uniform token subdivisionScheme = "none"
    int[] faceVertexCounts = [3]
    int[] faceVertexIndices = [0, 1, 2]
    point3f[] points = [(0, 0, 0), (1, 0, 0), (0, 1, 0)]
}
def Mesh "Quad"
{
    uniform token subdivisionScheme = "none"
    int[] faceVertexCounts = [4]
    int[] faceVertexIndices = [0, 1, 2, 3]
    point3f[] points = [(-1, -1, 0), (1, -1, 0), (1, 1, 0), (-1, 1, 0)]
}
def Mesh "Ngon"
{
    uniform token subdivisionScheme = "none"
    int[] faceVertexCounts = [5]
    int[] faceVertexIndices = [0, 1, 2, 3, 4]
    point3f[] points = [(0, 0, 0), (2, 0, 0), (2, 2, 0), (1, 3, 0), (0, 2, 0)]
}
`);

            expect(errorsOf(stage)).toHaveLength(0);
            expect(meshByName(stage, "Tri")!.indices).toHaveLength(3);
            expect(meshByName(stage, "Quad")!.indices).toHaveLength(6);
            expect(meshByName(stage, "Ngon")!.indices).toHaveLength(9);
        });

        it("preserves authored face-varying normals", () => {
            const stage = mapUsda(`#usda 1.0
def Mesh "FaceVarying"
{
    uniform token subdivisionScheme = "none"
    int[] faceVertexCounts = [4]
    int[] faceVertexIndices = [0, 1, 2, 3]
    point3f[] points = [(-1, -1, 0), (1, -1, 0), (1, 1, 0), (-1, 1, 0)]
    normal3f[] normals = [(0, 0, 1), (0, 0, 1), (0, 0, 1), (0, 0, 1)] (interpolation = "faceVarying")
}
`);

            expect(errorsOf(stage)).toHaveLength(0);
            expect(meshByName(stage, "FaceVarying")!.normals).toBeDefined();
        });

        it("preserves face-range material subsets", () => {
            const stage = mapUsda(`#usda 1.0
def Xform "World"
{
    def Mesh "Quad"
    {
        uniform token subdivisionScheme = "none"
        int[] faceVertexCounts = [3, 3]
        int[] faceVertexIndices = [0, 1, 2, 0, 2, 3]
        point3f[] points = [(-1, -1, 0), (1, -1, 0), (1, 1, 0), (-1, 1, 0)]

        def GeomSubset "First"
        {
            uniform token elementType = "face"
            int[] indices = [0]
            rel material:binding = </World/Mat>
        }
    }

    def Material "Mat"
    {
        def Shader "Preview"
        {
            uniform token info:id = "UsdPreviewSurface"
        }
    }
}
`);

            expect(errorsOf(stage)).toHaveLength(0);
            const subsets = meshByName(stage, "Quad")!.geomSubsets;
            expect(subsets).toBeDefined();
            expect(subsets!.length).toBeGreaterThanOrEqual(1);
            expect(subsets![0].materialIndex).toBeGreaterThanOrEqual(0);
        });
    });

    describe("malformed topology is skipped with an error diagnostic", () => {
        it("rejects a face index outside the point range", () => {
            const stage = mapUsda(`#usda 1.0
def Mesh "Oob"
{
    uniform token subdivisionScheme = "none"
    int[] faceVertexCounts = [3]
    int[] faceVertexIndices = [0, 1, 5]
    point3f[] points = [(0, 0, 0), (1, 0, 0), (0, 1, 0)]
}
`);

            expect(stage.meshes).toHaveLength(0);
            expect(errorsOf(stage).some((message) => /out of range/i.test(message))).toBe(true);
        });

        it("rejects a negative face index", () => {
            const stage = mapUsda(`#usda 1.0
def Mesh "Negative"
{
    uniform token subdivisionScheme = "none"
    int[] faceVertexCounts = [3]
    int[] faceVertexIndices = [0, 1, -1]
    point3f[] points = [(0, 0, 0), (1, 0, 0), (0, 1, 0)]
}
`);

            expect(stage.meshes).toHaveLength(0);
            expect(errorsOf(stage).some((message) => /out of range/i.test(message))).toBe(true);
        });

        it("rejects a faceVertexCounts sum that disagrees with the index count", () => {
            const stage = mapUsda(`#usda 1.0
def Mesh "Mismatch"
{
    uniform token subdivisionScheme = "none"
    int[] faceVertexCounts = [4]
    int[] faceVertexIndices = [0, 1, 2]
    point3f[] points = [(0, 0, 0), (1, 0, 0), (0, 1, 0), (1, 1, 0)]
}
`);

            expect(stage.meshes).toHaveLength(0);
            expect(errorsOf(stage).some((message) => /does not match/i.test(message))).toBe(true);
        });

        it("rejects non-finite point coordinates", () => {
            const stage = mapUsda(`#usda 1.0
def Mesh "Overflow"
{
    uniform token subdivisionScheme = "none"
    int[] faceVertexCounts = [3]
    int[] faceVertexIndices = [0, 1, 2]
    point3f[] points = [(1e400, 0, 0), (1, 0, 0), (0, 1, 0)]
}
`);

            expect(stage.meshes).toHaveLength(0);
            expect(errorsOf(stage).some((message) => /non-finite/i.test(message))).toBe(true);
        });

        it("rejects non-integer face indices at the map seam", () => {
            const property = (typeName: string, value: unknown): ISdfPropertySpec => ({ kind: "attribute", typeName, default: { type: typeName, value } }) as ISdfPropertySpec;
            const layer: ISdfLayer = {
                identifier: "memory:non-integer.usda",
                subLayers: [],
                rootPrims: [
                    {
                        name: "Fractional",
                        path: "/Fractional",
                        specifier: "def",
                        typeName: "Mesh",
                        properties: {
                            subdivisionScheme: property("token", "none"),
                            faceVertexCounts: property("int[]", [3]),
                            faceVertexIndices: property("int[]", [0, 1, 2.5]),
                            points: property("point3f[]", [
                                [0, 0, 0],
                                [1, 0, 0],
                                [0, 1, 0],
                            ]),
                        },
                        children: [],
                    },
                ],
            };

            const stage = MapLayerToResolvedStage(layer);

            expect(stage.meshes).toHaveLength(0);
            expect(errorsOf(stage).some((message) => /out of range/i.test(message))).toBe(true);
        });
    });

    describe("primvar cardinality and finiteness", () => {
        it("drops an under-provisioned authored primvar with a warning instead of fabricating values", () => {
            const stage = mapUsda(`#usda 1.0
def Mesh "BadNormals"
{
    uniform token subdivisionScheme = "none"
    int[] faceVertexCounts = [4]
    int[] faceVertexIndices = [0, 1, 2, 3]
    point3f[] points = [(-1, -1, 0), (1, -1, 0), (1, 1, 0), (-1, 1, 0)]
    normal3f[] normals = [(0, 0, 1), (0, 0, 1)] (interpolation = "vertex")
}
`);

            expect(errorsOf(stage)).toHaveLength(0);
            const mesh = meshByName(stage, "BadNormals");
            expect(mesh).toBeDefined();
            expect(mesh!.normals).toBeUndefined();
            expect(stage.diagnostics.some((diagnostic) => diagnostic.severity === "warning" && /normals/i.test(diagnostic.message))).toBe(true);
        });

        it("drops a primvar whose indices are fractional instead of truncating them", () => {
            const property = (typeName: string, value: unknown): ISdfPropertySpec => ({ kind: "attribute", typeName, default: { type: typeName, value } }) as ISdfPropertySpec;
            const layer: ISdfLayer = {
                identifier: "memory:fractional-primvar.usda",
                subLayers: [],
                rootPrims: [
                    {
                        name: "IndexedNormals",
                        path: "/IndexedNormals",
                        specifier: "def",
                        typeName: "Mesh",
                        properties: {
                            subdivisionScheme: property("token", "none"),
                            faceVertexCounts: property("int[]", [4]),
                            faceVertexIndices: property("int[]", [0, 1, 2, 3]),
                            points: property("point3f[]", [
                                [-1, -1, 0],
                                [1, -1, 0],
                                [1, 1, 0],
                                [-1, 1, 0],
                            ]),
                            normals: property("normal3f[]", [
                                [0, 0, 1],
                                [0, 0, 1],
                                [0, 0, 1],
                                [0, 0, 1],
                            ]),
                            "normals:indices": property("int[]", [0, 1, 2, 3.5]),
                        },
                        children: [],
                    },
                ],
            };

            const stage = MapLayerToResolvedStage(layer);

            const mesh = meshByName(stage, "IndexedNormals");
            expect(mesh).toBeDefined();
            expect(mesh!.normals).toBeUndefined();
            expect(stage.diagnostics.some((diagnostic) => diagnostic.severity === "warning" && /normals/i.test(diagnostic.message))).toBe(true);
        });

        it("drops an authored primvar with a non-finite value component", () => {
            const stage = mapUsda(`#usda 1.0
def Mesh "InfNormals"
{
    uniform token subdivisionScheme = "none"
    int[] faceVertexCounts = [4]
    int[] faceVertexIndices = [0, 1, 2, 3]
    point3f[] points = [(-1, -1, 0), (1, -1, 0), (1, 1, 0), (-1, 1, 0)]
    normal3f[] normals = [(1e400, 0, 1), (0, 0, 1), (0, 0, 1), (0, 0, 1)] (interpolation = "faceVarying")
}
`);

            expect(errorsOf(stage)).toHaveLength(0);
            const mesh = meshByName(stage, "InfNormals");
            expect(mesh).toBeDefined();
            expect(mesh!.normals).toBeUndefined();
            expect(stage.diagnostics.some((diagnostic) => diagnostic.severity === "warning" && /non-finite/i.test(diagnostic.message))).toBe(true);
        });
    });

    describe("subdivision fidelity policy", () => {
        it("flags the unauthored catmullClark default as a non-silent approximation", () => {
            const stage = mapUsda(`#usda 1.0
def Mesh "Subd"
{
    int[] faceVertexCounts = [3]
    int[] faceVertexIndices = [0, 1, 2]
    point3f[] points = [(0, 0, 0), (1, 0, 0), (0, 1, 0)]
}
`);

            const subdivision = stage.diagnostics.find((diagnostic) => /subdivision/i.test(diagnostic.message));
            expect(subdivision).toBeDefined();
            expect(subdivision!.severity).toBe("info");
            expect(subdivision!.message).toMatch(/catmullClark/i);
            expect(meshByName(stage, "Subd")).toBeDefined();
        });

        it("stays silent when the mesh opts into a polygonal profile with subdivisionScheme none", () => {
            const stage = mapUsda(`#usda 1.0
def Mesh "Poly"
{
    uniform token subdivisionScheme = "none"
    int[] faceVertexCounts = [3]
    int[] faceVertexIndices = [0, 1, 2]
    point3f[] points = [(0, 0, 0), (1, 0, 0), (0, 1, 0)]
}
`);

            expect(stage.diagnostics.some((diagnostic) => /subdivision/i.test(diagnostic.message))).toBe(false);
        });
    });

    describe("out-of-profile renderable schemas", () => {
        it("skips curves, points, and volumes with profile-specific diagnostics", () => {
            const stage = mapUsda(`#usda 1.0
def BasisCurves "Curve"
{
    int[] curveVertexCounts = [4]
    point3f[] points = [(0, 0, 0), (1, 0, 0), (2, 0, 0), (3, 0, 0)]
}
def Points "Cloud"
{
    point3f[] points = [(0, 0, 0), (1, 0, 0)]
}
def Volume "Fog"
{
}
`);

            expect(stage.meshes).toHaveLength(0);
            const messages = stage.diagnostics.map((diagnostic) => diagnostic.message);
            expect(messages.some((message) => /BasisCurves/.test(message) && /skipped/i.test(message))).toBe(true);
            expect(messages.some((message) => /Points/.test(message) && /skipped/i.test(message))).toBe(true);
            expect(messages.some((message) => /Volume/.test(message) && /skipped/i.test(message))).toBe(true);
        });
    });

    describe("GeomSubset face-index validation", () => {
        it("skips a subset with fractional or out-of-range face indices without dropping the mesh", () => {
            const oobStage = mapUsda(`#usda 1.0
def Xform "World"
{
    def Mesh "Quad"
    {
        uniform token subdivisionScheme = "none"
        int[] faceVertexCounts = [3, 3]
        int[] faceVertexIndices = [0, 1, 2, 0, 2, 3]
        point3f[] points = [(-1, -1, 0), (1, -1, 0), (1, 1, 0), (-1, 1, 0)]

        def GeomSubset "Valid"
        {
            uniform token elementType = "face"
            int[] indices = [0]
            rel material:binding = </World/Mat>
        }
        def GeomSubset "Oob"
        {
            uniform token elementType = "face"
            int[] indices = [99]
            rel material:binding = </World/Mat>
        }
    }

    def Material "Mat"
    {
        def Shader "Preview"
        {
            uniform token info:id = "UsdPreviewSurface"
        }
    }
}
`);

            const oobMesh = meshByName(oobStage, "Quad");
            expect(oobMesh).toBeDefined();
            expect(oobMesh!.geomSubsets).toHaveLength(1);
            expect(oobStage.diagnostics.some((diagnostic) => diagnostic.severity === "warning" && /GeomSubset/i.test(diagnostic.message) && /99/.test(diagnostic.message))).toBe(
                true
            );

            // The parser truncates real int[], so a fractional face index is exercised through a manual Sdf layer.
            const property = (typeName: string, value: unknown): ISdfPropertySpec => ({ kind: "attribute", typeName, default: { type: typeName, value } }) as ISdfPropertySpec;
            const binding = (target: string): ISdfPropertySpec => ({ kind: "relationship", targets: { isExplicit: true, explicit: [target] } }) as ISdfPropertySpec;
            const layer: ISdfLayer = {
                identifier: "memory:fractional-subset.usda",
                subLayers: [],
                rootPrims: [
                    {
                        name: "Quad",
                        path: "/Quad",
                        specifier: "def",
                        typeName: "Mesh",
                        properties: {
                            subdivisionScheme: property("token", "none"),
                            faceVertexCounts: property("int[]", [3, 3]),
                            faceVertexIndices: property("int[]", [0, 1, 2, 0, 2, 3]),
                            points: property("point3f[]", [
                                [-1, -1, 0],
                                [1, -1, 0],
                                [1, 1, 0],
                                [-1, 1, 0],
                            ]),
                        },
                        children: [
                            {
                                name: "Fractional",
                                path: "/Quad/Fractional",
                                specifier: "def",
                                typeName: "GeomSubset",
                                properties: {
                                    elementType: property("token", "face"),
                                    indices: property("int[]", [1.5]),
                                    "material:binding": binding("/Quad/Mat"),
                                },
                                children: [],
                            },
                        ],
                    },
                ],
            };

            const fractionalStage = MapLayerToResolvedStage(layer);

            const fractionalMesh = meshByName(fractionalStage, "Quad");
            expect(fractionalMesh).toBeDefined();
            expect(fractionalMesh!.geomSubsets).toBeUndefined();
            expect(
                fractionalStage.diagnostics.some((diagnostic) => diagnostic.severity === "warning" && /GeomSubset/i.test(diagnostic.message) && /1\.5/.test(diagnostic.message))
            ).toBe(true);
        });
    });

    describe("NullEngine adapter safety", () => {
        it("skips malformed geometry without crashing and still loads valid meshes", async () => {
            const engine = new NullEngine();
            const scene = new Scene(engine);
            const loader = new USDFileLoader();

            const result = await loader.importMeshAsync(
                null,
                scene,
                `#usda 1.0
def Mesh "Good"
{
    uniform token subdivisionScheme = "none"
    int[] faceVertexCounts = [4]
    int[] faceVertexIndices = [0, 1, 2, 3]
    point3f[] points = [(-1, -1, 0), (1, -1, 0), (1, 1, 0), (-1, 1, 0)]
}
def Mesh "Bad"
{
    uniform token subdivisionScheme = "none"
    int[] faceVertexCounts = [4]
    int[] faceVertexIndices = [0, 1, 2, 99]
    point3f[] points = [(-1, -1, 0), (1, -1, 0), (1, 1, 0), (-1, 1, 0)]
}
`,
                ""
            );

            const good = result.meshes.find((mesh) => mesh.name === "Good");
            const bad = result.meshes.find((mesh) => mesh.name === "Bad");
            expect(good).toBeDefined();
            expect(bad).toBeUndefined();
            expect(Array.from(good!.getVerticesData("position")!).every((value) => Number.isFinite(value))).toBe(true);

            scene.dispose();
            engine.dispose();
        });
    });
});
