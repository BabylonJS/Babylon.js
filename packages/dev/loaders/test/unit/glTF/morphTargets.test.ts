import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { NullEngine } from "core/Engines/nullEngine";
import { VertexBuffer } from "core/Buffers/buffer";
import { Scene } from "core/scene";
import { GLTFFileLoader, type IGLTFLoaderData } from "loaders/glTF/glTFFileLoader.pure";
import { AccessorType, type IGLTF } from "babylonjs-gltf2interface";
import "loaders/glTF/2.0/glTFLoader";

describe("glTF omitted morph target attributes", () => {
    let engine: NullEngine;
    let scene: Scene;

    beforeEach(() => {
        engine = new NullEngine();
        scene = new Scene(engine);
    });

    afterEach(() => {
        scene.dispose();
        engine.dispose();
    });

    const attributes = [
        { semantic: "POSITION", kind: VertexBuffer.PositionKind, size: 3, type: AccessorType.VEC3, getter: "getPositions" },
        { semantic: "NORMAL", kind: VertexBuffer.NormalKind, size: 3, type: AccessorType.VEC3, getter: "getNormals" },
        { semantic: "TANGENT", kind: VertexBuffer.TangentKind, size: 4, type: AccessorType.VEC3, getter: "getTangents" },
        { semantic: "TEXCOORD_0", kind: VertexBuffer.UVKind, size: 2, type: AccessorType.VEC2, getter: "getUVs" },
        { semantic: "TEXCOORD_1", kind: VertexBuffer.UV2Kind, size: 2, type: AccessorType.VEC2, getter: "getUV2s" },
        { semantic: "COLOR_0", kind: VertexBuffer.ColorKind, size: 3, type: AccessorType.VEC3, getter: "getColors" },
        { semantic: "COLOR_0", kind: VertexBuffer.ColorKind, size: 4, type: AccessorType.VEC4, getter: "getColors" },
    ] as const;

    it.each([
        ...attributes.flatMap((attribute) => [0, 1].map((omittedIndex) => ({ ...attribute, omittedIndex, positionOnly: false }))),
        { ...attributes[1], omittedIndex: 0, positionOnly: true },
    ])(
        "preserves $semantic ($size components) with target $omittedIndex omitted (position-only: $positionOnly)",
        async ({ semantic, kind, size, type, getter, omittedIndex, positionOnly }) => {
            const positions = [0, 0, 0, 1, 0, 0, 0, 1, 0];
            const base = Array.from({ length: 3 * size }, (_, index) => (index % size === size - 1 ? 1 : 0));
            const deltaSize = semantic === "TANGENT" ? 3 : size;
            const delta = Array.from({ length: 3 * deltaSize }, (_, index) => (index % deltaSize === 0 ? 0.25 : 0));
            const buffer = new Float32Array([...positions, ...base, ...delta]);
            const bytes = new Uint8Array(buffer.buffer);
            const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join("");
            const json: IGLTF = {
                asset: { version: "2.0" },
                scene: 0,
                scenes: [{ nodes: [0] }],
                nodes: [{ mesh: 0 }],
                meshes: [
                    {
                        primitives: [
                            {
                                attributes: { POSITION: 0, [semantic]: 1 },
                                targets: [{}, { [semantic]: 2 }],
                            },
                        ],
                        weights: [0.5, 0.5],
                    },
                ],
                accessors: [
                    { bufferView: 0, componentType: 5126, count: 3, type: AccessorType.VEC3, min: [0, 0, 0], max: [1, 1, 0] },
                    { bufferView: 1, componentType: 5126, count: 3, type: size === 4 ? AccessorType.VEC4 : type },
                    { bufferView: 2, componentType: 5126, count: 3, type },
                ],
                bufferViews: [
                    { buffer: 0, byteLength: positions.length * 4 },
                    { buffer: 0, byteOffset: positions.length * 4, byteLength: base.length * 4 },
                    { buffer: 0, byteOffset: (positions.length + base.length) * 4, byteLength: delta.length * 4 },
                ],
                buffers: [{ byteLength: bytes.length, uri: `data:application/octet-stream;base64,${btoa(binary)}` }],
            };
            if (omittedIndex === 1) {
                json.meshes![0].primitives[0].targets!.reverse();
            }
            if (positionOnly) {
                json.meshes![0].primitives[0].targets![omittedIndex] = { POSITION: json.accessors!.length };
                json.accessors!.push({ componentType: 5126, count: 3, type: AccessorType.VEC3 });
            }

            const loader = new GLTFFileLoader();
            const data = (await loader.directLoad(scene, JSON.stringify(json))) as IGLTFLoaderData;
            const result = await loader.importMeshAsync(null, scene, data, "");
            const mesh = result.meshes[1];
            const manager = mesh.morphTargetManager!;

            expect(manager.numTargets).toBe(2);
            expect(manager.getTarget(0).influence).toBe(0.5);
            expect(manager.getTarget(1).influence).toBe(0.5);

            const expectedBase = semantic === "COLOR_0" && size === 3 ? base.flatMap((value, index) => (index % 3 === 2 ? [value, 1] : [value])) : base;
            const expectedMorphed = expectedBase.map((value, index) => value + (index % (semantic === "COLOR_0" ? 4 : size) === 0 ? 0.25 : 0));
            const expectedTargetBase = semantic === "TANGENT" ? [...expectedBase.filter((_, index) => index % 4 !== 3), 0, 0, 0] : expectedBase;
            const expectedTargetMorphed = semantic === "TANGENT" ? [...expectedMorphed.filter((_, index) => index % 4 !== 3), 0, 0, 0] : expectedMorphed;
            expect(manager.getTarget(omittedIndex)[getter]()).not.toBeNull();
            expect(Array.from(manager.getTarget(omittedIndex)[getter]()!)).toEqual(expectedTargetBase);
            expect(Array.from(manager.getTarget(1 - omittedIndex)[getter]()!)).toEqual(expectedTargetMorphed);
            expect(manager.vertexCount).toBe(3);
            expect(Array.from(mesh.getVerticesData(kind)!)).toEqual(base);
            if (semantic !== "POSITION") {
                expect(manager.getTarget(omittedIndex).getPositions()).toEqual(new Float32Array(positions));
                expect(manager.getTarget(omittedIndex).hasNormals).toBe(semantic === "NORMAL");
            }

            const dummyAccessor = json.accessors!.length;
            json.accessors!.push({ componentType: 5126, count: 3, type });
            json.meshes![0].primitives[0].targets![omittedIndex] = { [semantic]: dummyAccessor };
            const dummyLoader = new GLTFFileLoader();
            const dummyData = (await dummyLoader.directLoad(scene, JSON.stringify(json))) as IGLTFLoaderData;
            const dummyResult = await dummyLoader.importMeshAsync(null, scene, dummyData, "");
            const dummyManager = dummyResult.meshes[1].morphTargetManager!;
            expect(manager.supportsPositions).toBe(dummyManager.supportsPositions);
            expect(manager.supportsNormals).toBe(dummyManager.supportsNormals);
            expect(manager.supportsTangents).toBe(dummyManager.supportsTangents);
            expect(manager.supportsUVs).toBe(dummyManager.supportsUVs);
            expect(manager.supportsUV2s).toBe(dummyManager.supportsUV2s);
            expect(manager.supportsColors).toBe(dummyManager.supportsColors);
        }
    );

    it("keeps all-empty targets as a no-op without adding unused attributes", async () => {
        const loader = new GLTFFileLoader();
        const data = (await loader.directLoad(
            scene,
            JSON.stringify({
                asset: { version: "2.0" },
                scene: 0,
                scenes: [{ nodes: [0] }],
                nodes: [{ mesh: 0 }],
                meshes: [{ primitives: [{ attributes: { POSITION: 0, NORMAL: 0 }, targets: [{}, {}] }], weights: [0.5, 0.5] }],
                accessors: [{ componentType: 5126, count: 3, type: "VEC3", min: [0, 0, 0], max: [0, 0, 0] }],
            })
        )) as IGLTFLoaderData;
        const result = await loader.importMeshAsync(null, scene, data, "");
        const manager = result.meshes[1].morphTargetManager!;
        expect(manager.numTargets).toBe(2);
        expect(manager.vertexCount).toBe(3);
        for (let index = 0; index < manager.numTargets; index++) {
            expect(manager.getTarget(index).getPositions()).toEqual(new Float32Array(9));
            expect(manager.getTarget(index).hasNormals).toBe(false);
        }
    });
});
