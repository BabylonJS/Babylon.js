import { NodeMaterialBlock } from "../nodeMaterialBlock";
import { NodeMaterialBlockConnectionPointTypes } from "../Enums/nodeMaterialBlockConnectionPointTypes";
import type { NodeMaterialBuildState } from "../nodeMaterialBuildState";
import type { NodeMaterialConnectionPoint } from "../nodeMaterialBlockConnectionPoint";
import { NodeMaterialBlockTargets } from "../Enums/nodeMaterialBlockTargets";
/**
 * Block used to smooth step a value
 */
export class SmoothStepBlock extends NodeMaterialBlock {
    /**
     * Creates a new SmoothStepBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name, NodeMaterialBlockTargets.Neutral);

        this.registerInput("value", NodeMaterialBlockConnectionPointTypes.AutoDetect);
        this.registerInput("edge0", NodeMaterialBlockConnectionPointTypes.Float);
        this.registerInput("edge1", NodeMaterialBlockConnectionPointTypes.Float);
        this.registerOutput("output", NodeMaterialBlockConnectionPointTypes.BasedOnInput);

        this._outputs[0]._typeConnectionSource = this._inputs[0];
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "SmoothStepBlock";
    }

    /**
     * Gets the value operand input component
     */
    public get value(): NodeMaterialConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the first edge operand input component
     */
    public get edge0(): NodeMaterialConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the second edge operand input component
     */
    public get edge1(): NodeMaterialConnectionPoint {
        return this._inputs[2];
    }

    /**
     * Gets the output component
     */
    public get output(): NodeMaterialConnectionPoint {
        return this._outputs[0];
    }

    protected override _buildBlock(state: NodeMaterialBuildState) {
        super._buildBlock(state);

        const output = this._outputs[0];
        const cast = state._getShaderType(this.value.type);

        state.compilationString +=
            state._declareOutput(output) +
            ` = smoothstep(${cast}(${this.edge0.associatedVariableName}), ${cast}(${this.edge1.associatedVariableName}), ${this.value.associatedVariableName});\n`;

        return this;
    }
}
