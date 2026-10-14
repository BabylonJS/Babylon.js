import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { Vector3 } from "core/Maths/math.vector";
import { TransformNode } from "core/Meshes/transformNode";
import { CreateBox } from "core/Meshes/Builders/boxBuilder";
import { Mesh } from "core/Meshes/mesh";
import { SubMesh } from "core/Meshes/subMesh";
import { PBRMaterial } from "core/Materials/PBR/pbrMaterial";
import { MultiMaterial } from "core/Materials/multiMaterial";
import { type IAccessor, type ICamera } from "babylonjs-gltf2interface";
import { GLTF2Export } from "serializers/glTF/2.0";
import {
    CreateTestScene,
    CreateTriangleGltf,
    ExportGltfAsync,
    ExportGltfWithBinaryAsync,
    GetBlobFile,
    GetTextFile,
    ImportGltfAsync,
    ParseGltfJson,
    ReadAccessor,
    RoundTripGltfAsync,
    RoundTripGltfWithBinaryAsync,
    ToDataUri,
} from "./glTFTestUtils";

describe("glTF exporter", () => {
    let testScene: ReturnType<typeof CreateTestScene>;

    beforeEach(() => {
        testScene = CreateTestScene();
    });

    afterEach(() => {
        testScene.dispose();
    });

    describe("output containers", () => {
        it("writes a .gltf file that references a separate .bin file", async () => {
            CreateBox("box", {}, testScene.scene);

            const data = await GLTF2Export.GLTFAsync(testScene.scene, "model.gltf", { exportWithoutWaitingForScene: true });
            const gltf = ParseGltfJson(GetTextFile(data.files["model.gltf"]));

            expect(gltf.asset.version).toBe("2.0");
            expect(gltf.buffers).toHaveLength(1);
            expect(gltf.buffers[0].uri).toBe("model.bin");
            expect(GetBlobFile(data.files["model.bin"]).size).toBe(gltf.buffers[0].byteLength);
        });

        it("writes a binary glTF with a JSON chunk followed by a BIN chunk", async () => {
            CreateBox("box", {}, testScene.scene);

            const data = await GLTF2Export.GLBAsync(testScene.scene, "model", { exportWithoutWaitingForScene: true });
            expect(Object.keys(data.files)).toEqual(["model.glb"]);

            const glb = new DataView(await GetBlobFile(data.files["model.glb"]).arrayBuffer());
            expect(glb.getUint32(0, true)).toBe(0x46546c67); // "glTF"
            expect(glb.getUint32(4, true)).toBe(2);
            expect(glb.getUint32(8, true)).toBe(glb.byteLength);

            const jsonLength = glb.getUint32(12, true);
            expect(glb.getUint32(16, true)).toBe(0x4e4f534a); // "JSON"
            expect(jsonLength % 4).toBe(0);

            const binHeader = 20 + jsonLength;
            const binLength = glb.getUint32(binHeader, true);
            expect(glb.getUint32(binHeader + 4, true)).toBe(0x004e4942); // "BIN\0"
            expect(binLength % 4).toBe(0);
            expect(binHeader + 8 + binLength).toBe(glb.byteLength);

            const gltf = ParseGltfJson(new TextDecoder().decode(new Uint8Array(glb.buffer, 20, jsonLength)));
            expect(gltf.buffers[0].uri).toBeUndefined();
            expect(gltf.buffers[0].byteLength).toBeLessThanOrEqual(binLength);
        });
    });

    describe("scene graph", () => {
        it("preserves node hierarchy, names and transforms of an imported asset", async () => {
            const source = CreateTriangleGltf();
            source.nodes = [
                { name: "parent", translation: [1, 2, 3], rotation: [0, 0.38268343, 0, 0.92387953], scale: [2, 2, 2], children: [1, 2] },
                { name: "child", mesh: 0, translation: [0, 1, 0] },
                { name: "empty", scale: [1, 3, 1] },
            ];

            const gltf = await RoundTripGltfAsync(testScene.scene, source);

            const parent = gltf.nodes.find((n) => n.name === "parent");
            const child = gltf.nodes.find((n) => n.name === "child");
            const empty = gltf.nodes.find((n) => n.name === "empty");
            if (!parent || !child || !empty || !parent.children) {
                throw new Error("Expected the exported node hierarchy");
            }
            expect(gltf.scenes[0].nodes).toEqual([gltf.nodes.indexOf(parent)]);
            expect(parent.children.map((i) => gltf.nodes[i].name).sort()).toEqual(["child", "empty"]);
            expect(parent.translation).toEqual([1, 2, 3]);
            expect(parent.scale).toEqual([2, 2, 2]);
            if (!parent.rotation) {
                throw new Error("Expected the parent rotation");
            }
            expect(parent.rotation[1]).toBeCloseTo(0.38268343);
            expect(parent.rotation[3]).toBeCloseTo(0.92387953);
            expect(child.translation).toEqual([0, 1, 0]);
            expect(empty.scale).toEqual([1, 3, 1]);
            expect(child.mesh).toBe(0);
        });

        it("exports only the nodes accepted by shouldExportNode", async () => {
            const kept = new TransformNode("kept", testScene.scene);
            const skipped = new TransformNode("skipped", testScene.scene);
            skipped.position = new Vector3(1, 0, 0);

            const gltf = await ExportGltfAsync(testScene.scene, { shouldExportNode: (node) => node !== skipped });

            expect(gltf.nodes.map((n) => n.name)).toEqual([kept.name]);
        });
    });

    describe("meshes", () => {
        it("round trips vertex data and mode of a primitive", async () => {
            const source = CreateTriangleGltf();
            const sourceUvs = new Float32Array([0, 0, 1, 0, 0, 1]);
            const sourceColors = new Float32Array([1, 0, 0, 1, 0, 1, 0, 1, 0, 0, 1, 1]);
            source.buffers[0].uri = ToDataUri(
                new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]),
                new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1]),
                new Uint16Array([0, 1, 2, 0]),
                sourceUvs,
                sourceColors
            );
            source.buffers[0].byteLength = 80 + sourceUvs.byteLength + sourceColors.byteLength;
            source.bufferViews.push({ buffer: 0, byteOffset: 80, byteLength: 24 }, { buffer: 0, byteOffset: 104, byteLength: 48 });
            source.accessors.push(
                { bufferView: 3, componentType: 5126, count: 3, type: "VEC2" as IAccessor["type"] },
                { bufferView: 4, componentType: 5126, count: 3, type: "VEC4" as IAccessor["type"] }
            );
            source.meshes[0].primitives[0].attributes.TEXCOORD_0 = 3;
            source.meshes[0].primitives[0].attributes.COLOR_0 = 4;

            const { gltf, bin } = await RoundTripGltfWithBinaryAsync(testScene.scene, source, { exportUnusedUVs: true });

            const primitive = gltf.meshes[0].primitives[0];
            expect(primitive.mode ?? 4).toBe(4);
            expect(Object.keys(primitive.attributes).sort()).toEqual(["COLOR_0", "NORMAL", "POSITION", "TEXCOORD_0"]);
            const position = gltf.accessors[primitive.attributes.POSITION];
            expect(position).toMatchObject({ componentType: 5126, count: 3, type: "VEC3", min: [0, 0, 0], max: [1, 1, 0] });
            const positions = ReadAccessor(gltf, bin, primitive.attributes.POSITION);
            const uvs = ReadAccessor(gltf, bin, primitive.attributes.TEXCOORD_0);
            const colors = ReadAccessor(gltf, bin, primitive.attributes.COLOR_0);
            const indices = primitive.indices === undefined ? [0, 1, 2] : ReadAccessor(gltf, bin, primitive.indices);
            const corners = indices
                .map((index) => positions.slice(index * 3, index * 3 + 3))
                .map((position) => position.join(","))
                .sort();
            expect(corners).toEqual(["0,0,0", "0,1,0", "1,0,0"]);

            const rows = positions.reduce<number[][]>((result, _, index) => {
                if (index % 3 === 0) {
                    const vertex = index / 3;
                    result.push([...positions.slice(index, index + 3), ...uvs.slice(vertex * 2, vertex * 2 + 2), ...colors.slice(vertex * 4, vertex * 4 + 4)]);
                }
                return result;
            }, []);
            const expectedRows = [
                [0, 0, 0, 0, 0, 1, 0, 0, 1],
                [1, 0, 0, 1, 0, 0, 1, 0, 1],
                [0, 1, 0, 0, 1, 0, 0, 1, 1],
            ];
            const byPosition = (left: number[], right: number[]) => left.slice(0, 3).join(",").localeCompare(right.slice(0, 3).join(","));
            expect(rows.sort(byPosition)).toEqual(expectedRows.sort(byPosition));
        });

        it("omits texture coordinates that no texture uses unless exportUnusedUVs is set", async () => {
            const box = CreateBox("box", {}, testScene.scene);
            expect(box.isVerticesDataPresent("uv")).toBe(true);

            const defaultExport = await ExportGltfAsync(testScene.scene);
            const withUVs = await ExportGltfAsync(testScene.scene, { exportUnusedUVs: true });

            expect(defaultExport.meshes[0].primitives[0].attributes.TEXCOORD_0).toBeUndefined();
            expect(withUVs.meshes[0].primitives[0].attributes.TEXCOORD_0).toBeDefined();
        });
    });

    // https://github.com/BabylonJS/Babylon.js/pull/4590
    it("exports unit-length normals", async () => {
        const source = CreateTriangleGltf();
        source.buffers[0].uri = ToDataUri(new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]), new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1]), new Uint16Array([0, 1, 2, 0]));
        const { scene } = testScene;
        await ImportGltfAsync(scene, source);
        const mesh = scene.meshes.find((m) => m.getTotalVertices() > 0)!;
        mesh.setVerticesData("normal", [0, 0, 5, 0, 0, 5, 0, 0, 5], true);

        const { gltf, bin } = await ExportGltfWithBinaryAsync(scene);

        const normals = ReadAccessor(gltf, bin, gltf.meshes[0].primitives[0].attributes.NORMAL);
        for (let i = 0; i < normals.length; i += 3) {
            expect(Math.hypot(normals[i], normals[i + 1], normals[i + 2])).toBeCloseTo(1);
        }
    });

    describe("multi-material meshes", () => {
        // https://forum.babylonjs.com/t/multi-materials-cause-strange-glb-export-artifacts/60558 (fixed by https://github.com/BabylonJS/Babylon.js/pull/17241)
        // https://forum.babylonjs.com/t/exporting-to-gltf-in-new-version-causing-an-error-on-importing-from-blender/62030 (fixed by https://github.com/BabylonJS/Babylon.js/pull/17662)
        it("preserves geometry and material for sub meshes with offset vertex and index ranges", async () => {
            const { scene } = testScene;
            const mesh = new Mesh("mesh", scene);
            const sourcePositions = [0, 0, 0, 1, 0, 0, 0, 1, 0, 2, 0, 0, 3, 0, 0, 2, 1, 0];
            mesh.setVerticesData("position", sourcePositions);
            mesh.setIndices([0, 1, 2, 3, 4, 5]);
            mesh.subMeshes = [];
            const multiMaterial = new MultiMaterial("multi", scene);
            multiMaterial.subMaterials.push(new PBRMaterial("a", scene), new PBRMaterial("b", scene));
            mesh.material = multiMaterial;
            new SubMesh(0, 0, 3, 0, 3, mesh);
            new SubMesh(1, 3, 3, 3, 3, mesh);

            const { gltf, bin } = await ExportGltfWithBinaryAsync(scene);

            const primitives = gltf.meshes[0].primitives;
            expect(primitives).toHaveLength(2);
            const actual = primitives.map((primitive) => {
                const positions = ReadAccessor(gltf, bin, primitive.attributes.POSITION);
                const indices = primitive.indices === undefined ? Array.from({ length: positions.length / 3 }, (_, index) => index) : ReadAccessor(gltf, bin, primitive.indices);
                const corners = indices.map((index) => positions.slice(index * 3, index * 3 + 3).join(",")).sort();
                const material = primitive.material === undefined ? undefined : gltf.materials[primitive.material];
                if (!material) {
                    throw new Error("Expected a material for every exported sub mesh");
                }
                return { material: material.name, corners };
            });
            expect(actual).toEqual([
                { material: "a", corners: ["0,0,0", "0,1,0", "-1,0,0"].sort() },
                { material: "b", corners: ["-2,0,0", "-2,1,0", "-3,0,0"].sort() },
            ]);
        });
    });

    describe("cameras", () => {
        it("round trips perspective and orthographic cameras", async () => {
            const source = CreateTriangleGltf();
            source.nodes[0].children = [1, 2];
            source.nodes.push({ name: "persp", camera: 0 }, { name: "ortho", camera: 1 });
            source.cameras = [
                { name: "persp", type: "perspective" as ICamera["type"], perspective: { yfov: 0.8, znear: 0.1, zfar: 50 } },
                { name: "ortho", type: "orthographic" as ICamera["type"], orthographic: { xmag: 4, ymag: 2, znear: 0.5, zfar: 20 } },
            ];

            const gltf = await RoundTripGltfAsync(testScene.scene, source);

            const cameras = gltf.cameras;
            if (!cameras) {
                throw new Error("Expected exported cameras");
            }
            const persp = cameras.find((c) => c.type === "perspective");
            const ortho = cameras.find((c) => c.type === "orthographic");
            if (!persp || !ortho || persp.type !== "perspective" || ortho.type !== "orthographic" || !persp.perspective || !ortho.orthographic) {
                throw new Error("Expected perspective and orthographic cameras");
            }
            expect(persp.perspective.yfov).toBeCloseTo(0.8);
            expect(persp.perspective.znear).toBeCloseTo(0.1);
            expect(persp.perspective.zfar).toBeCloseTo(50);
            expect(ortho.orthographic).toMatchObject({ znear: 0.5, zfar: 20 });
            expect(ortho.orthographic.xmag / ortho.orthographic.ymag).toBeCloseTo(2);
        });
    });
});
