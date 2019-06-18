import { Nullable } from "babylonjs/types";
import { TransformNode } from "babylonjs/Meshes/transformNode";

import { INode } from "../glTFLoaderInterfaces";
import { IGLTFLoaderExtension } from "../glTFLoaderExtension";
import { GLTFLoader } from "../glTFLoader";

const NAME = "node_extras_as_metadata";

/**
 * Store node extras (if present) in BJS TransformNode metadata
 */
export class CustomProps implements IGLTFLoaderExtension {
    /** The name of this extension. */
    public readonly name = NAME;

    /** Defines whether this extension is enabled. */
    public enabled = true;

    private _loader: GLTFLoader;

    /** @hidden */
    public constructor(loader: GLTFLoader) {
        this._loader = loader;
    }

    /** @hidden */
    public dispose(): void {
        delete this._loader;
    }

    /** @hidden */
    public loadNodeAsync(
        context: string,
        node: INode,
        assign: (babylonMesh: TransformNode) => void
    ): Nullable<Promise<TransformNode>> {
        return this._loader.loadNodeAsync(
            context,
            node,
            (babylonMesh): void => {
                if (node.extras && Object.keys(node.extras).length > 0) {
                    if (!babylonMesh.metadata) {
                        babylonMesh.metadata = {};
                    }
                    Object.assign(babylonMesh.metadata, node.extras);
                }
                assign(babylonMesh);
            }
        );
    }
}

GLTFLoader.RegisterExtension(
    NAME,
    (loader): IGLTFLoaderExtension => new CustomProps(loader)
);
