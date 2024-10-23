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

// TO DO: Convert Babylon morph (absolute) to GLTF (deltas)
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
    result.attributes = {};

    const flipX = convertToRightHanded ? -1 : 1;
    const floatSize = 4;

    if (morphTarget.hasPositions) {
        const morphPositions = morphTarget.getPositions()!;

        const byteOffset = dataWriter.byteOffset;

        const min = new Array<number>(3).fill(Infinity);
        const max = new Array<number>(3).fill(-Infinity);

        for (let index = 0; index < morphPositions.length; index += 3) {
            const x = morphPositions[index] * flipX;
            const y = morphPositions[index + 1];
            const z = morphPositions[index + 2];

            min[0] = Math.min(min[0], x);
            max[0] = Math.max(max[0], x);

            min[1] = Math.min(min[1], y);
            max[1] = Math.max(max[1], y);

            min[2] = Math.min(min[2], z);
            max[2] = Math.max(max[2], z);

            dataWriter.writeFloat32(x);
            dataWriter.writeFloat32(y);
            dataWriter.writeFloat32(z);
        }

        bufferViews.push(createBufferView(0, byteOffset, morphPositions.length * floatSize, floatSize * 3));
        const bufferViewIndex = bufferViews.length - 1;
        accessors.push(createAccessor(bufferViewIndex, AccessorType.VEC3, AccessorComponentType.FLOAT, morphPositions.length / 3, 0, { min, max }));
        result.attributes["POSITION"] = accessors.length - 1;
    }

    if (morphTarget.hasTangents) {
        const morphTangents = morphTarget.getTangents()!;

        const byteOffset = dataWriter.byteOffset;

        for (let index = 0; index < morphTangents.length; index += 4) {
            dataWriter.writeFloat32(morphTangents[index] * flipX);
            dataWriter.writeFloat32(morphTangents[index + 1]);
            dataWriter.writeFloat32(morphTangents[index + 2]);
        }

        const numberOfTangents = morphTangents.length / 4;

        bufferViews.push(createBufferView(0, byteOffset, numberOfTangents * floatSize * 3, floatSize * 3));
        const bufferViewIndex = bufferViews.length - 1;
        accessors.push(createAccessor(bufferViewIndex, AccessorType.VEC3, AccessorComponentType.FLOAT, numberOfTangents, 0));
        result.attributes["TANGENT"] = accessors.length - 1;
    }

    if (morphTarget.hasNormals) {
        const morphNormals = morphTarget.getNormals()!;

        const byteOffset = dataWriter.byteOffset;

        for (let index = 0; index < morphNormals.length; index += 3) {
            dataWriter.writeFloat32(morphNormals[index] * flipX);
            dataWriter.writeFloat32(morphNormals[index + 1]);
            dataWriter.writeFloat32(morphNormals[index + 2]);
        }

        bufferViews.push(createBufferView(0, byteOffset, morphNormals.length * floatSize, floatSize * 3));
        const bufferViewIndex = bufferViews.length - 1;
        accessors.push(createAccessor(bufferViewIndex, AccessorType.VEC3, AccessorComponentType.FLOAT, morphNormals.length / 3, 0));
        result.attributes["NORMAL"] = accessors.length - 1;
    }

    return result;
}
