import { NodeMaterialBlock } from "../../nodeMaterialBlock";
import { NodeMaterialBlockConnectionPointTypes } from "../../Enums/nodeMaterialBlockConnectionPointTypes";
import type { NodeMaterialBuildState } from "../../nodeMaterialBuildState";
import type { NodeMaterialConnectionPoint } from "../../nodeMaterialBlockConnectionPoint";
import { NodeMaterialBlockTargets } from "../../Enums/nodeMaterialBlockTargets";
import { RegisterClass } from "../../../../Misc/typeStore";
/**
 * Block used to test if the fragment shader is front facing
 */
export class FrontFacingBlock extends NodeMaterialBlock {
    /**
     * Creates a new FrontFacingBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name, NodeMaterialBlockTargets.Fragment);

        this.registerOutput("output", NodeMaterialBlockConnectionPointTypes.Float, NodeMaterialBlockTargets.Fragment);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public getClassName() {
        return "FrontFacingBlock";
    }

    /**
     * Gets the output component
     */
    public get output(): NodeMaterialConnectionPoint {
        return this._outputs[0];
    }

    protected _buildBlock(state: NodeMaterialBuildState) {
        super._buildBlock(state);

        if (state.target === NodeMaterialBlockTargets.Vertex) {
            // eslint-disable-next-line no-throw-literal
            throw "FrontFacingBlock must only be used in a fragment shader";
        }

        const output = this._outputs[0];

        state.compilationString += this._declareOutput(output, state) + ` = gl_FrontFacing ? 1.0 : 0.0;\n`;

        return this;
    }
}

RegisterClass("BABYLON.FrontFacingBlock", FrontFacingBlock);
