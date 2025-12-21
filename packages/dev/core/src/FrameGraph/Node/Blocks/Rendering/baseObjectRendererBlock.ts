import type {
    Scene,
    NodeRenderGraphBuildState,
    FrameGraph,
    FrameGraphTextureHandle,
    FrameGraphObjectList,
    Camera,
    NodeRenderGraphResourceContainerBlock,
    FrameGraphShadowGeneratorTask,
} from "core/index";
import { NodeRenderGraphBlock } from "../../nodeRenderGraphBlock";
import { NodeRenderGraphBlockConnectionPointTypes, NodeRenderGraphConnectionPointDirection } from "../../Types/nodeRenderGraphTypes";
import { editableInPropertyPage, PropertyTypeForEdition } from "../../../../Decorators/nodeDecorator";
import { NodeRenderGraphConnectionPoint } from "../../nodeRenderGraphBlockConnectionPoint";
import { NodeRenderGraphConnectionPointCustomObject } from "../../nodeRenderGraphConnectionPointCustomObject";
import { FrameGraphObjectRendererTask } from "core/FrameGraph/Tasks/Rendering/objectRendererTask";

/**
 * @internal
 */
export class NodeRenderGraphBaseObjectRendererBlock extends NodeRenderGraphBlock {
    protected override _frameGraphTask: FrameGraphObjectRendererTask;

    public override _additionalConstructionParameters: [boolean, boolean];

    /**
     * Gets the frame graph task associated with this block
     */
    public override get task() {
        return this._frameGraphTask;
    }

    /**
     * Create a new NodeRenderGraphBaseObjectRendererBlock
     * @param name defines the block name
     * @param frameGraph defines the hosting frame graph
     * @param scene defines the hosting scene
     * @param doNotChangeAspectRatio True (default) to not change the aspect ratio of the scene in the RTT
     * @param enableClusteredLights True (default) to enable clustered lights
     */
    public constructor(name: string, frameGraph: FrameGraph, scene: Scene, doNotChangeAspectRatio = true, enableClusteredLights = true) {
        super(name, frameGraph, scene);

        this._additionalConstructionParameters = [doNotChangeAspectRatio, enableClusteredLights];

        this.registerInput("target", NodeRenderGraphBlockConnectionPointTypes.AutoDetect);
        this.registerInput("depth", NodeRenderGraphBlockConnectionPointTypes.AutoDetect, true);
        this.registerInput("camera", NodeRenderGraphBlockConnectionPointTypes.Camera);
        this.registerInput("objects", NodeRenderGraphBlockConnectionPointTypes.ObjectList);
        this._addDependenciesInput();
        this.registerInput("shadowGenerators", NodeRenderGraphBlockConnectionPointTypes.AutoDetect, true);

        this.registerOutput("output", NodeRenderGraphBlockConnectionPointTypes.BasedOnInput);
        this.registerOutput("outputDepth", NodeRenderGraphBlockConnectionPointTypes.BasedOnInput);
        this.registerOutput(
            "objectRenderer",
            NodeRenderGraphBlockConnectionPointTypes.Object,
            new NodeRenderGraphConnectionPointCustomObject(
                "objectRenderer",
                this,
                NodeRenderGraphConnectionPointDirection.Output,
                NodeRenderGraphBaseObjectRendererBlock,
                "NodeRenderGraphBaseObjectRendererBlock"
            )
        );

        this.target.addExcludedConnectionPointFromAllowedTypes(
            NodeRenderGraphBlockConnectionPointTypes.TextureAllButBackBufferDepthStencil | NodeRenderGraphBlockConnectionPointTypes.ResourceContainer
        );
        this.depth.addExcludedConnectionPointFromAllowedTypes(
            NodeRenderGraphBlockConnectionPointTypes.TextureDepthStencilAttachment | NodeRenderGraphBlockConnectionPointTypes.TextureBackBufferDepthStencilAttachment
        );
        this.shadowGenerators.addExcludedConnectionPointFromAllowedTypes(
            NodeRenderGraphBlockConnectionPointTypes.ShadowGenerator | NodeRenderGraphBlockConnectionPointTypes.ResourceContainer
        );

        this.output._typeConnectionSource = this.target;
        this.outputDepth._typeConnectionSource = this.depth;

        this._createFrameGraphObject();
    }

    protected _createFrameGraphObject(): void {
        this._frameGraphTask?.dispose();
        this._frameGraphTask = new FrameGraphObjectRendererTask(this.name, this._frameGraph, this._scene, {
            doNotChangeAspectRatio: this._additionalConstructionParameters![0] as boolean,
            enableClusteredLights: this._additionalConstructionParameters![1] as boolean,
        });
    }

    protected _saveState(state: { [key: string]: any }) {
        state.disabled = this._frameGraphTask.disabled;
        state.isMainObjectRenderer = this.isMainObjectRenderer;
        state.depthTest = this.depthTest;
        state.depthWrite = this.depthWrite;
        state.disableShadows = this.disableShadows;
        state.renderInLinearSpace = this.renderInLinearSpace;
        state.renderMeshes = this.renderMeshes;
        state.renderDepthOnlyMeshes = this.renderDepthOnlyMeshes;
        state.renderOpaqueMeshes = this.renderOpaqueMeshes;
        state.renderAlphaTestMeshes = this.renderAlphaTestMeshes;
        state.renderTransparentMeshes = this.renderTransparentMeshes;
        state.useOITForTransparentMeshes = this.useOITForTransparentMeshes;
        state.renderParticles = this.renderParticles;
        state.renderSprites = this.renderSprites;
        state.forceLayerMaskCheck = this.forceLayerMaskCheck;
        state.enableBoundingBoxRendering = this.enableBoundingBoxRendering;
        state.enableOutlineRendering = this.enableOutlineRendering;
    }

    protected _restoreState(state: { [key: string]: any }) {
        this._frameGraphTask.disabled = state.disabled;
        this.isMainObjectRenderer = state.isMainObjectRenderer;
        this.depthTest = state.depthTest;
        this.depthWrite = state.depthWrite;
        this.disableShadows = state.disableShadows;
        this.renderInLinearSpace = state.renderInLinearSpace;
        this.renderMeshes = state.renderMeshes;
        this.renderDepthOnlyMeshes = state.renderDepthOnlyMeshes;
        this.renderOpaqueMeshes = state.renderOpaqueMeshes;
        this.renderAlphaTestMeshes = state.renderAlphaTestMeshes;
        this.renderTransparentMeshes = state.renderTransparentMeshes;
        this.useOITForTransparentMeshes = state.useOITForTransparentMeshes;
        this.renderParticles = state.renderParticles;
        this.renderSprites = state.renderSprites;
        this.forceLayerMaskCheck = state.forceLayerMaskCheck;
        this.enableBoundingBoxRendering = state.enableBoundingBoxRendering;
        this.enableOutlineRendering = state.enableOutlineRendering;
    }

    protected _createFrameGraphObjectWithState(doNotChangeAspectRatio: boolean, enableClusteredLights: boolean): void {
        const state: { [key: string]: any } = {};

        this._saveState(state);

        this._additionalConstructionParameters = [doNotChangeAspectRatio, enableClusteredLights];

        this._createFrameGraphObject();

        this._restoreState(state);
    }

    /** Indicates that this object renderer is the main object renderer of the frame graph. */
    @editableInPropertyPage("Is main object renderer", PropertyTypeForEdition.Boolean, "GENERAL")
    public get isMainObjectRenderer() {
        return this._frameGraphTask.isMainObjectRenderer;
    }

    public set isMainObjectRenderer(value: boolean) {
        this._frameGraphTask.isMainObjectRenderer = value;
    }

    /** Indicates if depth testing must be enabled or disabled */
    @editableInPropertyPage("Depth test", PropertyTypeForEdition.Boolean, "GENERAL")
    public get depthTest() {
        return this._frameGraphTask.depthTest;
    }

    public set depthTest(value: boolean) {
        this._frameGraphTask.depthTest = value;
    }

    /** Indicates if depth writing must be enabled or disabled */
    @editableInPropertyPage("Depth write", PropertyTypeForEdition.Boolean, "GENERAL")
    public get depthWrite() {
        return this._frameGraphTask.depthWrite;
    }

    public set depthWrite(value: boolean) {
        this._frameGraphTask.depthWrite = value;
    }

    /** Indicates if meshes should be rendered */
    @editableInPropertyPage("Render meshes", PropertyTypeForEdition.Boolean, "RENDERING")
    public get renderMeshes() {
        return this._frameGraphTask.renderMeshes;
    }

    public set renderMeshes(value: boolean) {
        this._frameGraphTask.renderMeshes = value;
    }

    /** Indicates if depth-only meshes should be rendered */
    @editableInPropertyPage("    Render depth-only meshes", PropertyTypeForEdition.Boolean, "RENDERING")
    public get renderDepthOnlyMeshes() {
        return this._frameGraphTask.renderDepthOnlyMeshes;
    }

    public set renderDepthOnlyMeshes(value: boolean) {
        this._frameGraphTask.renderDepthOnlyMeshes = value;
    }

    /** Indicates if opaque meshes should be rendered */
    @editableInPropertyPage("    Render opaque meshes", PropertyTypeForEdition.Boolean, "RENDERING")
    public get renderOpaqueMeshes() {
        return this._frameGraphTask.renderOpaqueMeshes;
    }

    public set renderOpaqueMeshes(value: boolean) {
        this._frameGraphTask.renderOpaqueMeshes = value;
    }

    /** Indicates if alpha tested meshes should be rendered */
    @editableInPropertyPage("    Render alpha test meshes", PropertyTypeForEdition.Boolean, "RENDERING")
    public get renderAlphaTestMeshes() {
        return this._frameGraphTask.renderAlphaTestMeshes;
    }

    public set renderAlphaTestMeshes(value: boolean) {
        this._frameGraphTask.renderAlphaTestMeshes = value;
    }

    /** Indicates if transparent meshes should be rendered */
    @editableInPropertyPage("    Render transparent meshes", PropertyTypeForEdition.Boolean, "RENDERING")
    public get renderTransparentMeshes() {
        return this._frameGraphTask.renderTransparentMeshes;
    }

    public set renderTransparentMeshes(value: boolean) {
        this._frameGraphTask.renderTransparentMeshes = value;
    }

    /** Indicates if use of Order Independent Transparency (OIT) for transparent meshes should be enabled */
    @editableInPropertyPage("        Use OIT for transparent meshes", PropertyTypeForEdition.Boolean, "RENDERING")
    // eslint-disable-next-line @typescript-eslint/naming-convention
    public get useOITForTransparentMeshes() {
        return this._frameGraphTask.useOITForTransparentMeshes;
    }

    // eslint-disable-next-line @typescript-eslint/naming-convention
    public set useOITForTransparentMeshes(value: boolean) {
        this._frameGraphTask.useOITForTransparentMeshes = value;
    }

    /** Defines the number of passes to use for Order Independent Transparency */
    @editableInPropertyPage("            Pass count", PropertyTypeForEdition.Int, "RENDERING", { min: 1, max: 20 })
    public get oitPassCount(): number {
        return this._frameGraphTask.oitPassCount;
    }

    public set oitPassCount(value: number) {
        this._frameGraphTask.oitPassCount = value;
    }

    /** Indicates if particles should be rendered */
    @editableInPropertyPage("Render particles", PropertyTypeForEdition.Boolean, "RENDERING")
    public get renderParticles() {
        return this._frameGraphTask.renderParticles;
    }

    public set renderParticles(value: boolean) {
        this._frameGraphTask.renderParticles = value;
    }

    /** Indicates if sprites should be rendered */
    @editableInPropertyPage("Render sprites", PropertyTypeForEdition.Boolean, "RENDERING")
    public get renderSprites() {
        return this._frameGraphTask.renderSprites;
    }

    public set renderSprites(value: boolean) {
        this._frameGraphTask.renderSprites = value;
    }

    /** Indicates if layer mask check must be forced */
    @editableInPropertyPage("Force layer mask check", PropertyTypeForEdition.Boolean, "GENERAL")
    public get forceLayerMaskCheck() {
        return this._frameGraphTask.forceLayerMaskCheck;
    }

    public set forceLayerMaskCheck(value: boolean) {
        this._frameGraphTask.forceLayerMaskCheck = value;
    }

    /** Indicates if bounding boxes should be rendered */
    @editableInPropertyPage("Render bounding boxes", PropertyTypeForEdition.Boolean, "RENDERING")
    public get enableBoundingBoxRendering() {
        return this._frameGraphTask.enableBoundingBoxRendering;
    }

    public set enableBoundingBoxRendering(value: boolean) {
        this._frameGraphTask.enableBoundingBoxRendering = value;
    }

    /** Indicates if outlines/overlays should be rendered */
    @editableInPropertyPage("Render outlines/overlays", PropertyTypeForEdition.Boolean, "RENDERING")
    public get enableOutlineRendering() {
        return this._frameGraphTask.enableOutlineRendering;
    }

    public set enableOutlineRendering(value: boolean) {
        this._frameGraphTask.enableOutlineRendering = value;
    }

    /** Indicates if shadows must be enabled or disabled */
    @editableInPropertyPage("Disable shadows", PropertyTypeForEdition.Boolean, "GENERAL")
    public get disableShadows() {
        return this._frameGraphTask.disableShadows;
    }

    public set disableShadows(value: boolean) {
        this._frameGraphTask.disableShadows = value;
    }

    /** If image processing should be disabled */
    @editableInPropertyPage("Disable image processing", PropertyTypeForEdition.Boolean, "GENERAL")
    public get renderInLinearSpace() {
        return this._frameGraphTask.disableImageProcessing;
    }

    public set renderInLinearSpace(value: boolean) {
        this._frameGraphTask.disableImageProcessing = value;
    }

    /** True (default) to not change the aspect ratio of the scene in the RTT */
    @editableInPropertyPage("Do not change aspect ratio", PropertyTypeForEdition.Boolean, "GENERAL")
    public get doNotChangeAspectRatio() {
        return this._frameGraphTask.objectRenderer.options.doNotChangeAspectRatio;
    }

    public set doNotChangeAspectRatio(value: boolean) {
        this._createFrameGraphObjectWithState(value, this.enableClusteredLights);
    }

    /** True (default) to enable clustered lights */
    @editableInPropertyPage("Enable clustered lights", PropertyTypeForEdition.Boolean, "GENERAL")
    public get enableClusteredLights() {
        return this._frameGraphTask.objectRenderer.options.enableClusteredLights;
    }

    public set enableClusteredLights(value: boolean) {
        this._createFrameGraphObjectWithState(this.doNotChangeAspectRatio, value);
    }

    /** If true, MSAA color textures will be resolved at the end of the render pass (default: true) */
    @editableInPropertyPage("Resolve MSAA colors", PropertyTypeForEdition.Boolean, "GENERAL")
    public get resolveMSAAColors() {
        return this._frameGraphTask.resolveMSAAColors;
    }

    public set resolveMSAAColors(value: boolean) {
        this._frameGraphTask.resolveMSAAColors = value;
    }

    /** If true, MSAA depth texture will be resolved at the end of the render pass (default: false) */
    @editableInPropertyPage("Resolve MSAA depth", PropertyTypeForEdition.Boolean, "GENERAL")
    public get resolveMSAADepth() {
        return this._frameGraphTask.resolveMSAADepth;
    }

    public set resolveMSAADepth(value: boolean) {
        this._frameGraphTask.resolveMSAADepth = value;
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "NodeRenderGraphBaseObjectRendererBlock";
    }

    /**
     * Gets the target texture input component
     */
    public get target(): NodeRenderGraphConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the depth texture input component
     */
    public get depth(): NodeRenderGraphConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the camera input component
     */
    public get camera(): NodeRenderGraphConnectionPoint {
        return this._inputs[2];
    }

    /**
     * Gets the objects input component
     */
    public get objects(): NodeRenderGraphConnectionPoint {
        return this._inputs[3];
    }

    /**
     * Gets the dependencies input component
     */
    public get dependencies(): NodeRenderGraphConnectionPoint {
        return this._inputs[4];
    }

    /**
     * Gets the shadowGenerators input component
     */
    public get shadowGenerators(): NodeRenderGraphConnectionPoint {
        return this._inputs[5];
    }

    /**
     * Gets the output component
     */
    public get output(): NodeRenderGraphConnectionPoint {
        return this._outputs[0];
    }

    /**
     * Gets the output depth component
     */
    public get outputDepth(): NodeRenderGraphConnectionPoint {
        return this._outputs[1];
    }

    /**
     * Gets the objectRenderer component
     */
    public get objectRenderer(): NodeRenderGraphConnectionPoint {
        return this._outputs[2];
    }

    protected override _buildBlock(state: NodeRenderGraphBuildState) {
        super._buildBlock(state);

        this.output.value = this._frameGraphTask.outputTexture; // the value of the output connection point is the "output" texture of the task
        this.outputDepth.value = this._frameGraphTask.outputDepthTexture; // the value of the outputDepth connection point is the "outputDepth" texture of the task
        this.objectRenderer.value = this._frameGraphTask; // the value of the objectRenderer connection point is the task itself

        this._frameGraphTask.targetTexture = this._getConnectedTextures(this.target.connectedPoint)!; // Geometry renderer allows undefined for targetTexture
        this._frameGraphTask.depthTexture = this.depth.connectedPoint?.value as FrameGraphTextureHandle;
        this._frameGraphTask.camera = this.camera.connectedPoint?.value as Camera;
        this._frameGraphTask.objectList = this.objects.connectedPoint?.value as FrameGraphObjectList;

        this._frameGraphTask.shadowGenerators = [];

        const shadowGeneratorsConnectedPoint = this.shadowGenerators.connectedPoint;
        if (shadowGeneratorsConnectedPoint) {
            if (shadowGeneratorsConnectedPoint.type === NodeRenderGraphBlockConnectionPointTypes.ResourceContainer) {
                const container = shadowGeneratorsConnectedPoint.ownerBlock as NodeRenderGraphResourceContainerBlock;
                for (const input of container.inputs) {
                    if (input.connectedPoint && input.connectedPoint.value !== undefined && NodeRenderGraphConnectionPoint.IsShadowGenerator(input.connectedPoint.value)) {
                        this._frameGraphTask.shadowGenerators.push(input.connectedPoint.value as FrameGraphShadowGeneratorTask);
                    }
                }
            } else if (NodeRenderGraphConnectionPoint.IsShadowGenerator(shadowGeneratorsConnectedPoint.value)) {
                this._frameGraphTask.shadowGenerators[0] = shadowGeneratorsConnectedPoint.value as FrameGraphShadowGeneratorTask;
            }
        }
    }

    protected override _dumpPropertiesCode() {
        const codes: string[] = [];
        codes.push(`${this._codeVariableName}.isMainObjectRenderer = ${this.isMainObjectRenderer};`);
        codes.push(`${this._codeVariableName}.depthTest = ${this.depthTest};`);
        codes.push(`${this._codeVariableName}.depthWrite = ${this.depthWrite};`);
        codes.push(`${this._codeVariableName}.renderMeshes = ${this.renderMeshes};`);
        codes.push(`${this._codeVariableName}.renderDepthOnlyMeshes = ${this.renderDepthOnlyMeshes};`);
        codes.push(`${this._codeVariableName}.renderOpaqueMeshes = ${this.renderOpaqueMeshes};`);
        codes.push(`${this._codeVariableName}.renderAlphaTestMeshes = ${this.renderAlphaTestMeshes};`);
        codes.push(`${this._codeVariableName}.renderTransparentMeshes = ${this.renderTransparentMeshes};`);
        codes.push(`${this._codeVariableName}.useOITForTransparentMeshes = ${this.useOITForTransparentMeshes};`);
        codes.push(`${this._codeVariableName}.oitPassCount = ${this.oitPassCount};`);
        codes.push(`${this._codeVariableName}.renderParticles = ${this.renderParticles};`);
        codes.push(`${this._codeVariableName}.renderSprites = ${this.renderSprites};`);
        codes.push(`${this._codeVariableName}.forceLayerMaskCheck = ${this.forceLayerMaskCheck};`);
        codes.push(`${this._codeVariableName}.enableBoundingBoxRendering = ${this.enableBoundingBoxRendering};`);
        codes.push(`${this._codeVariableName}.enableOutlineRendering = ${this.enableOutlineRendering};`);
        codes.push(`${this._codeVariableName}.disableShadows = ${this.disableShadows};`);
        codes.push(`${this._codeVariableName}.renderInLinearSpace = ${this.renderInLinearSpace};`);
        codes.push(`${this._codeVariableName}.resolveMSAAColors = ${this.resolveMSAAColors};`);
        codes.push(`${this._codeVariableName}.resolveMSAADepth = ${this.resolveMSAADepth};`);
        return super._dumpPropertiesCode() + codes.join("\n");
    }

    public override serialize(): any {
        const serializationObject = super.serialize();
        serializationObject.isMainObjectRenderer = this.isMainObjectRenderer;
        serializationObject.depthTest = this.depthTest;
        serializationObject.depthWrite = this.depthWrite;
        serializationObject.renderMeshes = this.renderMeshes;
        serializationObject.renderDepthOnlyMeshes = this.renderDepthOnlyMeshes;
        serializationObject.renderOpaqueMeshes = this.renderOpaqueMeshes;
        serializationObject.renderAlphaTestMeshes = this.renderAlphaTestMeshes;
        serializationObject.renderTransparentMeshes = this.renderTransparentMeshes;
        serializationObject.useOITForTransparentMeshes = this.useOITForTransparentMeshes;
        serializationObject.oitPassCount = this.oitPassCount;
        serializationObject.renderParticles = this.renderParticles;
        serializationObject.renderSprites = this.renderSprites;
        serializationObject.forceLayerMaskCheck = this.forceLayerMaskCheck;
        serializationObject.enableBoundingBoxRendering = this.enableBoundingBoxRendering;
        serializationObject.enableOutlineRendering = this.enableOutlineRendering;
        serializationObject.disableShadows = this.disableShadows;
        serializationObject.renderInLinearSpace = this.renderInLinearSpace;
        serializationObject.resolveMSAAColors = this.resolveMSAAColors;
        serializationObject.resolveMSAADepth = this.resolveMSAADepth;
        return serializationObject;
    }

    public override _deserialize(serializationObject: any) {
        super._deserialize(serializationObject);
        this.isMainObjectRenderer = !!serializationObject.isMainObjectRenderer;
        this.depthTest = serializationObject.depthTest;
        this.depthWrite = serializationObject.depthWrite;
        this.renderMeshes = serializationObject.renderMeshes ?? true;
        this.renderDepthOnlyMeshes = serializationObject.renderDepthOnlyMeshes ?? true;
        this.renderOpaqueMeshes = serializationObject.renderOpaqueMeshes ?? true;
        this.renderAlphaTestMeshes = serializationObject.renderAlphaTestMeshes ?? true;
        this.renderTransparentMeshes = serializationObject.renderTransparentMeshes ?? true;
        this.useOITForTransparentMeshes = serializationObject.useOITForTransparentMeshes ?? false;
        this.oitPassCount = serializationObject.oitPassCount ?? 5;
        this.renderParticles = serializationObject.renderParticles ?? true;
        this.renderSprites = serializationObject.renderSprites ?? true;
        this.forceLayerMaskCheck = serializationObject.forceLayerMaskCheck ?? true;
        this.enableBoundingBoxRendering = serializationObject.enableBoundingBoxRendering ?? true;
        this.enableOutlineRendering = serializationObject.enableOutlineRendering ?? true;
        this.disableShadows = serializationObject.disableShadows;
        this.renderInLinearSpace = !!serializationObject.renderInLinearSpace;
        this.resolveMSAAColors = serializationObject.resolveMSAAColors ?? true;
        this.resolveMSAADepth = serializationObject.resolveMSAADepth ?? false;
    }
}
