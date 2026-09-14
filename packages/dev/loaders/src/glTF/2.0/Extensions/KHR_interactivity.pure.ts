/* eslint-disable @typescript-eslint/naming-convention */
import { type IKHRInteractivity } from "babylonjs-gltf2interface";
import { type GLTFLoader } from "../glTFLoader.pure";
import { type IGLTFLoaderExtension } from "../glTFLoaderExtension";
import { FlowGraphCoordinator } from "core/FlowGraph/flowGraphCoordinator";
import { ParseFlowGraphAsync } from "core/FlowGraph/flowGraphParser";
import { registerGLTFExtension, unregisterGLTFExtension, registeredGLTFExtensions } from "../glTFLoaderExtensionRegistry";
import { type GLTFPathToObjectConverter } from "./gltfPathToObjectConverter";
import { AddObjectAccessorToKey, GetPathToObjectConverter } from "./objectModelMapping";
import { InteractivityGraphToFlowGraphParser } from "./KHR_interactivity/interactivityGraphParser";
import { addToBlockFactory } from "core/FlowGraph/Blocks/flowGraphBlockFactory";
import { Quaternion, Vector3 } from "core/Maths/math.vector.pure";
import { type Scene } from "core/scene";
import { type Camera } from "core/Cameras/camera";
import { Constants } from "core/Engines/constants";
import { type IAnimation } from "../glTFLoaderInterfaces";
import { CompositePathToObjectConverter, type IPathConverterPrefixEntry } from "./compositePathToObjectConverter";
import { BabylonScenePathToObjectConverter, BABYLON_SCENE_OBJECT_MODEL_PREFIX, CreateDefaultBabylonSceneObjectModelTree } from "./babylonScenePathToObjectConverter";
import { InteractivityRefPathToObjectConverter } from "./interactivityRefPathToObjectConverter";
import { InteractivityAssetPathToObjectConverter, InteractivityAssetCapabilitiesPrefix, InteractivityLimitsPrefix } from "./interactivityAssetPathToObjectConverter";
import { EventReferencePrefix, DelayReferencePrefix } from "./KHR_interactivity/interactivityReferences";
import { InteractivityHostResolver } from "./KHR_interactivity/interactivityHostResolver";
import { type IObjectAccessor, type ISerializedFlowGraph } from "core/FlowGraph/typeDefinitions";
import { type IPathToObjectConverter } from "core/ObjectModel/objectModelInterfaces";
import { Logger } from "core/Misc/logger";
import {
    CreateKHRInteractivityDocument,
    type IKHRInteractivityDiagnostic,
    type IKHRInteractivityDocument,
    type IKHRInteractivityGraphModel,
} from "./KHR_interactivity/interactivityGraphModel";
import { type FlowGraph } from "core/FlowGraph/flowGraph";

const NAME = "KHR_interactivity";

/**
 * Runtime projection of one canonical KHR_interactivity graph.
 */
export interface IKHRInteractivityGraphImportResult {
    /** Canonical source graph and diagnostics. */
    graph: IKHRInteractivityGraphModel;
    /** Executable FlowGraph serialization when lowering succeeded. */
    serializedFlowGraph?: ISerializedFlowGraph;
    /** Runtime FlowGraph when runtime construction was requested. */
    flowGraph?: FlowGraph;
    /** Coordinator that owns the runtime FlowGraph. */
    coordinator?: FlowGraphCoordinator;
    /** Additional lowering/runtime diagnostics. */
    diagnostics: IKHRInteractivityDiagnostic[];
}

/**
 * Completed KHR_interactivity import result associated with a loaded scene.
 */
export interface IKHRInteractivityImportResult {
    /** Stable zero-based identity of this interactivity asset among assets appended to the scene. */
    assetIndex: number;
    /** Canonical, lossless source document. */
    document: IKHRInteractivityDocument;
    /** Graph import results in source order. */
    graphs: IKHRInteractivityGraphImportResult[];
    /** Shared path converter required by pointer blocks. */
    pathConverter: CompositePathToObjectConverter<IObjectAccessor>;
    /** Live glTF loader data used by glTF data-provider blocks. */
    glTF: GLTFLoader["gltf"];
    /** Host resolver that supplies KHR reference semantics to executable graphs. */
    hostResolver: InteractivityHostResolver;
}

const _ImportResults = /*#__PURE__*/ new WeakMap<Scene, IKHRInteractivityImportResult[]>();

/**
 * Gets the completed KHR_interactivity import result for a loaded scene.
 * @param scene scene loaded from the glTF asset
 * @returns the import result, or undefined when the scene has no KHR_interactivity data
 */
export function GetKHRInteractivityImportResult(scene: Scene): IKHRInteractivityImportResult | undefined {
    const results = _ImportResults.get(scene);
    return results?.[results.length - 1];
}

/**
 * Gets every completed KHR_interactivity import result appended to a loaded scene.
 * Results remain in asset load order and each result has a stable {@link IKHRInteractivityImportResult.assetIndex}.
 * @param scene scene containing the loaded glTF assets
 * @returns the scene's import results, or an empty array when it has no KHR_interactivity data
 */
export function GetKHRInteractivityImportResults(scene: Scene): readonly IKHRInteractivityImportResult[] {
    return _ImportResults.get(scene) ?? [];
}

/**
 * Loader extension for KHR_interactivity
 */
export class KHR_interactivity implements IGLTFLoaderExtension {
    /**
     * The name of this extension.
     */
    public readonly name = NAME;
    /** Runs after extensions that contribute interactivity operations and object state. */
    public readonly order = 200;
    /**
     * Defines whether this extension is enabled.
     */
    public enabled: boolean;

    private _gltfPathConverter?: GLTFPathToObjectConverter<any, any, any>;
    private _pathConverter?: CompositePathToObjectConverter<IObjectAccessor>;

    /**
     * @internal
     * @param _loader
     */
    constructor(private _loader: GLTFLoader) {
        this.enabled = this._loader.isExtensionUsed(NAME);
        // avoid starting animations automatically.
        _loader._skipStartAnimationStep = true;
    }

    private _initializePathConverter(scene: Scene): CompositePathToObjectConverter<IObjectAccessor> {
        this._gltfPathConverter = GetPathToObjectConverter(this._loader.gltf, (mapping) => _AddInteractivityObjectModel(scene, this._loader.parent.targetFps, mapping));
        const initialPrefixes: IPathConverterPrefixEntry<IObjectAccessor>[] = [
            {
                prefix: BABYLON_SCENE_OBJECT_MODEL_PREFIX,
                converter: new BabylonScenePathToObjectConverter(scene, CreateDefaultBabylonSceneObjectModelTree()),
            },
        ];
        const refConverter = new InteractivityRefPathToObjectConverter();
        initialPrefixes.push({ prefix: EventReferencePrefix, converter: refConverter });
        initialPrefixes.push({ prefix: DelayReferencePrefix, converter: refConverter });
        const enabledExtensions = new Set(
            (this._loader.gltf.extensionsUsed ?? []).filter((name) => registeredGLTFExtensions.has(name) && this._loader.parent.extensionOptions[name]?.enabled !== false)
        );
        const assetConverter = new InteractivityAssetPathToObjectConverter(this._loader.gltf, (extensionName) => enabledExtensions.has(extensionName));
        initialPrefixes.push({ prefix: InteractivityAssetCapabilitiesPrefix, converter: assetConverter });
        initialPrefixes.push({ prefix: InteractivityLimitsPrefix, converter: assetConverter });
        const pathConverter = new CompositePathToObjectConverter<IObjectAccessor>(initialPrefixes, this._gltfPathConverter as unknown as IPathToObjectConverter<IObjectAccessor>);
        this._pathConverter = pathConverter;
        return pathConverter;
    }

    public dispose() {
        (this._loader as any) = null;
        delete this._gltfPathConverter;
        delete this._pathConverter;
    }

    public async onReady(): Promise<void> {
        if (!this._loader.babylonScene) {
            return;
        }
        const scene = this._loader.babylonScene;
        const pathConverter = this._initializePathConverter(scene);
        const interactivityDefinition = this._loader.gltf.extensions?.KHR_interactivity as IKHRInteractivity;
        if (!interactivityDefinition) {
            // This can technically throw, but it's not a critical error
            return;
        }

        const supportedExtensions = new Set(
            (this._loader.gltf.extensionsUsed ?? []).filter((extensionName) => this._loader.parent.extensionOptions[extensionName]?.enabled !== false)
        );
        const document = CreateKHRInteractivityDocument(interactivityDefinition, supportedExtensions, this._loader.gltf.nodes?.length ?? 0);
        const options = this._loader.parent.extensionOptions[NAME];
        const autoStart = options?.autoStart ?? true;
        const parseOnly = options?.parseOnly ?? false;
        const strictValidation = options?.strictValidation ?? true;
        const importResults = _ImportResults.get(scene) ?? [];
        const result: IKHRInteractivityImportResult = {
            assetIndex: importResults.length,
            document,
            graphs: [],
            pathConverter,
            glTF: this._loader.gltf,
            hostResolver: new InteractivityHostResolver(),
        };
        importResults.push(result);
        _ImportResults.set(scene, importResults);

        await Promise.all(
            document.graphs.map(async (graphModel) => {
                const graphResult: IKHRInteractivityGraphImportResult = {
                    graph: graphModel,
                    diagnostics: graphModel.diagnostics.slice(),
                };
                result.graphs[graphModel.index] = graphResult;
                if (!graphModel.valid && strictValidation) {
                    Logger.Error(`KHR_interactivity: rejecting behavior graph #${graphModel.index}: ${graphModel.diagnostics.map((diagnostic) => diagnostic.message).join("; ")}`);
                    return;
                }
                try {
                    const parser = new InteractivityGraphToFlowGraphParser(
                        strictValidation ? graphModel.effectiveSource : graphModel.source,
                        this._loader.gltf,
                        this._loader.parent.targetFps,
                        graphModel.index,
                        supportedExtensions,
                        strictValidation ? graphModel.declarations : undefined
                    );
                    const serializedFlowGraph = parser.serializeToFlowGraph();
                    graphResult.serializedFlowGraph = serializedFlowGraph;
                    if (parseOnly) {
                        return;
                    }
                    const coordinator = new FlowGraphCoordinator({ scene, hostResolver: result.hostResolver });
                    coordinator.dispatchEventsSynchronously = false;
                    graphResult.coordinator = coordinator;
                    graphResult.flowGraph = await ParseFlowGraphAsync(serializedFlowGraph, { coordinator, pathConverter });
                    if (autoStart && graphModel.index === document.defaultGraphIndex) {
                        coordinator.start();
                    }
                } catch (error) {
                    const message = (error as Error)?.message ?? String(error);
                    graphResult.diagnostics.push({
                        path: graphModel.path,
                        message,
                        severity: "error",
                    });
                    Logger.Error(`KHR_interactivity: rejecting behavior graph #${graphModel.index}: ${message}`);
                    graphResult.coordinator?.dispose();
                    delete graphResult.coordinator;
                    delete graphResult.flowGraph;
                    delete graphResult.serializedFlowGraph;
                }
            })
        );
    }
}

/**
 * @internal
 * populates the object model with the interactivity extension
 */
export function _AddInteractivityObjectModel(scene: Scene, targetFps: number, mapping: object) {
    // Note - all of those are read-only, as per the specs!

    // active camera rotation
    AddObjectAccessorToKey(
        "/extensions/KHR_interactivity/?/activeCamera/rotation",
        {
            get: () => {
                if (!scene.activeCamera) {
                    return new Quaternion(NaN, NaN, NaN, NaN);
                }
                const quat = Quaternion.FromRotationMatrix(scene.activeCamera.getWorldMatrix()).normalize();
                if (!scene.useRightHandedSystem) {
                    quat.w *= -1; // glTF uses right-handed system, while babylon uses left-handed
                    quat.x *= -1; // glTF uses right-handed system, while babylon uses left-handed
                }
                return quat;
            },
            type: "Quaternion",
            getTarget: () => scene.activeCamera,
        },
        mapping
    );
    // activeCamera position
    AddObjectAccessorToKey(
        "/extensions/KHR_interactivity/?/activeCamera/position",
        {
            get: () => {
                if (!scene.activeCamera) {
                    return new Vector3(NaN, NaN, NaN);
                }
                const pos = scene.activeCamera.getWorldMatrix().getTranslation(); // not global position
                if (!scene.useRightHandedSystem) {
                    pos.x *= -1; // glTF uses right-handed system, while babylon uses left-handed
                }
                return pos;
            },
            type: "Vector3",
            getTarget: () => scene.activeCamera,
        },
        mapping
    );

    // activeCamera projection properties. Per the spec these read-only values are NaN when there is no
    // active camera, or when the active camera does not use the projection type of the requested pointer
    // (all perspective properties are NaN for an orthographic camera, and vice-versa).
    const getActivePerspectiveValue = (compute: (camera: Camera) => number): number => {
        const camera = scene.activeCamera;
        if (!camera || camera.mode === Constants.ORTHOGRAPHIC_CAMERA) {
            return NaN;
        }
        return compute(camera);
    };
    const getActiveOrthographicValue = (compute: (camera: Camera) => number): number => {
        const camera = scene.activeCamera;
        if (!camera || camera.mode !== Constants.ORTHOGRAPHIC_CAMERA) {
            return NaN;
        }
        return compute(camera);
    };

    // perspective/aspectRatio (width over height)
    AddObjectAccessorToKey(
        "/extensions/KHR_interactivity/?/activeCamera/perspective/aspectRatio",
        {
            get: () => getActivePerspectiveValue((camera) => camera.getEngine().getAspectRatio(camera)),
            type: "number",
            getTarget: () => scene.activeCamera,
        },
        mapping
    );
    // perspective/yfov (vertical field of view, in radians)
    AddObjectAccessorToKey(
        "/extensions/KHR_interactivity/?/activeCamera/perspective/yfov",
        {
            get: () =>
                getActivePerspectiveValue((camera) => {
                    // Babylon stores the vertical fov when fovMode is vertical-fixed (the default and what the glTF
                    // loader sets). For a horizontal-fixed camera, convert the horizontal fov to vertical.
                    if (camera.fovMode === Constants.FOVMODE_VERTICAL_FIXED) {
                        return camera.fov;
                    }
                    const aspectRatio = camera.getEngine().getAspectRatio(camera);
                    return aspectRatio ? 2 * Math.atan(Math.tan(camera.fov / 2) / aspectRatio) : camera.fov;
                }),
            type: "number",
            getTarget: () => scene.activeCamera,
        },
        mapping
    );
    // perspective/znear (distance to the near clipping plane)
    AddObjectAccessorToKey(
        "/extensions/KHR_interactivity/?/activeCamera/perspective/znear",
        {
            get: () => getActivePerspectiveValue((camera) => camera.minZ),
            type: "number",
            getTarget: () => scene.activeCamera,
        },
        mapping
    );
    // perspective/zfar (distance to the far clipping plane; Babylon uses maxZ === 0 to mean an infinite far plane)
    AddObjectAccessorToKey(
        "/extensions/KHR_interactivity/?/activeCamera/perspective/zfar",
        {
            get: () => getActivePerspectiveValue((camera) => (camera.maxZ === 0 ? Infinity : camera.maxZ)),
            type: "number",
            getTarget: () => scene.activeCamera,
        },
        mapping
    );
    // orthographic/xmag (half the orthographic width)
    AddObjectAccessorToKey(
        "/extensions/KHR_interactivity/?/activeCamera/orthographic/xmag",
        {
            get: () =>
                getActiveOrthographicValue((camera) => {
                    const halfWidth = camera.getEngine().getRenderWidth() / 2;
                    return ((camera.orthoRight ?? halfWidth) - (camera.orthoLeft ?? -halfWidth)) / 2;
                }),
            type: "number",
            getTarget: () => scene.activeCamera,
        },
        mapping
    );
    // orthographic/ymag (half the orthographic height)
    AddObjectAccessorToKey(
        "/extensions/KHR_interactivity/?/activeCamera/orthographic/ymag",
        {
            get: () =>
                getActiveOrthographicValue((camera) => {
                    const halfHeight = camera.getEngine().getRenderHeight() / 2;
                    return ((camera.orthoTop ?? halfHeight) - (camera.orthoBottom ?? -halfHeight)) / 2;
                }),
            type: "number",
            getTarget: () => scene.activeCamera,
        },
        mapping
    );
    // orthographic/znear (distance to the near clipping plane)
    AddObjectAccessorToKey(
        "/extensions/KHR_interactivity/?/activeCamera/orthographic/znear",
        {
            get: () => getActiveOrthographicValue((camera) => camera.minZ),
            type: "number",
            getTarget: () => scene.activeCamera,
        },
        mapping
    );
    // orthographic/zfar (distance to the far clipping plane)
    AddObjectAccessorToKey(
        "/extensions/KHR_interactivity/?/activeCamera/orthographic/zfar",
        {
            get: () => getActiveOrthographicValue((camera) => camera.maxZ),
            type: "number",
            getTarget: () => scene.activeCamera,
        },
        mapping
    );

    const getAnimationFps = (animation: IAnimation): number => animation._babylonAnimationGroup?.targetedAnimations?.[0]?.animation.framePerSecond ?? targetFps;

    // /animations/{} pointers:
    AddObjectAccessorToKey(
        "/animations/{}/extensions/KHR_interactivity/isPlaying",
        {
            get: (animation: IAnimation) => {
                return animation._babylonAnimationGroup?.isPlaying ?? false;
            },
            type: "boolean",
            getTarget: (animation: IAnimation) => {
                return animation._babylonAnimationGroup;
            },
        },
        mapping
    );
    AddObjectAccessorToKey(
        "/animations/{}/extensions/KHR_interactivity/minTime",
        {
            get: (animation: IAnimation) => {
                return (animation._babylonAnimationGroup?.from ?? 0) / getAnimationFps(animation);
            },
            type: "number",
            getTarget: (animation: IAnimation) => {
                return animation._babylonAnimationGroup;
            },
        },
        mapping
    );
    AddObjectAccessorToKey(
        "/animations/{}/extensions/KHR_interactivity/maxTime",
        {
            get: (animation: IAnimation) => {
                return (animation._babylonAnimationGroup?.to ?? 0) / getAnimationFps(animation);
            },
            type: "number",
            getTarget: (animation: IAnimation) => {
                return animation._babylonAnimationGroup;
            },
        },
        mapping
    );
    // playhead
    AddObjectAccessorToKey(
        "/animations/{}/extensions/KHR_interactivity/playhead",
        {
            get: (animation: IAnimation) => {
                return (animation._babylonAnimationGroup?.getRetainedCurrentFrame() ?? 0) / getAnimationFps(animation);
            },
            type: "number",
            getTarget: (animation: IAnimation) => {
                return animation._babylonAnimationGroup;
            },
        },
        mapping
    );
    AddObjectAccessorToKey(
        "/animations/{}/extensions/KHR_interactivity/virtualPlayhead",
        {
            get: (animation: IAnimation) => {
                return (animation._babylonAnimationGroup?.getVirtualCurrentFrame() ?? 0) / getAnimationFps(animation);
            },
            type: "number",
            getTarget: (animation: IAnimation) => {
                return animation._babylonAnimationGroup;
            },
        },
        mapping
    );
}

let _RuntimeRegistered = false;
/**
 * @internal
 * Registers KHR_interactivity runtime dependencies without changing the extension registry.
 */
export function _RegisterKHRInteractivityRuntime(): void {
    if (_RuntimeRegistered) {
        return;
    }
    _RuntimeRegistered = true;

    addToBlockFactory(NAME, "FlowGraphGLTFDataProvider", async () => {
        return (await import("./KHR_interactivity/flowGraphGLTFDataProvider")).FlowGraphGLTFDataProvider;
    });
    addToBlockFactory(NAME, "FlowGraphUnsupportedInteractivityBlock", async () => {
        return (await import("./KHR_interactivity/flowGraphUnsupportedInteractivityBlock")).FlowGraphUnsupportedInteractivityBlock;
    });
    addToBlockFactory(NAME, "FlowGraphObjectReferenceBlock", async () => {
        return (await import("./KHR_interactivity/flowGraphObjectReferenceBlock")).FlowGraphObjectReferenceBlock;
    });
    addToBlockFactory(NAME, "FlowGraphEventReferenceBlock", async () => {
        return (await import("./KHR_interactivity/flowGraphEventReferenceBlock")).FlowGraphEventReferenceBlock;
    });
}

let _Registered = false;
/**
 * Registers the KHR_interactivity glTF loader extension.
 * Safe to call multiple times; only the first call has an effect.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export function RegisterKHR_interactivity(): void {
    if (_Registered) {
        return;
    }
    _Registered = true;

    _RegisterKHRInteractivityRuntime();

    unregisterGLTFExtension(NAME);

    registerGLTFExtension(NAME, true, (loader) => new KHR_interactivity(loader));
}
