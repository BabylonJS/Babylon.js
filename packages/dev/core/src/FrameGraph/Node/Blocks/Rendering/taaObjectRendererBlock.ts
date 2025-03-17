// eslint-disable-next-line import/no-internal-modules
import type { Scene, FrameGraph } from "core/index";
import { RegisterClass } from "../../../../Misc/typeStore";
import { editableInPropertyPage, PropertyTypeForEdition } from "../../../../Decorators/nodeDecorator";
import { FrameGraphTAAObjectRendererTask } from "core/FrameGraph/Tasks/Rendering/taaObjectRendererTask";
import { NodeRenderGraphBaseObjectRendererBlock } from "./baseObjectRendererBlock";

/**
 * Block that render objects with temporal anti-aliasing to a render target
 */
export class NodeRenderGraphTAAObjectRendererBlock extends NodeRenderGraphBaseObjectRendererBlock {
    protected override _frameGraphTask: FrameGraphTAAObjectRendererTask;

    /**
     * Gets the frame graph task associated with this block
     */
    public override get task() {
        return this._frameGraphTask;
    }

    /**
     * Create a new NodeRenderGraphTAAObjectRendererBlock
     * @param name defines the block name
     * @param frameGraph defines the hosting frame graph
     * @param scene defines the hosting scene
     * @param doNotChangeAspectRatio True (default) to not change the aspect ratio of the scene in the RTT
     */
    public constructor(name: string, frameGraph: FrameGraph, scene: Scene, doNotChangeAspectRatio = true) {
        super(name, frameGraph, scene);

        this._additionalConstructionParameters = [doNotChangeAspectRatio];

        this._frameGraphTask = new FrameGraphTAAObjectRendererTask(this.name, frameGraph, scene, { doNotChangeAspectRatio });
    }

    /** True (default) to not change the aspect ratio of the scene in the RTT */
    @editableInPropertyPage("Do not change aspect ratio", PropertyTypeForEdition.Boolean, "PROPERTIES")
    public get doNotChangeAspectRatio() {
        return this._frameGraphTask.objectRenderer.options.doNotChangeAspectRatio;
    }

    public set doNotChangeAspectRatio(value: boolean) {
        const disabled = this._frameGraphTask.disabled;

        this._frameGraphTask.dispose();
        this._frameGraphTask = new FrameGraphTAAObjectRendererTask(this.name, this._frameGraph, this._scene, { doNotChangeAspectRatio: value });
        this._additionalConstructionParameters = [value];

        this._frameGraphTask.disabled = disabled;
    }

    /** Number of accumulated samples */
    @editableInPropertyPage("Samples", PropertyTypeForEdition.Int, "TEMPORAL ANTI-ALIASING")
    public get samples() {
        return this._frameGraphTask.postProcess.samples;
    }

    public set samples(value: number) {
        this._frameGraphTask.postProcess.samples = value;
    }

    /** The factor used to blend the history frame with current frame */
    @editableInPropertyPage("Factor", PropertyTypeForEdition.Float, "TEMPORAL ANTI-ALIASING")
    public get factor() {
        return this._frameGraphTask.postProcess.factor;
    }

    public set factor(value: number) {
        this._frameGraphTask.postProcess.factor = value;
    }

    /** Indicates if depth testing must be enabled or disabled */
    @editableInPropertyPage("Disable on camera move", PropertyTypeForEdition.Boolean, "TEMPORAL ANTI-ALIASING")
    public get disableOnCameraMove() {
        return this._frameGraphTask.postProcess.disableOnCameraMove;
    }

    public set disableOnCameraMove(value: boolean) {
        this._frameGraphTask.postProcess.disableOnCameraMove = value;
    }

    /** Indicates if TAA must be enabled or disabled */
    @editableInPropertyPage("Disable TAA", PropertyTypeForEdition.Boolean, "TEMPORAL ANTI-ALIASING")
    public get disableTAA() {
        return this._frameGraphTask.postProcess.disabled;
    }

    public set disableTAA(value: boolean) {
        this._frameGraphTask.postProcess.disabled = value;
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "NodeRenderGraphTAAObjectRendererBlock";
    }

    protected override _dumpPropertiesCode() {
        const codes: string[] = [];
        codes.push(`${this._codeVariableName}.doNotChangeAspectRatio = ${this.doNotChangeAspectRatio};`);
        codes.push(`${this._codeVariableName}.samples = ${this.samples};`);
        codes.push(`${this._codeVariableName}.factor = ${this.factor};`);
        codes.push(`${this._codeVariableName}.disableOnCameraMove = ${this.disableOnCameraMove};`);
        codes.push(`${this._codeVariableName}.disableTAA = ${this.disableTAA};`);
        return super._dumpPropertiesCode() + codes.join("\n");
    }

    public override serialize(): any {
        const serializationObject = super.serialize();
        serializationObject.doNotChangeAspectRatio = this.doNotChangeAspectRatio;
        serializationObject.samples = this.samples;
        serializationObject.factor = this.factor;
        serializationObject.disableOnCameraMove = this.disableOnCameraMove;
        serializationObject.disableTAA = this.disableTAA;
        return serializationObject;
    }

    public override _deserialize(serializationObject: any) {
        super._deserialize(serializationObject);
        this.doNotChangeAspectRatio = serializationObject.doNotChangeAspectRatio;
        this.samples = serializationObject.samples;
        this.factor = serializationObject.factor;
        this.disableOnCameraMove = serializationObject.disableOnCameraMove;
        this.disableTAA = serializationObject.disableTAA;
    }
}

RegisterClass("BABYLON.NodeRenderGraphTAAObjectRendererBlock", NodeRenderGraphTAAObjectRendererBlock);
