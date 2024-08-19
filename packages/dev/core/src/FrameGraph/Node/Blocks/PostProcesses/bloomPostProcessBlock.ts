import { NodeRenderGraphBlock } from "../../nodeRenderGraphBlock";
import type { NodeRenderGraphConnectionPoint } from "../../nodeRenderGraphBlockConnectionPoint";
import { RegisterClass } from "../../../../Misc/typeStore";
import { NodeRenderGraphBlockConnectionPointTypes, NodeRenderGraphBlockConnectionPointValueTypes } from "../../Types/nodeRenderGraphBlockConnectionPointTypes";
import { editableInPropertyPage, PropertyTypeForEdition } from "../../../../Decorators/nodeDecorator";
import type { AbstractEngine } from "../../../../Engines/abstractEngine";
import { Constants } from "../../../../Engines/constants";
import { BloomEffect } from "../../../../PostProcesses/bloomEffect";
import type { NodeRenderGraphBuildState } from "../../nodeRenderGraphBuildState";

/**
 * Block that implements the bloom post process
 */
export class BloomPostProcessBlock extends NodeRenderGraphBlock {
    protected override _frameGraphTask: BloomEffect;

    /**
     * Create a new BloomPostProcessBlock
     * @param name defines the block name
     * @param engine defines the hosting engine
     * @param hdr If high dynamic range textures should be used (default: false)
     * @param bloomScale The scale of the bloom effect (default: 0.5)
     */
    public constructor(name: string, engine: AbstractEngine, hdr = false, bloomScale = 0.5) {
        super(name, engine);

        this._additionalConstructionParameters = [hdr, bloomScale];

        this.registerInput("source", NodeRenderGraphBlockConnectionPointTypes.Texture);
        this.registerInput("destination", NodeRenderGraphBlockConnectionPointTypes.Texture, true);
        this.registerOutput("output", NodeRenderGraphBlockConnectionPointTypes.BasedOnInput);

        this.source.addAcceptedConnectionPointTypes(NodeRenderGraphBlockConnectionPointTypes.TextureAllButBackBuffer);
        this.destination.addAcceptedConnectionPointTypes(NodeRenderGraphBlockConnectionPointTypes.TextureAll);
        this.output._typeConnectionSource = () => {
            return this.destination.isConnected ? this.destination : this.source;
        };

        let defaultPipelineTextureType = Constants.TEXTURETYPE_UNSIGNED_BYTE;
        if (hdr) {
            const caps = engine.getCaps();
            if (caps.textureHalfFloatRender) {
                defaultPipelineTextureType = Constants.TEXTURETYPE_HALF_FLOAT;
            } else if (caps.textureFloatRender) {
                defaultPipelineTextureType = Constants.TEXTURETYPE_FLOAT;
            }
        }

        this._frameGraphTask = new BloomEffect(engine, bloomScale, 0.15, 64, defaultPipelineTextureType, false, true);
    }

    /** Sampling mode used to sample from the source texture */
    @editableInPropertyPage("Source sampling mode", PropertyTypeForEdition.Int, "PROPERTIES")
    public get sourceSamplingMode() {
        return this._frameGraphTask.sourceSamplingMode;
    }

    public set sourceSamplingMode(value: number) {
        this._frameGraphTask.sourceSamplingMode = value;
    }

    /** The luminance threshold to find bright areas of the image to bloom. */
    @editableInPropertyPage("Threshold", PropertyTypeForEdition.Float, "PROPERTIES")
    public get threshold(): number {
        return this._frameGraphTask.threshold;
    }

    public set threshold(value: number) {
        this._frameGraphTask.threshold = value;
    }

    /** The strength of the bloom. */
    @editableInPropertyPage("Weight", PropertyTypeForEdition.Float, "PROPERTIES")
    public get weight(): number {
        return this._frameGraphTask.weight;
    }

    public set weight(value: number) {
        this._frameGraphTask.weight = value;
    }

    /** Specifies the size of the bloom blur kernel, relative to the final output size */
    @editableInPropertyPage("Kernel", PropertyTypeForEdition.Float, "PROPERTIES")
    public get kernel(): number {
        return this._frameGraphTask.kernel;
    }

    public set kernel(value: number) {
        this._frameGraphTask.kernel = value;
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "BloomPostProcessBlock";
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

    public override dispose() {
        this._frameGraphTask.disposeEffects();
        super.dispose();
    }

    protected override _buildBlock(state: NodeRenderGraphBuildState) {
        super._buildBlock(state);

        this._frameGraphTask.name = this.name;

        this.output.value = this._frameGraphTask.outputTextureReference; // the value of the output connection point is the "output" texture of the task
        this.output.valueType = NodeRenderGraphBlockConnectionPointValueTypes.Texture;

        const sourceConnectedPoint = this.source.connectedPoint;
        if (sourceConnectedPoint && sourceConnectedPoint.valueType === NodeRenderGraphBlockConnectionPointValueTypes.Texture) {
            this._frameGraphTask.sourceTexture = sourceConnectedPoint.value!;
        }

        const destinationConnectedPoint = this.destination.connectedPoint;
        if (destinationConnectedPoint && destinationConnectedPoint.valueType === NodeRenderGraphBlockConnectionPointValueTypes.Texture) {
            this._frameGraphTask.destinationTexture = destinationConnectedPoint.value;
        }

        state.frameGraph.addTask(this._frameGraphTask);
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

RegisterClass("BABYLON.BloomPostProcessBlock", BloomPostProcessBlock);
