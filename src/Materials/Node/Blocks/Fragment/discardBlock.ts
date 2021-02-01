import { NodeMaterialBlock } from '../../nodeMaterialBlock';
import { NodeMaterialBlockConnectionPointTypes } from '../../Enums/nodeMaterialBlockConnectionPointTypes';
import { NodeMaterialBuildState } from '../../nodeMaterialBuildState';
import { NodeMaterialBlockTargets } from '../../Enums/nodeMaterialBlockTargets';
import { NodeMaterialConnectionPoint } from '../../nodeMaterialBlockConnectionPoint';
import { _TypeStore } from '../../../../Misc/typeStore';
/**
 * Block used to discard a pixel if a value is smaller than a cutoff
 */
export class DiscardBlock extends NodeMaterialBlock {
    /**
     * Create a new DiscardBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name, NodeMaterialBlockTargets.Fragment, true);

        this.registerInput("value", NodeMaterialBlockConnectionPointTypes.Float, true);
        this.registerInput("cutoff", NodeMaterialBlockConnectionPointTypes.Float, true);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public getClassName() {
        return "DiscardBlock";
    }

    /**
     * Gets the color input component
     */
    public get value(): NodeMaterialConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the cutoff input component
     */
    public get cutoff(): NodeMaterialConnectionPoint {
        return this._inputs[1];
    }

    protected _buildBlock(state: NodeMaterialBuildState) {
        super._buildBlock(state);

        state.sharedData.hints.needAlphaTesting = true;

        if (!this.cutoff.isConnected || !this.value.isConnected) {
            return;
        }

        state.compilationString += `if (${this.value.associatedVariableName} < ${this.cutoff.associatedVariableName}) discard;\r\n`;

        return this;
    }
}

_TypeStore.RegisteredTypes["BABYLON.DiscardBlock"] = DiscardBlock;
