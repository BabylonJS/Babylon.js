import { describe, expect, it } from "vitest";
import { NullEngine } from "core/Engines/nullEngine";
import { Scene } from "core/scene";
import { PBRMaterial } from "core/Materials/PBR/pbrMaterial.pure";
import { USDFileLoader } from "loaders/USD/usdFileLoader";
import { ResolveUsdStageAsync } from "loaders/USD/resolution/usdResolver";

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

// A DistantLight and a Camera in one stage: the Camera is in profile and maps to a Babylon camera,
// while the out-of-profile UsdLux light is skipped by the public loader.
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

describe("USD loader integration", () => {
    it("uses framesPerSecond when timeCodesPerSecond is absent", async () => {
        const stage = await ResolveUsdStageAsync(
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
            {}
        );

        expect(stage.metadata.timeCodesPerSecond).toBe(60);
        expect(Array.from(stage.root.children[0].animation!.tracks[0].times)).toEqual([0, 1]);
    });

    it("prefers timeCodesPerSecond over framesPerSecond", async () => {
        const stage = await ResolveUsdStageAsync(
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
            {}
        );

        expect(stage.metadata.timeCodesPerSecond).toBe(60);
        expect(Array.from(stage.root.children[0].animation!.tracks[0].times)).toEqual([0, 1]);
    });

    it("preserves authored face-varying normals through triangulation", async () => {
        const stage = await ResolveUsdStageAsync(
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
            {}
        );

        const normals = Array.from(stage.meshes[0].normals!);
        expect(normals).toHaveLength(12);
        for (let offset = 0; offset < normals.length; offset += 3) {
            expect(normals.slice(offset, offset + 3)).toEqual([0, 1, 0]);
        }
    });

    it("triangulates concave polygon faces without filling the concavity", async () => {
        const stage = await ResolveUsdStageAsync(
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
            {}
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
        const stage = await ResolveUsdStageAsync(
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
            {}
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
        const stage = await ResolveUsdStageAsync(
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
            {}
        );

        const mesh = stage.meshes[0];
        let triangulatedArea = 0;
        for (let offset = 0; offset < mesh.indices.length; offset += 3) {
            triangulatedArea += Math.sqrt(getTriangleAreaSquared(mesh.positions, mesh.indices[offset], mesh.indices[offset + 1], mesh.indices[offset + 2])) / 2;
        }

        expect(mesh.indices).toHaveLength(18);
        expect(triangulatedArea / (scale * scale)).toBeCloseTo(7);
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

    it("maps a UsdGeomCamera through the public loader and skips a UsdLux light", async () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        const loader = new USDFileLoader();

        const result = await loader.importMeshAsync(null, scene, lightCameraUsda, "");

        // The Camera is in profile and maps to a real Babylon camera; the UsdLux light is out of
        // profile and is skipped rather than mapped to a Babylon light.
        expect(scene.getCameraByName("Cam")).not.toBeNull();
        expect(result.lights.length).toBe(0);

        scene.dispose();
        engine.dispose();
    });

    it("resolves texture references by basename under the dropped-file scheme", async () => {
        // No external layers here; the only sibling is the texture, which must resolve against the
        // dropped set as "file:albedo.png" (scheme preserved, sub-directory dropped, lower-cased).
        const stage = await ResolveUsdStageAsync(fileSchemeTextureUsda, "file:", "Quad.usda", {});

        expect(stage.materials.length).toBe(1);
        expect(stage.materials[0].textures.baseColor?.uri).toBe("file:albedo.png");
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
