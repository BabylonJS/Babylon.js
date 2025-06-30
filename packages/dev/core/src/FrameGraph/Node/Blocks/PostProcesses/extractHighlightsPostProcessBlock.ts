import type { Scene, FrameGraph } from "core/index";
import { RegisterClass } from "../../../../Misc/typeStore";
import { editableInPropertyPage, PropertyTypeForEdition } from "../../../../Decorators/nodeDecorator";
import { FrameGraphExtractHighlightsTask } from "core/FrameGraph/Tasks/PostProcesses/extractHighlightsTask";
import { ThinExtractHighlightsPostProcess } from "core/PostProcesses/thinExtractHighlightsPostProcess";
import { NodeRenderGraphBasePostProcessBlock } from "./basePostProcessBlock";

/**
 * Block that implements the extract highlights post process
 */
export class NodeRenderGraphExtractHighlightsPostProcessBlock extends NodeRenderGraphBasePostProcessBlock {
    protected override _frameGraphTask: FrameGraphExtractHighlightsTask;

    /**
     * Gets the frame graph task associated with this block
     */
    public override get task() {
        return this._frameGraphTask;
    }

    /**
     * Create a new ExtractHighlightsPostProcessBlock
     * @param name defines the block name
     * @param frameGraph defines the hosting frame graph
     * @param scene defines the hosting scene
     */
    public constructor(name: string, frameGraph: FrameGraph, scene: Scene) {
        super(name, frameGraph, scene);

        this._finalizeInputOutputRegistering();

        this._frameGraphTask = new FrameGraphExtractHighlightsTask(this.name, frameGraph, new ThinExtractHighlightsPostProcess(name, scene.getEngine()));
    }

    /** The luminance threshold, pixels below this value will be set to black. */
    @editableInPropertyPage("Threshold", PropertyTypeForEdition.Float, "PROPERTIES", { min: 0, max: 1 })
    public get threshold(): number {
        return this._frameGraphTask.postProcess.threshold;
    }

    public set threshold(value: number) {
        this._frameGraphTask.postProcess.threshold = value;
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "NodeRenderGraphExtractHighlightsPostProcessBlock";
    }

    protected override _dumpPropertiesCode() {
        const codes: string[] = [];
        codes.push(`${this._codeVariableName}.threshold = ${this.threshold};`);
        return super._dumpPropertiesCode() + codes.join("\n");
    }

    public override serialize(): any {
        const serializationObject = super.serialize();
        serializationObject.threshold = this.threshold;
        return serializationObject;
    }

    public override _deserialize(serializationObject: any) {
        super._deserialize(serializationObject);
        this.threshold = serializationObject.threshold;
    }
}

RegisterClass("BABYLON.NodeRenderGraphExtractHighlightsPostProcessBlock", NodeRenderGraphExtractHighlightsPostProcessBlock);
