import { NodeMaterialBlock } from '../nodeMaterialBlock';
import { NodeMaterialBlockConnectionPointTypes } from '../Enums/nodeMaterialBlockConnectionPointTypes';
import { NodeMaterialBuildState } from '../nodeMaterialBuildState';
import { NodeMaterialConnectionPoint } from '../nodeMaterialBlockConnectionPoint';
import { NodeMaterialBlockTargets } from '../Enums/nodeMaterialBlockTargets';
import { _TypeStore } from '../../../Misc/typeStore';
/**
 * Block used to blend normals
 */
export class NormalBlendBlock extends NodeMaterialBlock {
    /**
     * Creates a new NormalBlendBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name, NodeMaterialBlockTargets.Neutral);

        this.registerInput("normalMap0", NodeMaterialBlockConnectionPointTypes.Vector3);
        this.registerInput("normalMap1", NodeMaterialBlockConnectionPointTypes.Vector3);
        this.registerOutput("output", NodeMaterialBlockConnectionPointTypes.Vector3);

        this._inputs[0].acceptedConnectionPointTypes.push(NodeMaterialBlockConnectionPointTypes.Color3);
        this._inputs[0].acceptedConnectionPointTypes.push(NodeMaterialBlockConnectionPointTypes.Color4);
        this._inputs[0].acceptedConnectionPointTypes.push(NodeMaterialBlockConnectionPointTypes.Vector4);

        this._inputs[1].acceptedConnectionPointTypes.push(NodeMaterialBlockConnectionPointTypes.Color3);
        this._inputs[1].acceptedConnectionPointTypes.push(NodeMaterialBlockConnectionPointTypes.Color4);
        this._inputs[1].acceptedConnectionPointTypes.push(NodeMaterialBlockConnectionPointTypes.Vector4);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public getClassName() {
        return "NormalBlendBlock";
    }

    /**
     * Gets the first input component
     */
    public get normalMap0(): NodeMaterialConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the second input component
     */
    public get normalMap1(): NodeMaterialConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the output component
     */
    public get output(): NodeMaterialConnectionPoint {
        return this._outputs[0];
    }

    protected _buildBlock(state: NodeMaterialBuildState) {
        super._buildBlock(state);

        let output = this._outputs[0];
        let input0 = this._inputs[0];
        let input1 = this._inputs[1];
        let stepR = state._getFreeVariableName("stepR");
        let stepG = state._getFreeVariableName("stepG");

        state.compilationString += `float ${stepR} = step(0.5, ${input0.associatedVariableName}.r);\r\n`;
        state.compilationString += `float ${stepG} = step(0.5, ${input0.associatedVariableName}.g);\r\n`;
        state.compilationString += this._declareOutput(output, state) + `;\r\n`;
        state.compilationString += `${output.associatedVariableName}.r = (1.0 - ${stepR}) * ${input0.associatedVariableName}.r * ${input1.associatedVariableName}.r * 2.0 + ${stepR} * (1.0 - ${input0.associatedVariableName}.r) * (1.0 - ${input1.associatedVariableName}.r) * 2.0;\r\n`;
        state.compilationString += `${output.associatedVariableName}.g = (1.0 - ${stepG}) * ${input0.associatedVariableName}.g * ${input1.associatedVariableName}.g * 2.0 + ${stepG} * (1.0 - ${input0.associatedVariableName}.g) * (1.0 - ${input1.associatedVariableName}.g) * 2.0;\r\n`;
        state.compilationString += `${output.associatedVariableName}.b = ${input0.associatedVariableName}.b * ${input1.associatedVariableName}.b;\r\n`;

        return this;
    }
}

_TypeStore.RegisteredTypes["BABYLON.NormalBlendBlock"] = NormalBlendBlock;