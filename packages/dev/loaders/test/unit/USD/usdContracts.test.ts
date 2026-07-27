import { describe, expect, it } from "vitest";
import { VertexBuffer } from "core/Buffers/buffer";
import { NullEngine } from "core/Engines/nullEngine";
import { Scene } from "core/scene";
import { AdaptResolvedStageToScene, type IResolvedStage, ResolveUsdStageWithFetcherAsync } from "loaders/USD/pure";

const triangleUsda = `#usda 1.0
(
    upAxis = "Y"
    metersPerUnit = 1
)

def Mesh "Triangle"
{
    int[] faceVertexCounts = [3]
    int[] faceVertexIndices = [0, 1, 2]
    point3f[] points = [(0, 0, 0), (1, 0, 0), (0, 1, 0)]
}
`;

describe("USD resolved-stage contract", () => {
    it("returns a deeply frozen plain-data stage while leaving typed buffers readable", async () => {
        const stage = await ResolveUsdStageWithFetcherAsync(triangleUsda, "", "triangle.usda", {}, async () => {
            throw new Error("No external assets expected.");
        });

        expect(Object.isFrozen(stage)).toBe(true);
        expect(Object.isFrozen(stage.metadata)).toBe(true);
        expect(Object.isFrozen(stage.root)).toBe(true);
        expect(Object.isFrozen(stage.root.children)).toBe(true);
        expect(Object.isFrozen(stage.meshes)).toBe(true);
        expect(Object.isFrozen(stage.meshes[0])).toBe(true);
        expect(stage.meshes[0].positions).toBeInstanceOf(Float32Array);
        expect(() => stage.root.children.push(stage.root)).toThrow();
    });

    it("adapts into right-handed scene mode without rewriting authored indices or normals", () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        const indices = new Uint32Array([0, 1, 2]);
        const normals = new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1]);
        const stage = CreateResolvedTriangle(indices, normals);

        try {
            expect(scene.useRightHandedSystem).toBe(false);

            const result = AdaptResolvedStageToScene(stage, scene, null, {});
            const mesh = result.meshes[0];

            expect(scene.useRightHandedSystem).toBe(true);
            expect(result.geometries).toHaveLength(1);
            expect(Array.from(mesh.getIndices()!)).toEqual(Array.from(indices));
            expect(Array.from(mesh.getVerticesData(VertexBuffer.NormalKind)!)).toEqual(Array.from(normals));
            expect(mesh.position.asArray()).toEqual([2, 3, 4]);
        } finally {
            scene.dispose();
            engine.dispose();
        }
    });
});

function CreateResolvedTriangle(indices: Uint32Array, normals: Float32Array): IResolvedStage {
    return {
        metadata: {
            upAxis: "Y",
            metersPerUnit: 1,
            timeCodesPerSecond: 24,
            startTimeCode: 0,
            endTimeCode: 0,
        },
        root: {
            path: "/",
            name: "",
            kind: "transform",
            transform: { translation: [0, 0, 0], rotation: [0, 0, 0, 1], scale: [1, 1, 1] },
            visible: true,
            children: [
                {
                    path: "/Triangle",
                    name: "Triangle",
                    kind: "mesh",
                    transform: { translation: [2, 3, 4], rotation: [0, 0, 0, 1], scale: [1, 1, 1] },
                    visible: true,
                    children: [],
                    meshIndex: 0,
                },
            ],
        },
        meshes: [
            {
                positions: new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]),
                indices,
                normals,
                subdivisionScheme: "none",
                doubleSided: false,
                orientation: "rightHanded",
            },
        ],
        materials: [],
        skeletons: [],
        diagnostics: [],
    };
}
