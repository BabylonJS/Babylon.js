// eslint-disable-next-line import/no-internal-modules
import type { NodeRenderGraphConnectionPoint, Scene, NodeRenderGraphBuildState, FrameGraphTextureHandle, FrameGraph, FrameGraphTask } from "core/index";
import { NodeRenderGraphBlock } from "../../nodeRenderGraphBlock";
import { NodeRenderGraphBlockConnectionPointTypes } from "../../Types/nodeRenderGraphTypes";
import { editableInPropertyPage, PropertyTypeForEdition } from "../../../../Decorators/nodeDecorator";

interface IPostProcessLike {
    sourceSamplingMode: number;
    sourceTexture: FrameGraphTextureHandle;
    destinationTexture?: FrameGraphTextureHandle;
    outputTexture: FrameGraphTextureHandle;
}

/**
 * @internal
 */
export class NodeRenderGraphBasePostProcessBlock extends NodeRenderGraphBlock {
    protected override _frameGraphTask: IPostProcessLike & FrameGraphTask;

    /**
     * Create a new NodeRenderGraphBasePostProcessBlock
     * @param name defines the block name
     * @param frameGraph defines the hosting frame graph
     * @param scene defines the hosting scene
     */
    public constructor(name: string, frameGraph: FrameGraph, scene: Scene) {
        super(name, frameGraph, scene);

        this.registerInput("source", NodeRenderGraphBlockConnectionPointTypes.Texture);
        this.registerInput("destination", NodeRenderGraphBlockConnectionPointTypes.Texture, true);

        this.source.addAcceptedConnectionPointTypes(NodeRenderGraphBlockConnectionPointTypes.TextureAllButBackBuffer);
        this.destination.addAcceptedConnectionPointTypes(NodeRenderGraphBlockConnectionPointTypes.TextureAll);
    }

    protected _finalizeInputOutputRegistering() {
        this._addDependenciesInput();
        this.registerOutput("output", NodeRenderGraphBlockConnectionPointTypes.BasedOnInput);

        this.output._typeConnectionSource = () => {
            return this.destination.isConnected ? this.destination : this.source;
        };
    }

    /** Sampling mode used to sample from the source texture */
    @editableInPropertyPage("Source sampling mode", PropertyTypeForEdition.SamplingMode, "PROPERTIES")
    public get sourceSamplingMode() {
        return this._frameGraphTask.sourceSamplingMode;
    }

    public set sourceSamplingMode(value: number) {
        this._frameGraphTask.sourceSamplingMode = value;
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

        this.output.value = this._frameGraphTask.outputTexture;

        this._frameGraphTask.sourceTexture = this.source.connectedPoint?.value as FrameGraphTextureHandle;
        this._frameGraphTask.destinationTexture = this.destination.connectedPoint?.value as FrameGraphTextureHandle;
    }

    protected override _dumpPropertiesCode() {
        const codes: string[] = [];
        codes.push(`${this._codeVariableName}.sourceSamplingMode = ${this.sourceSamplingMode};`);
        return super._dumpPropertiesCode() + codes.join("\n");
    }

    public override serialize(): any {
        const serializationObject = super.serialize();
        serializationObject.sourceSamplingMode = this.sourceSamplingMode;
        return serializationObject;
    }

    public override _deserialize(serializationObject: any) {
        super._deserialize(serializationObject);
        this.sourceSamplingMode = serializationObject.sourceSamplingMode;
    }
}
