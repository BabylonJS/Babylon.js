import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createRequire } from "node:module";
import { NullEngine } from "core/Engines/nullEngine";
import { Scene } from "core/scene";
import { Geometry } from "core/Meshes/geometry";
import { VertexBuffer } from "core/Buffers/buffer.pure";
import { DracoDecoder } from "core/Meshes/Compression/dracoDecoder";
import { DracoEncoder } from "core/Meshes/Compression/dracoEncoder";
import { GLTFLoader } from "loaders/glTF/2.0/glTFLoader.pure";
import { registerGLTFExtension, unregisterGLTFExtension } from "loaders/glTF/2.0/glTFLoaderExtensionRegistry";
import { KHR_draco_mesh_compression } from "loaders/glTF/2.0/Extensions/KHR_draco_mesh_compression.pure";

describe("glTF 2.1 shapes", () => {
    let engine: NullEngine;
    let scene: Scene;

    beforeEach(() => {
        engine = new NullEngine();
        scene = new Scene(engine);
    });

    afterEach(() => {
        unregisterGLTFExtension("TEST_shape_geometry");
        unregisterGLTFExtension("KHR_draco_mesh_compression");
        vi.restoreAllMocks();
        scene.dispose();
        engine.dispose();
    });

    it("resolves implicit shape defaults and explicit parameters", async () => {
        const data = {
            json: {
                asset: { version: "2.1" },
                shapes: [
                    { type: "box" },
                    { type: "sphere", sphere: { radius: 3 } },
                    { type: "capsule", capsule: { radiusTop: 1 } },
                    { type: "cylinder" },
                    { type: "plane", plane: { sizeX: 2 } },
                ],
            },
            bin: null,
        };
        expect(await GLTFLoader.LoadShapeAsync(scene, data, "", 0)).toEqual({ type: "box", size: [1, 1, 1] });
        expect(await GLTFLoader.LoadShapeAsync(scene, data, "", 1)).toEqual({ type: "sphere", radius: 3 });
        expect(await GLTFLoader.LoadShapeAsync(scene, data, "", 2)).toEqual({ type: "capsule", height: 1, radiusTop: 1, radiusBottom: 0.5 });
        expect(await GLTFLoader.LoadShapeAsync(scene, data, "", 3)).toEqual({ type: "cylinder", height: 2, radiusTop: 0.5, radiusBottom: 0.5 });
        expect(await GLTFLoader.LoadShapeAsync(scene, data, "", 4)).toEqual({ type: "plane", sizeX: 2, sizeZ: undefined });
        expect(data.json.shapes[0]).toEqual({ type: "box" });
    });

    it("loads a mesh shape with its mesh weights and triangle strip winding", async () => {
        const values = new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 1, 0, 0, 0, 2, 0, 0, 2, 0, 0, 2, 0, 0, 2]);
        const bytes = new Uint8Array(values.buffer);
        const data = {
            json: {
                asset: { version: "2.1" },
                shapes: [{ type: "mesh", mesh: { mesh: 0 } }],
                meshes: [{ weights: [0.5], primitives: [{ mode: 5, attributes: { POSITION: 0 }, targets: [{ POSITION: 1 }] }] }],
                accessors: [
                    { bufferView: 0, componentType: 5126, count: 4, type: "VEC3", min: [0, 0, 0], max: [1, 1, 0] },
                    { bufferView: 1, componentType: 5126, count: 4, type: "VEC3", min: [0, 0, 2], max: [0, 0, 2] },
                ],
                bufferViews: [
                    { buffer: 0, byteLength: 48 },
                    { buffer: 0, byteOffset: 48, byteLength: 48 },
                ],
                buffers: [{ byteLength: bytes.byteLength }],
            },
            bin: { byteLength: bytes.byteLength, readAsync: async (offset: number, length: number) => bytes.subarray(offset, offset + length) },
        };
        const shape = await GLTFLoader.LoadShapeAsync(scene, data, "", 0);
        expect(shape.type).toBe("mesh");
        if (shape.type !== "mesh") {
            throw new Error("Expected a mesh shape");
        }
        expect(Array.from(shape.positions)).toEqual([0, 0, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1]);
        expect(Array.from(shape.indices)).toEqual([0, 1, 2, 2, 1, 3]);
        expect(scene.meshes).toHaveLength(0);
        expect(scene.geometries).toHaveLength(0);
        expect(data.json.accessors[0]).not.toHaveProperty("_data");
    });

    it("loads a shape from binary glTF and from a JSON data URI", async () => {
        const values = new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]);
        const bytes = new Uint8Array(values.buffer);
        const json = {
            asset: { version: "2.1" },
            shapes: [{ type: "mesh", mesh: { mesh: 0 } }],
            meshes: [{ primitives: [{ attributes: { POSITION: 0 } }] }],
            accessors: [{ bufferView: 0, componentType: 5126, count: 3, type: "VEC3" }],
            bufferViews: [{ buffer: 0, byteLength: bytes.length }],
            buffers: [{ byteLength: bytes.length }],
        };
        const encoded = new TextEncoder().encode(JSON.stringify(json));
        const jsonLength = Math.ceil(encoded.length / 4) * 4;
        const glb = new Uint8Array(12 + 8 + jsonLength + 8 + bytes.length);
        const view = new DataView(glb.buffer);
        view.setUint32(0, 0x46546c67, true);
        view.setUint32(4, 2, true);
        view.setUint32(8, glb.length, true);
        view.setUint32(12, jsonLength, true);
        view.setUint32(16, 0x4e4f534a, true);
        glb.fill(0x20, 20, 20 + jsonLength);
        glb.set(encoded, 20);
        view.setUint32(20 + jsonLength, bytes.length, true);
        view.setUint32(24 + jsonLength, 0x004e4942, true);
        glb.set(bytes, 28 + jsonLength);
        const binaryShape = await GLTFLoader.LoadShapeAsync(scene, glb, "", 0);
        const jsonShape = await GLTFLoader.LoadShapeAsync(
            scene,
            JSON.stringify({ ...json, buffers: [{ byteLength: bytes.length, uri: `data:application/octet-stream;base64,${btoa(String.fromCharCode(...bytes))}` }] }),
            "",
            0
        );
        expect(binaryShape.type).toBe("mesh");
        expect(jsonShape).toEqual(binaryShape);
    });

    it("rejects unsupported shapes and mesh primitives", async () => {
        const data = {
            json: {
                asset: { version: "2.1" },
                shapes: [{ type: "other" }, { type: "convexMesh", convexMesh: { mesh: 0 } }],
                meshes: [{ primitives: [{ mode: 1, attributes: { POSITION: 0 } }] }],
                accessors: [{ componentType: 5126, count: 3, type: "VEC3", min: [0, 0, 0], max: [0, 0, 0] }],
            },
            bin: null,
        };
        await expect(GLTFLoader.LoadShapeAsync(scene, data, "", 0)).rejects.toThrow();
        await expect(GLTFLoader.LoadShapeAsync(scene, data, "", 1)).rejects.toThrow();
    });

    it("loads an indexed fan and applies normalized sparse positions without changing input bytes", async () => {
        const bytes = new Uint8Array(22);
        bytes.set([0, 0, 0, 127, 0, 0, 0, 127, 0, 127, 127, 0]);
        bytes.set([3, 0, 1, 2], 12);
        bytes[16] = 2;
        bytes.set([0, 0, 127], 17);
        const data = {
            json: {
                asset: { version: "2.1" },
                shapes: [{ type: "convexMesh", convexMesh: { mesh: 0 } }],
                meshes: [{ primitives: [{ mode: 6, attributes: { POSITION: 0 }, indices: 1 }] }],
                accessors: [
                    {
                        bufferView: 0,
                        componentType: 5120,
                        normalized: true,
                        count: 4,
                        type: "VEC3",
                        sparse: { count: 1, indices: { bufferView: 2, componentType: 5121 }, values: { bufferView: 3 } },
                    },
                    { bufferView: 1, componentType: 5121, count: 4, type: "SCALAR" },
                ],
                bufferViews: [
                    { buffer: 0, byteLength: 12 },
                    { buffer: 0, byteOffset: 12, byteLength: 4 },
                    { buffer: 0, byteOffset: 16, byteLength: 1 },
                    { buffer: 0, byteOffset: 17, byteLength: 3 },
                ],
                buffers: [{ byteLength: bytes.length }],
            },
            bin: { byteLength: bytes.length, readAsync: async (offset: number, length: number) => bytes.subarray(offset, offset + length) },
        };
        const before = bytes.slice();
        const shape = await GLTFLoader.LoadShapeAsync(scene, data, "", 0);
        if (shape.type !== "convexMesh") {
            throw new Error("Expected a convex mesh shape");
        }
        expect(Array.from(shape.positions)).toEqual([0, 0, 0, 1, 0, 0, 0, 0, 1, 1, 1, 0]);
        expect(Array.from(shape.indices)).toEqual([3, 0, 1, 3, 1, 2]);
        expect(bytes).toEqual(before);
        expect(data.json.bufferViews[0]).not.toHaveProperty("_activeLoaderExtensionFunctions");
    });

    it("uses extension-provided geometry and disposes it on success and failure", async () => {
        const geometries: Geometry[] = [];
        let invalidIndices = false;
        registerGLTFExtension("TEST_shape_geometry", true, (loader) => ({
            name: "TEST_shape_geometry",
            enabled: true,
            dispose: () => {},
            _loadVertexDataAsync: async () => {
                const geometry = new Geometry("shape", loader.babylonScene);
                geometry.setVerticesData(VertexBuffer.PositionKind, [0, 0, 0, 1, 0, 0, 0, 1, 0]);
                geometry.setIndices(invalidIndices ? [0, 1, 3] : [0, 1, 2]);
                geometries.push(geometry);
                return geometry;
            },
        }));
        const data = {
            json: {
                asset: { version: "2.1" },
                extensionsUsed: ["TEST_shape_geometry"],
                extensionsRequired: ["TEST_shape_geometry"],
                shapes: [{ type: "mesh", mesh: { mesh: 0 } }],
                meshes: [{ primitives: [{ attributes: { POSITION: 0 } }], weights: [1] }],
                accessors: [{ componentType: 5126, count: 3, type: "VEC3" }],
            },
            bin: null,
        };
        const shape = await GLTFLoader.LoadShapeAsync(scene, data, "", 0);
        if (shape.type !== "mesh") {
            throw new Error("Expected a mesh shape");
        }
        expect(Array.from(shape.positions)).toEqual([0, 0, 0, 1, 0, 0, 0, 1, 0]);
        expect(Array.from(shape.indices)).toEqual([0, 1, 2]);
        expect(geometries[0].isDisposed()).toBe(true);

        invalidIndices = true;
        await expect(GLTFLoader.LoadShapeAsync(scene, data, "", 0)).rejects.toThrow();
        expect(geometries[1].isDisposed()).toBe(true);
        expect(scene.meshes).toHaveLength(0);
        expect(scene.geometries).toHaveLength(0);
    });

    it("rejects compressed positions without an available decoder or fallback", async () => {
        const data = {
            json: {
                asset: { version: "2.1" },
                shapes: [{ type: "mesh", mesh: { mesh: 0 } }],
                meshes: [{ primitives: [{ attributes: { POSITION: 0 }, extensions: { KHR_draco_mesh_compression: { bufferView: 0, attributes: { POSITION: 0 } } } }] }],
                accessors: [{ componentType: 5126, count: 3, type: "VEC3" }],
            },
            bin: null,
        };
        await expect(GLTFLoader.LoadShapeAsync(scene, data, "", 0)).rejects.toThrow("Draco-compressed shape positions are not available");
        expect(scene.meshes).toHaveLength(0);
    });

    it("loads a shape through the real Draco encoder and decoder", async () => {
        const require = createRequire(import.meta.url);
        const encoderModule = require("../../../../../tools/babylonServer/public/draco_encoder.js");
        const decoderModule = require("../../../../../tools/babylonServer/public/draco_decoder_gltf.js");
        const encoder = new DracoEncoder({ numWorkers: 0, jsModule: encoderModule });
        const decoder = new DracoDecoder({ numWorkers: 0, jsModule: decoderModule });
        const geometry = new Geometry("source", scene);
        geometry.setVerticesData(VertexBuffer.PositionKind, [0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 1, 0]);
        geometry.setIndices([0, 1, 2, 2, 1, 3]);
        try {
            const compressed = await encoder.encodeMeshAsync(geometry);
            geometry.dispose();
            registerGLTFExtension("KHR_draco_mesh_compression", true, (loader) => {
                const extension = new KHR_draco_mesh_compression(loader);
                extension.enabled = true;
                extension.dracoDecoder = decoder;
                return extension;
            });
            const bytes = new Uint8Array(compressed.data.buffer, compressed.data.byteOffset, compressed.data.byteLength);
            const data = {
                json: {
                    asset: { version: "2.1" },
                    extensionsUsed: ["KHR_draco_mesh_compression"],
                    extensionsRequired: ["KHR_draco_mesh_compression"],
                    shapes: [{ type: "mesh", mesh: { mesh: 0 } }],
                    meshes: [
                        {
                            primitives: [
                                {
                                    attributes: { POSITION: 0 },
                                    extensions: { KHR_draco_mesh_compression: { bufferView: 0, attributes: { POSITION: compressed.attributeIds.position } } },
                                },
                            ],
                        },
                    ],
                    accessors: [{ componentType: 5126, count: 4, type: "VEC3", min: [0, 0, 0], max: [1, 1, 0] }],
                    bufferViews: [{ buffer: 0, byteLength: bytes.length }],
                    buffers: [{ byteLength: bytes.length }],
                },
                bin: { byteLength: bytes.length, readAsync: async (offset: number, length: number) => bytes.subarray(offset, offset + length) },
            };
            const shape = await GLTFLoader.LoadShapeAsync(scene, data, "", 0);
            if (shape.type !== "mesh") {
                throw new Error("Expected a mesh shape");
            }
            const triangles = [];
            for (let i = 0; i < shape.indices.length; i += 3) {
                const vertices = Array.from(shape.indices.subarray(i, i + 3), (index) => Array.from(shape.positions.subarray(index * 3, index * 3 + 3)).join(","));
                triangles.push(vertices.sort().join(";"));
            }
            expect(triangles.sort()).toEqual(["0,0,0;0,1,0;1,0,0", "0,1,0;1,0,0;1,1,0"]);
            expect(scene.geometries).toHaveLength(0);
        } finally {
            geometry.dispose();
            encoder.dispose();
            decoder.dispose();
        }
    });

    it("uses triangle indices produced by the Draco decoder for a triangle strip", async () => {
        let decodePositions = true;
        const decode = vi.spyOn(DracoDecoder.prototype, "_decodeMeshToGeometryForGltfAsync").mockImplementation(async (_name, targetScene, data) => {
            expect(Array.from(data instanceof ArrayBuffer ? new Uint8Array(data) : new Uint8Array(data.buffer, data.byteOffset, data.byteLength))).toEqual([1, 2, 3, 4]);
            const geometry = new Geometry("decoded", targetScene);
            if (decodePositions) {
                geometry.setVerticesData(VertexBuffer.PositionKind, [0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 1, 0]);
            }
            geometry.setIndices([0, 1, 2, 2, 1, 3]);
            return geometry;
        });
        registerGLTFExtension("KHR_draco_mesh_compression", true, (loader) => {
            const extension = new KHR_draco_mesh_compression(loader);
            extension.enabled = true;
            extension.dracoDecoder = Object.create(DracoDecoder.prototype);
            return extension;
        });
        const bytes = new Uint8Array([1, 2, 3, 4]);
        const data = {
            json: {
                asset: { version: "2.1" },
                extensionsUsed: ["KHR_draco_mesh_compression"],
                extensionsRequired: ["KHR_draco_mesh_compression"],
                shapes: [{ type: "mesh", mesh: { mesh: 0 } }],
                meshes: [{ primitives: [{ mode: 5, attributes: { POSITION: 0 }, extensions: { KHR_draco_mesh_compression: { bufferView: 0, attributes: { POSITION: 0 } } } }] }],
                accessors: [{ componentType: 5126, count: 4, type: "VEC3", min: [0, 0, 0], max: [1, 1, 0] }],
                bufferViews: [{ buffer: 0, byteLength: 4 }],
                buffers: [{ byteLength: 4 }],
            },
            bin: { byteLength: 4, readAsync: async (offset: number, length: number) => bytes.subarray(offset, offset + length) },
        };
        const shape = await GLTFLoader.LoadShapeAsync(scene, data, "", 0);
        if (shape.type !== "mesh") {
            throw new Error("Expected a mesh shape");
        }
        expect(decode).toHaveBeenCalledOnce();
        expect(Array.from(shape.indices)).toEqual([0, 1, 2, 2, 1, 3]);
        expect(scene.geometries).toHaveLength(0);

        decodePositions = false;
        const positions = new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 1, 0]);
        const uncompressedBytes = new Uint8Array(4 + positions.byteLength);
        uncompressedBytes.set(bytes);
        uncompressedBytes.set(new Uint8Array(positions.buffer), 4);
        const ordinaryPositions = {
            json: {
                ...data.json,
                meshes: [{ primitives: [{ mode: 5, attributes: { POSITION: 0 }, extensions: { KHR_draco_mesh_compression: { bufferView: 0, attributes: {} } } }] }],
                accessors: [{ ...data.json.accessors[0], bufferView: 1 }],
                bufferViews: [
                    { buffer: 0, byteLength: 4 },
                    { buffer: 0, byteOffset: 4, byteLength: positions.byteLength },
                ],
                buffers: [{ byteLength: uncompressedBytes.length }],
            },
            bin: { byteLength: uncompressedBytes.length, readAsync: async (offset: number, length: number) => uncompressedBytes.subarray(offset, offset + length) },
        };
        const fallback = await GLTFLoader.LoadShapeAsync(scene, ordinaryPositions, "", 0);
        if (fallback.type !== "mesh") {
            throw new Error("Expected a mesh shape");
        }
        expect(Array.from(fallback.positions)).toEqual(Array.from(positions));
        expect(Array.from(fallback.indices)).toEqual([0, 1, 2, 2, 1, 3]);
        expect(scene.geometries).toHaveLength(0);
    });
});
