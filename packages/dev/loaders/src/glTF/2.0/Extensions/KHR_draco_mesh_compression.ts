import { DracoCompression } from "core/Meshes/Compression/dracoCompression";
import type { Nullable } from "core/types";
import { VertexBuffer } from "core/Buffers/buffer";
import type { Geometry } from "core/Meshes/geometry";
import type { Mesh } from "core/Meshes/mesh";

import { MeshPrimitiveMode } from "babylonjs-gltf2interface";
import type { IKHRDracoMeshCompression } from "babylonjs-gltf2interface";
import type { IMeshPrimitive, IBufferView } from "../glTFLoaderInterfaces";
import type { IGLTFLoaderExtension } from "../glTFLoaderExtension";
import { GLTFLoader, ArrayItem } from "../glTFLoader";

const NAME = "KHR_draco_mesh_compression";

interface IBufferViewDraco extends IBufferView {
    _dracoBabylonGeometry?: Promise<Geometry>;
}

/**
 * [Specification](https://github.com/KhronosGroup/glTF/blob/main/extensions/2.0/Khronos/KHR_draco_mesh_compression/README.md)
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export class KHR_draco_mesh_compression implements IGLTFLoaderExtension {
    /**
     * The name of this extension.
     */
    public readonly name = NAME;

    /**
     * The draco compression used to decode vertex data or DracoCompression.Default if not defined
     */
    public dracoCompression?: DracoCompression;

    /**
     * Defines whether this extension is enabled.
     */
    public enabled: boolean;

    /**
     * Defines whether to use the normalized flag from the glTF accessor instead of the Draco data. Defaults to true.
     */
    public useNormalizedFlagFromAccessor = true;

    private _loader: GLTFLoader;

    /**
     * @internal
     */
    constructor(loader: GLTFLoader) {
        this._loader = loader;
        this.enabled = DracoCompression.DecoderAvailable && this._loader.isExtensionUsed(NAME);
    }

    /** @internal */
    public dispose(): void {
        delete this.dracoCompression;
        (this._loader as any) = null;
    }

    /**
     * @internal
     */
    public _loadVertexDataAsync(context: string, primitive: IMeshPrimitive, babylonMesh: Mesh): Nullable<Promise<Geometry>> {
        return GLTFLoader.LoadExtensionAsync<IKHRDracoMeshCompression, Geometry>(context, primitive, this.name, (extensionContext, extension) => {
            if (primitive.mode != undefined) {
                if (primitive.mode !== MeshPrimitiveMode.TRIANGLES && primitive.mode !== MeshPrimitiveMode.TRIANGLE_STRIP) {
                    throw new Error(`${context}: Unsupported mode ${primitive.mode}`);
                }
            }

            const attributes: { [kind: string]: number } = {};
            const normalized: { [kind: string]: boolean } = {};
            const loadAttribute = (name: string, kind: string) => {
                const uniqueId = extension.attributes[name];
                if (uniqueId == undefined) {
                    return;
                }

                babylonMesh._delayInfo = babylonMesh._delayInfo || [];
                if (babylonMesh._delayInfo.indexOf(kind) === -1) {
                    babylonMesh._delayInfo.push(kind);
                }

                attributes[kind] = uniqueId;

                if (this.useNormalizedFlagFromAccessor) {
                    const accessor = ArrayItem.TryGet(this._loader.gltf.accessors, primitive.attributes[name]);
                    if (accessor) {
                        normalized[kind] = accessor.normalized || false;
                    }
                }
            };

            loadAttribute("POSITION", VertexBuffer.PositionKind);
            loadAttribute("NORMAL", VertexBuffer.NormalKind);
            loadAttribute("TANGENT", VertexBuffer.TangentKind);
            loadAttribute("TEXCOORD_0", VertexBuffer.UVKind);
            loadAttribute("TEXCOORD_1", VertexBuffer.UV2Kind);
            loadAttribute("TEXCOORD_2", VertexBuffer.UV3Kind);
            loadAttribute("TEXCOORD_3", VertexBuffer.UV4Kind);
            loadAttribute("TEXCOORD_4", VertexBuffer.UV5Kind);
            loadAttribute("TEXCOORD_5", VertexBuffer.UV6Kind);
            loadAttribute("JOINTS_0", VertexBuffer.MatricesIndicesKind);
            loadAttribute("WEIGHTS_0", VertexBuffer.MatricesWeightsKind);
            loadAttribute("COLOR_0", VertexBuffer.ColorKind);

            const bufferView = ArrayItem.Get(extensionContext, this._loader.gltf.bufferViews, extension.bufferView) as IBufferViewDraco;
            if (!bufferView._dracoBabylonGeometry) {
                bufferView._dracoBabylonGeometry = this._loader.loadBufferViewAsync(`/bufferViews/${bufferView.index}`, bufferView).then((data) => {
                    const dracoCompression = this.dracoCompression || DracoCompression.Default;
                    return dracoCompression._decodeMeshToGeometryForGltfAsync(babylonMesh.name, this._loader.babylonScene, data, attributes, normalized).catch((error) => {
                        throw new Error(`${context}: ${error.message}`);
                    });
                });
            }

            return bufferView._dracoBabylonGeometry;
        });
    }
}

GLTFLoader.RegisterExtension(NAME, (loader) => new KHR_draco_mesh_compression(loader));
