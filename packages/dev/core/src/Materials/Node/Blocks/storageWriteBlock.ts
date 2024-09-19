import { NodeMaterialBlock } from "../nodeMaterialBlock";
import { NodeMaterialBlockConnectionPointTypes } from "../Enums/nodeMaterialBlockConnectionPointTypes";
import type { NodeMaterialBuildState } from "../nodeMaterialBuildState";
import type { NodeMaterialConnectionPoint } from "../nodeMaterialBlockConnectionPoint";
import { NodeMaterialBlockTargets } from "../Enums/nodeMaterialBlockTargets";
import { RegisterClass } from "../../../Misc/typeStore";
import type { LoopBlock } from "./loopBlock";
/**
 * Block used to write to a variable within a loop
 */
export class StorageWriteBlock extends NodeMaterialBlock {
    /**
     * Creates a new StorageWriteBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name, NodeMaterialBlockTargets.Neutral);

        this.registerInput("loopID", NodeMaterialBlockConnectionPointTypes.Object);
        this.registerInput("value", NodeMaterialBlockConnectionPointTypes.AutoDetect);

        this._linkConnectionTypes(0, 1);
        this._inputs[0]._preventBubbleUp = true;
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "StorageWriteBlock";
    }

    /**
     * Gets the loop link component
     */
    public get loopID(): NodeMaterialConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the value component
     */
    public get value(): NodeMaterialConnectionPoint {
        return this._inputs[1];
    }

    protected override _buildBlock(state: NodeMaterialBuildState) {
        super._buildBlock(state);

        const value = this._inputs[1];

        if (!this.loopID.isConnected) {
            return this;
        }

        const loopBlock = this.loopID.connectedPoint!.ownerBlock as LoopBlock;

        state.compilationString += `${loopBlock.output.associatedVariableName} = ${value.associatedVariableName};\n`;

        return this;
    }
}

RegisterClass("BABYLON.StorageWriteBlock", StorageWriteBlock);
