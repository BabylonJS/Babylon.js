import { FrameGraphBlock } from "../../frameGraphBlock";
import type { FrameGraphConnectionPoint } from "../../frameGraphBlockConnectionPoint";
import { RegisterClass } from "../../../Misc/typeStore";
import { FrameGraphBlockConnectionPointTypes } from "../../Enums/frameGraphBlockConnectionPointTypes";
import type { FrameGraphBuilder } from "../../frameGraphBuilder";
import { editableInPropertyPage, PropertyTypeForEdition } from "../../../Decorators/nodeDecorator";
import type { AbstractEngine } from "../../../Engines/abstractEngine";
import { Constants } from "../../../Engines/constants";
import { BloomEffect } from "../../../PostProcesses/bloomEffect";

/**
 * Block that implements the bloom post process
 */
export class FrameGraphBloomPostProcess extends FrameGraphBlock {
    private _postProcess: BloomEffect;

    /**
     * Create a new FrameGraphBlackAndWhitePostProcess
     * @param name defines the block name
     * @param engine defines the hosting engine
     * @param hdr If high dynamic range textures should be used (default: false)
     */
    public constructor(name: string, engine: AbstractEngine, hdr = false) {
        super(name, engine);

        this._additionalConstructionParameters = [hdr];

        this.registerInput("source", FrameGraphBlockConnectionPointTypes.Texture);
        this.registerInput("destination", FrameGraphBlockConnectionPointTypes.Texture);
        this.registerOutput("output", FrameGraphBlockConnectionPointTypes.BasedOnInput);

        this.source.addAcceptedConnectionPointTypes(FrameGraphBlockConnectionPointTypes.TextureAllButBackBuffer);
        this.destination.addAcceptedConnectionPointTypes(FrameGraphBlockConnectionPointTypes.TextureAll);
        this.output._typeConnectionSource = this.destination;

        let defaultPipelineTextureType = Constants.TEXTURETYPE_UNSIGNED_BYTE;
        if (hdr) {
            const caps = engine.getCaps();
            if (caps.textureHalfFloatRender) {
                defaultPipelineTextureType = Constants.TEXTURETYPE_HALF_FLOAT;
            } else if (caps.textureFloatRender) {
                defaultPipelineTextureType = Constants.TEXTURETYPE_FLOAT;
            }
        }

        this._postProcess = new BloomEffect(engine, 0.5, 0.15, 64, defaultPipelineTextureType, false);
    }

    /** The luminance threshold to find bright areas of the image to bloom. */
    @editableInPropertyPage("Threshold", PropertyTypeForEdition.Float, "PROPERTIES")
    public get threshold(): number {
        return this._postProcess.threshold;
    }

    public set threshold(value: number) {
        this._postProcess.threshold = value;
    }

    /** The strength of the bloom. */
    @editableInPropertyPage("Weight", PropertyTypeForEdition.Float, "PROPERTIES")
    public get weight(): number {
        return this._postProcess.weight;
    }

    public set weight(value: number) {
        this._postProcess.weight = value;
    }

    /** Specifies the size of the bloom blur kernel, relative to the final output size */
    @editableInPropertyPage("Kernel", PropertyTypeForEdition.Float, "PROPERTIES")
    public get kernel(): number {
        return this._postProcess.kernel;
    }

    public set kernel(value: number) {
        this._postProcess.kernel = value;
    }

    /** Sampling mode used to sample from the source texture */
    @editableInPropertyPage("Source sampling mode", PropertyTypeForEdition.Int, "PROPERTIES")
    public sourceSamplingMode = Constants.TEXTURE_NEAREST_SAMPLINGMODE;

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "FrameGraphBloomPostProcess";
    }
    /**
     * Gets the source input component
     */
    public get source(): FrameGraphConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the destination input component
     */
    public get destination(): FrameGraphConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the output component
     */
    public get output(): FrameGraphConnectionPoint {
        return this._outputs[0];
    }

    public override isReady(): boolean {
        return this._postProcess._isReady();
    }

    public override dispose() {
        this._postProcess.disposeEffects();
        super.dispose();
    }

    protected override _buildBlock(builder: FrameGraphBuilder) {
        super._buildBlock(builder);

        this._propagateInputValueToOutput(this.destination, this.output);

        const source = this.source.connectedPoint?.value;
        const sourceTexture = source?.getInternalTextureFromValue();
        if (!sourceTexture) {
            throw new Error("FrameGraphBloomPostProcess: Source is not connected or is not a texture");
        }

        this._postProcess.frameGraphBuild(builder, { sourceTexture });

        const destination = this.destination.connectedPoint?.value;
        const rtWrapper = destination?.getValueAsRenderTargetWrapper();
        if (rtWrapper) {
            builder.addExecuteFunction(() => {
                if (sourceTexture.samplingMode !== this.sourceSamplingMode) {
                    this._engine.updateTextureSamplingMode(this.sourceSamplingMode, sourceTexture);
                }

                builder.bindRenderTarget(rtWrapper);

                this._postProcess.frameGraphRender(builder);

                builder.bindRenderTarget(null);
            });
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

RegisterClass("BABYLON.FrameGraphBloomPostProcess", FrameGraphBloomPostProcess);
