import type { NodeRenderGraphConnectionPoint, Scene, NodeRenderGraphBuildState, FrameGraph, FrameGraphTextureHandle, FrameGraphObjectList, Camera } from "core/index";
import { NodeRenderGraphBlock } from "../../nodeRenderGraphBlock";
import { RegisterClass } from "../../../../Misc/typeStore";
import { NodeRenderGraphBlockConnectionPointTypes } from "../../Types/nodeRenderGraphTypes";
import { editableInPropertyPage, PropertyTypeForEdition } from "../../../../Decorators/nodeDecorator";
import { FrameGraphGeometryRendererTask } from "../../../Tasks/Rendering/geometryRendererTask";
import { Constants } from "core/Engines/constants";

/**
 * Block that render geometry of objects to a multi render target
 */
export class NodeRenderGraphGeometryRendererBlock extends NodeRenderGraphBlock {
    protected override _frameGraphTask: FrameGraphGeometryRendererTask;

    public override _additionalConstructionParameters: [boolean, boolean];

    /**
     * Gets the frame graph task associated with this block
     */
    public override get task() {
        return this._frameGraphTask;
    }

    /**
     * Create a new NodeRenderGraphGeometryRendererBlock
     * @param name defines the block name
     * @param frameGraph defines the hosting frame graph
     * @param scene defines the hosting scene
     * @param doNotChangeAspectRatio True (default) to not change the aspect ratio of the scene in the RTT
     * @param enableClusteredLights True (default) to enable clustered lights
     */
    public constructor(name: string, frameGraph: FrameGraph, scene: Scene, doNotChangeAspectRatio = true, enableClusteredLights = true) {
        super(name, frameGraph, scene);

        this._additionalConstructionParameters = [doNotChangeAspectRatio, enableClusteredLights];

        this.registerInput("depth", NodeRenderGraphBlockConnectionPointTypes.AutoDetect, true);
        this.registerInput("camera", NodeRenderGraphBlockConnectionPointTypes.Camera);
        this.registerInput("objects", NodeRenderGraphBlockConnectionPointTypes.ObjectList);
        this._addDependenciesInput();

        this.registerOutput("outputDepth", NodeRenderGraphBlockConnectionPointTypes.BasedOnInput);
        this.registerOutput("geomViewDepth", NodeRenderGraphBlockConnectionPointTypes.TextureViewDepth);
        this.registerOutput("geomNormViewDepth", NodeRenderGraphBlockConnectionPointTypes.TextureNormalizedViewDepth);
        this.registerOutput("geomScreenDepth", NodeRenderGraphBlockConnectionPointTypes.TextureScreenDepth);
        this.registerOutput("geomViewNormal", NodeRenderGraphBlockConnectionPointTypes.TextureViewNormal);
        this.registerOutput("geomWorldNormal", NodeRenderGraphBlockConnectionPointTypes.TextureWorldNormal);
        this.registerOutput("geomLocalPosition", NodeRenderGraphBlockConnectionPointTypes.TextureLocalPosition);
        this.registerOutput("geomWorldPosition", NodeRenderGraphBlockConnectionPointTypes.TextureWorldPosition);
        this.registerOutput("geomAlbedo", NodeRenderGraphBlockConnectionPointTypes.TextureAlbedo);
        this.registerOutput("geomReflectivity", NodeRenderGraphBlockConnectionPointTypes.TextureReflectivity);
        this.registerOutput("geomVelocity", NodeRenderGraphBlockConnectionPointTypes.TextureVelocity);
        this.registerOutput("geomLinearVelocity", NodeRenderGraphBlockConnectionPointTypes.TextureLinearVelocity);

        this.depth.addExcludedConnectionPointFromAllowedTypes(
            NodeRenderGraphBlockConnectionPointTypes.TextureDepthStencilAttachment | NodeRenderGraphBlockConnectionPointTypes.TextureBackBufferDepthStencilAttachment
        );

        this.outputDepth._typeConnectionSource = this.depth;

        this._frameGraphTask = new FrameGraphGeometryRendererTask(this.name, frameGraph, scene, { doNotChangeAspectRatio, enableClusteredLights });
    }

    /** Indicates if depth testing must be enabled or disabled */
    @editableInPropertyPage("Depth test", PropertyTypeForEdition.Boolean, "PROPERTIES")
    public get depthTest() {
        return this._frameGraphTask.depthTest;
    }

    public set depthTest(value: boolean) {
        this._frameGraphTask.depthTest = value;
    }

    /** Indicates if depth writing must be enabled or disabled */
    @editableInPropertyPage("Depth write", PropertyTypeForEdition.Boolean, "PROPERTIES")
    public get depthWrite() {
        return this._frameGraphTask.depthWrite;
    }

    public set depthWrite(value: boolean) {
        this._frameGraphTask.depthWrite = value;
    }

    /** Indicates if layer mask check must be forced */
    @editableInPropertyPage("Force layer mask check", PropertyTypeForEdition.Boolean, "PROPERTIES")
    public get forceLayerMaskCheck() {
        return this._frameGraphTask.forceLayerMaskCheck;
    }

    public set forceLayerMaskCheck(value: boolean) {
        this._frameGraphTask.forceLayerMaskCheck = value;
    }

    protected _recreateFrameGraphObject(doNotChangeAspectRatio: boolean, enableClusteredLights: boolean): void {
        const disabled = this._frameGraphTask.disabled;
        const depthTest = this.depthTest;
        const depthWrite = this.depthWrite;
        const width = this.width;
        const height = this.height;
        const forceLayerMaskCheck = this.forceLayerMaskCheck;
        const sizeInPercentage = this.sizeInPercentage;
        const samples = this.samples;
        const reverseCulling = this.reverseCulling;
        const dontRenderWhenMaterialDepthWriteIsDisabled = this.dontRenderWhenMaterialDepthWriteIsDisabled;

        this._frameGraphTask.dispose();
        this._frameGraphTask = new FrameGraphGeometryRendererTask(this.name, this._frameGraph, this._scene, {
            doNotChangeAspectRatio: doNotChangeAspectRatio,
            enableClusteredLights: enableClusteredLights,
        });
        this._additionalConstructionParameters = [doNotChangeAspectRatio, enableClusteredLights];

        this.depthTest = depthTest;
        this.depthWrite = depthWrite;
        this.width = width;
        this.height = height;
        this.forceLayerMaskCheck = forceLayerMaskCheck;
        this.sizeInPercentage = sizeInPercentage;
        this.samples = samples;
        this.reverseCulling = reverseCulling;
        this.dontRenderWhenMaterialDepthWriteIsDisabled = dontRenderWhenMaterialDepthWriteIsDisabled;
        this._frameGraphTask.disabled = disabled;
    }

    /** True (default) to not change the aspect ratio of the scene in the RTT */
    @editableInPropertyPage("Do not change aspect ratio", PropertyTypeForEdition.Boolean, "PROPERTIES")
    public get doNotChangeAspectRatio() {
        return this._frameGraphTask.objectRenderer.options.doNotChangeAspectRatio;
    }

    public set doNotChangeAspectRatio(value: boolean) {
        this._recreateFrameGraphObject(value, this.enableClusteredLights);
    }

    /** True (default) to enable clustered lights */
    @editableInPropertyPage("Enable clustered lights", PropertyTypeForEdition.Boolean, "PROPERTIES")
    public get enableClusteredLights() {
        return this._frameGraphTask.objectRenderer.options.enableClusteredLights;
    }

    public set enableClusteredLights(value: boolean) {
        this._recreateFrameGraphObject(this.doNotChangeAspectRatio, value);
    }

    /** Width of the geometry texture */
    @editableInPropertyPage("Texture width", PropertyTypeForEdition.Int, "PROPERTIES")
    public get width() {
        return this._frameGraphTask.size.width;
    }

    public set width(value: number) {
        this._frameGraphTask.size.width = value;
    }

    /** Height of the geometry texture */
    @editableInPropertyPage("Texture height", PropertyTypeForEdition.Int, "PROPERTIES")
    public get height() {
        return this._frameGraphTask.size.height;
    }

    public set height(value: number) {
        this._frameGraphTask.size.height = value;
    }

    /** Indicates if the geometry texture width and height are percentages or absolute values */
    @editableInPropertyPage("Size is in percentage", PropertyTypeForEdition.Boolean, "PROPERTIES")
    public get sizeInPercentage() {
        return this._frameGraphTask.sizeIsPercentage;
    }

    public set sizeInPercentage(value: boolean) {
        this._frameGraphTask.sizeIsPercentage = value;
    }

    /** Number of samples of the geometry texture */
    @editableInPropertyPage("Samples", PropertyTypeForEdition.Int, "PROPERTIES", { min: 1, max: 8 })
    public get samples() {
        return this._frameGraphTask.samples;
    }

    public set samples(value: number) {
        this._frameGraphTask.samples = value;
    }

    /** Indicates if culling must be reversed */
    @editableInPropertyPage("Reverse culling", PropertyTypeForEdition.Boolean, "PROPERTIES")
    public get reverseCulling() {
        return this._frameGraphTask.reverseCulling;
    }

    public set reverseCulling(value: boolean) {
        this._frameGraphTask.reverseCulling = value;
    }

    /** Indicates if a mesh shouldn't be rendered when its material has depth write disabled */
    @editableInPropertyPage("Don't render if material depth write is disabled", PropertyTypeForEdition.Boolean, "PROPERTIES")
    public get dontRenderWhenMaterialDepthWriteIsDisabled() {
        return this._frameGraphTask.dontRenderWhenMaterialDepthWriteIsDisabled;
    }

    public set dontRenderWhenMaterialDepthWriteIsDisabled(value: boolean) {
        this._frameGraphTask.dontRenderWhenMaterialDepthWriteIsDisabled = value;
    }

    // View depth
    @editableInPropertyPage("View depth format", PropertyTypeForEdition.TextureFormat, "GEOMETRY BUFFERS")
    public viewDepthFormat = Constants.TEXTUREFORMAT_RED;

    @editableInPropertyPage("View depth type", PropertyTypeForEdition.TextureType, "GEOMETRY BUFFERS")
    public viewDepthType = Constants.TEXTURETYPE_FLOAT;

    // Normalized view depth
    @editableInPropertyPage("Normalized view depth format", PropertyTypeForEdition.TextureFormat, "GEOMETRY BUFFERS")
    public normalizedViewDepthFormat = Constants.TEXTUREFORMAT_RED;

    @editableInPropertyPage("Normalized view depth type", PropertyTypeForEdition.TextureType, "GEOMETRY BUFFERS")
    public normalizedViewDepthType = Constants.TEXTURETYPE_HALF_FLOAT;

    // Screen depth
    @editableInPropertyPage("Screen depth format", PropertyTypeForEdition.TextureFormat, "GEOMETRY BUFFERS")
    public screenDepthFormat = Constants.TEXTUREFORMAT_RED;

    @editableInPropertyPage("Screen depth type", PropertyTypeForEdition.TextureType, "GEOMETRY BUFFERS")
    public screenDepthType = Constants.TEXTURETYPE_FLOAT;

    // View normal
    @editableInPropertyPage("View normal format", PropertyTypeForEdition.TextureFormat, "GEOMETRY BUFFERS")
    public viewNormalFormat = Constants.TEXTUREFORMAT_RGBA;

    @editableInPropertyPage("View normal type", PropertyTypeForEdition.TextureType, "GEOMETRY BUFFERS")
    public viewNormalType = Constants.TEXTURETYPE_HALF_FLOAT;

    // World normal
    @editableInPropertyPage("World normal format", PropertyTypeForEdition.TextureFormat, "GEOMETRY BUFFERS")
    public worldNormalFormat = Constants.TEXTUREFORMAT_RGBA;

    @editableInPropertyPage("World normal type", PropertyTypeForEdition.TextureType, "GEOMETRY BUFFERS")
    public worldNormalType = Constants.TEXTURETYPE_UNSIGNED_BYTE;

    // Local position
    @editableInPropertyPage("Local position format", PropertyTypeForEdition.TextureFormat, "GEOMETRY BUFFERS")
    public localPositionFormat = Constants.TEXTUREFORMAT_RGBA;

    @editableInPropertyPage("Local position type", PropertyTypeForEdition.TextureType, "GEOMETRY BUFFERS")
    public localPositionType = Constants.TEXTURETYPE_HALF_FLOAT;

    // World Position
    @editableInPropertyPage("World position format", PropertyTypeForEdition.TextureFormat, "GEOMETRY BUFFERS")
    public worldPositionFormat = Constants.TEXTUREFORMAT_RGBA;

    @editableInPropertyPage("World position type", PropertyTypeForEdition.TextureType, "GEOMETRY BUFFERS")
    public worldPositionType = Constants.TEXTURETYPE_HALF_FLOAT;

    // Albedo
    @editableInPropertyPage("Albedo format", PropertyTypeForEdition.TextureFormat, "GEOMETRY BUFFERS")
    public albedoFormat = Constants.TEXTUREFORMAT_RGBA;

    @editableInPropertyPage("Albedo type", PropertyTypeForEdition.TextureType, "GEOMETRY BUFFERS")
    public albedoType = Constants.TEXTURETYPE_UNSIGNED_BYTE;

    // Reflectivity
    @editableInPropertyPage("Reflectivity format", PropertyTypeForEdition.TextureFormat, "GEOMETRY BUFFERS")
    public reflectivityFormat = Constants.TEXTUREFORMAT_RGBA;

    @editableInPropertyPage("Reflectivity type", PropertyTypeForEdition.TextureType, "GEOMETRY BUFFERS")
    public reflectivityType = Constants.TEXTURETYPE_UNSIGNED_BYTE;

    // Velocity
    @editableInPropertyPage("Velocity format", PropertyTypeForEdition.TextureFormat, "GEOMETRY BUFFERS")
    public velocityFormat = Constants.TEXTUREFORMAT_RGBA;

    @editableInPropertyPage("Velocity type", PropertyTypeForEdition.TextureType, "GEOMETRY BUFFERS")
    public velocityType = Constants.TEXTURETYPE_UNSIGNED_BYTE;

    // Linear velocity
    @editableInPropertyPage("Linear velocity format", PropertyTypeForEdition.TextureFormat, "GEOMETRY BUFFERS")
    public linearVelocityFormat = Constants.TEXTUREFORMAT_RGBA;

    @editableInPropertyPage("Linear velocity type", PropertyTypeForEdition.TextureType, "GEOMETRY BUFFERS")
    public linearVelocityType = Constants.TEXTURETYPE_UNSIGNED_BYTE;

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "NodeRenderGraphGeometryRendererBlock";
    }

    /**
     * Gets the depth texture input component
     */
    public get depth(): NodeRenderGraphConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the camera input component
     */
    public get camera(): NodeRenderGraphConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the objects input component
     */
    public get objects(): NodeRenderGraphConnectionPoint {
        return this._inputs[2];
    }

    /**
     * Gets the output depth component
     */
    public get outputDepth(): NodeRenderGraphConnectionPoint {
        return this._outputs[0];
    }

    /**
     * Gets the geometry view depth component
     */
    public get geomViewDepth(): NodeRenderGraphConnectionPoint {
        return this._outputs[1];
    }

    /**
     * Gets the geometry normalized view depth component
     */
    public get geomNormViewDepth(): NodeRenderGraphConnectionPoint {
        return this._outputs[2];
    }

    /**
     * Gets the geometry screen depth component
     */
    public get geomScreenDepth(): NodeRenderGraphConnectionPoint {
        return this._outputs[3];
    }

    /**
     * Gets the geometry view normal component
     */
    public get geomViewNormal(): NodeRenderGraphConnectionPoint {
        return this._outputs[4];
    }

    /**
     * Gets the world geometry normal component
     */
    public get geomWorldNormal(): NodeRenderGraphConnectionPoint {
        return this._outputs[5];
    }

    /**
     * Gets the geometry local position component
     */
    public get geomLocalPosition(): NodeRenderGraphConnectionPoint {
        return this._outputs[6];
    }

    /**
     * Gets the geometry world position component
     */
    public get geomWorldPosition(): NodeRenderGraphConnectionPoint {
        return this._outputs[7];
    }

    /**
     * Gets the geometry albedo component
     */
    public get geomAlbedo(): NodeRenderGraphConnectionPoint {
        return this._outputs[8];
    }

    /**
     * Gets the geometry reflectivity component
     */
    public get geomReflectivity(): NodeRenderGraphConnectionPoint {
        return this._outputs[9];
    }

    /**
     * Gets the geometry velocity component
     */
    public get geomVelocity(): NodeRenderGraphConnectionPoint {
        return this._outputs[10];
    }

    /**
     * Gets the geometry linear velocity component
     */
    public get geomLinearVelocity(): NodeRenderGraphConnectionPoint {
        return this._outputs[11];
    }

    protected override _buildBlock(state: NodeRenderGraphBuildState) {
        super._buildBlock(state);

        const textureActivation = [
            this.geomViewDepth.isConnected,
            this.geomNormViewDepth.isConnected,
            this.geomScreenDepth.isConnected,
            this.geomViewNormal.isConnected,
            this.geomWorldNormal.isConnected,
            this.geomLocalPosition.isConnected,
            this.geomWorldPosition.isConnected,
            this.geomAlbedo.isConnected,
            this.geomReflectivity.isConnected,
            this.geomVelocity.isConnected,
            this.geomLinearVelocity.isConnected,
        ];

        this.outputDepth.value = this._frameGraphTask.outputDepthTexture;
        this.geomViewDepth.value = this._frameGraphTask.geometryViewDepthTexture;
        this.geomNormViewDepth.value = this._frameGraphTask.geometryNormViewDepthTexture;
        this.geomScreenDepth.value = this._frameGraphTask.geometryScreenDepthTexture;
        this.geomViewNormal.value = this._frameGraphTask.geometryViewNormalTexture;
        this.geomWorldNormal.value = this._frameGraphTask.geometryWorldNormalTexture;
        this.geomLocalPosition.value = this._frameGraphTask.geometryLocalPositionTexture;
        this.geomWorldPosition.value = this._frameGraphTask.geometryWorldPositionTexture;
        this.geomAlbedo.value = this._frameGraphTask.geometryAlbedoTexture;
        this.geomReflectivity.value = this._frameGraphTask.geometryReflectivityTexture;
        this.geomVelocity.value = this._frameGraphTask.geometryVelocityTexture;
        this.geomLinearVelocity.value = this._frameGraphTask.geometryLinearVelocityTexture;

        this._frameGraphTask.depthTexture = this.depth.connectedPoint?.value as FrameGraphTextureHandle;
        this._frameGraphTask.camera = this.camera.connectedPoint?.value as Camera;
        this._frameGraphTask.objectList = this.objects.connectedPoint?.value as FrameGraphObjectList;

        this._frameGraphTask.textureDescriptions = [];

        const textureFormats = [
            this.viewDepthFormat,
            this.normalizedViewDepthFormat,
            this.screenDepthFormat,
            this.viewNormalFormat,
            this.worldNormalFormat,
            this.localPositionFormat,
            this.worldPositionFormat,
            this.albedoFormat,
            this.reflectivityFormat,
            this.velocityFormat,
            this.linearVelocityFormat,
        ];
        const textureTypes = [
            this.viewDepthType,
            this.normalizedViewDepthType,
            this.screenDepthType,
            this.viewNormalType,
            this.worldNormalType,
            this.localPositionType,
            this.worldPositionType,
            this.albedoType,
            this.reflectivityType,
            this.velocityType,
            this.linearVelocityType,
        ];
        const bufferTypes = [
            Constants.PREPASS_DEPTH_TEXTURE_TYPE,
            Constants.PREPASS_NORMALIZED_VIEW_DEPTH_TEXTURE_TYPE,
            Constants.PREPASS_SCREENSPACE_DEPTH_TEXTURE_TYPE,
            Constants.PREPASS_NORMAL_TEXTURE_TYPE,
            Constants.PREPASS_WORLD_NORMAL_TEXTURE_TYPE,
            Constants.PREPASS_LOCAL_POSITION_TEXTURE_TYPE,
            Constants.PREPASS_POSITION_TEXTURE_TYPE,
            Constants.PREPASS_ALBEDO_TEXTURE_TYPE,
            Constants.PREPASS_REFLECTIVITY_TEXTURE_TYPE,
            Constants.PREPASS_VELOCITY_TEXTURE_TYPE,
            Constants.PREPASS_VELOCITY_LINEAR_TEXTURE_TYPE,
        ];

        for (let i = 0; i < textureActivation.length; i++) {
            if (textureActivation[i]) {
                this._frameGraphTask.textureDescriptions.push({
                    textureFormat: textureFormats[i],
                    textureType: textureTypes[i],
                    type: bufferTypes[i],
                });
            }
        }
    }

    protected override _dumpPropertiesCode() {
        const codes: string[] = [];
        codes.push(`${this._codeVariableName}.depthTest = ${this.depthTest};`);
        codes.push(`${this._codeVariableName}.depthWrite = ${this.depthWrite};`);
        codes.push(`${this._codeVariableName}.forceLayerMaskCheck = ${this.forceLayerMaskCheck};`);
        codes.push(`${this._codeVariableName}.samples = ${this.samples};`);
        codes.push(`${this._codeVariableName}.reverseCulling = ${this.reverseCulling};`);
        codes.push(`${this._codeVariableName}.dontRenderWhenMaterialDepthWriteIsDisabled = ${this.dontRenderWhenMaterialDepthWriteIsDisabled};`);
        codes.push(`${this._codeVariableName}.viewDepthFormat = ${this.viewDepthFormat};`);
        codes.push(`${this._codeVariableName}.viewDepthType = ${this.viewDepthType};`);
        codes.push(`${this._codeVariableName}.normalizedViewDepthFormat = ${this.normalizedViewDepthFormat};`);
        codes.push(`${this._codeVariableName}.normalizedViewDepthType = ${this.normalizedViewDepthType};`);
        codes.push(`${this._codeVariableName}.screenDepthFormat = ${this.screenDepthFormat};`);
        codes.push(`${this._codeVariableName}.screenDepthType = ${this.screenDepthType};`);
        codes.push(`${this._codeVariableName}.localPositionFormat = ${this.localPositionFormat};`);
        codes.push(`${this._codeVariableName}.localPositionType = ${this.localPositionType};`);
        codes.push(`${this._codeVariableName}.worldPositionFormat = ${this.worldPositionFormat};`);
        codes.push(`${this._codeVariableName}.worldPositionType = ${this.worldPositionType};`);
        codes.push(`${this._codeVariableName}.viewNormalFormat = ${this.viewNormalFormat};`);
        codes.push(`${this._codeVariableName}.viewNormalType = ${this.viewNormalType};`);
        codes.push(`${this._codeVariableName}.worldNormalFormat = ${this.worldNormalFormat};`);
        codes.push(`${this._codeVariableName}.worldNormalType = ${this.worldNormalType};`);
        codes.push(`${this._codeVariableName}.albedoFormat = ${this.albedoFormat};`);
        codes.push(`${this._codeVariableName}.albedoType = ${this.albedoType};`);
        codes.push(`${this._codeVariableName}.reflectivityFormat = ${this.reflectivityFormat};`);
        codes.push(`${this._codeVariableName}.reflectivityType = ${this.reflectivityType};`);
        codes.push(`${this._codeVariableName}.velocityFormat = ${this.velocityFormat};`);
        codes.push(`${this._codeVariableName}.velocityType = ${this.velocityType};`);
        codes.push(`${this._codeVariableName}.linearVelocityFormat = ${this.linearVelocityFormat};`);
        codes.push(`${this._codeVariableName}.linearVelocityType = ${this.linearVelocityType};`);
        return super._dumpPropertiesCode() + codes.join("\n");
    }

    public override serialize(): any {
        const serializationObject = super.serialize();
        serializationObject.depthTest = this.depthTest;
        serializationObject.depthWrite = this.depthWrite;
        serializationObject.forceLayerMaskCheck = this.forceLayerMaskCheck;
        serializationObject.samples = this.samples;
        serializationObject.reverseCulling = this.reverseCulling;
        serializationObject.dontRenderWhenMaterialDepthWriteIsDisabled = this.dontRenderWhenMaterialDepthWriteIsDisabled;
        serializationObject.viewDepthFormat = this.viewDepthFormat;
        serializationObject.viewDepthType = this.viewDepthType;
        serializationObject.normalizedViewDepthFormat = this.normalizedViewDepthFormat;
        serializationObject.normalizedViewDepthType = this.normalizedViewDepthType;
        serializationObject.screenDepthFormat = this.screenDepthFormat;
        serializationObject.screenDepthType = this.screenDepthType;
        serializationObject.localPositionFormat = this.localPositionFormat;
        serializationObject.localPositionType = this.localPositionType;
        serializationObject.worldPositionFormat = this.worldPositionFormat;
        serializationObject.worldPositionType = this.worldPositionType;
        serializationObject.viewNormalFormat = this.viewNormalFormat;
        serializationObject.viewNormalType = this.viewNormalType;
        serializationObject.worldNormalFormat = this.worldNormalFormat;
        serializationObject.worldNormalType = this.worldNormalType;
        serializationObject.albedoFormat = this.albedoFormat;
        serializationObject.albedoType = this.albedoType;
        serializationObject.reflectivityFormat = this.reflectivityFormat;
        serializationObject.reflectivityType = this.reflectivityType;
        serializationObject.velocityFormat = this.velocityFormat;
        serializationObject.velocityType = this.velocityType;
        serializationObject.linearVelocityFormat = this.linearVelocityFormat;
        serializationObject.linearVelocityType = this.linearVelocityType;
        return serializationObject;
    }

    public override _deserialize(serializationObject: any) {
        super._deserialize(serializationObject);
        this.depthTest = serializationObject.depthTest;
        this.depthWrite = serializationObject.depthWrite;
        this.forceLayerMaskCheck = !!serializationObject.forceLayerMaskCheck;
        this.samples = serializationObject.samples;
        this.reverseCulling = serializationObject.reverseCulling;
        this.dontRenderWhenMaterialDepthWriteIsDisabled = serializationObject.dontRenderWhenMaterialDepthWriteIsDisabled;
        this.viewDepthFormat = serializationObject.viewDepthFormat;
        this.viewDepthType = serializationObject.viewDepthType;
        this.normalizedViewDepthFormat = serializationObject.normalizedViewDepthFormat ?? Constants.TEXTUREFORMAT_RED;
        this.normalizedViewDepthType = serializationObject.normalizedViewDepthType ?? Constants.TEXTURETYPE_UNSIGNED_BYTE;
        this.screenDepthFormat = serializationObject.screenDepthFormat;
        this.screenDepthType = serializationObject.screenDepthType;
        this.localPositionFormat = serializationObject.localPositionFormat;
        this.localPositionType = serializationObject.localPositionType;
        this.worldPositionFormat = serializationObject.worldPositionFormat;
        this.worldPositionType = serializationObject.worldPositionType;
        this.viewNormalFormat = serializationObject.viewNormalFormat;
        this.viewNormalType = serializationObject.viewNormalType;
        this.worldNormalFormat = serializationObject.worldNormalFormat;
        this.worldNormalType = serializationObject.worldNormalType;
        this.albedoFormat = serializationObject.albedoFormat;
        this.albedoType = serializationObject.albedoType;
        this.reflectivityFormat = serializationObject.reflectivityFormat;
        this.reflectivityType = serializationObject.reflectivityType;
        this.velocityFormat = serializationObject.velocityFormat;
        this.velocityType = serializationObject.velocityType;
        this.linearVelocityFormat = serializationObject.linearVelocityFormat;
        this.linearVelocityType = serializationObject.linearVelocityType;
    }
}

RegisterClass("BABYLON.NodeRenderGraphGeometryRendererBlock", NodeRenderGraphGeometryRendererBlock);
