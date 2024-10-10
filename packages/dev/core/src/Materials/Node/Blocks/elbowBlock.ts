import { NodeMaterialBlock } from "../nodeMaterialBlock";
import { NodeMaterialBlockConnectionPointTypes } from "../Enums/nodeMaterialBlockConnectionPointTypes";
import type { NodeMaterialBuildState } from "../nodeMaterialBuildState";
import type { NodeMaterialConnectionPoint } from "../nodeMaterialBlockConnectionPoint";
import { NodeMaterialBlockTargets } from "../Enums/nodeMaterialBlockTargets";
/**
 * Block used as a pass through
 */
export class ElbowBlock extends NodeMaterialBlock {
    /**
     * Creates a new ElbowBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name, NodeMaterialBlockTargets.Neutral);

        this.registerInput("input", NodeMaterialBlockConnectionPointTypes.AutoDetect);
        this.registerOutput("output", NodeMaterialBlockConnectionPointTypes.BasedOnInput);

        this._outputs[0]._typeConnectionSource = this._inputs[0];
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "ElbowBlock";
    }

    /**
     * Gets the input component
     */
    public get input(): NodeMaterialConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the output component
     */
    public get output(): NodeMaterialConnectionPoint {
        return this._outputs[0];
    }

    /**
     * Gets or sets the target of the block
     */
    public override get target() {
        const input = this._inputs[0];
        if (input.isConnected) {
            const block = input.connectedPoint!.ownerBlock;
            if (block.target !== NodeMaterialBlockTargets.VertexAndFragment) {
                return block.target;
            }

            if (input.connectedPoint!.target !== NodeMaterialBlockTargets.VertexAndFragment) {
                return input.connectedPoint!.target;
            }
        }

        return this._target;
    }

    public override set target(value: NodeMaterialBlockTargets) {
        if ((this._target & value) !== 0) {
            return;
        }
        this._target = value;
    }

    protected override _buildBlock(state: NodeMaterialBuildState) {
        super._buildBlock(state);

        const output = this._outputs[0];
        const input = this._inputs[0];

        state.compilationString += state._declareOutput(output) + ` = ${input.associatedVariableName};\n`;

        return this;
    }
}
