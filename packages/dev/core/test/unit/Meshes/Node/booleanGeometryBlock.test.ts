import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { VertexData } from "core/Meshes/mesh.vertexData";
import { CreateBoxVertexData } from "core/Meshes/Builders/boxBuilder";
import { CreateTorusVertexData } from "core/Meshes/Builders/torusBuilder";
import { CSG } from "core/Meshes/csg";
import { CSG2 } from "core/Meshes/csg2";
import { BooleanGeometryBlock, BooleanGeometryOperations } from "core/Meshes/Node/Blocks/booleanGeometryBlock";
import { GeometryInputBlock } from "core/Meshes/Node/Blocks/geometryInputBlock";
import { GeometryOutputBlock } from "core/Meshes/Node/Blocks/geometryOutputBlock";
import { NodeGeometry } from "core/Meshes/Node/nodeGeometry";
import { NodeGeometryBlockConnectionPointTypes } from "core/Meshes/Node/Enums/nodeGeometryConnectionPointTypes";

const Epsilon = 1e-5;

/** 24 vertices with normals, two UV sets and vertex colors. */
function texturedBox() {
    const box = CreateBoxVertexData({ size: 2 });
    box.uvs2 = Array.from(box.uvs!);
    box.uvs3 = Array.from(box.uvs!);
    box.colors = new Array<number>((box.positions!.length / 3) * 4).fill(0.5);
    return box;
}

/** A different vertex count, a single UV set, and no normals or colors. No degenerate triangles, so every computed normal is a unit vector. */
function bareTorus() {
    const torus = CreateTorusVertexData({ diameter: 1, thickness: 0.4, tessellation: 12 });
    torus.normals = null;
    return torus;
}

/**
 * Runs a subtract between two geometries and returns the operands exactly as the block hands them to the CSG engine.
 * The engine is stubbed: manifold is not loaded in unit tests, and completing the operands is the block's job.
 */
function captureOperands(geometry0: VertexData, geometry1: VertexData, useOldCSGEngine = false): [VertexData, VertexData] {
    const captured: VertexData[] = [];
    const engineResult = {
        subtract: () => engineResult,
        intersect: () => engineResult,
        add: () => engineResult,
        union: () => engineResult,
        toVertexData: () => captured[0],
    };
    const capture = (vertexData: VertexData) => {
        captured.push(vertexData);
        return engineResult as any;
    };
    if (useOldCSGEngine) {
        vi.spyOn(CSG, "FromVertexData").mockImplementation(capture);
    } else {
        vi.spyOn(CSG2, "FromVertexData").mockImplementation(capture);
    }

    const nodeGeometry = new NodeGeometry("boolean");
    const input0 = new GeometryInputBlock("Geometry0", NodeGeometryBlockConnectionPointTypes.Geometry);
    const input1 = new GeometryInputBlock("Geometry1", NodeGeometryBlockConnectionPointTypes.Geometry);
    const boolean = new BooleanGeometryBlock("Boolean");
    const output = new GeometryOutputBlock("Output");

    input0.value = geometry0;
    input1.value = geometry1;
    boolean.operation = BooleanGeometryOperations.Subtract;
    boolean.useOldCSGEngine = useOldCSGEngine;

    input0.output.connectTo(boolean.geometry0);
    input1.output.connectTo(boolean.geometry1);
    boolean.output.connectTo(output.geometry);
    nodeGeometry.outputBlock = output;
    nodeGeometry.build();

    expect(captured).toHaveLength(2);
    return [captured[0], captured[1]];
}

/** Returns the operands in [textured, bare] order whichever input each one was wired to. */
function captureTexturedAndBare(bareFirst: boolean, useOldCSGEngine = false): [VertexData, VertexData] {
    const textured = texturedBox();
    const bare = bareTorus();
    const [operand0, operand1] = bareFirst ? captureOperands(bare, textured, useOldCSGEngine) : captureOperands(textured, bare, useOldCSGEngine);
    return bareFirst ? [operand1, operand0] : [operand0, operand1];
}

function vertexCount(vertexData: VertexData) {
    return vertexData.positions!.length / 3;
}

function expectFinite(values: ArrayLike<number> | null | undefined, length: number) {
    expect(values).toBeTruthy();
    expect(values!.length).toBe(length);
    for (let i = 0; i < values!.length; i++) {
        expect(Number.isFinite(values![i])).toBe(true);
    }
}

describe("BooleanGeometryBlock operand completion", () => {
    beforeEach(() => {
        // Report CSG2 as ready so the build stays synchronous and never fetches manifold.
        vi.spyOn(BooleanGeometryBlock.prototype, "_isReadyState", "get").mockReturnValue(null);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe.each([
        ["textured operand first", false],
        ["bare operand first", true],
    ])("%s", (_label, bareFirst) => {
        it("pads every UV set the other operand has, sized to its own vertex count", () => {
            const [textured, bare] = captureTexturedAndBare(bareFirst);

            expect(vertexCount(bare)).not.toBe(vertexCount(textured));
            expectFinite(bare.uvs2, vertexCount(bare) * 2);
            expectFinite(bare.uvs3, vertexCount(bare) * 2);
            expect(bare.uvs4).toBeFalsy();
            expect(Array.from(bare.uvs2!).every((value) => value === 0)).toBe(true);
        });

        it("computes normals for the operand that has none", () => {
            const [, bare] = captureTexturedAndBare(bareFirst);
            const reference = bareTorus();
            const expected: number[] = [];
            VertexData.ComputeNormals(reference.positions, reference.indices, expected);

            expectFinite(bare.normals, bare.positions!.length);
            for (let i = 0; i < expected.length; i++) {
                expect(bare.normals![i]).toBeCloseTo(expected[i], 5);
            }
            for (let i = 0; i < bare.normals!.length; i += 3) {
                expect(Math.hypot(bare.normals![i], bare.normals![i + 1], bare.normals![i + 2])).toBeCloseTo(1, 5);
            }
        });

        it("completes missing vertex colors with white", () => {
            const [, bare] = captureTexturedAndBare(bareFirst);

            expectFinite(bare.colors, vertexCount(bare) * 4);
            expect(Array.from(bare.colors!).every((value) => Math.abs(value - 1) < Epsilon)).toBe(true);
        });

        it("only pads the first UV set for the legacy CSG engine", () => {
            const textured = texturedBox();
            const bare = bareTorus();
            bare.uvs = null;
            const [operand0, operand1] = bareFirst ? captureOperands(bare, textured, true) : captureOperands(textured, bare, true);
            const paddedBare = bareFirst ? operand0 : operand1;

            expectFinite(paddedBare.uvs, vertexCount(paddedBare) * 2);
            expect(paddedBare.uvs2).toBeFalsy();
            expect(paddedBare.uvs3).toBeFalsy();
        });
    });
});
