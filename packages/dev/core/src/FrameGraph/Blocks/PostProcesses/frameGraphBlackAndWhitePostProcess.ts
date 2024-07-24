import { FrameGraphBlock } from "../../frameGraphBlock";
import type { FrameGraphConnectionPoint } from "../../frameGraphBlockConnectionPoint";
import { RegisterClass } from "../../../Misc/typeStore";
import { FrameGraphBlockConnectionPointTypes } from "../../Enums/frameGraphBlockConnectionPointTypes";
import type { FrameGraphBuilder } from "../../frameGraphBuilder";
import { editableInPropertyPage, PropertyTypeForEdition } from "../../../Decorators/nodeDecorator";
import type { PostProcess } from "core/PostProcesses/postProcess";
import { BlackAndWhitePostProcess } from "core/PostProcesses/blackAndWhitePostProcess";
import type { Nullable } from "core/types";
import { Constants } from "core/Engines";

/**
 * Block that implements the black and white post process
 */
export class FrameGraphBlackAndWhitePostProcess extends FrameGraphBlock {
    private _postProcess: Nullable<PostProcess> = null;

    /**
     * Create a new FrameGraphBlackAndWhitePostProcess
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this.registerInput("source", FrameGraphBlockConnectionPointTypes.Texture);
        this.registerInput("destination", FrameGraphBlockConnectionPointTypes.Texture);
        this.registerOutput("output", FrameGraphBlockConnectionPointTypes.BasedOnInput);

        this.source.addAcceptedConnectionPointTypes(FrameGraphBlockConnectionPointTypes.TextureAllButBackBuffer);
        this.destination.addAcceptedConnectionPointTypes(FrameGraphBlockConnectionPointTypes.TextureAll);
        this.output._typeConnectionSource = this.destination;
    }

    private _degree = 1;

    /** Degree of conversion to black and white (default: 1 - full b&w conversion) */
    @editableInPropertyPage("Degree", PropertyTypeForEdition.Float, "PROPERTIES")
    public get degree(): number {
        return this._degree;
    }

    public set degree(value: number) {
        if (this._degree === value) {
            return;
        }

        this._degree = value;
        if (this._postProcess) {
            (this._postProcess as BlackAndWhitePostProcess).degree = value;
        }
    }

    /** Sampling mode used to sample from the source texture */
    public sourceSamplingMode = Constants.TEXTURE_NEAREST_SAMPLINGMODE;

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "FrameGraphBlackAndWhitePostProcess";
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
        return this._postProcess?.isReady() ?? true;
    }

    public override dispose() {
        this._postProcess?.dispose();
        this._postProcess = null;

        super.dispose();
    }

    protected override _buildBlock(builder: FrameGraphBuilder) {
        super._buildBlock(builder);

        this._propagateInputValueToOutput(this.destination, this.output);

        const source = this.source.connectedPoint?.value;
        const sourceTexture = source?.getInternalTextureFromValue();
        if (!sourceTexture) {
            throw new Error("FrameGraphBlackAndWhitePostProcess: Source is not connected or is not a texture");
        }

        this._postProcess?.dispose();
        this._postProcess = new BlackAndWhitePostProcess(this.name, 1, null, this.sourceSamplingMode, builder.engine);
        this._postProcess.externalTextureSamplerBinding = true;
        this._postProcess.onApplyObservable.add((effect) => {
            effect._bindTexture("textureSampler", sourceTexture);
        });

        const destination = this.destination.connectedPoint?.value;
        const rtWrapper = destination?.getValueAsRenderTargetWrapper();
        if (rtWrapper) {
            builder.addExecuteFunction(() => {
                builder.bindRenderTargetWrapper(rtWrapper);

                this._postProcess!.renderToFrameGraph(builder);

                builder.bindRenderTargetWrapper(null);
            });
        }
    }

    protected override _dumpPropertiesCode() {
        const codes: string[] = [];
        codes.push(`${this._codeVariableName}.degree = ${this.degree};`);
        return super._dumpPropertiesCode() + codes.join("\n");
    }

    public override serialize(): any {
        const serializationObject = super.serialize();
        serializationObject.degree = this.degree;
        return serializationObject;
    }

    public override _deserialize(serializationObject: any) {
        super._deserialize(serializationObject);
        this.degree = serializationObject.degree;
    }
}

RegisterClass("BABYLON.FrameGraphBlackAndWhitePostProcess", FrameGraphBlackAndWhitePostProcess);
