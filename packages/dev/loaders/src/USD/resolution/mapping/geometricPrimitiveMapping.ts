import { type IResolvedMesh } from "../resolvedStage";
import { type ISdfPrimSpec } from "../sdf";
import { GetBooleanAttribute, GetNumberAttribute, GetTokenAttribute } from "./valueAccess";

interface IPrimitiveBuffers {
    positions: number[];
    indices: number[];
    normals: number[];
    uvs: number[];
}

type PrimitiveAxis = "X" | "Y" | "Z";

const RadialSegments = 32;
const SphereSegments = 16;
const CapsuleCapSegments = 8;

/**
 * Resolves an intrinsic UsdGeom primitive into the same vertex-ready mesh data used by authored Mesh prims.
 * @param prim intrinsic geometric primitive to resolve
 * @returns resolved mesh data, or undefined when the prim is not a supported intrinsic primitive
 */
export function ResolveGeometricPrimitive(prim: ISdfPrimSpec): IResolvedMesh | undefined {
    let buffers: IPrimitiveBuffers | undefined;

    switch (prim.typeName) {
        case "Cube":
            buffers = CreateBox(Math.max(0, GetNumberAttribute(prim, "size") ?? 2));
            break;
        case "Sphere":
            buffers = CreateSphere(Math.max(0, GetNumberAttribute(prim, "radius") ?? 1));
            break;
        case "Cylinder":
            buffers = CreateCylinder(Math.max(0, GetNumberAttribute(prim, "radius") ?? 1), Math.max(0, GetNumberAttribute(prim, "height") ?? 2), false);
            RotateFromZAxis(buffers, GetPrimitiveAxis(prim));
            break;
        case "Cone":
            buffers = CreateCylinder(Math.max(0, GetNumberAttribute(prim, "radius") ?? 1), Math.max(0, GetNumberAttribute(prim, "height") ?? 2), true);
            RotateFromZAxis(buffers, GetPrimitiveAxis(prim));
            break;
        case "Capsule":
            buffers = CreateCapsule(Math.max(0, GetNumberAttribute(prim, "radius") ?? 0.5), Math.max(0, GetNumberAttribute(prim, "height") ?? 1));
            RotateFromZAxis(buffers, GetPrimitiveAxis(prim));
            break;
        default:
            return undefined;
    }

    const orientation = GetTokenAttribute(prim, "orientation") === "leftHanded" ? "leftHanded" : "rightHanded";
    if (orientation === "leftHanded") {
        for (let index = 0; index < buffers.normals.length; index++) {
            buffers.normals[index] *= -1;
        }
    }

    return {
        positions: new Float32Array(buffers.positions),
        indices: new Uint32Array(buffers.indices),
        normals: new Float32Array(buffers.normals),
        uvSets: [new Float32Array(buffers.uvs)],
        subdivisionScheme: "none",
        doubleSided: GetBooleanAttribute(prim, "doubleSided") ?? false,
        orientation,
    };
}

function CreateBox(size: number): IPrimitiveBuffers {
    const halfSize = size / 2;
    const positions: number[] = [];
    const indices: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];
    const faces = [
        {
            normal: [0, 0, 1],
            corners: [
                [-halfSize, -halfSize, halfSize],
                [halfSize, -halfSize, halfSize],
                [halfSize, halfSize, halfSize],
                [-halfSize, halfSize, halfSize],
            ],
        },
        {
            normal: [0, 0, -1],
            corners: [
                [halfSize, -halfSize, -halfSize],
                [-halfSize, -halfSize, -halfSize],
                [-halfSize, halfSize, -halfSize],
                [halfSize, halfSize, -halfSize],
            ],
        },
        {
            normal: [1, 0, 0],
            corners: [
                [halfSize, -halfSize, halfSize],
                [halfSize, -halfSize, -halfSize],
                [halfSize, halfSize, -halfSize],
                [halfSize, halfSize, halfSize],
            ],
        },
        {
            normal: [-1, 0, 0],
            corners: [
                [-halfSize, -halfSize, -halfSize],
                [-halfSize, -halfSize, halfSize],
                [-halfSize, halfSize, halfSize],
                [-halfSize, halfSize, -halfSize],
            ],
        },
        {
            normal: [0, 1, 0],
            corners: [
                [-halfSize, halfSize, halfSize],
                [halfSize, halfSize, halfSize],
                [halfSize, halfSize, -halfSize],
                [-halfSize, halfSize, -halfSize],
            ],
        },
        {
            normal: [0, -1, 0],
            corners: [
                [-halfSize, -halfSize, -halfSize],
                [halfSize, -halfSize, -halfSize],
                [halfSize, -halfSize, halfSize],
                [-halfSize, -halfSize, halfSize],
            ],
        },
    ] as const;

    for (const face of faces) {
        const offset = positions.length / 3;
        for (const corner of face.corners) {
            positions.push(corner[0], corner[1], corner[2]);
            normals.push(face.normal[0], face.normal[1], face.normal[2]);
        }
        uvs.push(0, 0, 1, 0, 1, 1, 0, 1);
        indices.push(offset, offset + 1, offset + 2, offset, offset + 2, offset + 3);
    }

    return { positions, indices, normals, uvs };
}

function CreateSphere(radius: number): IPrimitiveBuffers {
    const buffers: IPrimitiveBuffers = { positions: [], indices: [], normals: [], uvs: [] };
    for (let ring = 0; ring <= SphereSegments; ring++) {
        const v = ring / SphereSegments;
        const phi = v * Math.PI;
        const radial = Math.sin(phi);
        const z = Math.cos(phi);
        for (let segment = 0; segment <= RadialSegments; segment++) {
            const u = segment / RadialSegments;
            const theta = u * Math.PI * 2;
            const x = radial * Math.cos(theta);
            const y = radial * Math.sin(theta);
            buffers.positions.push(x * radius, y * radius, z * radius);
            buffers.normals.push(x, y, z);
            buffers.uvs.push(u, 1 - v);
        }
    }
    ConnectRows(buffers.indices, SphereSegments, RadialSegments, { collapseFirstRow: true, collapseLastRow: true });
    ReverseTriangleWinding(buffers.indices);
    return buffers;
}

function CreateCylinder(radius: number, height: number, cone: boolean): IPrimitiveBuffers {
    const buffers: IPrimitiveBuffers = { positions: [], indices: [], normals: [], uvs: [] };
    const halfHeight = height / 2;
    const topRadius = cone ? 0 : radius;
    const slope = height > 0 ? (radius - topRadius) / height : 0;
    const normalScale = 1 / Math.sqrt(1 + slope * slope);

    for (let ring = 0; ring <= 1; ring++) {
        const ringRadius = ring === 0 ? radius : topRadius;
        const z = ring === 0 ? -halfHeight : halfHeight;
        for (let segment = 0; segment <= RadialSegments; segment++) {
            const u = segment / RadialSegments;
            const theta = u * Math.PI * 2;
            const x = Math.cos(theta);
            const y = Math.sin(theta);
            buffers.positions.push(x * ringRadius, y * ringRadius, z);
            buffers.normals.push(x * normalScale, y * normalScale, slope * normalScale);
            buffers.uvs.push(u, ring);
        }
    }
    ConnectRows(buffers.indices, 1, RadialSegments, { collapseLastRow: topRadius === 0 });
    AddCap(buffers, radius, -halfHeight, -1);
    if (topRadius > 0) {
        AddCap(buffers, topRadius, halfHeight, 1);
    }
    return buffers;
}

function CreateCapsule(radius: number, height: number): IPrimitiveBuffers {
    const buffers: IPrimitiveBuffers = { positions: [], indices: [], normals: [], uvs: [] };
    const halfHeight = height / 2;
    const totalHeight = height + radius * 2;
    const rows: { radial: number; z: number; normalRadial: number; normalZ: number }[] = [];

    for (let row = 0; row <= CapsuleCapSegments; row++) {
        const angle = -Math.PI / 2 + (row / CapsuleCapSegments) * (Math.PI / 2);
        rows.push({
            radial: Math.cos(angle) * radius,
            z: -halfHeight + Math.sin(angle) * radius,
            normalRadial: Math.cos(angle),
            normalZ: Math.sin(angle),
        });
    }
    rows.push({ radial: radius, z: halfHeight, normalRadial: 1, normalZ: 0 });
    for (let row = 1; row <= CapsuleCapSegments; row++) {
        const angle = (row / CapsuleCapSegments) * (Math.PI / 2);
        rows.push({
            radial: Math.cos(angle) * radius,
            z: halfHeight + Math.sin(angle) * radius,
            normalRadial: Math.cos(angle),
            normalZ: Math.sin(angle),
        });
    }

    for (const row of rows) {
        for (let segment = 0; segment <= RadialSegments; segment++) {
            const u = segment / RadialSegments;
            const theta = u * Math.PI * 2;
            const x = Math.cos(theta);
            const y = Math.sin(theta);
            buffers.positions.push(x * row.radial, y * row.radial, row.z);
            buffers.normals.push(x * row.normalRadial, y * row.normalRadial, row.normalZ);
            buffers.uvs.push(u, totalHeight > 0 ? (row.z + totalHeight / 2) / totalHeight : 0);
        }
    }
    ConnectRows(buffers.indices, rows.length - 1, RadialSegments, { collapseFirstRow: true, collapseLastRow: true });
    return buffers;
}

function AddCap(buffers: IPrimitiveBuffers, radius: number, z: number, normalZ: -1 | 1): void {
    const center = buffers.positions.length / 3;
    buffers.positions.push(0, 0, z);
    buffers.normals.push(0, 0, normalZ);
    buffers.uvs.push(0.5, 0.5);

    const ringStart = buffers.positions.length / 3;
    for (let segment = 0; segment <= RadialSegments; segment++) {
        const theta = (segment / RadialSegments) * Math.PI * 2;
        const x = Math.cos(theta);
        const y = Math.sin(theta);
        buffers.positions.push(x * radius, y * radius, z);
        buffers.normals.push(0, 0, normalZ);
        buffers.uvs.push(x * 0.5 + 0.5, y * 0.5 + 0.5);
    }

    for (let segment = 0; segment < RadialSegments; segment++) {
        const current = ringStart + segment;
        const next = current + 1;
        if (normalZ > 0) {
            buffers.indices.push(center, current, next);
        } else {
            buffers.indices.push(center, next, current);
        }
    }
}

function ConnectRows(indices: number[], rowCount: number, segmentCount: number, options: { collapseFirstRow?: boolean; collapseLastRow?: boolean } = {}): void {
    const rowSize = segmentCount + 1;
    for (let row = 0; row < rowCount; row++) {
        for (let segment = 0; segment < segmentCount; segment++) {
            const current = row * rowSize + segment;
            const next = current + rowSize;
            if (!options.collapseFirstRow || row !== 0) {
                indices.push(current, current + 1, next);
            }
            if (!options.collapseLastRow || row !== rowCount - 1) {
                indices.push(current + 1, next + 1, next);
            }
        }
    }
}

function ReverseTriangleWinding(indices: number[]): void {
    for (let offset = 0; offset < indices.length; offset += 3) {
        const second = indices[offset + 1];
        indices[offset + 1] = indices[offset + 2];
        indices[offset + 2] = second;
    }
}

function GetPrimitiveAxis(prim: ISdfPrimSpec): PrimitiveAxis {
    const axis = GetTokenAttribute(prim, "axis");
    return axis === "X" || axis === "Y" ? axis : "Z";
}

function RotateFromZAxis(buffers: IPrimitiveBuffers, axis: PrimitiveAxis): void {
    if (axis === "Z") {
        return;
    }
    RotateTriples(buffers.positions, axis);
    RotateTriples(buffers.normals, axis);
}

function RotateTriples(values: number[], axis: Exclude<PrimitiveAxis, "Z">): void {
    for (let index = 0; index < values.length; index += 3) {
        const x = values[index];
        const y = values[index + 1];
        const z = values[index + 2];
        if (axis === "X") {
            values[index] = z;
            values[index + 1] = y;
            values[index + 2] = -x;
        } else {
            values[index] = x;
            values[index + 1] = z;
            values[index + 2] = -y;
        }
    }
}
