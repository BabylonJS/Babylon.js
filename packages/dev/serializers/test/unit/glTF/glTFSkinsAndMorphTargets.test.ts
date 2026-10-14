import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { Bone } from "core/Bones/bone";
import { Skeleton } from "core/Bones/skeleton";
import { VertexBuffer } from "core/Buffers/buffer";
import { Mesh } from "core/Meshes/mesh";
import { SubMesh } from "core/Meshes/subMesh";
import { TransformNode } from "core/Meshes/transformNode";
import { MorphTarget } from "core/Morph/morphTarget";
import { MorphTargetManager } from "core/Morph/morphTargetManager";
import { MultiMaterial } from "core/Materials/multiMaterial";
import { PBRMaterial } from "core/Materials/PBR/pbrMaterial";
import { Matrix } from "core/Maths/math.vector";
import { CreateTestScene, CreateTriangleGltf, ExportGltfWithBinaryAsync, ReadAccessor, RoundTripGltfWithBinaryAsync, ToDataUri, type GltfJson } from "./glTFTestUtils";
import { type IAccessor } from "babylonjs-gltf2interface";

const TrianglePositions = new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]);
const TriangleNormals = new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1]);
const TriangleIndices = new Uint16Array([0, 1, 2, 0]);

/** Appends extra binary data after the base triangle data and registers a view and accessor for each entry. */
function appendAccessors(gltf: GltfJson, entries: { data: ArrayBufferView; accessor: IAccessor }[]): void {
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

function expectValuesClose(actual: number[], expected: number[]): void {
    expect(actual).toHaveLength(expected.length);
    actual.forEach((value, index) => expect(value).toBeCloseTo(expected[index], 5));
}

function createSkinnedTriangle(scene: ReturnType<typeof CreateTestScene>["scene"]): {
    mesh: Mesh;
    rootNode: TransformNode;
    childNode: TransformNode;
} {
    const mesh = new Mesh("skinned", scene);
    mesh.setVerticesData(VertexBuffer.PositionKind, TrianglePositions);
    mesh.setVerticesData(VertexBuffer.NormalKind, TriangleNormals);
    mesh.setVerticesData(VertexBuffer.MatricesIndicesKind, [0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0], false, 4);
    mesh.setVerticesData(VertexBuffer.MatricesWeightsKind, new Float32Array([1, 0, 0, 0, 0.5, 0.5, 0, 0, 1, 0, 0, 0]), false, 4);
    mesh.setIndices([0, 1, 2]);

    const skeleton = new Skeleton("skeleton", "skeleton", scene);
    const rootBone = new Bone("root", skeleton, null, Matrix.Identity(), null, Matrix.Identity(), 1);
    const childBone = new Bone("child", skeleton, rootBone, Matrix.Translation(0, 1, 0), null, Matrix.Translation(0, 1, 0), 0);
    const rootNode = new TransformNode("root", scene);
    const childNode = new TransformNode("child", scene);
    childNode.parent = rootNode;
    rootBone.linkTransformNode(rootNode);
    childBone.linkTransformNode(childNode);
    mesh.skeleton = skeleton;

    return { mesh, rootNode, childNode };
}

describe("glTF Exporter - skins and morph targets", () => {
    let testScene: ReturnType<typeof CreateTestScene>;

    beforeEach(() => {
        testScene = CreateTestScene();
    });

    afterEach(() => {
        testScene.dispose();
    });

    // https://forum.babylonjs.com/t/glbexporter-exports-bones-facing-opposite-direction-to-mesh/35330 (fixed by https://github.com/BabylonJS/Babylon.js/pull/13214)
    // https://github.com/BabylonJS/Babylon.js/pull/16888
    it.each([false, true])("round trips a parented skin with useRightHandedSystem=%s", async (useRightHandedSystem) => {
        testScene.scene.useRightHandedSystem = useRightHandedSystem;
        const source = CreateTriangleGltf();
        const joints = new Uint8Array([0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0]);
        const weights = new Float32Array([1, 0, 0, 0, 0.5, 0.5, 0, 0, 1, 0, 0, 0]);
        const inverseBindMatrices = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, -1, 0, 1]);
        appendAccessors(source, [
            { data: joints, accessor: { componentType: 5121, count: 3, type: "VEC4" as IAccessor["type"] } },
            { data: weights, accessor: { componentType: 5126, count: 3, type: "VEC4" as IAccessor["type"] } },
            { data: inverseBindMatrices, accessor: { componentType: 5126, count: 2, type: "MAT4" as IAccessor["type"] } },
        ]);
        source.meshes[0].primitives[0].attributes.JOINTS_0 = 3;
        source.meshes[0].primitives[0].attributes.WEIGHTS_0 = 4;
        source.nodes = [
            { name: "parent", translation: [1, 2, 3], children: [1] },
            { name: "skinned", mesh: 0, skin: 0 },
            { name: "root", children: [3] },
            { name: "tip", translation: [0, 1, 0] },
        ];
        source.scenes[0].nodes = [0, 2];
        source.skins = [{ name: "skin", joints: [2, 3], inverseBindMatrices: 5 }];

        const { gltf, bin } = await RoundTripGltfWithBinaryAsync(testScene.scene, source);

        const skins = gltf.skins;
        if (!skins || skins.length !== 1) {
            throw new Error("Expected one exported skin");
        }
        const skin = skins[0];
        if (!skin) {
            throw new Error("Expected an exported skin");
        }
        expect(skin.joints.map((i) => gltf.nodes[i].name)).toEqual(["root", "tip"]);
        if (skin.inverseBindMatrices === undefined) {
            throw new Error("Expected inverse bind matrices");
        }
        expect(gltf.accessors[skin.inverseBindMatrices]).toMatchObject({ count: 2, type: "MAT4", componentType: 5126 });
        // https://github.com/BabylonJS/Babylon.js/pull/11168: only vertex attribute buffer views may define a byteStride
        const inverseBindMatrixBufferView = gltf.accessors[skin.inverseBindMatrices].bufferView;
        if (inverseBindMatrixBufferView === undefined) {
            throw new Error("Expected an inverse bind matrix buffer view");
        }
        expect(gltf.bufferViews[inverseBindMatrixBufferView].byteStride).toBeUndefined();
        expectValuesClose(ReadAccessor(gltf, bin, skin.inverseBindMatrices), [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, -1, 0, 1]);
        const skinnedNode = gltf.nodes.find((n) => n.skin !== undefined);
        const parent = gltf.nodes.find((n) => n.name === "parent");
        if (!skinnedNode || !parent || !parent.children || skinnedNode.mesh === undefined) {
            throw new Error("Expected the parented skinned mesh");
        }
        expect(parent.translation).toEqual([1, 2, 3]);
        expect(parent.children.map((i) => gltf.nodes[i].name)).toEqual(["skinned"]);
        expect(skinnedNode.skin).toBe(0);
        const attributes = gltf.meshes[skinnedNode.mesh].primitives[0].attributes;
        expect(gltf.accessors[attributes.JOINTS_0]).toMatchObject({ count: 3, type: "VEC4" });
        expect(gltf.accessors[attributes.WEIGHTS_0]).toMatchObject({ count: 3, type: "VEC4" });
        expect(ReadAccessor(gltf, bin, attributes.JOINTS_0)).toEqual(Array.from(joints));
        expectValuesClose(ReadAccessor(gltf, bin, attributes.WEIGHTS_0), Array.from(weights));
    });

    // https://forum.babylonjs.com/t/gltf-export-bug-skinning-has-errors/13744 (fixed by https://github.com/BabylonJS/Babylon.js/pull/8847)
    it("orders skin joints by their shader indices", async () => {
        createSkinnedTriangle(testScene.scene);

        const { gltf, bin } = await ExportGltfWithBinaryAsync(testScene.scene);
        const skin = gltf.skins?.[0];
        if (!skin) {
            throw new Error("Expected an exported skin");
        }
        const meshNode = gltf.nodes.find((node) => node.skin !== undefined);
        if (!meshNode || meshNode.mesh === undefined) {
            throw new Error("Expected a skinned mesh node");
        }
        const jointsAccessor = gltf.meshes[meshNode.mesh].primitives[0].attributes.JOINTS_0;

        expect(skin.joints.map((index) => gltf.nodes[index].name)).toEqual(["child", "root"]);
        expect(ReadAccessor(gltf, bin, jointsAccessor)).toEqual([0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0]);
    });

    // https://forum.babylonjs.com/t/how-to-exclude-all-disabled-nodes-from-export/38780 (fixed by https://github.com/BabylonJS/Babylon.js/pull/13604)
    it("does not export skins whose linked bone nodes are excluded", async () => {
        const { rootNode, childNode } = createSkinnedTriangle(testScene.scene);

        const { gltf } = await ExportGltfWithBinaryAsync(testScene.scene, {
            shouldExportNode: (node) => node !== rootNode && node !== childNode,
        });

        expect(gltf.skins).toBeUndefined();
        expect(gltf.nodes.find((node) => node.name === "skinned")?.skin).toBeUndefined();
    });

    // https://forum.babylonjs.com/t/gltf-export-bug-faulty-export-if-skeleton-bones-length-0/30003 (fixed by https://github.com/BabylonJS/Babylon.js/pull/12489)
    it("does not export empty skins", async () => {
        const skeleton = new Skeleton("empty", "empty", testScene.scene);
        const mesh = new Mesh("mesh", testScene.scene);
        mesh.setVerticesData(VertexBuffer.PositionKind, TrianglePositions);
        mesh.setIndices([0, 1, 2]);
        mesh.skeleton = skeleton;

        const { gltf } = await ExportGltfWithBinaryAsync(testScene.scene);

        expect(gltf.skins).toBeUndefined();
    });

    it("round trips morph targets with their default weights and names", async () => {
        const source = CreateTriangleGltf();
        appendAccessors(source, [
            { data: new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1]), accessor: { componentType: 5126, count: 3, type: "VEC3" as IAccessor["type"], min: [0, 0, 1], max: [0, 0, 1] } },
            { data: new Float32Array([0, 1, 0, 0, 1, 0, 0, 1, 0]), accessor: { componentType: 5126, count: 3, type: "VEC3" as IAccessor["type"], min: [0, 1, 0], max: [0, 1, 0] } },
        ]);
        source.meshes[0].primitives[0].targets = [{ POSITION: 3 }, { POSITION: 4 }];
        source.meshes[0].weights = [0.25, 0.75];
        source.meshes[0].extras = { targetNames: ["forward", "up"] };

        const { gltf, bin } = await RoundTripGltfWithBinaryAsync(testScene.scene, source);

        const mesh = gltf.meshes[0];
        const targets = mesh.primitives[0].targets;
        if (!targets || targets[0].POSITION === undefined || targets[1].POSITION === undefined) {
            throw new Error("Expected position morph target data");
        }
        expect(targets).toHaveLength(2);
        expect(mesh.weights).toEqual([0.25, 0.75]);
        expect(mesh.extras.targetNames).toEqual(["forward", "up"]);
        expect(gltf.accessors[targets[0].POSITION]).toMatchObject({ count: 3, type: "VEC3" });
        expect(ReadAccessor(gltf, bin, targets[0].POSITION)).toEqual([0, 0, 1, 0, 0, 1, 0, 0, 1]);
        expect(ReadAccessor(gltf, bin, targets[1].POSITION)).toEqual([0, 1, 0, 0, 1, 0, 0, 1, 0]);
    });

    // https://forum.babylonjs.com/t/gltfexporter-not-working-with-morph-targets/51337 (fixed by https://github.com/BabylonJS/Babylon.js/pull/15229)
    it("exports morph target deltas on each sub mesh primitive", async () => {
        const { scene } = testScene;
        const mesh = new Mesh("morphed", scene);
        const positions = new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0, 2, 0, 0, 3, 0, 0, 2, 1, 0]);
        mesh.setVerticesData("position", positions);
        mesh.setIndices([0, 1, 2, 3, 4, 5]);
        mesh.subMeshes = [];
        const materials = new MultiMaterial("multi", scene);
        materials.subMaterials.push(new PBRMaterial("first", scene), new PBRMaterial("second", scene));
        mesh.material = materials;
        new SubMesh(0, 0, 6, 0, 3, mesh);
        new SubMesh(1, 0, 6, 3, 3, mesh);

        const targets = new MorphTargetManager(scene);
        const firstTarget = new MorphTarget("up", 0.25, scene);
        firstTarget.setPositions(positions.map((value, index) => (index % 3 === 1 ? value + Math.floor(index / 3) * 0.25 + 0.5 : value)));
        const secondTarget = new MorphTarget("slight-up", 0.75, scene);
        secondTarget.setPositions(positions.map((value, index) => (index % 3 === 1 ? value + Math.floor(index / 3) * 0.25 + 0.25 : value)));
        targets.addTarget(firstTarget);
        targets.addTarget(secondTarget);
        mesh.morphTargetManager = targets;

        const { gltf, bin } = await ExportGltfWithBinaryAsync(scene);
        const primitives = gltf.meshes[0].primitives;
        expect(primitives).toHaveLength(2);
        for (const primitive of primitives) {
            expect(primitive.targets).toHaveLength(2);
            const [first, second] = primitive.targets!;
            if (first.POSITION === undefined || second.POSITION === undefined) {
                throw new Error("Expected exported position morph targets");
            }
            expect(gltf.accessors[first.POSITION].count).toBe(gltf.accessors[primitive.attributes.POSITION].count);
            expect(gltf.accessors[second.POSITION].count).toBe(gltf.accessors[primitive.attributes.POSITION].count);
            expectValuesClose(ReadAccessor(gltf, bin, first.POSITION), [0, 0.5, 0, 0, 0.75, 0, 0, 1, 0, 0, 1.25, 0, 0, 1.5, 0, 0, 1.75, 0]);
            expectValuesClose(ReadAccessor(gltf, bin, second.POSITION), [0, 0.25, 0, 0, 0.5, 0, 0, 0.75, 0, 0, 1, 0, 0, 1.25, 0, 0, 1.5, 0]);
        }
    });
});
