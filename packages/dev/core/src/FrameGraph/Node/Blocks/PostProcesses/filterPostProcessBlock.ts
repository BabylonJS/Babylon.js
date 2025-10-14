import type { Scene, FrameGraph } from "core/index";
import { RegisterClass } from "../../../../Misc/typeStore";
import { editableInPropertyPage, PropertyTypeForEdition } from "../../../../Decorators/nodeDecorator";
import { FrameGraphFilterTask } from "core/FrameGraph/Tasks/PostProcesses/filterTask";
import { ThinFilterPostProcess } from "core/PostProcesses/thinFilterPostProcess";
import { NodeRenderGraphBasePostProcessBlock } from "./basePostProcessBlock";
import { Matrix } from "../../../../Maths/math.vector";

/**
 * Block that implements the kernel filter post process
 */
export class NodeRenderGraphFilterPostProcessBlock extends NodeRenderGraphBasePostProcessBlock {
    protected override _frameGraphTask: FrameGraphFilterTask;

    /**
     * Gets the frame graph task associated with this block
     */
    public override get task() {
        return this._frameGraphTask;
    }

    /**
     * Create a new NodeRenderGraphFilterPostProcessBlock
     * @param name defines the block name
     * @param frameGraph defines the hosting frame graph
     * @param scene defines the hosting scene
     */
    public constructor(name: string, frameGraph: FrameGraph, scene: Scene) {
        super(name, frameGraph, scene);

        this._finalizeInputOutputRegistering();

        this._frameGraphTask = new FrameGraphFilterTask(this.name, frameGraph, new ThinFilterPostProcess(name, scene.getEngine()));
    }

    /** The matrix to be applied to the image */
    @editableInPropertyPage("Matrix", PropertyTypeForEdition.Matrix, "PROPERTIES")
    public get kernelMatrix(): Matrix {
        return this._frameGraphTask.postProcess.kernelMatrix;
    }

    public set kernelMatrix(value: Matrix) {
        this._frameGraphTask.postProcess.kernelMatrix = value;
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "NodeRenderGraphFilterPostProcessBlock";
    }

    protected override _dumpPropertiesCode() {
        const codes: string[] = [];
        codes.push(`${this._codeVariableName}.kernelMatrix = ${this.kernelMatrix};`);
        return super._dumpPropertiesCode() + codes.join("\n");
    }

    public override serialize(): any {
        const serializationObject = super.serialize();
        serializationObject.kernelMatrix = this.kernelMatrix.asArray();
        return serializationObject;
    }

    public override _deserialize(serializationObject: any) {
        super._deserialize(serializationObject);
        this.kernelMatrix = Matrix.FromArray(serializationObject.kernelMatrix);
    }
}

RegisterClass("BABYLON.NodeRenderGraphFilterPostProcessBlock", NodeRenderGraphFilterPostProcessBlock);
