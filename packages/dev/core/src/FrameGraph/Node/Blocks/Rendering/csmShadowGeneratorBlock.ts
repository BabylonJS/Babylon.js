// eslint-disable-next-line import/no-internal-modules
import type { Scene, FrameGraph } from "core/index";
import { NodeRenderGraphBaseShadowGeneratorBlock } from "./baseShadowGeneratorBlock";
import { RegisterClass } from "../../../../Misc/typeStore";
import { editableInPropertyPage, PropertyTypeForEdition } from "../../../../Decorators/nodeDecorator";
import { FrameGraphCascadedShadowGeneratorTask } from "../../../Tasks/Rendering/csmShadowGeneratorTask";

/**
 * Block that generates shadows through a shadow generator
 */
export class NodeRenderGraphCascadedShadowGeneratorBlock extends NodeRenderGraphBaseShadowGeneratorBlock {
    protected override _frameGraphTask: FrameGraphCascadedShadowGeneratorTask;

    /**
     * Gets the frame graph task associated with this block
     */
    public override get task() {
        return this._frameGraphTask;
    }

    /**
     * Create a new NodeRenderGraphCascadedShadowGeneratorBlock
     * @param name defines the block name
     * @param frameGraph defines the hosting frame graph
     * @param scene defines the hosting scene
     */
    public constructor(name: string, frameGraph: FrameGraph, scene: Scene) {
        super(name, frameGraph, scene);

        this._frameGraphTask = new FrameGraphCascadedShadowGeneratorTask(this.name, frameGraph, scene);
    }

    /** Sets the number of cascades */
    @editableInPropertyPage("Number of cascades", PropertyTypeForEdition.List, "CSM PROPERTIES", {
        options: [
            { label: "2", value: 2 },
            { label: "3", value: 3 },
            { label: "4", value: 4 },
        ],
    })
    public get numCascades() {
        return this._frameGraphTask.numCascades;
    }

    public set numCascades(value: number) {
        this._frameGraphTask.numCascades = value;
    }

    /** Gets or sets a value indicating whether the shadow generator should display the cascades. */
    @editableInPropertyPage("Debug mode", PropertyTypeForEdition.Boolean, "CSM PROPERTIES")
    public get debug() {
        return this._frameGraphTask.debug;
    }

    public set debug(value: boolean) {
        this._frameGraphTask.debug = value;
    }

    /** Gets or sets a value indicating whether the shadow generator should stabilize the cascades. */
    @editableInPropertyPage("Stabilize cascades", PropertyTypeForEdition.Boolean, "CSM PROPERTIES")
    public get stabilizeCascades() {
        return this._frameGraphTask.stabilizeCascades;
    }

    public set stabilizeCascades(value: boolean) {
        this._frameGraphTask.stabilizeCascades = value;
    }

    /** Gets or sets the lambda parameter of the shadow generator. */
    @editableInPropertyPage("Lambda", PropertyTypeForEdition.Float, "CSM PROPERTIES", { min: 0, max: 1 })
    public get lambda() {
        return this._frameGraphTask.lambda;
    }

    public set lambda(value: number) {
        this._frameGraphTask.lambda = value;
    }

    /** Gets or sets the cascade blend percentage. */
    @editableInPropertyPage("Cascade blend", PropertyTypeForEdition.Float, "CSM PROPERTIES", { min: 0, max: 1 })
    public get cascadeBlendPercentage() {
        return this._frameGraphTask.cascadeBlendPercentage;
    }

    public set cascadeBlendPercentage(value: number) {
        this._frameGraphTask.cascadeBlendPercentage = value;
    }

    /** Gets or sets a value indicating whether the shadow generator should use depth clamping. */
    @editableInPropertyPage("Depth clamp", PropertyTypeForEdition.Boolean, "CSM PROPERTIES")
    public get depthClamp() {
        return this._frameGraphTask.depthClamp;
    }

    public set depthClamp(value: boolean) {
        this._frameGraphTask.depthClamp = value;
    }

    /** Gets or sets a value indicating whether the shadow generator should automatically calculate the depth bounds. */
    @editableInPropertyPage("Auto-Calc depth bounds", PropertyTypeForEdition.Boolean, "CSM PROPERTIES")
    public get autoCalcDepthBounds() {
        return this._frameGraphTask.autoCalcDepthBounds;
    }

    public set autoCalcDepthBounds(value: boolean) {
        this._frameGraphTask.autoCalcDepthBounds = value;
    }

    /** Gets or sets the maximum shadow Z value. */
    @editableInPropertyPage("Shadow maxZ", PropertyTypeForEdition.Float, "CSM PROPERTIES")
    public get shadowMaxZ() {
        return this._frameGraphTask.shadowMaxZ;
    }

    public set shadowMaxZ(value: number) {
        this._frameGraphTask.shadowMaxZ = value;
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "NodeRenderGraphCascadedShadowGeneratorBlock";
    }

    protected override _dumpPropertiesCode() {
        const codes: string[] = [];
        codes.push(`${this._codeVariableName}.numCascades = ${this.numCascades};`);
        codes.push(`${this._codeVariableName}.debug = ${this.debug};`);
        codes.push(`${this._codeVariableName}.stabilizeCascades = ${this.stabilizeCascades};`);
        codes.push(`${this._codeVariableName}.lambda = ${this.lambda};`);
        codes.push(`${this._codeVariableName}.cascadeBlendPercentage = ${this.cascadeBlendPercentage};`);
        codes.push(`${this._codeVariableName}.depthClamp = ${this.depthClamp};`);
        codes.push(`${this._codeVariableName}.autoCalcDepthBounds = ${this.autoCalcDepthBounds};`);
        codes.push(`${this._codeVariableName}.shadowMaxZ = ${this.shadowMaxZ};`);
        return super._dumpPropertiesCode() + codes.join("\n");
    }

    public override serialize(): any {
        const serializationObject = super.serialize();
        serializationObject.numCascades = this.numCascades;
        serializationObject.debug = this.debug;
        serializationObject.stabilizeCascades = this.stabilizeCascades;
        serializationObject.lambda = this.lambda;
        serializationObject.cascadeBlendPercentage = this.cascadeBlendPercentage;
        serializationObject.depthClamp = this.depthClamp;
        serializationObject.autoCalcDepthBounds = this.autoCalcDepthBounds;
        serializationObject.shadowMaxZ = this.shadowMaxZ;
        return serializationObject;
    }

    public override _deserialize(serializationObject: any) {
        super._deserialize(serializationObject);
        this.numCascades = serializationObject.numCascades;
        this.debug = serializationObject.debug;
        this.stabilizeCascades = serializationObject.stabilizeCascades;
        this.lambda = serializationObject.lambda;
        this.cascadeBlendPercentage = serializationObject.cascadeBlendPercentage;
        this.depthClamp = serializationObject.depthClamp;
        this.autoCalcDepthBounds = serializationObject.autoCalcDepthBounds;
        this.shadowMaxZ = serializationObject.shadowMaxZ;
    }
}

RegisterClass("BABYLON.NodeRenderGraphCascadedShadowGeneratorBlock", NodeRenderGraphCascadedShadowGeneratorBlock);
