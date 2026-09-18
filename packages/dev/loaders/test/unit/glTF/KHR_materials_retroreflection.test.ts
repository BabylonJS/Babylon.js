import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { NullEngine } from "core/Engines/nullEngine";
import { Scene } from "core/scene";
import { ImportMeshAsync } from "core/Loading/sceneLoader";
import { OpenPBRMaterial } from "core/Materials/PBR/openpbrMaterial";
import { PBRMaterial } from "core/Materials/PBR/pbrMaterial";
import { registerBuiltInLoaders } from "loaders/dynamic";

registerBuiltInLoaders();

function buildRetroreflectionGltf(factor?: number): string {
    const positions = new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]);
    const bytes = new Uint8Array(positions.buffer);
    let binary = "";
    for (let index = 0; index < bytes.length; index++) {
        binary += String.fromCharCode(bytes[index]);
    }

    const retroreflection = factor === undefined ? {} : { retroreflectionFactor: factor };
    return JSON.stringify({
        asset: { version: "2.0" },
        extensionsUsed: ["KHR_materials_retroreflection"],
        scene: 0,
        scenes: [{ nodes: [0, 1] }],
        nodes: [{ mesh: 0 }, { mesh: 1 }],
        meshes: [{ primitives: [{ attributes: { POSITION: 0 }, material: 0 }] }, { primitives: [{ attributes: { POSITION: 0 }, material: 1 }] }],
        materials: [
            {
                name: "retro",
                pbrMetallicRoughness: { metallicFactor: 0, roughnessFactor: 0.35 },
                extensions: { KHR_materials_retroreflection: retroreflection },
            },
            {
                name: "ordinary",
                pbrMetallicRoughness: { metallicFactor: 0, roughnessFactor: 0.35 },
            },
        ],
        accessors: [{ bufferView: 0, componentType: 5126, count: 3, type: "VEC3", max: [1, 1, 0], min: [0, 0, 0] }],
        bufferViews: [{ buffer: 0, byteLength: 36 }],
        buffers: [{ byteLength: 36, uri: `data:application/octet-stream;base64,${btoa(binary)}` }],
    });
}

describe("KHR_materials_retroreflection", () => {
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

    it("loads the pure extension implementation from the dynamic registry", () => {
        const dynamicRegistry = readFileSync(new URL("../../../src/glTF/2.0/Extensions/dynamic.ts", import.meta.url), "utf8");
        expect(dynamicRegistry).toContain('import("./KHR_materials_retroreflection.pure")');
    });

    it("loads extension materials through OpenPBR without changing ordinary materials", async () => {
        const result = await ImportMeshAsync(`data:${buildRetroreflectionGltf(0.75)}`, scene);
        const retroMaterial = result.meshes.find((mesh) => mesh.material?.name === "retro")?.material;
        const ordinaryMaterial = result.meshes.find((mesh) => mesh.material?.name === "ordinary")?.material;

        expect(retroMaterial).toBeInstanceOf(OpenPBRMaterial);
        expect((retroMaterial as OpenPBRMaterial).specularRetroreflectivity).toBe(0.75);
        expect(ordinaryMaterial).toBeInstanceOf(PBRMaterial);
    });

    it("uses zero as the default retroreflection factor", async () => {
        const result = await ImportMeshAsync(`data:${buildRetroreflectionGltf()}`, scene);
        const material = result.meshes.find((mesh) => mesh.material?.name === "retro")?.material as OpenPBRMaterial;

        expect(material.specularRetroreflectivity).toBe(0);
    });

    it("loads the factor texture as linear data and applies textureInfo transforms", async () => {
        const gltf = JSON.parse(buildRetroreflectionGltf(0.5));
        gltf.extensionsUsed.push("KHR_texture_transform");
        gltf.images = [
            {
                uri: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAFgwJ/l4pZ3wAAAABJRU5ErkJggg==",
            },
        ];
        gltf.textures = [{ source: 0 }];
        gltf.materials[0].extensions.KHR_materials_retroreflection.retroreflectionTexture = {
            index: 0,
            texCoord: 1,
            extensions: {
                KHR_texture_transform: {
                    offset: [0.25, 0.5],
                    scale: [0.5, 0.75],
                },
            },
        };

        const result = await ImportMeshAsync(`data:${JSON.stringify(gltf)}`, scene);
        const material = result.meshes.find((mesh) => mesh.material?.name === "retro")?.material as OpenPBRMaterial;
        const texture = material.specularRetroreflectivityTexture;

        expect(texture).not.toBeNull();
        expect(texture!.gammaSpace).toBe(false);
        expect(texture!.coordinatesIndex).toBe(1);
        expect(texture!.uOffset).toBe(0.25);
        expect(texture!.vOffset).toBe(0.5);
        expect(texture!.uScale).toBe(0.5);
        expect(texture!.vScale).toBe(0.75);
    });

    it.each(["KHR_materials_unlit", "KHR_materials_pbrSpecularGlossiness"])("rejects the incompatible %s material model", async (extensionName) => {
        const gltf = JSON.parse(buildRetroreflectionGltf(1));
        gltf.extensionsUsed.push(extensionName);
        gltf.materials[0].extensions[extensionName] = {};

        await expect(ImportMeshAsync(`data:${JSON.stringify(gltf)}`, scene)).rejects.toThrow("KHR_materials_retroreflection is incompatible");
    });
});
