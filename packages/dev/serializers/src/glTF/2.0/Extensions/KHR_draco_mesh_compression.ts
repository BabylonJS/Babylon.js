import type { IGLTFExporterExtensionV2 } from "../glTFExporterExtension";
import { GLTFExporter } from "../glTFExporter";
import { MeshPrimitiveMode } from "babylonjs-gltf2interface";
import type { IAccessor, IBufferView, IKHRDracoMeshCompression, IMeshPrimitive } from "babylonjs-gltf2interface";
import type { BufferManager } from "../bufferManager";
import { DracoEncoder } from "core/Meshes/Compression/dracoEncoder";
import { GetTypedArrayData, GetTypeByteLength } from "core/Buffers/bufferUtils";
import { GetAccessorElementCount } from "../glTFUtilities";
import type { DracoAttributeName, IDracoAttributeData, IDracoEncoderOptions } from "core/Meshes/Compression/dracoEncoder.types";
import { Logger } from "core/Misc/logger";
import type { Nullable } from "core/types";

const NAME = "KHR_draco_mesh_compression";

function GetDracoAttributeName(glTFName: string): DracoAttributeName {
    if (glTFName === "POSITION") {
        return "POSITION";
    } else if (glTFName === "NORMAL") {
        return "NORMAL";
    } else if (glTFName.startsWith("COLOR")) {
        return "COLOR";
    } else if (glTFName.startsWith("TEXCOORD")) {
        return "TEX_COORD";
    }
    return "GENERIC";
}

/**
 * [Specification](https://github.com/KhronosGroup/glTF/blob/main/extensions/2.0/Khronos/KHR_draco_mesh_compression/README.md)
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export class KHR_draco_mesh_compression implements IGLTFExporterExtensionV2 {
    /** Name of this extension */
    public readonly name = NAME;

    /** Defines whether this extension is enabled */
    public enabled;

    /** KHR_draco_mesh_compression is required, as uncompressed fallback data is not yet implemented. */
    public required = true;

    /** BufferViews used for Draco data, which may be eligible for removal after Draco encoding */
    private _bufferViewsUsed: Set<IBufferView> = new Set();

    /** Accessors that were replaced with Draco data, which may be eligible for removal after Draco encoding */
    private _accessorsUsed: Set<IAccessor> = new Set();

    /** Promise pool for Draco encoding work */
    private _encodePromises: Promise<void>[] = [];

    private _wasUsed = false;

    /** @internal */
    public get wasUsed() {
        return this._wasUsed;
    }

    /** @internal */
    constructor(exporter: GLTFExporter) {
        this.enabled = exporter.options.meshCompressionMethod === "Draco" && DracoEncoder.DefaultAvailable;
    }

    /** @internal */
    public dispose() {}

    /** @internal */
    public postExportMeshPrimitive(primitive: IMeshPrimitive, bufferManager: BufferManager, accessors: IAccessor[]): void {
        if (!this.enabled) {
            return;
        }

        if (primitive.mode !== MeshPrimitiveMode.TRIANGLES && primitive.mode !== MeshPrimitiveMode.TRIANGLE_STRIP) {
            Logger.Warn("Cannot compress primitive with mode " + primitive.mode + ".");
            return;
        }

        // Collect bufferViews and accessors used by this primitive
        const primitiveBufferViews: IBufferView[] = [];
        const primitiveAccessors: IAccessor[] = [];

        // Prepare indices for Draco encoding
        let indices: Nullable<Uint32Array | Uint16Array> = null;
        if (primitive.indices !== undefined) {
            const accessor = accessors[primitive.indices];
            const bufferView = bufferManager.getBufferView(accessor);
            // Per exportIndices, indices must be either Uint16Array or Uint32Array
            indices = bufferManager.getData(bufferView).slice() as Uint32Array | Uint16Array;

            primitiveBufferViews.push(bufferView);
            primitiveAccessors.push(accessor);
        }

        // Prepare attributes for Draco encoding
        const attributes: IDracoAttributeData[] = [];
        for (const [name, accessorIndex] of Object.entries(primitive.attributes)) {
            const accessor = accessors[accessorIndex];
            const bufferView = bufferManager.getBufferView(accessor);

            const size = GetAccessorElementCount(accessor.type);
            const data = GetTypedArrayData(
                bufferManager.getData(bufferView),
                size,
                accessor.componentType,
                accessor.byteOffset || 0,
                bufferView.byteStride || GetTypeByteLength(accessor.componentType) * size,
                accessor.count,
                true
            );

            attributes.push({ kind: name, dracoName: GetDracoAttributeName(name), size: GetAccessorElementCount(accessor.type), data: data });

            primitiveBufferViews.push(bufferView);
            primitiveAccessors.push(accessor);
        }

        // Use sequential encoding to preserve vertex order for cases like morph targets
        const options: IDracoEncoderOptions = {
            method: primitive.targets ? "MESH_SEQUENTIAL_ENCODING" : "MESH_EDGEBREAKER_ENCODING",
        };

        const promise = DracoEncoder.Default._encodeAsync(attributes, indices, options)
            // eslint-disable-next-line github/no-then
            .then((encodedData) => {
                const dracoInfo: IKHRDracoMeshCompression = {
                    bufferView: -1, // bufferView will be set to a real index later, when we write the binary and decide bufferView ordering
                    attributes: encodedData.attributeIds,
                };
                const bufferView = bufferManager.createBufferView(encodedData.data);
                bufferManager.setBufferView(dracoInfo, bufferView);

                for (const bufferView of primitiveBufferViews) {
                    this._bufferViewsUsed.add(bufferView);
                }
                for (const accessor of primitiveAccessors) {
                    this._accessorsUsed.add(accessor);
                }

                primitive.extensions ||= {};
                primitive.extensions[NAME] = dracoInfo;
            })
            // eslint-disable-next-line github/no-then
            .catch((error) => {
                Logger.Error("KHR_draco_mesh_compression: Failed to export Draco-encoded primitive. Resulting glTF may be invalid. " + error.message);
            });

        this._encodePromises.push(promise);

        this._wasUsed = true;
    }

    /** @internal */
    public async preGenerateBinaryAsync(bufferManager: BufferManager): Promise<void> {
        if (!this.enabled) {
            return;
        }

        await Promise.all(this._encodePromises);

        // Cull obsolete bufferViews that were replaced with Draco data
        this._bufferViewsUsed.forEach((bufferView) => {
            const references = bufferManager.getPropertiesWithBufferView(bufferView);
            const onlyUsedByEncodedPrimitives = references.every((object) => {
                return this._accessorsUsed.has(object as IAccessor); // has() can handle any object, but TS doesn't know that
            });
            if (onlyUsedByEncodedPrimitives) {
                bufferManager.removeBufferView(bufferView);
            }
        });

        this._bufferViewsUsed.clear();
        this._accessorsUsed.clear();
    }
}

GLTFExporter.RegisterExtension(NAME, (exporter) => new KHR_draco_mesh_compression(exporter));
