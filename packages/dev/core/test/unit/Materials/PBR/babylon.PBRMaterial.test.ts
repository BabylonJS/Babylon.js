import { Animation } from "core/Animations";
import type { Engine } from "core/Engines";
import { NullEngine } from "core/Engines";
import { ImageProcessingConfiguration, PBRMaterial, RenderTargetTexture, Texture } from "core/Materials";
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
