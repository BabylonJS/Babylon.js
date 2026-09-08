import { type Nullable } from "../types";
import { EffectWrapper } from "../Materials/effectRenderer.pure";
import { EngineStore } from "../Engines/engineStore";
import { type AbstractEngine } from "../Engines/abstractEngine.pure";
import { type EffectWrapperCreationOptions } from "../Materials/effectRenderer";
import { type ThinEngine } from "../Engines/thinEngine.pure";
import { type RawTexture } from "../Materials/Textures/rawTexture";
import { type BaseTexture } from "../Materials/Textures/baseTexture.pure";
import { type Camera } from "../Cameras/camera.pure";
import { Constants } from "../Engines/constants";
import { TmpVectors } from "../Maths/math.vector.pure";
import { _CreateMeshBlendNeutralArtisticNoiseTexture } from "./meshBlendingArtisticNoise";
import { _CreateMeshBlendBlueNoiseTexture } from "./meshBlendingBlueNoise";

/**
 * Quality level used by mesh blending.
 *
 * Each value selects a separate compile-time shader variant. Medium is the default.
 */
export enum MeshBlendQuality {
    /** Three search directions with the lowest refinement and exact-boundary sample counts, using sRGB color interpolation. */
    Low = 0,
    /** Three search directions with balanced refinement and exact-boundary sample counts, using OKLab color interpolation. */
    Medium = 1,
    /** Three search directions with OKLab interpolation, full rotation, close-neighbor fallback, tiny-object protection, and multi-target blending. */
    High = 2,
    /** Eight search directions with OKLab interpolation and the largest radial and exact-boundary sample counts. */
    Cinematic = 3,
}

/**
 * Debug visualization produced by mesh blending.
 */
export enum MeshBlendDebugMode {
    /** Render the blended scene color. */
    Off = 0,
    /** Visualize the packed group and radius-class tag. */
    PackedTag = 1,
    /** Visualize the refined candidate direction and normalized boundary distance. */
    CandidateDirectionDistance = 2,
    /** Visualize the selected radius class and the resulting seam fade. */
    SeamFade = 3,
    /** Visualize why a candidate was accepted or rejected by contact validation. */
    RejectionReason = 4,
    /** Visualize the approximate amount of shader work performed by each pixel. */
    StageWork = 5,
    /** Visualize target continuation success, fallback use, and rejection. */
    Continuation = 6,
    /** Visualize the effective-radius reduction applied to thin projected objects. */
    TinyObject = 7,
    /** Visualize primary-only and secondary-target selections at multi-mesh junctions. */
    MultiTarget = 8,
    /** Visualize the farther, boundary-plus-one, boundary-plus-two, and constructed target-color samples. */
    TargetColor = 9,
    /** Visualize the fade attenuation applied by the base-color shadow-transfer heuristic. Neutral when no base-color texture is provided. */
    ShadowAttenuation = 10,
    /** Visualize the active color-interpolation mode after target-color construction. */
    ColorInterpolation = 11,
    /** Visualize the reconstructed world position. */
    WorldPosition = 12,
    /** Visualize the decoded world-space geometry normal. */
    WorldNormal = 13,
    /** Visualize the raw triplanar artistic-noise sample. */
    ArtisticNoise = 14,
    /** Visualize the final fade after shadow and artistic-noise modulation. */
    ModulatedFade = 15,
}

/**
 * Depth representation consumed by mesh blending.
 */
export enum MeshBlendDepthType {
    /** Signed camera-space Z written by the geometry renderer's view-depth output. */
    View = 0,
    /** Hardware depth in the normalized screen-depth range. */
    Screen = 1,
}

/**
 * Radius values associated with one mesh-blending radius class.
 */
export interface IMeshBlendRadiusDefinition {
    /** Authored blend radius in Babylon world units. */
    worldRadius: number;
    /** Minimum search radius in physical render-target pixels. */
    minimumProjectedRadius: number;
}

/**
 * The four radius definitions indexed by the packed mesh-blending radius class.
 */
export type MeshBlendRadiusDefinitions = [IMeshBlendRadiusDefinition, IMeshBlendRadiusDefinition, IMeshBlendRadiusDefinition, IMeshBlendRadiusDefinition];

/**
 * Configurable mesh-blending values shared by the classic and frame-graph wrappers.
 */
export interface IMeshBlendConfiguration {
    /** Compile-time quality variant. */
    quality?: MeshBlendQuality;
    /** Radius definitions indexed by packed radius class. Exactly four definitions are required. */
    radiusClasses?: readonly [IMeshBlendRadiusDefinition, IMeshBlendRadiusDefinition, IMeshBlendRadiusDefinition, IMeshBlendRadiusDefinition];
    /** Contact-slope narrowing factor. A value of 1 disables narrowing. */
    slopeFactor?: number;
    /** Representation stored in the depth texture. */
    depthType?: MeshBlendDepthType;
    /** Whether the world-normal texture stores components encoded from [-1, 1] to [0, 1]. */
    worldNormalTextureIsUnsigned?: boolean;
    /** Artistic-noise strength. A value of 0 skips artistic-noise sampling. */
    noiseFactor?: number;
    /** Controls how strongly artistic noise fades toward the exact seam. */
    noiseFade?: number;
    /** Bias added to the centered artistic-noise signal. */
    noiseOffset?: number;
    /** Number of artistic-noise tiles across the selected radius class. */
    noiseTileSize?: number;
    /** Debug visualization to compile into the shader. Off renders the final blended result. */
    debugMode?: MeshBlendDebugMode;
}

/**
 * Options used to create a thin mesh-blending post process.
 */
export interface IThinMeshBlendingPostProcessOptions extends EffectWrapperCreationOptions, IMeshBlendConfiguration {
    /** Optional user-owned artistic-noise texture. */
    noiseTexture?: Nullable<BaseTexture>;
}

/**
 * Creates a new set of default mesh-blending radius definitions.
 * @returns Four independently mutable radius definitions ordered from small to extra large.
 */
export function CreateDefaultMeshBlendRadiusDefinitions(): MeshBlendRadiusDefinitions {
    return [
        { worldRadius: 0.06, minimumProjectedRadius: 1.5 },
        { worldRadius: 0.1, minimumProjectedRadius: 3 },
        { worldRadius: 0.2, minimumProjectedRadius: 3 },
        { worldRadius: 0.3, minimumProjectedRadius: 5 },
    ];
}

interface IMeshBlendQualitySettings {
    directionCount: number;
    radialSampleCount: number;
    directionRefinementSampleCount: number;
    directionRefinementStepCount: number;
    exactEdgeSampleCount: number;
    radiusScale: number;
    fullRandomRotation: boolean;
    searchJitterFactor: number;
    artisticNoise: boolean;
    immediateFourNeighborFallback: boolean;
    tinyObjectSafeguard: boolean;
    multiTargetSecondaryBlend: boolean;
    colorInterpolation: "sRGB" | "OKLab";
}

type MeshBlendColorTuple = readonly [number, number, number];

function _MeshBlendLinearToSrgbChannel(value: number): number {
    return value <= 0.0031308 ? value * 12.92 : 1.055 * Math.pow(value, 1 / 2.4) - 0.055;
}

function _MeshBlendSrgbToLinearChannel(value: number): number {
    return value <= 0.04045 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
}

/**
 * Converts linear sRGB to Babylon mesh-blending OKLab coordinates.
 * @param color Linear sRGB color. HDR components are preserved.
 * @returns OKLab coordinates.
 * @see https://bottosson.github.io/posts/oklab/
 * @internal
 */
export function _LinearSrgbToMeshBlendOklab(color: MeshBlendColorTuple): [number, number, number] {
    const long = 0.4122214708 * color[0] + 0.5363325363 * color[1] + 0.0514459929 * color[2];
    const medium = 0.2119034982 * color[0] + 0.6806995451 * color[1] + 0.1073969566 * color[2];
    const short = 0.0883024619 * color[0] + 0.2817188376 * color[1] + 0.6299787005 * color[2];
    const longRoot = Math.cbrt(long);
    const mediumRoot = Math.cbrt(medium);
    const shortRoot = Math.cbrt(short);

    return [
        0.2104542553 * longRoot + 0.793617785 * mediumRoot - 0.0040720468 * shortRoot,
        1.9779984951 * longRoot - 2.428592205 * mediumRoot + 0.4505937099 * shortRoot,
        0.0259040371 * longRoot + 0.7827717662 * mediumRoot - 0.808675766 * shortRoot,
    ];
}

/**
 * Converts Babylon mesh-blending OKLab coordinates to linear sRGB.
 * @param color OKLab coordinates.
 * @returns Linear sRGB color without gamut or HDR clamping.
 * @see https://bottosson.github.io/posts/oklab/
 * @internal
 */
export function _MeshBlendOklabToLinearSrgb(color: MeshBlendColorTuple): [number, number, number] {
    const longRoot = color[0] + 0.3963377774 * color[1] + 0.2158037573 * color[2];
    const mediumRoot = color[0] - 0.1055613458 * color[1] - 0.0638541728 * color[2];
    const shortRoot = color[0] - 0.0894841775 * color[1] - 1.291485548 * color[2];
    const long = longRoot * longRoot * longRoot;
    const medium = mediumRoot * mediumRoot * mediumRoot;
    const short = shortRoot * shortRoot * shortRoot;

    return [
        4.0767416621 * long - 3.3077115913 * medium + 0.2309699292 * short,
        -1.2684380046 * long + 2.6097574011 * medium - 0.3413193965 * short,
        -0.0041960863 * long - 0.7034186147 * medium + 1.707614701 * short,
    ];
}

/**
 * Interpolates two linear SceneColor values using the selected mesh-blending quality policy.
 * @param current Current linear SceneColor.
 * @param target Target linear SceneColor.
 * @param amount Interpolation amount.
 * @param quality Mesh-blending quality that selects sRGB or OKLab interpolation.
 * @returns Interpolated linear SceneColor without HDR clamping.
 * @internal
 */
export function _InterpolateMeshBlendColor(current: MeshBlendColorTuple, target: MeshBlendColorTuple, amount: number, quality: MeshBlendQuality): [number, number, number] {
    const settings = _GetMeshBlendQualitySettings(quality);
    let currentColor: MeshBlendColorTuple;
    let targetColor: MeshBlendColorTuple;

    if (settings.colorInterpolation === "sRGB") {
        currentColor = [_MeshBlendLinearToSrgbChannel(current[0]), _MeshBlendLinearToSrgbChannel(current[1]), _MeshBlendLinearToSrgbChannel(current[2])];
        targetColor = [_MeshBlendLinearToSrgbChannel(target[0]), _MeshBlendLinearToSrgbChannel(target[1]), _MeshBlendLinearToSrgbChannel(target[2])];
        return [
            _MeshBlendSrgbToLinearChannel(currentColor[0] + (targetColor[0] - currentColor[0]) * amount),
            _MeshBlendSrgbToLinearChannel(currentColor[1] + (targetColor[1] - currentColor[1]) * amount),
            _MeshBlendSrgbToLinearChannel(currentColor[2] + (targetColor[2] - currentColor[2]) * amount),
        ];
    }

    currentColor = _LinearSrgbToMeshBlendOklab(current);
    targetColor = _LinearSrgbToMeshBlendOklab(target);
    return _MeshBlendOklabToLinearSrgb([
        currentColor[0] + (targetColor[0] - currentColor[0]) * amount,
        currentColor[1] + (targetColor[1] - currentColor[1]) * amount,
        currentColor[2] + (targetColor[2] - currentColor[2]) * amount,
    ]);
}

const _MeshBlendQualitySettings: readonly Readonly<IMeshBlendQualitySettings>[] = [
    {
        directionCount: 3,
        radialSampleCount: 2,
        directionRefinementSampleCount: 1,
        directionRefinementStepCount: 2,
        exactEdgeSampleCount: 5,
        radiusScale: 0.5,
        fullRandomRotation: false,
        searchJitterFactor: 0.5,
        artisticNoise: false,
        immediateFourNeighborFallback: false,
        tinyObjectSafeguard: false,
        multiTargetSecondaryBlend: false,
        colorInterpolation: "sRGB",
    },
    {
        directionCount: 3,
        radialSampleCount: 3,
        directionRefinementSampleCount: 2,
        directionRefinementStepCount: 4,
        exactEdgeSampleCount: 8,
        radiusScale: 0.9,
        fullRandomRotation: false,
        searchJitterFactor: 0.5,
        artisticNoise: true,
        immediateFourNeighborFallback: false,
        tinyObjectSafeguard: false,
        multiTargetSecondaryBlend: false,
        colorInterpolation: "OKLab",
    },
    {
        directionCount: 3,
        radialSampleCount: 3,
        directionRefinementSampleCount: 3,
        directionRefinementStepCount: 5,
        exactEdgeSampleCount: 10,
        radiusScale: 1,
        fullRandomRotation: true,
        searchJitterFactor: 0.5,
        artisticNoise: true,
        immediateFourNeighborFallback: true,
        tinyObjectSafeguard: true,
        multiTargetSecondaryBlend: true,
        colorInterpolation: "OKLab",
    },
    {
        directionCount: 8,
        radialSampleCount: 6,
        directionRefinementSampleCount: 4,
        directionRefinementStepCount: 5,
        exactEdgeSampleCount: 50,
        radiusScale: 0.95,
        fullRandomRotation: true,
        searchJitterFactor: 1,
        artisticNoise: true,
        immediateFourNeighborFallback: true,
        tinyObjectSafeguard: true,
        multiTargetSecondaryBlend: true,
        colorInterpolation: "OKLab",
    },
];

/**
 * Gets the complete quality settings used to compile a mesh-blending shader variant.
 * @param quality Quality to inspect.
 * @returns The immutable settings for the quality.
 * @internal
 */
export function _GetMeshBlendQualitySettings(quality: MeshBlendQuality): Readonly<IMeshBlendQualitySettings> {
    const settings = _MeshBlendQualitySettings[quality];
    if (!settings || !Number.isInteger(quality)) {
        throw new RangeError("Mesh-blending quality must be Low, Medium, High, or Cinematic.");
    }
    return settings;
}

/**
 * Gets the radius scale used by a mesh-blending quality level.
 * @param quality Quality to convert.
 * @returns The radius scale applied after projection and the minimum-pixel floor.
 * @internal
 */
export function _GetMeshBlendQualityRadiusScale(quality: MeshBlendQuality): number {
    return _GetMeshBlendQualitySettings(quality).radiusScale;
}

/**
 * Projects a world-space mesh-blending radius to physical render-target pixels.
 * @param worldRadius Radius in Babylon world units.
 * @param viewDepth Positive distance from the camera.
 * @param renderTargetHeight Physical render-target height.
 * @param projectionYScale Absolute Y scale from the projection matrix.
 * @param isOrthographic Whether the projection is orthographic.
 * @returns The projected radius in physical pixels.
 * @internal
 */
export function _ProjectMeshBlendWorldRadiusToPixels(
    worldRadius: number,
    viewDepth: number,
    renderTargetHeight: number,
    projectionYScale: number,
    isOrthographic: boolean
): number {
    const projectionScale = 0.5 * renderTargetHeight * Math.abs(projectionYScale);
    return worldRadius * (isOrthographic ? projectionScale : projectionScale / Math.max(Math.abs(viewDepth), 1e-5));
}

/**
 * Calculates the final mesh-blending search radius.
 * @param definition Radius-class definition.
 * @param viewDepth Positive distance from the camera.
 * @param renderTargetHeight Physical render-target height.
 * @param projectionYScale Absolute Y scale from the projection matrix.
 * @param isOrthographic Whether the projection is orthographic.
 * @param quality Quality whose radius scale is applied.
 * @returns The final radius in physical pixels.
 * @internal
 */
export function _CalculateMeshBlendSearchRadius(
    definition: IMeshBlendRadiusDefinition,
    viewDepth: number,
    renderTargetHeight: number,
    projectionYScale: number,
    isOrthographic: boolean,
    quality: MeshBlendQuality
): number {
    const projectedRadius = _ProjectMeshBlendWorldRadiusToPixels(definition.worldRadius, viewDepth, renderTargetHeight, projectionYScale, isOrthographic);
    const scaledRadius = Math.max(projectedRadius, definition.minimumProjectedRadius) * _GetMeshBlendQualityRadiusScale(quality);
    return scaledRadius > 0 ? Math.max(1, scaledRadius) : 0;
}

/**
 * Calculates the mesh-blending fade for a candidate boundary.
 * @param distancePixels Distance from the current pixel center to the target pixel center.
 * @param searchRadiusPixels Effective search radius in physical pixels.
 * @returns Blend weight in the range 0 through 0.5.
 * @internal
 */
export function _CalculateMeshBlendFade(distancePixels: number, searchRadiusPixels: number): number {
    const boundaryDistance = Math.max(distancePixels - 0.5, 0);
    const normalizedDistance = Math.min(Math.max(boundaryDistance / Math.max(searchRadiusPixels, 0.00001), 0), 1);
    const inverseDistance = 1 - normalizedDistance;
    const fade = inverseDistance * inverseDistance + (inverseDistance - inverseDistance * inverseDistance) * Math.min(Math.max(inverseDistance - 0.75, 0), 1);
    return fade * 0.5;
}

/**
 * Converts a physical-pixel radius back to the represented world-space radius.
 * @param radiusPixels Radius in physical render-target pixels.
 * @param viewDepth Positive distance from the camera.
 * @param renderTargetHeight Physical render-target height.
 * @param projectionYScale Absolute Y scale from the projection matrix.
 * @param isOrthographic Whether the projection is orthographic.
 * @returns The represented radius in Babylon world units.
 * @internal
 */
export function _CalculateMeshBlendEffectiveWorldRadius(
    radiusPixels: number,
    viewDepth: number,
    renderTargetHeight: number,
    projectionYScale: number,
    isOrthographic: boolean
): number {
    const projectionScale = Math.max(0.5 * renderTargetHeight * Math.abs(projectionYScale), 1e-5);
    return radiusPixels * (isOrthographic ? 1 / projectionScale : Math.max(Math.abs(viewDepth), 1e-5) / projectionScale);
}

/**
 * Calculates the contact-slope radius multiplier.
 * @param oppositeFacing Cosine-domain alignment of the two surface spans.
 * @param slopeFactor User-configurable narrowing factor.
 * @returns A multiplier in the range [0.25, 1].
 * @internal
 */
export function _CalculateMeshBlendSlopeScale(oppositeFacing: number, slopeFactor: number): number {
    if (slopeFactor <= 1) {
        return 1;
    }
    return 0.25 + 0.75 * Math.pow(Math.max(0, Math.min(oppositeFacing, 1)), slopeFactor - 1);
}

/**
 * Calculates the artistic-noise UV scale for a radius class.
 * @param worldRadius Authored world radius selected for the seam.
 * @param noiseTileSize Number of noise tiles across that radius.
 * @returns The multiplier applied to world position before triplanar projection.
 * @internal
 */
export function _CalculateMeshBlendNoiseUvScale(worldRadius: number, noiseTileSize: number): number {
    return noiseTileSize / Math.max(worldRadius, 1e-5);
}

/**
 * Calculates the final fade after artistic-noise modulation.
 * @param fade Base fade after contact and shadow validation.
 * @param rawNoise Raw texture sample in the [0, 1] range.
 * @param noiseFactor Overall artistic-noise influence.
 * @param noiseFade Amount by which noise influence fades toward the exact seam.
 * @param noiseOffset Bias added to the centered noise signal.
 * @returns The clamped modulated fade.
 * @internal
 */
export function _CalculateMeshBlendNoiseModulatedFade(fade: number, rawNoise: number, noiseFactor: number, noiseFade: number, noiseOffset: number): number {
    if (noiseFactor === 0) {
        return fade;
    }

    const seamProximity = Math.max(0, Math.min(fade * 2, 1));
    const envelope = 1 - seamProximity * Math.max(0, Math.min(noiseFade, 1));
    const signal = rawNoise * 2 - 1 + noiseOffset;
    return Math.max(0, Math.min(fade * (1 + signal * noiseFactor * envelope), 0.5));
}

/**
 * Calculates one-hot dominant-axis weights for triplanar artistic-noise projection.
 * @param normal Normalized world-space normal.
 * @returns Projection weights ordered as X, Y, and Z.
 * @internal
 */
export function _GetMeshBlendDominantAxisWeights(normal: readonly [number, number, number]): [number, number, number] {
    const x = Math.abs(normal[0]);
    const y = Math.abs(normal[1]);
    const z = Math.abs(normal[2]);
    const maximum = Math.max(x, y, z);
    const weights: [number, number, number] = [x === maximum ? 1 : 0, y === maximum ? 1 : 0, z === maximum ? 1 : 0];
    const total = weights[0] + weights[1] + weights[2];
    return [weights[0] / total, weights[1] / total, weights[2] / total];
}

/**
 * Gets the compile-time shader define for a mesh-blending quality.
 * @param quality Quality to convert.
 * @returns The quality define.
 * @internal
 */
export function _GetMeshBlendQualityDefine(quality: MeshBlendQuality): string {
    switch (quality) {
        case MeshBlendQuality.Low:
            return "#define MESH_BLEND_QUALITY_LOW";
        case MeshBlendQuality.Medium:
            return "#define MESH_BLEND_QUALITY_MEDIUM";
        case MeshBlendQuality.High:
            return "#define MESH_BLEND_QUALITY_HIGH";
        case MeshBlendQuality.Cinematic:
            return "#define MESH_BLEND_QUALITY_CINEMATIC";
        default:
            throw new RangeError("Mesh-blending quality must be Low, Medium, High, or Cinematic.");
    }
}

/**
 * Gets all compile-time defines for a mesh-blending quality variant.
 * @param quality Quality to convert.
 * @returns Newline-separated shader defines containing all quality-specific constants and feature switches.
 * @internal
 */
export function _GetMeshBlendQualityDefines(quality: MeshBlendQuality): string {
    const settings = _GetMeshBlendQualitySettings(quality);
    const defines = [
        _GetMeshBlendQualityDefine(quality),
        `#define MESH_BLEND_DIRECTION_COUNT ${settings.directionCount}`,
        `#define MESH_BLEND_RADIAL_SAMPLE_COUNT ${settings.radialSampleCount}`,
        `#define MESH_BLEND_DIRECTION_REFINEMENT_SAMPLE_COUNT ${settings.directionRefinementSampleCount}`,
        `#define MESH_BLEND_DIRECTION_REFINEMENT_STEP_COUNT ${settings.directionRefinementStepCount}`,
        `#define MESH_BLEND_EXACT_EDGE_SAMPLE_COUNT ${settings.exactEdgeSampleCount}`,
        `#define MESH_BLEND_RADIUS_SCALE ${settings.radiusScale.toFixed(2)}`,
        `#define MESH_BLEND_JITTER_FACTOR ${settings.searchJitterFactor.toFixed(2)}`,
    ];

    if (settings.fullRandomRotation) {
        defines.push("#define MESH_BLEND_FULL_RANDOM_ROTATION");
    }
    if (settings.artisticNoise) {
        defines.push("#define MESH_BLEND_ARTISTIC_NOISE");
    }
    if (settings.immediateFourNeighborFallback) {
        defines.push("#define MESH_BLEND_FOUR_NEIGHBOR_FALLBACK");
    }
    if (settings.tinyObjectSafeguard) {
        defines.push("#define MESH_BLEND_TINY_OBJECT_SAFEGUARD");
    }
    if (settings.multiTargetSecondaryBlend) {
        defines.push("#define MESH_BLEND_MULTI_TARGET_SECONDARY_BLEND");
    }
    defines.push(settings.colorInterpolation === "sRGB" ? "#define MESH_BLEND_COLOR_INTERPOLATION_SRGB" : "#define MESH_BLEND_COLOR_INTERPOLATION_OKLAB");

    return defines.join("\n");
}

function _ValidateDebugMode(value: MeshBlendDebugMode): void {
    if (value < MeshBlendDebugMode.Off || value > MeshBlendDebugMode.ModulatedFade || !Number.isInteger(value)) {
        throw new RangeError(
            "Mesh-blending debug mode must be Off, PackedTag, CandidateDirectionDistance, SeamFade, RejectionReason, StageWork, Continuation, TinyObject, MultiTarget, TargetColor, ShadowAttenuation, ColorInterpolation, WorldPosition, WorldNormal, ArtisticNoise, or ModulatedFade."
        );
    }
}

function _ValidateDepthType(value: MeshBlendDepthType): void {
    if (value !== MeshBlendDepthType.View && value !== MeshBlendDepthType.Screen) {
        throw new RangeError("Mesh-blending depthType must be View or Screen.");
    }
}

function _NormalizeDefines(defines: Nullable<string | string[]>): string {
    return Array.isArray(defines) ? defines.join("\n") : (defines ?? "");
}

function _BuildMeshBlendDefines(quality: MeshBlendQuality, debugMode: MeshBlendDebugMode, depthType: MeshBlendDepthType, hasBaseColorTexture: boolean, customDefines = ""): string {
    _ValidateDebugMode(debugMode);
    _ValidateDepthType(depthType);

    const defines = customDefines ? [customDefines, _GetMeshBlendQualityDefines(quality)] : [_GetMeshBlendQualityDefines(quality)];

    if (debugMode !== MeshBlendDebugMode.Off) {
        defines.push("#define MESH_BLEND_DEBUG_ENABLED");
    }

    if (debugMode === MeshBlendDebugMode.PackedTag) {
        defines.push("#define MESH_BLEND_DEBUG_PACKED_TAG");
    } else if (debugMode === MeshBlendDebugMode.CandidateDirectionDistance) {
        defines.push("#define MESH_BLEND_DEBUG_CANDIDATE_DIRECTION_DISTANCE");
    } else if (debugMode === MeshBlendDebugMode.SeamFade) {
        defines.push("#define MESH_BLEND_DEBUG_SEAM_FADE");
    } else if (debugMode === MeshBlendDebugMode.RejectionReason) {
        defines.push("#define MESH_BLEND_DEBUG_REJECTION_REASON");
    } else if (debugMode === MeshBlendDebugMode.StageWork) {
        defines.push("#define MESH_BLEND_DEBUG_STAGE_WORK");
    } else if (debugMode === MeshBlendDebugMode.Continuation) {
        defines.push("#define MESH_BLEND_DEBUG_CONTINUATION");
    } else if (debugMode === MeshBlendDebugMode.TinyObject) {
        defines.push("#define MESH_BLEND_DEBUG_TINY_OBJECT");
    } else if (debugMode === MeshBlendDebugMode.MultiTarget) {
        defines.push("#define MESH_BLEND_DEBUG_MULTI_TARGET");
    } else if (debugMode === MeshBlendDebugMode.TargetColor) {
        defines.push("#define MESH_BLEND_DEBUG_TARGET_COLOR");
    } else if (debugMode === MeshBlendDebugMode.ShadowAttenuation) {
        defines.push("#define MESH_BLEND_DEBUG_SHADOW_ATTENUATION");
    } else if (debugMode === MeshBlendDebugMode.ColorInterpolation) {
        defines.push("#define MESH_BLEND_DEBUG_COLOR_INTERPOLATION");
    } else if (debugMode === MeshBlendDebugMode.WorldPosition) {
        defines.push("#define MESH_BLEND_DEBUG_WORLD_POSITION");
    } else if (debugMode === MeshBlendDebugMode.WorldNormal) {
        defines.push("#define MESH_BLEND_DEBUG_WORLD_NORMAL");
    } else if (debugMode === MeshBlendDebugMode.ArtisticNoise) {
        defines.push("#define MESH_BLEND_DEBUG_ARTISTIC_NOISE");
    } else if (debugMode === MeshBlendDebugMode.ModulatedFade) {
        defines.push("#define MESH_BLEND_DEBUG_MODULATED_FADE");
    }

    if (depthType === MeshBlendDepthType.Screen) {
        defines.push("#define MESH_BLEND_DEPTH_SCREEN");
    }
    if (hasBaseColorTexture) {
        defines.push("#define MESH_BLEND_SHADOW_ESTIMATION");
    }

    return defines.join("\n");
}

function _ValidateRadiusDefinition(definition: IMeshBlendRadiusDefinition): void {
    if (!Number.isFinite(definition.worldRadius) || definition.worldRadius < 0) {
        throw new RangeError("Mesh-blending world radii must be finite non-negative numbers.");
    }
    if (!Number.isFinite(definition.minimumProjectedRadius) || definition.minimumProjectedRadius < 0) {
        throw new RangeError("Mesh-blending minimum projected radii must be finite non-negative numbers.");
    }
}

/**
 * Validates mesh-blending configuration without mutating an effect.
 * @param options Configuration to validate.
 * @internal
 */
export function _ValidateMeshBlendConfiguration(options?: IMeshBlendConfiguration): void {
    if (!options) {
        return;
    }
    if (options.quality !== undefined) {
        _GetMeshBlendQualitySettings(options.quality);
    }
    if (options.debugMode !== undefined) {
        _ValidateDebugMode(options.debugMode);
    }
    if (options.depthType !== undefined) {
        _ValidateDepthType(options.depthType);
    }
    if (options.radiusClasses) {
        if (options.radiusClasses.length !== 4) {
            throw new RangeError("Mesh-blending radiusClasses must contain exactly four radius definitions.");
        }
        for (const definition of options.radiusClasses) {
            _ValidateRadiusDefinition(definition);
        }
    }
    if (options.slopeFactor !== undefined && (!Number.isFinite(options.slopeFactor) || options.slopeFactor < 1)) {
        throw new RangeError("Mesh-blending slopeFactor must be a finite number greater than or equal to 1.");
    }
    if (options.noiseFactor !== undefined && (!Number.isFinite(options.noiseFactor) || options.noiseFactor < 0)) {
        throw new RangeError("Mesh-blending noiseFactor must be a finite non-negative number.");
    }
    if (options.noiseFade !== undefined && (!Number.isFinite(options.noiseFade) || options.noiseFade < 0 || options.noiseFade > 1)) {
        throw new RangeError("Mesh-blending noiseFade must be a finite number between 0 and 1.");
    }
    if (options.noiseOffset !== undefined && !Number.isFinite(options.noiseOffset)) {
        throw new RangeError("Mesh-blending noiseOffset must be finite.");
    }
    if (options.noiseTileSize !== undefined && (!Number.isFinite(options.noiseTileSize) || options.noiseTileSize <= 0)) {
        throw new RangeError("Mesh-blending noiseTileSize must be a finite number greater than 0.");
    }
}

function _CopyRadiusDefinitions(target: MeshBlendRadiusDefinitions, source: IMeshBlendConfiguration["radiusClasses"]): void {
    if (!source || source.length !== 4) {
        throw new RangeError("Mesh blending requires exactly four radius definitions.");
    }

    for (let index = 0; index < 4; index++) {
        const definition = source[index]!;
        _ValidateRadiusDefinition(definition);
        target[index]!.worldRadius = definition.worldRadius;
        target[index]!.minimumProjectedRadius = definition.minimumProjectedRadius;
    }
}

/**
 * Shared WebGL2 and WebGPU effect wrapper used to visually blend SceneColor across validated contacts between opaque or alpha-tested meshes.
 *
 * The effect does not modify geometry, depth, normals, collisions, or shadows. Transparent rendering is caller-controlled;
 * overlapping transparent surfaces can make SceneColor inconsistent with the single-layer geometry inputs. Meshes opt in
 * with a packed tag whose group is in the range 1..63; group 0 disables blending. Surfaces in the same nonzero group are
 * treated as one logical object and do not blend with one another. The four radius classes combine an authored world-space
 * radius with a minimum radius measured in physical render-target pixels.
 *
 * Perspective and orthographic cameras are supported. Search noise is spatially stable and never varies by frame;
 * the optional artistic-noise texture is a separate world-space modulation. Optional base-color input enables shadow
 * estimation; without it, the related sampler and shader work are compiled out. The effect does not require or implement TAA.
 */
export class ThinMeshBlendingPostProcess extends EffectWrapper {
    /**
     * The fragment shader URL.
     */
    public static readonly FragmentUrl = "meshBlending";

    /**
     * The list of uniforms used by the effect.
     */
    public static readonly Uniforms = [
        "projection",
        "inverseProjection",
        "inverseView",
        "blendWorldRadii",
        "minimumProjectedRadii",
        "meshBlendIsOrthographic",
        "meshBlendWorldNormalIsUnsigned",
        "slopeFactor",
        "noiseFactor",
        "noiseFade",
        "noiseOffset",
        "noiseTileSize",
    ];

    /**
     * The list of samplers used by the effect.
     */
    public static readonly Samplers = [
        "meshBlendTagSampler",
        "meshBlendDepthSampler",
        "meshBlendWorldNormalSampler",
        "meshBlendBaseColorSampler",
        "meshBlendBlueNoiseSampler",
        "meshBlendArtisticNoiseSampler",
    ];

    protected override _gatherImports(useWebGPU: boolean, list: Promise<any>[]) {
        if (useWebGPU) {
            this._webGPUReady = true;
            list.push(import("../ShadersWGSL/meshBlending.fragment"));
        } else {
            list.push(import("../Shaders/meshBlending.fragment"));
        }
    }

    /**
     * The four configurable radius definitions indexed by packed radius class.
     *
     * Both values are projected against the active camera and the physical depth-texture height.
     */
    public readonly radiusClasses = CreateDefaultMeshBlendRadiusDefinitions();

    /**
     * Camera used to project radii and reconstruct view-space positions.
     */
    public camera: Nullable<Camera> = null;

    private _slopeFactor = 2;

    /**
     * Contact-slope narrowing factor. A value of 1 disables narrowing.
     */
    public get slopeFactor(): number {
        return this._slopeFactor;
    }

    public set slopeFactor(value: number) {
        if (!Number.isFinite(value) || value < 1) {
            throw new RangeError("Mesh-blending slopeFactor must be a finite number greater than or equal to 1.");
        }
        this._slopeFactor = value;
    }

    /** Whether the world-normal texture stores components encoded from [-1, 1] to [0, 1]. */
    public worldNormalTextureIsUnsigned = false;

    private _noiseFactor = 0.5;
    private _noiseFade = 0.5;
    private _noiseOffset = 0;
    private _noiseTileSize = 10;
    private _noiseTexture: Nullable<BaseTexture> = null;

    /**
     * User-owned texture sampled for artistic world-space noise.
     *
     * The texture is not disposed with the post process.
     */
    public get noiseTexture(): Nullable<BaseTexture> {
        return this._noiseTexture;
    }

    public set noiseTexture(value: Nullable<BaseTexture>) {
        this._noiseTexture = value;
    }

    /** Artistic-noise strength. A value of 0 skips artistic-noise sampling. */
    public get noiseFactor(): number {
        return this._noiseFactor;
    }

    public set noiseFactor(value: number) {
        if (!Number.isFinite(value) || value < 0) {
            throw new RangeError("Mesh-blending noiseFactor must be a finite non-negative number.");
        }
        this._noiseFactor = value;
    }

    /** Controls how strongly artistic noise fades toward the exact seam. */
    public get noiseFade(): number {
        return this._noiseFade;
    }

    public set noiseFade(value: number) {
        if (!Number.isFinite(value) || value < 0 || value > 1) {
            throw new RangeError("Mesh-blending noiseFade must be a finite number between 0 and 1.");
        }
        this._noiseFade = value;
    }

    /** Bias added to the centered artistic-noise signal. */
    public get noiseOffset(): number {
        return this._noiseOffset;
    }

    public set noiseOffset(value: number) {
        if (!Number.isFinite(value)) {
            throw new RangeError("Mesh-blending noiseOffset must be finite.");
        }
        this._noiseOffset = value;
    }

    /** Number of artistic-noise tiles across the selected radius class. */
    public get noiseTileSize(): number {
        return this._noiseTileSize;
    }

    public set noiseTileSize(value: number) {
        if (!Number.isFinite(value) || value <= 0) {
            throw new RangeError("Mesh-blending noiseTileSize must be a finite number greater than 0.");
        }
        this._noiseTileSize = value;
    }

    /**
     * Whether a frame-graph binding supplies the artistic-noise texture.
     * @internal
     */
    public _hasExternalNoiseTexture = false;

    private readonly _stableBlueNoiseTexture: RawTexture;
    private readonly _neutralArtisticNoiseTexture: RawTexture;
    private readonly _customDefines: string;
    private _quality = MeshBlendQuality.Medium;
    private _debugMode = MeshBlendDebugMode.Off;
    private _depthType = MeshBlendDepthType.View;
    private _hasBaseColorTexture = false;

    /**
     * Gets the compile-time quality variant.
     */
    public get quality(): MeshBlendQuality {
        return this._quality;
    }

    public set quality(value: MeshBlendQuality) {
        if (this._quality === value) {
            return;
        }
        _GetMeshBlendQualitySettings(value);
        this._quality = value;
        this._updateEffectDefines();
    }

    /**
     * Gets the compiled debug visualization.
     */
    public get debugMode(): MeshBlendDebugMode {
        return this._debugMode;
    }

    public set debugMode(value: MeshBlendDebugMode) {
        if (this._debugMode === value) {
            return;
        }
        _ValidateDebugMode(value);
        this._debugMode = value;
        this._updateEffectDefines();
    }

    /**
     * Gets the representation stored in the bound depth texture.
     */
    public get depthType(): MeshBlendDepthType {
        return this._depthType;
    }

    public set depthType(value: MeshBlendDepthType) {
        _ValidateDepthType(value);
        if (this._depthType === value) {
            return;
        }
        this._depthType = value;
        this._updateEffectDefines();
    }

    /**
     * Whether a base-color texture is bound and shadow estimation should be compiled.
     * @internal
     */
    public get hasBaseColorTexture(): boolean {
        return this._hasBaseColorTexture;
    }

    public set hasBaseColorTexture(value: boolean) {
        if (this._hasBaseColorTexture === value) {
            return;
        }
        this._hasBaseColorTexture = value;
        this._updateEffectDefines();
    }

    /**
     * Constructs a mesh-blending post process.
     * @param name Name of the effect.
     * @param engine Engine used to render the effect.
     * @param options Options used to configure the effect.
     */
    constructor(name: string, engine: Nullable<AbstractEngine> = null, options?: IThinMeshBlendingPostProcessOptions) {
        const resolvedEngine = engine || EngineStore.LastCreatedEngine!;
        if (!resolvedEngine.isWebGPU && (resolvedEngine as ThinEngine).webGLVersion !== 2) {
            throw new Error("ThinMeshBlendingPostProcess requires WebGL2 or WebGPU");
        }
        const quality = options?.quality ?? MeshBlendQuality.Medium;
        const debugMode = options?.debugMode ?? MeshBlendDebugMode.Off;
        const depthType = options?.depthType ?? MeshBlendDepthType.View;
        const customDefines = _NormalizeDefines(options?.defines ?? null);
        _ValidateMeshBlendConfiguration(options);

        super({
            ...options,
            name,
            engine: resolvedEngine,
            useShaderStore: true,
            useAsPostProcess: true,
            fragmentShader: ThinMeshBlendingPostProcess.FragmentUrl,
            uniforms: ThinMeshBlendingPostProcess.Uniforms,
            samplers: ThinMeshBlendingPostProcess.Samplers,
            defines: _BuildMeshBlendDefines(quality, debugMode, depthType, false, customDefines),
        });

        this._customDefines = customDefines;
        this._noiseTexture = options?.noiseTexture ?? null;
        this._applyConfiguration(options);
        this._stableBlueNoiseTexture = _CreateMeshBlendBlueNoiseTexture(resolvedEngine);
        this._neutralArtisticNoiseTexture = _CreateMeshBlendNeutralArtisticNoiseTexture(resolvedEngine);
    }

    /**
     * Applies shared mesh-blending configuration.
     * @param options Values to apply. Omitted values retain their current settings.
     */
    public configure(options?: IMeshBlendConfiguration): void {
        const definesChanged = this._applyConfiguration(options);
        if (definesChanged) {
            this._updateEffectDefines();
        }
    }

    private _applyConfiguration(options?: IMeshBlendConfiguration): boolean {
        if (!options) {
            return false;
        }
        _ValidateMeshBlendConfiguration(options);

        const previousQuality = this._quality;
        const previousDebugMode = this._debugMode;
        const previousDepthType = this._depthType;

        if (options.radiusClasses) {
            _CopyRadiusDefinitions(this.radiusClasses, options.radiusClasses);
        }
        if (options.slopeFactor !== undefined) {
            this.slopeFactor = options.slopeFactor;
        }
        if (options.depthType !== undefined) {
            _ValidateDepthType(options.depthType);
            this._depthType = options.depthType;
        }
        if (options.worldNormalTextureIsUnsigned !== undefined) {
            this.worldNormalTextureIsUnsigned = options.worldNormalTextureIsUnsigned;
        }
        if (options.noiseFactor !== undefined) {
            this.noiseFactor = options.noiseFactor;
        }
        if (options.noiseFade !== undefined) {
            this.noiseFade = options.noiseFade;
        }
        if (options.noiseOffset !== undefined) {
            this.noiseOffset = options.noiseOffset;
        }
        if (options.noiseTileSize !== undefined) {
            this.noiseTileSize = options.noiseTileSize;
        }

        const quality = options.quality ?? this._quality;
        const debugMode = options.debugMode ?? this._debugMode;
        _GetMeshBlendQualitySettings(quality);
        _ValidateDebugMode(debugMode);
        this._quality = quality;
        this._debugMode = debugMode;
        return previousQuality !== quality || previousDebugMode !== debugMode || previousDepthType !== this._depthType;
    }

    public override bind(noDefaultBindings = false): void {
        super.bind(noDefaultBindings);

        if (!this.camera) {
            throw new Error("ThinMeshBlendingPostProcess: camera is required before binding.");
        }

        const effect = this._drawWrapper.effect!;
        const projection = this.camera.getProjectionMatrix();
        projection.invertToRef(TmpVectors.Matrix[0]);
        this.camera.getViewMatrix().invertToRef(TmpVectors.Matrix[1]);

        effect.setMatrix("projection", projection);
        effect.setMatrix("inverseProjection", TmpVectors.Matrix[0]);
        effect.setMatrix("inverseView", TmpVectors.Matrix[1]);
        effect.setFloat4(
            "blendWorldRadii",
            this.radiusClasses[0].worldRadius,
            this.radiusClasses[1].worldRadius,
            this.radiusClasses[2].worldRadius,
            this.radiusClasses[3].worldRadius
        );
        effect.setFloat4(
            "minimumProjectedRadii",
            this.radiusClasses[0].minimumProjectedRadius,
            this.radiusClasses[1].minimumProjectedRadius,
            this.radiusClasses[2].minimumProjectedRadius,
            this.radiusClasses[3].minimumProjectedRadius
        );
        effect.setFloat("meshBlendIsOrthographic", this.camera.mode === Constants.ORTHOGRAPHIC_CAMERA ? 1 : 0);
        effect.setFloat("meshBlendWorldNormalIsUnsigned", this.worldNormalTextureIsUnsigned ? 1 : 0);
        effect.setFloat("slopeFactor", this._slopeFactor);
        const hasNoiseTexture = !!this._noiseTexture || this._hasExternalNoiseTexture;
        effect.setFloat("noiseFactor", hasNoiseTexture ? this._noiseFactor : 0);
        effect.setFloat("noiseFade", this._noiseFade);
        effect.setFloat("noiseOffset", this._noiseOffset);
        effect.setFloat("noiseTileSize", this._noiseTileSize);
        effect.setTexture("meshBlendBlueNoiseSampler", this._stableBlueNoiseTexture);
        if (!this._hasExternalNoiseTexture) {
            effect.setTexture("meshBlendArtisticNoiseSampler", this._noiseTexture ?? this._neutralArtisticNoiseTexture);
        }
    }

    public override dispose(): void {
        this._stableBlueNoiseTexture.dispose();
        this._neutralArtisticNoiseTexture.dispose();
        super.dispose();
    }

    private _updateEffectDefines(): void {
        this.updateEffect(_BuildMeshBlendDefines(this._quality, this._debugMode, this._depthType, this._hasBaseColorTexture, this._customDefines));
    }
}
