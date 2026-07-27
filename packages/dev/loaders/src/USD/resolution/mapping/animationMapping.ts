import {
    type IResolvedAnimation,
    type IResolvedAnimationTrack,
    type IResolvedDiagnostic,
    type IStageMetadata,
    type ResolvedInterpolation,
    type Mat4,
    type Quat,
    type Vec3,
} from "../resolvedStage";
import { type ISdfAttributeSpec, type ISdfLayer, type ISdfPrimSpec, type SdfValue } from "../sdf/index";
import { AsMat4, AsQuat, AsToken, AsVec3, GetMetadataToken } from "./valueAccess";
import { DecomposeMatrix, UsdMatrixToResolvedLayout } from "./transformMapping";

/**
 * Bakes supported prim time samples into resolved animation tracks.
 * @param prim prim whose attributes should be scanned
 * @param layer source layer for interpolation metadata
 * @param metadata resolved stage metadata for time conversion
 * @param diagnostics diagnostics sink for deferred animation features
 * @returns resolved animation, or undefined when the prim has no supported tracks
 */
export function ResolvePrimAnimation(prim: ISdfPrimSpec, layer: ISdfLayer, metadata: IStageMetadata, diagnostics: IResolvedDiagnostic[]): IResolvedAnimation | undefined {
    const interpolation = ResolveLayerInterpolation(layer);
    const tracks: IResolvedAnimationTrack[] = [];

    for (const [name, property] of Object.entries(prim.properties)) {
        if (property.kind !== "attribute" || !property.timeSamples || property.timeSamples.times.length === 0) {
            continue;
        }
        if (name === "visibility") {
            tracks.push(BuildVisibilityTrack(property, metadata.timeCodesPerSecond));
        } else if (name === "xformOp:translate") {
            tracks.push(BuildVec3Track("translation", property, metadata.timeCodesPerSecond, interpolation));
        } else if (name === "xformOp:scale") {
            tracks.push(BuildVec3Track("scale", property, metadata.timeCodesPerSecond, interpolation));
        } else if (name === "xformOp:orient") {
            tracks.push(BuildQuatTrack(property, metadata.timeCodesPerSecond, interpolation));
        } else if (name === "xformOp:rotateXYZ" || name === "xformOp:rotateX" || name === "xformOp:rotateY" || name === "xformOp:rotateZ") {
            tracks.push(BuildRotationTrack(name, property, metadata.timeCodesPerSecond, interpolation));
        } else if (name === "xformOp:transform") {
            tracks.push(...BuildMatrixTracks(property, metadata.timeCodesPerSecond, interpolation, diagnostics, property.path ?? prim.path));
        } else if (name.startsWith("xformOp:")) {
            diagnostics.push({ severity: "info", path: property.path ?? prim.path, message: `Animation for '${name}' is deferred.` });
        }
    }

    return tracks.length > 0 ? { tracks } : undefined;
}

function ResolveLayerInterpolation(layer: ISdfLayer): ResolvedInterpolation {
    return GetMetadataToken(layer.metadata, "interpolation") === "linear" ? "linear" : "held";
}

function BuildVec3Track(target: "translation" | "scale", attribute: ISdfAttributeSpec, timeCodesPerSecond: number, interpolation: ResolvedInterpolation): IResolvedAnimationTrack {
    const values: number[] = [];
    for (const sample of attribute.timeSamples?.values ?? []) {
        const vector = AsVec3(sample) ?? [0, 0, 0];
        values.push(vector[0], vector[1], vector[2]);
    }
    return {
        target,
        times: BuildTimes(attribute, timeCodesPerSecond),
        values: new Float32Array(values),
        interpolation,
    };
}

function BuildQuatTrack(attribute: ISdfAttributeSpec, timeCodesPerSecond: number, interpolation: ResolvedInterpolation): IResolvedAnimationTrack {
    const values: number[] = [];
    for (const sample of attribute.timeSamples?.values ?? []) {
        const quat = AsQuat(sample) ?? [0, 0, 0, 1];
        values.push(quat[0], quat[1], quat[2], quat[3]);
    }
    return {
        target: "rotation",
        times: BuildTimes(attribute, timeCodesPerSecond),
        values: new Float32Array(values),
        interpolation,
    };
}

function BuildRotationTrack(name: string, attribute: ISdfAttributeSpec, timeCodesPerSecond: number, interpolation: ResolvedInterpolation): IResolvedAnimationTrack {
    const values: number[] = [];
    for (const sample of attribute.timeSamples?.values ?? []) {
        const quat = ResolveRotationSample(name, sample);
        values.push(quat[0], quat[1], quat[2], quat[3]);
    }
    return {
        target: "rotation",
        times: BuildTimes(attribute, timeCodesPerSecond),
        values: new Float32Array(values),
        interpolation,
    };
}

function BuildVisibilityTrack(attribute: ISdfAttributeSpec, timeCodesPerSecond: number): IResolvedAnimationTrack {
    const values = (attribute.timeSamples?.values ?? []).map((sample) => (AsToken(sample) === "invisible" ? 0 : 1));
    return {
        target: "visibility",
        times: BuildTimes(attribute, timeCodesPerSecond),
        values: new Float32Array(values),
        // USD visibility is a non-interpolatable token, so it always steps (held) between samples
        // regardless of the layer's default interpolation.
        interpolation: "held",
    };
}

function BuildMatrixTracks(
    attribute: ISdfAttributeSpec,
    timeCodesPerSecond: number,
    interpolation: ResolvedInterpolation,
    diagnostics: IResolvedDiagnostic[],
    path: string
): IResolvedAnimationTrack[] {
    // Babylon animates nodes through TRS channels, so a matrix-valued xformOp is decomposed per sample
    // and its translation/rotation/scale interpolated independently. This is an approximation of USD's
    // element-wise matrix interpolation, so record it as an honest, non-fatal diagnostic.
    diagnostics.push({
        severity: "info",
        path,
        message:
            "Matrix-valued animation (xformOp:transform) is approximated by decomposing each sample into interpolated translation, rotation, and scale; USD element-wise matrix interpolation is not preserved.",
    });
    const translations: number[] = [];
    const rotations: number[] = [];
    const scales: number[] = [];
    for (const sample of attribute.timeSamples?.values ?? []) {
        const matrix = AsMat4(sample);
        const transform = matrix
            ? DecomposeMatrix(UsdMatrixToResolvedLayout(matrix as Mat4))
            : { translation: [0, 0, 0] as Vec3, rotation: [0, 0, 0, 1] as Quat, scale: [1, 1, 1] as Vec3 };
        translations.push(transform.translation[0], transform.translation[1], transform.translation[2]);
        rotations.push(transform.rotation[0], transform.rotation[1], transform.rotation[2], transform.rotation[3]);
        scales.push(transform.scale[0], transform.scale[1], transform.scale[2]);
    }
    const times = BuildTimes(attribute, timeCodesPerSecond);
    return [
        { target: "translation", times, values: new Float32Array(translations), interpolation },
        { target: "rotation", times, values: new Float32Array(rotations), interpolation },
        { target: "scale", times, values: new Float32Array(scales), interpolation },
    ];
}

function BuildTimes(attribute: ISdfAttributeSpec, timeCodesPerSecond: number): Float32Array {
    return new Float32Array((attribute.timeSamples?.times ?? []).map((time) => time / timeCodesPerSecond));
}

function ResolveRotationSample(name: string, sample: SdfValue): Quat {
    if (name === "xformOp:rotateXYZ") {
        return QuaternionFromEulerXyz(AsVec3(sample) ?? [0, 0, 0]);
    }
    const degrees = typeof sample.value === "number" ? sample.value : 0;
    if (name === "xformOp:rotateX") {
        return QuaternionFromAxisAngle([1, 0, 0], degrees);
    }
    if (name === "xformOp:rotateY") {
        return QuaternionFromAxisAngle([0, 1, 0], degrees);
    }
    return QuaternionFromAxisAngle([0, 0, 1], degrees);
}

function QuaternionFromEulerXyz(degrees: Vec3): Quat {
    return MultiplyQuaternions(
        MultiplyQuaternions(QuaternionFromAxisAngle([1, 0, 0], degrees[0]), QuaternionFromAxisAngle([0, 1, 0], degrees[1])),
        QuaternionFromAxisAngle([0, 0, 1], degrees[2])
    );
}

function QuaternionFromAxisAngle(axis: Vec3, degrees: number): Quat {
    const halfAngle = (degrees * Math.PI) / 360;
    const s = Math.sin(halfAngle);
    return [axis[0] * s, axis[1] * s, axis[2] * s, Math.cos(halfAngle)];
}

function MultiplyQuaternions(left: Quat, right: Quat): Quat {
    return [
        left[3] * right[0] + left[0] * right[3] + left[1] * right[2] - left[2] * right[1],
        left[3] * right[1] - left[0] * right[2] + left[1] * right[3] + left[2] * right[0],
        left[3] * right[2] + left[0] * right[1] - left[1] * right[0] + left[2] * right[3],
        left[3] * right[3] - left[0] * right[0] - left[1] * right[1] - left[2] * right[2],
    ];
}
