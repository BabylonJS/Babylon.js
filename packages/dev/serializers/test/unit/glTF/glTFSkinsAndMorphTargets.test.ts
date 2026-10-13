import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { CreateTestScene, CreateTriangleGltf, RoundTripGltfAsync, ToDataUri, type GltfJson } from "./glTFTestUtils";

const TrianglePositions = new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]);
const TriangleNormals = new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1]);
const TriangleIndices = new Uint16Array([0, 1, 2, 0]);

/** Appends extra binary data after the base triangle data and registers a view and accessor for each entry. */
function appendAccessors(gltf: GltfJson, entries: { data: ArrayBufferView; accessor: GltfJson }[]): void {
    const base = [TrianglePositions, TriangleNormals, TriangleIndices];
    let offset = 80;
    for (const { data, accessor } of entries) {
        gltf.bufferViews.push({ buffer: 0, byteOffset: offset, byteLength: data.byteLength });
        gltf.accessors.push({ bufferView: gltf.bufferViews.length - 1, ...accessor });
        offset += data.byteLength;
    }
    gltf.buffers[0].uri = ToDataUri(...base, ...entries.map((e) => e.data));
    gltf.buffers[0].byteLength = offset;
}

describe("glTF Exporter - skins and morph targets", () => {
    let testScene: ReturnType<typeof CreateTestScene>;

    beforeEach(() => {
        testScene = CreateTestScene();
    });

    afterEach(() => {
        testScene.dispose();
    });

    it("round trips a skin with its joints, inverse bind matrices and vertex influences", async () => {
        const source = CreateTriangleGltf();
        const joints = new Uint8Array([0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0]);
        const weights = new Float32Array([1, 0, 0, 0, 0.5, 0.5, 0, 0, 1, 0, 0, 0]);
        const inverseBindMatrices = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, -1, 0, 1]);
        appendAccessors(source, [
            { data: joints, accessor: { componentType: 5121, count: 3, type: "VEC4" } },
            { data: weights, accessor: { componentType: 5126, count: 3, type: "VEC4" } },
            { data: inverseBindMatrices, accessor: { componentType: 5126, count: 2, type: "MAT4" } },
        ]);
        source.meshes[0].primitives[0].attributes.JOINTS_0 = 3;
        source.meshes[0].primitives[0].attributes.WEIGHTS_0 = 4;
        source.nodes = [
            { name: "skinned", mesh: 0, skin: 0 },
            { name: "root", children: [2] },
            { name: "tip", translation: [0, 1, 0] },
        ];
        source.scenes[0].nodes = [0, 1];
        source.skins = [{ name: "skin", joints: [1, 2], inverseBindMatrices: 5 }];

        const gltf = await RoundTripGltfAsync(testScene.scene, source);

        expect(gltf.skins).toHaveLength(1);
        const skin = gltf.skins[0];
        expect(skin.joints.map((i: number) => gltf.nodes[i].name)).toEqual(["root", "tip"]);
        expect(gltf.accessors[skin.inverseBindMatrices]).toMatchObject({ count: 2, type: "MAT4", componentType: 5126 });
        // https://github.com/BabylonJS/Babylon.js/pull/11168: only vertex attribute buffer views may define a byteStride
        expect(gltf.bufferViews[gltf.accessors[skin.inverseBindMatrices].bufferView].byteStride).toBeUndefined();
        const skinnedNode = gltf.nodes.find((n: GltfJson) => n.skin !== undefined);
        expect(skinnedNode.skin).toBe(0);
        const attributes = gltf.meshes[skinnedNode.mesh].primitives[0].attributes;
        expect(gltf.accessors[attributes.JOINTS_0]).toMatchObject({ count: 3, type: "VEC4" });
        expect(gltf.accessors[attributes.WEIGHTS_0]).toMatchObject({ count: 3, type: "VEC4" });
    });

    it("round trips morph targets with their default weights and names", async () => {
        const source = CreateTriangleGltf();
        appendAccessors(source, [
            { data: new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1]), accessor: { componentType: 5126, count: 3, type: "VEC3", min: [0, 0, 1], max: [0, 0, 1] } },
            { data: new Float32Array([0, 1, 0, 0, 1, 0, 0, 1, 0]), accessor: { componentType: 5126, count: 3, type: "VEC3", min: [0, 1, 0], max: [0, 1, 0] } },
        ]);
        source.meshes[0].primitives[0].targets = [{ POSITION: 3 }, { POSITION: 4 }];
        source.meshes[0].weights = [0.25, 0.75];
        source.meshes[0].extras = { targetNames: ["forward", "up"] };

        const gltf = await RoundTripGltfAsync(testScene.scene, source);

        const mesh = gltf.meshes[0];
        expect(mesh.primitives[0].targets).toHaveLength(2);
        expect(mesh.weights).toEqual([0.25, 0.75]);
        expect(mesh.extras.targetNames).toEqual(["forward", "up"]);
        expect(gltf.accessors[mesh.primitives[0].targets[0].POSITION]).toMatchObject({ count: 3, type: "VEC3" });
    });
});
