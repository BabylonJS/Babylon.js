import {
    type Camera,
    type FrameGraph,
    type FrameGraphObjectList,
    type FrameGraphTextureHandle,
    type NodeRenderGraphBuildState,
    type NodeRenderGraphConnectionPoint,
    type Scene,
} from "core/index";
import { RegisterClass } from "../../../../Misc/typeStore";
import { editableInPropertyPage, PropertyTypeForEdition } from "../../../../Decorators/nodeDecorator";
import { NodeRenderGraphBlock } from "../../nodeRenderGraphBlock";
import { FrameGraphIblShadowsRendererTask } from "core/FrameGraph/Tasks/Rendering/iblShadowsRendererTask";
import { NodeRenderGraphBlockConnectionPointTypes } from "../../Types/nodeRenderGraphTypes";

/**
 * Block that implements IBL (image-based lighting) shadows using voxel tracing.
 */
export class NodeRenderGraphIblShadowsRendererBlock extends NodeRenderGraphBlock {
    protected override _frameGraphTask: FrameGraphIblShadowsRendererTask;

    /**
     * Gets the frame graph task associated with this block
     */
    public override get task() {
        return this._frameGraphTask;
    }

    /**
     * Create a new NodeRenderGraphIblShadowsRendererBlock
     * @param name defines the block name
     * @param frameGraph defines the hosting frame graph
     * @param scene defines the hosting scene
     */
    public constructor(name: string, frameGraph: FrameGraph, scene: Scene) {
        super(name, frameGraph, scene);

        this.registerInput("depth", NodeRenderGraphBlockConnectionPointTypes.TextureScreenDepth);
        this.registerInput("normal", NodeRenderGraphBlockConnectionPointTypes.TextureWorldNormal);
        this.registerInput("position", NodeRenderGraphBlockConnectionPointTypes.TextureWorldPosition);
        this.registerInput("velocity", NodeRenderGraphBlockConnectionPointTypes.TextureLinearVelocity);
        this.registerInput("camera", NodeRenderGraphBlockConnectionPointTypes.Camera);
        this.registerInput("objects", NodeRenderGraphBlockConnectionPointTypes.ObjectList);

        this._addDependenciesInput();

        this.registerOutput("output", NodeRenderGraphBlockConnectionPointTypes.Texture);

        this._frameGraphTask = new FrameGraphIblShadowsRendererTask(name, frameGraph);
    }

    // ------ Tracing properties ------

    /** Number of tracing sample directions */
    @editableInPropertyPage("Sample directions", PropertyTypeForEdition.Int, "TRACING", { min: 1, max: 16 })
    public get sampleDirections(): number {
        return this._frameGraphTask.sampleDirections;
    }

    public set sampleDirections(value: number) {
        this._frameGraphTask.sampleDirections = value;
    }

    /** Whether traced shadows preserve environment color */
    @editableInPropertyPage("Colored shadows", PropertyTypeForEdition.Boolean, "TRACING")
    public get coloredShadows(): boolean {
        return this._frameGraphTask.coloredShadows;
    }

    public set coloredShadows(value: boolean) {
        this._frameGraphTask.coloredShadows = value;
    }

    /** Opacity of voxel-traced shadows */
    @editableInPropertyPage("Voxel shadow opacity", PropertyTypeForEdition.Float, "TRACING", { min: 0, max: 1 })
    public get voxelShadowOpacity(): number {
        return this._frameGraphTask.voxelShadowOpacity;
    }

    public set voxelShadowOpacity(value: number) {
        this._frameGraphTask.voxelShadowOpacity = value;
    }

    /** Opacity of screen-space shadows */
    @editableInPropertyPage("SS shadow opacity", PropertyTypeForEdition.Float, "TRACING", { min: 0, max: 1 })
    public get ssShadowOpacity(): number {
        return this._frameGraphTask.ssShadowOpacity;
    }

    public set ssShadowOpacity(value: number) {
        this._frameGraphTask.ssShadowOpacity = value;
    }

    /** Number of screen-space shadow samples */
    @editableInPropertyPage("SS sample count", PropertyTypeForEdition.Int, "TRACING", { min: 1, max: 64 })
    public get ssShadowSampleCount(): number {
        return this._frameGraphTask.ssShadowSampleCount;
    }

    public set ssShadowSampleCount(value: number) {
        this._frameGraphTask.ssShadowSampleCount = value;
    }

    /** Stride used by screen-space shadow sampling */
    @editableInPropertyPage("SS stride", PropertyTypeForEdition.Int, "TRACING", { min: 1, max: 32 })
    public get ssShadowStride(): number {
        return this._frameGraphTask.ssShadowStride;
    }

    public set ssShadowStride(value: number) {
        this._frameGraphTask.ssShadowStride = value;
    }

    /** Distance scale used by screen-space shadow tracing */
    @editableInPropertyPage("SS distance scale", PropertyTypeForEdition.Float, "TRACING", { min: 0 })
    public get ssShadowDistanceScale(): number {
        return this._frameGraphTask.ssShadowDistanceScale;
    }

    public set ssShadowDistanceScale(value: number) {
        this._frameGraphTask.ssShadowDistanceScale = value;
    }

    /** Thickness scale used by screen-space shadow tracing */
    @editableInPropertyPage("SS thickness scale", PropertyTypeForEdition.Float, "TRACING", { min: 0 })
    public get ssShadowThicknessScale(): number {
        return this._frameGraphTask.ssShadowThicknessScale;
    }

    public set ssShadowThicknessScale(value: number) {
        this._frameGraphTask.ssShadowThicknessScale = value;
    }

    /** Voxel tracing normal bias */
    @editableInPropertyPage("Normal bias", PropertyTypeForEdition.Float, "TRACING", { min: 0 })
    public get voxelNormalBias(): number {
        return this._frameGraphTask.voxelNormalBias;
    }

    public set voxelNormalBias(value: number) {
        this._frameGraphTask.voxelNormalBias = value;
    }

    /** Voxel tracing direction bias */
    @editableInPropertyPage("Direction bias", PropertyTypeForEdition.Float, "TRACING", { min: 0 })
    public get voxelDirectionBias(): number {
        return this._frameGraphTask.voxelDirectionBias;
    }

    public set voxelDirectionBias(value: number) {
        this._frameGraphTask.voxelDirectionBias = value;
    }

    /** Environment rotation in radians */
    @editableInPropertyPage("Env rotation", PropertyTypeForEdition.Float, "TRACING")
    public get envRotation(): number {
        return this._frameGraphTask.envRotation;
    }

    public set envRotation(value: number) {
        this._frameGraphTask.envRotation = value;
    }

    // ------ Accumulation properties ------

    /** Temporal shadow remanence while moving */
    @editableInPropertyPage("Shadow remanence", PropertyTypeForEdition.Float, "ACCUMULATION", { min: 0, max: 1 })
    public get shadowRemanence(): number {
        return this._frameGraphTask.shadowRemanence;
    }

    public set shadowRemanence(value: number) {
        this._frameGraphTask.shadowRemanence = value;
    }

    /** Final material shadow opacity */
    @editableInPropertyPage("Shadow opacity", PropertyTypeForEdition.Float, "ACCUMULATION", { min: 0, max: 1 })
    public get shadowOpacity(): number {
        return this._frameGraphTask.shadowOpacity;
    }

    public set shadowOpacity(value: number) {
        this._frameGraphTask.shadowOpacity = value;
    }

    // ------ Voxelization properties ------

    /** Voxelization resolution exponent (actual resolution is 2^value) */
    @editableInPropertyPage("Resolution exp", PropertyTypeForEdition.Int, "VOXELIZATION", { min: 1, max: 8 })
    public get resolutionExp(): number {
        return this._frameGraphTask.resolutionExp;
    }

    public set resolutionExp(value: number) {
        this._frameGraphTask.resolutionExp = value;
    }

    /** Voxelization refresh rate (-1: manual, 0: every frame, N: skip N frames) */
    @editableInPropertyPage("Refresh rate", PropertyTypeForEdition.Int, "VOXELIZATION", { min: -1 })
    public get refreshRate(): number {
        return this._frameGraphTask.refreshRate;
    }

    public set refreshRate(value: number) {
        this._frameGraphTask.refreshRate = value;
    }

    /** Whether tri-planar voxelization is used */
    @editableInPropertyPage("Tri-planar", PropertyTypeForEdition.Boolean, "VOXELIZATION")
    public get triPlanarVoxelization(): boolean {
        return this._frameGraphTask.triPlanarVoxelization;
    }

    public set triPlanarVoxelization(value: boolean) {
        this._frameGraphTask.triPlanarVoxelization = value;
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "NodeRenderGraphIblShadowsRendererBlock";
    }

    /**
     * Gets the depth texture input component
     */
    public get depth(): NodeRenderGraphConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the normal texture input component
     */
    public get normal(): NodeRenderGraphConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the position texture input component
     */
    public get position(): NodeRenderGraphConnectionPoint {
        return this._inputs[2];
    }

    /**
     * Gets the velocity texture input component
     */
    public get velocity(): NodeRenderGraphConnectionPoint {
        return this._inputs[3];
    }

    /**
     * Gets the camera input component
     */
    public get camera(): NodeRenderGraphConnectionPoint {
        return this._inputs[4];
    }

    /**
     * Gets the objects input component
     */
    public get objects(): NodeRenderGraphConnectionPoint {
        return this._inputs[5];
    }

    /**
     * Gets the output component
     */
    public get output(): NodeRenderGraphConnectionPoint {
        return this._outputs[0];
    }

    protected override _buildBlock(state: NodeRenderGraphBuildState) {
        super._buildBlock(state);

        this.output.value = this._frameGraphTask.outputTexture;

        this._frameGraphTask.depthTexture = this.depth.connectedPoint?.value as FrameGraphTextureHandle;
        this._frameGraphTask.normalTexture = this.normal.connectedPoint?.value as FrameGraphTextureHandle;
        this._frameGraphTask.positionTexture = this.position.connectedPoint?.value as FrameGraphTextureHandle;
        this._frameGraphTask.velocityTexture = this.velocity.connectedPoint?.value as FrameGraphTextureHandle;
        this._frameGraphTask.camera = this.camera.connectedPoint?.value as Camera;
        this._frameGraphTask.objectList = this.objects.connectedPoint?.value as FrameGraphObjectList;
    }

    protected override _dumpPropertiesCode() {
        const codes: string[] = [];
        codes.push(`${this._codeVariableName}.sampleDirections = ${this.sampleDirections};`);
        codes.push(`${this._codeVariableName}.coloredShadows = ${this.coloredShadows};`);
        codes.push(`${this._codeVariableName}.voxelShadowOpacity = ${this.voxelShadowOpacity};`);
        codes.push(`${this._codeVariableName}.ssShadowOpacity = ${this.ssShadowOpacity};`);
        codes.push(`${this._codeVariableName}.ssShadowSampleCount = ${this.ssShadowSampleCount};`);
        codes.push(`${this._codeVariableName}.ssShadowStride = ${this.ssShadowStride};`);
        codes.push(`${this._codeVariableName}.ssShadowDistanceScale = ${this.ssShadowDistanceScale};`);
        codes.push(`${this._codeVariableName}.ssShadowThicknessScale = ${this.ssShadowThicknessScale};`);
        codes.push(`${this._codeVariableName}.voxelNormalBias = ${this.voxelNormalBias};`);
        codes.push(`${this._codeVariableName}.voxelDirectionBias = ${this.voxelDirectionBias};`);
        codes.push(`${this._codeVariableName}.envRotation = ${this.envRotation};`);
        codes.push(`${this._codeVariableName}.shadowRemanence = ${this.shadowRemanence};`);
        codes.push(`${this._codeVariableName}.shadowOpacity = ${this.shadowOpacity};`);
        codes.push(`${this._codeVariableName}.resolutionExp = ${this.resolutionExp};`);
        codes.push(`${this._codeVariableName}.refreshRate = ${this.refreshRate};`);
        codes.push(`${this._codeVariableName}.triPlanarVoxelization = ${this.triPlanarVoxelization};`);
        return super._dumpPropertiesCode() + codes.join("\n");
    }

    public override serialize(): any {
        const serializationObject = super.serialize();
        serializationObject.sampleDirections = this.sampleDirections;
        serializationObject.coloredShadows = this.coloredShadows;
        serializationObject.voxelShadowOpacity = this.voxelShadowOpacity;
        serializationObject.ssShadowOpacity = this.ssShadowOpacity;
        serializationObject.ssShadowSampleCount = this.ssShadowSampleCount;
        serializationObject.ssShadowStride = this.ssShadowStride;
        serializationObject.ssShadowDistanceScale = this.ssShadowDistanceScale;
        serializationObject.ssShadowThicknessScale = this.ssShadowThicknessScale;
        serializationObject.voxelNormalBias = this.voxelNormalBias;
        serializationObject.voxelDirectionBias = this.voxelDirectionBias;
        serializationObject.envRotation = this.envRotation;
        serializationObject.shadowRemanence = this.shadowRemanence;
        serializationObject.shadowOpacity = this.shadowOpacity;
        serializationObject.resolutionExp = this.resolutionExp;
        serializationObject.refreshRate = this.refreshRate;
        serializationObject.triPlanarVoxelization = this.triPlanarVoxelization;
        return serializationObject;
    }

    public override _deserialize(serializationObject: any) {
        super._deserialize(serializationObject);
        this.sampleDirections = serializationObject.sampleDirections;
        this.coloredShadows = serializationObject.coloredShadows;
        this.voxelShadowOpacity = serializationObject.voxelShadowOpacity;
        this.ssShadowOpacity = serializationObject.ssShadowOpacity;
        this.ssShadowSampleCount = serializationObject.ssShadowSampleCount;
        this.ssShadowStride = serializationObject.ssShadowStride;
        this.ssShadowDistanceScale = serializationObject.ssShadowDistanceScale;
        this.ssShadowThicknessScale = serializationObject.ssShadowThicknessScale;
        this.voxelNormalBias = serializationObject.voxelNormalBias;
        this.voxelDirectionBias = serializationObject.voxelDirectionBias;
        this.envRotation = serializationObject.envRotation;
        this.shadowRemanence = serializationObject.shadowRemanence;
        this.shadowOpacity = serializationObject.shadowOpacity;
        this.resolutionExp = serializationObject.resolutionExp;
        this.refreshRate = serializationObject.refreshRate;
        this.triPlanarVoxelization = serializationObject.triPlanarVoxelization;
    }
}

RegisterClass("BABYLON.NodeRenderGraphIblShadowsRendererBlock", NodeRenderGraphIblShadowsRendererBlock);
