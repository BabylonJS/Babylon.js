import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NullEngine } from "core/Engines/nullEngine";
import { Scene } from "core/scene";
import { MultiMaterial } from "core/Materials/multiMaterial";
import { StandardMaterial } from "core/Materials/standardMaterial";
import { Texture } from "core/Materials/Textures/texture";
import { VertexBuffer } from "core/Buffers/buffer";
import { type SceneLoaderPluginOptions } from "core/Loading/sceneLoader";
import { FBXFileLoader } from "loaders/FBX/fbxFileLoader";
import { type FBXTextureRef } from "loaders/FBX/interpreter/materials";

interface IFBXTextureFactoryForTest {
    _createTexture(tex: FBXTextureRef, scene: Scene, rootUrl: string, isDataTexture: boolean): Texture | null;
}

function buildMaterialOnlyFbx(textureSlot: string): string {
    return `; FBX 7.4.0 project file
Objects: {
    Material: 1, "Material::TestMaterial", "" {
        ShadingModel: "Phong"
    }
    Texture: 2, "Texture::TestNormal", "" {
        FileName: "normal.png"
        RelativeFilename: "normal.png"
    }
}
Connections: {
    C: "OP", 2, 1, "${textureSlot}"
}`;
}

function buildTriangleFbx(includeAuthoredTangents = false): string {
    return `; FBX 7.4.0 project file
Objects: {
    Geometry: 1, "Geometry::Triangle", "Mesh" {
        Vertices: *9 {
            a: 0,0,0,1,0,0,0,1,0
        }
        PolygonVertexIndex: *3 {
            a: 0,1,-3
        }
        LayerElementNormal: 0 {
            MappingInformationType: "ByControlPoint"
            ReferenceInformationType: "Direct"
            Normals: *9 {
                a: 0,0,1,0,0,1,0,0,1
            }
        }
        LayerElementUV: 0 {
            Name: "UVSet"
            MappingInformationType: "ByPolygonVertex"
            ReferenceInformationType: "Direct"
            UV: *6 {
                a: 0,0,1,0,0,1
            }
        }
        ${
            includeAuthoredTangents
                ? `LayerElementTangent: 0 {
            MappingInformationType: "ByControlPoint"
            ReferenceInformationType: "Direct"
            Tangents: *12 {
                a: 1,0,0,1,1,0,0,1,1,0,0,1
            }
        }`
                : ""
        }
    }
    Model: 2, "Model::Triangle", "Mesh" {
    }
}
Connections: {
    C: "OO", 1, 2
    C: "OO", 2, 0
}`;
}

describe("FBX material texture loading", () => {
    let engine: NullEngine;
    let scene: Scene;

    beforeEach(() => {
        engine = new NullEngine();
        scene = new Scene(engine);
    });

    afterEach(() => {
        scene.dispose();
        engine.dispose();
    });

    it.each(["NormalMap", "NormalMapTexture", "normalCamera", "Bump", "BumpFactor"])("treats %s textures as Y-up normal maps by default", async (textureSlot) => {
        const loader = new FBXFileLoader();

        await loader.importMeshAsync(null, scene, buildMaterialOnlyFbx(textureSlot), "/textures/");

        const material = getStandardMaterial(scene);
        expect(material.bumpTexture).toBeDefined();
        expect(material.bumpTexture?.gammaSpace).toBe(false);
        expect(material.invertNormalMapX).toBe(false);
        expect(material.invertNormalMapY).toBe(false);
    });

    it.each(["NormalMap", "NormalMapTexture", "normalCamera", "Bump", "BumpFactor"])("uses the Y-down option for %s texture convention", async (textureSlot) => {
        const loader = new FBXFileLoader({ normalMapCoordinateSystem: "y-down" });

        await loader.importMeshAsync(null, scene, buildMaterialOnlyFbx(textureSlot), "/textures/");

        const material = getStandardMaterial(scene);
        expect(material.bumpTexture?.gammaSpace).toBe(false);
        expect(material.invertNormalMapX).toBe(false);
        expect(material.invertNormalMapY).toBe(true);
    });

    it("does not use scene handedness as the normal map coordinate system", async () => {
        scene.useRightHandedSystem = true;
        const loader = new FBXFileLoader();

        await loader.importMeshAsync(null, scene, buildMaterialOnlyFbx("NormalMap"), "/textures/");

        const material = getStandardMaterial(scene);
        expect(material.invertNormalMapX).toBe(false);
        expect(material.invertNormalMapY).toBe(false);
    });

    it("preserves generated tangent handedness for Y-up normal maps", async () => {
        const loader = new FBXFileLoader();

        const result = await loader.importMeshAsync(null, scene, buildTriangleFbx(), "");

        const tangents = result.meshes[0].getVerticesData(VertexBuffer.TangentKind);
        expect(tangents?.[3]).toBe(1);
    });

    it("flips generated tangent handedness for Y-down normal maps", async () => {
        const loader = new FBXFileLoader({ normalMapCoordinateSystem: "y-down" });

        const result = await loader.importMeshAsync(null, scene, buildTriangleFbx(), "");

        const tangents = result.meshes[0].getVerticesData(VertexBuffer.TangentKind);
        expect(tangents?.[3]).toBe(-1);
    });

    it("flips authored tangent handedness for Y-down normal maps", async () => {
        const loader = new FBXFileLoader({ normalMapCoordinateSystem: "y-down" });

        const result = await loader.importMeshAsync(null, scene, buildTriangleFbx(true), "");

        const tangents = result.meshes[0].getVerticesData(VertexBuffer.TangentKind);
        expect(tangents?.[3]).toBe(-1);
    });

    it("creates configured plugins from SceneLoader options", async () => {
        const loader = new FBXFileLoader();
        const plugin = loader.createPlugin({
            fbx: {
                normalMapCoordinateSystem: "y-down",
            },
        } as SceneLoaderPluginOptions);

        const result = await plugin.importMeshAsync(null, scene, buildTriangleFbx(), "");

        const tangents = result.meshes[0].getVerticesData(VertexBuffer.TangentKind);
        expect(tangents?.[3]).toBe(-1);
    });

    it("loads embedded normal-compatible textures without creating blob URLs", () => {
        const createTexture = (FBXFileLoader as unknown as IFBXTextureFactoryForTest)._createTexture;
        const originalCreateObjectURL = URL.createObjectURL;
        const createObjectURLSpy = vi.fn(() => {
            throw new Error("Embedded FBX textures should not use blob URLs");
        });
        Object.defineProperty(URL, "createObjectURL", { configurable: true, writable: true, value: createObjectURLSpy });

        try {
            const texture = createTexture(
                {
                    propertyName: "Bump",
                    fileName: "normal.png",
                    relativeFileName: "textures\\normal.png",
                    id: 2,
                    embeddedData: new Uint8Array([137, 80, 78, 71]),
                },
                scene,
                "/textures/",
                true
            );

            expect(texture).toBeDefined();
            expect(texture?.gammaSpace).toBe(false);
            expect(texture?.name).toBe("normal.png");
            expect(texture?.url).toContain("data:fbx-embedded-texture/");
            expect(scene.textures).toContain(texture);
            expect(createObjectURLSpy).not.toHaveBeenCalled();
        } finally {
            if (originalCreateObjectURL) {
                Object.defineProperty(URL, "createObjectURL", { configurable: true, writable: true, value: originalCreateObjectURL });
            } else {
                delete (URL as { createObjectURL?: unknown }).createObjectURL;
            }
        }
    });

    it("keeps safe relative sidecar texture paths when embedded data is absent", () => {
        const createTexture = (FBXFileLoader as unknown as IFBXTextureFactoryForTest)._createTexture;

        const texture = createTexture(
            {
                propertyName: "DiffuseColor",
                fileName: "C:/authored/location/textures/diffuse.png",
                relativeFileName: "textures\\diffuse.png",
                id: 2,
                embeddedData: null,
            },
            scene,
            "/models/",
            false
        );

        expect(texture).toBeDefined();
        expect(texture?.url).toBe("/models/textures/diffuse.png");
    });

    it("puts materials and textures into asset containers", async () => {
        const loader = new FBXFileLoader();

        const container = await loader.loadAssetContainerAsync(scene, buildMaterialOnlyFbx("DiffuseColor"), "/textures/");

        expect(container.materials).toHaveLength(1);
        expect(container.textures).toHaveLength(1);
        expect(scene.materials).not.toContain(container.materials[0]);
        expect(scene.textures).not.toContain(container.textures[0]);
    });

    it("uses non-zero all-same material slots", async () => {
        const loader = new FBXFileLoader();

        const result = await loader.importMeshAsync(null, scene, buildAllSameMaterialSlotFbx(), "");

        const material = result.meshes[0].material;
        expect(material).toBeInstanceOf(MultiMaterial);
        expect((material as MultiMaterial).subMaterials[0]?.name).toBe("SecondMaterial");
    });
});

function getStandardMaterial(scene: Scene): StandardMaterial {
    const material = scene.materials.find((entry): entry is StandardMaterial => entry instanceof StandardMaterial);
    if (!material) {
        throw new Error("Expected an FBX StandardMaterial to be created.");
    }
    return material;
}

function buildAllSameMaterialSlotFbx(): string {
    return `; FBX 7.4.0 project file
Objects: {
    Geometry: 1, "Geometry::Quad", "Mesh" {
        Vertices: *12 {
            a: 0,0,0,1,0,0,1,1,0,0,1,0
        }
        PolygonVertexIndex: *4 {
            a: 0,1,2,-4
        }
        LayerElementMaterial: 0 {
            MappingInformationType: "AllSame"
            ReferenceInformationType: "Direct"
            Materials: *1 {
                a: 1
            }
        }
    }
    Model: 2, "Model::Quad", "Mesh" {
    }
    Material: 3, "Material::FirstMaterial", "" {
        ShadingModel: "Lambert"
    }
    Material: 4, "Material::SecondMaterial", "" {
        ShadingModel: "Lambert"
    }
}
Connections: {
    C: "OO", 1, 2
    C: "OO", 2, 0
    C: "OO", 3, 2
    C: "OO", 4, 2
}`;
}
