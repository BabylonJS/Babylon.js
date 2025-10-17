import type { Scene, NodeRenderGraphBuildState, FrameGraph, FrameGraphTextureHandle, NodeRenderGraphConnectionPoint, FrameGraphObjectRendererTask } from "core/index";
import { NodeRenderGraphBlock } from "../../nodeRenderGraphBlock";
import { RegisterClass } from "../../../../Misc/typeStore";
import { NodeRenderGraphBlockConnectionPointTypes, NodeRenderGraphConnectionPointDirection } from "../../Types/nodeRenderGraphTypes";
import { editableInPropertyPage, PropertyTypeForEdition } from "../../../../Decorators/nodeDecorator";
import { FrameGraphGlowLayerTask } from "core/FrameGraph/Tasks/Layers/glowLayerTask";
import { Constants } from "core/Engines/constants";
import { NodeRenderGraphConnectionPointCustomObject } from "../../nodeRenderGraphConnectionPointCustomObject";
import { NodeRenderGraphBaseObjectRendererBlock } from "../Rendering/baseObjectRendererBlock";

/**
 * Block that implements the glow layer
 */
export class NodeRenderGraphGlowLayerBlock extends NodeRenderGraphBlock {
    protected override _frameGraphTask: FrameGraphGlowLayerTask;

    public override _additionalConstructionParameters: [boolean, number, number | undefined, number];

    /**
     * Gets the frame graph task associated with this block
     */
    public override get task() {
        return this._frameGraphTask;
    }

    /**
     * Create a new NodeRenderGraphGlowLayerBlock
     * @param name defines the block name
     * @param frameGraph defines the hosting frame graph
     * @param scene defines the hosting scene
     * @param ldrMerge Forces the merge step to be done in ldr (clamp values &gt; 1). Default: false
     * @param layerTextureRatio multiplication factor applied to the main texture size to compute the size of the layer render target texture (default: 0.5)
     * @param layerTextureFixedSize defines the fixed size of the layer render target texture. Takes precedence over layerTextureRatio if provided (default: undefined)
     * @param layerTextureType defines the type of the layer texture (default: Constants.TEXTURETYPE_UNSIGNED_BYTE)
     */
    public constructor(
        name: string,
        frameGraph: FrameGraph,
        scene: Scene,
        ldrMerge = false,
        layerTextureRatio = 0.5,
        layerTextureFixedSize?: number,
        layerTextureType = Constants.TEXTURETYPE_UNSIGNED_BYTE
    ) {
        super(name, frameGraph, scene);

        this._additionalConstructionParameters = [ldrMerge, layerTextureRatio, layerTextureFixedSize, layerTextureType];

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

        this._frameGraphTask = new FrameGraphGlowLayerTask(this.name, this._frameGraph, this._scene, {
            ldrMerge,
            mainTextureRatio: layerTextureRatio,
            mainTextureFixedSize: layerTextureFixedSize,
            mainTextureType: layerTextureType,
        });
    }

    private _createTask(ldrMerge: boolean, layerTextureRatio: number, layerTextureFixedSize: number, layerTextureType: number) {
        const blurKernelSize = this.blurKernelSize;
        const intensity = this.intensity;

        this._frameGraphTask?.dispose();

        this._frameGraphTask = new FrameGraphGlowLayerTask(this.name, this._frameGraph, this._scene, {
            ldrMerge,
            mainTextureRatio: layerTextureRatio,
            mainTextureFixedSize: layerTextureFixedSize,
            mainTextureType: layerTextureType,
        });

        this.blurKernelSize = blurKernelSize;
        this.intensity = intensity;

        this._additionalConstructionParameters = [ldrMerge, layerTextureRatio, layerTextureFixedSize, layerTextureType];
    }

    /** Forces the merge step to be done in ldr (clamp values &gt; 1). Default: false */
    @editableInPropertyPage("LDR merge", PropertyTypeForEdition.Boolean, "PROPERTIES")
    public get ldrMerge() {
        return this._frameGraphTask.layer.ldrMerge;
    }

    public set ldrMerge(value: boolean) {
        const options = this._frameGraphTask.layer._options;

        this._createTask(value, options.mainTextureRatio, options.mainTextureFixedSize, options.mainTextureType);
    }

    /** Multiplication factor applied to the main texture size to compute the size of the layer render target texture */
    @editableInPropertyPage("Layer texture ratio", PropertyTypeForEdition.Float, "PROPERTIES")
    public get layerTextureRatio() {
        return this._frameGraphTask.layer._options.mainTextureRatio;
    }

    public set layerTextureRatio(value: number) {
        const options = this._frameGraphTask.layer._options;

        this._createTask(options.ldrMerge, value, options.mainTextureFixedSize, options.mainTextureType);
    }

    /** Defines the fixed size of the layer render target texture. Takes precedence over layerTextureRatio if provided */
    @editableInPropertyPage("Layer texture fixed size", PropertyTypeForEdition.Float, "PROPERTIES")
    public get layerTextureFixedSize() {
        return this._frameGraphTask.layer._options.mainTextureFixedSize;
    }

    public set layerTextureFixedSize(value: number) {
        const options = this._frameGraphTask.layer._options;

        this._createTask(options.ldrMerge, options.mainTextureRatio, value, options.mainTextureType);
    }

    /** Defines the type of the layer texture */
    @editableInPropertyPage("Layer texture type", PropertyTypeForEdition.TextureType, "PROPERTIES")
    public get layerTextureType() {
        return this._frameGraphTask.layer._options.mainTextureType;
    }

    public set layerTextureType(value: number) {
        const options = this._frameGraphTask.layer._options;

        this._createTask(options.ldrMerge, options.mainTextureRatio, options.mainTextureFixedSize, value);
    }

    /** How big is the kernel of the blur texture */
    @editableInPropertyPage("Blur kernel size", PropertyTypeForEdition.Int, "PROPERTIES", { min: 1, max: 256 })
    public get blurKernelSize() {
        return this._frameGraphTask.layer.blurKernelSize;
    }

    public set blurKernelSize(value: number) {
        this._frameGraphTask.layer.blurKernelSize = value;
    }

    /** The intensity of the glow */
    @editableInPropertyPage("Intensity", PropertyTypeForEdition.Float, "PROPERTIES", { min: 0, max: 5 })
    public get intensity() {
        return this._frameGraphTask.layer.intensity;
    }

    public set intensity(value: number) {
        this._frameGraphTask.layer.intensity = value;
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "NodeRenderGraphGlowLayerBlock";
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
        codes.push(`${this._codeVariableName}.blurKernelSize = ${this.blurKernelSize};`);
        codes.push(`${this._codeVariableName}.intensity = ${this.intensity};`);
        return super._dumpPropertiesCode() + codes.join("\n");
    }

    public override serialize(): any {
        const serializationObject = super.serialize();
        serializationObject.blurKernelSize = this.blurKernelSize;
        serializationObject.intensity = this.intensity;
        return serializationObject;
    }

    public override _deserialize(serializationObject: any) {
        super._deserialize(serializationObject);
        this.blurKernelSize = serializationObject.blurKernelSize;
        this.intensity = serializationObject.intensity;
    }
}

RegisterClass("BABYLON.NodeRenderGraphGlowLayerBlock", NodeRenderGraphGlowLayerBlock);
