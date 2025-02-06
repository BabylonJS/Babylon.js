/* eslint-disable @typescript-eslint/naming-convention */
import type { IKHRInteractivity } from "babylonjs-gltf2interface";
import type { GLTFLoader } from "../glTFLoader";
import type { IGLTFLoaderExtension } from "../glTFLoaderExtension";
import { FlowGraphCoordinator } from "core/FlowGraph/flowGraphCoordinator";
import { ParseFlowGraphAsync } from "core/FlowGraph/flowGraphParser";
import { registerGLTFExtension, unregisterGLTFExtension } from "../glTFLoaderExtensionRegistry";
import type { GLTFPathToObjectConverter } from "./gltfPathToObjectConverter";
import { getPathToObjectConverter } from "./objectModelMapping";
import { GLTFLoaderAnimationStartMode } from "loaders/glTF/glTFFileLoader";
import { InteractivityGraphToFlowGraphParser } from "./KHR_interactivity/interactivityGraphParser";

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
        this._pathConverter = getPathToObjectConverter(this._loader.gltf);
        // avoid starting animations automatically.
        _loader.parent.animationStartMode = GLTFLoaderAnimationStartMode.NONE;
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
            const parser = new InteractivityGraphToFlowGraphParser(graph, this._loader.gltf);
            return parser.serializeToFlowGraph();
        });
        // parse each graph async
        await Promise.all(graphs.map((graph) => ParseFlowGraphAsync(graph, { coordinator, pathConverter: this._pathConverter })));

        coordinator.start();
    }
}

unregisterGLTFExtension(NAME);
registerGLTFExtension(NAME, true, (loader) => new KHR_interactivity(loader));
