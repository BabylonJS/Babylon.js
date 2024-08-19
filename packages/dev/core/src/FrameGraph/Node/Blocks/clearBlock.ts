import { NodeRenderGraphBlock } from "../nodeRenderGraphBlock";
import type { NodeRenderGraphConnectionPoint } from "../nodeRenderGraphBlockConnectionPoint";
import { RegisterClass } from "../../../Misc/typeStore";
import { NodeRenderGraphBlockConnectionPointTypes, NodeRenderGraphBlockConnectionPointValueTypes } from "../Types/nodeRenderGraphBlockConnectionPointTypes";
import { Color4 } from "../../../Maths/math.color";
import { editableInPropertyPage, PropertyTypeForEdition } from "../../../Decorators/nodeDecorator";
import type { AbstractEngine } from "../../../Engines/abstractEngine";
import type { NodeRenderGraphBuildState } from "../nodeRenderGraphBuildState";
import { FrameGraphClearTextureTask } from "../../../FrameGraph/Tasks/clearTextureTask";

/**
 * Block used to clear a texture
 */
export class RenderGraphClearBlock extends NodeRenderGraphBlock {
    protected override _frameGraphTask: FrameGraphClearTextureTask;

    /**
     * Create a new RenderGraphClearBlock
     * @param name defines the block name
     * @param engine defines the hosting engine
     */
    public constructor(name: string, engine: AbstractEngine) {
        super(name, engine);

        this.registerInput("texture", NodeRenderGraphBlockConnectionPointTypes.Texture);
        this.registerOutput("output", NodeRenderGraphBlockConnectionPointTypes.BasedOnInput);

        this.texture.addAcceptedConnectionPointTypes(NodeRenderGraphBlockConnectionPointTypes.TextureAll);
        this.output._typeConnectionSource = this.texture;

        this._frameGraphTask = new FrameGraphClearTextureTask(name);
    }

    /** Gets or sets the clear color */
    @editableInPropertyPage("Color", PropertyTypeForEdition.Color4, "PROPERTIES")
    public get color(): Color4 {
        return this._frameGraphTask.color;
    }

    public set color(value: Color4) {
        this._frameGraphTask.color = value;
    }

    /** Gets or sets a boolean indicating whether the color part of the texture should be cleared. */
    @editableInPropertyPage("Clear color", PropertyTypeForEdition.Boolean, "PROPERTIES")
    public get clearColor(): boolean {
        return !!this._frameGraphTask.clearColor;
    }

    public set clearColor(value: boolean) {
        this._frameGraphTask.clearColor = value;
    }

    /** Gets or sets a boolean indicating whether the depth part of the texture should be cleared. */
    @editableInPropertyPage("Clear depth", PropertyTypeForEdition.Boolean, "PROPERTIES")
    public get clearDepth(): boolean {
        return !!this._frameGraphTask.clearDepth;
    }

    public set clearDepth(value: boolean) {
        this._frameGraphTask.clearDepth = value;
    }

    /** Gets or sets a boolean indicating whether the stencil part of the texture should be cleared. */
    @editableInPropertyPage("Clear stencil", PropertyTypeForEdition.Boolean, "PROPERTIES")
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
        return "RenderGraphClearBlock";
    }
    /**
     * Gets the texture input component
     */
    public get texture(): NodeRenderGraphConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the output component
     */
    public get output(): NodeRenderGraphConnectionPoint {
        return this._outputs[0];
    }

    protected override _buildBlock(state: NodeRenderGraphBuildState) {
        super._buildBlock(state);

        this._frameGraphTask.name = this.name;

        this._propagateInputValueToOutput(this.texture, this.output);

        const textureConnectedPoint = this.texture.connectedPoint;
        if (textureConnectedPoint && textureConnectedPoint.valueType === NodeRenderGraphBlockConnectionPointValueTypes.Texture) {
            this._frameGraphTask.destinationTexture = textureConnectedPoint.value!;
        }

        state.frameGraph.addTask(this._frameGraphTask);
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

RegisterClass("BABYLON.RenderGraphClearBlock", RenderGraphClearBlock);
