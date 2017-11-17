/// <reference path="../../../../dist/preview release/babylon.d.ts"/>

module BABYLON.GLTF2 {
    class GLTFLoaderTracker {
        private _pendingCount = 0;
        private _callback: () => void;

        constructor(onComplete: () => void) {
            this._callback = onComplete;
        }

        public _addPendingData(data: any): void {
            this._pendingCount++;
        }

        public _removePendingData(data: any): void {
            if (--this._pendingCount === 0) {
                this._callback();
            }
        }
    }

    interface TypedArray extends ArrayBufferView {
        [index: number]: number;
    }

    interface TypedArrayConstructor<T extends TypedArray> {
        readonly prototype: T;
        new(length: number): T;
        new(array: ArrayLike<number>): T;
        new(buffer: ArrayBuffer, byteOffset?: number, length?: number): T;

        readonly BYTES_PER_ELEMENT: number;
    }

    interface GLTFLoaderRequest extends XMLHttpRequest {
        _loaded: Nullable<number>;
        _total: Nullable<number>;
    }

    interface IProgressEventData {
        lengthComputable: boolean;
        loaded: number;
        total: number;
    }

    export class GLTFLoader implements IGLTFLoader {
        public _gltf: IGLTF;
        public _babylonScene: Scene;

        private _disposed = false;
        private _parent: GLTFFileLoader;
        private _rootUrl: string;
        private _defaultMaterial: PBRMaterial;
        private _rootNode: IGLTFNode;
        private _successCallback: () => void;
        private _progressCallback: (event: ProgressEvent) => void;
        private _errorCallback: (message: string) => void;
        private _renderReady = false;
        private _requests = new Array<GLTFLoaderRequest>();

        private _renderReadyObservable = new Observable<GLTFLoader>();

        // Count of pending work that needs to complete before the asset is rendered.
        private _renderPendingCount = 0;

        // Count of pending work that needs to complete before the loader is disposed.
        private _loaderPendingCount = 0;

        private _loaderTrackers = new Array<GLTFLoaderTracker>();

        public static Extensions: { [name: string]: GLTFLoaderExtension } = {};

        public static RegisterExtension(extension: GLTFLoaderExtension): void {
            if (GLTFLoader.Extensions[extension.name]) {
                Tools.Error("Extension with the same name '" + extension.name + "' already exists");
                return;
            }

            GLTFLoader.Extensions[extension.name] = extension;

            // Keep the order of registration so that extensions registered first are called first.
            GLTFLoaderExtension._Extensions.push(extension);
        }

        // IE 11 Compatibility.
        private static _progressEventFactory: (name: string, data: IProgressEventData) => ProgressEvent;
        
        private static _createProgressEventByConstructor(name: string, data: IProgressEventData): ProgressEvent {
            return new ProgressEvent(name, data);
        }

        private static _createProgressEventByDocument(name: string, data: IProgressEventData): ProgressEvent {
            const event = document.createEvent("ProgressEvent");
            event.initProgressEvent(name, false, false, data.lengthComputable, data.loaded, data.total);
            return event;
        }

        public constructor(parent: GLTFFileLoader) {
            this._parent = parent;
            if (!GLTFLoader._progressEventFactory) {
                if (typeof (<any>window)["ProgressEvent"] === "function") {
                    GLTFLoader._progressEventFactory = GLTFLoader._createProgressEventByConstructor;
                }
                else {
                    GLTFLoader._progressEventFactory = GLTFLoader._createProgressEventByDocument;
                }
            }
        }

        public dispose(): void {
            if (this._disposed) {
                return;
            }

            this._disposed = true;

            // Abort requests that are not complete
            for (const request of this._requests) {
                if (request.readyState !== (XMLHttpRequest.DONE || 4)) {
                    request.abort();
                }
            }

            // Revoke object urls created during load
            if (this._gltf.textures) {
                for (const texture of this._gltf.textures) {
                    if (texture.url) {
                        URL.revokeObjectURL(texture.url);
                    }
                }
            }
        }

        public importMeshAsync(meshesNames: any, scene: Scene, data: IGLTFLoaderData, rootUrl: string, onSuccess: (meshes: AbstractMesh[], particleSystems: ParticleSystem[], skeletons: Skeleton[]) => void, onProgress: (event: ProgressEvent) => void, onError: (message: string) => void): void {
            this._loadAsync(meshesNames, scene, data, rootUrl, () => {
                onSuccess(this._getMeshes(), [], this._getSkeletons());
            }, onProgress, onError);
        }

        public loadAsync(scene: Scene, data: IGLTFLoaderData, rootUrl: string, onSuccess: () => void, onProgress: (event: ProgressEvent) => void, onError: (message: string) => void): void {
            this._loadAsync(null, scene, data, rootUrl, onSuccess, onProgress, onError);
        }

        private _loadAsync(nodeNames: any, scene: Scene, data: IGLTFLoaderData, rootUrl: string, onSuccess: () => void, onProgress: (event: ProgressEvent) => void, onError: (message: string) => void): void {
            this._tryCatchOnError(() => {
                this._loadData(data);
                this._babylonScene = scene;
                this._rootUrl = rootUrl;

                this._successCallback = onSuccess;
                this._progressCallback = onProgress;
                this._errorCallback = onError;

                this._addPendingData(this);
                this._loadDefaultScene(nodeNames);
                this._loadAnimations();
                this._removePendingData(this);
            });
        }

        private _onProgress(): void {
            if (!this._progressCallback) {
                return;
            }

            let loaded = 0;
            let total = 0;
            for (let request of this._requests) {
                if (!request._loaded || !request._total) {
                    return;
                }

                loaded += request._loaded;
                total += request._total;
            }

            this._progressCallback(GLTFLoader._progressEventFactory("GLTFLoaderProgress", {
                lengthComputable: true,
                loaded: loaded,
                total: total
            }));
        }

        public _executeWhenRenderReady(func: () => void): void {
            if (this._renderReady) {
                func();
            }
            else {
                this._renderReadyObservable.add(func);
            }
        }

        private _onRenderReady(): void {
            this._rootNode.babylonMesh.setEnabled(true);

            this._startAnimations();
            this._successCallback();
            this._renderReadyObservable.notifyObservers(this);
        }

        private _onComplete(): void {
            if (this._parent.onComplete) {
                this._parent.onComplete();
            }

            this.dispose();
        }

        private _loadData(data: IGLTFLoaderData): void {
            this._gltf = <IGLTF>data.json;

            // Assign the index of each object for convinience.
            GLTFLoader._AssignIndices(this._gltf.accessors);
            GLTFLoader._AssignIndices(this._gltf.animations);
            GLTFLoader._AssignIndices(this._gltf.buffers);
            GLTFLoader._AssignIndices(this._gltf.bufferViews);
            GLTFLoader._AssignIndices(this._gltf.images);
            GLTFLoader._AssignIndices(this._gltf.materials);
            GLTFLoader._AssignIndices(this._gltf.meshes);
            GLTFLoader._AssignIndices(this._gltf.nodes);
            GLTFLoader._AssignIndices(this._gltf.scenes);
            GLTFLoader._AssignIndices(this._gltf.skins);
            GLTFLoader._AssignIndices(this._gltf.textures);

            if (data.bin) {
                const buffers = this._gltf.buffers;
                if (buffers && buffers[0] && !buffers[0].uri) {
                    const binaryBuffer = buffers[0];
                    if (binaryBuffer.byteLength != data.bin.byteLength) {
                        Tools.Warn("Binary buffer length (" + binaryBuffer.byteLength + ") from JSON does not match chunk length (" + data.bin.byteLength + ")");
                    }

                    binaryBuffer.loadedData = data.bin;
                }
                else {
                    Tools.Warn("Unexpected BIN chunk");
                }
            }
        }

        private _getMeshes(): AbstractMesh[] {
            const meshes = new Array<AbstractMesh>();

            // Root mesh is always first.
            meshes.push(this._rootNode.babylonMesh);

            const nodes = this._gltf.nodes;
            if (nodes) {
                for (const node of nodes) {
                    if (node.babylonMesh) {
                        meshes.push(node.babylonMesh);
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
                    if (skin.babylonSkeleton) {
                        skeletons.push(skin.babylonSkeleton);
                    }
                }
            }

            return skeletons;
        }

        private _getAnimationTargets(): any[] {
            const targets = new Array();

            const animations = this._gltf.animations;
            if (animations) {
                for (const animation of animations) {
                    targets.push(...animation.targets);
                }
            }

            return targets;
        }

        private _startAnimations(): void {
            for (const target of this._getAnimationTargets()) { 
                this._babylonScene.beginAnimation(target, 0, Number.MAX_VALUE, true);
            }
        }

        private _loadDefaultScene(nodeNames: any): void {
            const scene = GLTFLoader._GetProperty(this._gltf.scenes, this._gltf.scene || 0);
            if (!scene) {
                throw new Error("Failed to find scene " + (this._gltf.scene || 0));
            }

            this._loadScene("#/scenes/" + scene.index, scene, nodeNames);
        }

        private _loadScene(context: string, scene: IGLTFScene, nodeNames: any): void {
            this._rootNode = { babylonMesh: new Mesh("__root__", this._babylonScene) } as IGLTFNode;

            switch (this._parent.coordinateSystemMode) {
                case GLTFLoaderCoordinateSystemMode.AUTO: {
                    if (!this._babylonScene.useRightHandedSystem) {
                        this._rootNode.babylonMesh.rotation = new Vector3(0, Math.PI, 0);
                        this._rootNode.babylonMesh.scaling = new Vector3(1, 1, -1);
                    }
                    break;
                }
                case GLTFLoaderCoordinateSystemMode.PASS_THROUGH: {
                    // do nothing
                    break;
                }
                case GLTFLoaderCoordinateSystemMode.FORCE_RIGHT_HANDED: {
                    this._babylonScene.useRightHandedSystem = true;
                    break;
                }
                default: {
                    Tools.Error("Invalid coordinate system mode " + this._parent.coordinateSystemMode);
                    return;
                }
            }

            if (this._parent.onMeshLoaded) {
                this._parent.onMeshLoaded(this._rootNode.babylonMesh);
            }

            let nodeIndices = scene.nodes;

            this._traverseNodes(context, nodeIndices, (node, parentNode) => {
                node.parent = parentNode;
                return true;
            }, this._rootNode);

            if (nodeNames) {
                if (!(nodeNames instanceof Array)) {
                    nodeNames = [nodeNames];
                }

                const filteredNodeIndices = new Array<number>();
                this._traverseNodes(context, nodeIndices, node => {
                    if (nodeNames.indexOf(node.name) !== -1) {
                        filteredNodeIndices.push(node.index);
                        return false;
                    }

                    return true;
                }, this._rootNode);

                nodeIndices = filteredNodeIndices;
            }

            for (const index of nodeIndices) {
                const node = GLTFLoader._GetProperty(this._gltf.nodes, index);
                if (!node) {
                    throw new Error(context + ": Failed to find node " + index);
                }

                this._loadNode("#/nodes/" + index, node);
            }

            // Disable the root mesh until the asset is ready to render.
            this._rootNode.babylonMesh.setEnabled(false);
        }

        public _loadNode(context: string, node: IGLTFNode): void {
            if (GLTFLoaderExtension.LoadNode(this, context, node)) {
                return;
            }

            node.babylonMesh = new Mesh(node.name || "mesh" + node.index, this._babylonScene);
            node.babylonMesh.hasVertexAlpha = true;

            this._loadTransform(node);

            if (node.mesh != null) {
                const mesh = GLTFLoader._GetProperty(this._gltf.meshes, node.mesh);
                if (!mesh) {
                    throw new Error(context + ": Failed to find mesh " + node.mesh);
                }

                this._loadMesh("#/meshes/" + node.mesh, node, mesh);
            }

            node.babylonMesh.parent = node.parent ? node.parent.babylonMesh : null;

            node.babylonAnimationTargets = node.babylonAnimationTargets || [];
            node.babylonAnimationTargets.push(node.babylonMesh);

            if (node.skin != null) {
                const skin = GLTFLoader._GetProperty(this._gltf.skins, node.skin);
                if (!skin) {
                    throw new Error(context + ": Failed to find skin " + node.skin);
                }

                node.babylonMesh.skeleton = this._loadSkin("#/skins/" + node.skin, skin);
            }

            if (node.camera != null) {
                // TODO: handle cameras
            }

            if (node.children) {
                for (const index of node.children) {
                    const childNode = GLTFLoader._GetProperty(this._gltf.nodes, index);
                    if (!childNode) {
                        throw new Error(context + ": Failed to find child node " + index);
                    }

                    this._loadNode("#/nodes/" + index, childNode);
                }
            }

            if (this._parent.onMeshLoaded) {
                this._parent.onMeshLoaded(node.babylonMesh);
            }
        }

        private _loadMesh(context: string, node: IGLTFNode, mesh: IGLTFMesh): void {
            const primitives = mesh.primitives;
            if (!primitives || primitives.length === 0) {
                throw new Error(context + ": Primitives are missing");
            }

            this._createMorphTargets(context, node, mesh);

            this._loadAllVertexDataAsync(context, mesh, () => {
                this._loadMorphTargets(context, node, mesh);

                const vertexData = new VertexData();
                for (const primitive of primitives) {
                    vertexData.merge(primitive.vertexData);
                }

                new Geometry(node.babylonMesh.name, this._babylonScene, vertexData, false, node.babylonMesh);

                // TODO: optimize this so that sub meshes can be created without being overwritten after setting vertex data.
                // Sub meshes must be cleared and created after setting vertex data because of mesh._createGlobalSubMesh.
                node.babylonMesh.subMeshes = [];

                let verticesStart = 0;
                let indicesStart = 0;
                for (let index = 0; index < primitives.length; index++) {
                    const vertexData = primitives[index].vertexData;
                    const verticesCount = vertexData.positions!.length;
                    const indicesCount = vertexData.indices!.length;
                    SubMesh.AddToMesh(index, verticesStart, verticesCount, indicesStart, indicesCount, node.babylonMesh);
                    verticesStart += verticesCount;
                    indicesStart += indicesCount;
                };
            });

            const multiMaterial = new MultiMaterial(node.babylonMesh.name, this._babylonScene);
            node.babylonMesh.material = multiMaterial;
            const subMaterials = multiMaterial.subMaterials;
            for (let index = 0; index < primitives.length; index++) {
                const primitive = primitives[index];

                if (primitive.material == null) {
                    subMaterials[index] = this._getDefaultMaterial();
                }
                else {
                    const material = GLTFLoader._GetProperty(this._gltf.materials, primitive.material);
                    if (!material) {
                        throw new Error(context + ": Failed to find material " + primitive.material);
                    }

                    this._loadMaterial("#/materials/" + material.index, material, (babylonMaterial, isNew) => {
                        if (isNew && this._parent.onMaterialLoaded) {
                            this._parent.onMaterialLoaded(babylonMaterial);
                        }

                        subMaterials[index] = babylonMaterial;
                    });
                }
            };
        }

        private _loadAllVertexDataAsync(context: string, mesh: IGLTFMesh, onSuccess: () => void): void {
            const primitives = mesh.primitives;
            let numRemainingPrimitives = primitives.length;
            for (let index = 0; index < primitives.length; index++) {
                let primitive = primitives[index];
                this._loadVertexDataAsync(context + "/primitive/" + index, mesh, primitive, vertexData => {
                    primitive.vertexData = vertexData;
                    if (--numRemainingPrimitives === 0) {
                        onSuccess();
                    }
                });
            }
        }

        /**
         * Converts a data bufferview into a Float4 Texture Coordinate Array, based on the accessor component type
         * @param {ArrayBufferView} data 
         * @param {IGLTFAccessor} accessor 
         */
        private _convertToFloat4TextureCoordArray(context: string, data: ArrayBufferView, accessor: IGLTFAccessor): Float32Array {
            if (accessor.componentType == EComponentType.FLOAT) {
                return data as Float32Array;
            }

            const buffer = data as TypedArray;
            let factor = 1;

            switch (accessor.componentType) {
                case EComponentType.UNSIGNED_BYTE: {
                    factor = 1 / 255;
                    break;
                }
                case EComponentType.UNSIGNED_SHORT: {
                    factor = 1 / 65535;
                    break;
                }
                default: {
                    throw new Error(context + ": Invalid component type (" + accessor.componentType + ")");
                }
            }

            const result = new Float32Array(accessor.count * 2);
            for (let i = 0; i < result.length; ++i) {
                result[i] = buffer[i] * factor;
            }

            return result;
        }

        /**
         * Converts a data bufferview into a Float4 Color Array, based on the accessor component type
         * @param {ArrayBufferView} data 
         * @param {IGLTFAccessor} accessor 
         */
        private _convertToFloat4ColorArray(context: string, data: ArrayBufferView, accessor: IGLTFAccessor): Float32Array {
            const colorComponentCount = GLTFLoader._GetNumComponents(accessor.type);
            if (colorComponentCount === 4 && accessor.componentType === EComponentType.FLOAT) {
                return data as Float32Array;
            }

            const buffer = data as TypedArray;
            let factor = 1;

            switch (accessor.componentType) {
                case EComponentType.FLOAT: {
                    factor = 1;
                    break;
                }
                case EComponentType.UNSIGNED_BYTE: {
                    factor = 1 / 255;
                    break;
                }
                case EComponentType.UNSIGNED_SHORT: {
                    factor = 1 / 65535;
                    break;
                }
                default: {
                    throw new Error(context + ": Invalid component type (" + accessor.componentType + ")");
                }
            }

            const result = new Float32Array(accessor.count * 4);
            if (colorComponentCount === 4) {
                for (let i = 0; i < result.length; ++i) {
                    result[i] = buffer[i] * factor;
                }
            }
            else {
                let offset = 0;
                for (let i = 0; i < result.length; ++i) {
                    if ((i + 1) % 4 === 0) {
                        result[i] = 1;
                    }
                    else {
                        result[i] = buffer[offset++] * factor;
                    }
                }
            }

            return result;
        }

        private _loadVertexDataAsync(context: string, mesh: IGLTFMesh, primitive: IGLTFMeshPrimitive, onSuccess: (vertexData: VertexData) => void): void {
            const attributes = primitive.attributes;
            if (!attributes) {
                throw new Error(context + ": Attributes are missing");
            }

            if (primitive.mode && primitive.mode !== EMeshPrimitiveMode.TRIANGLES) {
                // TODO: handle other primitive modes
                throw new Error(context + ": Mode " + primitive.mode + " is not currently supported");
            }

            const vertexData = new VertexData();

            let numRemainingAttributes = Object.keys(attributes).length;
            for (const attribute in attributes) {
                const accessor = GLTFLoader._GetProperty(this._gltf.accessors, attributes[attribute]);
                if (!accessor) {
                    throw new Error(context + ": Failed to find attribute '" + attribute + "' accessor " + attributes[attribute]);
                }

                this._loadAccessorAsync("#/accessors/" + accessor.index, accessor, data => {
                    switch (attribute) {
                        case "POSITION": {
                            vertexData.positions = <Float32Array>data;
                            break;
                        }
                        case "NORMAL": {
                            vertexData.normals = <Float32Array>data;
                            break;
                        }
                        case "TANGENT": {
                            vertexData.tangents = <Float32Array>data;
                            break;
                        }
                        case "TEXCOORD_0": {
                            vertexData.uvs = this._convertToFloat4TextureCoordArray(context, data, accessor);
                            break;
                        }
                        case "TEXCOORD_1": {
                            vertexData.uvs2 = this._convertToFloat4TextureCoordArray(context, data, accessor);
                            break;
                        }
                        case "JOINTS_0": {
                            vertexData.matricesIndices = new Float32Array(Array.prototype.slice.apply(data));
                            break;
                        }
                        case "WEIGHTS_0": {
                            //TODO: need to add support for normalized weights.
                            vertexData.matricesWeights = <Float32Array>data;
                            break;
                        }
                        case "COLOR_0": {
                            vertexData.colors = this._convertToFloat4ColorArray(context, data, accessor);
                            break;
                        }
                        default: {
                            Tools.Warn("Ignoring unrecognized attribute '" + attribute + "'");
                            break;
                        }
                    }

                    if (--numRemainingAttributes === 0) {
                        if (primitive.indices == null) {
                            vertexData.indices = new Uint32Array(vertexData.positions!.length / 3);
                            for (let i = 0; i < vertexData.indices.length; i++) {
                                vertexData.indices[i] = i;
                            }
                            onSuccess(vertexData);
                        }
                        else {
                            const indicesAccessor = GLTFLoader._GetProperty(this._gltf.accessors, primitive.indices);
                            if (!indicesAccessor) {
                                throw new Error(context + ": Failed to find indices accessor " + primitive.indices);
                            }

                            this._loadAccessorAsync("#/accessors/" + indicesAccessor.index, indicesAccessor, data => {
                                vertexData.indices = <IndicesArray>data;
                                onSuccess(vertexData);
                            });
                        }
                    }
                });
            }
        }

        private _createMorphTargets(context: string, node: IGLTFNode, mesh: IGLTFMesh): void {
            const primitives = mesh.primitives;

            const targets = primitives[0].targets;
            if (!targets) {
                return;
            }

            for (const primitive of primitives) {
                if (!primitive.targets || primitive.targets.length != targets.length) {
                    throw new Error(context + ": All primitives are required to list the same number of targets");
                }
            }

            const morphTargetManager = new MorphTargetManager();
            node.babylonMesh.morphTargetManager = morphTargetManager;
            for (let index = 0; index < targets.length; index++) {
                const weight = node.weights ? node.weights[index] : mesh.weights ? mesh.weights[index] : 0;
                morphTargetManager.addTarget(new MorphTarget("morphTarget" + index, weight));
            }
        }

        private _loadMorphTargets(context: string, node: IGLTFNode, mesh: IGLTFMesh): void {
            const morphTargetManager = node.babylonMesh.morphTargetManager;
            if (!morphTargetManager) {
                return;
            }

            this._loadAllMorphTargetVertexDataAsync(context, node, mesh, () => {
                const numTargets = morphTargetManager.numTargets;
                for (let index = 0; index < numTargets; index++) {
                    const vertexData = new VertexData();
                    for (const primitive of mesh.primitives) {
                        vertexData.merge(primitive.targetsVertexData[index], { tangentLength: 3 });
                    }

                    if (!vertexData.positions) {
                        throw new Error(context + ": Positions are missing");
                    }

                    const target = morphTargetManager.getTarget(index);
                    target.setPositions(vertexData.positions);
                    target.setNormals(vertexData.normals);
                    target.setTangents(vertexData.tangents);
                }
            });
        }

        private _loadAllMorphTargetVertexDataAsync(context: string, node: IGLTFNode, mesh: IGLTFMesh, onSuccess: () => void): void {
            let numRemainingTargets = mesh.primitives.length * node.babylonMesh.morphTargetManager!.numTargets;

            for (const primitive of mesh.primitives) {
                const targets = primitive.targets!;
                primitive.targetsVertexData = new Array<VertexData>(targets.length);
                for (let index = 0; index < targets.length; index++) {
                    this._loadMorphTargetVertexDataAsync(context + "/targets/" + index, primitive.vertexData, targets[index], vertexData => {
                        primitive.targetsVertexData[index] = vertexData;
                        if (--numRemainingTargets === 0) {
                            onSuccess();
                        }
                    });
                }
            }
        }

        private _loadMorphTargetVertexDataAsync(context: string, vertexData: VertexData, attributes: { [name: string]: number }, onSuccess: (vertexData: VertexData) => void): void {
            const targetVertexData = new VertexData();

            let numRemainingAttributes = Object.keys(attributes).length;
            for (let attribute in attributes) {
                const accessor = GLTFLoader._GetProperty(this._gltf.accessors, attributes[attribute]);
                if (!accessor) {
                    throw new Error(context + ": Failed to find attribute '" + attribute + "' accessor " + attributes[attribute]);
                }

                this._loadAccessorAsync("#/accessors/" + accessor.index, accessor, data => {
                    // glTF stores morph target information as deltas while babylon.js expects the final data.
                    // As a result we have to add the original data to the delta to calculate the final data.
                    const values = <Float32Array>data;
                    switch (attribute) {
                        case "POSITION": {
                            for (let i = 0; i < values.length; i++) {
                                values[i] += vertexData.positions![i];
                            }
                            targetVertexData.positions = values;
                            break;
                        }
                        case "NORMAL": {
                            for (let i = 0; i < values.length; i++) {
                                values[i] += vertexData.normals![i];
                            }
                            targetVertexData.normals = values;
                            break;
                        }
                        case "TANGENT": {
                            // Tangent data for morph targets is stored as xyz delta.
                            // The vertexData.tangent is stored as xyzw.
                            // So we need to skip every fourth vertexData.tangent.
                            for (let i = 0, j = 0; i < values.length; i++, j++) {
                                values[i] += vertexData.tangents![j];
                                if ((i + 1) % 3 == 0) {
                                    j++;
                                }
                            }
                            targetVertexData.tangents = values;
                            break;
                        }
                        default: {
                            Tools.Warn("Ignoring unrecognized attribute '" + attribute + "'");
                            break;
                        }
                    }

                    if (--numRemainingAttributes === 0) {
                        onSuccess(targetVertexData);
                    }
                });
            }
        }

        private _loadTransform(node: IGLTFNode): void {
            let position: Vector3 = Vector3.Zero();
            let rotation: Quaternion = Quaternion.Identity();
            let scaling: Vector3 = Vector3.One();

            if (node.matrix) {
                const matrix = Matrix.FromArray(node.matrix);
                matrix.decompose(scaling, rotation, position);
            }
            else {
                if (node.translation) position = Vector3.FromArray(node.translation);
                if (node.rotation) rotation = Quaternion.FromArray(node.rotation);
                if (node.scale) scaling = Vector3.FromArray(node.scale);
            }

            node.babylonMesh.position = position;
            node.babylonMesh.rotationQuaternion = rotation;
            node.babylonMesh.scaling = scaling;
        }

        private _loadSkin(context: string, skin: IGLTFSkin): Skeleton {
            const skeletonId = "skeleton" + skin.index;
            skin.babylonSkeleton = new Skeleton(skin.name || skeletonId, skeletonId, this._babylonScene);

            if (skin.inverseBindMatrices == null) {
                this._loadBones(context, skin, null);
            }
            else {
                const accessor = GLTFLoader._GetProperty(this._gltf.accessors, skin.inverseBindMatrices);
                if (!accessor) {
                    throw new Error(context + ": Failed to find inverse bind matrices attribute " + skin.inverseBindMatrices);
                }

                this._loadAccessorAsync("#/accessors/" + accessor.index, accessor, data => {
                    this._loadBones(context, skin, <Float32Array>data);
                });
            }

            return skin.babylonSkeleton;
        }

        private _createBone(node: IGLTFNode, skin: IGLTFSkin, parent: Nullable<Bone>, localMatrix: Matrix, baseMatrix: Matrix, index: number): Bone {
            const babylonBone = new Bone(node.name || "bone" + node.index, skin.babylonSkeleton, parent, localMatrix, null, baseMatrix, index);

            node.babylonBones = node.babylonBones || {};
            node.babylonBones[skin.index] = babylonBone;

            node.babylonAnimationTargets = node.babylonAnimationTargets || [];
            node.babylonAnimationTargets.push(babylonBone);

            return babylonBone;
        }

        private _loadBones(context: string, skin: IGLTFSkin, inverseBindMatrixData: Nullable<Float32Array>): void {
            const babylonBones: { [index: number]: Bone } = {};
            for (const index of skin.joints) {
                const node = GLTFLoader._GetProperty(this._gltf.nodes, index);
                if (!node) {
                    throw new Error(context + ": Failed to find joint " + index);
                }

                this._loadBone(node, skin, inverseBindMatrixData, babylonBones);
            }
        }

        private _loadBone(node: IGLTFNode, skin: IGLTFSkin, inverseBindMatrixData: Nullable<Float32Array>, babylonBones: { [index: number]: Bone }): Bone {
            let babylonBone = babylonBones[node.index];
            if (babylonBone) {
                return babylonBone;
            }

            const boneIndex = skin.joints.indexOf(node.index);

            let baseMatrix = Matrix.Identity();
            if (inverseBindMatrixData && boneIndex !== -1) {
                baseMatrix = Matrix.FromArray(inverseBindMatrixData, boneIndex * 16);
                baseMatrix.invertToRef(baseMatrix);
            }

            let babylonParentBone: Nullable<Bone> = null;
            if (node.index !== skin.skeleton && node.parent && node.parent !== this._rootNode) {
                babylonParentBone = this._loadBone(node.parent, skin, inverseBindMatrixData, babylonBones);
                baseMatrix.multiplyToRef(babylonParentBone.getInvertedAbsoluteTransform(), baseMatrix);
            }

            babylonBone = this._createBone(node, skin, babylonParentBone, this._getNodeMatrix(node), baseMatrix, boneIndex);
            babylonBones[node.index] = babylonBone;
            return babylonBone;
        }

        private _getNodeMatrix(node: IGLTFNode): Matrix {
            return node.matrix ?
                Matrix.FromArray(node.matrix) :
                Matrix.Compose(
                    node.scale ? Vector3.FromArray(node.scale) : Vector3.One(),
                    node.rotation ? Quaternion.FromArray(node.rotation) : Quaternion.Identity(),
                    node.translation ? Vector3.FromArray(node.translation) : Vector3.Zero());
        }

        private _traverseNodes(context: string, indices: number[], action: (node: IGLTFNode, parentNode: IGLTFNode) => boolean, parentNode: Nullable<IGLTFNode> = null): void {
            for (const index of indices) {
                const node = GLTFLoader._GetProperty(this._gltf.nodes, index);
                if (!node) {
                    throw new Error(context + ": Failed to find node " + index);
                }

                this._traverseNode(context, node, action, parentNode);
            }
        }

        public _traverseNode(context: string, node: IGLTFNode, action: (node: IGLTFNode, parentNode: Nullable<IGLTFNode>) => boolean, parentNode: Nullable<IGLTFNode> = null): void {
            if (GLTFLoaderExtension.TraverseNode(this, context, node, action, parentNode)) {
                return;
            }

            if (!action(node, parentNode)) {
                return;
            }

            if (node.children) {
                this._traverseNodes(context, node.children, action, node);
            }
        }

        private _loadAnimations(): void {
            const animations = this._gltf.animations;
            if (!animations) {
                return;
            }

            for (let index = 0; index < animations.length; index++) {
                const animation = animations[index];
                this._loadAnimation("#/animations/" + index, animation);
            }
        }

        private _loadAnimation(context: string, animation: IGLTFAnimation): void {
            animation.targets = [];

            for (let index = 0; index < animation.channels.length; index++) {
                const channel = GLTFLoader._GetProperty(animation.channels, index);
                if (!channel) {
                    throw new Error(context + ": Failed to find channel " + index);
                }

                const sampler = GLTFLoader._GetProperty(animation.samplers, channel.sampler);
                if (!sampler) {
                    throw new Error(context + ": Failed to find sampler " + channel.sampler);
                }

                this._loadAnimationChannel(animation,
                    context + "/channels/" + index, channel,
                    context + "/samplers/" + channel.sampler, sampler);
            }
        }

        private _loadAnimationChannel(animation: IGLTFAnimation, channelContext: string, channel: IGLTFAnimationChannel, samplerContext: string, sampler: IGLTFAnimationSampler): void {
            const targetNode = GLTFLoader._GetProperty(this._gltf.nodes, channel.target.node);
            if (!targetNode) {
                throw new Error(channelContext + ": Failed to find target node " + channel.target.node);
            }

            let targetPath: string;
            let animationType: number;
            switch (channel.target.path) {
                case "translation": {
                    targetPath = "position";
                    animationType = Animation.ANIMATIONTYPE_VECTOR3;
                    break;
                }
                case "rotation": {
                    targetPath = "rotationQuaternion";
                    animationType = Animation.ANIMATIONTYPE_QUATERNION;
                    break;
                }
                case "scale": {
                    targetPath = "scaling";
                    animationType = Animation.ANIMATIONTYPE_VECTOR3;
                    break;
                }
                case "weights": {
                    targetPath = "influence";
                    animationType = Animation.ANIMATIONTYPE_FLOAT;
                    break;
                }
                default: {
                    throw new Error(channelContext + ": Invalid target path " + channel.target.path);
                }
            }

            let inputData: Float32Array;
            let outputData: Float32Array;

            const checkSuccess = () => {
                if (!inputData || !outputData) {
                    return;
                }

                let outputBufferOffset = 0;

                let getNextOutputValue: () => any;
                switch (targetPath) {
                    case "position": {
                        getNextOutputValue = () => {
                            const value = Vector3.FromArray(outputData, outputBufferOffset);
                            outputBufferOffset += 3;
                            return value;
                        };
                        break;
                    }
                    case "rotationQuaternion": {
                        getNextOutputValue = () => {
                            const value = Quaternion.FromArray(outputData, outputBufferOffset);
                            outputBufferOffset += 4;
                            return value;
                        };
                        break;
                    }
                    case "scaling": {
                        getNextOutputValue = () => {
                            const value = Vector3.FromArray(outputData, outputBufferOffset);
                            outputBufferOffset += 3;
                            return value;
                        };
                        break;
                    }
                    case "influence": {
                        getNextOutputValue = () => {
                            const numTargets = targetNode.babylonMesh.morphTargetManager!.numTargets;
                            const value = new Array<number>(numTargets);
                            for (let i = 0; i < numTargets; i++) {
                                value[i] = outputData[outputBufferOffset++];
                            }
                            return value;
                        };
                        break;
                    }
                }

                let getNextKey: (frameIndex: number) => any;
                switch (sampler.interpolation) {
                    case "LINEAR": {
                        getNextKey = frameIndex => ({
                            frame: inputData[frameIndex],
                            value: getNextOutputValue()
                        });
                        break;
                    }
                    case "CUBICSPLINE": {
                        getNextKey = frameIndex => ({
                            frame: inputData[frameIndex],
                            inTangent: getNextOutputValue(),
                            value: getNextOutputValue(),
                            outTangent: getNextOutputValue()
                        });
                        break;
                    }
                    default: {
                        throw new Error(samplerContext + ": Invalid interpolation " + sampler.interpolation);
                    }
                };

                const keys = new Array(inputData.length);
                for (let frameIndex = 0; frameIndex < inputData.length; frameIndex++) {
                    keys[frameIndex] = getNextKey(frameIndex);
                }

                if (targetPath === "influence") {
                    const morphTargetManager = targetNode.babylonMesh.morphTargetManager!;

                    for (let targetIndex = 0; targetIndex < morphTargetManager.numTargets; targetIndex++) {
                        const morphTarget = morphTargetManager.getTarget(targetIndex);
                        const animationName = (animation.name || "anim" + animation.index) + "_" + targetIndex;
                        const babylonAnimation = new Animation(animationName, targetPath, 1, animationType);
                        babylonAnimation.setKeys(keys.map(key => ({
                            frame: key.frame,
                            inTangent: key.inTangent ? key.inTangent[targetIndex] : undefined,
                            value: key.value[targetIndex],
                            outTangent: key.outTangent ? key.outTangent[targetIndex] : undefined
                        })));

                        morphTarget.animations.push(babylonAnimation);
                        animation.targets.push(morphTarget);
                    }
                }
                else {
                    const animationName = animation.name || "anim" + animation.index;
                    const babylonAnimation = new Animation(animationName, targetPath, 1, animationType);
                    babylonAnimation.setKeys(keys);

                    if (targetNode.babylonAnimationTargets) {
                        for (const target of targetNode.babylonAnimationTargets) {
                            target.animations.push(babylonAnimation.clone());
                            animation.targets.push(target);
                        }
                    }
                }
            };

            const inputAccessor = GLTFLoader._GetProperty(this._gltf.accessors, sampler.input);
            if (!inputAccessor) {
                throw new Error(samplerContext + ": Failed to find input accessor " + sampler.input);
            }

            this._loadAccessorAsync("#/accessors/" + inputAccessor.index, inputAccessor, data => {
                inputData = <Float32Array>data;
                checkSuccess();
            });

            const outputAccessor = GLTFLoader._GetProperty(this._gltf.accessors, sampler.output);
            if (!outputAccessor) {
                throw new Error(samplerContext + ": Failed to find output accessor " + sampler.output);
            }

            this._loadAccessorAsync("#/accessors/" + outputAccessor.index, outputAccessor, data => {
                outputData = <Float32Array>data;
                checkSuccess();
            });
        }

        private _loadBufferAsync(context: string, buffer: IGLTFBuffer, onSuccess: (data: ArrayBufferView) => void): void {
            this._addPendingData(buffer);

            if (buffer.loadedData) {
                onSuccess(buffer.loadedData);
                this._removePendingData(buffer);
            }
            else if (buffer.loadedObservable) {
                buffer.loadedObservable.add(buffer => {
                    onSuccess(buffer.loadedData!);
                    this._removePendingData(buffer);
                });
            }
            else {
                if (!buffer.uri) {
                    throw new Error(context + ": Uri is missing");
                }

                buffer.loadedObservable = new Observable<IGLTFBuffer>();
                buffer.loadedObservable.add(buffer => {
                    onSuccess(buffer.loadedData!);
                    this._removePendingData(buffer);
                });

                this._loadUriAsync(context, buffer.uri, data => {
                    buffer.loadedData = data;
                    buffer.loadedObservable!.notifyObservers(buffer);
                    buffer.loadedObservable = undefined;
                });
            }
        }

        private _loadBufferViewAsync(context: string, bufferView: IGLTFBufferView, onSuccess: (data: ArrayBufferView) => void): void {
            const buffer = GLTFLoader._GetProperty(this._gltf.buffers, bufferView.buffer);
            if (!buffer) {
                throw new Error(context + ": Failed to find buffer " + bufferView.buffer);
            }

            this._loadBufferAsync("#/buffers/" + buffer.index, buffer, bufferData => {
                let data: ArrayBufferView;

                try {
                    data = new Uint8Array(bufferData.buffer, bufferData.byteOffset + (bufferView.byteOffset || 0), bufferView.byteLength);
                }
                catch (e) {
                    throw new Error(context + ": " + e.message);
                }

                onSuccess(data);
            });
        }

        private _loadAccessorAsync(context: string, accessor: IGLTFAccessor, onSuccess: (data: ArrayBufferView) => void): void {
            if (accessor.sparse) {
                throw new Error(context + ": Sparse accessors are not currently supported");
            }

            const bufferView = GLTFLoader._GetProperty(this._gltf.bufferViews, accessor.bufferView);
            if (!bufferView) {
                throw new Error(context + ": Failed to find buffer view " + accessor.bufferView);
            }

            this._loadBufferViewAsync("#/bufferViews/" + bufferView.index, bufferView, bufferViewData => {
                const numComponents = GLTFLoader._GetNumComponents(accessor.type);
                if (numComponents === 0) {
                    throw new Error(context + ": Invalid type " + accessor.type);
                }

                let data: ArrayBufferView;
                let byteOffset = accessor.byteOffset || 0;
                let byteStride = bufferView.byteStride;

                try {
                    switch (accessor.componentType) {
                        case EComponentType.BYTE: {
                            data = this._buildArrayBuffer(Float32Array, bufferViewData, byteOffset, accessor.count, numComponents, byteStride);
                            break;
                        }
                        case EComponentType.UNSIGNED_BYTE: {
                            data = this._buildArrayBuffer(Uint8Array, bufferViewData, byteOffset, accessor.count, numComponents, byteStride);
                            break;
                        }
                        case EComponentType.SHORT: {
                            data = this._buildArrayBuffer(Int16Array, bufferViewData, byteOffset, accessor.count, numComponents, byteStride);
                            break;
                        }
                        case EComponentType.UNSIGNED_SHORT: {
                            data = this._buildArrayBuffer(Uint16Array, bufferViewData, byteOffset, accessor.count, numComponents, byteStride);
                            break;
                        }
                        case EComponentType.UNSIGNED_INT: {
                            data = this._buildArrayBuffer(Uint32Array, bufferViewData, byteOffset, accessor.count, numComponents, byteStride);
                            break;
                        }
                        case EComponentType.FLOAT: {
                            data = this._buildArrayBuffer(Float32Array, bufferViewData, byteOffset, accessor.count, numComponents, byteStride);
                            break;
                        }
                        default: {
                            throw new Error(context + ": Invalid component type " + accessor.componentType);
                        }
                    }
                }
                catch (e) {
                    throw new Error(context + ": " + e);
                }

                onSuccess(data);
            });
        }

        private _buildArrayBuffer<T extends TypedArray>(typedArray: TypedArrayConstructor<T>, data: ArrayBufferView, byteOffset: number, count: number, numComponents: number, byteStride?: number): T {
            byteOffset += data.byteOffset;

            const targetLength = count * numComponents;

            if (byteStride == null || byteStride === numComponents * typedArray.BYTES_PER_ELEMENT) {
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

        public _addPendingData(data: any): void {
            if (!this._renderReady) {
                this._renderPendingCount++;
            }

            this._addLoaderPendingData(data);
        }

        public _removePendingData(data: any): void {
            if (!this._renderReady) {
                if (--this._renderPendingCount === 0) {
                    this._addLoaderPendingData(this);
                    this._compileMaterialsAsync(() => {
                        this._compileShadowGeneratorsAsync(() => {
                            this._removeLoaderPendingData(this);
                            this._renderReady = true;
                            this._onRenderReady();
                        });
                    });
                }
            }

            this._removeLoaderPendingData(data);
        }

        public _addLoaderPendingData(data: any): void {
            this._loaderPendingCount++;

            for (const tracker of this._loaderTrackers) {
                tracker._addPendingData(data);
            }
        }

        public _removeLoaderPendingData(data: any): void {
            for (const tracker of this._loaderTrackers) {
                tracker._removePendingData(data);
            }

            if (--this._loaderPendingCount === 0) {
                this._onComplete();
            }
        }

        public _whenAction(action: () => void, onComplete: () => void): void {
            const tracker = new GLTFLoaderTracker(() => {
                this._loaderTrackers.splice(this._loaderTrackers.indexOf(tracker), 1);
                onComplete();
            });

            this._loaderTrackers.push(tracker);

            this._addLoaderPendingData(tracker);
            
            action();

            this._removeLoaderPendingData(tracker);
        }

        private _getDefaultMaterial(): Material {
            if (!this._defaultMaterial) {
                const id = "__gltf_default";
                let material = <PBRMaterial>this._babylonScene.getMaterialByName(id);
                if (!material) {
                    material = new PBRMaterial(id, this._babylonScene);
                    material.sideOrientation = Material.CounterClockWiseSideOrientation;
                    material.metallic = 1;
                    material.roughness = 1;
                }

                this._defaultMaterial = material;
            }

            return this._defaultMaterial;
        }

        private _loadMaterialMetallicRoughnessProperties(context: string, material: IGLTFMaterial): void {
            const babylonMaterial = material.babylonMaterial as PBRMaterial;

            // Ensure metallic workflow
            babylonMaterial.metallic = 1;
            babylonMaterial.roughness = 1;

            const properties = material.pbrMetallicRoughness;
            if (!properties) {
                return;
            }

            babylonMaterial.albedoColor = properties.baseColorFactor ? Color3.FromArray(properties.baseColorFactor) : new Color3(1, 1, 1);
            babylonMaterial.metallic = properties.metallicFactor == null ? 1 : properties.metallicFactor;
            babylonMaterial.roughness = properties.roughnessFactor == null ? 1 : properties.roughnessFactor;

            if (properties.baseColorTexture) {
                const texture = GLTFLoader._GetProperty(this._gltf.textures, properties.baseColorTexture.index);
                if (!texture) {
                    throw new Error(context + ": Failed to find base color texture " + properties.baseColorTexture.index);
                }

                babylonMaterial.albedoTexture = this._loadTexture("#/textures/" + texture.index, texture, properties.baseColorTexture.texCoord);
            }

            if (properties.metallicRoughnessTexture) {
                const texture = GLTFLoader._GetProperty(this._gltf.textures, properties.metallicRoughnessTexture.index);
                if (!texture) {
                    throw new Error(context + ": Failed to find metallic roughness texture " + properties.metallicRoughnessTexture.index);
                }

                babylonMaterial.metallicTexture = this._loadTexture("#/textures/" + texture.index, texture, properties.metallicRoughnessTexture.texCoord);
                babylonMaterial.useMetallnessFromMetallicTextureBlue = true;
                babylonMaterial.useRoughnessFromMetallicTextureGreen = true;
                babylonMaterial.useRoughnessFromMetallicTextureAlpha = false;
            }

            this._loadMaterialAlphaProperties(context, material, properties.baseColorFactor);
        }

        public _loadMaterial(context: string, material: IGLTFMaterial, assign: (babylonMaterial: Material, isNew: boolean) => void): void {
            if (material.babylonMaterial) {
                assign(material.babylonMaterial, false);
                return;
            }

            if (GLTFLoaderExtension.LoadMaterial(this, context, material, assign)) {
                return;
            }

            this._createPbrMaterial(material);
            this._loadMaterialBaseProperties(context, material);
            this._loadMaterialMetallicRoughnessProperties(context, material);
            assign(material.babylonMaterial, true);
        }

        public _createPbrMaterial(material: IGLTFMaterial): void {
            const babylonMaterial = new PBRMaterial(material.name || "mat" + material.index, this._babylonScene);
            babylonMaterial.sideOrientation = Material.CounterClockWiseSideOrientation;
            material.babylonMaterial = babylonMaterial;
        }

        public _loadMaterialBaseProperties(context: string, material: IGLTFMaterial): void {
            const babylonMaterial = material.babylonMaterial as PBRMaterial;

            babylonMaterial.emissiveColor = material.emissiveFactor ? Color3.FromArray(material.emissiveFactor) : new Color3(0, 0, 0);
            if (material.doubleSided) {
                babylonMaterial.backFaceCulling = false;
                babylonMaterial.twoSidedLighting = true;
            }

            if (material.normalTexture) {
                const texture = GLTFLoader._GetProperty(this._gltf.textures, material.normalTexture.index);
                if (!texture) {
                    throw new Error(context + ": Failed to find normal texture " + material.normalTexture.index);
                }

                babylonMaterial.bumpTexture = this._loadTexture("#/textures/" + texture.index, texture, material.normalTexture.texCoord);
                babylonMaterial.invertNormalMapX = !this._babylonScene.useRightHandedSystem;
                babylonMaterial.invertNormalMapY = this._babylonScene.useRightHandedSystem;
                if (material.normalTexture.scale != null) {
                    babylonMaterial.bumpTexture.level = material.normalTexture.scale;
                }
            }

            if (material.occlusionTexture) {
                const texture = GLTFLoader._GetProperty(this._gltf.textures, material.occlusionTexture.index);
                if (!texture) {
                    throw new Error(context + ": Failed to find occlusion texture " + material.occlusionTexture.index);
                }

                babylonMaterial.ambientTexture = this._loadTexture("#/textures/" + texture.index, texture, material.occlusionTexture.texCoord);
                babylonMaterial.useAmbientInGrayScale = true;
                if (material.occlusionTexture.strength != null) {
                    babylonMaterial.ambientTextureStrength = material.occlusionTexture.strength;
                }
            }

            if (material.emissiveTexture) {
                const texture = GLTFLoader._GetProperty(this._gltf.textures, material.emissiveTexture.index);
                if (!texture) {
                    throw new Error(context + ": Failed to find emissive texture " + material.emissiveTexture.index);
                }

                babylonMaterial.emissiveTexture = this._loadTexture("#/textures/" + texture.index, texture, material.emissiveTexture.texCoord);
            }
        }

        public _loadMaterialAlphaProperties(context: string, material: IGLTFMaterial, colorFactor: number[]): void {
            const babylonMaterial = material.babylonMaterial as PBRMaterial;

            const alphaMode = material.alphaMode || "OPAQUE";
            switch (alphaMode) {
                case "OPAQUE": {
                    babylonMaterial.transparencyMode = PBRMaterial.PBRMATERIAL_OPAQUE;
                    break;
                }
                case "MASK": {
                    babylonMaterial.transparencyMode = PBRMaterial.PBRMATERIAL_ALPHATEST;

                    babylonMaterial.alphaCutOff = (material.alphaCutoff == null ? 0.5 : material.alphaCutoff);

                    if (colorFactor) {
                        if (colorFactor[3] == 0) {
                            babylonMaterial.alphaCutOff = 1;
                        }
                        else {
                            babylonMaterial.alphaCutOff /= colorFactor[3];
                        }
                    }

                    if (babylonMaterial.albedoTexture) {
                        babylonMaterial.albedoTexture.hasAlpha = true;
                    }
                    break;
                }
                case "BLEND": {
                    babylonMaterial.transparencyMode = PBRMaterial.PBRMATERIAL_ALPHABLEND;

                    if (colorFactor) {
                        babylonMaterial.alpha = colorFactor[3];
                    }

                    if (babylonMaterial.albedoTexture) {
                        babylonMaterial.albedoTexture.hasAlpha = true;
                        babylonMaterial.useAlphaFromAlbedoTexture = true;
                    }
                    break;
                }
                default: {
                    throw new Error(context + ": Invalid alpha mode " + material.alphaMode);
                }
            }
        }

        public _loadTexture(context: string, texture: IGLTFTexture, coordinatesIndex?: number): Texture {
            const sampler = (texture.sampler == null ? <IGLTFSampler>{} : GLTFLoader._GetProperty(this._gltf.samplers, texture.sampler));
            if (!sampler) {
                throw new Error(context + ": Failed to find sampler " + texture.sampler);
            }

            const noMipMaps = (sampler.minFilter === ETextureMinFilter.NEAREST || sampler.minFilter === ETextureMinFilter.LINEAR);
            const samplingMode = GLTFLoader._GetTextureSamplingMode(sampler.magFilter, sampler.minFilter);

            this._addPendingData(texture);
            const babylonTexture = new Texture(null, this._babylonScene, noMipMaps, false, samplingMode, () => {
                this._tryCatchOnError(() => {
                    this._removePendingData(texture);
                });
            }, message => {
                this._tryCatchOnError(() => {
                    throw new Error(context + ": " + message);
                });
            });

            if (texture.url) {
                babylonTexture.updateURL(texture.url);
            }
            else if (texture.dataReadyObservable) {
                texture.dataReadyObservable.add(texture => {
                    babylonTexture.updateURL(texture.url!);
                });
            }
            else {
                texture.dataReadyObservable = new Observable<IGLTFTexture>();
                texture.dataReadyObservable.add(texture => {
                    babylonTexture.updateURL(texture.url!);
                });

                const image = GLTFLoader._GetProperty(this._gltf.images, texture.source);
                if (!image) {
                    throw new Error(context + ": Failed to find source " + texture.source);
                }

                this._loadImageAsync("#/images/" + image.index, image, data => {
                    texture.url = URL.createObjectURL(new Blob([data], { type: image.mimeType }));
                    texture.dataReadyObservable!.notifyObservers(texture);
                    texture.dataReadyObservable = undefined;
                });
            }

            babylonTexture.coordinatesIndex = coordinatesIndex || 0;
            babylonTexture.wrapU = GLTFLoader._GetTextureWrapMode(sampler.wrapS);
            babylonTexture.wrapV = GLTFLoader._GetTextureWrapMode(sampler.wrapT);
            babylonTexture.name = texture.name || "texture" + texture.index;

            if (this._parent.onTextureLoaded) {
                this._parent.onTextureLoaded(babylonTexture);
            }

            return babylonTexture;
        }

        private _loadImageAsync(context: string, image: IGLTFImage, onSuccess: (data: ArrayBufferView) => void): void {
            if (image.uri) {
                this._loadUriAsync(context, image.uri, onSuccess);
            }
            else {
                const bufferView = GLTFLoader._GetProperty(this._gltf.bufferViews, image.bufferView);
                if (!bufferView) {
                    throw new Error(context + ": Failed to find buffer view " + image.bufferView);
                }

                this._loadBufferViewAsync("#/bufferViews/" + bufferView.index, bufferView, onSuccess);
            }
        }

        public _loadUriAsync(context: string, uri: string, onSuccess: (data: ArrayBufferView) => void): void {
            if (GLTFUtils.IsBase64(uri)) {
                onSuccess(new Uint8Array(GLTFUtils.DecodeBase64(uri)));
                return;
            }

            if (!GLTFUtils.ValidateUri(uri)) {
                throw new Error(context + ": Uri '" + uri + "' is invalid");
            }

            let request = Tools.LoadFile(this._rootUrl + uri, data => {
                this._tryCatchOnError(() => {
                    onSuccess(new Uint8Array(data));
                });
            }, event => {
                this._tryCatchOnError(() => {
                    if (request && !this._renderReady) {
                        request._loaded = event.loaded;
                        request._total = event.total;
                        this._onProgress();
                    }
                });
            }, this._babylonScene.database, true, request => {
                this._tryCatchOnError(() => {
                    throw new Error(context + ": Failed to load '" + uri + "'" + (request ? ": " + request.status + " " + request.statusText : ""));
                });
            }) as GLTFLoaderRequest;

            if (request) {
                request._loaded = null;
                request._total = null;
                this._requests.push(request);
            }
        }

        public _tryCatchOnError(handler: () => void): void {
            if (this._disposed) {
                return;
            }

            try {
                handler();
            }
            catch (e) {
                Tools.Error("glTF Loader: " + e.message);

                if (this._errorCallback) {
                    this._errorCallback(e.message);
                }

                this.dispose();
            }
        }

        private static _AssignIndices(array?: Array<{index: number}>): void {
            if (array) {
                for (let index = 0; index < array.length; index++) {
                    array[index].index = index;
                }
            }
        }

        public static _GetProperty<T extends IGLTFProperty>(array?: ArrayLike<T>, index?: number): Nullable<T> {
            if (!array || index == undefined || !array[index]) {
                return null;
            }

            return array[index];
        }

        private static _GetTextureWrapMode(mode?: ETextureWrapMode): number {
            // Set defaults if undefined
            mode = mode == undefined ? ETextureWrapMode.REPEAT : mode;

            switch (mode) {
                case ETextureWrapMode.CLAMP_TO_EDGE: return Texture.CLAMP_ADDRESSMODE;
                case ETextureWrapMode.MIRRORED_REPEAT: return Texture.MIRROR_ADDRESSMODE;
                case ETextureWrapMode.REPEAT: return Texture.WRAP_ADDRESSMODE;
                default:
                    Tools.Warn("Invalid texture wrap mode (" + mode + ")");
                    return Texture.WRAP_ADDRESSMODE;
            }
        }

        private static _GetTextureSamplingMode(magFilter?: ETextureMagFilter, minFilter?: ETextureMinFilter): number {
            // Set defaults if undefined
            magFilter = magFilter == undefined ? ETextureMagFilter.LINEAR : magFilter;
            minFilter = minFilter == undefined ? ETextureMinFilter.LINEAR_MIPMAP_LINEAR : minFilter;

            if (magFilter === ETextureMagFilter.LINEAR) {
                switch (minFilter) {
                    case ETextureMinFilter.NEAREST: return Texture.LINEAR_NEAREST;
                    case ETextureMinFilter.LINEAR: return Texture.LINEAR_LINEAR;
                    case ETextureMinFilter.NEAREST_MIPMAP_NEAREST: return Texture.LINEAR_NEAREST_MIPNEAREST;
                    case ETextureMinFilter.LINEAR_MIPMAP_NEAREST: return Texture.LINEAR_LINEAR_MIPNEAREST;
                    case ETextureMinFilter.NEAREST_MIPMAP_LINEAR: return Texture.LINEAR_NEAREST_MIPLINEAR;
                    case ETextureMinFilter.LINEAR_MIPMAP_LINEAR: return Texture.LINEAR_LINEAR_MIPLINEAR;
                    default:
                        Tools.Warn("Invalid texture minification filter (" + minFilter + ")");
                        return Texture.LINEAR_LINEAR_MIPLINEAR;
                }
            }
            else {
                if (magFilter !== ETextureMagFilter.NEAREST) {
                    Tools.Warn("Invalid texture magnification filter (" + magFilter + ")");
                }

                switch (minFilter) {
                    case ETextureMinFilter.NEAREST: return Texture.NEAREST_NEAREST;
                    case ETextureMinFilter.LINEAR: return Texture.NEAREST_LINEAR;
                    case ETextureMinFilter.NEAREST_MIPMAP_NEAREST: return Texture.NEAREST_NEAREST_MIPNEAREST;
                    case ETextureMinFilter.LINEAR_MIPMAP_NEAREST: return Texture.NEAREST_LINEAR_MIPNEAREST;
                    case ETextureMinFilter.NEAREST_MIPMAP_LINEAR: return Texture.NEAREST_NEAREST_MIPLINEAR;
                    case ETextureMinFilter.LINEAR_MIPMAP_LINEAR: return Texture.NEAREST_LINEAR_MIPLINEAR;
                    default:
                        Tools.Warn("Invalid texture minification filter (" + minFilter + ")");
                        return Texture.NEAREST_NEAREST_MIPNEAREST;
                }
            }
        }

        private static _GetNumComponents(type: string): number {
            switch (type) {
                case "SCALAR": return 1;
                case "VEC2": return 2;
                case "VEC3": return 3;
                case "VEC4": return 4;
                case "MAT2": return 4;
                case "MAT3": return 9;
                case "MAT4": return 16;
            }

            return 0;
        }

        private _compileMaterialAsync(babylonMaterial: Material, babylonMesh: AbstractMesh, onSuccess: () => void): void {
            if (!this._parent.compileMaterials) {
                onSuccess();
                return;
            }

            if (this._parent.useClipPlane) {
                babylonMaterial.forceCompilation(babylonMesh, () => {
                    babylonMaterial.forceCompilation(babylonMesh, () => {
                        this._tryCatchOnError(onSuccess);
                    }, { clipPlane: true });
                });
            }
            else {
                babylonMaterial.forceCompilation(babylonMesh, () => {
                    this._tryCatchOnError(onSuccess);
                });
            }
        }

        private _compileMaterialsAsync(onSuccess: () => void): void {
            if (!this._parent.compileMaterials || !this._gltf.materials) {
                onSuccess();
                return;
            }

            let meshes = this._getMeshes();

            let remaining = 0;
            for (let mesh of meshes) {
                if (mesh.material instanceof MultiMaterial) {
                    for (let subMaterial of mesh.material.subMaterials) {
                        if (subMaterial) {
                            remaining++;
                        }
                    }
                }
            }

            if (remaining === 0) {
                onSuccess();
                return;
            }

            for (let mesh of meshes) {
                if (mesh.material instanceof MultiMaterial) {
                    for (let subMaterial of mesh.material.subMaterials) {
                        if (subMaterial) {
                            this._compileMaterialAsync(subMaterial, mesh, () => {
                                if (--remaining === 0) {
                                    onSuccess();
                                }
                            });
                        }
                    }
                }
            }
        }

        private _compileShadowGeneratorsAsync(onSuccess: () => void): void {
            if (!this._parent.compileShadowGenerators) {
                onSuccess();
                return;
            }

            let lights = this._babylonScene.lights;

            let remaining = 0;
            for (let light of lights) {
                let generator = light.getShadowGenerator();
                if (generator) {
                    remaining++;
                }
            }

            if (remaining === 0) {
                onSuccess();
                return;
            }

            for (let light of lights) {
                let generator = light.getShadowGenerator();
                if (generator) {
                    generator.forceCompilation(() => {
                        if (--remaining === 0) {
                            this._tryCatchOnError(onSuccess);
                        }
                    });
                }
            }
        }
    }

    BABYLON.GLTFFileLoader.CreateGLTFLoaderV2 = parent => new GLTFLoader(parent);
}
