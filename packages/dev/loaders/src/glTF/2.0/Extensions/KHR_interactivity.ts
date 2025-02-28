/* eslint-disable @typescript-eslint/naming-convention */
import type { IKHRInteractivity } from "babylonjs-gltf2interface";
import type { GLTFLoader } from "../glTFLoader";
import type { IGLTFLoaderExtension } from "../glTFLoaderExtension";
import { FlowGraphCoordinator } from "core/FlowGraph/flowGraphCoordinator";
import { ParseFlowGraphAsync } from "core/FlowGraph/flowGraphParser";
import { registerGLTFExtension, unregisterGLTFExtension } from "../glTFLoaderExtensionRegistry";
import type { GLTFPathToObjectConverter } from "./gltfPathToObjectConverter";
import { AddObjectAccessorToKey, GetPathToObjectConverter } from "./objectModelMapping";
import { InteractivityGraphToFlowGraphParser } from "./KHR_interactivity/interactivityGraphParser";
import { addToBlockFactory } from "core/FlowGraph/Blocks/flowGraphBlockFactory";
import { Quaternion, Vector3 } from "core/Maths/math.vector";
import type { Scene } from "core/scene";
import type { IAnimation } from "../glTFLoaderInterfaces";

const NAME = "KHR_interactivity";

declare module "../../glTFFileLoader" {
    // eslint-disable-next-line jsdoc/require-jsdoc
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

    private _pathConverter?: GLTFPathToObjectConverter<any, any, any>;

    /**
     * @internal
     * @param _loader
     */
    constructor(private _loader: GLTFLoader) {
        this.enabled = this._loader.isExtensionUsed(NAME);
        this._pathConverter = GetPathToObjectConverter(this._loader.gltf);
        // avoid starting animations automatically.
        _loader._skipStartAnimationStep = true;

        // Update object model with new pointers

        const scene = _loader.babylonScene;
        if (scene) {
            _AddInteractivityObjectModel(scene);
        }
    }

    public dispose() {
        (this._loader as any) = null;
        delete this._pathConverter;
    }

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

        const coordinator = new FlowGraphCoordinator({ scene });
        const graphs = interactivityDefinition.graphs.map((graph) => {
            const parser = new InteractivityGraphToFlowGraphParser(graph, this._loader.gltf, this._loader);
            return parser.serializeToFlowGraph();
        });
        // parse each graph async
        await Promise.all(graphs.map((graph) => ParseFlowGraphAsync(graph, { coordinator, pathConverter: this._pathConverter })));

        coordinator.start();
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
            return Quaternion.FromRotationMatrix(scene.activeCamera.getWorldMatrix()).normalize();
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
            return scene.activeCamera.position; // not global position
        },
        type: "Vector3",
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
addToBlockFactory(NAME, "FlowGraphGLTFDataProvider", async () => {
    return (await import("./KHR_interactivity/flowGraphGLTFDataProvider")).FlowGraphGLTFDataProvider;
});

unregisterGLTFExtension(NAME);
registerGLTFExtension(NAME, true, (loader) => new KHR_interactivity(loader));
