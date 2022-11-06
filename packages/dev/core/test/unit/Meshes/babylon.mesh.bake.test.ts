import { VertexBuffer } from "core/Buffers";
import type { Engine } from "core/Engines";
import { NullEngine } from "core/Engines";
import { Matrix } from "core/Maths";
import type { Mesh } from "core/Meshes";
import { MeshBuilder } from "core/Meshes";
import { Scene } from "core/scene";

describe("Mesh Baking", () => {
    describe("bakeTransformIntoVertices", () => {
        let subject: Engine;
        let scene: Scene;
        let box: Mesh;

        // prettier-ignore
        // Box vertices for box with size 1, centered at origin, it contains 8 vertices [x, y, z].
        const boxVerticesDefault: ReadonlyArray<number> = [
            0.5, -0.5, 0.5,
            -0.5, -0.5, 0.5,
            -0.5, 0.5, 0.5,

            0.5, 0.5, 0.5,
            0.5, 0.5, -0.5,
            -0.5, 0.5, -0.5,

            -0.5, -0.5, -0.5,
            0.5, -0.5, -0.5,
            0.5, 0.5, -0.5,

            0.5, -0.5, -0.5,
            0.5, -0.5, 0.5,
            0.5, 0.5, 0.5,

            -0.5, 0.5, 0.5,
            -0.5, -0.5, 0.5,
            -0.5, -0.5, -0.5,

            -0.5, 0.5, -0.5,
            -0.5, 0.5, 0.5,
            -0.5, 0.5, -0.5,

            0.5, 0.5, -0.5,
            0.5, 0.5, 0.5,
            0.5, -0.5, 0.5,

            0.5, -0.5, -0.5,
            -0.5, -0.5, -0.5,
            -0.5, -0.5, 0.5,
        ];

        beforeEach(() => {
            subject = new NullEngine({
                renderHeight: 256,
                renderWidth: 256,
                textureSize: 256,
                deterministicLockstep: false,
                lockstepMaxSteps: 1,
            });
            scene = new Scene(subject);
            box = MeshBuilder.CreateBox("box", { size: 1 }, scene);
        });

        it("should be able to bake transform into vertices", () => {
            // At start, vertices should be the same as boxVerticesDefault
            const vPositions0 = box.getVerticesData(VertexBuffer.PositionKind);
            expect(vPositions0).toEqual(boxVerticesDefault);

            // Bake transform into vertices with shift by 5 units on Y axis
            const modifiedMesh = box.bakeTransformIntoVertices(Matrix.Translation(0, 5, 0));

            // Method should return same mesh
            expect(modifiedMesh).toBe(box);

            // After baking, vertices should be shifted by 5 units on Y axis
            const vPositionsResult = box.getVerticesData(VertexBuffer.PositionKind);

            // prettier-ignore
            const expectedBoxVerticesShifted: ReadonlyArray<number> = [
                0.5, 4.5, 0.5,
                -0.5, 4.5, 0.5,
                -0.5, 5.5, 0.5,

                0.5, 5.5, 0.5,
                0.5, 5.5, -0.5,
                -0.5, 5.5, -0.5,

                -0.5, 4.5, -0.5,
                0.5, 4.5, -0.5,
                0.5, 5.5, -0.5,

                0.5, 4.5, -0.5,
                0.5, 4.5, 0.5,
                0.5, 5.5, 0.5,

                -0.5, 5.5, 0.5,
                -0.5, 4.5, 0.5,
                -0.5, 4.5, -0.5,

                -0.5, 5.5, -0.5,
                -0.5, 5.5, 0.5,
                -0.5, 5.5, -0.5,

                0.5, 5.5, -0.5,
                0.5, 5.5, 0.5,
                0.5, 4.5, 0.5,

                0.5, 4.5, -0.5,
                -0.5, 4.5, -0.5,
                -0.5, 4.5, 0.5,
            ];

            expect(vPositionsResult).toStrictEqual(expectedBoxVerticesShifted);
        });
    });
});
