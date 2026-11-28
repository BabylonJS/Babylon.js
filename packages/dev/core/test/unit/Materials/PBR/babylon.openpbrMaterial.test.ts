import { describe, it, expect, vi, beforeEach } from "vitest";
import { NullEngine } from "core/Engines/nullEngine";
import { type Engine } from "core/Engines/engine";
import { Material } from "core/Materials/material";
import { Color3 } from "core/Maths/math.color";
import { Vector2 } from "core/Maths/math.vector";
import { Mesh } from "core/Meshes/mesh";
import { SubMesh } from "core/Meshes/subMesh";
import { OpenPBRMaterial } from "core/Materials/PBR/openpbrMaterial";
import { RenderTargetTexture } from "core/Materials/Textures/renderTargetTexture";
import { Texture } from "core/Materials/Textures/texture";
import { ThinTexture } from "core/Materials/Textures/thinTexture";
import { Scene } from "core/scene";
import { openpbrDirectLighting as openpbrDirectLightingGLSL } from "core/Shaders/ShadersInclude/openpbrDirectLighting";
import { openpbrDirectLightingWGSL } from "core/ShadersWGSL/ShadersInclude/openpbrDirectLighting";
import { pbrDirectLightingFunctions as pbrDirectLightingFunctionsGLSL } from "core/Shaders/ShadersInclude/pbrDirectLightingFunctions";
import { pbrDirectLightingFunctionsWGSL } from "core/ShadersWGSL/ShadersInclude/pbrDirectLightingFunctions";
import { openpbrIblFunctions as openpbrIblFunctionsGLSL } from "core/Shaders/ShadersInclude/openpbrIblFunctions";
import { openpbrIblFunctionsWGSL } from "core/ShadersWGSL/ShadersInclude/openpbrIblFunctions";
import { openpbrDirectLightingInit as openpbrDirectLightingInitGLSL } from "core/Shaders/ShadersInclude/openpbrDirectLightingInit";
import { openpbrDirectLightingInitWGSL } from "core/ShadersWGSL/ShadersInclude/openpbrDirectLightingInit";

describe("OpenPBRMaterial", () => {
    let engine: Engine;
    let scene: Scene;

    beforeEach(() => {
        engine = new NullEngine({
            renderHeight: 256,
            renderWidth: 256,
            textureSize: 256,
            deterministicLockstep: false,
            lockstepMaxSteps: 1,
        });
        scene = new Scene(engine);
    });

    describe("SSS texture readiness blocking", () => {
        it("isReadyForSubMesh returns false when sssIrradianceTexture is assigned but not ready", () => {
            const material = new OpenPBRMaterial("mat", scene);
            material.subsurfaceWeight = 0.5;

            const mesh = new Mesh("testMesh", scene);
            mesh.subMeshes = [];
            mesh.material = material;
            // createBoundingBox=false avoids computing bounding info on a geometry-less mesh
            new SubMesh(0, 0, 0, 0, 0, mesh, undefined, false);

            const notReadyTexture = new ThinTexture(null);
            vi.spyOn(notReadyTexture, "isReady").mockReturnValue(false);
            const readyTexture = new ThinTexture(null);
            vi.spyOn(readyTexture, "isReady").mockReturnValue(true);

            // Assign textures before the first isReadyForSubMesh call so the
            // freshly-created MaterialDefines see them with _areTexturesDirty=true.
            material.sssIrradianceTexture = notReadyTexture;
            material.sssDepthTexture = readyTexture;

            expect(material.isReadyForSubMesh(mesh, mesh.subMeshes[0])).toBe(false);
        });

        it("isReadyForSubMesh returns false when sssDepthTexture is assigned but not ready", () => {
            const material = new OpenPBRMaterial("mat", scene);
            material.subsurfaceWeight = 0.5;

            const mesh = new Mesh("testMesh", scene);
            mesh.subMeshes = [];
            mesh.material = material;
            new SubMesh(0, 0, 0, 0, 0, mesh, undefined, false);

            const readyTexture = new ThinTexture(null);
            vi.spyOn(readyTexture, "isReady").mockReturnValue(true);
            const notReadyTexture = new ThinTexture(null);
            vi.spyOn(notReadyTexture, "isReady").mockReturnValue(false);

            material.sssIrradianceTexture = readyTexture;
            material.sssDepthTexture = notReadyTexture;

            expect(material.isReadyForSubMesh(mesh, mesh.subMeshes[0])).toBe(false);
        });

        it("scene.isReady() returns false while sssIrradianceTexture is not ready", () => {
            const material = new OpenPBRMaterial("mat", scene);
            material.subsurfaceWeight = 0.5;

            const mesh = new Mesh("testMesh", scene);
            mesh.subMeshes = [];
            mesh.material = material;
            new SubMesh(0, 0, 0, 0, 0, mesh, undefined, false);

            const notReadyTexture = new ThinTexture(null);
            vi.spyOn(notReadyTexture, "isReady").mockReturnValue(false);
            const readyTexture = new ThinTexture(null);
            vi.spyOn(readyTexture, "isReady").mockReturnValue(true);

            material.sssIrradianceTexture = notReadyTexture;
            material.sssDepthTexture = readyTexture;

            expect(scene.isReady()).toBe(false);
        });

        it("scene.isReady() returns false while sssDepthTexture is not ready", () => {
            const material = new OpenPBRMaterial("mat", scene);
            material.subsurfaceWeight = 0.5;

            const mesh = new Mesh("testMesh", scene);
            mesh.subMeshes = [];
            mesh.material = material;
            new SubMesh(0, 0, 0, 0, 0, mesh, undefined, false);

            const readyTexture = new ThinTexture(null);
            vi.spyOn(readyTexture, "isReady").mockReturnValue(true);
            const notReadyTexture = new ThinTexture(null);
            vi.spyOn(notReadyTexture, "isReady").mockReturnValue(false);

            material.sssIrradianceTexture = readyTexture;
            material.sssDepthTexture = notReadyTexture;

            expect(scene.isReady()).toBe(false);
        });

        it("scene.onReadyObservable does not fire while SSS textures are not ready", () => {
            const material = new OpenPBRMaterial("mat", scene);
            material.subsurfaceWeight = 0.5;

            const mesh = new Mesh("testMesh", scene);
            mesh.subMeshes = [];
            mesh.material = material;
            new SubMesh(0, 0, 0, 0, 0, mesh, undefined, false);

            const notReadyTexture = new ThinTexture(null);
            vi.spyOn(notReadyTexture, "isReady").mockReturnValue(false);

            material.sssIrradianceTexture = notReadyTexture;
            material.sssDepthTexture = notReadyTexture;

            const readyCallback = vi.fn();
            scene.onReadyObservable.add(readyCallback);

            // scene.isReady() is false so _checkIsReady would not notify the observable
            expect(scene.isReady()).toBe(false);
            expect(readyCallback).not.toHaveBeenCalled();
        });
    });

    describe("Shader backend consistency", () => {
        it.each([
            ["GLSL", openpbrDirectLightingGLSL.shader],
            ["WGSL", openpbrDirectLightingWGSL.shader],
        ])("applies OpenPBR area-light Fresnel once in %s", (_language, shader) => {
            expect(shader).toContain("slab_glossy=computeOpenPBRAreaSpecularLighting(");
            expect(shader).toContain("slab_metal=computeOpenPBRAreaConductorSpecularLighting(");
            expect(shader).toContain("slab_coat=computeOpenPBRAreaSpecularLighting(");
            expect(shader).toContain("baseDielectricReflectance.coloredF0");
            expect(shader).toContain("baseConductorReflectance.coloredF0");
            expect(shader).toMatch(/material_dielectric_gloss(?:: vec3f)?\s*=\s*material_dielectric_base\s*\*\s*\(1\.0f?\s*-\s*specularFresnel\)\s*\+\s*slab_glossy\s*;/);
        });

        it.each([
            ["GLSL", pbrDirectLightingFunctionsGLSL.shader],
            ["WGSL", pbrDirectLightingFunctionsWGSL.shader],
        ])("computes OpenPBR area-light Fresnel independently of light color in %s", (_language, shader) => {
            expect(shader).toMatch(
                /fresnel(?:: vec3f)?\s*=\s*reflectance0\s*\*\s*info\.areaLightFresnel\.x\s*\+\s*\(reflectance90\s*-\s*reflectance0\)\s*\*\s*info\.areaLightFresnel\.y/
            );
            expect(shader).toMatch(/return lightColor\s*\*\s*fresnel\s*\*\s*info\.areaLightSpecular/);
            expect(shader).toMatch(/return reflectance0\s*\*\s*info\.areaLightFresnel\.x\s*\+\s*\(reflectance90\s*-\s*reflectance0\)\s*\*\s*info\.areaLightFresnel\.y/);
        });

        it.each([
            ["GLSL", pbrDirectLightingFunctionsGLSL.shader],
            ["WGSL", pbrDirectLightingFunctionsWGSL.shader],
        ])("preserves white F90 in the OpenPBR conductor area-light approximation in %s", (_language, shader) => {
            expect(shader).toContain("computeOpenPBRAreaConductorSpecularLighting");
            expect(shader).toContain("getF82B(reflectance0,edgeTint)");
            expect(shader).toMatch(/fresnel(?:: vec3f)?=reflectance0\*info\.areaLightFresnel\.x\+\(vec3f?\(1\.0f?\)-reflectance0\)\*info\.areaLightFresnel\.y-b\*f82DipMoment/);
        });

        it("preserves the GLSL vec4 area-light data argument", () => {
            expect(openpbrDirectLightingInitGLSL.shader).toContain("light{X}.vLightData,light{X}.vLightWidth.xyz");
        });

        it("passes WGSL area-light textures, samplers, and center explicitly", () => {
            expect(openpbrDirectLightingInitWGSL.shader).toContain(
                "computeAreaPreLightingInfo(areaLightsLTC1Sampler,areaLightsLTC1SamplerSampler,areaLightsLTC2Sampler,areaLightsLTC2SamplerSampler"
            );
            expect(openpbrDirectLightingInitWGSL.shader).toContain("light{X}.vLightData.xyz");
        });

        it.each([
            ["GLSL", openpbrIblFunctionsGLSL.shader, "vec2 reflectionCoords=createReflectionCoords(positionW,mappingNormal)", "normalize(vEyePosition.xyz-positionW)"],
            ["WGSL", openpbrIblFunctionsWGSL.shader, "let reflectionCoords: vec2f=createReflectionCoords(positionW,mappingNormal)", "normalize(scene.vEyePosition.xyz-positionW)"],
        ])("converts anisotropic non-cube rays to 2D coordinates in %s", (_language, shader, expectedCoordinates, expectedEyePosition) => {
            expect(shader).toContain(expectedCoordinates);
            expect(shader).toContain(expectedEyePosition);
            expect(shader).toMatch(/mappingNormalCandidate(?:: vec3f)?=originalViewDirectionW\+sampleDirection/);
            expect(shader).toContain("dot(mappingNormalCandidate,mappingNormalCandidate)>Epsilon");
            expect(shader).toContain("mappingNormal=normalize(cross(originalViewDirectionW,perpendicularAxis))");
        });

        it("uses the same precomputed conductor Fresnel input in GLSL and WGSL", () => {
            expect(openpbrDirectLightingGLSL.shader).toContain(
                "slab_metal=computeSpecularLighting(preInfo{X},normalW,vec3(1.0),coloredFresnel,specular_roughness,lightColor{X}.rgb)"
            );
            expect(openpbrDirectLightingWGSL.shader).toContain(
                "slab_metal=computeSpecularLighting(preInfo{X},normalW,vec3f(1.0f),coloredFresnel,specular_roughness,lightColor{X}.rgb)"
            );
        });
    });

    describe("Per-frame uniform gating", () => {
        // The 5 subsurface-scattering uniforms are only read by the shader inside
        // `#ifdef SUBSURFACE_SLAB`, so the per-frame UBO update loop in
        // `bindForSubMesh` skips them when SSS is inactive. The skip is wired by
        // the `requiredDefine` field on the cached `_uniformsArray` entries; this
        // test asserts the wiring is in place. The actual per-frame skip is then
        // a plain inline check in `bindForSubMesh`:
        //   `if (uniform.requiredDefine !== undefined && !defines[uniform.requiredDefine]) continue;`
        // Driving that loop end-to-end from a unit test would require a real GPU
        // pipeline context, so we cover its runtime behavior via the playground
        // perf benchmark documented in the PR instead.
        it("tags SSS uniforms with requiredDefine = 'SUBSURFACE_SLAB' and leaves other uniforms ungated", () => {
            const material = new OpenPBRMaterial("mat", scene);
            const uniformsArray: { name: string; requiredDefine?: string }[] = (material as any)._uniformsArray;

            expect(uniformsArray.length).toBeGreaterThan(0);

            const sssUniformNames = ["vSubsurfaceWeight", "vSubsurfaceColor", "vSubsurfaceRadius", "vSubsurfaceRadiusScale", "vSubsurfaceScatterAnisotropy"];
            for (const name of sssUniformNames) {
                const uniform = uniformsArray.find((u) => u.name === name);
                expect(uniform, `expected uniform ${name} to be present`).toBeDefined();
                expect(uniform!.requiredDefine, `expected ${name} to be gated by SUBSURFACE_SLAB`).toBe("SUBSURFACE_SLAB");
            }

            // A representative non-SSS uniform must not be gated, otherwise we'd silently
            // stop pushing base-layer values to the UBO.
            const baseWeight = uniformsArray.find((u) => u.name === "vBaseWeight");
            expect(baseWeight, "expected vBaseWeight to be present").toBeDefined();
            expect(baseWeight!.requiredDefine).toBeUndefined();
        });

        it("caches firstLinkedKey on each Uniform so the per-frame loop avoids Object.keys allocation", () => {
            const material = new OpenPBRMaterial("mat", scene);
            const uniformsArray: { name: string; firstLinkedKey: string; linkedProperties: Record<string, unknown> }[] = (material as any)._uniformsArray;

            expect(uniformsArray.length).toBeGreaterThan(0);
            for (const uniform of uniformsArray) {
                expect(uniform.firstLinkedKey, `expected ${uniform.name} to have a cached firstLinkedKey`).not.toBe("");
                expect(uniform.linkedProperties[uniform.firstLinkedKey], `cached firstLinkedKey on ${uniform.name} must point to a real linked property`).toBeDefined();
            }
        });
    });

    describe("clone", () => {
        it("preserves representative OpenPBR inputs", () => {
            const material = new OpenPBRMaterial("mat", scene);
            material.baseColor = new Color3(0.2, 0.3, 0.4);
            material.specularRoughness = 0.61;
            material.specularRoughnessAnisotropy = 0.72;
            material.geometryTangent = new Vector2(0, 1);
            material.transmissionWeight = 0.43;
            material.subsurfaceWeight = 0.54;
            material.coatWeight = 0.65;
            material.fuzzWeight = 0.76;
            material.geometryThinWalled = 1;
            material.geometryOpacity = 0.87;
            material.emissionColor = new Color3(1.2, 0.4, 0.1);
            material.thinFilmWeight = 0.98;

            const clone = material.clone("clone");

            expect(clone.baseColor).toEqual(material.baseColor);
            expect(clone.baseColor).not.toBe(material.baseColor);
            expect(clone.specularRoughness).toBe(material.specularRoughness);
            expect(clone.specularRoughnessAnisotropy).toBe(material.specularRoughnessAnisotropy);
            expect(clone.geometryTangent).toEqual(material.geometryTangent);
            expect(clone.geometryTangent).not.toBe(material.geometryTangent);
            expect(clone.transmissionWeight).toBe(material.transmissionWeight);
            expect(clone.subsurfaceWeight).toBe(material.subsurfaceWeight);
            expect(clone.coatWeight).toBe(material.coatWeight);
            expect(clone.fuzzWeight).toBe(material.fuzzWeight);
            expect(clone.geometryThinWalled).toBe(material.geometryThinWalled);
            expect(clone.geometryOpacity).toBe(material.geometryOpacity);
            expect(clone.emissionColor).toEqual(material.emissionColor);
            expect(clone.thinFilmWeight).toBe(material.thinFilmWeight);
        });

        it("clones a shared OpenPBR texture only once by default", () => {
            const material = new OpenPBRMaterial("mat", scene);
            const texture = new Texture(null, scene);
            texture.uScale = 2;
            const cloneTexture = vi.spyOn(texture, "clone");
            material.baseColorTexture = texture;
            material.geometryOpacityTexture = texture;
            material.backgroundRefractionTexture = texture;

            const clone = material.clone("clone");

            expect(cloneTexture).toHaveBeenCalledTimes(1);
            expect(clone.baseColorTexture).toBeInstanceOf(Texture);
            expect(clone.baseColorTexture).not.toBe(texture);
            expect(clone.baseColorTexture).toBe(clone.geometryOpacityTexture);
            expect(clone.backgroundRefractionTexture === clone.baseColorTexture).toBe(true);
            expect((clone.baseColorTexture as Texture).uScale).toBe(2);
        });

        it("clones each OpenPBR texture binding when texture reuse is disabled", () => {
            const material = new OpenPBRMaterial("mat", scene);
            const texture = new Texture(null, scene);
            const cloneTexture = vi.spyOn(texture, "clone");
            material.baseColorTexture = texture;
            material.geometryOpacityTexture = texture;
            material.backgroundRefractionTexture = texture;

            const clone = material.clone("clone", false);

            expect(cloneTexture).toHaveBeenCalledTimes(3);
            expect(clone.backgroundRefractionTexture).toBeInstanceOf(Texture);
            expect(clone.backgroundRefractionTexture).not.toBe(clone.baseColorTexture);
            expect(clone.backgroundRefractionTexture).not.toBe(clone.geometryOpacityTexture);
            expect(clone.baseColorTexture).toBeInstanceOf(Texture);
            expect(clone.geometryOpacityTexture).toBeInstanceOf(Texture);
            expect(clone.baseColorTexture).not.toBe(clone.geometryOpacityTexture);
        });

        it("keeps a render target bound to the clone", () => {
            const material = new OpenPBRMaterial("mat", scene);
            const texture = new RenderTargetTexture("render target", 16, scene);
            const cloneTexture = vi.spyOn(texture, "clone");
            material.baseColorTexture = texture;
            material.backgroundRefractionTexture = texture;

            const clone = material.clone("clone");

            expect(clone.baseColorTexture === texture).toBe(true);
            expect(clone.backgroundRefractionTexture === texture).toBe(true);
            expect(cloneTexture).not.toHaveBeenCalled();
        });

        it("shares the subsurface irradiance and depth textures", () => {
            const material = new OpenPBRMaterial("mat", scene);
            const irradiance = new ThinTexture(null);
            const depth = new ThinTexture(null);
            material.sssIrradianceTexture = irradiance;
            material.sssDepthTexture = depth;

            const clone = material.clone("clone", false);

            expect(clone.sssIrradianceTexture).toBe(irradiance);
            expect(clone.sssDepthTexture).toBe(depth);
        });

        it("preserves how packed glTF textures are read", () => {
            const material = new OpenPBRMaterial("mat", scene);
            material.baseColorTexture = new Texture(null, scene);
            material.baseColorTexture.hasAlpha = true;
            material.transparencyMode = Material.MATERIAL_ALPHABLEND;
            material._useAlphaFromBaseColorTexture = true;
            material.baseMetalnessTexture = new Texture(null, scene);
            material._useMetallicFromMetallicTextureBlue = true;
            material._useRoughnessFromMetallicTextureGreen = true;
            material._useGltfStyleAnisotropy = true;

            const clone = material.clone("clone");

            expect(clone._useAlphaFromBaseColorTexture).toBe(true);
            expect(clone._useMetallicFromMetallicTextureBlue).toBe(true);
            expect(clone._useRoughnessFromMetallicTextureGreen).toBe(true);
            expect(clone._useGltfStyleAnisotropy).toBe(true);
        });
    });
});
