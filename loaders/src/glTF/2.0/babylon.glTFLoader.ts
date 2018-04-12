/// <reference path="../../../../dist/preview release/babylon.d.ts"/>

/**
 * Defines the module used to import/export glTF 2.0 assets
 */
module BABYLON.GLTF2 {
    interface IFileRequestInfo extends IFileRequest {
        _lengthComputable?: boolean;
        _loaded?: number;
        _total?: number;
    }

    /** @ignore */
    export interface _MaterialConstructor<T extends Material> {
        readonly prototype: T;
        new(name: string, scene: Scene): T;
    }

    /**
     * Loader for loading a glTF 2.0 asset
     */
    export class GLTFLoader implements IGLTFLoader {
        /** @ignore */
        public _gltf: _ILoaderGLTF;

        /** @ignore */
        public _babylonScene: Scene;

        /** @ignore */
        public _completePromises = new Array<Promise<void>>();

        private _disposed = false;
        private _state: Nullable<GLTFLoaderState> = null;
        private _extensions: { [name: string]: GLTFLoaderExtension } = {};
        private _rootUrl: string;
        private _rootBabylonMesh: Mesh;
        private _defaultSampler = {} as _ILoaderSampler;
        private _defaultBabylonMaterials: { [drawMode: number]: PBRMaterial } = {};
        private _progressCallback?: (event: SceneLoaderProgressEvent) => void;
        private _requests = new Array<IFileRequestInfo>();

        private static _Names = new Array<string>();
        private static _Factories: { [name: string]: (loader: GLTFLoader) => GLTFLoaderExtension } = {};

        /** @ignore */
        public static _Register(name: string, factory: (loader: GLTFLoader) => GLTFLoaderExtension): void {
            if (GLTFLoader._Factories[name]) {
                Tools.Error(`Extension with the name '${name}' already exists`);
                return;
            }

            GLTFLoader._Factories[name] = factory;

            // Keep the order of registration so that extensions registered first are called first.
            GLTFLoader._Names.push(name);
        }

        /**
         * Mode that determines the coordinate system to use.
         */
        public coordinateSystemMode = GLTFLoaderCoordinateSystemMode.AUTO;

        /**
         * Mode that determines what animations will start.
         */
        public animationStartMode = GLTFLoaderAnimationStartMode.FIRST;

        /**
         * Defines if the loader should compile materials.
         */
        public compileMaterials = false;

        /**
         * Defines if the loader should also compile materials with clip planes.
         */
        public useClipPlane = false;

        /**
         * Defines if the loader should compile shadow generators.
         */
        public compileShadowGenerators = false;

        /**
         * Observable raised when the loader creates a mesh after parsing the glTF properties of the mesh.
         */
        public readonly onMeshLoadedObservable = new Observable<AbstractMesh>();

        /**
         * Observable raised when the loader creates a texture after parsing the glTF properties of the texture.
         */
        public readonly onTextureLoadedObservable = new Observable<BaseTexture>();

        /**
         * Observable raised when the loader creates a material after parsing the glTF properties of the material.
         */
        public readonly onMaterialLoadedObservable = new Observable<Material>();

        /**
         * Observable raised when the asset is completely loaded, immediately before the loader is disposed.
         * For assets with LODs, raised when all of the LODs are complete.
         * For assets without LODs, raised when the model is complete, immediately after the loader resolves the returned promise.
         */
        public readonly onCompleteObservable = new Observable<IGLTFLoader>();

        /**
         * Observable raised after the loader is disposed.
         */
        public readonly onDisposeObservable = new Observable<IGLTFLoader>();

        /**
         * Observable raised after a loader extension is created.
         * Set additional options for a loader extension in this event.
         */
        public readonly onExtensionLoadedObservable = new Observable<IGLTFLoaderExtension>();


        /**
         * Loader state or null if the loader is not active.
         */
        public get state(): Nullable<GLTFLoaderState> {
            return this._state;
        }

        /**
         * Disposes the loader, releases resources during load, and cancels any outstanding requests.
         */
        public dispose(): void {
            if (this._disposed) {
                return;
            }

            this._disposed = true;

            this.onDisposeObservable.notifyObservers(this);
            this.onDisposeObservable.clear();

            this._clear();
        }

        /**
         * Imports one or more meshes from the loaded glTF data and adds them to the scene
         * @param meshesNames a string or array of strings of the mesh names that should be loaded from the file
         * @param scene the scene the meshes should be added to
         * @param data the glTF data to load
         * @param rootUrl root url to load from
         * @param onProgress event that fires when loading progress has occured
         * @returns a promise containg the loaded meshes, particles, skeletons and animations
         */
        public importMeshAsync(meshesNames: any, scene: Scene, data: IGLTFLoaderData, rootUrl: string, onProgress?: (event: SceneLoaderProgressEvent) => void): Promise<{ meshes: AbstractMesh[], particleSystems: ParticleSystem[], skeletons: Skeleton[], animationGroups: AnimationGroup[] }> {
            return Promise.resolve().then(() => {
                let nodes: Nullable<Array<_ILoaderNode>> = null;

                if (meshesNames) {
                    const nodeMap: { [name: string]: _ILoaderNode } = {};
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
                        animationGroups: this._getAnimationGroups()
                    };
                });
            });
        }

        /**
         * Imports all objects from the loaded glTF data and adds them to the scene
         * @param scene the scene the objects should be added to
         * @param data the glTF data to load
         * @param rootUrl root url to load from
         * @param onProgress event that fires when loading progress has occured
         * @returns a promise which completes when objects have been loaded to the scene
         */
        public loadAsync(scene: Scene, data: IGLTFLoaderData, rootUrl: string, onProgress?: (event: SceneLoaderProgressEvent) => void): Promise<void> {
            return this._loadAsync(null, scene, data, rootUrl, onProgress);
        }

        private _loadAsync(nodes: Nullable<Array<_ILoaderNode>>, scene: Scene, data: IGLTFLoaderData, rootUrl: string, onProgress?: (event: SceneLoaderProgressEvent) => void): Promise<void> {
            return Promise.resolve().then(() => {
                this._loadExtensions();

                this._babylonScene = scene;
                this._rootUrl = rootUrl;
                this._progressCallback = onProgress;
                this._state = GLTFLoaderState.LOADING;

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
                    this._state = GLTFLoaderState.READY;
                    this._startAnimations();
                });

                resultPromise.then(() => {
                    this._rootBabylonMesh.setEnabled(true);

                    Tools.SetImmediate(() => {
                        if (!this._disposed) {
                            Promise.all(this._completePromises).then(() => {
                                this._state = GLTFLoaderState.COMPLETE;
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
            this._gltf = data.json as _ILoaderGLTF;
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
            _ArrayItem.Assign(this._gltf.accessors);
            _ArrayItem.Assign(this._gltf.animations);
            _ArrayItem.Assign(this._gltf.buffers);
            _ArrayItem.Assign(this._gltf.bufferViews);
            _ArrayItem.Assign(this._gltf.cameras);
            _ArrayItem.Assign(this._gltf.images);
            _ArrayItem.Assign(this._gltf.materials);
            _ArrayItem.Assign(this._gltf.meshes);
            _ArrayItem.Assign(this._gltf.nodes);
            _ArrayItem.Assign(this._gltf.samplers);
            _ArrayItem.Assign(this._gltf.scenes);
            _ArrayItem.Assign(this._gltf.skins);
            _ArrayItem.Assign(this._gltf.textures);

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

        private _createRootNode(): _ILoaderNode {
            this._rootBabylonMesh = new Mesh("__root__", this._babylonScene);
            this._rootBabylonMesh.setEnabled(false);

            const rootNode = { _babylonMesh: this._rootBabylonMesh } as _ILoaderNode;
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

        private _loadNodesAsync(nodes: _ILoaderNode[], ): Promise<void> {
            const promises = new Array<Promise<void>>();

            for (let node of nodes) {
                promises.push(this._loadNodeAsync(`#/nodes/${node._index}`, node));
            }

            promises.push(this._loadAnimationsAsync());

            return Promise.all(promises).then(() => {});
        }

        /** @ignore */
        public _loadSceneAsync(context: string, scene: _ILoaderScene): Promise<void> {
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

        private _forEachPrimitive(node: _ILoaderNode, callback: (babylonMesh: Mesh) => void): void {
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

        private _getAnimationGroups(): AnimationGroup[] {
            const animationGroups = new Array<AnimationGroup>();

            const animations = this._gltf.animations;
            if (animations) {
                for (const animation of animations) {
                    if (animation._babylonAnimationGroup) {
                        animationGroups.push(animation._babylonAnimationGroup);
                    }
                }
            }

            return animationGroups;
        }

        private _startAnimations(): void {
            switch (this.animationStartMode) {
                case GLTFLoaderAnimationStartMode.NONE: {
                    // do nothing
                    break;
                }
                case GLTFLoaderAnimationStartMode.FIRST: {
                    const babylonAnimationGroups = this._getAnimationGroups();
                    if (babylonAnimationGroups.length !== 0) {
                        babylonAnimationGroups[0].start(true);
                    }
                    break;
                }
                case GLTFLoaderAnimationStartMode.ALL: {
                    const babylonAnimationGroups = this._getAnimationGroups();
                    for (const babylonAnimationGroup of babylonAnimationGroups) {
                        babylonAnimationGroup.start(true);
                    }
                    break;
                }
                default: {
                    Tools.Error(`Invalid animation start mode (${this.animationStartMode})`);
                    return;
                }
            }
        }

        /** @ignore */
        public _loadNodeAsync(context: string, node: _ILoaderNode): Promise<void> {
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

        private _loadMeshAsync(context: string, node: _ILoaderNode, mesh: _ILoaderMesh, babylonMesh: Mesh): Promise<void> {
            const promises = new Array<Promise<void>>();

            const primitives = mesh.primitives;
            if (!primitives || primitives.length === 0) {
                throw new Error(`${context}: Primitives are missing`);
            }

            _ArrayItem.Assign(primitives);
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

        private _loadPrimitiveAsync(context: string, node: _ILoaderNode, mesh: _ILoaderMesh, primitive: _ILoaderMeshPrimitive, babylonMesh: Mesh): Promise<void> {
            const promises = new Array<Promise<void>>();

            this._createMorphTargets(context, node, mesh, primitive, babylonMesh);
            promises.push(this._loadVertexDataAsync(context, primitive, babylonMesh).then(babylonGeometry => {
                return this._loadMorphTargetsAsync(context, primitive, babylonMesh, babylonGeometry).then(() => {
                    babylonGeometry.applyToMesh(babylonMesh);
                });
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

        private _loadVertexDataAsync(context: string, primitive: _ILoaderMeshPrimitive, babylonMesh: Mesh): Promise<Geometry> {
            const promise = GLTFLoaderExtension._LoadVertexDataAsync(this, context, primitive, babylonMesh);
            if (promise) {
                return promise;
            }

            const attributes = primitive.attributes;
            if (!attributes) {
                throw new Error(`${context}: Attributes are missing`);
            }

            const promises = new Array<Promise<void>>();

            const babylonGeometry = new Geometry(babylonMesh.name, this._babylonScene);

            if (primitive.indices == undefined) {
                babylonMesh.isUnIndexed = true;
            }
            else {
                const accessor = GLTFLoader._GetProperty(context + "/indices", this._gltf.accessors, primitive.indices);
                promises.push(this._loadIndicesAccessorAsync("#/accessors/" + accessor._index, accessor).then(data => {
                    babylonGeometry.setIndices(data);
                }));
            }

            const loadAttribute = (attribute: string, kind: string, callback?: (accessor: _ILoaderAccessor) => void) => {
                if (attributes[attribute] == undefined) {
                    return;
                }

                babylonMesh._delayInfo = babylonMesh._delayInfo || [];
                if (babylonMesh._delayInfo.indexOf(kind) === -1) {
                    babylonMesh._delayInfo.push(kind);
                }

                const accessor = GLTFLoader._GetProperty(context + "/attributes/" + attribute, this._gltf.accessors, attributes[attribute]);
                promises.push(this._loadVertexAccessorAsync("#/accessors/" + accessor._index, accessor, kind).then(babylonVertexBuffer => {
                    babylonGeometry.setVerticesBuffer(babylonVertexBuffer, accessor.count);
                }));

                if (callback) {
                    callback(accessor);
                }
            };

            loadAttribute("POSITION", VertexBuffer.PositionKind);
            loadAttribute("NORMAL", VertexBuffer.NormalKind);
            loadAttribute("TANGENT", VertexBuffer.TangentKind);
            loadAttribute("TEXCOORD_0", VertexBuffer.UVKind);
            loadAttribute("TEXCOORD_1", VertexBuffer.UV2Kind);
            loadAttribute("JOINTS_0", VertexBuffer.MatricesIndicesKind);
            loadAttribute("WEIGHTS_0", VertexBuffer.MatricesWeightsKind);
            loadAttribute("COLOR_0", VertexBuffer.ColorKind, accessor => {
                if (accessor.type === AccessorType.VEC4) {
                    babylonMesh.hasVertexAlpha = true;
                }
            });

            return Promise.all(promises).then(() => {
                return babylonGeometry;
            });
        }

        private _createMorphTargets(context: string, node: _ILoaderNode, mesh: _ILoaderMesh, primitive: IMeshPrimitive, babylonMesh: Mesh): void {
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

        private _loadMorphTargetsAsync(context: string, primitive: IMeshPrimitive, babylonMesh: Mesh, babylonGeometry: Geometry): Promise<void> {
            if (!primitive.targets) {
                return Promise.resolve();
            }

            const promises = new Array<Promise<void>>();

            const morphTargetManager = babylonMesh.morphTargetManager!;
            for (let index = 0; index < morphTargetManager.numTargets; index++) {
                const babylonMorphTarget = morphTargetManager.getTarget(index);
                promises.push(this._loadMorphTargetVertexDataAsync(`${context}/targets/${index}`, babylonGeometry, primitive.targets[index], babylonMorphTarget));
            }

            return Promise.all(promises).then(() => {});
        }

        private _loadMorphTargetVertexDataAsync(context: string, babylonGeometry: Geometry, attributes: { [name: string]: number }, babylonMorphTarget: MorphTarget): Promise<void> {
            const promises = new Array<Promise<void>>();

            const loadAttribute = (attribute: string, kind: string, setData: (babylonVertexBuffer: VertexBuffer, data: Float32Array) => void) => {
                if (attributes[attribute] == undefined) {
                    return;
                }

                const babylonVertexBuffer = babylonGeometry.getVertexBuffer(kind);
                if (!babylonVertexBuffer) {
                    return;
                }

                const accessor = GLTFLoader._GetProperty(`${context}/${attribute}`, this._gltf.accessors, attributes[attribute]);
                promises.push(this._loadFloatAccessorAsync(`#/accessors/${accessor._index}`, accessor).then(data => {
                    setData(babylonVertexBuffer, data);
                }));
            };

            loadAttribute("POSITION", VertexBuffer.PositionKind, (babylonVertexBuffer, data) => {
                babylonVertexBuffer.forEach(data.length, (value, index) => {
                    data[index] += value;
                });

                babylonMorphTarget.setPositions(data);
            });

            loadAttribute("NORMAL", VertexBuffer.NormalKind, (babylonVertexBuffer, data) => {
                babylonVertexBuffer.forEach(data.length, (value, index) => {
                    data[index] += value;
                });

                babylonMorphTarget.setNormals(data);
            });

            loadAttribute("TANGENT", VertexBuffer.TangentKind, (babylonVertexBuffer, data) => {
                let dataIndex = 0;
                babylonVertexBuffer.forEach(data.length, (value, index) => {
                    // Tangent data for morph targets is stored as xyz delta.
                    // The vertexData.tangent is stored as xyzw.
                    // So we need to skip every fourth vertexData.tangent.
                    if (((index + 1) % 4) !== 0) {
                        data[dataIndex++] += value;
                    }
                });
                babylonMorphTarget.setTangents(data);
            });

            return Promise.all(promises).then(() => {});
        }

        private static _LoadTransform(node: _ILoaderNode, babylonNode: TransformNode): void {
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

        private _loadSkinAsync(context: string, node: _ILoaderNode, mesh: _ILoaderMesh, skin: _ILoaderSkin): Promise<void> {
            const assignSkeleton = (skeleton: Skeleton) => {
                this._forEachPrimitive(node, babylonMesh => {
                    babylonMesh.skeleton = skeleton;
                });

                // Ignore the TRS of skinned nodes.
                // See https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#skins (second implementation note)
                node._babylonMesh!.parent = this._rootBabylonMesh;
                node._babylonMesh!.position = Vector3.Zero();
                node._babylonMesh!.rotationQuaternion = Quaternion.Identity();
                node._babylonMesh!.scaling = Vector3.One();
            };

            if (skin._loaded) {
                return skin._loaded.then(() => {
                    assignSkeleton(skin._babylonSkeleton!);
                });
            }

            const skeletonId = `skeleton${skin._index}`;
            const babylonSkeleton = new Skeleton(skin.name || skeletonId, skeletonId, this._babylonScene);
            skin._babylonSkeleton = babylonSkeleton;
            this._loadBones(context, skin);
            assignSkeleton(babylonSkeleton);

            return (skin._loaded = this._loadSkinInverseBindMatricesDataAsync(context, skin).then(inverseBindMatricesData => {
                this._updateBoneMatrices(babylonSkeleton, inverseBindMatricesData);
            }));
        }

        private _loadBones(context: string, skin: _ILoaderSkin): void {
            const babylonBones: { [index: number]: Bone } = {};
            for (const index of skin.joints) {
                const node = GLTFLoader._GetProperty(`${context}/joints/${index}`, this._gltf.nodes, index);
                this._loadBone(node, skin, babylonBones);
            }
        }

        private _loadBone(node: _ILoaderNode, skin: _ILoaderSkin, babylonBones: { [index: number]: Bone }): Bone {
            let babylonBone = babylonBones[node._index];
            if (babylonBone) {
                return babylonBone;
            }

            let babylonParentBone: Nullable<Bone> = null;
            if (node._parent._babylonMesh !== this._rootBabylonMesh) {
                babylonParentBone = this._loadBone(node._parent, skin, babylonBones);
            }

            const boneIndex = skin.joints.indexOf(node._index);

            babylonBone = new Bone(node.name || `joint${node._index}`, skin._babylonSkeleton!, babylonParentBone, this._getNodeMatrix(node), null, null, boneIndex);
            babylonBones[node._index] = babylonBone;

            node._babylonAnimationTargets = node._babylonAnimationTargets || [];
            node._babylonAnimationTargets.push(babylonBone);

            return babylonBone;
        }

        private _loadSkinInverseBindMatricesDataAsync(context: string, skin: _ILoaderSkin): Promise<Nullable<Float32Array>> {
            if (skin.inverseBindMatrices == undefined) {
                return Promise.resolve(null);
            }

            const accessor = GLTFLoader._GetProperty(`${context}/inverseBindMatrices`, this._gltf.accessors, skin.inverseBindMatrices);
            return this._loadFloatAccessorAsync(`#/accessors/${accessor._index}`, accessor);
        }

        private _updateBoneMatrices(babylonSkeleton: Skeleton, inverseBindMatricesData: Nullable<Float32Array>): void {
            for (const babylonBone of babylonSkeleton.bones) {
                let baseMatrix = Matrix.Identity();
                const boneIndex = babylonBone._index!;
                if (inverseBindMatricesData && boneIndex !== -1) {
                    Matrix.FromArrayToRef(inverseBindMatricesData, boneIndex * 16, baseMatrix);
                    baseMatrix.invertToRef(baseMatrix);
                }

                const babylonParentBone = babylonBone.getParent();
                if (babylonParentBone) {
                    baseMatrix.multiplyToRef(babylonParentBone.getInvertedAbsoluteTransform(), baseMatrix);
                }

                babylonBone.updateMatrix(baseMatrix, false, false);
                babylonBone._updateDifferenceMatrix(undefined, false);
            }
        }

        private _getNodeMatrix(node: _ILoaderNode): Matrix {
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

        private _loadAnimationAsync(context: string, animation: _ILoaderAnimation): Promise<void> {
            const babylonAnimationGroup = new AnimationGroup(animation.name || `animation${animation._index}`, this._babylonScene);
            animation._babylonAnimationGroup = babylonAnimationGroup;

            const promises = new Array<Promise<void>>();

            _ArrayItem.Assign(animation.channels);
            _ArrayItem.Assign(animation.samplers);

            for (const channel of animation.channels) {
                promises.push(this._loadAnimationChannelAsync(`${context}/channels/${channel._index}`, context, animation, channel, babylonAnimationGroup));
            }

            return Promise.all(promises).then(() => {
                babylonAnimationGroup.normalize();
            });
        }

        private _loadAnimationChannelAsync(context: string, animationContext: string, animation: _ILoaderAnimation, channel: _ILoaderAnimationChannel, babylonAnimationGroup: AnimationGroup): Promise<void> {
            const targetNode = GLTFLoader._GetProperty(`${context}/target/node`, this._gltf.nodes, channel.target.node);
            if (!targetNode._babylonMesh) {
                return Promise.resolve();
            }

            // Ignore animations targeting TRS of skinned nodes.
            // See https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#skins (second implementation note)
            if (targetNode.skin != undefined && channel.target.path !== AnimationChannelTargetPath.WEIGHTS) {
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

                        const morphTargets = new Array<any>();
                        this._forEachPrimitive(targetNode, babylonMesh => {
                            const morphTarget = babylonMesh.morphTargetManager!.getTarget(targetIndex);
                            morphTarget.animations.push(babylonAnimation);
                            morphTargets.push(morphTarget);
                        });

                        babylonAnimationGroup.addTargetedAnimation(babylonAnimation, morphTargets);
                    }
                }
                else {
                    const animationName = `${babylonAnimationGroup.name}_channel${babylonAnimationGroup.targetedAnimations.length}`;
                    const babylonAnimation = new Animation(animationName, targetPath, 1, animationType);
                    babylonAnimation.setKeys(keys);

                    if (targetNode._babylonAnimationTargets) {
                        for (const babylonAnimationTarget of targetNode._babylonAnimationTargets) {
                            babylonAnimationTarget.animations.push(babylonAnimation);
                        }

                        babylonAnimationGroup.addTargetedAnimation(babylonAnimation, targetNode._babylonAnimationTargets);
                    }
                }
            });
        }

        private _loadAnimationSamplerAsync(context: string, sampler: _ILoaderAnimationSampler): Promise<_ILoaderAnimationSamplerData> {
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

            const inputAccessor = GLTFLoader._GetProperty(`${context}/input`, this._gltf.accessors, sampler.input);
            const outputAccessor = GLTFLoader._GetProperty(`${context}/output`, this._gltf.accessors, sampler.output);

            sampler._data = Promise.all([
                this._loadFloatAccessorAsync(`#/accessors/${inputAccessor._index}`, inputAccessor),
                this._loadFloatAccessorAsync(`#/accessors/${outputAccessor._index}`, outputAccessor)
            ]).then(([inputData, outputData]) => {
                return {
                    input: inputData,
                    interpolation: interpolation,
                    output: outputData,
                };
            });

            return sampler._data;
        }

        private _loadBufferAsync(context: string, buffer: _ILoaderBuffer): Promise<ArrayBufferView> {
            if (buffer._data) {
                return buffer._data;
            }

            if (!buffer.uri) {
                throw new Error(`${context}: Uri is missing`);
            }

            buffer._data = this._loadUriAsync(context, buffer.uri);

            return buffer._data;
        }

        /** @ignore */
        public _loadBufferViewAsync(context: string, bufferView: _ILoaderBufferView): Promise<ArrayBufferView> {
            if (bufferView._data) {
                return bufferView._data;
            }

            const buffer = GLTFLoader._GetProperty(`${context}/buffer`, this._gltf.buffers, bufferView.buffer);
            bufferView._data = this._loadBufferAsync(`#/buffers/${buffer._index}`, buffer).then(data => {
                try {
                    return new Uint8Array(data.buffer, data.byteOffset + (bufferView.byteOffset || 0), bufferView.byteLength);
                }
                catch (e) {
                    throw new Error(`${context}: ${e.message}`);
                }
            });

            return bufferView._data;
        }

        private _loadIndicesAccessorAsync(context: string, accessor: _ILoaderAccessor): Promise<IndicesArray> {
            if (accessor.type !== AccessorType.SCALAR) {
                throw new Error(`${context}: Invalid type ${accessor.type}`);
            }

            if (accessor.componentType !== AccessorComponentType.UNSIGNED_BYTE &&
                accessor.componentType !== AccessorComponentType.UNSIGNED_SHORT &&
                accessor.componentType !== AccessorComponentType.UNSIGNED_INT) {
                throw new Error(`${context}: Invalid component type ${accessor.componentType}`);
            }

            if (accessor._data) {
                return accessor._data as Promise<IndicesArray>;
            }

            const bufferView = GLTFLoader._GetProperty(`${context}/bufferView`, this._gltf.bufferViews, accessor.bufferView);
            accessor._data = this._loadBufferViewAsync(`#/bufferViews/${bufferView._index}`, bufferView).then(data => {
                return GLTFLoader._GetTypedArray(context, accessor.componentType, data, accessor.byteOffset, accessor.count);
            });

            return accessor._data as Promise<IndicesArray>;
        }

        private _loadFloatAccessorAsync(context: string, accessor: _ILoaderAccessor): Promise<Float32Array> {
            // TODO: support normalized and stride

            if (accessor.componentType !== AccessorComponentType.FLOAT) {
                throw new Error(`Invalid component type ${accessor.componentType}`);
            }

            if (accessor._data) {
                return accessor._data as Promise<Float32Array>;
            }

            const numComponents = GLTFLoader._GetNumComponents(context, accessor.type);
            const length = numComponents * accessor.count;

            if (accessor.bufferView == undefined) {
                accessor._data = Promise.resolve(new Float32Array(length));
            }
            else {
                const bufferView = GLTFLoader._GetProperty(`${context}/bufferView`, this._gltf.bufferViews, accessor.bufferView);
                accessor._data = this._loadBufferViewAsync(`#/bufferViews/${bufferView._index}`, bufferView).then(data => {
                    return GLTFLoader._GetTypedArray(context, accessor.componentType, data, accessor.byteOffset, length);
                });
            }

            if (accessor.sparse) {
                const sparse = accessor.sparse;
                accessor._data = accessor._data.then((data: Float32Array) => {
                    const indicesBufferView = GLTFLoader._GetProperty(`${context}/sparse/indices/bufferView`, this._gltf.bufferViews, sparse.indices.bufferView);
                    const valuesBufferView = GLTFLoader._GetProperty(`${context}/sparse/values/bufferView`, this._gltf.bufferViews, sparse.values.bufferView);
                    return Promise.all([
                        this._loadBufferViewAsync(`#/bufferViews/${indicesBufferView._index}`, indicesBufferView),
                        this._loadBufferViewAsync(`#/bufferViews/${valuesBufferView._index}`, valuesBufferView)
                    ]).then(([indicesData, valuesData]) => {
                        const indices = GLTFLoader._GetTypedArray(`${context}/sparse/indices`, sparse.indices.componentType, indicesData, sparse.indices.byteOffset, sparse.count) as IndicesArray;
                        const values = GLTFLoader._GetTypedArray(`${context}/sparse/values`, accessor.componentType, valuesData, sparse.values.byteOffset, numComponents * sparse.count) as Float32Array;

                        let valuesIndex = 0;
                        for (let indicesIndex = 0; indicesIndex < indices.length; indicesIndex++) {
                            let dataIndex = indices[indicesIndex] * numComponents;
                            for (let componentIndex = 0; componentIndex < numComponents; componentIndex++) {
                                data[dataIndex++] = values[valuesIndex++];
                            }
                        }

                        return data;
                    });
                });
            }

            return accessor._data as Promise<Float32Array>;
        }

        /** @ignore */
        public _loadVertexBufferViewAsync(context: string, bufferView: _ILoaderBufferView, kind: string): Promise<Buffer> {
            if (bufferView._babylonBuffer) {
                return bufferView._babylonBuffer;
            }

            bufferView._babylonBuffer = this._loadBufferViewAsync(context, bufferView).then(data => {
                return new Buffer(this._babylonScene.getEngine(), data, false);
            });

            return bufferView._babylonBuffer;
        }

        private _loadVertexAccessorAsync(context: string, accessor: _ILoaderAccessor, kind: string): Promise<VertexBuffer> {
            if (accessor._babylonVertexBuffer) {
                return accessor._babylonVertexBuffer;
            }

            if (accessor.sparse) {
                accessor._babylonVertexBuffer = this._loadFloatAccessorAsync(context, accessor).then(data => {
                    return new VertexBuffer(this._babylonScene.getEngine(), data, kind, false);
                });
            }
            else {
                const bufferView = GLTFLoader._GetProperty(context + "/bufferView", this._gltf.bufferViews, accessor.bufferView);
                accessor._babylonVertexBuffer = this._loadVertexBufferViewAsync("#/bufferViews/" + bufferView._index, bufferView, kind).then(buffer => {
                    const size = GLTFLoader._GetNumComponents(context, accessor.type);
                    return new VertexBuffer(this._babylonScene.getEngine(), buffer, kind, false, false, bufferView.byteStride,
                        false, accessor.byteOffset, size, accessor.componentType, accessor.normalized, true);
                });
            }

            return accessor._babylonVertexBuffer;
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

        private _loadMaterialMetallicRoughnessPropertiesAsync(context: string, material: _ILoaderMaterial, babylonMaterial: PBRMaterial): Promise<void> {
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

        /** @ignore */
        public _loadMaterialAsync(context: string, material: _ILoaderMaterial, babylonMesh: Mesh, babylonDrawMode: number, assign: (babylonMaterial: Material) => void): Promise<void> {
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

        /** @ignore */
        public _createMaterial<T extends Material>(type: _MaterialConstructor<T>, name: string, drawMode: number): T {
            const babylonMaterial = new type(name, this._babylonScene);
            babylonMaterial.sideOrientation = this._babylonScene.useRightHandedSystem ? Material.CounterClockWiseSideOrientation : Material.ClockWiseSideOrientation;
            babylonMaterial.fillMode = drawMode;
            return babylonMaterial;
        }

        /** @ignore */
        public _loadMaterialBasePropertiesAsync(context: string, material: _ILoaderMaterial, babylonMaterial: PBRMaterial): Promise<void> {
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

        /** @ignore */
        public _loadMaterialAlphaProperties(context: string, material: _ILoaderMaterial, babylonMaterial: PBRMaterial): void {
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

        /** @ignore */
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

        private _loadSampler(context: string, sampler: _ILoaderSampler): _ILoaderSamplerData {
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

        private _loadImageAsync(context: string, image: _ILoaderImage): Promise<string> {
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

        /** @ignore */
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
                            if (request && this._state === GLTFLoaderState.LOADING) {
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

        /** @ignore */
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

        private static _GetTypedArray(context: string, componentType: AccessorComponentType, bufferView: ArrayBufferView, byteOffset: number | undefined, length: number): ArrayBufferView {
            const buffer = bufferView.buffer;
            byteOffset = bufferView.byteOffset + (byteOffset || 0);

            try {
                switch (componentType) {
                    case AccessorComponentType.BYTE: return new Int8Array(buffer, byteOffset, length);
                    case AccessorComponentType.UNSIGNED_BYTE: return new Uint8Array(buffer, byteOffset, length);
                    case AccessorComponentType.SHORT: return new Int16Array(buffer, byteOffset, length);
                    case AccessorComponentType.UNSIGNED_SHORT: return new Uint16Array(buffer, byteOffset, length);
                    case AccessorComponentType.UNSIGNED_INT: return new Uint32Array(buffer, byteOffset, length);
                    case AccessorComponentType.FLOAT: return new Float32Array(buffer, byteOffset, length);
                    default: throw new Error(`Invalid component type ${componentType}`);
                }
            }
            catch (e) {
                throw new Error(`${context}: ${e}`);
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

        /** @ignore */
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
