// eslint-disable-next-line import/no-internal-modules
import type { NodeRenderGraphConnectionPoint, Scene, NodeRenderGraphBuildState, FrameGraphTextureHandle, FrameGraph } from "core/index";
import { RegisterClass } from "../../../../Misc/typeStore";
import { NodeRenderGraphBlockConnectionPointTypes } from "../../Types/nodeRenderGraphTypes";
import { editableInPropertyPage, PropertyTypeForEdition } from "../../../../Decorators/nodeDecorator";
import { FrameGraphMotionBlurTask } from "core/FrameGraph/Tasks/PostProcesses/motionBlurTask";
import { ThinMotionBlurPostProcess } from "core/PostProcesses/thinMotionBlurPostProcess";
import { NodeRenderGraphBasePostProcessBlock } from "./basePostProcessBlock";

/**
 * Block that implements the motion blur post process
 */
export class NodeRenderGraphMotionBlurPostProcessBlock extends NodeRenderGraphBasePostProcessBlock {
    protected override _frameGraphTask: FrameGraphMotionBlurTask;

    /**
     * Gets the frame graph task associated with this block
     */
    public override get task() {
        return this._frameGraphTask;
    }

    /**
     * Create a new NodeRenderGraphMotionBlurPostProcessBlock
     * @param name defines the block name
     * @param frameGraph defines the hosting frame graph
     * @param scene defines the hosting scene
     */
    public constructor(name: string, frameGraph: FrameGraph, scene: Scene) {
        super(name, frameGraph, scene);

        this.registerInput("geomVelocity", NodeRenderGraphBlockConnectionPointTypes.TextureVelocity, true);
        this.registerInput("geomViewDepth", NodeRenderGraphBlockConnectionPointTypes.TextureViewDepth, true);

        this._finalizeInputOutputRegistering();

        this._frameGraphTask = new FrameGraphMotionBlurTask(this.name, frameGraph, new ThinMotionBlurPostProcess(name, frameGraph.scene));
    }

    /** Defines how much the image is blurred by the movement. */
    @editableInPropertyPage("Strength", PropertyTypeForEdition.Float, "PROPERTIES")
    public get motionStrength(): number {
        return this._frameGraphTask.postProcess.motionStrength;
    }

    public set motionStrength(value: number) {
        this._frameGraphTask.postProcess.motionStrength = value;
    }

    /** Gets the number of iterations that are used for motion blur quality. */
    @editableInPropertyPage("Samples", PropertyTypeForEdition.Float, "PROPERTIES")
    public get motionBlurSamples(): number {
        return this._frameGraphTask.postProcess.motionBlurSamples;
    }

    public set motionBlurSamples(value: number) {
        this._frameGraphTask.postProcess.motionBlurSamples = value;
    }

    /** Gets whether or not the motion blur post-process is in object based mode. */
    @editableInPropertyPage("Object based", PropertyTypeForEdition.Boolean, "PROPERTIES")
    public get isObjectBased(): boolean {
        return this._frameGraphTask.postProcess.isObjectBased;
    }

    public set isObjectBased(value: boolean) {
        this._frameGraphTask.postProcess.isObjectBased = value;
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "NodeRenderGraphMotionBlurPostProcessBlock";
    }

    /**
     * Gets the geometry velocity input component
     */
    public get geomVelocity(): NodeRenderGraphConnectionPoint {
        return this._inputs[2];
    }

    /**
     * Gets the geometry view depth input component
     */
    public get geomViewDepth(): NodeRenderGraphConnectionPoint {
        return this._inputs[3];
    }

    protected override _buildBlock(state: NodeRenderGraphBuildState) {
        super._buildBlock(state);

        this._frameGraphTask.velocityTexture = this.geomVelocity.connectedPoint?.value as FrameGraphTextureHandle;
        this._frameGraphTask.depthTexture = this.geomViewDepth.connectedPoint?.value as FrameGraphTextureHandle;
    }

    protected override _dumpPropertiesCode() {
        const codes: string[] = [];
        codes.push(`${this._codeVariableName}.motionStrength = ${this.motionStrength};`);
        codes.push(`${this._codeVariableName}.motionBlurSamples = ${this.motionBlurSamples};`);
        codes.push(`${this._codeVariableName}.isObjectBased = ${this.isObjectBased};`);
        return super._dumpPropertiesCode() + codes.join("\n");
    }

    public override serialize(): any {
        const serializationObject = super.serialize();
        serializationObject.motionStrength = this.motionStrength;
        serializationObject.motionBlurSamples = this.motionBlurSamples;
        serializationObject.isObjectBased = this.isObjectBased;
        return serializationObject;
    }

    public override _deserialize(serializationObject: any) {
        super._deserialize(serializationObject);
        this.motionStrength = serializationObject.motionStrength;
        this.motionBlurSamples = serializationObject.motionBlurSamples;
        this.isObjectBased = serializationObject.isObjectBased;
    }
}

RegisterClass("BABYLON.NodeRenderGraphMotionBlurPostProcessBlock", NodeRenderGraphMotionBlurPostProcessBlock);
