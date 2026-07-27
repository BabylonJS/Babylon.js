import { Matrix, Quaternion, Vector3 } from "core/Maths/math.vector.pure";
import { RegisterInstancedMesh, type InstancedMesh } from "core/Meshes/instancedMesh.pure";
import { type Mesh } from "core/Meshes/mesh.pure";
import { RegisterThinInstanceMesh } from "core/Meshes/thinInstanceMesh.pure";
import { type Scene } from "core/scene";
import { type IResolvedPointInstancer } from "../resolution/resolvedStage";

/**
 * Creates a Babylon hardware instance for a USD `instanceable` prim.
 *
 * The returned instance intentionally keeps the source transform unchanged. The USD prim walk owns
 * the instance node transform by parenting and transforming the returned instance after creation.
 *
 * @param sourceMesh the shared prototype mesh to instance
 * @param name the Babylon name for the created instance
 * @returns the created Babylon instanced mesh
 */
export function CreateInstance(sourceMesh: Mesh, name: string): InstancedMesh {
    RegisterInstancedMesh();
    return sourceMesh.createInstance(name);
}

/**
 * Attaches Babylon thin-instance matrices to PointInstancer prototype meshes.
 *
 * The prim walk supplies `prototypeMeshes` in the same order as
 * `instancer.prototypeMeshIndices`, after creating each prototype through the geometry adapter.
 * This adapter only writes per-prototype thin-instance matrix buffers; the instancer prim's own
 * transform is applied by the walk to the prototypes' parent, so these matrices stay in the
 * instancer's local USD space. Invisible instance ids are matched against authored `ids` when
 * present, or zero-based instance indices otherwise. Missing orientations use the identity quaternion; missing
 * scales use unit scale.
 *
 * Babylon thin instances share one draw call per prototype mesh, which is the intended performance
 * path for large USD PointInstancer instance counts.
 *
 * @param instancer the resolved point-instancer payload
 * @param prototypeMeshes prototype meshes ordered to match `instancer.prototypeMeshIndices`
 * @param scene the scene that owns the prototype meshes
 * @returns prototype meshes that received non-empty thin-instance matrix buffers
 */
export function CreatePointInstancerThinInstances(instancer: IResolvedPointInstancer, prototypeMeshes: (Mesh | undefined)[], scene: Scene): Mesh[] {
    RegisterThinInstanceMesh();

    const prototypeCount = Math.min(instancer.prototypeMeshIndices.length, prototypeMeshes.length);
    const instanceCount = GetInstanceCount(instancer);
    const invisibleIds = CreateInvisibleIdSet(instancer.invisibleIds);
    const visibleCounts = new Int32Array(prototypeCount);

    for (let instanceIndex = 0; instanceIndex < instanceCount; instanceIndex++) {
        const prototypeIndex = instancer.protoIndices[instanceIndex];
        if (IsVisiblePrototypeInstance(instanceIndex, prototypeIndex, prototypeCount, prototypeMeshes, scene, instancer.ids, invisibleIds)) {
            visibleCounts[prototypeIndex]++;
        }
    }

    const matrixBuffers = new Array<Float32Array | undefined>(prototypeCount);
    const writeOffsets = new Int32Array(prototypeCount);

    for (let prototypeIndex = 0; prototypeIndex < prototypeCount; prototypeIndex++) {
        const visibleCount = visibleCounts[prototypeIndex];
        if (visibleCount > 0) {
            matrixBuffers[prototypeIndex] = new Float32Array(visibleCount * 16);
        }
    }

    const position = new Vector3();
    const rotation = new Quaternion(0, 0, 0, 1);
    const scale = new Vector3(1, 1, 1);
    const matrix = new Matrix();

    for (let instanceIndex = 0; instanceIndex < instanceCount; instanceIndex++) {
        const prototypeIndex = instancer.protoIndices[instanceIndex];
        if (!IsVisiblePrototypeInstance(instanceIndex, prototypeIndex, prototypeCount, prototypeMeshes, scene, instancer.ids, invisibleIds)) {
            continue;
        }

        const matrixBuffer = matrixBuffers[prototypeIndex]!;
        const positionOffset = instanceIndex * 3;
        position.copyFromFloats(instancer.positions[positionOffset], instancer.positions[positionOffset + 1], instancer.positions[positionOffset + 2]);

        if (instancer.orientations) {
            const orientationOffset = instanceIndex * 4;
            rotation.copyFromFloats(
                instancer.orientations[orientationOffset],
                instancer.orientations[orientationOffset + 1],
                instancer.orientations[orientationOffset + 2],
                instancer.orientations[orientationOffset + 3]
            );
        }

        if (instancer.scales) {
            const scaleOffset = instanceIndex * 3;
            scale.copyFromFloats(instancer.scales[scaleOffset], instancer.scales[scaleOffset + 1], instancer.scales[scaleOffset + 2]);
        }

        Matrix.ComposeToRef(scale, rotation, position, matrix);
        matrix.copyToArray(matrixBuffer, writeOffsets[prototypeIndex] * 16);
        writeOffsets[prototypeIndex]++;
    }

    const instancedMeshes: Mesh[] = [];
    for (let prototypeIndex = 0; prototypeIndex < prototypeCount; prototypeIndex++) {
        const matrixBuffer = matrixBuffers[prototypeIndex];
        if (matrixBuffer) {
            const prototypeMesh = prototypeMeshes[prototypeIndex];
            if (!prototypeMesh) {
                continue;
            }
            prototypeMesh.thinInstanceSetBuffer("matrix", matrixBuffer, 16);
            instancedMeshes.push(prototypeMesh);
        }
    }

    return instancedMeshes;
}

function GetInstanceCount(instancer: IResolvedPointInstancer): number {
    let instanceCount = Math.min(instancer.protoIndices.length, Math.floor(instancer.positions.length / 3));
    if (instancer.orientations) {
        instanceCount = Math.min(instanceCount, Math.floor(instancer.orientations.length / 4));
    }
    if (instancer.scales) {
        instanceCount = Math.min(instanceCount, Math.floor(instancer.scales.length / 3));
    }
    if (instancer.ids) {
        instanceCount = Math.min(instanceCount, instancer.ids.length);
    }
    return instanceCount;
}

function CreateInvisibleIdSet(invisibleIds: Int32Array | undefined): Set<number> | undefined {
    if (!invisibleIds || invisibleIds.length === 0) {
        return undefined;
    }

    const invisibleIdSet = new Set<number>();
    for (const invisibleId of invisibleIds) {
        invisibleIdSet.add(invisibleId);
    }
    return invisibleIdSet;
}

function IsVisiblePrototypeInstance(
    instanceIndex: number,
    prototypeIndex: number,
    prototypeCount: number,
    prototypeMeshes: (Mesh | undefined)[],
    scene: Scene,
    ids: Int32Array | undefined,
    invisibleIds: Set<number> | undefined
): boolean {
    const instanceId = ids?.[instanceIndex] ?? instanceIndex;
    const prototypeMesh = prototypeMeshes[prototypeIndex];
    return prototypeIndex >= 0 && prototypeIndex < prototypeCount && prototypeMesh !== undefined && prototypeMesh.getScene() === scene && !invisibleIds?.has(instanceId);
}
