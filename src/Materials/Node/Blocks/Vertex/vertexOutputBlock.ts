import { NodeMaterialBlock } from '../../nodeMaterialBlock';
import { NodeMaterialBlockConnectionPointTypes } from '../../Enums/nodeMaterialBlockConnectionPointTypes';
import { NodeMaterialBuildState } from '../../nodeMaterialBuildState';
import { NodeMaterialBlockTargets } from '../../Enums/nodeMaterialBlockTargets';
import { NodeMaterialConnectionPoint } from '../../nodeMaterialBlockConnectionPoint';
import { _TypeStore } from '../../../../Misc/typeStore';

/**
 * Block used to output the vertex position
 */
export class VertexOutputBlock extends NodeMaterialBlock {

    /**
     * Creates a new VertexOutputBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name, NodeMaterialBlockTargets.Vertex, true);

        this.registerInput("vector", NodeMaterialBlockConnectionPointTypes.Vector4);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public getClassName() {
        return "VertexOutputBlock";
    }

    /**
     * Gets the vector input component
     */
    public get vector(): NodeMaterialConnectionPoint {
        return this._inputs[0];
    }

    protected _buildBlock(state: NodeMaterialBuildState) {
        super._buildBlock(state);

        let input = this.vector;

        state.compilationString += `gl_Position = ${input.associatedVariableName};\r\n`;

        return this;
    }
}

_TypeStore.RegisteredTypes["BABYLON.VertexOutputBlock"] = VertexOutputBlock;