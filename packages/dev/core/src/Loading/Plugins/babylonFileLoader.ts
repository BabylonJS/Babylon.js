import { Logger } from "../../Misc/logger";
import type { Nullable } from "../../types";
import { Camera } from "../../Cameras/camera";
import type { Scene } from "../../scene";
import { Vector3 } from "../../Maths/math.vector";
import { Color3, Color4 } from "../../Maths/math.color";
import { Mesh } from "../../Meshes/mesh";
import type { AbstractMesh } from "../../Meshes/abstractMesh";
import { Geometry } from "../../Meshes/geometry";
import type { Node } from "../../node";
import { TransformNode } from "../../Meshes/transformNode";
import { Material } from "../../Materials/material";
import { MultiMaterial } from "../../Materials/multiMaterial";
import { CubeTexture } from "../../Materials/Textures/cubeTexture";
import { HDRCubeTexture } from "../../Materials/Textures/hdrCubeTexture";
import { AnimationGroup } from "../../Animations/animationGroup";
import { Light } from "../../Lights/light";
import { SceneComponentConstants } from "../../sceneComponent";
import { SceneLoader } from "../../Loading/sceneLoader";
import { AssetContainer } from "../../assetContainer";
import { ActionManager } from "../../Actions/actionManager";
import type { IParticleSystem } from "../../Particles/IParticleSystem";
import { Skeleton } from "../../Bones/skeleton";
import { MorphTargetManager } from "../../Morph/morphTargetManager";
import { CannonJSPlugin } from "../../Physics/v1/Plugins/cannonJSPlugin";
import { OimoJSPlugin } from "../../Physics/v1/Plugins/oimoJSPlugin";
import { AmmoJSPlugin } from "../../Physics/v1/Plugins/ammoJSPlugin";
import { ReflectionProbe } from "../../Probes/reflectionProbe";
import { GetClass } from "../../Misc/typeStore";
import { Tools } from "../../Misc/tools";
import { PostProcess } from "../../PostProcesses/postProcess";
import { SpriteManager } from "core/Sprites/spriteManager";
import { GetIndividualParser, Parse } from "./babylonFileParser.function";

/** @internal */
// eslint-disable-next-line @typescript-eslint/naming-convention, no-var
export var _BabylonLoaderRegistered = true;

/**
 * Helps setting up some configuration for the babylon file loader.
 */
export class BabylonFileLoaderConfiguration {
    /**
     * The loader does not allow injecting custom physics engine into the plugins.
     * Unfortunately in ES6, we need to manually inject them into the plugin.
     * So you could set this variable to your engine import to make it work.
     */
    public static LoaderInjectedPhysicsEngine: any = undefined;
}

let tempIndexContainer: { [key: string]: Node } = {};
let tempMaterialIndexContainer: { [key: string]: Material } = {};
let tempMorphTargetManagerIndexContainer: { [key: string]: MorphTargetManager } = {};

const parseMaterialByPredicate = (predicate: (parsedMaterial: any) => boolean, parsedData: any, scene: Scene, rootUrl: string) => {
    if (!parsedData.materials) {
        return null;
    }

    for (let index = 0, cache = parsedData.materials.length; index < cache; index++) {
        const parsedMaterial = parsedData.materials[index];
        if (predicate(parsedMaterial)) {
            return { parsedMaterial, material: Material.Parse(parsedMaterial, scene, rootUrl) };
        }
    }
    return null;
};

const isDescendantOf = (mesh: any, names: Array<any>, hierarchyIds: Array<number>) => {
    for (const i in names) {
        if (mesh.name === names[i]) {
            hierarchyIds.push(mesh.id);
            return true;
        }
    }
    if (mesh.parentId !== undefined && hierarchyIds.indexOf(mesh.parentId) !== -1) {
        hierarchyIds.push(mesh.id);
        return true;
    }
    return false;
};

// eslint-disable-next-line @typescript-eslint/naming-convention
const logOperation = (operation: string, producer: { file: string; name: string; version: string; exporter_version: string }) => {
    return (
        operation +
        " of " +
        (producer ? producer.file + " from " + producer.name + " version: " + producer.version + ", exporter version: " + producer.exporter_version : "unknown")
    );
};

const loadDetailLevels = (scene: Scene, mesh: AbstractMesh) => {
    const mastermesh: Mesh = mesh as Mesh;

    // Every value specified in the ids array of the lod data points to another mesh which should be used as the lower LOD level.
    // The distances (or coverages) array values specified are used along with the lod mesh ids as a hint to determine the switching threshold for the various LODs.
    if (mesh._waitingData.lods) {
        if (mesh._waitingData.lods.ids && mesh._waitingData.lods.ids.length > 0) {
            const lodmeshes: string[] = mesh._waitingData.lods.ids;
            const wasenabled: boolean = mastermesh.isEnabled(false);
            if (mesh._waitingData.lods.distances) {
                const distances: number[] = mesh._waitingData.lods.distances;
                if (distances.length >= lodmeshes.length) {
                    const culling: number = distances.length > lodmeshes.length ? distances[distances.length - 1] : 0;
                    mastermesh.setEnabled(false);
                    for (let index = 0; index < lodmeshes.length; index++) {
                        const lodid: string = lodmeshes[index];
                        const lodmesh: Mesh = scene.getMeshById(lodid) as Mesh;
                        if (lodmesh != null) {
                            mastermesh.addLODLevel(distances[index], lodmesh);
                        }
                    }
                    if (culling > 0) {
                        mastermesh.addLODLevel(culling, null);
                    }
                    if (wasenabled === true) {
                        mastermesh.setEnabled(true);
                    }
                } else {
                    Tools.Warn("Invalid level of detail distances for " + mesh.name);
                }
            }
        }
        mesh._waitingData.lods = null;
    }
};

const findParent = (parentId: any, parentInstanceIndex: any, scene: Scene) => {
    if (typeof parentId !== "number") {
        const parentEntry = scene.getLastEntryById(parentId);
        if (parentEntry && parentInstanceIndex !== undefined && parentInstanceIndex !== null) {
            const instance = (parentEntry as Mesh).instances[parseInt(parentInstanceIndex)];
            return instance;
        }
        return parentEntry;
    }

    const parent = tempIndexContainer[parentId];
    if (parent && parentInstanceIndex !== undefined && parentInstanceIndex !== null) {
        const instance = (parent as Mesh).instances[parseInt(parentInstanceIndex)];
        return instance;
    }

    return parent;
};

const findMaterial = (materialId: any, scene: Scene) => {
    if (typeof materialId !== "number") {
        return scene.getLastMaterialById(materialId, true);
    }

    return tempMaterialIndexContainer[materialId];
};

const loadAssetContainer = (scene: Scene, data: string, rootUrl: string, onError?: (message: string, exception?: any) => void, addToScene = false): AssetContainer => {
    const container = new AssetContainer(scene);

    // Entire method running in try block, so ALWAYS logs as far as it got, only actually writes details
    // when SceneLoader.debugLogging = true (default), or exception encountered.
    // Everything stored in var log instead of writing separate lines to support only writing in exception,
    // and avoid problems with multiple concurrent .babylon loads.
    let log = "importScene has failed JSON parse";
    try {
        // eslint-disable-next-line no-var
        var parsedData = JSON.parse(data);
        log = "";
        const fullDetails = SceneLoader.loggingLevel === SceneLoader.DETAILED_LOGGING;

        let index: number;
        let cache: number;

        // Environment texture
        if (parsedData.environmentTexture !== undefined && parsedData.environmentTexture !== null) {
            // PBR needed for both HDR texture (gamma space) & a sky box
            const isPBR = parsedData.isPBR !== undefined ? parsedData.isPBR : true;
            if (parsedData.environmentTextureType && parsedData.environmentTextureType === "BABYLON.HDRCubeTexture") {
                const hdrSize: number = parsedData.environmentTextureSize ? parsedData.environmentTextureSize : 128;
                const hdrTexture = new HDRCubeTexture(
                    (parsedData.environmentTexture.match(/https?:\/\//g) ? "" : rootUrl) + parsedData.environmentTexture,
                    scene,
                    hdrSize,
                    true,
                    !isPBR,
                    undefined,
                    parsedData.environmentTexturePrefilterOnLoad
                );
                if (parsedData.environmentTextureRotationY) {
                    hdrTexture.rotationY = parsedData.environmentTextureRotationY;
                }
                scene.environmentTexture = hdrTexture;
            } else {
                if (typeof parsedData.environmentTexture === "object") {
                    const environmentTexture = CubeTexture.Parse(parsedData.environmentTexture, scene, rootUrl);
                    scene.environmentTexture = environmentTexture;
                } else if ((parsedData.environmentTexture as string).endsWith(".env")) {
                    const compressedTexture = new CubeTexture(
                        (parsedData.environmentTexture.match(/https?:\/\//g) ? "" : rootUrl) + parsedData.environmentTexture,
                        scene,
                        parsedData.environmentTextureForcedExtension
                    );
                    if (parsedData.environmentTextureRotationY) {
                        compressedTexture.rotationY = parsedData.environmentTextureRotationY;
                    }
                    scene.environmentTexture = compressedTexture;
                } else {
                    const cubeTexture = CubeTexture.CreateFromPrefilteredData(
                        (parsedData.environmentTexture.match(/https?:\/\//g) ? "" : rootUrl) + parsedData.environmentTexture,
                        scene,
                        parsedData.environmentTextureForcedExtension
                    );
                    if (parsedData.environmentTextureRotationY) {
                        cubeTexture.rotationY = parsedData.environmentTextureRotationY;
                    }
                    scene.environmentTexture = cubeTexture;
                }
            }
            if (parsedData.createDefaultSkybox === true) {
                const skyboxScale = scene.activeCamera !== undefined && scene.activeCamera !== null ? (scene.activeCamera.maxZ - scene.activeCamera.minZ) / 2 : 1000;
                const skyboxBlurLevel = parsedData.skyboxBlurLevel || 0;
                scene.createDefaultSkybox(scene.environmentTexture, isPBR, skyboxScale, skyboxBlurLevel);
            }
            container.environmentTexture = scene.environmentTexture;
        }

        // Environment Intensity
        if (parsedData.environmentIntensity !== undefined && parsedData.environmentIntensity !== null) {
            scene.environmentIntensity = parsedData.environmentIntensity;
        }

        // IBL Intensity
        if (parsedData.iblIntensity !== undefined && parsedData.iblIntensity !== null) {
            scene.iblIntensity = parsedData.iblIntensity;
        }

        // Lights
        if (parsedData.lights !== undefined && parsedData.lights !== null) {
            for (index = 0, cache = parsedData.lights.length; index < cache; index++) {
                const parsedLight = parsedData.lights[index];
                const light = Light.Parse(parsedLight, scene);
                if (light) {
                    tempIndexContainer[parsedLight.uniqueId] = light;
                    container.lights.push(light);
                    light._parentContainer = container;
                    log += index === 0 ? "\n\tLights:" : "";
                    log += "\n\t\t" + light.toString(fullDetails);
                }
            }
        }

        // Reflection probes
        if (parsedData.reflectionProbes !== undefined && parsedData.reflectionProbes !== null) {
            for (index = 0, cache = parsedData.reflectionProbes.length; index < cache; index++) {
                const parsedReflectionProbe = parsedData.reflectionProbes[index];
                const reflectionProbe = ReflectionProbe.Parse(parsedReflectionProbe, scene, rootUrl);
                if (reflectionProbe) {
                    container.reflectionProbes.push(reflectionProbe);
                    reflectionProbe._parentContainer = container;
                    log += index === 0 ? "\n\tReflection Probes:" : "";
                    log += "\n\t\t" + reflectionProbe.toString(fullDetails);
                }
            }
        }

        // Animations
        if (parsedData.animations !== undefined && parsedData.animations !== null) {
            for (index = 0, cache = parsedData.animations.length; index < cache; index++) {
                const parsedAnimation = parsedData.animations[index];
                const internalClass = GetClass("BABYLON.Animation");
                if (internalClass) {
                    const animation = internalClass.Parse(parsedAnimation);
                    scene.animations.push(animation);
                    container.animations.push(animation);
                    log += index === 0 ? "\n\tAnimations:" : "";
                    log += "\n\t\t" + animation.toString(fullDetails);
                }
            }
        }

        // Materials
        if (parsedData.materials !== undefined && parsedData.materials !== null) {
            for (index = 0, cache = parsedData.materials.length; index < cache; index++) {
                const parsedMaterial = parsedData.materials[index];
                const mat = Material.Parse(parsedMaterial, scene, rootUrl);
                if (mat) {
                    tempMaterialIndexContainer[parsedMaterial.uniqueId || parsedMaterial.id] = mat;
                    container.materials.push(mat);
                    mat._parentContainer = container;
                    log += index === 0 ? "\n\tMaterials:" : "";
                    log += "\n\t\t" + mat.toString(fullDetails);

                    // Textures
                    const textures = mat.getActiveTextures();
                    for (const t of textures) {
                        if (container.textures.indexOf(t) == -1) {
                            container.textures.push(t);
                            t._parentContainer = container;
                        }
                    }
                }
            }
        }

        if (parsedData.multiMaterials !== undefined && parsedData.multiMaterials !== null) {
            for (index = 0, cache = parsedData.multiMaterials.length; index < cache; index++) {
                const parsedMultiMaterial = parsedData.multiMaterials[index];
                const mmat = MultiMaterial.ParseMultiMaterial(parsedMultiMaterial, scene);
                tempMaterialIndexContainer[parsedMultiMaterial.uniqueId || parsedMultiMaterial.id] = mmat;
                container.multiMaterials.push(mmat);
                mmat._parentContainer = container;

                log += index === 0 ? "\n\tMultiMaterials:" : "";
                log += "\n\t\t" + mmat.toString(fullDetails);

                // Textures
                const textures = mmat.getActiveTextures();
                for (const t of textures) {
                    if (container.textures.indexOf(t) == -1) {
                        container.textures.push(t);
                        t._parentContainer = container;
                    }
                }
            }
        }

        // Morph targets
        if (parsedData.morphTargetManagers !== undefined && parsedData.morphTargetManagers !== null) {
            for (const parsedManager of parsedData.morphTargetManagers) {
                const manager = MorphTargetManager.Parse(parsedManager, scene);
                tempMorphTargetManagerIndexContainer[parsedManager.id] = manager;
                container.morphTargetManagers.push(manager);
                manager._parentContainer = container;
            }
        }

        // Skeletons
        if (parsedData.skeletons !== undefined && parsedData.skeletons !== null) {
            for (index = 0, cache = parsedData.skeletons.length; index < cache; index++) {
                const parsedSkeleton = parsedData.skeletons[index];
                const skeleton = Skeleton.Parse(parsedSkeleton, scene);
                container.skeletons.push(skeleton);
                skeleton._parentContainer = container;
                log += index === 0 ? "\n\tSkeletons:" : "";
                log += "\n\t\t" + skeleton.toString(fullDetails);
            }
        }

        // Geometries
        const geometries = parsedData.geometries;
        if (geometries !== undefined && geometries !== null) {
            const addedGeometry = new Array<Nullable<Geometry>>();

            // VertexData
            const vertexData = geometries.vertexData;
            if (vertexData !== undefined && vertexData !== null) {
                for (index = 0, cache = vertexData.length; index < cache; index++) {
                    const parsedVertexData = vertexData[index];
                    addedGeometry.push(Geometry.Parse(parsedVertexData, scene, rootUrl));
                }
            }

            for (const g of addedGeometry) {
                if (g) {
                    container.geometries.push(g);
                    g._parentContainer = container;
                }
            }
        }

        // Transform nodes
        if (parsedData.transformNodes !== undefined && parsedData.transformNodes !== null) {
            for (index = 0, cache = parsedData.transformNodes.length; index < cache; index++) {
                const parsedTransformNode = parsedData.transformNodes[index];
                const node = TransformNode.Parse(parsedTransformNode, scene, rootUrl);
                tempIndexContainer[parsedTransformNode.uniqueId] = node;
                container.transformNodes.push(node);
                node._parentContainer = container;
            }
        }

        // Meshes
        if (parsedData.meshes !== undefined && parsedData.meshes !== null) {
            for (index = 0, cache = parsedData.meshes.length; index < cache; index++) {
                const parsedMesh = parsedData.meshes[index];
                const mesh = <AbstractMesh>Mesh.Parse(parsedMesh, scene, rootUrl);
                tempIndexContainer[parsedMesh.uniqueId] = mesh;
                container.meshes.push(mesh);
                mesh._parentContainer = container;
                if (mesh.hasInstances) {
                    for (const instance of (mesh as Mesh).instances) {
                        container.meshes.push(instance);
                        instance._parentContainer = container;
                    }
                }
                log += index === 0 ? "\n\tMeshes:" : "";
                log += "\n\t\t" + mesh.toString(fullDetails);
            }
        }

        // Cameras
        if (parsedData.cameras !== undefined && parsedData.cameras !== null) {
            for (index = 0, cache = parsedData.cameras.length; index < cache; index++) {
                const parsedCamera = parsedData.cameras[index];
                const camera = Camera.Parse(parsedCamera, scene);
                tempIndexContainer[parsedCamera.uniqueId] = camera;
                container.cameras.push(camera);
                camera._parentContainer = container;
                log += index === 0 ? "\n\tCameras:" : "";
                log += "\n\t\t" + camera.toString(fullDetails);
            }
        }

        // Postprocesses
        if (parsedData.postProcesses !== undefined && parsedData.postProcesses !== null) {
            for (index = 0, cache = parsedData.postProcesses.length; index < cache; index++) {
                const parsedPostProcess = parsedData.postProcesses[index];
                const postProcess = PostProcess.Parse(parsedPostProcess, scene, rootUrl);
                if (postProcess) {
                    container.postProcesses.push(postProcess);
                    postProcess._parentContainer = container;
                    log += index === 0 ? "\nPostprocesses:" : "";
                    log += "\n\t\t" + postProcess.toString();
                }
            }
        }

        // Animation Groups
        if (parsedData.animationGroups !== undefined && parsedData.animationGroups !== null) {
            for (index = 0, cache = parsedData.animationGroups.length; index < cache; index++) {
                const parsedAnimationGroup = parsedData.animationGroups[index];
                const animationGroup = AnimationGroup.Parse(parsedAnimationGroup, scene);
                container.animationGroups.push(animationGroup);
                animationGroup._parentContainer = container;
                log += index === 0 ? "\n\tAnimationGroups:" : "";
                log += "\n\t\t" + animationGroup.toString(fullDetails);
            }
        }

        // Sprites
        if (parsedData.spriteManagers) {
            for (let index = 0, cache = parsedData.spriteManagers.length; index < cache; index++) {
                const parsedSpriteManager = parsedData.spriteManagers[index];
                const spriteManager = SpriteManager.Parse(parsedSpriteManager, scene, rootUrl);
                log += "\n\t\tSpriteManager " + spriteManager.name;
            }
        }

        // Browsing all the graph to connect the dots
        for (index = 0, cache = scene.cameras.length; index < cache; index++) {
            const camera = scene.cameras[index];
            if (camera._waitingParentId !== null) {
                camera.parent = findParent(camera._waitingParentId, camera._waitingParentInstanceIndex, scene);
                camera._waitingParentId = null;
                camera._waitingParentInstanceIndex = null;
            }
        }

        for (index = 0, cache = scene.lights.length; index < cache; index++) {
            const light = scene.lights[index];
            if (light && light._waitingParentId !== null) {
                light.parent = findParent(light._waitingParentId, light._waitingParentInstanceIndex, scene);
                light._waitingParentId = null;
                light._waitingParentInstanceIndex = null;
            }
        }

        // Connect parents & children and parse actions and lods
        for (index = 0, cache = scene.transformNodes.length; index < cache; index++) {
            const transformNode = scene.transformNodes[index];
            if (transformNode._waitingParentId !== null) {
                transformNode.parent = findParent(transformNode._waitingParentId, transformNode._waitingParentInstanceIndex, scene);
                transformNode._waitingParentId = null;
                transformNode._waitingParentInstanceIndex = null;
            }
        }
        for (index = 0, cache = scene.meshes.length; index < cache; index++) {
            const mesh = scene.meshes[index];
            if (mesh._waitingParentId !== null) {
                mesh.parent = findParent(mesh._waitingParentId, mesh._waitingParentInstanceIndex, scene);
                mesh._waitingParentId = null;
                mesh._waitingParentInstanceIndex = null;
            }
            if (mesh._waitingData.lods) {
                loadDetailLevels(scene, mesh);
            }
        }

        // link multimats with materials
        for (const multimat of scene.multiMaterials) {
            for (const subMaterial of multimat._waitingSubMaterialsUniqueIds) {
                multimat.subMaterials.push(findMaterial(subMaterial, scene));
            }
            multimat._waitingSubMaterialsUniqueIds = [];
        }

        // link meshes with materials
        for (const mesh of scene.meshes) {
            if (mesh._waitingMaterialId !== null) {
                mesh.material = findMaterial(mesh._waitingMaterialId, scene);
                mesh._waitingMaterialId = null;
            }
        }

        // link meshes with morph target managers
        for (const mesh of scene.meshes) {
            if (mesh._waitingMorphTargetManagerId !== null) {
                mesh.morphTargetManager = tempMorphTargetManagerIndexContainer[mesh._waitingMorphTargetManagerId];
                mesh._waitingMorphTargetManagerId = null;
            }
        }

        // link skeleton transform nodes
        for (index = 0, cache = scene.skeletons.length; index < cache; index++) {
            const skeleton = scene.skeletons[index];
            if (skeleton._hasWaitingData) {
                if (skeleton.bones != null) {
                    for (const bone of skeleton.bones) {
                        if (bone._waitingTransformNodeId) {
                            const linkTransformNode = scene.getLastEntryById(bone._waitingTransformNodeId) as TransformNode;
                            if (linkTransformNode) {
                                bone.linkTransformNode(linkTransformNode);
                            }
                            bone._waitingTransformNodeId = null;
                        }
                    }
                }

                skeleton._hasWaitingData = null;
            }
        }

        // freeze world matrix application
        for (index = 0, cache = scene.meshes.length; index < cache; index++) {
            const currentMesh = scene.meshes[index];
            if (currentMesh._waitingData.freezeWorldMatrix) {
                currentMesh.freezeWorldMatrix();
                currentMesh._waitingData.freezeWorldMatrix = null;
            } else {
                currentMesh.computeWorldMatrix(true);
            }
        }

        // Lights exclusions / inclusions
        for (index = 0, cache = scene.lights.length; index < cache; index++) {
            const light = scene.lights[index];
            // Excluded check
            if (light._excludedMeshesIds.length > 0) {
                for (let excludedIndex = 0; excludedIndex < light._excludedMeshesIds.length; excludedIndex++) {
                    const excludedMesh = scene.getMeshById(light._excludedMeshesIds[excludedIndex]);

                    if (excludedMesh) {
                        light.excludedMeshes.push(excludedMesh);
                    }
                }

                light._excludedMeshesIds = [];
            }

            // Included check
            if (light._includedOnlyMeshesIds.length > 0) {
                for (let includedOnlyIndex = 0; includedOnlyIndex < light._includedOnlyMeshesIds.length; includedOnlyIndex++) {
                    const includedOnlyMesh = scene.getMeshById(light._includedOnlyMeshesIds[includedOnlyIndex]);

                    if (includedOnlyMesh) {
                        light.includedOnlyMeshes.push(includedOnlyMesh);
                    }
                }

                light._includedOnlyMeshesIds = [];
            }
        }

        for (const g of scene.geometries) {
            g._loadedUniqueId = "";
        }

        Parse(parsedData, scene, container, rootUrl);

        // Actions (scene) Done last as it can access other objects.
        for (index = 0, cache = scene.meshes.length; index < cache; index++) {
            const mesh = scene.meshes[index];
            if (mesh._waitingData.actions) {
                ActionManager.Parse(mesh._waitingData.actions, mesh, scene);
                mesh._waitingData.actions = null;
            }
        }
        if (parsedData.actions !== undefined && parsedData.actions !== null) {
            ActionManager.Parse(parsedData.actions, null, scene);
        }
    } catch (err) {
        const msg = logOperation("loadAssets", parsedData ? parsedData.producer : "Unknown") + log;
        if (onError) {
            onError(msg, err);
        } else {
            Logger.Log(msg);
            throw err;
        }
    } finally {
        tempIndexContainer = {};
        tempMaterialIndexContainer = {};
        tempMorphTargetManagerIndexContainer = {};

        if (!addToScene) {
            container.removeAllFromScene();
        }
        if (log !== null && SceneLoader.loggingLevel !== SceneLoader.NO_LOGGING) {
            Logger.Log(logOperation("loadAssets", parsedData ? parsedData.producer : "Unknown") + (SceneLoader.loggingLevel !== SceneLoader.MINIMAL_LOGGING ? log : ""));
        }
    }

    return container;
};

SceneLoader.RegisterPlugin({
    name: "babylon.js",
    extensions: ".babylon",
    canDirectLoad: (data: string) => {
        if (data.indexOf("babylon") !== -1) {
            // We consider that the producer string is filled
            return true;
        }

        return false;
    },
    importMesh: (
        meshesNames: any,
        scene: Scene,
        data: any,
        rootUrl: string,
        meshes: AbstractMesh[],
        particleSystems: IParticleSystem[],
        skeletons: Skeleton[],
        onError?: (message: string, exception?: any) => void
    ): boolean => {
        // Entire method running in try block, so ALWAYS logs as far as it got, only actually writes details
        // when SceneLoader.debugLogging = true (default), or exception encountered.
        // Everything stored in var log instead of writing separate lines to support only writing in exception,
        // and avoid problems with multiple concurrent .babylon loads.
        let log = "importMesh has failed JSON parse";
        try {
            // eslint-disable-next-line no-var
            var parsedData = JSON.parse(data);
            log = "";
            const fullDetails = SceneLoader.loggingLevel === SceneLoader.DETAILED_LOGGING;
            if (!meshesNames) {
                meshesNames = null;
            } else if (!Array.isArray(meshesNames)) {
                meshesNames = [meshesNames];
            }

            const hierarchyIds: number[] = [];
            const parsedIdToNodeMap = new Map<number, Node>();

            // Transform nodes (the overall idea is to load all of them as this is super fast and then get rid of the ones we don't need)
            const loadedTransformNodes = [];
            if (parsedData.transformNodes !== undefined && parsedData.transformNodes !== null) {
                for (let index = 0, cache = parsedData.transformNodes.length; index < cache; index++) {
                    const parsedJSONTransformNode = parsedData.transformNodes[index];
                    const parsedTransformNode = TransformNode.Parse(parsedJSONTransformNode, scene, rootUrl);
                    loadedTransformNodes.push(parsedTransformNode);
                    parsedIdToNodeMap.set(parsedTransformNode._waitingParsedUniqueId!, parsedTransformNode);
                    parsedTransformNode._waitingParsedUniqueId = null;
                }
            }
            if (parsedData.meshes !== undefined && parsedData.meshes !== null) {
                const loadedSkeletonsIds = [];
                const loadedMaterialsIds: string[] = [];
                const loadedMaterialsUniqueIds: string[] = [];
                const loadedMorphTargetManagerIds: number[] = [];
                for (let index = 0, cache = parsedData.meshes.length; index < cache; index++) {
                    const parsedMesh = parsedData.meshes[index];

                    if (meshesNames === null || isDescendantOf(parsedMesh, meshesNames, hierarchyIds)) {
                        if (meshesNames !== null) {
                            // Remove found mesh name from list.
                            delete meshesNames[meshesNames.indexOf(parsedMesh.name)];
                        }

                        //Geometry?
                        if (parsedMesh.geometryId !== undefined && parsedMesh.geometryId !== null) {
                            //does the file contain geometries?
                            if (parsedData.geometries !== undefined && parsedData.geometries !== null) {
                                //find the correct geometry and add it to the scene
                                let found: boolean = false;
                                const geoms = ["boxes", "spheres", "cylinders", "toruses", "grounds", "planes", "torusKnots", "vertexData"];
                                for (const geometryType of geoms) {
                                    if (!parsedData.geometries[geometryType] || !Array.isArray(parsedData.geometries[geometryType])) {
                                        continue;
                                    }
                                    const geom = parsedData.geometries[geometryType];
                                    for (const parsedGeometryData of geom) {
                                        if (parsedGeometryData.id === parsedMesh.geometryId) {
                                            switch (geometryType) {
                                                case "vertexData":
                                                    Geometry.Parse(parsedGeometryData, scene, rootUrl);
                                                    break;
                                            }
                                            found = true;
                                            break;
                                        }
                                    }

                                    if (found) {
                                        break;
                                    }
                                }
                                if (found === false) {
                                    Logger.Warn("Geometry not found for mesh " + parsedMesh.id);
                                }
                            }
                        }

                        // Material ?
                        if (parsedMesh.materialUniqueId || parsedMesh.materialId) {
                            // if we have a unique ID, look up and store in loadedMaterialsUniqueIds, else use loadedMaterialsIds
                            const materialArray = parsedMesh.materialUniqueId ? loadedMaterialsUniqueIds : loadedMaterialsIds;
                            let materialFound = materialArray.indexOf(parsedMesh.materialUniqueId || parsedMesh.materialId) !== -1;
                            if (materialFound === false && parsedData.multiMaterials !== undefined && parsedData.multiMaterials !== null) {
                                // Loads a submaterial of a multimaterial
                                const loadSubMaterial = (subMatId: string, predicate: (parsedMaterial: any) => boolean) => {
                                    materialArray.push(subMatId);
                                    const mat = parseMaterialByPredicate(predicate, parsedData, scene, rootUrl);
                                    if (mat && mat.material) {
                                        tempMaterialIndexContainer[mat.parsedMaterial.uniqueId || mat.parsedMaterial.id] = mat.material;
                                        log += "\n\tMaterial " + mat.material.toString(fullDetails);
                                    }
                                };
                                for (let multimatIndex = 0, multimatCache = parsedData.multiMaterials.length; multimatIndex < multimatCache; multimatIndex++) {
                                    const parsedMultiMaterial = parsedData.multiMaterials[multimatIndex];
                                    if (
                                        (parsedMesh.materialUniqueId && parsedMultiMaterial.uniqueId === parsedMesh.materialUniqueId) ||
                                        parsedMultiMaterial.id === parsedMesh.materialId
                                    ) {
                                        if (parsedMultiMaterial.materialsUniqueIds) {
                                            // if the materials inside the multimat are stored by unique id
                                            for (const subMatId of parsedMultiMaterial.materialsUniqueIds) {
                                                loadSubMaterial(subMatId, (parsedMaterial) => parsedMaterial.uniqueId === subMatId);
                                            }
                                        } else {
                                            // if the mats are stored by id instead
                                            for (const subMatId of parsedMultiMaterial.materials) {
                                                loadSubMaterial(subMatId, (parsedMaterial) => parsedMaterial.id === subMatId);
                                            }
                                        }
                                        materialArray.push(parsedMultiMaterial.uniqueId || parsedMultiMaterial.id);
                                        const mmat = MultiMaterial.ParseMultiMaterial(parsedMultiMaterial, scene);
                                        tempMaterialIndexContainer[parsedMultiMaterial.uniqueId || parsedMultiMaterial.id] = mmat;
                                        if (mmat) {
                                            materialFound = true;
                                            log += "\n\tMulti-Material " + mmat.toString(fullDetails);
                                        }
                                        break;
                                    }
                                }
                            }

                            if (materialFound === false) {
                                materialArray.push(parsedMesh.materialUniqueId || parsedMesh.materialId);
                                const mat = parseMaterialByPredicate(
                                    (parsedMaterial) =>
                                        (parsedMesh.materialUniqueId && parsedMaterial.uniqueId === parsedMesh.materialUniqueId) || parsedMaterial.id === parsedMesh.materialId,
                                    parsedData,
                                    scene,
                                    rootUrl
                                );
                                if (!mat || !mat.material) {
                                    Logger.Warn("Material not found for mesh " + parsedMesh.id);
                                } else {
                                    tempMaterialIndexContainer[mat.parsedMaterial.uniqueId || mat.parsedMaterial.id] = mat.material;
                                    log += "\n\tMaterial " + mat.material.toString(fullDetails);
                                }
                            }
                        }

                        // Skeleton ?
                        if (
                            parsedMesh.skeletonId !== null &&
                            parsedMesh.skeletonId !== undefined &&
                            parsedData.skeletonId !== -1 &&
                            parsedData.skeletons !== undefined &&
                            parsedData.skeletons !== null
                        ) {
                            const skeletonAlreadyLoaded = loadedSkeletonsIds.indexOf(parsedMesh.skeletonId) > -1;
                            if (!skeletonAlreadyLoaded) {
                                for (let skeletonIndex = 0, skeletonCache = parsedData.skeletons.length; skeletonIndex < skeletonCache; skeletonIndex++) {
                                    const parsedSkeleton = parsedData.skeletons[skeletonIndex];
                                    if (parsedSkeleton.id === parsedMesh.skeletonId) {
                                        const skeleton = Skeleton.Parse(parsedSkeleton, scene);
                                        skeletons.push(skeleton);
                                        loadedSkeletonsIds.push(parsedSkeleton.id);
                                        log += "\n\tSkeleton " + skeleton.toString(fullDetails);
                                    }
                                }
                            }
                        }

                        // Morph targets ?
                        if (parsedMesh.morphTargetManagerId > -1 && parsedData.morphTargetManagers !== undefined && parsedData.morphTargetManagers !== null) {
                            const morphTargetManagerAlreadyLoaded = loadedMorphTargetManagerIds.indexOf(parsedMesh.morphTargetManagerId) > -1;
                            if (!morphTargetManagerAlreadyLoaded) {
                                for (let morphTargetManagerIndex = 0; morphTargetManagerIndex < parsedData.morphTargetManagers.length; morphTargetManagerIndex++) {
                                    const parsedManager = parsedData.morphTargetManagers[morphTargetManagerIndex];
                                    if (parsedManager.id === parsedMesh.morphTargetManagerId) {
                                        const morphTargetManager = MorphTargetManager.Parse(parsedManager, scene);
                                        tempMorphTargetManagerIndexContainer[parsedManager.id] = morphTargetManager;
                                        loadedMorphTargetManagerIds.push(parsedManager.id);
                                        log += "\nMorph target manager" + morphTargetManager.toString();
                                    }
                                }
                            }
                        }

                        const mesh = Mesh.Parse(parsedMesh, scene, rootUrl);
                        meshes.push(mesh);
                        parsedIdToNodeMap.set(mesh._waitingParsedUniqueId!, mesh);
                        mesh._waitingParsedUniqueId = null;
                        log += "\n\tMesh " + mesh.toString(fullDetails);
                    }
                }

                // link multimats with materials
                for (const multimat of scene.multiMaterials) {
                    for (const subMaterial of multimat._waitingSubMaterialsUniqueIds) {
                        multimat.subMaterials.push(findMaterial(subMaterial, scene));
                    }
                    multimat._waitingSubMaterialsUniqueIds = [];
                }

                // link meshes with materials
                for (const mesh of scene.meshes) {
                    if (mesh._waitingMaterialId !== null) {
                        mesh.material = findMaterial(mesh._waitingMaterialId, scene);
                        mesh._waitingMaterialId = null;
                    }
                }

                // link meshes with morph target managers
                for (const mesh of scene.meshes) {
                    if (mesh._waitingMorphTargetManagerId !== null) {
                        mesh.morphTargetManager = tempMorphTargetManagerIndexContainer[mesh._waitingMorphTargetManagerId];
                        mesh._waitingMorphTargetManagerId = null;
                    }
                }

                // Connecting parents and lods
                for (let index = 0, cache = scene.transformNodes.length; index < cache; index++) {
                    const transformNode = scene.transformNodes[index];
                    if (transformNode._waitingParentId !== null) {
                        let parent = parsedIdToNodeMap.get(parseInt(transformNode._waitingParentId)) || null;
                        if (parent === null) {
                            parent = scene.getLastEntryById(transformNode._waitingParentId);
                        }
                        let parentNode = parent;
                        if (transformNode._waitingParentInstanceIndex) {
                            parentNode = (parent as Mesh).instances[parseInt(transformNode._waitingParentInstanceIndex)];
                            transformNode._waitingParentInstanceIndex = null;
                        }
                        transformNode.parent = parentNode;
                        transformNode._waitingParentId = null;
                    }
                }
                let currentMesh: AbstractMesh;
                for (let index = 0, cache = scene.meshes.length; index < cache; index++) {
                    currentMesh = scene.meshes[index];
                    if (currentMesh._waitingParentId) {
                        let parent = parsedIdToNodeMap.get(parseInt(currentMesh._waitingParentId)) || null;
                        if (parent === null) {
                            parent = scene.getLastEntryById(currentMesh._waitingParentId);
                        }
                        let parentNode = parent;
                        if (currentMesh._waitingParentInstanceIndex) {
                            parentNode = (parent as Mesh).instances[parseInt(currentMesh._waitingParentInstanceIndex)];
                            currentMesh._waitingParentInstanceIndex = null;
                        }
                        currentMesh.parent = parentNode;
                        currentMesh._waitingParentId = null;
                    }
                    if (currentMesh._waitingData.lods) {
                        loadDetailLevels(scene, currentMesh);
                    }
                }

                // Remove unused transform nodes
                for (const transformNode of loadedTransformNodes) {
                    const childMeshes = transformNode.getChildMeshes(false);
                    if (!childMeshes.length) {
                        transformNode.dispose();
                    }
                }

                // link skeleton transform nodes
                for (let index = 0, cache = scene.skeletons.length; index < cache; index++) {
                    const skeleton = scene.skeletons[index];
                    if (skeleton._hasWaitingData) {
                        if (skeleton.bones != null) {
                            for (const bone of skeleton.bones) {
                                if (bone._waitingTransformNodeId) {
                                    const linkTransformNode = scene.getLastEntryById(bone._waitingTransformNodeId) as TransformNode;
                                    if (linkTransformNode) {
                                        bone.linkTransformNode(linkTransformNode);
                                    }
                                    bone._waitingTransformNodeId = null;
                                }
                            }
                        }

                        skeleton._hasWaitingData = null;
                    }
                }

                // freeze and compute world matrix application
                for (let index = 0, cache = scene.meshes.length; index < cache; index++) {
                    currentMesh = scene.meshes[index];
                    if (currentMesh._waitingData.freezeWorldMatrix) {
                        currentMesh.freezeWorldMatrix();
                        currentMesh._waitingData.freezeWorldMatrix = null;
                    } else {
                        currentMesh.computeWorldMatrix(true);
                    }
                }
            }

            // Particles
            if (parsedData.particleSystems !== undefined && parsedData.particleSystems !== null) {
                const parser = GetIndividualParser(SceneComponentConstants.NAME_PARTICLESYSTEM);
                if (parser) {
                    for (let index = 0, cache = parsedData.particleSystems.length; index < cache; index++) {
                        const parsedParticleSystem = parsedData.particleSystems[index];
                        if (hierarchyIds.indexOf(parsedParticleSystem.emitterId) !== -1) {
                            particleSystems.push(parser(parsedParticleSystem, scene, rootUrl));
                        }
                    }
                }
            }

            for (const g of scene.geometries) {
                g._loadedUniqueId = "";
            }

            return true;
        } catch (err) {
            const msg = logOperation("importMesh", parsedData ? parsedData.producer : "Unknown") + log;
            if (onError) {
                onError(msg, err);
            } else {
                Logger.Log(msg);
                throw err;
            }
        } finally {
            if (log !== null && SceneLoader.loggingLevel !== SceneLoader.NO_LOGGING) {
                Logger.Log(logOperation("importMesh", parsedData ? parsedData.producer : "Unknown") + (SceneLoader.loggingLevel !== SceneLoader.MINIMAL_LOGGING ? log : ""));
            }
            tempMaterialIndexContainer = {};
            tempMorphTargetManagerIndexContainer = {};
        }

        return false;
    },
    load: (scene: Scene, data: string, rootUrl: string, onError?: (message: string, exception?: any) => void): boolean => {
        // Entire method running in try block, so ALWAYS logs as far as it got, only actually writes details
        // when SceneLoader.debugLogging = true (default), or exception encountered.
        // Everything stored in var log instead of writing separate lines to support only writing in exception,
        // and avoid problems with multiple concurrent .babylon loads.
        let log = "importScene has failed JSON parse";
        try {
            // eslint-disable-next-line no-var
            var parsedData = JSON.parse(data);
            log = "";

            // Scene
            if (parsedData.useDelayedTextureLoading !== undefined && parsedData.useDelayedTextureLoading !== null) {
                scene.useDelayedTextureLoading = parsedData.useDelayedTextureLoading && !SceneLoader.ForceFullSceneLoadingForIncremental;
            }
            if (parsedData.autoClear !== undefined && parsedData.autoClear !== null) {
                scene.autoClear = parsedData.autoClear;
            }
            if (parsedData.clearColor !== undefined && parsedData.clearColor !== null) {
                scene.clearColor = Color4.FromArray(parsedData.clearColor);
            }
            if (parsedData.ambientColor !== undefined && parsedData.ambientColor !== null) {
                scene.ambientColor = Color3.FromArray(parsedData.ambientColor);
            }
            if (parsedData.gravity !== undefined && parsedData.gravity !== null) {
                scene.gravity = Vector3.FromArray(parsedData.gravity);
            }

            if (parsedData.useRightHandedSystem !== undefined) {
                scene.useRightHandedSystem = !!parsedData.useRightHandedSystem;
            }

            // Fog
            if (parsedData.fogMode !== undefined && parsedData.fogMode !== null) {
                scene.fogMode = parsedData.fogMode;
            }
            if (parsedData.fogColor !== undefined && parsedData.fogColor !== null) {
                scene.fogColor = Color3.FromArray(parsedData.fogColor);
            }
            if (parsedData.fogStart !== undefined && parsedData.fogStart !== null) {
                scene.fogStart = parsedData.fogStart;
            }
            if (parsedData.fogEnd !== undefined && parsedData.fogEnd !== null) {
                scene.fogEnd = parsedData.fogEnd;
            }
            if (parsedData.fogDensity !== undefined && parsedData.fogDensity !== null) {
                scene.fogDensity = parsedData.fogDensity;
            }
            log += "\tFog mode for scene:  ";
            switch (scene.fogMode) {
                case 0:
                    log += "none\n";
                    break;
                // getters not compiling, so using hardcoded
                case 1:
                    log += "exp\n";
                    break;
                case 2:
                    log += "exp2\n";
                    break;
                case 3:
                    log += "linear\n";
                    break;
            }

            //Physics
            if (parsedData.physicsEnabled) {
                let physicsPlugin;
                if (parsedData.physicsEngine === "cannon" || parsedData.physicsEngine === CannonJSPlugin.name) {
                    physicsPlugin = new CannonJSPlugin(undefined, undefined, BabylonFileLoaderConfiguration.LoaderInjectedPhysicsEngine);
                } else if (parsedData.physicsEngine === "oimo" || parsedData.physicsEngine === OimoJSPlugin.name) {
                    physicsPlugin = new OimoJSPlugin(undefined, BabylonFileLoaderConfiguration.LoaderInjectedPhysicsEngine);
                } else if (parsedData.physicsEngine === "ammo" || parsedData.physicsEngine === AmmoJSPlugin.name) {
                    physicsPlugin = new AmmoJSPlugin(undefined, BabylonFileLoaderConfiguration.LoaderInjectedPhysicsEngine, undefined);
                }
                log = "\tPhysics engine " + (parsedData.physicsEngine ? parsedData.physicsEngine : "oimo") + " enabled\n";
                //else - default engine, which is currently oimo
                const physicsGravity = parsedData.gravity ? Vector3.FromArray(parsedData.gravity) : parsedData.physicsGravity ? Vector3.FromArray(parsedData.physicsGravity) : null;
                scene.enablePhysics(physicsGravity, physicsPlugin);
            }

            // Metadata
            if (parsedData.metadata !== undefined && parsedData.metadata !== null) {
                scene.metadata = parsedData.metadata;
            }

            //collisions, if defined. otherwise, default is true
            if (parsedData.collisionsEnabled !== undefined && parsedData.collisionsEnabled !== null) {
                scene.collisionsEnabled = parsedData.collisionsEnabled;
            }

            const container = loadAssetContainer(scene, data, rootUrl, onError, true);
            if (!container) {
                return false;
            }

            if (parsedData.autoAnimate) {
                scene.beginAnimation(scene, parsedData.autoAnimateFrom, parsedData.autoAnimateTo, parsedData.autoAnimateLoop, parsedData.autoAnimateSpeed || 1.0);
            }

            if (parsedData.activeCameraID !== undefined && parsedData.activeCameraID !== null) {
                scene.setActiveCameraById(parsedData.activeCameraID);
            }

            // Finish
            return true;
        } catch (err) {
            const msg = logOperation("importScene", parsedData ? parsedData.producer : "Unknown") + log;
            if (onError) {
                onError(msg, err);
            } else {
                Logger.Log(msg);
                throw err;
            }
        } finally {
            if (log !== null && SceneLoader.loggingLevel !== SceneLoader.NO_LOGGING) {
                Logger.Log(logOperation("importScene", parsedData ? parsedData.producer : "Unknown") + (SceneLoader.loggingLevel !== SceneLoader.MINIMAL_LOGGING ? log : ""));
            }
        }
        return false;
    },
    loadAssetContainer: (scene: Scene, data: string, rootUrl: string, onError?: (message: string, exception?: any) => void): AssetContainer => {
        const container = loadAssetContainer(scene, data, rootUrl, onError);
        return container;
    },
});
