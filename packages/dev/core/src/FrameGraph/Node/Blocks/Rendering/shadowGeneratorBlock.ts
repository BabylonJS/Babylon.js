// eslint-disable-next-line import/no-internal-modules
import type { NodeRenderGraphConnectionPoint, Scene, NodeRenderGraphBuildState, FrameGraph, IShadowLight, FrameGraphObjectList } from "core/index";
import { NodeRenderGraphBlock } from "../../nodeRenderGraphBlock";
import { RegisterClass } from "../../../../Misc/typeStore";
import { NodeRenderGraphBlockConnectionPointTypes } from "../../Types/nodeRenderGraphTypes";
import { FrameGraphShadowGeneratorTask } from "../../../Tasks/Rendering/shadowGeneratorTask";
import { editableInPropertyPage, PropertyTypeForEdition } from "../../../../Decorators/nodeDecorator";

/**
 * Block that generate shadows through a shadow generator
 */
export class NodeRenderGraphShadowGeneratorBlock extends NodeRenderGraphBlock {
    protected override _frameGraphTask: FrameGraphShadowGeneratorTask;

    /**
     * Gets the frame graph task associated with this block
     */
    public override get task() {
        return this._frameGraphTask;
    }

    /**
     * Create a new NodeRenderGraphShadowGeneratorBlock
     * @param name defines the block name
     * @param frameGraph defines the hosting frame graph
     * @param scene defines the hosting scene
     */
    public constructor(name: string, frameGraph: FrameGraph, scene: Scene) {
        super(name, frameGraph, scene);

        this.registerInput("light", NodeRenderGraphBlockConnectionPointTypes.ShadowLight);
        this.registerInput("objects", NodeRenderGraphBlockConnectionPointTypes.ObjectList);

        this.registerOutput("output", NodeRenderGraphBlockConnectionPointTypes.ShadowGenerator);

        this._frameGraphTask = new FrameGraphShadowGeneratorTask(this.name, frameGraph, scene);
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

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "NodeRenderGraphShadowGeneratorBlock";
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
     * Gets the output component
     */
    public get output(): NodeRenderGraphConnectionPoint {
        return this._outputs[0];
    }

    protected override _buildBlock(state: NodeRenderGraphBuildState) {
        super._buildBlock(state);

        const lightConnectedPoint = this.light.connectedPoint;
        if (lightConnectedPoint) {
            this._frameGraphTask.light = lightConnectedPoint.value as IShadowLight;
        }

        const objectsConnectedPoint = this.objects.connectedPoint;
        if (objectsConnectedPoint) {
            this._frameGraphTask.objectList = objectsConnectedPoint.value as FrameGraphObjectList;
        }
    }

    protected override _dumpPropertiesCode() {
        const codes: string[] = [];
        codes.push(`${this._codeVariableName}.mapSize = ${this.mapSize};`);
        codes.push(`${this._codeVariableName}.useFloat32TextureType = ${this.useFloat32TextureType};`);
        codes.push(`${this._codeVariableName}.useRedTextureFormat = ${this.useRedTextureFormat};`);
        return super._dumpPropertiesCode() + codes.join("\n");
    }

    public override serialize(): any {
        const serializationObject = super.serialize();
        serializationObject.mapSize = this.mapSize;
        serializationObject.useFloat32TextureType = this.useFloat32TextureType;
        serializationObject.useRedTextureFormat = this.useRedTextureFormat;
        return serializationObject;
    }

    public override _deserialize(serializationObject: any) {
        super._deserialize(serializationObject);
        this.mapSize = serializationObject.mapSize;
        this.useFloat32TextureType = serializationObject.useFloat32TextureType;
        this.useRedTextureFormat = serializationObject.useRedTextureFormat;
    }
}

RegisterClass("BABYLON.NodeRenderGraphShadowGeneratorBlock", NodeRenderGraphShadowGeneratorBlock);
