import { NodeMaterialBlock } from '../nodeMaterialBlock';
import { NodeMaterialBlockConnectionPointTypes } from '../Enums/nodeMaterialBlockConnectionPointTypes';
import { NodeMaterialBuildState } from '../nodeMaterialBuildState';
import { NodeMaterialConnectionPoint } from '../nodeMaterialBlockConnectionPoint';
import { NodeMaterialBlockTargets } from '../Enums/nodeMaterialBlockTargets';
import { _TypeStore } from '../../../Misc/typeStore';
/**
 * Block used to get the opposite (1 - x) of a value
 */
export class OneMinusBlock extends NodeMaterialBlock {
    /**
     * Creates a new OneMinusBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name, NodeMaterialBlockTargets.Neutral);

        this.registerInput("input", NodeMaterialBlockConnectionPointTypes.AutoDetect);
        this.registerOutput("output", NodeMaterialBlockConnectionPointTypes.BasedOnInput);

        this._outputs[0]._typeConnectionSource = this._inputs[0];
        this._outputs[0].excludedConnectionPointTypes.push(NodeMaterialBlockConnectionPointTypes.Matrix);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public getClassName() {
        return "OneMinusBlock";
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

        let output = this._outputs[0];

        state.compilationString += this._declareOutput(output, state) + ` = 1. - ${this.input.associatedVariableName};\r\n`;

        return this;
    }
}

_TypeStore.RegisteredTypes["BABYLON.OneMinusBlock"] = OneMinusBlock;
_TypeStore.RegisteredTypes["BABYLON.OppositeBlock"] = OneMinusBlock; // Backward compatibility