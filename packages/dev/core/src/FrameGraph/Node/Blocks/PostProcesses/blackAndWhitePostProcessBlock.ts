import { NodeRenderGraphBlock } from "../../nodeRenderGraphBlock";
import { NodeRenderGraphConnectionPoint } from "../../nodeRenderGraphBlockConnectionPoint";
import { RegisterClass } from "../../../../Misc/typeStore";
import { NodeRenderGraphBlockConnectionPointTypes } from "../../Enums/nodeRenderGraphBlockConnectionPointTypes";
import { editableInPropertyPage, PropertyTypeForEdition } from "../../../../Decorators/nodeDecorator";
import { BlackAndWhitePostProcess } from "../../../../PostProcesses/blackAndWhitePostProcess";
import type { AbstractEngine } from "../../../../Engines/abstractEngine";
import { Constants } from "../../../../Engines/constants";
import type { NodeRenderGraphBuildState } from "../../nodeRenderGraphBuildState";
import type { IFrameGraphPostProcessInputData } from "../../../../PostProcesses/postProcess";

/**
 * Block that implements the black and white post process
 */
export class BlackAndWhitePostProcessBlock extends NodeRenderGraphBlock {
    private _postProcess: BlackAndWhitePostProcess;
    private _taskParameters: IFrameGraphPostProcessInputData;

    /**
     * Create a new BlackAndWhitePostProcessBlock
     * @param name defines the block name
     * @param engine defines the hosting engine
     */
    public constructor(name: string, engine: AbstractEngine) {
        super(name, engine);

        this.registerInput("source", NodeRenderGraphBlockConnectionPointTypes.Texture);
        this.registerInput("destination", NodeRenderGraphBlockConnectionPointTypes.Texture, true);
        this.registerOutput("output", NodeRenderGraphBlockConnectionPointTypes.BasedOnInput);

        this.source.addAcceptedConnectionPointTypes(NodeRenderGraphBlockConnectionPointTypes.TextureAllButBackBuffer);
        this.destination.addAcceptedConnectionPointTypes(NodeRenderGraphBlockConnectionPointTypes.TextureAll);
        this.output._typeConnectionSource = () => {
            return this.destination.isConnected ? this.destination : this.source;
        };

        this._postProcess = new BlackAndWhitePostProcess(this.name, 1, null, undefined, engine);
        this._taskParameters = {
            sourceTexture: undefined as any,
            sourceSamplingMode: Constants.TEXTURE_NEAREST_SAMPLINGMODE,
        };
        this._frameGraphTask = this._postProcess;
    }

    /** Sampling mode used to sample from the source texture */
    @editableInPropertyPage("Source sampling mode", PropertyTypeForEdition.Int, "PROPERTIES")
    public get sourceSamplingMode() {
        return this._taskParameters.sourceSamplingMode!;
    }

    public set sourceSamplingMode(value: number) {
        this._taskParameters.sourceSamplingMode = value;
    }

    /** Degree of conversion to black and white (default: 1 - full b&w conversion) */
    @editableInPropertyPage("Degree", PropertyTypeForEdition.Float, "PROPERTIES")
    public get degree(): number {
        return this._postProcess.degree;
    }

    public set degree(value: number) {
        this._postProcess.degree = value;
    }

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

    public override dispose() {
        this._postProcess.dispose();
        super.dispose();
    }

    protected override _buildBlock(state: NodeRenderGraphBuildState) {
        super._buildBlock(state);

        this._postProcess.name = this.name;
        this.output.value = this.name;

        const source = this.source.connectedPoint?.value;
        if (NodeRenderGraphConnectionPoint.ValueIsTexture(source)) {
            this._taskParameters.sourceTexture = source;
        }

        const destination = this.destination.connectedPoint?.value;
        if (NodeRenderGraphConnectionPoint.ValueIsTexture(destination)) {
            this._taskParameters.outputTexture = destination;
        }

        state.frameGraph.addTask(this._postProcess, this._taskParameters);
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
