import { FrameGraphBlock } from "../frameGraphBlock";
import type { FrameGraphConnectionPoint } from "../frameGraphBlockConnectionPoint";
import { RegisterClass } from "../../Misc/typeStore";
import { FrameGraphBlockConnectionPointTypes } from "../Enums/frameGraphBlockConnectionPointTypes";
import type { FrameGraphBuildState } from "../frameGraphBuildState";

/**
 * Block used to generate the final graph
 */
export class FrameGraphOutputBlock extends FrameGraphBlock {
    /**
     * Create a new FrameGraphOutputBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this._isUnique = true;

        this.registerInput("texture", FrameGraphBlockConnectionPointTypes.Texture);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "FrameGraphOutputBlock";
    }
    /**
     * Gets the texture input component
     */
    public get texture(): FrameGraphConnectionPoint {
        return this._inputs[0];
    }

    protected override _buildBlock(state: FrameGraphBuildState) {
        super._buildBlock(state);
    }
}

RegisterClass("BABYLON.FrameGraphOutputBlock", FrameGraphOutputBlock);
