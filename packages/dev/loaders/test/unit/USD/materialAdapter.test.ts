import { describe, expect, it } from "vitest";
import { NullEngine } from "core/Engines/nullEngine";
import { PBRMaterial } from "core/Materials/PBR/pbrMaterial.pure";
import { Scene } from "core/scene";
import { Texture } from "core/Materials/Textures/texture.pure";
import { type IResolvedMaterial } from "loaders/USD/resolution/resolvedStage";
import { CreateMaterialFromResolved } from "loaders/USD/adapter/materialAdapter";

const OneByOnePng = new Uint8Array([
    137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 0, 1, 0, 0, 0, 1, 8, 6, 0, 0, 0, 31, 21, 196, 137, 0, 0, 0, 13, 73, 68, 65, 84, 120, 156, 99, 248, 207, 192,
    240, 31, 0, 5, 0, 1, 255, 137, 153, 61, 29, 0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130,
]);

describe("USD material adapter", () => {
    it("maps resolved PBR values and embedded albedo texture settings", () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        const resolvedMaterial: IResolvedMaterial = {
            name: "ResolvedPreviewSurface",
            baseColor: [0.25, 0.5, 0.75],
            opacity: 0.6,
            metallic: 0.35,
            roughness: 0.8,
            emissiveColor: [0.1, 0.2, 0.3],
            ior: 1.45,
            occlusion: 0.7,
            clearcoat: 0.2,
            clearcoatRoughness: 0.4,
            useSpecularWorkflow: false,
            specularColor: [1, 1, 1],
            textures: {
                baseColor: {
                    uri: "inline-base-color.png",
                    data: OneByOnePng,
                    mimeType: "image/png",
                    uvSet: 1,
                    wrapU: "repeat",
                    wrapV: "clamp",
                    colorSpace: "sRGB",
                },
            },
        };

        const material = CreateMaterialFromResolved(resolvedMaterial, scene, {});

        expect(material.name).toBe("ResolvedPreviewSurface");
        expect(material.albedoColor.r).toBeCloseTo(0.25);
        expect(material.albedoColor.g).toBeCloseTo(0.5);
        expect(material.albedoColor.b).toBeCloseTo(0.75);
        expect(material.metallic).toBeCloseTo(0.35);
        expect(material.roughness).toBeCloseTo(0.8);
        expect(material.alpha).toBeCloseTo(0.6);
        expect(material.albedoTexture).toBeInstanceOf(Texture);
        expect(material.albedoTexture!.gammaSpace).toBe(true);
        expect(material.albedoTexture!.coordinatesIndex).toBe(1);
        expect(material.albedoTexture!.wrapU).toBe(Texture.WRAP_ADDRESSMODE);
        expect(material.albedoTexture!.wrapV).toBe(Texture.CLAMP_ADDRESSMODE);

        scene.dispose();
        engine.dispose();
    });

    it("does not interpret a specular-workflow roughness texture as glossiness", () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        const resolvedMaterial: IResolvedMaterial = {
            name: "SpecularWorkflow",
            baseColor: [1, 1, 1],
            opacity: 1,
            metallic: 0,
            roughness: 0.8,
            emissiveColor: [0, 0, 0],
            ior: 1.5,
            occlusion: 1,
            clearcoat: 0,
            clearcoatRoughness: 0,
            useSpecularWorkflow: true,
            specularColor: [1, 1, 1],
            textures: {
                roughness: {
                    uri: "roughness.png",
                    data: OneByOnePng,
                    uvSet: 0,
                    wrapU: "repeat",
                    wrapV: "repeat",
                    colorSpace: "raw",
                },
            },
        };

        const material = CreateMaterialFromResolved(resolvedMaterial, scene, {});

        expect(material.microSurface).toBeCloseTo(0.2);
        expect(material.microSurfaceTexture).toBeNull();

        scene.dispose();
        engine.dispose();
    });

    it.each([
        { name: "alpha test", opacity: 1, opacityThreshold: 0.5, expected: PBRMaterial.PBRMATERIAL_ALPHATEST },
        { name: "alpha blend", opacity: 0.5, opacityThreshold: undefined, expected: PBRMaterial.PBRMATERIAL_ALPHABLEND },
        { name: "alpha test and blend", opacity: 0.5, opacityThreshold: 0.5, expected: PBRMaterial.PBRMATERIAL_ALPHATESTANDBLEND },
    ])("selects $name from resolved opacity inputs", ({ opacity, opacityThreshold, expected }) => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        const resolvedMaterial: IResolvedMaterial = {
            name: "Transparency",
            baseColor: [1, 1, 1],
            opacity,
            opacityThreshold,
            metallic: 0,
            roughness: 0.5,
            emissiveColor: [0, 0, 0],
            ior: 1.5,
            occlusion: 1,
            clearcoat: 0,
            clearcoatRoughness: 0,
            useSpecularWorkflow: false,
            specularColor: [1, 1, 1],
            textures: {},
        };

        const material = CreateMaterialFromResolved(resolvedMaterial, scene, {});

        expect(material.transparencyMode).toBe(expected);
        if (opacityThreshold !== undefined) {
            expect(material.alphaCutOff).toBe(opacityThreshold);
        }

        scene.dispose();
        engine.dispose();
    });

    it("maps a packed metallic-roughness texture and black wrap mode", () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        const resolvedMaterial: IResolvedMaterial = {
            name: "PackedMetallicRoughness",
            baseColor: [1, 1, 1],
            opacity: 1,
            metallic: 1,
            roughness: 1,
            emissiveColor: [0, 0, 0],
            ior: 1.5,
            occlusion: 1,
            clearcoat: 0,
            clearcoatRoughness: 0,
            useSpecularWorkflow: false,
            specularColor: [1, 1, 1],
            textures: {
                metallic: {
                    uri: "packed.png",
                    data: OneByOnePng,
                    uvSet: 0,
                    wrapU: "black",
                    wrapV: "black",
                    colorSpace: "raw",
                    channel: "b",
                    scale: [1, 1, 0.25, 1],
                },
                roughness: {
                    uri: "packed.png",
                    data: OneByOnePng,
                    uvSet: 0,
                    wrapU: "black",
                    wrapV: "black",
                    colorSpace: "raw",
                    channel: "g",
                },
            },
        };

        const material = CreateMaterialFromResolved(resolvedMaterial, scene, {});

        expect(material.metallicTexture).toBeInstanceOf(Texture);
        expect(material.microSurfaceTexture).toBeNull();
        expect(material.useMetallnessFromMetallicTextureBlue).toBe(true);
        expect(material.useRoughnessFromMetallicTextureGreen).toBe(true);
        expect(material.metallicTexture!.wrapU).toBe(Texture.CLAMP_ADDRESSMODE);
        expect(material.metallicTexture!.wrapV).toBe(Texture.CLAMP_ADDRESSMODE);
        expect(material.metallicTexture!.level).toBeCloseTo(0.25);

        scene.dispose();
        engine.dispose();
    });
});
