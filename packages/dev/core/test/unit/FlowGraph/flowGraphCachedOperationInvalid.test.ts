import { type Engine, NullEngine } from "core/Engines";
import { type FlowGraph, type FlowGraphContext, FlowGraphCoordinator } from "core/FlowGraph";
import { FlowGraphNormalizeBlock } from "core/FlowGraph/Blocks/Data/Math/flowGraphVectorMathBlocks";
import { FlowGraphInvertMatrixBlock, FlowGraphMatrixDecomposeBlock } from "core/FlowGraph/Blocks/Data/Math/flowGraphMatrixMathBlocks";
import { FlowGraphTypes } from "core/FlowGraph/flowGraphRichTypes";
import { FlowGraphMatrix2D, FlowGraphMatrix3D } from "core/FlowGraph/CustomTypes/flowGraphMatrix";
import { Matrix, Vector3 } from "core/Maths/math.vector";
import { Scene } from "core/scene";

/**
 * A cached operation block that cannot produce a result must still deliver a defined `value`
 * alongside `isValid = false`, rather than leaving the output undefined on a first evaluation or
 * stale from an earlier one.
 */
describe("FlowGraphCachedOperationBlock invalid results", () => {
    let engine: Engine;
    let scene: Scene;
    let graph: FlowGraph;
    let context: FlowGraphContext;

    beforeEach(() => {
        engine = new NullEngine();
        scene = new Scene(engine);
        graph = new FlowGraphCoordinator({ scene }).createGraph();
        context = graph.createContext();
    });

    afterEach(() => {
        scene.dispose();
        engine.dispose();
    });

    describe("math/normalize", () => {
        it.each([
            ["a zero-length vector", new Vector3(0, 0, 0)],
            ["a NaN vector", new Vector3(NaN, 0, 0)],
            ["an infinite vector", new Vector3(Infinity, 0, 0)],
        ])("reports a zero vector for %s", (_name, input) => {
            const block = new FlowGraphNormalizeBlock({ type: FlowGraphTypes.Vector3 });
            block.a.setValue(input, context);

            expect(block.isValid.getValue(context)).toBe(false);
            expect(block.value.getValue(context).asArray()).toEqual([0, 0, 0]);
        });

        it("does not report a stale value after a previously valid evaluation", () => {
            const block = new FlowGraphNormalizeBlock({ type: FlowGraphTypes.Vector3 });

            block.a.setValue(new Vector3(0, 5, 0), context);
            expect(block.isValid.getValue(context)).toBe(true);
            expect(block.value.getValue(context).asArray()).toEqual([0, 1, 0]);

            // A new execution frame with a degenerate input must not retain the previous result.
            context._increaseExecutionId();
            block.a.setValue(new Vector3(0, 0, 0), context);
            expect(block.isValid.getValue(context)).toBe(false);
            expect(block.value.getValue(context).asArray()).toEqual([0, 0, 0]);
        });

        it("does not hand out a shared instance that a consumer could mutate", () => {
            const first = new FlowGraphNormalizeBlock({ type: FlowGraphTypes.Vector3 });
            const second = new FlowGraphNormalizeBlock({ type: FlowGraphTypes.Vector3 });
            first.a.setValue(new Vector3(0, 0, 0), context);
            second.a.setValue(new Vector3(0, 0, 0), context);

            const firstValue = first.value.getValue(context);
            firstValue.x = 99;

            expect(second.value.getValue(context).asArray()).toEqual([0, 0, 0]);
        });
    });

    describe("math/inverse", () => {
        it("reports an all-zero matrix for a singular matrix", () => {
            const block = new FlowGraphInvertMatrixBlock();
            block.a.setValue(Matrix.FromArray(new Array(16).fill(1)), context);

            expect(block.isValid.getValue(context)).toBe(false);
            expect(Array.from(block.value.getValue(context).m)).toEqual(new Array(16).fill(0));
        });

        it("reports an all-zero matrix of the configured type", () => {
            const block2D = new FlowGraphInvertMatrixBlock({ matrixType: FlowGraphTypes.Matrix2D });
            block2D.a.setValue(new FlowGraphMatrix2D([0, 0, 0, 0]), context);
            expect(block2D.isValid.getValue(context)).toBe(false);
            expect(Array.from(block2D.value.getValue(context).m)).toEqual([0, 0, 0, 0]);

            const block3D = new FlowGraphInvertMatrixBlock({ matrixType: FlowGraphTypes.Matrix3D });
            block3D.a.setValue(new FlowGraphMatrix3D(new Array(9).fill(0)), context);
            expect(block3D.isValid.getValue(context)).toBe(false);
            expect(Array.from(block3D.value.getValue(context).m)).toEqual(new Array(9).fill(0));
        });

        it("still inverts an invertible matrix", () => {
            const block = new FlowGraphInvertMatrixBlock();
            block.a.setValue(Matrix.Identity(), context);

            expect(block.isValid.getValue(context)).toBe(true);
            expect(Array.from(block.value.getValue(context).m)).toEqual(Array.from(Matrix.Identity().m));
        });
    });

    describe("matrix decompose", () => {
        it("reports defined outputs for a matrix that cannot be decomposed", () => {
            const block = new FlowGraphMatrixDecomposeBlock();
            block.input.setValue(Matrix.FromArray(new Array(16).fill(1)), context);

            expect(block.isValid.getValue(context)).toBe(false);
            expect(block.position.getValue(context)).toBeDefined();
            expect(block.rotationQuaternion.getValue(context)).toBeDefined();
            expect(block.scaling.getValue(context)).toBeDefined();
        });
    });
});
