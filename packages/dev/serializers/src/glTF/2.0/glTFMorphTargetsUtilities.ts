import type { IBufferView, IAccessor } from "babylonjs-gltf2interface";
import { AccessorComponentType, AccessorType } from "babylonjs-gltf2interface";
import type { MorphTarget } from "core/Morph/morphTarget";
import type { DataWriter } from "./dataWriter";

import { createAccessor, createBufferView } from "./glTFUtilities";

/**
 * Temporary structure to store morph target information.
 */
export class GlTFMorphTarget {
    public attributes: { [name: string]: number };
    public influence: number;
    public name: string;
}

export function buildMorphTargetBuffers(
    morphTarget: MorphTarget,
    dataWriter: DataWriter,
    bufferViews: IBufferView[],
    accessors: IAccessor[],
    convertToRightHanded: boolean
): GlTFMorphTarget {
    const result = new GlTFMorphTarget();
    result.influence = morphTarget.influence;
    result.name = morphTarget.name;

    const flipX = convertToRightHanded ? -1 : 1;

    if (morphTarget.hasPositions) {
        const morphPositions = morphTarget.getPositions()!;

        const byteOffset = dataWriter.byteOffset;

        for (let index = 0; index < morphPositions.length; index += 3) {
            dataWriter.writeFloat32(morphPositions[index] * flipX);
            dataWriter.writeFloat32(morphPositions[index]);
            dataWriter.writeFloat32(morphPositions[index]);
        }

        bufferViews.push(createBufferView(0, byteOffset, morphPositions.length * 4, 4 * 3));
        const bufferViewIndex = bufferViews.length - 1;
        accessors.push(createAccessor(bufferViewIndex, AccessorType.VEC3, AccessorComponentType.FLOAT, morphPositions.length / 3, 0));
        result.attributes.POSITION = accessors.length - 1;
    }

    if (morphTarget.hasTangents) {
        const morphTangents = morphTarget.getTangents()!;

        const byteOffset = dataWriter.byteOffset;

        for (let index = 0; index < morphTangents.length; index += 3) {
            dataWriter.writeFloat32(morphTangents[index] * flipX);
            dataWriter.writeFloat32(morphTangents[index]);
            dataWriter.writeFloat32(morphTangents[index]);
        }

        bufferViews.push(createBufferView(0, byteOffset, morphTangents.length * 4, 4 * 3));
        const bufferViewIndex = bufferViews.length - 1;
        accessors.push(createAccessor(bufferViewIndex, AccessorType.VEC3, AccessorComponentType.FLOAT, morphTangents.length / 3, 0));
        result.attributes.TANGENT = accessors.length - 1;
    }

    if (morphTarget.hasNormals) {
        const morphNormals = morphTarget.getNormals()!;

        const byteOffset = dataWriter.byteOffset;

        for (let index = 0; index < morphNormals.length; index += 3) {
            dataWriter.writeFloat32(morphNormals[index] * flipX);
            dataWriter.writeFloat32(morphNormals[index]);
            dataWriter.writeFloat32(morphNormals[index]);
        }

        bufferViews.push(createBufferView(0, byteOffset, morphNormals.length * 4, 4 * 3));
        const bufferViewIndex = bufferViews.length - 1;
        accessors.push(createAccessor(bufferViewIndex, AccessorType.VEC3, AccessorComponentType.FLOAT, morphNormals.length / 3, 0));
        result.attributes.NORMAL = accessors.length - 1;
    }

    return result;
}
