import type { Scene, FrameGraph } from "core/index";
import { RegisterClass } from "../../../../Misc/typeStore";
import { editableInPropertyPage, PropertyTypeForEdition } from "../../../../Decorators/nodeDecorator";
import { FrameGraphBlurTask } from "core/FrameGraph/Tasks/PostProcesses/blurTask";
import { ThinBlurPostProcess } from "core/PostProcesses/thinBlurPostProcess";
import { Vector2 } from "core/Maths/math.vector";
import { NodeRenderGraphBaseWithPropertiesPostProcessBlock } from "./baseWithPropertiesPostProcessBlock";

/**
 * Block that implements the blur post process
 */
export class NodeRenderGraphBlurPostProcessBlock extends NodeRenderGraphBaseWithPropertiesPostProcessBlock {
    protected override _frameGraphTask: FrameGraphBlurTask;

    /**
     * Gets the frame graph task associated with this block
     */
    public override get task() {
        return this._frameGraphTask;
    }

    /**
     * Create a new NodeRenderGraphBlurPostProcessBlock
     * @param name defines the block name
     * @param frameGraph defines the hosting frame graph
     * @param scene defines the hosting scene
     */
    public constructor(name: string, frameGraph: FrameGraph, scene: Scene) {
        super(name, frameGraph, scene);

        this._finalizeInputOutputRegistering();

        this._frameGraphTask = new FrameGraphBlurTask(this.name, frameGraph, new ThinBlurPostProcess(name, scene.getEngine(), new Vector2(1, 0), 32));
    }

    /** The direction in which to blur the image */
    @editableInPropertyPage("Direction", PropertyTypeForEdition.Vector2, "PROPERTIES")
    public get direction(): Vector2 {
        return this._frameGraphTask.postProcess.direction;
    }

    public set direction(value: Vector2) {
        this._frameGraphTask.postProcess.direction = value;
    }

    /** Length in pixels of the blur sample region */
    @editableInPropertyPage("Kernel", PropertyTypeForEdition.Int, "PROPERTIES", { min: 1, max: 256 })
    public get kernel(): number {
        return this._frameGraphTask.postProcess.kernel;
    }

    public set kernel(value: number) {
        this._frameGraphTask.postProcess.kernel = value;
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "NodeRenderGraphBlurPostProcessBlock";
    }

    protected override _dumpPropertiesCode() {
        const codes: string[] = [];
        codes.push(`${this._codeVariableName}.direction = new BABYLON.Vector2(${this.direction.x}, ${this.direction.y});`);
        codes.push(`${this._codeVariableName}.kernel = ${this.kernel};`);
        return super._dumpPropertiesCode() + codes.join("\n");
    }

    public override serialize(): any {
        const serializationObject = super.serialize();
        serializationObject.direction = this.direction.asArray();
        serializationObject.kernel = this.kernel;
        return serializationObject;
    }

    public override _deserialize(serializationObject: any) {
        super._deserialize(serializationObject);
        this.direction.fromArray(serializationObject.direction);
        this.kernel = serializationObject.kernel;
    }
}

RegisterClass("BABYLON.NodeRenderGraphBlurPostProcessBlock", NodeRenderGraphBlurPostProcessBlock);
