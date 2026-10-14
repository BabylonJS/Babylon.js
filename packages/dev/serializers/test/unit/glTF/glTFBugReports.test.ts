import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { PBRMaterial } from "core/Materials/PBR/pbrMaterial";
import { CreateBox } from "core/Meshes/Builders/boxBuilder";
import { CreateSphere } from "core/Meshes/Builders/sphereBuilder";
import { Mesh } from "core/Meshes/mesh";
import { TransformNode } from "core/Meshes/transformNode";
import { Quaternion } from "core/Maths/math.vector";
import { GLTF2Export } from "serializers/glTF/2.0";
import { CreateTestScene, ExportGltfAsync, ExportGltfWithBinaryAsync, GetBlobFile, ParseGltfJson, ReadAccessor, type GltfJson } from "./glTFTestUtils";

async function ExportGlbJsonAsync(scene: ReturnType<typeof CreateTestScene>["scene"]): Promise<GltfJson> {
    const data = await GLTF2Export.GLBAsync(scene, "test", { exportWithoutWaitingForScene: true });
    const buffer = await GetBlobFile(data.files["test.glb"]).arrayBuffer();
    const view = new DataView(buffer);
    const jsonLength = view.getUint32(12, true);
    return ParseGltfJson(new TextDecoder().decode(new Uint8Array(buffer, 20, jsonLength)));
}

describe("glTF Exporter - bug report regressions", () => {
    let testScene: ReturnType<typeof CreateTestScene>;

    beforeEach(() => {
        testScene = CreateTestScene();
    });

    afterEach(() => {
        testScene.dispose();
    });

    // https://github.com/BabylonJS/Babylon.js/issues/7152 and https://github.com/BabylonJS/Babylon.js/pull/4726
    it("exports childless nodes without empty children arrays", async () => {
        new TransformNode("spawnPoint", testScene.scene);

        const gltf = await ExportGltfAsync(testScene.scene);

        expect(gltf.nodes).toEqual([{ name: "spawnPoint" }]);
    });

    // https://github.com/BabylonJS/Babylon.js/issues/10009 (fixed by https://github.com/BabylonJS/Babylon.js/pull/11386)
    it("omits materials used only by excluded meshes", async () => {
        const kept = CreateBox("kept", {}, testScene.scene);
        kept.material = new PBRMaterial("keptMaterial", testScene.scene);
        const excluded = CreateBox("excluded", {}, testScene.scene);
        excluded.material = new PBRMaterial("excludedMaterial", testScene.scene);

        const gltf = await ExportGltfAsync(testScene.scene, { shouldExportNode: (node) => node !== excluded });

        expect(gltf.materials.map((material) => material.name)).toEqual(["keptMaterial"]);
    });

    // https://forum.babylonjs.com/t/scene-exporter-is-not-working-correctly/28591 (fixed by https://github.com/BabylonJS/Babylon.js/pull/12694)
    it("omits materials assigned only to meshes without geometry", async () => {
        const empty = new Mesh("empty", testScene.scene);
        empty.material = new PBRMaterial("unusedMaterial", testScene.scene);
        const box = CreateBox("box", {}, testScene.scene);
        box.material = new PBRMaterial("usedMaterial", testScene.scene);

        const gltf = await ExportGltfAsync(testScene.scene);

        expect(gltf.materials.map((material) => material.name)).toEqual(["usedMaterial"]);
    });

    // https://forum.babylonjs.com/t/newbye-question/28514 (fixed by https://github.com/BabylonJS/Babylon.js/pull/12230)
    it("assigns the scene default material when a mesh has no material", async () => {
        CreateBox("box", {}, testScene.scene);

        const gltf = await ExportGltfAsync(testScene.scene);
        const primitive = gltf.meshes[0].primitives[0];
        if (primitive.material === undefined) {
            throw new Error("Expected the default material to be assigned");
        }

        expect(gltf.materials).toHaveLength(1);
        expect(gltf.materials[primitive.material].name).toBe(testScene.scene.defaultMaterial.name);
    });

    // https://github.com/BabylonJS/Babylon.js/issues/10672 (fixed by https://github.com/BabylonJS/Babylon.js/pull/10675)
    it("writes non-BMP node names to valid GLB JSON", async () => {
        new TransformNode("smile 😀", testScene.scene);

        const gltf = await ExportGlbJsonAsync(testScene.scene);

        expect(gltf.nodes[0].name).toBe("smile 😀");
    });

    // https://forum.babylonjs.com/t/unexpected-mesh-transformations-on-glb-export/59440 (fixed by https://github.com/BabylonJS/Babylon.js/pull/16858)
    it("does not mutate source rotation quaternions while converting handedness", async () => {
        const node = new TransformNode("rotated", testScene.scene);
        node.rotationQuaternion = Quaternion.RotationYawPitchRoll(0.3, 0.4, 0.5);
        const original = node.rotationQuaternion.clone();

        await ExportGltfAsync(testScene.scene);

        expect(node.rotationQuaternion.asArray()).toEqual(original.asArray());
    });

    // https://forum.babylonjs.com/t/mesh-updatefacetdata-breaks-smooth-shading-after-gltf-glb-export-faceted-look-on-rounded-meshes/61944 (fixed by https://github.com/BabylonJS/Babylon.js/pull/17593)
    it("preserves smooth normals after updateFacetData", async () => {
        const sphere = CreateSphere("sphere", { segments: 8 }, testScene.scene);
        const before = await ExportGltfWithBinaryAsync(testScene.scene);
        const beforePrimitive = before.gltf.meshes[0].primitives[0];
        const beforeNormals = ReadAccessor(before.gltf, before.bin, beforePrimitive.attributes.NORMAL);

        sphere.updateFacetData();

        const after = await ExportGltfWithBinaryAsync(testScene.scene);
        const afterPrimitive = after.gltf.meshes[0].primitives[0];
        const afterNormals = ReadAccessor(after.gltf, after.bin, afterPrimitive.attributes.NORMAL);
        expect(afterNormals).toHaveLength(beforeNormals.length);
        afterNormals.forEach((value, index) => expect(value).toBeCloseTo(beforeNormals[index], 5));
    });
});
