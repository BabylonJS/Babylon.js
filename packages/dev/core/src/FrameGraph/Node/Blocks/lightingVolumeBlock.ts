import type { FrameGraph, FrameGraphShadowGeneratorTask, NodeRenderGraphBuildState, NodeRenderGraphConnectionPoint, Scene } from "core/index";
import { FrameGraphLightingVolumeTask } from "core/FrameGraph/Tasks/Misc/lightingVolumeTask";
import { RegisterClass } from "../../../Misc/typeStore";
import { editableInPropertyPage, PropertyTypeForEdition } from "../../../Decorators/nodeDecorator";
import { NodeRenderGraphBlock } from "../nodeRenderGraphBlock";
import { NodeRenderGraphBlockConnectionPointTypes } from "../Types/nodeRenderGraphTypes";

/**
 * Block that implements the lighting volume
 */
export class NodeRenderGraphLightingVolumeBlock extends NodeRenderGraphBlock {
    protected override _frameGraphTask: FrameGraphLightingVolumeTask;

    /**
     * Gets the frame graph task associated with this block
     */
    public override get task() {
        return this._frameGraphTask;
    }

    /**
     * Create a new NodeRenderGraphLightingVolumeBlock
     * @param name defines the block name
     * @param frameGraph defines the hosting frame graph
     * @param scene defines the hosting scene
     */
    public constructor(name: string, frameGraph: FrameGraph, scene: Scene) {
        super(name, frameGraph, scene);

        this.registerInput("shadowGenerator", NodeRenderGraphBlockConnectionPointTypes.ShadowGenerator);

        this._addDependenciesInput();

        this.registerOutput("output", NodeRenderGraphBlockConnectionPointTypes.ObjectList);

        this._frameGraphTask = new FrameGraphLightingVolumeTask(name, frameGraph);
    }

    /** Gets or sets the tesselation parameter */
    @editableInPropertyPage("Tesselation", PropertyTypeForEdition.Int, "PROPERTIES", { min: 1, max: 4096 })
    public get tesselation(): number {
        return this._frameGraphTask.lightingVolume.tesselation;
    }

    public set tesselation(value: number) {
        this._frameGraphTask.lightingVolume.tesselation = value;
    }

    /** Gets or sets the refresh frequency parameter */
    @editableInPropertyPage("Refresh frequency", PropertyTypeForEdition.Int, "PROPERTIES")
    public get frequency(): number {
        return this._frameGraphTask.lightingVolume.frequency;
    }

    public set frequency(value: number) {
        this._frameGraphTask.lightingVolume.frequency = value;
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "NodeRenderGraphLightingVolumeBlock";
    }

    /**
     * Gets the shadow generator input component
     */
    public get shadowGenerator(): NodeRenderGraphConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the output component
     */
    public get output(): NodeRenderGraphConnectionPoint {
        return this._outputs[0];
    }

    protected override _buildBlock(state: NodeRenderGraphBuildState) {
        super._buildBlock(state);

        this.output.value = this._frameGraphTask.outputMeshLightingVolume;

        this._frameGraphTask.shadowGenerator = this.shadowGenerator.connectedPoint?.value as FrameGraphShadowGeneratorTask;
    }

    protected override _dumpPropertiesCode() {
        const codes: string[] = [];
        codes.push(`${this._codeVariableName}.tesselation = ${this.tesselation};`);
        codes.push(`${this._codeVariableName}.frequency = ${this.frequency};`);
        return super._dumpPropertiesCode() + codes.join("\n");
    }

    public override serialize(): any {
        const serializationObject = super.serialize();
        serializationObject.tesselation = this.tesselation;
        serializationObject.frequency = this.frequency;
        return serializationObject;
    }

    public override _deserialize(serializationObject: any) {
        super._deserialize(serializationObject);
        this.tesselation = serializationObject.tesselation;
        this.frequency = serializationObject.frequency;
    }
}

RegisterClass("BABYLON.NodeRenderGraphLightingVolumeBlock", NodeRenderGraphLightingVolumeBlock);
