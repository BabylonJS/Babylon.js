import type { Scene, FrameGraph } from "core/index";
import { RegisterClass } from "../../../../Misc/typeStore";
import { editableInPropertyPage, PropertyTypeForEdition } from "../../../../Decorators/nodeDecorator";
import { FrameGraphSharpenTask } from "core/FrameGraph/Tasks/PostProcesses/sharpenTask";
import { ThinSharpenPostProcess } from "core/PostProcesses/thinSharpenPostProcess";
import { NodeRenderGraphBaseWithPropertiesPostProcessBlock } from "./baseWithPropertiesPostProcessBlock";

/**
 * Block that implements the sharpen post process
 */
export class NodeRenderGraphSharpenPostProcessBlock extends NodeRenderGraphBaseWithPropertiesPostProcessBlock {
    protected override _frameGraphTask: FrameGraphSharpenTask;

    /**
     * Gets the frame graph task associated with this block
     */
    public override get task() {
        return this._frameGraphTask;
    }

    /**
     * Create a new sharpen post process block
     * @param name defines the block name
     * @param frameGraph defines the hosting frame graph
     * @param scene defines the hosting scene
     */
    public constructor(name: string, frameGraph: FrameGraph, scene: Scene) {
        super(name, frameGraph, scene);

        this._finalizeInputOutputRegistering();

        this._frameGraphTask = new FrameGraphSharpenTask(this.name, frameGraph, new ThinSharpenPostProcess(name, scene.getEngine()));
    }

    /** How much of the original color should be applied. Setting this to 0 will display edge detection. */
    @editableInPropertyPage("Color Amount", PropertyTypeForEdition.Float, "PROPERTIES", { min: 0, max: 3 })
    public get colorAmount(): number {
        return this._frameGraphTask.postProcess.colorAmount;
    }

    public set colorAmount(value: number) {
        this._frameGraphTask.postProcess.colorAmount = value;
    }

    /** How much sharpness should be applied. */
    @editableInPropertyPage("Edge Amount", PropertyTypeForEdition.Float, "PROPERTIES", { min: 0, max: 5 })
    public get edgeAmount(): number {
        return this._frameGraphTask.postProcess.edgeAmount;
    }

    public set edgeAmount(value: number) {
        this._frameGraphTask.postProcess.edgeAmount = value;
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "NodeRenderGraphSharpenPostProcessBlock";
    }

    protected override _dumpPropertiesCode() {
        const codes: string[] = [];
        codes.push(`${this._codeVariableName}.colorAmount = ${this.colorAmount};`);
        codes.push(`${this._codeVariableName}.edgeAmount = ${this.edgeAmount};`);
        return super._dumpPropertiesCode() + codes.join("\n");
    }

    public override serialize(): any {
        const serializationObject = super.serialize();
        serializationObject.colorAmount = this.colorAmount;
        serializationObject.edgeAmount = this.edgeAmount;
        return serializationObject;
    }

    public override _deserialize(serializationObject: any) {
        super._deserialize(serializationObject);
        this.colorAmount = serializationObject.colorAmount;
        this.edgeAmount = serializationObject.edgeAmount;
    }
}

RegisterClass("BABYLON.NodeRenderGraphSharpenPostProcessBlock", NodeRenderGraphSharpenPostProcessBlock);
