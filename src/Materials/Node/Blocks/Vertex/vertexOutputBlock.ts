import { NodeMaterialBlock } from '../../nodeMaterialBlock';
import { NodeMaterialBlockConnectionPointTypes } from '../../nodeMaterialBlockConnectionPointTypes';
import { NodeMaterialBuildState } from '../../nodeMaterialBuildState';
import { NodeMaterialBlockTargets } from '../../nodeMaterialBlockTargets';
import { NodeMaterialConnectionPoint } from '../../nodeMaterialBlockConnectionPoint';

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
    public get input(): NodeMaterialConnectionPoint {
        return this._inputs[0];
    }

    /** @hidden */
    public get _canAddAtVertexRoot(): boolean {
        return false;
    }

    /** @hidden */
    public get _canAddAtFragmentRoot(): boolean {
        return false;
    }

    protected _buildBlock(state: NodeMaterialBuildState) {
        super._buildBlock(state);

        let input = this.input;

        state.compilationString += `gl_Position = ${input.associatedVariableName};\r\n`;

        return this;
    }
}