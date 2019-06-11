import { NodeMaterialBlock } from '../../nodeMaterialBlock';
import { NodeMaterialBlockTargets } from '../../nodeMaterialBlockTargets';
import { NodeMaterialBlockConnectionPointTypes } from '../../nodeMaterialBlockConnectionPointTypes';
import { NodeMaterialBuildState } from '../../nodeMaterialBuildState';
import { NodeMaterialConnectionPoint } from '../../nodeMaterialBlockConnectionPoint';

/**
 * Block used to add light in the fragment shader
 */
export class LightBlock extends NodeMaterialBlock {
    /**
     * Create a new LightBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name, NodeMaterialBlockTargets.Fragment);

        this.registerInput("light", NodeMaterialBlockConnectionPointTypes.Light);
        this.registerOutput("output", NodeMaterialBlockConnectionPointTypes.Float);
    }

    /**
    * Gets the light input component
    */
    public get light(): NodeMaterialConnectionPoint {
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

        state._emitFunctionFromInclude("lightFragmentDeclaration", `//${this.name}`, {
            replaceStrings: [{ search: /{X}/g, replace: "1" }]
        });

        return this;
    }
}