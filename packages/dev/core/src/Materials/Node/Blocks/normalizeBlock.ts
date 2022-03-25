import { NodeMaterialBlock } from "../nodeMaterialBlock";
import { NodeMaterialBlockConnectionPointTypes } from "../Enums/nodeMaterialBlockConnectionPointTypes";
import type { NodeMaterialBuildState } from "../nodeMaterialBuildState";
import type { NodeMaterialConnectionPoint } from "../nodeMaterialBlockConnectionPoint";
import { NodeMaterialBlockTargets } from "../Enums/nodeMaterialBlockTargets";
import { RegisterClass } from "../../../Misc/typeStore";
/**
 * Block used to normalize a vector
 */
export class NormalizeBlock extends NodeMaterialBlock {
    /**
     * Creates a new NormalizeBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name, NodeMaterialBlockTargets.Neutral);

        this.registerInput("input", NodeMaterialBlockConnectionPointTypes.AutoDetect);
        this.registerOutput("output", NodeMaterialBlockConnectionPointTypes.BasedOnInput);

        this._outputs[0]._typeConnectionSource = this._inputs[0];

        this._inputs[0].excludedConnectionPointTypes.push(NodeMaterialBlockConnectionPointTypes.Float);
        this._inputs[0].excludedConnectionPointTypes.push(NodeMaterialBlockConnectionPointTypes.Matrix);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public getClassName() {
        return "NormalizeBlock";
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

    protected _buildBlock(state: NodeMaterialBuildState) {
        super._buildBlock(state);

        const output = this._outputs[0];
        const input = this._inputs[0];

        state.compilationString += this._declareOutput(output, state) + ` = normalize(${input.associatedVariableName});\r\n`;

        return this;
    }
}

RegisterClass("BABYLON.NormalizeBlock", NormalizeBlock);
