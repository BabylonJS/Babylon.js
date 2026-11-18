import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { VertexBuffer } from "core/Buffers/buffer";
import { NullEngine } from "core/Engines/nullEngine";
import { type IFileRequest } from "core/Misc/fileRequest";
import { Observable } from "core/Misc/observable";
import { WebRequest } from "core/Misc/webRequest";
import { Scene } from "core/scene";
import { GLTFFileLoader, type IGLTFLoaderData } from "loaders/glTF/glTFFileLoader.pure";
import "loaders/glTF/2.0/glTFLoader";
import "loaders/glTF/2.0/Extensions/MSFT_lod";

const JSON_CHUNK = 0x4e4f534a;
const BIN_CHUNK = 0x004e4942;

interface Chunk {
    type: number;
    bytes: Uint8Array;
    encoding?: number;
}

function glb3(chunks: Chunk[]): Uint8Array {
    const offsets: number[] = [];
    let length = 16;
    for (const [index, chunk] of chunks.entries()) {
        offsets.push(length);
        length += 16 + chunk.bytes.length;
        if (index !== chunks.length - 1) {
            length = Math.ceil(length / 8) * 8;
        }
    }

    const bytes = new Uint8Array(length);
    const view = new DataView(bytes.buffer);
    view.setUint32(0, 0x46546c67, true);
    view.setUint32(4, 3, true);
    view.setUint32(8, length, true);
    for (const [index, chunk] of chunks.entries()) {
        const offset = offsets[index];
        view.setUint32(offset, chunk.type, true);
        view.setUint32(offset + 4, chunk.encoding ?? 0, true);
        view.setUint32(offset + 8, chunk.bytes.length, true);
        bytes.set(chunk.bytes, offset + 16);
    }
    return bytes;
}

function glb2(chunks: Chunk[]): Uint8Array {
    const paddedLengths = chunks.map((chunk) => Math.ceil(chunk.bytes.length / 4) * 4);
    const length = 12 + paddedLengths.reduce((total, chunkLength) => total + 8 + chunkLength, 0);
    const bytes = new Uint8Array(length);
    const view = new DataView(bytes.buffer);
    view.setUint32(0, 0x46546c67, true);
    view.setUint32(4, 2, true);
    view.setUint32(8, length, true);
    let offset = 12;
    for (const [index, chunk] of chunks.entries()) {
        view.setUint32(offset, paddedLengths[index], true);
        view.setUint32(offset + 4, chunk.type, true);
        if (chunk.type === JSON_CHUNK) {
            bytes.fill(0x20, offset + 8, offset + 8 + paddedLengths[index]);
        }
        bytes.set(chunk.bytes, offset + 8);
        offset += 8 + paddedLengths[index];
    }
    return bytes;
}

function jsonChunk(value: object, encoding?: number): Chunk {
    return { type: JSON_CHUNK, bytes: new TextEncoder().encode(JSON.stringify(value)), encoding };
}

describe("GLB version 3", () => {
    let engine: NullEngine;
    let scene: Scene;

    beforeEach(() => {
        engine = new NullEngine();
        scene = new Scene(engine);
    });

    afterEach(() => {
        vi.restoreAllMocks();
        scene.dispose();
        engine.dispose();
    });

    async function parse(bytes: Uint8Array): Promise<IGLTFLoaderData> {
        const loader = new GLTFFileLoader();
        return (await loader.directLoad(scene, `model/gltf-binary;base64,${Buffer.from(bytes).toString("base64")}`)) as IGLTFLoaderData;
    }

    it("loads buffers from arbitrary chunks around the JSON chunk", async () => {
        const positions = new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]);
        const indices = new Uint16Array([0, 1, 2]);
        const json = {
            asset: { version: "2.1" },
            extensionsUsed: ["MSFT_lod"],
            scene: 0,
            scenes: [{ nodes: [0] }],
            nodes: [{ mesh: 0 }],
            meshes: [{ primitives: [{ attributes: { POSITION: 0 }, indices: 1 }] }],
            accessors: [
                { bufferView: 0, componentType: 5126, count: 3, type: "VEC3", min: [0, 0, 0], max: [1, 1, 0] },
                { bufferView: 1, componentType: 5123, count: 3, type: "SCALAR" },
            ],
            bufferViews: [
                { buffer: 0, byteLength: positions.byteLength },
                { buffer: 1, byteLength: indices.byteLength },
            ],
            buffers: [
                { chunk: 2, byteLength: positions.byteLength },
                { chunk: 0, byteLength: indices.byteLength },
            ],
        };
        const bytes = glb3([{ type: 0x12345678, bytes: new Uint8Array(indices.buffer) }, jsonChunk(json), { type: BIN_CHUNK, bytes: new Uint8Array(positions.buffer) }]);
        const loader = new GLTFFileLoader();
        loader.useRangeRequests = true;
        const data = (await loader.directLoad(scene, `model/gltf-binary;base64,${Buffer.from(bytes).toString("base64")}`)) as IGLTFLoaderData;
        const container = await loader.loadAssetContainerAsync(scene, data, "");
        const mesh = container.meshes.find((candidate) => candidate.getTotalVertices() === 3);

        expect(Array.from(mesh?.getVerticesData(VertexBuffer.PositionKind) ?? [])).toEqual(Array.from(positions));
        expect(Array.from(mesh?.getIndices() ?? [])).toEqual(Array.from(indices));
    });

    it("supports the implicit first binary buffer", async () => {
        const json = { asset: { version: "2.0" }, buffers: [{ byteLength: 3 }] };
        const data = await parse(glb3([jsonChunk(json), { type: BIN_CHUNK, bytes: new Uint8Array([1, 2, 3]) }]));

        expect(data.bin?.byteLength).toBe(3);
        const view = await data.bin!.readAsync(0, 3);
        expect(Array.from(new Uint8Array(view.buffer, view.byteOffset, view.byteLength))).toEqual([1, 2, 3]);
    });

    it("rejects an encoded main JSON chunk", async () => {
        await expect(parse(glb3([jsonChunk({ asset: { version: "2.0" } }, 1)]))).rejects.toThrow(/encoding/i);
    });

    it("refuses an encoded chunk only when it is read", async () => {
        const data = await parse(glb3([jsonChunk({ asset: { version: "2.0" } }), { type: BIN_CHUNK, bytes: new Uint8Array([1]), encoding: 1 }]));

        await expect(data.chunks![1].readAsync(0, 1)).rejects.toThrow(/encoding/i);
    });

    it("rejects lengths that cannot be represented safely", async () => {
        const bytes = glb3([jsonChunk({ asset: { version: "2.0" } })]);
        new DataView(bytes.buffer).setUint32(12, 0x200000, true);
        await expect(parse(bytes)).rejects.toThrow(/length/i);
    });

    it("rejects a chunk whose length exceeds the container", async () => {
        const bytes = glb3([jsonChunk({ asset: { version: "2.0" } })]);
        new DataView(bytes.buffer).setUint32(24, bytes.length, true);
        await expect(parse(bytes)).rejects.toThrow(/length|chunk/i);
    });

    it("rejects trailing padding without another chunk", async () => {
        const content = glb3([jsonChunk({ asset: { version: "2.0" } })]);
        const length = Math.ceil(content.length / 8) * 8;
        const bytes = new Uint8Array(length === content.length ? length + 8 : length);
        bytes.set(content);
        new DataView(bytes.buffer).setUint32(8, bytes.length, true);

        await expect(parse(bytes)).rejects.toThrow(/padding|header/i);
    });

    it("reads JSON beyond a 4 GiB chunk using range requests", async () => {
        const chunkLength = 2 ** 32 + 3;
        const jsonOffset = Math.ceil((32 + chunkLength) / 8) * 8;
        const json = jsonChunk({ asset: { version: "2.0" } }).bytes;
        const length = jsonOffset + 16 + json.length;
        const header = new Uint8Array(32);
        const headerView = new DataView(header.buffer);
        headerView.setUint32(0, 0x46546c67, true);
        headerView.setUint32(4, 3, true);
        headerView.setUint32(8, length % 2 ** 32, true);
        headerView.setUint32(12, Math.floor(length / 2 ** 32), true);
        headerView.setUint32(16, BIN_CHUNK, true);
        headerView.setUint32(24, 3, true);
        headerView.setUint32(28, 1, true);
        const jsonHeader = new Uint8Array(16 + json.length);
        const jsonView = new DataView(jsonHeader.buffer);
        jsonView.setUint32(0, JSON_CHUNK, true);
        jsonView.setUint32(8, json.length, true);
        jsonHeader.set(json, 16);
        const segments = [
            { offset: 0, bytes: header },
            { offset: jsonOffset, bytes: jsonHeader },
        ];
        const ranges: number[] = [];
        const loader = new GLTFFileLoader();
        loader.useRangeRequests = true;
        vi.spyOn(loader, "_loadFile").mockImplementation((_scene, _file, onSuccess, _useArrayBuffer, _onError, onOpened) => {
            let range = "";
            const request = Object.create(WebRequest.prototype) as WebRequest;
            request.setRequestHeader = (_name, value) => {
                range = value;
            };
            onOpened?.(request);
            const match = /^bytes=(\d+)-(\d+)$/.exec(range);
            if (!match) {
                throw new Error(`Invalid range: ${range}`);
            }
            const start = Number(match[1]);
            const end = Number(match[2]) + 1;
            ranges.push(start);
            const response = new Uint8Array(end - start);
            for (const segment of segments) {
                const from = Math.max(start, segment.offset);
                const to = Math.min(end, segment.offset + segment.bytes.length);
                if (from < to) {
                    response.set(segment.bytes.subarray(from - segment.offset, to - segment.offset), from - start);
                }
            }
            queueMicrotask(() => onSuccess(response.buffer));
            return { abort: () => {}, onCompleteObservable: new Observable<IFileRequest>() };
        });

        const data = await new Promise<IGLTFLoaderData>((resolve, reject) => {
            loader.loadFile(
                scene,
                "large.glb",
                "",
                (result) => resolve(result as IGLTFLoaderData),
                undefined,
                true,
                (_request, error) => reject(error)
            );
        });
        expect(data.chunks?.[0].byteLength).toBe(chunkLength);
        expect(data.json).toEqual({ asset: { version: "2.0" } });
        expect(ranges.some((offset) => offset > 2 ** 32)).toBe(true);
    });

    it("reads only the requested range from a large referenced chunk", async () => {
        const positions = new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]);
        const offset = 2 ** 32;
        const readAsync = vi.fn(async (start: number, length: number) => {
            if (start !== offset || length !== positions.byteLength) {
                throw new Error("Unexpected chunk range");
            }
            return new Uint8Array(positions.buffer);
        });
        const data = {
            json: {
                asset: { version: "2.1" },
                scene: 0,
                scenes: [{ nodes: [0] }],
                nodes: [{ mesh: 0 }],
                meshes: [{ primitives: [{ attributes: { POSITION: 0 } }] }],
                accessors: [{ bufferView: 0, componentType: 5126, count: 3, type: "VEC3", min: [0, 0, 0], max: [1, 1, 0] }],
                bufferViews: [{ buffer: 0, byteOffset: offset, byteLength: positions.byteLength }],
                buffers: [{ chunk: 0, byteLength: offset + positions.byteLength }],
            },
            bin: null,
            chunks: [{ byteLength: offset + positions.byteLength, readAsync }],
            containerVersion: 3,
        };
        const loader = new GLTFFileLoader();
        loader.useRangeRequests = true;
        const container = await loader.loadAssetContainerAsync(scene, data, "");
        const mesh = container.meshes.find((candidate) => candidate.getTotalVertices() === 3);

        expect(Array.from(mesh?.getVerticesData(VertexBuffer.PositionKind) ?? [])).toEqual(Array.from(positions));
        expect(readAsync).toHaveBeenCalledWith(offset, positions.byteLength);
    });

    it("rejects a buffer view that extends beyond the referenced buffer", async () => {
        const readAsync = vi.fn(async () => new Uint8Array(36));
        const data = {
            json: {
                asset: { version: "2.1" },
                scene: 0,
                scenes: [{ nodes: [0] }],
                nodes: [{ mesh: 0 }],
                meshes: [{ primitives: [{ attributes: { POSITION: 0 } }] }],
                accessors: [{ bufferView: 0, componentType: 5126, count: 3, type: "VEC3", min: [0, 0, 0], max: [1, 1, 0] }],
                bufferViews: [{ buffer: 0, byteLength: 36 }],
                buffers: [{ chunk: 0, byteLength: 35 }],
            },
            bin: null,
            chunks: [{ byteLength: 36, readAsync }],
            containerVersion: 3,
        };
        const loader = new GLTFFileLoader();
        await expect(loader.loadAssetContainerAsync(scene, data, "")).rejects.toThrow(/range/i);
        expect(readAsync).not.toHaveBeenCalled();
    });

    it("defers higher detail chunk reads until the lower level has loaded", async () => {
        const positions = new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]);
        const bytes = new Uint8Array(positions.buffer);
        let releaseLow!: (value: Uint8Array) => void;
        let signalLowStarted!: () => void;
        const lowStarted = new Promise<void>((resolve) => {
            signalLowStarted = resolve;
        });
        const readLow = vi.fn(() => {
            signalLowStarted();
            return new Promise<Uint8Array>((resolve) => {
                releaseLow = resolve;
            });
        });
        const readHigh = vi.fn(async () => bytes);
        const data = {
            json: {
                asset: { version: "2.1" },
                extensionsUsed: ["MSFT_lod"],
                scene: 0,
                scenes: [{ nodes: [0] }],
                nodes: [{ mesh: 0, extensions: { MSFT_lod: { ids: [1] } } }, { mesh: 1 }],
                meshes: [{ primitives: [{ attributes: { POSITION: 0 } }] }, { primitives: [{ attributes: { POSITION: 1 } }] }],
                accessors: [
                    { bufferView: 0, componentType: 5126, count: 3, type: "VEC3", min: [0, 0, 0], max: [1, 1, 0] },
                    { bufferView: 1, componentType: 5126, count: 3, type: "VEC3", min: [0, 0, 0], max: [1, 1, 0] },
                ],
                bufferViews: [
                    { buffer: 0, byteLength: bytes.byteLength },
                    { buffer: 1, byteLength: bytes.byteLength },
                ],
                buffers: [
                    { chunk: 0, byteLength: bytes.byteLength },
                    { chunk: 1, byteLength: bytes.byteLength },
                ],
            },
            bin: null,
            chunks: [
                { byteLength: bytes.byteLength, readAsync: readHigh },
                { byteLength: bytes.byteLength, readAsync: readLow },
            ],
            containerVersion: 3,
        };
        const loader = new GLTFFileLoader();
        loader.useRangeRequests = true;
        const completed = loader.whenCompleteAsync();
        const loading = loader.loadAssetContainerAsync(scene, data, "");
        await lowStarted;
        const highStartedEarly = readHigh.mock.calls.length > 0;
        releaseLow(bytes);
        await loading;
        await completed;

        expect(highStartedEarly).toBe(false);
        expect(readHigh).toHaveBeenCalled();
    });

    it("resolves explicit chunk references in a GLB version 2 container", async () => {
        const positions = new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]);
        const json = {
            asset: { version: "2.1" },
            scene: 0,
            scenes: [{ nodes: [0] }],
            nodes: [{ mesh: 0 }],
            meshes: [{ primitives: [{ attributes: { POSITION: 0 } }] }],
            accessors: [{ bufferView: 0, componentType: 5126, count: 3, type: "VEC3", min: [0, 0, 0], max: [1, 1, 0] }],
            bufferViews: [{ buffer: 0, byteLength: positions.byteLength }],
            buffers: [{ chunk: 1, byteLength: positions.byteLength }],
        };
        const bytes = glb2([jsonChunk(json), { type: BIN_CHUNK, bytes: new Uint8Array(positions.buffer) }]);
        const loader = new GLTFFileLoader();
        const data = (await loader.directLoad(scene, `model/gltf-binary;base64,${Buffer.from(bytes).toString("base64")}`)) as IGLTFLoaderData;
        const container = await loader.loadAssetContainerAsync(scene, data, "");
        const mesh = container.meshes.find((candidate) => candidate.getTotalVertices() === 3);

        expect(Array.from(mesh?.getVerticesData(VertexBuffer.PositionKind) ?? [])).toEqual(Array.from(positions));
    });
});
