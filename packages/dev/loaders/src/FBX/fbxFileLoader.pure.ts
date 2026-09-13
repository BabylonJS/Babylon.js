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
import { Mesh } from "core/Meshes/mesh.pure";
import { LinesMesh } from "core/Meshes/linesMesh.pure";
import { SubMesh } from "core/Meshes/subMesh";
import { VertexData } from "core/Meshes/mesh.vertexData";
import { StandardMaterial } from "core/Materials/standardMaterial.pure";
import { PBRMaterial } from "core/Materials/PBR/pbrMaterial.pure";
import { Material } from "core/Materials/material";
import { MultiMaterial } from "core/Materials/multiMaterial.pure";
import { type ITextureCreationOptions, Texture } from "core/Materials/Textures/texture.pure";
import { type BaseTexture } from "core/Materials/Textures/baseTexture";
import { Color3 } from "core/Maths/math.color.pure";
import { Vector3, Quaternion, Matrix } from "core/Maths/math.vector.pure";
import { TransformNode } from "core/Meshes/transformNode.pure";
import { Skeleton } from "core/Bones/skeleton";
import { Bone } from "core/Bones/bone";
import { Animation } from "core/Animations/animation.pure";
import { AnimationGroup } from "core/Animations/animationGroup.pure";
import { AnimationKeyInterpolation, type IAnimationKey } from "core/Animations/animationKey";
import { MorphTarget } from "core/Morph/morphTarget";
import { MorphTargetManager } from "core/Morph/morphTargetManager";
import { Camera } from "core/Cameras/camera.pure";
import { FreeCamera } from "core/Cameras/freeCamera.pure";
import { PointLight } from "core/Lights/pointLight.pure";
import { DirectionalLight } from "core/Lights/directionalLight.pure";
import { SpotLight } from "core/Lights/spotLight.pure";
import { type Light } from "core/Lights/light";
import { AssetContainer } from "core/assetContainer";
import { GetMimeType } from "core/Misc/fileTools.pure";

import { parseBinaryFBX } from "./parsers/fbxBinaryParser";
import { parseAsciiFBX } from "./parsers/fbxAsciiParser";
import { interpretFBX, type FBXModelData, type FBXSceneData, type FBXCameraData, type FBXLightData } from "./interpreter/fbxInterpreter";
import { type FBXDocument } from "./types/fbxTypes";
import { type FBXGeometryData } from "./interpreter/geometry";
import { type FBXCurveGeometryData } from "./interpreter/nurbs";
import { FBXConstraintBehavior, type FBXConstraintBehaviorTarget } from "./fbxConstraintBehavior";
import { type FBXMaterialData, type FBXTextureRef } from "./interpreter/materials";
import { isPbrShaderType, mapColor, mapScalar } from "./interpreter/materialModel";
import { type FBXSkinData, type FBXBoneData } from "./interpreter/skeleton";
import { type FBXRigData, type FBXSkinBindingData } from "./interpreter/rig";
import { type FBXBlendShapeData, type FBXShapeData } from "./interpreter/blendShapes";
import {
    evaluateLayeredChannel,
    isChannelSteppedAt,
    sampleFBXCurveAtTime,
    type FBXAnimationLayerData,
    type FBXAnimationStackData,
    type FBXCurveData,
    type FBXCurveNodeData,
    type FBXUnsupportedCurveNodeData,
} from "./interpreter/animation";
import {
    computeFBXGeometricDeltaMatrix,
    computeFBXGeometricMatrix,
    computeFBXGeometricNormalMatrix,
    computeFBXLocalMatrix,
    eulerToMatrix,
    eulerToMatrixXYZ,
} from "./interpreter/transform";
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
    /**
     * Which Babylon material to build.
     * - "auto" (default): PBRMaterial for physically based FBX materials (Standard Surface, Arnold, 3ds Max Physical,
     *   3ds Max PBR, glTF, OpenPBR, Stingray PBS) and StandardMaterial for classic Lambert/Phong materials.
     * - "standard": always StandardMaterial (PBR parameters are approximated).
     * - "pbr": always PBRMaterial (Lambert/Phong parameters are converted).
     */
    materials?: "auto" | "standard" | "pbr";
    /**
     * Unit conversion applied at the root of the loaded hierarchy.
     * - "preserve" (default): keep the file's units (1 Babylon unit = 1 FBX unit).
     * - "meters": scale so that 1 Babylon unit is 1 meter, using the file's UnitScaleFactor.
     * - a number: centimeters per Babylon unit (100 = meters, 1 = centimeters, 2.54 = inches).
     */
    unitScale?: "preserve" | "meters" | number;
    /**
     * Share vertex data between models that reference the same FBX geometry (default true). Skinned meshes are
     * never shared.
     */
    shareGeometry?: boolean;
    /**
     * Called for every recoverable issue found while loading (unsupported features, malformed data that was
     * skipped, approximations). The same list is stored on the root node's metadata as `fbxDiagnostics`.
     */
    onWarning?: (warning: FBXLoaderWarning) => void;
    /**
     * Segments per knot span when tessellating NURBS surfaces. Zero or undefined uses the subdivision stored in
     * the file (usually 4), capped at 16.
     */
    nurbsSubdivision?: number;
    /** How curve geometry (Line, NurbsCurve) is imported: as lines meshes (default) or skipped. */
    curves?: "lines" | "skip";
    /**
     * Constraints (aim, parent, position, rotation, scale): "apply" (default) attaches an `FBXConstraintBehavior`
     * to each constrained node so it is solved before every render, "metadata" only records them on the nodes.
     * IK chains are always metadata only.
     */
    constraints?: "apply" | "metadata";
}

/** A recoverable issue reported while loading an FBX file. */
export interface FBXLoaderWarning {
    /** Which part of the loader reported the issue */
    source: "scene" | "model" | "geometry" | "skin" | "rig" | "animation" | "blendShape" | "camera" | "light";
    /** Human readable description */
    message: string;
    /** Name of the affected object, when known */
    objectName?: string;
    /** Structured details from the interpreter, when any */
    details?: unknown;
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
    /** Frame rate of the file being loaded (GlobalSettings TimeMode); animation is baked at this rate. */
    private _frameRate = 30;
    /** Layers of the animation stack currently being converted; used by the transform samplers. */
    private _activeLayers: readonly FBXAnimationLayerData[] = [];
    /** Parent model per model id, for inherit-mode aware sampling. */
    private _parentModelById = new Map<number, FBXModelData>();
    /** Curve nodes per model id for the stack currently being converted. */
    private _curveNodesByModelId = new Map<number, FBXCurveNodeData[]>();
    /** Helper nodes inserted above models whose InheritType is not RSrs. */
    private _inheritScaleHelpers = new Map<number, TransformNode>();
    /** First mesh built per (geometry, geometric transform), for geometry sharing between instances. */
    private _meshByGeometryKey = new Map<string, Mesh>();
    /** Instance mesh -> source mesh whose geometry it shares. */
    private _instanceSource = new Map<Mesh, Mesh>();

    /**
     * Creates a new FBX loader.
     * @param options - Options controlling FBX loading behavior
     */
    public constructor(options: FBXFileLoaderOptions = {}) {
        this._options = {
            normalMapCoordinateSystem: options.normalMapCoordinateSystem ?? "y-up",
            materials: options.materials ?? "auto",
            unitScale: options.unitScale ?? "preserve",
            shareGeometry: options.shareGeometry ?? true,
            onWarning: options.onWarning ?? (() => {}),
            nurbsSubdivision: options.nurbsSubdivision ?? 0,
            curves: options.curves ?? "lines",
            constraints: options.constraints ?? "apply",
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
        const fbxScene = this._parseAndInterpret(data, _onProgress);
        const result = this._buildScene(fbxScene, scene, rootUrl, meshesNames);
        _onProgress?.({ lengthComputable: true, loaded: 3, total: 3 });
        return result;
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
        const fbxScene = this._parseAndInterpret(data, _onProgress);
        this._buildScene(fbxScene, scene, rootUrl, null);
        _onProgress?.({ lengthComputable: true, loaded: 3, total: 3 });
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
        const fbxScene = this._parseAndInterpret(data, _onProgress);

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
            // Lines meshes own an internal colour shader; it is not an asset of the file.
            if (mesh instanceof LinesMesh) {
                continue;
            }
            this._addMaterialToContainer(mesh.material, container);
        }

        // Remove all added objects from the scene (container owns them)
        this._setAssetContainer(container);
        container.removeAllFromScene();
        _onProgress?.({ lengthComputable: true, loaded: 3, total: 3 });

        return container;
    }

    // ── Parsing ────────────────────────────────────────────────────────────

    /** Parses and interprets the file, reporting the two milestones through the progress callback. */
    private _parseAndInterpret(data: unknown, onProgress?: (event: ISceneLoaderProgressEvent) => void): FBXSceneData {
        const doc = this._parse(data);
        onProgress?.({ lengthComputable: true, loaded: 1, total: 3 });
        const fbxScene = interpretFBX(doc, { nurbsSubdivision: this._options.nurbsSubdivision > 0 ? this._options.nurbsSubdivision : undefined });
        onProgress?.({ lengthComputable: true, loaded: 2, total: 3 });
        return fbxScene;
    }

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

        // Try ASCII. Most files start with "; FBX x.y.z project file", but the header comment is optional:
        // some exporters start straight at FBXHeaderExtension or even at Objects.
        const text = new TextDecoder("utf-8").decode(buffer);
        const head = text.substring(0, 4096);
        if (head.trimStart().startsWith(FBX_ASCII_MAGIC) || /^\s*(?:;[^\n]*\n\s*)*(?:FBXHeaderExtension|Definitions|Objects|Connections)\s*:/.test(head)) {
            return parseAsciiFBX(text);
        }

        throw new Error("FBXFileLoader: unrecognized FBX format");
    }

    // ── Scene Building ─────────────────────────────────────────────────────

    private _buildScene(fbxScene: FBXSceneData, scene: Scene, rootUrl: string, meshesNames: string | readonly string[] | null | undefined): IFBXSceneLoaderAsyncResult {
        const nameFilter = this._buildNameFilter(meshesNames);
        this._frameRate = fbxScene.frameRate > 0 ? fbxScene.frameRate : 30;
        this._inheritScaleHelpers = new Map();

        // Create materials
        const materialCache = new Map<number, Material>();
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

        this._rigBoneModelIds = new Set();
        for (const rig of fbxScene.rigs) {
            for (const bone of rig.bones) {
                this._rigBoneModelIds.add(bone.modelId);
            }
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
        this._parentModelById = new Map();
        const collectModelData = (models: FBXModelData[], parent: FBXModelData | null) => {
            for (const m of models) {
                modelIdToData.set(m.id, m);
                if (parent) {
                    this._parentModelById.set(m.id, parent);
                }
                collectModelData(m.children, m);
            }
        };
        collectModelData(fbxScene.rootModels, null);
        const cullingConflictMaterialIds = FBXFileLoader._collectCullingConflictMaterialIds(fbxScene.rootModels);
        const cullingMaterialCloneCache = new Map<Material, Material>();

        // Build the FBX hierarchy under the same handedness conversion root that
        // Babylon's glTF loader uses when loading right-handed assets into a
        // left-handed scene. If the FBX file declares a non-Y-up scene basis,
        // add a child axis-conversion root so model/bind math stays in FBX space.
        const rootNode = new TransformNode("__fbx_root__", scene);
        if (!scene.useRightHandedSystem) {
            rootNode.rotation.y = Math.PI;
            rootNode.scaling.z = -1;
        }
        // FBX units: one file unit is UnitScaleFactor centimeters.
        const unitScale = this._options.unitScale;
        const cmPerTargetUnit = unitScale === "preserve" ? 0 : unitScale === "meters" ? 100 : unitScale;
        if (cmPerTargetUnit > 0 && fbxScene.unitScaleFactor > 0) {
            const factor = fbxScene.unitScaleFactor / cmPerTargetUnit;
            rootNode.scaling.scaleInPlace(factor);
        }
        rootNode.metadata = { ...((rootNode.metadata as object) ?? {}), fbxUnitScaleFactor: fbxScene.unitScaleFactor, fbxFrameRate: fbxScene.frameRate };
        this._meshByGeometryKey = new Map();
        this._instanceSource = new Map();

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
        this._linkSkeletonsToTransformNodes(fbxScene.rigs, skeletonByRigId, modelIdToNode, transformNodes, scene);

        // Link non-skinned child meshes/nodes to their parent bones so they
        // follow skeletal animation. Preserve their current world matrix when
        // switching from the FBX model hierarchy to Babylon's bone parent.
        for (const rig of fbxScene.rigs) {
            const skeleton = skeletonByRigId.get(rig.id);
            if (!skeleton) {
                continue;
            }

            const skinnedMesh = meshes.find((m) => m.skeleton === skeleton) ?? null;
            const boneReferenceNode = skinnedMesh ?? rootNode;
            const boneTransformNodes = new Set<TransformNode>();
            for (const skeletonBone of skeleton.bones) {
                const transformNode = skeletonBone.getTransformNode();
                if (transformNode) {
                    boneTransformNodes.add(transformNode);
                }
            }

            // Children of joints (props, end effectors, meshes) stay parented to the joint's TransformNode. Bones are
            // linked to those nodes, so the hierarchy already follows the animation; attaching to the bone's skinning
            // matrix would move them into the skinned mesh's space instead of the node's.
            void boneTransformNodes;
            void boneReferenceNode;
        }

        // Apply blend shapes (morph targets) to meshes
        if (fbxScene.blendShapes.length > 0) {
            this._applyBlendShapes(fbxScene.blendShapes, meshes, scene);
            for (const [instance, source] of Array.from(this._instanceSource)) {
                if (source.morphTargetManager && !instance.morphTargetManager) {
                    instance.morphTargetManager = source.morphTargetManager;
                }
            }
        }

        // Create cameras
        const cameras: FreeCamera[] = [];
        const cameraByAttributeId = new Map<number, FreeCamera>();
        for (const camData of fbxScene.cameras) {
            const cam = this._createCamera(camData, modelIdToNode, scene);
            if (cam) {
                cameras.push(cam);
                cameraByAttributeId.set(camData.attributeId, cam);
            }
        }

        // Create lights
        const sceneLights: (PointLight | DirectionalLight | SpotLight)[] = [];
        const lightByAttributeId = new Map<number, Light>();
        for (const lightData of fbxScene.lights) {
            const light = this._createLight(lightData, modelIdToNode, scene);
            if (light) {
                sceneLights.push(light);
                lightByAttributeId.set(lightData.attributeId, light);
            }
        }

        this._applyConstraints(fbxScene, modelIdToNode, rootNode, scene);
        this._reportDiagnostics(fbxScene, rootNode, modelIdToNode);

        // Create animation groups
        const animationGroups: AnimationGroup[] = [];
        for (const animStack of fbxScene.animations) {
            const group = this._createAnimationGroup(animStack, fbxScene.rigs, skeletonByRigId, scene, modelIdToNode, modelIdToData, meshes, {
                cameraByAttributeId,
                lightByAttributeId,
                materialCache,
            });
            if (group) {
                animationGroups.push(group);
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
        parentNode: Nullable<TransformNode>,
        assetRoot: TransformNode,
        parentFBXWorldMatrix: Matrix,
        materialCache: Map<number, Material>,
        nameFilter: ((name: string) => boolean) | null,
        meshes: Mesh[],
        transformNodes: TransformNode[],
        skeletonByGeometryId: Map<number, Skeleton>,
        skinByGeometryId: Map<number, FBXSkinData>,
        skinBindingByGeometryId: Map<number, FBXSkinBindingData>,
        modelIdToNode: Map<number, TransformNode>,
        cullingConflictMaterialIds: Set<number>,
        cullingMaterialCloneCache: Map<Material, Material>
    ): void {
        let parent = parentNode;
        const localMatrix = FBXFileLoader._computeFBXModelLocalMatrix(model);
        const fbxWorldMatrix = localMatrix.multiply(parentFBXWorldMatrix);

        // Nodes with RrSs / Rrs inheritance do not inherit their parent's scale the normal way. Insert a helper that
        // cancels the parent scale and re-express the local transform in that unscaled frame (see ufbx's
        // inherit-mode evaluation). Skeleton bones with Rrs are handled by the rig code instead.
        const parentModel = this._parentModelById.get(model.id);
        const parentModelNode = parentModel ? modelIdToNode.get(parentModel.id) : undefined;
        if (
            parent &&
            parentModel &&
            parentModelNode &&
            parent === parentModelNode &&
            model.inheritType !== 1 &&
            !this._isRigBone(model.id) &&
            !this._isRigBone(parentModel.id) &&
            !(parentModel.geometry && skinByGeometryId.has(parentModel.geometry.id))
        ) {
            // The helper sits beside the parent and carries the parent's rotation and translation with unit scale,
            // i.e. the parent's "unscaled" frame. This avoids inverting the parent scale (which may be zero).
            const helper = new TransformNode(`${model.name}__fbx_inheritScale`, scene);
            helper.parent = parentModelNode.parent;
            helper.position.copyFrom(parentModelNode.position);
            helper.rotationQuaternion = parentModelNode.rotationQuaternion ? parentModelNode.rotationQuaternion.clone() : Quaternion.FromEulerVector(parentModelNode.rotation);
            helper.scaling.set(1, 1, 1);
            transformNodes.push(helper);
            this._inheritScaleHelpers.set(model.id, helper);
            parent = helper;
        }

        if (model.geometry && model.geometry.indices.length > 0 && (!nameFilter || nameFilter(model.name))) {
            // Create mesh
            const skeleton = skeletonByGeometryId.get(model.geometry.id);
            const skin = skinByGeometryId.get(model.geometry.id);
            const skinBinding = skinBindingByGeometryId.get(model.geometry.id);

            if (skeleton && skin) {
                skeleton.needInitialSkinMatrix = true;
            }

            // Models referencing the same geometry (with the same geometric transform) share one Babylon geometry.
            const geometryKey = `${model.geometry.id}|${model.geometricTranslation.join(",")}|${model.geometricRotation.join(",")}|${model.geometricScaling.join(",")}`;
            const source = !skeleton && this._options.shareGeometry ? this._meshByGeometryKey.get(geometryKey) : undefined;
            let mesh: Mesh;
            if (source) {
                mesh = source.clone(model.name, null, true);
                mesh.sideOrientation = source.sideOrientation;
                mesh.metadata = { ...((source.metadata as object) ?? {}), fbxInstanceOf: source.name };
                this._instanceSource.set(mesh, source);
            } else {
                mesh = this._createMesh(model, model.geometry, scene, skeleton, skin, skinBinding);
                if (!skeleton) {
                    this._meshByGeometryKey.set(geometryKey, mesh);
                }
            }

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
                this._applyRestTRS(mesh, model);
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
        } else if (model.curve && this._options.curves !== "skip" && model.curve.polylines.length > 0 && (!nameFilter || nameFilter(model.name))) {
            const lines = this._createLinesMesh(model, model.curve, scene);
            if (parent) {
                lines.parent = parent;
            }
            this._applyRestTRS(lines, model);
            meshes.push(lines);
            modelIdToNode.set(model.id, lines);
            FBXFileLoader._applyModelMetadata(lines, model);

            for (const child of model.children) {
                this._buildModel(
                    child,
                    scene,
                    lines,
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
            if ((model.geometry || model.curve) && nameFilter && !FBXFileLoader._modelSubtreeMatchesNameFilter(model, nameFilter)) {
                return;
            }

            // Transform node (Null type or no geometry)
            const transformNode = new TransformNode(model.name, scene);
            if (parent) {
                transformNode.parent = parent;
            }

            // Apply full FBX transform chain
            this._applyRestTRS(transformNode, model);

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
            FBXFileLoader._applyLodGroup(model, modelIdToNode);
        }
    }

    private _linkSkeletonsToTransformNodes(
        rigs: FBXRigData[],
        skeletonByRigId: Map<string, Skeleton>,
        modelIdToNode: Map<number, TransformNode>,
        transformNodes: TransformNode[],
        scene: Scene
    ): void {
        for (const rig of rigs) {
            const skeleton = skeletonByRigId.get(rig.id);
            if (!skeleton) {
                continue;
            }

            for (const boneData of rig.bones) {
                const bone = this._getSourceBone(skeleton, boneData.index);
                const boneNode = modelIdToNode.get(boneData.modelId);
                if (!bone || !boneNode) {
                    continue;
                }

                const scaleCompensationHelper = this._getScaleCompensationHelper(skeleton, boneData.index);
                if (scaleCompensationHelper) {
                    const helperNode = new TransformNode(scaleCompensationHelper.name, scene);
                    helperNode.parent = boneNode.parent;
                    boneNode.parent = helperNode;
                    FBXFileLoader._applyMatrixToTransform(helperNode, scaleCompensationHelper.getLocalMatrix());
                    FBXFileLoader._applyMatrixToTransform(boneNode, bone.getLocalMatrix());
                    scaleCompensationHelper.linkTransformNode(helperNode);
                    transformNodes.push(helperNode);
                } else {
                    FBXFileLoader._applyMatrixToTransform(boneNode, bone.getLocalMatrix());
                }

                bone.linkTransformNode(boneNode);
            }
        }
    }

    private static _modelSubtreeMatchesNameFilter(model: FBXModelData, nameFilter: (name: string) => boolean): boolean {
        for (const child of model.children) {
            if (child.geometry && child.subType === "Mesh" && nameFilter(child.name)) {
                return true;
            }
            if (FBXFileLoader._modelSubtreeMatchesNameFilter(child, nameFilter)) {
                return true;
            }
        }
        return false;
    }

    private static _applyModelMetadata(node: TransformNode | Mesh, model: FBXModelData): void {
        if (!model.customProperties && model.diagnostics.length === 0 && !model.displayLayer && !model.lodGroup) {
            return;
        }

        node.metadata = {
            ...((node.metadata as object) ?? {}),
            ...(model.customProperties ? { fbxCustomProperties: model.customProperties, fbxUserProperties: model.customProperties } : {}),
            ...(model.diagnostics.length > 0 ? { fbxDiagnostics: model.diagnostics } : {}),
            ...(model.displayLayer
                ? { fbxDisplayLayer: { name: model.displayLayer.name, show: model.displayLayer.show, freeze: model.displayLayer.freeze, color: model.displayLayer.color } }
                : {}),
            ...(model.lodGroup ? { fbxLodGroup: model.lodGroup } : {}),
        };
        // Hidden display layers hide their members, as in the authoring application.
        if (model.displayLayer && !model.displayLayer.show) {
            node.setEnabled(false);
        }
    }

    /**
     * Wires a LodGroup's children as Babylon LOD levels: the first child holds the highest detail; every further
     * child replaces it beyond the group's threshold distance (or screen coverage when thresholds are percentages).
     */
    private static _applyLodGroup(model: FBXModelData, modelIdToNode: Map<number, TransformNode>): void {
        const lod = model.lodGroup;
        if (!lod || model.children.length < 2) {
            return;
        }
        const meshesOf = (child: FBXModelData): Mesh[] => {
            const node = modelIdToNode.get(child.id);
            if (!node) {
                return [];
            }
            const meshes: Mesh[] = node instanceof Mesh ? [node] : [];
            for (const m of node.getChildMeshes(false)) {
                if (m instanceof Mesh) {
                    meshes.push(m);
                }
            }
            return meshes;
        };
        const base = meshesOf(model.children[0]);
        for (let level = 1; level < model.children.length; level++) {
            const levelMeshes = meshesOf(model.children[level]);
            const threshold = lod.thresholds[level - 1] ?? lod.thresholds[lod.thresholds.length - 1] ?? 0;
            for (let i = 0; i < base.length; i++) {
                const target = levelMeshes[i] ?? null;
                if (lod.relative) {
                    base[i].useLODScreenCoverage = true;
                    base[i].addLODLevel(threshold / 100, target);
                } else {
                    base[i].addLODLevel(threshold, target);
                }
                if (target) {
                    target.metadata = { ...((target.metadata as object) ?? {}), fbxLodLevel: level };
                }
            }
        }
    }

    /** Builds a lines mesh from Line or tessellated NurbsCurve geometry, applying the model's geometric transform. */
    private _createLinesMesh(model: FBXModelData, curve: FBXCurveGeometryData, scene: Scene): LinesMesh {
        const lines = new LinesMesh(model.name, scene);
        const positions: number[] = [];
        const indices: number[] = [];
        for (const polyline of curve.polylines) {
            const count = polyline.length / 3;
            if (count < 2) {
                continue;
            }
            const base = positions.length / 3;
            for (let i = 0; i < polyline.length; i++) {
                positions.push(polyline[i]);
            }
            for (let i = 0; i < count - 1; i++) {
                indices.push(base + i, base + i + 1);
            }
        }
        const geometricMatrix = FBXFileLoader._computeFBXGeometricMatrix(model.geometricTranslation, model.geometricRotation, model.geometricScaling);
        if (!geometricMatrix.equals(Matrix.Identity())) {
            for (let i = 0; i < positions.length; i += 3) {
                const v = Vector3.TransformCoordinates(new Vector3(positions[i], positions[i + 1], positions[i + 2]), geometricMatrix);
                positions[i] = v.x;
                positions[i + 1] = v.y;
                positions[i + 2] = v.z;
            }
        }
        const vertexData = new VertexData();
        vertexData.positions = positions;
        vertexData.indices = indices;
        vertexData.applyToMesh(lines);
        if (curve.color) {
            lines.color = new Color3(curve.color[0], curve.color[1], curve.color[2]);
        }
        lines.metadata = { ...((lines.metadata as object) ?? {}), fbxCurveType: curve.kind, fbxCurveSegments: curve.polylines.length };
        return lines;
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
        materialCache: Map<number, Material>,
        scene: Scene,
        cullingConflictMaterialIds: Set<number>,
        cullingMaterialCloneCache: Map<Material, Material>
    ): void {
        const matIndices = model.geometry!.materialIndices!;
        const recorded = (mesh.metadata as { fbxSubMeshMaterialIndices?: number[] } | undefined)?.fbxSubMeshMaterialIndices;
        if (recorded) {
            // Instance of an already split mesh: the index buffer and sub-meshes are shared; only the materials differ.
            const multiMat = new MultiMaterial(model.name + "_multi", scene);
            for (const matIdx of recorded) {
                const fbxMat = model.materials[matIdx];
                const mat = fbxMat ? materialCache.get(fbxMat.id) : undefined;
                multiMat.subMaterials.push(mat ? FBXFileLoader._getModelMaterial(mat, model, cullingMaterialCloneCache, cullingConflictMaterialIds.has(fbxMat!.id)) : null);
            }
            mesh.material = multiMat;
            return;
        }
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
        mesh.metadata = { ...((mesh.metadata as object) ?? {}), fbxSubMeshMaterialIndices: sortedMatIndices };
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

    private static _getModelMaterial(material: Material, model: FBXModelData, cullingCloneCache?: Map<Material, Material>, cloneCullingOffMaterial = true): Material {
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

        const clone = material.clone(`${material.name}_CullingOff`) ?? material;
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
                if (subMaterial instanceof StandardMaterial || subMaterial instanceof PBRMaterial) {
                    this._applyStandardMaterialUVSetCoordinates(subMaterial, geometry);
                }
            }
            return;
        }
        if (material instanceof StandardMaterial || material instanceof PBRMaterial) {
            this._applyStandardMaterialUVSetCoordinates(material, geometry);
        }
    }

    private _applyStandardMaterialUVSetCoordinates(material: StandardMaterial | PBRMaterial, geometry: FBXGeometryData): void {
        for (const texture of material instanceof PBRMaterial
            ? [
                  material.albedoTexture,
                  material.bumpTexture,
                  material.emissiveTexture,
                  material.ambientTexture,
                  material.metallicTexture,
                  material.reflectivityTexture,
                  material.microSurfaceTexture,
                  material.opacityTexture,
                  material.clearCoat.texture,
                  material.clearCoat.bumpTexture,
                  material.sheen.texture,
              ]
            : [
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

        const unmodulated = (mat: Material): Material => {
            if (mat instanceof StandardMaterial && !mat.diffuseTexture) {
                const clone = mat.clone(`${mat.name}_VertexColor`);
                clone.diffuseColor = new Color3(1, 1, 1);
                return clone;
            }
            if (mat instanceof PBRMaterial && !mat.albedoTexture) {
                const clone = mat.clone(`${mat.name}_VertexColor`);
                clone.albedoColor = new Color3(1, 1, 1);
                return clone;
            }
            return mat;
        };

        if (assignedMat instanceof MultiMaterial) {
            const multiMat = new MultiMaterial(`${assignedMat.name}_VertexColor`, scene);
            multiMat.subMaterials = assignedMat.subMaterials.map((sub) => (sub ? unmodulated(sub) : sub));
            mesh.material = multiMat;
            return;
        }
        mesh.material = unmodulated(assignedMat);
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

    private _createMaterial(matData: FBXMaterialData, scene: Scene, rootUrl: string): Material {
        const mode = this._options.materials;
        const usePbr = mode === "pbr" || (mode === "auto" && isPbrShaderType(matData.model.shaderType));
        const material = usePbr ? this._createPbrMaterial(matData, scene, rootUrl) : this._createStandardMaterial(matData, scene, rootUrl);
        material.metadata = {
            ...((material.metadata as object) ?? {}),
            ...(matData.userProperties ? { fbxUserProperties: matData.userProperties } : {}),
            fbxShaderType: matData.model.shaderType,
            fbxFeatures: Object.fromEntries(Object.entries(matData.model.features).map(([k, v]) => [k, v?.enabled ?? false])),
        };
        return material;
    }

    private _createPbrMaterial(matData: FBXMaterialData, scene: Scene, rootUrl: string): PBRMaterial {
        const material = new PBRMaterial(matData.name, scene);
        const pbr = matData.model.pbr;
        const features = matData.model.features;
        const enabled = (name: keyof typeof features) => features[name]?.enabled ?? false;
        const specGloss = matData.model.shaderType === "3dsMaxPbrSpecGloss";

        const scaleColor = (c: [number, number, number] | undefined, f: number | undefined): Color3 | undefined =>
            c ? new Color3(c[0] * (f ?? 1), c[1] * (f ?? 1), c[2] * (f ?? 1)) : undefined;

        // Base colour
        const baseColor = mapColor(pbr.baseColor);
        material.albedoColor = scaleColor(baseColor, pbr.baseColor?.texture ? 1 : mapScalar(pbr.baseFactor)) ?? Color3.White();

        // Metal / rough or spec / gloss workflow
        if (specGloss) {
            material.metallic = null;
            material.roughness = null;
            material.reflectivityColor = scaleColor(mapColor(pbr.specularColor), 1) ?? Color3.White();
            material.microSurface = mapScalar(pbr.glossiness) ?? 1 - (mapScalar(pbr.roughness) ?? 0.5);
        } else {
            material.metallic = enabled("metalness") ? (mapScalar(pbr.metalness) ?? 0) : 0;
            material.roughness = mapScalar(pbr.roughness) ?? (pbr.glossiness?.value ? 1 - pbr.glossiness.value[0] : 0.5);
            if (enabled("specular") && pbr.specularFactor?.value) {
                material.metallicF0Factor = mapScalar(pbr.specularFactor) ?? 1;
            }
            if (enabled("specular")) {
                const specularColor = mapColor(pbr.specularColor);
                if (specularColor) {
                    material.metallicReflectanceColor = new Color3(specularColor[0], specularColor[1], specularColor[2]);
                }
            }
        }

        // Emission
        const emission = scaleColor(mapColor(pbr.emissionColor), pbr.emissionColor?.texture ? 1 : mapScalar(pbr.emissionFactor));
        if (emission && enabled("emission")) {
            material.emissiveColor = emission;
        } else if (emission && (emission.r > 0 || emission.g > 0 || emission.b > 0)) {
            material.emissiveColor = emission;
        }

        // Opacity / transparency
        const opacity = mapColor(pbr.opacity);
        if (opacity && enabled("opacity")) {
            material.alpha = (opacity[0] + opacity[1] + opacity[2]) / 3;
        } else if (!isPbrShaderType(matData.model.shaderType)) {
            material.alpha = FBXFileLoader._alphaFromClassicTransparency(matData);
        }
        if (material.alpha < 1) {
            material.transparencyMode = Material.MATERIAL_ALPHABLEND;
        }

        // Transmission (refraction)
        const transmission = mapScalar(pbr.transmissionFactor) ?? 0;
        if (enabled("transmission") && isPbrShaderType(matData.model.shaderType) && transmission > 0) {
            material.subSurface.isRefractionEnabled = true;
            material.subSurface.refractionIntensity = transmission;
            const tint = mapColor(pbr.transmissionColor);
            if (tint) {
                material.subSurface.tintColor = new Color3(tint[0], tint[1], tint[2]);
            }
            const ior = mapScalar(pbr.specularIor);
            if (ior && enabled("ior")) {
                material.subSurface.indexOfRefraction = ior;
            }
        } else {
            const ior = mapScalar(pbr.specularIor);
            if (ior && enabled("ior") && ior > 1) {
                material.indexOfRefraction = ior;
            }
        }

        // Clear coat
        const coat = mapScalar(pbr.coatFactor) ?? 0;
        if ((enabled("coat") && coat > 0) || pbr.coatFactor?.texture) {
            material.clearCoat.isEnabled = true;
            material.clearCoat.intensity = coat;
            const coatRough = mapScalar(pbr.coatRoughness);
            if (coatRough !== undefined) {
                material.clearCoat.roughness = coatRough;
            }
            const coatIor = mapScalar(pbr.coatIor);
            if (coatIor !== undefined && coatIor > 1) {
                material.clearCoat.indexOfRefraction = coatIor;
            }
            const coatColor = mapColor(pbr.coatColor);
            if (coatColor && (coatColor[0] !== 1 || coatColor[1] !== 1 || coatColor[2] !== 1)) {
                material.clearCoat.isTintEnabled = true;
                material.clearCoat.tintColor = new Color3(coatColor[0], coatColor[1], coatColor[2]);
            }
        }

        // Sheen
        const sheen = mapScalar(pbr.sheenFactor) ?? 0;
        if ((enabled("sheen") && sheen > 0) || pbr.sheenColor?.texture) {
            material.sheen.isEnabled = true;
            material.sheen.intensity = sheen;
            const sheenColor = mapColor(pbr.sheenColor);
            if (sheenColor) {
                material.sheen.color = new Color3(sheenColor[0], sheenColor[1], sheenColor[2]);
            }
            const sheenRough = mapScalar(pbr.sheenRoughness);
            if (sheenRough !== undefined) {
                material.sheen.roughness = sheenRough;
            }
        }

        if (enabled("unlit")) {
            material.unlit = true;
        }
        if (enabled("doubleSided")) {
            material.backFaceCulling = false;
        }

        // Textures
        const textureFor = (map: { texture?: FBXTextureRef; textureEnabled: boolean } | undefined, isNormal = false): Nullable<Texture> => {
            if (!map?.texture || !map.textureEnabled) {
                return null;
            }
            const texture = FBXFileLoader._createTexture(map.texture, scene, rootUrl, isNormal);
            if (texture) {
                FBXFileLoader._applyTextureSettings(texture, map.texture);
            }
            return texture;
        };

        const albedo = textureFor(pbr.baseColor);
        if (albedo) {
            material.albedoTexture = albedo;
        }
        const normal = textureFor(pbr.normalMap, true);
        if (normal) {
            material.bumpTexture = normal;
            this._configureNormalTexture(normal, material);
        }
        const emissiveTex = textureFor(pbr.emissionColor);
        if (emissiveTex) {
            material.emissiveTexture = emissiveTex;
            if (!emission || (emission.r === 0 && emission.g === 0 && emission.b === 0)) {
                material.emissiveColor = Color3.White();
            }
        }
        const ao = textureFor(pbr.ambientOcclusion);
        if (ao) {
            material.ambientTexture = ao;
            material.useAmbientInGrayScale = true;
        }
        if (specGloss) {
            const spec = textureFor(pbr.specularColor);
            if (spec) {
                material.reflectivityTexture = spec;
            }
            const gloss = textureFor(pbr.glossiness) ?? textureFor(pbr.roughness);
            if (gloss) {
                material.microSurfaceTexture = gloss;
            }
        } else {
            // Babylon reads metalness and roughness from one texture (B = metal, G = rough). Grayscale maps have
            // identical channels, so either map works alone; two different maps cannot both be honoured.
            const metalTex = textureFor(pbr.metalness);
            const roughTex = textureFor(pbr.roughness) ?? textureFor(pbr.glossiness);
            const sameTexture = metalTex && roughTex && pbr.metalness?.texture?.id === (pbr.roughness?.texture ?? pbr.glossiness?.texture)?.id;
            if (metalTex && (sameTexture || !roughTex)) {
                material.metallicTexture = metalTex;
                material.useMetallnessFromMetallicTextureBlue = true;
                material.useRoughnessFromMetallicTextureGreen = !!roughTex;
                material.useRoughnessFromMetallicTextureAlpha = false;
                if (!roughTex) {
                    material.useRoughnessFromMetallicTextureGreen = false;
                }
            } else if (roughTex) {
                material.metallicTexture = roughTex;
                material.useMetallnessFromMetallicTextureBlue = false;
                material.useRoughnessFromMetallicTextureGreen = true;
                material.useRoughnessFromMetallicTextureAlpha = false;
                if (metalTex) {
                    material.metadata = { ...((material.metadata as object) ?? {}), fbxDroppedMetalnessTexture: pbr.metalness?.texture?.relativeFileName };
                }
            }
            if (material.metallicTexture && material.metallic === 0 && !metalTex) {
                // Roughness-only texture: keep the scalar metalness.
            } else if (metalTex && material.metallic === 0) {
                material.metallic = 1;
            }
        }
        const opacityTex = textureFor(pbr.opacity);
        if (opacityTex) {
            if (albedo && pbr.opacity?.texture?.id === pbr.baseColor?.texture?.id) {
                material.useAlphaFromAlbedoTexture = true;
            } else {
                material.opacityTexture = opacityTex;
            }
            material.transparencyMode = Material.MATERIAL_ALPHATESTANDBLEND;
        }
        if (material.clearCoat.isEnabled) {
            const coatTex = textureFor(pbr.coatFactor);
            if (coatTex) {
                material.clearCoat.texture = coatTex;
            }
            const coatNormal = textureFor(pbr.coatNormal, true);
            if (coatNormal) {
                material.clearCoat.bumpTexture = coatNormal;
            }
        }
        if (material.sheen.isEnabled) {
            const sheenTex = textureFor(pbr.sheenColor);
            if (sheenTex) {
                material.sheen.texture = sheenTex;
            }
        }

        return material;
    }

    /** Alpha of a classic Lambert/Phong material: Opacity when present, otherwise 1 - TransparentColor * TransparencyFactor. */
    private static _alphaFromClassicTransparency(matData: FBXMaterialData): number {
        const props = matData.properties;
        if (props.opacity !== undefined) {
            return props.opacity;
        }
        const factor = mapScalar(matData.model.fbx.transparencyFactor);
        if (factor === undefined) {
            return 1;
        }
        const color = mapColor(matData.model.fbx.transparencyColor);
        const amount = color ? (color[0] + color[1] + color[2]) / 3 : 1;
        return Math.min(1, Math.max(0, 1 - amount * factor));
    }

    private static _applyTextureSettings(texture: Texture, tex: FBXTextureRef): void {
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
        if (tex.wrapU !== undefined) {
            texture.wrapU = tex.wrapU === 1 ? Texture.CLAMP_ADDRESSMODE : Texture.WRAP_ADDRESSMODE;
        }
        if (tex.wrapV !== undefined) {
            texture.wrapV = tex.wrapV === 1 ? Texture.CLAMP_ADDRESSMODE : Texture.WRAP_ADDRESSMODE;
        }
        if (tex.uvSetName || tex.layeredTextureId !== undefined) {
            texture.metadata = {
                ...((texture.metadata as object) ?? {}),
                ...(tex.uvSetName ? { fbxUVSetName: tex.uvSetName } : {}),
                ...(tex.layeredTextureId !== undefined ? { fbxLayeredTextureId: tex.layeredTextureId } : {}),
            };
        }
    }

    private _createStandardMaterial(matData: FBXMaterialData, scene: Scene, rootUrl: string): StandardMaterial {
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

        material.alpha = FBXFileLoader._alphaFromClassicTransparency(matData);

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

            FBXFileLoader._applyTextureSettings(texture, tex);
        }

        return material;
    }

    private _configureNormalTexture(texture: Texture, material: StandardMaterial | PBRMaterial): void {
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
    private _applyBlendShapes(blendShapes: FBXBlendShapeData[], meshes: Mesh[], scene: Scene): void {
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
                    const targetData = buildMorphTargetData(shape, cpIndices, basePositions, baseNormals, deltaMatrix, normalMatrix);
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
        const worldMatrix = parentNode ? parentNode.computeWorldMatrix(true) : Matrix.Identity();
        const position = Vector3.TransformCoordinates(Vector3.Zero(), worldMatrix);

        const camera = new FreeCamera(camData.name, position, scene);
        camera.fov = camData.fieldOfView * (Math.PI / 180);
        camera.fovMode = Camera.FOVMODE_VERTICAL_FIXED;
        void position;
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
                fieldOfViewX: camData.fieldOfViewX,
                apertureMode: camData.apertureMode,
                apertureSizeInch: camData.apertureSizeInch,
                userProperties: camData.userProperties,
                unknownProperties: camData.unknownProperties,
                diagnostics: camData.diagnostics,
            },
        };

        if (camData.projectionType === "orthographic") {
            camera.mode = Camera.ORTHOGRAPHIC_CAMERA;
            camera.orthoTop = camData.orthographicSize[1] / 2;
            camera.orthoBottom = -camData.orthographicSize[1] / 2;
            camera.orthoRight = camData.orthographicSize[0] / 2;
            camera.orthoLeft = -camData.orthographicSize[0] / 2;
        }

        // FBX cameras look down their local +X axis. Parent the camera to its node so it follows the node's
        // animation, and orient it with a fixed local rotation (camera forward +Z -> node +X), with the FBX Roll
        // applied around the view axis first.
        if (parentNode) {
            // The handedness conversion at the root mirrors every node's world matrix. A camera cannot render through
            // a mirrored parent (its view matrix would flip the image and the winding), so when the node's world
            // determinant is negative the camera hangs from a pivot whose own mirror cancels it.
            let cameraParent: TransformNode = parentNode;
            if (worldMatrix.determinant() < 0) {
                const pivot = new TransformNode(`${camData.name}__fbx_cameraPivot`, scene);
                pivot.parent = parentNode;
                pivot.scaling.set(1, 1, -1);
                cameraParent = pivot;
            }
            camera.parent = cameraParent;
            camera.position.set(0, 0, 0);
            const roll = ((camData.roll ?? 0) * Math.PI) / 180;
            camera.rotationQuaternion = Quaternion.FromRotationMatrix(Matrix.RotationZ(roll).multiply(Matrix.RotationY(Math.PI / 2)));
        } else {
            const target = Vector3.TransformCoordinates(new Vector3(1, 0, 0), worldMatrix);
            camera.setTarget(target);
        }

        return camera;
    }

    private _createLight(lightData: FBXLightData, modelIdToNode: Map<number, TransformNode>, scene: Scene): PointLight | DirectionalLight | SpotLight | null {
        const parentNode = modelIdToNode.get(lightData.modelId);
        const worldMatrix = parentNode ? parentNode.computeWorldMatrix(true) : Matrix.Identity();
        const position = Vector3.TransformCoordinates(Vector3.Zero(), worldMatrix);
        const color = new Color3(lightData.color[0], lightData.color[1], lightData.color[2]);

        // FBX lights point down their local -Z axis. Derive the world-space direction from two points
        // transformed by the node's world matrix so the handedness conversion (the left-handed root
        // applies scaling.z = -1) is reproduced correctly; transforming the direction as a normal
        // would mirror it under that reflection and point the light the wrong way.
        const forwardPoint = Vector3.TransformCoordinates(new Vector3(0, 0, -1), worldMatrix);
        const direction = forwardPoint.subtract(position).normalize();

        let light: PointLight | DirectionalLight | SpotLight;

        // When the light's node exists the light is parented to it (so it follows animation) and its position and
        // direction are expressed in node-local space: origin and local -Z.
        const localPosition = parentNode ? Vector3.Zero() : position;
        const localDirection = parentNode ? new Vector3(0, 0, -1) : direction;

        switch (lightData.lightType) {
            case 1: // Directional
                light = new DirectionalLight(lightData.name, localDirection, scene);
                light.diffuse = color;
                light.intensity = lightData.intensity;
                break;
            case 2: {
                // Spot
                const angle = lightData.coneAngle * (Math.PI / 180);
                light = new SpotLight(lightData.name, localPosition, localDirection, angle, 2, scene);
                light.diffuse = color;
                light.intensity = lightData.intensity;
                if (lightData.innerAngle !== undefined) {
                    light.innerAngle = Math.min(angle, (lightData.innerAngle * Math.PI) / 180);
                }
                break;
            }
            default: // Point (0), Area (3) and Volume (4) approximated as point lights
                light = new PointLight(lightData.name, localPosition, scene);
                light.diffuse = color;
                light.intensity = lightData.intensity;
                break;
        }
        if (parentNode) {
            light.parent = parentNode;
            // Babylon only resolves a parented light's world position and direction during rendering; do it now
            // so getAbsolutePosition() and transformedDirection are usable straight after loading.
            light.computeTransformedInformation();
        }
        light.specular = color;
        if (lightData.enableFarAttenuation && lightData.farAttenuationEnd !== undefined && lightData.farAttenuationEnd > 0) {
            light.range = lightData.farAttenuationEnd;
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
                farAttenuationStart: lightData.farAttenuationStart,
                farAttenuationEnd: lightData.farAttenuationEnd,
                areaLightShape: lightData.areaLightShape,
                userProperties: lightData.userProperties,
                unknownProperties: lightData.unknownProperties,
                diagnostics: lightData.diagnostics,
            },
        };

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
        const authoredInheritScales = FBXFileLoader._computeBoneInheritScales(
            bones,
            bones.map((b) => b.scale)
        );
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
            authoredRuntimeLocalMatrices[i] = FBXFileLoader._computeFBXRuntimeLocalMatrix(bones, authoredLocal, i, authoredInheritScales);
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
        const restInheritScales = FBXFileLoader._computeBoneInheritScales(
            bones,
            bones.map((b) => b.scale)
        );
        for (let i = 0; i < bones.length; i++) {
            let localMatrix = useBindAsRest ? localBindMatrices[i] : authoredRuntimeLocalMatrices[i];
            let parentBone = bones[i].parentIndex >= 0 ? sourceBones[bones[i].parentIndex] : null;
            if (!useBindAsRest && bones[i].inheritType !== 1 && bones[i].parentIndex >= 0 && parentBone) {
                const split = FBXFileLoader._splitParentScaleCompensatedLocalMatrix(
                    authoredLocalMatrices[i],
                    restInheritScales[bones[i].parentIndex],
                    FBXFileLoader._getBoneInheritedScale(bones, i, restInheritScales)
                );
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

    private _rigBoneModelIds = new Set<number>();

    private _isRigBone(modelId: number): boolean {
        return this._rigBoneModelIds.has(modelId);
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

    /**
     * Effective ("inherit") scale of every bone, following the FBX SDK: the local scale for RSrs bones, and for
     * RrSs / Rrs bones the local scale multiplied by the scale of the bone's inherit-scale node (the parent for RrSs,
     * the parent's inherit-scale node for Rrs). Bones are ordered parents first.
     */
    private static _computeBoneInheritScales(bones: FBXBoneData[], ownScales: [number, number, number][]): [number, number, number][] {
        const result: [number, number, number][] = [];
        for (let i = 0; i < bones.length; i++) {
            const own = ownScales[i];
            const inheritedFrom = FBXFileLoader._getBoneInheritScaleNode(bones, i);
            if (inheritedFrom < 0 || inheritedFrom >= i) {
                result[i] = [own[0], own[1], own[2]];
            } else {
                const p = result[inheritedFrom];
                result[i] = [own[0] * p[0], own[1] * p[1], own[2] * p[2]];
            }
        }
        return result;
    }

    private static _getBoneInheritScaleNode(bones: FBXBoneData[], index: number): number {
        const parentIndex = bones[index].parentIndex;
        if (parentIndex < 0) {
            return -1;
        }
        if (bones[index].inheritType === 0) {
            return parentIndex;
        }
        if (bones[index].inheritType === 2) {
            return FBXFileLoader._getBoneInheritScaleNode(bones, parentIndex);
        }
        return -1;
    }

    /** Scale a bone inherits into its own scale (RrSs chains), or unit scale. */
    private static _getBoneInheritedScale(bones: FBXBoneData[], index: number, inheritScales: [number, number, number][]): [number, number, number] {
        const node = FBXFileLoader._getBoneInheritScaleNode(bones, index);
        return node >= 0 ? inheritScales[node] : [1, 1, 1];
    }

    private static _computeFBXRuntimeLocalMatrix(bones: FBXBoneData[], localMatrix: Matrix, index: number, inheritScales?: [number, number, number][]): Matrix {
        const parentIndex = bones[index].parentIndex;
        if (bones[index].inheritType === 1 || parentIndex < 0) {
            return localMatrix;
        }

        const scales =
            inheritScales ??
            FBXFileLoader._computeBoneInheritScales(
                bones,
                bones.map((b) => b.scale)
            );
        return FBXFileLoader._applyParentScaleCompensation(localMatrix, scales[parentIndex], FBXFileLoader._getBoneInheritedScale(bones, index, scales));
    }

    private static _applyParentScaleCompensation(localMatrix: Matrix, parentScale: [number, number, number], inheritedScale?: [number, number, number]): Matrix {
        const split = FBXFileLoader._splitParentScaleCompensatedLocalMatrix(localMatrix, parentScale, inheritedScale);
        return split.boneLocalMatrix.multiply(split.helperLocalMatrix);
    }

    /**
     * Splits a bone's FBX local matrix into a helper (which cancels the parent scale and carries the translation,
     * so the translation still follows the parent scale as the SDK does) and the bone's own rotation/scale. For RrSs
     * bones the inherited scale is folded into the bone scale.
     */
    private static _splitParentScaleCompensatedLocalMatrix(
        localMatrix: Matrix,
        parentScale: [number, number, number],
        inheritedScale?: [number, number, number]
    ): { boneLocalMatrix: Matrix; helperLocalMatrix: Matrix } {
        const translation = localMatrix.getTranslation();
        let boneLocalMatrix = localMatrix.clone();
        boneLocalMatrix.setTranslation(Vector3.Zero());
        if (inheritedScale && (inheritedScale[0] !== 1 || inheritedScale[1] !== 1 || inheritedScale[2] !== 1)) {
            boneLocalMatrix = Matrix.Scaling(inheritedScale[0], inheritedScale[1], inheritedScale[2]).multiply(boneLocalMatrix);
        }
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

    private _applyRestTRS(node: TransformNode, model: FBXModelData): void {
        const trs = FBXFileLoader._computeLocalTRS(model, model.translation, model.rotation, model.scale);
        this._adjustTRSForInheritMode(model, trs, undefined);
        node.position = trs.position;
        node.rotationQuaternion = trs.rotationQuaternion;
        node.scaling = trs.scaling;
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
        meshes: Mesh[],
        propertyTargets: { cameraByAttributeId: Map<number, FreeCamera>; lightByAttributeId: Map<number, Light>; materialCache: Map<number, Material> }
    ): AnimationGroup | null {
        // Stacks may animate only properties (visibility, light colour...) without any transform curve.
        if (animStack.curveNodes.length === 0 && !animStack.unsupportedCurveNodes.some((c) => c.targetId !== null && c.curves.length > 0)) {
            return null;
        }
        this._activeLayers = animStack.layers;
        this._curveNodesByModelId = new Map();
        for (const curveNode of animStack.curveNodes) {
            if (curveNode.type === "DeformPercent") {
                continue;
            }
            const list = this._curveNodesByModelId.get(curveNode.targetModelId);
            if (list) {
                list.push(curveNode);
            } else {
                this._curveNodesByModelId.set(curveNode.targetModelId, [curveNode]);
            }
        }

        const animGroup = new AnimationGroup(animStack.name, scene);
        const animatedBoneTargetProperties = new Map<Bone | TransformNode, Set<string>>();
        const addBoneAnimation = (animation: Animation, bone: Bone): void => {
            const target = bone.getTransformNode() ?? bone;
            let targetProperties = animatedBoneTargetProperties.get(target);
            if (!targetProperties) {
                targetProperties = new Set<string>();
                animatedBoneTargetProperties.set(target, targetProperties);
            } else if (targetProperties.has(animation.targetProperty)) {
                return;
            }

            targetProperties.add(animation.targetProperty);
            animGroup.addTargetedAnimation(animation, target);
        };

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
            const inheritType2ModelIds = new Set(rig.bones.filter((bone) => bone.inheritType !== 1 && bone.parentIndex >= 0).map((bone) => bone.modelId));
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
                    addBoneAnimation(animation, bone);
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
                    addBoneAnimation(animation, bone);
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

        // Inherit-scale helpers follow the inverse of their parent's (possibly animated) scale. Children of animated
        // parents also need re-sampling even when they carry no curves of their own, since their local transform
        // depends on the parent scale.
        for (const [modelId, helper] of Array.from(this._inheritScaleHelpers)) {
            const modelData = modelIdToData.get(modelId);
            const parentModel = modelData ? this._parentModelById.get(modelId) : undefined;
            if (!modelData || !parentModel) {
                continue;
            }
            const fps = this._frameRate;
            // The helper mirrors the parent's animated rotation/translation (its own curves plus any inherited scale
            // that feeds its translation), with unit scale.
            const parentCurves = [
                ...(this._curveNodesByModelId.get(parentModel.id) ?? []),
                ...this._collectInheritScaleCurves(parentModel).filter((cn) => cn.targetModelId !== parentModel.id),
            ];
            if (parentCurves.length > 0) {
                const baseTimes = collectAnimationSampleTimes(parentCurves, fps, animStack.startTime, animStack.stopTime);
                const sampleParent = (time: number) =>
                    this._computeInheritAwareLocalMatrix(parentModel, this._sampleModelLocalMatrix(parentModel, this._curveNodesByModelId.get(parentModel.id) ?? [], time), time);
                const times = FBXFileLoader._refineSampleTimes(baseTimes, sampleParent);
                const posKeys: { frame: number; value: Vector3 }[] = [];
                const rotKeys: { frame: number; value: Quaternion }[] = [];
                let prevQuat: Quaternion | null = null;
                for (const time of times) {
                    const sc = new Vector3();
                    const rq = new Quaternion();
                    const tr = new Vector3();
                    sampleParent(time).decompose(sc, rq, tr);
                    if (prevQuat && Quaternion.Dot(prevQuat, rq) < 0) {
                        rq.scaleInPlace(-1);
                    }
                    prevQuat = rq;
                    posKeys.push({ frame: time * fps, value: tr });
                    rotKeys.push({ frame: time * fps, value: rq });
                }
                if (!this._isVector3KeysConstant(posKeys)) {
                    const anim = new Animation(`${helper.name}_position`, "position", fps, Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CYCLE);
                    anim.setKeys(posKeys);
                    animGroup.addTargetedAnimation(anim, helper);
                }
                if (!areQuaternionKeysConstant(rotKeys)) {
                    const anim = new Animation(`${helper.name}_rotation`, "rotationQuaternion", fps, Animation.ANIMATIONTYPE_QUATERNION, Animation.ANIMATIONLOOPMODE_CYCLE);
                    anim.setKeys(rotKeys);
                    animGroup.addTargetedAnimation(anim, helper);
                }
            }
            // The child's own local transform depends on the parent scale; re-sample it when that scale animates.
            const scaleCurves = this._collectInheritScaleCurves(parentModel);
            const node = modelIdToNode.get(modelId);
            if (node && scaleCurves.length > 0 && !nonBoneCurves.has(modelId) && !boneCurves.has(modelId)) {
                for (const animation of this._buildNodeAnimations([], node.name, modelData, animStack.startTime, animStack.stopTime, scaleCurves)) {
                    animGroup.addTargetedAnimation(animation, node);
                }
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
                    const fps = this._frameRate;
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
                    const fps = this._frameRate;
                    const anim = new Animation(`${target.name}_influence`, "influence", fps, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CYCLE);
                    const keys = buildScalarAnimationKeys(curveNode.curves[0], fps, animStack.startTime, animStack.stopTime, (value) => value / 100);
                    anim.setKeys(keys);
                    animGroup.addTargetedAnimation(anim, target);
                    targetFound = true;
                }
            }
        }

        // Animated non-transform properties: visibility, camera, light and material parameters
        for (const curveNode of animStack.unsupportedCurveNodes) {
            if (curveNode.targetId === null || curveNode.curves.length === 0) {
                continue;
            }
            for (const { animation, target } of this._buildPropertyAnimations(curveNode, animStack, modelIdToNode, propertyTargets)) {
                animGroup.addTargetedAnimation(animation, target);
            }
        }

        // Normalize the animation group
        if (animGroup.targetedAnimations.length > 0) {
            animGroup.normalize(animStack.startTime * this._frameRate, animStack.stopTime * this._frameRate);
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
        const fps = this._frameRate;
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
        let times = collectAnimationSampleTimes(rigCurveNodes, fps, startTime, stopTime);
        if (times.length === 0) {
            return [];
        }
        for (const boneData of rig.bones) {
            const md = modelIdToData.get(boneData.modelId);
            const cn = boneCurves.get(boneData.modelId) ?? [];
            if (!sampledModelIds.has(boneData.modelId) || !md || cn.length === 0) {
                continue;
            }
            times = FBXFileLoader._refineSampleTimes(times, (time) => this._sampleModelLocalMatrix(md, cn, time));
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
            const sampledInheritScales = FBXFileLoader._computeBoneInheritScales(rig.bones, sampledScales);
            const frame = time * fps;

            for (let i = 0; i < localMatrices.length; i++) {
                if (!compensatedModelIds.has(rig.bones[i].modelId)) {
                    continue;
                }

                const parentIndex = rig.bones[i].parentIndex;
                const parentScale = parentIndex >= 0 ? sampledInheritScales[parentIndex] : rig.bones[i].scale;
                const split = FBXFileLoader._splitParentScaleCompensatedLocalMatrix(
                    localMatrices[i],
                    parentScale,
                    FBXFileLoader._getBoneInheritedScale(rig.bones, i, sampledInheritScales)
                );
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
    private _buildNodeAnimations(
        curveNodes: FBXCurveNodeData[],
        nodeName: string,
        modelData: FBXModelData,
        startTime: number,
        stopTime: number,
        extraTimeCurves: FBXCurveNodeData[] = []
    ): Animation[] {
        const fps = this._frameRate;

        // Separate curves by type
        const rNode = curveNodes.find((cn) => cn.type === "R");

        const baseTimes = collectAnimationSampleTimes([...curveNodes, ...extraTimeCurves], fps, startTime, stopTime);
        if (baseTimes.length === 0) {
            return [];
        }
        const sampleTRS = (time: number) => {
            const sampled = this._sampleModelTRS(modelData, curveNodes, time);
            const trs = FBXFileLoader._computeLocalTRS(modelData, sampled.translation, sampled.rotation, sampled.scale);
            this._adjustTRSForInheritMode(modelData, trs, time);
            return trs;
        };
        const times = FBXFileLoader._refineSampleTimes(baseTimes, (time) => {
            const trs = sampleTRS(time);
            return Matrix.Compose(trs.scaling, trs.rotationQuaternion, trs.position);
        });

        // Build keyframes by computing the local transform at each time
        const posKeys: { frame: number; value: Vector3; interpolation?: AnimationKeyInterpolation }[] = [];
        const rotKeys: { frame: number; value: Quaternion; interpolation?: AnimationKeyInterpolation }[] = [];
        const sclKeys: { frame: number; value: Vector3; interpolation?: AnimationKeyInterpolation }[] = [];
        let prevQuat: Quaternion | null = null;

        for (const time of times) {
            const frame = time * fps;

            const trs = sampleTRS(time);
            const s = trs.scaling;
            const r = trs.rotationQuaternion;
            const t = trs.position;
            const stepT = isChannelSteppedAt(curveNodes, "T", time);
            const stepR = isChannelSteppedAt(curveNodes, "R", time);
            const stepS = isChannelSteppedAt(curveNodes, "S", time);

            // Ensure quaternion continuity
            if (prevQuat && Quaternion.Dot(prevQuat, r) < 0) {
                r.scaleInPlace(-1);
            }
            prevQuat = r;

            posKeys.push(stepT ? { frame, value: t, interpolation: AnimationKeyInterpolation.STEP } : { frame, value: t });
            rotKeys.push(stepR ? { frame, value: r, interpolation: AnimationKeyInterpolation.STEP } : { frame, value: r });
            sclKeys.push(stepS ? { frame, value: s, interpolation: AnimationKeyInterpolation.STEP } : { frame, value: s });
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

    /**
     * Baked keys are interpolated linearly by Babylon. Between two frames an FBX cubic segment can deviate from that
     * line, so sample times are refined (midpoints inserted, up to two levels) wherever the interpolated transform
     * differs noticeably from the curve. Flat and linear segments stay at frame resolution.
     */
    private static _refineSampleTimes(times: number[], sample: (time: number) => Matrix, maxDepth = 2): number[] {
        const decompose = (time: number) => {
            const s = new Vector3();
            const r = new Quaternion();
            const t = new Vector3();
            sample(time).decompose(s, r, t);
            return { s, r, t };
        };
        const out: number[] = [];
        const refine = (t0: number, t1: number, d0: ReturnType<typeof decompose>, d1: ReturnType<typeof decompose>, depth: number) => {
            if (depth >= maxDepth) {
                return;
            }
            const tm = (t0 + t1) * 0.5;
            if (!(tm > t0 && tm < t1)) {
                return;
            }
            const dm = decompose(tm);
            const lerpT = Vector3.Lerp(d0.t, d1.t, 0.5);
            const lerpS = Vector3.Lerp(d0.s, d1.s, 0.5);
            const slerpR = Quaternion.Slerp(d0.r, d1.r, 0.5);
            const posErr = Vector3.Distance(lerpT, dm.t);
            const sclErr = Vector3.Distance(lerpS, dm.s);
            const dot = Math.min(1, Math.abs(Quaternion.Dot(slerpR, dm.r)));
            const angErr = 2 * Math.acos(dot);
            const posTol = 1e-4 * (1 + Math.max(Math.abs(dm.t.x), Math.abs(dm.t.y), Math.abs(dm.t.z)));
            const sclTol = 1e-4 * (1 + Math.max(Math.abs(dm.s.x), Math.abs(dm.s.y), Math.abs(dm.s.z)));
            if (posErr > posTol || sclErr > sclTol || angErr > 0.0005) {
                refine(t0, tm, d0, dm, depth + 1);
                out.push(tm);
                refine(tm, t1, dm, d1, depth + 1);
            }
        };
        let prev = times.length > 0 ? decompose(times[0]) : null;
        for (let i = 0; i < times.length; i++) {
            out.push(times[i]);
            if (i + 1 < times.length && prev) {
                const next = decompose(times[i + 1]);
                refine(times[i], times[i + 1], prev, next, 0);
                prev = next;
            }
        }
        return out;
    }

    /**
     * Maps an animated FBX property (anything other than node transforms and blend shape weights) onto the Babylon
     * property that carries it: mesh visibility, camera field of view and clip planes, light intensity, colour and
     * cone angles, and material colours, alpha, roughness and metalness.
     */
    private _buildPropertyAnimations(
        curveNode: FBXUnsupportedCurveNodeData,
        animStack: FBXAnimationStackData,
        modelIdToNode: Map<number, TransformNode>,
        targets: { cameraByAttributeId: Map<number, FreeCamera>; lightByAttributeId: Map<number, Light>; materialCache: Map<number, Material> }
    ): { animation: Animation; target: unknown }[] {
        const fps = this._frameRate;
        const prop = curveNode.propertyName ?? curveNode.type;
        const targetId = curveNode.targetId!;
        const out: { animation: Animation; target: unknown }[] = [];
        const scalarCurve = curveNode.curves.find((c) => c.channel === "d|X") ?? curveNode.curves[0];
        const defaults = curveNode.defaultValues;
        const scalarKeys = (map: (v: number) => number, step = false): IAnimationKey[] => {
            const keys = buildScalarAnimationKeys(scalarCurve, fps, animStack.startTime, animStack.stopTime, map);
            if (step) {
                for (const key of keys) {
                    key.interpolation = AnimationKeyInterpolation.STEP;
                    delete key.inTangent;
                    delete key.outTangent;
                }
            }
            return keys;
        };
        const colorKeys = (): IAnimationKey[] => {
            const cx = curveNode.curves.find((c) => c.channel === "d|X");
            const cy = curveNode.curves.find((c) => c.channel === "d|Y");
            const cz = curveNode.curves.find((c) => c.channel === "d|Z");
            const times = collectAnimationSampleTimes(
                [{ type: "other", targetModelId: targetId, curves: curveNode.curves, layerIndex: 0 }],
                fps,
                animStack.startTime,
                animStack.stopTime
            );
            return times.map((time) => ({
                frame: time * fps,
                value: new Color3(
                    sampleFBXCurveAtTime(cx, time) ?? defaults["d|X"] ?? 1,
                    sampleFBXCurveAtTime(cy, time) ?? defaults["d|Y"] ?? 1,
                    sampleFBXCurveAtTime(cz, time) ?? defaults["d|Z"] ?? 1
                ),
            }));
        };
        const add = (target: unknown, property: string, type: number, keys: IAnimationKey[], name: string) => {
            if (keys.length === 0) {
                return;
            }
            const animation = new Animation(`${name}_${property}`, property, fps, type, Animation.ANIMATIONLOOPMODE_CYCLE);
            animation.setKeys(keys);
            out.push({ animation, target });
        };

        const node = modelIdToNode.get(targetId);
        if (node) {
            if (prop === "Visibility" && node instanceof Mesh) {
                add(
                    node,
                    "visibility",
                    Animation.ANIMATIONTYPE_FLOAT,
                    scalarKeys((v) => Math.min(1, Math.max(0, v)), true),
                    node.name
                );
                return out;
            }
            // Animated user properties drive the value stored in the node's metadata.
            const userProperties = (node.metadata as { fbxUserProperties?: Record<string, unknown> } | undefined)?.fbxUserProperties;
            if (userProperties && prop in userProperties) {
                const hasVector = curveNode.curves.some((c) => c.channel === "d|Y" || c.channel === "d|Z");
                if (hasVector) {
                    const times = collectAnimationSampleTimes(
                        [{ type: "other", targetModelId: targetId, curves: curveNode.curves, layerIndex: 0 }],
                        fps,
                        animStack.startTime,
                        animStack.stopTime
                    );
                    const cx = curveNode.curves.find((c) => c.channel === "d|X");
                    const cy = curveNode.curves.find((c) => c.channel === "d|Y");
                    const cz = curveNode.curves.find((c) => c.channel === "d|Z");
                    const current = userProperties[prop];
                    const base = Array.isArray(current) ? (current as number[]) : [0, 0, 0];
                    userProperties[prop] = new Vector3(base[0] ?? 0, base[1] ?? 0, base[2] ?? 0);
                    const keys = times.map((time) => ({
                        frame: time * fps,
                        value: new Vector3(
                            sampleFBXCurveAtTime(cx, time) ?? base[0] ?? 0,
                            sampleFBXCurveAtTime(cy, time) ?? base[1] ?? 0,
                            sampleFBXCurveAtTime(cz, time) ?? base[2] ?? 0
                        ),
                    }));
                    add(node, `metadata.fbxUserProperties.${prop}`, Animation.ANIMATIONTYPE_VECTOR3, keys, node.name);
                } else {
                    if (typeof userProperties[prop] === "boolean") {
                        userProperties[prop] = userProperties[prop] ? 1 : 0;
                    }
                    add(
                        node,
                        `metadata.fbxUserProperties.${prop}`,
                        Animation.ANIMATIONTYPE_FLOAT,
                        scalarKeys((v) => v),
                        node.name
                    );
                }
            }
            return out;
        }

        const camera = targets.cameraByAttributeId.get(targetId);
        if (camera) {
            const meta = (camera.metadata as { fbxCamera?: { aspectRatio?: number; apertureMode?: number; apertureSizeInch?: [number, number] } } | undefined)?.fbxCamera;
            const aspect = meta?.aspectRatio || 1;
            const apertureMode = meta?.apertureMode ?? 2;
            switch (prop) {
                case "FieldOfView":
                    // Vertical unless the camera's aperture mode declares FieldOfView as horizontal.
                    add(
                        camera,
                        "fov",
                        Animation.ANIMATIONTYPE_FLOAT,
                        scalarKeys((v) => (apertureMode === 1 ? 2 * Math.atan(Math.tan((v * Math.PI) / 360) / aspect) : (v * Math.PI) / 180)),
                        camera.name
                    );
                    break;
                case "FieldOfViewY":
                    add(
                        camera,
                        "fov",
                        Animation.ANIMATIONTYPE_FLOAT,
                        scalarKeys((v) => (v * Math.PI) / 180),
                        camera.name
                    );
                    break;
                case "FieldOfViewX":
                    if (apertureMode !== 0) {
                        add(
                            camera,
                            "fov",
                            Animation.ANIMATIONTYPE_FLOAT,
                            scalarKeys((v) => 2 * Math.atan(Math.tan((v * Math.PI) / 360) / aspect)),
                            camera.name
                        );
                    }
                    break;
                case "FocalLength": {
                    const apertureY = meta?.apertureSizeInch?.[1];
                    if (apertureY && apertureMode === 3) {
                        add(
                            camera,
                            "fov",
                            Animation.ANIMATIONTYPE_FLOAT,
                            scalarKeys((v) => 2 * Math.atan((apertureY / Math.max(v / 25.4, 1e-6)) * 0.5)),
                            camera.name
                        );
                    }
                    break;
                }
                case "NearPlane":
                    add(
                        camera,
                        "minZ",
                        Animation.ANIMATIONTYPE_FLOAT,
                        scalarKeys((v) => v),
                        camera.name
                    );
                    break;
                case "FarPlane":
                    add(
                        camera,
                        "maxZ",
                        Animation.ANIMATIONTYPE_FLOAT,
                        scalarKeys((v) => v),
                        camera.name
                    );
                    break;
                default:
                    break;
            }
            return out;
        }

        const light = targets.lightByAttributeId.get(targetId);
        if (light) {
            switch (prop) {
                case "Intensity":
                    add(
                        light,
                        "intensity",
                        Animation.ANIMATIONTYPE_FLOAT,
                        scalarKeys((v) => v / 100),
                        light.name
                    );
                    break;
                case "Color":
                    add(light, "diffuse", Animation.ANIMATIONTYPE_COLOR3, colorKeys(), light.name);
                    break;
                case "OuterAngle":
                case "ConeAngle":
                    if (light instanceof SpotLight) {
                        add(
                            light,
                            "angle",
                            Animation.ANIMATIONTYPE_FLOAT,
                            scalarKeys((v) => (v * Math.PI) / 180),
                            light.name
                        );
                    }
                    break;
                case "InnerAngle":
                    if (light instanceof SpotLight) {
                        add(
                            light,
                            "innerAngle",
                            Animation.ANIMATIONTYPE_FLOAT,
                            scalarKeys((v) => (v * Math.PI) / 180),
                            light.name
                        );
                    }
                    break;
                default:
                    break;
            }
            return out;
        }

        const material = targets.materialCache.get(targetId);
        if (material) {
            const isPbr = material instanceof PBRMaterial;
            const short = prop.substring(prop.lastIndexOf("|") + 1);
            if (prop === "DiffuseColor" || prop === "Diffuse" || short === "baseColor" || short === "base_color" || short === "color") {
                add(material, isPbr ? "albedoColor" : "diffuseColor", Animation.ANIMATIONTYPE_COLOR3, colorKeys(), material.name);
            } else if (
                prop === "EmissiveColor" ||
                prop === "Emissive" ||
                short === "emissionColor" ||
                short === "emission_color" ||
                short === "emissive" ||
                short === "emit_color"
            ) {
                add(material, "emissiveColor", Animation.ANIMATIONTYPE_COLOR3, colorKeys(), material.name);
            } else if (prop === "Opacity") {
                add(
                    material,
                    "alpha",
                    Animation.ANIMATIONTYPE_FLOAT,
                    scalarKeys((v) => v),
                    material.name
                );
            } else if (prop === "TransparencyFactor" || prop === "TransparentFactor") {
                add(
                    material,
                    "alpha",
                    Animation.ANIMATIONTYPE_FLOAT,
                    scalarKeys((v) => 1 - v),
                    material.name
                );
            } else if (isPbr && (short === "roughness" || short === "specular_roughness" || short === "specularRoughness")) {
                add(
                    material,
                    "roughness",
                    Animation.ANIMATIONTYPE_FLOAT,
                    scalarKeys((v) => v),
                    material.name
                );
            } else if (isPbr && (short === "metalness" || short === "metallic" || short === "base_metalness")) {
                add(
                    material,
                    "metallic",
                    Animation.ANIMATIONTYPE_FLOAT,
                    scalarKeys((v) => v),
                    material.name
                );
            } else if (!isPbr && prop === "SpecularColor") {
                add(material, "specularColor", Animation.ANIMATIONTYPE_COLOR3, colorKeys(), material.name);
            }
            return out;
        }

        return out;
    }

    /** Records constraints on their nodes and, unless disabled, attaches the runtime behavior that solves them. */
    private _applyConstraints(fbxScene: FBXSceneData, modelIdToNode: Map<number, TransformNode>, rootNode: TransformNode, scene: Scene): void {
        const nodeName = (id: number | undefined) => (id === undefined ? undefined : modelIdToNode.get(id)?.name);
        const upSign = fbxScene.upAxisSign >= 0 ? 1 : -1;
        const sceneUp = new Vector3(fbxScene.upAxis === 0 ? upSign : 0, fbxScene.upAxis === 1 ? upSign : 0, fbxScene.upAxis === 2 ? upSign : 0);
        const summaries: unknown[] = [];
        for (const c of fbxScene.constraints) {
            const summary = {
                name: c.name,
                type: c.type,
                node: nodeName(c.nodeId),
                targets: c.targets.map((t) => ({ node: nodeName(t.modelId), weight: t.weight })),
                weight: c.weight,
                active: c.active,
                ...(c.type === "singleChainIK" ? { firstJoint: nodeName(c.ikFirstJointId), endJoint: nodeName(c.ikEndJointId), effector: nodeName(c.ikEffectorId) } : {}),
            };
            summaries.push(summary);
            const node = c.nodeId !== undefined ? modelIdToNode.get(c.nodeId) : undefined;
            if (!node) {
                continue;
            }
            const existing = ((node.metadata as { fbxConstraints?: unknown[] } | undefined)?.fbxConstraints ?? []) as unknown[];
            node.metadata = { ...((node.metadata as object) ?? {}), fbxConstraints: [...existing, summary] };
            if (this._options.constraints !== "apply" || c.type === "singleChainIK" || c.type === "unknown") {
                continue;
            }
            const targets: FBXConstraintBehaviorTarget[] = [];
            for (const t of c.targets) {
                const targetNode = modelIdToNode.get(t.modelId);
                if (!targetNode) {
                    continue;
                }
                const d2r = Math.PI / 180;
                const offset =
                    c.type === "parent"
                        ? Matrix.Compose(
                              new Vector3(...t.offsetScale),
                              Quaternion.FromRotationMatrix(eulerToMatrixXYZ(t.offsetRotation[0] * d2r, t.offsetRotation[1] * d2r, t.offsetRotation[2] * d2r)),
                              new Vector3(...t.offsetTranslation)
                          )
                        : Matrix.Identity();
                targets.push({ node: targetNode, weight: t.weight, offset });
            }
            if (targets.length === 0) {
                continue;
            }
            const upNode = c.worldUpNodeId !== undefined ? (modelIdToNode.get(c.worldUpNodeId) ?? null) : null;
            node.addBehavior(new FBXConstraintBehavior(c, { root: rootNode, targets, upNode, sceneUp }));
        }
        if (summaries.length > 0) {
            rootNode.metadata = { ...((rootNode.metadata as object) ?? {}), fbxConstraints: summaries };
        }
    }

    /** Collects every recoverable issue the interpreter recorded, stores it on the root node and notifies the caller. */
    private _reportDiagnostics(fbxScene: FBXSceneData, rootNode: TransformNode, modelIdToNode: Map<number, TransformNode>): void {
        const warnings: FBXLoaderWarning[] = [];
        const push = (source: FBXLoaderWarning["source"], d: unknown, objectName?: string) => {
            const message = typeof d === "string" ? d : ((d as { message?: string })?.message ?? JSON.stringify(d));
            warnings.push({ source, message, objectName, details: typeof d === "string" ? undefined : d });
        };
        for (const d of fbxScene.diagnostics) {
            // Objects with several parents (shared materials, textures, instanced geometry) are normal in FBX.
            if (d.subType === "duplicate-parent") {
                continue;
            }
            push("scene", d, d.objectName ?? d.nodeName);
        }
        for (const g of fbxScene.geometries) {
            for (const d of g.diagnostics) {
                push("geometry", d, g.name);
            }
        }
        for (const c of fbxScene.curves) {
            for (const d of c.diagnostics) {
                push("geometry", d, c.name);
            }
        }
        for (const skin of fbxScene.skins) {
            for (const d of skin.diagnostics) {
                push("skin", d);
            }
            for (const bone of skin.bones) {
                for (const d of bone.diagnostics) {
                    push("skin", d, bone.name);
                }
            }
        }
        for (const rig of fbxScene.rigs) {
            for (const w of rig.warnings) {
                push("rig", w);
            }
        }
        for (const stack of fbxScene.animations) {
            for (const d of stack.diagnostics) {
                push("animation", d, stack.name);
            }
        }
        for (const cam of fbxScene.cameras) {
            for (const d of cam.diagnostics) {
                push("camera", d, cam.name);
            }
        }
        for (const light of fbxScene.lights) {
            for (const d of light.diagnostics) {
                push("light", d, light.name);
            }
        }
        const walk = (models: FBXModelData[]) => {
            for (const m of models) {
                for (const d of m.diagnostics) {
                    push("model", d, m.name);
                }
                walk(m.children);
            }
        };
        walk(fbxScene.rootModels);

        rootNode.metadata = {
            ...((rootNode.metadata as object) ?? {}),
            fbxDiagnostics: warnings,
            fbxDisplayLayers: fbxScene.displayLayers.map((l) => ({ name: l.name, show: l.show, freeze: l.freeze, color: l.color })),
            fbxSelectionSets: fbxScene.selectionSets.map((set) => ({
                name: set.name,
                members: set.members.map((m) => ({
                    node: modelIdToNode.get(m.modelId)?.name ?? String(m.modelId),
                    includeNode: m.includeNode,
                    ...(m.vertices ? { vertices: m.vertices } : {}),
                    ...(m.edges ? { edges: m.edges } : {}),
                    ...(m.faces ? { faces: m.faces } : {}),
                })),
            })),
        };
        for (const warning of warnings) {
            this._options.onWarning(warning);
        }
    }

    /** Curve nodes affecting the inherit scale of a model: its own scale curves and those of its inherit-scale chain. */
    private _collectInheritScaleCurves(modelData: FBXModelData): FBXCurveNodeData[] {
        const result: FBXCurveNodeData[] = [];
        let current: FBXModelData | undefined = modelData;
        const seen = new Set<number>();
        while (current && !seen.has(current.id)) {
            seen.add(current.id);
            for (const cn of this._curveNodesByModelId.get(current.id) ?? []) {
                if (cn.type === "S") {
                    result.push(cn);
                }
            }
            current = this._getInheritScaleNode(current);
        }
        return result;
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

    /** Samples the animated Lcl Translation / Rotation / Scaling of a model, blending all layers of the active stack. */
    private _sampleModelTRS(
        modelData: FBXModelData,
        curveNodes: readonly FBXCurveNodeData[],
        time: number
    ): { translation: [number, number, number]; rotation: [number, number, number]; scale: [number, number, number] } {
        const layers = this._activeLayers;
        return {
            translation: evaluateLayeredChannel(curveNodes, layers, "T", modelData.translation, modelData.rotationOrder, time),
            rotation: evaluateLayeredChannel(curveNodes, layers, "R", modelData.rotation, modelData.rotationOrder, time),
            scale: evaluateLayeredChannel(curveNodes, layers, "S", modelData.scale, modelData.rotationOrder, time),
        };
    }

    /**
     * Local position/rotation/scale of a model from FBX Lcl values. Without pivots and offsets the components map
     * directly (rotation = pre * lcl * post⁻¹), which keeps zero and negative scales exact. With pivots the full
     * matrix is built and decomposed.
     */
    private static _computeLocalTRS(
        modelData: FBXModelData,
        translation: [number, number, number],
        rotation: [number, number, number],
        scale: [number, number, number]
    ): { position: Vector3; rotationQuaternion: Quaternion; scaling: Vector3 } {
        const nz = (v: [number, number, number]) => v[0] !== 0 || v[1] !== 0 || v[2] !== 0;
        const d2r = Math.PI / 180;
        let rotM = eulerToMatrix(rotation[0] * d2r, rotation[1] * d2r, rotation[2] * d2r, modelData.rotationOrder);
        if (nz(modelData.preRotation)) {
            rotM = rotM.multiply(eulerToMatrixXYZ(modelData.preRotation[0] * d2r, modelData.preRotation[1] * d2r, modelData.preRotation[2] * d2r));
        }
        if (nz(modelData.postRotation)) {
            const post = eulerToMatrixXYZ(modelData.postRotation[0] * d2r, modelData.postRotation[1] * d2r, modelData.postRotation[2] * d2r);
            const postInv = new Matrix();
            post.invertToRef(postInv);
            rotM = postInv.multiply(rotM);
        }
        let position = new Vector3(translation[0], translation[1], translation[2]);
        if (nz(modelData.rotationPivot) || nz(modelData.scalingPivot) || nz(modelData.rotationOffset) || nz(modelData.scalingOffset)) {
            // Pivots and offsets only move the translation: the linear part of the FBX local matrix is always S·R.
            position = FBXFileLoader._computeFBXLocalMatrix(
                translation,
                rotation,
                scale,
                modelData.preRotation,
                modelData.postRotation,
                modelData.rotationPivot,
                modelData.scalingPivot,
                modelData.rotationOffset,
                modelData.scalingOffset,
                modelData.rotationOrder
            ).getTranslation();
        }
        return {
            position,
            rotationQuaternion: Quaternion.FromRotationMatrix(rotM),
            scaling: new Vector3(scale[0], scale[1], scale[2]),
        };
    }

    /** Applies inherit-mode adjustments to a local TRS (see _computeInheritAwareLocalMatrix). */
    private _adjustTRSForInheritMode(modelData: FBXModelData, trs: { position: Vector3; rotationQuaternion: Quaternion; scaling: Vector3 }, time: number | undefined): void {
        const parent = this._parentModelById.get(modelData.id);
        if (modelData.inheritType === 1 || !parent) {
            return;
        }
        const parentScale = this._getInheritScale(parent, time);
        trs.position.x *= parentScale[0];
        trs.position.y *= parentScale[1];
        trs.position.z *= parentScale[2];
        const inheritNode = this._getInheritScaleNode(modelData);
        if (inheritNode) {
            const inherited = this._getInheritScale(inheritNode, time);
            trs.scaling.x *= inherited[0];
            trs.scaling.y *= inherited[1];
            trs.scaling.z *= inherited[2];
        }
    }

    private _sampleModelLocalMatrix(modelData: FBXModelData, curveNodes: FBXCurveNodeData[], time: number, scaleOverride?: [number, number, number]): Matrix {
        const trs = this._sampleModelTRS(modelData, curveNodes, time);
        return FBXFileLoader._computeFBXLocalMatrix(
            trs.translation,
            trs.rotation,
            scaleOverride ?? trs.scale,
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
        return evaluateLayeredChannel(curveNodes, this._activeLayers, "S", modelData.scale, modelData.rotationOrder, time);
    }

    /**
     * Effective scale of a model for inherit-mode math (`inherit_scale` in ufbx terms): its own local scale, multiplied
     * componentwise by the inherited scale when the model uses RrSs inheritance. `time` samples animation; undefined
     * uses the rest pose.
     */
    private _getInheritScale(modelData: FBXModelData | undefined, time: number | undefined): [number, number, number] {
        if (!modelData) {
            return [1, 1, 1];
        }
        const own = time === undefined ? modelData.scale : this._sampleModelScale(modelData, this._curveNodesByModelId.get(modelData.id) ?? [], time);
        const inheritNode = this._getInheritScaleNode(modelData);
        if (!inheritNode) {
            return [own[0], own[1], own[2]];
        }
        const parentScale = this._getInheritScale(inheritNode, time);
        return [own[0] * parentScale[0], own[1] * parentScale[1], own[2] * parentScale[2]];
    }

    /** RrSs nodes inherit scale from their parent; Rrs nodes skip their immediate parent (chaining through Rrs parents). */
    private _getInheritScaleNode(modelData: FBXModelData): FBXModelData | undefined {
        const parent = this._parentModelById.get(modelData.id);
        if (!parent) {
            return undefined;
        }
        if (modelData.inheritType === 0) {
            return parent;
        }
        if (modelData.inheritType === 2) {
            return this._getInheritScaleNode(parent);
        }
        return undefined;
    }

    /**
     * Local matrix of a model relative to its Babylon parent frame, accounting for inherit modes. For RSrs (the
     * default) this is the FBX local matrix. For RrSs / Rrs the node sits under a helper that removes the parent's
     * scale, so translation is pre-scaled by the parent scale and (for RrSs) scale accumulates componentwise.
     */
    private _computeInheritAwareLocalMatrix(modelData: FBXModelData, localMatrix: Matrix, time: number | undefined): Matrix {
        const parent = this._parentModelById.get(modelData.id);
        if (modelData.inheritType === 1 || !parent) {
            return localMatrix;
        }
        const s = new Vector3();
        const r = new Quaternion();
        const t = new Vector3();
        localMatrix.decompose(s, r, t);
        const parentScale = this._getInheritScale(parent, time);
        t.x *= parentScale[0];
        t.y *= parentScale[1];
        t.z *= parentScale[2];
        const inheritNode = this._getInheritScaleNode(modelData);
        if (inheritNode) {
            const inherited = this._getInheritScale(inheritNode, time);
            s.x *= inherited[0];
            s.y *= inherited[1];
            s.z *= inherited[2];
        }
        return Matrix.Compose(s, r, t);
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
        const fps = this._frameRate;

        const rNode = curveNodes.find((cn) => cn.type === "R");

        const baseTimes = collectAnimationSampleTimes(curveNodes, fps, startTime, stopTime);
        if (baseTimes.length === 0) {
            return [];
        }
        const times = FBXFileLoader._refineSampleTimes(baseTimes, (time) => this._sampleModelLocalMatrix(modelData, curveNodes, time));

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

            // Compute the full FBX local matrix from animated Lcl values, blending all layers
            const localMatrix = this._sampleModelLocalMatrix(modelData, curveNodes, time);

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
    normalMatrix: Matrix | null
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

/** Interior frames kept between two keys when the segment is cubic or extrapolated. */
const MAX_DENSE_SEGMENT_SAMPLES = 512;
/** Interior frames kept between two keys when every curve is linear or constant there. */
const MAX_LINEAR_SEGMENT_SAMPLES = 32;
/** Upper bound on samples per animated node, beyond which the frame stride grows. */
const MAX_SAMPLES_PER_TARGET = 100000;

/**
 * Times at which the animation is baked: every key time plus the frame grid between keys. Segments where every
 * curve is linear or constant only get a few interior frames (Babylon interpolates linearly between the baked
 * keys), cubic or extrapolated segments get the full frame grid up to a cap, so day-long clips with a handful of
 * keys do not explode into millions of samples.
 */
function collectAnimationSampleTimes(curveNodes: FBXCurveNodeData[], fps: number, startTime: number, stopTime: number): number[] {
    let minTime = Number.POSITIVE_INFINITY;
    let maxTime = Number.NEGATIVE_INFINITY;
    const anchorSet = new Set<number>();
    const curves: FBXCurveData[] = [];

    for (const curveNode of curveNodes) {
        for (const curve of curveNode.curves) {
            curves.push(curve);
            for (const key of curve.keys) {
                minTime = Math.min(minTime, key.time);
                maxTime = Math.max(maxTime, key.time);
                if (key.time >= startTime && key.time <= stopTime) {
                    anchorSet.add(key.time);
                }
            }
        }
    }

    if (!Number.isFinite(minTime) || !Number.isFinite(maxTime)) {
        return [];
    }

    const rangeStart = stopTime > startTime ? startTime : minTime;
    const rangeStop = stopTime > startTime ? stopTime : maxTime;
    anchorSet.add(rangeStart);
    anchorSet.add(rangeStop);
    const anchors = Array.from(anchorSet)
        .filter((t) => t >= rangeStart && t <= rangeStop)
        .sort((a, b) => a - b);

    // A segment needs the dense grid when any curve is cubic there or extrapolates a non-constant pattern.
    const segmentIsDense = (t0: number): boolean => {
        for (const curve of curves) {
            const keys = curve.keys;
            if (keys.length === 0) {
                continue;
            }
            if (t0 < keys[0].time) {
                if (curve.preExtrapolation && curve.preExtrapolation.mode !== "constant") {
                    return true;
                }
                continue;
            }
            if (t0 >= keys[keys.length - 1].time) {
                if (curve.postExtrapolation && curve.postExtrapolation.mode !== "constant") {
                    return true;
                }
                continue;
            }
            let lo = 0;
            let hi = keys.length - 1;
            while (hi - lo > 1) {
                const mid = (lo + hi) >> 1;
                if (keys[mid].time <= t0) {
                    lo = mid;
                } else {
                    hi = mid;
                }
            }
            if (keys[lo].interpolation === "cubic") {
                return true;
            }
        }
        return false;
    };

    const times: number[] = [];
    const totalFrames = Math.floor(rangeStop * fps) - Math.ceil(rangeStart * fps) + 1;
    const stride = Math.max(1, Math.ceil(totalFrames / MAX_SAMPLES_PER_TARGET));
    for (let i = 0; i < anchors.length; i++) {
        const t0 = anchors[i];
        times.push(t0);
        if (i + 1 >= anchors.length) {
            break;
        }
        const t1 = anchors[i + 1];
        const firstFrame = Math.floor(t0 * fps) + 1;
        const lastFrame = Math.ceil(t1 * fps) - 1;
        const interior = lastFrame - firstFrame + 1;
        if (interior <= 0) {
            continue;
        }
        const cap = segmentIsDense(t0) ? MAX_DENSE_SEGMENT_SAMPLES : MAX_LINEAR_SEGMENT_SAMPLES;
        const step = Math.max(stride, Math.ceil(interior / cap));
        for (let frame = firstFrame; frame <= lastFrame; frame += step) {
            times.push(frame / fps);
        }
    }

    const sorted = times.sort((a, b) => a - b);
    // Key times and frame times can differ by floating point noise; keep one sample per instant.
    const deduped: number[] = [];
    for (const t of sorted) {
        if (t < rangeStart - 1e-9 || t > rangeStop + 1e-9) {
            continue;
        }
        if (deduped.length === 0 || t - deduped[deduped.length - 1] > 1e-9) {
            deduped.push(t);
        }
    }
    return deduped;
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
                leftDx: 0,
                leftDy: 0,
                rightDx: 0,
                rightDy: 0,
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
                leftDx: 0,
                leftDy: 0,
                rightDx: 0,
                rightDy: 0,
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

let _Registered = false;
/**
 * Registers the FBXFileLoader scene loader plugin.
 * Safe to call multiple times; only the first call has an effect.
 */
export function RegisterFBXFileLoader(): void {
    if (_Registered) {
        return;
    }
    _Registered = true;

    RegisterSceneLoaderPlugin(new FBXFileLoader());
}
