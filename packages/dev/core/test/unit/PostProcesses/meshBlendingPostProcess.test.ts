import { Constants } from "core/Engines/constants";
import { NullEngine } from "core/Engines/nullEngine";
import { FreeCamera } from "core/Cameras/freeCamera";
import { RawTexture } from "core/Materials/Textures/rawTexture";
import { Texture } from "core/Materials/Textures/texture";
import { Vector3 } from "core/Maths/math.vector";
import { MeshBlendingPostProcess } from "core/PostProcesses/meshBlendingPostProcess";
import { ThinPassPostProcess } from "core/PostProcesses/thinPassPostProcess";
import {
    CreateDefaultMeshBlendRadiusDefinitions,
    MeshBlendDepthType,
    MeshBlendDebugMode,
    MeshBlendQuality,
    ThinMeshBlendingPostProcess,
    _CalculateMeshBlendEffectiveWorldRadius,
    _CalculateMeshBlendFade,
    _CalculateMeshBlendSearchRadius,
    _CalculateMeshBlendSlopeScale,
    _GetMeshBlendQualityRadiusScale,
    _GetMeshBlendQualityDefine,
    _GetMeshBlendQualityDefines,
    _GetMeshBlendQualitySettings,
    _InterpolateMeshBlendColor,
    _LinearSrgbToMeshBlendOklab,
    _MeshBlendOklabToLinearSrgb,
    _ProjectMeshBlendWorldRadiusToPixels,
} from "core/PostProcesses/thinMeshBlendingPostProcess";
import { Scene } from "core/scene";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("ThinMeshBlendingPostProcess", () => {
    let engine: NullEngine;

    beforeEach(() => {
        engine = new NullEngine();
        engine._webGLVersion = 2;
    });

    afterEach(() => {
        engine.dispose();
    });

    it("rejects engines without WebGL2 or WebGPU", () => {
        engine._webGLVersion = 1;

        expect(() => new ThinMeshBlendingPostProcess("meshBlend", engine)).toThrow("requires WebGL2 or WebGPU");
    });

    it("rejects Native even though it reports a WebGL2-compatible version", () => {
        (engine as any)._shaderPlatformName = "NATIVE";

        expect(() => new ThinMeshBlendingPostProcess("meshBlend", engine)).toThrow("requires WebGL2 or WebGPU");
    });

    it("provides independent four-class radius defaults", () => {
        const first = CreateDefaultMeshBlendRadiusDefinitions();
        const second = CreateDefaultMeshBlendRadiusDefinitions();

        expect(first).toEqual([
            { worldRadius: 0.06, minimumProjectedRadius: 1.5 },
            { worldRadius: 0.1, minimumProjectedRadius: 3 },
            { worldRadius: 0.2, minimumProjectedRadius: 3 },
            { worldRadius: 0.3, minimumProjectedRadius: 5 },
        ]);
        expect(first).toHaveLength(4);

        first[0].minimumProjectedRadius = 12;
        expect(second[0].minimumProjectedRadius).toBe(1.5);
    });

    it.each([
        [MeshBlendQuality.Low, "#define MESH_BLEND_QUALITY_LOW"],
        [MeshBlendQuality.Medium, "#define MESH_BLEND_QUALITY_MEDIUM"],
        [MeshBlendQuality.High, "#define MESH_BLEND_QUALITY_HIGH"],
        [MeshBlendQuality.Cinematic, "#define MESH_BLEND_QUALITY_CINEMATIC"],
    ])("maps quality %s to a compile-time shader variant", (quality, expectedDefine) => {
        expect(_GetMeshBlendQualityDefine(quality)).toBe(expectedDefine);
    });

    it.each([
        [
            MeshBlendQuality.Low,
            {
                directionCount: 3,
                radialSampleCount: 2,
                directionRefinementSampleCount: 1,
                directionRefinementStepCount: 2,
                exactEdgeSampleCount: 5,
                radiusScale: 0.5,
                fullRandomRotation: false,
                searchJitterFactor: 0.5,
                immediateFourNeighborFallback: false,
                tinyObjectSafeguard: false,
                multiTargetSecondaryBlend: false,
                colorInterpolation: "sRGB",
            },
        ],
        [
            MeshBlendQuality.Medium,
            {
                directionCount: 3,
                radialSampleCount: 3,
                directionRefinementSampleCount: 2,
                directionRefinementStepCount: 4,
                exactEdgeSampleCount: 8,
                radiusScale: 0.9,
                fullRandomRotation: false,
                searchJitterFactor: 0.5,
                immediateFourNeighborFallback: false,
                tinyObjectSafeguard: false,
                multiTargetSecondaryBlend: false,
                colorInterpolation: "OKLab",
            },
        ],
        [
            MeshBlendQuality.High,
            {
                directionCount: 3,
                radialSampleCount: 3,
                directionRefinementSampleCount: 3,
                directionRefinementStepCount: 5,
                exactEdgeSampleCount: 10,
                radiusScale: 1,
                fullRandomRotation: true,
                searchJitterFactor: 0.5,
                immediateFourNeighborFallback: true,
                tinyObjectSafeguard: true,
                multiTargetSecondaryBlend: true,
                colorInterpolation: "OKLab",
            },
        ],
        [
            MeshBlendQuality.Cinematic,
            {
                directionCount: 8,
                radialSampleCount: 6,
                directionRefinementSampleCount: 4,
                directionRefinementStepCount: 5,
                exactEdgeSampleCount: 50,
                radiusScale: 0.95,
                fullRandomRotation: true,
                searchJitterFactor: 1,
                immediateFourNeighborFallback: true,
                tinyObjectSafeguard: true,
                multiTargetSecondaryBlend: true,
                colorInterpolation: "OKLab",
            },
        ],
    ])("uses the exact compile-time settings for quality %s", (quality, expectedSettings) => {
        expect(_GetMeshBlendQualitySettings(quality)).toEqual(expectedSettings);
    });

    it("emits compile-time loop bounds and quality feature defines", () => {
        const lowDefines = _GetMeshBlendQualityDefines(MeshBlendQuality.Low);
        const highDefines = _GetMeshBlendQualityDefines(MeshBlendQuality.High);
        const cinematicDefines = _GetMeshBlendQualityDefines(MeshBlendQuality.Cinematic);

        expect(lowDefines).toContain("#define MESH_BLEND_DIRECTION_REFINEMENT_SAMPLE_COUNT 1");
        expect(lowDefines).toContain("#define MESH_BLEND_DIRECTION_REFINEMENT_STEP_COUNT 2");
        expect(lowDefines).toContain("#define MESH_BLEND_COLOR_INTERPOLATION_SRGB");
        expect(lowDefines).not.toContain("MESH_BLEND_FULL_RANDOM_ROTATION");
        expect(lowDefines).not.toContain("MESH_BLEND_FOUR_NEIGHBOR_FALLBACK");
        expect(lowDefines).not.toContain("MESH_BLEND_TINY_OBJECT_SAFEGUARD");
        expect(lowDefines).not.toContain("MESH_BLEND_MULTI_TARGET_SECONDARY_BLEND");

        expect(highDefines).toContain("#define MESH_BLEND_EXACT_EDGE_SAMPLE_COUNT 10");
        expect(highDefines).toContain("#define MESH_BLEND_FULL_RANDOM_ROTATION");
        expect(highDefines).toContain("#define MESH_BLEND_FOUR_NEIGHBOR_FALLBACK");
        expect(highDefines).toContain("#define MESH_BLEND_TINY_OBJECT_SAFEGUARD");
        expect(highDefines).toContain("#define MESH_BLEND_MULTI_TARGET_SECONDARY_BLEND");
        expect(highDefines).toContain("#define MESH_BLEND_COLOR_INTERPOLATION_OKLAB");

        expect(cinematicDefines).toContain("#define MESH_BLEND_DIRECTION_COUNT 8");
        expect(cinematicDefines).toContain("#define MESH_BLEND_RADIAL_SAMPLE_COUNT 6");
        expect(cinematicDefines).toContain("#define MESH_BLEND_EXACT_EDGE_SAMPLE_COUNT 50");
        expect(cinematicDefines).toContain("#define MESH_BLEND_JITTER_FACTOR 1.00");
    });

    it("uses the quality-specific radius scales", () => {
        expect(_GetMeshBlendQualityRadiusScale(MeshBlendQuality.Low)).toBe(0.5);
        expect(_GetMeshBlendQualityRadiusScale(MeshBlendQuality.Medium)).toBe(0.9);
        expect(_GetMeshBlendQualityRadiusScale(MeshBlendQuality.High)).toBe(1);
        expect(_GetMeshBlendQualityRadiusScale(MeshBlendQuality.Cinematic)).toBe(0.95);
    });

    it("round-trips linear HDR colors through the mesh-blending OKLab helpers", () => {
        const red = _LinearSrgbToMeshBlendOklab([1, 0, 0]);
        const source = [4, 0.75, 0.125] as const;
        const restored = _MeshBlendOklabToLinearSrgb(_LinearSrgbToMeshBlendOklab(source));

        expect(red[0]).toBeCloseTo(0.627955, 5);
        expect(red[1]).toBeCloseTo(0.224863, 5);
        expect(red[2]).toBeCloseTo(0.125846, 5);
        expect(restored[0]).toBeCloseTo(source[0], 5);
        expect(restored[1]).toBeCloseTo(source[1], 5);
        expect(restored[2]).toBeCloseTo(source[2], 5);
        expect(restored[0]).toBeGreaterThan(1);
    });

    it("uses sRGB interpolation for Low and OKLab interpolation for Medium and above", () => {
        const black = [0, 0, 0] as const;
        const white = [1, 1, 1] as const;
        const low = _InterpolateMeshBlendColor(black, white, 0.5, MeshBlendQuality.Low);
        const medium = _InterpolateMeshBlendColor(black, white, 0.5, MeshBlendQuality.Medium);
        const hdr = _InterpolateMeshBlendColor([4, 1, 0.25], [1, 4, 2], 0.5, MeshBlendQuality.High);

        expect(low[0]).toBeCloseTo(0.214041, 5);
        expect(low[1]).toBeCloseTo(low[0], 6);
        expect(medium[0]).toBeCloseTo(0.125, 5);
        expect(medium[1]).toBeCloseTo(medium[0], 6);
        expect(low[0]).not.toBeCloseTo(medium[0], 3);
        expect(Math.max(...hdr)).toBeGreaterThan(1);
    });

    it("projects perspective and orthographic radii using physical target height", () => {
        expect(_ProjectMeshBlendWorldRadiusToPixels(0.2, 4, 1000, 2, false)).toBeCloseTo(50);
        expect(_ProjectMeshBlendWorldRadiusToPixels(0.2, 40, 1000, 2, false)).toBeCloseTo(5);
        expect(_ProjectMeshBlendWorldRadiusToPixels(0.2, 4, 500, 2, false)).toBeCloseTo(25);
        expect(_ProjectMeshBlendWorldRadiusToPixels(0.2, 2, 1000, 1, false)).toBeCloseTo(50);
        expect(_ProjectMeshBlendWorldRadiusToPixels(0.2, 4, 1000, 2, true)).toBeCloseTo(200);
        expect(_ProjectMeshBlendWorldRadiusToPixels(0.2, 40, 1000, 2, true)).toBeCloseTo(200);
    });

    it("applies the pixel floor and converts it back to an effective world radius", () => {
        const definition = { worldRadius: 0.01, minimumProjectedRadius: 6 };
        const searchRadius = _CalculateMeshBlendSearchRadius(definition, 20, 1000, 2, false, MeshBlendQuality.Medium);

        expect(searchRadius).toBeCloseTo(5.4);
        expect(_CalculateMeshBlendEffectiveWorldRadius(searchRadius, 20, 1000, 2, false)).toBeCloseTo(0.108);
        expect(_CalculateMeshBlendEffectiveWorldRadius(90, 20, 1000, 2, true)).toBeCloseTo(0.09);
    });

    it("keeps every positive search radius representable by at least one physical pixel", () => {
        const definition = CreateDefaultMeshBlendRadiusDefinitions()[0];

        expect(_CalculateMeshBlendSearchRadius(definition, 100000, 1000, 1, false, MeshBlendQuality.Low)).toBe(1);
        expect(_CalculateMeshBlendSearchRadius(definition, 100000, 1000, 1, false, MeshBlendQuality.Medium)).toBeGreaterThanOrEqual(1);
        expect(_CalculateMeshBlendSearchRadius({ worldRadius: 0, minimumProjectedRadius: 0 }, 1, 1000, 1, false, MeshBlendQuality.High)).toBe(0);
        expect(_CalculateMeshBlendFade(1, 1)).toBeGreaterThan(0);
    });

    it("narrows steep contacts while slope factor one disables narrowing", () => {
        expect(_CalculateMeshBlendSlopeScale(0, 1)).toBe(1);
        expect(_CalculateMeshBlendSlopeScale(1, 2)).toBe(1);
        expect(_CalculateMeshBlendSlopeScale(0, 2)).toBe(0.25);
        expect(_CalculateMeshBlendSlopeScale(0.5, 3)).toBeCloseTo(0.4375);
    });

    it("uses Medium by default, preserves custom defines, and recompiles only for quality or debug changes", () => {
        const postProcess = new ThinMeshBlendingPostProcess("meshBlend", engine, { defines: "#define CUSTOM_MESH_BLEND_TEST" });
        const updateEffectSpy = vi.spyOn(postProcess, "updateEffect");

        try {
            expect(postProcess.quality).toBe(MeshBlendQuality.Medium);
            expect(postProcess.debugMode).toBe(MeshBlendDebugMode.Off);

            postProcess.configure({ slopeFactor: 1.25 });
            expect(updateEffectSpy).not.toHaveBeenCalled();

            postProcess.quality = MeshBlendQuality.Low;
            postProcess.debugMode = MeshBlendDebugMode.SeamFade;
            postProcess.depthType = MeshBlendDepthType.Screen;
            postProcess.debugMode = MeshBlendDebugMode.MultiTarget;
            postProcess.debugMode = MeshBlendDebugMode.TargetColor;

            const firstDefines = updateEffectSpy.mock.calls[0][0] as string;
            const secondDefines = updateEffectSpy.mock.calls[1][0] as string;
            const thirdDefines = updateEffectSpy.mock.calls[2][0] as string;
            const fourthDefines = updateEffectSpy.mock.calls[3][0] as string;
            const fifthDefines = updateEffectSpy.mock.calls[4][0] as string;

            expect(firstDefines).toContain("#define CUSTOM_MESH_BLEND_TEST");
            expect(firstDefines).toContain("#define MESH_BLEND_QUALITY_LOW");
            expect(firstDefines).toContain("#define MESH_BLEND_COLOR_INTERPOLATION_SRGB");
            expect(secondDefines).toContain("#define MESH_BLEND_DEBUG_ENABLED");
            expect(secondDefines).toContain("#define MESH_BLEND_DEBUG_SEAM_FADE");
            expect(thirdDefines).toContain("#define MESH_BLEND_DEPTH_SCREEN");
            expect(fourthDefines).toContain("#define MESH_BLEND_DEBUG_MULTI_TARGET");
            expect(fifthDefines).toContain("#define MESH_BLEND_DEBUG_TARGET_COLOR");

            postProcess.debugMode = MeshBlendDebugMode.WorldPosition;
            expect(updateEffectSpy.mock.calls[5][0]).toContain("#define MESH_BLEND_DEBUG_WORLD_POSITION");
        } finally {
            postProcess.dispose();
        }
    });

    it("compiles shadow estimation only when a base-color texture is available", () => {
        const postProcess = new ThinMeshBlendingPostProcess("meshBlend", engine);

        try {
            expect(postProcess.options.defines).not.toContain("MESH_BLEND_SHADOW_ESTIMATION");

            postProcess.hasBaseColorTexture = true;
            expect(postProcess.options.defines).toContain("#define MESH_BLEND_SHADOW_ESTIMATION");

            postProcess.hasBaseColorTexture = false;
            expect(postProcess.options.defines).not.toContain("MESH_BLEND_SHADOW_ESTIMATION");
        } finally {
            postProcess.dispose();
        }
    });

    it.each([
        [MeshBlendDebugMode.Off, undefined],
        [MeshBlendDebugMode.PackedTag, "MESH_BLEND_DEBUG_PACKED_TAG"],
        [MeshBlendDebugMode.CandidateDirectionDistance, "MESH_BLEND_DEBUG_CANDIDATE_DIRECTION_DISTANCE"],
        [MeshBlendDebugMode.SeamFade, "MESH_BLEND_DEBUG_SEAM_FADE"],
        [MeshBlendDebugMode.RejectionReason, "MESH_BLEND_DEBUG_REJECTION_REASON"],
        [MeshBlendDebugMode.StageWork, "MESH_BLEND_DEBUG_STAGE_WORK"],
        [MeshBlendDebugMode.Continuation, "MESH_BLEND_DEBUG_CONTINUATION"],
        [MeshBlendDebugMode.TinyObject, "MESH_BLEND_DEBUG_TINY_OBJECT"],
        [MeshBlendDebugMode.MultiTarget, "MESH_BLEND_DEBUG_MULTI_TARGET"],
        [MeshBlendDebugMode.TargetColor, "MESH_BLEND_DEBUG_TARGET_COLOR"],
        [MeshBlendDebugMode.ShadowAttenuation, "MESH_BLEND_DEBUG_SHADOW_ATTENUATION"],
        [MeshBlendDebugMode.ColorInterpolation, "MESH_BLEND_DEBUG_COLOR_INTERPOLATION"],
        [MeshBlendDebugMode.WorldPosition, "MESH_BLEND_DEBUG_WORLD_POSITION"],
    ])("compiles debug mode %s to the expected deterministic variant", (debugMode, expectedDefine) => {
        const postProcess = new ThinMeshBlendingPostProcess("meshBlend", engine, { debugMode });

        try {
            const defines = String(postProcess.options.defines);
            expect(expectedDefine === undefined || defines.includes(`#define ${expectedDefine}`)).toBe(true);
            expect(defines.includes("#define MESH_BLEND_DEBUG_ENABLED")).toBe(expectedDefine !== undefined);
        } finally {
            postProcess.dispose();
        }
    });

    it("owns and disposes its stable search-noise texture", () => {
        const postProcess = new ThinMeshBlendingPostProcess("meshBlend", engine);
        const texture = (postProcess as unknown as { _stableBlueNoiseTexture: RawTexture })._stableBlueNoiseTexture;
        const searchDisposeSpy = vi.spyOn(texture, "dispose");

        expect(texture.getSize()).toEqual({ width: 128, height: 128 });
        expect(texture.format).toBe(Constants.TEXTUREFORMAT_RG);
        expect(texture.samplingMode).toBe(Constants.TEXTURE_NEAREST_SAMPLINGMODE);
        expect(texture.wrapU).toBe(Texture.WRAP_ADDRESSMODE);
        expect(texture.wrapV).toBe(Texture.WRAP_ADDRESSMODE);

        postProcess.dispose();
        expect(searchDisposeSpy).toHaveBeenCalledOnce();
    });

    it("reuses the inverse projection while the camera projection is unchanged", () => {
        const scene = new Scene(engine);
        const camera = new FreeCamera("camera", Vector3.Zero(), scene);
        const postProcess = new ThinMeshBlendingPostProcess("meshBlend", engine);
        const projection = camera.getProjectionMatrix();
        const invertToRef = vi.spyOn(projection, "invertToRef");

        try {
            postProcess.camera = camera;
            (postProcess as any)._updateInverseProjection();
            (postProcess as any)._updateInverseProjection();

            expect(invertToRef).toHaveBeenCalledOnce();

            camera.fov *= 0.5;
            (postProcess as any)._updateInverseProjection();

            expect(invertToRef).toHaveBeenCalledTimes(2);
        } finally {
            postProcess.dispose();
            scene.dispose();
        }
    });

    it("validates classic construction, ownership, and compile-time variants", () => {
        const scene = new Scene(engine);
        const camera = new FreeCamera("camera", Vector3.Zero(), scene);
        const tagTexture = new RawTexture(
            new Uint8Array(4),
            2,
            2,
            Constants.TEXTUREFORMAT_RED_INTEGER,
            engine,
            false,
            false,
            Constants.TEXTURE_NEAREST_SAMPLINGMODE,
            Constants.TEXTURETYPE_UNSIGNED_BYTE
        );
        const depthTexture = new RawTexture(
            new Float32Array(4).fill(1),
            2,
            2,
            Constants.TEXTUREFORMAT_RED,
            engine,
            false,
            false,
            Constants.TEXTURE_NEAREST_SAMPLINGMODE,
            Constants.TEXTURETYPE_FLOAT
        );
        const baseColorTexture = new RawTexture(
            new Uint8Array(16).fill(128),
            2,
            2,
            Constants.TEXTUREFORMAT_RGBA,
            engine,
            false,
            false,
            Constants.TEXTURE_NEAREST_SAMPLINGMODE,
            Constants.TEXTURETYPE_UNSIGNED_BYTE
        );
        const postProcess = new MeshBlendingPostProcess("meshBlend", scene, camera, {
            meshBlendTagTexture: tagTexture,
            depthTexture,
            baseColorTexture,
            quality: MeshBlendQuality.Low,
        });

        {
            const scene = new Scene(engine);
            const camera = new FreeCamera("camera", Vector3.Zero(), scene);
            const invalidTagTexture = new RawTexture(
                new Uint8Array(4),
                2,
                2,
                Constants.TEXTUREFORMAT_RED,
                engine,
                false,
                false,
                Constants.TEXTURE_NEAREST_SAMPLINGMODE,
                Constants.TEXTURETYPE_UNSIGNED_BYTE
            );
            const validTagTexture = new RawTexture(
                new Uint8Array(4),
                2,
                2,
                Constants.TEXTUREFORMAT_RED_INTEGER,
                engine,
                false,
                false,
                Constants.TEXTURE_NEAREST_SAMPLINGMODE,
                Constants.TEXTURETYPE_UNSIGNED_BYTE
            );
            const depthTexture = new RawTexture(
                new Float32Array(4).fill(1),
                2,
                2,
                Constants.TEXTUREFORMAT_RED,
                engine,
                false,
                false,
                Constants.TEXTURE_NEAREST_SAMPLINGMODE,
                Constants.TEXTURETYPE_FLOAT
            );
            const baseColorTexture = new RawTexture(
                new Uint8Array(16),
                2,
                2,
                Constants.TEXTUREFORMAT_RGBA,
                engine,
                false,
                false,
                Constants.TEXTURE_NEAREST_SAMPLINGMODE,
                Constants.TEXTURETYPE_UNSIGNED_BYTE
            );
            const passWrapper = new ThinPassPostProcess("pass", engine);

            try {
                expect(camera._postProcesses.filter(Boolean)).toHaveLength(0);
                expect(
                    () =>
                        new MeshBlendingPostProcess("meshBlend", scene, camera, {
                            meshBlendTagTexture: invalidTagTexture,
                            depthTexture,
                            baseColorTexture,
                        })
                ).toThrow("TEXTUREFORMAT_RED_INTEGER");
                expect(camera._postProcesses.filter(Boolean)).toHaveLength(0);

                expect(
                    () =>
                        new MeshBlendingPostProcess("meshBlend", scene, camera, {
                            meshBlendTagTexture: invalidTagTexture,
                            depthTexture,
                            baseColorTexture,
                            effectWrapper: passWrapper as unknown as ThinMeshBlendingPostProcess,
                        })
                ).toThrow("effectWrapper must be a ThinMeshBlendingPostProcess");
                expect(camera._postProcesses.filter(Boolean)).toHaveLength(0);
            } finally {
                passWrapper.dispose();
                invalidTagTexture.dispose();
                validTagTexture.dispose();
                depthTexture.dispose();
                baseColorTexture.dispose();
                scene.dispose();
            }
        }

        {
            const scene = new Scene(engine);
            const camera = new FreeCamera("camera", Vector3.Zero(), scene);
            const tagTexture = new RawTexture(
                new Uint8Array(4),
                2,
                2,
                Constants.TEXTUREFORMAT_RED_INTEGER,
                engine,
                false,
                false,
                Constants.TEXTURE_NEAREST_SAMPLINGMODE,
                Constants.TEXTURETYPE_UNSIGNED_BYTE
            );
            const depthTexture = new RawTexture(
                new Float32Array(4).fill(1),
                2,
                2,
                Constants.TEXTUREFORMAT_RED,
                engine,
                false,
                false,
                Constants.TEXTURE_NEAREST_SAMPLINGMODE,
                Constants.TEXTURETYPE_FLOAT
            );
            const baseColorTexture = new RawTexture(
                new Uint8Array(16),
                2,
                2,
                Constants.TEXTUREFORMAT_RGBA,
                engine,
                false,
                false,
                Constants.TEXTURE_NEAREST_SAMPLINGMODE,
                Constants.TEXTURETYPE_UNSIGNED_BYTE
            );
            const internal = new MeshBlendingPostProcess("internal", scene, camera, {
                meshBlendTagTexture: tagTexture,
                depthTexture,
                baseColorTexture,
            });
            const internalWrapper = (internal as unknown as { _effectWrapper: ThinMeshBlendingPostProcess })._effectWrapper;
            const internalDisposeSpy = vi.spyOn(internalWrapper, "dispose");
            const externalWrapper = new ThinMeshBlendingPostProcess("external", engine);
            const externalDisposeSpy = vi.spyOn(externalWrapper, "dispose");
            const external = new MeshBlendingPostProcess("external", scene, camera, {
                meshBlendTagTexture: tagTexture,
                depthTexture,
                baseColorTexture,
                effectWrapper: externalWrapper,
            });

            try {
                internal.dispose();
                external.dispose();

                expect(internalDisposeSpy).toHaveBeenCalledOnce();
                expect(externalDisposeSpy).not.toHaveBeenCalled();
            } finally {
                externalWrapper.dispose();
                tagTexture.dispose();
                depthTexture.dispose();
                baseColorTexture.dispose();
                scene.dispose();
            }
        }

        {
            const scene = new Scene(engine);
            const camera = new FreeCamera("camera", Vector3.Zero(), scene);
            const tagTexture = new RawTexture(
                new Uint8Array(4),
                2,
                2,
                Constants.TEXTUREFORMAT_RED_INTEGER,
                engine,
                false,
                false,
                Constants.TEXTURE_NEAREST_SAMPLINGMODE,
                Constants.TEXTURETYPE_UNSIGNED_BYTE
            );
            const screenDepthTexture = new RawTexture(
                new Uint8Array(4),
                2,
                2,
                Constants.TEXTUREFORMAT_RED,
                engine,
                false,
                false,
                Constants.TEXTURE_NEAREST_SAMPLINGMODE,
                Constants.TEXTURETYPE_UNSIGNED_BYTE
            );
            const externalWrapper = new ThinMeshBlendingPostProcess("externalScreenDepth", engine, {
                depthType: MeshBlendDepthType.Screen,
            });
            const postProcess = new MeshBlendingPostProcess("externalScreenDepth", scene, camera, {
                meshBlendTagTexture: tagTexture,
                depthTexture: screenDepthTexture,
                effectWrapper: externalWrapper,
            });

            try {
                expect(postProcess.depthType).toBe(MeshBlendDepthType.Screen);
            } finally {
                postProcess.dispose();
                externalWrapper.dispose();
                tagTexture.dispose();
                screenDepthTexture.dispose();
                scene.dispose();
            }
        }

        try {
            expect((postProcess as any)._effectWrapper.options.defines).toContain("#define MESH_BLEND_QUALITY_LOW");
            postProcess.quality = MeshBlendQuality.Cinematic;
            expect((postProcess as any)._effectWrapper.options.defines).toContain("#define MESH_BLEND_DIRECTION_COUNT 8");
            expect((postProcess as any)._effectWrapper.options.defines).toContain("#define MESH_BLEND_MULTI_TARGET_SECONDARY_BLEND");
            expect(() => (postProcess as any)._validateInputDimensions(2, 2, 4)).toThrow("matching sample counts");

            expect(() => postProcess.serialize()).toThrow("cannot be serialized");
            expect(postProcess.clone()).toBeNull();

            postProcess.configure({
                quality: MeshBlendQuality.High,
                debugMode: MeshBlendDebugMode.RejectionReason,
                radiusClasses: [
                    { worldRadius: 0.02, minimumProjectedRadius: 1 },
                    { worldRadius: 0.04, minimumProjectedRadius: 2 },
                    { worldRadius: 0.08, minimumProjectedRadius: 3 },
                    { worldRadius: 0.16, minimumProjectedRadius: 4 },
                ],
                slopeFactor: 1.5,
            });
            expect(postProcess.quality).toBe(MeshBlendQuality.High);
            expect(postProcess.debugMode).toBe(MeshBlendDebugMode.RejectionReason);
            expect(postProcess.radiusClasses[3]).toEqual({ worldRadius: 0.16, minimumProjectedRadius: 4 });
            expect(postProcess.slopeFactor).toBe(1.5);
        } finally {
            postProcess.dispose();
            tagTexture.dispose();
            depthTexture.dispose();
            baseColorTexture.dispose();
            scene.dispose();
        }
    });

    it("rejects a classic base-color texture whose physical dimensions do not match the tag and depth textures", () => {
        const scene = new Scene(engine);
        const camera = new FreeCamera("camera", Vector3.Zero(), scene);
        const tagTexture = new RawTexture(
            new Uint8Array(4),
            2,
            2,
            Constants.TEXTUREFORMAT_RED_INTEGER,
            engine,
            false,
            false,
            Constants.TEXTURE_NEAREST_SAMPLINGMODE,
            Constants.TEXTURETYPE_UNSIGNED_BYTE
        );
        const depthTexture = new RawTexture(
            new Float32Array(4).fill(1),
            2,
            2,
            Constants.TEXTUREFORMAT_RED,
            engine,
            false,
            false,
            Constants.TEXTURE_NEAREST_SAMPLINGMODE,
            Constants.TEXTURETYPE_FLOAT
        );
        const baseColorTexture = new RawTexture(
            new Uint8Array(16).fill(128),
            2,
            2,
            Constants.TEXTUREFORMAT_RGBA,
            engine,
            false,
            false,
            Constants.TEXTURE_NEAREST_SAMPLINGMODE,
            Constants.TEXTURETYPE_UNSIGNED_BYTE
        );
        const mismatchedBaseColorTexture = new RawTexture(
            new Uint8Array(32).fill(128),
            4,
            2,
            Constants.TEXTUREFORMAT_RGBA,
            engine,
            false,
            false,
            Constants.TEXTURE_NEAREST_SAMPLINGMODE,
            Constants.TEXTURETYPE_UNSIGNED_BYTE
        );
        const postProcess = new MeshBlendingPostProcess("meshBlend", scene, camera, {
            meshBlendTagTexture: tagTexture,
            depthTexture,
            baseColorTexture,
        });

        try {
            expect((postProcess as any)._effectWrapper.options.defines).toContain("MESH_BLEND_SHADOW_ESTIMATION");
            postProcess.baseColorTexture = null;
            expect(postProcess.baseColorTexture).toBeNull();
            expect((postProcess as any)._effectWrapper.options.defines).not.toContain("MESH_BLEND_SHADOW_ESTIMATION");
            postProcess.baseColorTexture = baseColorTexture;

            expect(() => (postProcess.baseColorTexture = mismatchedBaseColorTexture)).toThrow("matching physical dimensions");
            expect(postProcess.baseColorTexture).toBe(baseColorTexture);

            const tagInternalTexture = tagTexture.getInternalTexture()!;
            tagInternalTexture.format = Constants.TEXTUREFORMAT_RED;
            expect(() => (postProcess as any)._validateInputDimensions()).toThrow("TEXTUREFORMAT_RED_INTEGER");
            tagInternalTexture.format = Constants.TEXTUREFORMAT_RED_INTEGER;
            tagInternalTexture.is2DArray = true;
            expect(() => (postProcess as any)._validateInputDimensions()).toThrow("meshBlendTagTexture must be a 2D texture");
            tagInternalTexture.is2DArray = false;
        } finally {
            postProcess.dispose();
            tagTexture.dispose();
            depthTexture.dispose();
            baseColorTexture.dispose();
            mismatchedBaseColorTexture.dispose();
            scene.dispose();
        }
    });

    it("does not dispose caller-owned input textures", () => {
        const scene = new Scene(engine);
        const camera = new FreeCamera("camera", Vector3.Zero(), scene);
        const tagTexture = new RawTexture(
            new Uint8Array(4),
            2,
            2,
            Constants.TEXTUREFORMAT_RED_INTEGER,
            engine,
            false,
            false,
            Constants.TEXTURE_NEAREST_SAMPLINGMODE,
            Constants.TEXTURETYPE_UNSIGNED_BYTE
        );
        const depthTexture = new RawTexture(
            new Float32Array(4).fill(1),
            2,
            2,
            Constants.TEXTUREFORMAT_RED,
            engine,
            false,
            false,
            Constants.TEXTURE_NEAREST_SAMPLINGMODE,
            Constants.TEXTURETYPE_FLOAT
        );
        const baseColorTexture = new RawTexture(
            new Uint8Array(16).fill(128),
            2,
            2,
            Constants.TEXTUREFORMAT_RGBA,
            engine,
            false,
            false,
            Constants.TEXTURE_NEAREST_SAMPLINGMODE,
            Constants.TEXTURETYPE_UNSIGNED_BYTE
        );
        const tagDisposeSpy = vi.spyOn(tagTexture, "dispose");
        const depthDisposeSpy = vi.spyOn(depthTexture, "dispose");
        const baseColorDisposeSpy = vi.spyOn(baseColorTexture, "dispose");
        const postProcess = new MeshBlendingPostProcess("meshBlend", scene, camera, {
            meshBlendTagTexture: tagTexture,
            depthTexture,
            baseColorTexture,
        });

        try {
            postProcess.dispose();
            expect(tagDisposeSpy).not.toHaveBeenCalled();
            expect(depthDisposeSpy).not.toHaveBeenCalled();
            expect(baseColorDisposeSpy).not.toHaveBeenCalled();
        } finally {
            tagTexture.dispose();
            depthTexture.dispose();
            baseColorTexture.dispose();
            scene.dispose();
        }
    });

    it("copies configured radius definitions and rejects invalid configuration", () => {
        const postProcess = new ThinMeshBlendingPostProcess("meshBlend", engine);
        const configured = [
            { worldRadius: 1, minimumProjectedRadius: 8 },
            { worldRadius: 2, minimumProjectedRadius: 16 },
            { worldRadius: 3, minimumProjectedRadius: 24 },
            { worldRadius: 4, minimumProjectedRadius: 32 },
        ] as const;

        try {
            postProcess.configure({ radiusClasses: configured });
            expect(postProcess.radiusClasses).toEqual(configured);

            expect(() => postProcess.configure({ radiusClasses: configured.slice(0, 3) as any })).toThrow("exactly four radius definitions");
            expect(() =>
                postProcess.configure({
                    radiusClasses: [{ worldRadius: -1, minimumProjectedRadius: 1 }, configured[1], configured[2], configured[3]],
                })
            ).toThrow("world radii");
            expect(() => postProcess.configure({ slopeFactor: 0.5 })).toThrow("slopeFactor");
            expect(() => postProcess.configure({ depthType: 7 as MeshBlendDepthType })).toThrow("depthType");
            expect(() => postProcess.configure({ debugMode: 14 as MeshBlendDebugMode })).toThrow("debug mode");
        } finally {
            postProcess.dispose();
        }
    });
});
