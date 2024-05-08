import { InputBlock, MultiplyBlock, NodeMaterialBlockConnectionPointTypes, NodeMaterialBlockTargets } from "core/Materials";

describe("NME Math Blocks", () => {
    describe("Dynamic Updates", () => {
        it("invalid input type combinations throw", async () => {
            const validatePair = (leftType: NodeMaterialBlockConnectionPointTypes, rightType: NodeMaterialBlockConnectionPointTypes) => {
                const leftBlock = new InputBlock("left", NodeMaterialBlockTargets.Vertex, leftType);
                const rightBlock = new InputBlock("right", NodeMaterialBlockTargets.Vertex, rightType);
                const multiplyBlock = new MultiplyBlock("multiply");
                leftBlock.output.connectTo(multiplyBlock.left);

                expect(() => rightBlock.output.connectTo(multiplyBlock.right)).toThrow();
            };

            [
                [NodeMaterialBlockConnectionPointTypes.Vector2, NodeMaterialBlockConnectionPointTypes.Vector3],
                [NodeMaterialBlockConnectionPointTypes.Vector2, NodeMaterialBlockConnectionPointTypes.Vector4],
                [NodeMaterialBlockConnectionPointTypes.Vector3, NodeMaterialBlockConnectionPointTypes.Vector4],
                [NodeMaterialBlockConnectionPointTypes.Vector2, NodeMaterialBlockConnectionPointTypes.Matrix],
                [NodeMaterialBlockConnectionPointTypes.Vector3, NodeMaterialBlockConnectionPointTypes.Matrix],
                [NodeMaterialBlockConnectionPointTypes.Vector4, NodeMaterialBlockConnectionPointTypes.Matrix],
            ].forEach(([leftType, rightType]) => {
                validatePair(leftType, rightType);
                validatePair(rightType, leftType);
            });
        });

        it("output type deduced from valid input types", async () => {
            const validatePair = (
                leftType: NodeMaterialBlockConnectionPointTypes,
                rightType: NodeMaterialBlockConnectionPointTypes,
                expectedOutputType: NodeMaterialBlockConnectionPointTypes
            ) => {
                const leftBlock = new InputBlock("left", NodeMaterialBlockTargets.Vertex, leftType);
                const rightBlock = new InputBlock("right", NodeMaterialBlockTargets.Vertex, rightType);
                const multiplyBlock = new MultiplyBlock("multiply");
                leftBlock.output.connectTo(multiplyBlock.left);
                rightBlock.output.connectTo(multiplyBlock.right);

                expect(multiplyBlock.output.type).toEqual(expectedOutputType);
            };

            [
                [NodeMaterialBlockConnectionPointTypes.Float, NodeMaterialBlockConnectionPointTypes.Float, NodeMaterialBlockConnectionPointTypes.Float],
                [NodeMaterialBlockConnectionPointTypes.Int, NodeMaterialBlockConnectionPointTypes.Int, NodeMaterialBlockConnectionPointTypes.Int],
                [NodeMaterialBlockConnectionPointTypes.Vector2, NodeMaterialBlockConnectionPointTypes.Vector2, NodeMaterialBlockConnectionPointTypes.Vector2],
                [NodeMaterialBlockConnectionPointTypes.Vector3, NodeMaterialBlockConnectionPointTypes.Vector3, NodeMaterialBlockConnectionPointTypes.Vector3],
                [NodeMaterialBlockConnectionPointTypes.Matrix, NodeMaterialBlockConnectionPointTypes.Matrix, NodeMaterialBlockConnectionPointTypes.Matrix],

                [NodeMaterialBlockConnectionPointTypes.Float, NodeMaterialBlockConnectionPointTypes.Int, NodeMaterialBlockConnectionPointTypes.Float],
                [NodeMaterialBlockConnectionPointTypes.Float, NodeMaterialBlockConnectionPointTypes.Vector2, NodeMaterialBlockConnectionPointTypes.Vector2],
                [NodeMaterialBlockConnectionPointTypes.Float, NodeMaterialBlockConnectionPointTypes.Vector3, NodeMaterialBlockConnectionPointTypes.Vector3],
                [NodeMaterialBlockConnectionPointTypes.Float, NodeMaterialBlockConnectionPointTypes.Vector4, NodeMaterialBlockConnectionPointTypes.Vector4],
                [NodeMaterialBlockConnectionPointTypes.Float, NodeMaterialBlockConnectionPointTypes.Matrix, NodeMaterialBlockConnectionPointTypes.Matrix],

                [NodeMaterialBlockConnectionPointTypes.Int, NodeMaterialBlockConnectionPointTypes.Vector2, NodeMaterialBlockConnectionPointTypes.Vector2],
                [NodeMaterialBlockConnectionPointTypes.Int, NodeMaterialBlockConnectionPointTypes.Vector3, NodeMaterialBlockConnectionPointTypes.Vector3],
                [NodeMaterialBlockConnectionPointTypes.Int, NodeMaterialBlockConnectionPointTypes.Vector4, NodeMaterialBlockConnectionPointTypes.Vector4],
                [NodeMaterialBlockConnectionPointTypes.Int, NodeMaterialBlockConnectionPointTypes.Matrix, NodeMaterialBlockConnectionPointTypes.Matrix],
            ].forEach(([leftType, rightType, expectedOutputType]) => {
                validatePair(leftType, rightType, expectedOutputType);
                validatePair(rightType, leftType, expectedOutputType);
            });
        });

        it("output type updates when input reconnected", async () => {
            const floatBlock = new InputBlock("float", NodeMaterialBlockTargets.Vertex, NodeMaterialBlockConnectionPointTypes.Float);
            const vector3Block = new InputBlock("vector3", NodeMaterialBlockTargets.Vertex, NodeMaterialBlockConnectionPointTypes.Vector3);
            const multiplyBlock = new MultiplyBlock("multiply");
            floatBlock.output.connectTo(multiplyBlock.left);
            floatBlock.output.connectTo(multiplyBlock.right);

            expect(multiplyBlock.output.type).toEqual(NodeMaterialBlockConnectionPointTypes.Float);

            vector3Block.output.connectTo(multiplyBlock.right);
            expect(multiplyBlock.output.type).toEqual(NodeMaterialBlockConnectionPointTypes.Vector3);

            vector3Block.output.connectTo(multiplyBlock.left);
            expect(multiplyBlock.output.type).toEqual(NodeMaterialBlockConnectionPointTypes.Vector3);

            floatBlock.output.connectTo(multiplyBlock.right);
            expect(multiplyBlock.output.type).toEqual(NodeMaterialBlockConnectionPointTypes.Vector3);

            floatBlock.output.connectTo(multiplyBlock.left);
            expect(multiplyBlock.output.type).toEqual(NodeMaterialBlockConnectionPointTypes.Float);
        });

        it("output type updates when input types change", async () => {
            const floatBlock = new InputBlock("float", NodeMaterialBlockTargets.Vertex, NodeMaterialBlockConnectionPointTypes.Float);
            const vector3Block = new InputBlock("vector3", NodeMaterialBlockTargets.Vertex, NodeMaterialBlockConnectionPointTypes.Vector3);

            const multiplyBlock1 = new MultiplyBlock("multiply1");
            floatBlock.output.connectTo(multiplyBlock1.left);
            floatBlock.output.connectTo(multiplyBlock1.right);

            const multiplyBlock2 = new MultiplyBlock("multiply2");
            floatBlock.output.connectTo(multiplyBlock2.left);
            multiplyBlock1.output.connectTo(multiplyBlock2.right);

            expect(multiplyBlock2.output.type).toEqual(NodeMaterialBlockConnectionPointTypes.Float);

            vector3Block.output.connectTo(multiplyBlock1.left);
            expect(multiplyBlock2.output.type).toEqual(NodeMaterialBlockConnectionPointTypes.Vector3);

            floatBlock.output.connectTo(multiplyBlock1.left);
            expect(multiplyBlock2.output.type).toEqual(NodeMaterialBlockConnectionPointTypes.Float);

            vector3Block.output.connectTo(multiplyBlock1.right);
            expect(multiplyBlock2.output.type).toEqual(NodeMaterialBlockConnectionPointTypes.Vector3);
        });
    });
});
