import { type Engine, NullEngine } from "core/Engines";
import { type FlowGraph, type FlowGraphContext, FlowGraphCoordinator } from "core/FlowGraph";
import { FlowGraphMatrixDecomposeBlock } from "core/FlowGraph/Blocks/Data/Math/flowGraphMatrixMathBlocks";
import { Matrix } from "core/Maths/math.vector";
import { Scene } from "core/scene";

/**
 * Column-major 4x4 transform with scale (2, 2, sz), identity rotation and translation (1, 2, 3).
 * @param scaleZ the length of the third column
 * @param fourthRow the four elements of the fourth row, which the decomposition must ignore
 * @returns the matrix
 */
function buildMatrix(scaleZ: number, fourthRow: [number, number, number, number] = [0, 0, 0, 1]): Matrix {
    return Matrix.FromArray([2, 0, 0, fourthRow[0], 0, 2, 0, fourthRow[1], 0, 0, scaleZ, fourthRow[2], 1, 2, 3, fourthRow[3]]);
}

describe("FlowGraphMatrixDecomposeBlock", () => {
    let engine: Engine;
    let scene: Scene;
    let flowGraph: FlowGraph;
    let context: FlowGraphContext;

    beforeEach(() => {
        engine = new NullEngine();
        scene = new Scene(engine);
        flowGraph = new FlowGraphCoordinator({ scene }).createGraph();
        context = flowGraph.createContext();
    });

    afterEach(() => {
        scene.dispose();
        engine.dispose();
    });

    it("decomposes a well-formed matrix and ignores the fourth row", () => {
        const block = new FlowGraphMatrixDecomposeBlock();
        block.input.setValue(buildMatrix(2, [5, 6, 7, 8]), context);

        expect(block.isValid.getValue(context)).toBe(true);
        expect(block.position.getValue(context).asArray()).toEqual([1, 2, 3]);
        expect(block.scaling.getValue(context).asArray()).toEqual([2, 2, 2]);
        expect(block.rotationQuaternion.getValue(context).asArray()).toEqual([0, 0, 0, 1]);
    });

    describe("without keepDegenerateComponents (default)", () => {
        it("reports the type defaults for a non-finite column length", () => {
            const block = new FlowGraphMatrixDecomposeBlock();
            block.input.setValue(buildMatrix(NaN), context);

            expect(block.isValid.getValue(context)).toBe(false);
            expect(block.position.getValue(context).asArray()).toEqual([0, 0, 0]);
            expect(block.scaling.getValue(context).asArray()).toEqual([1, 1, 1]);
            expect(block.rotationQuaternion.getValue(context).asArray()).toEqual([0, 0, 0, 1]);
        });

        it("keeps the translation and the degenerate scale for a zero column length", () => {
            const block = new FlowGraphMatrixDecomposeBlock();
            block.input.setValue(buildMatrix(0), context);

            expect(block.isValid.getValue(context)).toBe(false);
            expect(block.position.getValue(context).asArray()).toEqual([1, 2, 3]);
            expect(block.scaling.getValue(context).asArray()).toEqual([2, 2, 0]);
        });

        it("reports the type defaults for a singular matrix", () => {
            const block = new FlowGraphMatrixDecomposeBlock();
            block.input.setValue(Matrix.FromArray(new Array(16).fill(1)), context);

            expect(block.isValid.getValue(context)).toBe(false);
            expect(block.position.getValue(context).asArray()).toEqual([0, 0, 0]);
            expect(block.scaling.getValue(context).asArray()).toEqual([1, 1, 1]);
        });
    });

    describe("with keepDegenerateComponents", () => {
        it("keeps the translation and the raw column lengths for a non-finite column length", () => {
            const block = new FlowGraphMatrixDecomposeBlock({ keepDegenerateComponents: true });
            block.input.setValue(buildMatrix(NaN), context);

            expect(block.isValid.getValue(context)).toBe(false);
            expect(block.position.getValue(context).asArray()).toEqual([1, 2, 3]);
            const scaling = block.scaling.getValue(context).asArray();
            expect(scaling.slice(0, 2)).toEqual([2, 2]);
            expect(scaling[2]).toBeNaN();
            expect(block.rotationQuaternion.getValue(context).asArray()).toEqual([0, 0, 0, 1]);
        });

        it("keeps the translation and the raw column lengths for a zero scale matrix", () => {
            const block = new FlowGraphMatrixDecomposeBlock({ keepDegenerateComponents: true });
            block.input.setValue(Matrix.FromArray([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 3, 1]), context);

            expect(block.isValid.getValue(context)).toBe(false);
            expect(block.position.getValue(context).asArray()).toEqual([1, 2, 3]);
            expect(block.scaling.getValue(context).asArray()).toEqual([0, 0, 0]);
        });

        it("keeps the translation and the raw column lengths for a singular matrix", () => {
            const block = new FlowGraphMatrixDecomposeBlock({ keepDegenerateComponents: true });
            block.input.setValue(Matrix.FromArray(new Array(16).fill(1)), context);

            expect(block.isValid.getValue(context)).toBe(false);
            expect(block.position.getValue(context).asArray()).toEqual([1, 1, 1]);
            expect(
                block.scaling
                    .getValue(context)
                    .asArray()
                    .map((value) => Math.round(value * 1000) / 1000)
            ).toEqual([1.732, 1.732, 1.732]);
        });
    });
});
