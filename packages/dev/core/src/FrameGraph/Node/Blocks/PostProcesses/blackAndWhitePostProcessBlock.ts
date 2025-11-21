import type { Scene, FrameGraph } from "core/index";
import { RegisterClass } from "../../../../Misc/typeStore";
import { editableInPropertyPage, PropertyTypeForEdition } from "../../../../Decorators/nodeDecorator";
import { FrameGraphBlackAndWhiteTask } from "core/FrameGraph/Tasks/PostProcesses/blackAndWhiteTask";
import { ThinBlackAndWhitePostProcess } from "core/PostProcesses/thinBlackAndWhitePostProcess";
import { NodeRenderGraphBaseWithPropertiesPostProcessBlock } from "./baseWithPropertiesPostProcessBlock";

/**
 * Block that implements the black and white post process
 */
export class NodeRenderGraphBlackAndWhitePostProcessBlock extends NodeRenderGraphBaseWithPropertiesPostProcessBlock {
    protected override _frameGraphTask: FrameGraphBlackAndWhiteTask;

    /**
     * Gets the frame graph task associated with this block
     */
    public override get task() {
        return this._frameGraphTask;
    }

    /**
     * Create a new BlackAndWhitePostProcessBlock
     * @param name defines the block name
     * @param frameGraph defines the hosting frame graph
     * @param scene defines the hosting scene
     */
    public constructor(name: string, frameGraph: FrameGraph, scene: Scene) {
        super(name, frameGraph, scene);

        this._finalizeInputOutputRegistering();

        this._frameGraphTask = new FrameGraphBlackAndWhiteTask(this.name, frameGraph, new ThinBlackAndWhitePostProcess(name, scene.getEngine()));
    }

    /** Degree of conversion to black and white (default: 1 - full b&w conversion) */
    @editableInPropertyPage("Degree", PropertyTypeForEdition.Float, "PROPERTIES", { min: 0, max: 1 })
    public get degree(): number {
        return this._frameGraphTask.postProcess.degree;
    }

    public set degree(value: number) {
        this._frameGraphTask.postProcess.degree = value;
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "NodeRenderGraphBlackAndWhitePostProcessBlock";
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

RegisterClass("BABYLON.NodeRenderGraphBlackAndWhitePostProcessBlock", NodeRenderGraphBlackAndWhitePostProcessBlock);
