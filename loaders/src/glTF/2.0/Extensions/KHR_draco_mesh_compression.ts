/// <reference path="../../../../../dist/preview release/babylon.d.ts"/>

module BABYLON.GLTF2.Extensions {
    // https://github.com/KhronosGroup/glTF/pull/874

    const NAME = "KHR_draco_mesh_compression";

    interface IKHRDracoMeshCompression {
        bufferView: number;
        attributes: { [name: string]: number };
    }

    export class KHR_draco_mesh_compression extends GLTFLoaderExtension {
        public readonly name = NAME;

        protected _loadVertexDataAsync(context: string, primitive: ILoaderMeshPrimitive, babylonMesh: Mesh): Nullable<Promise<VertexData>> {
            return this._loadExtensionAsync<IKHRDracoMeshCompression, VertexData>(context, primitive, (context, extension) => {
                if (primitive.mode != undefined) {
                    if (primitive.mode !== MeshPrimitiveMode.POINTS &&
                        primitive.mode !== MeshPrimitiveMode.TRIANGLE_STRIP &&
                        primitive.mode !== MeshPrimitiveMode.TRIANGLES) {
                        throw new Error(context + ": Unsupported mode " + primitive.mode);
                    }
                }

                const attributes: { [kind: string]: number } = {};
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
                };

                loadAttribute("POSITION", VertexBuffer.PositionKind);
                loadAttribute("NORMAL", VertexBuffer.NormalKind);
                loadAttribute("TANGENT", VertexBuffer.TangentKind);
                loadAttribute("TEXCOORD_0", VertexBuffer.UVKind);
                loadAttribute("TEXCOORD_1", VertexBuffer.UV2Kind);
                loadAttribute("JOINTS_0", VertexBuffer.MatricesIndicesKind);
                loadAttribute("WEIGHTS_0", VertexBuffer.MatricesWeightsKind);
                loadAttribute("COLOR_0", VertexBuffer.ColorKind);

                var bufferView = GLTFLoader._GetProperty(context, this._loader._gltf.bufferViews, extension.bufferView);
                return this._loader._loadBufferViewAsync("#/bufferViews/" + bufferView._index, bufferView).then(data => {
                    try {
                        return DracoCompression.Decode(data, attributes);
                    }
                    catch (e) {
                        throw new Error(context + ": " + e.message);
                    }
                });
            });
        }
    }

    if (DracoCompression.IsSupported) {
        GLTFLoader._Register(NAME, loader => new KHR_draco_mesh_compression(loader));
    }
}