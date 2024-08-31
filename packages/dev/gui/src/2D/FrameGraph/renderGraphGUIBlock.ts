import { NodeRenderGraphBlock } from "core/FrameGraph/Node/nodeRenderGraphBlock";
import { AdvancedDynamicTexture } from "../advancedDynamicTexture";
import type { Scene } from "core/scene";
import { NodeRenderGraphBlockConnectionPointTypes } from "core/FrameGraph/Node/Types/nodeRenderGraphTypes";
import type { NodeRenderGraphConnectionPoint } from "core/FrameGraph/Node/nodeRenderGraphBlockConnectionPoint";
import type { NodeRenderGraphBuildState } from "core/FrameGraph/Node/nodeRenderGraphBuildState";
import { RegisterClass } from "core/Misc/typeStore";
import type { FrameGraphTextureId } from "core/FrameGraph/frameGraphTypes";
import { FrameGraphGUITask } from "./guiTask";

/**
 * Block that implements a fullscreen GUI for render graph
 */
export class NodeRenderGraphGUIBlock extends NodeRenderGraphBlock {
    protected override _frameGraphTask: FrameGraphGUITask;
    protected _gui: AdvancedDynamicTexture;

    /**
     * Gets the frame graph task associated with this block
     */
    public override get task() {
        return this._frameGraphTask;
    }

    /**
     * Gets the GUI texture used by this block
     */
    public get gui() {
        return this._frameGraphTask.gui;
    }

    /**
     * Create a new NodeRenderGraphGUIBlock
     * @param name defines the block name
     * @param scene defines the hosting scene
     */
    public constructor(name: string, scene: Scene) {
        super(name, scene);

        this.registerInput("destination", NodeRenderGraphBlockConnectionPointTypes.Texture);
        this.registerOutput("output", NodeRenderGraphBlockConnectionPointTypes.BasedOnInput);

        this.destination.addAcceptedConnectionPointTypes(NodeRenderGraphBlockConnectionPointTypes.TextureAll);
        this.output._typeConnectionSource = this.destination;

        this._gui = AdvancedDynamicTexture.CreateFullscreenUI(this.name, undefined, {
            useAsFrameGraphTask: true,
        });
        this._frameGraphTask = new FrameGraphGUITask(this.name, this._gui);
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

    protected override _buildBlock(state: NodeRenderGraphBuildState) {
        super._buildBlock(state);

        this._frameGraphTask.name = this.name;

        this.output.value = this._frameGraphTask.outputTextureReference; // the value of the output connection point is the "output" texture of the task

        const destinationConnectedPoint = this.destination.connectedPoint;
        if (destinationConnectedPoint) {
            this._frameGraphTask.destinationTexture = destinationConnectedPoint.value as FrameGraphTextureId;
        }

        state.frameGraph.addTask(this._frameGraphTask);
    }
}

RegisterClass("BABYLON.GUI.NodeRenderGraphGUIBlock", NodeRenderGraphGUIBlock);
