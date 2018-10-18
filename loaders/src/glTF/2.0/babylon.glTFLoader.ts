/// <reference path="../../../../dist/preview release/babylon.d.ts"/>

/**
 * Defines the module for importing and exporting glTF 2.0 assets
 */
module BABYLON.GLTF2 {
    interface IFileRequestInfo extends IFileRequest {
        _lengthComputable?: boolean;
        _loaded?: number;
        _total?: number;
    }

    interface ILoaderProperty extends IProperty {
        _activeLoaderExtensions: any;
    }

    /**
     * Helper class for working with arrays when loading the glTF asset
     */
    export class ArrayItem {
        /**
         * Gets an item from the given array.
         * @param context The context when loading the asset
         * @param array The array to get the item from
         * @param index The index to the array
         * @returns The array item
         */
        public static Get<T>(context: string, array: ArrayLike<T> | undefined, index: number | undefined): T {
            if (!array || index == undefined || !array[index]) {
                throw new Error(`${context}: Failed to find index (${index})`);
            }

            return array[index];
        }

        /**
         * Assign an `index` field to each item of the given array.
         * @param array The array of items
         */
        public static Assign(array?: Loader.IArrayItem[]): void {
            if (array) {
                for (let index = 0; index < array.length; index++) {
                    array[index].index = index;
                }
            }
        }
    }

    /**
     * The glTF 2.0 loader
     */
    export class GLTFLoader implements IGLTFLoader {
        /** The glTF object parsed from the JSON. */
        public gltf: Loader.IGLTF;

        /** The Babylon scene when loading the asset. */
        public babylonScene: Scene;

        /** @hidden */
        public _completePromises = new Array<Promise<any>>();

        private _disposed = false;
        private _parent: GLTFFileLoader;
        private _state: Nullable<GLTFLoaderState> = null;
        private _extensions: { [name: string]: IGLTFLoaderExtension } = {};
        private _rootUrl: string;
        private _fileName: string;
        private _uniqueRootUrl: string;
        private _rootBabylonMesh: Mesh;
        private _defaultBabylonMaterialData: { [drawMode: number]: Material } = {};
        private _progressCallback?: (event: SceneLoaderProgressEvent) => void;
        private _requests = new Array<IFileRequestInfo>();

        private static readonly _DefaultSampler: Loader.ISampler = { index: -1 };

        private static _ExtensionNames = new Array<string>();
        private static _ExtensionFactories: { [name: string]: (loader: GLTFLoader) => IGLTFLoaderExtension } = {};

        /**
         * Registers a loader extension.
         * @param name The name of the loader extension.
         * @param factory The factory function that creates the loader extension.
         */
        public static RegisterExtension(name: string, factory: (loader: GLTFLoader) => IGLTFLoaderExtension): void {
            if (GLTFLoader.UnregisterExtension(name)) {
                Tools.Warn(`Extension with the name '${name}' already exists`);
            }

            GLTFLoader._ExtensionFactories[name] = factory;

            // Keep the order of registration so that extensions registered first are called first.
            GLTFLoader._ExtensionNames.push(name);
        }

        /**
         * Unregisters a loader extension.
         * @param name The name of the loader extenion.
         * @returns A boolean indicating whether the extension has been unregistered
         */
        public static UnregisterExtension(name: string): boolean {
            if (!GLTFLoader._ExtensionFactories[name]) {
                return false;
            }

            delete GLTFLoader._ExtensionFactories[name];

            const index = GLTFLoader._ExtensionNames.indexOf(name);
            if (index !== -1) {
                GLTFLoader._ExtensionNames.splice(index, 1);
            }

            return true;
        }

        /**
         * Gets the loader state.
         */
        public get state(): Nullable<GLTFLoaderState> {
            return this._state;
        }

        /** @hidden */
        constructor(parent: GLTFFileLoader) {
            this._parent = parent;
        }

        /** @hidden */
        public dispose(): void {
            if (this._disposed) {
                return;
            }

            this._disposed = true;

            for (const request of this._requests) {
                request.abort();
            }

            this._requests.length = 0;

            delete this.gltf;
            delete this.babylonScene;
            this._completePromises.length = 0;

            for (const name in this._extensions) {
                const extension = this._extensions[name];
                if (extension.dispose) {
                    this._extensions[name].dispose();
                }
            }

            this._extensions = {};

            delete this._rootBabylonMesh;
            delete this._progressCallback;

            this._parent._clear();
        }

        /** @hidden */
        public importMeshAsync(meshesNames: any, scene: Scene, data: IGLTFLoaderData, rootUrl: string, onProgress?: (event: SceneLoaderProgressEvent) => void, fileName?: string): Promise<{ meshes: AbstractMesh[], particleSystems: IParticleSystem[], skeletons: Skeleton[], animationGroups: AnimationGroup[] }> {
            return Promise.resolve().then(() => {
                this.babylonScene = scene;
                this._rootUrl = rootUrl;
                this._fileName = fileName || "scene";
                this._progressCallback = onProgress;
                this._loadData(data);

                let nodes: Nullable<Array<number>> = null;

                if (meshesNames) {
                    const nodeMap: { [name: string]: number } = {};
                    if (this.gltf.nodes) {
                        for (const node of this.gltf.nodes) {
                            if (node.name) {
                                nodeMap[node.name] = node.index;
                            }
                        }
                    }

                    const names = (meshesNames instanceof Array) ? meshesNames : [meshesNames];
                    nodes = names.map((name) => {
                        const node = nodeMap[name];
                        if (node === undefined) {
                            throw new Error(`Failed to find node '${name}'`);
                        }

                        return node;
                    });
                }

                return this._loadAsync(nodes, () => {
                    return {
                        meshes: this._getMeshes(),
                        particleSystems: [],
                        skeletons: this._getSkeletons(),
                        animationGroups: this._getAnimationGroups()
                    };
                });
            });
        }

        /** @hidden */
        public loadAsync(scene: Scene, data: IGLTFLoaderData, rootUrl: string, onProgress?: (event: SceneLoaderProgressEvent) => void, fileName?: string): Promise<void> {
            return Promise.resolve().then(() => {
                this.babylonScene = scene;
                this._rootUrl = rootUrl;
                this._fileName = fileName || "scene";
                this._progressCallback = onProgress;
                this._loadData(data);
                return this._loadAsync(null, () => undefined);
            });
        }

        private _loadAsync<T>(nodes: Nullable<Array<number>>, resultFunc: () => T): Promise<T> {
            return Promise.resolve().then(() => {
                this._uniqueRootUrl = (this._rootUrl.indexOf("file:") === -1 && this._fileName) ? this._rootUrl : `${this._rootUrl}${Date.now()}/`;

                this._loadExtensions();
                this._checkExtensions();

                const loadingToReadyCounterName = `${GLTFLoaderState[GLTFLoaderState.LOADING]} => ${GLTFLoaderState[GLTFLoaderState.READY]}`;
                const loadingToCompleteCounterName = `${GLTFLoaderState[GLTFLoaderState.LOADING]} => ${GLTFLoaderState[GLTFLoaderState.COMPLETE]}`;

                this._parent._startPerformanceCounter(loadingToReadyCounterName);
                this._parent._startPerformanceCounter(loadingToCompleteCounterName);

                this._setState(GLTFLoaderState.LOADING);
                this._extensionsOnLoading();

                const promises = new Array<Promise<any>>();

                if (nodes) {
                    promises.push(this.loadSceneAsync("#/nodes", { nodes: nodes, index: -1 }));
                }
                else {
                    const scene = ArrayItem.Get(`#/scene`, this.gltf.scenes, this.gltf.scene || 0);
                    promises.push(this.loadSceneAsync(`#/scenes/${scene.index}`, scene));
                }

                if (this._parent.compileMaterials) {
                    promises.push(this._compileMaterialsAsync());
                }

                if (this._parent.compileShadowGenerators) {
                    promises.push(this._compileShadowGeneratorsAsync());
                }

                const resultPromise = Promise.all(promises).then(() => {
                    this._setState(GLTFLoaderState.READY);
                    this._extensionsOnReady();

                    this._startAnimations();

                    return resultFunc();
                });

                resultPromise.then(() => {
                    this._parent._endPerformanceCounter(loadingToReadyCounterName);

                    Tools.SetImmediate(() => {
                        if (!this._disposed) {
                            Promise.all(this._completePromises).then(() => {
                                this._parent._endPerformanceCounter(loadingToCompleteCounterName);

                                this._setState(GLTFLoaderState.COMPLETE);

                                this._parent.onCompleteObservable.notifyObservers(undefined);
                                this._parent.onCompleteObservable.clear();

                                this.dispose();
                            }, (error) => {
                                this._parent.onErrorObservable.notifyObservers(error);
                                this._parent.onErrorObservable.clear();

                                this.dispose();
                            });
                        }
                    });
                });

                return resultPromise;
            }, (error) => {
                if (!this._disposed) {
                    this._parent.onErrorObservable.notifyObservers(error);
                    this._parent.onErrorObservable.clear();

                    this.dispose();
                }

                throw error;
            });
        }

        private _loadData(data: IGLTFLoaderData): void {
            this.gltf = data.json as Loader.IGLTF;
            this._setupData();

            if (data.bin) {
                const buffers = this.gltf.buffers;
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
            ArrayItem.Assign(this.gltf.accessors);
            ArrayItem.Assign(this.gltf.animations);
            ArrayItem.Assign(this.gltf.buffers);
            ArrayItem.Assign(this.gltf.bufferViews);
            ArrayItem.Assign(this.gltf.cameras);
            ArrayItem.Assign(this.gltf.images);
            ArrayItem.Assign(this.gltf.materials);
            ArrayItem.Assign(this.gltf.meshes);
            ArrayItem.Assign(this.gltf.nodes);
            ArrayItem.Assign(this.gltf.samplers);
            ArrayItem.Assign(this.gltf.scenes);
            ArrayItem.Assign(this.gltf.skins);
            ArrayItem.Assign(this.gltf.textures);

            if (this.gltf.nodes) {
                const nodeParents: { [index: number]: number } = {};
                for (const node of this.gltf.nodes) {
                    if (node.children) {
                        for (const index of node.children) {
                            nodeParents[index] = node.index;
                        }
                    }
                }

                const rootNode = this._createRootNode();
                for (const node of this.gltf.nodes) {
                    const parentIndex = nodeParents[node.index];
                    node.parent = parentIndex === undefined ? rootNode : this.gltf.nodes[parentIndex];
                }
            }
        }

        private _loadExtensions(): void {
            for (const name of GLTFLoader._ExtensionNames) {
                const extension = GLTFLoader._ExtensionFactories[name](this);
                this._extensions[name] = extension;

                this._parent.onExtensionLoadedObservable.notifyObservers(extension);
            }

            this._parent.onExtensionLoadedObservable.clear();
        }

        private _checkExtensions(): void {
            if (this.gltf.extensionsRequired) {
                for (const name of this.gltf.extensionsRequired) {
                    const extension = this._extensions[name];
                    if (!extension || !extension.enabled) {
                        throw new Error(`Require extension ${name} is not available`);
                    }
                }
            }
        }

        private _setState(state: GLTFLoaderState): void {
            this._state = state;
            this.log(GLTFLoaderState[this._state]);
        }

        private _createRootNode(): Loader.INode {
            this._rootBabylonMesh = new Mesh("__root__", this.babylonScene);

            const rootNode: Loader.INode = {
                _babylonMesh: this._rootBabylonMesh,
                index: -1
            };

            switch (this._parent.coordinateSystemMode) {
                case GLTFLoaderCoordinateSystemMode.AUTO: {
                    if (!this.babylonScene.useRightHandedSystem) {
                        rootNode.rotation = [0, 1, 0, 0];
                        rootNode.scale = [1, 1, -1];
                        GLTFLoader._LoadTransform(rootNode, this._rootBabylonMesh);
                    }
                    break;
                }
                case GLTFLoaderCoordinateSystemMode.FORCE_RIGHT_HANDED: {
                    this.babylonScene.useRightHandedSystem = true;
                    break;
                }
                default: {
                    throw new Error(`Invalid coordinate system mode (${this._parent.coordinateSystemMode})`);
                }
            }

            this._parent.onMeshLoadedObservable.notifyObservers(this._rootBabylonMesh);
            return rootNode;
        }

        /**
         * Loads a glTF scene.
         * @param context The context when loading the asset
         * @param scene The glTF scene property
         * @returns A promise that resolves when the load is complete
         */
        public loadSceneAsync(context: string, scene: Loader.IScene): Promise<void> {
            const extensionPromise = this._extensionsLoadSceneAsync(context, scene);
            if (extensionPromise) {
                return extensionPromise;
            }

            const promises = new Array<Promise<any>>();

            this.logOpen(`${context} ${scene.name || ""}`);

            if (scene.nodes) {
                for (let index of scene.nodes) {
                    const node = ArrayItem.Get(`${context}/nodes/${index}`, this.gltf.nodes, index);
                    promises.push(this.loadNodeAsync(`#/nodes/${node.index}`, node, (babylonMesh) => {
                        babylonMesh.parent = this._rootBabylonMesh;
                    }));
                }
            }

            promises.push(this._loadAnimationsAsync());

            this.logClose();

            return Promise.all(promises).then(() => { });
        }

        private _forEachPrimitive(node: Loader.INode, callback: (babylonMesh: Mesh) => void): void {
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

            const nodes = this.gltf.nodes;
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

            const skins = this.gltf.skins;
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

            const animations = this.gltf.animations;
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
            switch (this._parent.animationStartMode) {
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
                    Tools.Error(`Invalid animation start mode (${this._parent.animationStartMode})`);
                    return;
                }
            }
        }

        /**
         * Loads a glTF node.
         * @param context The context when loading the asset
         * @param node The glTF node property
         * @param assign A function called synchronously after parsing the glTF properties
         * @returns A promise that resolves with the loaded Babylon mesh when the load is complete
         */
        public loadNodeAsync(context: string, node: Loader.INode, assign: (babylonMesh: Mesh) => void = () => { }): Promise<Mesh> {
            const extensionPromise = this._extensionsLoadNodeAsync(context, node, assign);
            if (extensionPromise) {
                return extensionPromise;
            }

            if (node._babylonMesh) {
                throw new Error(`${context}: Invalid recursive node hierarchy`);
            }

            const promises = new Array<Promise<any>>();

            this.logOpen(`${context} ${node.name || ""}`);

            const babylonMesh = new Mesh(node.name || `node${node.index}`, this.babylonScene);
            node._babylonMesh = babylonMesh;

            babylonMesh.setEnabled(false);
            GLTFLoader._LoadTransform(node, babylonMesh);

            if (node.mesh != undefined) {
                const mesh = ArrayItem.Get(`${context}/mesh`, this.gltf.meshes, node.mesh);
                promises.push(this._loadMeshAsync(`#/meshes/${mesh.index}`, node, mesh, babylonMesh));
            }

            if (node.camera != undefined) {
                const camera = ArrayItem.Get(`${context}/camera`, this.gltf.cameras, node.camera);
                promises.push(this.loadCameraAsync(`#/cameras/${camera.index}`, camera, (babylonCamera) => {
                    babylonCamera.parent = babylonMesh;
                }));
            }

            if (node.children) {
                for (const index of node.children) {
                    const childNode = ArrayItem.Get(`${context}/children/${index}`, this.gltf.nodes, index);
                    promises.push(this.loadNodeAsync(`#/nodes/${node.index}`, childNode, (childBabylonMesh) => {
                        // See https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#skins (second implementation note)
                        if (childNode.skin != undefined) {
                            childBabylonMesh.parent = this._rootBabylonMesh;
                            return;
                        }

                        childBabylonMesh.parent = babylonMesh;
                    }));
                }
            }

            assign(babylonMesh);
            this._parent.onMeshLoadedObservable.notifyObservers(babylonMesh);

            this.logClose();

            return Promise.all(promises).then(() => {
                babylonMesh.setEnabled(true);
                return babylonMesh;
            });
        }

        private _loadMeshAsync(context: string, node: Loader.INode, mesh: Loader.IMesh, babylonMesh: Mesh): Promise<void> {
            const promises = new Array<Promise<any>>();

            this.logOpen(`${context} ${mesh.name || ""}`);

            const primitives = mesh.primitives;
            if (!primitives || primitives.length === 0) {
                throw new Error(`${context}: Primitives are missing`);
            }

            ArrayItem.Assign(primitives);
            if (primitives.length === 1) {
                const primitive = primitives[0];
                promises.push(this._loadMeshPrimitiveAsync(`${context}/primitives/${primitive.index}`, node, mesh, primitive, babylonMesh));
            }
            else {
                node._primitiveBabylonMeshes = [];
                for (const primitive of primitives) {
                    const primitiveBabylonMesh = new Mesh(`${mesh.name || babylonMesh.name}_${primitive.index}`, this.babylonScene, babylonMesh);
                    node._primitiveBabylonMeshes.push(primitiveBabylonMesh);
                    promises.push(this._loadMeshPrimitiveAsync(`${context}/primitives/${primitive.index}`, node, mesh, primitive, primitiveBabylonMesh));
                    this._parent.onMeshLoadedObservable.notifyObservers(babylonMesh);
                }
            }

            if (node.skin != undefined) {
                const skin = ArrayItem.Get(`${context}/skin`, this.gltf.skins, node.skin);
                promises.push(this._loadSkinAsync(`#/skins/${skin.index}`, node, skin));
            }

            this.logClose();

            return Promise.all(promises).then(() => {
                this._forEachPrimitive(node, (babylonMesh) => {
                    babylonMesh._refreshBoundingInfo(true);
                });
            });
        }

        private _loadMeshPrimitiveAsync(context: string, node: Loader.INode, mesh: Loader.IMesh, primitive: Loader.IMeshPrimitive, babylonMesh: Mesh): Promise<void> {
            const promises = new Array<Promise<any>>();

            this.logOpen(`${context}`);

            this._createMorphTargets(context, node, mesh, primitive, babylonMesh);
            promises.push(this._loadVertexDataAsync(context, primitive, babylonMesh).then((babylonGeometry) => {
                return this._loadMorphTargetsAsync(context, primitive, babylonMesh, babylonGeometry).then(() => {
                    babylonGeometry.applyToMesh(babylonMesh);
                });
            }));

            const babylonDrawMode = GLTFLoader._GetDrawMode(context, primitive.mode);
            if (primitive.material == undefined) {
                let babylonMaterial = this._defaultBabylonMaterialData[babylonDrawMode];
                if (!babylonMaterial) {
                    babylonMaterial = this._createDefaultMaterial("__gltf_default", babylonDrawMode);
                    this._parent.onMaterialLoadedObservable.notifyObservers(babylonMaterial);
                    this._defaultBabylonMaterialData[babylonDrawMode] = babylonMaterial;
                }
                babylonMesh.material = babylonMaterial;
            }
            else {
                const material = ArrayItem.Get(`${context}/material`, this.gltf.materials, primitive.material);
                promises.push(this._loadMaterialAsync(`#/materials/${material.index}`, material, babylonMesh, babylonDrawMode, (babylonMaterial) => {
                    babylonMesh.material = babylonMaterial;
                }));
            }

            this.logClose();

            return Promise.all(promises).then(() => { });
        }

        private _loadVertexDataAsync(context: string, primitive: Loader.IMeshPrimitive, babylonMesh: Mesh): Promise<Geometry> {
            const extensionPromise = this._extensionsLoadVertexDataAsync(context, primitive, babylonMesh);
            if (extensionPromise) {
                return extensionPromise;
            }

            const attributes = primitive.attributes;
            if (!attributes) {
                throw new Error(`${context}: Attributes are missing`);
            }

            const promises = new Array<Promise<any>>();

            const babylonGeometry = new Geometry(babylonMesh.name, this.babylonScene);

            if (primitive.indices == undefined) {
                babylonMesh.isUnIndexed = true;
            }
            else {
                const accessor = ArrayItem.Get(`${context}/indices`, this.gltf.accessors, primitive.indices);
                promises.push(this._loadIndicesAccessorAsync(`#/accessors/${accessor.index}`, accessor).then((data) => {
                    babylonGeometry.setIndices(data);
                }));
            }

            const loadAttribute = (attribute: string, kind: string, callback?: (accessor: Loader.IAccessor) => void) => {
                if (attributes[attribute] == undefined) {
                    return;
                }

                babylonMesh._delayInfo = babylonMesh._delayInfo || [];
                if (babylonMesh._delayInfo.indexOf(kind) === -1) {
                    babylonMesh._delayInfo.push(kind);
                }

                const accessor = ArrayItem.Get(`${context}/attributes/${attribute}`, this.gltf.accessors, attributes[attribute]);
                promises.push(this._loadVertexAccessorAsync(`#/accessors/${accessor.index}`, accessor, kind).then((babylonVertexBuffer) => {
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
            loadAttribute("COLOR_0", VertexBuffer.ColorKind, (accessor) => {
                if (accessor.type === AccessorType.VEC4) {
                    babylonMesh.hasVertexAlpha = true;
                }
            });

            return Promise.all(promises).then(() => {
                return babylonGeometry;
            });
        }

        private _createMorphTargets(context: string, node: Loader.INode, mesh: Loader.IMesh, primitive: Loader.IMeshPrimitive, babylonMesh: Mesh): void {
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

        private _loadMorphTargetsAsync(context: string, primitive: Loader.IMeshPrimitive, babylonMesh: Mesh, babylonGeometry: Geometry): Promise<void> {
            if (!primitive.targets) {
                return Promise.resolve();
            }

            const promises = new Array<Promise<any>>();

            const morphTargetManager = babylonMesh.morphTargetManager!;
            for (let index = 0; index < morphTargetManager.numTargets; index++) {
                const babylonMorphTarget = morphTargetManager.getTarget(index);
                promises.push(this._loadMorphTargetVertexDataAsync(`${context}/targets/${index}`, babylonGeometry, primitive.targets[index], babylonMorphTarget));
            }

            return Promise.all(promises).then(() => { });
        }

        private _loadMorphTargetVertexDataAsync(context: string, babylonGeometry: Geometry, attributes: { [name: string]: number }, babylonMorphTarget: MorphTarget): Promise<void> {
            const promises = new Array<Promise<any>>();

            const loadAttribute = (attribute: string, kind: string, setData: (babylonVertexBuffer: VertexBuffer, data: Float32Array) => void) => {
                if (attributes[attribute] == undefined) {
                    return;
                }

                const babylonVertexBuffer = babylonGeometry.getVertexBuffer(kind);
                if (!babylonVertexBuffer) {
                    return;
                }

                const accessor = ArrayItem.Get(`${context}/${attribute}`, this.gltf.accessors, attributes[attribute]);
                promises.push(this._loadFloatAccessorAsync(`#/accessors/${accessor.index}`, accessor).then((data) => {
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
                babylonVertexBuffer.forEach(data.length / 3 * 4, (value, index) => {
                    // Tangent data for morph targets is stored as xyz delta.
                    // The vertexData.tangent is stored as xyzw.
                    // So we need to skip every fourth vertexData.tangent.
                    if (((index + 1) % 4) !== 0) {
                        data[dataIndex++] += value;
                    }
                });
                babylonMorphTarget.setTangents(data);
            });

            return Promise.all(promises).then(() => { });
        }

        private static _LoadTransform(node: Loader.INode, babylonNode: TransformNode): void {
            let position = Vector3.Zero();
            let rotation = Quaternion.Identity();
            let scaling = Vector3.One();

            if (node.matrix) {
                const matrix = Matrix.FromArray(node.matrix);
                matrix.decompose(scaling, rotation, position);
            }
            else {
                if (node.translation) { position = Vector3.FromArray(node.translation); }
                if (node.rotation) { rotation = Quaternion.FromArray(node.rotation); }
                if (node.scale) { scaling = Vector3.FromArray(node.scale); }
            }

            babylonNode.position = position;
            babylonNode.rotationQuaternion = rotation;
            babylonNode.scaling = scaling;
        }

        private _loadSkinAsync(context: string, node: Loader.INode, skin: Loader.ISkin): Promise<void> {
            const assignSkeleton = (skeleton: Skeleton) => {
                this._forEachPrimitive(node, (babylonMesh) => {
                    babylonMesh.skeleton = skeleton;
                });

                // Ignore the TRS of skinned nodes.
                // See https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#skins (second implementation note)
                node._babylonMesh!.position = Vector3.Zero();
                node._babylonMesh!.rotationQuaternion = Quaternion.Identity();
                node._babylonMesh!.scaling = Vector3.One();
            };

            if (skin._promise) {
                return skin._promise.then(() => {
                    assignSkeleton(skin._babylonSkeleton!);
                });
            }

            const skeletonId = `skeleton${skin.index}`;
            const babylonSkeleton = new Skeleton(skin.name || skeletonId, skeletonId, this.babylonScene);
            skin._babylonSkeleton = babylonSkeleton;
            this._loadBones(context, skin);
            assignSkeleton(babylonSkeleton);

            return (skin._promise = this._loadSkinInverseBindMatricesDataAsync(context, skin).then((inverseBindMatricesData) => {
                this._updateBoneMatrices(babylonSkeleton, inverseBindMatricesData);
            }));
        }

        private _loadBones(context: string, skin: Loader.ISkin): void {
            const babylonBones: { [index: number]: Bone } = {};
            for (const index of skin.joints) {
                const node = ArrayItem.Get(`${context}/joints/${index}`, this.gltf.nodes, index);
                this._loadBone(node, skin, babylonBones);
            }
        }

        private _loadBone(node: Loader.INode, skin: Loader.ISkin, babylonBones: { [index: number]: Bone }): Bone {
            let babylonBone = babylonBones[node.index];
            if (babylonBone) {
                return babylonBone;
            }

            let babylonParentBone: Nullable<Bone> = null;
            if (node.parent && node.parent._babylonMesh !== this._rootBabylonMesh) {
                babylonParentBone = this._loadBone(node.parent, skin, babylonBones);
            }

            const boneIndex = skin.joints.indexOf(node.index);

            babylonBone = new Bone(node.name || `joint${node.index}`, skin._babylonSkeleton!, babylonParentBone, this._getNodeMatrix(node), null, null, boneIndex);
            babylonBones[node.index] = babylonBone;

            node._babylonBones = node._babylonBones || [];
            node._babylonBones.push(babylonBone);

            return babylonBone;
        }

        private _loadSkinInverseBindMatricesDataAsync(context: string, skin: Loader.ISkin): Promise<Nullable<Float32Array>> {
            if (skin.inverseBindMatrices == undefined) {
                return Promise.resolve(null);
            }

            const accessor = ArrayItem.Get(`${context}/inverseBindMatrices`, this.gltf.accessors, skin.inverseBindMatrices);
            return this._loadFloatAccessorAsync(`#/accessors/${accessor.index}`, accessor);
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

        private _getNodeMatrix(node: Loader.INode): Matrix {
            return node.matrix ?
                Matrix.FromArray(node.matrix) :
                Matrix.Compose(
                    node.scale ? Vector3.FromArray(node.scale) : Vector3.One(),
                    node.rotation ? Quaternion.FromArray(node.rotation) : Quaternion.Identity(),
                    node.translation ? Vector3.FromArray(node.translation) : Vector3.Zero());
        }

        /**
         * Loads a glTF camera.
         * @param context The context when loading the asset
         * @param camera The glTF camera property
         * @param assign A function called synchronously after parsing the glTF properties
         * @returns A promise that resolves with the loaded Babylon camera when the load is complete
         */
        public loadCameraAsync(context: string, camera: Loader.ICamera, assign: (babylonCamera: Camera) => void = () => { }): Promise<Camera> {
            const extensionPromise = this._extensionsLoadCameraAsync(context, camera, assign);
            if (extensionPromise) {
                return extensionPromise;
            }

            const promises = new Array<Promise<any>>();

            this.logOpen(`${context} ${camera.name || ""}`);

            const babylonCamera = new FreeCamera(camera.name || `camera${camera.index}`, Vector3.Zero(), this.babylonScene, false);
            babylonCamera.rotation = new Vector3(0, Math.PI, 0);

            switch (camera.type) {
                case CameraType.PERSPECTIVE: {
                    const perspective = camera.perspective;
                    if (!perspective) {
                        throw new Error(`${context}: Camera perspective properties are missing`);
                    }

                    babylonCamera.fov = perspective.yfov;
                    babylonCamera.minZ = perspective.znear;
                    babylonCamera.maxZ = perspective.zfar || Number.MAX_VALUE;
                    break;
                }
                case CameraType.ORTHOGRAPHIC: {
                    if (!camera.orthographic) {
                        throw new Error(`${context}: Camera orthographic properties are missing`);
                    }

                    babylonCamera.mode = Camera.ORTHOGRAPHIC_CAMERA;
                    babylonCamera.orthoLeft = -camera.orthographic.xmag;
                    babylonCamera.orthoRight = camera.orthographic.xmag;
                    babylonCamera.orthoBottom = -camera.orthographic.ymag;
                    babylonCamera.orthoTop = camera.orthographic.ymag;
                    babylonCamera.minZ = camera.orthographic.znear;
                    babylonCamera.maxZ = camera.orthographic.zfar;
                    break;
                }
                default: {
                    throw new Error(`${context}: Invalid camera type (${camera.type})`);
                }
            }

            assign(babylonCamera);
            this._parent.onCameraLoadedObservable.notifyObservers(babylonCamera);

            return Promise.all(promises).then(() => {
                return babylonCamera;
            });
        }

        private _loadAnimationsAsync(): Promise<void> {
            const animations = this.gltf.animations;
            if (!animations) {
                return Promise.resolve();
            }

            const promises = new Array<Promise<any>>();

            for (let index = 0; index < animations.length; index++) {
                const animation = animations[index];
                promises.push(this.loadAnimationAsync(`#/animations/${animation.index}`, animation));
            }

            return Promise.all(promises).then(() => { });
        }

        /**
         * Loads a glTF animation.
         * @param context The context when loading the asset
         * @param animation The glTF animation property
         * @returns A promise that resolves with the loaded Babylon animation group when the load is complete
         */
        public loadAnimationAsync(context: string, animation: Loader.IAnimation): Promise<AnimationGroup> {
            const promise = this._extensionsLoadAnimationAsync(context, animation);
            if (promise) {
                return promise;
            }

            const babylonAnimationGroup = new AnimationGroup(animation.name || `animation${animation.index}`, this.babylonScene);
            animation._babylonAnimationGroup = babylonAnimationGroup;

            const promises = new Array<Promise<any>>();

            ArrayItem.Assign(animation.channels);
            ArrayItem.Assign(animation.samplers);

            for (const channel of animation.channels) {
                promises.push(this._loadAnimationChannelAsync(`${context}/channels/${channel.index}`, context, animation, channel, babylonAnimationGroup));
            }

            return Promise.all(promises).then(() => {
                babylonAnimationGroup.normalize(0);
                return babylonAnimationGroup;
            });
        }

        private _loadAnimationChannelAsync(context: string, animationContext: string, animation: Loader.IAnimation, channel: Loader.IAnimationChannel, babylonAnimationGroup: AnimationGroup): Promise<void> {
            if (channel.target.node == undefined) {
                return Promise.resolve();
            }

            const targetNode = ArrayItem.Get(`${context}/target/node`, this.gltf.nodes, channel.target.node);

            // Ignore animations that have no animation targets.
            if ((channel.target.path === AnimationChannelTargetPath.WEIGHTS && !targetNode._numMorphTargets) ||
                (channel.target.path !== AnimationChannelTargetPath.WEIGHTS && !targetNode._babylonMesh)) {
                return Promise.resolve();
            }

            // Ignore animations targeting TRS of skinned nodes.
            // See https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#skins (second implementation note)
            if (targetNode.skin != undefined && channel.target.path !== AnimationChannelTargetPath.WEIGHTS) {
                return Promise.resolve();
            }

            const sampler = ArrayItem.Get(`${context}/sampler`, animation.samplers, channel.sampler);
            return this._loadAnimationSamplerAsync(`${animationContext}/samplers/${channel.sampler}`, sampler).then((data) => {
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
                        throw new Error(`${context}/target/path: Invalid value (${channel.target.path})`);
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
                        getNextKey = (frameIndex) => ({
                            frame: data.input[frameIndex],
                            value: getNextOutputValue(),
                            interpolation: AnimationKeyInterpolation.STEP
                        });
                        break;
                    }
                    case AnimationSamplerInterpolation.LINEAR: {
                        getNextKey = (frameIndex) => ({
                            frame: data.input[frameIndex],
                            value: getNextOutputValue()
                        });
                        break;
                    }
                    case AnimationSamplerInterpolation.CUBICSPLINE: {
                        getNextKey = (frameIndex) => ({
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
                        babylonAnimation.setKeys(keys.map((key) => ({
                            frame: key.frame,
                            inTangent: key.inTangent ? key.inTangent[targetIndex] : undefined,
                            value: key.value[targetIndex],
                            outTangent: key.outTangent ? key.outTangent[targetIndex] : undefined
                        })));

                        this._forEachPrimitive(targetNode, (babylonMesh) => {
                            const morphTarget = babylonMesh.morphTargetManager!.getTarget(targetIndex);
                            const babylonAnimationClone = babylonAnimation.clone();
                            morphTarget.animations.push(babylonAnimationClone);
                            babylonAnimationGroup.addTargetedAnimation(babylonAnimationClone, morphTarget);
                        });
                    }
                }
                else {
                    const animationName = `${babylonAnimationGroup.name}_channel${babylonAnimationGroup.targetedAnimations.length}`;
                    const babylonAnimation = new Animation(animationName, targetPath, 1, animationType);
                    babylonAnimation.setKeys(keys);

                    if (targetNode._babylonBones) {
                        const babylonAnimationTargets = [targetNode._babylonMesh!, ...targetNode._babylonBones];
                        for (const babylonAnimationTarget of babylonAnimationTargets) {
                            babylonAnimationTarget.animations.push(babylonAnimation);
                        }
                        babylonAnimationGroup.addTargetedAnimation(babylonAnimation, babylonAnimationTargets);
                    }
                    else {
                        targetNode._babylonMesh!.animations.push(babylonAnimation);
                        babylonAnimationGroup.addTargetedAnimation(babylonAnimation, targetNode._babylonMesh);
                    }
                }
            });
        }

        private _loadAnimationSamplerAsync(context: string, sampler: Loader.IAnimationSampler): Promise<Loader._IAnimationSamplerData> {
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
                    throw new Error(`${context}/interpolation: Invalid value (${sampler.interpolation})`);
                }
            }

            const inputAccessor = ArrayItem.Get(`${context}/input`, this.gltf.accessors, sampler.input);
            const outputAccessor = ArrayItem.Get(`${context}/output`, this.gltf.accessors, sampler.output);
            sampler._data = Promise.all([
                this._loadFloatAccessorAsync(`#/accessors/${inputAccessor.index}`, inputAccessor),
                this._loadFloatAccessorAsync(`#/accessors/${outputAccessor.index}`, outputAccessor)
            ]).then(([inputData, outputData]) => {
                return {
                    input: inputData,
                    interpolation: interpolation,
                    output: outputData,
                };
            });

            return sampler._data;
        }

        private _loadBufferAsync(context: string, buffer: Loader.IBuffer): Promise<ArrayBufferView> {
            if (buffer._data) {
                return buffer._data;
            }

            if (!buffer.uri) {
                throw new Error(`${context}/uri: Value is missing`);
            }

            buffer._data = this.loadUriAsync(`${context}/uri`, buffer.uri);

            return buffer._data;
        }

        /**
         * Loads a glTF buffer view.
         * @param context The context when loading the asset
         * @param bufferView The glTF buffer view property
         * @returns A promise that resolves with the loaded data when the load is complete
         */
        public loadBufferViewAsync(context: string, bufferView: Loader.IBufferView): Promise<ArrayBufferView> {
            if (bufferView._data) {
                return bufferView._data;
            }

            const buffer = ArrayItem.Get(`${context}/buffer`, this.gltf.buffers, bufferView.buffer);
            bufferView._data = this._loadBufferAsync(`#/buffers/${buffer.index}`, buffer).then((data) => {
                try {
                    return new Uint8Array(data.buffer, data.byteOffset + (bufferView.byteOffset || 0), bufferView.byteLength);
                }
                catch (e) {
                    throw new Error(`${context}: ${e.message}`);
                }
            });

            return bufferView._data;
        }

        private _loadIndicesAccessorAsync(context: string, accessor: Loader.IAccessor): Promise<IndicesArray> {
            if (accessor.type !== AccessorType.SCALAR) {
                throw new Error(`${context}/type: Invalid value ${accessor.type}`);
            }

            if (accessor.componentType !== AccessorComponentType.UNSIGNED_BYTE &&
                accessor.componentType !== AccessorComponentType.UNSIGNED_SHORT &&
                accessor.componentType !== AccessorComponentType.UNSIGNED_INT) {
                throw new Error(`${context}/componentType: Invalid value ${accessor.componentType}`);
            }

            if (accessor._data) {
                return accessor._data as Promise<IndicesArray>;
            }

            const bufferView = ArrayItem.Get(`${context}/bufferView`, this.gltf.bufferViews, accessor.bufferView);
            accessor._data = this.loadBufferViewAsync(`#/bufferViews/${bufferView.index}`, bufferView).then((data) => {
                return GLTFLoader._GetTypedArray(context, accessor.componentType, data, accessor.byteOffset, accessor.count);
            });

            return accessor._data as Promise<IndicesArray>;
        }

        private _loadFloatAccessorAsync(context: string, accessor: Loader.IAccessor): Promise<Float32Array> {
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
                const bufferView = ArrayItem.Get(`${context}/bufferView`, this.gltf.bufferViews, accessor.bufferView);
                accessor._data = this.loadBufferViewAsync(`#/bufferViews/${bufferView.index}`, bufferView).then((data) => {
                    return GLTFLoader._GetTypedArray(context, accessor.componentType, data, accessor.byteOffset, length);
                });
            }

            if (accessor.sparse) {
                const sparse = accessor.sparse;
                accessor._data = accessor._data.then((data: Float32Array) => {
                    const indicesBufferView = ArrayItem.Get(`${context}/sparse/indices/bufferView`, this.gltf.bufferViews, sparse.indices.bufferView);
                    const valuesBufferView = ArrayItem.Get(`${context}/sparse/values/bufferView`, this.gltf.bufferViews, sparse.values.bufferView);
                    return Promise.all([
                        this.loadBufferViewAsync(`#/bufferViews/${indicesBufferView.index}`, indicesBufferView),
                        this.loadBufferViewAsync(`#/bufferViews/${valuesBufferView.index}`, valuesBufferView)
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

        private _loadVertexBufferViewAsync(bufferView: Loader.IBufferView, kind: string): Promise<Buffer> {
            if (bufferView._babylonBuffer) {
                return bufferView._babylonBuffer;
            }

            bufferView._babylonBuffer = this.loadBufferViewAsync(`#/bufferViews/${bufferView.index}`, bufferView).then((data) => {
                return new Buffer(this.babylonScene.getEngine(), data, false);
            });

            return bufferView._babylonBuffer;
        }

        private _loadVertexAccessorAsync(context: string, accessor: Loader.IAccessor, kind: string): Promise<VertexBuffer> {
            if (accessor._babylonVertexBuffer) {
                return accessor._babylonVertexBuffer;
            }

            if (accessor.sparse) {
                accessor._babylonVertexBuffer = this._loadFloatAccessorAsync(`#/accessors/${accessor.index}`, accessor).then((data) => {
                    return new VertexBuffer(this.babylonScene.getEngine(), data, kind, false);
                });
            }
            // HACK: If byte offset is not a multiple of component type byte length then load as a float array instead of using Babylon buffers.
            else if (accessor.byteOffset && accessor.byteOffset % VertexBuffer.GetTypeByteLength(accessor.componentType) !== 0) {
                Tools.Warn("Accessor byte offset is not a multiple of component type byte length");
                accessor._babylonVertexBuffer = this._loadFloatAccessorAsync(`#/accessors/${accessor.index}`, accessor).then((data) => {
                    return new VertexBuffer(this.babylonScene.getEngine(), data, kind, false);
                });
            }
            else {
                const bufferView = ArrayItem.Get(`${context}/bufferView`, this.gltf.bufferViews, accessor.bufferView);
                accessor._babylonVertexBuffer = this._loadVertexBufferViewAsync(bufferView, kind).then((babylonBuffer) => {
                    const size = GLTFLoader._GetNumComponents(context, accessor.type);
                    return new VertexBuffer(this.babylonScene.getEngine(), babylonBuffer, kind, false, false, bufferView.byteStride,
                        false, accessor.byteOffset, size, accessor.componentType, accessor.normalized, true);
                });
            }

            return accessor._babylonVertexBuffer;
        }

        private _loadMaterialMetallicRoughnessPropertiesAsync(context: string, properties: Loader.IMaterialPbrMetallicRoughness, babylonMaterial: Material): Promise<void> {
            if (!(babylonMaterial instanceof PBRMaterial)) {
                throw new Error(`${context}: Material type not supported`);
            }

            const promises = new Array<Promise<any>>();

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
                    promises.push(this.loadTextureInfoAsync(`${context}/baseColorTexture`, properties.baseColorTexture, (texture) => {
                        babylonMaterial.albedoTexture = texture;
                    }));
                }

                if (properties.metallicRoughnessTexture) {
                    promises.push(this.loadTextureInfoAsync(`${context}/metallicRoughnessTexture`, properties.metallicRoughnessTexture, (texture) => {
                        babylonMaterial.metallicTexture = texture;
                    }));

                    babylonMaterial.useMetallnessFromMetallicTextureBlue = true;
                    babylonMaterial.useRoughnessFromMetallicTextureGreen = true;
                    babylonMaterial.useRoughnessFromMetallicTextureAlpha = false;
                }
            }

            return Promise.all(promises).then(() => { });
        }

        /** @hidden */
        public _loadMaterialAsync(context: string, material: Loader.IMaterial, babylonMesh: Mesh, babylonDrawMode: number, assign: (babylonMaterial: Material) => void = () => { }): Promise<Material> {
            const extensionPromise = this._extensionsLoadMaterialAsync(context, material, babylonMesh, babylonDrawMode, assign);
            if (extensionPromise) {
                return extensionPromise;
            }

            material._babylonData = material._babylonData || {};
            let babylonData = material._babylonData[babylonDrawMode];
            if (!babylonData) {
                this.logOpen(`${context} ${material.name || ""}`);

                const babylonMaterial = this.createMaterial(context, material, babylonDrawMode);

                babylonData = {
                    material: babylonMaterial,
                    meshes: [],
                    promise: this.loadMaterialPropertiesAsync(context, material, babylonMaterial)
                };

                material._babylonData[babylonDrawMode] = babylonData;

                this._parent.onMaterialLoadedObservable.notifyObservers(babylonMaterial);

                this.logClose();
            }

            babylonData.meshes.push(babylonMesh);

            babylonMesh.onDisposeObservable.addOnce(() => {
                const index = babylonData.meshes.indexOf(babylonMesh);
                if (index !== -1) {
                    babylonData.meshes.splice(index, 1);
                }
            });

            assign(babylonData.material);

            return babylonData.promise.then(() => {
                return babylonData.material;
            });
        }

        private _createDefaultMaterial(name: string, babylonDrawMode: number): Material {
            const babylonMaterial = new PBRMaterial(name, this.babylonScene);
            babylonMaterial.sideOrientation = this.babylonScene.useRightHandedSystem ? Material.CounterClockWiseSideOrientation : Material.ClockWiseSideOrientation;
            babylonMaterial.fillMode = babylonDrawMode;
            babylonMaterial.enableSpecularAntiAliasing = true;
            babylonMaterial.useRadianceOverAlpha = !this._parent.transparencyAsCoverage;
            babylonMaterial.useSpecularOverAlpha = !this._parent.transparencyAsCoverage;
            babylonMaterial.transparencyMode = PBRMaterial.PBRMATERIAL_OPAQUE;
            babylonMaterial.metallic = 1;
            babylonMaterial.roughness = 1;
            return babylonMaterial;
        }

        /**
         * Creates a Babylon material from a glTF material.
         * @param context The context when loading the asset
         * @param material The glTF material property
         * @param babylonDrawMode The draw mode for the Babylon material
         * @returns The Babylon material
         */
        public createMaterial(context: string, material: Loader.IMaterial, babylonDrawMode: number): Material {
            const extensionPromise = this._extensionsCreateMaterial(context, material, babylonDrawMode);
            if (extensionPromise) {
                return extensionPromise;
            }

            const name = material.name || `material${material.index}`;
            return this._createDefaultMaterial(name, babylonDrawMode);
        }

        /**
         * Loads properties from a glTF material into a Babylon material.
         * @param context The context when loading the asset
         * @param material The glTF material property
         * @param babylonMaterial The Babylon material
         * @returns A promise that resolves when the load is complete
         */
        public loadMaterialPropertiesAsync(context: string, material: Loader.IMaterial, babylonMaterial: Material): Promise<void> {
            const extensionPromise = this._extensionsLoadMaterialPropertiesAsync(context, material, babylonMaterial);
            if (extensionPromise) {
                return extensionPromise;
            }

            const promises = new Array<Promise<any>>();

            promises.push(this.loadMaterialBasePropertiesAsync(context, material, babylonMaterial));

            if (material.pbrMetallicRoughness) {
                promises.push(this._loadMaterialMetallicRoughnessPropertiesAsync(`${context}/pbrMetallicRoughness`, material.pbrMetallicRoughness, babylonMaterial));
            }

            this.loadMaterialAlphaProperties(context, material, babylonMaterial);

            return Promise.all(promises).then(() => { });
        }

        /**
         * Loads the normal, occlusion, and emissive properties from a glTF material into a Babylon material.
         * @param context The context when loading the asset
         * @param material The glTF material property
         * @param babylonMaterial The Babylon material
         * @returns A promise that resolves when the load is complete
         */
        public loadMaterialBasePropertiesAsync(context: string, material: Loader.IMaterial, babylonMaterial: Material): Promise<void> {
            if (!(babylonMaterial instanceof PBRMaterial)) {
                throw new Error(`${context}: Material type not supported`);
            }

            const promises = new Array<Promise<any>>();

            babylonMaterial.emissiveColor = material.emissiveFactor ? Color3.FromArray(material.emissiveFactor) : new Color3(0, 0, 0);
            if (material.doubleSided) {
                babylonMaterial.backFaceCulling = false;
                babylonMaterial.twoSidedLighting = true;
            }

            if (material.normalTexture) {
                promises.push(this.loadTextureInfoAsync(`${context}/normalTexture`, material.normalTexture, (texture) => {
                    babylonMaterial.bumpTexture = texture;
                }));

                babylonMaterial.invertNormalMapX = !this.babylonScene.useRightHandedSystem;
                babylonMaterial.invertNormalMapY = this.babylonScene.useRightHandedSystem;
                if (material.normalTexture.scale != undefined) {
                    babylonMaterial.bumpTexture.level = material.normalTexture.scale;
                }
            }

            if (material.occlusionTexture) {
                promises.push(this.loadTextureInfoAsync(`${context}/occlusionTexture`, material.occlusionTexture, (texture) => {
                    babylonMaterial.ambientTexture = texture;
                }));

                babylonMaterial.useAmbientInGrayScale = true;
                if (material.occlusionTexture.strength != undefined) {
                    babylonMaterial.ambientTextureStrength = material.occlusionTexture.strength;
                }
            }

            if (material.emissiveTexture) {
                promises.push(this.loadTextureInfoAsync(`${context}/emissiveTexture`, material.emissiveTexture, (texture) => {
                    babylonMaterial.emissiveTexture = texture;
                }));
            }

            return Promise.all(promises).then(() => { });
        }

        /**
         * Loads the alpha properties from a glTF material into a Babylon material.
         * Must be called after the setting the albedo texture of the Babylon material when the material has an albedo texture.
         * @param context The context when loading the asset
         * @param material The glTF material property
         * @param babylonMaterial The Babylon material
         */
        public loadMaterialAlphaProperties(context: string, material: Loader.IMaterial, babylonMaterial: Material): void {
            if (!(babylonMaterial instanceof PBRMaterial)) {
                throw new Error(`${context}: Material type not supported`);
            }

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
                    throw new Error(`${context}/alphaMode: Invalid value (${material.alphaMode})`);
                }
            }
        }

        /**
         * Loads a glTF texture info.
         * @param context The context when loading the asset
         * @param textureInfo The glTF texture info property
         * @param assign A function called synchronously after parsing the glTF properties
         * @returns A promise that resolves with the loaded Babylon texture when the load is complete
         */
        public loadTextureInfoAsync(context: string, textureInfo: Loader.ITextureInfo, assign: (babylonTexture: BaseTexture) => void = () => { }): Promise<BaseTexture> {
            const extensionPromise = this._extensionsLoadTextureInfoAsync(context, textureInfo, assign);
            if (extensionPromise) {
                return extensionPromise;
            }

            this.logOpen(`${context}`);

            const texture = ArrayItem.Get(`${context}/index`, this.gltf.textures, textureInfo.index);
            const promise = this._loadTextureAsync(`#/textures/${textureInfo.index}`, texture, (babylonTexture) => {
                babylonTexture.coordinatesIndex = textureInfo.texCoord || 0;
                assign(babylonTexture);
            });

            this.logClose();

            return promise;
        }

        private _loadTextureAsync(context: string, texture: Loader.ITexture, assign: (babylonTexture: BaseTexture) => void = () => { }): Promise<BaseTexture> {
            const promises = new Array<Promise<any>>();

            this.logOpen(`${context} ${texture.name || ""}`);

            const sampler = (texture.sampler == undefined ? GLTFLoader._DefaultSampler : ArrayItem.Get(`${context}/sampler`, this.gltf.samplers, texture.sampler));
            const samplerData = this._loadSampler(`#/samplers/${sampler.index}`, sampler);

            const deferred = new Deferred<void>();
            const babylonTexture = new Texture(null, this.babylonScene, samplerData.noMipMaps, false, samplerData.samplingMode, () => {
                if (!this._disposed) {
                    deferred.resolve();
                }
            }, (message, exception) => {
                if (!this._disposed) {
                    deferred.reject(new Error(`${context}: ${(exception && exception.message) ? exception.message : message || "Failed to load texture"}`));
                }
            });
            promises.push(deferred.promise);

            babylonTexture.name = texture.name || `texture${texture.index}`;
            babylonTexture.wrapU = samplerData.wrapU;
            babylonTexture.wrapV = samplerData.wrapV;

            const image = ArrayItem.Get(`${context}/source`, this.gltf.images, texture.source);
            promises.push(this.loadImageAsync(`#/images/${image.index}`, image).then((data) => {
                const name = image.uri || `${this._fileName}#image${image.index}`;
                const dataUrl = `data:${this._uniqueRootUrl}${name}`;
                babylonTexture.updateURL(dataUrl, new Blob([data], { type: image.mimeType }));
            }));

            assign(babylonTexture);
            this._parent.onTextureLoadedObservable.notifyObservers(babylonTexture);

            this.logClose();

            return Promise.all(promises).then(() => {
                return babylonTexture;
            });
        }

        private _loadSampler(context: string, sampler: Loader.ISampler): Loader._ISamplerData {
            if (!sampler._data) {
                sampler._data = {
                    noMipMaps: (sampler.minFilter === TextureMinFilter.NEAREST || sampler.minFilter === TextureMinFilter.LINEAR),
                    samplingMode: GLTFLoader._GetTextureSamplingMode(context, sampler),
                    wrapU: GLTFLoader._GetTextureWrapMode(`${context}/wrapS`, sampler.wrapS),
                    wrapV: GLTFLoader._GetTextureWrapMode(`${context}/wrapT`, sampler.wrapT)
                };
            }

            return sampler._data;
        }

        /**
         * Loads a glTF image.
         * @param context The context when loading the asset
         * @param image The glTF image property
         * @returns A promise that resolves with the loaded data when the load is complete
         */
        public loadImageAsync(context: string, image: Loader.IImage): Promise<ArrayBufferView> {
            if (!image._data) {
                this.logOpen(`${context} ${image.name || ""}`);

                if (image.uri) {
                    image._data = this.loadUriAsync(`${context}/uri`, image.uri);
                }
                else {
                    const bufferView = ArrayItem.Get(`${context}/bufferView`, this.gltf.bufferViews, image.bufferView);
                    image._data = this.loadBufferViewAsync(`#/bufferViews/${bufferView.index}`, bufferView);
                }

                this.logClose();
            }

            return image._data;
        }

        /**
         * Loads a glTF uri.
         * @param context The context when loading the asset
         * @param uri The base64 or relative uri
         * @returns A promise that resolves with the loaded data when the load is complete
         */
        public loadUriAsync(context: string, uri: string): Promise<ArrayBufferView> {
            const extensionPromise = this._extensionsLoadUriAsync(context, uri);
            if (extensionPromise) {
                return extensionPromise;
            }

            if (!GLTFLoader._ValidateUri(uri)) {
                throw new Error(`${context}: '${uri}' is invalid`);
            }

            if (Tools.IsBase64(uri)) {
                const data = new Uint8Array(Tools.DecodeBase64(uri));
                this.log(`Decoded ${uri.substr(0, 64)}... (${data.length} bytes)`);
                return Promise.resolve(data);
            }

            this.log(`Loading ${uri}`);

            return this._parent.preprocessUrlAsync(this._rootUrl + uri).then((url) => {
                return new Promise<ArrayBufferView>((resolve, reject) => {
                    if (!this._disposed) {
                        const request = Tools.LoadFile(url, (fileData) => {
                            if (!this._disposed) {
                                const data = new Uint8Array(fileData as ArrayBuffer);
                                this.log(`Loaded ${uri} (${data.length} bytes)`);
                                resolve(data);
                            }
                        }, (event) => {
                            if (!this._disposed) {
                                if (request) {
                                    request._lengthComputable = event.lengthComputable;
                                    request._loaded = event.loaded;
                                    request._total = event.total;
                                }

                                if (this._state === GLTFLoaderState.LOADING) {
                                    try {
                                        this._onProgress();
                                    }
                                    catch (e) {
                                        reject(e);
                                    }
                                }
                            }
                        }, this.babylonScene.offlineProvider, true, (request, exception) => {
                            if (!this._disposed) {
                                reject(new LoadFileError(`${context}: Failed to load '${uri}'${request ? ": " + request.status + " " + request.statusText : ""}`, request));
                            }
                        }) as IFileRequestInfo;

                        this._requests.push(request);
                    }
                });
            });
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

        private static _GetTextureWrapMode(context: string, mode: TextureWrapMode | undefined): number {
            // Set defaults if undefined
            mode = mode == undefined ? TextureWrapMode.REPEAT : mode;

            switch (mode) {
                case TextureWrapMode.CLAMP_TO_EDGE: return Texture.CLAMP_ADDRESSMODE;
                case TextureWrapMode.MIRRORED_REPEAT: return Texture.MIRROR_ADDRESSMODE;
                case TextureWrapMode.REPEAT: return Texture.WRAP_ADDRESSMODE;
                default:
                    Tools.Warn(`${context}: Invalid value (${mode})`);
                    return Texture.WRAP_ADDRESSMODE;
            }
        }

        private static _GetTextureSamplingMode(context: string, sampler: Loader.ISampler): number {
            // Set defaults if undefined
            const magFilter = sampler.magFilter == undefined ? TextureMagFilter.LINEAR : sampler.magFilter;
            const minFilter = sampler.minFilter == undefined ? TextureMinFilter.LINEAR_MIPMAP_LINEAR : sampler.minFilter;

            if (magFilter === TextureMagFilter.LINEAR) {
                switch (minFilter) {
                    case TextureMinFilter.NEAREST: return Texture.LINEAR_NEAREST;
                    case TextureMinFilter.LINEAR: return Texture.LINEAR_LINEAR;
                    case TextureMinFilter.NEAREST_MIPMAP_NEAREST: return Texture.LINEAR_NEAREST_MIPNEAREST;
                    case TextureMinFilter.LINEAR_MIPMAP_NEAREST: return Texture.LINEAR_LINEAR_MIPNEAREST;
                    case TextureMinFilter.NEAREST_MIPMAP_LINEAR: return Texture.LINEAR_NEAREST_MIPLINEAR;
                    case TextureMinFilter.LINEAR_MIPMAP_LINEAR: return Texture.LINEAR_LINEAR_MIPLINEAR;
                    default:
                        Tools.Warn(`${context}/minFilter: Invalid value (${minFilter})`);
                        return Texture.LINEAR_LINEAR_MIPLINEAR;
                }
            }
            else {
                if (magFilter !== TextureMagFilter.NEAREST) {
                    Tools.Warn(`${context}/magFilter: Invalid value (${magFilter})`);
                }

                switch (minFilter) {
                    case TextureMinFilter.NEAREST: return Texture.NEAREST_NEAREST;
                    case TextureMinFilter.LINEAR: return Texture.NEAREST_LINEAR;
                    case TextureMinFilter.NEAREST_MIPMAP_NEAREST: return Texture.NEAREST_NEAREST_MIPNEAREST;
                    case TextureMinFilter.LINEAR_MIPMAP_NEAREST: return Texture.NEAREST_LINEAR_MIPNEAREST;
                    case TextureMinFilter.NEAREST_MIPMAP_LINEAR: return Texture.NEAREST_NEAREST_MIPLINEAR;
                    case TextureMinFilter.LINEAR_MIPMAP_LINEAR: return Texture.NEAREST_LINEAR_MIPLINEAR;
                    default:
                        Tools.Warn(`${context}/minFilter: Invalid value (${minFilter})`);
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
            this._parent._startPerformanceCounter("Compile materials");

            const promises = new Array<Promise<any>>();

            if (this.gltf.materials) {
                for (const material of this.gltf.materials) {
                    if (material._babylonData) {
                        for (const babylonDrawMode in material._babylonData) {
                            const babylonData = material._babylonData[babylonDrawMode];
                            for (const babylonMesh of babylonData.meshes) {
                                // Ensure nonUniformScaling is set if necessary.
                                babylonMesh.computeWorldMatrix(true);

                                const babylonMaterial = babylonData.material;
                                promises.push(babylonMaterial.forceCompilationAsync(babylonMesh));
                                if (this._parent.useClipPlane) {
                                    promises.push(babylonMaterial.forceCompilationAsync(babylonMesh, { clipPlane: true }));
                                }
                            }
                        }
                    }
                }
            }

            return Promise.all(promises).then(() => {
                this._parent._endPerformanceCounter("Compile materials");
            });
        }

        private _compileShadowGeneratorsAsync(): Promise<void> {
            this._parent._startPerformanceCounter("Compile shadow generators");

            const promises = new Array<Promise<any>>();

            const lights = this.babylonScene.lights;
            for (let light of lights) {
                let generator = light.getShadowGenerator();
                if (generator) {
                    promises.push(generator.forceCompilationAsync());
                }
            }

            return Promise.all(promises).then(() => {
                this._parent._endPerformanceCounter("Compile shadow generators");
            });
        }

        private _forEachExtensions(action: (extension: IGLTFLoaderExtension) => void): void {
            for (const name of GLTFLoader._ExtensionNames) {
                const extension = this._extensions[name];
                if (extension.enabled) {
                    action(extension);
                }
            }
        }

        private _applyExtensions<T>(property: IProperty, actionAsync: (extension: IGLTFLoaderExtension) => Nullable<T> | undefined): Nullable<T> {
            for (const name of GLTFLoader._ExtensionNames) {
                const extension = this._extensions[name];
                if (extension.enabled) {
                    const loaderProperty = property as ILoaderProperty;
                    loaderProperty._activeLoaderExtensions = loaderProperty._activeLoaderExtensions || {};
                    const activeLoaderExtensions = loaderProperty._activeLoaderExtensions;
                    if (!activeLoaderExtensions[name]) {
                        activeLoaderExtensions[name] = true;

                        try {
                            const result = actionAsync(extension);
                            if (result) {
                                return result;
                            }
                        }
                        finally {
                            delete activeLoaderExtensions[name];
                        }
                    }
                }
            }

            return null;
        }

        private _extensionsOnLoading(): void {
            this._forEachExtensions((extension) => extension.onLoading && extension.onLoading());
        }

        private _extensionsOnReady(): void {
            this._forEachExtensions((extension) => extension.onReady && extension.onReady());
        }

        private _extensionsLoadSceneAsync(context: string, scene: Loader.IScene): Nullable<Promise<void>> {
            return this._applyExtensions(scene, (extension) => extension.loadSceneAsync && extension.loadSceneAsync(context, scene));
        }

        private _extensionsLoadNodeAsync(context: string, node: Loader.INode, assign: (babylonMesh: Mesh) => void): Nullable<Promise<Mesh>> {
            return this._applyExtensions(node, (extension) => extension.loadNodeAsync && extension.loadNodeAsync(context, node, assign));
        }

        private _extensionsLoadCameraAsync(context: string, camera: Loader.ICamera, assign: (babylonCamera: Camera) => void): Nullable<Promise<Camera>> {
            return this._applyExtensions(camera, (extension) => extension.loadCameraAsync && extension.loadCameraAsync(context, camera, assign));
        }

        private _extensionsLoadVertexDataAsync(context: string, primitive: Loader.IMeshPrimitive, babylonMesh: Mesh): Nullable<Promise<Geometry>> {
            return this._applyExtensions(primitive, (extension) => extension._loadVertexDataAsync && extension._loadVertexDataAsync(context, primitive, babylonMesh));
        }

        private _extensionsLoadMaterialAsync(context: string, material: Loader.IMaterial, babylonMesh: Mesh, babylonDrawMode: number, assign: (babylonMaterial: Material) => void): Nullable<Promise<Material>> {
            return this._applyExtensions(material, (extension) => extension._loadMaterialAsync && extension._loadMaterialAsync(context, material, babylonMesh, babylonDrawMode, assign));
        }

        private _extensionsCreateMaterial(context: string, material: Loader.IMaterial, babylonDrawMode: number): Nullable<Material> {
            return this._applyExtensions({}, (extension) => extension.createMaterial && extension.createMaterial(context, material, babylonDrawMode));
        }

        private _extensionsLoadMaterialPropertiesAsync(context: string, material: Loader.IMaterial, babylonMaterial: Material): Nullable<Promise<void>> {
            return this._applyExtensions(material, (extension) => extension.loadMaterialPropertiesAsync && extension.loadMaterialPropertiesAsync(context, material, babylonMaterial));
        }

        private _extensionsLoadTextureInfoAsync(context: string, textureInfo: Loader.ITextureInfo, assign: (babylonTexture: BaseTexture) => void): Nullable<Promise<BaseTexture>> {
            return this._applyExtensions(textureInfo, (extension) => extension.loadTextureInfoAsync && extension.loadTextureInfoAsync(context, textureInfo, assign));
        }

        private _extensionsLoadAnimationAsync(context: string, animation: Loader.IAnimation): Nullable<Promise<AnimationGroup>> {
            return this._applyExtensions(animation, (extension) => extension.loadAnimationAsync && extension.loadAnimationAsync(context, animation));
        }

        private _extensionsLoadUriAsync(context: string, uri: string): Nullable<Promise<ArrayBufferView>> {
            return this._applyExtensions({}, (extension) => extension._loadUriAsync && extension._loadUriAsync(context, uri));
        }

        /**
         * Helper method called by a loader extension to load an glTF extension.
         * @param context The context when loading the asset
         * @param property The glTF property to load the extension from
         * @param extensionName The name of the extension to load
         * @param actionAsync The action to run
         * @returns The promise returned by actionAsync or null if the extension does not exist
         */
        public static LoadExtensionAsync<TExtension = any, TResult = void>(context: string, property: IProperty, extensionName: string, actionAsync: (extensionContext: string, extension: TExtension) => Nullable<Promise<TResult>>): Nullable<Promise<TResult>> {
            if (!property.extensions) {
                return null;
            }

            const extensions = property.extensions;

            const extension = extensions[extensionName] as TExtension;
            if (!extension) {
                return null;
            }

            return actionAsync(`${context}/extensions/${extensionName}`, extension);
        }

        /**
         * Helper method called by a loader extension to load a glTF extra.
         * @param context The context when loading the asset
         * @param property The glTF property to load the extra from
         * @param extensionName The name of the extension to load
         * @param actionAsync The action to run
         * @returns The promise returned by actionAsync or null if the extra does not exist
         */
        public static LoadExtraAsync<TExtra = any, TResult = void>(context: string, property: IProperty, extensionName: string, actionAsync: (extraContext: string, extra: TExtra) => Nullable<Promise<TResult>>): Nullable<Promise<TResult>> {
            if (!property.extras) {
                return null;
            }

            const extras = property.extras;

            const extra = extras[extensionName] as TExtra;
            if (!extra) {
                return null;
            }

            return actionAsync(`${context}/extras/${extensionName}`, extra);
        }

        /**
         * Increments the indentation level and logs a message.
         * @param message The message to log
         */
        public logOpen(message: string): void {
            this._parent._logOpen(message);
        }

        /**
         * Decrements the indentation level.
         */
        public logClose(): void {
            this._parent._logClose();
        }

        /**
         * Logs a message
         * @param message The message to log
         */
        public log(message: string): void {
            this._parent._log(message);
        }

        /**
         * Starts a performance counter.
         * @param counterName The name of the performance counter
         */
        public startPerformanceCounter(counterName: string): void {
            this._parent._startPerformanceCounter(counterName);
        }

        /**
         * Ends a performance counter.
         * @param counterName The name of the performance counter
         */
        public endPerformanceCounter(counterName: string): void {
            this._parent._endPerformanceCounter(counterName);
        }
    }

    GLTFFileLoader._CreateGLTFLoaderV2 = (parent) => new GLTFLoader(parent);
}
