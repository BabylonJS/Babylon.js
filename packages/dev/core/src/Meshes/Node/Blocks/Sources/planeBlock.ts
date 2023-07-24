import { NodeGeometryBlockConnectionPointTypes } from "../../Enums/nodeMaterialGeometryConnectionPointTypes";
import { NodeGeometryBlock } from "../../nodeGeometryBlock";

/**
 * Defines a block used to generate plane geometry data
 */
export class PlaneBlock extends NodeGeometryBlock {
    /**
     * Create a new FragmentOMeshOutputBlockutputBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this.registerOutput("geometry", NodeGeometryBlockConnectionPointTypes.Geometry);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public getClassName() {
        return "PlaneBlock";
    }
}
