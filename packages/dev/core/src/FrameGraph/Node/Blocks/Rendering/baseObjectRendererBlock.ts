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

        this.target.addExcludedConnectionPointFromAllowedTypes(NodeRenderGraphBlockConnectionPointTypes.TextureAllButBackBufferDepthStencil);
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
    @editableInPropertyPage("Is main object renderer", PropertyTypeForEdition.Boolean, "PROPERTIES")
    public get isMainObjectRenderer() {
        return this._frameGraphTask.isMainObjectRenderer;
    }

    public set isMainObjectRenderer(value: boolean) {
        this._frameGraphTask.isMainObjectRenderer = value;
    }

    /** Indicates if depth testing must be enabled or disabled */
    @editableInPropertyPage("Depth test", PropertyTypeForEdition.Boolean, "PROPERTIES")
    public get depthTest() {
        return this._frameGraphTask.depthTest;
    }

    public set depthTest(value: boolean) {
        this._frameGraphTask.depthTest = value;
    }

    /** Indicates if depth writing must be enabled or disabled */
    @editableInPropertyPage("Depth write", PropertyTypeForEdition.Boolean, "PROPERTIES")
    public get depthWrite() {
        return this._frameGraphTask.depthWrite;
    }

    public set depthWrite(value: boolean) {
        this._frameGraphTask.depthWrite = value;
    }

    /** Indicates if particles should be rendered */
    @editableInPropertyPage("Render particles", PropertyTypeForEdition.Boolean, "PROPERTIES")
    public get renderParticles() {
        return this._frameGraphTask.renderParticles;
    }

    public set renderParticles(value: boolean) {
        this._frameGraphTask.renderParticles = value;
    }

    /** Indicates if sprites should be rendered */
    @editableInPropertyPage("Render sprites", PropertyTypeForEdition.Boolean, "PROPERTIES")
    public get renderSprites() {
        return this._frameGraphTask.renderSprites;
    }

    public set renderSprites(value: boolean) {
        this._frameGraphTask.renderSprites = value;
    }

    /** Indicates if layer mask check must be forced */
    @editableInPropertyPage("Force layer mask check", PropertyTypeForEdition.Boolean, "PROPERTIES")
    public get forceLayerMaskCheck() {
        return this._frameGraphTask.forceLayerMaskCheck;
    }

    public set forceLayerMaskCheck(value: boolean) {
        this._frameGraphTask.forceLayerMaskCheck = value;
    }

    /** Indicates if bounding boxes should be rendered */
    @editableInPropertyPage("Enable bounding box rendering", PropertyTypeForEdition.Boolean, "PROPERTIES")
    public get enableBoundingBoxRendering() {
        return this._frameGraphTask.enableBoundingBoxRendering;
    }

    public set enableBoundingBoxRendering(value: boolean) {
        this._frameGraphTask.enableBoundingBoxRendering = value;
    }

    /** Indicates if outlines/overlays should be rendered */
    @editableInPropertyPage("Enable outline/overlay rendering", PropertyTypeForEdition.Boolean, "PROPERTIES")
    public get enableOutlineRendering() {
        return this._frameGraphTask.enableOutlineRendering;
    }

    public set enableOutlineRendering(value: boolean) {
        this._frameGraphTask.enableOutlineRendering = value;
    }

    /** Indicates if shadows must be enabled or disabled */
    @editableInPropertyPage("Disable shadows", PropertyTypeForEdition.Boolean, "PROPERTIES")
    public get disableShadows() {
        return this._frameGraphTask.disableShadows;
    }

    public set disableShadows(value: boolean) {
        this._frameGraphTask.disableShadows = value;
    }

    /** If image processing should be disabled */
    @editableInPropertyPage("Disable image processing", PropertyTypeForEdition.Boolean, "PROPERTIES")
    public get renderInLinearSpace() {
        return this._frameGraphTask.disableImageProcessing;
    }

    public set renderInLinearSpace(value: boolean) {
        this._frameGraphTask.disableImageProcessing = value;
    }

    /** True (default) to not change the aspect ratio of the scene in the RTT */
    @editableInPropertyPage("Do not change aspect ratio", PropertyTypeForEdition.Boolean, "PROPERTIES")
    public get doNotChangeAspectRatio() {
        return this._frameGraphTask.objectRenderer.options.doNotChangeAspectRatio;
    }

    public set doNotChangeAspectRatio(value: boolean) {
        this._createFrameGraphObjectWithState(value, this.enableClusteredLights);
    }

    /** True (default) to enable clustered lights */
    @editableInPropertyPage("Enable clustered lights", PropertyTypeForEdition.Boolean, "PROPERTIES")
    public get enableClusteredLights() {
        return this._frameGraphTask.objectRenderer.options.enableClusteredLights;
    }

    public set enableClusteredLights(value: boolean) {
        this._createFrameGraphObjectWithState(this.doNotChangeAspectRatio, value);
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

        this._frameGraphTask.targetTexture = this.target.connectedPoint?.value as FrameGraphTextureHandle;
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
        codes.push(`${this._codeVariableName}.renderParticles = ${this.renderParticles};`);
        codes.push(`${this._codeVariableName}.renderSprites = ${this.renderSprites};`);
        codes.push(`${this._codeVariableName}.forceLayerMaskCheck = ${this.forceLayerMaskCheck};`);
        codes.push(`${this._codeVariableName}.enableBoundingBoxRendering = ${this.enableBoundingBoxRendering};`);
        codes.push(`${this._codeVariableName}.enableOutlineRendering = ${this.enableOutlineRendering};`);
        codes.push(`${this._codeVariableName}.disableShadows = ${this.disableShadows};`);
        codes.push(`${this._codeVariableName}.renderInLinearSpace = ${this.renderInLinearSpace};`);
        return super._dumpPropertiesCode() + codes.join("\n");
    }

    public override serialize(): any {
        const serializationObject = super.serialize();
        serializationObject.isMainObjectRenderer = this.isMainObjectRenderer;
        serializationObject.depthTest = this.depthTest;
        serializationObject.depthWrite = this.depthWrite;
        serializationObject.renderParticles = this.renderParticles;
        serializationObject.renderSprites = this.renderSprites;
        serializationObject.forceLayerMaskCheck = this.forceLayerMaskCheck;
        serializationObject.enableBoundingBoxRendering = this.enableBoundingBoxRendering;
        serializationObject.enableOutlineRendering = this.enableOutlineRendering;
        serializationObject.disableShadows = this.disableShadows;
        serializationObject.renderInLinearSpace = this.renderInLinearSpace;
        return serializationObject;
    }

    public override _deserialize(serializationObject: any) {
        super._deserialize(serializationObject);
        this.isMainObjectRenderer = !!serializationObject.isMainObjectRenderer;
        this.depthTest = serializationObject.depthTest;
        this.depthWrite = serializationObject.depthWrite;
        this.renderParticles = serializationObject.renderParticles ?? true;
        this.renderSprites = serializationObject.renderSprites ?? true;
        this.forceLayerMaskCheck = serializationObject.forceLayerMaskCheck ?? true;
        this.enableBoundingBoxRendering = serializationObject.enableBoundingBoxRendering ?? true;
        this.enableOutlineRendering = serializationObject.enableOutlineRendering ?? true;
        this.disableShadows = serializationObject.disableShadows;
        this.renderInLinearSpace = !!serializationObject.renderInLinearSpace;
    }
}
