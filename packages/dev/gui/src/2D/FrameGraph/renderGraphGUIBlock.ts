import { NodeRenderGraphBlock } from "core/FrameGraph/Node/nodeRenderGraphBlock";
import { AdvancedDynamicTexture } from "../advancedDynamicTexture";
import type { Scene } from "core/scene";
import { NodeRenderGraphBlockConnectionPointTypes } from "core/FrameGraph/Node/Types/nodeRenderGraphTypes";
import type { NodeRenderGraphConnectionPoint } from "core/FrameGraph/Node/nodeRenderGraphBlockConnectionPoint";
import type { NodeRenderGraphBuildState } from "core/FrameGraph/Node/nodeRenderGraphBuildState";
import { RegisterClass } from "core/Misc/typeStore";
import type { FrameGraphTextureHandle } from "core/FrameGraph/frameGraphTypes";
import { FrameGraphGUITask } from "./guiTask";
import type { FrameGraph } from "core/FrameGraph/frameGraph";

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
     * @param frameGraph defines the hosting frame graph
     * @param scene defines the hosting scene
     */
    public constructor(name: string, frameGraph: FrameGraph, scene: Scene) {
        super(name, frameGraph, scene);

        this.registerInput("target", NodeRenderGraphBlockConnectionPointTypes.Texture);
        this._addDependenciesInput();
        this.registerOutput("output", NodeRenderGraphBlockConnectionPointTypes.BasedOnInput);

        this.target.addAcceptedConnectionPointTypes(NodeRenderGraphBlockConnectionPointTypes.TextureAll);
        this.output._typeConnectionSource = this.target;

        this._gui = AdvancedDynamicTexture.CreateFullscreenUI(this.name, undefined, {
            useStandalone: true,
            scene,
        });
        this._frameGraphTask = new FrameGraphGUITask(this.name, frameGraph, this._gui);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "GUI.NodeRenderGraphGUIBlock";
    }

    /**
     * Gets the target input component
     */
    public get target(): NodeRenderGraphConnectionPoint {
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

        this.output.value = this._frameGraphTask.outputTexture; // the value of the output connection point is the "output" texture of the task

        this._frameGraphTask.targetTexture = this.target.connectedPoint?.value as FrameGraphTextureHandle;
    }
}

RegisterClass("BABYLON.GUI.NodeRenderGraphGUIBlock", NodeRenderGraphGUIBlock);
