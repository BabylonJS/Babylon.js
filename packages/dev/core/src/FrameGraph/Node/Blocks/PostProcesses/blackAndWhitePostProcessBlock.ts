import { NodeRenderGraphBlock } from "../../nodeRenderGraphBlock";
import type { NodeRenderGraphConnectionPoint } from "../../nodeRenderGraphBlockConnectionPoint";
import { RegisterClass } from "../../../../Misc/typeStore";
import { NodeRenderGraphBlockConnectionPointTypes } from "../../Types/nodeRenderGraphTypes";
import { editableInPropertyPage, PropertyTypeForEdition } from "../../../../Decorators/nodeDecorator";
import type { BlackAndWhitePostProcess } from "../../../../PostProcesses/blackAndWhitePostProcess";
import type { Scene } from "../../../../scene";
import type { NodeRenderGraphBuildState } from "../../nodeRenderGraphBuildState";
import type { FrameGraphTextureHandle } from "../../../frameGraphTypes";
import { FrameGraphBlackAndWhiteTask } from "core/FrameGraph/Tasks/PostProcesses/blackAndWhiteTask";
import type { FrameGraph } from "core/FrameGraph/frameGraph";

/**
 * Block that implements the black and white post process
 */
export class NodeRenderGraphBlackAndWhitePostProcessBlock extends NodeRenderGraphBlock {
    protected override _frameGraphTask: FrameGraphBlackAndWhiteTask;
    protected _postProcess: BlackAndWhitePostProcess;

    /**
     * Gets the frame graph task associated with this block
     */
    public override get task() {
        return this._frameGraphTask;
    }

    /**
     * Gets the post process used by this block
     */
    public get postProcess() {
        return this._postProcess;
    }

    /**
     * Create a new BlackAndWhitePostProcessBlock
     * @param name defines the block name
     * @param frameGraph defines the hosting frame graph
     * @param scene defines the hosting scene
     */
    public constructor(name: string, frameGraph: FrameGraph, scene: Scene) {
        super(name, frameGraph, scene);

        this.registerInput("source", NodeRenderGraphBlockConnectionPointTypes.Texture);
        this.registerInput("destination", NodeRenderGraphBlockConnectionPointTypes.Texture, true);
        this.registerOutput("output", NodeRenderGraphBlockConnectionPointTypes.BasedOnInput);

        this.source.addAcceptedConnectionPointTypes(NodeRenderGraphBlockConnectionPointTypes.TextureAllButBackBuffer);
        this.destination.addAcceptedConnectionPointTypes(NodeRenderGraphBlockConnectionPointTypes.TextureAll);
        this.output._typeConnectionSource = () => {
            return this.destination.isConnected ? this.destination : this.source;
        };

        this._frameGraphTask = new FrameGraphBlackAndWhiteTask(this.name, frameGraph, scene.getEngine());
        this._postProcess = this._frameGraphTask.getPostProcess();
    }

    /** Sampling mode used to sample from the source texture */
    @editableInPropertyPage("Source sampling mode", PropertyTypeForEdition.SamplingMode, "PROPERTIES")
    public get sourceSamplingMode() {
        return this._frameGraphTask.sourceSamplingMode;
    }

    public set sourceSamplingMode(value: number) {
        this._frameGraphTask.sourceSamplingMode = value;
    }

    /** Degree of conversion to black and white (default: 1 - full b&w conversion) */
    @editableInPropertyPage("Degree", PropertyTypeForEdition.Float, "PROPERTIES", { min: 0, max: 1 })
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
        return "NodeRenderGraphBlackAndWhitePostProcessBlock";
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

        this.output.value = this._frameGraphTask.outputTextureReference; // the value of the output connection point is the "output" texture of the task

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

RegisterClass("BABYLON.NodeRenderGraphBlackAndWhitePostProcessBlock", NodeRenderGraphBlackAndWhitePostProcessBlock);
