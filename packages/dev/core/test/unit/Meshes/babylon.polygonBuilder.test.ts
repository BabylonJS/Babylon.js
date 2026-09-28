import { describe, expect, it } from "vitest";

import { VertexBuffer } from "core/Buffers/buffer.pure";
import { NullEngine } from "core/Engines/nullEngine";
import { Vector3 } from "core/Maths/math.vector";
import { ExtrudePolygon } from "core/Meshes/Builders/polygonBuilder.pure";
import { Scene } from "core/scene";
import { type FloatArray } from "core/types";

const earcut = () => [0, 1, 2];

function createChamferedShape(scale: number): Vector3[] {
    return [new Vector3(0, 0, 0), new Vector3(1 * scale, 0, 0), new Vector3(2 * scale, 0, 1 * scale), new Vector3(2 * scale, 0, 2 * scale), new Vector3(0, 0, 2 * scale)];
}

function getNormal(normals: FloatArray, vertexIndex: number): number[] {
    const offset = vertexIndex * 3;
    return [normals[offset], normals[offset + 1], normals[offset + 2]];
}

function expectVectorToBeCloseTo(actual: FloatArray, expected: FloatArray): void {
    expect(actual).toHaveLength(expected.length);
    for (let index = 0; index < actual.length; index++) {
        expect(actual[index]).toBeCloseTo(expected[index]);
    }
}

describe("ExtrudePolygon smoothing threshold", () => {
    it("smooths only side corners below the configured angle", () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);

        try {
            const shape = createChamferedShape(1);
            const mesh = ExtrudePolygon("polygon", { shape, depth: 1, smoothingThreshold: 0 }, scene, earcut);
            const normals = mesh.getVerticesData(VertexBuffer.NormalKind)!;
            const firstSideVertex = shape.length * 2;

            expectVectorToBeCloseTo(getNormal(normals, firstSideVertex + 2), getNormal(normals, firstSideVertex + 4));
            expect(getNormal(normals, firstSideVertex + 10)).not.toEqual(getNormal(normals, firstSideVertex + 12));
        } finally {
            scene.dispose();
            engine.dispose();
        }
    });

    it("produces scale-independent smoothing", () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);

        try {
            const smallMesh = ExtrudePolygon("smallPolygon", { shape: createChamferedShape(0.01), depth: 1, smoothingThreshold: 0.5 }, scene, earcut);
            const largeMesh = ExtrudePolygon("largePolygon", { shape: createChamferedShape(100), depth: 1, smoothingThreshold: 0.5 }, scene, earcut);
            const smallNormals = smallMesh.getVerticesData(VertexBuffer.NormalKind)!;
            const largeNormals = largeMesh.getVerticesData(VertexBuffer.NormalKind)!;

            expectVectorToBeCloseTo(smallNormals, largeNormals);
        } finally {
            scene.dispose();
            engine.dispose();
        }
    });
});
