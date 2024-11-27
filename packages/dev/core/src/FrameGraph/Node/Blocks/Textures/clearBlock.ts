// eslint-disable-next-line import/no-internal-modules
import type { NodeRenderGraphConnectionPoint, Scene, FrameGraphTextureHandle, FrameGraph, NodeRenderGraphBuildState } from "core/index";
import { NodeRenderGraphBlock } from "../../nodeRenderGraphBlock";
import { RegisterClass } from "../../../../Misc/typeStore";
import { NodeRenderGraphBlockConnectionPointTypes } from "../../Types/nodeRenderGraphTypes";
import { Color4 } from "../../../../Maths/math.color";
import { editableInPropertyPage, PropertyTypeForEdition } from "../../../../Decorators/nodeDecorator";
import { FrameGraphClearTextureTask } from "../../../Tasks/Texture/clearTextureTask";

/**
 * Block used to clear a texture
 */
export class NodeRenderGraphClearBlock extends NodeRenderGraphBlock {
    protected override _frameGraphTask: FrameGraphClearTextureTask;

    /**
     * Gets the frame graph task associated with this block
     */
    public override get task() {
        return this._frameGraphTask;
    }

    /**
     * Create a new NodeRenderGraphClearBlock
     * @param name defines the block name
     * @param frameGraph defines the hosting frame graph
     * @param scene defines the hosting scene
     */
    public constructor(name: string, frameGraph: FrameGraph, scene: Scene) {
        super(name, frameGraph, scene);

        this.registerInput("texture", NodeRenderGraphBlockConnectionPointTypes.Texture, true);
        this.registerInput("depth", NodeRenderGraphBlockConnectionPointTypes.TextureBackBufferDepthStencilAttachment, true);

        this.registerOutput("output", NodeRenderGraphBlockConnectionPointTypes.BasedOnInput);
        this.registerOutput("outputDepth", NodeRenderGraphBlockConnectionPointTypes.BasedOnInput);

        this.texture.addAcceptedConnectionPointTypes(NodeRenderGraphBlockConnectionPointTypes.TextureAll);
        this.depth.addAcceptedConnectionPointTypes(NodeRenderGraphBlockConnectionPointTypes.TextureDepthStencilAttachment);

        this.output._typeConnectionSource = this.texture;
        this.outputDepth._typeConnectionSource = this.depth;

        this._frameGraphTask = new FrameGraphClearTextureTask(name, frameGraph);
    }

    /** Gets or sets the clear color */
    @editableInPropertyPage("Color", PropertyTypeForEdition.Color4)
    public get color(): Color4 {
        return this._frameGraphTask.color;
    }

    public set color(value: Color4) {
        this._frameGraphTask.color = value;
    }

    /** Gets or sets a boolean indicating whether the color part of the texture should be cleared. */
    @editableInPropertyPage("Clear color", PropertyTypeForEdition.Boolean, undefined, { embedded: true })
    public get clearColor(): boolean {
        return !!this._frameGraphTask.clearColor;
    }

    public set clearColor(value: boolean) {
        this._frameGraphTask.clearColor = value;
    }

    /** Gets or sets a boolean indicating whether the depth part of the texture should be cleared. */
    @editableInPropertyPage("Clear depth", PropertyTypeForEdition.Boolean, undefined, { embedded: true })
    public get clearDepth(): boolean {
        return !!this._frameGraphTask.clearDepth;
    }

    public set clearDepth(value: boolean) {
        this._frameGraphTask.clearDepth = value;
    }

    /** Gets or sets a boolean indicating whether the stencil part of the texture should be cleared. */
    @editableInPropertyPage("Clear stencil", PropertyTypeForEdition.Boolean, undefined, { embedded: true })
    public get clearStencil(): boolean {
        return !!this._frameGraphTask.clearStencil;
    }

    public set clearStencil(value: boolean) {
        this._frameGraphTask.clearStencil = value;
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "NodeRenderGraphClearBlock";
    }

    /**
     * Gets the texture input component
     */
    public get texture(): NodeRenderGraphConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the depth texture input component
     */
    public get depth(): NodeRenderGraphConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the output component
     */
    public get output(): NodeRenderGraphConnectionPoint {
        return this._outputs[0];
    }

    /**
     * Gets the output depth component
     */
    public get outputDepth(): NodeRenderGraphConnectionPoint {
        return this._outputs[1];
    }

    protected override _buildBlock(state: NodeRenderGraphBuildState) {
        super._buildBlock(state);

        this._frameGraphTask.name = this.name;

        this._propagateInputValueToOutput(this.texture, this.output);
        this._propagateInputValueToOutput(this.depth, this.outputDepth);

        const textureConnectedPoint = this.texture.connectedPoint;
        if (textureConnectedPoint) {
            this._frameGraphTask.destinationTexture = textureConnectedPoint.value as FrameGraphTextureHandle;
        }

        const depthConnectedPoint = this.depth.connectedPoint;
        if (depthConnectedPoint) {
            this._frameGraphTask.depthTexture = depthConnectedPoint.value as FrameGraphTextureHandle;
        }
    }

    protected override _dumpPropertiesCode() {
        const codes: string[] = [];
        codes.push(`${this._codeVariableName}.color = new BABYLON.Color4(${this.color.r}, ${this.color.g}, ${this.color.b}, ${this.color.a});`);
        codes.push(`${this._codeVariableName}.clearColor = ${this.clearColor};`);
        codes.push(`${this._codeVariableName}.clearDepth = ${this.clearDepth};`);
        codes.push(`${this._codeVariableName}.clearStencil = ${this.clearStencil};`);
        return super._dumpPropertiesCode() + codes.join("\n");
    }

    public override serialize(): any {
        const serializationObject = super.serialize();
        serializationObject.color = this.color.asArray();
        serializationObject.clearColor = this.clearColor;
        serializationObject.clearDepth = this.clearDepth;
        serializationObject.clearStencil = this.clearStencil;
        return serializationObject;
    }

    public override _deserialize(serializationObject: any) {
        super._deserialize(serializationObject);
        this.color = Color4.FromArray(serializationObject.color);
        this.clearColor = serializationObject.clearColor;
        this.clearDepth = serializationObject.clearDepth;
        this.clearStencil = serializationObject.clearStencil;
    }
}

RegisterClass("BABYLON.NodeRenderGraphClearBlock", NodeRenderGraphClearBlock);
