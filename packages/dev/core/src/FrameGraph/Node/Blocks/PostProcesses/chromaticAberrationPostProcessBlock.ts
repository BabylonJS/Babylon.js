// eslint-disable-next-line import/no-internal-modules
import type { Scene, FrameGraph } from "core/index";
import { Vector2 } from "core/Maths/math.vector";
import { RegisterClass } from "../../../../Misc/typeStore";
import { editableInPropertyPage, PropertyTypeForEdition } from "../../../../Decorators/nodeDecorator";
import { FrameGraphChromaticAberrationTask } from "core/FrameGraph/Tasks/PostProcesses/chromaticAberrationTask";
import { ThinChromaticAberrationPostProcess } from "core/PostProcesses/thinChromaticAberrationPostProcess";
import { NodeRenderGraphBasePostProcessBlock } from "./basePostProcessBlock";

/**
 * Block that implements the chromatic aberration post process
 */
export class NodeRenderGraphChromaticAberrationPostProcessBlock extends NodeRenderGraphBasePostProcessBlock {
    protected override _frameGraphTask: FrameGraphChromaticAberrationTask;

    /**
     * Gets the frame graph task associated with this block
     */
    public override get task() {
        return this._frameGraphTask;
    }

    /**
     * Create a new chromatic aberration post process block
     * @param name defines the block name
     * @param frameGraph defines the hosting frame graph
     * @param scene defines the hosting scene
     */
    public constructor(name: string, frameGraph: FrameGraph, scene: Scene) {
        super(name, frameGraph, scene);

        this._finalizeInputOutputRegistering();

        this._frameGraphTask = new FrameGraphChromaticAberrationTask(this.name, frameGraph, new ThinChromaticAberrationPostProcess(name, scene.getEngine()));
    }

    /** The amount of separation of rgb channels */
    @editableInPropertyPage("Amount", PropertyTypeForEdition.Float, "PROPERTIES", { min: -1000, max: 1000 })
    public get aberrationAmount(): number {
        return this._frameGraphTask.postProcess.aberrationAmount;
    }

    public set aberrationAmount(value: number) {
        this._frameGraphTask.postProcess.aberrationAmount = value;
    }

    /** The amount the effect will increase for pixels closer to the edge of the screen */
    @editableInPropertyPage("Radial intensity", PropertyTypeForEdition.Float, "PROPERTIES", { min: 0.1, max: 5 })
    public get radialIntensity(): number {
        return this._frameGraphTask.postProcess.radialIntensity;
    }

    public set radialIntensity(value: number) {
        this._frameGraphTask.postProcess.radialIntensity = value;
    }

    /** The normalized direction in which the rgb channels should be separated. If set to 0,0 radial direction will be used. */
    @editableInPropertyPage("Direction", PropertyTypeForEdition.Vector2, "PROPERTIES")
    public get direction(): Vector2 {
        return this._frameGraphTask.postProcess.direction;
    }

    public set direction(value: Vector2) {
        this._frameGraphTask.postProcess.direction = value;
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "NodeRenderGraphChromaticAberrationPostProcessBlock";
    }

    protected override _dumpPropertiesCode() {
        const codes: string[] = [];
        codes.push(`${this._codeVariableName}.aberrationAmount = ${this.aberrationAmount};`);
        codes.push(`${this._codeVariableName}.radialIntensity = ${this.radialIntensity};`);
        codes.push(`${this._codeVariableName}.direction = new BABYLON.Vector2(${this.direction.x}, ${this.direction.y});`);
        return super._dumpPropertiesCode() + codes.join("\n");
    }

    public override serialize(): any {
        const serializationObject = super.serialize();
        serializationObject.aberrationAmount = this.aberrationAmount;
        serializationObject.radialIntensity = this.radialIntensity;
        serializationObject.direction = this.direction.asArray();
        return serializationObject;
    }

    public override _deserialize(serializationObject: any) {
        super._deserialize(serializationObject);
        this.aberrationAmount = serializationObject.aberrationAmount;
        this.radialIntensity = serializationObject.radialIntensity;
        this.direction = Vector2.FromArray(serializationObject.direction);
    }
}

RegisterClass("BABYLON.NodeRenderGraphChromaticAberrationPostProcessBlock", NodeRenderGraphChromaticAberrationPostProcessBlock);
