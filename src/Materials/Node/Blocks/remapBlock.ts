import { NodeMaterialBlock } from '../nodeMaterialBlock';
import { NodeMaterialBlockConnectionPointTypes } from '../nodeMaterialBlockConnectionPointTypes';
import { NodeMaterialBuildState } from '../nodeMaterialBuildState';
import { NodeMaterialConnectionPoint } from '../nodeMaterialBlockConnectionPoint';
import { NodeMaterialBlockTargets } from '../nodeMaterialBlockTargets';
import { _TypeStore } from '../../../Misc/typeStore';
import { Vector2 } from '../../../Maths/math.vector';
/**
 * Block used to remap a float from a range to a new one
 */
export class RemapBlock extends NodeMaterialBlock {
    /**
     * Gets or sets the source range
     */
    public sourceRange = new Vector2(-1, 1);

    /**
     * Gets or sets the target range
     */
    public targetRange = new Vector2(0, 1);

    /**
     * Creates a new RemapBlock
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
    public getClassName() {
        return "RemapBlock";
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

        state.compilationString += this._declareOutput(output, state) + ` = ${this._writeFloat(this.targetRange.x)} + (${this._inputs[0].associatedVariableName} - ${this._writeFloat(this.sourceRange.x)}) * (${this._writeFloat(this.targetRange.y)} - ${this._writeFloat(this.targetRange.x)}) / (${this._writeFloat(this.sourceRange.y)} - ${this._writeFloat(this.sourceRange.x)});\r\n`;

        return this;
    }
}

_TypeStore.RegisteredTypes["BABYLON.RemapBlock"] = RemapBlock;