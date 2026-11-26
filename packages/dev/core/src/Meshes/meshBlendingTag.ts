import { type AbstractEngine } from "../Engines/abstractEngine.pure";
import { type ThinEngine } from "../Engines/thinEngine.pure";

/**
 * Checks whether an engine supports the render-target and shader features required by mesh blending.
 * @param engine Engine to check.
 * @returns True for WebGL2 and WebGPU engines, and for Native engines whose runtime supports integer color attachments.
 * @internal
 */
export function _IsMeshBlendingSupported(engine: AbstractEngine): boolean {
    if (engine.shaderPlatformName === "NATIVE") {
        return engine._features.supportMeshBlending;
    }
    return engine.isWebGPU || (engine as ThinEngine).webGLVersion === 2;
}

/**
 * Checks whether an engine can render blended geometry into a target that includes the integer mesh-blending tag attachment.
 * WebGPU and Native never blend integer attachments, while WebGL2 needs per-target blend parameters to disable blending on them.
 * @param engine Engine to check.
 * @returns True if blended draws can write mesh-blending tags.
 * @internal
 */
export function _CanBlendWithMeshBlendTag(engine: AbstractEngine): boolean {
    return engine.isWebGPU || engine.shaderPlatformName === "NATIVE" || engine.getCaps().blendParametersPerTarget;
}

/**
 * Radius class stored in a packed mesh-blending tag.
 *
 * The selected class combines an authored world radius with a minimum projected radius. At a seam,
 * the smaller class from the two participating surfaces is used.
 */
export enum MeshBlendingRadiusClass {
    /** Small blend radius. */
    Small = 0,
    /** Medium blend radius. */
    Medium = 1,
    /** Large blend radius. */
    Large = 2,
    /** Extra-large blend radius. */
    ExtraLarge = 3,
}

/**
 * Decoded values stored in a packed mesh-blending tag.
 */
export interface IMeshBlendingTag {
    /** Logical blend group. Group 0 disables mesh blending. */
    groupId: number;
    /** Radius class used to select the blend radius. */
    radiusClass: MeshBlendingRadiusClass;
}

/**
 * Packs a mesh-blending group and radius class into one byte.
 * @param groupId Logical blend group. Use 0 to disable mesh blending, otherwise use a value from 1 to 63.
 * @param radiusClass Radius class from 0 to 3.
 * @returns The packed mesh-blending tag.
 * @see https://playground.babylonjs.com/?version=preview#XVZTSI#3
 */
export function PackMeshBlendingTag(groupId: number, radiusClass: MeshBlendingRadiusClass): number {
    if (!Number.isInteger(groupId) || groupId < 0 || groupId > 63) {
        throw new RangeError("Mesh-blending group ID must be an integer between 0 and 63.");
    }
    if (groupId === 0) {
        return 0;
    }
    if (!Number.isInteger(radiusClass) || radiusClass < MeshBlendingRadiusClass.Small || radiusClass > MeshBlendingRadiusClass.ExtraLarge) {
        throw new RangeError("Mesh-blending radius class must be an integer between 0 and 3.");
    }

    return (radiusClass << 6) | groupId;
}

/**
 * Decodes a packed mesh-blending tag.
 * @param tag Packed mesh-blending tag.
 * @returns The decoded group and radius class.
 */
export function UnpackMeshBlendingTag(tag: number): IMeshBlendingTag {
    if (!Number.isInteger(tag) || tag < 0 || tag > 0xff) {
        throw new RangeError("Mesh-blending tag must be an integer between 0 and 255.");
    }

    const groupId = tag & 0x3f;
    if (tag !== 0 && groupId === 0) {
        throw new RangeError("A nonzero mesh-blending tag must contain a group ID between 1 and 63.");
    }

    return {
        groupId,
        radiusClass: tag >> 6,
    };
}
