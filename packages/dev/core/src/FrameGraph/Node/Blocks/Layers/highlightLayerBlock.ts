import type { Scene, NodeRenderGraphBuildState, FrameGraph, FrameGraphTextureHandle, NodeRenderGraphConnectionPoint, FrameGraphObjectRendererTask } from "core/index";
import { NodeRenderGraphBlock } from "../../nodeRenderGraphBlock";
import { RegisterClass } from "../../../../Misc/typeStore";
import { NodeRenderGraphBlockConnectionPointTypes, NodeRenderGraphConnectionPointDirection } from "../../Types/nodeRenderGraphTypes";
import { editableInPropertyPage, PropertyTypeForEdition } from "../../../../Decorators/nodeDecorator";
import { FrameGraphHighlightLayerTask } from "core/FrameGraph/Tasks/Layers/highlightLayerTask";
import { Constants } from "core/Engines/constants";
import { NodeRenderGraphConnectionPointCustomObject } from "../../nodeRenderGraphConnectionPointCustomObject";
import { NodeRenderGraphBaseObjectRendererBlock } from "../Rendering/baseObjectRendererBlock";

/**
 * Block that implements the highlight layer
 */
export class NodeRenderGraphHighlightLayerBlock extends NodeRenderGraphBlock {
    protected override _frameGraphTask: FrameGraphHighlightLayerTask;

    public override _additionalConstructionParameters: [number, number | undefined, number, boolean, number];

    /**
     * Gets the frame graph task associated with this block
     */
    public override get task() {
        return this._frameGraphTask;
    }

    /**
     * Create a new NodeRenderGraphHighlightLayerBlock
     * @param name defines the block name
     * @param frameGraph defines the hosting frame graph
     * @param scene defines the hosting scene
     * @param layerTextureRatio multiplication factor applied to the main texture size to compute the size of the layer render target texture (default: 0.5)
     * @param layerTextureFixedSize defines the fixed size of the layer render target texture. Takes precedence over layerTextureRatio if provided (default: undefined)
     * @param blurTextureSizeRatio defines the factor to apply to the layer texture size to create the blur textures (default: 0.5)
     * @param isStroke should we display highlight as a solid stroke? (default: false)
     * @param layerTextureType defines the type of the layer texture (default: Constants.TEXTURETYPE_UNSIGNED_BYTE)
     */
    public constructor(
        name: string,
        frameGraph: FrameGraph,
        scene: Scene,
        layerTextureRatio = 0.5,
        layerTextureFixedSize?: number,
        blurTextureSizeRatio = 0.5,
        isStroke = false,
        layerTextureType = Constants.TEXTURETYPE_UNSIGNED_BYTE
    ) {
        super(name, frameGraph, scene);

        this._additionalConstructionParameters = [layerTextureRatio, layerTextureFixedSize, blurTextureSizeRatio, isStroke, layerTextureType];

        this.registerInput("target", NodeRenderGraphBlockConnectionPointTypes.AutoDetect);
        this.registerInput("layer", NodeRenderGraphBlockConnectionPointTypes.AutoDetect, true);
        this.registerInput(
            "objectRenderer",
            NodeRenderGraphBlockConnectionPointTypes.Object,
            true,
            new NodeRenderGraphConnectionPointCustomObject(
                "objectRenderer",
                this,
                NodeRenderGraphConnectionPointDirection.Input,
                NodeRenderGraphBaseObjectRendererBlock,
                "NodeRenderGraphBaseObjectRendererBlock"
            )
        );
        this._addDependenciesInput();

        this.registerOutput("output", NodeRenderGraphBlockConnectionPointTypes.BasedOnInput);

        this.target.addExcludedConnectionPointFromAllowedTypes(NodeRenderGraphBlockConnectionPointTypes.TextureAllButBackBufferDepthStencil);
        this.layer.addExcludedConnectionPointFromAllowedTypes(NodeRenderGraphBlockConnectionPointTypes.TextureAllButBackBuffer);

        this.output._typeConnectionSource = this.target;

        this._frameGraphTask = new FrameGraphHighlightLayerTask(this.name, this._frameGraph, this._scene, {
            mainTextureRatio: layerTextureRatio,
            mainTextureFixedSize: layerTextureFixedSize,
            blurTextureSizeRatio,
            isStroke,
            mainTextureType: layerTextureType,
        });
    }

    private _createTask(layerTextureRatio: number, layerTextureFixedSize: number, blurTextureSizeRatio: number, isStroke: boolean, layerTextureType: number) {
        const blurHorizontalSize = this.blurHorizontalSize;
        const blurVerticalSize = this.blurVerticalSize;

        this._frameGraphTask?.dispose();

        this._frameGraphTask = new FrameGraphHighlightLayerTask(this.name, this._frameGraph, this._scene, {
            mainTextureRatio: layerTextureRatio,
            mainTextureFixedSize: layerTextureFixedSize,
            blurTextureSizeRatio,
            isStroke,
            mainTextureType: layerTextureType,
        });

        this.blurHorizontalSize = blurHorizontalSize;
        this.blurVerticalSize = blurVerticalSize;

        this._additionalConstructionParameters = [layerTextureRatio, layerTextureFixedSize, blurTextureSizeRatio, isStroke, layerTextureType];
    }

    /** Multiplication factor applied to the main texture size to compute the size of the layer render target texture */
    @editableInPropertyPage("Layer texture ratio", PropertyTypeForEdition.Float, "PROPERTIES")
    public get layerTextureRatio() {
        return this._frameGraphTask.layer._options.mainTextureRatio;
    }

    public set layerTextureRatio(value: number) {
        const options = this._frameGraphTask.layer._options;

        this._createTask(value, options.mainTextureFixedSize, options.blurTextureSizeRatio, options.isStroke, options.mainTextureType);
    }

    /** Defines the fixed size of the layer render target texture. Takes precedence over layerTextureRatio if provided */
    @editableInPropertyPage("Layer texture fixed size", PropertyTypeForEdition.Float, "PROPERTIES")
    public get layerTextureFixedSize() {
        return this._frameGraphTask.layer._options.mainTextureFixedSize;
    }

    public set layerTextureFixedSize(value: number) {
        const options = this._frameGraphTask.layer._options;

        this._createTask(options.mainTextureRatio, value, options.blurTextureSizeRatio, options.isStroke, options.mainTextureType);
    }

    /** Defines the factor to apply to the layer texture size to create the blur textures */
    @editableInPropertyPage("Blur texture size ratio", PropertyTypeForEdition.Float, "PROPERTIES")
    public get blurTextureSizeRatio() {
        return this._frameGraphTask.layer._options.blurTextureSizeRatio;
    }

    public set blurTextureSizeRatio(value: number) {
        const options = this._frameGraphTask.layer._options;

        this._createTask(options.mainTextureRatio, options.mainTextureFixedSize, value, options.isStroke, options.mainTextureType);
    }

    /** Should we display highlight as a solid stroke? */
    @editableInPropertyPage("Is stroke", PropertyTypeForEdition.Boolean, "PROPERTIES")
    public get isStroke() {
        return this._frameGraphTask.layer._options.isStroke;
    }

    public set isStroke(value: boolean) {
        const options = this._frameGraphTask.layer._options;

        this._createTask(options.mainTextureRatio, options.mainTextureFixedSize, options.blurTextureSizeRatio, value, options.mainTextureType);
    }

    /** Defines the type of the layer texture */
    @editableInPropertyPage("Layer texture type", PropertyTypeForEdition.TextureType, "PROPERTIES")
    public get layerTextureType() {
        return this._frameGraphTask.layer._options.mainTextureType;
    }

    public set layerTextureType(value: number) {
        const options = this._frameGraphTask.layer._options;

        this._createTask(options.mainTextureRatio, options.mainTextureFixedSize, options.blurTextureSizeRatio, options.isStroke, value);
    }

    /** How big is the horizontal kernel of the blur texture */
    @editableInPropertyPage("Blur horizontal size", PropertyTypeForEdition.Float, "PROPERTIES", { min: 0, max: 4 })
    public get blurHorizontalSize() {
        return this._frameGraphTask.layer.blurHorizontalSize;
    }

    public set blurHorizontalSize(value: number) {
        this._frameGraphTask.layer.blurHorizontalSize = value;
    }

    /** How big is the vertical kernel of the blur texture */
    @editableInPropertyPage("Blur vertical size", PropertyTypeForEdition.Float, "PROPERTIES", { min: 0, max: 4 })
    public get blurVerticalSize() {
        return this._frameGraphTask.layer.blurVerticalSize;
    }

    public set blurVerticalSize(value: number) {
        this._frameGraphTask.layer.blurVerticalSize = value;
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "NodeRenderGraphHighlightLayerBlock";
    }

    /**
     * Gets the target texture input component
     */
    public get target(): NodeRenderGraphConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the layer input component
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
    }

    protected override _dumpPropertiesCode() {
        const codes: string[] = [];
        codes.push(`${this._codeVariableName}.blurHorizontalSize = ${this.blurHorizontalSize};`);
        codes.push(`${this._codeVariableName}.blurVerticalSize = ${this.blurVerticalSize};`);
        return super._dumpPropertiesCode() + codes.join("\n");
    }

    public override serialize(): any {
        const serializationObject = super.serialize();
        serializationObject.blurHorizontalSize = this.blurHorizontalSize;
        serializationObject.blurVerticalSize = this.blurVerticalSize;
        return serializationObject;
    }

    public override _deserialize(serializationObject: any) {
        super._deserialize(serializationObject);
        this.blurHorizontalSize = serializationObject.blurHorizontalSize;
        this.blurVerticalSize = serializationObject.blurVerticalSize;
    }
}

RegisterClass("BABYLON.NodeRenderGraphHighlightLayerBlock", NodeRenderGraphHighlightLayerBlock);
