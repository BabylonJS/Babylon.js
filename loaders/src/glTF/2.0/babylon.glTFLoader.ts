/// <reference path="../../../../dist/preview release/babylon.d.ts"/>

module BABYLON.GLTF2 {
    interface IFileRequestInfo extends IFileRequest {
        _lengthComputable?: boolean;
        _loaded?: number;
        _total?: number;
    }

    interface TypedArrayConstructor<T extends TypedArray> {
        readonly prototype: T;
        new(length: number): T;
        new(array: ArrayLike<number>): T;
        new(buffer: ArrayBuffer, byteOffset?: number, length?: number): T;

        readonly BYTES_PER_ELEMENT: number;
    }

    export interface MaterialConstructor<T extends Material> {
        readonly prototype: T;
        new(name: string, scene: Scene): T;
    }

    export class GLTFLoader implements IGLTFLoader {
        public _gltf: ILoaderGLTF;
        public _babylonScene: Scene;
        public _completePromises = new Array<Promise<void>>();

        private _disposed = false;
        private _state: Nullable<GLTFLoaderState> = null;
        private _extensions: { [name: string]: GLTFLoaderExtension } = {};
        private _rootUrl: string;
        private _rootBabylonMesh: Mesh;
        private _defaultSampler = {} as ILoaderSampler;
        private _defaultBabylonMaterials: { [drawMode: number]: PBRMaterial } = {};
        private _progressCallback?: (event: SceneLoaderProgressEvent) => void;
        private _requests = new Array<IFileRequestInfo>();

        private static _Names = new Array<string>();
        private static _Factories: { [name: string]: (loader: GLTFLoader) => GLTFLoaderExtension } = {};
        public static _Register(name: string, factory: (loader: GLTFLoader) => GLTFLoaderExtension): void {
            if (GLTFLoader._Factories[name]) {
                Tools.Error(`Extension with the name '${name}' already exists`);
                return;
            }

            GLTFLoader._Factories[name] = factory;

            // Keep the order of registration so that extensions registered first are called first.
            GLTFLoader._Names.push(name);
        }

        public coordinateSystemMode = GLTFLoaderCoordinateSystemMode.AUTO;
        public animationStartMode = GLTFLoaderAnimationStartMode.FIRST;
        public compileMaterials = false;
        public useClipPlane = false;
        public compileShadowGenerators = false;

        public readonly onDisposeObservable = new Observable<IGLTFLoader>();
        public readonly onMeshLoadedObservable = new Observable<AbstractMesh>();
        public readonly onTextureLoadedObservable = new Observable<BaseTexture>();
        public readonly onMaterialLoadedObservable = new Observable<Material>();
        public readonly onAnimationGroupLoadedObservable = new Observable<AnimationGroup>();
        public readonly onExtensionLoadedObservable = new Observable<IGLTFLoaderExtension>();
        public readonly onCompleteObservable = new Observable<IGLTFLoader>();

        public get state(): Nullable<GLTFLoaderState> {
            return this._state;
        }

        public dispose(): void {
            if (this._disposed) {
                return;
            }

            this._disposed = true;

            this.onDisposeObservable.notifyObservers(this);
            this.onDisposeObservable.clear();

            this._clear();
        }

        public importMeshAsync(meshesNames: any, scene: Scene, data: IGLTFLoaderData, rootUrl: string, onProgress?: (event: SceneLoaderProgressEvent) => void): Promise<{ meshes: AbstractMesh[], particleSystems: ParticleSystem[], skeletons: Skeleton[] }> {
            return Promise.resolve().then(() => {
                let nodes: Nullable<Array<ILoaderNode>> = null;

                if (meshesNames) {
                    const nodeMap: { [name: string]: ILoaderNode } = {};
                    if (this._gltf.nodes) {
                        for (const node of this._gltf.nodes) {
                            if (node.name) {
                                nodeMap[node.name] = node;
                            }
                        }
                    }

                    const names = (meshesNames instanceof Array) ? meshesNames : [meshesNames];
                    nodes = names.map(name => {
                        const node = nodeMap[name];
                        if (!node) {
                            throw new Error(`Failed to find node '${name}'`);
                        }

                        return node;
                    });
                }

                return this._loadAsync(nodes, scene, data, rootUrl, onProgress).then(() => {
                    return {
                        meshes: this._getMeshes(),
                        particleSystems: [],
                        skeletons: this._getSkeletons(),
                    };
                });
            });
        }

        public loadAsync(scene: Scene, data: IGLTFLoaderData, rootUrl: string, onProgress?: (event: SceneLoaderProgressEvent) => void): Promise<void> {
            return this._loadAsync(null, scene, data, rootUrl, onProgress);
        }

        private _loadAsync(nodes: Nullable<Array<ILoaderNode>>, scene: Scene, data: IGLTFLoaderData, rootUrl: string, onProgress?: (event: SceneLoaderProgressEvent) => void): Promise<void> {
            return Promise.resolve().then(() => {
                this._loadExtensions();

                this._babylonScene = scene;
                this._rootUrl = rootUrl;
                this._progressCallback = onProgress;
                this._state = GLTFLoaderState.Loading;

                this._loadData(data);
                this._checkExtensions();

                const promises = new Array<Promise<void>>();

                if (nodes) {
                    promises.push(this._loadNodesAsync(nodes));
                }
                else {
                    const scene = GLTFLoader._GetProperty(`#/scene`, this._gltf.scenes, this._gltf.scene || 0);
                    promises.push(this._loadSceneAsync(`#/scenes/${scene._index}`, scene));
                }

                if (this.compileMaterials) {
                    promises.push(this._compileMaterialsAsync());
                }

                if (this.compileShadowGenerators) {
                    promises.push(this._compileShadowGeneratorsAsync());
                }

                const resultPromise = Promise.all(promises).then(() => {
                    this._state = GLTFLoaderState.Ready;
                    this._startAnimations();
                });

                resultPromise.then(() => {
                    this._rootBabylonMesh.setEnabled(true);

                    Tools.SetImmediate(() => {
                        if (!this._disposed) {
                            Promise.all(this._completePromises).then(() => {
                                this._state = GLTFLoaderState.Complete;
                                this.onCompleteObservable.notifyObservers(this);
                                this.onCompleteObservable.clear();
                                this._clear();
                            }).catch(error => {
                                Tools.Error(`glTF Loader: ${error.message}`);
                                this._clear();
                            });
                        }
                    });
                });

                return resultPromise;
            }).catch(error => {
                Tools.Error(`glTF Loader: ${error.message}`);
                this._clear();
                throw error;
            });
        }

        private _loadExtensions(): void {
            for (const name of GLTFLoader._Names) {
                const extension = GLTFLoader._Factories[name](this);
                this._extensions[name] = extension;

                this.onExtensionLoadedObservable.notifyObservers(extension);
            }

            this.onExtensionLoadedObservable.clear();
        }

        private _loadData(data: IGLTFLoaderData): void {
            this._gltf = data.json as ILoaderGLTF;
            this._setupData();

            if (data.bin) {
                const buffers = this._gltf.buffers;
                if (buffers && buffers[0] && !buffers[0].uri) {
                    const binaryBuffer = buffers[0];
                    if (binaryBuffer.byteLength < data.bin.byteLength - 3 || binaryBuffer.byteLength > data.bin.byteLength) {
                        Tools.Warn(`Binary buffer length (${binaryBuffer.byteLength}) from JSON does not match chunk length (${data.bin.byteLength})`);
                    }

                    binaryBuffer._data = Promise.resolve(data.bin);
                }
                else {
                    Tools.Warn("Unexpected BIN chunk");
                }
            }
        }

        private _setupData(): void {
            ArrayItem.Assign(this._gltf.accessors);
            ArrayItem.Assign(this._gltf.animations);
            ArrayItem.Assign(this._gltf.buffers);
            ArrayItem.Assign(this._gltf.bufferViews);
            ArrayItem.Assign(this._gltf.cameras);
            ArrayItem.Assign(this._gltf.images);
            ArrayItem.Assign(this._gltf.materials);
            ArrayItem.Assign(this._gltf.meshes);
            ArrayItem.Assign(this._gltf.nodes);
            ArrayItem.Assign(this._gltf.samplers);
            ArrayItem.Assign(this._gltf.scenes);
            ArrayItem.Assign(this._gltf.skins);
            ArrayItem.Assign(this._gltf.textures);

            if (this._gltf.nodes) {
                const nodeParents: { [index: number]: number } = {};
                for (const node of this._gltf.nodes) {
                    if (node.children) {
                        for (const index of node.children) {
                            nodeParents[index] = node._index;
                        }
                    }
                }

                const rootNode = this._createRootNode();
                for (const node of this._gltf.nodes) {
                    const parentIndex = nodeParents[node._index];
                    node._parent = parentIndex === undefined ? rootNode : this._gltf.nodes[parentIndex];
                }
            }
        }

        private _checkExtensions(): void {
            if (this._gltf.extensionsRequired) {
                for (const name of this._gltf.extensionsRequired) {
                    const extension = this._extensions[name];
                    if (!extension || !extension.enabled) {
                        throw new Error(`Require extension ${name} is not available`);
                    }
                }
            }
        }

        private _createRootNode(): ILoaderNode {
            this._rootBabylonMesh = new Mesh("__root__", this._babylonScene);
            this._rootBabylonMesh.setEnabled(false);

            const rootNode = { _babylonMesh: this._rootBabylonMesh } as ILoaderNode;
            switch (this.coordinateSystemMode) {
                case GLTFLoaderCoordinateSystemMode.AUTO: {
                    if (!this._babylonScene.useRightHandedSystem) {
                        rootNode.rotation = [0, 1, 0, 0];
                        rootNode.scale = [1, 1, -1];
                        GLTFLoader._LoadTransform(rootNode, this._rootBabylonMesh);
                    }
                    break;
                }
                case GLTFLoaderCoordinateSystemMode.FORCE_RIGHT_HANDED: {
                    this._babylonScene.useRightHandedSystem = true;
                    break;
                }
                default: {
                    throw new Error(`Invalid coordinate system mode (${this.coordinateSystemMode})`);
                }
            }

            this.onMeshLoadedObservable.notifyObservers(this._rootBabylonMesh);
            return rootNode;
        }

        private _loadNodesAsync(nodes: ILoaderNode[], ): Promise<void> {
            const promises = new Array<Promise<void>>();

            for (let node of nodes) {
                promises.push(this._loadNodeAsync(`#/nodes/${node._index}`, node));
            }

            promises.push(this._loadAnimationsAsync());

            return Promise.all(promises).then(() => {});
        }

        public _loadSceneAsync(context: string, scene: ILoaderScene): Promise<void> {
            const promise = GLTFLoaderExtension._LoadSceneAsync(this, context, scene);
            if (promise) {
                return promise;
            }

            const promises = new Array<Promise<void>>();

            for (let index of scene.nodes) {
                const node = GLTFLoader._GetProperty(`${context}/nodes/${index}`, this._gltf.nodes, index);
                promises.push(this._loadNodeAsync(`#/nodes/${node._index}`, node));
            }

            promises.push(this._loadAnimationsAsync());

            return Promise.all(promises).then(() => {});
        }

        private _forEachPrimitive(node: ILoaderNode, callback: (babylonMesh: Mesh) => void): void {
            if (node._primitiveBabylonMeshes) {
                for (const babylonMesh of node._primitiveBabylonMeshes) {
                    callback(babylonMesh);
                }
            }
            else {
                callback(node._babylonMesh!);
            }
        }

        private _getMeshes(): Mesh[] {
            const meshes = new Array<Mesh>();

            // Root mesh is always first.
            meshes.push(this._rootBabylonMesh);

            const nodes = this._gltf.nodes;
            if (nodes) {
                for (const node of nodes) {
                    if (node._babylonMesh) {
                        meshes.push(node._babylonMesh);
                    }

                    if (node._primitiveBabylonMeshes) {
                        for (const babylonMesh of node._primitiveBabylonMeshes) {
                            meshes.push(babylonMesh);
                        }
                    }
                }
            }

            return meshes;
        }

        private _getSkeletons(): Skeleton[] {
            const skeletons = new Array<Skeleton>();

            const skins = this._gltf.skins;
            if (skins) {
                for (const skin of skins) {
                    if (skin._babylonSkeleton) {
                        skeletons.push(skin._babylonSkeleton);
                    }
                }
            }

            return skeletons;
        }

        private _startAnimations(): void {
            const animations = this._gltf.animations;
            if (!animations) {
                return;
            }

            switch (this.animationStartMode) {
                case GLTFLoaderAnimationStartMode.NONE: {
                    // do nothing
                    break;
                }
                case GLTFLoaderAnimationStartMode.FIRST: {
                    const animation = animations[0];
                    animation._babylonAnimationGroup!.start(true);
                    break;
                }
                case GLTFLoaderAnimationStartMode.ALL: {
                    for (const animation of animations) {
                        animation._babylonAnimationGroup!.start(true);
                    }
                    break;
                }
                default: {
                    Tools.Error(`Invalid animation start mode (${this.animationStartMode})`);
                    return;
                }
            }
        }

        public _loadNodeAsync(context: string, node: ILoaderNode): Promise<void> {
            const promise = GLTFLoaderExtension._LoadNodeAsync(this, context, node);
            if (promise) {
                return promise;
            }

            if (node._babylonMesh) {
                throw new Error(`${context}: Invalid recursive node hierarchy`);
            }

            const promises = new Array<Promise<void>>();

            const babylonMesh = new Mesh(node.name || `node${node._index}`, this._babylonScene, node._parent._babylonMesh);
            node._babylonMesh = babylonMesh;

            node._babylonAnimationTargets = node._babylonAnimationTargets || [];
            node._babylonAnimationTargets.push(babylonMesh);

            GLTFLoader._LoadTransform(node, babylonMesh);

            if (node.mesh != undefined) {
                const mesh = GLTFLoader._GetProperty(`${context}/mesh`, this._gltf.meshes, node.mesh);
                promises.push(this._loadMeshAsync(`#/meshes/${mesh._index}`, node, mesh, babylonMesh));
            }

            if (node.children) {
                for (const index of node.children) {
                    const childNode = GLTFLoader._GetProperty(`${context}/children/${index}`, this._gltf.nodes, index);
                    promises.push(this._loadNodeAsync(`#/nodes/${index}`, childNode));
                }
            }

            this.onMeshLoadedObservable.notifyObservers(babylonMesh);

            return Promise.all(promises).then(() => {});
        }

        private _loadMeshAsync(context: string, node: ILoaderNode, mesh: ILoaderMesh, babylonMesh: Mesh): Promise<void> {
            // TODO: instancing

            const promises = new Array<Promise<void>>();

            const primitives = mesh.primitives;
            if (!primitives || primitives.length === 0) {
                throw new Error(`${context}: Primitives are missing`);
            }

            ArrayItem.Assign(primitives);
            if (primitives.length === 1) {
                const primitive = primitives[0];
                promises.push(this._loadPrimitiveAsync(`${context}/primitives/${primitive._index}`, node, mesh, primitive, babylonMesh));
            }
            else {
                node._primitiveBabylonMeshes = [];
                for (const primitive of primitives) {
                    const primitiveBabylonMesh = new Mesh(`${mesh.name || babylonMesh.name}_${primitive._index}`, this._babylonScene, babylonMesh);
                    node._primitiveBabylonMeshes.push(primitiveBabylonMesh);
                    promises.push(this._loadPrimitiveAsync(`${context}/primitives/${primitive._index}`, node, mesh, primitive, primitiveBabylonMesh));
                    this.onMeshLoadedObservable.notifyObservers(babylonMesh);
                }
            }

            if (node.skin != undefined) {
                const skin = GLTFLoader._GetProperty(`${context}/skin`, this._gltf.skins, node.skin);
                promises.push(this._loadSkinAsync(`#/skins/${skin._index}`, node, mesh, skin));
            }

            return Promise.all(promises).then(() => {
                this._forEachPrimitive(node, babylonMesh => {
                    babylonMesh._refreshBoundingInfo(true);
                });
            });
        }

        private _loadPrimitiveAsync(context: string, node: ILoaderNode, mesh: ILoaderMesh, primitive: ILoaderMeshPrimitive, babylonMesh: Mesh): Promise<void> {
            const promises = new Array<Promise<void>>();

            this._createMorphTargets(context, node, mesh, primitive, babylonMesh);

            promises.push(this._loadVertexDataAsync(context, primitive, babylonMesh).then(babylonVertexData => {
                new Geometry(babylonMesh.name, this._babylonScene, babylonVertexData, false, babylonMesh);
                return this._loadMorphTargetsAsync(context, primitive, babylonMesh, babylonVertexData);
            }));

            const babylonDrawMode = GLTFLoader._GetDrawMode(context, primitive.mode);
            if (primitive.material == undefined) {
                babylonMesh.material = this._getDefaultMaterial(babylonDrawMode);
            }
            else {
                const material = GLTFLoader._GetProperty(`${context}/material}`, this._gltf.materials, primitive.material);
                promises.push(this._loadMaterialAsync(`#/materials/${material._index}`, material, babylonMesh, babylonDrawMode, babylonMaterial => {
                    babylonMesh.material = babylonMaterial;
                }));
            }

            return Promise.all(promises).then(() => {});
        }

        private _loadVertexDataAsync(context: string, primitive: ILoaderMeshPrimitive, babylonMesh: Mesh): Promise<VertexData> {
            const promise = GLTFLoaderExtension._LoadVertexDataAsync(this, context, primitive, babylonMesh);
            if (promise) {
                return promise;
            }

            const attributes = primitive.attributes;
            if (!attributes) {
                throw new Error(`${context}: Attributes are missing`);
            }

            const promises = new Array<Promise<void>>();

            const babylonVertexData = new VertexData();

            if (primitive.indices == undefined) {
                const positionAccessorIndex = attributes["POSITION"];
                if (positionAccessorIndex != undefined) {
                    const accessor = GLTFLoader._GetProperty(`${context}/attributes/POSITION`, this._gltf.accessors, positionAccessorIndex);
                    babylonVertexData.indices = new Uint32Array(accessor.count);
                    for (let i = 0; i < babylonVertexData.indices.length; i++) {
                        babylonVertexData.indices[i] = i;
                    }
                }
            }
            else {
                const indicesAccessor = GLTFLoader._GetProperty(`${context}/indices`, this._gltf.accessors, primitive.indices);
                promises.push(this._loadAccessorAsync(`#/accessors/${indicesAccessor._index}`, indicesAccessor).then(data => {
                    babylonVertexData.indices = data as IndicesArray;
                }));
            }

            const loadAttribute = (attribute: string, kind: string) => {
                if (attributes[attribute] == undefined) {
                    return;
                }

                babylonMesh._delayInfo = babylonMesh._delayInfo || [];
                if (babylonMesh._delayInfo.indexOf(kind) === -1) {
                    babylonMesh._delayInfo.push(kind);
                }

                if (attribute === "COLOR_0") {
                    // Assume vertex color has alpha on the mesh. The alphaMode of the material controls whether the material should use alpha or not.
                    babylonMesh.hasVertexAlpha = true;
                }

                const accessor = GLTFLoader._GetProperty(`${context}/attributes/${attribute}`, this._gltf.accessors, attributes[attribute]);

                promises.push(this._loadAccessorAsync(`#/accessors/${accessor._index}`, accessor).then(data => {
                    let attributeData = GLTFLoader._ConvertToFloat32Array(context, accessor, data);

                    if (attribute === "COLOR_0" && accessor.type === "VEC3") {
                        attributeData = GLTFLoader._ConvertVec3ToVec4(context, attributeData);
                    }

                    babylonVertexData.set(attributeData, kind);
                }));
            };

            loadAttribute("POSITION", VertexBuffer.PositionKind);
            loadAttribute("NORMAL", VertexBuffer.NormalKind);
            loadAttribute("TANGENT", VertexBuffer.TangentKind);
            loadAttribute("TEXCOORD_0", VertexBuffer.UVKind);
            loadAttribute("TEXCOORD_1", VertexBuffer.UV2Kind);
            loadAttribute("JOINTS_0", VertexBuffer.MatricesIndicesKind);
            loadAttribute("WEIGHTS_0", VertexBuffer.MatricesWeightsKind);
            loadAttribute("COLOR_0", VertexBuffer.ColorKind);

            return Promise.all(promises).then(() => {
                return babylonVertexData;
            });
        }

        private _createMorphTargets(context: string, node: ILoaderNode, mesh: ILoaderMesh, primitive: IMeshPrimitive, babylonMesh: Mesh): void {
            if (!primitive.targets) {
                return;
            }

            if (node._numMorphTargets == undefined) {
                node._numMorphTargets = primitive.targets.length;
            }
            else if (primitive.targets.length !== node._numMorphTargets) {
                throw new Error(`${context}: Primitives do not have the same number of targets`);
            }

            babylonMesh.morphTargetManager = new MorphTargetManager();
            for (let index = 0; index < primitive.targets.length; index++) {
                const weight = node.weights ? node.weights[index] : mesh.weights ? mesh.weights[index] : 0;
                babylonMesh.morphTargetManager.addTarget(new MorphTarget(`morphTarget${index}`, weight));
                // TODO: tell the target whether it has positions, normals, tangents
            }
        }

        private _loadMorphTargetsAsync(context: string, primitive: IMeshPrimitive, babylonMesh: Mesh, babylonVertexData: VertexData): Promise<void> {
            if (!primitive.targets) {
                return Promise.resolve();
            }

            const promises = new Array<Promise<void>>();

            const morphTargetManager = babylonMesh.morphTargetManager!;
            for (let index = 0; index < morphTargetManager.numTargets; index++) {
                const babylonMorphTarget = morphTargetManager.getTarget(index);
                promises.push(this._loadMorphTargetVertexDataAsync(`${context}/targets/${index}`, babylonVertexData, primitive.targets[index], babylonMorphTarget));
            }

            return Promise.all(promises).then(() => {});
        }

        private _loadMorphTargetVertexDataAsync(context: string, babylonVertexData: VertexData, attributes: { [name: string]: number }, babylonMorphTarget: MorphTarget): Promise<void> {
            const promises = new Array<Promise<void>>();

            const loadAttribute = (attribute: string, setData: (data: Float32Array) => void) => {
                if (attributes[attribute] == undefined) {
                    return;
                }

                const accessor = GLTFLoader._GetProperty(`${context}/${attribute}`, this._gltf.accessors, attributes[attribute]);
                promises.push(this._loadAccessorAsync(`#/accessors/${accessor._index}`, accessor).then(data => {
                    setData(data as Float32Array);
                }));
            };

            loadAttribute("POSITION", data => {
                if (babylonVertexData.positions) {
                    for (let i = 0; i < data.length; i++) {
                        data[i] += babylonVertexData.positions[i];
                    }
                    babylonMorphTarget.setPositions(data);
                }
            });

            loadAttribute("NORMAL", data => {
                if (babylonVertexData.normals) {
                    for (let i = 0; i < data.length; i++) {
                        data[i] += babylonVertexData.normals[i];
                    }
                    babylonMorphTarget.setNormals(data);
                }
            });

            loadAttribute("TANGENT", data => {
                if (babylonVertexData.tangents) {
                    // Tangent data for morph targets is stored as xyz delta.
                    // The vertexData.tangent is stored as xyzw.
                    // So we need to skip every fourth vertexData.tangent.
                    for (let i = 0, j = 0; i < data.length; i++) {
                        data[i] += babylonVertexData.tangents[j++];
                        if ((i + 1) % 3 == 0) {
                            j++;
                        }
                    }
                    babylonMorphTarget.setTangents(data);
                }
            });

            return Promise.all(promises).then(() => {});
        }

        private static _ConvertToFloat32Array(context: string, accessor: ILoaderAccessor, data: TypedArray): Float32Array {
            if (accessor.componentType == AccessorComponentType.FLOAT) {
                return data as Float32Array;
            }

            let factor = 1;
            if (accessor.normalized) {
                switch (accessor.componentType) {
                    case AccessorComponentType.UNSIGNED_BYTE: {
                        factor = 1 / 255;
                        break;
                    }
                    case AccessorComponentType.UNSIGNED_SHORT: {
                        factor = 1 / 65535;
                        break;
                    }
                    default: {
                        throw new Error(`${context}: Invalid component type (${accessor.componentType})`);
                    }
                }
            }

            const result = new Float32Array(accessor.count * GLTFLoader._GetNumComponents(context, accessor.type));
            for (let i = 0; i < result.length; i++) {
                result[i] = data[i] * factor;
            }

            return result;
        }

        private static _ConvertVec3ToVec4(context: string, data: Float32Array): Float32Array {
            const result = new Float32Array(data.length / 3 * 4);

            let offset = 0;
            for (let i = 0; i < result.length; i++) {
                if ((i + 1) % 4 === 0) {
                    result[i] = 1;
                }
                else {
                    result[i] = data[offset++];
                }
            }

            return result;
        }

        private static _LoadTransform(node: ILoaderNode, babylonNode: TransformNode): void {
            let position = Vector3.Zero();
            let rotation = Quaternion.Identity();
            let scaling = Vector3.One();

            if (node.matrix) {
                const matrix = Matrix.FromArray(node.matrix);
                matrix.decompose(scaling, rotation, position);
            }
            else {
                if (node.translation) position = Vector3.FromArray(node.translation);
                if (node.rotation) rotation = Quaternion.FromArray(node.rotation);
                if (node.scale) scaling = Vector3.FromArray(node.scale);
            }

            babylonNode.position = position;
            babylonNode.rotationQuaternion = rotation;
            babylonNode.scaling = scaling;
        }

        private _loadSkinAsync(context: string, node: ILoaderNode, mesh: ILoaderMesh, skin: ILoaderSkin): Promise<void> {
            const assignSkeleton = () => {
                this._forEachPrimitive(node, babylonMesh => {
                    babylonMesh.skeleton = skin._babylonSkeleton!;
                });

                node._babylonMesh!.parent = this._rootBabylonMesh;
                node._babylonMesh!.position = Vector3.Zero();
                node._babylonMesh!.rotationQuaternion = Quaternion.Identity();
                node._babylonMesh!.scaling = Vector3.One();
            };

            if (skin._loaded) {
                return skin._loaded.then(() => {
                    assignSkeleton();
                });
            }

            // TODO: split into two parts so that bones are created before inverseBindMatricesData is loaded (for compiling materials).

            return (skin._loaded = this._loadSkinInverseBindMatricesDataAsync(context, skin).then(inverseBindMatricesData => {
                const skeletonId = `skeleton${skin._index}`;
                const babylonSkeleton = new Skeleton(skin.name || skeletonId, skeletonId, this._babylonScene);
                skin._babylonSkeleton = babylonSkeleton;
                this._loadBones(context, skin, inverseBindMatricesData);
                assignSkeleton();
            }));
        }

        private _loadSkinInverseBindMatricesDataAsync(context: string, skin: ILoaderSkin): Promise<Nullable<Float32Array>> {
            if (skin.inverseBindMatrices == undefined) {
                return Promise.resolve(null);
            }

            const accessor = GLTFLoader._GetProperty(`${context}/inverseBindMatrices`, this._gltf.accessors, skin.inverseBindMatrices);
            return this._loadAccessorAsync(`#/accessors/${accessor._index}`, accessor).then(data => {
                return data as Float32Array;
            });
        }

        private _createBone(node: ILoaderNode, skin: ILoaderSkin, parent: Nullable<Bone>, localMatrix: Matrix, baseMatrix: Matrix, index: number): Bone {
            const babylonBone = new Bone(node.name || `joint${node._index}`, skin._babylonSkeleton!, parent, localMatrix, null, baseMatrix, index);

            node._babylonAnimationTargets = node._babylonAnimationTargets || [];
            node._babylonAnimationTargets.push(babylonBone);

            return babylonBone;
        }

        private _loadBones(context: string, skin: ILoaderSkin, inverseBindMatricesData: Nullable<Float32Array>): void {
            const babylonBones: { [index: number]: Bone } = {};
            for (const index of skin.joints) {
                const node = GLTFLoader._GetProperty(`${context}/joints/${index}`, this._gltf.nodes, index);
                this._loadBone(node, skin, inverseBindMatricesData, babylonBones);
            }
        }

        private _loadBone(node: ILoaderNode, skin: ILoaderSkin, inverseBindMatricesData: Nullable<Float32Array>, babylonBones: { [index: number]: Bone }): Bone {
            let babylonBone = babylonBones[node._index];
            if (babylonBone) {
                return babylonBone;
            }

            const boneIndex = skin.joints.indexOf(node._index);

            let baseMatrix = Matrix.Identity();
            if (inverseBindMatricesData && boneIndex !== -1) {
                baseMatrix = Matrix.FromArray(inverseBindMatricesData, boneIndex * 16);
                baseMatrix.invertToRef(baseMatrix);
            }

            let babylonParentBone: Nullable<Bone> = null;
            if (node._parent._babylonMesh !== this._rootBabylonMesh) {
                babylonParentBone = this._loadBone(node._parent, skin, inverseBindMatricesData, babylonBones);
                baseMatrix.multiplyToRef(babylonParentBone.getInvertedAbsoluteTransform(), baseMatrix);
            }

            babylonBone = this._createBone(node, skin, babylonParentBone, this._getNodeMatrix(node), baseMatrix, boneIndex);
            babylonBones[node._index] = babylonBone;
            return babylonBone;
        }

        private _getNodeMatrix(node: ILoaderNode): Matrix {
            return node.matrix ?
                Matrix.FromArray(node.matrix) :
                Matrix.Compose(
                    node.scale ? Vector3.FromArray(node.scale) : Vector3.One(),
                    node.rotation ? Quaternion.FromArray(node.rotation) : Quaternion.Identity(),
                    node.translation ? Vector3.FromArray(node.translation) : Vector3.Zero());
        }

        private _loadAnimationsAsync(): Promise<void> {
            const animations = this._gltf.animations;
            if (!animations) {
                return Promise.resolve();
            }

            const promises = new Array<Promise<void>>();

            for (let index = 0; index < animations.length; index++) {
                const animation = animations[index];
                promises.push(this._loadAnimationAsync(`#/animations/${index}`, animation));
            }

            return Promise.all(promises).then(() => {});
        }

        private _loadAnimationAsync(context: string, animation: ILoaderAnimation): Promise<void> {
            const babylonAnimationGroup = new AnimationGroup(animation.name || `animation${animation._index}`, this._babylonScene);
            animation._babylonAnimationGroup = babylonAnimationGroup;

            const promises = new Array<Promise<void>>();

            ArrayItem.Assign(animation.channels);
            ArrayItem.Assign(animation.samplers);

            for (const channel of animation.channels) {
                promises.push(this._loadAnimationChannelAsync(`${context}/channels/${channel._index}`, context, animation, channel, babylonAnimationGroup));
            }

            this.onAnimationGroupLoadedObservable.notifyObservers(babylonAnimationGroup);

            return Promise.all(promises).then(() => {
                babylonAnimationGroup.normalize();
            });
        }

        private _loadAnimationChannelAsync(context: string, animationContext: string, animation: ILoaderAnimation, channel: ILoaderAnimationChannel, babylonAnimationGroup: AnimationGroup): Promise<void> {
            const targetNode = GLTFLoader._GetProperty(`${context}/target/node`, this._gltf.nodes, channel.target.node);
            if (!targetNode._babylonMesh || targetNode.skin != undefined) {
                return Promise.resolve();
            }

            const sampler = GLTFLoader._GetProperty(`${context}/sampler`, animation.samplers, channel.sampler);
            return this._loadAnimationSamplerAsync(`${animationContext}/samplers/${channel.sampler}`, sampler).then(data => {
                let targetPath: string;
                let animationType: number;
                switch (channel.target.path) {
                    case AnimationChannelTargetPath.TRANSLATION: {
                        targetPath = "position";
                        animationType = Animation.ANIMATIONTYPE_VECTOR3;
                        break;
                    }
                    case AnimationChannelTargetPath.ROTATION: {
                        targetPath = "rotationQuaternion";
                        animationType = Animation.ANIMATIONTYPE_QUATERNION;
                        break;
                    }
                    case AnimationChannelTargetPath.SCALE: {
                        targetPath = "scaling";
                        animationType = Animation.ANIMATIONTYPE_VECTOR3;
                        break;
                    }
                    case AnimationChannelTargetPath.WEIGHTS: {
                        targetPath = "influence";
                        animationType = Animation.ANIMATIONTYPE_FLOAT;
                        break;
                    }
                    default: {
                        throw new Error(`${context}: Invalid target path (${channel.target.path})`);
                    }
                }

                let outputBufferOffset = 0;
                let getNextOutputValue: () => Vector3 | Quaternion | Array<number>;
                switch (targetPath) {
                    case "position": {
                        getNextOutputValue = () => {
                            const value = Vector3.FromArray(data.output, outputBufferOffset);
                            outputBufferOffset += 3;
                            return value;
                        };
                        break;
                    }
                    case "rotationQuaternion": {
                        getNextOutputValue = () => {
                            const value = Quaternion.FromArray(data.output, outputBufferOffset);
                            outputBufferOffset += 4;
                            return value;
                        };
                        break;
                    }
                    case "scaling": {
                        getNextOutputValue = () => {
                            const value = Vector3.FromArray(data.output, outputBufferOffset);
                            outputBufferOffset += 3;
                            return value;
                        };
                        break;
                    }
                    case "influence": {
                        getNextOutputValue = () => {
                            const value = new Array<number>(targetNode._numMorphTargets!);
                            for (let i = 0; i < targetNode._numMorphTargets!; i++) {
                                value[i] = data.output[outputBufferOffset++];
                            }
                            return value;
                        };
                        break;
                    }
                }

                let getNextKey: (frameIndex: number) => IAnimationKey;
                switch (data.interpolation) {
                    case AnimationSamplerInterpolation.STEP: {
                        getNextKey = frameIndex => ({
                            frame: data.input[frameIndex],
                            value: getNextOutputValue(),
                            interpolation: AnimationKeyInterpolation.STEP
                        });
                        break;
                    }
                    case AnimationSamplerInterpolation.LINEAR: {
                        getNextKey = frameIndex => ({
                            frame: data.input[frameIndex],
                            value: getNextOutputValue()
                        });
                        break;
                    }
                    case AnimationSamplerInterpolation.CUBICSPLINE: {
                        getNextKey = frameIndex => ({
                            frame: data.input[frameIndex],
                            inTangent: getNextOutputValue(),
                            value: getNextOutputValue(),
                            outTangent: getNextOutputValue()
                        });
                        break;
                    }
                }

                const keys = new Array(data.input.length);
                for (let frameIndex = 0; frameIndex < data.input.length; frameIndex++) {
                    keys[frameIndex] = getNextKey!(frameIndex);
                }

                if (targetPath === "influence") {
                    for (let targetIndex = 0; targetIndex < targetNode._numMorphTargets!; targetIndex++) {
                        const animationName = `${babylonAnimationGroup.name}_channel${babylonAnimationGroup.targetedAnimations.length}`;
                        const babylonAnimation = new Animation(animationName, targetPath, 1, animationType);
                        babylonAnimation.setKeys(keys.map(key => ({
                            frame: key.frame,
                            inTangent: key.inTangent ? key.inTangent[targetIndex] : undefined,
                            value: key.value[targetIndex],
                            outTangent: key.outTangent ? key.outTangent[targetIndex] : undefined
                        })));

                        this._forEachPrimitive(targetNode, babylonMesh => {
                            const morphTarget = babylonMesh.morphTargetManager!.getTarget(targetIndex);
                            babylonAnimationGroup.addTargetedAnimation(babylonAnimation, morphTarget);
                        });
                    }
                }
                else {
                    const animationName = `${babylonAnimationGroup.name}_channel${babylonAnimationGroup.targetedAnimations.length}`;
                    const babylonAnimation = new Animation(animationName, targetPath, 1, animationType);
                    babylonAnimation.setKeys(keys);

                    if (targetNode._babylonAnimationTargets) {
                        for (const target of targetNode._babylonAnimationTargets) {
                            babylonAnimationGroup.addTargetedAnimation(babylonAnimation, target);
                        }
                    }
                }
            });
        }

        private _loadAnimationSamplerAsync(context: string, sampler: ILoaderAnimationSampler): Promise<ILoaderAnimationSamplerData> {
            if (sampler._data) {
                return sampler._data;
            }

            const interpolation = sampler.interpolation || AnimationSamplerInterpolation.LINEAR;
            switch (interpolation) {
                case AnimationSamplerInterpolation.STEP:
                case AnimationSamplerInterpolation.LINEAR:
                case AnimationSamplerInterpolation.CUBICSPLINE: {
                    break;
                }
                default: {
                    throw new Error(`${context}: Invalid interpolation (${sampler.interpolation})`);
                }
            }

            let inputData: Nullable<Float32Array>;
            let outputData: Nullable<Float32Array>;

            const inputAccessor = GLTFLoader._GetProperty(`${context}/input`, this._gltf.accessors, sampler.input);
            const outputAccessor = GLTFLoader._GetProperty(`${context}/output`, this._gltf.accessors, sampler.output);

            sampler._data = Promise.all([
                this._loadAccessorAsync(`#/accessors/${inputAccessor._index}`, inputAccessor).then(data => {
                    inputData = data as Float32Array;
                }),
                this._loadAccessorAsync(`#/accessors/${outputAccessor._index}`, outputAccessor).then(data => {
                    outputData = data as Float32Array;
                })
            ]).then(() => {
                return {
                    input: inputData!,
                    interpolation: interpolation,
                    output: outputData!,
                };
            });

            return sampler._data;
        }

        private _loadBufferAsync(context: string, buffer: ILoaderBuffer): Promise<ArrayBufferView> {
            if (buffer._data) {
                return buffer._data;
            }

            if (!buffer.uri) {
                throw new Error(`${context}: Uri is missing`);
            }

            buffer._data = this._loadUriAsync(context, buffer.uri);

            return buffer._data;
        }

        public _loadBufferViewAsync(context: string, bufferView: ILoaderBufferView): Promise<ArrayBufferView> {
            if (bufferView._data) {
                return bufferView._data;
            }

            const buffer = GLTFLoader._GetProperty(`${context}/buffer`, this._gltf.buffers, bufferView.buffer);
            bufferView._data = this._loadBufferAsync(`#/buffers/${buffer._index}`, buffer).then(bufferData => {
                try {
                    return new Uint8Array(bufferData.buffer, bufferData.byteOffset + (bufferView.byteOffset || 0), bufferView.byteLength);
                }
                catch (e) {
                    throw new Error(`${context}: ${e.message}`);
                }
            });

            return bufferView._data;
        }

        private _loadAccessorAsync(context: string, accessor: ILoaderAccessor): Promise<TypedArray> {
            if (accessor.sparse) {
                throw new Error(`${context}: Sparse accessors are not currently supported`);
            }

            if (accessor._data) {
                return accessor._data;
            }

            const bufferView = GLTFLoader._GetProperty(`${context}/bufferView`, this._gltf.bufferViews, accessor.bufferView);
            accessor._data = this._loadBufferViewAsync(`#/bufferViews/${bufferView._index}`, bufferView).then(bufferViewData => {
                const numComponents = GLTFLoader._GetNumComponents(context, accessor.type);
                const byteOffset = accessor.byteOffset || 0;
                const byteStride = bufferView.byteStride;

                if (byteStride === 0) {
                    Tools.Warn(`${context}: Byte stride of 0 is not valid`);
                }

                try {
                    switch (accessor.componentType) {
                        case AccessorComponentType.BYTE: {
                            return this._buildArrayBuffer(Float32Array, bufferViewData, byteOffset, accessor.count, numComponents, byteStride);
                        }
                        case AccessorComponentType.UNSIGNED_BYTE: {
                            return this._buildArrayBuffer(Uint8Array, bufferViewData, byteOffset, accessor.count, numComponents, byteStride);
                        }
                        case AccessorComponentType.SHORT: {
                            return this._buildArrayBuffer(Int16Array, bufferViewData, byteOffset, accessor.count, numComponents, byteStride);
                        }
                        case AccessorComponentType.UNSIGNED_SHORT: {
                            return this._buildArrayBuffer(Uint16Array, bufferViewData, byteOffset, accessor.count, numComponents, byteStride);
                        }
                        case AccessorComponentType.UNSIGNED_INT: {
                            return this._buildArrayBuffer(Uint32Array, bufferViewData, byteOffset, accessor.count, numComponents, byteStride);
                        }
                        case AccessorComponentType.FLOAT: {
                            return this._buildArrayBuffer(Float32Array, bufferViewData, byteOffset, accessor.count, numComponents, byteStride);
                        }
                        default: {
                            throw new Error(`${context}: Invalid component type (${accessor.componentType})`);
                        }
                    }
                }
                catch (e) {
                    throw new Error(`${context}: ${e.messsage}`);
                }
            });

            return accessor._data;
        }

        private _buildArrayBuffer<T extends TypedArray>(typedArray: TypedArrayConstructor<T>, data: ArrayBufferView, byteOffset: number, count: number, numComponents: number, byteStride?: number): T {
            byteOffset += data.byteOffset;

            const targetLength = count * numComponents;

            if (!byteStride || byteStride === numComponents * typedArray.BYTES_PER_ELEMENT) {
                return new typedArray(data.buffer, byteOffset, targetLength);
            }

            const elementStride = byteStride / typedArray.BYTES_PER_ELEMENT;
            const sourceBuffer = new typedArray(data.buffer, byteOffset, elementStride * count);
            const targetBuffer = new typedArray(targetLength);
            let sourceIndex = 0;
            let targetIndex = 0;

            while (targetIndex < targetLength) {
                for (let componentIndex = 0; componentIndex < numComponents; componentIndex++) {
                    targetBuffer[targetIndex] = sourceBuffer[sourceIndex + componentIndex];
                    targetIndex++;
                }
                sourceIndex += elementStride;
            }

            return targetBuffer;
        }

        private _getDefaultMaterial(drawMode: number): Material {
            let babylonMaterial = this._defaultBabylonMaterials[drawMode];
            if (!babylonMaterial) {
                babylonMaterial = this._createMaterial(PBRMaterial, "__gltf_default", drawMode);
                babylonMaterial.transparencyMode = PBRMaterial.PBRMATERIAL_OPAQUE;
                babylonMaterial.metallic = 1;
                babylonMaterial.roughness = 1;
                this.onMaterialLoadedObservable.notifyObservers(babylonMaterial);
            }

            return babylonMaterial;
        }

        private _loadMaterialMetallicRoughnessPropertiesAsync(context: string, material: ILoaderMaterial, babylonMaterial: PBRMaterial): Promise<void> {
            const promises = new Array<Promise<void>>();

            // Ensure metallic workflow
            babylonMaterial.metallic = 1;
            babylonMaterial.roughness = 1;

            const properties = material.pbrMetallicRoughness;
            if (properties) {
                if (properties.baseColorFactor) {
                    babylonMaterial.albedoColor = Color3.FromArray(properties.baseColorFactor);
                    babylonMaterial.alpha = properties.baseColorFactor[3];
                }
                else {
                    babylonMaterial.albedoColor = Color3.White();
                }

                babylonMaterial.metallic = properties.metallicFactor == undefined ? 1 : properties.metallicFactor;
                babylonMaterial.roughness = properties.roughnessFactor == undefined ? 1 : properties.roughnessFactor;

                if (properties.baseColorTexture) {
                    promises.push(this._loadTextureAsync(`${context}/baseColorTexture`, properties.baseColorTexture, texture => {
                        babylonMaterial.albedoTexture = texture;
                    }));
                }

                if (properties.metallicRoughnessTexture) {
                    promises.push(this._loadTextureAsync(`${context}/metallicRoughnessTexture`, properties.metallicRoughnessTexture, texture => {
                        babylonMaterial.metallicTexture = texture;
                    }));

                    babylonMaterial.useMetallnessFromMetallicTextureBlue = true;
                    babylonMaterial.useRoughnessFromMetallicTextureGreen = true;
                    babylonMaterial.useRoughnessFromMetallicTextureAlpha = false;
                }
            }

            this._loadMaterialAlphaProperties(context, material, babylonMaterial);

            return Promise.all(promises).then(() => {});
        }

        public _loadMaterialAsync(context: string, material: ILoaderMaterial, babylonMesh: Mesh, babylonDrawMode: number, assign: (babylonMaterial: Material) => void): Promise<void> {
            const promise = GLTFLoaderExtension._LoadMaterialAsync(this, context, material, babylonMesh, babylonDrawMode, assign);
            if (promise) {
                return promise;
            }

            material._babylonData = material._babylonData || {};
            let babylonData = material._babylonData[babylonDrawMode];
            if (!babylonData) {
                const promises = new Array<Promise<void>>();

                const name = material.name || `materialSG_${material._index}`;
                const babylonMaterial = this._createMaterial(PBRMaterial, name, babylonDrawMode);

                promises.push(this._loadMaterialBasePropertiesAsync(context, material, babylonMaterial));
                promises.push(this._loadMaterialMetallicRoughnessPropertiesAsync(context, material, babylonMaterial));

                this.onMaterialLoadedObservable.notifyObservers(babylonMaterial);

                babylonData = {
                    material: babylonMaterial,
                    meshes: [],
                    loaded: Promise.all(promises).then(() => {})
                };

                material._babylonData[babylonDrawMode] = babylonData;
            }

            babylonData.meshes.push(babylonMesh);

            assign(babylonData.material);
            return babylonData.loaded;
        }

        public _createMaterial<T extends Material>(type: MaterialConstructor<T>, name: string, drawMode: number): T {
            const babylonMaterial = new type(name, this._babylonScene);
            babylonMaterial.sideOrientation = this._babylonScene.useRightHandedSystem ? Material.CounterClockWiseSideOrientation : Material.ClockWiseSideOrientation;
            babylonMaterial.fillMode = drawMode;
            return babylonMaterial;
        }

        public _loadMaterialBasePropertiesAsync(context: string, material: ILoaderMaterial, babylonMaterial: PBRMaterial): Promise<void> {
            const promises = new Array<Promise<void>>();

            babylonMaterial.emissiveColor = material.emissiveFactor ? Color3.FromArray(material.emissiveFactor) : new Color3(0, 0, 0);
            if (material.doubleSided) {
                babylonMaterial.backFaceCulling = false;
                babylonMaterial.twoSidedLighting = true;
            }

            if (material.normalTexture) {
                promises.push(this._loadTextureAsync(`${context}/normalTexture`, material.normalTexture, texture => {
                    babylonMaterial.bumpTexture = texture;
                }));

                babylonMaterial.invertNormalMapX = !this._babylonScene.useRightHandedSystem;
                babylonMaterial.invertNormalMapY = this._babylonScene.useRightHandedSystem;
                if (material.normalTexture.scale != undefined) {
                    babylonMaterial.bumpTexture.level = material.normalTexture.scale;
                }
            }

            if (material.occlusionTexture) {
                promises.push(this._loadTextureAsync(`${context}/occlusionTexture`, material.occlusionTexture, texture => {
                    babylonMaterial.ambientTexture = texture;
                }));

                babylonMaterial.useAmbientInGrayScale = true;
                if (material.occlusionTexture.strength != undefined) {
                    babylonMaterial.ambientTextureStrength = material.occlusionTexture.strength;
                }
            }

            if (material.emissiveTexture) {
                promises.push(this._loadTextureAsync(`${context}/emissiveTexture`, material.emissiveTexture, texture => {
                    babylonMaterial.emissiveTexture = texture;
                }));
            }

            return Promise.all(promises).then(() => {});
        }

        public _loadMaterialAlphaProperties(context: string, material: ILoaderMaterial, babylonMaterial: PBRMaterial): void {
            const alphaMode = material.alphaMode || MaterialAlphaMode.OPAQUE;
            switch (alphaMode) {
                case MaterialAlphaMode.OPAQUE: {
                    babylonMaterial.transparencyMode = PBRMaterial.PBRMATERIAL_OPAQUE;
                    break;
                }
                case MaterialAlphaMode.MASK: {
                    babylonMaterial.transparencyMode = PBRMaterial.PBRMATERIAL_ALPHATEST;
                    babylonMaterial.alphaCutOff = (material.alphaCutoff == undefined ? 0.5 : material.alphaCutoff);
                    if (babylonMaterial.albedoTexture) {
                        babylonMaterial.albedoTexture.hasAlpha = true;
                    }
                    break;
                }
                case MaterialAlphaMode.BLEND: {
                    babylonMaterial.transparencyMode = PBRMaterial.PBRMATERIAL_ALPHABLEND;
                    if (babylonMaterial.albedoTexture) {
                        babylonMaterial.albedoTexture.hasAlpha = true;
                        babylonMaterial.useAlphaFromAlbedoTexture = true;
                    }
                    break;
                }
                default: {
                    throw new Error(`${context}: Invalid alpha mode (${material.alphaMode})`);
                }
            }
        }

        public _loadTextureAsync(context: string, textureInfo: ITextureInfo, assign: (texture: Texture) => void): Promise<void> {
            const texture = GLTFLoader._GetProperty(`${context}/index`, this._gltf.textures, textureInfo.index);
            context = `#/textures/${textureInfo.index}`;

            const promises = new Array<Promise<void>>();

            const sampler = (texture.sampler == undefined ? this._defaultSampler : GLTFLoader._GetProperty(`${context}/sampler`, this._gltf.samplers, texture.sampler));
            const samplerData = this._loadSampler(`#/samplers/${sampler._index}`, sampler);

            const deferred = new Deferred<void>();
            const babylonTexture = new Texture(null, this._babylonScene, samplerData.noMipMaps, false, samplerData.samplingMode, () => {
                if (!this._disposed) {
                    deferred.resolve();
                }
            }, (message, exception) => {
                if (!this._disposed) {
                    deferred.reject(new Error(`${context}: ${(exception && exception.message) ? exception.message : message || "Failed to load texture"}`));
                }
            });
            promises.push(deferred.promise);

            babylonTexture.name = texture.name || `texture${texture._index}`;
            babylonTexture.wrapU = samplerData.wrapU;
            babylonTexture.wrapV = samplerData.wrapV;
            babylonTexture.coordinatesIndex = textureInfo.texCoord || 0;

            const image = GLTFLoader._GetProperty(`${context}/source`, this._gltf.images, texture.source);
            promises.push(this._loadImageAsync(`#/images/${image._index}`, image).then(objectURL => {
                babylonTexture.updateURL(objectURL);
            }));

            assign(babylonTexture);
            this.onTextureLoadedObservable.notifyObservers(babylonTexture);

            return Promise.all(promises).then(() => {});
        }

        private _loadSampler(context: string, sampler: ILoaderSampler): ILoaderSamplerData {
            if (!sampler._data) {
                sampler._data = {
                    noMipMaps: (sampler.minFilter === TextureMinFilter.NEAREST || sampler.minFilter === TextureMinFilter.LINEAR),
                    samplingMode: GLTFLoader._GetTextureSamplingMode(context, sampler.magFilter, sampler.minFilter),
                    wrapU: GLTFLoader._GetTextureWrapMode(context, sampler.wrapS),
                    wrapV: GLTFLoader._GetTextureWrapMode(context, sampler.wrapT)
                };
            };

            return sampler._data;
        }

        private _loadImageAsync(context: string, image: ILoaderImage): Promise<string> {
            if (image._objectURL) {
                return image._objectURL;
            }

            let promise: Promise<ArrayBufferView>;
            if (image.uri) {
                promise = this._loadUriAsync(context, image.uri);
            }
            else {
                const bufferView = GLTFLoader._GetProperty(`${context}/bufferView`, this._gltf.bufferViews, image.bufferView);
                promise = this._loadBufferViewAsync(`#/bufferViews/${bufferView._index}`, bufferView);
            }

            image._objectURL = promise.then(data => {
                return URL.createObjectURL(new Blob([data], { type: image.mimeType }));
            });

            return image._objectURL;
        }

        public _loadUriAsync(context: string, uri: string): Promise<ArrayBufferView> {
            const promise = GLTFLoaderExtension._LoadUriAsync(this, context, uri);
            if (promise) {
                return promise;
            }

            if (!GLTFLoader._ValidateUri(uri)) {
                throw new Error(`${context}: Uri '${uri}' is invalid`);
            }

            if (Tools.IsBase64(uri)) {
                return Promise.resolve(new Uint8Array(Tools.DecodeBase64(uri)));
            }

            return new Promise((resolve, reject) => {
                const request = Tools.LoadFile(this._rootUrl + uri, data => {
                    if (!this._disposed) {
                        resolve(new Uint8Array(data as ArrayBuffer));
                    }
                }, event => {
                    if (!this._disposed) {
                        try {
                            if (request && this._state === GLTFLoaderState.Loading) {
                                request._lengthComputable = event.lengthComputable;
                                request._loaded = event.loaded;
                                request._total = event.total;
                                this._onProgress();
                            }
                        }
                        catch (e) {
                            reject(e);
                        }
                    }
                }, this._babylonScene.database, true, (request, exception) => {
                    if (!this._disposed) {
                        reject(new LoadFileError(`${context}: Failed to load '${uri}'${request ? ": " + request.status + " " + request.statusText : ""}`, request));
                    }
                }) as IFileRequestInfo;

                this._requests.push(request);
            })
        }

        private _onProgress(): void {
            if (!this._progressCallback) {
                return;
            }

            let lengthComputable = true;
            let loaded = 0;
            let total = 0;
            for (let request of this._requests) {
                if (request._lengthComputable === undefined || request._loaded === undefined || request._total === undefined) {
                    return;
                }

                lengthComputable = lengthComputable && request._lengthComputable;
                loaded += request._loaded;
                total += request._total;
            }

            this._progressCallback(new SceneLoaderProgressEvent(lengthComputable, loaded, lengthComputable ? total : 0));
        }

        public static _GetProperty<T>(context: string, array: ArrayLike<T> | undefined, index: number | undefined): T {
            if (!array || index == undefined || !array[index]) {
                throw new Error(`${context}: Failed to find index (${index})`);
            }

            return array[index];
        }

        private static _GetTextureWrapMode(context: string, mode: TextureWrapMode | undefined): number {
            // Set defaults if undefined
            mode = mode == undefined ? TextureWrapMode.REPEAT : mode;

            switch (mode) {
                case TextureWrapMode.CLAMP_TO_EDGE: return Texture.CLAMP_ADDRESSMODE;
                case TextureWrapMode.MIRRORED_REPEAT: return Texture.MIRROR_ADDRESSMODE;
                case TextureWrapMode.REPEAT: return Texture.WRAP_ADDRESSMODE;
                default:
                    Tools.Warn(`${context}: Invalid texture wrap mode (${mode})`);
                    return Texture.WRAP_ADDRESSMODE;
            }
        }

        private static _GetTextureSamplingMode(context: string, magFilter?: TextureMagFilter, minFilter?: TextureMinFilter): number {
            // Set defaults if undefined
            magFilter = magFilter == undefined ? TextureMagFilter.LINEAR : magFilter;
            minFilter = minFilter == undefined ? TextureMinFilter.LINEAR_MIPMAP_LINEAR : minFilter;

            if (magFilter === TextureMagFilter.LINEAR) {
                switch (minFilter) {
                    case TextureMinFilter.NEAREST: return Texture.LINEAR_NEAREST;
                    case TextureMinFilter.LINEAR: return Texture.LINEAR_LINEAR;
                    case TextureMinFilter.NEAREST_MIPMAP_NEAREST: return Texture.LINEAR_NEAREST_MIPNEAREST;
                    case TextureMinFilter.LINEAR_MIPMAP_NEAREST: return Texture.LINEAR_LINEAR_MIPNEAREST;
                    case TextureMinFilter.NEAREST_MIPMAP_LINEAR: return Texture.LINEAR_NEAREST_MIPLINEAR;
                    case TextureMinFilter.LINEAR_MIPMAP_LINEAR: return Texture.LINEAR_LINEAR_MIPLINEAR;
                    default:
                        Tools.Warn(`${context}: Invalid texture minification filter (${minFilter})`);
                        return Texture.LINEAR_LINEAR_MIPLINEAR;
                }
            }
            else {
                if (magFilter !== TextureMagFilter.NEAREST) {
                    Tools.Warn(`${context}: Invalid texture magnification filter (${magFilter})`);
                }

                switch (minFilter) {
                    case TextureMinFilter.NEAREST: return Texture.NEAREST_NEAREST;
                    case TextureMinFilter.LINEAR: return Texture.NEAREST_LINEAR;
                    case TextureMinFilter.NEAREST_MIPMAP_NEAREST: return Texture.NEAREST_NEAREST_MIPNEAREST;
                    case TextureMinFilter.LINEAR_MIPMAP_NEAREST: return Texture.NEAREST_LINEAR_MIPNEAREST;
                    case TextureMinFilter.NEAREST_MIPMAP_LINEAR: return Texture.NEAREST_NEAREST_MIPLINEAR;
                    case TextureMinFilter.LINEAR_MIPMAP_LINEAR: return Texture.NEAREST_LINEAR_MIPLINEAR;
                    default:
                        Tools.Warn(`${context}: Invalid texture minification filter (${minFilter})`);
                        return Texture.NEAREST_NEAREST_MIPNEAREST;
                }
            }
        }

        private static _GetNumComponents(context: string, type: string): number {
            switch (type) {
                case "SCALAR": return 1;
                case "VEC2": return 2;
                case "VEC3": return 3;
                case "VEC4": return 4;
                case "MAT2": return 4;
                case "MAT3": return 9;
                case "MAT4": return 16;
            }

            throw new Error(`${context}: Invalid type (${type})`);
        }

        private static _ValidateUri(uri: string): boolean {
            return (Tools.IsBase64(uri) || uri.indexOf("..") === -1);
        }

        private static _GetDrawMode(context: string, mode: number | undefined): number {
            if (mode == undefined) {
                mode = MeshPrimitiveMode.TRIANGLES;
            }

            switch (mode) {
                case MeshPrimitiveMode.POINTS: return Material.PointListDrawMode;
                case MeshPrimitiveMode.LINES: return Material.LineListDrawMode;
                case MeshPrimitiveMode.LINE_LOOP: return Material.LineLoopDrawMode;
                case MeshPrimitiveMode.LINE_STRIP: return Material.LineStripDrawMode;
                case MeshPrimitiveMode.TRIANGLES: return Material.TriangleFillMode;
                case MeshPrimitiveMode.TRIANGLE_STRIP: return Material.TriangleStripDrawMode;
                case MeshPrimitiveMode.TRIANGLE_FAN: return Material.TriangleFanDrawMode;
            }

            throw new Error(`${context}: Invalid mesh primitive mode (${mode})`);
        }

        private _compileMaterialsAsync(): Promise<void> {
            const promises = new Array<Promise<void>>();

            if (this._gltf.materials) {
                for (const material of this._gltf.materials) {
                    if (material._babylonData) {
                        for (const babylonDrawMode in material._babylonData) {
                            const babylonData = material._babylonData[babylonDrawMode];
                            for (const babylonMesh of babylonData.meshes) {
                                // Ensure nonUniformScaling is set if necessary.
                                babylonMesh.computeWorldMatrix(true);

                                const babylonMaterial = babylonData.material;
                                promises.push(babylonMaterial.forceCompilationAsync(babylonMesh));
                                if (this.useClipPlane) {
                                    promises.push(babylonMaterial.forceCompilationAsync(babylonMesh, { clipPlane: true }));
                                }
                            }
                        }
                    }
                }
            }

            return Promise.all(promises).then(() => {});
        }

        private _compileShadowGeneratorsAsync(): Promise<void> {
            const promises = new Array<Promise<void>>();

            const lights = this._babylonScene.lights;
            for (let light of lights) {
                let generator = light.getShadowGenerator();
                if (generator) {
                    promises.push(generator.forceCompilationAsync());
                }
            }

            return Promise.all(promises).then(() => {});
        }

        private _clear(): void {
            for (const request of this._requests) {
                request.abort();
            }

            this._requests.length = 0;

            if (this._gltf && this._gltf.images) {
                for (const image of this._gltf.images) {
                    if (image._objectURL) {
                        image._objectURL.then(value => {
                            URL.revokeObjectURL(value);
                        });

                        image._objectURL = undefined;
                    }
                }
            }

            delete this._gltf;
            delete this._babylonScene;
            this._completePromises.length = 0;

            for (const name in this._extensions) {
                this._extensions[name].dispose();
            }

            this._extensions = {};

            delete this._rootBabylonMesh;
            delete this._progressCallback;

            this.onMeshLoadedObservable.clear();
            this.onTextureLoadedObservable.clear();
            this.onMaterialLoadedObservable.clear();
        }

        public _applyExtensions<T>(actionAsync: (extension: GLTFLoaderExtension) => Nullable<Promise<T>>) {
            for (const name of GLTFLoader._Names) {
                const extension = this._extensions[name];
                if (extension.enabled) {
                    const promise = actionAsync(extension);
                    if (promise) {
                        return promise;
                    }
                }
            }

            return null;
        }
    }

    GLTFFileLoader.CreateGLTFLoaderV2 = () => new GLTFLoader();
}
