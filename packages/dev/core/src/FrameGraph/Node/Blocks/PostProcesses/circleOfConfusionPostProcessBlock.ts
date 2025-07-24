import type { NodeRenderGraphConnectionPoint, Scene, NodeRenderGraphBuildState, FrameGraphTextureHandle, FrameGraph, Camera } from "core/index";
import { RegisterClass } from "../../../../Misc/typeStore";
import { NodeRenderGraphBlockConnectionPointTypes } from "../../Types/nodeRenderGraphTypes";
import { editableInPropertyPage, PropertyTypeForEdition } from "../../../../Decorators/nodeDecorator";
import { FrameGraphCircleOfConfusionTask } from "core/FrameGraph/Tasks/PostProcesses/circleOfConfusionTask";
import { ThinCircleOfConfusionPostProcess } from "core/PostProcesses/thinCircleOfConfusionPostProcess";
import { NodeRenderGraphBasePostProcessBlock } from "./basePostProcessBlock";

/**
 * Block that implements the circle of confusion post process
 */
export class NodeRenderGraphCircleOfConfusionPostProcessBlock extends NodeRenderGraphBasePostProcessBlock {
    protected override _frameGraphTask: FrameGraphCircleOfConfusionTask;

    /**
     * Gets the frame graph task associated with this block
     */
    public override get task() {
        return this._frameGraphTask;
    }

    /**
     * Create a new NodeRenderGraphCircleOfConfusionPostProcessBlock
     * @param name defines the block name
     * @param frameGraph defines the hosting frame graph
     * @param scene defines the hosting scene
     */
    public constructor(name: string, frameGraph: FrameGraph, scene: Scene) {
        super(name, frameGraph, scene);

        this.registerInput("geomViewDepth", NodeRenderGraphBlockConnectionPointTypes.TextureViewDepth);
        this.registerInput("camera", NodeRenderGraphBlockConnectionPointTypes.Camera);

        this._finalizeInputOutputRegistering();

        this._frameGraphTask = new FrameGraphCircleOfConfusionTask(
            this.name,
            frameGraph,
            new ThinCircleOfConfusionPostProcess(name, scene.getEngine(), { depthNotNormalized: true })
        );
    }

    /** Sampling mode used to sample from the depth texture */
    @editableInPropertyPage("Depth sampling mode", PropertyTypeForEdition.SamplingMode, "PROPERTIES")
    public get depthSamplingMode() {
        return this._frameGraphTask.depthSamplingMode;
    }

    public set depthSamplingMode(value: number) {
        this._frameGraphTask.depthSamplingMode = value;
    }

    /** Max lens size in scene units/1000 (eg. millimeter). Standard cameras are 50mm. The diameter of the resulting aperture can be computed by lensSize/fStop. */
    @editableInPropertyPage("Lens size", PropertyTypeForEdition.Float, "PROPERTIES")
    public get lensSize(): number {
        return this._frameGraphTask.postProcess.lensSize;
    }

    public set lensSize(value: number) {
        this._frameGraphTask.postProcess.lensSize = value;
    }

    /** F-Stop of the effect's camera. The diameter of the resulting aperture can be computed by lensSize/fStop */
    @editableInPropertyPage("F-Stop", PropertyTypeForEdition.Float, "PROPERTIES")
    public get fStop(): number {
        return this._frameGraphTask.postProcess.fStop;
    }

    public set fStop(value: number) {
        this._frameGraphTask.postProcess.fStop = value;
    }

    /** Distance away from the camera to focus on in scene units/1000 (eg. millimeter) */
    @editableInPropertyPage("Focus distance", PropertyTypeForEdition.Float, "PROPERTIES")
    public get focusDistance(): number {
        return this._frameGraphTask.postProcess.focusDistance;
    }

    public set focusDistance(value: number) {
        this._frameGraphTask.postProcess.focusDistance = value;
    }

    /** Focal length of the effect's camera in scene units/1000 (eg. millimeter) */
    @editableInPropertyPage("Focal length", PropertyTypeForEdition.Float, "PROPERTIES")
    public get focalLength(): number {
        return this._frameGraphTask.postProcess.focalLength;
    }

    public set focalLength(value: number) {
        this._frameGraphTask.postProcess.focalLength = value;
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "NodeRenderGraphCircleOfConfusionPostProcessBlock";
    }

    /**
     * Gets the geometry view depth input component
     */
    public get geomViewDepth(): NodeRenderGraphConnectionPoint {
        return this._inputs[2];
    }

    /**
     * Gets the camera input component
     */
    public get camera(): NodeRenderGraphConnectionPoint {
        return this._inputs[3];
    }

    protected override _buildBlock(state: NodeRenderGraphBuildState) {
        super._buildBlock(state);

        this._frameGraphTask.depthTexture = this.geomViewDepth.connectedPoint?.value as FrameGraphTextureHandle;
        this._frameGraphTask.camera = this.camera.connectedPoint?.value as Camera;
    }

    protected override _dumpPropertiesCode() {
        const codes: string[] = [];
        codes.push(`${this._codeVariableName}.lensSize = ${this.lensSize};`);
        codes.push(`${this._codeVariableName}.fStop = ${this.fStop};`);
        codes.push(`${this._codeVariableName}.focusDistance = ${this.focusDistance};`);
        codes.push(`${this._codeVariableName}.focalLength = ${this.focalLength};`);
        codes.push(`${this._codeVariableName}.depthSamplingMode = ${this.depthSamplingMode};`);
        return super._dumpPropertiesCode() + codes.join("\n");
    }

    public override serialize(): any {
        const serializationObject = super.serialize();
        serializationObject.lensSize = this.lensSize;
        serializationObject.fStop = this.fStop;
        serializationObject.focusDistance = this.focusDistance;
        serializationObject.focalLength = this.focalLength;
        serializationObject.depthSamplingMode = this.depthSamplingMode;
        return serializationObject;
    }

    public override _deserialize(serializationObject: any) {
        super._deserialize(serializationObject);
        this.lensSize = serializationObject.lensSize;
        this.fStop = serializationObject.fStop;
        this.focusDistance = serializationObject.focusDistance;
        this.focalLength = serializationObject.focalLength;
        this.depthSamplingMode = serializationObject.depthSamplingMode;
    }
}

RegisterClass("BABYLON.NodeRenderGraphCircleOfConfusionPostProcessBlock", NodeRenderGraphCircleOfConfusionPostProcessBlock);
