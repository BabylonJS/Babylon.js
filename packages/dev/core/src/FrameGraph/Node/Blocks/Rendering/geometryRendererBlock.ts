import { NodeRenderGraphBlock } from "../../nodeRenderGraphBlock";
import type { NodeRenderGraphConnectionPoint } from "../../nodeRenderGraphBlockConnectionPoint";
import { RegisterClass } from "../../../../Misc/typeStore";
import { NodeRenderGraphBlockConnectionPointTypes } from "../../Types/nodeRenderGraphTypes";
import { editableInPropertyPage, PropertyTypeForEdition } from "../../../../Decorators/nodeDecorator";
import type { Scene } from "../../../../scene";
import type { NodeRenderGraphBuildState } from "../../nodeRenderGraphBuildState";
import { FrameGraphGeometryRendererTask } from "../../../Tasks/Rendering/geometryRendererTask";
import type { FrameGraphTextureId } from "../../../frameGraphTypes";
import type { FrameGraphObjectList } from "../../../frameGraphObjectList";
import type { Camera } from "../../../../Cameras/camera";
import { Constants } from "core/Engines/constants";

/**
 * Block that render geometry of objects to a multi render target
 */
export class NodeRenderGraphGeometryRendererBlock extends NodeRenderGraphBlock {
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
     * @param scene defines the hosting scene
     */
    public constructor(name: string, scene: Scene) {
        super(name, scene);

        this.registerInput("depth", NodeRenderGraphBlockConnectionPointTypes.TextureBackBufferDepthStencilAttachment, true);
        this.registerInput("camera", NodeRenderGraphBlockConnectionPointTypes.Camera);
        this.registerInput("objects", NodeRenderGraphBlockConnectionPointTypes.ObjectList);

        this.registerOutput("outputDepth", NodeRenderGraphBlockConnectionPointTypes.BasedOnInput);
        this.registerOutput("geomViewDepth", NodeRenderGraphBlockConnectionPointTypes.TextureViewDepth);
        this.registerOutput("geomScreenDepth", NodeRenderGraphBlockConnectionPointTypes.TextureScreenDepth);
        this.registerOutput("geomViewNormal", NodeRenderGraphBlockConnectionPointTypes.TextureViewNormal);
        this.registerOutput("geomWorldNormal", NodeRenderGraphBlockConnectionPointTypes.TextureViewNormal);
        this.registerOutput("geomLocalPosition", NodeRenderGraphBlockConnectionPointTypes.TextureLocalPosition);
        this.registerOutput("geomWorldPosition", NodeRenderGraphBlockConnectionPointTypes.TextureWorldPosition);
        this.registerOutput("geomAlbedo", NodeRenderGraphBlockConnectionPointTypes.TextureAlbedo);
        this.registerOutput("geomReflectivity", NodeRenderGraphBlockConnectionPointTypes.TextureReflectivity);
        this.registerOutput("geomVelocity", NodeRenderGraphBlockConnectionPointTypes.TextureVelocity);
        this.registerOutput("geomLinearVelocity", NodeRenderGraphBlockConnectionPointTypes.TextureLinearVelocity);

        this.depth.addAcceptedConnectionPointTypes(NodeRenderGraphBlockConnectionPointTypes.TextureDepthStencilAttachment);

        this.outputDepth._typeConnectionSource = this.depth;

        this._frameGraphTask = new FrameGraphGeometryRendererTask(this.name, scene);
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

    @editableInPropertyPage("Texture width", PropertyTypeForEdition.Int, "PROPERTIES")
    public get width() {
        return this._frameGraphTask.size.width;
    }

    public set width(value: number) {
        this._frameGraphTask.size.width = value;
    }

    @editableInPropertyPage("Texture height", PropertyTypeForEdition.Int, "PROPERTIES")
    public get height() {
        return this._frameGraphTask.size.height;
    }

    public set height(value: number) {
        this._frameGraphTask.size.height = value;
    }

    @editableInPropertyPage("Size is in percentage", PropertyTypeForEdition.Boolean, "PROPERTIES")
    public get sizeInPercentage() {
        return this._frameGraphTask.sizeIsPercentage;
    }

    public set sizeInPercentage(value: boolean) {
        this._frameGraphTask.sizeIsPercentage = value;
    }

    @editableInPropertyPage("Samples", PropertyTypeForEdition.Int, "PROPERTIES", { min: 1, max: 8 })
    public get samples() {
        return this._frameGraphTask.samples;
    }

    public set samples(value: number) {
        this._frameGraphTask.samples = value;
    }

    // View depth
    @editableInPropertyPage("Generate view depth", PropertyTypeForEdition.Boolean, "GEOMETRY BUFFERS")
    public generateViewDepth = true;

    @editableInPropertyPage("View depth format", PropertyTypeForEdition.TextureFormat, "GEOMETRY BUFFERS")
    public viewDepthFormat = Constants.TEXTUREFORMAT_RED;

    @editableInPropertyPage("View depth type", PropertyTypeForEdition.TextureType, "GEOMETRY BUFFERS")
    public viewDepthType = Constants.TEXTURETYPE_FLOAT;

    // Screen depth
    @editableInPropertyPage("Generate screen depth", PropertyTypeForEdition.Boolean, "GEOMETRY BUFFERS")
    public generateScreenDepth = false;

    @editableInPropertyPage("Screen depth format", PropertyTypeForEdition.TextureFormat, "GEOMETRY BUFFERS")
    public screenDepthFormat = Constants.TEXTUREFORMAT_RED;

    @editableInPropertyPage("Screen depth type", PropertyTypeForEdition.TextureType, "GEOMETRY BUFFERS")
    public screenDepthType = Constants.TEXTURETYPE_FLOAT;

    // View normal
    @editableInPropertyPage("Generate view normal", PropertyTypeForEdition.Boolean, "GEOMETRY BUFFERS")
    public generateViewNormal = false;

    @editableInPropertyPage("View normal format", PropertyTypeForEdition.TextureFormat, "GEOMETRY BUFFERS")
    public viewNormalFormat = Constants.TEXTUREFORMAT_RGBA;

    @editableInPropertyPage("View normal type", PropertyTypeForEdition.TextureType, "GEOMETRY BUFFERS")
    public viewNormalType = Constants.TEXTURETYPE_UNSIGNED_BYTE;

    // World normal
    @editableInPropertyPage("Generate world normal", PropertyTypeForEdition.Boolean, "GEOMETRY BUFFERS")
    public generateWorldNormal = false;

    @editableInPropertyPage("World normal format", PropertyTypeForEdition.TextureFormat, "GEOMETRY BUFFERS")
    public worldNormalFormat = Constants.TEXTUREFORMAT_RGBA;

    @editableInPropertyPage("World normal type", PropertyTypeForEdition.TextureType, "GEOMETRY BUFFERS")
    public worldNormalType = Constants.TEXTURETYPE_UNSIGNED_BYTE;

    // Local position
    @editableInPropertyPage("Generate local position", PropertyTypeForEdition.Boolean, "GEOMETRY BUFFERS")
    public generateLocalPosition = false;

    @editableInPropertyPage("Local position format", PropertyTypeForEdition.TextureFormat, "GEOMETRY BUFFERS")
    public localPositionFormat = Constants.TEXTUREFORMAT_RGBA;

    @editableInPropertyPage("Local position type", PropertyTypeForEdition.TextureType, "GEOMETRY BUFFERS")
    public localPositionType = Constants.TEXTURETYPE_HALF_FLOAT;

    // World Position
    @editableInPropertyPage("Generate world position", PropertyTypeForEdition.Boolean, "GEOMETRY BUFFERS")
    public generateWorldPosition = false;

    @editableInPropertyPage("World position format", PropertyTypeForEdition.TextureFormat, "GEOMETRY BUFFERS")
    public worldPositionFormat = Constants.TEXTUREFORMAT_RGBA;

    @editableInPropertyPage("World position type", PropertyTypeForEdition.TextureType, "GEOMETRY BUFFERS")
    public worldPositionType = Constants.TEXTURETYPE_HALF_FLOAT;

    // Albedo
    @editableInPropertyPage("Generate albedo", PropertyTypeForEdition.Boolean, "GEOMETRY BUFFERS")
    public generateAlbedo = false;

    @editableInPropertyPage("Albedo format", PropertyTypeForEdition.TextureFormat, "GEOMETRY BUFFERS")
    public albedoFormat = Constants.TEXTUREFORMAT_RGBA;

    @editableInPropertyPage("Albedo type", PropertyTypeForEdition.TextureType, "GEOMETRY BUFFERS")
    public albedoType = Constants.TEXTURETYPE_UNSIGNED_BYTE;

    // Reflectivity
    @editableInPropertyPage("Generate reflectivity", PropertyTypeForEdition.Boolean, "GEOMETRY BUFFERS")
    public generateReflectivity = false;

    @editableInPropertyPage("Reflectivity format", PropertyTypeForEdition.TextureFormat, "GEOMETRY BUFFERS")
    public reflectivityFormat = Constants.TEXTUREFORMAT_RGBA;

    @editableInPropertyPage("Reflectivity type", PropertyTypeForEdition.TextureType, "GEOMETRY BUFFERS")
    public reflectivityType = Constants.TEXTURETYPE_UNSIGNED_BYTE;

    // Velocity
    @editableInPropertyPage("Generate velocity", PropertyTypeForEdition.Boolean, "GEOMETRY BUFFERS")
    public generateVelocity = false;

    @editableInPropertyPage("Velocity format", PropertyTypeForEdition.TextureFormat, "GEOMETRY BUFFERS")
    public velocityFormat = Constants.TEXTUREFORMAT_RGBA;

    @editableInPropertyPage("Velocity type", PropertyTypeForEdition.TextureType, "GEOMETRY BUFFERS")
    public velocityType = Constants.TEXTURETYPE_UNSIGNED_BYTE;

    // Linear velocity
    @editableInPropertyPage("Generate linear velocity", PropertyTypeForEdition.Boolean, "GEOMETRY BUFFERS")
    public generateLinearVelocity = false;

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
     * Gets the geometry screen depth component
     */
    public get geomScreenDepth(): NodeRenderGraphConnectionPoint {
        return this._outputs[2];
    }

    /**
     * Gets the geometry view normal component
     */
    public get geomViewNormal(): NodeRenderGraphConnectionPoint {
        return this._outputs[3];
    }

    /**
     * Gets the world geometry normal component
     */
    public get geomWorldNormal(): NodeRenderGraphConnectionPoint {
        return this._outputs[4];
    }

    /**
     * Gets the geometry local position component
     */
    public get geomLocalPosition(): NodeRenderGraphConnectionPoint {
        return this._outputs[5];
    }

    /**
     * Gets the geometry world position component
     */
    public get geomWorldPosition(): NodeRenderGraphConnectionPoint {
        return this._outputs[6];
    }

    /**
     * Gets the geometry albedo component
     */
    public get geomAlbedo(): NodeRenderGraphConnectionPoint {
        return this._outputs[7];
    }

    /**
     * Gets the geometry reflectivity component
     */
    public get geomReflectivity(): NodeRenderGraphConnectionPoint {
        return this._outputs[8];
    }

    /**
     * Gets the geometry velocity component
     */
    public get geomVelocity(): NodeRenderGraphConnectionPoint {
        return this._outputs[9];
    }

    /**
     * Gets the geometry linear velocity component
     */
    public get geomLinearVelocity(): NodeRenderGraphConnectionPoint {
        return this._outputs[10];
    }

    protected override _buildBlock(state: NodeRenderGraphBuildState) {
        super._buildBlock(state);

        if (
            !this.generateViewDepth &&
            !this.generateScreenDepth &&
            !this.generateViewNormal &&
            !this.generateWorldNormal &&
            !this.generateLocalPosition &&
            !this.generateWorldPosition &&
            !this.generateAlbedo &&
            !this.generateReflectivity &&
            !this.generateVelocity &&
            !this.generateLinearVelocity
        ) {
            throw new Error("NodeRenderGraphGeometryRendererBlock: At least one geometry buffer must be generated");
        }

        this._frameGraphTask.name = this.name;

        this.outputDepth.value = this._frameGraphTask.outputDepthTextureReference;
        this.geomViewDepth.value = this._frameGraphTask.geometryViewDepthTextureReference;
        this.geomScreenDepth.value = this._frameGraphTask.geometryScreenDepthTextureReference;
        this.geomViewNormal.value = this._frameGraphTask.geometryViewNormalTextureReference;
        this.geomWorldNormal.value = this._frameGraphTask.geometryWorldNormalTextureReference;
        this.geomLocalPosition.value = this._frameGraphTask.geometryLocalPositionTextureReference;
        this.geomWorldPosition.value = this._frameGraphTask.geometryWorldPositionTextureReference;
        this.geomAlbedo.value = this._frameGraphTask.geometryAlbedoTextureReference;
        this.geomReflectivity.value = this._frameGraphTask.geometryReflectivityTextureReference;
        this.geomVelocity.value = this._frameGraphTask.geometryVelocityTextureReference;
        this.geomLinearVelocity.value = this._frameGraphTask.geometryLinearVelocityTextureReference;

        const depthConnectedPoint = this.depth.connectedPoint;
        if (depthConnectedPoint) {
            this._frameGraphTask.depthTexture = depthConnectedPoint.value as FrameGraphTextureId;
        }

        const cameraConnectedPoint = this.camera.connectedPoint;
        if (cameraConnectedPoint) {
            this._frameGraphTask.camera = cameraConnectedPoint.value as Camera;
        }

        const objectsConnectedPoint = this.objects.connectedPoint;
        if (objectsConnectedPoint) {
            this._frameGraphTask.objectList = objectsConnectedPoint.value as FrameGraphObjectList;
        }

        this._frameGraphTask.textureDescriptions = [];

        const textureActivation = [
            this.generateViewDepth,
            this.generateScreenDepth,
            this.generateViewNormal,
            this.generateWorldNormal,
            this.generateLocalPosition,
            this.generateWorldPosition,
            this.generateAlbedo,
            this.generateReflectivity,
            this.generateVelocity,
            this.generateLinearVelocity,
        ];
        const textureFormats = [
            this.viewDepthFormat,
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

        state.frameGraph.addTask(this._frameGraphTask);
    }

    protected override _dumpPropertiesCode() {
        const codes: string[] = [];
        codes.push(`${this._codeVariableName}.depthTest = ${this.depthTest};`);
        codes.push(`${this._codeVariableName}.depthWrite = ${this.depthWrite};`);
        codes.push(`${this._codeVariableName}.samples = ${this.samples};`);
        codes.push(`${this._codeVariableName}.generateViewDepth = ${this.generateViewDepth};`);
        codes.push(`${this._codeVariableName}.viewDepthFormat = ${this.viewDepthFormat};`);
        codes.push(`${this._codeVariableName}.viewDepthType = ${this.viewDepthType};`);
        codes.push(`${this._codeVariableName}.generateScreenDepth = ${this.generateViewDepth};`);
        codes.push(`${this._codeVariableName}.screenDepthFormat = ${this.screenDepthFormat};`);
        codes.push(`${this._codeVariableName}.screenDepthType = ${this.screenDepthType};`);
        codes.push(`${this._codeVariableName}.generateLocalPosition = ${this.generateLocalPosition};`);
        codes.push(`${this._codeVariableName}.localPositionFormat = ${this.localPositionFormat};`);
        codes.push(`${this._codeVariableName}.localPositionType = ${this.localPositionType};`);
        codes.push(`${this._codeVariableName}.generateWorldPosition = ${this.generateWorldPosition};`);
        codes.push(`${this._codeVariableName}.worldPositionFormat = ${this.worldPositionFormat};`);
        codes.push(`${this._codeVariableName}.worldPositionType = ${this.worldPositionType};`);
        codes.push(`${this._codeVariableName}.generateViewNormal = ${this.generateViewNormal};`);
        codes.push(`${this._codeVariableName}.viewNormalFormat = ${this.viewNormalFormat};`);
        codes.push(`${this._codeVariableName}.viewNormalType = ${this.viewNormalType};`);
        codes.push(`${this._codeVariableName}.generateWorldNormal = ${this.generateWorldNormal};`);
        codes.push(`${this._codeVariableName}.worldNormalFormat = ${this.worldNormalFormat};`);
        codes.push(`${this._codeVariableName}.worldNormalType = ${this.worldNormalType};`);
        codes.push(`${this._codeVariableName}.worldGgenerateAlbedo = ${this.generateAlbedo};`);
        codes.push(`${this._codeVariableName}.albedoFormat = ${this.albedoFormat};`);
        codes.push(`${this._codeVariableName}.albedoType = ${this.albedoType};`);
        codes.push(`${this._codeVariableName}.generateReflectivity = ${this.generateReflectivity};`);
        codes.push(`${this._codeVariableName}.reflectivityFormat = ${this.reflectivityFormat};`);
        codes.push(`${this._codeVariableName}.reflectivityType = ${this.reflectivityType};`);
        codes.push(`${this._codeVariableName}.generateVelocity = ${this.generateVelocity};`);
        codes.push(`${this._codeVariableName}.velocityFormat = ${this.velocityFormat};`);
        codes.push(`${this._codeVariableName}.velocityType = ${this.velocityType};`);
        codes.push(`${this._codeVariableName}.generateLinearVelocity = ${this.generateLinearVelocity};`);
        codes.push(`${this._codeVariableName}.linearVelocityFormat = ${this.linearVelocityFormat};`);
        codes.push(`${this._codeVariableName}.linearVelocityType = ${this.linearVelocityType};`);
        return super._dumpPropertiesCode() + codes.join("\n");
    }

    public override serialize(): any {
        const serializationObject = super.serialize();
        serializationObject.depthTest = this.depthTest;
        serializationObject.depthWrite = this.depthWrite;
        serializationObject.samples = this.samples;
        serializationObject.generateViewDepth = this.generateViewDepth;
        serializationObject.viewDepthFormat = this.viewDepthFormat;
        serializationObject.viewDepthType = this.viewDepthType;
        serializationObject.generateScreenDepth = this.generateScreenDepth;
        serializationObject.screenDepthFormat = this.screenDepthFormat;
        serializationObject.screenDepthType = this.screenDepthType;
        serializationObject.generateLocalPosition = this.generateLocalPosition;
        serializationObject.localPositionFormat = this.localPositionFormat;
        serializationObject.localPositionType = this.localPositionType;
        serializationObject.generateWorldPosition = this.generateWorldPosition;
        serializationObject.worldPositionFormat = this.worldPositionFormat;
        serializationObject.worldPositionType = this.worldPositionType;
        serializationObject.generateViewNormal = this.generateViewNormal;
        serializationObject.viewNormalFormat = this.viewNormalFormat;
        serializationObject.viewNormalType = this.viewNormalType;
        serializationObject.generateWorldNormal = this.generateWorldNormal;
        serializationObject.worldNormalFormat = this.worldNormalFormat;
        serializationObject.worldNormalType = this.worldNormalType;
        serializationObject.generateAlbedo = this.generateAlbedo;
        serializationObject.albedoFormat = this.albedoFormat;
        serializationObject.albedoType = this.albedoType;
        serializationObject.generateReflectivity = this.generateReflectivity;
        serializationObject.reflectivityFormat = this.reflectivityFormat;
        serializationObject.reflectivityType = this.reflectivityType;
        serializationObject.generateVelocity = this.generateVelocity;
        serializationObject.velocityFormat = this.velocityFormat;
        serializationObject.velocityType = this.velocityType;
        serializationObject.generateLinearVelocity = this.generateLinearVelocity;
        serializationObject.linearVelocityFormat = this.linearVelocityFormat;
        serializationObject.linearVelocityType = this.linearVelocityType;
        return serializationObject;
    }

    public override _deserialize(serializationObject: any) {
        super._deserialize(serializationObject);
        this.depthTest = serializationObject.depthTest;
        this.depthWrite = serializationObject.depthWrite;
        this.samples = serializationObject.samples;
        this.generateViewDepth = serializationObject.generateViewDepth;
        this.viewDepthFormat = serializationObject.viewDepthFormat;
        this.viewDepthType = serializationObject.viewDepthType;
        this.generateScreenDepth = serializationObject.generateScreenDepth;
        this.screenDepthFormat = serializationObject.screenDepthFormat;
        this.screenDepthType = serializationObject.screenDepthType;
        this.generateLocalPosition = serializationObject.generateLocalPosition;
        this.localPositionFormat = serializationObject.localPositionFormat;
        this.localPositionType = serializationObject.localPositionType;
        this.generateWorldPosition = serializationObject.generateWorldPosition;
        this.worldPositionFormat = serializationObject.worldPositionFormat;
        this.worldPositionType = serializationObject.worldPositionType;
        this.generateViewNormal = serializationObject.generateViewNormal;
        this.viewNormalFormat = serializationObject.viewNormalFormat;
        this.viewNormalType = serializationObject.viewNormalType;
        this.generateWorldNormal = serializationObject.generateWorldNormal;
        this.worldNormalFormat = serializationObject.worldNormalFormat;
        this.worldNormalType = serializationObject.worldNormalType;
        this.generateAlbedo = serializationObject.generateAlbedo;
        this.albedoFormat = serializationObject.albedoFormat;
        this.albedoType = serializationObject.albedoType;
        this.generateReflectivity = serializationObject.generateReflectivity;
        this.reflectivityFormat = serializationObject.reflectivityFormat;
        this.reflectivityType = serializationObject.reflectivityType;
        this.generateVelocity = serializationObject.generateVelocity;
        this.velocityFormat = serializationObject.velocityFormat;
        this.velocityType = serializationObject.velocityType;
        this.generateLinearVelocity = serializationObject.generateLinearVelocity;
        this.linearVelocityFormat = serializationObject.linearVelocityFormat;
        this.linearVelocityType = serializationObject.linearVelocityType;
    }
}

RegisterClass("BABYLON.NodeRenderGraphGeometryRendererBlock", NodeRenderGraphGeometryRendererBlock);
