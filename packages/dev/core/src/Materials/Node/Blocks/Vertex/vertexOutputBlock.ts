import { NodeMaterialBlock } from "../../nodeMaterialBlock";
import { NodeMaterialBlockConnectionPointTypes } from "../../Enums/nodeMaterialBlockConnectionPointTypes";
import type { NodeMaterialBuildState } from "../../nodeMaterialBuildState";
import { NodeMaterialBlockTargets } from "../../Enums/nodeMaterialBlockTargets";
import type { NodeMaterialConnectionPoint } from "../../nodeMaterialBlockConnectionPoint";
import { RegisterClass } from "../../../../Misc/typeStore";
import type { Immutable } from "../../../../types";

declare type FragmentOutputBlock = import("../Fragment/fragmentOutputBlock").FragmentOutputBlock;

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

    private _isLogarithmicDepthEnabled(nodeList: Immutable<NodeMaterialBlock[]>): boolean {
        for (const node of nodeList) {
            if ((node as FragmentOutputBlock).useLogarithmicDepth) {
                return true;
            }
        }
        return false;
    }

    protected _buildBlock(state: NodeMaterialBuildState) {
        super._buildBlock(state);

        const input = this.vector;

        state.compilationString += `gl_Position = ${input.associatedVariableName};\r\n`;

        if (this._isLogarithmicDepthEnabled(state.sharedData.fragmentOutputNodes)) {
            state._emitUniformFromString("logarithmicDepthConstant", "float");
            state._emitVaryingFromString("vFragmentDepth", "float");

            state.compilationString += `vFragmentDepth = 1.0 + gl_Position.w;\r\n`;
            state.compilationString += `gl_Position.z = log2(max(0.000001, vFragmentDepth)) * logarithmicDepthConstant;\r\n`;
        }

        return this;
    }
}

RegisterClass("BABYLON.VertexOutputBlock", VertexOutputBlock);
