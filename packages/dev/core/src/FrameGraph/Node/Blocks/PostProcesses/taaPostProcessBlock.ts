import type { NodeRenderGraphConnectionPoint, Scene, NodeRenderGraphBuildState, FrameGraph, FrameGraphObjectRendererTask, FrameGraphTextureHandle } from "core/index";
import { RegisterClass } from "../../../../Misc/typeStore";
import { NodeRenderGraphBlockConnectionPointTypes, NodeRenderGraphConnectionPointDirection } from "../../Types/nodeRenderGraphTypes";
import { editableInPropertyPage, PropertyTypeForEdition } from "../../../../Decorators/nodeDecorator";
import { FrameGraphTAATask } from "core/FrameGraph/Tasks/PostProcesses/taaTask";
import { NodeRenderGraphConnectionPointCustomObject } from "../../nodeRenderGraphConnectionPointCustomObject";
import { NodeRenderGraphBaseObjectRendererBlock } from "../Rendering/baseObjectRendererBlock";
import { NodeRenderGraphBaseWithPropertiesPostProcessBlock } from "./baseWithPropertiesPostProcessBlock";

/**
 * Block that implements the TAA post process
 */
export class NodeRenderGraphTAAPostProcessBlock extends NodeRenderGraphBaseWithPropertiesPostProcessBlock {
    protected override _frameGraphTask: FrameGraphTAATask;

    /**
     * Gets the frame graph task associated with this block
     */
    public override get task() {
        return this._frameGraphTask;
    }

    /**
     * Create a new NodeRenderGraphTAAPostProcessBlock
     * @param name defines the block name
     * @param frameGraph defines the hosting frame graph
     * @param scene defines the hosting scene
     */
    public constructor(name: string, frameGraph: FrameGraph, scene: Scene) {
        super(name, frameGraph, scene);

        this.registerInput(
            "objectRenderer",
            NodeRenderGraphBlockConnectionPointTypes.Object,
            false,
            new NodeRenderGraphConnectionPointCustomObject(
                "objectRenderer",
                this,
                NodeRenderGraphConnectionPointDirection.Input,
                NodeRenderGraphBaseObjectRendererBlock,
                "NodeRenderGraphBaseObjectRendererBlock"
            )
        );
        this.registerInput("geomVelocity", NodeRenderGraphBlockConnectionPointTypes.TextureLinearVelocity, true);

        this._finalizeInputOutputRegistering();

        this._frameGraphTask = new FrameGraphTAATask(this.name, frameGraph);
    }

    /** Number of accumulated samples */
    @editableInPropertyPage("Samples", PropertyTypeForEdition.Int, "PROPERTIES")
    public get samples() {
        return this._frameGraphTask.postProcess.samples;
    }

    public set samples(value: number) {
        this._frameGraphTask.postProcess.samples = value;
    }

    /** The factor used to blend the history frame with current frame */
    @editableInPropertyPage("Factor", PropertyTypeForEdition.Float, "PROPERTIES")
    public get factor() {
        return this._frameGraphTask.postProcess.factor;
    }

    public set factor(value: number) {
        this._frameGraphTask.postProcess.factor = value;
    }

    /** Enables reprojecting the history texture with a per-pixel velocity */
    @editableInPropertyPage("Reproject history", PropertyTypeForEdition.Boolean, "PROPERTIES")
    public get reprojectHistory() {
        return this._frameGraphTask.postProcess.reprojectHistory;
    }

    public set reprojectHistory(value: boolean) {
        this._frameGraphTask.postProcess.reprojectHistory = value;
    }

    /** Clamps the history pixel to the min and max of the 3x3 pixels surrounding the target pixel */
    @editableInPropertyPage("Clamp history", PropertyTypeForEdition.Boolean, "PROPERTIES")
    public get clampHistory() {
        return this._frameGraphTask.postProcess.clampHistory;
    }

    public set clampHistory(value: boolean) {
        this._frameGraphTask.postProcess.clampHistory = value;
    }

    /** Indicates if depth testing must be enabled or disabled */
    @editableInPropertyPage("Disable on camera move", PropertyTypeForEdition.Boolean, "PROPERTIES")
    public get disableOnCameraMove() {
        return this._frameGraphTask.postProcess.disableOnCameraMove;
    }

    public set disableOnCameraMove(value: boolean) {
        this._frameGraphTask.postProcess.disableOnCameraMove = value;
    }

    /** Indicates if TAA must be enabled or disabled */
    @editableInPropertyPage("Disable TAA", PropertyTypeForEdition.Boolean, "PROPERTIES")
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
        return "NodeRenderGraphTAAPostProcessBlock";
    }

    /**
     * Gets the object renderer input component
     */
    public get objectRenderer(): NodeRenderGraphConnectionPoint {
        return this._inputs[2];
    }

    /**
     * Gets the geometry velocity input component
     */
    public get geomVelocity(): NodeRenderGraphConnectionPoint {
        return this._inputs[3];
    }

    protected override _buildBlock(state: NodeRenderGraphBuildState) {
        super._buildBlock(state);

        this._frameGraphTask.objectRendererTask = this.objectRenderer.connectedPoint?.value as FrameGraphObjectRendererTask;
        this._frameGraphTask.velocityTexture = this.geomVelocity.connectedPoint?.value as FrameGraphTextureHandle;
    }

    protected override _dumpPropertiesCode() {
        const codes: string[] = [];
        codes.push(`${this._codeVariableName}.samples = ${this.samples};`);
        codes.push(`${this._codeVariableName}.factor = ${this.factor};`);
        codes.push(`${this._codeVariableName}.clampHistory = ${this.clampHistory};`);
        codes.push(`${this._codeVariableName}.reprojectHistory = ${this.reprojectHistory};`);
        codes.push(`${this._codeVariableName}.disableOnCameraMove = ${this.disableOnCameraMove};`);
        codes.push(`${this._codeVariableName}.disableTAA = ${this.disableTAA};`);
        return super._dumpPropertiesCode() + codes.join("\n");
    }

    public override serialize(): any {
        const serializationObject = super.serialize();
        serializationObject.samples = this.samples;
        serializationObject.factor = this.factor;
        serializationObject.clampHistory = this.clampHistory;
        serializationObject.reprojectHistory = this.reprojectHistory;
        serializationObject.disableOnCameraMove = this.disableOnCameraMove;
        serializationObject.disableTAA = this.disableTAA;
        return serializationObject;
    }

    public override _deserialize(serializationObject: any) {
        super._deserialize(serializationObject);
        this.samples = serializationObject.samples;
        this.factor = serializationObject.factor;
        this.clampHistory = serializationObject.clampHistory;
        this.reprojectHistory = serializationObject.reprojectHistory;
        this.disableOnCameraMove = serializationObject.disableOnCameraMove;
        this.disableTAA = serializationObject.disableTAA;
    }
}

RegisterClass("BABYLON.NodeRenderGraphTAAPostProcessBlock", NodeRenderGraphTAAPostProcessBlock);
