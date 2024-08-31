import { NodeRenderGraphBlock } from "../../nodeRenderGraphBlock";
import type { NodeRenderGraphConnectionPoint } from "../../nodeRenderGraphBlockConnectionPoint";
import { RegisterClass } from "../../../../Misc/typeStore";
import { NodeRenderGraphBlockConnectionPointTypes } from "../../Types/nodeRenderGraphTypes";
import { editableInPropertyPage, PropertyTypeForEdition } from "../../../../Decorators/nodeDecorator";
import type { Scene } from "../../../../scene";
import type { NodeRenderGraphBuildState } from "../../nodeRenderGraphBuildState";
import { FrameGraphGeometryRendererTask } from "../../../Tasks/Rendering/geometryRendererTask";
import type { FrameGraphObjectList, FrameGraphTextureId } from "../../../frameGraphTypes";
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
        this.registerOutput("geometryDepth", NodeRenderGraphBlockConnectionPointTypes.TextureDepth);
        this.registerOutput("geometryNormal", NodeRenderGraphBlockConnectionPointTypes.TextureNormal);
        this.registerOutput("geometryPosition", NodeRenderGraphBlockConnectionPointTypes.TexturePosition);
        this.registerOutput("geometryAlbedo", NodeRenderGraphBlockConnectionPointTypes.TextureAlbedo);
        this.registerOutput("geometryReflectivity", NodeRenderGraphBlockConnectionPointTypes.TextureReflectivity);
        this.registerOutput("geometryVelocity", NodeRenderGraphBlockConnectionPointTypes.TextureVelocity);

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
        return this._frameGraphTask.geometryTextureSize.width;
    }

    public set width(value: number) {
        this._frameGraphTask.geometryTextureSize.width = value;
    }

    @editableInPropertyPage("Texture height", PropertyTypeForEdition.Int, "PROPERTIES")
    public get height() {
        return this._frameGraphTask.geometryTextureSize.height;
    }

    public set height(value: number) {
        this._frameGraphTask.geometryTextureSize.height = value;
    }

    @editableInPropertyPage("Size is in percentage", PropertyTypeForEdition.Boolean, "PROPERTIES")
    public get sizeInPercentage() {
        return this._frameGraphTask.geometryTextureSizeIsPercentage;
    }

    public set sizeInPercentage(value: boolean) {
        this._frameGraphTask.geometryTextureSizeIsPercentage = value;
    }

    @editableInPropertyPage("Generate depth", PropertyTypeForEdition.Boolean, "GEOMETRY BUFFERS")
    public generateDepth = true;

    @editableInPropertyPage("Depth format", PropertyTypeForEdition.Int, "GEOMETRY BUFFERS")
    public depthFormat = Constants.TEXTUREFORMAT_RED;

    @editableInPropertyPage("Depth type", PropertyTypeForEdition.Int, "GEOMETRY BUFFERS")
    public depthType = Constants.TEXTURETYPE_FLOAT;

    @editableInPropertyPage("Generate normal", PropertyTypeForEdition.Boolean, "GEOMETRY BUFFERS")
    public generateNormal = false;

    @editableInPropertyPage("Generate position", PropertyTypeForEdition.Boolean, "GEOMETRY BUFFERS")
    public generatePosition = false;

    @editableInPropertyPage("Generate albedo", PropertyTypeForEdition.Boolean, "GEOMETRY BUFFERS")
    public generateAlbedo = false;

    @editableInPropertyPage("Generate reflectivity", PropertyTypeForEdition.Boolean, "GEOMETRY BUFFERS")
    public generateReflectivity = false;

    @editableInPropertyPage("Generate velocity", PropertyTypeForEdition.Boolean, "GEOMETRY BUFFERS")
    public generateVelocity = false;

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
     * Gets the geometry depth component
     */
    public get geometryDepth(): NodeRenderGraphConnectionPoint {
        return this._outputs[1];
    }

    /**
     * Gets the geometry normal component
     */
    public get geometryNormal(): NodeRenderGraphConnectionPoint {
        return this._outputs[2];
    }

    /**
     * Gets the geometry position component
     */
    public get geometryPosition(): NodeRenderGraphConnectionPoint {
        return this._outputs[3];
    }

    /**
     * Gets the geometry albedo component
     */
    public get geometryAlbedo(): NodeRenderGraphConnectionPoint {
        return this._outputs[4];
    }

    /**
     * Gets the geometry reflectivity component
     */
    public get geometryReflectivity(): NodeRenderGraphConnectionPoint {
        return this._outputs[5];
    }

    /**
     * Gets the geometry velocity component
     */
    public get geometryVelocity(): NodeRenderGraphConnectionPoint {
        return this._outputs[6];
    }

    protected override _buildBlock(state: NodeRenderGraphBuildState) {
        super._buildBlock(state);

        if (!this.generateDepth && !this.generateNormal && !this.generatePosition && !this.generateAlbedo && !this.generateReflectivity && !this.generateVelocity) {
            throw new Error("NodeRenderGraphGeometryRendererBlock: At least one geometry buffer must be generated");
        }

        this._frameGraphTask.name = this.name;

        this.outputDepth.value = this._frameGraphTask.outputDepthTextureReference;
        this.geometryDepth.value = this._frameGraphTask.geometryDepthTextureReference;
        this.geometryNormal.value = this._frameGraphTask.geometryNormalTextureReference;
        this.geometryPosition.value = this._frameGraphTask.geometryPositionTextureReference;
        this.geometryAlbedo.value = this._frameGraphTask.geometryAlbedoTextureReference;
        this.geometryReflectivity.value = this._frameGraphTask.geometryReflectivityTextureReference;
        this.geometryVelocity.value = this._frameGraphTask.geometryVelocityTextureReference;

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

        this._frameGraphTask.geometryTextureDescriptions = [];

        if (this.generateDepth) {
            this._frameGraphTask.geometryTextureDescriptions.push({
                textureFormat: this.depthFormat,
                textureType: this.depthType,
                type: Constants.PREPASS_DEPTH_TEXTURE_TYPE,
            });
        }

        state.frameGraph.addTask(this._frameGraphTask);
    }

    protected override _dumpPropertiesCode() {
        const codes: string[] = [];
        codes.push(`${this._codeVariableName}.depthTest = ${this.depthTest};`);
        codes.push(`${this._codeVariableName}.depthWrite = ${this.depthWrite};`);
        codes.push(`${this._codeVariableName}.camera = CAMERA; // TODO: set camera`);
        codes.push(`${this._codeVariableName}.objectList = OBJECT_LIST; // TODO: set object list`);
        codes.push(`${this._codeVariableName}.generateDepth = ${this.generateDepth};`);
        codes.push(`${this._codeVariableName}.depthFormat = ${this.depthFormat};`);
        codes.push(`${this._codeVariableName}.depthType = ${this.depthType};`);
        return super._dumpPropertiesCode() + codes.join("\n");
    }

    public override serialize(): any {
        const serializationObject = super.serialize();
        serializationObject.depthTest = this.depthTest;
        serializationObject.depthWrite = this.depthWrite;
        serializationObject.generateDepth = this.generateDepth;
        serializationObject.depthFormat = this.depthFormat;
        serializationObject.depthType = this.depthType;
        return serializationObject;
    }

    public override _deserialize(serializationObject: any) {
        super._deserialize(serializationObject);
        this.depthTest = serializationObject.depthTest;
        this.depthWrite = serializationObject.depthWrite;
        this.generateDepth = serializationObject.generateDepth;
        this.depthFormat = serializationObject.depthFormat;
        this.depthType = serializationObject.depthType;
    }
}

RegisterClass("BABYLON.NodeRenderGraphGeometryRendererBlock", NodeRenderGraphGeometryRendererBlock);
