import { describe, expect, it } from "vitest";
import { NullEngine } from "core/Engines/nullEngine";
import { Scene } from "core/scene";
import { PBRMaterial } from "core/Materials/PBR/pbrMaterial.pure";
import { USDFileLoader } from "loaders/USD/usdFileLoader";
import { ResolveUsdStageAsync } from "loaders/USD/resolution/usdResolver";
import { type IResolvedMaterial, type IResolvedMesh, type IResolvedPrim, type IResolvedStage } from "loaders/USD/resolution/resolvedStage";

// These tests exercise issue #61's material/primvar/texture resolution slice at the resolved-stage
// boundary (plus one NullEngine end-to-end check). They compose real USDA text through the offline
// resolver with a fetcher that throws, so nothing touches the network.

async function ResolveStageAsync(usda: string, rootUrl = "", fileName = "test.usda"): Promise<IResolvedStage> {
    return ResolveUsdStageAsync(usda, rootUrl, fileName, {});
}

function FindPrim(root: IResolvedPrim, name: string): IResolvedPrim | undefined {
    if (root.name === name) {
        return root;
    }
    for (const child of root.children) {
        const found = FindPrim(child, name);
        if (found) {
            return found;
        }
    }
    return undefined;
}

function MaterialForMesh(stage: IResolvedStage, meshName: string): IResolvedMaterial | undefined {
    const prim = FindPrim(stage.root, meshName);
    const index = prim?.materialBinding?.materialIndex;
    return index === undefined ? undefined : stage.materials[index];
}

function MeshForPrim(stage: IResolvedStage, meshName: string): IResolvedMesh | undefined {
    const prim = FindPrim(stage.root, meshName);
    return prim?.meshIndex === undefined ? undefined : stage.meshes[prim.meshIndex];
}

function HasWarning(stage: IResolvedStage, fragment: string): boolean {
    return stage.diagnostics.some((diagnostic) => diagnostic.severity === "warning" && diagnostic.message.includes(fragment));
}

const QuadMesh = `        int[] faceVertexCounts = [4]
        int[] faceVertexIndices = [0, 1, 2, 3]
        point3f[] points = [(-1, -1, 0), (1, -1, 0), (1, 1, 0), (-1, 1, 0)]`;

describe("USD material binding inheritance", () => {
    it("inherits a direct material binding authored on an ancestor prim", async () => {
        const usda = `#usda 1.0
def Xform "World" (
    prepend apiSchemas = ["MaterialBindingAPI"]
)
{
    rel material:binding = </World/Mat>

    def Mesh "Child"
    {
${QuadMesh}
    }

    def Material "Mat"
    {
        def Shader "Preview"
        {
            uniform token info:id = "UsdPreviewSurface"
            color3f inputs:diffuseColor = (0.2, 0.4, 0.6)
        }
    }
}
`;
        const stage = await ResolveStageAsync(usda);
        const material = MaterialForMesh(stage, "Child");
        expect(material).toBeDefined();
        expect(material!.baseColor[0]).toBeCloseTo(0.2);
        expect(material!.baseColor[1]).toBeCloseTo(0.4);
        expect(material!.baseColor[2]).toBeCloseTo(0.6);
    });

    it("lets a descendant binding override an inherited one", async () => {
        const usda = `#usda 1.0
def Xform "World"
{
    rel material:binding = </World/Outer>

    def Mesh "Child"
    {
${QuadMesh}
        rel material:binding = </World/Inner>
    }

    def Material "Outer"
    {
        def Shader "Preview"
        {
            uniform token info:id = "UsdPreviewSurface"
            color3f inputs:diffuseColor = (1, 0, 0)
        }
    }

    def Material "Inner"
    {
        def Shader "Preview"
        {
            uniform token info:id = "UsdPreviewSurface"
            color3f inputs:diffuseColor = (0, 1, 0)
        }
    }
}
`;
        const stage = await ResolveStageAsync(usda);
        const material = MaterialForMesh(stage, "Child");
        expect(material).toBeDefined();
        expect(material!.baseColor).toEqual([0, 1, 0]);
    });
});

describe("USD constant primvar inheritance", () => {
    it("inherits constant displayColor, displayOpacity, and UV primvars to a descendant mesh", async () => {
        const usda = `#usda 1.0
def Xform "Group"
{
    color3f[] primvars:displayColor = [(0.2, 0.4, 0.6)] (interpolation = "constant")
    float[] primvars:displayOpacity = [0.5] (interpolation = "constant")
    texCoord2f[] primvars:st = [(0.25, 0.75)] (interpolation = "constant")

    def Mesh "Child"
    {
        int[] faceVertexCounts = [3]
        int[] faceVertexIndices = [0, 1, 2]
        point3f[] points = [(0, 0, 0), (1, 0, 0), (0, 1, 0)]
    }
}
`;
        const stage = await ResolveStageAsync(usda);
        const mesh = MeshForPrim(stage, "Child");
        expect(mesh).toBeDefined();
        expect(mesh!.colors).toBeDefined();
        expect(mesh!.uvSets).toBeDefined();

        const vertexCount = mesh!.positions.length / 3;
        for (let vertex = 0; vertex < vertexCount; vertex++) {
            expect(mesh!.colors![vertex * 4]).toBeCloseTo(0.2);
            expect(mesh!.colors![vertex * 4 + 1]).toBeCloseTo(0.4);
            expect(mesh!.colors![vertex * 4 + 2]).toBeCloseTo(0.6);
            expect(mesh!.colors![vertex * 4 + 3]).toBeCloseTo(0.5);
            expect(mesh!.uvSets![0][vertex * 2]).toBeCloseTo(0.25);
            expect(mesh!.uvSets![0][vertex * 2 + 1]).toBeCloseTo(0.75);
        }
    });

    it("prefers a mesh's own constant primvar over the inherited one", async () => {
        const usda = `#usda 1.0
def Xform "Group"
{
    color3f[] primvars:displayColor = [(1, 0, 0)] (interpolation = "constant")

    def Mesh "Child"
    {
        int[] faceVertexCounts = [3]
        int[] faceVertexIndices = [0, 1, 2]
        point3f[] points = [(0, 0, 0), (1, 0, 0), (0, 1, 0)]
        color3f[] primvars:displayColor = [(0, 1, 0)] (interpolation = "constant")
    }
}
`;
        const stage = await ResolveStageAsync(usda);
        const mesh = MeshForPrim(stage, "Child");
        expect(mesh).toBeDefined();
        expect(mesh!.colors![0]).toBeCloseTo(0);
        expect(mesh!.colors![1]).toBeCloseTo(1);
        expect(mesh!.colors![2]).toBeCloseTo(0);
    });

    it("does not inherit a per-vertex primvar (only constant primvars propagate)", async () => {
        const usda = `#usda 1.0
def Xform "Group"
{
    color3f[] primvars:displayColor = [(1, 0, 0), (0, 1, 0), (0, 0, 1)] (interpolation = "vertex")

    def Mesh "Child"
    {
        int[] faceVertexCounts = [3]
        int[] faceVertexIndices = [0, 1, 2]
        point3f[] points = [(0, 0, 0), (1, 0, 0), (0, 1, 0)]
    }
}
`;
        const stage = await ResolveStageAsync(usda);
        const mesh = MeshForPrim(stage, "Child");
        expect(mesh).toBeDefined();
        expect(mesh!.colors).toBeUndefined();
    });
});

describe("USD shading connection diagnostics", () => {
    it("warns when the material surface output targets a missing prim", async () => {
        const usda = `#usda 1.0
def Xform "World"
{
    def Mesh "Quad"
    {
${QuadMesh}
        rel material:binding = </World/Mat>
    }

    def Material "Mat"
    {
        token outputs:surface.connect = </World/Mat/Missing.outputs:surface>
    }
}
`;
        const stage = await ResolveStageAsync(usda);
        expect(HasWarning(stage, "surface output connection")).toBe(true);
    });

    it("warns when a shader input connection targets a missing prim", async () => {
        const usda = `#usda 1.0
def Xform "World"
{
    def Mesh "Quad"
    {
${QuadMesh}
        rel material:binding = </World/Mat>
    }

    def Material "Mat"
    {
        token outputs:surface.connect = </World/Mat/Preview.outputs:surface>

        def Shader "Preview"
        {
            uniform token info:id = "UsdPreviewSurface"
            color3f inputs:diffuseColor.connect = </World/Mat/Missing.outputs:rgb>
            token outputs:surface
        }
    }
}
`;
        const stage = await ResolveStageAsync(usda);
        expect(HasWarning(stage, "could not be resolved to a prim")).toBe(true);
    });

    it("warns when a texture st connection targets a missing primvar reader but still resolves the texture", async () => {
        const usda = `#usda 1.0
def Xform "World"
{
    def Mesh "Quad"
    {
${QuadMesh}
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
            asset inputs:file = @./color.png@
            float2 inputs:st.connect = </World/Mat/NoReader.outputs:result>
            float3 outputs:rgb
        }
    }
}
`;
        const stage = await ResolveStageAsync(usda, "file:", "Quad.usda");
        expect(HasWarning(stage, "could not be resolved to a prim")).toBe(true);
        const texture = stage.materials[0]?.textures.baseColor;
        expect(texture?.uri).toBe("file:color.png");
        expect(texture?.uvSet).toBe(0);
    });

    it("walks a UsdTransform2d pass-through to the underlying primvar reader", async () => {
        const usda = `#usda 1.0
def Xform "World"
{
    def Mesh "Quad"
    {
${QuadMesh}
        texCoord2f[] primvars:st1 = [(0, 0), (1, 0), (1, 1), (0, 1)] (interpolation = "vertex")
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
            asset inputs:file = @./color.png@
            float2 inputs:st.connect = </World/Mat/Transform.outputs:result>
            float3 outputs:rgb
        }

        def Shader "Transform"
        {
            uniform token info:id = "UsdTransform2d"
            float2 inputs:in.connect = </World/Mat/Reader.outputs:result>
            float2 outputs:result
        }

        def Shader "Reader"
        {
            uniform token info:id = "UsdPrimvarReader_float2"
            token inputs:varname = "st1"
            float2 outputs:result
        }
    }
}
`;
        const stage = await ResolveStageAsync(usda, "file:", "Quad.usda");
        const texture = stage.materials[0]?.textures.baseColor;
        expect(texture?.uri).toBe("file:color.png");
        expect(texture?.uvSet).toBe(1);
    });
});

describe("USD texture asset resolution", () => {
    it("resolves a relative non-USD sidecar texture against the source layer", async () => {
        const usda = `#usda 1.0
def Xform "World"
{
    def Mesh "Quad"
    {
${QuadMesh}
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
            asset inputs:file = @./color.png@
            float3 outputs:rgb
        }
    }
}
`;
        const stage = await ResolveStageAsync(usda, "file:", "Quad.usda");
        expect(stage.materials[0].textures.baseColor?.uri).toBe("file:color.png");
        expect(HasWarning(stage, "USD layer")).toBe(false);
    });

    it("rejects a texture that references a USD layer as its image source", async () => {
        const usda = `#usda 1.0
def Xform "World"
{
    def Mesh "Quad"
    {
${QuadMesh}
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
            asset inputs:file = @./nested.usda@
            float3 outputs:rgb
        }
    }
}
`;
        const stage = await ResolveStageAsync(usda, "file:", "Quad.usda");
        expect(stage.diagnostics.some((diagnostic) => diagnostic.message.includes("[usda-asset-layer-unsupported]"))).toBe(true);
        expect(stage.materials[0].textures.baseColor).toBeUndefined();
    });
});

describe("UsdPreviewSurface schema fallbacks", () => {
    it("uses the schema default diffuse (0.18 gray) instead of the mesh display color", async () => {
        const usda = `#usda 1.0
def Xform "World"
{
    def Mesh "Quad"
    {
${QuadMesh}
        color3f[] primvars:displayColor = [(0.9, 0.1, 0.1)] (interpolation = "constant")
        rel material:binding = </World/Mat>
    }

    def Material "Mat"
    {
        def Shader "Preview"
        {
            uniform token info:id = "UsdPreviewSurface"
            float inputs:metallic = 0.25
            float inputs:roughness = 0.6
        }
    }
}
`;
        const stage = await ResolveStageAsync(usda);
        const material = MaterialForMesh(stage, "Quad");
        expect(material).toBeDefined();
        expect(material!.baseColor).toEqual([0.18, 0.18, 0.18]);
        expect(material!.specularColor).toEqual([0, 0, 0]);
        expect(material!.clearcoatRoughness).toBeCloseTo(0.01);
        expect(material!.metallic).toBeCloseTo(0.25);
        expect(material!.roughness).toBeCloseTo(0.6);
    });

    it("applies the 0.18 gray default through to a Babylon PBRMaterial", async () => {
        const usda = `#usda 1.0
def Xform "World"
{
    def Mesh "Quad"
    {
${QuadMesh}
        color3f[] primvars:displayColor = [(0.9, 0.1, 0.1)] (interpolation = "constant")
        rel material:binding = </World/Mat>
    }

    def Material "Mat"
    {
        def Shader "Preview"
        {
            uniform token info:id = "UsdPreviewSurface"
            float inputs:roughness = 0.4
        }
    }
}
`;
        const engine = new NullEngine();
        const scene = new Scene(engine);
        const loader = new USDFileLoader();

        const result = await loader.importMeshAsync(null, scene, usda, "");
        const quad = result.meshes.find((mesh) => mesh.name === "Quad");
        expect(quad?.material).toBeInstanceOf(PBRMaterial);

        const material = quad!.material as PBRMaterial;
        expect(material.albedoColor.r).toBeCloseTo(0.18);
        expect(material.albedoColor.g).toBeCloseTo(0.18);
        expect(material.albedoColor.b).toBeCloseTo(0.18);

        scene.dispose();
        engine.dispose();
    });
});

describe("USD inheritance and connection edge cases", () => {
    it("blocks inheritance of a scalar primvar authored with a non-constant interpolation", async () => {
        // displayColor is a valid inheritable constant, but displayOpacity is a bare scalar authored
        // with explicit "vertex" interpolation, so it must NOT propagate: the child alpha stays 1.
        const usda = `#usda 1.0
def Xform "Group"
{
    color3f[] primvars:displayColor = [(0.2, 0.4, 0.6)] (interpolation = "constant")
    float primvars:displayOpacity = 0.5 (interpolation = "vertex")

    def Mesh "Child"
    {
        int[] faceVertexCounts = [3]
        int[] faceVertexIndices = [0, 1, 2]
        point3f[] points = [(0, 0, 0), (1, 0, 0), (0, 1, 0)]
    }
}
`;
        const stage = await ResolveStageAsync(usda);
        const mesh = MeshForPrim(stage, "Child");
        expect(mesh).toBeDefined();
        expect(mesh!.colors).toBeDefined();

        const vertexCount = mesh!.positions.length / 3;
        for (let vertex = 0; vertex < vertexCount; vertex++) {
            expect(mesh!.colors![vertex * 4]).toBeCloseTo(0.2);
            expect(mesh!.colors![vertex * 4 + 3]).toBeCloseTo(1);
        }
    });

    it("blocks inheritance of a UV primvar authored with a non-constant interpolation", async () => {
        // Both ancestors author a single-valued bare float2 primvars:st, but only the constant one is
        // inheritable: the "vertex" one must not propagate a UV set onto the child that omits its own.
        const usda = `#usda 1.0
def Xform "Blocking"
{
    float2 primvars:st = (0.25, 0.75) (interpolation = "vertex")

    def Mesh "BlockedChild"
    {
        int[] faceVertexCounts = [3]
        int[] faceVertexIndices = [0, 1, 2]
        point3f[] points = [(0, 0, 0), (1, 0, 0), (0, 1, 0)]
    }
}

def Xform "Inheriting"
{
    float2 primvars:st = (0.25, 0.75) (interpolation = "constant")

    def Mesh "InheritingChild"
    {
        int[] faceVertexCounts = [3]
        int[] faceVertexIndices = [0, 1, 2]
        point3f[] points = [(0, 0, 0), (1, 0, 0), (0, 1, 0)]
    }
}
`;
        const stage = await ResolveStageAsync(usda);

        const blocked = MeshForPrim(stage, "BlockedChild");
        expect(blocked).toBeDefined();
        expect(blocked!.uvSets).toBeUndefined();

        const inheriting = MeshForPrim(stage, "InheritingChild");
        expect(inheriting).toBeDefined();
        expect(inheriting!.uvSets).toBeDefined();
        const vertexCount = inheriting!.positions.length / 3;
        for (let vertex = 0; vertex < vertexCount; vertex++) {
            expect(inheriting!.uvSets![0][vertex * 2]).toBeCloseTo(0.25);
            expect(inheriting!.uvSets![0][vertex * 2 + 1]).toBeCloseTo(0.75);
        }
    });

    it("detects a cyclic inputs:in connection chain and defaults to UV set 0", async () => {
        const usda = `#usda 1.0
def Xform "World"
{
    def Mesh "Quad"
    {
${QuadMesh}
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
            asset inputs:file = @./color.png@
            float2 inputs:st.connect = </World/Mat/A.outputs:result>
            float3 outputs:rgb
        }

        def Shader "A"
        {
            uniform token info:id = "UsdTransform2d"
            float2 inputs:in.connect = </World/Mat/B.outputs:result>
            float2 outputs:result
        }

        def Shader "B"
        {
            uniform token info:id = "UsdTransform2d"
            float2 inputs:in.connect = </World/Mat/A.outputs:result>
            float2 outputs:result
        }
    }
}
`;
        const stage = await ResolveStageAsync(usda, "file:", "Quad.usda");
        expect(HasWarning(stage, "Cyclic")).toBe(true);
        const texture = stage.materials[0]?.textures.baseColor;
        expect(texture?.uri).toBe("file:color.png");
        expect(texture?.uvSet).toBe(0);
    });

    it("warns about a non-default UsdTransform2d while still resolving the underlying UV set", async () => {
        const usda = `#usda 1.0
def Xform "World"
{
    def Mesh "Quad"
    {
${QuadMesh}
        texCoord2f[] primvars:st1 = [(0, 0), (1, 0), (1, 1), (0, 1)] (interpolation = "vertex")
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
            asset inputs:file = @./color.png@
            float2 inputs:st.connect = </World/Mat/Xform.outputs:result>
            float3 outputs:rgb
        }

        def Shader "Xform"
        {
            uniform token info:id = "UsdTransform2d"
            float2 inputs:scale = (2, 2)
            float2 inputs:in.connect = </World/Mat/Reader.outputs:result>
            float2 outputs:result
        }

        def Shader "Reader"
        {
            uniform token info:id = "UsdPrimvarReader_float2"
            token inputs:varname = "st1"
            float2 outputs:result
        }
    }
}
`;
        const stage = await ResolveStageAsync(usda, "file:", "Quad.usda");
        expect(HasWarning(stage, "non-default UV transform")).toBe(true);
        const texture = stage.materials[0]?.textures.baseColor;
        expect(texture?.uri).toBe("file:color.png");
        expect(texture?.uvSet).toBe(1);
    });

    it("warns when a texture input connection resolves to a non-UsdUVTexture prim", async () => {
        const usda = `#usda 1.0
def Xform "World"
{
    def Mesh "Quad"
    {
${QuadMesh}
        rel material:binding = </World/Mat>
    }

    def Material "Mat"
    {
        token outputs:surface.connect = </World/Mat/Preview.outputs:surface>

        def Shader "Preview"
        {
            uniform token info:id = "UsdPreviewSurface"
            color3f inputs:diffuseColor.connect = </World/Mat/Reader.outputs:result>
            token outputs:surface
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
        const stage = await ResolveStageAsync(usda);
        expect(HasWarning(stage, "instead of a UsdUVTexture")).toBe(true);
        expect(stage.materials[0].textures.baseColor).toBeUndefined();
    });
});
