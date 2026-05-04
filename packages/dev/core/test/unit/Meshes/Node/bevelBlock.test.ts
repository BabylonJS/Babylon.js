import { describe, expect, it } from "vitest";
import { VertexData, VertexDataMaterialInfo } from "core/Meshes/mesh.vertexData";
import { BoxBlock } from "core/Meshes/Node/Blocks/Sources/boxBlock";
import { CylinderBlock } from "core/Meshes/Node/Blocks/Sources/cylinderBlock";
import { BevelBlock } from "core/Meshes/Node/Blocks/bevelBlock";
import { GeometryOutputBlock } from "core/Meshes/Node/Blocks/geometryOutputBlock";
import { NodeGeometry } from "core/Meshes/Node/nodeGeometry";
import { GeometryInputBlock } from "core/Meshes/Node/Blocks/geometryInputBlock";
import { NodeGeometryBlockConnectionPointTypes } from "core/Meshes/Node/Enums/nodeGeometryConnectionPointTypes";

const Epsilon = 1e-5;

function buildBeveledBox(amount: number, segments: number, angle: number) {
    const nodeGeometry = new NodeGeometry("beveled box");
    const box = new BoxBlock("Box");
    const bevel = new BevelBlock("Bevel");
    const output = new GeometryOutputBlock("Output");

    bevel.amount.value = amount;
    bevel.segments.value = segments;
    bevel.angle.value = angle;

    box.geometry.connectTo(bevel.geometry);
    bevel.output.connectTo(output.geometry);
    nodeGeometry.outputBlock = output;
    nodeGeometry.build();

    return nodeGeometry.vertexData!;
}

function buildBeveledCylinder(amount: number, segments: number, angle: number) {
    const nodeGeometry = new NodeGeometry("beveled cylinder");
    const cylinder = new CylinderBlock("Cylinder");
    const bevel = new BevelBlock("Bevel");
    const output = new GeometryOutputBlock("Output");

    cylinder.height.value = 1;
    cylinder.diameter.value = 1;
    cylinder.diameterTop.value = -1;
    cylinder.diameterBottom.value = -1;
    cylinder.subdivisions.value = 1;
    cylinder.tessellation.value = 24;
    cylinder.arc.value = 1;
    bevel.amount.value = amount;
    bevel.segments.value = segments;
    bevel.angle.value = angle;

    cylinder.geometry.connectTo(bevel.geometry);
    bevel.output.connectTo(output.geometry);
    nodeGeometry.outputBlock = output;
    nodeGeometry.build();

    return nodeGeometry.vertexData!;
}

function buildBeveledVertexData(source: VertexData, amount: number, segments: number, angle: number) {
    const nodeGeometry = new NodeGeometry("beveled vertex data");
    const input = new GeometryInputBlock("Source", NodeGeometryBlockConnectionPointTypes.Geometry);
    const bevel = new BevelBlock("Bevel");
    const output = new GeometryOutputBlock("Output");

    input.value = source;
    bevel.amount.value = amount;
    bevel.segments.value = segments;
    bevel.angle.value = angle;

    input.output.connectTo(bevel.geometry);
    bevel.output.connectTo(output.geometry);
    nodeGeometry.outputBlock = output;
    nodeGeometry.build();

    return nodeGeometry.vertexData!;
}

function buildDefaultBeveledCylinder() {
    const nodeGeometry = new NodeGeometry("default beveled cylinder");
    const cylinder = new CylinderBlock("Cylinder");
    const bevel = new BevelBlock("Bevel");
    const output = new GeometryOutputBlock("Output");

    cylinder.geometry.connectTo(bevel.geometry);
    bevel.output.connectTo(output.geometry);
    nodeGeometry.outputBlock = output;
    nodeGeometry.build();

    return nodeGeometry.vertexData!;
}

function buildBox() {
    const nodeGeometry = new NodeGeometry("box");
    const box = new BoxBlock("Box");
    const output = new GeometryOutputBlock("Output");

    box.geometry.connectTo(output.geometry);
    nodeGeometry.outputBlock = output;
    nodeGeometry.build();

    return nodeGeometry.vertexData!;
}

function getVertexCount(vertexData: VertexData) {
    return vertexData.positions!.length / 3;
}

function buildDisconnectedBoxes() {
    const source = buildBox();
    const result = new VertexData();
    const positions = Array.from(source.positions!);
    const normals = Array.from(source.normals!);
    const indices = Array.from(source.indices!);
    const vertexCount = positions.length / 3;
    const secondPositions = positions.slice();

    for (let index = 0; index < positions.length; index += 3) {
        positions[index] -= 1.25;
        secondPositions[index] += 1.25;
    }

    result.positions = positions.concat(secondPositions);
    result.normals = normals.concat(normals);
    result.indices = indices.concat(indices.map((index) => index + vertexCount));

    return result;
}

function expectDisconnectedBoxesMostlyOutward(vertexData: VertexData) {
    const positions = vertexData.positions!;
    let outward = 0;
    let inward = 0;

    for (let index = 0; index < vertexData.indices!.length; index += 3) {
        const i0 = vertexData.indices![index] * 3;
        const i1 = vertexData.indices![index + 1] * 3;
        const i2 = vertexData.indices![index + 2] * 3;
        const cx = (positions[i0] + positions[i1] + positions[i2]) / 3;
        const cy = (positions[i0 + 1] + positions[i1 + 1] + positions[i2 + 1]) / 3;
        const cz = (positions[i0 + 2] + positions[i1 + 2] + positions[i2 + 2]) / 3;
        const ux = positions[i0] - positions[i1];
        const uy = positions[i0 + 1] - positions[i1 + 1];
        const uz = positions[i0 + 2] - positions[i1 + 2];
        const vx = positions[i2] - positions[i1];
        const vy = positions[i2 + 1] - positions[i1 + 1];
        const vz = positions[i2 + 2] - positions[i1 + 2];
        const nx = uy * vz - uz * vy;
        const ny = uz * vx - ux * vz;
        const nz = ux * vy - uy * vx;
        const centerX = cx < 0 ? -1.25 : 1.25;

        if (nx * (cx - centerX) + ny * cy + nz * cz >= 0) {
            outward++;
        } else {
            inward++;
        }
    }

    expect(outward).toBeGreaterThan(inward);
}

function expectValidTriangleGeometry(vertexData: VertexData) {
    expect(vertexData.positions).toBeDefined();
    expect(vertexData.indices).toBeDefined();
    expect(vertexData.normals).toBeDefined();
    expect(vertexData.normals!.length).toBe(vertexData.positions!.length);
    expect(vertexData.indices!.length % 3).toBe(0);

    const positions = vertexData.positions!;
    const vertexCount = getVertexCount(vertexData);

    for (const index of vertexData.indices!) {
        expect(index).toBeGreaterThanOrEqual(0);
        expect(index).toBeLessThan(vertexCount);
    }

    for (let index = 0; index < vertexData.indices!.length; index += 3) {
        const i0 = vertexData.indices![index] * 3;
        const i1 = vertexData.indices![index + 1] * 3;
        const i2 = vertexData.indices![index + 2] * 3;
        const ux = positions[i0] - positions[i1];
        const uy = positions[i0 + 1] - positions[i1 + 1];
        const uz = positions[i0 + 2] - positions[i1 + 2];
        const vx = positions[i2] - positions[i1];
        const vy = positions[i2 + 1] - positions[i1 + 1];
        const vz = positions[i2 + 2] - positions[i1 + 2];
        const cx = uy * vz - uz * vy;
        const cy = uz * vx - ux * vz;
        const cz = ux * vy - uy * vx;

        expect(cx * cx + cy * cy + cz * cz).toBeGreaterThan(Epsilon * Epsilon);
    }
}

function expectWithinOriginalBounds(vertexData: VertexData) {
    for (const position of vertexData.positions!) {
        expect(position).toBeGreaterThanOrEqual(-0.5 - Epsilon);
        expect(position).toBeLessThanOrEqual(0.5 + Epsilon);
    }
}

function expectMostlyOutwardFacing(vertexData: VertexData) {
    const positions = vertexData.positions!;
    let outward = 0;
    let inward = 0;

    for (let index = 0; index < vertexData.indices!.length; index += 3) {
        const i0 = vertexData.indices![index] * 3;
        const i1 = vertexData.indices![index + 1] * 3;
        const i2 = vertexData.indices![index + 2] * 3;
        const cx = (positions[i0] + positions[i1] + positions[i2]) / 3;
        const cy = (positions[i0 + 1] + positions[i1 + 1] + positions[i2 + 1]) / 3;
        const cz = (positions[i0 + 2] + positions[i1 + 2] + positions[i2 + 2]) / 3;
        const ux = positions[i0] - positions[i1];
        const uy = positions[i0 + 1] - positions[i1 + 1];
        const uz = positions[i0 + 2] - positions[i1 + 2];
        const vx = positions[i2] - positions[i1];
        const vy = positions[i2 + 1] - positions[i1 + 1];
        const vz = positions[i2 + 2] - positions[i1 + 2];
        const nx = uy * vz - uz * vy;
        const ny = uz * vx - ux * vz;
        const nz = ux * vy - uy * vx;

        if (nx * cx + ny * cy + nz * cz >= 0) {
            outward++;
        } else {
            inward++;
        }
    }

    expect(outward).toBeGreaterThan(inward);
}

function getGeometricBoundaryEdgeCount(vertexData: VertexData) {
    const edgeUseCounts = new Map<string, number>();
    const positions = vertexData.positions!;
    const indices = vertexData.indices!;
    const quantize = (value: number) => Math.round(value / Epsilon);
    const getPositionKey = (index: number) => `${quantize(positions[index * 3])}:${quantize(positions[index * 3 + 1])}:${quantize(positions[index * 3 + 2])}`;
    const getEdgeKey = (a: number, b: number) => {
        const keyA = getPositionKey(a);
        const keyB = getPositionKey(b);

        return keyA < keyB ? `${keyA}|${keyB}` : `${keyB}|${keyA}`;
    };

    for (let index = 0; index < indices.length; index += 3) {
        const i0 = indices[index];
        const i1 = indices[index + 1];
        const i2 = indices[index + 2];

        for (const edgeKey of [getEdgeKey(i0, i1), getEdgeKey(i1, i2), getEdgeKey(i2, i0)]) {
            edgeUseCounts.set(edgeKey, (edgeUseCounts.get(edgeKey) ?? 0) + 1);
        }
    }

    let boundaryEdgeCount = 0;
    for (const edgeUseCount of edgeUseCounts.values()) {
        if (edgeUseCount === 1) {
            boundaryEdgeCount++;
        }
    }

    return boundaryEdgeCount;
}

function expectCubeFacePlaneNormalsRemainOutward(vertexData: VertexData) {
    const positions = vertexData.positions!;
    const normals = vertexData.normals!;
    let checked = 0;

    for (let index = 0; index < positions.length; index += 3) {
        const vertexIndex = index / 3;

        for (let coordinate = 0; coordinate < 3; coordinate++) {
            if (Math.abs(Math.abs(positions[index + coordinate]) - 0.5) >= Epsilon) {
                continue;
            }

            const sign = Math.sign(positions[index + coordinate]);
            const normalIndex = vertexIndex * 3;

            for (let normalCoordinate = 0; normalCoordinate < 3; normalCoordinate++) {
                if (normalCoordinate === coordinate) {
                    expect(sign * normals[normalIndex + normalCoordinate]).toBeGreaterThan(0.5);
                }
            }

            checked++;
        }
    }

    expect(checked).toBeGreaterThan(0);
}

function expectCylinderRimNormalsPointTowardCaps(vertexData: VertexData) {
    const positions = vertexData.positions!;
    const normals = vertexData.normals!;
    let topRimCount = 0;
    let bottomRimCount = 0;

    for (let index = 0; index < positions.length; index += 3) {
        const y = positions[index + 1];
        const radius = Math.hypot(positions[index], positions[index + 2]);
        const normalY = normals[index + 1];

        if (radius < 0.42) {
            continue;
        }

        if (y > 0.42) {
            expect(normalY).toBeGreaterThanOrEqual(-Epsilon);
            topRimCount++;
        } else if (y < -0.42) {
            expect(normalY).toBeLessThanOrEqual(Epsilon);
            bottomRimCount++;
        }
    }

    expect(topRimCount).toBeGreaterThan(0);
    expect(bottomRimCount).toBeGreaterThan(0);
}

function expectClippedFlatFaceNormalsStayPlanar(vertexData: VertexData, amount: number) {
    const positions = vertexData.positions!;
    const normals = vertexData.normals!;
    const innerExtent = 0.5 - amount;
    let checked = 0;
    const quantize = (value: number) => Math.round(value / Epsilon);
    const flatFaceCandidateKeys = new Map<string, { coordinate: number; sign: number }>();
    const flatFaceNormalKeys = new Set<string>();

    for (let index = 0; index < positions.length; index += 3) {
        for (let coordinate = 0; coordinate < 3; coordinate++) {
            if (Math.abs(Math.abs(positions[index + coordinate]) - 0.5) >= Epsilon) {
                continue;
            }

            const tangentCoordinate0 = (coordinate + 1) % 3;
            const tangentCoordinate1 = (coordinate + 2) % 3;

            if (Math.abs(positions[index + tangentCoordinate0]) > innerExtent + Epsilon || Math.abs(positions[index + tangentCoordinate1]) > innerExtent + Epsilon) {
                continue;
            }

            const sign = Math.sign(positions[index + coordinate]);
            const key = `${quantize(positions[index])}:${quantize(positions[index + 1])}:${quantize(positions[index + 2])}:${coordinate}:${sign}`;
            flatFaceCandidateKeys.set(key, { coordinate, sign });

            if (sign * normals[index + coordinate] > 0.9) {
                let planar = true;
                for (let normalCoordinate = 0; normalCoordinate < 3; normalCoordinate++) {
                    if (normalCoordinate !== coordinate && Math.abs(normals[index + normalCoordinate]) > Epsilon) {
                        planar = false;
                        break;
                    }
                }

                if (planar) {
                    flatFaceNormalKeys.add(key);
                }
            }
        }
    }

    for (const key of flatFaceCandidateKeys.keys()) {
        expect(flatFaceNormalKeys.has(key)).toBe(true);
        checked++;
    }

    expect(checked).toBeGreaterThan(0);
}

function expectMergedFlatFaceFansUseSharedCenters(vertexData: VertexData) {
    const positions = vertexData.positions!;
    let checked = 0;

    for (let axis = 0; axis < 3; axis++) {
        const tangentAxis0 = (axis + 1) % 3;
        const tangentAxis1 = (axis + 2) % 3;

        for (const sign of [-1, 1]) {
            let foundCenter = false;

            for (let index = 0; index < positions.length; index += 3) {
                if (
                    Math.abs(positions[index + axis] - sign * 0.5) < Epsilon &&
                    Math.abs(positions[index + tangentAxis0]) < Epsilon &&
                    Math.abs(positions[index + tangentAxis1]) < Epsilon
                ) {
                    foundCenter = true;
                    break;
                }
            }

            expect(foundCenter).toBe(true);
            checked++;
        }
    }

    expect(checked).toBe(6);
}

function hasSharpCubeCorner(vertexData: VertexData) {
    const positions = vertexData.positions!;
    for (let index = 0; index < positions.length; index += 3) {
        if (
            Math.abs(Math.abs(positions[index]) - 0.5) < Epsilon &&
            Math.abs(Math.abs(positions[index + 1]) - 0.5) < Epsilon &&
            Math.abs(Math.abs(positions[index + 2]) - 0.5) < Epsilon
        ) {
            return true;
        }
    }

    return false;
}

function createMaterialInfo(materialIndex: number, indexStart: number, indexCount: number, verticesCount: number) {
    const materialInfo = new VertexDataMaterialInfo();

    materialInfo.materialIndex = materialIndex;
    materialInfo.indexStart = indexStart;
    materialInfo.indexCount = indexCount;
    materialInfo.verticesStart = 0;
    materialInfo.verticesCount = verticesCount;

    return materialInfo;
}

describe("BevelBlock", () => {
    it("bevels cube hard edges while ignoring coplanar triangle diagonals", () => {
        const source = buildBox();
        const result = buildBeveledBox(0.15, 2, 30);

        expectValidTriangleGeometry(result);
        expectWithinOriginalBounds(result);
        expectMostlyOutwardFacing(result);
        expect(getVertexCount(result)).toBeGreaterThan(getVertexCount(source));
        expect(result.indices!.length).toBeGreaterThan(source.indices!.length);
        expect(hasSharpCubeCorner(result)).toBe(false);
    });

    it("keeps geometry unchanged when no edge exceeds the angle threshold", () => {
        const source = buildBox();
        const result = buildBeveledBox(0.15, 3, 135);

        expect(result.positions).toEqual(source.positions);
        expect(result.indices).toEqual(source.indices);
    });

    it("adds more bevel geometry when segment count increases", () => {
        const singleSegment = buildBeveledBox(0.15, 1, 30);
        const fourSegments = buildBeveledBox(0.15, 4, 30);

        expectValidTriangleGeometry(fourSegments);
        expect(getVertexCount(fourSegments)).toBeGreaterThan(getVertexCount(singleSegment));
        expect(fourSegments.indices!.length).toBeGreaterThan(singleSegment.indices!.length);
    });

    it("keeps small-amount high-segment cube corners closed", () => {
        const result = buildBeveledBox(0.1, 29, 21.6);

        expectValidTriangleGeometry(result);
        expectWithinOriginalBounds(result);
        expectMostlyOutwardFacing(result);
        expect(getGeometricBoundaryEdgeCount(result)).toBe(0);
    });

    it("keeps high-amount cube shading continuous", () => {
        const result = buildBeveledBox(0.36, 17, 21.6);

        expectValidTriangleGeometry(result);
        expectWithinOriginalBounds(result);
        expectMostlyOutwardFacing(result);
        expect(getGeometricBoundaryEdgeCount(result)).toBe(0);
        expectCubeFacePlaneNormalsRemainOutward(result);
    });

    it("keeps clipped flat face normals planar after merging coplanar triangles", () => {
        const result = buildBeveledBox(0.33, 33, 46.8);

        expectValidTriangleGeometry(result);
        expectWithinOriginalBounds(result);
        expectMostlyOutwardFacing(result);
        expect(getGeometricBoundaryEdgeCount(result)).toBe(0);
        expectClippedFlatFaceNormalsStayPlanar(result, 0.33);
    });

    it("uses shared centers for merged flat face triangulation", () => {
        const result = buildBeveledBox(0.22, 14, 21.6);

        expectValidTriangleGeometry(result);
        expectWithinOriginalBounds(result);
        expectMostlyOutwardFacing(result);
        expect(getGeometricBoundaryEdgeCount(result)).toBe(0);
        expectMergedFlatFaceFansUseSharedCenters(result);
    });

    it("keeps cylinder rim bevels closed", () => {
        const result = buildBeveledCylinder(0.23, 6, 21.6);

        expectValidTriangleGeometry(result);
        expectWithinOriginalBounds(result);
        expectMostlyOutwardFacing(result);
        expect(getGeometricBoundaryEdgeCount(result)).toBe(0);
    });

    it("keeps cylinder rim normals oriented toward the rounded caps", () => {
        const result = buildBeveledCylinder(0.22, 14, 21.6);

        expect(result.positions).toBeDefined();
        expect(result.indices).toBeDefined();
        expect(result.normals).toBeDefined();
        expect(result.normals!.length).toBe(result.positions!.length);
        expectWithinOriginalBounds(result);
        expectMostlyOutwardFacing(result);
        expect(getGeometricBoundaryEdgeCount(result)).toBe(0);
        expectCylinderRimNormalsPointTowardCaps(result);
    });

    it("keeps disconnected components oriented independently", () => {
        const source = buildDisconnectedBoxes();
        const result = buildBeveledVertexData(source, 0.12, 3, 30);

        expectValidTriangleGeometry(result);
        expect(getGeometricBoundaryEdgeCount(result)).toBe(0);
        expectDisconnectedBoxesMostlyOutward(result);
    });

    it("preserves vertex attributes and material info", () => {
        const source = buildBox();
        const vertexCount = getVertexCount(source);
        source.colors = [];
        source.tangents = [];
        source.uvs2 = [];

        for (let index = 0; index < vertexCount; index++) {
            source.colors.push(index / vertexCount, 0.25, 1 - index / vertexCount, 1);
            source.tangents.push(1, 0, 0, 1);
            source.uvs2.push(index / vertexCount, 1 - index / vertexCount);
        }

        const splitIndex = Math.floor(source.indices!.length / 2 / 3) * 3;
        source.materialInfos = [createMaterialInfo(2, 0, splitIndex, vertexCount), createMaterialInfo(3, splitIndex, source.indices!.length - splitIndex, vertexCount)];

        const result = buildBeveledVertexData(source, 0.12, 3, 30);
        const resultVertexCount = getVertexCount(result);

        expectValidTriangleGeometry(result);
        expect(result.uvs).toBeDefined();
        expect(result.uvs!.length).toBe(resultVertexCount * 2);
        expect(result.uvs2).toBeDefined();
        expect(result.uvs2!.length).toBe(resultVertexCount * 2);
        expect(result.colors).toBeDefined();
        expect(result.colors!.length).toBe(resultVertexCount * 4);
        expect(result.tangents).toBeDefined();
        expect(result.tangents!.length).toBe(resultVertexCount * 4);
        expect(result.materialInfos?.map((materialInfo) => materialInfo.materialIndex)).toEqual([2, 3]);
        expect(result.materialInfos?.reduce((sum, materialInfo) => sum + materialInfo.indexCount, 0)).toBe(result.indices!.length);
    });

    it("supports default cylinder editor wiring", () => {
        let result: VertexData | undefined;

        expect(() => {
            result = buildDefaultBeveledCylinder();
        }).not.toThrow();
        expect(result!.positions!.length).toBeGreaterThan(0);
        expect(result!.indices!.length).toBeGreaterThan(0);
        expect(result!.normals!.length).toBe(result!.positions!.length);
    });

    it("returns a valid unchanged clone when amount is zero", () => {
        const source = buildBox();
        const result = buildBeveledBox(0, 4, 30);

        expectValidTriangleGeometry(result);
        expect(result.positions).toEqual(source.positions);
        expect(result.indices).toEqual(source.indices);
        expect(result).not.toBe(source);
    });

    it("limits amount values above one", () => {
        const limitedResult = buildBeveledBox(1, 8, 30);
        const overLimitResult = buildBeveledBox(2, 8, 30);

        expectValidTriangleGeometry(overLimitResult);
        expect(overLimitResult.positions).toEqual(limitedResult.positions);
        expect(overLimitResult.indices).toEqual(limitedResult.indices);
        expect(overLimitResult.normals).toEqual(limitedResult.normals);
    });

    it("limits segment values to one through sixty four", () => {
        const oneSegmentResult = buildBeveledBox(0.15, 1, 30);
        const belowLimitResult = buildBeveledBox(0.15, 0, 30);
        const sixtyFourSegmentResult = buildBeveledBox(0.15, 64, 30);
        const overLimitResult = buildBeveledBox(0.15, 65, 30);

        expectValidTriangleGeometry(belowLimitResult);
        expectValidTriangleGeometry(overLimitResult);
        expect(belowLimitResult.positions).toEqual(oneSegmentResult.positions);
        expect(belowLimitResult.indices).toEqual(oneSegmentResult.indices);
        expect(belowLimitResult.normals).toEqual(oneSegmentResult.normals);
        expect(overLimitResult.positions).toEqual(sixtyFourSegmentResult.positions);
        expect(overLimitResult.indices).toEqual(sixtyFourSegmentResult.indices);
        expect(overLimitResult.normals).toEqual(sixtyFourSegmentResult.normals);
    });

    it("uses degree values for the angle input", () => {
        const defaultAngleResult = buildBeveledBox(0.15, 2, 30);
        const bevel = new BevelBlock("Bevel");

        expect(bevel.angle.value).toBe(30);
        expectValidTriangleGeometry(defaultAngleResult);
        expect(hasSharpCubeCorner(defaultAngleResult)).toBe(false);
    });

    it("serializes and deserializes its editable properties", () => {
        const bevel = new BevelBlock("Bevel");
        bevel.evaluateContext = true;

        const serialized = bevel.serialize();
        const clone = new BevelBlock("Clone");
        clone._deserialize(serialized);

        expect(serialized.customType).toBe("BABYLON.BevelBlock");
        expect(clone.evaluateContext).toBe(true);
    });
});
