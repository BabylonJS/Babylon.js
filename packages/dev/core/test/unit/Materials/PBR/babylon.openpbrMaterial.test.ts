import { describe, it, expect, vi, beforeEach } from "vitest";
import { Constants } from "core/Engines/constants";
import { NullEngine } from "core/Engines/nullEngine";
import { type Engine } from "core/Engines/engine";
import { Mesh } from "core/Meshes/mesh";
import { SubMesh } from "core/Meshes/subMesh";
import { OpenPBRMaterial, OpenPBRMaterialDefines } from "core/Materials/PBR/openpbrMaterial";
import "core/Materials/colorCurves";
import { RawTexture } from "core/Materials/Textures/rawTexture";
import { Texture } from "core/Materials/Textures/texture";
import { ThinTexture } from "core/Materials/Textures/thinTexture";
import { Scene } from "core/scene";
import { Vector3, Vector4 } from "core/Maths/math.vector";
import { FreeCamera } from "core/Cameras/freeCamera";
import { CreateBox } from "core/Meshes/Builders/boxBuilder";
import { openpbrVertexShader as openpbrVertexShaderGLSL } from "core/Shaders/openpbr.vertex";
import { openpbrVertexShaderWGSL } from "core/ShadersWGSL/openpbr.vertex";
import { openpbrDirectLighting as openpbrDirectLightingGLSL } from "core/Shaders/ShadersInclude/openpbrDirectLighting";
import { openpbrDirectLightingWGSL } from "core/ShadersWGSL/ShadersInclude/openpbrDirectLighting";
import { openpbrEnvironmentLighting as openpbrEnvironmentLightingGLSL } from "core/Shaders/ShadersInclude/openpbrEnvironmentLighting";
import { openpbrEnvironmentLightingWGSL } from "core/ShadersWGSL/ShadersInclude/openpbrEnvironmentLighting";
import { pbrDirectLightingFunctions as pbrDirectLightingFunctionsGLSL } from "core/Shaders/ShadersInclude/pbrDirectLightingFunctions";
import { pbrDirectLightingFunctionsWGSL } from "core/ShadersWGSL/ShadersInclude/pbrDirectLightingFunctions";
import { openpbrIblFunctions as openpbrIblFunctionsGLSL } from "core/Shaders/ShadersInclude/openpbrIblFunctions";
import { openpbrIblFunctionsWGSL } from "core/ShadersWGSL/ShadersInclude/openpbrIblFunctions";
import { openpbrDirectLightingInit as openpbrDirectLightingInitGLSL } from "core/Shaders/ShadersInclude/openpbrDirectLightingInit";
import { openpbrDirectLightingInitWGSL } from "core/ShadersWGSL/ShadersInclude/openpbrDirectLightingInit";
import { openpbrVertexDeclaration } from "core/Shaders/ShadersInclude/openpbrVertexDeclaration";

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

    describe("Retroreflection uniform layout", () => {
        it("preserves the retroreflection factor and texture when cloning", () => {
            const material = new OpenPBRMaterial("mat", scene);
            const texture = new Texture("retro.png", scene);
            texture.level = 0.25;
            texture.uOffset = 0.2;
            material.specularRetroreflectivity = 0.5;
            material.specularRetroreflectivityTexture = texture;

            const clone = material.clone("clone");

            expect(clone.specularRetroreflectivity).toBe(0.5);
            expect(clone.specularRetroreflectivityTexture).not.toBe(texture);
            expect(clone.specularRetroreflectivityTexture?.name).toBe(texture.name);
            expect(clone.specularRetroreflectivityTexture?.level).toBe(0.25);
            expect((clone.specularRetroreflectivityTexture as Texture).uOffset).toBe(0.2);
        });

        it("round-trips the retroreflection factor and texture through Babylon serialization", () => {
            const material = new OpenPBRMaterial("mat", scene);
            const texture = new Texture("retro.png", scene);
            texture.level = 0.25;
            texture.uOffset = 0.2;
            material.specularRetroreflectivity = 0.5;
            material.specularRetroreflectivityTexture = texture;

            const serialized = material.serialize();
            expect(serialized.specularRetroreflectivity).toBe(0.5);
            expect(serialized.specularRetroreflectivityTexture.level).toBe(0.25);
            const parsed = OpenPBRMaterial.Parse(serialized, scene, "");

            expect(parsed.specularRetroreflectivity).toBe(0.5);
            expect(parsed.specularRetroreflectivityTexture?.name).toBe(texture.name);
            expect(parsed.specularRetroreflectivityTexture?.level).toBe(0.25);
            expect((parsed.specularRetroreflectivityTexture as Texture).uOffset).toBe(0.2);
        });

        it("rebinds loose matrices when switching synchronized frozen materials sharing an effect", async () => {
            new FreeCamera("camera", new Vector3(0, 0, -5), scene);
            scene.updateTransformMatrix(true);
            const meshes = [CreateBox("first", {}, scene), CreateBox("second", {}, scene)];
            const materials = meshes.map((mesh, index) => {
                const material = new OpenPBRMaterial(mesh.name, scene);
                const texture = new RawTexture(new Uint8Array([255, 0, 0, 255]), 1, 1, Constants.TEXTUREFORMAT_RGBA, scene, false, false, Texture.NEAREST_SAMPLINGMODE);
                vi.spyOn(texture, "isReadyOrNotBlocking").mockReturnValue(true);
                texture.uOffset = 0.2 + index * 0.3;
                material.specularRetroreflectivity = 1;
                material.specularRetroreflectivityTexture = texture;
                mesh.material = material;
                return material;
            });
            for (const [index, material] of materials.entries()) {
                const mesh = meshes[index];
                await material.forceCompilationAsync(mesh);
                expect(material.isReadyForSubMesh(mesh, mesh.subMeshes[0])).toBe(true);
                material.freeze();
                material.bindForSubMesh(mesh.getWorldMatrix(), mesh, mesh.subMeshes[0]);
                vi.spyOn(material._uniformBuffer, "useUbo", "get").mockReturnValue(true);
                vi.spyOn(material._uniformBuffer, "isSync", "get").mockReturnValue(true);
            }

            const effect = meshes[0].subMeshes[0].effect!;
            expect(meshes[1].subMeshes[0].effect).toBe(effect);
            const setMatrix = vi.spyOn(effect, "setMatrix");
            for (const index of [0, 1, 0]) {
                setMatrix.mockClear();
                const mesh = meshes[index];
                materials[index].bindForSubMesh(mesh.getWorldMatrix(), mesh, mesh.subMeshes[0]);
                expect(setMatrix).toHaveBeenCalledWith("specularRetroreflectivityMatrix", materials[index].specularRetroreflectivityTexture!.getTextureMatrix());
            }
        });

        it("packs the factor and keeps the texture matrix outside the Material UBO", () => {
            const material = new OpenPBRMaterial("mat", scene);
            const uniformsArray: {
                name: string;
                linkedProperties: Record<string, { targetUniformComponentOffset: number }>;
            }[] = (material as any)._uniformsArray;
            const samplers: Record<string, { useLooseMatrixUniform: boolean }> = (material as any)._samplersList;

            expect(uniformsArray.find((uniform) => uniform.name === "vSpecularRetroreflectivity")).toBeUndefined();
            expect(uniformsArray.find((uniform) => uniform.name === "vSpecularColor")!.linkedProperties.specular_retroreflectivity.targetUniformComponentOffset).toBe(3);
            expect(samplers._specularRetroreflectivityTexture.useLooseMatrixUniform).toBe(true);
        });

        it("applies the retroreflection texture level through sampler metadata", () => {
            const material = new OpenPBRMaterial("mat", scene);
            const texture = new RawTexture(new Uint8Array([255, 0, 0, 255]), 1, 1, Constants.TEXTUREFORMAT_RGBA, scene, false, false, Texture.NEAREST_SAMPLINGMODE);
            texture.level = 0.25;
            material.specularRetroreflectivity = 0.5;
            material.specularRetroreflectivityTexture = texture;

            const uniform = (material as any)._uniformsArray.find((entry: { name: string }) => entry.name === "vSpecularColor");
            const value = new Vector4();
            uniform.populateVectorFromLinkedProperties(value, true);

            expect(value.w).toBe(0.125);
        });

        it.each([0, 0.25])("binds retroreflection texture level %s only when scene textures are enabled", async (level) => {
            new FreeCamera("camera", new Vector3(0, 0, -5), scene);
            scene.updateTransformMatrix(true);
            const mesh = CreateBox("box", {}, scene);
            const material = new OpenPBRMaterial("mat", scene);
            const texture = new RawTexture(new Uint8Array([255, 0, 0, 255]), 1, 1, Constants.TEXTUREFORMAT_RGBA, scene, false, false, Texture.NEAREST_SAMPLINGMODE);
            vi.spyOn(texture, "isReadyOrNotBlocking").mockReturnValue(true);
            texture.level = level;
            material.specularRetroreflectivity = 0.5;
            material.specularRetroreflectivityTexture = texture;
            mesh.material = material;
            let boundFactor: number | undefined;
            vi.spyOn(material._uniformBuffer, "updateVector4").mockImplementation((name, value) => {
                if (name === "vSpecularColor") {
                    boundFactor = value.w;
                }
            });

            for (const texturesEnabled of [false, true, false]) {
                scene.texturesEnabled = texturesEnabled;
                await material.forceCompilationAsync(mesh);
                expect(material.isReadyForSubMesh(mesh, mesh.subMeshes[0])).toBe(true);
                boundFactor = undefined;
                material.bindForSubMesh(mesh.getWorldMatrix(), mesh, mesh.subMeshes[0]);
                expect(boundFactor).toBe(texturesEnabled ? 0.5 * level : 0.5);
            }
        });

        it("leaves retroreflection defines clean when scene textures are disabled", () => {
            scene.texturesEnabled = false;
            const material = new OpenPBRMaterial("mat", scene);
            const texture = new RawTexture(new Uint8Array([255, 0, 0, 255]), 1, 1, Constants.TEXTUREFORMAT_RGBA, scene, false, false, Texture.NEAREST_SAMPLINGMODE);
            material.specularRetroreflectivity = 1;
            material.specularRetroreflectivityTexture = texture;
            const mesh = new Mesh("testMesh", scene);
            const defines = new OpenPBRMaterialDefines();
            material["_prepareDefines"](mesh, mesh, defines);
            defines.markAsProcessed();

            material["_prepareDefines"](mesh, mesh, defines);

            expect(defines.SPECULAR_RETROREFLECTIVITY).toBeFalsy();
            expect(defines.isDirty).toBe(false);
            expect(defines._areTexturesDirty).toBe(false);
        });

        it("ignores Native retroreflection transform changes while scene textures are disabled", () => {
            engine["_shaderPlatformName"] = "NATIVE";
            scene.texturesEnabled = false;
            const material = new OpenPBRMaterial("mat", scene);
            const texture = new RawTexture(new Uint8Array([255, 0, 0, 255]), 1, 1, Constants.TEXTUREFORMAT_RGBA, scene, false, false, Texture.NEAREST_SAMPLINGMODE);
            texture.uOffset = 0.2;
            material.specularRetroreflectivity = 1;
            material.specularRetroreflectivityTexture = texture;
            const mesh = new Mesh("testMesh", scene);
            const defines = new OpenPBRMaterialDefines();
            material["_prepareDefines"](mesh, mesh, defines);
            defines.markAsProcessed();
            texture.uOffset = 0.4;

            material["_prepareDefines"](mesh, mesh, defines);

            expect(defines.isDirty).toBe(false);
            expect(defines.SPECULAR_RETROREFLECTIVITY_MATRIX_2).toBe(0);

            scene.texturesEnabled = true;
            material["_prepareDefines"](mesh, mesh, defines);
            expect(defines.SPECULAR_RETROREFLECTIVITY).toBe(true);
            expect(defines.SPECULAR_RETROREFLECTIVITY_MATRIX_2).toBe(texture.getTextureMatrix().m[8]);
        });

        it("stores transformed texture coordinates in Native-compatible defines", () => {
            (engine as any)._shaderPlatformName = "NATIVE";
            const material = new OpenPBRMaterial("mat", scene);
            const texture = new RawTexture(new Uint8Array([255, 0, 0, 255]), 1, 1, Constants.TEXTUREFORMAT_RGBA, scene, false, false, Texture.NEAREST_SAMPLINGMODE);
            texture.coordinatesIndex = 1;
            texture.uOffset = 0.2;
            texture.vOffset = 0.1;
            texture.uScale = 0.5;
            texture.vScale = 0.75;
            texture.wAng = 0.3;
            material.specularRetroreflectivity = 1;
            material.specularRetroreflectivityTexture = texture;

            const mesh = new Mesh("testMesh", scene);
            const defines = new OpenPBRMaterialDefines();
            (material as any)._prepareDefines(mesh, mesh, defines);
            const matrix = texture.getTextureMatrix().m;
            expect(defines.SPECULAR_RETROREFLECTIVITY_UV_INDEX).toBe(1);
            expect([
                defines.SPECULAR_RETROREFLECTIVITY_MATRIX_0,
                defines.SPECULAR_RETROREFLECTIVITY_MATRIX_1,
                defines.SPECULAR_RETROREFLECTIVITY_MATRIX_2,
                defines.SPECULAR_RETROREFLECTIVITY_MATRIX_3,
                defines.SPECULAR_RETROREFLECTIVITY_MATRIX_4,
                defines.SPECULAR_RETROREFLECTIVITY_MATRIX_5,
            ]).toEqual([matrix[0], matrix[4], matrix[8], matrix[1], matrix[5], matrix[9]]);
        });

        it("leaves Native-only matrix defines unchanged on other shader platforms", () => {
            const material = new OpenPBRMaterial("mat", scene);
            const texture = new RawTexture(new Uint8Array([255, 0, 0, 255]), 1, 1, Constants.TEXTUREFORMAT_RGBA, scene, false, false, Texture.NEAREST_SAMPLINGMODE);
            texture.uOffset = 0.2;
            material.specularRetroreflectivity = 1;
            material.specularRetroreflectivityTexture = texture;

            const mesh = new Mesh("testMesh", scene);
            const defines = new OpenPBRMaterialDefines();
            (material as any)._prepareDefines(mesh, mesh, defines);

            expect([
                defines.SPECULAR_RETROREFLECTIVITY_MATRIX_0,
                defines.SPECULAR_RETROREFLECTIVITY_MATRIX_1,
                defines.SPECULAR_RETROREFLECTIVITY_MATRIX_2,
                defines.SPECULAR_RETROREFLECTIVITY_MATRIX_3,
                defines.SPECULAR_RETROREFLECTIVITY_MATRIX_4,
                defines.SPECULAR_RETROREFLECTIVITY_MATRIX_5,
            ]).toEqual([1, 0, 0, 0, 1, 0]);
        });

        it("rebuilds the Native shader when the texture transform changes", () => {
            (engine as any)._shaderPlatformName = "NATIVE";
            const material = new OpenPBRMaterial("mat", scene);
            const texture = new RawTexture(new Uint8Array([255, 0, 0, 255]), 1, 1, Constants.TEXTUREFORMAT_RGBA, scene, false, false, Texture.NEAREST_SAMPLINGMODE);
            texture.uOffset = 0.2;
            material.specularRetroreflectivity = 1;
            material.specularRetroreflectivityTexture = texture;

            const mesh = new Mesh("testMesh", scene);
            const defines = new OpenPBRMaterialDefines();
            (material as any)._prepareDefines(mesh, mesh, defines);
            defines.markAsProcessed();

            texture.uOffset = 0.4;
            (material as any)._prepareDefines(mesh, mesh, defines);

            expect(defines.isDirty).toBe(true);
            expect(defines.SPECULAR_RETROREFLECTIVITY_MATRIX_2).toBe(texture.getTextureMatrix().m[8]);
        });

        it("switches from direct UVs when the texture becomes transformed", () => {
            const material = new OpenPBRMaterial("mat", scene);
            const texture = new RawTexture(new Uint8Array([255, 0, 0, 255]), 1, 1, Constants.TEXTUREFORMAT_RGBA, scene, false, false, Texture.NEAREST_SAMPLINGMODE);
            material.specularRetroreflectivity = 1;
            material.specularRetroreflectivityTexture = texture;

            const mesh = new Mesh("testMesh", scene);
            const defines = new OpenPBRMaterialDefines();
            (material as any)._prepareDefines(mesh, mesh, defines);
            expect(defines.SPECULAR_RETROREFLECTIVITYDIRECTUV).toBe(1);
            defines.markAsProcessed();

            texture.uOffset = 0.4;
            (material as any)._prepareDefines(mesh, mesh, defines);

            expect(defines.isDirty).toBe(true);
            expect(defines.SPECULAR_RETROREFLECTIVITYDIRECTUV).toBe(0);
        });

        it.each([
            ["GLSL", openpbrVertexShaderGLSL.shader, "uv3"],
            ["WGSL", openpbrVertexShaderWGSL.shader, "vertexInputs.uv3"],
        ])("guards missing higher UV sets in %s", (_language, shader, uvExpression) => {
            expect(shader).toMatch(
                new RegExp(
                    `#elif SPECULAR_RETROREFLECTIVITY_UV_INDEX\\s*==\\s*2\\s+#ifdef UV3[\\s\\S]*?specularRetroreflectivityUVSource\\s*=\\s*${uvExpression.replace(".", "\\.")};`
                )
            );
        });

        it.each([3, 4, 5, 6])("uses pulled UV%s coordinates for transformed retroreflection in WGSL", (uv) => {
            expect(openpbrVertexShaderWGSL.shader).toMatch(new RegExp(`#ifdef UV${uv}\\s+#ifdef USE_VERTEX_PULLING\\s+specularRetroreflectivityUVSource\\s*=\\s*uv${uv}Updated;`));
        });

        it("declares the transformed retroreflection matrix without UBOs", () => {
            expect(openpbrVertexDeclaration.shader).toContain("uniform mat4 specularRetroreflectivityMatrix");
        });

        it("casts Native retroreflection matrix defines to floats", () => {
            expect(openpbrVertexShaderGLSL.shader).toContain("float(SPECULAR_RETROREFLECTIVITY_MATRIX_0)*specularRetroreflectivityUVSource.x");
            expect(openpbrVertexShaderGLSL.shader).toContain("float(SPECULAR_RETROREFLECTIVITY_MATRIX_5)");
        });

        it.each([
            ["GLSL", openpbrDirectLightingGLSL.shader],
            ["WGSL", openpbrDirectLightingWGSL.shader],
        ])("recomputes area-light data from the retro view direction in %s", (_language, shader) => {
            expect(shader).toContain("preInfoRetro=computeAreaPreLightingInfo(");
            expect(shader).toContain("preInfoRetro=computeAreaPreLightingInfoWithTexture(");
            expect(shader).toContain("slab_glossy_retro=computeOpenPBRAreaSpecularLighting(");
            expect(shader).toContain("slab_metal_retro=computeOpenPBRAreaConductorSpecularLighting(");
            expect(shader.match(/baseDielectricReflectance\.coloredF0/g)).toHaveLength(2);
            expect(shader.match(/baseConductorReflectance\.coloredF0/g)?.length).toBeGreaterThanOrEqual(4);
            expect(shader).toMatch(
                /material_dielectric_gloss_retro(?:: vec3f)?\s*=\s*material_dielectric_base\s*\*\s*\(1\.0f?\s*-\s*specularFresnelRetro\)\s*\+\s*slab_glossy_retro/
            );
        });

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
            ["GLSL", openpbrEnvironmentLightingGLSL.shader, "vPositionW"],
            ["WGSL", openpbrEnvironmentLightingWGSL.shader, "fragmentInputs.vPositionW"],
        ])("computes non-cube environment coordinates for the retro view in %s", (_language, shader, positionExpression) => {
            expect(shader).toMatch(
                new RegExp(`retroReflectionCoords(?::\\s*vec[23]f)?=createReflectionCoordsFromDirection\\(${positionExpression.replace(".", "\\.")},viewDirectionW\\)`)
            );
        });

        it.each([
            ["GLSL", openpbrIblFunctionsGLSL.shader],
            ["WGSL", openpbrIblFunctionsWGSL.shader],
        ])("maps anisotropic reflection directions for 2D environments in %s", (_language, shader) => {
            expect(shader).toContain("createReflectionCoordsFromDirection(positionW,sampleDirection)");
            expect(shader).toContain("computeFixedEquirectangularCoords");
            expect(shader).toContain("computeSkyBoxCoords(direction");
            expect(shader).toMatch(/if\s*\(useDirectionMapping\)/);
            expect(shader).toContain("dot(sampleDirection,sampleDirection)<=Epsilon");
            expect(shader).toContain("sampleDirection=normalize(cross(viewDirectionW,perpendicularAxis))");
            expect(shader).toContain("reflectionCoords=createReflectionCoords(positionW,mappingNormal)");
        });

        it.each([
            ["GLSL", openpbrIblFunctionsGLSL.shader, "computeProjectionCoords(vec4(direction,0.0),view,reflectionMatrix)"],
            ["WGSL", openpbrIblFunctionsWGSL.shader, "computeProjectionCoords(vec4f(direction,0.0f),scene.view,uniforms.reflectionMatrix)"],
        ])("maps projection environments from the requested direction in %s", (_language, shader, expectedCall) => {
            expect(shader).toContain(expectedCall);
        });

        it.each([
            ["GLSL", openpbrEnvironmentLightingGLSL.shader, "1.0", "1.0"],
            ["WGSL", openpbrEnvironmentLightingWGSL.shader, "1.0", "1.0f"],
        ])("uses direct environment mapping only for the retro anisotropic branch in %s", (_language, shader, ordinaryOne, retroOne) => {
            const normalizedShader = shader.replace(/\s/g, "");
            expect(normalizedShader).toContain(`false,${ordinaryOne},false,reflectionSampler`);
            expect(normalizedShader).toContain(`false,${retroOne},true,reflectionSampler`);
        });

        it("uses the same precomputed conductor Fresnel input in GLSL and WGSL", () => {
            expect(openpbrDirectLightingGLSL.shader).toContain(
                "slab_metal=computeSpecularLighting(preInfo{X},normalW,vec3(1.0),coloredFresnel,specular_roughness,lightColor{X}.rgb)"
            );
            expect(openpbrDirectLightingWGSL.shader).toContain(
                "slab_metal=computeSpecularLighting(preInfo{X},normalW,vec3f(1.0f),coloredFresnel,specular_roughness,lightColor{X}.rgb)"
            );
        });

        it.each([
            ["GLSL", openpbrDirectLightingGLSL.shader],
            ["WGSL", openpbrDirectLightingWGSL.shader],
        ])("applies conductor and thin-film Fresnel to anisotropic retroreflection in %s", (_language, shader) => {
            expect(shader).toMatch(/slab_metal_retro\s*=\s*coloredFresnelRetro\s*\*\s*computeAnisotropicSpecularLighting\(/);
        });

        it.each([
            ["GLSL", openpbrDirectLightingGLSL.shader],
            ["WGSL", openpbrDirectLightingWGSL.shader],
        ])("preserves back-lit transmission with retroreflection in %s", (_language, shader) => {
            expect(shader).toMatch(
                /if\s*\(preInfoTrans\.NdotLUnclamped<=0\.0\)\s*\{[^}]*#ifdef RETROREFLECTION\s+specularFresnelRetro=0\.0f?;\s*specularColoredFresnelRetro=specularFresnelRetro\*specular_color;/
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
});
