import { IndicesArray, Nullable } from "babylonjs/types";
import { Deferred } from "babylonjs/Misc/deferred";
import { Quaternion, Vector3, Matrix } from "babylonjs/Maths/math.vector";
import { Color3 } from 'babylonjs/Maths/math.color';
import { Tools } from "babylonjs/Misc/tools";
import { Camera } from "babylonjs/Cameras/camera";
import { FreeCamera } from "babylonjs/Cameras/freeCamera";
import { AnimationGroup } from "babylonjs/Animations/animationGroup";
import { Animation } from "babylonjs/Animations/animation";
import { Bone } from "babylonjs/Bones/bone";
import { Skeleton } from "babylonjs/Bones/skeleton";
import { Material } from "babylonjs/Materials/material";
import { PBRMaterial } from "babylonjs/Materials/PBR/pbrMaterial";
import { BaseTexture } from "babylonjs/Materials/Textures/baseTexture";
import { Texture } from "babylonjs/Materials/Textures/texture";
import { TransformNode } from "babylonjs/Meshes/transformNode";
import { Buffer, VertexBuffer } from "babylonjs/Meshes/buffer";
import { Geometry } from "babylonjs/Meshes/geometry";
import { AbstractMesh } from "babylonjs/Meshes/abstractMesh";
import { InstancedMesh } from "babylonjs/Meshes/instancedMesh";
import { Mesh } from "babylonjs/Meshes/mesh";
import { MorphTarget } from "babylonjs/Morph/morphTarget";
import { MorphTargetManager } from "babylonjs/Morph/morphTargetManager";
import { ISceneLoaderProgressEvent } from "babylonjs/Loading/sceneLoader";
import { Scene } from "babylonjs/scene";
import { IProperty, AccessorType, CameraType, AnimationChannelTargetPath, AnimationSamplerInterpolation, AccessorComponentType, MaterialAlphaMode, TextureMinFilter, TextureWrapMode, TextureMagFilter, MeshPrimitiveMode } from "babylonjs-gltf2interface";
import { _IAnimationSamplerData, IGLTF, ISampler, INode, IScene, IMesh, IAccessor, ISkin, ICamera, IAnimation, IAnimationChannel, IAnimationSampler, IBuffer, IBufferView, IMaterialPbrMetallicRoughness, IMaterial, ITextureInfo, ITexture, IImage, IMeshPrimitive, IArrayItem as IArrItem, _ISamplerData } from "./glTFLoaderInterfaces";
import { IGLTFLoaderExtension } from "./glTFLoaderExtension";
import { IGLTFLoader, GLTFFileLoader, GLTFLoaderState, IGLTFLoaderData, GLTFLoaderCoordinateSystemMode, GLTFLoaderAnimationStartMode, IImportMeshAsyncOutput } from "../glTFFileLoader";
import { IAnimationKey, AnimationKeyInterpolation } from 'babylonjs/Animations/animationKey';
import { IAnimatable } from 'babylonjs/Animations/animatable.interface';
import { IDataBuffer } from 'babylonjs/Misc/dataReader';
import { LoadFileError } from 'babylonjs/Misc/fileTools';
import { Logger } from 'babylonjs/Misc/logger';
import { Light } from 'babylonjs/Lights/light';

interface TypedArrayLike extends ArrayBufferView {
    readonly length: number;
    [n: number]: number;
}

interface TypedArrayConstructor {
    new(length: number): TypedArrayLike;
    new(buffer: ArrayBufferLike, byteOffset: number, length?: number): TypedArrayLike;
}

interface ILoaderProperty extends IProperty {
    _activeLoaderExtensionFunctions: {
        [id: string]: boolean
    };
}

interface IRegisteredExtension {
    factory: (loader: GLTFLoader) => IGLTFLoaderExtension;
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
    public static Assign(array?: IArrItem[]): void {
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
    /** @hidden */
    public _completePromises = new Array<Promise<any>>();

    /** @hidden */
    public _forAssetContainer = false;

    /** Storage */
    public _babylonLights: Light[] = [];

    /** @hidden */
    public _disableInstancedMesh = 0;

    private _disposed = false;
    private _parent: GLTFFileLoader;
    private _state: Nullable<GLTFLoaderState> = null;
    private _extensions = new Array<IGLTFLoaderExtension>();
    private _rootUrl: string;
    private _fileName: string;
    private _uniqueRootUrl: string;
    private _gltf: IGLTF;
    private _bin: Nullable<IDataBuffer>;
    private _babylonScene: Scene;
    private _rootBabylonMesh: Mesh;
    private _defaultBabylonMaterialData: { [drawMode: number]: Material } = {};

    private static _RegisteredExtensions: { [name: string]: IRegisteredExtension } = {};

    /**
     * The default glTF sampler.
     */
    public static readonly DefaultSampler: ISampler = { index: -1 };

    /**
     * Registers a loader extension.
     * @param name The name of the loader extension.
     * @param factory The factory function that creates the loader extension.
     */
    public static RegisterExtension(name: string, factory: (loader: GLTFLoader) => IGLTFLoaderExtension): void {
        if (GLTFLoader.UnregisterExtension(name)) {
            Logger.Warn(`Extension with the name '${name}' already exists`);
        }

        GLTFLoader._RegisteredExtensions[name] = {
            factory: factory
        };
    }

    /**
     * Unregisters a loader extension.
     * @param name The name of the loader extension.
     * @returns A boolean indicating whether the extension has been unregistered
     */
    public static UnregisterExtension(name: string): boolean {
        if (!GLTFLoader._RegisteredExtensions[name]) {
            return false;
        }

        delete GLTFLoader._RegisteredExtensions[name];
        return true;
    }

    /**
     * The loader state.
     */
    public get state(): Nullable<GLTFLoaderState> {
        return this._state;
    }

    /**
     * The object that represents the glTF JSON.
     */
    public get gltf(): IGLTF {
        return this._gltf;
    }

    /**
     * The BIN chunk of a binary glTF.
     */
    public get bin(): Nullable<IDataBuffer> {
        return this._bin;
    }

    /**
     * The parent file loader.
     */
    public get parent(): GLTFFileLoader {
        return this._parent;
    }

    /**
     * The Babylon scene when loading the asset.
     */
    public get babylonScene(): Scene {
        return this._babylonScene;
    }

    /**
     * The root Babylon mesh when loading the asset.
     */
    public get rootBabylonMesh(): Mesh {
        return this._rootBabylonMesh;
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

        this._completePromises.length = 0;

        for (const name in this._extensions) {
            const extension = this._extensions[name];
            extension.dispose && extension.dispose();
            delete this._extensions[name];
        }

        delete this._gltf;
        delete this._babylonScene;
        delete this._rootBabylonMesh;

        this._parent.dispose();
    }

    /** @hidden */
    public importMeshAsync(meshesNames: any, scene: Scene, forAssetContainer: boolean, data: IGLTFLoaderData, rootUrl: string, onProgress?: (event: ISceneLoaderProgressEvent) => void, fileName?: string): Promise<IImportMeshAsyncOutput> {
        return Promise.resolve().then(() => {
            this._babylonScene = scene;
            this._rootUrl = rootUrl;
            this._fileName = fileName || "scene";
            this._forAssetContainer = forAssetContainer;
            this._loadData(data);

            let nodes: Nullable<Array<number>> = null;

            if (meshesNames) {
                const nodeMap: { [name: string]: number } = {};
                if (this._gltf.nodes) {
                    for (const node of this._gltf.nodes) {
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
                    animationGroups: this._getAnimationGroups(),
                    lights: this._babylonLights,
                    transformNodes: this._getTransformNodes()
                };
            });
        });
    }

    /** @hidden */
    public loadAsync(scene: Scene, data: IGLTFLoaderData, rootUrl: string, onProgress?: (event: ISceneLoaderProgressEvent) => void, fileName?: string): Promise<void> {
        return Promise.resolve().then(() => {
            this._babylonScene = scene;
            this._rootUrl = rootUrl;
            this._fileName = fileName || "scene";
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

            // Block the marking of materials dirty until the scene is loaded.
            const oldBlockMaterialDirtyMechanism = this._babylonScene.blockMaterialDirtyMechanism;
            this._babylonScene.blockMaterialDirtyMechanism = true;

            if (nodes) {
                promises.push(this.loadSceneAsync("/nodes", { nodes: nodes, index: -1 }));
            }
            else if (this._gltf.scene != undefined || (this._gltf.scenes && this._gltf.scenes[0])) {
                const scene = ArrayItem.Get(`/scene`, this._gltf.scenes, this._gltf.scene || 0);
                promises.push(this.loadSceneAsync(`/scenes/${scene.index}`, scene));
            }

            // Restore the blocking of material dirty.
            this._babylonScene.blockMaterialDirtyMechanism = oldBlockMaterialDirtyMechanism;

            if (this._parent.compileMaterials) {
                promises.push(this._compileMaterialsAsync());
            }

            if (this._parent.compileShadowGenerators) {
                promises.push(this._compileShadowGeneratorsAsync());
            }

            const resultPromise = Promise.all(promises).then(() => {
                if (this._rootBabylonMesh) {
                    this._rootBabylonMesh.setEnabled(true);
                }

                this._extensionsOnReady();
                this._setState(GLTFLoaderState.READY);

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
        this._gltf = data.json as IGLTF;
        this._setupData();

        if (data.bin) {
            const buffers = this._gltf.buffers;
            if (buffers && buffers[0] && !buffers[0].uri) {
                const binaryBuffer = buffers[0];
                if (binaryBuffer.byteLength < data.bin.byteLength - 3 || binaryBuffer.byteLength > data.bin.byteLength) {
                    Logger.Warn(`Binary buffer length (${binaryBuffer.byteLength}) from JSON does not match chunk length (${data.bin.byteLength})`);
                }

                this._bin = data.bin;
            }
            else {
                Logger.Warn("Unexpected BIN chunk");
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
                        nodeParents[index] = node.index;
                    }
                }
            }

            const rootNode = this._createRootNode();
            for (const node of this._gltf.nodes) {
                const parentIndex = nodeParents[node.index];
                node.parent = parentIndex === undefined ? rootNode : this._gltf.nodes[parentIndex];
            }
        }
    }

    private _loadExtensions(): void {
        for (const name in GLTFLoader._RegisteredExtensions) {
            const extension = GLTFLoader._RegisteredExtensions[name].factory(this);
            if (extension.name !== name) {
                Logger.Warn(`The name of the glTF loader extension instance does not match the registered name: ${extension.name} !== ${name}`);
            }

            this._extensions.push(extension);
            this._parent.onExtensionLoadedObservable.notifyObservers(extension);
        }

        this._extensions.sort((a, b) => (a.order || Number.MAX_VALUE) - (b.order || Number.MAX_VALUE));
        this._parent.onExtensionLoadedObservable.clear();
    }

    private _checkExtensions(): void {
        if (this._gltf.extensionsRequired) {
            for (const name of this._gltf.extensionsRequired) {
                const available = this._extensions.some((extension) => extension.name === name && extension.enabled);
                if (!available) {
                    throw new Error(`Require extension ${name} is not available`);
                }
            }
        }
    }

    private _setState(state: GLTFLoaderState): void {
        this._state = state;
        this.log(GLTFLoaderState[this._state]);
    }

    private _createRootNode(): INode {
        this._babylonScene._blockEntityCollection = this._forAssetContainer;
        this._rootBabylonMesh = new Mesh("__root__", this._babylonScene);
        this._babylonScene._blockEntityCollection = false;
        this._rootBabylonMesh.setEnabled(false);

        const rootNode: INode = {
            _babylonTransformNode: this._rootBabylonMesh,
            index: -1
        };

        switch (this._parent.coordinateSystemMode) {
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
    public loadSceneAsync(context: string, scene: IScene): Promise<void> {
        const extensionPromise = this._extensionsLoadSceneAsync(context, scene);
        if (extensionPromise) {
            return extensionPromise;
        }

        const promises = new Array<Promise<any>>();

        this.logOpen(`${context} ${scene.name || ""}`);

        if (scene.nodes) {
            for (let index of scene.nodes) {
                const node = ArrayItem.Get(`${context}/nodes/${index}`, this._gltf.nodes, index);
                promises.push(this.loadNodeAsync(`/nodes/${node.index}`, node, (babylonMesh) => {
                    babylonMesh.parent = this._rootBabylonMesh;
                }));
            }
        }

        // Link all Babylon bones for each glTF node with the corresponding Babylon transform node.
        // A glTF joint is a pointer to a glTF node in the glTF node hierarchy similar to Unity3D.
        if (this._gltf.nodes) {
            for (const node of this._gltf.nodes) {
                if (node._babylonTransformNode && node._babylonBones) {
                    for (const babylonBone of node._babylonBones) {
                        babylonBone.linkTransformNode(node._babylonTransformNode);
                    }
                }
            }
        }

        promises.push(this._loadAnimationsAsync());

        this.logClose();

        return Promise.all(promises).then(() => { });
    }

    private _forEachPrimitive(node: INode, callback: (babylonMesh: AbstractMesh) => void): void {
        if (node._primitiveBabylonMeshes) {
            for (const babylonMesh of node._primitiveBabylonMeshes) {
                callback(babylonMesh);
            }
        }
    }

    private _getMeshes(): AbstractMesh[] {
        const meshes = new Array<AbstractMesh>();

        // Root mesh is always first.
        meshes.push(this._rootBabylonMesh);

        const nodes = this._gltf.nodes;
        if (nodes) {
            for (const node of nodes) {
                this._forEachPrimitive(node, (babylonMesh) => {
                    meshes.push(babylonMesh);
                });
            }
        }

        return meshes;
    }

    private _getTransformNodes(): TransformNode[] {
        const transformNodes = new Array<TransformNode>();

        const nodes = this._gltf.nodes;
        if (nodes) {
            for (const node of nodes) {
                if (node._babylonTransformNode && node._babylonTransformNode.getClassName() === "TransformNode") {
                    transformNodes.push(node._babylonTransformNode);
                }
            }
        }

        return transformNodes;
    }

    private _getSkeletons(): Skeleton[] {
        const skeletons = new Array<Skeleton>();

        const skins = this._gltf.skins;
        if (skins) {
            for (const skin of skins) {
                if (skin._data) {
                    skeletons.push(skin._data.babylonSkeleton);
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
                Logger.Error(`Invalid animation start mode (${this._parent.animationStartMode})`);
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
    public loadNodeAsync(context: string, node: INode, assign: (babylonTransformNode: TransformNode) => void = () => { }): Promise<TransformNode> {
        const extensionPromise = this._extensionsLoadNodeAsync(context, node, assign);
        if (extensionPromise) {
            return extensionPromise;
        }

        if (node._babylonTransformNode) {
            throw new Error(`${context}: Invalid recursive node hierarchy`);
        }

        const promises = new Array<Promise<any>>();

        this.logOpen(`${context} ${node.name || ""}`);

        const loadNode = (babylonTransformNode: TransformNode) => {
            GLTFLoader.AddPointerMetadata(babylonTransformNode, context);
            GLTFLoader._LoadTransform(node, babylonTransformNode);

            if (node.camera != undefined) {
                const camera = ArrayItem.Get(`${context}/camera`, this._gltf.cameras, node.camera);
                promises.push(this.loadCameraAsync(`/cameras/${camera.index}`, camera, (babylonCamera) => {
                    babylonCamera.parent = babylonTransformNode;
                }));
            }

            if (node.children) {
                for (const index of node.children) {
                    const childNode = ArrayItem.Get(`${context}/children/${index}`, this._gltf.nodes, index);
                    promises.push(this.loadNodeAsync(`/nodes/${childNode.index}`, childNode, (childBabylonMesh) => {
                        childBabylonMesh.parent = babylonTransformNode;
                    }));
                }
            }

            assign(babylonTransformNode);
        };

        if (node.mesh == undefined) {
            const nodeName = node.name || `node${node.index}`;
            this._babylonScene._blockEntityCollection = this._forAssetContainer;
            node._babylonTransformNode = new TransformNode(nodeName, this._babylonScene);
            this._babylonScene._blockEntityCollection = false;
            loadNode(node._babylonTransformNode);
        }
        else {
            const mesh = ArrayItem.Get(`${context}/mesh`, this._gltf.meshes, node.mesh);
            promises.push(this._loadMeshAsync(`/meshes/${mesh.index}`, node, mesh, loadNode));
        }

        this.logClose();

        return Promise.all(promises).then(() => {
            this._forEachPrimitive(node, (babylonMesh) => {
                babylonMesh.refreshBoundingInfo(true);
            });

            return node._babylonTransformNode!;
        });
    }

    private _loadMeshAsync(context: string, node: INode, mesh: IMesh, assign: (babylonTransformNode: TransformNode) => void): Promise<TransformNode> {
        const primitives = mesh.primitives;
        if (!primitives || !primitives.length) {
            throw new Error(`${context}: Primitives are missing`);
        }

        if (primitives[0].index == undefined) {
            ArrayItem.Assign(primitives);
        }

        const promises = new Array<Promise<any>>();

        this.logOpen(`${context} ${mesh.name || ""}`);

        const name = node.name || `node${node.index}`;

        if (primitives.length === 1) {
            const primitive = mesh.primitives[0];
            promises.push(this._loadMeshPrimitiveAsync(`${context}/primitives/${primitive.index}`, name, node, mesh, primitive, (babylonMesh) => {
                node._babylonTransformNode = babylonMesh;
                node._primitiveBabylonMeshes = [babylonMesh];
            }));
        }
        else {
            this._babylonScene._blockEntityCollection = this._forAssetContainer;
            node._babylonTransformNode = new TransformNode(name, this._babylonScene);
            this._babylonScene._blockEntityCollection = false;
            node._primitiveBabylonMeshes = [];
            for (const primitive of primitives) {
                promises.push(this._loadMeshPrimitiveAsync(`${context}/primitives/${primitive.index}`, `${name}_primitive${primitive.index}`, node, mesh, primitive, (babylonMesh) => {
                    babylonMesh.parent = node._babylonTransformNode!;
                    node._primitiveBabylonMeshes!.push(babylonMesh);
                }));
            }
        }

        if (node.skin != undefined) {
            const skin = ArrayItem.Get(`${context}/skin`, this._gltf.skins, node.skin);
            promises.push(this._loadSkinAsync(`/skins/${skin.index}`, node, skin));
        }

        assign(node._babylonTransformNode!);

        this.logClose();

        return Promise.all(promises).then(() => {
            return node._babylonTransformNode!;
        });
    }

    /**
     * @hidden Define this method to modify the default behavior when loading data for mesh primitives.
     * @param context The context when loading the asset
     * @param name The mesh name when loading the asset
     * @param node The glTF node when loading the asset
     * @param mesh The glTF mesh when loading the asset
     * @param primitive The glTF mesh primitive property
     * @param assign A function called synchronously after parsing the glTF properties
     * @returns A promise that resolves with the loaded mesh when the load is complete or null if not handled
     */
    public _loadMeshPrimitiveAsync(context: string, name: string, node: INode, mesh: IMesh, primitive: IMeshPrimitive, assign: (babylonMesh: AbstractMesh) => void): Promise<AbstractMesh> {
        const extensionPromise = this._extensionsLoadMeshPrimitiveAsync(context, name, node, mesh, primitive, assign);
        if (extensionPromise) {
            return extensionPromise;
        }

        this.logOpen(`${context}`);

        const shouldInstance = (this._disableInstancedMesh === 0) && this._parent.createInstances && (node.skin == undefined && !mesh.primitives[0].targets);

        let babylonAbstractMesh: AbstractMesh;
        let promise: Promise<any>;

        if (shouldInstance && primitive._instanceData) {
            babylonAbstractMesh = primitive._instanceData.babylonSourceMesh.createInstance(name) as InstancedMesh;
            promise = primitive._instanceData.promise;
        }
        else {
            const promises = new Array<Promise<any>>();

            this._babylonScene._blockEntityCollection = this._forAssetContainer;
            const babylonMesh = new Mesh(name, this._babylonScene);
            this._babylonScene._blockEntityCollection = false;
            babylonMesh.overrideMaterialSideOrientation = this._babylonScene.useRightHandedSystem ? Material.CounterClockWiseSideOrientation : Material.ClockWiseSideOrientation;

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
                    babylonMaterial = this._createDefaultMaterial("__GLTFLoader._default", babylonDrawMode);
                    this._parent.onMaterialLoadedObservable.notifyObservers(babylonMaterial);
                    this._defaultBabylonMaterialData[babylonDrawMode] = babylonMaterial;
                }
                babylonMesh.material = babylonMaterial;
            }
            else {
                const material = ArrayItem.Get(`${context}/material`, this._gltf.materials, primitive.material);
                promises.push(this._loadMaterialAsync(`/materials/${material.index}`, material, babylonMesh, babylonDrawMode, (babylonMaterial) => {
                    babylonMesh.material = babylonMaterial;
                }));
            }

            promise = Promise.all(promises);

            if (shouldInstance) {
                primitive._instanceData = {
                    babylonSourceMesh: babylonMesh,
                    promise: promise
                };
            }

            babylonAbstractMesh = babylonMesh;
        }

        GLTFLoader.AddPointerMetadata(babylonAbstractMesh, context);
        this._parent.onMeshLoadedObservable.notifyObservers(babylonAbstractMesh);
        assign(babylonAbstractMesh);

        this.logClose();

        return promise.then(() => {
            return babylonAbstractMesh;
        });
    }

    private _loadVertexDataAsync(context: string, primitive: IMeshPrimitive, babylonMesh: Mesh): Promise<Geometry> {
        const extensionPromise = this._extensionsLoadVertexDataAsync(context, primitive, babylonMesh);
        if (extensionPromise) {
            return extensionPromise;
        }

        const attributes = primitive.attributes;
        if (!attributes) {
            throw new Error(`${context}: Attributes are missing`);
        }

        const promises = new Array<Promise<any>>();

        const babylonGeometry = new Geometry(babylonMesh.name, this._babylonScene);

        if (primitive.indices == undefined) {
            babylonMesh.isUnIndexed = true;
        }
        else {
            const accessor = ArrayItem.Get(`${context}/indices`, this._gltf.accessors, primitive.indices);
            promises.push(this._loadIndicesAccessorAsync(`/accessors/${accessor.index}`, accessor).then((data) => {
                babylonGeometry.setIndices(data);
            }));
        }

        const loadAttribute = (attribute: string, kind: string, callback?: (accessor: IAccessor) => void) => {
            if (attributes[attribute] == undefined) {
                return;
            }

            babylonMesh._delayInfo = babylonMesh._delayInfo || [];
            if (babylonMesh._delayInfo.indexOf(kind) === -1) {
                babylonMesh._delayInfo.push(kind);
            }

            const accessor = ArrayItem.Get(`${context}/attributes/${attribute}`, this._gltf.accessors, attributes[attribute]);
            promises.push(this._loadVertexAccessorAsync(`/accessors/${accessor.index}`, accessor, kind).then((babylonVertexBuffer) => {
                babylonGeometry.setVerticesBuffer(babylonVertexBuffer, accessor.count);
            }));

            if (kind == VertexBuffer.MatricesIndicesExtraKind) {
                babylonMesh.numBoneInfluencers = 8;
            }

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
        loadAttribute("JOINTS_1", VertexBuffer.MatricesIndicesExtraKind);
        loadAttribute("WEIGHTS_1", VertexBuffer.MatricesWeightsExtraKind);
        loadAttribute("COLOR_0", VertexBuffer.ColorKind, (accessor) => {
            if (accessor.type === AccessorType.VEC4) {
                babylonMesh.hasVertexAlpha = true;
            }
        });

        return Promise.all(promises).then(() => {
            return babylonGeometry;
        });
    }

    private _createMorphTargets(context: string, node: INode, mesh: IMesh, primitive: IMeshPrimitive, babylonMesh: Mesh): void {
        if (!primitive.targets) {
            return;
        }

        if (node._numMorphTargets == undefined) {
            node._numMorphTargets = primitive.targets.length;
        }
        else if (primitive.targets.length !== node._numMorphTargets) {
            throw new Error(`${context}: Primitives do not have the same number of targets`);
        }

        const targetNames = mesh.extras ? mesh.extras.targetNames : null;

        babylonMesh.morphTargetManager = new MorphTargetManager(babylonMesh.getScene());
        for (let index = 0; index < primitive.targets.length; index++) {
            const weight = node.weights ? node.weights[index] : mesh.weights ? mesh.weights[index] : 0;
            const name = targetNames ? targetNames[index] : `morphTarget${index}`;
            babylonMesh.morphTargetManager.addTarget(new MorphTarget(name, weight, babylonMesh.getScene()));
            // TODO: tell the target whether it has positions, normals, tangents
        }
    }

    private _loadMorphTargetsAsync(context: string, primitive: IMeshPrimitive, babylonMesh: Mesh, babylonGeometry: Geometry): Promise<void> {
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

            const accessor = ArrayItem.Get(`${context}/${attribute}`, this._gltf.accessors, attributes[attribute]);
            promises.push(this._loadFloatAccessorAsync(`/accessors/${accessor.index}`, accessor).then((data) => {
                setData(babylonVertexBuffer, data);
            }));
        };

        loadAttribute("POSITION", VertexBuffer.PositionKind, (babylonVertexBuffer, data) => {
            const positions = new Float32Array(data.length);
            babylonVertexBuffer.forEach(data.length, (value, index) => {
                positions[index] = data[index] + value;
            });

            babylonMorphTarget.setPositions(positions);
        });

        loadAttribute("NORMAL", VertexBuffer.NormalKind, (babylonVertexBuffer, data) => {
            const normals = new Float32Array(data.length);
            babylonVertexBuffer.forEach(normals.length, (value, index) => {
                normals[index] = data[index] + value;
            });

            babylonMorphTarget.setNormals(normals);
        });

        loadAttribute("TANGENT", VertexBuffer.TangentKind, (babylonVertexBuffer, data) => {
            const tangents = new Float32Array(data.length / 3 * 4);
            let dataIndex = 0;
            babylonVertexBuffer.forEach(data.length / 3 * 4, (value, index) => {
                // Tangent data for morph targets is stored as xyz delta.
                // The vertexData.tangent is stored as xyzw.
                // So we need to skip every fourth vertexData.tangent.
                if (((index + 1) % 4) !== 0) {
                    tangents[dataIndex] = data[dataIndex] + value;
                    dataIndex++;
                }
            });
            babylonMorphTarget.setTangents(tangents);
        });

        return Promise.all(promises).then(() => { });
    }

    private static _LoadTransform(node: INode, babylonNode: TransformNode): void {
        // Ignore the TRS of skinned nodes.
        // See https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#skins (second implementation note)
        if (node.skin != undefined) {
            return;
        }

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

    private _loadSkinAsync(context: string, node: INode, skin: ISkin): Promise<void> {
        const extensionPromise = this._extensionsLoadSkinAsync(context, node, skin);
        if (extensionPromise) {
            return extensionPromise;
        }

        const assignSkeleton = (skeleton: Skeleton) => {
            this._forEachPrimitive(node, (babylonMesh) => {
                babylonMesh.skeleton = skeleton;
            });
        };

        if (skin._data) {
            assignSkeleton(skin._data.babylonSkeleton);
            return skin._data.promise;
        }

        const skeletonId = `skeleton${skin.index}`;
        this._babylonScene._blockEntityCollection = this._forAssetContainer;
        const babylonSkeleton = new Skeleton(skin.name || skeletonId, skeletonId, this._babylonScene);
        this._babylonScene._blockEntityCollection = false;

        // See https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#skins (second implementation note)
        babylonSkeleton.overrideMesh = this._rootBabylonMesh;

        this._loadBones(context, skin, babylonSkeleton);
        assignSkeleton(babylonSkeleton);

        const promise = this._loadSkinInverseBindMatricesDataAsync(context, skin).then((inverseBindMatricesData) => {
            this._updateBoneMatrices(babylonSkeleton, inverseBindMatricesData);
        });

        skin._data = {
            babylonSkeleton: babylonSkeleton,
            promise: promise
        };

        return promise;
    }

    private _loadBones(context: string, skin: ISkin, babylonSkeleton: Skeleton): void {
        const babylonBones: { [index: number]: Bone } = {};
        for (const index of skin.joints) {
            const node = ArrayItem.Get(`${context}/joints/${index}`, this._gltf.nodes, index);
            this._loadBone(node, skin, babylonSkeleton, babylonBones);
        }
    }

    private _loadBone(node: INode, skin: ISkin, babylonSkeleton: Skeleton, babylonBones: { [index: number]: Bone }): Bone {
        let babylonBone = babylonBones[node.index];
        if (babylonBone) {
            return babylonBone;
        }

        let babylonParentBone: Nullable<Bone> = null;
        if (node.parent && node.parent._babylonTransformNode !== this._rootBabylonMesh) {
            babylonParentBone = this._loadBone(node.parent, skin, babylonSkeleton, babylonBones);
        }

        const boneIndex = skin.joints.indexOf(node.index);

        babylonBone = new Bone(node.name || `joint${node.index}`, babylonSkeleton, babylonParentBone, this._getNodeMatrix(node), null, null, boneIndex);
        babylonBones[node.index] = babylonBone;

        node._babylonBones = node._babylonBones || [];
        node._babylonBones.push(babylonBone);

        return babylonBone;
    }

    private _loadSkinInverseBindMatricesDataAsync(context: string, skin: ISkin): Promise<Nullable<Float32Array>> {
        if (skin.inverseBindMatrices == undefined) {
            return Promise.resolve(null);
        }

        const accessor = ArrayItem.Get(`${context}/inverseBindMatrices`, this._gltf.accessors, skin.inverseBindMatrices);
        return this._loadFloatAccessorAsync(`/accessors/${accessor.index}`, accessor);
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

    private _getNodeMatrix(node: INode): Matrix {
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
    public loadCameraAsync(context: string, camera: ICamera, assign: (babylonCamera: Camera) => void = () => { }): Promise<Camera> {
        const extensionPromise = this._extensionsLoadCameraAsync(context, camera, assign);
        if (extensionPromise) {
            return extensionPromise;
        }

        const promises = new Array<Promise<any>>();

        this.logOpen(`${context} ${camera.name || ""}`);

        this._babylonScene._blockEntityCollection = this._forAssetContainer;
        const babylonCamera = new FreeCamera(camera.name || `camera${camera.index}`, Vector3.Zero(), this._babylonScene, false);
        this._babylonScene._blockEntityCollection = false;
        babylonCamera.ignoreParentScaling = true;

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

        GLTFLoader.AddPointerMetadata(babylonCamera, context);
        this._parent.onCameraLoadedObservable.notifyObservers(babylonCamera);
        assign(babylonCamera);

        this.logClose();

        return Promise.all(promises).then(() => {
            return babylonCamera;
        });
    }

    private _loadAnimationsAsync(): Promise<void> {
        const animations = this._gltf.animations;
        if (!animations) {
            return Promise.resolve();
        }

        const promises = new Array<Promise<any>>();

        for (let index = 0; index < animations.length; index++) {
            const animation = animations[index];
            promises.push(this.loadAnimationAsync(`/animations/${animation.index}`, animation));
        }

        return Promise.all(promises).then(() => { });
    }

    /**
     * Loads a glTF animation.
     * @param context The context when loading the asset
     * @param animation The glTF animation property
     * @returns A promise that resolves with the loaded Babylon animation group when the load is complete
     */
    public loadAnimationAsync(context: string, animation: IAnimation): Promise<AnimationGroup> {
        const promise = this._extensionsLoadAnimationAsync(context, animation);
        if (promise) {
            return promise;
        }

        this._babylonScene._blockEntityCollection = this._forAssetContainer;
        const babylonAnimationGroup = new AnimationGroup(animation.name || `animation${animation.index}`, this._babylonScene);
        this._babylonScene._blockEntityCollection = false;
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

    /**
     * @hidden Loads a glTF animation channel.
     * @param context The context when loading the asset
     * @param animationContext The context of the animation when loading the asset
     * @param animation The glTF animation property
     * @param channel The glTF animation channel property
     * @param babylonAnimationGroup The babylon animation group property
     * @param animationTargetOverride The babylon animation channel target override property. My be null.
     * @returns A void promise when the channel load is complete
     */
    public _loadAnimationChannelAsync(context: string, animationContext: string, animation: IAnimation, channel: IAnimationChannel, babylonAnimationGroup: AnimationGroup, animationTargetOverride: Nullable<IAnimatable> = null): Promise<void> {
        if (channel.target.node == undefined) {
            return Promise.resolve();
        }

        const targetNode = ArrayItem.Get(`${context}/target/node`, this._gltf.nodes, channel.target.node);

        // Ignore animations that have no animation targets.
        if ((channel.target.path === AnimationChannelTargetPath.WEIGHTS && !targetNode._numMorphTargets) ||
            (channel.target.path !== AnimationChannelTargetPath.WEIGHTS && !targetNode._babylonTransformNode)) {
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

                    this._forEachPrimitive(targetNode, (babylonAbstractMesh: AbstractMesh) => {
                        const babylonMesh = babylonAbstractMesh as Mesh;
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

                if (animationTargetOverride != null && animationTargetOverride.animations != null) {
                    animationTargetOverride.animations.push(babylonAnimation);
                    babylonAnimationGroup.addTargetedAnimation(babylonAnimation, animationTargetOverride);
                } else {
                    targetNode._babylonTransformNode!.animations.push(babylonAnimation);
                    babylonAnimationGroup.addTargetedAnimation(babylonAnimation, targetNode._babylonTransformNode!);
                }
            }
        });
    }

    private _loadAnimationSamplerAsync(context: string, sampler: IAnimationSampler): Promise<_IAnimationSamplerData> {
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

        const inputAccessor = ArrayItem.Get(`${context}/input`, this._gltf.accessors, sampler.input);
        const outputAccessor = ArrayItem.Get(`${context}/output`, this._gltf.accessors, sampler.output);
        sampler._data = Promise.all([
            this._loadFloatAccessorAsync(`/accessors/${inputAccessor.index}`, inputAccessor),
            this._loadFloatAccessorAsync(`/accessors/${outputAccessor.index}`, outputAccessor)
        ]).then(([inputData, outputData]) => {
            return {
                input: inputData,
                interpolation: interpolation,
                output: outputData,
            };
        });

        return sampler._data;
    }

    private _loadBufferAsync(context: string, buffer: IBuffer, byteOffset: number, byteLength: number): Promise<ArrayBufferView> {
        const extensionPromise = this._extensionsLoadBufferAsync(context, buffer, byteOffset, byteLength);
        if (extensionPromise) {
            return extensionPromise;
        }

        if (!buffer._data) {
            if (buffer.uri) {
                buffer._data = this.loadUriAsync(`${context}/uri`, buffer, buffer.uri);
            }
            else {
                if (!this._bin) {
                    throw new Error(`${context}: Uri is missing or the binary glTF is missing its binary chunk`);
                }

                buffer._data = this._bin.readAsync(0, buffer.byteLength);
            }
        }

        return buffer._data.then((data) => {
            try {
                return new Uint8Array(data.buffer, data.byteOffset + byteOffset, byteLength);
            }
            catch (e) {
                throw new Error(`${context}: ${e.message}`);
            }
        });
    }

    /**
     * Loads a glTF buffer view.
     * @param context The context when loading the asset
     * @param bufferView The glTF buffer view property
     * @returns A promise that resolves with the loaded data when the load is complete
     */
    public loadBufferViewAsync(context: string, bufferView: IBufferView): Promise<ArrayBufferView> {
        const extensionPromise = this._extensionsLoadBufferViewAsync(context, bufferView);
        if (extensionPromise) {
            return extensionPromise;
        }

        if (bufferView._data) {
            return bufferView._data;
        }

        const buffer = ArrayItem.Get(`${context}/buffer`, this._gltf.buffers, bufferView.buffer);
        bufferView._data = this._loadBufferAsync(`/buffers/${buffer.index}`, buffer, (bufferView.byteOffset || 0), bufferView.byteLength);

        return bufferView._data;
    }

    private _loadAccessorAsync(context: string, accessor: IAccessor, constructor: TypedArrayConstructor): Promise<ArrayBufferView> {
        if (accessor._data) {
            return accessor._data;
        }

        const numComponents = GLTFLoader._GetNumComponents(context, accessor.type);
        const byteStride = numComponents * VertexBuffer.GetTypeByteLength(accessor.componentType);
        const length = numComponents * accessor.count;

        if (accessor.bufferView == undefined) {
            accessor._data = Promise.resolve(new constructor(length));
        }
        else {
            const bufferView = ArrayItem.Get(`${context}/bufferView`, this._gltf.bufferViews, accessor.bufferView);
            accessor._data = this.loadBufferViewAsync(`/bufferViews/${bufferView.index}`, bufferView).then((data) => {
                if (accessor.componentType === AccessorComponentType.FLOAT && !accessor.normalized) {
                    return GLTFLoader._GetTypedArray(context, accessor.componentType, data, accessor.byteOffset, length);
                }
                else {
                    const typedArray = new constructor(length);
                    VertexBuffer.ForEach(data, accessor.byteOffset || 0, bufferView.byteStride || byteStride, numComponents, accessor.componentType, typedArray.length, accessor.normalized || false, (value, index) => {
                        typedArray[index] = value;
                    });
                    return typedArray;
                }
            });
        }

        if (accessor.sparse) {
            const sparse = accessor.sparse;
            accessor._data = accessor._data.then((data) => {
                const typedArray = data as TypedArrayLike;
                const indicesBufferView = ArrayItem.Get(`${context}/sparse/indices/bufferView`, this._gltf.bufferViews, sparse.indices.bufferView);
                const valuesBufferView = ArrayItem.Get(`${context}/sparse/values/bufferView`, this._gltf.bufferViews, sparse.values.bufferView);
                return Promise.all([
                    this.loadBufferViewAsync(`/bufferViews/${indicesBufferView.index}`, indicesBufferView),
                    this.loadBufferViewAsync(`/bufferViews/${valuesBufferView.index}`, valuesBufferView)
                ]).then(([indicesData, valuesData]) => {
                    const indices = GLTFLoader._GetTypedArray(`${context}/sparse/indices`, sparse.indices.componentType, indicesData, sparse.indices.byteOffset, sparse.count) as IndicesArray;

                    const sparseLength = numComponents * sparse.count;
                    let values: TypedArrayLike;

                    if (accessor.componentType === AccessorComponentType.FLOAT && !accessor.normalized) {
                        values = GLTFLoader._GetTypedArray(`${context}/sparse/values`, accessor.componentType, valuesData, sparse.values.byteOffset, sparseLength);
                    }
                    else {
                        const sparseData = GLTFLoader._GetTypedArray(`${context}/sparse/values`, accessor.componentType, valuesData, sparse.values.byteOffset, sparseLength);
                        values = new constructor(sparseLength);
                        VertexBuffer.ForEach(sparseData, 0, byteStride, numComponents, accessor.componentType, values.length, accessor.normalized || false, (value, index) => {
                            values[index] = value;
                        });
                    }

                    let valuesIndex = 0;
                    for (let indicesIndex = 0; indicesIndex < indices.length; indicesIndex++) {
                        let dataIndex = indices[indicesIndex] * numComponents;
                        for (let componentIndex = 0; componentIndex < numComponents; componentIndex++) {
                            typedArray[dataIndex++] = values[valuesIndex++];
                        }
                    }

                    return typedArray;
                });
            });
        }

        return accessor._data;
    }

    /** @hidden */
    public _loadFloatAccessorAsync(context: string, accessor: IAccessor): Promise<Float32Array> {
        return this._loadAccessorAsync(context, accessor, Float32Array) as Promise<Float32Array>;
    }

    private _loadIndicesAccessorAsync(context: string, accessor: IAccessor): Promise<IndicesArray> {
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

        if (accessor.sparse) {
            const constructor = GLTFLoader._GetTypedArrayConstructor(`${context}/componentType`, accessor.componentType);
            accessor._data = this._loadAccessorAsync(context, accessor, constructor);
        }
        else {
            const bufferView = ArrayItem.Get(`${context}/bufferView`, this._gltf.bufferViews, accessor.bufferView);
            accessor._data = this.loadBufferViewAsync(`/bufferViews/${bufferView.index}`, bufferView).then((data) => {
                return GLTFLoader._GetTypedArray(context, accessor.componentType, data, accessor.byteOffset, accessor.count);
            });
        }

        return accessor._data as Promise<IndicesArray>;
    }

    private _loadVertexBufferViewAsync(bufferView: IBufferView, kind: string): Promise<Buffer> {
        if (bufferView._babylonBuffer) {
            return bufferView._babylonBuffer;
        }

        bufferView._babylonBuffer = this.loadBufferViewAsync(`/bufferViews/${bufferView.index}`, bufferView).then((data) => {
            return new Buffer(this._babylonScene.getEngine(), data, false);
        });

        return bufferView._babylonBuffer;
    }

    private _loadVertexAccessorAsync(context: string, accessor: IAccessor, kind: string): Promise<VertexBuffer> {
        if (accessor._babylonVertexBuffer) {
            return accessor._babylonVertexBuffer;
        }

        if (accessor.sparse) {
            accessor._babylonVertexBuffer = this._loadFloatAccessorAsync(`/accessors/${accessor.index}`, accessor).then((data) => {
                return new VertexBuffer(this._babylonScene.getEngine(), data, kind, false);
            });
        }
        // HACK: If byte offset is not a multiple of component type byte length then load as a float array instead of using Babylon buffers.
        else if (accessor.byteOffset && accessor.byteOffset % VertexBuffer.GetTypeByteLength(accessor.componentType) !== 0) {
            Logger.Warn("Accessor byte offset is not a multiple of component type byte length");
            accessor._babylonVertexBuffer = this._loadFloatAccessorAsync(`/accessors/${accessor.index}`, accessor).then((data) => {
                return new VertexBuffer(this._babylonScene.getEngine(), data, kind, false);
            });
        }
        // Load joint indices as a float array since the shaders expect float data but glTF uses unsigned byte/short.
        // This prevents certain platforms (e.g. D3D) from having to convert the data to float on the fly.
        else if (kind === VertexBuffer.MatricesIndicesKind || kind === VertexBuffer.MatricesIndicesExtraKind) {
            accessor._babylonVertexBuffer = this._loadFloatAccessorAsync(`/accessors/${accessor.index}`, accessor).then((data) => {
                return new VertexBuffer(this._babylonScene.getEngine(), data, kind, false);
            });
        }
        else {
            const bufferView = ArrayItem.Get(`${context}/bufferView`, this._gltf.bufferViews, accessor.bufferView);
            accessor._babylonVertexBuffer = this._loadVertexBufferViewAsync(bufferView, kind).then((babylonBuffer) => {
                const size = GLTFLoader._GetNumComponents(context, accessor.type);
                return new VertexBuffer(this._babylonScene.getEngine(), babylonBuffer, kind, false, false, bufferView.byteStride,
                    false, accessor.byteOffset, size, accessor.componentType, accessor.normalized, true);
            });
        }

        return accessor._babylonVertexBuffer;
    }

    private _loadMaterialMetallicRoughnessPropertiesAsync(context: string, properties: IMaterialPbrMetallicRoughness, babylonMaterial: Material): Promise<void> {
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
                    texture.name = `${babylonMaterial.name} (Base Color)`;
                    babylonMaterial.albedoTexture = texture;
                }));
            }

            if (properties.metallicRoughnessTexture) {
                promises.push(this.loadTextureInfoAsync(`${context}/metallicRoughnessTexture`, properties.metallicRoughnessTexture, (texture) => {
                    texture.name = `${babylonMaterial.name} (Metallic Roughness)`;
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
    public _loadMaterialAsync(context: string, material: IMaterial, babylonMesh: Mesh, babylonDrawMode: number, assign: (babylonMaterial: Material) => void = () => { }): Promise<Material> {
        const extensionPromise = this._extensionsLoadMaterialAsync(context, material, babylonMesh, babylonDrawMode, assign);
        if (extensionPromise) {
            return extensionPromise;
        }

        material._data = material._data || {};
        let babylonData = material._data[babylonDrawMode];
        if (!babylonData) {
            this.logOpen(`${context} ${material.name || ""}`);

            const babylonMaterial = this.createMaterial(context, material, babylonDrawMode);

            babylonData = {
                babylonMaterial: babylonMaterial,
                babylonMeshes: [],
                promise: this.loadMaterialPropertiesAsync(context, material, babylonMaterial)
            };

            material._data[babylonDrawMode] = babylonData;

            GLTFLoader.AddPointerMetadata(babylonMaterial, context);
            this._parent.onMaterialLoadedObservable.notifyObservers(babylonMaterial);

            this.logClose();
        }

        babylonData.babylonMeshes.push(babylonMesh);

        babylonMesh.onDisposeObservable.addOnce(() => {
            const index = babylonData.babylonMeshes.indexOf(babylonMesh);
            if (index !== -1) {
                babylonData.babylonMeshes.splice(index, 1);
            }
        });

        assign(babylonData.babylonMaterial);

        return babylonData.promise.then(() => {
            return babylonData.babylonMaterial;
        });
    }

    private _createDefaultMaterial(name: string, babylonDrawMode: number): Material {
        this._babylonScene._blockEntityCollection = this._forAssetContainer;
        const babylonMaterial = new PBRMaterial(name, this._babylonScene);
        this._babylonScene._blockEntityCollection = false;
        // Moved to mesh so user can change materials on gltf meshes: babylonMaterial.sideOrientation = this._babylonScene.useRightHandedSystem ? Material.CounterClockWiseSideOrientation : Material.ClockWiseSideOrientation;
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
    public createMaterial(context: string, material: IMaterial, babylonDrawMode: number): Material {
        const extensionPromise = this._extensionsCreateMaterial(context, material, babylonDrawMode);
        if (extensionPromise) {
            return extensionPromise;
        }

        const name = material.name || `material${material.index}`;
        const babylonMaterial = this._createDefaultMaterial(name, babylonDrawMode);

        return babylonMaterial;
    }

    /**
     * Loads properties from a glTF material into a Babylon material.
     * @param context The context when loading the asset
     * @param material The glTF material property
     * @param babylonMaterial The Babylon material
     * @returns A promise that resolves when the load is complete
     */
    public loadMaterialPropertiesAsync(context: string, material: IMaterial, babylonMaterial: Material): Promise<void> {
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
    public loadMaterialBasePropertiesAsync(context: string, material: IMaterial, babylonMaterial: Material): Promise<void> {
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
                texture.name = `${babylonMaterial.name} (Normal)`;
                babylonMaterial.bumpTexture = texture;
            }));

            babylonMaterial.invertNormalMapX = !this._babylonScene.useRightHandedSystem;
            babylonMaterial.invertNormalMapY = this._babylonScene.useRightHandedSystem;
            if (material.normalTexture.scale != undefined) {
                babylonMaterial.bumpTexture.level = material.normalTexture.scale;
            }

            babylonMaterial.forceIrradianceInFragment = true;
        }

        if (material.occlusionTexture) {
            promises.push(this.loadTextureInfoAsync(`${context}/occlusionTexture`, material.occlusionTexture, (texture) => {
                texture.name = `${babylonMaterial.name} (Occlusion)`;
                babylonMaterial.ambientTexture = texture;
            }));

            babylonMaterial.useAmbientInGrayScale = true;
            if (material.occlusionTexture.strength != undefined) {
                babylonMaterial.ambientTextureStrength = material.occlusionTexture.strength;
            }
        }

        if (material.emissiveTexture) {
            promises.push(this.loadTextureInfoAsync(`${context}/emissiveTexture`, material.emissiveTexture, (texture) => {
                texture.name = `${babylonMaterial.name} (Emissive)`;
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
    public loadMaterialAlphaProperties(context: string, material: IMaterial, babylonMaterial: Material): void {
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
    public loadTextureInfoAsync(context: string, textureInfo: ITextureInfo, assign: (babylonTexture: BaseTexture) => void = () => { }): Promise<BaseTexture> {
        const extensionPromise = this._extensionsLoadTextureInfoAsync(context, textureInfo, assign);
        if (extensionPromise) {
            return extensionPromise;
        }

        this.logOpen(`${context}`);

        if (textureInfo.texCoord! >= 2) {
            throw new Error(`${context}/texCoord: Invalid value (${textureInfo.texCoord})`);
        }

        const texture = ArrayItem.Get(`${context}/index`, this._gltf.textures, textureInfo.index);
        const promise = this._loadTextureAsync(`/textures/${textureInfo.index}`, texture, (babylonTexture) => {
            babylonTexture.coordinatesIndex = textureInfo.texCoord || 0;
            GLTFLoader.AddPointerMetadata(babylonTexture, context);
            this._parent.onTextureLoadedObservable.notifyObservers(babylonTexture);
            assign(babylonTexture);
        });

        this.logClose();

        return promise;
    }

    /** @hidden */
    public _loadTextureAsync(context: string, texture: ITexture, assign: (babylonTexture: BaseTexture) => void = () => { }): Promise<BaseTexture> {
        const extensionPromise = this._extensionsLoadTextureAsync(context, texture, assign);
        if (extensionPromise) {
            return extensionPromise;
        }

        this.logOpen(`${context} ${texture.name || ""}`);

        const sampler = (texture.sampler == undefined ? GLTFLoader.DefaultSampler : ArrayItem.Get(`${context}/sampler`, this._gltf.samplers, texture.sampler));
        const image = ArrayItem.Get(`${context}/source`, this._gltf.images, texture.source);
        const promise = this._createTextureAsync(context, sampler, image, assign);

        this.logClose();

        return promise;
    }

    /** @hidden */
    public _createTextureAsync(context: string, sampler: ISampler, image: IImage, assign: (babylonTexture: BaseTexture) => void = () => { }): Promise<BaseTexture> {
        const samplerData = this._loadSampler(`/samplers/${sampler.index}`, sampler);

        const promises = new Array<Promise<any>>();

        const deferred = new Deferred<void>();
        this._babylonScene._blockEntityCollection = this._forAssetContainer;
        const babylonTexture = new Texture(null, this._babylonScene, samplerData.noMipMaps, false, samplerData.samplingMode, () => {
            if (!this._disposed) {
                deferred.resolve();
            }
        }, (message, exception) => {
            if (!this._disposed) {
                deferred.reject(new Error(`${context}: ${(exception && exception.message) ? exception.message : message || "Failed to load texture"}`));
            }
        }, undefined, undefined, undefined, image.mimeType);
        this._babylonScene._blockEntityCollection = false;
        promises.push(deferred.promise);

        promises.push(this.loadImageAsync(`/images/${image.index}`, image).then((data) => {
            const name = image.uri || `${this._fileName}#image${image.index}`;
            const dataUrl = `data:${this._uniqueRootUrl}${name}`;
            babylonTexture.updateURL(dataUrl, data);
        }));

        babylonTexture.wrapU = samplerData.wrapU;
        babylonTexture.wrapV = samplerData.wrapV;
        assign(babylonTexture);

        return Promise.all(promises).then(() => {
            return babylonTexture;
        });
    }

    private _loadSampler(context: string, sampler: ISampler): _ISamplerData {
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
    public loadImageAsync(context: string, image: IImage): Promise<ArrayBufferView> {
        if (!image._data) {
            this.logOpen(`${context} ${image.name || ""}`);

            if (image.uri) {
                image._data = this.loadUriAsync(`${context}/uri`, image, image.uri);
            }
            else {
                const bufferView = ArrayItem.Get(`${context}/bufferView`, this._gltf.bufferViews, image.bufferView);
                image._data = this.loadBufferViewAsync(`/bufferViews/${bufferView.index}`, bufferView);
            }

            this.logClose();
        }

        return image._data;
    }

    /**
     * Loads a glTF uri.
     * @param context The context when loading the asset
     * @param property The glTF property associated with the uri
     * @param uri The base64 or relative uri
     * @returns A promise that resolves with the loaded data when the load is complete
     */
    public loadUriAsync(context: string, property: IProperty, uri: string): Promise<ArrayBufferView> {
        const extensionPromise = this._extensionsLoadUriAsync(context, property, uri);
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
            return new Promise((resolve, reject) => {
                this._parent._loadFile(url, this._babylonScene, (data) => {
                    if (!this._disposed) {
                        this.log(`Loaded ${uri} (${(data as ArrayBuffer).byteLength} bytes)`);
                        resolve(new Uint8Array(data as ArrayBuffer));
                    }
                }, true, (request) => {
                    reject(new LoadFileError(`${context}: Failed to load '${uri}'${request ? ": " + request.status + " " + request.statusText : ""}`, request));
                });
            });
        });
    }

    /**
     * Adds a JSON pointer to the metadata of the Babylon object at `<object>.metadata.gltf.pointers`.
     * @param babylonObject the Babylon object with metadata
     * @param pointer the JSON pointer
     */
    public static AddPointerMetadata(babylonObject: { metadata: any }, pointer: string): void {
        const metadata = (babylonObject.metadata = babylonObject.metadata || {});
        const gltf = (metadata.gltf = metadata.gltf || {});
        const pointers = (gltf.pointers = gltf.pointers || []);
        pointers.push(pointer);
    }

    private static _GetTextureWrapMode(context: string, mode: TextureWrapMode | undefined): number {
        // Set defaults if undefined
        mode = mode == undefined ? TextureWrapMode.REPEAT : mode;

        switch (mode) {
            case TextureWrapMode.CLAMP_TO_EDGE: return Texture.CLAMP_ADDRESSMODE;
            case TextureWrapMode.MIRRORED_REPEAT: return Texture.MIRROR_ADDRESSMODE;
            case TextureWrapMode.REPEAT: return Texture.WRAP_ADDRESSMODE;
            default:
                Logger.Warn(`${context}: Invalid value (${mode})`);
                return Texture.WRAP_ADDRESSMODE;
        }
    }

    private static _GetTextureSamplingMode(context: string, sampler: ISampler): number {
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
                    Logger.Warn(`${context}/minFilter: Invalid value (${minFilter})`);
                    return Texture.LINEAR_LINEAR_MIPLINEAR;
            }
        }
        else {
            if (magFilter !== TextureMagFilter.NEAREST) {
                Logger.Warn(`${context}/magFilter: Invalid value (${magFilter})`);
            }

            switch (minFilter) {
                case TextureMinFilter.NEAREST: return Texture.NEAREST_NEAREST;
                case TextureMinFilter.LINEAR: return Texture.NEAREST_LINEAR;
                case TextureMinFilter.NEAREST_MIPMAP_NEAREST: return Texture.NEAREST_NEAREST_MIPNEAREST;
                case TextureMinFilter.LINEAR_MIPMAP_NEAREST: return Texture.NEAREST_LINEAR_MIPNEAREST;
                case TextureMinFilter.NEAREST_MIPMAP_LINEAR: return Texture.NEAREST_NEAREST_MIPLINEAR;
                case TextureMinFilter.LINEAR_MIPMAP_LINEAR: return Texture.NEAREST_LINEAR_MIPLINEAR;
                default:
                    Logger.Warn(`${context}/minFilter: Invalid value (${minFilter})`);
                    return Texture.NEAREST_NEAREST_MIPNEAREST;
            }
        }
    }

    private static _GetTypedArrayConstructor(context: string, componentType: AccessorComponentType): TypedArrayConstructor {
        switch (componentType) {
            case AccessorComponentType.BYTE: return Int8Array;
            case AccessorComponentType.UNSIGNED_BYTE: return Uint8Array;
            case AccessorComponentType.SHORT: return Int16Array;
            case AccessorComponentType.UNSIGNED_SHORT: return Uint16Array;
            case AccessorComponentType.UNSIGNED_INT: return Uint32Array;
            case AccessorComponentType.FLOAT: return Float32Array;
            default: throw new Error(`${context}: Invalid component type ${componentType}`);
        }
}

    private static _GetTypedArray(context: string, componentType: AccessorComponentType, bufferView: ArrayBufferView, byteOffset: number | undefined, length: number): TypedArrayLike {
        const buffer = bufferView.buffer;
        byteOffset = bufferView.byteOffset + (byteOffset || 0);

        const constructor = GLTFLoader._GetTypedArrayConstructor(`${context}/componentType`, componentType);

        try {
            return new constructor(buffer, byteOffset, length);
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

        if (this._gltf.materials) {
            for (const material of this._gltf.materials) {
                if (material._data) {
                    for (const babylonDrawMode in material._data) {
                        const babylonData = material._data[babylonDrawMode];
                        for (const babylonMesh of babylonData.babylonMeshes) {
                            // Ensure nonUniformScaling is set if necessary.
                            babylonMesh.computeWorldMatrix(true);

                            const babylonMaterial = babylonData.babylonMaterial;
                            promises.push(babylonMaterial.forceCompilationAsync(babylonMesh));
                            promises.push(babylonMaterial.forceCompilationAsync(babylonMesh, { useInstances: true }));
                            if (this._parent.useClipPlane) {
                                promises.push(babylonMaterial.forceCompilationAsync(babylonMesh, { clipPlane: true }));
                                promises.push(babylonMaterial.forceCompilationAsync(babylonMesh, { clipPlane: true, useInstances: true }));
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

        const lights = this._babylonScene.lights;
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
        for (const extension of this._extensions) {
            if (extension.enabled) {
                action(extension);
            }
        }
    }

    private _applyExtensions<T>(property: IProperty, functionName: string, actionAsync: (extension: IGLTFLoaderExtension) => Nullable<T> | undefined): Nullable<T> {
        for (const extension of this._extensions) {
            if (extension.enabled) {
                const id = `${extension.name}.${functionName}`;
                const loaderProperty = property as ILoaderProperty;
                loaderProperty._activeLoaderExtensionFunctions = loaderProperty._activeLoaderExtensionFunctions || {};
                const activeLoaderExtensionFunctions = loaderProperty._activeLoaderExtensionFunctions;
                if (!activeLoaderExtensionFunctions[id]) {
                    activeLoaderExtensionFunctions[id] = true;

                    try {
                        const result = actionAsync(extension);
                        if (result) {
                            return result;
                        }
                    }
                    finally {
                        delete activeLoaderExtensionFunctions[id];
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

    private _extensionsLoadSceneAsync(context: string, scene: IScene): Nullable<Promise<void>> {
        return this._applyExtensions(scene, "loadScene", (extension) => extension.loadSceneAsync && extension.loadSceneAsync(context, scene));
    }

    private _extensionsLoadNodeAsync(context: string, node: INode, assign: (babylonTransformNode: TransformNode) => void): Nullable<Promise<TransformNode>> {
        return this._applyExtensions(node, "loadNode", (extension) => extension.loadNodeAsync && extension.loadNodeAsync(context, node, assign));
    }

    private _extensionsLoadCameraAsync(context: string, camera: ICamera, assign: (babylonCamera: Camera) => void): Nullable<Promise<Camera>> {
        return this._applyExtensions(camera, "loadCamera", (extension) => extension.loadCameraAsync && extension.loadCameraAsync(context, camera, assign));
    }

    private _extensionsLoadVertexDataAsync(context: string, primitive: IMeshPrimitive, babylonMesh: Mesh): Nullable<Promise<Geometry>> {
        return this._applyExtensions(primitive, "loadVertexData", (extension) => extension._loadVertexDataAsync && extension._loadVertexDataAsync(context, primitive, babylonMesh));
    }

    private _extensionsLoadMeshPrimitiveAsync(context: string, name: string, node: INode, mesh: IMesh, primitive: IMeshPrimitive, assign: (babylonMesh: AbstractMesh) => void): Nullable<Promise<AbstractMesh>> {
        return this._applyExtensions(primitive, "loadMeshPrimitive", (extension) => extension._loadMeshPrimitiveAsync && extension._loadMeshPrimitiveAsync(context, name, node, mesh, primitive, assign));
    }

    private _extensionsLoadMaterialAsync(context: string, material: IMaterial, babylonMesh: Mesh, babylonDrawMode: number, assign: (babylonMaterial: Material) => void): Nullable<Promise<Material>> {
        return this._applyExtensions(material, "loadMaterial", (extension) => extension._loadMaterialAsync && extension._loadMaterialAsync(context, material, babylonMesh, babylonDrawMode, assign));
    }

    private _extensionsCreateMaterial(context: string, material: IMaterial, babylonDrawMode: number): Nullable<Material> {
        return this._applyExtensions(material, "createMaterial", (extension) => extension.createMaterial && extension.createMaterial(context, material, babylonDrawMode));
    }

    private _extensionsLoadMaterialPropertiesAsync(context: string, material: IMaterial, babylonMaterial: Material): Nullable<Promise<void>> {
        return this._applyExtensions(material, "loadMaterialProperties", (extension) => extension.loadMaterialPropertiesAsync && extension.loadMaterialPropertiesAsync(context, material, babylonMaterial));
    }

    private _extensionsLoadTextureInfoAsync(context: string, textureInfo: ITextureInfo, assign: (babylonTexture: BaseTexture) => void): Nullable<Promise<BaseTexture>> {
        return this._applyExtensions(textureInfo, "loadTextureInfo", (extension) => extension.loadTextureInfoAsync && extension.loadTextureInfoAsync(context, textureInfo, assign));
    }

    private _extensionsLoadTextureAsync(context: string, texture: ITexture, assign: (babylonTexture: BaseTexture) => void): Nullable<Promise<BaseTexture>> {
        return this._applyExtensions(texture, "loadTexture", (extension) => extension._loadTextureAsync && extension._loadTextureAsync(context, texture, assign));
    }

    private _extensionsLoadAnimationAsync(context: string, animation: IAnimation): Nullable<Promise<AnimationGroup>> {
        return this._applyExtensions(animation, "loadAnimation", (extension) => extension.loadAnimationAsync && extension.loadAnimationAsync(context, animation));
    }

    private _extensionsLoadSkinAsync(context: string, node: INode, skin: ISkin): Nullable<Promise<void>> {
        return this._applyExtensions(skin, "loadSkin", (extension) => extension._loadSkinAsync && extension._loadSkinAsync(context, node, skin));
    }

    private _extensionsLoadUriAsync(context: string, property: IProperty, uri: string): Nullable<Promise<ArrayBufferView>> {
        return this._applyExtensions(property, "loadUri", (extension) => extension._loadUriAsync && extension._loadUriAsync(context, property, uri));
    }

    private _extensionsLoadBufferViewAsync(context: string, bufferView: IBufferView): Nullable<Promise<ArrayBufferView>> {
        return this._applyExtensions(bufferView, "loadBufferView", (extension) => extension.loadBufferViewAsync && extension.loadBufferViewAsync(context, bufferView));
    }

    private _extensionsLoadBufferAsync(context: string, buffer: IBuffer, byteOffset: number, byteLength: number): Nullable<Promise<ArrayBufferView>> {
        return this._applyExtensions(buffer, "loadBuffer", (extension) => extension.loadBufferAsync && extension.loadBufferAsync(context, buffer, byteOffset, byteLength));
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
     * Checks for presence of an extension.
     * @param name The name of the extension to check
     * @returns A boolean indicating the presence of the given extension name in `extensionsUsed`
     */
    public isExtensionUsed(name: string): boolean {
        return !!this._gltf.extensionsUsed && this._gltf.extensionsUsed.indexOf(name) !== -1;
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

GLTFFileLoader._CreateGLTF2Loader = (parent) => new GLTFLoader(parent);
