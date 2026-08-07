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
import { type IObjectAccessor } from "core/FlowGraph/typeDefinitions";
import { type IPathToObjectConverter } from "core/ObjectModel/objectModelInterfaces";
import { Logger } from "core/Misc/logger";

const NAME = "KHR_interactivity";

/**
 * Loader extension for KHR_interactivity
 */
export class KHR_interactivity implements IGLTFLoaderExtension {
    /**
     * The name of this extension.
     */
    public readonly name = NAME;
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
        this._gltfPathConverter = GetPathToObjectConverter(this._loader.gltf);
        const scene = _loader.babylonScene;
        if (this._gltfPathConverter) {
            // Build a composite that handles both:
            //   - The Babylon-scene namespace (`/extensions/BABYLON_scene_objects/...`),
            //     used by ref values that point at scene objects not described by the
            //     source glTF (e.g. refs emitted by engine-side event blocks).
            //   - The standard glTF object model (everything else), via the existing
            //     glTF converter as a fallback.
            const initialPrefixes: IPathConverterPrefixEntry<IObjectAccessor>[] = [];
            if (scene) {
                initialPrefixes.push({
                    prefix: BABYLON_SCENE_OBJECT_MODEL_PREFIX,
                    converter: new BabylonScenePathToObjectConverter(scene, CreateDefaultBabylonSceneObjectModelTree()),
                });
            }
            // KHR_interactivity ref-validity pointers (`/extensions/KHR_interactivity/events/{}`
            // and `/extensions/KHR_interactivity/delays/{}`) are virtual: they validate an opaque
            // event/delay reference rather than addressing a glTF object, so route them to a
            // dedicated converter instead of the glTF fallback.
            const refConverter = new InteractivityRefPathToObjectConverter();
            initialPrefixes.push({ prefix: EventReferencePrefix, converter: refConverter });
            initialPrefixes.push({ prefix: DelayReferencePrefix, converter: refConverter });
            // Asset capabilities and runtime limits (`/extensions/KHR_interactivity/asset/...` and
            // `/extensions/KHR_interactivity/limits/...`) are virtual too: they describe the asset and the
            // implementation running it rather than addressing a glTF object. The set of enabled extensions is
            // resolved eagerly because the loader is released once loading completes, while the behavior graph
            // keeps querying these pointers at runtime.
            const enabledExtensions = new Set(
                (this._loader.gltf.extensionsUsed ?? []).filter((name) => registeredGLTFExtensions.has(name) && this._loader.parent.extensionOptions[name]?.enabled !== false)
            );
            const assetConverter = new InteractivityAssetPathToObjectConverter(this._loader.gltf, (extensionName) => enabledExtensions.has(extensionName));
            initialPrefixes.push({ prefix: InteractivityAssetCapabilitiesPrefix, converter: assetConverter });
            initialPrefixes.push({ prefix: InteractivityLimitsPrefix, converter: assetConverter });
            this._pathConverter = new CompositePathToObjectConverter<IObjectAccessor>(
                initialPrefixes,
                this._gltfPathConverter as unknown as IPathToObjectConverter<IObjectAccessor>
            );
        }
        // avoid starting animations automatically.
        _loader._skipStartAnimationStep = true;

        // Update object model with new pointers
        if (scene) {
            _AddInteractivityObjectModel(scene);
        }
    }

    public dispose() {
        (this._loader as any) = null;
        delete this._gltfPathConverter;
        delete this._pathConverter;
    }

    // eslint-disable-next-line no-restricted-syntax, @typescript-eslint/no-misused-promises
    public async onReady(): Promise<void> {
        if (!this._loader.babylonScene || !this._pathConverter) {
            return;
        }
        const scene = this._loader.babylonScene;
        const interactivityDefinition = this._loader.gltf.extensions?.KHR_interactivity as IKHRInteractivity;
        if (!interactivityDefinition) {
            // This can technically throw, but it's not a critical error
            return;
        }

        // The specification requires an invalid behavior graph to be rejected. Parse each graph into its
        // own coordinator so a graph that throws part-way can be disposed without leaving a half-built graph
        // registered — a shared coordinator's start() would otherwise run that partial graph. A scene
        // supports many coordinators, and glTF behavior graphs are independent of one another.
        await Promise.all(
            interactivityDefinition.graphs.map(async (graph, index) => {
                const coordinator = new FlowGraphCoordinator({ scene, hostResolver: new InteractivityHostResolver() });
                coordinator.dispatchEventsSynchronously = false; // glTF interactivity dispatches events asynchronously
                try {
                    const parser = new InteractivityGraphToFlowGraphParser(graph, this._loader.gltf, this._loader.parent.targetFps);
                    await ParseFlowGraphAsync(parser.serializeToFlowGraph(), { coordinator, pathConverter: this._pathConverter });
                    // Only start graphs that parsed cleanly; keep loading the rest of the asset either way.
                    coordinator.start();
                } catch (error) {
                    Logger.Error(`KHR_interactivity: rejecting behavior graph #${index}: ${(error as Error)?.message ?? error}`);
                    // Dispose the coordinator (and the partially-built graph it holds) so nothing from the
                    // rejected graph stays registered or running.
                    coordinator.dispose();
                }
            })
        );
    }
}

/**
 * @internal
 * populates the object model with the interactivity extension
 */
export function _AddInteractivityObjectModel(scene: Scene) {
    // Note - all of those are read-only, as per the specs!

    // active camera rotation
    AddObjectAccessorToKey("/extensions/KHR_interactivity/?/activeCamera/rotation", {
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
    });
    // activeCamera position
    AddObjectAccessorToKey("/extensions/KHR_interactivity/?/activeCamera/position", {
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
    });

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
    AddObjectAccessorToKey("/extensions/KHR_interactivity/?/activeCamera/perspective/aspectRatio", {
        get: () => getActivePerspectiveValue((camera) => camera.getEngine().getAspectRatio(camera)),
        type: "number",
        getTarget: () => scene.activeCamera,
    });
    // perspective/yfov (vertical field of view, in radians)
    AddObjectAccessorToKey("/extensions/KHR_interactivity/?/activeCamera/perspective/yfov", {
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
    });
    // perspective/znear (distance to the near clipping plane)
    AddObjectAccessorToKey("/extensions/KHR_interactivity/?/activeCamera/perspective/znear", {
        get: () => getActivePerspectiveValue((camera) => camera.minZ),
        type: "number",
        getTarget: () => scene.activeCamera,
    });
    // perspective/zfar (distance to the far clipping plane; Babylon uses maxZ === 0 to mean an infinite far plane)
    AddObjectAccessorToKey("/extensions/KHR_interactivity/?/activeCamera/perspective/zfar", {
        get: () => getActivePerspectiveValue((camera) => (camera.maxZ === 0 ? Infinity : camera.maxZ)),
        type: "number",
        getTarget: () => scene.activeCamera,
    });
    // orthographic/xmag (half the orthographic width)
    AddObjectAccessorToKey("/extensions/KHR_interactivity/?/activeCamera/orthographic/xmag", {
        get: () =>
            getActiveOrthographicValue((camera) => {
                const halfWidth = camera.getEngine().getRenderWidth() / 2;
                return ((camera.orthoRight ?? halfWidth) - (camera.orthoLeft ?? -halfWidth)) / 2;
            }),
        type: "number",
        getTarget: () => scene.activeCamera,
    });
    // orthographic/ymag (half the orthographic height)
    AddObjectAccessorToKey("/extensions/KHR_interactivity/?/activeCamera/orthographic/ymag", {
        get: () =>
            getActiveOrthographicValue((camera) => {
                const halfHeight = camera.getEngine().getRenderHeight() / 2;
                return ((camera.orthoTop ?? halfHeight) - (camera.orthoBottom ?? -halfHeight)) / 2;
            }),
        type: "number",
        getTarget: () => scene.activeCamera,
    });
    // orthographic/znear (distance to the near clipping plane)
    AddObjectAccessorToKey("/extensions/KHR_interactivity/?/activeCamera/orthographic/znear", {
        get: () => getActiveOrthographicValue((camera) => camera.minZ),
        type: "number",
        getTarget: () => scene.activeCamera,
    });
    // orthographic/zfar (distance to the far clipping plane)
    AddObjectAccessorToKey("/extensions/KHR_interactivity/?/activeCamera/orthographic/zfar", {
        get: () => getActiveOrthographicValue((camera) => camera.maxZ),
        type: "number",
        getTarget: () => scene.activeCamera,
    });

    // /animations/{} pointers:
    AddObjectAccessorToKey("/animations/{}/extensions/KHR_interactivity/isPlaying", {
        get: (animation: IAnimation) => {
            return animation._babylonAnimationGroup?.isPlaying ?? false;
        },
        type: "boolean",
        getTarget: (animation: IAnimation) => {
            return animation._babylonAnimationGroup;
        },
    });
    AddObjectAccessorToKey("/animations/{}/extensions/KHR_interactivity/minTime", {
        get: (animation: IAnimation) => {
            return (animation._babylonAnimationGroup?.from ?? 0) / 60; // fixed factor for duration-to-frames conversion
        },
        type: "number",
        getTarget: (animation: IAnimation) => {
            return animation._babylonAnimationGroup;
        },
    });
    AddObjectAccessorToKey("/animations/{}/extensions/KHR_interactivity/maxTime", {
        get: (animation: IAnimation) => {
            return (animation._babylonAnimationGroup?.to ?? 0) / 60; // fixed factor for duration-to-frames conversion
        },
        type: "number",
        getTarget: (animation: IAnimation) => {
            return animation._babylonAnimationGroup;
        },
    });
    // playhead
    AddObjectAccessorToKey("/animations/{}/extensions/KHR_interactivity/playhead", {
        get: (animation: IAnimation) => {
            return (animation._babylonAnimationGroup?.getCurrentFrame() ?? 0) / 60; // fixed factor for duration-to-frames conversion
        },
        type: "number",
        getTarget: (animation: IAnimation) => {
            return animation._babylonAnimationGroup;
        },
    });
    //virtualPlayhead - TODO, do we support this property in our animations? getCurrentFrame  is the only method we have for this.
    AddObjectAccessorToKey("/animations/{}/extensions/KHR_interactivity/virtualPlayhead", {
        get: (animation: IAnimation) => {
            return (animation._babylonAnimationGroup?.getCurrentFrame() ?? 0) / 60; // fixed factor for duration-to-frames conversion
        },
        type: "number",
        getTarget: (animation: IAnimation) => {
            return animation._babylonAnimationGroup;
        },
    });
}

// Register flow graph blocks. Do it here so they are available when the extension is enabled.

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

    addToBlockFactory(NAME, "FlowGraphGLTFDataProvider", async () => {
        return (await import("./KHR_interactivity/flowGraphGLTFDataProvider")).FlowGraphGLTFDataProvider;
    });

    unregisterGLTFExtension(NAME);

    registerGLTFExtension(NAME, true, (loader) => new KHR_interactivity(loader));
}
