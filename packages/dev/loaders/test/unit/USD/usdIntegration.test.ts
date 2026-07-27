import { describe, expect, it } from "vitest";
import * as fflate from "fflate";
import { NullEngine } from "core/Engines/nullEngine";
import { type AbstractMesh } from "core/Meshes/abstractMesh";
import { Scene } from "core/scene";
import { PBRMaterial } from "core/Materials/PBR/pbrMaterial.pure";
import { USDFileLoader } from "loaders/USD/usdFileLoader";
import { ResolveUsdStageWithFetcherAsync } from "loaders/USD/resolution/usdResolver";
import { AdaptResolvedStageToScene } from "loaders/USD/adapter/usdAdapter";

// Root layer references a prim from a separate child layer. Composing this offline (with no real file
// IO) is something the browser-side three.js loader cannot do; the injectable fetcher makes it testable.
const rootUsda = `#usda 1.0
(
    upAxis = "Y"
    metersPerUnit = 1
)

def Xform "World"
{
    def "Ref" (
        prepend references = @./child.usda@</Shape>
    )
    {
    }
}
`;

const childUsda = `#usda 1.0

def Mesh "Shape"
{
    int[] faceVertexCounts = [4]
    int[] faceVertexIndices = [0, 1, 2, 3]
    point3f[] points = [(-1, -1, 0), (1, -1, 0), (1, 1, 0), (-1, 1, 0)]
}
`;

// Single layer binding a mesh to a UsdPreviewSurface material, used to exercise the walk's material
// binding end to end through the public loader.
const materialUsda = `#usda 1.0
(
    upAxis = "Y"
    metersPerUnit = 1
)

def Xform "World"
{
    def Mesh "Quad"
    {
        int[] faceVertexCounts = [4]
        int[] faceVertexIndices = [0, 1, 2, 3]
        point3f[] points = [(-1, -1, 0), (1, -1, 0), (1, 1, 0), (-1, 1, 0)]
        rel material:binding = </World/Mat>
    }

    def Material "Mat"
    {
        def Shader "Preview"
        {
            uniform token info:id = "UsdPreviewSurface"
            color3f inputs:diffuseColor = (0.1, 0.2, 0.3)
            float inputs:metallic = 0.25
            float inputs:roughness = 0.6
        }
    }
}
`;

const subsetMaterialUsda = `#usda 1.0
def Xform "World"
{
    def Mesh "Quad"
    {
        int[] faceVertexCounts = [3, 3]
        int[] faceVertexIndices = [0, 1, 2, 0, 2, 3]
        point3f[] points = [(-1, -1, 0), (1, -1, 0), (1, 1, 0), (-1, 1, 0)]
        uniform token subdivisionScheme = "none"

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
`;

// Root layer whose reference points at a sub-directory asset path. When the stage is loaded from a
// flat drag-and-drop set (rootUrl "file:"), Babylon stores every dropped file in FilesInputStore by
// basename, so the loader must address the sibling as `file:child.usda`, not `file:assets/child.usda`.
const fileSchemeRootUsda = `#usda 1.0
(
    upAxis = "Y"
    metersPerUnit = 1
)

def Xform "World"
{
    def "Ref" (
        prepend references = @./assets/child.usda@</Shape>
    )
    {
    }
}
`;

// Single layer whose UsdPreviewSurface diffuse is driven by a UsdUVTexture pointing at a sub-directory
// asset path, used to prove texture references resolve to `file:<basename>` under the dropped-file scheme.
const fileSchemeTextureUsda = `#usda 1.0
(
    upAxis = "Y"
    metersPerUnit = 1
)

def Xform "World"
{
    def Mesh "Quad"
    {
        int[] faceVertexCounts = [4]
        int[] faceVertexIndices = [0, 1, 2, 3]
        point3f[] points = [(-1, -1, 0), (1, -1, 0), (1, 1, 0), (-1, 1, 0)]
        texCoord2f[] primvars:st = [(0, 0), (1, 0), (1, 1), (0, 1)] (interpolation = "vertex")
        rel material:binding = </World/Mat>
    }

    def Material "Mat"
    {
        token outputs:surface.connect = </World/Mat/Preview.outputs:surface>

        def Shader "Preview"
        {
            uniform token info:id = "UsdPreviewSurface"
            color3f inputs:diffuseColor.connect = </World/Mat/Albedo.outputs:rgb>
            float inputs:metallic = 0
            float inputs:roughness = 0.5
            token outputs:surface
        }

        def Shader "Albedo"
        {
            uniform token info:id = "UsdUVTexture"
            asset inputs:file = @textures/Albedo.png@
            float2 inputs:st.connect = </World/Mat/Reader.outputs:result>
            float3 outputs:rgb
        }

        def Shader "Reader"
        {
            uniform token info:id = "UsdPrimvarReader_float2"
            token inputs:varname = "st"
            float2 outputs:result
        }
    }
}
`;

// A textured material whose UsdUVTexture addresses an archive-relative asset with a leading "./".
// Used to prove a USDZ-embedded image both resolves to its archive key (the "./" is normalized away)
// and has its bytes inlined onto the resolved texture, since Babylon cannot fetch an archive-internal
// path by URL.
const usdzTextureUsda = `#usda 1.0
(
    upAxis = "Y"
    metersPerUnit = 1
)

def Xform "World"
{
    def Mesh "Quad"
    {
        int[] faceVertexCounts = [4]
        int[] faceVertexIndices = [0, 1, 2, 3]
        point3f[] points = [(-1, -1, 0), (1, -1, 0), (1, 1, 0), (-1, 1, 0)]
        texCoord2f[] primvars:st = [(0, 0), (1, 0), (1, 1), (0, 1)] (interpolation = "vertex")
        rel material:binding = </World/Mat>
    }

    def Material "Mat"
    {
        token outputs:surface.connect = </World/Mat/Preview.outputs:surface>

        def Shader "Preview"
        {
            uniform token info:id = "UsdPreviewSurface"
            color3f inputs:diffuseColor.connect = </World/Mat/Albedo.outputs:rgb>
            token outputs:surface
        }

        def Shader "Albedo"
        {
            uniform token info:id = "UsdUVTexture"
            asset inputs:file = @./textures/tiny.png@
            float3 outputs:rgb
        }
    }
}
`;

// A DistantLight and a Camera in one stage, exercising the UsdLux/UsdGeomCamera schema mappings all
// the way through to real Babylon Light and Camera objects via the public loader.
const lightCameraUsda = `#usda 1.0
(
    upAxis = "Y"
    metersPerUnit = 1
)

def Xform "World"
{
    def DistantLight "Sun"
    {
        color3f inputs:color = (1, 0.9, 0.8)
        float inputs:intensity = 2
    }

    def Camera "Cam"
    {
        token projection = "perspective"
        float focalLength = 50
        float2 clippingRange = (0.1, 1000)
    }
}
`;

const geometricPrimitivesUsda = `#usda 1.0
(
    upAxis = "Y"
    metersPerUnit = 1
)

def Cube "Cube"
{
}

def Sphere "Sphere"
{
}

def Cylinder "Cylinder"
{
}

def Cone "Cone"
{
}

def Capsule "Capsule"
{
}
`;

const authoredGeometricPrimitivesUsda = `#usda 1.0
(
    upAxis = "Y"
    metersPerUnit = 1
)

def Xform "World"
{
    rel material:binding = </World/Material>

    def Cube "Cube"
    {
        double size = 4
    }

    def Sphere "Sphere"
    {
        double radius = 0.25
    }

    def Cylinder "Cylinder"
    {
        double radius = 0.5
        double height = 4
        uniform token axis = "X"
    }

    def Cone "Cone"
    {
        double radius = 1.5
        double height = 6
        uniform token axis = "Y"
    }

    def Capsule "Capsule"
    {
        double radius = 0.75
        double height = 2
        uniform token axis = "X"
    }

    def Material "Material"
    {
        def Shader "Preview"
        {
            uniform token info:id = "UsdPreviewSurface"
            color3f inputs:diffuseColor = (0.2, 0.4, 0.8)
        }
    }
}
`;

function expectMeshExtents(mesh: AbstractMesh, minimum: readonly number[], maximum: readonly number[]): void {
    const bounds = mesh.getBoundingInfo().boundingBox;
    for (let component = 0; component < 3; component++) {
        expect(bounds.minimum.asArray()[component]).toBeCloseTo(minimum[component]);
        expect(bounds.maximum.asArray()[component]).toBeCloseTo(maximum[component]);
    }
}

function getTriangleAreaSquared(positions: Float32Array, first: number, second: number, third: number): number {
    const firstOffset = first * 3;
    const secondOffset = second * 3;
    const thirdOffset = third * 3;
    const abX = positions[secondOffset] - positions[firstOffset];
    const abY = positions[secondOffset + 1] - positions[firstOffset + 1];
    const abZ = positions[secondOffset + 2] - positions[firstOffset + 2];
    const acX = positions[thirdOffset] - positions[firstOffset];
    const acY = positions[thirdOffset + 1] - positions[firstOffset + 1];
    const acZ = positions[thirdOffset + 2] - positions[firstOffset + 2];
    const crossX = abY * acZ - abZ * acY;
    const crossY = abZ * acX - abX * acZ;
    const crossZ = abX * acY - abY * acX;
    return crossX * crossX + crossY * crossY + crossZ * crossZ;
}

function getTriangleNormalAlignment(positions: Float32Array, normals: Float32Array, first: number, second: number, third: number): number {
    const firstOffset = first * 3;
    const secondOffset = second * 3;
    const thirdOffset = third * 3;
    const abX = positions[secondOffset] - positions[firstOffset];
    const abY = positions[secondOffset + 1] - positions[firstOffset + 1];
    const abZ = positions[secondOffset + 2] - positions[firstOffset + 2];
    const acX = positions[thirdOffset] - positions[firstOffset];
    const acY = positions[thirdOffset + 1] - positions[firstOffset + 1];
    const acZ = positions[thirdOffset + 2] - positions[firstOffset + 2];
    const crossX = abY * acZ - abZ * acY;
    const crossY = abZ * acX - abX * acZ;
    const crossZ = abX * acY - abY * acX;
    const normalX = normals[firstOffset] + normals[secondOffset] + normals[thirdOffset];
    const normalY = normals[firstOffset + 1] + normals[secondOffset + 1] + normals[thirdOffset + 1];
    const normalZ = normals[firstOffset + 2] + normals[secondOffset + 2] + normals[thirdOffset + 2];
    return crossX * normalX + crossY * normalY + crossZ * normalZ;
}

describe("USD loader integration", () => {
    it("imports USD geometric schemas with their default extents", async () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        const loader = new USDFileLoader();

        const result = await loader.importMeshAsync(null, scene, geometricPrimitivesUsda, "");

        const expectedExtents = [
            { name: "Cube", minimum: [-1, -1, -1], maximum: [1, 1, 1] },
            { name: "Sphere", minimum: [-1, -1, -1], maximum: [1, 1, 1] },
            { name: "Cylinder", minimum: [-1, -1, -1], maximum: [1, 1, 1] },
            { name: "Cone", minimum: [-1, -1, -1], maximum: [1, 1, 1] },
            { name: "Capsule", minimum: [-0.5, -0.5, -1], maximum: [0.5, 0.5, 1] },
        ];
        for (const expected of expectedExtents) {
            const mesh = result.meshes.find((candidate) => candidate.name === expected.name);
            expect(mesh, `${expected.name} should produce a mesh`).toBeDefined();
            expectMeshExtents(mesh!, expected.minimum, expected.maximum);
        }

        scene.dispose();
        engine.dispose();
    });

    it("applies authored dimensions, axes, and inherited materials to USD geometric schemas", async () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        const loader = new USDFileLoader();

        const result = await loader.importMeshAsync(null, scene, authoredGeometricPrimitivesUsda, "");

        const expectedExtents = [
            { name: "Cube", minimum: [-2, -2, -2], maximum: [2, 2, 2] },
            { name: "Sphere", minimum: [-0.25, -0.25, -0.25], maximum: [0.25, 0.25, 0.25] },
            { name: "Cylinder", minimum: [-2, -0.5, -0.5], maximum: [2, 0.5, 0.5] },
            { name: "Cone", minimum: [-1.5, -3, -1.5], maximum: [1.5, 3, 1.5] },
            { name: "Capsule", minimum: [-1.75, -0.75, -0.75], maximum: [1.75, 0.75, 0.75] },
        ];
        for (const expected of expectedExtents) {
            const mesh = result.meshes.find((candidate) => candidate.name === expected.name);
            expect(mesh, `${expected.name} should produce a mesh`).toBeDefined();
            expectMeshExtents(mesh!, expected.minimum, expected.maximum);
            expect(mesh!.material).toBeInstanceOf(PBRMaterial);
            expect((mesh!.material as PBRMaterial).albedoColor.asArray()).toEqual([0.2, 0.4, 0.8]);
        }

        scene.dispose();
        engine.dispose();
    });

    it("does not emit zero-area triangles for positive-size USD geometric schemas", async () => {
        const stage = await ResolveUsdStageWithFetcherAsync(geometricPrimitivesUsda, "", "primitives.usda", {}, async (identifier) => {
            throw new Error(`No external layers expected, but requested: ${identifier}`);
        });

        for (const mesh of stage.meshes) {
            for (let offset = 0; offset < mesh.indices.length; offset += 3) {
                const first = mesh.indices[offset];
                const second = mesh.indices[offset + 1];
                const third = mesh.indices[offset + 2];
                expect(getTriangleAreaSquared(mesh.positions, first, second, third)).toBeGreaterThan(1e-12);
                expect(getTriangleNormalAlignment(mesh.positions, mesh.normals!, first, second, third)).toBeGreaterThan(0);
            }
        }
    });

    it("preserves left-handed orientation and double-sided state on intrinsic geometry", async () => {
        const stage = await ResolveUsdStageWithFetcherAsync(
            `#usda 1.0
def Cube "InsideOut"
{
    uniform token orientation = "leftHanded"
    uniform bool doubleSided = true
}
`,
            "",
            "orientation.usda",
            {},
            async (identifier) => {
                throw new Error(`No external layers expected, but requested: ${identifier}`);
            }
        );

        const mesh = stage.meshes[0];
        const first = mesh.indices[0] * 3;
        const second = mesh.indices[1] * 3;
        const third = mesh.indices[2] * 3;
        const abX = mesh.positions[second] - mesh.positions[first];
        const abY = mesh.positions[second + 1] - mesh.positions[first + 1];
        const acX = mesh.positions[third] - mesh.positions[first];
        const acY = mesh.positions[third + 1] - mesh.positions[first + 1];
        const geometricNormalZ = abX * acY - abY * acX;

        expect(mesh.orientation).toBe("leftHanded");
        expect(mesh.doubleSided).toBe(true);
        expect(geometricNormalZ * mesh.normals![first + 2]).toBeLessThan(0);
    });

    it("uses framesPerSecond when timeCodesPerSecond is absent", async () => {
        const stage = await ResolveUsdStageWithFetcherAsync(
            `#usda 1.0
(
    framesPerSecond = 60
)

def Xform "Animated"
{
    double3 xformOp:translate.timeSamples = {
        0: (0, 0, 0),
        60: (1, 0, 0),
    }
    uniform token[] xformOpOrder = ["xformOp:translate"]
}
`,
            "",
            "animation.usda",
            {},
            async (identifier) => {
                throw new Error(`No external layers expected, but requested: ${identifier}`);
            }
        );

        expect(stage.metadata.timeCodesPerSecond).toBe(60);
        expect(Array.from(stage.root.children[0].animation!.tracks[0].times)).toEqual([0, 1]);
    });

    it("prefers timeCodesPerSecond over framesPerSecond", async () => {
        const stage = await ResolveUsdStageWithFetcherAsync(
            `#usda 1.0
(
    framesPerSecond = 24
    timeCodesPerSecond = 60
)

def Xform "Animated"
{
    double3 xformOp:translate.timeSamples = {
        0: (0, 0, 0),
        60: (1, 0, 0),
    }
    uniform token[] xformOpOrder = ["xformOp:translate"]
}
`,
            "",
            "animation.usda",
            {},
            async (identifier) => {
                throw new Error(`No external layers expected, but requested: ${identifier}`);
            }
        );

        expect(stage.metadata.timeCodesPerSecond).toBe(60);
        expect(Array.from(stage.root.children[0].animation!.tracks[0].times)).toEqual([0, 1]);
    });

    it("preserves authored face-varying normals through triangulation", async () => {
        const stage = await ResolveUsdStageWithFetcherAsync(
            `#usda 1.0
def Mesh "AuthoredNormals"
{
    uniform token subdivisionScheme = "none"
    int[] faceVertexCounts = [4]
    int[] faceVertexIndices = [0, 1, 2, 3]
    point3f[] points = [(-1, -1, 0), (1, -1, 0), (1, 1, 0), (-1, 1, 0)]
    normal3f[] normals = [(0, 1, 0), (0, 1, 0), (0, 1, 0), (0, 1, 0)] (
        interpolation = "faceVarying"
    )
}
`,
            "",
            "normals.usda",
            {},
            async (identifier) => {
                throw new Error(`No external layers expected, but requested: ${identifier}`);
            }
        );

        const normals = Array.from(stage.meshes[0].normals!);
        expect(normals).toHaveLength(12);
        for (let offset = 0; offset < normals.length; offset += 3) {
            expect(normals.slice(offset, offset + 3)).toEqual([0, 1, 0]);
        }
    });

    it("triangulates concave polygon faces without filling the concavity", async () => {
        const stage = await ResolveUsdStageWithFetcherAsync(
            `#usda 1.0
def Mesh "Concave"
{
    uniform token subdivisionScheme = "none"
    int[] faceVertexCounts = [8]
    int[] faceVertexIndices = [0, 1, 2, 3, 4, 5, 6, 7]
    point3f[] points = [(0, 0, 0), (3, 0, 0), (3, 3, 0), (2, 3, 0), (2, 1, 0), (1, 1, 0), (1, 3, 0), (0, 3, 0)]
    normal3f[] normals = [(0, 0, 1), (1, 0, 1), (2, 0, 1), (3, 0, 1), (4, 0, 1), (5, 0, 1), (6, 0, 1), (7, 0, 1)] (
        interpolation = "faceVarying"
    )
}
`,
            "",
            "concave.usda",
            {},
            async (identifier) => {
                throw new Error(`No external layers expected, but requested: ${identifier}`);
            }
        );

        const mesh = stage.meshes[0];
        let triangulatedArea = 0;
        for (let offset = 0; offset < mesh.indices.length; offset += 3) {
            const pointA = mesh.indices[offset] * 3;
            const pointB = mesh.indices[offset + 1] * 3;
            const pointC = mesh.indices[offset + 2] * 3;
            triangulatedArea +=
                Math.abs(
                    (mesh.positions[pointB] - mesh.positions[pointA]) * (mesh.positions[pointC + 1] - mesh.positions[pointA + 1]) -
                        (mesh.positions[pointB + 1] - mesh.positions[pointA + 1]) * (mesh.positions[pointC] - mesh.positions[pointA])
                ) / 2;
        }

        expect(mesh.indices).toHaveLength(18);
        expect(triangulatedArea).toBeCloseTo(7);
        expect(mesh.sourcePointIndices).toBeDefined();
        for (let vertex = 0; vertex < mesh.sourcePointIndices!.length; vertex++) {
            expect(mesh.normals![vertex * 3]).toBe(mesh.sourcePointIndices![vertex]);
        }
    });

    it("triangulates concave polygon faces independently of their coordinate offset", async () => {
        const stage = await ResolveUsdStageWithFetcherAsync(
            `#usda 1.0
def Mesh "TranslatedConcave"
{
    uniform token subdivisionScheme = "none"
    int[] faceVertexCounts = [8]
    int[] faceVertexIndices = [0, 1, 2, 3, 4, 5, 6, 7]
    point3f[] points = [
        (10000000, 10000000, 0),
        (10000003, 10000000, 0),
        (10000003, 10000003, 0),
        (10000002, 10000003, 0),
        (10000002, 10000001, 0),
        (10000001, 10000001, 0),
        (10000001, 10000003, 0),
        (10000000, 10000003, 0)
    ]
}
`,
            "",
            "translated-concave.usda",
            {},
            async (identifier) => {
                throw new Error(`No external layers expected, but requested: ${identifier}`);
            }
        );

        const mesh = stage.meshes[0];
        let triangulatedArea = 0;
        for (let offset = 0; offset < mesh.indices.length; offset += 3) {
            triangulatedArea += Math.sqrt(getTriangleAreaSquared(mesh.positions, mesh.indices[offset], mesh.indices[offset + 1], mesh.indices[offset + 2])) / 2;
        }

        expect(mesh.indices).toHaveLength(18);
        expect(triangulatedArea).toBeCloseTo(7);
    });

    it("triangulates concave polygon faces independently of their coordinate scale", async () => {
        const scale = 0.000000001;
        const stage = await ResolveUsdStageWithFetcherAsync(
            `#usda 1.0
def Mesh "SmallConcave"
{
    uniform token subdivisionScheme = "none"
    int[] faceVertexCounts = [8]
    int[] faceVertexIndices = [0, 1, 2, 3, 4, 5, 6, 7]
    point3f[] points = [
        (0, 0, 0),
        (0.000000003, 0, 0),
        (0.000000003, 0.000000003, 0),
        (0.000000002, 0.000000003, 0),
        (0.000000002, 0.000000001, 0),
        (0.000000001, 0.000000001, 0),
        (0.000000001, 0.000000003, 0),
        (0, 0.000000003, 0)
    ]
}
`,
            "",
            "small-concave.usda",
            {},
            async (identifier) => {
                throw new Error(`No external layers expected, but requested: ${identifier}`);
            }
        );

        const mesh = stage.meshes[0];
        let triangulatedArea = 0;
        for (let offset = 0; offset < mesh.indices.length; offset += 3) {
            triangulatedArea += Math.sqrt(getTriangleAreaSquared(mesh.positions, mesh.indices[offset], mesh.indices[offset + 1], mesh.indices[offset + 2])) / 2;
        }

        expect(mesh.indices).toHaveLength(18);
        expect(triangulatedArea / (scale * scale)).toBeCloseTo(7);
    });

    it("composes a referenced child layer into the scene via an injected fetcher", async () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);

        const stage = await ResolveUsdStageWithFetcherAsync(rootUsda, "", "root.usda", {}, async (identifier) => {
            if (identifier.includes("child.usda")) {
                return childUsda;
            }
            throw new Error(`Unexpected external layer request: ${identifier}`);
        });

        const result = AdaptResolvedStageToScene(stage, scene, null, {});

        // The "Ref" prim has no geometry of its own; its mesh comes entirely from the referenced child layer.
        const referenced = result.meshes.find((mesh) => mesh.name === "Ref");
        expect(referenced).toBeDefined();
        expect(referenced!.getTotalVertices()).toBe(9);
        expect(referenced!.getIndices()!.length).toBe(24);

        scene.dispose();
        engine.dispose();
    });

    it("binds a UsdPreviewSurface material to the mesh end to end", async () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        const loader = new USDFileLoader();

        const result = await loader.importMeshAsync(null, scene, materialUsda, "");

        const quad = result.meshes.find((mesh) => mesh.name === "Quad");
        expect(quad).toBeDefined();
        expect(quad!.material).toBeInstanceOf(PBRMaterial);

        const material = quad!.material as PBRMaterial;
        expect(material.albedoColor.r).toBeCloseTo(0.1);
        expect(material.albedoColor.g).toBeCloseTo(0.2);
        expect(material.albedoColor.b).toBeCloseTo(0.3);
        expect(material.metallic).toBeCloseTo(0.25);
        expect(material.roughness).toBeCloseTo(0.6);

        scene.dispose();
        engine.dispose();
    });

    it("reads a USDZ archive and composes its embedded inner layer offline", async () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);

        // Pack the root and child layers into a STORE-compressed USDZ; the inner root references the
        // sibling child by name, so composing it relies on archive-embedded resolution, not the network.
        const archive = fflate.zipSync(
            {
                "root.usda": new TextEncoder().encode(rootUsda),
                "child.usda": new TextEncoder().encode(childUsda),
            },
            { level: 0 }
        );

        const stage = await ResolveUsdStageWithFetcherAsync(archive.buffer, "", "model.usdz", { fflate }, (identifier) => {
            throw new Error(`USDZ composition must not hit the network, but requested: ${identifier}`);
        });

        const result = AdaptResolvedStageToScene(stage, scene, null, {});

        // "Ref" resolves only if the embedded child.usda was composed straight from the archive.
        const referenced = result.meshes.find((mesh) => mesh.name === "Ref");
        expect(referenced).toBeDefined();
        expect(referenced!.getTotalVertices()).toBe(9);

        scene.dispose();
        engine.dispose();
    });

    it("maps a UsdLux light and a UsdGeomCamera to Babylon objects end to end", async () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        const loader = new USDFileLoader();

        const result = await loader.importMeshAsync(null, scene, lightCameraUsda, "");

        expect(result.lights.length).toBe(1);
        expect(result.lights[0].name).toBe("Sun");
        expect(scene.getCameraByName("Cam")).not.toBeNull();

        scene.dispose();
        engine.dispose();
    });

    it("resolves sibling layer references by basename under the dropped-file scheme", async () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);

        // A flat multi-file drop keys siblings by basename in FilesInputStore, so the authored
        // sub-directory ("./assets/child.usda") must collapse to a "file:child.usda" request.
        const requested: string[] = [];
        const stage = await ResolveUsdStageWithFetcherAsync(fileSchemeRootUsda, "file:", "ChessSet.usda", {}, async (identifier) => {
            requested.push(identifier);
            if (identifier === "file:child.usda") {
                return childUsda;
            }
            throw new Error(`Unexpected external layer request: ${identifier}`);
        });

        const result = AdaptResolvedStageToScene(stage, scene, null, {});

        // "Ref" resolves only if the sibling layer was fetched and composed from the dropped set.
        const referenced = result.meshes.find((mesh) => mesh.name === "Ref");
        expect(referenced).toBeDefined();
        expect(referenced!.getTotalVertices()).toBe(9);
        expect(requested).toContain("file:child.usda");

        scene.dispose();
        engine.dispose();
    });

    it("resolves texture references by basename under the dropped-file scheme", async () => {
        // No external layers here; the only sibling is the texture, which must resolve against the
        // dropped set as "file:albedo.png" (scheme preserved, sub-directory dropped, lower-cased).
        const stage = await ResolveUsdStageWithFetcherAsync(fileSchemeTextureUsda, "file:", "Quad.usda", {}, async (identifier) => {
            throw new Error(`No external layers expected, but requested: ${identifier}`);
        });

        expect(stage.materials.length).toBe(1);
        expect(stage.materials[0].textures.baseColor?.uri).toBe("file:albedo.png");
    });

    it("inlines USDZ-embedded texture bytes onto the resolved material", async () => {
        // A USDZ carries its textures inside the archive, so the resolved texture URI ("./textures/tiny.png")
        // addresses an archive-internal asset that Babylon's Texture loader cannot fetch by URL. The
        // resolver must normalize the path to the archive key and inline the image bytes onto the texture.
        const pngBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3, 4]);
        const usdz = fflate.zipSync(
            {
                "scene.usda": new TextEncoder().encode(usdzTextureUsda),
                "textures/tiny.png": pngBytes,
            },
            { level: 0 }
        );

        const stage = await ResolveUsdStageWithFetcherAsync(usdz.buffer, "", "scene.usdz", { fflate }, (identifier) => {
            throw new Error(`USDZ texture loading must not hit the network, but requested: ${identifier}`);
        });

        const baseColor = stage.materials[0]?.textures.baseColor;
        expect(baseColor?.uri).toBe("textures/tiny.png");
        expect(baseColor?.data).toBeDefined();
        expect(new Uint8Array(baseColor!.data!)).toEqual(pngBytes);
        expect(baseColor?.mimeType).toBe("image/png");
    });

    it("retains missing embedded texture failures in resolved-stage diagnostics", async () => {
        const usdz = fflate.zipSync({ "scene.usda": new TextEncoder().encode(usdzTextureUsda) }, { level: 0 });

        const stage = await ResolveUsdStageWithFetcherAsync(usdz.buffer, "", "scene.usdz", { fflate }, async () => {
            throw new Error("missing texture");
        });

        expect(stage.diagnostics).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    severity: "warning",
                    message: expect.stringContaining("Failed to load embedded texture"),
                }),
            ])
        );
    });

    it("returns asset-container-owned materials and removes loaded entities from the scene", async () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        const loader = new USDFileLoader();

        const container = await loader.loadAssetContainerAsync(scene, subsetMaterialUsda, "");

        expect(container.meshes.some((mesh) => mesh.name === "Quad")).toBe(true);
        expect(container.materials).toHaveLength(1);
        expect(container.multiMaterials).toHaveLength(1);
        expect(container.geometries).toHaveLength(1);
        expect(container.meshes.find((mesh) => mesh.name === "Quad")!.subMeshes).toHaveLength(2);
        expect(scene.meshes.some((mesh) => mesh.name === "Quad")).toBe(false);
        expect(scene.materials).toHaveLength(0);
        expect(scene.multiMaterials).toHaveLength(0);

        container.dispose();
        scene.dispose();
        engine.dispose();
    });

    it("composes an external USDC layer", async () => {
        const root = `#usda 1.0
def "Ref" (
    prepend references = @child.usdc@</root>
)
{
}`;
        const child = CreateMinimalUsdc();

        const stage = await ResolveUsdStageWithFetcherAsync(root, "", "root.usda", {}, async (identifier) => {
            expect(identifier).toBe("child.usdc");
            return child.buffer;
        });

        expect(stage.root.children.map((prim) => prim.name)).toEqual(["Ref"]);
        expect(stage.diagnostics.some((diagnostic) => diagnostic.message.includes("USDC") && diagnostic.message.includes("skipped"))).toBe(false);
    });

    it("resolves USDZ external fallbacks relative to the source archive URL", async () => {
        const archive = fflate.zipSync({ "root.usda": new TextEncoder().encode(rootUsda) }, { level: 0 });
        const requested: string[] = [];

        const stage = await ResolveUsdStageWithFetcherAsync(archive.buffer, "https://example.com/models/", "scene.usdz", { fflate }, async (identifier) => {
            requested.push(identifier);
            return childUsda;
        });

        expect(stage.root.children[0].children.some((prim) => prim.name === "Ref")).toBe(true);
        expect(requested).toContain("https://example.com/models/child.usda");
    });

    it("records malformed external layers without aborting the root stage", async () => {
        const stage = await ResolveUsdStageWithFetcherAsync(rootUsda, "", "root.usda", {}, async () => "not a usd layer");

        expect(stage.root.children.map((prim) => prim.name)).toEqual(["World"]);
        expect(stage.diagnostics).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    severity: "warning",
                    message: expect.stringContaining("Could not parse external layer"),
                }),
            ])
        );
    });

    it("keeps concurrent asset-container loads isolated on one loader instance", async () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        const loader = new USDFileLoader();
        const cameraUsda = (name: string) => `#usda 1.0
def Camera "${name}"
{
    token projection = "perspective"
}`;

        const [first, second] = await Promise.all([
            loader.loadAssetContainerAsync(scene, cameraUsda("First"), ""),
            loader.loadAssetContainerAsync(scene, cameraUsda("Second"), ""),
        ]);

        expect(first.cameras.map((camera) => camera.name)).toEqual(["First"]);
        expect(second.cameras.map((camera) => camera.name)).toEqual(["Second"]);

        first.dispose();
        second.dispose();
        scene.dispose();
        engine.dispose();
    });
});

function CreateMinimalUsdc(): Uint8Array {
    const bootstrapSize = 88;
    const sections = [
        ["TOKENS", Bytes([...Uint64Bytes(1), ...Uint64Bytes(5), ...AsciiBytes("root\0")])],
        ["STRINGS", Bytes(Uint64Bytes(0))],
        ["FIELDS", Bytes(Uint64Bytes(0))],
        ["FIELDSETS", Bytes([...Uint64Bytes(1), ...Uint32Bytes(0xffffffff)])],
        ["PATHS", Bytes([...Uint64Bytes(2), ...Uint32Bytes(0), ...Uint32Bytes(0), 1, 0, 0, 0, ...Uint32Bytes(1), ...Uint32Bytes(0), 0, 0, 0, 0])],
        ["SPECS", Bytes([...Uint64Bytes(1), ...Uint32Bytes(1), ...Uint32Bytes(0), ...Int32Bytes(6)])],
    ] as const;
    let offset = bootstrapSize;
    const records = sections.map(([name, bytes]) => {
        const record = { name, start: offset, bytes };
        offset += bytes.length;
        return record;
    });
    const toc = Bytes([
        ...Uint64Bytes(records.length),
        ...records.flatMap((record) => [...SectionNameBytes(record.name), ...Int64Bytes(BigInt(record.start)), ...Int64Bytes(BigInt(record.bytes.length))]),
    ]);
    const output = new Uint8Array(offset + toc.length);
    output.set(AsciiBytes("PXR-USDC"), 0);
    output[9] = 1;
    output.set(Int64Bytes(BigInt(offset)), 16);
    for (const record of records) {
        output.set(record.bytes, record.start);
    }
    output.set(toc, offset);
    return output;
}

function SectionNameBytes(name: string): number[] {
    const bytes = new Uint8Array(16);
    bytes.set(AsciiBytes(name));
    return Array.from(bytes);
}

function AsciiBytes(value: string): number[] {
    return Array.from(value, (character) => character.charCodeAt(0));
}

function Bytes(values: number[]): Uint8Array {
    return new Uint8Array(values);
}

function Uint32Bytes(value: number): number[] {
    const bytes = new Uint8Array(4);
    new DataView(bytes.buffer).setUint32(0, value, true);
    return Array.from(bytes);
}

function Int32Bytes(value: number): number[] {
    const bytes = new Uint8Array(4);
    new DataView(bytes.buffer).setInt32(0, value, true);
    return Array.from(bytes);
}

function Uint64Bytes(value: number): number[] {
    return Int64Bytes(BigInt(value));
}

function Int64Bytes(value: bigint): number[] {
    const bytes = new Uint8Array(8);
    new DataView(bytes.buffer).setBigInt64(0, value, true);
    return Array.from(bytes);
}
