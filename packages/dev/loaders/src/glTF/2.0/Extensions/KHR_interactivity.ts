/* eslint-disable @typescript-eslint/naming-convention */
import type { IKHRInteractivity } from "babylonjs-gltf2interface";
import { GLTFLoader } from "../glTFLoader";
import type { IGLTFLoaderExtension } from "../glTFLoaderExtension";
import { FlowGraphCoordinator, FlowGraph } from "core/FlowGraph";
import { convertGLTFToJson } from "./Interactivity/interactivityFunctions";

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
     * Defines a number that determines the order the extensions are applied.
     */
    // TODO: correct value?
    public order = 195;

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
        if (!this._loader._babylonScene) {
            return;
        }
        const scene = this._loader._babylonScene;
        const definition = this._loader.gltf.extensions?.KHR_interactivity as IKHRInteractivity;

        const json = convertGLTFToJson(definition);
        console.log("json", json);
        const coordinator = new FlowGraphCoordinator({ scene });
        const graph = FlowGraph.Parse(json, coordinator);
        const context = graph.getContext(0);
        for (const [path, node] of this._loader._pathToNodesMapping) {
            context.setVariable(path, node);
        }

        coordinator.start();
        console.log("Graph:", coordinator.flowGraphs[0]);
    }
}

GLTFLoader.RegisterExtension(NAME, (loader) => new KHR_interactivity(loader));
