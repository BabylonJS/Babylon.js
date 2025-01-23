import type {
    NodeRenderGraphConnectionPoint,
    Scene,
    NodeRenderGraphBuildState,
    FrameGraph,
    IShadowLight,
    FrameGraphObjectList,
    FrameGraphShadowGeneratorTask,
    Camera,
    // eslint-disable-next-line import/no-internal-modules
} from "core/index";
import { NodeRenderGraphBlock } from "../../nodeRenderGraphBlock";
import { NodeRenderGraphBlockConnectionPointTypes } from "../../Types/nodeRenderGraphTypes";
import { editableInPropertyPage, PropertyTypeForEdition } from "../../../../Decorators/nodeDecorator";
import { ShadowGenerator } from "../../../../Lights/Shadows/shadowGenerator";

/**
 * @internal
 */
export class NodeRenderGraphBaseShadowGeneratorBlock extends NodeRenderGraphBlock {
    protected override _frameGraphTask: FrameGraphShadowGeneratorTask;

    /**
     * Gets the frame graph task associated with this block
     */
    public override get task() {
        return this._frameGraphTask;
    }

    /**
     * Create a new NodeRenderGraphBaseShadowGeneratorBlock
     * @param name defines the block name
     * @param frameGraph defines the hosting frame graph
     * @param scene defines the hosting scene
     */
    public constructor(name: string, frameGraph: FrameGraph, scene: Scene) {
        super(name, frameGraph, scene);

        this.registerInput("light", NodeRenderGraphBlockConnectionPointTypes.ShadowLight);
        this.registerInput("objects", NodeRenderGraphBlockConnectionPointTypes.ObjectList);
        this.registerInput("camera", NodeRenderGraphBlockConnectionPointTypes.Camera);
        this._addDependenciesInput();

        this.registerOutput("generator", NodeRenderGraphBlockConnectionPointTypes.ShadowGenerator);
        this.registerOutput("output", NodeRenderGraphBlockConnectionPointTypes.Texture);
    }

    /** Sets the size of the shadow texture */
    @editableInPropertyPage("Map size", PropertyTypeForEdition.List, "PROPERTIES", {
        options: [
            { label: "128", value: 128 },
            { label: "256", value: 256 },
            { label: "512", value: 512 },
            { label: "1024", value: 1024 },
            { label: "2048", value: 2048 },
            { label: "4096", value: 4096 },
            { label: "8192", value: 8192 },
        ],
    })
    public get mapSize() {
        return this._frameGraphTask.mapSize;
    }

    public set mapSize(value: number) {
        this._frameGraphTask.mapSize = value;
    }

    /** Sets the texture type to float (by default, half float is used if supported) */
    @editableInPropertyPage("Use 32 bits float texture type", PropertyTypeForEdition.Boolean, "PROPERTIES")
    public get useFloat32TextureType() {
        return this._frameGraphTask.useFloat32TextureType;
    }

    public set useFloat32TextureType(value: boolean) {
        this._frameGraphTask.useFloat32TextureType = value;
    }

    /** Sets the texture type to Red */
    @editableInPropertyPage("Use red texture format", PropertyTypeForEdition.Boolean, "PROPERTIES")
    public get useRedTextureFormat() {
        return this._frameGraphTask.useRedTextureFormat;
    }

    public set useRedTextureFormat(value: boolean) {
        this._frameGraphTask.useRedTextureFormat = value;
    }

    /** Sets the bias */
    @editableInPropertyPage("Bias", PropertyTypeForEdition.Float, "PROPERTIES", { min: 0, max: 1 })
    public get bias() {
        return this._frameGraphTask.bias;
    }

    public set bias(value: number) {
        this._frameGraphTask.bias = value;
    }

    /** Sets the normal bias */
    @editableInPropertyPage("Normal bias", PropertyTypeForEdition.Float, "PROPERTIES", { min: 0, max: 1 })
    public get normalBias() {
        return this._frameGraphTask.normalBias;
    }

    public set normalBias(value: number) {
        this._frameGraphTask.normalBias = value;
    }

    /** Sets the darkness of the shadows */
    @editableInPropertyPage("Darkness", PropertyTypeForEdition.Float, "PROPERTIES", { min: 0, max: 1 })
    public get darkness() {
        return this._frameGraphTask.darkness;
    }

    public set darkness(value: number) {
        this._frameGraphTask.darkness = value;
    }

    /** Sets the filter method */
    @editableInPropertyPage("Filter", PropertyTypeForEdition.List, "PROPERTIES", {
        options: [
            { label: "None", value: ShadowGenerator.FILTER_NONE },
            { label: "Exponential", value: ShadowGenerator.FILTER_EXPONENTIALSHADOWMAP },
            { label: "Poisson Sampling", value: ShadowGenerator.FILTER_POISSONSAMPLING },
            { label: "Blur exponential", value: ShadowGenerator.FILTER_BLUREXPONENTIALSHADOWMAP },
            { label: "Close exponential", value: ShadowGenerator.FILTER_CLOSEEXPONENTIALSHADOWMAP },
            { label: "Blur close exponential", value: ShadowGenerator.FILTER_BLURCLOSEEXPONENTIALSHADOWMAP },
            { label: "PCF", value: ShadowGenerator.FILTER_PCF },
            { label: "PCSS", value: ShadowGenerator.FILTER_PCSS },
        ],
    })
    public get filter() {
        return this._frameGraphTask.filter;
    }

    public set filter(value: number) {
        this._frameGraphTask.filter = value;
    }

    /** Sets the filter quality (for PCF and PCSS) */
    @editableInPropertyPage("Filter quality", PropertyTypeForEdition.List, "PROPERTIES", {
        options: [
            { label: "Low", value: ShadowGenerator.QUALITY_LOW },
            { label: "Medium", value: ShadowGenerator.QUALITY_MEDIUM },
            { label: "High", value: ShadowGenerator.QUALITY_HIGH },
        ],
    })
    public get filteringQuality() {
        return this._frameGraphTask.filteringQuality;
    }

    public set filteringQuality(value: number) {
        this._frameGraphTask.filteringQuality = value;
    }

    /** Gets or sets the ability to have transparent shadow */
    @editableInPropertyPage("Transparency shadow", PropertyTypeForEdition.Boolean, "PROPERTIES")
    public get transparencyShadow() {
        return this._frameGraphTask.transparencyShadow;
    }

    public set transparencyShadow(value: boolean) {
        this._frameGraphTask.transparencyShadow = value;
    }

    /** Enables or disables shadows with varying strength based on the transparency */
    @editableInPropertyPage("Enable soft transparent shadows", PropertyTypeForEdition.Boolean, "PROPERTIES")
    public get enableSoftTransparentShadow() {
        return this._frameGraphTask.enableSoftTransparentShadow;
    }

    public set enableSoftTransparentShadow(value: boolean) {
        this._frameGraphTask.enableSoftTransparentShadow = value;
    }

    /** If this is true, use the opacity texture's alpha channel for transparent shadows instead of the diffuse one */
    @editableInPropertyPage("Use opacity texture for transparent shadows", PropertyTypeForEdition.Boolean, "PROPERTIES")
    public get useOpacityTextureForTransparentShadow() {
        return this._frameGraphTask.useOpacityTextureForTransparentShadow;
    }

    public set useOpacityTextureForTransparentShadow(value: boolean) {
        this._frameGraphTask.useOpacityTextureForTransparentShadow = value;
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "NodeRenderGraphBaseShadowGeneratorBlock";
    }

    /**
     * Gets the light input component
     */
    public get light(): NodeRenderGraphConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the objects input component
     */
    public get objects(): NodeRenderGraphConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the camera input component
     */
    public get camera(): NodeRenderGraphConnectionPoint {
        return this._inputs[2];
    }

    /**
     * Gets the shadow generator component
     */
    public get generator(): NodeRenderGraphConnectionPoint {
        return this._outputs[0];
    }

    /**
     * Gets the output texture component
     */
    public get output(): NodeRenderGraphConnectionPoint {
        return this._outputs[1];
    }

    protected override _buildBlock(state: NodeRenderGraphBuildState) {
        super._buildBlock(state);

        this._frameGraphTask.light = this.light.connectedPoint?.value as IShadowLight;
        this._frameGraphTask.objectList = this.objects.connectedPoint?.value as FrameGraphObjectList;
        this._frameGraphTask.camera = this.camera.connectedPoint?.value as Camera;

        // Important: the shadow generator object is created by the task when we set the light, that's why we must set generator.value after setting the light!
        this.generator.value = this._frameGraphTask;
        this.output.value = this._frameGraphTask.outputTexture;
    }

    protected override _dumpPropertiesCode() {
        const codes: string[] = [];
        codes.push(`${this._codeVariableName}.mapSize = ${this.mapSize};`);
        codes.push(`${this._codeVariableName}.useFloat32TextureType = ${this.useFloat32TextureType};`);
        codes.push(`${this._codeVariableName}.useRedTextureFormat = ${this.useRedTextureFormat};`);
        codes.push(`${this._codeVariableName}.bias = ${this.bias};`);
        codes.push(`${this._codeVariableName}.normalBias = ${this.normalBias};`);
        codes.push(`${this._codeVariableName}.darkness = ${this.darkness};`);
        codes.push(`${this._codeVariableName}.filter = ${this.filter};`);
        codes.push(`${this._codeVariableName}.filteringQuality = ${this.filteringQuality};`);
        codes.push(`${this._codeVariableName}.transparencyShadow = ${this.transparencyShadow};`);
        codes.push(`${this._codeVariableName}.enableSoftTransparentShadow = ${this.enableSoftTransparentShadow};`);
        codes.push(`${this._codeVariableName}.useOpacityTextureForTransparentShadow = ${this.useOpacityTextureForTransparentShadow};`);
        return super._dumpPropertiesCode() + codes.join("\n");
    }

    public override serialize(): any {
        const serializationObject = super.serialize();
        serializationObject.mapSize = this.mapSize;
        serializationObject.useFloat32TextureType = this.useFloat32TextureType;
        serializationObject.useRedTextureFormat = this.useRedTextureFormat;
        serializationObject.bias = this.bias;
        serializationObject.normalBias = this.normalBias;
        serializationObject.darkness = this.darkness;
        serializationObject.filter = this.filter;
        serializationObject.filteringQuality = this.filteringQuality;
        serializationObject.transparencyShadow = this.transparencyShadow;
        serializationObject.enableSoftTransparentShadow = this.enableSoftTransparentShadow;
        serializationObject.useOpacityTextureForTransparentShadow = this.useOpacityTextureForTransparentShadow;
        return serializationObject;
    }

    public override _deserialize(serializationObject: any) {
        super._deserialize(serializationObject);
        this.mapSize = serializationObject.mapSize;
        this.useFloat32TextureType = serializationObject.useFloat32TextureType;
        this.useRedTextureFormat = serializationObject.useRedTextureFormat;
        this.bias = serializationObject.bias;
        this.normalBias = serializationObject.normalBias;
        this.darkness = serializationObject.darkness;
        this.filter = serializationObject.filter;
        this.filteringQuality = serializationObject.filteringQuality;
        this.transparencyShadow = serializationObject.transparencyShadow;
        this.enableSoftTransparentShadow = serializationObject.enableSoftTransparentShadow;
        this.useOpacityTextureForTransparentShadow = serializationObject.useOpacityTextureForTransparentShadow;
    }
}
