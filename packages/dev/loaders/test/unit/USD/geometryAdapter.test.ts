import { describe, expect, it } from "vitest";
import { VertexBuffer } from "core/Buffers/buffer";
import { NullEngine } from "core/Engines/nullEngine";
import { Material } from "core/Materials/material";
import { Scene } from "core/scene";
import { CreateMeshFromResolved } from "loaders/USD/adapter/geometryAdapter";
import { type IResolvedMesh } from "loaders/USD/resolution/resolvedStage";

const quadPositions = new Float32Array([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0]);
const quadIndices = new Uint32Array([0, 1, 2, 0, 2, 3]);

function createScene(): { engine: NullEngine; scene: Scene } {
    const engine = new NullEngine();
    const scene = new Scene(engine);
    return { engine, scene };
}

function createResolvedMesh(overrides: Partial<IResolvedMesh> = {}): IResolvedMesh {
    return {
        positions: quadPositions,
        indices: quadIndices,
        subdivisionScheme: "none",
        doubleSided: false,
        orientation: "rightHanded",
        ...overrides,
    };
}

describe("USD geometry adapter", () => {
    it("builds a simple quad mesh from resolved buffers", () => {
        const { engine, scene } = createScene();

        const mesh = CreateMeshFromResolved("Quad", createResolvedMesh(), scene);

        expect(mesh.getTotalVertices()).toBe(4);
        expect(Array.from(mesh.getIndices()!)).toEqual(Array.from(quadIndices));
        expect(Array.from(mesh.getVerticesData(VertexBuffer.PositionKind)!)).toEqual(Array.from(quadPositions));
        expect(mesh.sideOrientation).toBe(Material.CounterClockWiseSideOrientation);

        scene.dispose();
        engine.dispose();
    });

    it("computes normals when resolved normals are absent", () => {
        const { engine, scene } = createScene();

        const mesh = CreateMeshFromResolved("Quad", createResolvedMesh(), scene);
        const normals = mesh.getVerticesData(VertexBuffer.NormalKind)!;

        expect(normals.length).toBe(12);
        for (let index = 0; index < normals.length; index += 3) {
            expect(normals[index]).toBeCloseTo(0);
            expect(normals[index + 1]).toBeCloseTo(0);
            expect(normals[index + 2]).toBeCloseTo(1);
        }

        scene.dispose();
        engine.dispose();
    });

    it("tessellates a single quad cage with one Catmull-Clark level", () => {
        const { engine, scene } = createScene();

        const mesh = CreateMeshFromResolved("SubdivQuad", createResolvedMesh({ subdivisionScheme: "catmullClark" }), scene);
        const positions = mesh.getVerticesData(VertexBuffer.PositionKind)!;
        const facePointOffset = 8 * 3;

        expect(mesh.getTotalVertices()).toBe(9);
        expect(mesh.getIndices()!.length).toBe(24);
        expect(positions[facePointOffset]).toBeCloseTo(0);
        expect(positions[facePointOffset + 1]).toBeCloseTo(0);
        expect(positions[facePointOffset + 2]).toBeCloseTo(0);

        scene.dispose();
        engine.dispose();
    });

    it("plumbs uv, uv2, and vertex color buffers", () => {
        const { engine, scene } = createScene();
        const uv = new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]);
        const uv2 = new Float32Array([0.1, 0.2, 0.9, 0.2, 0.9, 0.8, 0.1, 0.8]);
        const colors = new Float32Array([1, 0, 0, 1, 0, 1, 0, 0.75, 0, 0, 1, 0.5, 1, 1, 1, 0.25]);

        const mesh = CreateMeshFromResolved("Quad", createResolvedMesh({ uvSets: [uv, uv2], colors }), scene);

        expect(Array.from(mesh.getVerticesData(VertexBuffer.UVKind)!)).toEqual(Array.from(uv));
        expect(Array.from(mesh.getVerticesData(VertexBuffer.UV2Kind)!)).toEqual(Array.from(uv2));
        expect(Array.from(mesh.getVerticesData(VertexBuffer.ColorKind)!)).toEqual(Array.from(colors));

        scene.dispose();
        engine.dispose();
    });

    it("creates submeshes from geom subset index ranges", () => {
        const { engine, scene } = createScene();

        const mesh = CreateMeshFromResolved(
            "SubsetQuad",
            createResolvedMesh({
                geomSubsets: [
                    { materialIndex: 2, indexOffset: 0, indexCount: 3 },
                    { materialIndex: 5, indexOffset: 3, indexCount: 3 },
                ],
            }),
            scene
        );

        expect(mesh.subMeshes.length).toBe(2);
        expect(mesh.subMeshes[0].materialIndex).toBe(2);
        expect(mesh.subMeshes[0].indexStart).toBe(0);
        expect(mesh.subMeshes[0].indexCount).toBe(3);
        expect(mesh.subMeshes[1].materialIndex).toBe(5);
        expect(mesh.subMeshes[1].indexStart).toBe(3);
        expect(mesh.subMeshes[1].indexCount).toBe(3);

        scene.dispose();
        engine.dispose();
    });

    it("computes generated normals from left-handed authored orientation", () => {
        const { engine, scene } = createScene();

        const mesh = CreateMeshFromResolved("LeftHanded", createResolvedMesh({ orientation: "leftHanded" }), scene);
        const normals = mesh.getVerticesData(VertexBuffer.NormalKind)!;

        expect(normals[2]).toBeCloseTo(-1);
        expect(normals[5]).toBeCloseTo(-1);

        scene.dispose();
        engine.dispose();
    });

    it("subdivides an authored pentagon without inventing internal faces", () => {
        const { engine, scene } = createScene();
        const positions = new Float32Array([0, 1, 0, 0.95, 0.31, 0, 0.59, -0.81, 0, -0.59, -0.81, 0, -0.95, 0.31, 0]);

        const mesh = CreateMeshFromResolved(
            "Pentagon",
            createResolvedMesh({
                positions,
                indices: new Uint32Array([0, 1, 2, 0, 2, 3, 0, 3, 4]),
                subdivisionScheme: "catmullClark",
                faceVertexCounts: new Uint32Array([5]),
                faceVertexIndices: new Uint32Array([0, 1, 2, 3, 4]),
                faceVertexResolvedIndices: new Uint32Array([0, 1, 2, 3, 4]),
            }),
            scene
        );

        expect(mesh.getTotalVertices()).toBe(11);
        expect(mesh.getIndices()!.length).toBe(30);

        scene.dispose();
        engine.dispose();
    });
});
