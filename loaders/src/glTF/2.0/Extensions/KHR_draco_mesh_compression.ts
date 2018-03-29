/// <reference path="../../../../../dist/preview release/babylon.d.ts"/>

module BABYLON.GLTF2.Extensions {
    // https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_draco_mesh_compression

    const NAME = "KHR_draco_mesh_compression";

    interface IKHRDracoMeshCompression {
        bufferView: number;
        attributes: { [name: string]: number };
    }

    export class KHR_draco_mesh_compression extends GLTFLoaderExtension {
        public readonly name = NAME;

        private _dracoCompression: Nullable<DracoCompression> = null;

        constructor(loader: GLTFLoader) {
            super(loader);

            // Disable extension if decoder is not available.
            if (!DracoCompression.DecoderUrl) {
                this.enabled = false;
            }
        }

        public dispose(): void {
            if (this._dracoCompression) {
                this._dracoCompression.dispose();
            }

            super.dispose();
        }

        protected _loadVertexDataAsync(context: string, primitive: ILoaderMeshPrimitive, babylonMesh: Mesh): Nullable<Promise<Geometry>> {
            return this._loadExtensionAsync<IKHRDracoMeshCompression, Geometry>(context, primitive, (extensionContext, extension) => {
                if (primitive.mode != undefined) {
                    if (primitive.mode !== MeshPrimitiveMode.TRIANGLE_STRIP &&
                        primitive.mode !== MeshPrimitiveMode.TRIANGLES) {
                        throw new Error(`${context}: Unsupported mode ${primitive.mode}`);
                    }

                    // TODO: handle triangle strips
                    if (primitive.mode === MeshPrimitiveMode.TRIANGLE_STRIP) {
                        throw new Error(`${context}: Mode ${primitive.mode} is not currently supported`);
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

                var bufferView = GLTFLoader._GetProperty(extensionContext, this._loader._gltf.bufferViews, extension.bufferView);
                return this._loader._loadBufferViewAsync(`#/bufferViews/${bufferView._index}`, bufferView).then(data => {
                    try {
                        if (!this._dracoCompression) {
                            this._dracoCompression = new DracoCompression();
                        }

                        return this._dracoCompression.decodeMeshAsync(data, attributes).then(babylonVertexData => {
                            const babylonGeometry = new Geometry(babylonMesh.name, this._loader._babylonScene);
                            babylonVertexData.applyToGeometry(babylonGeometry);
                            return babylonGeometry;
                        });
                    }
                    catch (e) {
                        throw new Error(`${context}: ${e.message}`);
                    }
                });
            });
        }
    }

    GLTFLoader._Register(NAME, loader => new KHR_draco_mesh_compression(loader));
}