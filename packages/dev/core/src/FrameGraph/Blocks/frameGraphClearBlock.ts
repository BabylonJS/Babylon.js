import { FrameGraphBlock } from "../frameGraphBlock";
import type { FrameGraphConnectionPoint } from "../frameGraphBlockConnectionPoint";
import { RegisterClass } from "../../Misc/typeStore";
import { FrameGraphBlockConnectionPointTypes } from "../Enums/frameGraphBlockConnectionPointTypes";
import type { FrameGraphBuilder } from "../frameGraphBuilder";
import { Color4 } from "core/Maths/math.color";
import { editableInPropertyPage, PropertyTypeForEdition } from "../../Decorators/nodeDecorator";

/**
 * Block used to clear a texture
 */
export class FrameGraphClearBlock extends FrameGraphBlock {
    /**
     * Create a new FrameGraphClearBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this.registerInput("texture", FrameGraphBlockConnectionPointTypes.Texture);
        this.registerOutput("output", FrameGraphBlockConnectionPointTypes.BasedOnInput);

        this.texture.addAcceptedConnectionPointTypes(FrameGraphBlockConnectionPointTypes.TextureAll);
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
        return "FrameGraphClearBlock";
    }
    /**
     * Gets the texture input component
     */
    public get texture(): FrameGraphConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the output component
     */
    public get output(): FrameGraphConnectionPoint {
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
        const isDepthStencilAttachment = inputTexture.type === FrameGraphBlockConnectionPointTypes.TextureDepthStencilAttachment || isBackBufferDepthStencilAttachment;

        if (isBackBuffer || isBackBufferDepthStencilAttachment) {
            builder.addExecuteFunction(() => {
                builder.engine.clear(this.color, !isDepthStencilAttachment, isDepthStencilAttachment, isDepthStencilAttachment);
            });
        } else {
            const rtWrapper = inputTexture.getValueAsRenderTargetWrapper();
            if (rtWrapper) {
                builder.addExecuteFunction(() => {
                    builder.bindRenderTargetWrapper(rtWrapper);
                    builder.engine.clear(this.color, !isDepthStencilAttachment, isDepthStencilAttachment, isDepthStencilAttachment);
                    builder.bindRenderTargetWrapper(null);
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

RegisterClass("BABYLON.FrameGraphClearBlock", FrameGraphClearBlock);
