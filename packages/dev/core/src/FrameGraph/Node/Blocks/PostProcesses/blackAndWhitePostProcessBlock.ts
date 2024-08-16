import { NodeRenderGraphBlock } from "../../nodeRenderGraphBlock";
import type { NodeRenderGraphConnectionPoint } from "../../nodeRenderGraphBlockConnectionPoint";
import { RegisterClass } from "../../../../Misc/typeStore";
import { NodeRenderGraphBlockConnectionPointTypes, NodeRenderGraphBlockConnectionPointValueTypes } from "../../Types/nodeRenderGraphBlockConnectionPointTypes";
import { editableInPropertyPage, PropertyTypeForEdition } from "../../../../Decorators/nodeDecorator";
import { BlackAndWhitePostProcess } from "../../../../PostProcesses/blackAndWhitePostProcess";
import type { AbstractEngine } from "../../../../Engines/abstractEngine";
import { Constants } from "../../../../Engines/constants";
import type { NodeRenderGraphBuildState } from "../../nodeRenderGraphBuildState";

/**
 * Block that implements the black and white post process
 */
export class BlackAndWhitePostProcessBlock extends NodeRenderGraphBlock {
    protected override _frameGraphTask: BlackAndWhitePostProcess;

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

        this._frameGraphTask = new BlackAndWhitePostProcess(
            this.name,
            {
                useAsFrameGraphTask: true,
                frameGraphParameters: { sourceSamplingMode: Constants.TEXTURE_NEAREST_SAMPLINGMODE },
            },
            null,
            undefined,
            engine
        );
    }

    /** Sampling mode used to sample from the source texture */
    @editableInPropertyPage("Source sampling mode", PropertyTypeForEdition.Int, "PROPERTIES")
    public get sourceSamplingMode() {
        return this._frameGraphTask.sourceSamplingMode;
    }

    public set sourceSamplingMode(value: number) {
        this._frameGraphTask.sourceSamplingMode = value;
    }

    /** Degree of conversion to black and white (default: 1 - full b&w conversion) */
    @editableInPropertyPage("Degree", PropertyTypeForEdition.Float, "PROPERTIES")
    public get degree(): number {
        return this._frameGraphTask.degree;
    }

    public set degree(value: number) {
        this._frameGraphTask.degree = value;
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
        this._frameGraphTask.dispose();
        super.dispose();
    }

    protected override _buildBlock(state: NodeRenderGraphBuildState) {
        super._buildBlock(state);

        this._frameGraphTask.name = this.name; // sets the task name
        this.output.value = this._frameGraphTask.name; // the value of the output connection point is the "output" texture of the task
        this.output.valueType = NodeRenderGraphBlockConnectionPointValueTypes.Texture;

        const sourceConnectedPoint = this.source.connectedPoint;
        if (sourceConnectedPoint && sourceConnectedPoint.valueType === NodeRenderGraphBlockConnectionPointValueTypes.Texture) {
            this._frameGraphTask.sourceTexture = sourceConnectedPoint.value!;
        }

        const destinationConnectedPoint = this.destination.connectedPoint;
        if (destinationConnectedPoint && destinationConnectedPoint.valueType === NodeRenderGraphBlockConnectionPointValueTypes.Texture) {
            this._frameGraphTask.outputTexture = destinationConnectedPoint.value;
        }

        state.frameGraph.addTask(this._frameGraphTask);
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
