import type { Scene } from "../../../scene";
import { RegisterClass } from "../../../Misc/typeStore";
import { NodeRenderGraphBlockConnectionPointTypes } from "../Types/nodeRenderGraphBlockConnectionPointTypes";
import { NodeRenderGraphBlock } from "../nodeRenderGraphBlock";
import type { NodeRenderGraphConnectionPoint } from "../nodeRenderGraphBlockConnectionPoint";
import type { NodeRenderGraphBuildState } from "../nodeRenderGraphBuildState";
/**
 * Block used as a pass through
 */
export class RenderGraphElbowBlock extends NodeRenderGraphBlock {
    /**
     * Creates a new RenderGraphElbowBlock
     * @param name defines the block name
     * @param scene defines the hosting scene
     */
    public constructor(name: string, scene: Scene) {
        super(name, scene);

        this.registerInput("input", NodeRenderGraphBlockConnectionPointTypes.AutoDetect);
        this.registerOutput("output", NodeRenderGraphBlockConnectionPointTypes.BasedOnInput);

        this._outputs[0]._typeConnectionSource = this._inputs[0];
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "RenderGraphElbowBlock";
    }

    /**
     * Gets the input component
     */
    public get input(): NodeRenderGraphConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the output component
     */
    public get output(): NodeRenderGraphConnectionPoint {
        return this._outputs[0];
    }

    protected override _buildBlock(state: NodeRenderGraphBuildState) {
        super._buildBlock(state);

        const output = this._outputs[0];
        const input = this._inputs[0];

        this._propagateInputValueToOutput(input, output);
    }
}

RegisterClass("BABYLON.RenderGraphElbowBlock", RenderGraphElbowBlock);
