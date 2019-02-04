import { TransformNode } from "babylonjs/Meshes/transformNode";
import { Scene } from "babylonjs/scene";

import { Control3D } from "./control3D";

/**
 * Class used as a root to all buttons
 */
export class AbstractButton3D extends Control3D {
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
        return new TransformNode("button" + this.name);
    }
}