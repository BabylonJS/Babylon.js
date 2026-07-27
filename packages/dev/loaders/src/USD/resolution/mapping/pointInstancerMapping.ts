import { type IResolvedMaterialBinding, type IResolvedMesh, type IResolvedPointInstancer, type Quat, type Vec3 } from "../resolvedStage";
import { type ISdfPrimSpec, type SdfValue } from "../sdf/index";
import { type IStageMappingContext } from "./mappingContext";
import { BuildMeshPoolKey, ResolveMesh } from "./meshMapping";
import { ResolveMaterialBinding } from "./materialMapping";
import { AsNumberArray, AsVec3Array, GetAttribute, GetAttributeValue, GetRelationship, GetRelationshipTargets } from "./valueAccess";

/**
 * Maps a UsdGeomPointInstancer prim into the resolved point-instancer payload.
 * @param prim point-instancer prim to map
 * @param context mapping context used for prototype lookup, mesh pooling, and diagnostics
 * @returns resolved point-instancer payload, or undefined when the prim is not a PointInstancer
 */
export function ResolvePointInstancer(prim: ISdfPrimSpec, context: IStageMappingContext): IResolvedPointInstancer | undefined {
    if (prim.typeName !== "PointInstancer") {
        return undefined;
    }

    const prototypes = ResolvePrototypes(prim, context);
    return {
        prototypeMeshIndices: prototypes.map((prototype) => prototype.meshIndex),
        prototypeMaterialBindings: prototypes.map((prototype) => prototype.materialBinding),
        protoIndices: BuildInt32Array(GetAttributeValue(GetAttribute(prim, "protoIndices"))),
        ids: ResolveOptionalInt32Array(GetAttributeValue(GetAttribute(prim, "ids"))),
        positions: BuildVec3Buffer(GetAttributeValue(GetAttribute(prim, "positions"))),
        orientations: BuildQuatBuffer(GetAttributeValue(GetAttribute(prim, "orientations"))),
        scales: ResolveOptionalVec3Buffer(GetAttributeValue(GetAttribute(prim, "scales"))),
        invisibleIds: ResolveOptionalInt32Array(GetAttributeValue(GetAttribute(prim, "invisibleIds"))),
    };
}

function ResolvePrototypes(prim: ISdfPrimSpec, context: IStageMappingContext): { meshIndex: number | undefined; materialBinding: IResolvedMaterialBinding | undefined }[] {
    const prototypes: { meshIndex: number | undefined; materialBinding: IResolvedMaterialBinding | undefined }[] = [];
    for (const targetPath of GetRelationshipTargets(GetRelationship(prim, "prototypes"))) {
        const prototypePrim = context.primByPath.get(NormalizePrimPath(targetPath));
        const meshPrim = prototypePrim ? FindPrototypeMesh(prototypePrim, context) : undefined;
        if (!meshPrim) {
            context.diagnostics.push({
                severity: "warning",
                path: targetPath,
                message: "PointInstancer prototype target was not found or did not contain a Mesh and was skipped.",
            });
            prototypes.push({ meshIndex: undefined, materialBinding: undefined });
            continue;
        }

        const mesh = ResolveMesh(meshPrim, context);
        if (mesh) {
            prototypes.push({
                meshIndex: PoolMesh(mesh, context),
                materialBinding: ResolveMaterialBinding(meshPrim, context),
            });
        } else {
            prototypes.push({ meshIndex: undefined, materialBinding: undefined });
        }
    }
    return prototypes;
}

function FindPrototypeMesh(prim: ISdfPrimSpec, context: IStageMappingContext): ISdfPrimSpec | undefined {
    if (prim.typeName === "Mesh") {
        return prim;
    }

    context.diagnostics.push({
        severity: "warning",
        path: prim.path,
        message: "PointInstancer prototype hierarchies are not represented by the resolved contract and were skipped.",
    });
    return undefined;
}

function PoolMesh(mesh: IResolvedMesh, context: IStageMappingContext): number {
    const key = BuildMeshPoolKey(mesh);
    const existing = context.meshIndexByKey.get(key);
    if (existing !== undefined) {
        return existing;
    }
    const index = context.meshes.length;
    context.meshes.push(mesh);
    context.meshIndexByKey.set(key, index);
    return index;
}

function BuildInt32Array(value: SdfValue | undefined): Int32Array {
    return new Int32Array((AsNumberArray(value) ?? []).map((item) => Math.trunc(item)));
}

function ResolveOptionalInt32Array(value: SdfValue | undefined): Int32Array | undefined {
    const values = AsNumberArray(value);
    return values ? new Int32Array(values.map((item) => Math.trunc(item))) : undefined;
}

function BuildVec3Buffer(value: SdfValue | undefined): Float32Array {
    const vectors = AsVec3Array(value) ?? [];
    return BuildVec3BufferFromVectors(vectors);
}

function ResolveOptionalVec3Buffer(value: SdfValue | undefined): Float32Array | undefined {
    const vectors = AsVec3Array(value);
    return vectors ? BuildVec3BufferFromVectors(vectors) : undefined;
}

function BuildVec3BufferFromVectors(vectors: Vec3[]): Float32Array {
    const buffer = new Float32Array(vectors.length * 3);
    vectors.forEach((vector, index) => {
        buffer[index * 3] = vector[0];
        buffer[index * 3 + 1] = vector[1];
        buffer[index * 3 + 2] = vector[2];
    });
    return buffer;
}

function BuildQuatBuffer(value: SdfValue | undefined): Float32Array | undefined {
    const quaternions = AsQuatArray(value);
    if (!quaternions) {
        return undefined;
    }

    const buffer = new Float32Array(quaternions.length * 4);
    quaternions.forEach((quaternion, index) => {
        buffer[index * 4] = quaternion[0];
        buffer[index * 4 + 1] = quaternion[1];
        buffer[index * 4 + 2] = quaternion[2];
        buffer[index * 4 + 3] = quaternion[3];
    });
    return buffer;
}

function AsQuatArray(value: SdfValue | undefined): Quat[] | undefined {
    if (!Array.isArray(value?.value) || !value.value.every((item) => IsNumericTuple(item, 4))) {
        return undefined;
    }
    return value.value.map((item): Quat => {
        const tuple = item as number[];
        return [tuple[0], tuple[1], tuple[2], tuple[3]];
    });
}

function IsNumericTuple(value: unknown, length: number): value is number[] {
    return Array.isArray(value) && value.length >= length && value.slice(0, length).every((item) => typeof item === "number");
}

function NormalizePrimPath(path: string): string {
    const propertyIndex = path.indexOf(".");
    return propertyIndex >= 0 ? path.slice(0, propertyIndex) : path;
}
