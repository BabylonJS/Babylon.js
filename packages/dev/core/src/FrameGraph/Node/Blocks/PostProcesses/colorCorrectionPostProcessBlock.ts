import type { Scene, FrameGraph } from "core/index";
import { RegisterClass } from "../../../../Misc/typeStore";
import { editableInPropertyPage, PropertyTypeForEdition } from "../../../../Decorators/nodeDecorator";
import { FrameGraphColorCorrectionTask } from "../../../Tasks/PostProcesses/colorCorrectionTask";
import { NodeRenderGraphBasePostProcessBlock } from "./basePostProcessBlock";
import { ThinColorCorrectionPostProcess } from "../../../../PostProcesses/thinColorCorrectionPostProcess";

/**
 * Block that implements the color correction post process
 */
export class NodeRenderGraphColorCorrectionPostProcessBlock extends NodeRenderGraphBasePostProcessBlock {
    protected override _frameGraphTask: FrameGraphColorCorrectionTask;

    /**
     * Gets the frame graph task associated with this block
     */
    public override get task() {
        return this._frameGraphTask;
    }

    /**
     * Create a new NodeRenderGraphColorCorrectionPostProcessBlock
     * @param name defines the block name
     * @param frameGraph defines the hosting frame graph
     * @param scene defines the hosting scene
     * @param colorTableUrl defines the URL of the color table
     */
    public constructor(name: string, frameGraph: FrameGraph, scene: Scene, colorTableUrl: string = "") {
        super(name, frameGraph, scene);

        this._additionalConstructionParameters = [colorTableUrl];

        this._finalizeInputOutputRegistering();

        this._frameGraphTask = new FrameGraphColorCorrectionTask(this.name, frameGraph, colorTableUrl, new ThinColorCorrectionPostProcess(name, frameGraph.scene, colorTableUrl));
    }

    private _createTask(colorTableUrl: string) {
        const sourceSamplingMode = this._frameGraphTask.sourceSamplingMode;

        this._frameGraphTask.dispose();

        this._frameGraphTask = new FrameGraphColorCorrectionTask(
            this.name,
            this._frameGraph,
            colorTableUrl,
            new ThinColorCorrectionPostProcess(this.name, this._frameGraph.scene, colorTableUrl)
        );
        this._frameGraphTask.sourceSamplingMode = sourceSamplingMode;

        this._additionalConstructionParameters = [colorTableUrl];
    }

    /** The color table URL */
    @editableInPropertyPage("Color Table URL", PropertyTypeForEdition.String, "PROPERTIES")
    public get colorTableUrl(): string {
        return this._frameGraphTask.postProcess.colorTableUrl;
    }

    public set colorTableUrl(value: string) {
        this._createTask(value);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "NodeRenderGraphColorCorrectionPostProcessBlock";
    }
}

RegisterClass("BABYLON.NodeRenderGraphColorCorrectionPostProcessBlock", NodeRenderGraphColorCorrectionPostProcessBlock);
