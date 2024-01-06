/* eslint-disable @typescript-eslint/naming-convention */
import type { IKHRInteractivity } from "babylonjs-gltf2interface";
import { GLTFLoader } from "../glTFLoader";
import type { IGLTFLoaderExtension } from "../glTFLoaderExtension";
import { FlowGraphCoordinator } from "core/FlowGraph/flowGraphCoordinator";
import { FlowGraph } from "core/FlowGraph/flowGraph";
import { convertGLTFToSerializedFlowGraph } from "./interactivityFunctions";
import { InteractivityPathToObjectConverter } from "./interactivityPathToObjectConverter";

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

    private _pathConverter?: InteractivityPathToObjectConverter;

    /**
     * @internal
     * @param _loader
     */
    constructor(private _loader: GLTFLoader) {
        this.enabled = this._loader.isExtensionUsed(NAME);
        this._pathConverter = new InteractivityPathToObjectConverter(this._loader.gltf);
    }

    public dispose() {
        (this._loader as any) = null;
        delete this._pathConverter;
    }

    public onReady(): void {
        if (!this._loader.babylonScene || !this._pathConverter) {
            return;
        }
        const scene = this._loader.babylonScene;
        const interactivityDefinition = this._loader.gltf.extensions?.KHR_interactivity as IKHRInteractivity;

        const json = convertGLTFToSerializedFlowGraph(interactivityDefinition);
        const coordinator = new FlowGraphCoordinator({ scene });
        FlowGraph.Parse(json, { coordinator, pathConverter: this._pathConverter });

        coordinator.start();
    }
}

GLTFLoader.RegisterExtension(NAME, (loader) => new KHR_interactivity(loader));
