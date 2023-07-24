import { NodeGeometryBlock } from "../nodeGeometryBlock";
import type { NodeGeometryConnectionPoint } from "../nodeGeometryBlockConnectionPoint";
import { RegisterClass } from "../../../Misc/typeStore";

/**
 * Block used to generate the final mesh
 */
export class MeshOutputBlock extends NodeGeometryBlock {

    /**
     * Gets the rgba input component
     */
    public get geometry(): NodeGeometryConnectionPoint {
        return this._inputs[0];
    }

}

RegisterClass("BABYLON.FragmentOutputBlock", MeshOutputBlock);
