import { NodeRenderGraphBlock } from "../nodeRenderGraphBlock";
import type { NodeRenderGraphConnectionPoint } from "../nodeRenderGraphBlockConnectionPoint";
import { RegisterClass } from "../../../Misc/typeStore";
import { NodeRenderGraphBlockConnectionPointTypes } from "../Enums/nodeRenderGraphBlockConnectionPointTypes";
import type { FrameGraphBuilder } from "../../frameGraphBuilder";
import { Color4 } from "../../../Maths/math.color";
import { editableInPropertyPage, PropertyTypeForEdition } from "../../../Decorators/nodeDecorator";
import type { AbstractEngine } from "../../../Engines/abstractEngine";

/**
 * Block used to clear a texture
 */
export class ClearBlock extends NodeRenderGraphBlock {
    /**
     * Create a new NodeRenderGraphClearBlock
     * @param name defines the block name
     * @param engine defines the hosting engine
     */
    public constructor(name: string, engine: AbstractEngine) {
        super(name, engine);

        this.registerInput("texture", NodeRenderGraphBlockConnectionPointTypes.Texture);
        this.registerOutput("output", NodeRenderGraphBlockConnectionPointTypes.BasedOnInput);

        this.texture.addAcceptedConnectionPointTypes(NodeRenderGraphBlockConnectionPointTypes.TextureAll);
        this.output._typeConnectionSource = this.texture;
    }

    /** Gets or sets the clear color */
    @editableInPropertyPage("Color", PropertyTypeForEdition.Color4, "PROPERTIES")
    public color = new Color4(0.2, 0.2, 0.3, 1);

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "ClearBlock";
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

    protected override _buildBlock(builder: FrameGraphBuilder) {
        super._buildBlock(builder);

        this._propagateInputValueToOutput(this.texture, this.output);

        const inputTexture = this.texture.connectedPoint?.value;
        if (!inputTexture || !inputTexture.isAnyTexture()) {
            return;
        }

        const isBackBuffer = inputTexture.isBackBuffer();
        const isBackBufferDepthStencilAttachment = inputTexture.isBackBufferDepthStencilAttachment();
        const isDepthStencilAttachment = inputTexture.type === NodeRenderGraphBlockConnectionPointTypes.TextureDepthStencilAttachment || isBackBufferDepthStencilAttachment;

        if (isBackBuffer || isBackBufferDepthStencilAttachment) {
            builder.addExecuteFunction(() => {
                builder.clear(this.color, !isDepthStencilAttachment, isDepthStencilAttachment, isDepthStencilAttachment);
            });
        } else {
            const rtWrapper = inputTexture.getValueAsRenderTargetWrapper();
            if (rtWrapper) {
                builder.addExecuteFunction(() => {
                    builder.bindRenderTarget(rtWrapper);
                    builder.clear(this.color, !isDepthStencilAttachment, isDepthStencilAttachment, isDepthStencilAttachment);
                    builder.bindRenderTarget(null);
                });
            }
        }
    }

    protected override _dumpPropertiesCode() {
        const codes: string[] = [];
        codes.push(`${this._codeVariableName}.color = new Color4(${this.color.r}, ${this.color.g}, ${this.color.b}, ${this.color.a});`);
        return super._dumpPropertiesCode() + codes.join("\n");
    }

    public override serialize(): any {
        const serializationObject = super.serialize();
        serializationObject.color = this.color.asArray();
        return serializationObject;
    }

    public override _deserialize(serializationObject: any) {
        super._deserialize(serializationObject);
        this.color = Color4.FromArray(serializationObject.color);
    }
}

RegisterClass("BABYLON.ClearBlock", ClearBlock);
