/// <reference path="../../../../../dist/preview release/babylon.d.ts"/>

module BABYLON.GLTF2.Loader.Extensions {
    const NAME = "KHR_draco_mesh_compression";

    interface IKHRDracoMeshCompression {
        bufferView: number;
        attributes: { [name: string]: number };
    }

    interface IBufferViewDraco extends IBufferView {
        _dracoBabylonGeometry?: Promise<Geometry>;
    }

    /**
     * [Specification](https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_draco_mesh_compression)
     */
    export class KHR_draco_mesh_compression implements IGLTFLoaderExtension {
        /** The name of this extension. */
        public readonly name = NAME;

        /** Defines whether this extension is enabled. */
        public enabled = DracoCompression.DecoderAvailable;

        private _loader: GLTFLoader;
        private _dracoCompression?: DracoCompression;

        /** @hidden */
        constructor(loader: GLTFLoader) {
            this._loader = loader;
        }

        /** @hidden */
        public dispose(): void {
            if (this._dracoCompression) {
                this._dracoCompression.dispose();
                delete this._dracoCompression;
            }

            delete this._loader;
        }

        /** @hidden */
        public _loadVertexDataAsync(context: string, primitive: IMeshPrimitive, babylonMesh: Mesh): Nullable<Promise<Geometry>> {
            return GLTFLoader.LoadExtensionAsync<IKHRDracoMeshCompression, Geometry>(context, primitive, this.name, (extensionContext, extension) => {
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

                var bufferView = ArrayItem.Get(extensionContext, this._loader.gltf.bufferViews, extension.bufferView) as IBufferViewDraco;
                if (!bufferView._dracoBabylonGeometry) {
                    bufferView._dracoBabylonGeometry = this._loader.loadBufferViewAsync(`#/bufferViews/${bufferView.index}`, bufferView).then((data) => {
                        if (!this._dracoCompression) {
                            this._dracoCompression = new DracoCompression();
                        }

                        return this._dracoCompression.decodeMeshAsync(data, attributes).then((babylonVertexData) => {
                            const babylonGeometry = new Geometry(babylonMesh.name, this._loader.babylonScene);
                            babylonVertexData.applyToGeometry(babylonGeometry);
                            return babylonGeometry;
                        }).catch((error) => {
                            throw new Error(`${context}: ${error.message}`);
                        });
                    });
                }

                return bufferView._dracoBabylonGeometry;
            });
        }
    }

    GLTFLoader.RegisterExtension(NAME, (loader) => new KHR_draco_mesh_compression(loader));
}