import { NodeRenderGraphBlock } from "../../nodeRenderGraphBlock";
import type { NodeRenderGraphConnectionPoint } from "../../nodeRenderGraphBlockConnectionPoint";
import { RegisterClass } from "../../../../Misc/typeStore";
import { NodeRenderGraphBlockConnectionPointTypes } from "../../Enums/nodeRenderGraphBlockConnectionPointTypes";
import { editableInPropertyPage, PropertyTypeForEdition } from "../../../../Decorators/nodeDecorator";
import { BlackAndWhitePostProcess } from "../../../../PostProcesses/blackAndWhitePostProcess";
import type { Nullable } from "../../../../types";
import type { AbstractEngine } from "../../../../Engines/abstractEngine";
import { Constants } from "../../../../Engines/constants";
import type { Observer } from "../../../../Misc/observable";
import type { Effect } from "../../../../Materials/effect";
import type { NodeRenderGraphBuildState } from "../../nodeRenderGraphBuildState";

/**
 * Block that implements the black and white post process
 */
export class BlackAndWhitePostProcessBlock extends NodeRenderGraphBlock {
    private _postProcess: BlackAndWhitePostProcess;
    private _ppObserver: Nullable<Observer<Effect>> = null;

    /**
     * Create a new BlackAndWhitePostProcessBlock
     * @param name defines the block name
     * @param engine defines the hosting engine
     */
    public constructor(name: string, engine: AbstractEngine) {
        super(name, engine);

        this.registerInput("source", NodeRenderGraphBlockConnectionPointTypes.Texture);
        this.registerInput("destination", NodeRenderGraphBlockConnectionPointTypes.Texture);
        this.registerOutput("output", NodeRenderGraphBlockConnectionPointTypes.BasedOnInput);

        this.source.addAcceptedConnectionPointTypes(NodeRenderGraphBlockConnectionPointTypes.TextureAllButBackBuffer);
        this.destination.addAcceptedConnectionPointTypes(NodeRenderGraphBlockConnectionPointTypes.TextureAll);
        this.output._typeConnectionSource = this.destination;

        this._postProcess = new BlackAndWhitePostProcess(this.name, 1, null, undefined, engine);
        this._postProcess.externalTextureSamplerBinding = true;
    }

    /** Degree of conversion to black and white (default: 1 - full b&w conversion) */
    @editableInPropertyPage("Degree", PropertyTypeForEdition.Float, "PROPERTIES")
    public get degree(): number {
        return this._postProcess.degree;
    }

    public set degree(value: number) {
        this._postProcess.degree = value;
    }

    /** Sampling mode used to sample from the source texture */
    @editableInPropertyPage("Source sampling mode", PropertyTypeForEdition.Int, "PROPERTIES")
    public sourceSamplingMode = Constants.TEXTURE_NEAREST_SAMPLINGMODE;

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "BlackAndWhitePostProcessBlock";
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

    public override isReady(): boolean {
        return this._postProcess.isReady();
    }

    public override dispose() {
        this._postProcess.dispose();
        super.dispose();
    }

    protected override _buildBlock(state: NodeRenderGraphBuildState) {
        super._buildBlock(state);

        this._propagateInputValueToOutput(this.destination, this.output);

        const source = this.source.connectedPoint?.value;
        const sourceTexture = source?.getInternalTextureFromValue();
        if (!sourceTexture) {
            throw new Error("BlackAndWhitePostProcessBlock: Source is not connected or is not a texture");
        }

        this._postProcess.addToFrameGraph(state.frameGraph);

        this._postProcess.onApplyObservable.remove(this._ppObserver);
        this._ppObserver = this._postProcess.onApplyObservable.add((effect) => {
            effect._bindTexture("textureSampler", sourceTexture);
        });

        const destination = this.destination.connectedPoint?.value;
        const rtWrapper = destination?.getValueAsRenderTargetWrapper();
        if (rtWrapper) {
            state.frameGraph.addExecuteFunction(() => {
                if (sourceTexture.samplingMode !== this.sourceSamplingMode) {
                    this._engine.updateTextureSamplingMode(this.sourceSamplingMode, sourceTexture);
                }

                state.frameGraph.bindRenderTarget(rtWrapper);

                this._postProcess.executeFrameGraphTask(state.frameGraph);

                state.frameGraph.bindRenderTarget(null);
            });
        }
    }

    protected override _dumpPropertiesCode() {
        const codes: string[] = [];
        codes.push(`${this._codeVariableName}.degree = ${this.degree};`);
        codes.push(`${this._codeVariableName}.sourceSamplingMode = ${this.sourceSamplingMode};`);
        return super._dumpPropertiesCode() + codes.join("\n");
    }

    public override serialize(): any {
        const serializationObject = super.serialize();
        serializationObject.degree = this.degree;
        serializationObject.sourceSamplingMode = this.sourceSamplingMode;
        return serializationObject;
    }

    public override _deserialize(serializationObject: any) {
        super._deserialize(serializationObject);
        this.degree = serializationObject.degree;
        this.sourceSamplingMode = serializationObject.sourceSamplingMode;
    }
}

RegisterClass("BABYLON.BlackAndWhitePostProcessBlock", BlackAndWhitePostProcessBlock);
