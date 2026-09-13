/* eslint-disable @typescript-eslint/naming-convention, jsdoc/require-param, jsdoc/require-returns */
import { type FBXNode } from "../types/fbxTypes";
import { resolveNumberProperty, resolveVector3Property, type FBXPropertyTemplate } from "./propertyTemplates";

/** Transform properties resolved from an FBX Model, with template defaults applied. */
export interface FBXNodeTransformData {
    translation: [number, number, number];
    rotation: [number, number, number];
    scale: [number, number, number];
    preRotation: [number, number, number];
    postRotation: [number, number, number];
    rotationPivot: [number, number, number];
    scalingPivot: [number, number, number];
    rotationOffset: [number, number, number];
    scalingOffset: [number, number, number];
    geometricTranslation: [number, number, number];
    geometricRotation: [number, number, number];
    geometricScaling: [number, number, number];
    /** Rotation order: 0=XYZ, 1=XZY, 2=YZX, 3=YXZ, 4=ZXY, 5=ZYX, 6=SphericXYZ */
    rotationOrder: number;
    /** FBX transform inheritance mode. 0=RrSs, 1=RSrs, 2=Rrs */
    inheritType: number;
    /** Whether the rotation space (rotation order, pre/post rotation) is active for this node */
    rotationActive: boolean;
    diagnostics: string[];
}

/**
 * Resolves the transform properties of a Model node the way the FBX SDK evaluates them.
 *
 * `RotationActive` gates the whole rotation space: when it is false (the FbxNode template default), the SDK
 * composes `Lcl Rotation` in plain XYZ order and ignores `RotationOrder`, `PreRotation` and `PostRotation`.
 * `RotationSpaceForLimitOnly` restricts the rotation space to limits, which has the same effect for us.
 */
export function extractNodeTransform(modelNode: FBXNode, template?: FBXPropertyTemplate): FBXNodeTransformData {
    const translation = resolveVector3Property(modelNode, template, "Lcl Translation", [0, 0, 0]);
    const rotation = resolveVector3Property(modelNode, template, "Lcl Rotation", [0, 0, 0]);
    const scale = resolveVector3Property(modelNode, template, "Lcl Scaling", [1, 1, 1]);
    let preRotation = resolveVector3Property(modelNode, template, "PreRotation", [0, 0, 0]);
    let postRotation = resolveVector3Property(modelNode, template, "PostRotation", [0, 0, 0]);
    const rotationPivot = resolveVector3Property(modelNode, template, "RotationPivot", [0, 0, 0]);
    const scalingPivot = resolveVector3Property(modelNode, template, "ScalingPivot", [0, 0, 0]);
    const rotationOffset = resolveVector3Property(modelNode, template, "RotationOffset", [0, 0, 0]);
    const scalingOffset = resolveVector3Property(modelNode, template, "ScalingOffset", [0, 0, 0]);
    const geometricTranslation = resolveVector3Property(modelNode, template, "GeometricTranslation", [0, 0, 0]);
    const geometricRotation = resolveVector3Property(modelNode, template, "GeometricRotation", [0, 0, 0]);
    const geometricScaling = resolveVector3Property(modelNode, template, "GeometricScaling", [1, 1, 1]);
    let rotationOrder = resolveNumberProperty(modelNode, template, "RotationOrder", 0);
    const inheritType = resolveNumberProperty(modelNode, template, "InheritType", 1);

    // The SDK default when the property is absent everywhere is "active"; the FbxNode template usually sets 0.
    const rotationActiveValue = resolveNumberProperty(modelNode, template, "RotationActive", 1);
    const rotationSpaceForLimitOnly = resolveNumberProperty(modelNode, template, "RotationSpaceForLimitOnly", 0);
    const rotationActive = rotationActiveValue !== 0 && rotationSpaceForLimitOnly === 0;
    if (!rotationActive) {
        rotationOrder = 0;
        preRotation = [0, 0, 0];
        postRotation = [0, 0, 0];
    }

    // Inherit modes 0 (RrSs), 1 (RSrs) and 2 (Rrs) are all evaluated by the loader; anything else is unknown.
    const diagnostics = inheritType === 0 || inheritType === 1 || inheritType === 2 ? [] : [`InheritType ${inheritType} is unknown; treated as RSrs.`];

    return {
        translation,
        rotation,
        scale,
        preRotation,
        postRotation,
        rotationPivot,
        scalingPivot,
        rotationOffset,
        scalingOffset,
        geometricTranslation,
        geometricRotation,
        geometricScaling,
        rotationOrder,
        inheritType,
        rotationActive,
        diagnostics,
    };
}
