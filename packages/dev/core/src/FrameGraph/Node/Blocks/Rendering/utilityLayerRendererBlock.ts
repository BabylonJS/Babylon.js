import type { NodeRenderGraphConnectionPoint, Scene, FrameGraph, NodeRenderGraphBuildState, FrameGraphTextureHandle, Camera } from "core/index";
import { RegisterClass } from "../../../../Misc/typeStore";
import { editableInPropertyPage, PropertyTypeForEdition } from "../../../../Decorators/nodeDecorator";
import { NodeRenderGraphBlockConnectionPointTypes } from "../../Types/nodeRenderGraphTypes";
import { NodeRenderGraphBlock } from "../../nodeRenderGraphBlock";
import { FrameGraphUtilityLayerRendererTask } from "../../../Tasks/Rendering/utilityLayerRendererTask";

/**
 * Block used to render an utility layer in the frame graph
 */
export class NodeRenderGraphUtilityLayerRendererBlock extends NodeRenderGraphBlock {
    protected override _frameGraphTask: FrameGraphUtilityLayerRendererTask;

    /**
     * Gets the frame graph task associated with this block
     */
    public override get task() {
        return this._frameGraphTask;
    }

    /**
     * Creates a new NodeRenderGraphUtilityLayerRendererBlock
     * @param name defines the block name
     * @param frameGraph defines the hosting frame graph
     * @param scene defines the hosting scene
     * @param handleEvents If the utility layer should handle events.
     */
    public constructor(name: string, frameGraph: FrameGraph, scene: Scene, handleEvents = true) {
        super(name, frameGraph, scene);

        this._additionalConstructionParameters = [handleEvents];

        this.registerInput("target", NodeRenderGraphBlockConnectionPointTypes.AutoDetect);
        this.registerInput("camera", NodeRenderGraphBlockConnectionPointTypes.Camera);
        this._addDependenciesInput();
        this.registerOutput("output", NodeRenderGraphBlockConnectionPointTypes.BasedOnInput);

        this.target.addExcludedConnectionPointFromAllowedTypes(NodeRenderGraphBlockConnectionPointTypes.TextureAll);
        this.output._typeConnectionSource = this.target;

        this._frameGraphTask = new FrameGraphUtilityLayerRendererTask(name, frameGraph, scene, handleEvents);
    }

    private _createTask(handleEvents: boolean) {
        const disabled = this._frameGraphTask.disabled;

        this._frameGraphTask.dispose();
        this._frameGraphTask = new FrameGraphUtilityLayerRendererTask(this.name, this._frameGraph, this._scene, handleEvents);
        this._additionalConstructionParameters = [handleEvents];

        this._frameGraphTask.disabled = disabled;
    }

    /** If the utility layer should handle events */
    @editableInPropertyPage("Handle events", PropertyTypeForEdition.Boolean, "PROPERTIES")
    public get handleEvents() {
        return this._frameGraphTask.layer.handleEvents;
    }

    public set handleEvents(value: boolean) {
        this._createTask(value);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "NodeRenderGraphUtilityLayerRendererBlock";
    }

    /**
     * Gets the target input component
     */
    public get target(): NodeRenderGraphConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the camera input component
     */
    public get camera(): NodeRenderGraphConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the output component
     */
    public get output(): NodeRenderGraphConnectionPoint {
        return this._outputs[0];
    }

    protected override _buildBlock(state: NodeRenderGraphBuildState) {
        super._buildBlock(state);

        this.output.value = this._frameGraphTask.outputTexture;

        this._frameGraphTask.targetTexture = this.target.connectedPoint?.value as FrameGraphTextureHandle;
        this._frameGraphTask.camera = this.camera.connectedPoint?.value as Camera;
    }
}

RegisterClass("BABYLON.NodeRenderGraphUtilityLayerRendererBlock", NodeRenderGraphUtilityLayerRendererBlock);
