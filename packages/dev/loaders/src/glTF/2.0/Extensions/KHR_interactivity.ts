/* eslint-disable @typescript-eslint/naming-convention */
import type { IKHRInteractivity } from "babylonjs-gltf2interface";
import { GLTFLoader } from "../glTFLoader";
import type { IGLTFLoaderExtension } from "../glTFLoaderExtension";
import { FlowGraphCoordinator } from "core/FlowGraph/flowGraphCoordinator";
import { FlowGraph } from "core/FlowGraph/flowGraph";
import { FlowGraphPath } from "core/FlowGraph/flowGraphPath";
import { convertGLTFToSerializedFlowGraph } from "./interactivityFunctions";
import { interactivityPathExensions } from "./interactivityPathExtensions";

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

    /**
     * @internal
     * @param _loader
     */
    constructor(private _loader: GLTFLoader) {
        this.enabled = this._loader.isExtensionUsed(NAME);
    }

    public dispose() {
        (this._loader as any) = null;
    }

    public onReady(): void {
        if (!this._loader.babylonScene) {
            return;
        }
        const scene = this._loader.babylonScene;
        const definition = this._loader.gltf.extensions?.KHR_interactivity as IKHRInteractivity;

        // Fill out the array of extensions that the FlowGraphPath can use
        for (const extension of interactivityPathExensions) {
            if (!FlowGraphPath.Extensions.includes(extension)) {
                FlowGraphPath.Extensions.push(extension);
            }
        }
        const json = convertGLTFToSerializedFlowGraph(definition);

        const coordinator = new FlowGraphCoordinator({ scene });
        const graph = FlowGraph.Parse(json, coordinator);
        const context = graph.getContext(0);
        context.setVariable("gltf", this._loader.gltf);

        coordinator.start();
    }
}

GLTFLoader.RegisterExtension(NAME, (loader) => new KHR_interactivity(loader));
