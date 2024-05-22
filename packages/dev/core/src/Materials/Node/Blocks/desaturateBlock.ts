import { NodeMaterialBlock } from "../nodeMaterialBlock";
import { NodeMaterialBlockConnectionPointTypes } from "../Enums/nodeMaterialBlockConnectionPointTypes";
import type { NodeMaterialBuildState } from "../nodeMaterialBuildState";
import type { NodeMaterialConnectionPoint } from "../nodeMaterialBlockConnectionPoint";
import { NodeMaterialBlockTargets } from "../Enums/nodeMaterialBlockTargets";
import { RegisterClass } from "../../../Misc/typeStore";
/**
 * Block used to desaturate a color
 */
export class DesaturateBlock extends NodeMaterialBlock {
    /**
     * Creates a new DesaturateBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name, NodeMaterialBlockTargets.Neutral);

        this.registerInput("color", NodeMaterialBlockConnectionPointTypes.Color3);
        this.registerInput("level", NodeMaterialBlockConnectionPointTypes.Float);
        this.registerOutput("output", NodeMaterialBlockConnectionPointTypes.Color3);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "DesaturateBlock";
    }

    /**
     * Gets the color operand input component
     */
    public get color(): NodeMaterialConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the level operand input component
     */
    public get level(): NodeMaterialConnectionPoint {
        return this._inputs[1];
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
        const color = this.color;
        const colorName = color.associatedVariableName;
        const tempMin = state._getFreeVariableName("colorMin");
        const tempMax = state._getFreeVariableName("colorMax");
        const tempMerge = state._getFreeVariableName("colorMerge");

        state.compilationString += `${state._declareLocalVar(tempMin, NodeMaterialBlockConnectionPointTypes.Float)} = min(min(${colorName}.x, ${colorName}.y), ${colorName}.z);\n`;
        state.compilationString += `${state._declareLocalVar(tempMax, NodeMaterialBlockConnectionPointTypes.Float)} = max(max(${colorName}.x, ${colorName}.y), ${colorName}.z);\n`;
        state.compilationString += `${state._declareLocalVar(tempMerge, NodeMaterialBlockConnectionPointTypes.Float)} = 0.5 * (${tempMin} + ${tempMax});\n`;
        state.compilationString +=
            state._declareOutput(output) +
            ` = mix(${colorName}, ${state._getShaderType(NodeMaterialBlockConnectionPointTypes.Vector3)}(${tempMerge}, ${tempMerge}, ${tempMerge}), ${this.level.associatedVariableName});\n`;

        return this;
    }
}

RegisterClass("BABYLON.DesaturateBlock", DesaturateBlock);
