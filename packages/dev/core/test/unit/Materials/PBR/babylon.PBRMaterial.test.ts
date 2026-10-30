import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Animation } from "core/Animations";
import { type Engine, NullEngine } from "core/Engines";
import { ImageProcessingConfiguration, PBRMaterial, RenderTargetTexture, Texture } from "core/Materials";
import { PBRMetallicRoughnessMaterial } from "core/Materials/PBR/pbrMetallicRoughnessMaterial";
import { PBRSpecularGlossinessMaterial } from "core/Materials/PBR/pbrSpecularGlossinessMaterial";
import { type PBRMaterialDefines } from "core/Materials/PBR/pbrBaseMaterial";
import { MaterialFlags } from "core/Materials/materialFlags";
import { CreatePlane } from "core/Meshes/Builders/planeBuilder";
import { PrePassRenderer } from "core/Rendering";
import "core/Rendering/prePassRendererSceneComponent";
import "core/Rendering/subSurfaceSceneComponent";
import { Scene } from "core/scene";

describe("PBRMaterial", () => {
    let subject: Engine;
    let scene: Scene;

    beforeEach(() => {
        subject = new NullEngine({
            renderHeight: 256,
            renderWidth: 256,
            textureSize: 256,
            deterministicLockstep: false,
            lockstepMaxSteps: 1,
        });
        scene = new Scene(subject);
    });

    describe("bent normal texture", () => {
        afterEach(() => {
            vi.restoreAllMocks();
            scene.dispose();
            subject.dispose();
        });

        it("tracks, animates, clones and serializes the texture on PBR materials", () => {
            const material = new PBRMaterial("bent", scene);
            const texture = new Texture("bentNormals.png", scene);
            texture.level = 0.45;
            texture.animations = [new Animation("bend", "level", 1, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CYCLE)];
            texture.animations[0].setKeys([{ frame: 0, value: 1 }]);
            material.bentNormalTexture = texture;

            expect(material.hasTexture(texture)).toBe(true);
            expect(material.getActiveTextures()).toContain(texture);
            expect(material.getAnimatables()).toContain(texture);
            expect(material.serialize().bentNormalTexture.name).toBe(texture.name);
            expect(material.serialize().bentNormalTexture.level).toBe(texture.level);
            expect(material.clone("clone").bentNormalTexture?.level).toBe(texture.level);
            const parsed = PBRMaterial.Parse(material.serialize(), scene, "");
            expect(parsed.bentNormalTexture?.name).toBe(texture.name);
            expect(parsed.bentNormalTexture?.level).toBe(texture.level);

            const dispose = vi.spyOn(texture, "dispose");
            material.dispose(false, true);
            expect(dispose).toHaveBeenCalledOnce();
        });

        it.each([
            ["metallic-roughness", PBRMetallicRoughnessMaterial],
            ["specular-glossiness", PBRSpecularGlossinessMaterial],
        ] as const)("round-trips the texture on %s materials", (_name, MaterialType) => {
            const material = new MaterialType("bent", scene);
            material.bentNormalTexture = new Texture("bentNormals.png", scene);
            material.bentNormalTexture.level = 0.45;

            expect(material.serialize().bentNormalTexture.name).toBe(material.bentNormalTexture.name);
            expect(material.clone("clone").bentNormalTexture?.level).toBe(material.bentNormalTexture.level);
            const parsed = MaterialType.Parse(material.serialize(), scene, "");
            expect(parsed.bentNormalTexture?.name).toBe(material.bentNormalTexture.name);
            expect(parsed.bentNormalTexture?.level).toBe(material.bentNormalTexture.level);
        });

        it("does not dispose a shared bent map by default", () => {
            const material = new PBRMaterial("bent", scene);
            material.bentNormalTexture = new Texture(null, scene);
            const dispose = vi.spyOn(material.bentNormalTexture, "dispose");

            material.dispose();

            expect(dispose).not.toHaveBeenCalled();
        });

        it.each(["reflection", "AO", "unlit", "derivatives", "bent flag", "reflection flag", "ambient flag", "textures"] as const)(
            "does not wait for an unused bent map: %s",
            (inactiveReason) => {
                subject.getCaps().standardDerivatives = true;
                const material = new PBRMaterial("bent", scene);
                const mesh = CreatePlane("plane", {}, scene);
                mesh.material = material;
                material.bentNormalTexture = new Texture(null, scene);
                material.ambientTexture = new Texture(null, scene);
                scene.environmentTexture = new RenderTargetTexture("environment", 16, scene);
                vi.spyOn(material.ambientTexture, "isReadyOrNotBlocking").mockReturnValue(true);
                vi.spyOn(scene.environmentTexture, "isReadyOrNotBlocking").mockReturnValue(true);
                const bentReady = vi.spyOn(material.bentNormalTexture, "isReadyOrNotBlocking").mockReturnValue(false);

                switch (inactiveReason) {
                    case "reflection":
                        scene.environmentTexture = null;
                        break;
                    case "AO":
                        material.ambientTexture = null;
                        break;
                    case "unlit":
                        material.unlit = true;
                        break;
                    case "derivatives":
                        subject.getCaps().standardDerivatives = false;
                        break;
                    case "bent flag":
                        vi.spyOn(MaterialFlags, "BentNormalTextureEnabled", "get").mockReturnValue(false);
                        break;
                    case "reflection flag":
                        vi.spyOn(MaterialFlags, "ReflectionTextureEnabled", "get").mockReturnValue(false);
                        break;
                    case "ambient flag":
                        vi.spyOn(MaterialFlags, "AmbientTextureEnabled", "get").mockReturnValue(false);
                        break;
                    case "textures":
                        scene.texturesEnabled = false;
                        break;
                }

                material.isReadyForSubMesh(mesh, mesh.subMeshes[0]);
                expect(bentReady).not.toHaveBeenCalled();
                expect((mesh.subMeshes[0].materialDefines as PBRMaterialDefines).BENTNORMAL).toBe(false);
            }
        );

        it.each(["ambient", "metallic"] as const)("waits for the bent map when %s AO and reflections are active", (source) => {
            subject.getCaps().standardDerivatives = true;
            const material = new PBRMaterial("bent", scene);
            const mesh = CreatePlane("plane", {}, scene);
            mesh.material = material;
            material.bentNormalTexture = new Texture(null, scene);
            scene.environmentTexture = new RenderTargetTexture("environment", 16, scene);
            if (source === "ambient") {
                material.ambientTexture = new Texture(null, scene);
                vi.spyOn(material.ambientTexture, "isReadyOrNotBlocking").mockReturnValue(true);
            } else {
                material.metallicTexture = new Texture(null, scene);
                material.useAmbientOcclusionFromMetallicTextureRed = true;
            }
            const bentReady = vi.spyOn(material.bentNormalTexture, "isReadyOrNotBlocking").mockReturnValue(false);

            expect(material.isReadyForSubMesh(mesh, mesh.subMeshes[0])).toBe(false);
            expect(bentReady).toHaveBeenCalledOnce();
        });

        it("updates the bent define when AO sources and scene textures change", () => {
            subject.getCaps().standardDerivatives = true;
            const material = new PBRMaterial("bent", scene);
            const mesh = CreatePlane("plane", {}, scene);
            mesh.material = material;
            material.bentNormalTexture = new Texture(null, scene);
            material.metallicTexture = new Texture(null, scene);
            scene.environmentTexture = new RenderTargetTexture("environment", 16, scene);
            for (const texture of [material.bentNormalTexture, material.metallicTexture, scene.environmentTexture]) {
                vi.spyOn(texture, "isReadyOrNotBlocking").mockReturnValue(true);
            }
            const subMesh = mesh.subMeshes[0];
            const bentEnabled = () => {
                scene.incrementRenderId();
                material.isReadyForSubMesh(mesh, subMesh);
                return (subMesh.materialDefines as PBRMaterialDefines).BENTNORMAL;
            };

            expect(bentEnabled()).toBe(false);
            material.useAmbientOcclusionFromMetallicTextureRed = true;
            expect(bentEnabled()).toBe(true);
            material.useAmbientOcclusionFromMetallicTextureRed = false;
            expect(bentEnabled()).toBe(false);
            material.ambientTexture = material.metallicTexture;
            expect(bentEnabled()).toBe(true);
            scene.texturesEnabled = false;
            expect(bentEnabled()).toBe(false);
        });

        it("re-evaluates the bent map when unlit toggles", () => {
            subject.getCaps().standardDerivatives = true;
            const material = new PBRMaterial("bent", scene);
            material.unlit = true;
            const mesh = CreatePlane("plane", {}, scene);
            mesh.material = material;
            material.bentNormalTexture = new Texture(null, scene);
            material.ambientTexture = new Texture(null, scene);
            scene.environmentTexture = new RenderTargetTexture("environment", 16, scene);
            vi.spyOn(material.ambientTexture, "isReadyOrNotBlocking").mockReturnValue(true);
            vi.spyOn(scene.environmentTexture, "isReadyOrNotBlocking").mockReturnValue(true);
            const bentReady = vi.spyOn(material.bentNormalTexture, "isReadyOrNotBlocking").mockReturnValue(false);
            const subMesh = mesh.subMeshes[0];
            const defines = () => subMesh.materialDefines as PBRMaterialDefines;
            const isReady = () => {
                scene.incrementRenderId();
                return material.isReadyForSubMesh(mesh, subMesh);
            };

            isReady();
            expect(bentReady).not.toHaveBeenCalled();
            expect(defines().BENTNORMAL).toBe(false);

            material.unlit = false;
            expect(isReady()).toBe(false);
            expect(bentReady).toHaveBeenCalled();

            bentReady.mockReturnValue(true);
            isReady();
            expect(defines().BENTNORMAL).toBe(true);
            expect(defines().UNLIT).toBe(false);

            material.unlit = true;
            bentReady.mockClear();
            isReady();
            expect(defines().BENTNORMAL).toBe(false);
            expect(defines().UNLIT).toBe(true);
            expect(bentReady).not.toHaveBeenCalled();
        });

        it("keeps unlit toggles unchanged without a bent map", () => {
            const material = new PBRMaterial("unlit", scene);
            material.unlit = true;
            const mesh = CreatePlane("plane", {}, scene);
            mesh.material = material;
            const subMesh = mesh.subMeshes[0];
            const defines = () => subMesh.materialDefines as PBRMaterialDefines;

            material.isReadyForSubMesh(mesh, subMesh);
            expect(defines().UNLIT).toBe(true);
            material.unlit = false;
            scene.incrementRenderId();
            material.isReadyForSubMesh(mesh, subMesh);
            expect(defines().UNLIT).toBe(false);
            expect(defines().BENTNORMAL).toBe(false);
        });
    });

    describe("getAnimatables", () => {
        let material: PBRMaterial;

        beforeEach(() => {
            material = new PBRMaterial("mat", scene);
        });

        it("should return an empty array when no any textures setup", () => {
            expect(material.getAnimatables()).toEqual([]);
        });

        it("should return an empty array when material has no any textures with animation", () => {
            material.albedoTexture = new Texture("texture.jpg", scene);
            material.ambientTexture = new Texture("texture.jpg", scene);
            material.opacityTexture = new Texture("texture.jpg", scene);
            material.reflectionTexture = new Texture("texture.jpg", scene);
            material.emissiveTexture = new Texture("texture.jpg", scene);
            material.reflectivityTexture = new Texture("texture.jpg", scene);
            material.metallicTexture = new Texture("texture.jpg", scene);
            material.metallicReflectanceTexture = new Texture("texture.jpg", scene);
            material.reflectanceTexture = new Texture("texture.jpg", scene);
            material.microSurfaceTexture = new Texture("texture.jpg", scene);
            material.bumpTexture = new Texture("texture.jpg", scene);
            material.lightmapTexture = new Texture("texture.jpg", scene);
            material.refractionTexture = new Texture("texture.jpg", scene);

            expect(material.getAnimatables()).toEqual([]);
        });

        it("should return an array with all available textures with animation", () => {
            const animParams = ["anim", "name", 1, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CYCLE] as const;

            material.albedoTexture = new Texture("albedoTexture.jpg", scene);
            material.albedoTexture.animations = [new Animation(...animParams)];

            material.ambientTexture = new Texture("ambientTexture.jpg", scene);
            material.ambientTexture.animations = [new Animation(...animParams)];

            material.opacityTexture = new Texture("opacityTexture.jpg", scene);
            material.opacityTexture.animations = [new Animation(...animParams)];

            material.reflectionTexture = new Texture("reflectionTexture.jpg", scene);
            material.reflectionTexture.animations = [new Animation(...animParams)];

            material.emissiveTexture = new Texture("emissiveTexture.jpg", scene);
            material.emissiveTexture.animations = [new Animation(...animParams)];

            material.reflectivityTexture = new Texture("reflectivityTexture.jpg", scene);
            material.reflectivityTexture.animations = [new Animation(...animParams)];

            material.metallicTexture = new Texture("metallicTexture.jpg", scene);
            material.metallicTexture.animations = [new Animation(...animParams)];

            material.metallicReflectanceTexture = new Texture("metallicReflectanceTexture.jpg", scene);
            material.metallicReflectanceTexture.animations = [new Animation(...animParams)];

            material.reflectanceTexture = new Texture("reflectanceTexture.jpg", scene);
            material.reflectanceTexture.animations = [new Animation(...animParams)];

            material.microSurfaceTexture = new Texture("microSurfaceTexture.jpg", scene);
            material.microSurfaceTexture.animations = [new Animation(...animParams)];

            material.bumpTexture = new Texture("bumpTexture.jpg", scene);
            material.bumpTexture.animations = [new Animation(...animParams)];

            material.lightmapTexture = new Texture("lightmapTexture.jpg", scene);
            material.lightmapTexture.animations = [new Animation(...animParams)];

            material.refractionTexture = new Texture("refractionTexture.jpg", scene);
            material.refractionTexture.animations = [new Animation(...animParams)];

            // By some reason not all textures can have animations, it's commented out
            expect(material.getAnimatables().map((x) => (x as Texture).url)).toEqual([
                "refractionTexture.jpg",
                "albedoTexture.jpg",
                "ambientTexture.jpg",
                "opacityTexture.jpg",
                "reflectionTexture.jpg",
                "emissiveTexture.jpg",
                // "reflectivityTexture.jpg",
                "metallicTexture.jpg",
                "bumpTexture.jpg",
                "lightmapTexture.jpg",
                "metallicReflectanceTexture.jpg",
                "reflectanceTexture.jpg",
                "microSurfaceTexture.jpg",
            ]);
        });

        it("should return reflectivity texture when metallic texture is not set", () => {
            material.reflectivityTexture = new Texture("reflectivityTexture.jpg", scene);
            material.reflectivityTexture.animations = [new Animation("anim", "name", 1, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CYCLE)];

            expect(material.getAnimatables().map((x) => (x as Texture).url)).toEqual(["reflectivityTexture.jpg"]);
        });
    });

    describe("getActiveTextures", () => {
        let material: PBRMaterial;

        beforeEach(() => {
            material = new PBRMaterial("mat", scene);
        });

        it("should return all textures", () => {
            material.albedoTexture = new Texture("albedoTexture.jpg", scene);
            material.ambientTexture = new Texture("ambientTexture.jpg", scene);
            material.opacityTexture = new Texture("opacityTexture.jpg", scene);
            material.reflectionTexture = new Texture("reflectionTexture.jpg", scene);
            material.emissiveTexture = new Texture("emissiveTexture.jpg", scene);
            material.reflectivityTexture = new Texture("reflectivityTexture.jpg", scene);
            material.metallicTexture = new Texture("metallicTexture.jpg", scene);
            material.metallicReflectanceTexture = new Texture("metallicReflectanceTexture.jpg", scene);
            material.reflectanceTexture = new Texture("reflectanceTexture.jpg", scene);
            material.microSurfaceTexture = new Texture("microSurfaceTexture.jpg", scene);
            material.bumpTexture = new Texture("bumpTexture.jpg", scene);
            material.lightmapTexture = new Texture("lightmapTexture.jpg", scene);
            material.refractionTexture = new Texture("refractionTexture.jpg", scene);

            const textures = material.getActiveTextures();

            expect(textures.map((x) => x.getInternalTexture()?.url)).toEqual([
                // Texture from default Material
                "refractionTexture.jpg",

                // PBR specific textures
                "albedoTexture.jpg",
                "ambientTexture.jpg",
                "opacityTexture.jpg",
                "reflectionTexture.jpg",
                "emissiveTexture.jpg",
                "reflectivityTexture.jpg",
                "metallicTexture.jpg",
                "metallicReflectanceTexture.jpg",
                "reflectanceTexture.jpg",
                "microSurfaceTexture.jpg",
                "bumpTexture.jpg",
                "lightmapTexture.jpg",
            ]);
        });

        it("should return an empty array if no textures", () => {
            const textures = material.getActiveTextures();
            expect(textures).toEqual([]);
        });
    });

    describe("hasTexture", () => {
        let material: PBRMaterial;
        let texture: Texture;

        beforeEach(() => {
            material = new PBRMaterial("mat", scene);
            texture = new Texture("texture.jpg", scene);
        });

        it("should return false when texture not defined", () => {
            expect(material.hasTexture(texture)).toEqual(false);
        });

        it("should return true when albedo texture is defined", () => {
            material.albedoTexture = texture;
            expect(material.hasTexture(texture)).toEqual(true);
        });

        it("should return true when ambient texture is defined", () => {
            material.ambientTexture = texture;
            expect(material.hasTexture(texture)).toEqual(true);
        });

        it("should return true when opacity texture is defined", () => {
            material.opacityTexture = texture;
            expect(material.hasTexture(texture)).toEqual(true);
        });

        it("should return true when reflection texture is defined", () => {
            material.reflectionTexture = texture;
            expect(material.hasTexture(texture)).toEqual(true);
        });

        it("should return true when emissive texture is defined", () => {
            material.emissiveTexture = texture;
            expect(material.hasTexture(texture)).toEqual(true);
        });

        it("should return true when reflectivity texture is defined", () => {
            material.reflectivityTexture = texture;
            expect(material.hasTexture(texture)).toEqual(true);
        });

        it("should return true when metallic texture is defined", () => {
            material.metallicTexture = texture;
            expect(material.hasTexture(texture)).toEqual(true);
        });

        it("should return true when metallic reflection texture is defined", () => {
            material.metallicReflectanceTexture = texture;
            expect(material.hasTexture(texture)).toEqual(true);
        });

        it("should return true when reflectance texture is defined", () => {
            material.reflectanceTexture = texture;
            expect(material.hasTexture(texture)).toEqual(true);
        });

        it("should return true when microsurface texture is defined", () => {
            material.microSurfaceTexture = texture;
            expect(material.hasTexture(texture)).toEqual(true);
        });

        it("should return true when bump texture is defined", () => {
            material.bumpTexture = texture;
            expect(material.hasTexture(texture)).toEqual(true);
        });

        it("should return true when lightmap texture is defined", () => {
            material.lightmapTexture = texture;
            expect(material.hasTexture(texture)).toEqual(true);
        });

        it("should return true when refraction texture is defined", () => {
            material.refractionTexture = texture;
            expect(material.hasTexture(texture)).toEqual(true);
        });
    });

    describe("setPrePassRenderer", () => {
        let material: PBRMaterial;

        beforeEach(() => {
            material = new PBRMaterial("mat", scene);
        });

        it("should scene prePassRenderer be disabled by default", () => {
            expect(scene.prePassRenderer).toBeUndefined();
        });

        it("should set prepass renderer when scattering enable", () => {
            material.subSurface.isScatteringEnabled = true;
            material.setPrePassRenderer();

            expect(scene.prePassRenderer).toBeDefined();
        });

        it("should not set prepass renderer when refraction disabled", () => {
            material.subSurface.isScatteringEnabled = false;
            material.setPrePassRenderer();

            expect(scene.prePassRenderer).toBeUndefined();
        });

        it("should enable subSurfaceConfiguration when PrePassRenderer supported (WebGL2)", () => {
            expect(scene.subSurfaceConfiguration?.enabled).toBeFalsy();

            vi.spyOn(PrePassRenderer.prototype, "isSupported", "get").mockReturnValue(true);

            material.subSurface.isScatteringEnabled = true;
            material.setPrePassRenderer();

            expect(scene.subSurfaceConfiguration?.enabled).toBeTruthy();
        });
    });

    describe("dispose", () => {
        let material: PBRMaterial;

        beforeEach(() => {
            material = new PBRMaterial("mat", scene);
        });

        describe("textures disposal", () => {
            let albedoTextureDisposeSpy: MockInstance;
            let ambientTextureDisposeSpy: MockInstance;
            let opacityTextureDisposeSpy: MockInstance;
            let reflectionTextureDisposeSpy: MockInstance;
            let emissiveTextureDisposeSpy: MockInstance;
            let reflectivityTextureDisposeSpy: MockInstance;
            let metallicTextureDisposeSpy: MockInstance;
            let metallicReflectanceTextureDisposeSpy: MockInstance;
            let reflectanceTextureDisposeSpy: MockInstance;
            let microSurfaceTextureDisposeSpy: MockInstance;
            let bumpTextureDisposeSpy: MockInstance;
            let lightmapTextureDisposeSpy: MockInstance;
            let refractionTextureDisposeSpy: MockInstance;

            beforeEach(() => {
                material.albedoTexture = new Texture("texture.jpg", scene);
                albedoTextureDisposeSpy = vi.spyOn(material.albedoTexture, "dispose");

                material.ambientTexture = new Texture("texture.jpg", scene);
                ambientTextureDisposeSpy = vi.spyOn(material.ambientTexture, "dispose");

                material.opacityTexture = new Texture("texture.jpg", scene);
                opacityTextureDisposeSpy = vi.spyOn(material.opacityTexture, "dispose");

                material.reflectionTexture = new Texture("texture.jpg", scene);
                reflectionTextureDisposeSpy = vi.spyOn(material.reflectionTexture, "dispose");

                material.emissiveTexture = new Texture("texture.jpg", scene);
                emissiveTextureDisposeSpy = vi.spyOn(material.emissiveTexture, "dispose");

                material.reflectivityTexture = new Texture("texture.jpg", scene);
                reflectivityTextureDisposeSpy = vi.spyOn(material.reflectivityTexture, "dispose");

                material.metallicTexture = new Texture("texture.jpg", scene);
                metallicTextureDisposeSpy = vi.spyOn(material.metallicTexture, "dispose");

                material.metallicReflectanceTexture = new Texture("texture.jpg", scene);
                metallicReflectanceTextureDisposeSpy = vi.spyOn(material.metallicReflectanceTexture, "dispose");

                material.reflectanceTexture = new Texture("texture.jpg", scene);
                reflectanceTextureDisposeSpy = vi.spyOn(material.reflectanceTexture, "dispose");

                material.microSurfaceTexture = new Texture("texture.jpg", scene);
                microSurfaceTextureDisposeSpy = vi.spyOn(material.microSurfaceTexture, "dispose");

                material.bumpTexture = new Texture("texture.jpg", scene);
                bumpTextureDisposeSpy = vi.spyOn(material.bumpTexture, "dispose");

                material.lightmapTexture = new Texture("texture.jpg", scene);
                lightmapTextureDisposeSpy = vi.spyOn(material.lightmapTexture, "dispose");

                material.refractionTexture = new Texture("texture.jpg", scene);
                refractionTextureDisposeSpy = vi.spyOn(material.refractionTexture, "dispose");
            });

            it("should dispose all textures", () => {
                material.dispose(true, true);

                expect(albedoTextureDisposeSpy).toHaveBeenCalledTimes(1);
                expect(ambientTextureDisposeSpy).toHaveBeenCalledTimes(1);
                expect(opacityTextureDisposeSpy).toHaveBeenCalledTimes(1);
                expect(reflectionTextureDisposeSpy).toHaveBeenCalledTimes(1);
                expect(emissiveTextureDisposeSpy).toHaveBeenCalledTimes(1);
                expect(reflectivityTextureDisposeSpy).toHaveBeenCalledTimes(1);
                expect(metallicTextureDisposeSpy).toHaveBeenCalledTimes(1);
                expect(metallicReflectanceTextureDisposeSpy).toHaveBeenCalledTimes(1);
                expect(reflectanceTextureDisposeSpy).toHaveBeenCalledTimes(1);
                expect(microSurfaceTextureDisposeSpy).toHaveBeenCalledTimes(1);
                expect(bumpTextureDisposeSpy).toHaveBeenCalledTimes(1);
                expect(lightmapTextureDisposeSpy).toHaveBeenCalledTimes(1);
                expect(refractionTextureDisposeSpy).toHaveBeenCalledTimes(1);
            });

            it("should not dispose textures when forceDisposeTextures is false", () => {
                material.dispose(true, false);

                expect(albedoTextureDisposeSpy).toHaveBeenCalledTimes(0);
                expect(ambientTextureDisposeSpy).toHaveBeenCalledTimes(0);
                expect(opacityTextureDisposeSpy).toHaveBeenCalledTimes(0);
                expect(reflectionTextureDisposeSpy).toHaveBeenCalledTimes(0);
                expect(emissiveTextureDisposeSpy).toHaveBeenCalledTimes(0);
                expect(reflectivityTextureDisposeSpy).toHaveBeenCalledTimes(0);
                expect(metallicTextureDisposeSpy).toHaveBeenCalledTimes(0);
                expect(metallicReflectanceTextureDisposeSpy).toHaveBeenCalledTimes(0);
                expect(reflectanceTextureDisposeSpy).toHaveBeenCalledTimes(0);
                expect(microSurfaceTextureDisposeSpy).toHaveBeenCalledTimes(0);
                expect(bumpTextureDisposeSpy).toHaveBeenCalledTimes(0);
                expect(lightmapTextureDisposeSpy).toHaveBeenCalledTimes(0);
                expect(refractionTextureDisposeSpy).toHaveBeenCalledTimes(0);
            });
        });

        it("should not dispose environment BRDF texture if it used as environment texture in the scene", () => {
            const texture = new Texture("texture.jpg", scene);

            scene.environmentBRDFTexture = texture;
            material.environmentBRDFTexture = texture;

            const environmentTextureDisposeSpy = vi.spyOn(material.environmentBRDFTexture, "dispose");
            const textureDisposeSpy = vi.spyOn(texture, "dispose");

            material.dispose(true, true);

            expect(environmentTextureDisposeSpy).toHaveBeenCalledTimes(0);
            expect(textureDisposeSpy).toHaveBeenCalledTimes(0);
        });

        it("should dispose environment BRDF texture if it not used as environment texture in the scene", () => {
            const texture = new Texture("texture.jpg", scene);

            material.environmentBRDFTexture = texture;

            const environmentTextureDisposeSpy = vi.spyOn(material.environmentBRDFTexture, "dispose");
            const textureDisposeSpy = vi.spyOn(texture, "dispose");

            material.dispose(true, true);

            expect(environmentTextureDisposeSpy).toHaveBeenCalledTimes(1);
            expect(textureDisposeSpy).toHaveBeenCalledTimes(1);
        });

        it("should not dispose environment BRDF texture if it used as environment texture in the scene and forceDisposeTextures is false", () => {
            const texture = new Texture("texture.jpg", scene);

            scene.environmentBRDFTexture = texture;
            material.environmentBRDFTexture = texture;

            const environmentTextureDisposeSpy = vi.spyOn(material.environmentBRDFTexture, "dispose");
            const textureDisposeSpy = vi.spyOn(texture, "dispose");

            material.dispose(true, false);

            expect(environmentTextureDisposeSpy).toHaveBeenCalledTimes(0);
            expect(textureDisposeSpy).toHaveBeenCalledTimes(0);
        });

        it("should dispose render targets", () => {
            material.reflectionTexture = new RenderTargetTexture("renderTarget", 512, scene);

            const renderingTextures = material.getRenderTargetTextures!();
            expect(renderingTextures?.length).toBe(1);

            material.dispose();

            expect(renderingTextures?.length).toBe(0);
        });

        it("should remove image processing observer", () => {
            const imageProcessingConfiguration = new ImageProcessingConfiguration();

            material.imageProcessingConfiguration = imageProcessingConfiguration;

            const imageProcessingRemoveSpy = vi.spyOn(imageProcessingConfiguration.onUpdateParameters, "remove");

            material.dispose();

            expect(imageProcessingRemoveSpy).toHaveBeenCalledTimes(1);
        });
    });
});
