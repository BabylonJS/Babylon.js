import { NullEngine } from "core/Engines/nullEngine";
import { ImportMeshAsync } from "core/Loading";
import { Scene } from "core/scene";
import { type IExportOptions, GLTF2Export } from "serializers/glTF/2.0";
import "loaders/glTF/2.0";
import { type IAccessor, type IGLTF } from "babylonjs-gltf2interface";

/** A glTF document as plain JSON. */
export type GltfJson = IGLTF & Required<Pick<IGLTF, "accessors" | "buffers" | "bufferViews" | "materials" | "meshes" | "nodes" | "scenes">>;

/** Creates a fresh engine and scene for a test. */
export function CreateTestScene(): { engine: NullEngine; scene: Scene; dispose: () => void } {
    const engine = new NullEngine();
    const scene = new Scene(engine);
    return {
        engine,
        scene,
        dispose: () => {
            scene.dispose();
            engine.dispose();
        },
    };
}

/** Encodes binary data as a data URI usable as a glTF buffer uri. */
export function ToDataUri(...arrays: ArrayBufferView[]): string {
    let binary = "";
    for (const array of arrays) {
        for (const byte of new Uint8Array(array.buffer, array.byteOffset, array.byteLength)) {
            binary += String.fromCharCode(byte);
        }
    }
    return `data:application/octet-stream;base64,${btoa(binary)}`;
}

/** A single triangle in the XY plane, with normals. Accessor 0 is POSITION, 1 is NORMAL, 2 is the indices. */
export function CreateTriangleGltf(): GltfJson {
    const positions = new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]);
    const normals = new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1]);
    const indices = new Uint16Array([0, 1, 2, 0]);
    return {
        asset: { version: "2.0" },
        scene: 0,
        scenes: [{ nodes: [0] }],
        nodes: [{ name: "triangle", mesh: 0 }],
        meshes: [{ name: "triangle", primitives: [{ attributes: { POSITION: 0, NORMAL: 1 }, indices: 2, material: 0 }] }],
        materials: [{ name: "material", pbrMetallicRoughness: { baseColorFactor: [1, 0, 0, 1], metallicFactor: 0, roughnessFactor: 1 } }],
        accessors: [
            { bufferView: 0, componentType: 5126, count: 3, type: "VEC3" as IAccessor["type"], min: [0, 0, 0], max: [1, 1, 0] },
            { bufferView: 1, componentType: 5126, count: 3, type: "VEC3" as IAccessor["type"] },
            { bufferView: 2, componentType: 5123, count: 3, type: "SCALAR" as IAccessor["type"] },
        ],
        bufferViews: [
            { buffer: 0, byteOffset: 0, byteLength: 36 },
            { buffer: 0, byteOffset: 36, byteLength: 36 },
            { buffer: 0, byteOffset: 72, byteLength: 6 },
        ],
        buffers: [{ byteLength: 80, uri: ToDataUri(positions, normals, indices) }],
    };
}

/** Imports a glTF document into the scene. */
export async function ImportGltfAsync(scene: Scene, gltf: GltfJson): Promise<void> {
    await ImportMeshAsync(`data:${JSON.stringify(gltf)}`, scene);
}

/** Exports the scene as .gltf and returns the parsed JSON together with the binary buffer. */
export async function ExportGltfWithBinaryAsync(scene: Scene, options?: IExportOptions): Promise<{ gltf: GltfJson; bin: ArrayBuffer }> {
    const data = await GLTF2Export.GLTFAsync(scene, "test", { exportWithoutWaitingForScene: true, ...options });
    return { gltf: ParseGltfJson(GetTextFile(data.files["test.gltf"])), bin: await GetBlobFile(data.files["test.bin"]).arrayBuffer() };
}

/** Reads raw accessor components as a flat array, honoring the buffer view offset and stride. */
export function ReadAccessor(gltf: GltfJson, bin: ArrayBuffer, accessorIndex: number): number[] {
    const accessor = gltf.accessors[accessorIndex];
    if (!accessor) {
        throw new Error(`Accessor ${accessorIndex} does not exist`);
    }
    if (accessor.bufferView === undefined) {
        throw new Error(`Accessor ${accessorIndex} does not reference a buffer view`);
    }
    const view = gltf.bufferViews[accessor.bufferView];
    if (!view) {
        throw new Error(`Buffer view ${accessor.bufferView} does not exist`);
    }

    const components = (() => {
        switch (accessor.type) {
            case "SCALAR":
                return 1;
            case "VEC2":
                return 2;
            case "VEC3":
                return 3;
            case "VEC4":
                return 4;
            case "MAT4":
                return 16;
            default:
                throw new Error(`Unsupported accessor type ${accessor.type}`);
        }
    })();
    const bytes = (() => {
        switch (accessor.componentType) {
            case 5120:
            case 5121:
                return 1;
            case 5122:
            case 5123:
                return 2;
            case 5125:
            case 5126:
                return 4;
            default:
                throw new Error(`Unsupported accessor component type ${accessor.componentType}`);
        }
    })();
    const stride = view.byteStride ?? components * bytes;
    const data = new DataView(bin);
    const result: number[] = [];
    for (let i = 0; i < accessor.count; i++) {
        for (let c = 0; c < components; c++) {
            const offset = (view.byteOffset ?? 0) + (accessor.byteOffset ?? 0) + i * stride + c * bytes;
            switch (accessor.componentType) {
                case 5120:
                    result.push(data.getInt8(offset));
                    break;
                case 5121:
                    result.push(data.getUint8(offset));
                    break;
                case 5122:
                    result.push(data.getInt16(offset, true));
                    break;
                case 5123:
                    result.push(data.getUint16(offset, true));
                    break;
                case 5125:
                    result.push(data.getUint32(offset, true));
                    break;
                case 5126:
                    result.push(data.getFloat32(offset, true));
                    break;
                default:
                    throw new Error(`Unsupported accessor component type ${accessor.componentType}`);
            }
        }
    }
    return result;
}

/** Parses exporter JSON into the typed glTF document shape used by these fixtures. */
export function ParseGltfJson(json: string): GltfJson {
    return JSON.parse(json) as GltfJson;
}

export function GetTextFile(file: Blob | string): string {
    if (typeof file !== "string") {
        throw new Error("Expected a text glTF file");
    }
    return file;
}

export function GetBlobFile(file: Blob | string): Blob {
    if (typeof file === "string") {
        throw new Error("Expected a binary glTF buffer file");
    }
    return file;
}

/** Exports the scene as .gltf and returns the parsed JSON. */
export async function ExportGltfAsync(scene: Scene, options?: IExportOptions): Promise<GltfJson> {
    const data = await GLTF2Export.GLTFAsync(scene, "test", { exportWithoutWaitingForScene: true, ...options });
    return ParseGltfJson(GetTextFile(data.files["test.gltf"]));
}

/** Imports a glTF document into the scene, then exports it again as .gltf. */
export async function RoundTripGltfAsync(scene: Scene, gltf: GltfJson, options?: IExportOptions): Promise<GltfJson> {
    await ImportGltfAsync(scene, gltf);
    return await ExportGltfAsync(scene, options);
}

/** Imports a glTF document into the scene, then exports it with its binary buffer. */
export async function RoundTripGltfWithBinaryAsync(scene: Scene, gltf: GltfJson, options?: IExportOptions): Promise<{ gltf: GltfJson; bin: ArrayBuffer }> {
    await ImportGltfAsync(scene, gltf);
    return await ExportGltfWithBinaryAsync(scene, options);
}
