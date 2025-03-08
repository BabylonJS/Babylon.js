// eslint-disable-next-line import/no-internal-modules
import type { NodeRenderGraphConnectionPoint, Scene, NodeRenderGraphBuildState, FrameGraphTextureHandle, FrameGraph, Camera } from "core/index";
import { RegisterClass } from "../../../../Misc/typeStore";
import { NodeRenderGraphBlockConnectionPointTypes } from "../../Types/nodeRenderGraphTypes";
import { editableInPropertyPage, PropertyTypeForEdition } from "../../../../Decorators/nodeDecorator";
import { FrameGraphDepthOfFieldTask } from "../../../Tasks/PostProcesses/depthOfFieldTask";
import { ThinDepthOfFieldEffectBlurLevel } from "core/PostProcesses/thinDepthOfFieldEffect";
import { NodeRenderGraphBasePostProcessBlock } from "./basePostProcessBlock";

/**
 * Block that implements the depth of field post process
 */
export class NodeRenderGraphDepthOfFieldPostProcessBlock extends NodeRenderGraphBasePostProcessBlock {
    protected override _frameGraphTask: FrameGraphDepthOfFieldTask;

    /**
     * Gets the frame graph task associated with this block
     */
    public override get task() {
        return this._frameGraphTask;
    }

    /**
     * Create a new NodeRenderGraphDepthOfFieldPostProcessBlock
     * @param name defines the block name
     * @param frameGraph defines the hosting frame graph
     * @param scene defines the hosting scene
     * @param blurLevel The quality of the depth of field effect (default: ThinDepthOfFieldEffectBlurLevel.Low)
     * @param hdr If high dynamic range textures should be used (default: false)
     */
    public constructor(name: string, frameGraph: FrameGraph, scene: Scene, blurLevel: ThinDepthOfFieldEffectBlurLevel = ThinDepthOfFieldEffectBlurLevel.Low, hdr = false) {
        super(name, frameGraph, scene);

        this._additionalConstructionParameters = [blurLevel, hdr];

        this.registerInput("geomViewDepth", NodeRenderGraphBlockConnectionPointTypes.TextureViewDepth);
        this.registerInput("camera", NodeRenderGraphBlockConnectionPointTypes.Camera);

        this._finalizeInputOutputRegistering();

        this._frameGraphTask = new FrameGraphDepthOfFieldTask(this.name, frameGraph, blurLevel, hdr);
    }

    private _createTask(blurLevel: ThinDepthOfFieldEffectBlurLevel, hdr: boolean) {
        const sourceSamplingMode = this._frameGraphTask.sourceSamplingMode;
        const depthSamplingMode = this._frameGraphTask.depthSamplingMode;
        const focalLength = this._frameGraphTask.depthOfField.focalLength;
        const fStop = this._frameGraphTask.depthOfField.fStop;
        const focusDistance = this._frameGraphTask.depthOfField.focusDistance;
        const lensSize = this._frameGraphTask.depthOfField.lensSize;

        this._frameGraphTask.dispose();

        this._frameGraphTask = new FrameGraphDepthOfFieldTask(this.name, this._frameGraph, blurLevel, hdr);
        this._frameGraphTask.sourceSamplingMode = sourceSamplingMode;
        this._frameGraphTask.depthSamplingMode = depthSamplingMode;
        this._frameGraphTask.depthOfField.focalLength = focalLength;
        this._frameGraphTask.depthOfField.fStop = fStop;
        this._frameGraphTask.depthOfField.focusDistance = focusDistance;
        this._frameGraphTask.depthOfField.lensSize = lensSize;

        this._additionalConstructionParameters = [blurLevel, hdr];
    }

    /** The quality of the blur effect */
    @editableInPropertyPage("Blur level", PropertyTypeForEdition.List, "PROPERTIES", {
        options: [
            { label: "Low", value: ThinDepthOfFieldEffectBlurLevel.Low },
            { label: "Medium", value: ThinDepthOfFieldEffectBlurLevel.Medium },
            { label: "High", value: ThinDepthOfFieldEffectBlurLevel.High },
        ],
    })
    public get blurLevel(): ThinDepthOfFieldEffectBlurLevel {
        return this._frameGraphTask.depthOfField.blurLevel;
    }

    public set blurLevel(value: ThinDepthOfFieldEffectBlurLevel) {
        this._createTask(value, this._frameGraphTask.hdr);
    }

    /** If high dynamic range textures should be used */
    @editableInPropertyPage("HDR", PropertyTypeForEdition.Boolean, "PROPERTIES")
    public get hdr(): boolean {
        return this._frameGraphTask.hdr;
    }

    public set hdr(value: boolean) {
        this._createTask(this._frameGraphTask.depthOfField.blurLevel, value);
    }

    /** Sampling mode used to sample from the depth texture */
    @editableInPropertyPage("Depth sampling mode", PropertyTypeForEdition.SamplingMode, "PROPERTIES")
    public get depthSamplingMode() {
        return this._frameGraphTask.depthSamplingMode;
    }

    public set depthSamplingMode(value: number) {
        this._frameGraphTask.depthSamplingMode = value;
    }

    /** The focal the length of the camera used in the effect in scene units/1000 (eg. millimeter). */
    @editableInPropertyPage("Focal length", PropertyTypeForEdition.Float, "PROPERTIES")
    public get focalLength(): number {
        return this._frameGraphTask.depthOfField.focalLength;
    }

    public set focalLength(value: number) {
        this._frameGraphTask.depthOfField.focalLength = value;
    }

    /** F-Stop of the effect's camera. The diameter of the resulting aperture can be computed by lensSize/fStop. */
    @editableInPropertyPage("F-Stop", PropertyTypeForEdition.Float, "PROPERTIES")
    public get fStop(): number {
        return this._frameGraphTask.depthOfField.fStop;
    }

    public set fStop(value: number) {
        this._frameGraphTask.depthOfField.fStop = value;
    }

    /** Distance away from the camera to focus on in scene units/1000 (eg. millimeter). */
    @editableInPropertyPage("Focus distance", PropertyTypeForEdition.Float, "PROPERTIES")
    public get focusDistance(): number {
        return this._frameGraphTask.depthOfField.focusDistance;
    }

    public set focusDistance(value: number) {
        this._frameGraphTask.depthOfField.focusDistance = value;
    }

    /** Max lens size in scene units/1000 (eg. millimeter). Standard cameras are 50mm. The diameter of the resulting aperture can be computed by lensSize/fStop. */
    @editableInPropertyPage("Lens size", PropertyTypeForEdition.Float, "PROPERTIES")
    public get lensSize(): number {
        return this._frameGraphTask.depthOfField.lensSize;
    }

    public set lensSize(value: number) {
        this._frameGraphTask.depthOfField.lensSize = value;
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "NodeRenderGraphDepthOfFieldPostProcessBlock";
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

        this.output.value = this._frameGraphTask.outputTexture;

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

RegisterClass("BABYLON.NodeRenderGraphDepthOfFieldPostProcessBlock", NodeRenderGraphDepthOfFieldPostProcessBlock);
