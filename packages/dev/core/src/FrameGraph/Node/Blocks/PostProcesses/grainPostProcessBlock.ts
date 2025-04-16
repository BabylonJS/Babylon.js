// eslint-disable-next-line import/no-internal-modules
import type { Scene, FrameGraph } from "core/index";
import { RegisterClass } from "../../../../Misc/typeStore";
import { editableInPropertyPage, PropertyTypeForEdition } from "../../../../Decorators/nodeDecorator";
import { FrameGraphGrainTask } from "core/FrameGraph/Tasks/PostProcesses/grainTask";
import { ThinGrainPostProcess } from "core/PostProcesses/thinGrainPostProcess";
import { NodeRenderGraphBasePostProcessBlock } from "./basePostProcessBlock";

/**
 * Block that implements the grain post process
 */
export class NodeRenderGraphGrainPostProcessBlock extends NodeRenderGraphBasePostProcessBlock {
    protected override _frameGraphTask: FrameGraphGrainTask;

    /**
     * Gets the frame graph task associated with this block
     */
    public override get task() {
        return this._frameGraphTask;
    }

    /**
     * Create a new grain post process block
     * @param name defines the block name
     * @param frameGraph defines the hosting frame graph
     * @param scene defines the hosting scene
     */
    public constructor(name: string, frameGraph: FrameGraph, scene: Scene) {
        super(name, frameGraph, scene);

        this._finalizeInputOutputRegistering();

        this._frameGraphTask = new FrameGraphGrainTask(this.name, frameGraph, new ThinGrainPostProcess(name, scene.getEngine()));
    }

    /** The intensity of the grain added */
    @editableInPropertyPage("Intensity", PropertyTypeForEdition.Float, "PROPERTIES", { min: 0, max: 200 })
    public get intensity(): number {
        return this._frameGraphTask.postProcess.intensity;
    }

    public set intensity(value: number) {
        this._frameGraphTask.postProcess.intensity = value;
    }

    /** If the grain should be randomized on every frame */
    @editableInPropertyPage("Animated", PropertyTypeForEdition.Boolean, "PROPERTIES")
    public get animated(): boolean {
        return this._frameGraphTask.postProcess.animated;
    }

    public set animated(value: boolean) {
        this._frameGraphTask.postProcess.animated = value;
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "NodeRenderGraphGrainPostProcessBlock";
    }

    protected override _dumpPropertiesCode() {
        const codes: string[] = [];
        codes.push(`${this._codeVariableName}.intensity = ${this.intensity};`);
        codes.push(`${this._codeVariableName}.animated = ${this.animated};`);
        return super._dumpPropertiesCode() + codes.join("\n");
    }

    public override serialize(): any {
        const serializationObject = super.serialize();
        serializationObject.intensity = this.intensity;
        serializationObject.animated = this.animated;
        return serializationObject;
    }

    public override _deserialize(serializationObject: any) {
        super._deserialize(serializationObject);
        this.intensity = serializationObject.intensity;
        this.animated = serializationObject.animated;
    }
}

RegisterClass("BABYLON.NodeRenderGraphGrainPostProcessBlock", NodeRenderGraphGrainPostProcessBlock);
