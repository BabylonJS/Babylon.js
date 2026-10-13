import { NullEngine } from "core/Engines/nullEngine";
import { ImportMeshAsync } from "core/Loading";
import { Scene } from "core/scene";
import { type IExportOptions, GLTF2Export } from "serializers/glTF/2.0";
import "loaders/glTF/2.0";

/** A glTF document as plain JSON. */
export type GltfJson = Record<string, any>;

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
            { bufferView: 0, componentType: 5126, count: 3, type: "VEC3", min: [0, 0, 0], max: [1, 1, 0] },
            { bufferView: 1, componentType: 5126, count: 3, type: "VEC3" },
            { bufferView: 2, componentType: 5123, count: 3, type: "SCALAR" },
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
    return { gltf: JSON.parse(data.files["test.gltf"] as string), bin: await (data.files["test.bin"] as Blob).arrayBuffer() };
}

/** Reads an accessor's elements as a flat array, honoring the buffer view offset and stride. */
export function ReadAccessor(gltf: GltfJson, bin: ArrayBuffer, accessorIndex: number): number[] {
    const accessor = gltf.accessors[accessorIndex];
    const view = gltf.bufferViews[accessor.bufferView];
    const components = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 }[accessor.type as string]!;
    const bytes = { 5121: 1, 5123: 2, 5125: 4, 5126: 4 }[accessor.componentType as number]!;
    const stride = view.byteStride ?? components * bytes;
    const data = new DataView(bin);
    const result: number[] = [];
    for (let i = 0; i < accessor.count; i++) {
        for (let c = 0; c < components; c++) {
            const offset = (view.byteOffset ?? 0) + (accessor.byteOffset ?? 0) + i * stride + c * bytes;
            result.push(
                accessor.componentType === 5126
                    ? data.getFloat32(offset, true)
                    : accessor.componentType === 5121
                      ? data.getUint8(offset)
                      : accessor.componentType === 5123
                        ? data.getUint16(offset, true)
                        : data.getUint32(offset, true)
            );
        }
    }
    return result;
}

/** Exports the scene as .gltf and returns the parsed JSON. */
export async function ExportGltfAsync(scene: Scene, options?: IExportOptions): Promise<GltfJson> {
    const data = await GLTF2Export.GLTFAsync(scene, "test", { exportWithoutWaitingForScene: true, ...options });
    return JSON.parse(data.files["test.gltf"] as string);
}

/** Imports a glTF document into the scene, then exports it again as .gltf. */
export async function RoundTripGltfAsync(scene: Scene, gltf: GltfJson, options?: IExportOptions): Promise<GltfJson> {
    await ImportGltfAsync(scene, gltf);
    return await ExportGltfAsync(scene, options);
}
