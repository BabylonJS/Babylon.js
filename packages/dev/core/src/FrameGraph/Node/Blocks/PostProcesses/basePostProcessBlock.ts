import type { NodeRenderGraphConnectionPoint, Scene, NodeRenderGraphBuildState, FrameGraphTextureHandle, FrameGraph, FrameGraphTask } from "core/index";
import { NodeRenderGraphBlock } from "../../nodeRenderGraphBlock";
import { NodeRenderGraphBlockConnectionPointTypes } from "../../Types/nodeRenderGraphTypes";
import { editableInPropertyPage, PropertyTypeForEdition } from "../../../../Decorators/nodeDecorator";
import { Constants } from "core/Engines/constants";

interface IPostProcessLike {
    sourceSamplingMode: number;
    get alphaMode(): number;
    set alphaMode(mode: number);
    sourceTexture?: FrameGraphTextureHandle;
    targetTexture?: FrameGraphTextureHandle;
    outputTexture: FrameGraphTextureHandle;
}

/**
 * Base class for post process like blocks.
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

        this.registerInput("source", NodeRenderGraphBlockConnectionPointTypes.AutoDetect);
        this.registerInput("target", NodeRenderGraphBlockConnectionPointTypes.AutoDetect, true);

        this.source.addExcludedConnectionPointFromAllowedTypes(NodeRenderGraphBlockConnectionPointTypes.TextureAllButBackBuffer);
        this.target.addExcludedConnectionPointFromAllowedTypes(NodeRenderGraphBlockConnectionPointTypes.TextureAll);
    }

    protected _finalizeInputOutputRegistering() {
        this._addDependenciesInput();
        this.registerOutput("output", NodeRenderGraphBlockConnectionPointTypes.BasedOnInput);

        this.output._typeConnectionSource = () => {
            return this.target.isConnected ? this.target : this.source;
        };
    }

    /** Sampling mode used to sample from the source texture */
    @editableInPropertyPage("Source sampling mode", PropertyTypeForEdition.SamplingMode, "BASE PROPERTIES")
    public get sourceSamplingMode() {
        return this._frameGraphTask.sourceSamplingMode;
    }

    public set sourceSamplingMode(value: number) {
        this._frameGraphTask.sourceSamplingMode = value;
    }

    /** The alpha mode to use when applying the post process. */
    @editableInPropertyPage("Alpha Mode", PropertyTypeForEdition.List, "BASE PROPERTIES", {
        options: [
            { label: "Disabled", value: Constants.ALPHA_DISABLE },
            { label: "Combine", value: Constants.ALPHA_COMBINE },
            { label: "One One", value: Constants.ALPHA_ONEONE },
            { label: "Add", value: Constants.ALPHA_ADD },
            { label: "Subtract", value: Constants.ALPHA_SUBTRACT },
            { label: "Multiply", value: Constants.ALPHA_MULTIPLY },
            { label: "Maximized", value: Constants.ALPHA_MAXIMIZED },
            { label: "Pre-multiplied", value: Constants.ALPHA_PREMULTIPLIED },
            { label: "Pre-multiplied Porter Duff", value: Constants.ALPHA_PREMULTIPLIED_PORTERDUFF },
            { label: "Screen Mode", value: Constants.ALPHA_SCREENMODE },
            { label: "OneOne OneOne", value: Constants.ALPHA_ONEONE_ONEONE },
            { label: "Alpha to Color", value: Constants.ALPHA_ALPHATOCOLOR },
            { label: "Reverse One Minus", value: Constants.ALPHA_REVERSEONEMINUS },
            { label: "Source+Dest * (1 - SourceAlpha)", value: Constants.ALPHA_SRC_DSTONEMINUSSRCALPHA },
            { label: "OneOne OneZero", value: Constants.ALPHA_ONEONE_ONEZERO },
            { label: "Exclusion", value: Constants.ALPHA_EXCLUSION },
            { label: "Layer Accumulate", value: Constants.ALPHA_LAYER_ACCUMULATE },
        ],
    })
    public get alphaMode(): number {
        return this._frameGraphTask.alphaMode;
    }

    public set alphaMode(value: number) {
        this._frameGraphTask.alphaMode = value;
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "NodeRenderGraphBasePostProcessBlock";
    }

    /**
     * Gets the source input component
     */
    public get source(): NodeRenderGraphConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the target input component
     */
    public get target(): NodeRenderGraphConnectionPoint {
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
        this._frameGraphTask.targetTexture = this.target.connectedPoint?.value as FrameGraphTextureHandle;
    }

    protected override _dumpPropertiesCode() {
        const codes: string[] = [];
        codes.push(`${this._codeVariableName}.sourceSamplingMode = ${this.sourceSamplingMode};`);
        codes.push(`${this._codeVariableName}.alphaMode = ${this.alphaMode};`);
        return super._dumpPropertiesCode() + codes.join("\n");
    }

    public override serialize(): any {
        const serializationObject = super.serialize();
        serializationObject.sourceSamplingMode = this.sourceSamplingMode;
        serializationObject.alphaMode = this.alphaMode;
        return serializationObject;
    }

    public override _deserialize(serializationObject: any) {
        super._deserialize(serializationObject);
        this.sourceSamplingMode = serializationObject.sourceSamplingMode;
        this.alphaMode = serializationObject.alphaMode ?? Constants.ALPHA_DISABLE;
    }
}
