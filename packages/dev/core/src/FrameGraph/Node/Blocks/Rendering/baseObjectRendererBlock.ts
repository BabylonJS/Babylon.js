import type {
    Scene,
    NodeRenderGraphBuildState,
    FrameGraph,
    FrameGraphTextureHandle,
    FrameGraphObjectList,
    Camera,
    FrameGraphObjectRendererTask,
    NodeRenderGraphResourceContainerBlock,
    ShadowGenerator,
    // eslint-disable-next-line import/no-internal-modules
} from "core/index";
import { NodeRenderGraphBlock } from "../../nodeRenderGraphBlock";
import { NodeRenderGraphBlockConnectionPointTypes } from "../../Types/nodeRenderGraphTypes";
import { editableInPropertyPage, PropertyTypeForEdition } from "../../../../Decorators/nodeDecorator";
import { NodeRenderGraphConnectionPoint } from "../../nodeRenderGraphBlockConnectionPoint";

/**
 * @internal
 */
export class NodeRenderGraphBaseObjectRendererBlock extends NodeRenderGraphBlock {
    protected override _frameGraphTask: FrameGraphObjectRendererTask;

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
     */
    public constructor(name: string, frameGraph: FrameGraph, scene: Scene) {
        super(name, frameGraph, scene);

        this.registerInput("destination", NodeRenderGraphBlockConnectionPointTypes.Texture);
        this.registerInput("depth", NodeRenderGraphBlockConnectionPointTypes.TextureBackBufferDepthStencilAttachment, true);
        this.registerInput("camera", NodeRenderGraphBlockConnectionPointTypes.Camera);
        this.registerInput("objects", NodeRenderGraphBlockConnectionPointTypes.ObjectList);
        this.registerInput("dependencies", NodeRenderGraphBlockConnectionPointTypes.Texture, true);
        this.registerInput("shadowGenerators", NodeRenderGraphBlockConnectionPointTypes.ShadowGenerator, true);

        this.registerOutput("output", NodeRenderGraphBlockConnectionPointTypes.BasedOnInput);
        this.registerOutput("outputDepth", NodeRenderGraphBlockConnectionPointTypes.BasedOnInput);

        this.destination.addAcceptedConnectionPointTypes(NodeRenderGraphBlockConnectionPointTypes.TextureAllButBackBufferDepthStencil);
        this.depth.addAcceptedConnectionPointTypes(NodeRenderGraphBlockConnectionPointTypes.TextureDepthStencilAttachment);
        this.dependencies.addAcceptedConnectionPointTypes(
            NodeRenderGraphBlockConnectionPointTypes.TextureAllButBackBuffer |
                NodeRenderGraphBlockConnectionPointTypes.StorageTexture |
                NodeRenderGraphBlockConnectionPointTypes.StorageBuffer |
                NodeRenderGraphBlockConnectionPointTypes.ResourceContainer
        );
        this.shadowGenerators.addAcceptedConnectionPointTypes(NodeRenderGraphBlockConnectionPointTypes.ResourceContainer);

        this.output._typeConnectionSource = this.destination;
        this.outputDepth._typeConnectionSource = this.depth;
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

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "NodeRenderGraphBaseObjectRendererBlock";
    }

    /**
     * Gets the destination texture input component
     */
    public get destination(): NodeRenderGraphConnectionPoint {
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

    protected override _buildBlock(state: NodeRenderGraphBuildState) {
        super._buildBlock(state);

        this.output.value = this._frameGraphTask.outputTexture; // the value of the output connection point is the "output" texture of the task

        this.outputDepth.value = this._frameGraphTask.outputDepthTexture; // the value of the outputDepth connection point is the "outputDepth" texture of the task

        this._frameGraphTask.destinationTexture = this.destination.connectedPoint?.value as FrameGraphTextureHandle;
        this._frameGraphTask.depthTexture = this.depth.connectedPoint?.value as FrameGraphTextureHandle;
        this._frameGraphTask.camera = this.camera.connectedPoint?.value as Camera;
        this._frameGraphTask.objectList = this.objects.connectedPoint?.value as FrameGraphObjectList;

        this._frameGraphTask.dependencies = [];

        const dependenciesConnectedPoint = this.dependencies.connectedPoint;
        if (dependenciesConnectedPoint) {
            if (dependenciesConnectedPoint.type === NodeRenderGraphBlockConnectionPointTypes.ResourceContainer) {
                const container = dependenciesConnectedPoint.ownerBlock as NodeRenderGraphResourceContainerBlock;
                container.inputs.forEach((input) => {
                    if (input.connectedPoint && input.connectedPoint.value !== undefined && NodeRenderGraphConnectionPoint.IsTextureHandle(input.connectedPoint.value)) {
                        this._frameGraphTask.dependencies!.push(input.connectedPoint.value as FrameGraphTextureHandle);
                    }
                });
            } else {
                this._frameGraphTask.dependencies[0] = dependenciesConnectedPoint.value as FrameGraphTextureHandle;
            }
        }

        this._frameGraphTask.shadowGenerators = [];

        const shadowGeneratorsConnectedPoint = this.shadowGenerators.connectedPoint;
        if (shadowGeneratorsConnectedPoint) {
            if (shadowGeneratorsConnectedPoint.type === NodeRenderGraphBlockConnectionPointTypes.ResourceContainer) {
                const container = shadowGeneratorsConnectedPoint.ownerBlock as NodeRenderGraphResourceContainerBlock;
                container.inputs.forEach((input) => {
                    if (input.connectedPoint && input.connectedPoint.value !== undefined && NodeRenderGraphConnectionPoint.IsShadowGenerator(input.connectedPoint.value)) {
                        this._frameGraphTask.shadowGenerators!.push(input.connectedPoint.value as ShadowGenerator);
                    }
                });
            } else {
                this._frameGraphTask.shadowGenerators[0] = shadowGeneratorsConnectedPoint.value as ShadowGenerator;
            }
        }
    }

    protected override _dumpPropertiesCode() {
        const codes: string[] = [];
        codes.push(`${this._codeVariableName}.depthTest = ${this.depthTest};`);
        codes.push(`${this._codeVariableName}.depthWrite = ${this.depthWrite};`);
        return super._dumpPropertiesCode() + codes.join("\n");
    }

    public override serialize(): any {
        const serializationObject = super.serialize();
        serializationObject.depthTest = this.depthTest;
        serializationObject.depthWrite = this.depthWrite;
        return serializationObject;
    }

    public override _deserialize(serializationObject: any) {
        super._deserialize(serializationObject);
        this.depthTest = serializationObject.depthTest;
        this.depthWrite = serializationObject.depthWrite;
    }
}
