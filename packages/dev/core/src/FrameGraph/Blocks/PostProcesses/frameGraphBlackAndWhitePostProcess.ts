import { FrameGraphBlock } from "../../frameGraphBlock";
import type { FrameGraphConnectionPoint } from "../../frameGraphBlockConnectionPoint";
import { RegisterClass } from "../../../Misc/typeStore";
import { FrameGraphBlockConnectionPointTypes } from "../../Enums/frameGraphBlockConnectionPointTypes";
import type { FrameGraphBuildState } from "../../frameGraphBuildState";
import type { AbstractEngine } from "core/Engines/abstractEngine";
import { editableInPropertyPage, PropertyTypeForEdition } from "../../../Decorators/nodeDecorator";
import type { PostProcess } from "core/PostProcesses/postProcess";
import { BlackAndWhitePostProcess } from "core/PostProcesses/blackAndWhitePostProcess";
import type { Nullable } from "core/types";
import { Constants } from "core/Engines";
import { EffectRenderer } from "core/Materials/effectRenderer";

/**
 * Block that implements the black and white post process
 */
export class FrameGraphBlackAndWhitePostProcess extends FrameGraphBlock {
    private _effectRenderer: Nullable<EffectRenderer> = null;
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

    /** Degree of conversion to black and white (default: 1 - full b&w conversion) */
    @editableInPropertyPage("Degree", PropertyTypeForEdition.Float, "PROPERTIES")
    private _degree = 1;

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
        this._effectRenderer?.dispose();
        this._effectRenderer = null;

        super.dispose();
    }

    protected override _buildBlock(state: FrameGraphBuildState) {
        super._buildBlock(state);

        this._propagateInputValueToOutput(this.destination, this.output);

        const source = this.source.connectedPoint?.value;
        const sourceTexture = source?.getInternalTextureFromValue();
        if (!sourceTexture) {
            throw new Error("FrameGraphBlackAndWhitePostProcess: Source is not connected or is not a texture");
        }

        if (!this._effectRenderer) {
            this._effectRenderer = new EffectRenderer(state.engine);
        }

        this._postProcess?.dispose();
        this._postProcess = new BlackAndWhitePostProcess(this.name, 1, null, this.sourceSamplingMode, state.engine);
        this._postProcess.externalTextureSamplerBinding = true;
        this._postProcess.onApplyObservable.add((effect) => {
            effect._bindTexture("textureSampler", sourceTexture);
        });
    }

    protected override _execute(engine: AbstractEngine): void {
        const destination = this.destination.connectedPoint?.value;
        const rtWrapper = destination?.getValueAsRenderTargetWrapper();
        if (!rtWrapper) {
            return;
        }

        this._postProcess!.apply();
        this._effectRenderer!.render(this._postProcess!.getDrawWrapper(), rtWrapper);

        // Restore states
        engine.setDepthBuffer(true);
        engine.setDepthWrite(true);
        engine.setAlphaMode(Constants.ALPHA_DISABLE);

        engine.restoreDefaultFramebuffer();
    }
}

RegisterClass("BABYLON.FrameGraphBlackAndWhitePostProcess", FrameGraphBlackAndWhitePostProcess);
