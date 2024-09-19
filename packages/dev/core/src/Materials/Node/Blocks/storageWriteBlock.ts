import { NodeMaterialBlock } from "../nodeMaterialBlock";
import { NodeMaterialBlockConnectionPointTypes } from "../Enums/nodeMaterialBlockConnectionPointTypes";
import type { NodeMaterialBuildState } from "../nodeMaterialBuildState";
import { NodeMaterialConnectionPointDirection, type NodeMaterialConnectionPoint } from "../nodeMaterialBlockConnectionPoint";
import { NodeMaterialBlockTargets } from "../Enums/nodeMaterialBlockTargets";
import { RegisterClass } from "../../../Misc/typeStore";
import { LoopBlock } from "./loopBlock";
import { NodeMaterialConnectionPointCustomObject } from "../nodeMaterialConnectionPointCustomObject";
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

        this.registerInput(
            "loopID",
            NodeMaterialBlockConnectionPointTypes.Object,
            false,
            undefined,
            new NodeMaterialConnectionPointCustomObject("loopID", this, NodeMaterialConnectionPointDirection.Input, LoopBlock, "LoopBlock")
        );
        this.registerInput("value", NodeMaterialBlockConnectionPointTypes.AutoDetect);

        this._linkConnectionTypes(0, 1);
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

    /** Gets a boolean indicating that this connection will be used in the fragment shader
     * @returns true if connected in fragment shader
     */
    public override isConnectedInFragmentShader() {
        if (!this.loopID.isConnected) {
            return false;
        }
        const loopBlock = this.loopID.connectedPoint!.ownerBlock as LoopBlock;

        return loopBlock.output.isConnectedInFragmentShader;
    }

    protected override _buildBlock(state: NodeMaterialBuildState) {
        super._buildBlock(state);

        const value = this.value;

        if (!this.loopID.isConnected) {
            return this;
        }

        const loopBlock = this.loopID.connectedPoint!.ownerBlock as LoopBlock;

        state.compilationString += `${loopBlock.output.associatedVariableName} = ${value.associatedVariableName};\n`;

        return this;
    }
}

RegisterClass("BABYLON.StorageWriteBlock", StorageWriteBlock);
