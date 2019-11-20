import { NodeMaterialBlock } from '../nodeMaterialBlock';
import { NodeMaterialBlockConnectionPointTypes } from '../Enums/nodeMaterialBlockConnectionPointTypes';
import { NodeMaterialBuildState } from '../nodeMaterialBuildState';
import { NodeMaterialConnectionPoint } from '../nodeMaterialBlockConnectionPoint';
import { NodeMaterialBlockTargets } from '../Enums/nodeMaterialBlockTargets';
import { _TypeStore } from '../../../Misc/typeStore';
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
    public getClassName() {
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

    protected _buildBlock(state: NodeMaterialBuildState) {
        super._buildBlock(state);

        let output = this._outputs[0];
        let color = this.color;
        let colorName = color.associatedVariableName;
        let tempMin = state._getFreeVariableName("colorMin");
        let tempMax = state._getFreeVariableName("colorMax");
        let tempMerge = state._getFreeVariableName("colorMerge");

        state.compilationString += `float ${tempMin} = min(min(${colorName}.x, ${colorName}.y), ${colorName}.z);\r\n`;
        state.compilationString += `float ${tempMax} = max(max(${colorName}.x, ${colorName}.y), ${colorName}.z);\r\n`;
        state.compilationString += `float ${tempMerge} = 0.5 * (${tempMin} + ${tempMax});\r\n`;
        state.compilationString += this._declareOutput(output, state) + ` = mix(${colorName}, vec3(${tempMerge}, ${tempMerge}, ${tempMerge}), ${this.level.associatedVariableName});\r\n`;

        return this;
    }
}

_TypeStore.RegisteredTypes["BABYLON.DesaturateBlock"] = DesaturateBlock;