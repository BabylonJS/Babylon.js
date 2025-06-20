/* eslint-disable @typescript-eslint/naming-convention */
import type { GLTFLoader } from "../glTFLoader";
import type { IGLTFLoaderExtension } from "../glTFLoaderExtension";
import { FlowGraphCoordinator } from "core/FlowGraph/flowGraphCoordinator";
import { ParseFlowGraphAsync } from "core/FlowGraph/flowGraphParser";
import { registerGLTFExtension, unregisterGLTFExtension } from "../glTFLoaderExtensionRegistry";
import type { GLTFPathToObjectConverter } from "./gltfPathToObjectConverter";
import { AddObjectAccessor, SetTargetObject, GetPathToObjectConverter } from "./objectModelMapping";
import { InteractivityGraphToFlowGraphParser } from "./KHR_interactivity/interactivityGraphParser";
import { addToBlockFactory } from "core/FlowGraph/Blocks/flowGraphBlockFactory";
import { Quaternion, Vector3 } from "core/Maths/math.vector";
import type { IAnimation, IScene, IKHRInteractivity } from "../glTFLoaderInterfaces";
import { Nullable } from "core/types";

const NAME = "KHR_interactivity";

declare module "../../glTFFileLoader" {
    // eslint-disable-next-line jsdoc/require-jsdoc, @typescript-eslint/naming-convention
    export interface GLTFLoaderExtensionOptions {
        /**
         * Defines options for the KHR_interactivity extension.
         */
        // NOTE: Don't use NAME here as it will break the UMD type declarations.
        ["KHR_interactivity"]: {};
    }
}

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

    private readonly _pathConverter: GLTFPathToObjectConverter<any, any, any>;

    private _loader?: GLTFLoader;
    private _coordinator?: FlowGraphCoordinator;

    /**
     * @internal
     * @param _loader
     */
    constructor(_loader: GLTFLoader) {
        this._loader = _loader;
        this.enabled = this._loader.isExtensionUsed(NAME);
        this._pathConverter = GetPathToObjectConverter(this._loader.gltf);
        // avoid starting animations automatically.
        _loader._skipStartAnimationStep = true;

        // Give the interactivity object a reference to the scene.
        const interactivity = this._loader.gltf.extensions?.KHR_interactivity as IKHRInteractivity;
        if (interactivity) {
            interactivity._babylonScene = _loader.babylonScene;
        }
    }

    public dispose() {
        delete this._loader;
        delete this._coordinator;
    }

    /** @internal */
    public onReady(): void {
        if (this._coordinator) {
            this._coordinator.start();
        }
    }

    /** @internal */
    // eslint-disable-next-line no-restricted-syntax
    public loadSceneAsync(context: string, scene: IScene): Nullable<Promise<void>> {
        if (!this._loader) {
            return null;
        }

        return this._loader.loadSceneAsync(context, scene).then(() => {
            if (!this._loader) {
                return;
            }

            const scene = this._loader.babylonScene;
            const gltf = this._loader.gltf;
            const targetFps = this._loader.parent.targetFps;
            const interactivityDefinition = gltf.extensions?.KHR_interactivity as IKHRInteractivity;
            if (!interactivityDefinition) {
                // This can technically throw, but it's not a critical error
                return;
            }

            const coordinator = new FlowGraphCoordinator({ scene });
            coordinator.dispatchEventsSynchronously = false; // glTF interactivity dispatches events asynchronously

            const graphs = interactivityDefinition.graphs.map((graph) => {
                const parser = new InteractivityGraphToFlowGraphParser(graph, gltf, targetFps);
                return parser.serializeToFlowGraph();
            });

            return Promise.all(graphs.map((graph) => ParseFlowGraphAsync(graph, { coordinator, pathConverter: this._pathConverter }))).then(() => {
                this._coordinator = coordinator;
            });
        });
    }
}

// Add object accessors to object model.
// Note - all of those are read-only, as per the specs!

// Add a target object for the extension for access to scene properties
SetTargetObject("/extensions/KHR_interactivity");

// active camera rotation
AddObjectAccessor("/extensions/KHR_interactivity/activeCamera/rotation", {
    get: (interactivity: IKHRInteractivity) => {
        const scene = interactivity._babylonScene!;
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
    getTarget: (interactivity: IKHRInteractivity) => interactivity._babylonScene!.activeCamera,
});
// activeCamera position
AddObjectAccessor("/extensions/KHR_interactivity/activeCamera/position", {
    get: (interactivity: IKHRInteractivity) => {
        const scene = interactivity._babylonScene!;
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
    getTarget: (interactivity: IKHRInteractivity) => interactivity._babylonScene!.activeCamera,
});

// /animations/{} pointers:
AddObjectAccessor("/animations/{}/extensions/KHR_interactivity/isPlaying", {
    get: (animation: IAnimation) => {
        return animation._babylonAnimationGroup?.isPlaying ?? false;
    },
    type: "boolean",
    getTarget: (animation: IAnimation) => {
        return animation._babylonAnimationGroup;
    },
});
AddObjectAccessor("/animations/{}/extensions/KHR_interactivity/minTime", {
    get: (animation: IAnimation) => {
        return (animation._babylonAnimationGroup?.from ?? 0) / 60; // fixed factor for duration-to-frames conversion
    },
    type: "number",
    getTarget: (animation: IAnimation) => {
        return animation._babylonAnimationGroup;
    },
});
AddObjectAccessor("/animations/{}/extensions/KHR_interactivity/maxTime", {
    get: (animation: IAnimation) => {
        return (animation._babylonAnimationGroup?.to ?? 0) / 60; // fixed factor for duration-to-frames conversion
    },
    type: "number",
    getTarget: (animation: IAnimation) => {
        return animation._babylonAnimationGroup;
    },
});
// playhead
AddObjectAccessor("/animations/{}/extensions/KHR_interactivity/playhead", {
    get: (animation: IAnimation) => {
        return (animation._babylonAnimationGroup?.getCurrentFrame() ?? 0) / 60; // fixed factor for duration-to-frames conversion
    },
    type: "number",
    getTarget: (animation: IAnimation) => {
        return animation._babylonAnimationGroup;
    },
});
// virtualPlayhead - TODO, do we support this property in our animations? getCurrentFrame is the only method we have for this.
AddObjectAccessor("/animations/{}/extensions/KHR_interactivity/virtualPlayhead", {
    get: (animation: IAnimation) => {
        return (animation._babylonAnimationGroup?.getCurrentFrame() ?? 0) / 60; // fixed factor for duration-to-frames conversion
    },
    type: "number",
    getTarget: (animation: IAnimation) => {
        return animation._babylonAnimationGroup;
    },
});

// Register flow graph blocks. Do it here so they are available when the extension is enabled.
addToBlockFactory(NAME, "FlowGraphGLTFDataProvider", async () => {
    return (await import("./KHR_interactivity/flowGraphGLTFDataProvider")).FlowGraphGLTFDataProvider;
});

unregisterGLTFExtension(NAME);
registerGLTFExtension(NAME, true, (loader) => new KHR_interactivity(loader));
