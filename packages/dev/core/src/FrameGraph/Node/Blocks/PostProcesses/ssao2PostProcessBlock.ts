import type { Scene, FrameGraph, NodeRenderGraphConnectionPoint, NodeRenderGraphBuildState, FrameGraphTextureHandle, Camera } from "core/index";
import { Constants } from "core/Engines/constants";
import { RegisterClass } from "../../../../Misc/typeStore";
import { NodeRenderGraphBlockConnectionPointTypes } from "../../Types/nodeRenderGraphTypes";
import { editableInPropertyPage, PropertyTypeForEdition } from "../../../../Decorators/nodeDecorator";
import { FrameGraphSSAO2RenderingPipelineTask } from "../../../Tasks/PostProcesses/ssao2RenderingPipelineTask";
import { NodeRenderGraphBasePostProcessBlock } from "./basePostProcessBlock";

/**
 * Block that implements the SSAO2 post process
 */
export class NodeRenderGraphSSAO2PostProcessBlock extends NodeRenderGraphBasePostProcessBlock {
    protected override _frameGraphTask: FrameGraphSSAO2RenderingPipelineTask;

    public override _additionalConstructionParameters: [number, number, number];

    /**
     * Gets the frame graph task associated with this block
     */
    public override get task() {
        return this._frameGraphTask;
    }

    /**
     * Create a new NodeRenderGraphSSAO2PostProcessBlock
     * @param name defines the block name
     * @param frameGraph defines the hosting frame graph
     * @param scene defines the hosting scene
     * @param ratioSSAO The ratio between the SSAO texture size and the source texture size (default: 1)
     * @param ratioBlur The ratio between the SSAO blur texture size and the source texture size (default: 1)
     * @param textureType The texture type used by the different post processes created by SSAO2 (default: Constants.TEXTURETYPE_UNSIGNED_BYTE)
     */
    public constructor(name: string, frameGraph: FrameGraph, scene: Scene, ratioSSAO = 1, ratioBlur = 1, textureType = Constants.TEXTURETYPE_UNSIGNED_BYTE) {
        super(name, frameGraph, scene);

        this._additionalConstructionParameters = [ratioSSAO, ratioBlur, textureType];

        this.registerInput("camera", NodeRenderGraphBlockConnectionPointTypes.Camera);
        this.registerInput("geomDepth", NodeRenderGraphBlockConnectionPointTypes.TextureViewDepth);
        this.registerInput("geomNormal", NodeRenderGraphBlockConnectionPointTypes.TextureViewNormal);

        this._finalizeInputOutputRegistering();

        this._frameGraphTask = new FrameGraphSSAO2RenderingPipelineTask(this.name, frameGraph, ratioSSAO, ratioBlur, textureType);
    }

    private _createTask(ratioSSAO: number, ratioBlur: number, textureType: number) {
        const sourceSamplingMode = this.sourceSamplingMode;
        const samples = this.samples;
        const totalStrength = this.totalStrength;
        const base = this.base;
        const maxZ = this.maxZ;
        const minZAspect = this.minZAspect;
        const radius = this.radius;
        const epsilon = this.epsilon;
        const useViewportInCombineStage = this.useViewportInCombineStage;
        const bypassBlur = this.bypassBlur;
        const expensiveBlur = this.expensiveBlur;
        const bilateralSoften = this.bilateralSoften;
        const bilateralSamples = this.bilateralSamples;
        const bilateralTolerance = this.bilateralTolerance;

        this._frameGraphTask.dispose();
        this._frameGraphTask = new FrameGraphSSAO2RenderingPipelineTask(this.name, this._frameGraph, ratioSSAO, ratioBlur, textureType);

        this.sourceSamplingMode = sourceSamplingMode;
        this.samples = samples;
        this.totalStrength = totalStrength;
        this.base = base;
        this.maxZ = maxZ;
        this.minZAspect = minZAspect;
        this.radius = radius;
        this.epsilon = epsilon;
        this.useViewportInCombineStage = useViewportInCombineStage;
        this.bypassBlur = bypassBlur;
        this.expensiveBlur = expensiveBlur;
        this.bilateralSoften = bilateralSoften;
        this.bilateralSamples = bilateralSamples;
        this.bilateralTolerance = bilateralTolerance;

        this._additionalConstructionParameters = [ratioSSAO, ratioBlur, textureType];
    }

    /** The texture type used by the different post processes created by SSAO2 */
    @editableInPropertyPage("Texture type", PropertyTypeForEdition.TextureType, "TEXTURE")
    public get textureType() {
        return this._frameGraphTask.textureType;
    }

    public set textureType(value: number) {
        this._createTask(this._frameGraphTask.ratioSSAO, this._frameGraphTask.ratioBlur, value);
    }

    /** The ratio between the SSAO texture size and the source texture size */
    @editableInPropertyPage("SSAO texture ratio", PropertyTypeForEdition.Float, "TEXTURE", { min: 0.1, max: 1 })
    public get ratioSSAO() {
        return this._frameGraphTask.ratioSSAO;
    }

    public set ratioSSAO(value: number) {
        this._createTask(value, this._frameGraphTask.ratioBlur, this._frameGraphTask.textureType);
    }

    /** The ratio between the SSAO blur texture size and the source texture size */
    @editableInPropertyPage("SSAO blur texture ratio", PropertyTypeForEdition.Float, "TEXTURE", { min: 0.1, max: 1 })
    public get ratioBlur() {
        return this._frameGraphTask.ratioBlur;
    }

    public set ratioBlur(value: number) {
        this._createTask(this._frameGraphTask.ratioSSAO, value, this._frameGraphTask.textureType);
    }

    /** Number of samples used for the SSAO calculations. Default value is 8. */
    @editableInPropertyPage("Samples", PropertyTypeForEdition.Int, "SSAO", { min: 1, max: 128 })
    public get samples() {
        return this._frameGraphTask.ssao.samples;
    }

    public set samples(value: number) {
        this._frameGraphTask.ssao.samples = value;
    }

    /** The strength of the SSAO post-process. Default value is 1.0. */
    @editableInPropertyPage("Strength", PropertyTypeForEdition.Float, "SSAO", { min: 0, max: 3 })
    public get totalStrength() {
        return this._frameGraphTask.ssao.totalStrength;
    }

    public set totalStrength(value: number) {
        this._frameGraphTask.ssao.totalStrength = value;
    }

    /** The base color of the SSAO post-process. The final result is "base + ssao" between [0, 1] */
    @editableInPropertyPage("Base", PropertyTypeForEdition.Float, "SSAO", { min: 0, max: 1 })
    public get base() {
        return this._frameGraphTask.ssao.base;
    }

    public set base(value: number) {
        this._frameGraphTask.ssao.base = value;
    }

    /** Maximum depth value to still render AO. A smooth falloff makes the dimming more natural, so there will be no abrupt shading change. */
    @editableInPropertyPage("Max Z", PropertyTypeForEdition.Float, "SSAO", { min: 0, max: 10000 })
    public get maxZ() {
        return this._frameGraphTask.ssao.maxZ;
    }

    public set maxZ(value: number) {
        this._frameGraphTask.ssao.maxZ = value;
    }

    /** In order to save performances, SSAO radius is clamped on close geometry. This ratio changes by how much. */
    @editableInPropertyPage("Min Z aspect", PropertyTypeForEdition.Float, "SSAO", { min: 0, max: 0.5 })
    public get minZAspect() {
        return this._frameGraphTask.ssao.minZAspect;
    }

    public set minZAspect(value: number) {
        this._frameGraphTask.ssao.minZAspect = value;
    }

    /** The radius around the analyzed pixel used by the SSAO post-process. */
    @editableInPropertyPage("Radius", PropertyTypeForEdition.Float, "SSAO", { min: 0, max: 10 })
    public get radius() {
        return this._frameGraphTask.ssao.radius;
    }

    public set radius(value: number) {
        this._frameGraphTask.ssao.radius = value;
    }

    /** Used in SSAO calculations to compensate for accuracy issues with depth values. */
    @editableInPropertyPage("Epsilon", PropertyTypeForEdition.Float, "SSAO", { min: 0, max: 1 })
    public get epsilon() {
        return this._frameGraphTask.ssao.epsilon;
    }

    public set epsilon(value: number) {
        this._frameGraphTask.ssao.epsilon = value;
    }

    /** Indicates that the combine stage should use the current camera viewport to render the SSAO result on only a portion of the output texture. */
    @editableInPropertyPage("Use viewport in combine stage", PropertyTypeForEdition.Boolean, "SSAO")
    public get useViewportInCombineStage() {
        return this._frameGraphTask.ssao.useViewportInCombineStage;
    }

    public set useViewportInCombineStage(value: boolean) {
        this._frameGraphTask.ssao.useViewportInCombineStage = value;
    }

    /** Skips the denoising (blur) stage of the SSAO calculations. */
    @editableInPropertyPage("Bypass blur", PropertyTypeForEdition.Boolean, "Blur")
    public get bypassBlur() {
        return this._frameGraphTask.ssao.bypassBlur;
    }

    public set bypassBlur(value: boolean) {
        this._frameGraphTask.ssao.bypassBlur = value;
    }

    /** Enables the configurable bilateral denoising (blurring) filter. */
    @editableInPropertyPage("Expensive blur", PropertyTypeForEdition.Boolean, "Blur")
    public get expensiveBlur() {
        return this._frameGraphTask.ssao.expensiveBlur;
    }

    public set expensiveBlur(value: boolean) {
        this._frameGraphTask.ssao.expensiveBlur = value;
    }

    /** The number of samples the bilateral filter uses in both dimensions when denoising the SSAO calculations. */
    @editableInPropertyPage("Samples", PropertyTypeForEdition.Int, "Blur", { min: 1, max: 128 })
    public get bilateralSamples() {
        return this._frameGraphTask.ssao.bilateralSamples;
    }

    public set bilateralSamples(value: number) {
        this._frameGraphTask.ssao.bilateralSamples = value;
    }

    /** Controls the shape of the denoising kernel used by the bilateral filter. */
    @editableInPropertyPage("Soften", PropertyTypeForEdition.Float, "Blur", { min: 0, max: 1 })
    public get bilateralSoften() {
        return this._frameGraphTask.ssao.bilateralSoften;
    }

    public set bilateralSoften(value: number) {
        this._frameGraphTask.ssao.bilateralSoften = value;
    }

    /** How forgiving the bilateral denoiser should be when rejecting samples. */
    @editableInPropertyPage("Tolerance", PropertyTypeForEdition.Float, "Blur", { min: 0, max: 1 })
    public get bilateralTolerance() {
        return this._frameGraphTask.ssao.bilateralTolerance;
    }

    public set bilateralTolerance(value: number) {
        this._frameGraphTask.ssao.bilateralTolerance = value;
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "NodeRenderGraphSSAO2PostProcessBlock";
    }

    /**
     * Gets the camera input component
     */
    public get camera(): NodeRenderGraphConnectionPoint {
        return this._inputs[2];
    }

    /**
     * Gets the geometry depth input component
     */
    public get geomDepth(): NodeRenderGraphConnectionPoint {
        return this._inputs[3];
    }

    /**
     * Gets the geometry normal input component
     */
    public get geomNormal(): NodeRenderGraphConnectionPoint {
        return this._inputs[4];
    }

    protected override _buildBlock(state: NodeRenderGraphBuildState) {
        super._buildBlock(state);

        this._frameGraphTask.normalTexture = this.geomNormal.connectedPoint?.value as FrameGraphTextureHandle;
        this._frameGraphTask.depthTexture = this.geomDepth.connectedPoint?.value as FrameGraphTextureHandle;
        this._frameGraphTask.camera = this.camera.connectedPoint?.value as Camera;
    }

    protected override _dumpPropertiesCode() {
        const codes: string[] = [];
        codes.push(`${this._codeVariableName}.samples = ${this.samples};`);
        codes.push(`${this._codeVariableName}.totalStrength = ${this.totalStrength};`);
        codes.push(`${this._codeVariableName}.base = ${this.base};`);
        codes.push(`${this._codeVariableName}.maxZ = ${this.maxZ};`);
        codes.push(`${this._codeVariableName}.minZAspect = ${this.minZAspect};`);
        codes.push(`${this._codeVariableName}.radius = ${this.radius};`);
        codes.push(`${this._codeVariableName}.epsilon = ${this.epsilon};`);
        codes.push(`${this._codeVariableName}.useViewportInCombineStage = ${this.useViewportInCombineStage};`);
        codes.push(`${this._codeVariableName}.bypassBlur = ${this.bypassBlur};`);
        codes.push(`${this._codeVariableName}.expensiveBlur = ${this.expensiveBlur};`);
        codes.push(`${this._codeVariableName}.bilateralSamples = ${this.bilateralSamples};`);
        codes.push(`${this._codeVariableName}.bilateralSoften = ${this.bilateralSoften};`);
        codes.push(`${this._codeVariableName}.bilateralTolerance = ${this.bilateralTolerance};`);
        return super._dumpPropertiesCode() + codes.join("\n");
    }

    public override serialize(): any {
        const serializationObject = super.serialize();
        serializationObject.samples = this.samples;
        serializationObject.totalStrength = this.totalStrength;
        serializationObject.base = this.base;
        serializationObject.maxZ = this.maxZ;
        serializationObject.minZAspect = this.minZAspect;
        serializationObject.radius = this.radius;
        serializationObject.epsilon = this.epsilon;
        serializationObject.useViewportInCombineStage = this.useViewportInCombineStage;
        serializationObject.bypassBlur = this.bypassBlur;
        serializationObject.expensiveBlur = this.expensiveBlur;
        serializationObject.bilateralSoften = this.bilateralSoften;
        serializationObject.bilateralSamples = this.bilateralSamples;
        serializationObject.bilateralTolerance = this.bilateralTolerance;
        return serializationObject;
    }

    public override _deserialize(serializationObject: any) {
        super._deserialize(serializationObject);
        this.samples = serializationObject.samples;
        this.totalStrength = serializationObject.totalStrength;
        this.base = serializationObject.base;
        this.maxZ = serializationObject.maxZ;
        this.minZAspect = serializationObject.minZAspect;
        this.radius = serializationObject.radius;
        this.epsilon = serializationObject.epsilon;
        this.useViewportInCombineStage = serializationObject.useViewportInCombineStage;
        this.bypassBlur = serializationObject.bypassBlur;
        this.expensiveBlur = serializationObject.expensiveBlur;
        this.bilateralSoften = serializationObject.bilateralSoften;
        this.bilateralSamples = serializationObject.bilateralSamples;
        this.bilateralTolerance = serializationObject.bilateralTolerance;
    }
}

RegisterClass("BABYLON.NodeRenderGraphSSAO2PostProcessBlock", NodeRenderGraphSSAO2PostProcessBlock);
