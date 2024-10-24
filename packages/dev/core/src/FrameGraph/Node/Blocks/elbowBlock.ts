// eslint-disable-next-line import/no-internal-modules
import type { NodeRenderGraphConnectionPoint, Scene, FrameGraph, NodeRenderGraphBuildState } from "core/index";
import { RegisterClass } from "../../../Misc/typeStore";
import { NodeRenderGraphBlockConnectionPointTypes } from "../Types/nodeRenderGraphTypes";
import { NodeRenderGraphBlock } from "../nodeRenderGraphBlock";

/**
 * Block used as a pass through
 */
export class NodeRenderGraphElbowBlock extends NodeRenderGraphBlock {
    /**
     * Creates a new NodeRenderGraphElbowBlock
     * @param name defines the block name
     * @param frameGraph defines the hosting frame graph
     * @param scene defines the hosting scene
     */
    public constructor(name: string, frameGraph: FrameGraph, scene: Scene) {
        super(name, frameGraph, scene);

        this.registerInput("input", NodeRenderGraphBlockConnectionPointTypes.AutoDetect);
        this.registerOutput("output", NodeRenderGraphBlockConnectionPointTypes.BasedOnInput);

        this._outputs[0]._typeConnectionSource = this._inputs[0];
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "NodeRenderGraphElbowBlock";
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

RegisterClass("BABYLON.NodeRenderGraphElbowBlock", NodeRenderGraphElbowBlock);
