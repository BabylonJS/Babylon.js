/** This file must only contain pure code and pure imports */

import { editableInPropertyPage, PropertyTypeForEdition } from "../../../../Decorators/nodeDecorator";
import { FrameGraphMeshBlendingTask } from "../../../Tasks/PostProcesses/meshBlendingTask";
import { type FrameGraph } from "../../../frameGraph";
import { type FrameGraphTextureHandle } from "../../../frameGraphTypes";
import { RegisterClass } from "../../../../Misc/typeStore";
import {
    CreateDefaultMeshBlendRadiusDefinitions,
    MeshBlendDebugMode,
    MeshBlendDepthType,
    MeshBlendQuality,
    ThinMeshBlendingPostProcess,
} from "../../../../PostProcesses/thinMeshBlendingPostProcess";
import { type Scene } from "../../../../scene.pure";
import { type Camera } from "../../../../Cameras/camera.pure";
import { type NodeRenderGraphBuildState } from "../../nodeRenderGraphBuildState";
import { type NodeRenderGraphConnectionPoint } from "../../nodeRenderGraphBlockConnectionPoint";
import { NodeRenderGraphBlockConnectionPointTypes } from "../../Types/nodeRenderGraphTypes";
import { NodeRenderGraphBasePostProcessBlock } from "./basePostProcessBlock";
import { Constants } from "../../../../Engines/constants";

/**
 * Block that blends colors across seams between objects.
 */
export class NodeRenderGraphMeshBlendingPostProcessBlock extends NodeRenderGraphBasePostProcessBlock {
    protected override _frameGraphTask: FrameGraphMeshBlendingTask;

    /**
     * Gets the frame graph task associated with this block.
     */
    public override get task(): FrameGraphMeshBlendingTask {
        return this._frameGraphTask;
    }

    /** Mesh blending always uses exact texel loads from SceneColor. */
    public override get sourceSamplingMode(): number {
        return Constants.TEXTURE_NEAREST_SAMPLINGMODE;
    }

    public override set sourceSamplingMode(_value: number) {
        if (this._frameGraphTask) {
            this._frameGraphTask.sourceSamplingMode = Constants.TEXTURE_NEAREST_SAMPLINGMODE;
        }
    }

    /**
     * Creates a mesh-blending post-process block.
     * @param name The block name.
     * @param frameGraph The hosting frame graph.
     * @param scene The hosting scene.
     */
    public constructor(name: string, frameGraph: FrameGraph, scene: Scene) {
        super(name, frameGraph, scene);

        this.registerInput("camera", NodeRenderGraphBlockConnectionPointTypes.Camera);
        this.registerInput("geomDepth", NodeRenderGraphBlockConnectionPointTypes.AutoDetect);
        this.registerInput("geomAlbedo", NodeRenderGraphBlockConnectionPointTypes.TextureAlbedo, true);
        this.registerInput("geomMeshBlendTag", NodeRenderGraphBlockConnectionPointTypes.TextureMeshBlendTag);

        this.geomDepth.addExcludedConnectionPointFromAllowedTypes(
            NodeRenderGraphBlockConnectionPointTypes.TextureScreenDepth | NodeRenderGraphBlockConnectionPointTypes.TextureViewDepth
        );

        this._finalizeInputOutputRegistering();

        this._frameGraphTask = new FrameGraphMeshBlendingTask(this.name, frameGraph, new ThinMeshBlendingPostProcess(name, scene.getEngine()));
    }

    /** Gets or sets the compile-time mesh-blending quality variant. */
    @editableInPropertyPage("Quality", PropertyTypeForEdition.List, "MESH BLENDING", {
        options: [
            { label: "Low", value: MeshBlendQuality.Low },
            { label: "Medium", value: MeshBlendQuality.Medium },
            { label: "High", value: MeshBlendQuality.High },
            { label: "Cinematic", value: MeshBlendQuality.Cinematic },
        ],
    })
    public get quality(): MeshBlendQuality {
        return this._frameGraphTask.quality;
    }

    public set quality(value: MeshBlendQuality) {
        this._frameGraphTask.quality = value;
    }

    /** Gets or sets the small-class authored world radius. */
    @editableInPropertyPage("Small world radius", PropertyTypeForEdition.Float, "RADIUS CLASSES", { min: 0 })
    public get smallWorldRadius(): number {
        return this._frameGraphTask.postProcess.radiusClasses[0].worldRadius;
    }

    public set smallWorldRadius(value: number) {
        this._frameGraphTask.postProcess.radiusClasses[0].worldRadius = value;
    }

    /** Gets or sets the small-class minimum projected radius in physical pixels. */
    @editableInPropertyPage("Small minimum pixels", PropertyTypeForEdition.Float, "RADIUS CLASSES", { min: 0 })
    public get smallMinimumProjectedRadius(): number {
        return this._frameGraphTask.postProcess.radiusClasses[0].minimumProjectedRadius;
    }

    public set smallMinimumProjectedRadius(value: number) {
        this._frameGraphTask.postProcess.radiusClasses[0].minimumProjectedRadius = value;
    }

    /** Gets or sets the medium-class authored world radius. */
    @editableInPropertyPage("Medium world radius", PropertyTypeForEdition.Float, "RADIUS CLASSES", { min: 0 })
    public get mediumWorldRadius(): number {
        return this._frameGraphTask.postProcess.radiusClasses[1].worldRadius;
    }

    public set mediumWorldRadius(value: number) {
        this._frameGraphTask.postProcess.radiusClasses[1].worldRadius = value;
    }

    /** Gets or sets the medium-class minimum projected radius in physical pixels. */
    @editableInPropertyPage("Medium minimum pixels", PropertyTypeForEdition.Float, "RADIUS CLASSES", { min: 0 })
    public get mediumMinimumProjectedRadius(): number {
        return this._frameGraphTask.postProcess.radiusClasses[1].minimumProjectedRadius;
    }

    public set mediumMinimumProjectedRadius(value: number) {
        this._frameGraphTask.postProcess.radiusClasses[1].minimumProjectedRadius = value;
    }

    /** Gets or sets the large-class authored world radius. */
    @editableInPropertyPage("Large world radius", PropertyTypeForEdition.Float, "RADIUS CLASSES", { min: 0 })
    public get largeWorldRadius(): number {
        return this._frameGraphTask.postProcess.radiusClasses[2].worldRadius;
    }

    public set largeWorldRadius(value: number) {
        this._frameGraphTask.postProcess.radiusClasses[2].worldRadius = value;
    }

    /** Gets or sets the large-class minimum projected radius in physical pixels. */
    @editableInPropertyPage("Large minimum pixels", PropertyTypeForEdition.Float, "RADIUS CLASSES", { min: 0 })
    public get largeMinimumProjectedRadius(): number {
        return this._frameGraphTask.postProcess.radiusClasses[2].minimumProjectedRadius;
    }

    public set largeMinimumProjectedRadius(value: number) {
        this._frameGraphTask.postProcess.radiusClasses[2].minimumProjectedRadius = value;
    }

    /** Gets or sets the extra-large-class authored world radius. */
    @editableInPropertyPage("Extra large world radius", PropertyTypeForEdition.Float, "RADIUS CLASSES", { min: 0 })
    public get extraLargeWorldRadius(): number {
        return this._frameGraphTask.postProcess.radiusClasses[3].worldRadius;
    }

    public set extraLargeWorldRadius(value: number) {
        this._frameGraphTask.postProcess.radiusClasses[3].worldRadius = value;
    }

    /** Gets or sets the extra-large-class minimum projected radius in physical pixels. */
    @editableInPropertyPage("Extra large minimum pixels", PropertyTypeForEdition.Float, "RADIUS CLASSES", { min: 0 })
    public get extraLargeMinimumProjectedRadius(): number {
        return this._frameGraphTask.postProcess.radiusClasses[3].minimumProjectedRadius;
    }

    public set extraLargeMinimumProjectedRadius(value: number) {
        this._frameGraphTask.postProcess.radiusClasses[3].minimumProjectedRadius = value;
    }

    /** Gets or sets the contact-slope narrowing factor. A value of 1 disables narrowing. */
    @editableInPropertyPage("Slope factor", PropertyTypeForEdition.Float, "CONTACT VALIDATION", { min: 1 })
    public get slopeFactor(): number {
        return this._frameGraphTask.postProcess.slopeFactor;
    }

    public set slopeFactor(value: number) {
        this._frameGraphTask.postProcess.slopeFactor = value;
    }

    /** Gets or sets the compiled debug visualization. */
    @editableInPropertyPage("Debug mode", PropertyTypeForEdition.List, "DEBUG", {
        options: [
            { label: "Off", value: MeshBlendDebugMode.Off },
            { label: "Packed tag", value: MeshBlendDebugMode.PackedTag },
            { label: "Candidate direction / distance", value: MeshBlendDebugMode.CandidateDirectionDistance },
            { label: "Seam / fade", value: MeshBlendDebugMode.SeamFade },
            { label: "Rejection reason", value: MeshBlendDebugMode.RejectionReason },
            { label: "Approximate stage / work", value: MeshBlendDebugMode.StageWork },
            { label: "Target continuation", value: MeshBlendDebugMode.Continuation },
            { label: "Tiny-object radius", value: MeshBlendDebugMode.TinyObject },
            { label: "Multi-target selection", value: MeshBlendDebugMode.MultiTarget },
            { label: "Target-color samples", value: MeshBlendDebugMode.TargetColor },
            { label: "Shadow attenuation", value: MeshBlendDebugMode.ShadowAttenuation },
            { label: "Color interpolation", value: MeshBlendDebugMode.ColorInterpolation },
            { label: "World position", value: MeshBlendDebugMode.WorldPosition },
        ],
    })
    public get debugMode(): MeshBlendDebugMode {
        return this._frameGraphTask.debugMode;
    }

    public set debugMode(value: MeshBlendDebugMode) {
        this._frameGraphTask.debugMode = value;
    }

    /**
     * Gets the camera used for world-radius projection and depth reconstruction.
     */
    public get camera(): NodeRenderGraphConnectionPoint {
        return this._inputs[2];
    }

    /**
     * Gets the view-depth or screen-depth input.
     */
    public get geomDepth(): NodeRenderGraphConnectionPoint {
        return this._inputs[3];
    }

    /**
     * Gets the optional linear geometry base-color/albedo input used for shadow estimation.
     */
    public get geomAlbedo(): NodeRenderGraphConnectionPoint {
        return this._inputs[4];
    }

    /**
     * Gets the packed mesh-blending tag input.
     */
    public get geomMeshBlendTag(): NodeRenderGraphConnectionPoint {
        return this._inputs[5];
    }

    public override getClassName(): string {
        return "NodeRenderGraphMeshBlendingPostProcessBlock";
    }

    protected override _buildBlock(state: NodeRenderGraphBuildState): void {
        super._buildBlock(state);

        this._frameGraphTask.camera = this.camera.connectedPoint?.value as Camera;
        this._frameGraphTask.depthTexture = this.geomDepth.connectedPoint?.value as FrameGraphTextureHandle;
        this._frameGraphTask.depthType =
            this.geomDepth.connectedPoint?.type === NodeRenderGraphBlockConnectionPointTypes.TextureScreenDepth ? MeshBlendDepthType.Screen : MeshBlendDepthType.View;
        this._frameGraphTask.baseColorTexture = this.geomAlbedo.connectedPoint?.value as FrameGraphTextureHandle | undefined;
        this._frameGraphTask.meshBlendTagTexture = this.geomMeshBlendTag.connectedPoint?.value as FrameGraphTextureHandle;
    }

    protected override _dumpPropertiesCode(): string {
        const codes: string[] = [];
        codes.push(`${this._codeVariableName}.quality = ${this.quality};`);
        codes.push(`${this._codeVariableName}.smallWorldRadius = ${this.smallWorldRadius};`);
        codes.push(`${this._codeVariableName}.smallMinimumProjectedRadius = ${this.smallMinimumProjectedRadius};`);
        codes.push(`${this._codeVariableName}.mediumWorldRadius = ${this.mediumWorldRadius};`);
        codes.push(`${this._codeVariableName}.mediumMinimumProjectedRadius = ${this.mediumMinimumProjectedRadius};`);
        codes.push(`${this._codeVariableName}.largeWorldRadius = ${this.largeWorldRadius};`);
        codes.push(`${this._codeVariableName}.largeMinimumProjectedRadius = ${this.largeMinimumProjectedRadius};`);
        codes.push(`${this._codeVariableName}.extraLargeWorldRadius = ${this.extraLargeWorldRadius};`);
        codes.push(`${this._codeVariableName}.extraLargeMinimumProjectedRadius = ${this.extraLargeMinimumProjectedRadius};`);
        codes.push(`${this._codeVariableName}.slopeFactor = ${this.slopeFactor};`);
        codes.push(`${this._codeVariableName}.debugMode = ${this.debugMode};`);
        return super._dumpPropertiesCode() + codes.join("\n");
    }

    public override serialize(): any {
        const serializationObject = super.serialize();
        serializationObject.quality = this.quality;
        serializationObject.radiusClasses = this._frameGraphTask.postProcess.radiusClasses.map((definition) => ({ ...definition }));
        serializationObject.slopeFactor = this.slopeFactor;
        serializationObject.debugMode = this.debugMode;
        return serializationObject;
    }

    public override _deserialize(serializationObject: any): void {
        super._deserialize(serializationObject);
        const defaults = CreateDefaultMeshBlendRadiusDefinitions();
        const radiusClasses = serializationObject.radiusClasses ?? defaults;

        this.quality = serializationObject.quality ?? MeshBlendQuality.Medium;
        this.smallWorldRadius = radiusClasses[0]?.worldRadius ?? defaults[0].worldRadius;
        this.smallMinimumProjectedRadius = radiusClasses[0]?.minimumProjectedRadius ?? defaults[0].minimumProjectedRadius;
        this.mediumWorldRadius = radiusClasses[1]?.worldRadius ?? defaults[1].worldRadius;
        this.mediumMinimumProjectedRadius = radiusClasses[1]?.minimumProjectedRadius ?? defaults[1].minimumProjectedRadius;
        this.largeWorldRadius = radiusClasses[2]?.worldRadius ?? defaults[2].worldRadius;
        this.largeMinimumProjectedRadius = radiusClasses[2]?.minimumProjectedRadius ?? defaults[2].minimumProjectedRadius;
        this.extraLargeWorldRadius = radiusClasses[3]?.worldRadius ?? defaults[3].worldRadius;
        this.extraLargeMinimumProjectedRadius = radiusClasses[3]?.minimumProjectedRadius ?? defaults[3].minimumProjectedRadius;
        this.slopeFactor = serializationObject.slopeFactor ?? 2;
        this.debugMode = serializationObject.debugMode ?? MeshBlendDebugMode.Off;
    }
}

let _Registered = false;

/**
 * Registers the mesh-blending post-process block.
 */
export function RegisterMeshBlendingPostProcessBlock(): void {
    if (_Registered) {
        return;
    }
    _Registered = true;

    RegisterClass("BABYLON.NodeRenderGraphMeshBlendingPostProcessBlock", NodeRenderGraphMeshBlendingPostProcessBlock);
}
