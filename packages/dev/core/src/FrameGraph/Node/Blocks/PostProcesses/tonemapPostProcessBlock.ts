import type { Scene, FrameGraph } from "core/index";
import { RegisterClass } from "../../../../Misc/typeStore";
import { editableInPropertyPage, PropertyTypeForEdition } from "../../../../Decorators/nodeDecorator";
import { FrameGraphTonemapTask } from "../../../Tasks/PostProcesses/tonemapTask";
import { NodeRenderGraphBasePostProcessBlock } from "./basePostProcessBlock";
import { ThinTonemapPostProcess, TonemappingOperator } from "../../../../PostProcesses/thinTonemapPostProcess";

/**
 * Block that implements the tonemap post process
 */
export class NodeRenderGraphTonemapPostProcessBlock extends NodeRenderGraphBasePostProcessBlock {
    protected override _frameGraphTask: FrameGraphTonemapTask;

    public override _additionalConstructionParameters: [TonemappingOperator];

    /**
     * Gets the frame graph task associated with this block
     */
    public override get task() {
        return this._frameGraphTask;
    }

    /**
     * Create a new NodeRenderGraphTonemapPostProcessBlock
     * @param name defines the block name
     * @param frameGraph defines the hosting frame graph
     * @param scene defines the hosting scene
     * @param operator defines the operator to use (default: Reinhard)
     */
    public constructor(name: string, frameGraph: FrameGraph, scene: Scene, operator: TonemappingOperator = TonemappingOperator.Reinhard) {
        super(name, frameGraph, scene);

        this._additionalConstructionParameters = [operator];

        this._finalizeInputOutputRegistering();

        this._frameGraphTask = new FrameGraphTonemapTask(this.name, frameGraph, new ThinTonemapPostProcess(name, frameGraph.engine, { operator }));
    }

    private _createTask(operator: TonemappingOperator) {
        const sourceSamplingMode = this._frameGraphTask.sourceSamplingMode;
        const exposureAdjustment = this._frameGraphTask.postProcess.exposureAdjustment;

        this._frameGraphTask.dispose();

        this._frameGraphTask = new FrameGraphTonemapTask(this.name, this._frameGraph, new ThinTonemapPostProcess(this.name, this._frameGraph.engine, { operator }));
        this._frameGraphTask.sourceSamplingMode = sourceSamplingMode;
        this._frameGraphTask.postProcess.exposureAdjustment = exposureAdjustment;

        this._additionalConstructionParameters = [operator];
    }

    @editableInPropertyPage("Operator", PropertyTypeForEdition.List, "PROPERTIES", {
        options: [
            { label: "Hable", value: TonemappingOperator.Hable },
            { label: "Reinhard", value: TonemappingOperator.Reinhard },
            { label: "HejiDawson", value: TonemappingOperator.HejiDawson },
            { label: "Photographic", value: TonemappingOperator.Photographic },
        ],
    })
    public get operator(): TonemappingOperator {
        return this._frameGraphTask.postProcess.operator;
    }

    public set operator(value: TonemappingOperator) {
        this._createTask(value);
    }

    /** Defines the required exposure adjustment */
    @editableInPropertyPage("Exposure adjustment", PropertyTypeForEdition.Float, "PROPERTIES")
    public get exposureAdjustment(): number {
        return this._frameGraphTask.postProcess.exposureAdjustment;
    }

    public set exposureAdjustment(value: number) {
        this._frameGraphTask.postProcess.exposureAdjustment = value;
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "NodeRenderGraphTonemapPostProcessBlock";
    }

    protected override _dumpPropertiesCode() {
        const codes: string[] = [];
        codes.push(`${this._codeVariableName}.exposureAdjustment = ${this.exposureAdjustment};`);
        return super._dumpPropertiesCode() + codes.join("\n");
    }

    public override serialize(): any {
        const serializationObject = super.serialize();
        serializationObject.exposureAdjustment = this.exposureAdjustment;
        return serializationObject;
    }

    public override _deserialize(serializationObject: any) {
        super._deserialize(serializationObject);
        this.exposureAdjustment = serializationObject.exposureAdjustment;
    }
}

RegisterClass("BABYLON.NodeRenderGraphTonemapPostProcessBlock", NodeRenderGraphTonemapPostProcessBlock);
