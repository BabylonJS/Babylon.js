import { type Engine, NullEngine } from "core/Engines";
import { type FlowGraph, type FlowGraphContext, FlowGraphCoordinator } from "core/FlowGraph";
import {
    FlowGraphCombineMatrixBlock,
    FlowGraphCombineMatrix2DBlock,
    FlowGraphCombineMatrix3DBlock,
    FlowGraphExtractMatrixBlock,
    FlowGraphExtractMatrix2DBlock,
    FlowGraphExtractMatrix3DBlock,
} from "core/FlowGraph/Blocks/Data/Math/flowGraphMathCombineExtractBlocks";
import { Matrix } from "core/Maths/math.vector";
import { Scene } from "core/scene";

/**
 * The matrix combine blocks take their inputs in column-major order, matching Babylon's `Matrix`
 * storage (`Matrix.FromArray` / `FromValues` / `set`) and the sibling extract blocks, so combining
 * and extracting round-trip.
 */
describe("FlowGraph matrix combine/extract", () => {
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

    const setInputs = (block: any, values: number[]) => {
        values.forEach((value, index) => block.getDataInput(`input_${index}`)!.setValue(value, context));
    };

    const readOutputs = (block: any, count: number) => {
        const result: number[] = [];
        for (let index = 0; index < count; index++) {
            result.push(block.getDataOutput(`output_${index}`)!.getValue(context));
        }
        return result;
    };

    it.each([
        ["4x4", 16, () => new FlowGraphCombineMatrixBlock(), () => new FlowGraphExtractMatrixBlock()],
        ["2x2", 4, () => new FlowGraphCombineMatrix2DBlock(), () => new FlowGraphExtractMatrix2DBlock()],
        ["3x3", 9, () => new FlowGraphCombineMatrix3DBlock(), () => new FlowGraphExtractMatrix3DBlock()],
    ])("round-trips %s through combine then extract", (_name, count, createCombine, createExtract) => {
        // Deliberately asymmetric so a transpose would be visible.
        const values = Array.from({ length: count }, (_unused, index) => index + 1);

        const combine = createCombine();
        setInputs(combine, values);

        const extract = createExtract();
        extract.getDataInput("input")!.setValue(combine.value.getValue(context) as any, context);

        expect(readOutputs(extract, count)).toEqual(values);
    });

    it("stores 4x4 inputs the same way as Matrix.FromArray", () => {
        const values = Array.from({ length: 16 }, (_unused, index) => index + 1);

        const combine = new FlowGraphCombineMatrixBlock();
        setInputs(combine, values);

        expect(Array.from(combine.value.getValue(context).m)).toEqual(Array.from(Matrix.FromArray(values).m));
    });

    it("stores 2x2 and 3x3 inputs in column-major order", () => {
        const combine2D = new FlowGraphCombineMatrix2DBlock();
        setInputs(combine2D, [1, 2, 3, 4]);
        expect(Array.from(combine2D.value.getValue(context).m)).toEqual([1, 2, 3, 4]);

        const combine3D = new FlowGraphCombineMatrix3DBlock();
        setInputs(combine3D, [1, 2, 3, 4, 5, 6, 7, 8, 9]);
        expect(Array.from(combine3D.value.getValue(context).m)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    });
});
