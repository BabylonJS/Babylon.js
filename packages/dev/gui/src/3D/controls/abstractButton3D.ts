import { TransformNode } from "core/Meshes/transformNode";
import type { Scene } from "core/scene";
import { ContentDisplay3D } from "./contentDisplay3D";

/**
 * Class used as a root to all buttons
 */
export class AbstractButton3D extends ContentDisplay3D {
    /**
     * Creates a new button
     * @param name defines the control name
     */
    constructor(name?: string) {
        super(name);
    }

    protected _getTypeName(): string {
        return "AbstractButton3D";
    }

    // Mesh association
    protected _createNode(scene: Scene): TransformNode {
        return new TransformNode("button" + this.name, scene);
    }
}
