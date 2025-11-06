import type { NodeRenderGraphConnectionPoint, Scene, NodeRenderGraphBuildState, FrameGraphTextureHandle, FrameGraph } from "core/index";
import { RegisterClass } from "../../../../Misc/typeStore";
import { NodeRenderGraphBlockConnectionPointTypes } from "../../Types/nodeRenderGraphTypes";
import { editableInPropertyPage, PropertyTypeForEdition } from "../../../../Decorators/nodeDecorator";
import { FrameGraphScreenSpaceCurvatureTask } from "core/FrameGraph/Tasks/PostProcesses/screenSpaceCurvatureTask";
import { ThinScreenSpaceCurvaturePostProcess } from "core/PostProcesses/thinScreenSpaceCurvaturePostProcess";
import { NodeRenderGraphBaseWithPropertiesPostProcessBlock } from "./baseWithPropertiesPostProcessBlock";

/**
 * Block that implements the screen space curvature post process
 */
export class NodeRenderGraphScreenSpaceCurvaturePostProcessBlock extends NodeRenderGraphBaseWithPropertiesPostProcessBlock {
    protected override _frameGraphTask: FrameGraphScreenSpaceCurvatureTask;

    /**
     * Gets the frame graph task associated with this block
     */
    public override get task() {
        return this._frameGraphTask;
    }

    /**
     * Create a new NodeRenderGraphScreenSpaceCurvaturePostProcessBlock
     * @param name defines the block name
     * @param frameGraph defines the hosting frame graph
     * @param scene defines the hosting scene
     */
    public constructor(name: string, frameGraph: FrameGraph, scene: Scene) {
        super(name, frameGraph, scene);

        this.registerInput("geomViewNormal", NodeRenderGraphBlockConnectionPointTypes.TextureViewNormal);

        this._finalizeInputOutputRegistering();

        this._frameGraphTask = new FrameGraphScreenSpaceCurvatureTask(this.name, frameGraph, new ThinScreenSpaceCurvaturePostProcess(name, scene.getEngine()));
    }

    /** Defines how much ridge the curvature effect displays. */
    @editableInPropertyPage("Ridge", PropertyTypeForEdition.Float, "PROPERTIES", { min: 0, max: 1 })
    public get ridge(): number {
        return this._frameGraphTask.postProcess.ridge;
    }

    public set ridge(value: number) {
        this._frameGraphTask.postProcess.ridge = value;
    }

    /** Defines how much valley the curvature effect displays. */
    @editableInPropertyPage("Valley", PropertyTypeForEdition.Float, "PROPERTIES", { min: 0, max: 1 })
    public get valley(): number {
        return this._frameGraphTask.postProcess.valley;
    }

    public set valley(value: number) {
        this._frameGraphTask.postProcess.valley = value;
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "NodeRenderGraphScreenSpaceCurvaturePostProcessBlock";
    }

    /**
     * Gets the geometry view normal input component
     */
    public get geomViewNormal(): NodeRenderGraphConnectionPoint {
        return this._inputs[2];
    }

    protected override _buildBlock(state: NodeRenderGraphBuildState) {
        super._buildBlock(state);

        this._frameGraphTask.normalTexture = this.geomViewNormal.connectedPoint?.value as FrameGraphTextureHandle;
    }

    protected override _dumpPropertiesCode() {
        const codes: string[] = [];
        codes.push(`${this._codeVariableName}.ridge = ${this.ridge};`);
        codes.push(`${this._codeVariableName}.valley = ${this.valley};`);
        return super._dumpPropertiesCode() + codes.join("\n");
    }

    public override serialize(): any {
        const serializationObject = super.serialize();
        serializationObject.ridge = this.ridge;
        serializationObject.valley = this.valley;
        return serializationObject;
    }

    public override _deserialize(serializationObject: any) {
        super._deserialize(serializationObject);
        this.ridge = serializationObject.ridge;
        this.valley = serializationObject.valley;
    }
}

RegisterClass("BABYLON.NodeRenderGraphScreenSpaceCurvaturePostProcessBlock", NodeRenderGraphScreenSpaceCurvaturePostProcessBlock);
