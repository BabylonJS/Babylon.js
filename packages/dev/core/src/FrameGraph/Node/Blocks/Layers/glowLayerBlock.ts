import type {
    Scene,
    NodeRenderGraphBuildState,
    FrameGraph,
    FrameGraphTextureHandle,
    FrameGraphObjectList,
    Camera,
    NodeRenderGraphConnectionPoint,
    // eslint-disable-next-line import/no-internal-modules
} from "core/index";
import { NodeRenderGraphBlock } from "../../nodeRenderGraphBlock";
import { RegisterClass } from "../../../../Misc/typeStore";
import { NodeRenderGraphBlockConnectionPointTypes } from "../../Types/nodeRenderGraphTypes";
import { editableInPropertyPage, PropertyTypeForEdition } from "../../../../Decorators/nodeDecorator";
import { FrameGraphGlowLayerTask } from "core/FrameGraph/Tasks/Layers/glowLayerTask";

/**
 * Block that implements the glow layer
 */
export class NodeRenderGraphGlowLayerBlock extends NodeRenderGraphBlock {
    protected override _frameGraphTask: FrameGraphGlowLayerTask;

    /**
     * Gets the frame graph task associated with this block
     */
    public override get task() {
        return this._frameGraphTask;
    }

    /**
     * Create a new NodeRenderGraphGlowLayerBlock
     * @param name defines the block name
     * @param frameGraph defines the hosting frame graph
     * @param scene defines the hosting scene
     */
    public constructor(name: string, frameGraph: FrameGraph, scene: Scene) {
        super(name, frameGraph, scene);

        this.registerInput("destination", NodeRenderGraphBlockConnectionPointTypes.Texture);
        this.registerInput("layer", NodeRenderGraphBlockConnectionPointTypes.Texture, true);
        this.registerInput("camera", NodeRenderGraphBlockConnectionPointTypes.Camera);
        this.registerInput("objects", NodeRenderGraphBlockConnectionPointTypes.ObjectList);
        this._addDependenciesInput();

        this.registerOutput("output", NodeRenderGraphBlockConnectionPointTypes.BasedOnInput);

        this.destination.addAcceptedConnectionPointTypes(NodeRenderGraphBlockConnectionPointTypes.TextureAllButBackBufferDepthStencil);
        this.layer.addAcceptedConnectionPointTypes(NodeRenderGraphBlockConnectionPointTypes.TextureAllButBackBuffer);

        this.output._typeConnectionSource = this.destination;

        this._frameGraphTask = new FrameGraphGlowLayerTask(this.name, frameGraph, scene);
    }

    /** How big is the kernel of the blur texture */
    @editableInPropertyPage("Blur kernel size", PropertyTypeForEdition.Int, "PROPERTIES", { min: 1, max: 256 })
    public get blurKernelSize() {
        return this._frameGraphTask.glowLayer.blurKernelSize;
    }

    public set blurKernelSize(value: number) {
        this._frameGraphTask.glowLayer.blurKernelSize = value;
    }

    /** The intensity of the glow */
    @editableInPropertyPage("Intensity", PropertyTypeForEdition.Float, "PROPERTIES", { min: 0, max: 5 })
    public get intensity() {
        return this._frameGraphTask.glowLayer.intensity;
    }

    public set intensity(value: number) {
        this._frameGraphTask.glowLayer.intensity = value;
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "NodeRenderGraphGlowLayerBlock";
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
    public get layer(): NodeRenderGraphConnectionPoint {
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
     * Gets the output component
     */
    public get output(): NodeRenderGraphConnectionPoint {
        return this._outputs[0];
    }

    protected override _buildBlock(state: NodeRenderGraphBuildState) {
        super._buildBlock(state);

        this.output.value = this._frameGraphTask.outputTexture;

        this._frameGraphTask.destinationTexture = this.destination.connectedPoint?.value as FrameGraphTextureHandle;
        this._frameGraphTask.layerTexture = this.layer.connectedPoint?.value as FrameGraphTextureHandle;
        this._frameGraphTask.camera = this.camera.connectedPoint?.value as Camera;
        this._frameGraphTask.objectList = this.objects.connectedPoint?.value as FrameGraphObjectList;
    }

    protected override _dumpPropertiesCode() {
        const codes: string[] = [];
        codes.push(`${this._codeVariableName}.blurKernelSize = ${this.blurKernelSize};`);
        codes.push(`${this._codeVariableName}.intensity = ${this.intensity};`);
        return super._dumpPropertiesCode() + codes.join("\n");
    }

    public override serialize(): any {
        const serializationObject = super.serialize();
        serializationObject.blurKernelSize = this.blurKernelSize;
        serializationObject.intensity = this.intensity;
        return serializationObject;
    }

    public override _deserialize(serializationObject: any) {
        super._deserialize(serializationObject);
        this.blurKernelSize = serializationObject.blurKernelSize;
        this.intensity = serializationObject.intensity;
    }
}

RegisterClass("BABYLON.NodeRenderGraphGlowLayerBlock", NodeRenderGraphGlowLayerBlock);
