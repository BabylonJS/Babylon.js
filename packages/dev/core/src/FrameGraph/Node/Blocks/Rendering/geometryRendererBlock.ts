import type { NodeRenderGraphConnectionPoint, Scene, NodeRenderGraphBuildState, FrameGraph } from "core/index";
import { NodeRenderGraphBaseObjectRendererBlock } from "./baseObjectRendererBlock";
import { RegisterClass } from "../../../../Misc/typeStore";
import { NodeRenderGraphBlockConnectionPointTypes } from "../../Types/nodeRenderGraphTypes";
import { editableInPropertyPage, PropertyTypeForEdition } from "../../../../Decorators/nodeDecorator";
import { FrameGraphGeometryRendererTask } from "../../../Tasks/Rendering/geometryRendererTask";
import { Constants } from "core/Engines/constants";

/**
 * Block that render geometry of objects to a multi render target
 */
export class NodeRenderGraphGeometryRendererBlock extends NodeRenderGraphBaseObjectRendererBlock {
    protected override _frameGraphTask: FrameGraphGeometryRendererTask;

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

        this.getInputByName("target")!.isOptional = true;

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

        this._frameGraphTask = new FrameGraphGeometryRendererTask(this.name, frameGraph, scene, { doNotChangeAspectRatio, enableClusteredLights });
    }

    protected override _createFrameGraphObject(): void {
        this._frameGraphTask?.dispose();
        this._frameGraphTask = new FrameGraphGeometryRendererTask(this.name, this._frameGraph, this._scene, {
            doNotChangeAspectRatio: this._additionalConstructionParameters![0] as boolean,
            enableClusteredLights: this._additionalConstructionParameters![1] as boolean,
        });
    }

    protected override _saveState(state: { [key: string]: any }) {
        super._saveState(state);
        state.disabled = this._frameGraphTask.disabled;
        state.isMainObjectRenderer = this.isMainObjectRenderer;
        state.depthTest = this.depthTest;
        state.depthWrite = this.depthWrite;
        state.disableShadows = this.disableShadows;
        state.renderInLinearSpace = this.renderInLinearSpace;
        state.renderParticles = this.renderParticles;
        state.renderSprites = this.renderSprites;
        state.forceLayerMaskCheck = this.forceLayerMaskCheck;
        state.enableBoundingBoxRendering = this.enableBoundingBoxRendering;
        state.enableOutlineRendering = this.enableOutlineRendering;

        state.width = this.width;
        state.height = this.height;
        state.sizeInPercentage = this.sizeInPercentage;
        state.samples = this.samples;
        state.reverseCulling = this.reverseCulling;
        state.dontRenderWhenMaterialDepthWriteIsDisabled = this.dontRenderWhenMaterialDepthWriteIsDisabled;
        state.disableDepthPrePass = this.disableDepthPrePass;
    }

    protected override _restoreState(state: { [key: string]: any }) {
        super._restoreState(state);
        this._frameGraphTask.disabled = state.disabled;
        this.isMainObjectRenderer = state.isMainObjectRenderer;
        this.depthTest = state.depthTest;
        this.depthWrite = state.depthWrite;
        this.disableShadows = state.disableShadows;
        this.renderInLinearSpace = state.renderInLinearSpace;
        this.renderParticles = state.renderParticles;
        this.renderSprites = state.renderSprites;
        this.forceLayerMaskCheck = state.forceLayerMaskCheck;
        this.enableBoundingBoxRendering = state.enableBoundingBoxRendering;
        this.enableOutlineRendering = state.enableOutlineRendering;

        this.width = state.width;
        this.height = state.height;
        this.sizeInPercentage = state.sizeInPercentage;
        this.samples = state.samples;
        this.reverseCulling = state.reverseCulling;
        this.dontRenderWhenMaterialDepthWriteIsDisabled = state.dontRenderWhenMaterialDepthWriteIsDisabled;
        this.disableDepthPrePass = state.disableDepthPrePass;
    }

    /** Width of the geometry texture */
    @editableInPropertyPage("Texture width", PropertyTypeForEdition.Int, "GEOMETRY")
    public get width() {
        return this._frameGraphTask.size.width;
    }

    public set width(value: number) {
        this._frameGraphTask.size.width = value;
    }

    /** Height of the geometry texture */
    @editableInPropertyPage("Texture height", PropertyTypeForEdition.Int, "GEOMETRY")
    public get height() {
        return this._frameGraphTask.size.height;
    }

    public set height(value: number) {
        this._frameGraphTask.size.height = value;
    }

    /** Indicates if the geometry texture width and height are percentages or absolute values */
    @editableInPropertyPage("Size is in percentage", PropertyTypeForEdition.Boolean, "GEOMETRY")
    public get sizeInPercentage() {
        return this._frameGraphTask.sizeIsPercentage;
    }

    public set sizeInPercentage(value: boolean) {
        this._frameGraphTask.sizeIsPercentage = value;
    }

    /** Number of samples of the geometry texture */
    @editableInPropertyPage("Samples", PropertyTypeForEdition.Int, "GEOMETRY", { min: 1, max: 8 })
    public get samples() {
        return this._frameGraphTask.samples;
    }

    public set samples(value: number) {
        this._frameGraphTask.samples = value;
    }

    /** Indicates if culling must be reversed */
    @editableInPropertyPage("Reverse culling", PropertyTypeForEdition.Boolean, "GEOMETRY")
    public get reverseCulling() {
        return this._frameGraphTask.reverseCulling;
    }

    public set reverseCulling(value: boolean) {
        this._frameGraphTask.reverseCulling = value;
    }

    /** Indicates if a mesh shouldn't be rendered when its material has depth write disabled */
    @editableInPropertyPage("Don't render if material depth write is disabled", PropertyTypeForEdition.Boolean, "GEOMETRY")
    public get dontRenderWhenMaterialDepthWriteIsDisabled() {
        return this._frameGraphTask.dontRenderWhenMaterialDepthWriteIsDisabled;
    }

    public set dontRenderWhenMaterialDepthWriteIsDisabled(value: boolean) {
        this._frameGraphTask.dontRenderWhenMaterialDepthWriteIsDisabled = value;
    }

    /** Indicates if depth pre-pass must be disabled */
    @editableInPropertyPage("Disable depth pre-pass", PropertyTypeForEdition.Boolean, "GEOMETRY")
    public get disableDepthPrePass() {
        return this._frameGraphTask.disableDepthPrePass;
    }

    public set disableDepthPrePass(value: boolean) {
        this._frameGraphTask.disableDepthPrePass = value;
    }

    // View depth
    @editableInPropertyPage("Format", PropertyTypeForEdition.TextureFormat, "OUTPUT - VIEW DEPTH")
    public viewDepthFormat = Constants.TEXTUREFORMAT_RED;

    @editableInPropertyPage("Type", PropertyTypeForEdition.TextureType, "OUTPUT - VIEW DEPTH")
    public viewDepthType = Constants.TEXTURETYPE_FLOAT;

    // Normalized view depth
    @editableInPropertyPage("Format", PropertyTypeForEdition.TextureFormat, "OUTPUT - NORMALIZED VIEW DEPTH")
    public normalizedViewDepthFormat = Constants.TEXTUREFORMAT_RED;

    @editableInPropertyPage("Type", PropertyTypeForEdition.TextureType, "OUTPUT - NORMALIZED VIEW DEPTH")
    public normalizedViewDepthType = Constants.TEXTURETYPE_HALF_FLOAT;

    // Screen depth
    @editableInPropertyPage("Format", PropertyTypeForEdition.TextureFormat, "OUTPUT - SCREEN DEPTH")
    public screenDepthFormat = Constants.TEXTUREFORMAT_RED;

    @editableInPropertyPage("Type", PropertyTypeForEdition.TextureType, "OUTPUT - SCREEN DEPTH")
    public screenDepthType = Constants.TEXTURETYPE_FLOAT;

    // View normal
    @editableInPropertyPage("Format", PropertyTypeForEdition.TextureFormat, "OUTPUT - VIEW NORMAL")
    public viewNormalFormat = Constants.TEXTUREFORMAT_RGBA;

    @editableInPropertyPage("Type", PropertyTypeForEdition.TextureType, "OUTPUT - VIEW NORMAL")
    public viewNormalType = Constants.TEXTURETYPE_HALF_FLOAT;

    // World normal
    @editableInPropertyPage("Format", PropertyTypeForEdition.TextureFormat, "OUTPUT - WORLD NORMAL")
    public worldNormalFormat = Constants.TEXTUREFORMAT_RGBA;

    @editableInPropertyPage("Type", PropertyTypeForEdition.TextureType, "OUTPUT - WORLD NORMAL")
    public worldNormalType = Constants.TEXTURETYPE_UNSIGNED_BYTE;

    // Local position
    @editableInPropertyPage("Format", PropertyTypeForEdition.TextureFormat, "OUTPUT - LOCAL POSITION")
    public localPositionFormat = Constants.TEXTUREFORMAT_RGBA;

    @editableInPropertyPage("Type", PropertyTypeForEdition.TextureType, "OUTPUT - LOCAL POSITION")
    public localPositionType = Constants.TEXTURETYPE_HALF_FLOAT;

    // World Position
    @editableInPropertyPage("Format", PropertyTypeForEdition.TextureFormat, "OUTPUT - WORLD POSITION")
    public worldPositionFormat = Constants.TEXTUREFORMAT_RGBA;

    @editableInPropertyPage("Type", PropertyTypeForEdition.TextureType, "OUTPUT - WORLD POSITION")
    public worldPositionType = Constants.TEXTURETYPE_HALF_FLOAT;

    // Albedo
    @editableInPropertyPage("Format", PropertyTypeForEdition.TextureFormat, "OUTPUT - ALBEDO")
    public albedoFormat = Constants.TEXTUREFORMAT_RGBA;

    @editableInPropertyPage("Type", PropertyTypeForEdition.TextureType, "OUTPUT - ALBEDO")
    public albedoType = Constants.TEXTURETYPE_UNSIGNED_BYTE;

    // Reflectivity
    @editableInPropertyPage("Format", PropertyTypeForEdition.TextureFormat, "OUTPUT - REFLECTIVITY")
    public reflectivityFormat = Constants.TEXTUREFORMAT_RGBA;

    @editableInPropertyPage("Type", PropertyTypeForEdition.TextureType, "OUTPUT - REFLECTIVITY")
    public reflectivityType = Constants.TEXTURETYPE_UNSIGNED_BYTE;

    // Velocity
    @editableInPropertyPage("Format", PropertyTypeForEdition.TextureFormat, "OUTPUT - VELOCITY")
    public velocityFormat = Constants.TEXTUREFORMAT_RGBA;

    @editableInPropertyPage("Type", PropertyTypeForEdition.TextureType, "OUTPUT - VELOCITY")
    public velocityType = Constants.TEXTURETYPE_UNSIGNED_BYTE;

    // Linear velocity
    @editableInPropertyPage("Format", PropertyTypeForEdition.TextureFormat, "OUTPUT - LINEAR VELOCITY")
    public linearVelocityFormat = Constants.TEXTUREFORMAT_RGBA;

    @editableInPropertyPage("Type", PropertyTypeForEdition.TextureType, "OUTPUT - LINEAR VELOCITY")
    public linearVelocityType = Constants.TEXTURETYPE_HALF_FLOAT;

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "NodeRenderGraphGeometryRendererBlock";
    }

    /**
     * Gets the geometry view depth component
     */
    public get geomViewDepth(): NodeRenderGraphConnectionPoint {
        return this._outputs[3];
    }

    /**
     * Gets the geometry normalized view depth component
     */
    public get geomNormViewDepth(): NodeRenderGraphConnectionPoint {
        return this._outputs[4];
    }

    /**
     * Gets the geometry screen depth component
     */
    public get geomScreenDepth(): NodeRenderGraphConnectionPoint {
        return this._outputs[5];
    }

    /**
     * Gets the geometry view normal component
     */
    public get geomViewNormal(): NodeRenderGraphConnectionPoint {
        return this._outputs[6];
    }

    /**
     * Gets the world geometry normal component
     */
    public get geomWorldNormal(): NodeRenderGraphConnectionPoint {
        return this._outputs[7];
    }

    /**
     * Gets the geometry local position component
     */
    public get geomLocalPosition(): NodeRenderGraphConnectionPoint {
        return this._outputs[8];
    }

    /**
     * Gets the geometry world position component
     */
    public get geomWorldPosition(): NodeRenderGraphConnectionPoint {
        return this._outputs[9];
    }

    /**
     * Gets the geometry albedo component
     */
    public get geomAlbedo(): NodeRenderGraphConnectionPoint {
        return this._outputs[10];
    }

    /**
     * Gets the geometry reflectivity component
     */
    public get geomReflectivity(): NodeRenderGraphConnectionPoint {
        return this._outputs[11];
    }

    /**
     * Gets the geometry velocity component
     */
    public get geomVelocity(): NodeRenderGraphConnectionPoint {
        return this._outputs[12];
    }

    /**
     * Gets the geometry linear velocity component
     */
    public get geomLinearVelocity(): NodeRenderGraphConnectionPoint {
        return this._outputs[13];
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
        codes.push(`${this._codeVariableName}.size = { width: ${this.width}, height: ${this.height} };`);
        codes.push(`${this._codeVariableName}.sizeInPercentage = ${this.sizeInPercentage};`);
        codes.push(`${this._codeVariableName}.samples = ${this.samples};`);
        codes.push(`${this._codeVariableName}.reverseCulling = ${this.reverseCulling};`);
        codes.push(`${this._codeVariableName}.dontRenderWhenMaterialDepthWriteIsDisabled = ${this.dontRenderWhenMaterialDepthWriteIsDisabled};`);
        codes.push(`${this._codeVariableName}.disableDepthPrePass = ${this.disableDepthPrePass};`);
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
        serializationObject.sizeInPercentage = this.sizeInPercentage;
        serializationObject.width = this.width;
        serializationObject.height = this.height;
        serializationObject.samples = this.samples;
        serializationObject.reverseCulling = this.reverseCulling;
        serializationObject.dontRenderWhenMaterialDepthWriteIsDisabled = this.dontRenderWhenMaterialDepthWriteIsDisabled;
        serializationObject.disableDepthPrePass = this.disableDepthPrePass;
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
        this.sizeInPercentage = !!serializationObject.sizeInPercentage;
        this.width = serializationObject.width ?? 100;
        this.height = serializationObject.height ?? 100;
        this.samples = serializationObject.samples;
        this.reverseCulling = serializationObject.reverseCulling;
        this.dontRenderWhenMaterialDepthWriteIsDisabled = serializationObject.dontRenderWhenMaterialDepthWriteIsDisabled;
        this.disableDepthPrePass = serializationObject.disableDepthPrePass ?? true;
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
