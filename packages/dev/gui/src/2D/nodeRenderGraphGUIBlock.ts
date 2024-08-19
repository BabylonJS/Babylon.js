import { NodeRenderGraphBlock } from "core/FrameGraph/Node/nodeRenderGraphBlock";
import { AdvancedDynamicTexture } from "./advancedDynamicTexture";
import type { AbstractEngine } from "core/Engines/abstractEngine";
import { NodeRenderGraphBlockConnectionPointTypes, NodeRenderGraphBlockConnectionPointValueTypes } from "core/FrameGraph/Node/Types/nodeRenderGraphBlockConnectionPointTypes";
import type { NodeRenderGraphConnectionPoint } from "core/FrameGraph/Node/nodeRenderGraphBlockConnectionPoint";
import type { NodeRenderGraphBuildState } from "core/FrameGraph/Node/nodeRenderGraphBuildState";
import { RegisterClass } from "core/Misc/typeStore";

/**
 * Block that implements a fullscreen GUI for render graph
 */
export class NodeRenderGraphGUIBlock extends NodeRenderGraphBlock {
    protected override _frameGraphTask: AdvancedDynamicTexture;

    /**
     * Gets the GUI task
     */
    public get guiTask() {
        return this._frameGraphTask;
    }

    /**
     * Create a new BlackAndWhitePostProcessBlock
     * @param name defines the block name
     * @param engine defines the hosting engine
     */
    public constructor(name: string, engine: AbstractEngine) {
        super(name, engine);

        this.registerInput("destination", NodeRenderGraphBlockConnectionPointTypes.Texture);
        this.registerOutput("output", NodeRenderGraphBlockConnectionPointTypes.BasedOnInput);

        this.destination.addAcceptedConnectionPointTypes(NodeRenderGraphBlockConnectionPointTypes.TextureAll);
        this.output._typeConnectionSource = this.destination;

        this._frameGraphTask = AdvancedDynamicTexture.CreateFullscreenUI(this.name, undefined, {
            useAsFrameGraphTask: true,
        });
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "GUI.NodeRenderGraphGUIBlock";
    }

    /**
     * Gets the destination input component
     */
    public get destination(): NodeRenderGraphConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the output component
     */
    public get output(): NodeRenderGraphConnectionPoint {
        return this._outputs[0];
    }

    public override dispose() {
        this._frameGraphTask.dispose();
        super.dispose();
    }

    protected override _buildBlock(state: NodeRenderGraphBuildState) {
        super._buildBlock(state);

        this._frameGraphTask.name = this.name;

        this.output.value = this._frameGraphTask.outputTextureReference; // the value of the output connection point is the "output" texture of the task
        this.output.valueType = NodeRenderGraphBlockConnectionPointValueTypes.Texture;

        const destinationConnectedPoint = this.destination.connectedPoint;
        if (destinationConnectedPoint && destinationConnectedPoint.valueType === NodeRenderGraphBlockConnectionPointValueTypes.Texture) {
            this._frameGraphTask.destinationTexture = destinationConnectedPoint.value;
        }

        state.frameGraph.addTask(this._frameGraphTask);
    }
}

RegisterClass("BABYLON.GUI.NodeRenderGraphGUIBlock", NodeRenderGraphGUIBlock);
