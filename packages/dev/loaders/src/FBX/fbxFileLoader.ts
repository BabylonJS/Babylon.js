/* eslint-disable @typescript-eslint/naming-convention, jsdoc/require-param, jsdoc/require-returns */
import {
    type ISceneLoaderPluginAsync,
    type ISceneLoaderPluginFactory,
    type ISceneLoaderAsyncResult,
    type ISceneLoaderProgressEvent,
    type SceneLoaderPluginOptions,
    RegisterSceneLoaderPlugin,
} from "core/Loading/sceneLoader";
import { type Scene } from "core/scene";
import { type FloatArray, type Nullable } from "core/types";
import { Mesh } from "core/Meshes/mesh";
import { SubMesh } from "core/Meshes/subMesh";
import { VertexData } from "core/Meshes/mesh.vertexData";
import { StandardMaterial } from "core/Materials/standardMaterial";
import { Material } from "core/Materials/material";
import { MultiMaterial } from "core/Materials/multiMaterial";
import { type ITextureCreationOptions, Texture } from "core/Materials/Textures/texture";
import { type BaseTexture } from "core/Materials/Textures/baseTexture";
import { Color3 } from "core/Maths/math.color";
import { Vector3, Quaternion, Matrix } from "core/Maths/math.vector";
import { TransformNode } from "core/Meshes/transformNode";
import { Skeleton } from "core/Bones/skeleton";
import { Bone } from "core/Bones/bone";
import { Animation } from "core/Animations/animation";
import { AnimationGroup } from "core/Animations/animationGroup";
import { AnimationKeyInterpolation, type IAnimationKey } from "core/Animations/animationKey";
import { MorphTarget } from "core/Morph/morphTarget";
import { MorphTargetManager } from "core/Morph/morphTargetManager";
import { Camera } from "core/Cameras/camera";
import { FreeCamera } from "core/Cameras/freeCamera";
import { PointLight } from "core/Lights/pointLight";
import { DirectionalLight } from "core/Lights/directionalLight";
import { SpotLight } from "core/Lights/spotLight";
import { AssetContainer } from "core/assetContainer";
import { GetMimeType } from "core/Misc/fileTools";

import { parseBinaryFBX } from "./parsers/fbxBinaryParser";
import { parseAsciiFBX } from "./parsers/fbxAsciiParser";
import { interpretFBX, type FBXModelData, type FBXSceneData, type FBXCameraData, type FBXLightData } from "./interpreter/fbxInterpreter";
import { type FBXDocument } from "./types/fbxTypes";
import { type FBXGeometryData } from "./interpreter/geometry";
import { type FBXMaterialData, type FBXTextureRef } from "./interpreter/materials";
import { type FBXSkinData, type FBXBoneData } from "./interpreter/skeleton";
import { type FBXRigData, type FBXSkinBindingData } from "./interpreter/rig";
import { type FBXBlendShapeData, type FBXShapeData } from "./interpreter/blendShapes";
import { sampleFBXCurveAtTime, type FBXAnimationStackData, type FBXCurveData, type FBXCurveNodeData } from "./interpreter/animation";
import { computeFBXGeometricDeltaMatrix, computeFBXGeometricMatrix, computeFBXGeometricNormalMatrix, computeFBXLocalMatrix } from "./interpreter/transform";
import { FBXFileLoaderMetadata } from "./fbxFileLoader.metadata";

const FBX_ASCII_MAGIC = "; FBX";
const FBX_BINARY_MAGIC = "Kaydara FBX Binary";
const BIND_REST_SCALE_RATIO_THRESHOLD = 10;

/**
 * Source convention for tangent-space normal maps loaded from FBX normal-map slots.
 */
export type FBXNormalMapCoordinateSystem = "y-up" | "y-down";

/**
 * Defines options for the FBX loader.
 */
export interface FBXFileLoaderOptions {
    /**
     * Source convention for tangent-space normal maps connected through FBX normal-map slots.
     * FBX does not standardize this convention, so the loader defaults to the glTF/USD-style Y-up convention.
     * Set to "y-down" for assets authored with inverted green/Y normal maps.
     */
    normalMapCoordinateSystem?: FBXNormalMapCoordinateSystem;
}

declare module "core/Loading/sceneLoader" {
    // eslint-disable-next-line jsdoc/require-jsdoc, @typescript-eslint/naming-convention
    export interface SceneLoaderPluginOptions {
        /**
         * Defines options for the FBX loader.
         */
        [FBXFileLoaderMetadata.name]: FBXFileLoaderOptions;
    }
}

interface IFBXSceneLoaderAsyncResult extends ISceneLoaderAsyncResult {
    materials: Material[];
    textures: BaseTexture[];
    cameras: Camera[];
}

/**
 * FBX file loader plugin for Babylon.js.
 * Pure TypeScript implementation — no Autodesk FBX SDK dependency.
 */
export class FBXFileLoader implements ISceneLoaderPluginAsync, ISceneLoaderPluginFactory {
    /**
     * Defines the name of the plugin.
     */
    public readonly name = FBXFileLoaderMetadata.name;

    /**
     * Defines the extension the plugin is able to load.
     */
    public readonly extensions = FBXFileLoaderMetadata.extensions;

    private readonly _options: Required<FBXFileLoaderOptions>;
    private readonly _bindRestBones = new WeakSet<Bone>();
    private readonly _sourceBonesBySkeleton = new WeakMap<Skeleton, Bone[]>();
    private readonly _scaleCompensationHelpersBySkeleton = new WeakMap<Skeleton, Map<number, Bone>>();

    /**
     * Creates a new FBX loader.
     * @param options - Options controlling FBX loading behavior
     */
    public constructor(options: FBXFileLoaderOptions = {}) {
        this._options = {
            normalMapCoordinateSystem: options.normalMapCoordinateSystem ?? "y-up",
        };
    }

    /**
     * Creates an FBX loader plugin instance with options from SceneLoader.
     * @param options - Scene loader plugin options
     * @returns The configured FBX loader
     */
    public createPlugin(options: SceneLoaderPluginOptions): ISceneLoaderPluginAsync {
        return new FBXFileLoader(options[FBXFileLoaderMetadata.name]);
    }

    /**
     * Imports meshes from an FBX file and adds them to the scene.
     * @param meshesNames - A string or array of mesh names to import, or null/undefined to import all meshes
     * @param scene - The scene to add imported meshes to
     * @param data - The FBX data to load
     * @param rootUrl - Root URL used to resolve external resources
     * @param _onProgress - Callback called while the file is loading
     * @param _fileName - Name of the file being loaded
     * @returns A promise containing the loaded meshes, particle systems, skeletons, animation groups, transform nodes, geometries, and lights
     */
    public async importMeshAsync(
        meshesNames: string | readonly string[] | null | undefined,
        scene: Scene,
        data: unknown,
        rootUrl: string,
        _onProgress?: (event: ISceneLoaderProgressEvent) => void,
        _fileName?: string
    ): Promise<ISceneLoaderAsyncResult> {
        const doc = this._parse(data);
        const fbxScene = interpretFBX(doc);
        return this._buildScene(fbxScene, scene, rootUrl, meshesNames);
    }

    /**
     * Loads all FBX content into the scene.
     * @param scene - The scene to load the FBX content into
     * @param data - The FBX data to load
     * @param rootUrl - Root URL used to resolve external resources
     * @param _onProgress - Callback called while the file is loading
     * @param _fileName - Name of the file being loaded
     * @returns A promise that resolves when loading is complete
     */
    public async loadAsync(scene: Scene, data: unknown, rootUrl: string, _onProgress?: (event: ISceneLoaderProgressEvent) => void, _fileName?: string): Promise<void> {
        const doc = this._parse(data);
        const fbxScene = interpretFBX(doc);
        this._buildScene(fbxScene, scene, rootUrl, null);
    }

    /**
     * Loads all FBX content into an asset container.
     * @param scene - The scene used to create the asset container
     * @param data - The FBX data to load
     * @param rootUrl - Root URL used to resolve external resources
     * @param _onProgress - Callback called while the file is loading
     * @param _fileName - Name of the file being loaded
     * @returns A promise containing the loaded asset container
     */
    public async loadAssetContainerAsync(
        scene: Scene,
        data: unknown,
        rootUrl: string,
        _onProgress?: (event: ISceneLoaderProgressEvent) => void,
        _fileName?: string
    ): Promise<AssetContainer> {
        const doc = this._parse(data);
        const fbxScene = interpretFBX(doc);

        const container = new AssetContainer(scene);

        // Build the scene into a temporary holder, then move results to container
        const result = this._buildScene(fbxScene, scene, rootUrl, null);

        for (const mesh of result.meshes) {
            container.meshes.push(mesh);
        }
        for (const skeleton of result.skeletons) {
            container.skeletons.push(skeleton);
        }
        for (const ag of result.animationGroups) {
            container.animationGroups.push(ag);
        }
        for (const tn of result.transformNodes) {
            container.transformNodes.push(tn);
        }
        for (const light of result.lights) {
            container.lights.push(light);
        }
        for (const camera of result.cameras) {
            container.cameras.push(camera);
        }
        for (const material of result.materials) {
            this._addMaterialToContainer(material, container);
        }
        for (const texture of result.textures) {
            this._addTextureToContainer(texture, container);
        }
        for (const mesh of result.meshes) {
            this._addMaterialToContainer(mesh.material, container);
        }

        // Remove all added objects from the scene (container owns them)
        this._setAssetContainer(container);
        container.removeAllFromScene();

        return container;
    }

    // ── Parsing ────────────────────────────────────────────────────────────

    private _parse(data: unknown): FBXDocument {
        if (data instanceof ArrayBuffer) {
            return this._parseFromArrayBuffer(data);
        }
        if (ArrayBuffer.isView(data)) {
            const view = data as ArrayBufferView;
            const buffer = view.buffer.slice(view.byteOffset, view.byteOffset + view.byteLength) as ArrayBuffer;
            return this._parseFromArrayBuffer(buffer);
        }
        if (typeof data === "string") {
            return parseAsciiFBX(data);
        }
        throw new Error("FBXFileLoader: unsupported data type");
    }

    private _parseFromArrayBuffer(buffer: ArrayBuffer): FBXDocument {
        // Check magic bytes to determine binary vs ASCII
        const headerBytes = new Uint8Array(buffer, 0, Math.min(21, buffer.byteLength));
        const header = String.fromCharCode(...headerBytes);

        if (header.startsWith(FBX_BINARY_MAGIC)) {
            return parseBinaryFBX(buffer);
        }

        // Try ASCII
        const text = new TextDecoder("utf-8").decode(buffer);
        if (text.trimStart().startsWith(FBX_ASCII_MAGIC)) {
            return parseAsciiFBX(text);
        }

        throw new Error("FBXFileLoader: unrecognized FBX format");
    }

    // ── Scene Building ─────────────────────────────────────────────────────

    private _buildScene(fbxScene: FBXSceneData, scene: Scene, rootUrl: string, meshesNames: string | readonly string[] | null | undefined): IFBXSceneLoaderAsyncResult {
        const nameFilter = this._buildNameFilter(meshesNames);

        // Create materials
        const materialCache = new Map<number, StandardMaterial>();
        for (const matData of fbxScene.materials) {
            const material = this._createMaterial(matData, scene, rootUrl);
            materialCache.set(matData.id, material);
        }

        // Create one Babylon skeleton per resolved deformation rig.
        const skeletons: Skeleton[] = [];
        const skeletonByRigId = new Map<string, Skeleton>();
        const skeletonByGeometryId = new Map<number, Skeleton>();
        const skinByGeometryId = new Map<number, FBXSkinData>();
        const skinBindingByGeometryId = new Map<number, FBXSkinBindingData>();
        const skinById = new Map<number, FBXSkinData>();

        for (const skin of fbxScene.skins) {
            skinById.set(skin.id, skin);
        }

        for (const rig of fbxScene.rigs) {
            const skeleton = this._createSkeleton(rig.id, rig.bones, scene);
            skeletons.push(skeleton);
            skeletonByRigId.set(rig.id, skeleton);

            for (const binding of rig.skinBindings) {
                const skin = skinById.get(binding.skinId);
                if (!skin) {
                    continue;
                }

                skeletonByGeometryId.set(binding.geometryId, skeleton);
                skinByGeometryId.set(binding.geometryId, skin);
                skinBindingByGeometryId.set(binding.geometryId, binding);
            }
        }

        // Collect model data for animation sampling.
        const modelIdToData = new Map<number, FBXModelData>();
        const collectModelData = (models: FBXModelData[]) => {
            for (const m of models) {
                modelIdToData.set(m.id, m);
                collectModelData(m.children);
            }
        };
        collectModelData(fbxScene.rootModels);
        const cullingConflictMaterialIds = FBXFileLoader._collectCullingConflictMaterialIds(fbxScene.rootModels);
        const cullingMaterialCloneCache = new Map<StandardMaterial, StandardMaterial>();

        // Build the FBX hierarchy under the same handedness conversion root that
        // Babylon's glTF loader uses when loading right-handed assets into a
        // left-handed scene. If the FBX file declares a non-Y-up scene basis,
        // add a child axis-conversion root so model/bind math stays in FBX space.
        const rootNode = new TransformNode("__fbx_root__", scene);
        if (!scene.useRightHandedSystem) {
            rootNode.rotation.y = Math.PI;
            rootNode.scaling.z = -1;
        }

        const meshes: Mesh[] = [];
        const transformNodes: TransformNode[] = [rootNode];
        let assetRoot = rootNode;
        const axisConversion = FBXFileLoader._computeFBXAxisConversionMatrix(fbxScene);
        if (!axisConversion.equals(Matrix.Identity())) {
            assetRoot = new TransformNode("__fbx_axis_conversion__", scene);
            assetRoot.parent = rootNode;
            FBXFileLoader._applyMatrixToTransform(assetRoot, axisConversion);
            transformNodes.push(assetRoot);
        }
        const modelIdToNode = new Map<number, TransformNode>();
        const fbxWorldIdentity = Matrix.Identity();

        for (const model of fbxScene.rootModels) {
            this._buildModel(
                model,
                scene,
                assetRoot,
                assetRoot,
                fbxWorldIdentity,
                materialCache,
                nameFilter,
                meshes,
                transformNodes,
                skeletonByGeometryId,
                skinByGeometryId,
                skinBindingByGeometryId,
                modelIdToNode,
                cullingConflictMaterialIds,
                cullingMaterialCloneCache
            );
        }

        // Link non-skinned child meshes/nodes to their parent bones so they
        // follow skeletal animation. Preserve their current world matrix when
        // switching from the FBX model hierarchy to Babylon's bone parent.
        for (const rig of fbxScene.rigs) {
            const skeleton = skeletonByRigId.get(rig.id);
            if (!skeleton) {
                continue;
            }

            const boneModelIds = new Set(rig.bones.map((b) => b.modelId));
            const skinnedMesh = meshes.find((m) => m.skeleton === skeleton) ?? null;
            const boneReferenceNode = skinnedMesh ?? rootNode;

            for (const boneData of rig.bones) {
                if (!boneData.isCluster) {
                    continue;
                }

                const boneNode = modelIdToNode.get(boneData.modelId);
                const bone = this._getSourceBone(skeleton, boneData.index);
                if (!boneNode || !bone) {
                    continue;
                }

                // Find direct children of this bone's TransformNode that aren't bones themselves
                for (const child of [...boneNode.getChildren()]) {
                    const childTransform = child as TransformNode;
                    // Check if this child is itself a bone — if so, skip it
                    let childIsBone = false;
                    for (const [modelId, node] of Array.from(modelIdToNode)) {
                        if (node === childTransform && boneModelIds.has(modelId)) {
                            childIsBone = true;
                            break;
                        }
                    }
                    if (!childIsBone) {
                        const childWorld = childTransform.computeWorldMatrix(true).clone();
                        const boneReferenceWorld = FBXFileLoader._getBoneReferenceWorldMatrix(skeleton, bone, boneReferenceNode, skinnedMesh);
                        const boneReferenceWorldInv = new Matrix();
                        boneReferenceWorld.invertToRef(boneReferenceWorldInv);
                        const childLocalToBone = childWorld.multiply(boneReferenceWorldInv);

                        childTransform.parent = null;
                        childTransform.attachToBone(bone, boneReferenceNode);
                        FBXFileLoader._applyMatrixToTransform(childTransform, childLocalToBone);
                    }
                }
            }
        }

        // Apply blend shapes (morph targets) to meshes
        if (fbxScene.blendShapes.length > 0) {
            this._applyBlendShapes(fbxScene.blendShapes, meshes, scene, fbxScene.unitScaleFactor);
        }

        // Create animation groups
        const animationGroups: AnimationGroup[] = [];
        for (const animStack of fbxScene.animations) {
            const group = this._createAnimationGroup(animStack, fbxScene.rigs, skeletonByRigId, scene, modelIdToNode, modelIdToData, meshes);
            if (group) {
                animationGroups.push(group);
            }
        }

        // Create cameras
        const cameras: FreeCamera[] = [];
        for (const camData of fbxScene.cameras) {
            const cam = this._createCamera(camData, modelIdToNode, scene);
            if (cam) {
                cameras.push(cam);
            }
        }

        // Create lights
        const sceneLights: (PointLight | DirectionalLight | SpotLight)[] = [];
        for (const lightData of fbxScene.lights) {
            const light = this._createLight(lightData, modelIdToNode, scene);
            if (light) {
                sceneLights.push(light);
            }
        }

        return {
            meshes,
            particleSystems: [],
            skeletons,
            animationGroups,
            transformNodes,
            geometries: [],
            lights: sceneLights,
            spriteManagers: [],
            materials: Array.from(materialCache.values()),
            textures: Array.from(new Set(Array.from(materialCache.values()).flatMap((material) => material.getActiveTextures()))),
            cameras,
        };
    }

    private _addMaterialToContainer(material: Nullable<Material>, container: AssetContainer): void {
        if (!material) {
            return;
        }

        if (material instanceof MultiMaterial) {
            if (!container.multiMaterials.includes(material)) {
                container.multiMaterials.push(material);
            }
            for (const subMaterial of material.subMaterials) {
                this._addMaterialToContainer(subMaterial, container);
            }
        } else if (!container.materials.includes(material)) {
            container.materials.push(material);
        }

        for (const texture of material.getActiveTextures()) {
            this._addTextureToContainer(texture, container);
        }
    }

    private _addTextureToContainer(texture: BaseTexture, container: AssetContainer): void {
        if (!container.textures.includes(texture)) {
            container.textures.push(texture);
        }
    }

    private _setAssetContainer(container: AssetContainer): void {
        for (const asset of container.meshes) {
            asset._parentContainer = container;
        }
        for (const asset of container.transformNodes) {
            asset._parentContainer = container;
        }
        for (const asset of container.skeletons) {
            asset._parentContainer = container;
        }
        for (const asset of container.animationGroups) {
            asset._parentContainer = container;
        }
        for (const asset of container.lights) {
            asset._parentContainer = container;
        }
        for (const asset of container.cameras) {
            asset._parentContainer = container;
        }
        for (const asset of container.materials) {
            asset._parentContainer = container;
        }
        for (const asset of container.multiMaterials) {
            asset._parentContainer = container;
        }
        for (const asset of container.textures) {
            asset._parentContainer = container;
        }
    }

    private static _computeFBXAxisConversionMatrix(fbxScene: FBXSceneData): Matrix {
        const basisRows: [number, number, number][] = [
            [0, 0, 0],
            [0, 0, 0],
            [0, 0, 0],
        ];

        const assignAxis = (sourceAxis: number, sourceSign: number, targetAxis: number): void => {
            if (sourceAxis < 0 || sourceAxis > 2) {
                return;
            }
            const row: [number, number, number] = [0, 0, 0];
            row[targetAxis] = sourceSign >= 0 ? 1 : -1;
            basisRows[sourceAxis] = row;
        };

        assignAxis(fbxScene.coordAxis, fbxScene.coordAxisSign, 0);
        assignAxis(fbxScene.upAxis, fbxScene.upAxisSign, 1);
        assignAxis(fbxScene.frontAxis, fbxScene.frontAxisSign, 2);

        if (basisRows.some((row) => row.every((value) => value === 0))) {
            return Matrix.Identity();
        }

        return Matrix.FromValues(
            basisRows[0][0],
            basisRows[0][1],
            basisRows[0][2],
            0,
            basisRows[1][0],
            basisRows[1][1],
            basisRows[1][2],
            0,
            basisRows[2][0],
            basisRows[2][1],
            basisRows[2][2],
            0,
            0,
            0,
            0,
            1
        );
    }

    private _buildModel(
        model: FBXModelData,
        scene: Scene,
        parent: Nullable<TransformNode>,
        assetRoot: TransformNode,
        parentFBXWorldMatrix: Matrix,
        materialCache: Map<number, StandardMaterial>,
        nameFilter: ((name: string) => boolean) | null,
        meshes: Mesh[],
        transformNodes: TransformNode[],
        skeletonByGeometryId: Map<number, Skeleton>,
        skinByGeometryId: Map<number, FBXSkinData>,
        skinBindingByGeometryId: Map<number, FBXSkinBindingData>,
        modelIdToNode: Map<number, TransformNode>,
        cullingConflictMaterialIds: Set<number>,
        cullingMaterialCloneCache: Map<StandardMaterial, StandardMaterial>
    ): void {
        const localMatrix = FBXFileLoader._computeFBXModelLocalMatrix(model);
        const fbxWorldMatrix = localMatrix.multiply(parentFBXWorldMatrix);

        if (model.geometry && model.subType === "Mesh") {
            // Create mesh
            if (nameFilter && !nameFilter(model.name)) {
                return;
            }

            const skeleton = skeletonByGeometryId.get(model.geometry.id);
            const skin = skinByGeometryId.get(model.geometry.id);
            const skinBinding = skinBindingByGeometryId.get(model.geometry.id);

            if (skeleton && skin) {
                skeleton.needInitialSkinMatrix = true;
            }

            const mesh = this._createMesh(model, model.geometry, scene, skeleton, skin, skinBinding);

            // For skinned meshes: keep bind/pose math in FBX space, but parent
            // the rendered mesh under the same conversion root as non-skinned
            // meshes. The pose matrix cancels the real FBX mesh transform only;
            // the root handedness conversion remains applied once at render time.
            if (skeleton && skin) {
                const meshBindMatrix = skin.meshBindPoseMatrix ? Matrix.FromArray(skin.meshBindPoseMatrix) : fbxWorldMatrix;
                mesh.parent = assetRoot;
                FBXFileLoader._applyMatrixToTransform(mesh, meshBindMatrix);
                mesh.computeWorldMatrix(true);
                mesh.updatePoseMatrix(Matrix.Invert(meshBindMatrix));
                mesh.alwaysSelectAsActiveMesh = true;
            } else {
                if (parent) {
                    mesh.parent = parent;
                }
                FBXFileLoader._applyFBXTransform(mesh, model);
            }

            // Apply material(s)
            if (model.materials.length > 1 && model.geometry?.materialIndices) {
                // Multi-material: create sub-meshes for each material
                this._applyMultiMaterial(mesh, model, materialCache, scene, cullingConflictMaterialIds, cullingMaterialCloneCache);
            } else if (model.materials.length > 0) {
                const mat = materialCache.get(model.materials[0].id);
                if (mat) {
                    mesh.material = FBXFileLoader._getModelMaterial(mat, model, cullingMaterialCloneCache, cullingConflictMaterialIds.has(model.materials[0].id));
                }
            }

            if (model.geometry?.colors) {
                this._useUnmodulatedVertexColorMaterials(mesh, scene);
            }
            this._applyMaterialUVSetCoordinates(mesh.material, model.geometry);

            meshes.push(mesh);
            modelIdToNode.set(model.id, mesh);

            FBXFileLoader._applyModelMetadata(mesh, model);

            // Recurse children
            for (const child of model.children) {
                this._buildModel(
                    child,
                    scene,
                    mesh,
                    assetRoot,
                    fbxWorldMatrix,
                    materialCache,
                    nameFilter,
                    meshes,
                    transformNodes,
                    skeletonByGeometryId,
                    skinByGeometryId,
                    skinBindingByGeometryId,
                    modelIdToNode,
                    cullingConflictMaterialIds,
                    cullingMaterialCloneCache
                );
            }
        } else {
            // Transform node (Null type or no geometry)
            const transformNode = new TransformNode(model.name, scene);
            if (parent) {
                transformNode.parent = parent;
            }

            // Apply full FBX transform chain
            FBXFileLoader._applyFBXTransform(transformNode, model);

            transformNodes.push(transformNode);
            modelIdToNode.set(model.id, transformNode);

            FBXFileLoader._applyModelMetadata(transformNode, model);

            // Recurse children
            for (const child of model.children) {
                this._buildModel(
                    child,
                    scene,
                    transformNode,
                    assetRoot,
                    fbxWorldMatrix,
                    materialCache,
                    nameFilter,
                    meshes,
                    transformNodes,
                    skeletonByGeometryId,
                    skinByGeometryId,
                    skinBindingByGeometryId,
                    modelIdToNode,
                    cullingConflictMaterialIds,
                    cullingMaterialCloneCache
                );
            }
        }
    }

    private static _applyModelMetadata(node: TransformNode | Mesh, model: FBXModelData): void {
        if (!model.customProperties && model.diagnostics.length === 0) {
            return;
        }

        node.metadata = {
            ...((node.metadata as object) ?? {}),
            ...(model.customProperties ? { fbxCustomProperties: model.customProperties } : {}),
            ...(model.diagnostics.length > 0 ? { fbxDiagnostics: model.diagnostics } : {}),
        };
    }

    private _createMesh(model: FBXModelData, geomData: FBXGeometryData, scene: Scene, skeleton?: Skeleton, skin?: FBXSkinData, skinBinding?: FBXSkinBindingData): Mesh {
        const mesh = new Mesh(model.name, scene);
        mesh.sideOrientation = scene.useRightHandedSystem ? Material.CounterClockWiseSideOrientation : Material.ClockWiseSideOrientation;
        const vertexData = new VertexData();

        // Convert Float64Array to Float32Array for Babylon
        const positions = float64To32(geomData.positions);

        const gt = model.geometricTranslation;
        const gr = model.geometricRotation;
        const gs = model.geometricScaling;

        // Geometric transforms affect only this mesh's geometry, not children.
        // Blender composes them as T * R * S; Babylon's row-vector equivalent is S * R * T.
        const geometricPositionMatrix = FBXFileLoader._computeFBXGeometricMatrix(gt, gr, gs);
        const geometricDeltaMatrix = FBXFileLoader._computeFBXGeometricDeltaMatrix(gr, gs);
        const geometricNormalMatrix = FBXFileLoader._computeFBXGeometricNormalMatrix(gr, gs);
        const hasGeometricPositionTransform = !geometricPositionMatrix.equals(Matrix.Identity());
        const hasGeometricDeltaTransform = !geometricDeltaMatrix.equals(Matrix.Identity());
        const hasGeometricNormalTransform = !geometricNormalMatrix.equals(Matrix.Identity());

        if (hasGeometricPositionTransform) {
            for (let i = 0; i < positions.length; i += 3) {
                const v = Vector3.TransformCoordinates(new Vector3(positions[i], positions[i + 1], positions[i + 2]), geometricPositionMatrix);
                positions[i] = v.x;
                positions[i + 1] = v.y;
                positions[i + 2] = v.z;
            }
        }

        // For skinned meshes: do NOT bake mesh local transform into vertices.
        // Vertices remain in their original mesh-local space, keeping the mesh data
        // clean for retargeting. The mesh node carries its FBX transform as an
        // initial pose, while TransformLink bind matrices handle skinning.

        vertexData.positions = positions;
        vertexData.indices = Array.from(geomData.indices);

        let normals: Float32Array | undefined;
        if (geomData.normals) {
            normals = float64To32(geomData.normals);
            if (hasGeometricNormalTransform) {
                for (let i = 0; i < normals.length; i += 3) {
                    const n = Vector3.TransformNormal(new Vector3(normals[i], normals[i + 1], normals[i + 2]), geometricNormalMatrix);
                    if (n.lengthSquared() > 0) {
                        n.normalize();
                    }
                    normals[i] = n.x;
                    normals[i + 1] = n.y;
                    normals[i + 2] = n.z;
                }
            }
            vertexData.normals = normals;
        }

        if (geomData.uvs) {
            vertexData.uvs = float64To32(geomData.uvs);
        }
        if (geomData.uvSets.length > 1) {
            vertexData.uvs2 = float64To32(geomData.uvSets[1].data);
        }
        if (geomData.uvSets.length > 2) {
            vertexData.uvs3 = float64To32(geomData.uvSets[2].data);
        }
        if (geomData.uvSets.length > 3) {
            vertexData.uvs4 = float64To32(geomData.uvSets[3].data);
        }
        if (geomData.uvSets.length > 4) {
            vertexData.uvs5 = float64To32(geomData.uvSets[4].data);
        }
        if (geomData.uvSets.length > 5) {
            vertexData.uvs6 = float64To32(geomData.uvSets[5].data);
        }

        if (geomData.tangents) {
            const tangents = float64To32(geomData.tangents);
            if (hasGeometricNormalTransform) {
                for (let i = 0; i < tangents.length; i += 4) {
                    const t = Vector3.TransformNormal(new Vector3(tangents[i], tangents[i + 1], tangents[i + 2]), geometricNormalMatrix);
                    if (t.lengthSquared() > 0) {
                        t.normalize();
                    }
                    tangents[i] = t.x;
                    tangents[i + 1] = t.y;
                    tangents[i + 2] = t.z;
                }
            }
            applyTangentHandednessScale(tangents, this._getNormalMapTangentHandednessScale());
            vertexData.tangents = tangents;
        } else if (normals && vertexData.uvs) {
            vertexData.tangents = generateTangents(
                positions,
                normals,
                vertexData.uvs,
                geomData.indices,
                this._getNormalMapTangentHandednessScale(),
                geomData.controlPointIndices,
                geomData.materialIndices
            );
        }

        if (geomData.colors) {
            // Force alpha to 1.0 — FBX vertex color alpha is often unreliable
            // (e.g. zeroed out by exporters) and would cause transparency sorting issues.
            const colors = new Float32Array(geomData.colors.length);
            for (let i = 0; i < colors.length; i += 4) {
                colors[i] = geomData.colors[i];
                colors[i + 1] = geomData.colors[i + 1];
                colors[i + 2] = geomData.colors[i + 2];
                colors[i + 3] = 1.0;
            }
            vertexData.colors = colors;
            mesh.hasVertexAlpha = false;
        }

        // Apply bone weights if we have a skin
        if (skeleton && skin) {
            const { matricesIndices, matricesWeights, matricesIndicesExtra, matricesWeightsExtra, numBoneInfluencers } = this._buildSkinningData(geomData, skin, skinBinding);
            vertexData.matricesIndices = matricesIndices;
            vertexData.matricesWeights = matricesWeights;
            if (matricesIndicesExtra && matricesWeightsExtra) {
                vertexData.matricesIndicesExtra = matricesIndicesExtra;
                vertexData.matricesWeightsExtra = matricesWeightsExtra;
            }
            mesh.numBoneInfluencers = numBoneInfluencers;
        }

        vertexData.applyToMesh(mesh);

        // Store geometry metadata for blend shape matching
        mesh.metadata = {
            ...((mesh.metadata as object) ?? {}),
            fbxGeometryId: geomData.id,
            fbxControlPointIndices: geomData.controlPointIndices,
            fbxGeometryDeltaMatrix: hasGeometricDeltaTransform ? geometricDeltaMatrix : null,
            fbxGeometryNormalMatrix: hasGeometricNormalTransform ? geometricNormalMatrix : null,
            // Back-compat for existing morph delta handling metadata.
            fbxPreRotMatrix: hasGeometricDeltaTransform ? geometricDeltaMatrix : null,
        };

        if (skeleton) {
            mesh.skeleton = skeleton;
        }

        return mesh;
    }

    /**
     * Apply multi-material to a mesh by creating sub-meshes grouped by material index.
     * Reorders the index buffer so that triangles sharing the same material are contiguous.
     */
    private _applyMultiMaterial(
        mesh: Mesh,
        model: FBXModelData,
        materialCache: Map<number, StandardMaterial>,
        scene: Scene,
        cullingConflictMaterialIds: Set<number>,
        cullingMaterialCloneCache: Map<StandardMaterial, StandardMaterial>
    ): void {
        const matIndices = model.geometry!.materialIndices!;
        const indices = mesh.getIndices();
        if (!indices) {
            return;
        }

        const triCount = indices.length / 3;

        // Group triangles by material index
        const groups = new Map<number, number[]>(); // matIdx -> triangle indices
        for (let ti = 0; ti < triCount; ti++) {
            const matIdx = ti < matIndices.length ? matIndices[ti] : 0;
            let group = groups.get(matIdx);
            if (!group) {
                group = [];
                groups.set(matIdx, group);
            }
            group.push(ti);
        }

        // Sort group keys to ensure consistent ordering
        const sortedMatIndices = Array.from(groups.keys()).sort((a, b) => a - b);

        // Reorder index buffer so triangles are grouped by material
        const newIndices: number[] = [];
        const subMeshRanges: { start: number; count: number; matIdx: number }[] = [];

        for (const matIdx of sortedMatIndices) {
            const tris = groups.get(matIdx)!;
            const start = newIndices.length;
            for (const ti of tris) {
                newIndices.push(indices[ti * 3], indices[ti * 3 + 1], indices[ti * 3 + 2]);
            }
            subMeshRanges.push({ start, count: tris.length * 3, matIdx });
        }

        // Update the mesh's index buffer
        mesh.setIndices(newIndices);

        // Create MultiMaterial
        const multiMat = new MultiMaterial(model.name + "_multi", scene);
        for (const range of subMeshRanges) {
            const fbxMat = model.materials[range.matIdx];
            if (fbxMat) {
                const mat = materialCache.get(fbxMat.id);
                if (mat) {
                    multiMat.subMaterials.push(FBXFileLoader._getModelMaterial(mat, model, cullingMaterialCloneCache, cullingConflictMaterialIds.has(fbxMat.id)));
                } else {
                    multiMat.subMaterials.push(null);
                }
            } else {
                multiMat.subMaterials.push(null);
            }
        }

        mesh.material = multiMat;

        // Clear existing sub-meshes and create new ones
        mesh.subMeshes = [];
        const vertexCount = mesh.getTotalVertices();
        for (let i = 0; i < subMeshRanges.length; i++) {
            const range = subMeshRanges[i];
            new SubMesh(i, 0, vertexCount, range.start, range.count, mesh);
        }
    }

    private static _collectCullingConflictMaterialIds(models: FBXModelData[]): Set<number> {
        // Deliberately scan the full scene, not just name-filtered models. This
        // can over-clone for filtered imports, but avoids shared culling state.
        const usage = new Map<number, { cullingOff: boolean; cullingOn: boolean }>();
        const collect = (model: FBXModelData): void => {
            for (const material of model.materials) {
                const state = usage.get(material.id) ?? { cullingOff: false, cullingOn: false };
                if (model.cullingOff) {
                    state.cullingOff = true;
                } else {
                    state.cullingOn = true;
                }
                usage.set(material.id, state);
            }
            for (const child of model.children) {
                collect(child);
            }
        };
        for (const model of models) {
            collect(model);
        }

        const conflicts = new Set<number>();
        for (const [materialId, state] of Array.from(usage)) {
            if (state.cullingOff && state.cullingOn) {
                conflicts.add(materialId);
            }
        }
        return conflicts;
    }

    private static _getModelMaterial(
        material: StandardMaterial,
        model: FBXModelData,
        cullingCloneCache?: Map<StandardMaterial, StandardMaterial>,
        cloneCullingOffMaterial = true
    ): StandardMaterial {
        if (!model.cullingOff || !material.backFaceCulling) {
            return material;
        }
        if (!cloneCullingOffMaterial) {
            material.backFaceCulling = false;
            return material;
        }

        const cached = cullingCloneCache?.get(material);
        if (cached) {
            return cached;
        }

        const clone = material.clone(`${material.name}_CullingOff`);
        clone.backFaceCulling = false;
        cullingCloneCache?.set(material, clone);
        return clone;
    }

    private _applyMaterialUVSetCoordinates(material: unknown, geometry: FBXGeometryData): void {
        if (!material) {
            return;
        }
        if (material instanceof MultiMaterial) {
            for (const subMaterial of material.subMaterials) {
                if (subMaterial instanceof StandardMaterial) {
                    this._applyStandardMaterialUVSetCoordinates(subMaterial, geometry);
                }
            }
            return;
        }
        if (material instanceof StandardMaterial) {
            this._applyStandardMaterialUVSetCoordinates(material, geometry);
        }
    }

    private _applyStandardMaterialUVSetCoordinates(material: StandardMaterial, geometry: FBXGeometryData): void {
        for (const texture of [
            material.diffuseTexture,
            material.bumpTexture,
            material.emissiveTexture,
            material.ambientTexture,
            material.specularTexture,
            material.opacityTexture,
            material.reflectionTexture,
        ]) {
            if (!texture) {
                continue;
            }

            const uvSetName = (texture.metadata as { fbxUVSetName?: string } | null | undefined)?.fbxUVSetName;
            if (!uvSetName) {
                continue;
            }

            const uvSetIndex = geometry.uvSets.findIndex((uvSet) => uvSet.name === uvSetName);
            if (uvSetIndex >= 0) {
                texture.coordinatesIndex = uvSetIndex;
            }
        }
    }

    /**
     * Babylon multiplies vertex colors by material diffuse color. Use per-mesh
     * material clones so vertex-colored geometry can render unmodulated without
     * changing shared materials used by non-vertex-colored meshes.
     */
    private _useUnmodulatedVertexColorMaterials(mesh: Mesh, scene: Scene): void {
        const assignedMat = mesh.material;
        if (!assignedMat) {
            return;
        }

        if (assignedMat instanceof StandardMaterial) {
            if (!assignedMat.diffuseTexture) {
                const clone = assignedMat.clone(`${assignedMat.name}_VertexColor`);
                clone.diffuseColor = new Color3(1, 1, 1);
                mesh.material = clone;
            }
            return;
        }

        if (assignedMat instanceof MultiMaterial) {
            const multiMat = new MultiMaterial(`${assignedMat.name}_VertexColor`, scene);
            multiMat.subMaterials = assignedMat.subMaterials.map((sub) => {
                if (sub instanceof StandardMaterial && !sub.diffuseTexture) {
                    const clone = sub.clone(`${sub.name}_VertexColor`);
                    clone.diffuseColor = new Color3(1, 1, 1);
                    return clone;
                }
                return sub;
            });
            mesh.material = multiMat;
        }
    }

    /**
     * Build per-polygon-vertex bone indices and weights from the control-point-based skin data.
     * The geometry expands control points to per-polygon-vertex, so we need to look up
     * each polygon-vertex's control point index.
     */
    private _buildSkinningData(
        geomData: FBXGeometryData,
        skin: FBXSkinData,
        skinBinding?: FBXSkinBindingData
    ): {
        matricesIndices: Float32Array;
        matricesWeights: Float32Array;
        matricesIndicesExtra: Float32Array | null;
        matricesWeightsExtra: Float32Array | null;
        numBoneInfluencers: number;
    } {
        // The positions array is per-polygon-vertex (already expanded).
        // We need to figure out the control point index for each polygon vertex.
        // The geometry stores positions per polygon-vertex, so geomData.positions.length/3
        // = number of polygon vertices. We stored control point indices during expansion,
        // but they aren't exported. Instead, we can use the fact that skin data is indexed
        // by control point, and the geometry's _controlPointIndices stores this mapping.
        //
        // Since we don't have direct access to the control point mapping from FBXGeometryData,
        // we'll use the vertex positions to build the skinning buffer. But actually,
        // we should extend geometry to export control point indices per polygon-vertex.
        //
        // For now, use the approach of matching positions to control points.
        // Actually, let's look at this differently - the indices/weights in the skin
        // are per control point. The geometry already expanded to per polygon-vertex
        // with positions copied from control points. We need to know which control point
        // each polygon-vertex came from.
        //
        // We'll use geomData.controlPointIndices if available.
        const vertexCount = geomData.positions.length / 3;
        const matricesIndices = new Float32Array(vertexCount * 4);
        const matricesWeights = new Float32Array(vertexCount * 4);
        let matricesIndicesExtra: Float32Array | null = null;
        let matricesWeightsExtra: Float32Array | null = null;
        let numBoneInfluencers = 0;

        if (geomData.controlPointIndices) {
            for (let i = 0; i < vertexCount; i++) {
                const cpIdx = geomData.controlPointIndices[i];
                const boneIdx = skin.boneIndices[cpIdx] ?? [];
                numBoneInfluencers = Math.max(numBoneInfluencers, Math.min(boneIdx.length, 8));
            }

            if (numBoneInfluencers > 4) {
                matricesIndicesExtra = new Float32Array(vertexCount * 4);
                matricesWeightsExtra = new Float32Array(vertexCount * 4);
            }

            for (let i = 0; i < vertexCount; i++) {
                const cpIdx = geomData.controlPointIndices[i];
                const boneIdx = skin.boneIndices[cpIdx] ?? [];
                const boneWts = skin.boneWeights[cpIdx] ?? [];

                for (let j = 0; j < 8; j++) {
                    const indicesBuffer = j < 4 ? matricesIndices : matricesIndicesExtra;
                    const weightsBuffer = j < 4 ? matricesWeights : matricesWeightsExtra;
                    if (!indicesBuffer || !weightsBuffer) {
                        continue;
                    }

                    const bufferIndex = i * 4 + (j % 4);
                    if (j < boneIdx.length) {
                        const skinBoneIndex = boneIdx[j];
                        const rigBoneIndex = skinBinding ? skinBinding.skinBoneIndexToRigBoneIndex[skinBoneIndex] : skinBoneIndex;
                        if (rigBoneIndex === undefined || rigBoneIndex < 0) {
                            throw new Error(`FBXFileLoader: missing rig bone mapping for skin bone index ${skinBoneIndex}`);
                        }
                        indicesBuffer[bufferIndex] = rigBoneIndex;
                    } else {
                        indicesBuffer[bufferIndex] = 0;
                    }
                    weightsBuffer[bufferIndex] = j < boneWts.length ? boneWts[j] : 0;
                }
            }
        }

        return {
            matricesIndices,
            matricesWeights,
            matricesIndicesExtra,
            matricesWeightsExtra,
            numBoneInfluencers: Math.max(numBoneInfluencers, 1),
        };
    }

    private _createMaterial(matData: FBXMaterialData, scene: Scene, rootUrl: string): StandardMaterial {
        const material = new StandardMaterial(matData.name, scene);

        const props = matData.properties;
        const hasTexture = (...slots: string[]): boolean => matData.textures.some((texture) => slots.includes(texture.propertyName));

        if (matData.type === "Lambert") {
            material.specularColor = Color3.Black();
        }

        if (props.diffuseColor) {
            const diffuseFactor = hasTexture("DiffuseColor", "Diffuse") ? 1 : (props.diffuseFactor ?? 1);
            material.diffuseColor = new Color3(props.diffuseColor[0] * diffuseFactor, props.diffuseColor[1] * diffuseFactor, props.diffuseColor[2] * diffuseFactor);
        }

        if (props.ambientColor) {
            const ambientFactor = hasTexture("AmbientColor", "Ambient") ? 1 : (props.ambientFactor ?? 1);
            material.ambientColor = new Color3(props.ambientColor[0] * ambientFactor, props.ambientColor[1] * ambientFactor, props.ambientColor[2] * ambientFactor);
        }

        if (matData.type === "Phong" && props.specularColor) {
            const specularFactor = hasTexture("SpecularColor", "Specular", "Shininess", "ShininessExponent") ? 1 : (props.specularFactor ?? 1);
            material.specularColor = new Color3(props.specularColor[0] * specularFactor, props.specularColor[1] * specularFactor, props.specularColor[2] * specularFactor);
        }

        if (props.emissiveColor) {
            const emissiveFactor = hasTexture("EmissiveColor", "Emissive") ? 1 : (props.emissiveFactor ?? 1);
            material.emissiveColor = new Color3(props.emissiveColor[0] * emissiveFactor, props.emissiveColor[1] * emissiveFactor, props.emissiveColor[2] * emissiveFactor);
        }

        if (props.opacity !== undefined) {
            material.alpha = props.opacity;
        } else if (props.transparencyFactor !== undefined) {
            material.alpha = 1 - props.transparencyFactor;
        }

        if (material.alpha < 1) {
            material.transparencyMode = Material.MATERIAL_ALPHABLEND;
        }

        if (props.shininess !== undefined) {
            material.specularPower = props.shininess;
        }

        // Apply textures
        for (const tex of matData.textures) {
            if (!FBXFileLoader._isSupportedMaterialTextureSlot(tex.propertyName)) {
                continue;
            }

            const texture = FBXFileLoader._createTexture(tex, scene, rootUrl, FBXFileLoader._isNormalMapTextureSlot(tex.propertyName));
            if (!texture) {
                continue;
            }

            switch (tex.propertyName) {
                case "DiffuseColor":
                    material.diffuseTexture = texture;
                    // In FBX, a connected diffuse texture provides the color.
                    // Set diffuseColor to white so the texture isn't darkened by
                    // the material's base color (many FBX exports set it near-black).
                    material.diffuseColor = new Color3(1, 1, 1);
                    break;
                case "NormalMap":
                case "NormalMapTexture":
                case "normalCamera":
                    material.bumpTexture = texture;
                    this._configureNormalTexture(texture, material);
                    break;
                case "Bump":
                case "BumpFactor":
                    material.bumpTexture = texture;
                    this._configureNormalTexture(texture, material);
                    break;
                case "EmissiveColor":
                    material.emissiveTexture = texture;
                    break;
                case "AmbientColor":
                    material.ambientTexture = texture;
                    break;
                case "SpecularColor":
                    material.specularTexture = texture;
                    break;
                case "TransparencyFactor":
                case "TransparentColor":
                    material.opacityTexture = texture;
                    material.transparencyMode = Material.MATERIAL_ALPHATESTANDBLEND;
                    break;
                case "ReflectionColor":
                case "ReflectionFactor":
                    material.reflectionTexture = texture;
                    break;
                case "DisplacementColor":
                case "Displacement":
                case "DisplacementFactor":
                    // StandardMaterial doesn't have a displacement slot natively;
                    // store for potential PBR conversion use
                    break;
                case "ShininessExponent":
                case "Shininess":
                    // Shininess map — no direct StandardMaterial slot
                    break;
            }

            // Apply UV transforms
            if (tex.uvTranslation) {
                texture.uOffset = tex.uvTranslation[0];
                texture.vOffset = tex.uvTranslation[1];
            }
            if (tex.uvScaling) {
                texture.uScale = tex.uvScaling[0];
                texture.vScale = tex.uvScaling[1];
            }
            if (tex.uvRotation !== undefined) {
                texture.wAng = tex.uvRotation * (Math.PI / 180);
            }
            if (tex.uvSetIndex !== undefined) {
                texture.coordinatesIndex = tex.uvSetIndex;
            }
            if (tex.uvSetName) {
                texture.metadata = {
                    ...((texture.metadata as object) ?? {}),
                    fbxUVSetName: tex.uvSetName,
                };
            }
        }

        return material;
    }

    private _configureNormalTexture(texture: Texture, material: StandardMaterial): void {
        texture.gammaSpace = false;
        material.invertNormalMapX = false;
        material.invertNormalMapY = this._options.normalMapCoordinateSystem === "y-down";
    }

    private _getNormalMapTangentHandednessScale(): 1 | -1 {
        return this._options.normalMapCoordinateSystem === "y-down" ? -1 : 1;
    }

    private static _isSupportedMaterialTextureSlot(propertyName: string): boolean {
        switch (propertyName) {
            case "DiffuseColor":
            case "NormalMap":
            case "NormalMapTexture":
            case "normalCamera":
            case "Bump":
            case "BumpFactor":
            case "EmissiveColor":
            case "AmbientColor":
            case "SpecularColor":
            case "TransparencyFactor":
            case "TransparentColor":
            case "ReflectionColor":
            case "ReflectionFactor":
            case "DisplacementColor":
            case "Displacement":
            case "DisplacementFactor":
            case "ShininessExponent":
            case "Shininess":
                return true;
            default:
                return false;
        }
    }

    private static _isNormalMapTextureSlot(propertyName: string): boolean {
        switch (propertyName) {
            case "NormalMap":
            case "NormalMapTexture":
            case "normalCamera":
            case "Bump":
            case "BumpFactor":
                return true;
            default:
                return false;
        }
    }

    private static _createTexture(tex: FBXTextureRef, scene: Scene, rootUrl: string, isDataTexture: boolean): Nullable<Texture> {
        const sourceName = FBXFileLoader._getTextureSourceName(tex);
        const creationOptions = FBXFileLoader._getTextureCreationOptions(sourceName, isDataTexture, tex.embeddedData);

        if (tex.embeddedData) {
            const texture = new Texture(null, scene, creationOptions);
            const embeddedTextureName = sourceName ?? `embeddedTexture_${tex.id.toString()}`;
            texture.updateURL(`data:fbx-embedded-texture/${encodeURIComponent(embeddedTextureName)}`, new Uint8Array(tex.embeddedData), undefined, creationOptions.forcedExtension);
            texture.name = embeddedTextureName;
            return texture;
        }

        const textureUrls = FBXFileLoader._getExternalTextureUrls(tex, rootUrl);
        const textureUrl = textureUrls.shift();
        if (!textureUrl) {
            return null;
        }

        return FBXFileLoader._createExternalTexture(textureUrl, textureUrls, scene, creationOptions);
    }

    private static _createExternalTexture(texturePath: string, fallbackUrls: string[], scene: Scene, creationOptions: ITextureCreationOptions): Texture {
        fallbackUrls.push(...FBXFileLoader._buildTextureFallbackUrls(texturePath));
        let fallbackIndex = 0;
        const texture = new Texture(texturePath, scene, {
            ...creationOptions,
            onError: () => {
                const fallbackUrl = fallbackUrls[fallbackIndex++];
                if (fallbackUrl && texture.getScene()) {
                    texture.updateURL(fallbackUrl, null, undefined, FBXFileLoader._getForcedExtension(fallbackUrl));
                }
            },
        });
        return texture;
    }

    private static _buildTextureFallbackUrls(texturePath: string): string[] {
        const slashIndex = Math.max(texturePath.lastIndexOf("/"), texturePath.lastIndexOf("\\"));
        const dotIndex = texturePath.lastIndexOf(".");
        if (dotIndex <= slashIndex) {
            return [];
        }

        const basePath = texturePath.slice(0, dotIndex);
        const currentExtension = texturePath.slice(dotIndex + 1).toLowerCase();
        const extensionFallbacks = ["png", "jpg", "jpeg", "webp", "bmp", "tga"];
        return extensionFallbacks.filter((extension) => extension !== currentExtension).map((extension) => `${basePath}.${extension}`);
    }

    private static _getTextureCreationOptions(sourceName: Nullable<string>, isDataTexture: boolean, embeddedData: Nullable<Uint8Array>): ITextureCreationOptions {
        const mimeType = embeddedData ? (sourceName ? FBXFileLoader._getMimeType(sourceName) : "image/png") : undefined;
        return {
            buffer: embeddedData ? new Uint8Array(embeddedData) : undefined,
            forcedExtension: sourceName ? FBXFileLoader._getForcedExtension(sourceName, mimeType) : embeddedData ? ".png" : undefined,
            gammaSpace: !isDataTexture,
            mimeType,
        };
    }

    private static _getExternalTextureUrls(tex: FBXTextureRef, rootUrl: string): string[] {
        const textureNames = [tex.relativeFileName, tex.fileName].filter((name): name is string => !!name);
        const urls: string[] = [];

        for (const textureName of textureNames) {
            const normalized = textureName.replace(/\\/g, "/");
            if (FBXFileLoader._isSafeRelativeTexturePath(normalized)) {
                urls.push(rootUrl + normalized);
            }

            const basename = FBXFileLoader._getTextureSourceNameFromPath(normalized);
            if (basename) {
                urls.push(rootUrl + basename);
            }
        }

        return Array.from(new Set(urls));
    }

    private static _getTextureSourceName(tex: FBXTextureRef): Nullable<string> {
        const textureName = tex.relativeFileName || tex.fileName;
        if (!textureName) {
            return null;
        }
        const normalized = textureName.replace(/\\/g, "/");
        return FBXFileLoader._getTextureSourceNameFromPath(normalized);
    }

    private static _getTextureSourceNameFromPath(texturePath: string): Nullable<string> {
        return texturePath.split("/").pop() ?? texturePath;
    }

    private static _isSafeRelativeTexturePath(texturePath: string): boolean {
        if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(texturePath) || texturePath.startsWith("/") || texturePath.startsWith("//")) {
            return false;
        }

        return !texturePath.split("/").some((part) => part === "..");
    }

    private static _getForcedExtension(fileName: string, mimeType?: string): string | undefined {
        const slashIndex = Math.max(fileName.lastIndexOf("/"), fileName.lastIndexOf("\\"));
        const dotIndex = fileName.lastIndexOf(".");
        if (dotIndex > slashIndex) {
            return fileName.slice(dotIndex).toLowerCase();
        }

        switch (mimeType) {
            case "image/png":
                return ".png";
            case "image/jpeg":
                return ".jpg";
            case "image/webp":
                return ".webp";
            case "image/bmp":
                return ".bmp";
            case "image/gif":
                return ".gif";
            case "image/x-tga":
                return ".tga";
            default:
                return undefined;
        }
    }

    private static _getMimeType(fileName: string): string {
        const mimeType = GetMimeType(fileName);
        if (mimeType) {
            return mimeType;
        }

        const extension = FBXFileLoader._getForcedExtension(fileName);
        switch (extension) {
            case ".tga":
                return "image/x-tga";
            case ".bmp":
                return "image/bmp";
            case ".gif":
                return "image/gif";
            default:
                return "image/png";
        }
    }

    /**
     * Apply blend shape (morph target) deformers to meshes.
     * FBX Shape vertices are stored as absolute positions for sparse control points.
     * We compute deltas relative to the base mesh positions.
     */
    private _applyBlendShapes(blendShapes: FBXBlendShapeData[], meshes: Mesh[], scene: Scene, unitScaleFactor: number): void {
        // Build a map from geometry ID to mesh (using the mesh metadata we'll need to store)
        // The mesh's geometry ID is tracked through the model hierarchy during _buildModel.
        // We need to match blendShape.geometryId to the correct mesh.
        // Strategy: match by examining which meshes have positions matching the geometry.

        for (const bs of blendShapes) {
            // Find the mesh that uses this geometry
            const mesh = meshes.find((m) => {
                const geomId = (m.metadata as { fbxGeometryId?: number } | undefined)?.fbxGeometryId;
                return geomId === bs.geometryId;
            });
            if (!mesh) {
                continue;
            }

            const morphTargetManager = new MorphTargetManager(scene);
            morphTargetManager.optimizeInfluencers = false;
            // Get preRotation matrix if the mesh had its positions baked
            const deltaMatrix =
                (mesh.metadata as { fbxGeometryDeltaMatrix?: Matrix | null; fbxPreRotMatrix?: Matrix | null } | undefined)?.fbxGeometryDeltaMatrix ??
                (mesh.metadata as { fbxPreRotMatrix?: Matrix | null } | undefined)?.fbxPreRotMatrix ??
                null;
            const normalMatrix = (mesh.metadata as { fbxGeometryNormalMatrix?: Matrix | null } | undefined)?.fbxGeometryNormalMatrix ?? deltaMatrix;

            for (const channel of bs.channels) {
                // Get the control point indices for this mesh (stored as metadata)
                const cpIndices = (mesh.metadata as { fbxControlPointIndices?: Uint32Array } | undefined)?.fbxControlPointIndices;
                if (!cpIndices) {
                    continue;
                }

                const basePositions = mesh.getVerticesData("position");
                const baseNormals = mesh.getVerticesData("normal");
                if (!basePositions) {
                    continue;
                }

                const initialInfluences = calculateBlendShapeInfluences(channel.deformPercent, channel.fullWeights, channel.shapes.length);
                const targetIndices: number[] = [];
                for (let shapeIndex = 0; shapeIndex < channel.shapes.length; shapeIndex++) {
                    const shape = channel.shapes[shapeIndex];
                    if (!shape) {
                        continue;
                    }
                    const targetData = buildMorphTargetData(shape, cpIndices, basePositions, baseNormals, deltaMatrix, normalMatrix, unitScaleFactor);
                    if (!targetData) {
                        continue;
                    }

                    const targetName = channel.fullWeights && channel.shapes.length > 1 ? `${channel.name}_${channel.fullWeights[shapeIndex]}` : channel.name;
                    const morphTarget = new MorphTarget(targetName, initialInfluences[shapeIndex] ?? 0, scene);
                    morphTarget.setPositions(targetData.positions);
                    if (targetData.normals) {
                        morphTarget.setNormals(targetData.normals);
                    }

                    targetIndices.push(morphTargetManager.numTargets);
                    morphTargetManager.addTarget(morphTarget);
                }

                if (targetIndices.length === 0) {
                    continue;
                }

                // Store channel ID mapping on the mesh for animation targeting.
                // Keep the legacy single-target map for existing consumers and add
                // richer in-between metadata for FullWeights-aware animation baking.
                if (!mesh.metadata) {
                    mesh.metadata = {};
                }
                if (!(mesh.metadata as Record<string, unknown>).fbxBlendShapeChannelIds) {
                    (mesh.metadata as Record<string, unknown>).fbxBlendShapeChannelIds = new Map<number, number>();
                }
                ((mesh.metadata as Record<string, unknown>).fbxBlendShapeChannelIds as Map<number, number>).set(channel.id, targetIndices[0]);
                if (!(mesh.metadata as Record<string, unknown>).fbxBlendShapeChannelTargets) {
                    (mesh.metadata as Record<string, unknown>).fbxBlendShapeChannelTargets = new Map<number, { targetIndices: number[]; fullWeights: number[] | null }>();
                }
                ((mesh.metadata as Record<string, unknown>).fbxBlendShapeChannelTargets as Map<number, { targetIndices: number[]; fullWeights: number[] | null }>).set(channel.id, {
                    targetIndices,
                    fullWeights: channel.fullWeights,
                });
            }

            if (morphTargetManager.numTargets > 0) {
                morphTargetManager.numMaxInfluencers = morphTargetManager.numTargets;
                mesh.morphTargetManager = morphTargetManager;
            }
        }
    }

    private _createCamera(camData: FBXCameraData, modelIdToNode: Map<number, TransformNode>, scene: Scene): FreeCamera | null {
        const parentNode = modelIdToNode.get(camData.modelId);
        const position = parentNode ? parentNode.position.clone() : Vector3.Zero();

        const camera = new FreeCamera(camData.name, position, scene);
        camera.fov = camData.fieldOfView * (Math.PI / 180);
        camera.minZ = camData.nearPlane;
        camera.maxZ = camData.farPlane;
        camera.metadata = {
            ...((camera.metadata as object) ?? {}),
            fbxCamera: {
                projectionType: camData.projectionType,
                focalLength: camData.focalLength,
                filmWidth: camData.filmWidth,
                filmHeight: camData.filmHeight,
                orthoZoom: camData.orthoZoom,
                roll: camData.roll,
                aspectRatio: camData.aspectRatio,
                unknownProperties: camData.unknownProperties,
                diagnostics: camData.diagnostics,
            },
        };

        if (camData.projectionType === "orthographic") {
            const orthoHeight = camData.orthoZoom && camData.orthoZoom > 0 ? camData.orthoZoom : 1;
            const aspect = camData.aspectRatio > 0 ? camData.aspectRatio : 1;
            camera.mode = Camera.ORTHOGRAPHIC_CAMERA;
            camera.orthoTop = orthoHeight / 2;
            camera.orthoBottom = -orthoHeight / 2;
            camera.orthoRight = (orthoHeight * aspect) / 2;
            camera.orthoLeft = -(orthoHeight * aspect) / 2;
        }

        if (parentNode) {
            camera.parent = parentNode;
        }

        return camera;
    }

    private _createLight(lightData: FBXLightData, modelIdToNode: Map<number, TransformNode>, scene: Scene): PointLight | DirectionalLight | SpotLight | null {
        const parentNode = modelIdToNode.get(lightData.modelId);
        const position = parentNode ? parentNode.position.clone() : Vector3.Zero();
        const color = new Color3(lightData.color[0], lightData.color[1], lightData.color[2]);

        let light: PointLight | DirectionalLight | SpotLight;

        switch (lightData.lightType) {
            case 1: // Directional
                light = new DirectionalLight(lightData.name, new Vector3(0, -1, 0), scene);
                light.diffuse = color;
                light.intensity = lightData.intensity;
                break;
            case 2: {
                // Spot
                const angle = lightData.coneAngle * (Math.PI / 180);
                light = new SpotLight(lightData.name, position, new Vector3(0, -1, 0), angle, 2, scene);
                light.diffuse = color;
                light.intensity = lightData.intensity;
                break;
            }
            default: // Point (0)
                light = new PointLight(lightData.name, position, scene);
                light.diffuse = color;
                light.intensity = lightData.intensity;
                break;
        }

        light.metadata = {
            ...((light.metadata as object) ?? {}),
            fbxLight: {
                lightType: lightData.lightType,
                decayType: lightData.decayType,
                decayStart: lightData.decayStart,
                innerAngle: lightData.innerAngle,
                outerAngle: lightData.outerAngle,
                enableNearAttenuation: lightData.enableNearAttenuation,
                enableFarAttenuation: lightData.enableFarAttenuation,
                castShadows: lightData.castShadows,
                unknownProperties: lightData.unknownProperties,
                diagnostics: lightData.diagnostics,
            },
        };

        if (parentNode) {
            light.parent = parentNode;
        }

        return light;
    }

    private _createSkeleton(skeletonId: string, bones: FBXBoneData[], scene: Scene): Skeleton {
        const skeleton = new Skeleton("Skeleton", `skeleton_${skeletonId}`, scene);
        const sourceBones: Bone[] = [];
        const scaleCompensationHelpers = new Map<number, Bone>();
        const authoredLocalMatrices: Matrix[] = [];
        const authoredAbsoluteMatrices: Matrix[] = [];
        const authoredRuntimeLocalMatrices: Matrix[] = [];

        // Compute authored Lcl matrices for bones that do not carry FBX bind data.
        for (let i = 0; i < bones.length; i++) {
            const boneData = bones[i];
            const authoredLocal = FBXFileLoader._computeFBXLocalMatrix(
                boneData.translation,
                boneData.rotation,
                boneData.scale,
                boneData.preRotation,
                boneData.postRotation,
                boneData.rotationPivot,
                boneData.scalingPivot,
                boneData.rotationOffset,
                boneData.scalingOffset,
                boneData.rotationOrder
            );
            authoredLocalMatrices[i] = authoredLocal;
            authoredRuntimeLocalMatrices[i] = FBXFileLoader._computeFBXRuntimeLocalMatrix(bones, authoredLocal, i);
        }
        authoredAbsoluteMatrices.push(...FBXFileLoader._computeFBXAbsoluteMatrices(bones, authoredRuntimeLocalMatrices));

        const absoluteBindMatrices = bones.map((boneData, index) =>
            boneData.transformLinkMatrix
                ? Matrix.FromArray(boneData.transformLinkMatrix)
                : boneData.modelBindPoseMatrix
                  ? Matrix.FromArray(boneData.modelBindPoseMatrix)
                  : authoredAbsoluteMatrices[index]
        );

        const localBindMatrices = absoluteBindMatrices.map((absoluteBind, index) => {
            const parentIndex = bones[index].parentIndex;
            if (parentIndex < 0) {
                return absoluteBind;
            }

            const parentAbsoluteBindInv = new Matrix();
            absoluteBindMatrices[parentIndex].invertToRef(parentAbsoluteBindInv);
            return absoluteBind.multiply(parentAbsoluteBindInv);
        });
        const useBindAsRest = FBXFileLoader._shouldUseBindMatricesAsRest(bones, authoredLocalMatrices, localBindMatrices);

        // Most animation curves naturally target authored Lcl transforms. Use
        // bind matrices as live rest pose only for rigs with severe bind/local
        // scale disagreement, which otherwise produce invalid skin matrices.
        // Only bones with that scale disagreement need their animation curves
        // remapped into bind-rest space; ordinary child curves are already in
        // the expected local animation space.
        for (let i = 0; i < bones.length; i++) {
            let localMatrix = useBindAsRest ? localBindMatrices[i] : authoredRuntimeLocalMatrices[i];
            let parentBone = bones[i].parentIndex >= 0 ? sourceBones[bones[i].parentIndex] : null;
            if (!useBindAsRest && bones[i].inheritType === 2 && bones[i].parentIndex >= 0 && parentBone) {
                const split = FBXFileLoader._splitParentScaleCompensatedLocalMatrix(authoredLocalMatrices[i], bones[bones[i].parentIndex].scale);
                const helper = new Bone(
                    `${bones[i].name}__fbx_scaleCompensation`,
                    skeleton,
                    parentBone,
                    split.helperLocalMatrix,
                    split.helperLocalMatrix.clone(),
                    Matrix.Identity(),
                    -1
                );
                helper.metadata = {
                    ...((helper.metadata as object) ?? {}),
                    fbxScaleCompensationForBoneIndex: i,
                    fbxScaleCompensationForBoneName: bones[i].name,
                };
                scaleCompensationHelpers.set(i, helper);
                parentBone = helper;
                localMatrix = split.boneLocalMatrix;
            }
            const bone = new Bone(bones[i].name, skeleton, parentBone, localMatrix, useBindAsRest ? localMatrix.clone() : null, useBindAsRest ? localMatrix.clone() : null, i);
            if (useBindAsRest && bones[i].isCluster && FBXFileLoader._getMaxScaleRatio(authoredLocalMatrices[i], localBindMatrices[i]) >= BIND_REST_SCALE_RATIO_THRESHOLD) {
                this._bindRestBones.add(bone);
            }
            sourceBones.push(bone);
        }
        this._sourceBonesBySkeleton.set(skeleton, sourceBones);
        this._scaleCompensationHelpersBySkeleton.set(skeleton, scaleCompensationHelpers);

        if (!useBindAsRest) {
            for (let i = 0; i < bones.length; i++) {
                const bone = sourceBones[i];
                bone.updateMatrix(localBindMatrices[i], false, false);
            }
            for (const helper of Array.from(scaleCompensationHelpers.values())) {
                helper.updateMatrix(Matrix.Identity(), false, false);
            }
            for (const bone of skeleton.bones) {
                if (!bone.getParent()) {
                    bone._updateAbsoluteBindMatrices(undefined, true);
                }
            }
        }

        return skeleton;
    }

    private _getSourceBone(skeleton: Skeleton, sourceIndex: number): Bone | undefined {
        return this._sourceBonesBySkeleton.get(skeleton)?.[sourceIndex] ?? skeleton.bones[sourceIndex];
    }

    private _getScaleCompensationHelper(skeleton: Skeleton, sourceIndex: number): Bone | undefined {
        return this._scaleCompensationHelpersBySkeleton.get(skeleton)?.get(sourceIndex);
    }

    private static _computeFBXAbsoluteMatrices(bones: FBXBoneData[], localMatrices: Matrix[]): Matrix[] {
        const absoluteMatrices: Matrix[] = [];
        for (let i = 0; i < bones.length; i++) {
            const parentIndex = bones[i].parentIndex;
            if (parentIndex < 0) {
                absoluteMatrices[i] = localMatrices[i].clone();
                continue;
            }

            absoluteMatrices[i] = localMatrices[i].multiply(absoluteMatrices[parentIndex]);
        }
        return absoluteMatrices;
    }

    private static _computeFBXRuntimeLocalMatrix(bones: FBXBoneData[], localMatrix: Matrix, index: number, parentScaleOverride?: [number, number, number]): Matrix {
        const parentIndex = bones[index].parentIndex;
        if (bones[index].inheritType !== 2 || parentIndex < 0) {
            return localMatrix;
        }

        const parentScale = parentScaleOverride ?? bones[parentIndex].scale;
        return FBXFileLoader._applyParentScaleCompensation(localMatrix, parentScale);
    }

    private static _applyParentScaleCompensation(localMatrix: Matrix, parentScale: [number, number, number]): Matrix {
        const split = FBXFileLoader._splitParentScaleCompensatedLocalMatrix(localMatrix, parentScale);
        return split.boneLocalMatrix.multiply(split.helperLocalMatrix);
    }

    private static _splitParentScaleCompensatedLocalMatrix(localMatrix: Matrix, parentScale: [number, number, number]): { boneLocalMatrix: Matrix; helperLocalMatrix: Matrix } {
        const translation = localMatrix.getTranslation();
        const boneLocalMatrix = localMatrix.clone();
        boneLocalMatrix.setTranslation(Vector3.Zero());
        const helperLocalMatrix = Matrix.Compose(FBXFileLoader._getInverseScaleVector(parentScale), Quaternion.Identity(), translation);
        return { boneLocalMatrix, helperLocalMatrix };
    }

    private static _safeInverseScale(value: number): number {
        return Math.abs(value) > 1e-8 ? 1 / value : 1;
    }

    private static _getInverseScaleVector(scale: [number, number, number]): Vector3 {
        return new Vector3(FBXFileLoader._safeInverseScale(scale[0]), FBXFileLoader._safeInverseScale(scale[1]), FBXFileLoader._safeInverseScale(scale[2]));
    }

    private static _shouldUseBindMatricesAsRest(bones: FBXBoneData[], authoredLocalMatrices: Matrix[], localBindMatrices: Matrix[]): boolean {
        return bones.some((bone, index) => {
            if (!bone.isCluster) {
                return false;
            }
            return FBXFileLoader._getMaxScaleRatio(authoredLocalMatrices[index], localBindMatrices[index]) >= BIND_REST_SCALE_RATIO_THRESHOLD;
        });
    }

    private static _getMaxScaleRatio(a: Matrix, b: Matrix): number {
        const scaleA = new Vector3();
        const rotationA = new Quaternion();
        const translationA = new Vector3();
        const scaleB = new Vector3();
        const rotationB = new Quaternion();
        const translationB = new Vector3();
        a.decompose(scaleA, rotationA, translationA);
        b.decompose(scaleB, rotationB, translationB);

        return Math.max(FBXFileLoader._getScaleRatio(scaleA.x, scaleB.x), FBXFileLoader._getScaleRatio(scaleA.y, scaleB.y), FBXFileLoader._getScaleRatio(scaleA.z, scaleB.z));
    }

    private static _getScaleRatio(a: number, b: number): number {
        const absA = Math.abs(a);
        const absB = Math.abs(b);
        if (absA < 1e-6 || absB < 1e-6) {
            return absA < 1e-6 && absB < 1e-6 ? 1 : Number.POSITIVE_INFINITY;
        }
        return Math.max(absA / absB, absB / absA);
    }

    private static _computeFBXGeometricMatrix(translation: [number, number, number], rotation: [number, number, number], scale: [number, number, number]): Matrix {
        return computeFBXGeometricMatrix(translation, rotation, scale);
    }

    private static _computeFBXGeometricDeltaMatrix(rotation: [number, number, number], scale: [number, number, number]): Matrix {
        return computeFBXGeometricDeltaMatrix(rotation, scale);
    }

    private static _computeFBXGeometricNormalMatrix(rotation: [number, number, number], scale: [number, number, number]): Matrix {
        return computeFBXGeometricNormalMatrix(rotation, scale);
    }

    /**
     * Compute the full FBX local transform matrix:
     * M = T * Roff * Rp * Rpre * R * Rpost^-1 * Rp^-1 * Soff * Sp * S * Sp^-1
     *
     * In row-vector convention: v' = v * M
     */
    private static _computeFBXLocalMatrix(
        translation: [number, number, number],
        rotation: [number, number, number],
        scale: [number, number, number],
        preRotation: [number, number, number],
        postRotation: [number, number, number],
        rotationPivot: [number, number, number],
        scalingPivot: [number, number, number],
        rotationOffset: [number, number, number],
        scalingOffset: [number, number, number],
        rotationOrder: number = 0
    ): Matrix {
        return computeFBXLocalMatrix({
            translation,
            rotation,
            scale,
            preRotation,
            postRotation,
            rotationPivot,
            scalingPivot,
            rotationOffset,
            scalingOffset,
            rotationOrder,
        });
    }

    /**
     * Apply the FBX transform chain to a Babylon TransformNode or Mesh.
     * Decomposes the full local matrix into position/rotation/scale.
     */
    private static _applyFBXTransform(node: TransformNode | Mesh, model: FBXModelData): void {
        const localMatrix = FBXFileLoader._computeFBXModelLocalMatrix(model);

        // Decompose into TRS
        const s = new Vector3();
        const r = new Quaternion();
        const t = new Vector3();
        localMatrix.decompose(s, r, t);

        node.position = t;
        node.rotationQuaternion = r;
        node.scaling = s;
    }

    private static _computeFBXModelLocalMatrix(model: FBXModelData): Matrix {
        return FBXFileLoader._computeFBXLocalMatrix(
            model.translation,
            model.rotation,
            model.scale,
            model.preRotation,
            model.postRotation,
            model.rotationPivot,
            model.scalingPivot,
            model.rotationOffset,
            model.scalingOffset,
            model.rotationOrder
        );
    }

    private static _getBoneReferenceWorldMatrix(skeleton: Skeleton, bone: Bone, referenceNode: TransformNode, skinnedMesh: Mesh | null): Matrix {
        if (skinnedMesh) {
            skeleton.getTransformMatrices(skinnedMesh);
        } else {
            skeleton.prepare(true);
        }
        referenceNode.computeWorldMatrix(true);
        return bone.getFinalMatrix().multiply(referenceNode.getWorldMatrix());
    }

    private static _applyMatrixToTransform(node: TransformNode, matrix: Matrix): void {
        const s = new Vector3();
        const r = new Quaternion();
        const t = new Vector3();
        matrix.decompose(s, r, t);

        node.position = t;
        node.rotationQuaternion = r;
        node.scaling = s;
    }

    private _createAnimationGroup(
        animStack: FBXAnimationStackData,
        rigs: FBXRigData[],
        skeletonByRigId: Map<string, Skeleton>,
        scene: Scene,
        modelIdToNode: Map<number, TransformNode>,
        modelIdToData: Map<number, FBXModelData>,
        meshes: Mesh[]
    ): AnimationGroup | null {
        if (animStack.curveNodes.length === 0) {
            return null;
        }

        const animGroup = new AnimationGroup(animStack.name, scene);

        // Build a map from model ID to resolved rig bones. A single FBX model ID
        // should only appear once per resolved rig, but keeping an array preserves
        // the previous animation fan-out behavior for any future duplicate rigs.
        const modelIdToBones = new Map<number, Bone[]>();
        for (const rig of rigs) {
            const skeleton = skeletonByRigId.get(rig.id);
            if (!skeleton) {
                continue;
            }

            for (const boneData of rig.bones) {
                const bone = this._getSourceBone(skeleton, boneData.index);
                if (!bone) {
                    continue;
                }

                const bones = modelIdToBones.get(boneData.modelId);
                if (bones) {
                    bones.push(bone);
                } else {
                    modelIdToBones.set(boneData.modelId, [bone]);
                }
            }
        }

        // Group curve nodes by target
        const boneCurves = new Map<number, FBXCurveNodeData[]>();
        const nonBoneCurves = new Map<number, FBXCurveNodeData[]>();
        const blendShapeCurves: FBXCurveNodeData[] = [];

        for (const curveNode of animStack.curveNodes) {
            if (curveNode.type === "DeformPercent") {
                blendShapeCurves.push(curveNode);
                continue;
            }

            if (modelIdToBones.has(curveNode.targetModelId)) {
                if (!boneCurves.has(curveNode.targetModelId)) {
                    boneCurves.set(curveNode.targetModelId, []);
                }
                boneCurves.get(curveNode.targetModelId)!.push(curveNode);
            } else {
                if (!nonBoneCurves.has(curveNode.targetModelId)) {
                    nonBoneCurves.set(curveNode.targetModelId, []);
                }
                nonBoneCurves.get(curveNode.targetModelId)!.push(curveNode);
            }
        }

        // Process bone targets: compute full FBX local matrix per frame, decompose to TRS.
        // For bind-rest rigs, only the bones recorded in _bindRestBones need their
        // authored Lcl curves remapped onto the bind-rest local space.
        const inheritedRigModelIds = new Set<number>();
        for (const rig of rigs) {
            const inheritType2ModelIds = new Set(rig.bones.filter((bone) => bone.inheritType === 2).map((bone) => bone.modelId));
            if (inheritType2ModelIds.size === 0) {
                continue;
            }

            const skeleton = skeletonByRigId.get(rig.id);
            if (!skeleton) {
                continue;
            }

            if (skeleton.bones.some((bone) => this._bindRestBones.has(bone))) {
                continue;
            }

            for (const modelId of Array.from(inheritType2ModelIds)) {
                inheritedRigModelIds.add(modelId);
            }
            for (const { bone, animations } of this._buildInheritedRigBoneAnimations(
                rig,
                skeleton,
                boneCurves,
                modelIdToData,
                inheritType2ModelIds,
                animStack.startTime,
                animStack.stopTime
            )) {
                for (const animation of animations) {
                    animGroup.addTargetedAnimation(animation, bone);
                }
            }
        }

        for (const [targetId, curveNodes] of Array.from(boneCurves)) {
            if (inheritedRigModelIds.has(targetId)) {
                continue;
            }

            const bones = modelIdToBones.get(targetId);
            const modelData = modelIdToData.get(targetId);
            if (!bones || bones.length === 0 || !modelData) {
                continue;
            }

            for (const bone of bones) {
                const animations = this._buildBoneAnimations(
                    curveNodes,
                    bone.name,
                    modelData,
                    animStack.startTime,
                    animStack.stopTime,
                    this._bindRestBones.has(bone) ? bone.getBindMatrix() : undefined
                );
                for (const animation of animations) {
                    animGroup.addTargetedAnimation(animation, bone);
                }
            }
        }

        // Process non-bone targets: bake full transform matrix per frame
        for (const [targetId, curveNodes] of Array.from(nonBoneCurves)) {
            const node = modelIdToNode.get(targetId);
            if (!node) {
                continue;
            }

            const modelData = modelIdToData.get(targetId);
            if (!modelData) {
                continue;
            }

            const animations = this._buildNodeAnimations(curveNodes, node.name, modelData, animStack.startTime, animStack.stopTime);
            for (const animation of animations) {
                animGroup.addTargetedAnimation(animation, node);
            }
        }

        // Process blend shape (morph target) animations
        for (const curveNode of blendShapeCurves) {
            const targetChannelId = curveNode.targetModelId;

            // Find the morph target with matching channel ID across all meshes
            let targetFound = false;
            for (const mesh of meshes) {
                if (!mesh.morphTargetManager || targetFound) {
                    continue;
                }
                const metadata = mesh.metadata as Record<string, unknown> | undefined;
                const channelTargets = metadata?.fbxBlendShapeChannelTargets as Map<number, { targetIndices: number[]; fullWeights: number[] | null }> | undefined;
                const targetInfo = channelTargets?.get(targetChannelId);
                if (targetInfo && curveNode.curves.length > 0) {
                    const fps = 30;
                    for (let shapeIndex = 0; shapeIndex < targetInfo.targetIndices.length; shapeIndex++) {
                        const target = mesh.morphTargetManager.getTarget(targetInfo.targetIndices[shapeIndex]);
                        if (!target) {
                            continue;
                        }
                        const anim = new Animation(`${target.name}_influence`, "influence", fps, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CYCLE);
                        const keys = buildScalarAnimationKeys(
                            curveNode.curves[0],
                            fps,
                            animStack.startTime,
                            animStack.stopTime,
                            (value) => calculateBlendShapeInfluences(value, targetInfo.fullWeights, targetInfo.targetIndices.length)[shapeIndex] ?? 0
                        );
                        anim.setKeys(keys);
                        animGroup.addTargetedAnimation(anim, target);
                    }
                    targetFound = true;
                    continue;
                }

                const channelMap = metadata?.fbxBlendShapeChannelIds as Map<number, number> | undefined;
                if (!channelMap) {
                    continue;
                }
                const targetIndex = channelMap.get(targetChannelId);
                if (targetIndex === undefined) {
                    continue;
                }

                const target = mesh.morphTargetManager.getTarget(targetIndex);
                if (target && curveNode.curves.length > 0) {
                    const fps = 30;
                    const anim = new Animation(`${target.name}_influence`, "influence", fps, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CYCLE);
                    const keys = buildScalarAnimationKeys(curveNode.curves[0], fps, animStack.startTime, animStack.stopTime, (value) => value / 100);
                    anim.setKeys(keys);
                    animGroup.addTargetedAnimation(anim, target);
                    targetFound = true;
                }
            }
        }

        // Normalize the animation group
        if (animGroup.targetedAnimations.length > 0) {
            animGroup.normalize(animStack.startTime * 30, animStack.stopTime * 30);
            return animGroup;
        }

        animGroup.dispose();
        return null;
    }

    private _buildInheritedRigBoneAnimations(
        rig: FBXRigData,
        skeleton: Skeleton,
        boneCurves: Map<number, FBXCurveNodeData[]>,
        modelIdToData: Map<number, FBXModelData>,
        compensatedModelIds: Set<number>,
        startTime: number,
        stopTime: number
    ): { bone: Bone; animations: Animation[] }[] {
        const fps = 30;
        const sampledModelIds = new Set<number>();
        for (let i = 0; i < rig.bones.length; i++) {
            if (!compensatedModelIds.has(rig.bones[i].modelId)) {
                continue;
            }

            for (let parentIndex = i; parentIndex >= 0; parentIndex = rig.bones[parentIndex].parentIndex) {
                sampledModelIds.add(rig.bones[parentIndex].modelId);
            }
        }
        const rigCurveNodes = rig.bones.filter((bone) => sampledModelIds.has(bone.modelId)).flatMap((bone) => boneCurves.get(bone.modelId) ?? []);
        const times = collectAnimationSampleTimes(rigCurveNodes, fps, startTime, stopTime);
        if (times.length === 0) {
            return [];
        }

        const keysByBone = rig.bones.map(() => ({
            posKeys: [] as { frame: number; value: Vector3 }[],
            rotKeys: [] as { frame: number; value: Quaternion }[],
            sclKeys: [] as { frame: number; value: Vector3 }[],
            prevQuat: null as Quaternion | null,
        }));
        const keysByHelper = rig.bones.map(() => ({
            posKeys: [] as { frame: number; value: Vector3 }[],
            rotKeys: [] as { frame: number; value: Quaternion }[],
            sclKeys: [] as { frame: number; value: Vector3 }[],
            prevQuat: null as Quaternion | null,
        }));
        const restLocalInverses = rig.bones.map((boneData, index) => {
            const bone = this._getSourceBone(skeleton, index);
            const modelData = modelIdToData.get(boneData.modelId);
            if (!bone || !modelData || !this._bindRestBones.has(bone)) {
                return null;
            }

            const restLocalMatrix = FBXFileLoader._computeFBXModelLocalMatrix(modelData);
            const restLocalInverse = new Matrix();
            restLocalMatrix.invertToRef(restLocalInverse);
            return restLocalInverse;
        });

        for (const time of times) {
            const localMatrices = rig.bones.map((boneData, index) => {
                const modelData = modelIdToData.get(boneData.modelId);
                const curveNodes = boneCurves.get(boneData.modelId) ?? [];
                let localMatrix = modelData ? this._sampleModelLocalMatrix(modelData, curveNodes, time) : Matrix.Identity();

                const restLocalInverse = restLocalInverses[index];
                if (restLocalInverse) {
                    const sourceBone = this._getSourceBone(skeleton, index);
                    localMatrix = (sourceBone?.getBindMatrix() ?? Matrix.Identity()).multiply(restLocalInverse).multiply(localMatrix);
                }
                return localMatrix;
            });
            const sampledScales = rig.bones.map((boneData) => {
                const modelData = modelIdToData.get(boneData.modelId);
                const curveNodes = boneCurves.get(boneData.modelId) ?? [];
                return modelData ? this._sampleModelScale(modelData, curveNodes, time) : boneData.scale;
            });
            const frame = time * fps;

            for (let i = 0; i < localMatrices.length; i++) {
                if (!compensatedModelIds.has(rig.bones[i].modelId)) {
                    continue;
                }

                const parentIndex = rig.bones[i].parentIndex;
                const parentScale = parentIndex >= 0 ? sampledScales[parentIndex] : rig.bones[i].scale;
                const split = FBXFileLoader._splitParentScaleCompensatedLocalMatrix(localMatrices[i], parentScale);
                FBXFileLoader._pushMatrixKeys(keysByBone[i], frame, split.boneLocalMatrix);
                FBXFileLoader._pushMatrixKeys(keysByHelper[i], frame, split.helperLocalMatrix);
            }
        }

        const result: { bone: Bone; animations: Animation[] }[] = [];
        for (let i = 0; i < rig.bones.length; i++) {
            if (!compensatedModelIds.has(rig.bones[i].modelId)) {
                continue;
            }

            const bone = this._getSourceBone(skeleton, i);
            if (!bone) {
                continue;
            }

            const { posKeys, rotKeys, sclKeys } = keysByBone[i];
            const animations: Animation[] = [];
            if (!this._isVector3KeysConstant(posKeys)) {
                const posAnim = new Animation(`${bone.name}_position`, "position", fps, Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CYCLE);
                posAnim.setKeys(posKeys);
                animations.push(posAnim);
            }
            if (!areQuaternionKeysConstant(rotKeys)) {
                const rotAnim = new Animation(`${bone.name}_rotation`, "rotationQuaternion", fps, Animation.ANIMATIONTYPE_QUATERNION, Animation.ANIMATIONLOOPMODE_CYCLE);
                rotAnim.setKeys(rotKeys);
                animations.push(rotAnim);
            }
            if (!this._isVector3KeysConstant(sclKeys)) {
                const sclAnim = new Animation(`${bone.name}_scaling`, "scaling", fps, Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CYCLE);
                sclAnim.setKeys(sclKeys);
                animations.push(sclAnim);
            }
            if (animations.length > 0) {
                result.push({ bone, animations });
            }

            const helper = this._getScaleCompensationHelper(skeleton, i);
            if (!helper) {
                continue;
            }

            const helperAnimations: Animation[] = [];
            const { posKeys: helperPosKeys, rotKeys: helperRotKeys, sclKeys: helperSclKeys } = keysByHelper[i];
            if (!this._isVector3KeysConstant(helperPosKeys)) {
                const posAnim = new Animation(`${helper.name}_position`, "position", fps, Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CYCLE);
                posAnim.setKeys(helperPosKeys);
                helperAnimations.push(posAnim);
            }
            if (!areQuaternionKeysConstant(helperRotKeys)) {
                const rotAnim = new Animation(`${helper.name}_rotation`, "rotationQuaternion", fps, Animation.ANIMATIONTYPE_QUATERNION, Animation.ANIMATIONLOOPMODE_CYCLE);
                rotAnim.setKeys(helperRotKeys);
                helperAnimations.push(rotAnim);
            }
            if (!this._isVector3KeysConstant(helperSclKeys)) {
                const sclAnim = new Animation(`${helper.name}_scaling`, "scaling", fps, Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CYCLE);
                sclAnim.setKeys(helperSclKeys);
                helperAnimations.push(sclAnim);
            }
            if (helperAnimations.length > 0) {
                result.push({ bone: helper, animations: helperAnimations });
            }
        }

        return result;
    }

    private static _pushMatrixKeys(
        keySet: {
            posKeys: { frame: number; value: Vector3 }[];
            rotKeys: { frame: number; value: Quaternion }[];
            sclKeys: { frame: number; value: Vector3 }[];
            prevQuat: Quaternion | null;
        },
        frame: number,
        matrix: Matrix
    ): void {
        const s = new Vector3();
        const r = new Quaternion();
        const t = new Vector3();
        matrix.decompose(s, r, t);

        if (keySet.prevQuat && Quaternion.Dot(keySet.prevQuat, r) < 0) {
            r.scaleInPlace(-1);
        }
        keySet.prevQuat = r;

        keySet.posKeys.push({ frame, value: t });
        keySet.rotKeys.push({ frame, value: r });
        keySet.sclKeys.push({ frame, value: s });
    }

    /**
     * Build animations for a non-bone node, correctly handling pivots.
     * Computes the full FBX transform matrix at each keyframe and decomposes into TRS.
     */
    private _buildNodeAnimations(curveNodes: FBXCurveNodeData[], nodeName: string, modelData: FBXModelData, startTime: number, stopTime: number): Animation[] {
        const fps = 30;

        // Separate curves by type
        const tNode = curveNodes.find((cn) => cn.type === "T");
        const rNode = curveNodes.find((cn) => cn.type === "R");
        const sNode = curveNodes.find((cn) => cn.type === "S");

        const times = collectAnimationSampleTimes(curveNodes, fps, startTime, stopTime);
        if (times.length === 0) {
            return [];
        }

        // Get curve accessors
        const txCurve = tNode?.curves.find((c) => c.channel === "d|X");
        const tyCurve = tNode?.curves.find((c) => c.channel === "d|Y");
        const tzCurve = tNode?.curves.find((c) => c.channel === "d|Z");
        const rxCurve = rNode?.curves.find((c) => c.channel === "d|X");
        const ryCurve = rNode?.curves.find((c) => c.channel === "d|Y");
        const rzCurve = rNode?.curves.find((c) => c.channel === "d|Z");
        const sxCurve = sNode?.curves.find((c) => c.channel === "d|X");
        const syCurve = sNode?.curves.find((c) => c.channel === "d|Y");
        const szCurve = sNode?.curves.find((c) => c.channel === "d|Z");

        // Build keyframes by computing the full matrix at each time
        const posKeys: { frame: number; value: Vector3 }[] = [];
        const rotKeys: { frame: number; value: Quaternion }[] = [];
        const sclKeys: { frame: number; value: Vector3 }[] = [];
        let prevQuat: Quaternion | null = null;

        for (const time of times) {
            const frame = time * fps;

            // Sample animated values, falling back to model's base values
            const tx = sampleFBXCurveAtTime(txCurve, time) ?? modelData.translation[0];
            const ty = sampleFBXCurveAtTime(tyCurve, time) ?? modelData.translation[1];
            const tz = sampleFBXCurveAtTime(tzCurve, time) ?? modelData.translation[2];
            const rx = sampleFBXCurveAtTime(rxCurve, time) ?? modelData.rotation[0];
            const ry = sampleFBXCurveAtTime(ryCurve, time) ?? modelData.rotation[1];
            const rz = sampleFBXCurveAtTime(rzCurve, time) ?? modelData.rotation[2];
            const sx = sampleFBXCurveAtTime(sxCurve, time) ?? modelData.scale[0];
            const sy = sampleFBXCurveAtTime(syCurve, time) ?? modelData.scale[1];
            const sz = sampleFBXCurveAtTime(szCurve, time) ?? modelData.scale[2];

            // Compute the full FBX local transform matrix with pivots
            const localMatrix = FBXFileLoader._computeFBXLocalMatrix(
                [tx, ty, tz],
                [rx, ry, rz],
                [sx, sy, sz],
                modelData.preRotation,
                modelData.postRotation,
                modelData.rotationPivot,
                modelData.scalingPivot,
                modelData.rotationOffset,
                modelData.scalingOffset,
                modelData.rotationOrder
            );

            // Decompose into TRS
            const s = new Vector3();
            const r = new Quaternion();
            const t = new Vector3();
            localMatrix.decompose(s, r, t);

            // Ensure quaternion continuity
            if (prevQuat && Quaternion.Dot(prevQuat, r) < 0) {
                r.scaleInPlace(-1);
            }
            prevQuat = r;

            posKeys.push({ frame, value: t });
            rotKeys.push({ frame, value: r });
            sclKeys.push({ frame, value: s });
        }

        const animations: Animation[] = [];

        // Only create position animation if it's not constant
        if (!this._isVector3KeysConstant(posKeys)) {
            const posAnim = new Animation(`${nodeName}_position`, "position", fps, Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CYCLE);
            posAnim.setKeys(posKeys);
            animations.push(posAnim);
        }

        // Always create rotation animation (if there are rotation curves)
        if (rNode) {
            const rotAnim = new Animation(`${nodeName}_rotation`, "rotationQuaternion", fps, Animation.ANIMATIONTYPE_QUATERNION, Animation.ANIMATIONLOOPMODE_CYCLE);
            rotAnim.setKeys(rotKeys);
            animations.push(rotAnim);
        }

        // Only create scale animation if it's not constant
        if (!this._isVector3KeysConstant(sclKeys)) {
            const sclAnim = new Animation(`${nodeName}_scaling`, "scaling", fps, Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CYCLE);
            sclAnim.setKeys(sclKeys);
            animations.push(sclAnim);
        }

        return animations;
    }

    private _isVector3KeysConstant(keys: { frame: number; value: Vector3 }[]): boolean {
        if (keys.length < 2) {
            return true;
        }
        const first = keys[0].value;
        for (let i = 1; i < keys.length; i++) {
            const v = keys[i].value;
            if (Math.abs(v.x - first.x) > 0.0001 || Math.abs(v.y - first.y) > 0.0001 || Math.abs(v.z - first.z) > 0.0001) {
                return false;
            }
        }
        return true;
    }

    private _sampleModelLocalMatrix(modelData: FBXModelData, curveNodes: FBXCurveNodeData[], time: number, scaleOverride?: [number, number, number]): Matrix {
        const tNode = curveNodes.find((cn) => cn.type === "T");
        const rNode = curveNodes.find((cn) => cn.type === "R");
        const sNode = curveNodes.find((cn) => cn.type === "S");

        const txCurve = tNode?.curves.find((c) => c.channel === "d|X");
        const tyCurve = tNode?.curves.find((c) => c.channel === "d|Y");
        const tzCurve = tNode?.curves.find((c) => c.channel === "d|Z");
        const rxCurve = rNode?.curves.find((c) => c.channel === "d|X");
        const ryCurve = rNode?.curves.find((c) => c.channel === "d|Y");
        const rzCurve = rNode?.curves.find((c) => c.channel === "d|Z");
        const sxCurve = sNode?.curves.find((c) => c.channel === "d|X");
        const syCurve = sNode?.curves.find((c) => c.channel === "d|Y");
        const szCurve = sNode?.curves.find((c) => c.channel === "d|Z");

        return FBXFileLoader._computeFBXLocalMatrix(
            [
                sampleFBXCurveAtTime(txCurve, time) ?? modelData.translation[0],
                sampleFBXCurveAtTime(tyCurve, time) ?? modelData.translation[1],
                sampleFBXCurveAtTime(tzCurve, time) ?? modelData.translation[2],
            ],
            [
                sampleFBXCurveAtTime(rxCurve, time) ?? modelData.rotation[0],
                sampleFBXCurveAtTime(ryCurve, time) ?? modelData.rotation[1],
                sampleFBXCurveAtTime(rzCurve, time) ?? modelData.rotation[2],
            ],
            scaleOverride ?? [
                sampleFBXCurveAtTime(sxCurve, time) ?? modelData.scale[0],
                sampleFBXCurveAtTime(syCurve, time) ?? modelData.scale[1],
                sampleFBXCurveAtTime(szCurve, time) ?? modelData.scale[2],
            ],
            modelData.preRotation,
            modelData.postRotation,
            modelData.rotationPivot,
            modelData.scalingPivot,
            modelData.rotationOffset,
            modelData.scalingOffset,
            modelData.rotationOrder
        );
    }

    private _sampleModelScale(modelData: FBXModelData, curveNodes: FBXCurveNodeData[], time: number): [number, number, number] {
        const sNode = curveNodes.find((cn) => cn.type === "S");
        const sxCurve = sNode?.curves.find((c) => c.channel === "d|X");
        const syCurve = sNode?.curves.find((c) => c.channel === "d|Y");
        const szCurve = sNode?.curves.find((c) => c.channel === "d|Z");
        return [
            sampleFBXCurveAtTime(sxCurve, time) ?? modelData.scale[0],
            sampleFBXCurveAtTime(syCurve, time) ?? modelData.scale[1],
            sampleFBXCurveAtTime(szCurve, time) ?? modelData.scale[2],
        ];
    }

    /**
     * Build matrix-baked bone animation from full FBX local transforms.
     * The bind matrix carries the skinning offset, so animation curves drive
     * the same FBX local transform chain as the source skeleton.
     */
    private _buildBoneAnimations(
        curveNodes: FBXCurveNodeData[],
        boneName: string,
        modelData: FBXModelData,
        startTime: number,
        stopTime: number,
        bindLocalMatrix?: Matrix
    ): Animation[] {
        const fps = 30;

        // Separate curves by type
        const tNode = curveNodes.find((cn) => cn.type === "T");
        const rNode = curveNodes.find((cn) => cn.type === "R");
        const sNode = curveNodes.find((cn) => cn.type === "S");

        const times = collectAnimationSampleTimes(curveNodes, fps, startTime, stopTime);
        if (times.length === 0) {
            return [];
        }

        // Get curve accessors
        const txCurve = tNode?.curves.find((c) => c.channel === "d|X");
        const tyCurve = tNode?.curves.find((c) => c.channel === "d|Y");
        const tzCurve = tNode?.curves.find((c) => c.channel === "d|Z");
        const rxCurve = rNode?.curves.find((c) => c.channel === "d|X");
        const ryCurve = rNode?.curves.find((c) => c.channel === "d|Y");
        const rzCurve = rNode?.curves.find((c) => c.channel === "d|Z");
        const sxCurve = sNode?.curves.find((c) => c.channel === "d|X");
        const syCurve = sNode?.curves.find((c) => c.channel === "d|Y");
        const szCurve = sNode?.curves.find((c) => c.channel === "d|Z");

        const posKeys: { frame: number; value: Vector3 }[] = [];
        const rotKeys: { frame: number; value: Quaternion }[] = [];
        const sclKeys: { frame: number; value: Vector3 }[] = [];
        let prevQuat: Quaternion | null = null;
        let restLocalInverse: Matrix | null = null;
        if (bindLocalMatrix) {
            const restLocalMatrix = FBXFileLoader._computeFBXLocalMatrix(
                modelData.translation,
                modelData.rotation,
                modelData.scale,
                modelData.preRotation,
                modelData.postRotation,
                modelData.rotationPivot,
                modelData.scalingPivot,
                modelData.rotationOffset,
                modelData.scalingOffset,
                modelData.rotationOrder
            );
            restLocalInverse = new Matrix();
            restLocalMatrix.invertToRef(restLocalInverse);
        }

        for (const time of times) {
            const frame = time * fps;

            // Sample animated values, falling back to model's base values
            const tx = sampleFBXCurveAtTime(txCurve, time) ?? modelData.translation[0];
            const ty = sampleFBXCurveAtTime(tyCurve, time) ?? modelData.translation[1];
            const tz = sampleFBXCurveAtTime(tzCurve, time) ?? modelData.translation[2];
            const rx = sampleFBXCurveAtTime(rxCurve, time) ?? modelData.rotation[0];
            const ry = sampleFBXCurveAtTime(ryCurve, time) ?? modelData.rotation[1];
            const rz = sampleFBXCurveAtTime(rzCurve, time) ?? modelData.rotation[2];
            const sx = sampleFBXCurveAtTime(sxCurve, time) ?? modelData.scale[0];
            const sy = sampleFBXCurveAtTime(syCurve, time) ?? modelData.scale[1];
            const sz = sampleFBXCurveAtTime(szCurve, time) ?? modelData.scale[2];

            // Compute the full FBX local matrix from animated Lcl values
            const localMatrix = FBXFileLoader._computeFBXLocalMatrix(
                [tx, ty, tz],
                [rx, ry, rz],
                [sx, sy, sz],
                modelData.preRotation,
                modelData.postRotation,
                modelData.rotationPivot,
                modelData.scalingPivot,
                modelData.rotationOffset,
                modelData.scalingOffset,
                modelData.rotationOrder
            );

            const correctedLocalMatrix = restLocalInverse && bindLocalMatrix ? bindLocalMatrix.multiply(restLocalInverse).multiply(localMatrix) : localMatrix;

            const s = new Vector3();
            const r = new Quaternion();
            const t = new Vector3();
            correctedLocalMatrix.decompose(s, r, t);

            if (prevQuat && Quaternion.Dot(prevQuat, r) < 0) {
                r.scaleInPlace(-1);
            }
            prevQuat = r;

            posKeys.push({ frame, value: t });
            rotKeys.push({ frame, value: r });
            sclKeys.push({ frame, value: s });
        }

        const animations: Animation[] = [];

        if (!this._isVector3KeysConstant(posKeys)) {
            const posAnim = new Animation(`${boneName}_position`, "position", fps, Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CYCLE);
            posAnim.setKeys(posKeys);
            animations.push(posAnim);
        }

        if (rNode) {
            const rotAnim = new Animation(`${boneName}_rotation`, "rotationQuaternion", fps, Animation.ANIMATIONTYPE_QUATERNION, Animation.ANIMATIONLOOPMODE_CYCLE);
            rotAnim.setKeys(rotKeys);
            animations.push(rotAnim);
        }

        if (!this._isVector3KeysConstant(sclKeys)) {
            const sclAnim = new Animation(`${boneName}_scaling`, "scaling", fps, Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CYCLE);
            sclAnim.setKeys(sclKeys);
            animations.push(sclAnim);
        }

        return animations;
    }

    private _buildNameFilter(meshesNames: string | readonly string[] | null | undefined): ((name: string) => boolean) | null {
        if (!meshesNames) {
            return null;
        }
        if (typeof meshesNames === "string") {
            if (meshesNames === "") {
                return null;
            }
            return (name: string) => name === meshesNames;
        }
        if (meshesNames.length === 0) {
            return null;
        }
        const nameSet = new Set(meshesNames);
        return (name: string) => nameSet.has(name);
    }
}

function float64To32(arr: Float64Array): Float32Array {
    const result = new Float32Array(arr.length);
    for (let i = 0; i < arr.length; i++) {
        result[i] = arr[i];
    }
    return result;
}

function applyTangentHandednessScale(tangents: Float32Array, scale: 1 | -1): void {
    if (scale === 1) {
        return;
    }
    for (let i = 3; i < tangents.length; i += 4) {
        tangents[i] *= scale;
    }
}

function generateTangents(
    positions: ArrayLike<number>,
    normals: ArrayLike<number>,
    uvs: ArrayLike<number>,
    indices: ArrayLike<number>,
    normalMapTangentHandednessScale: 1 | -1 = 1,
    controlPointIndices: ArrayLike<number> | null = null,
    materialIndices: ArrayLike<number> | null = null
): Float32Array {
    const vertexCount = positions.length / 3;
    const groups = new Map<string, TangentGroup>();
    const vertexGroupKeys = new Array<string | null>(vertexCount).fill(null);

    for (let i = 0; i + 2 < indices.length; i += 3) {
        const materialIndex = materialIndices ? materialIndices[i / 3] : 0;
        const i1 = indices[i];
        const i2 = indices[i + 1];
        const i3 = indices[i + 2];

        const p1 = i1 * 3;
        const p2 = i2 * 3;
        const p3 = i3 * 3;
        const uv1 = i1 * 2;
        const uv2 = i2 * 2;
        const uv3 = i3 * 2;

        const x1 = positions[p2] - positions[p1];
        const x2 = positions[p3] - positions[p1];
        const y1 = positions[p2 + 1] - positions[p1 + 1];
        const y2 = positions[p3 + 1] - positions[p1 + 1];
        const z1 = positions[p2 + 2] - positions[p1 + 2];
        const z2 = positions[p3 + 2] - positions[p1 + 2];

        const s1 = uvs[uv2] - uvs[uv1];
        const s2 = uvs[uv3] - uvs[uv1];
        const t1 = uvs[uv2 + 1] - uvs[uv1 + 1];
        const t2 = uvs[uv3 + 1] - uvs[uv1 + 1];
        const denominator = s1 * t2 - s2 * t1;
        if (Math.abs(denominator) < 1e-8) {
            continue;
        }

        const r = 1 / denominator;
        const sx = (t2 * x1 - t1 * x2) * r;
        const sy = (t2 * y1 - t1 * y2) * r;
        const sz = (t2 * z1 - t1 * z2) * r;
        const bx = (s1 * x2 - s2 * x1) * r;
        const by = (s1 * y2 - s2 * y1) * r;
        const bz = (s1 * z2 - s2 * z1) * r;

        accumulateTangentContribution(i1, i2, i3, sx, sy, sz, bx, by, bz, positions, normals, uvs, controlPointIndices, materialIndex, groups, vertexGroupKeys);
        accumulateTangentContribution(i2, i3, i1, sx, sy, sz, bx, by, bz, positions, normals, uvs, controlPointIndices, materialIndex, groups, vertexGroupKeys);
        accumulateTangentContribution(i3, i1, i2, sx, sy, sz, bx, by, bz, positions, normals, uvs, controlPointIndices, materialIndex, groups, vertexGroupKeys);
    }

    const tangents = new Float32Array(vertexCount * 4);
    for (let i = 0; i < vertexCount; i++) {
        const no = i * 3;
        const to = i * 4;
        const [nx, ny, nz] = normalizeVector(normals[no], normals[no + 1], normals[no + 2]);
        const group = vertexGroupKeys[i] ? groups.get(vertexGroupKeys[i]!) : undefined;
        const tx = group?.tx ?? 0;
        const ty = group?.ty ?? 0;
        const tz = group?.tz ?? 0;
        const normalDotTangent = nx * tx + ny * ty + nz * tz;

        let ox = tx - nx * normalDotTangent;
        let oy = ty - ny * normalDotTangent;
        let oz = tz - nz * normalDotTangent;
        const tangentLength = Math.hypot(ox, oy, oz);
        if (tangentLength > 1e-8) {
            ox /= tangentLength;
            oy /= tangentLength;
            oz /= tangentLength;
        } else {
            [ox, oy, oz] = buildFallbackTangent(nx, ny, nz);
        }

        const bx = group?.bx ?? 0;
        const by = group?.by ?? 0;
        const bz = group?.bz ?? 0;
        const cx = ny * oz - nz * oy;
        const cy = nz * ox - nx * oz;
        const cz = nx * oy - ny * ox;
        const bitangentLength = Math.hypot(bx, by, bz);
        const handedness = bitangentLength > 1e-8 && cx * bx + cy * by + cz * bz < 0 ? -1 : 1;

        tangents[to] = ox;
        tangents[to + 1] = oy;
        tangents[to + 2] = oz;
        tangents[to + 3] = handedness * normalMapTangentHandednessScale;
    }

    return tangents;
}

interface TangentGroup {
    tx: number;
    ty: number;
    tz: number;
    bx: number;
    by: number;
    bz: number;
}

function accumulateTangentContribution(
    vertexIndex: number,
    nextIndex: number,
    prevIndex: number,
    tx: number,
    ty: number,
    tz: number,
    bx: number,
    by: number,
    bz: number,
    positions: ArrayLike<number>,
    normals: ArrayLike<number>,
    uvs: ArrayLike<number>,
    controlPointIndices: ArrayLike<number> | null,
    materialIndex: number,
    groups: Map<string, TangentGroup>,
    vertexGroupKeys: Array<string | null>
): void {
    const weight = computeCornerAngle(positions, vertexIndex, nextIndex, prevIndex);
    if (weight <= 1e-8) {
        return;
    }

    const key = buildTangentGroupKey(vertexIndex, tx, ty, tz, bx, by, bz, positions, normals, uvs, controlPointIndices, materialIndex);
    let group = groups.get(key);
    if (!group) {
        group = { tx: 0, ty: 0, tz: 0, bx: 0, by: 0, bz: 0 };
        groups.set(key, group);
    }

    group.tx += tx * weight;
    group.ty += ty * weight;
    group.tz += tz * weight;
    group.bx += bx * weight;
    group.by += by * weight;
    group.bz += bz * weight;
    vertexGroupKeys[vertexIndex] ??= key;
}

function buildTangentGroupKey(
    vertexIndex: number,
    tx: number,
    ty: number,
    tz: number,
    bx: number,
    by: number,
    bz: number,
    positions: ArrayLike<number>,
    normals: ArrayLike<number>,
    uvs: ArrayLike<number>,
    controlPointIndices: ArrayLike<number> | null,
    materialIndex: number
): string {
    const po = vertexIndex * 3;
    const no = vertexIndex * 3;
    const uo = vertexIndex * 2;
    const [nx, ny, nz] = normalizeVector(normals[no], normals[no + 1], normals[no + 2]);
    const handedness = computeTangentHandedness(nx, ny, nz, tx, ty, tz, bx, by, bz);
    const positionKey = controlPointIndices
        ? `cp:${controlPointIndices[vertexIndex]}`
        : `p:${quantizeTangentKey(positions[po])},${quantizeTangentKey(positions[po + 1])},${quantizeTangentKey(positions[po + 2])}`;
    return [
        positionKey,
        quantizeTangentKey(nx),
        quantizeTangentKey(ny),
        quantizeTangentKey(nz),
        quantizeTangentKey(uvs[uo]),
        quantizeTangentKey(uvs[uo + 1]),
        handedness,
        materialIndex,
    ].join("|");
}

function computeTangentHandedness(nx: number, ny: number, nz: number, tx: number, ty: number, tz: number, bx: number, by: number, bz: number): 1 | -1 {
    const cx = ny * tz - nz * ty;
    const cy = nz * tx - nx * tz;
    const cz = nx * ty - ny * tx;
    return cx * bx + cy * by + cz * bz < 0 ? -1 : 1;
}

function computeCornerAngle(positions: ArrayLike<number>, vertexIndex: number, nextIndex: number, prevIndex: number): number {
    const vo = vertexIndex * 3;
    const no = nextIndex * 3;
    const po = prevIndex * 3;
    const ax = positions[no] - positions[vo];
    const ay = positions[no + 1] - positions[vo + 1];
    const az = positions[no + 2] - positions[vo + 2];
    const bx = positions[po] - positions[vo];
    const by = positions[po + 1] - positions[vo + 1];
    const bz = positions[po + 2] - positions[vo + 2];
    const aLength = Math.hypot(ax, ay, az);
    const bLength = Math.hypot(bx, by, bz);
    if (aLength <= 1e-8 || bLength <= 1e-8) {
        return 0;
    }
    const dot = (ax * bx + ay * by + az * bz) / (aLength * bLength);
    return Math.acos(Math.max(-1, Math.min(1, dot)));
}

function normalizeVector(x: number, y: number, z: number): [number, number, number] {
    const length = Math.hypot(x, y, z);
    return length > 1e-8 ? [x / length, y / length, z / length] : [0, 0, 1];
}

function quantizeTangentKey(value: number): number {
    const quantized = Math.round(value * 1e6);
    return Object.is(quantized, -0) ? 0 : quantized;
}

function buildFallbackTangent(nx: number, ny: number, nz: number): [number, number, number] {
    const ax = Math.abs(nx) < 0.9 ? 1 : 0;
    const ay = ax === 1 ? 0 : 1;
    const dot = nx * ax + ny * ay;
    let tx = ax - nx * dot;
    let ty = ay - ny * dot;
    let tz = -nz * dot;
    const length = Math.hypot(tx, ty, tz);
    if (length <= 1e-8) {
        return [1, 0, 0];
    }
    tx /= length;
    ty /= length;
    tz /= length;
    return [tx, ty, tz];
}

function buildMorphTargetData(
    shape: FBXShapeData,
    cpIndices: Uint32Array,
    basePositions: FloatArray,
    baseNormals: FloatArray | null,
    deltaMatrix: Matrix | null,
    normalMatrix: Matrix | null,
    unitScaleFactor: number
): { positions: Float32Array; normals: Float32Array | null } | null {
    const vertexCount = basePositions.length / 3;
    const targetPositions = new Float32Array(vertexCount * 3);
    const hasNormals = shape.normals !== null && baseNormals !== null;
    const targetNormals = hasNormals ? new Float32Array(vertexCount * 3) : null;

    for (let i = 0; i < targetPositions.length; i++) {
        targetPositions[i] = basePositions[i];
    }
    if (targetNormals && baseNormals) {
        for (let i = 0; i < targetNormals.length; i++) {
            targetNormals[i] = baseNormals[i];
        }
    }

    const cpToShapeIdx = new Map<number, number>();
    for (let i = 0; i < shape.indices.length; i++) {
        cpToShapeIdx.set(shape.indices[i], i);
    }

    for (let vi = 0; vi < vertexCount; vi++) {
        const cpIdx = cpIndices[vi];
        const shapeIdx = cpToShapeIdx.get(cpIdx);
        if (shapeIdx === undefined) {
            continue;
        }

        let dx = shape.vertices[shapeIdx * 3];
        let dy = shape.vertices[shapeIdx * 3 + 1];
        let dz = shape.vertices[shapeIdx * 3 + 2];

        if (deltaMatrix) {
            const rv = Vector3.TransformNormal(new Vector3(dx, dy, dz), deltaMatrix);
            dx = rv.x;
            dy = rv.y;
            dz = rv.z;
        }

        if (unitScaleFactor !== 1) {
            dx *= unitScaleFactor;
            dy *= unitScaleFactor;
            dz *= unitScaleFactor;
        }

        targetPositions[vi * 3] += dx;
        targetPositions[vi * 3 + 1] += dy;
        targetPositions[vi * 3 + 2] += dz;

        if (targetNormals && shape.normals) {
            let nx = shape.normals[shapeIdx * 3];
            let ny = shape.normals[shapeIdx * 3 + 1];
            let nz = shape.normals[shapeIdx * 3 + 2];
            if (normalMatrix) {
                const rn = Vector3.TransformNormal(new Vector3(nx, ny, nz), normalMatrix);
                if (rn.lengthSquared() > 0) {
                    rn.normalize();
                }
                nx = rn.x;
                ny = rn.y;
                nz = rn.z;
            }
            targetNormals[vi * 3] += nx;
            targetNormals[vi * 3 + 1] += ny;
            targetNormals[vi * 3 + 2] += nz;
        }
    }

    return { positions: targetPositions, normals: targetNormals };
}

function calculateBlendShapeInfluences(deformPercent: number, fullWeights: number[] | null, shapeCount: number): number[] {
    if (shapeCount <= 0) {
        return [];
    }
    if (!fullWeights || fullWeights.length !== shapeCount || shapeCount === 1) {
        const denominator = fullWeights?.[0] && fullWeights[0] !== 0 ? fullWeights[0] : 100;
        return [clamp01(deformPercent / denominator)];
    }

    const influences = new Array<number>(shapeCount).fill(0);
    if (deformPercent <= fullWeights[0]) {
        influences[0] = fullWeights[0] === 0 ? (deformPercent <= 0 ? 1 : 0) : clamp01(deformPercent / fullWeights[0]);
        return influences;
    }

    for (let i = 1; i < fullWeights.length; i++) {
        const previousWeight = fullWeights[i - 1];
        const nextWeight = fullWeights[i];
        if (deformPercent > nextWeight) {
            continue;
        }

        const range = nextWeight - previousWeight;
        if (Math.abs(range) < 1e-6) {
            influences[i] = 1;
            return influences;
        }

        const t = clamp01((deformPercent - previousWeight) / range);
        influences[i - 1] = 1 - t;
        influences[i] = t;
        return influences;
    }

    influences[shapeCount - 1] = 1;
    return influences;
}

function clamp01(value: number): number {
    return Math.max(0, Math.min(1, value));
}

function collectAnimationSampleTimes(curveNodes: FBXCurveNodeData[], fps: number, startTime: number, stopTime: number): number[] {
    let minTime = Number.POSITIVE_INFINITY;
    let maxTime = Number.NEGATIVE_INFINITY;
    const sourceTimes = new Set<number>();

    for (const curveNode of curveNodes) {
        for (const curve of curveNode.curves) {
            for (const key of curve.keys) {
                minTime = Math.min(minTime, key.time);
                maxTime = Math.max(maxTime, key.time);
                if (key.time >= startTime && key.time <= stopTime) {
                    sourceTimes.add(key.time);
                }
            }
        }
    }

    if (!Number.isFinite(minTime) || !Number.isFinite(maxTime)) {
        return [];
    }

    const rangeStart = stopTime > startTime ? startTime : minTime;
    const rangeStop = stopTime > startTime ? stopTime : maxTime;
    const times = new Set<number>([rangeStart, rangeStop, ...Array.from(sourceTimes)]);
    const startFrame = Math.ceil(rangeStart * fps);
    const stopFrame = Math.floor(rangeStop * fps);

    for (let frame = startFrame; frame <= stopFrame; frame++) {
        times.add(frame / fps);
    }

    return Array.from(times).sort((a, b) => a - b);
}

function areQuaternionKeysConstant(keys: { frame: number; value: Quaternion }[]): boolean {
    if (keys.length < 2) {
        return true;
    }
    const first = keys[0].value;
    for (let i = 1; i < keys.length; i++) {
        const value = keys[i].value;
        if (Math.abs(value.x - first.x) > 0.0001 || Math.abs(value.y - first.y) > 0.0001 || Math.abs(value.z - first.z) > 0.0001 || Math.abs(value.w - first.w) > 0.0001) {
            return false;
        }
    }
    return true;
}

RegisterSceneLoaderPlugin(new FBXFileLoader());

function buildScalarAnimationKeys(curve: FBXCurveData, fps: number, startTime: number, stopTime: number, mapValue: (value: number) => number): IAnimationKey[] {
    const range = getCurveSampleRange(curve, startTime, stopTime);
    const keys = curve.keys
        .filter((key) => key.time >= range.start && key.time <= range.stop)
        .map((key) => ({
            source: key,
            frame: key.time * fps,
            value: mapValue(key.value),
        }));

    if (!keys.some((key) => Math.abs(key.source.time - range.start) < 1e-6)) {
        keys.unshift({
            source: {
                time: range.start,
                value: sampleFBXCurveAtTime(curve, range.start) ?? 0,
                interpolation: "linear",
            },
            frame: range.start * fps,
            value: mapValue(sampleFBXCurveAtTime(curve, range.start) ?? 0),
        });
    }

    if (!keys.some((key) => Math.abs(key.source.time - range.stop) < 1e-6)) {
        keys.push({
            source: {
                time: range.stop,
                value: sampleFBXCurveAtTime(curve, range.stop) ?? 0,
                interpolation: "linear",
            },
            frame: range.stop * fps,
            value: mapValue(sampleFBXCurveAtTime(curve, range.stop) ?? 0),
        });
    }

    const animationKeys: IAnimationKey[] = keys.map((key) => ({
        frame: key.frame,
        value: key.value,
    }));

    for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i].source;
        const nextAnimationKey = animationKeys[i + 1];

        if (key.interpolation === "constant") {
            animationKeys[i].interpolation = AnimationKeyInterpolation.STEP;
            continue;
        }

        if (key.interpolation !== "cubic") {
            continue;
        }

        const nextKey = keys[i + 1].source;
        const duration = Math.max(nextKey.time - key.time, 1e-6);
        const linearSlope = (nextKey.value - key.value) / duration;
        animationKeys[i].outTangent = mapSlope(key.rightSlope ?? linearSlope, mapValue) / fps;
        nextAnimationKey.inTangent = mapSlope(key.nextLeftSlope ?? linearSlope, mapValue) / fps;
    }

    return animationKeys;
}

function mapSlope(slope: number, mapValue: (value: number) => number): number {
    return mapValue(slope) - mapValue(0);
}

function getCurveSampleRange(curve: FBXCurveData, startTime: number, stopTime: number): { start: number; stop: number } {
    if (stopTime > startTime) {
        return { start: startTime, stop: stopTime };
    }

    return {
        start: curve.keys[0]?.time ?? 0,
        stop: curve.keys[curve.keys.length - 1]?.time ?? 0,
    };
}
