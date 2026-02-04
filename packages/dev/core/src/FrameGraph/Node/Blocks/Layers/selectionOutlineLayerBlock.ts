import type { Scene, NodeRenderGraphBuildState, FrameGraph, FrameGraphTextureHandle, NodeRenderGraphConnectionPoint, FrameGraphObjectRendererTask } from "core/index";
import { NodeRenderGraphBlock } from "../../nodeRenderGraphBlock";
import { RegisterClass } from "../../../../Misc/typeStore";
import { NodeRenderGraphBlockConnectionPointTypes, NodeRenderGraphConnectionPointDirection } from "../../Types/nodeRenderGraphTypes";
import { editableInPropertyPage, PropertyTypeForEdition } from "../../../../Decorators/nodeDecorator";
import { FrameGraphSelectionOutlineLayerTask } from "core/FrameGraph/Tasks/Layers/selectionOutlineTask";
import { Constants } from "core/Engines/constants";
import { NodeRenderGraphConnectionPointCustomObject } from "../../nodeRenderGraphConnectionPointCustomObject";
import { NodeRenderGraphBaseObjectRendererBlock } from "../Rendering/baseObjectRendererBlock";
import { Color3 } from "core/Maths/math.color";

/**
 * Block that implements the selection outline layer
 */
export class NodeRenderGraphSelectionOutlineLayerBlock extends NodeRenderGraphBlock {
    protected override _frameGraphTask: FrameGraphSelectionOutlineLayerTask;

    public override _additionalConstructionParameters: [number, number | undefined, number];

    /**
     * Gets the frame graph task associated with this block
     */
    public override get task() {
        return this._frameGraphTask;
    }

    /**
     * Create a new NodeRenderGraphSelectionOutlineLayerBlock
     * @param name defines the block name
     * @param frameGraph defines the hosting frame graph
     * @param scene defines the hosting scene
     * @param layerTextureRatio multiplication factor applied to the main texture size to compute the size of the layer render target texture (default: 1.0)
     * @param layerTextureFixedSize defines the fixed size of the layer render target texture. Takes precedence over layerTextureRatio if provided (default: undefined)
     * @param layerTextureType defines the type of the layer texture (default: Constants.TEXTURETYPE_HALF_FLOAT)
     */
    public constructor(
        name: string,
        frameGraph: FrameGraph,
        scene: Scene,
        layerTextureRatio = 1.0,
        layerTextureFixedSize?: number,
        layerTextureType = Constants.TEXTURETYPE_HALF_FLOAT
    ) {
        super(name, frameGraph, scene);

        this._additionalConstructionParameters = [layerTextureRatio, layerTextureFixedSize, layerTextureType];

        this.registerInput("target", NodeRenderGraphBlockConnectionPointTypes.AutoDetect);
        this.registerInput("layer", NodeRenderGraphBlockConnectionPointTypes.AutoDetect, true);
        this.registerInput(
            "objectRenderer",
            NodeRenderGraphBlockConnectionPointTypes.Object,
            false,
            new NodeRenderGraphConnectionPointCustomObject(
                "objectRenderer",
                this,
                NodeRenderGraphConnectionPointDirection.Input,
                NodeRenderGraphBaseObjectRendererBlock,
                "NodeRenderGraphBaseObjectRendererBlock"
            )
        );
        this.registerInput("depth", NodeRenderGraphBlockConnectionPointTypes.AutoDetect);

        this.depth.addExcludedConnectionPointFromAllowedTypes(
            NodeRenderGraphBlockConnectionPointTypes.TextureViewDepth | NodeRenderGraphBlockConnectionPointTypes.TextureNormalizedViewDepth
        );

        this._addDependenciesInput();

        this.registerOutput("output", NodeRenderGraphBlockConnectionPointTypes.BasedOnInput);

        this.target.addExcludedConnectionPointFromAllowedTypes(NodeRenderGraphBlockConnectionPointTypes.TextureAllButBackBufferDepthStencil);
        this.layer.addExcludedConnectionPointFromAllowedTypes(NodeRenderGraphBlockConnectionPointTypes.TextureAllButBackBuffer);

        this.output._typeConnectionSource = this.target;

        this._frameGraphTask = new FrameGraphSelectionOutlineLayerTask(this.name, this._frameGraph, this._scene, {
            mainTextureRatio: layerTextureRatio,
            mainTextureFixedSize: layerTextureFixedSize,
            mainTextureType: layerTextureType,
        });
    }

    private _createTask(layerTextureRatio: number, layerTextureFixedSize: number, layerTextureType: number) {
        const outlineColor = this.outlineColor;
        const outlineThickness = this.outlineThickness;
        const occlusionStrength = this.occlusionStrength;
        const occlusionThreshold = this.occlusionThreshold;

        this._frameGraphTask?.dispose();

        this._frameGraphTask = new FrameGraphSelectionOutlineLayerTask(this.name, this._frameGraph, this._scene, {
            mainTextureRatio: layerTextureRatio,
            mainTextureFixedSize: layerTextureFixedSize,
            mainTextureType: layerTextureType,
        });

        this.outlineColor = outlineColor;
        this.outlineThickness = outlineThickness;
        this.occlusionStrength = occlusionStrength;
        this.occlusionThreshold = occlusionThreshold;

        this._additionalConstructionParameters = [layerTextureRatio, layerTextureFixedSize, layerTextureType];
    }

    /** Multiplication factor applied to the main texture size to compute the size of the layer render target texture */
    @editableInPropertyPage("Layer texture ratio", PropertyTypeForEdition.Float, "PROPERTIES")
    public get layerTextureRatio() {
        return this._frameGraphTask.layer._options.mainTextureRatio;
    }

    public set layerTextureRatio(value: number) {
        const options = this._frameGraphTask.layer._options;

        this._createTask(value, options.mainTextureFixedSize, options.mainTextureType);
    }

    /** Defines the fixed size of the layer render target texture. Takes precedence over layerTextureRatio if provided */
    @editableInPropertyPage("Layer texture fixed size", PropertyTypeForEdition.Float, "PROPERTIES")
    public get layerTextureFixedSize() {
        return this._frameGraphTask.layer._options.mainTextureFixedSize;
    }

    public set layerTextureFixedSize(value: number) {
        const options = this._frameGraphTask.layer._options;

        this._createTask(options.mainTextureRatio, value, options.mainTextureType);
    }

    /** Defines the type of the layer texture */
    @editableInPropertyPage("Layer texture type", PropertyTypeForEdition.TextureType, "PROPERTIES")
    public get layerTextureType() {
        return this._frameGraphTask.layer._options.mainTextureType;
    }

    public set layerTextureType(value: number) {
        const options = this._frameGraphTask.layer._options;

        this._createTask(options.mainTextureRatio, options.mainTextureFixedSize, value);
    }

    /** The outline color */
    @editableInPropertyPage("Outline color", PropertyTypeForEdition.Color3, "PROPERTIES")
    public get outlineColor() {
        return this._frameGraphTask.layer.outlineColor;
    }

    public set outlineColor(value: Color3) {
        this._frameGraphTask.layer.outlineColor = value;
    }

    /** The thickness of the edges */
    @editableInPropertyPage("Outline thickness", PropertyTypeForEdition.Float, "PROPERTIES", { min: 0, max: 30 })
    public get outlineThickness() {
        return this._frameGraphTask.layer.outlineThickness;
    }

    public set outlineThickness(value: number) {
        this._frameGraphTask.layer.outlineThickness = value;
    }

    /** The strength of the occlusion effect */
    @editableInPropertyPage("Occlusion strength", PropertyTypeForEdition.Float, "PROPERTIES", { min: 0, max: 1 })
    public get occlusionStrength() {
        return this._frameGraphTask.layer.occlusionStrength;
    }

    public set occlusionStrength(value: number) {
        this._frameGraphTask.layer.occlusionStrength = value;
    }

    /** The occlusion threshold */
    @editableInPropertyPage("Occlusion threshold", PropertyTypeForEdition.Float, "PROPERTIES", { min: 0, max: 1 })
    public get occlusionThreshold() {
        return this._frameGraphTask.layer.occlusionThreshold;
    }

    public set occlusionThreshold(value: number) {
        this._frameGraphTask.layer.occlusionThreshold = value;
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "NodeRenderGraphSelectionOutlineLayerBlock";
    }

    /**
     * Gets the target texture input component
     */
    public get target(): NodeRenderGraphConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the layer texture input component
     */
    public get layer(): NodeRenderGraphConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the objectRenderer input component
     */
    public get objectRenderer(): NodeRenderGraphConnectionPoint {
        return this._inputs[2];
    }

    /**
     * Gets the depth input component
     */
    public get depth(): NodeRenderGraphConnectionPoint {
        return this._inputs[3];
    }

    /**
     * Gets the output component
     */
    public get output(): NodeRenderGraphConnectionPoint {
        return this._outputs[0];
    }

    protected override _buildBlock(state: NodeRenderGraphBuildState) {
        super._buildBlock(state);

        this.output.value = this._frameGraphTask.outputTexture;

        this._frameGraphTask.targetTexture = this.target.connectedPoint?.value as FrameGraphTextureHandle;
        this._frameGraphTask.layerTexture = this.layer.connectedPoint?.value as FrameGraphTextureHandle;
        this._frameGraphTask.objectRendererTask = this.objectRenderer.connectedPoint?.value as FrameGraphObjectRendererTask;
        this._frameGraphTask.depthTexture = this.depth.connectedPoint?.value as FrameGraphTextureHandle;
    }

    protected override _dumpPropertiesCode() {
        const codes: string[] = [];
        codes.push(`${this._codeVariableName}.outlineColor = new BABYLON.Color3(${this.outlineColor.r}, ${this.outlineColor.g}, ${this.outlineColor.b});`);
        codes.push(`${this._codeVariableName}.outlineThickness = ${this.outlineThickness};`);
        codes.push(`${this._codeVariableName}.occlusionStrength = ${this.occlusionStrength};`);
        codes.push(`${this._codeVariableName}.occlusionThreshold = ${this.occlusionThreshold};`);
        return super._dumpPropertiesCode() + codes.join("\n");
    }

    public override serialize(): any {
        const serializationObject = super.serialize();
        serializationObject.outlineColor = this.outlineColor.asArray();
        serializationObject.outlineThickness = this.outlineThickness;
        serializationObject.occlusionStrength = this.occlusionStrength;
        serializationObject.occlusionThreshold = this.occlusionThreshold;
        return serializationObject;
    }

    public override _deserialize(serializationObject: any) {
        super._deserialize(serializationObject);
        this.outlineColor = Color3.FromArray(serializationObject.outlineColor);
        this.outlineThickness = serializationObject.outlineThickness;
        this.occlusionStrength = serializationObject.occlusionStrength;
        this.occlusionThreshold = serializationObject.occlusionThreshold;
    }
}

RegisterClass("BABYLON.NodeRenderGraphSelectionOutlineLayerBlock", NodeRenderGraphSelectionOutlineLayerBlock);
