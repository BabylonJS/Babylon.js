// eslint-disable-next-line import/no-internal-modules
import type { NodeRenderGraphConnectionPoint, Scene, NodeRenderGraphBuildState, FrameGraphTextureHandle, FrameGraph } from "core/index";
import { NodeRenderGraphBlock } from "../../nodeRenderGraphBlock";
import { RegisterClass } from "../../../../Misc/typeStore";
import { NodeRenderGraphBlockConnectionPointTypes } from "../../Types/nodeRenderGraphTypes";
import { editableInPropertyPage, PropertyTypeForEdition } from "../../../../Decorators/nodeDecorator";
import { FrameGraphBloomTask } from "../../../Tasks/PostProcesses/bloomTask";

/**
 * Block that implements the bloom post process
 */
export class NodeRenderGraphBloomPostProcessBlock extends NodeRenderGraphBlock {
    protected override _frameGraphTask: FrameGraphBloomTask;

    /**
     * Gets the frame graph task associated with this block
     */
    public override get task() {
        return this._frameGraphTask;
    }

    /**
     * Create a new NodeRenderGraphBloomPostProcessBlock
     * @param name defines the block name
     * @param frameGraph defines the hosting frame graph
     * @param scene defines the hosting scene
     * @param hdr If high dynamic range textures should be used (default: false)
     * @param bloomScale The scale of the bloom effect (default: 0.5)
     */
    public constructor(name: string, frameGraph: FrameGraph, scene: Scene, hdr = false, bloomScale = 0.5) {
        super(name, frameGraph, scene);

        this._additionalConstructionParameters = [hdr, bloomScale];

        this.registerInput("source", NodeRenderGraphBlockConnectionPointTypes.Texture);
        this.registerInput("destination", NodeRenderGraphBlockConnectionPointTypes.Texture, true);
        this.registerOutput("output", NodeRenderGraphBlockConnectionPointTypes.BasedOnInput);

        this.source.addAcceptedConnectionPointTypes(NodeRenderGraphBlockConnectionPointTypes.TextureAllButBackBuffer);
        this.destination.addAcceptedConnectionPointTypes(NodeRenderGraphBlockConnectionPointTypes.TextureAll);
        this.output._typeConnectionSource = () => {
            return this.destination.isConnected ? this.destination : this.source;
        };

        this._frameGraphTask = new FrameGraphBloomTask(this.name, frameGraph, scene.getEngine(), 0.75, 64, 0.2, hdr, bloomScale);
    }

    private _createTask(bloomScale: number, hdr: boolean) {
        const sourceSamplingMode = this._frameGraphTask.sourceSamplingMode;
        const threshold = this._frameGraphTask.bloom.threshold;
        const weight = this._frameGraphTask.bloom.weight;
        const kernel = this._frameGraphTask.bloom.kernel;

        this._frameGraphTask.dispose();

        this._frameGraphTask = new FrameGraphBloomTask(this.name, this._frameGraph, this._scene.getEngine(), weight, kernel, threshold, hdr, bloomScale);
        this._frameGraphTask.sourceSamplingMode = sourceSamplingMode;

        this._additionalConstructionParameters = [hdr, bloomScale];
    }

    /** The quality of the blur effect */
    @editableInPropertyPage("Bloom scale", PropertyTypeForEdition.Float, "PROPERTIES")
    public get bloomScale() {
        return this._frameGraphTask.bloom.scale;
    }

    public set bloomScale(value: number) {
        this._createTask(value, this._frameGraphTask.hdr);
    }

    /** If high dynamic range textures should be used */
    @editableInPropertyPage("HDR", PropertyTypeForEdition.Boolean, "PROPERTIES")
    public get hdr(): boolean {
        return this._frameGraphTask.hdr;
    }

    public set hdr(value: boolean) {
        this._createTask(this._frameGraphTask.bloom.scale, value);
    }

    /** Sampling mode used to sample from the source texture */
    @editableInPropertyPage("Source sampling mode", PropertyTypeForEdition.SamplingMode)
    public get sourceSamplingMode() {
        return this._frameGraphTask.sourceSamplingMode;
    }

    public set sourceSamplingMode(value: number) {
        this._frameGraphTask.sourceSamplingMode = value;
    }

    /** The luminance threshold to find bright areas of the image to bloom. */
    @editableInPropertyPage("Threshold", PropertyTypeForEdition.Float, "PROPERTIES", { min: 0, max: 2 })
    public get threshold(): number {
        return this._frameGraphTask.bloom.threshold;
    }

    public set threshold(value: number) {
        this._frameGraphTask.bloom.threshold = value;
    }

    /** The strength of the bloom. */
    @editableInPropertyPage("Weight", PropertyTypeForEdition.Float, "PROPERTIES", { min: 0, max: 3 })
    public get weight(): number {
        return this._frameGraphTask.bloom.weight;
    }

    public set weight(value: number) {
        this._frameGraphTask.bloom.weight = value;
    }

    /** Specifies the size of the bloom blur kernel, relative to the final output size */
    @editableInPropertyPage("Kernel", PropertyTypeForEdition.Int, "PROPERTIES", { min: 1, max: 128 })
    public get kernel(): number {
        return this._frameGraphTask.bloom.kernel;
    }

    public set kernel(value: number) {
        this._frameGraphTask.bloom.kernel = value;
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "NodeRenderGraphBloomPostProcessBlock";
    }

    /**
     * Gets the source input component
     */
    public get source(): NodeRenderGraphConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the destination input component
     */
    public get destination(): NodeRenderGraphConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the output component
     */
    public get output(): NodeRenderGraphConnectionPoint {
        return this._outputs[0];
    }

    protected override _buildBlock(state: NodeRenderGraphBuildState) {
        super._buildBlock(state);

        this._frameGraphTask.name = this.name;

        this.output.value = this._frameGraphTask.outputTexture; // the value of the output connection point is the "output" texture of the task

        const sourceConnectedPoint = this.source.connectedPoint;
        if (sourceConnectedPoint) {
            this._frameGraphTask.sourceTexture = sourceConnectedPoint.value as FrameGraphTextureHandle;
        }

        const destinationConnectedPoint = this.destination.connectedPoint;
        if (destinationConnectedPoint) {
            this._frameGraphTask.destinationTexture = destinationConnectedPoint.value as FrameGraphTextureHandle;
        }
    }

    protected override _dumpPropertiesCode() {
        const codes: string[] = [];
        codes.push(`${this._codeVariableName}.threshold = ${this.threshold};`);
        codes.push(`${this._codeVariableName}.weight = ${this.weight};`);
        codes.push(`${this._codeVariableName}.kernel = ${this.kernel};`);
        codes.push(`${this._codeVariableName}.sourceSamplingMode = ${this.sourceSamplingMode};`);
        return super._dumpPropertiesCode() + codes.join("\n");
    }

    public override serialize(): any {
        const serializationObject = super.serialize();
        serializationObject.threshold = this.threshold;
        serializationObject.weight = this.weight;
        serializationObject.kernel = this.kernel;
        serializationObject.sourceSamplingMode = this.sourceSamplingMode;
        return serializationObject;
    }

    public override _deserialize(serializationObject: any) {
        super._deserialize(serializationObject);
        this.threshold = serializationObject.threshold;
        this.weight = serializationObject.weight;
        this.kernel = serializationObject.kernel;
        this.sourceSamplingMode = serializationObject.sourceSamplingMode;
    }
}

RegisterClass("BABYLON.NodeRenderGraphBloomPostProcessBlock", NodeRenderGraphBloomPostProcessBlock);
